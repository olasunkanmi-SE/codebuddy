import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { FileService } from "./file-service";

/**
 * Supported rule file locations in priority order
 */
const RULE_FILE_LOCATIONS = [
  ".codebuddy/rules.md",
  ".codebuddy/rules/index.md",
  ".codebuddyrules",
  "CODEBUDDY.md",
];

/**
 * Configuration keys for project rules
 */
const CONFIG_KEYS = {
  enabled: "codebuddy.rules.enabled",
  maxTokens: "codebuddy.rules.maxTokens",
  showIndicator: "codebuddy.rules.showIndicator",
} as const;

/**
 * Default configuration values
 */
const DEFAULTS = {
  enabled: true,
  maxTokens: 2000,
  showIndicator: true,
  charsPerToken: 4,
} as const;

export interface IProjectRules {
  content: string;
  filePath: string;
  tokenCount: number;
  lastModified: Date;
  truncated: boolean;
}

export interface IProjectRulesStatus {
  hasRules: boolean;
  tokenCount: number;
  filePath?: string;
  truncated?: boolean;
}

/**
 * ProjectRulesService manages project-specific rules that are injected into AI prompts.
 * Rules are loaded from .codebuddy/rules.md or similar files in the workspace.
 *
 * Features:
 * - Auto-loads rules on workspace open
 * - Watches for file changes and reloads
 * - Respects token budget limits
 * - Merges multiple rule files
 * - Notifies webview of status changes
 */
export class ProjectRulesService implements vscode.Disposable {
  private static instance: ProjectRulesService | undefined;
  private readonly logger: Logger;
  private readonly fileService: FileService;
  private readonly disposables: vscode.Disposable[] = [];

  private cachedRules: IProjectRules | undefined;
  private statusCallback: ((status: IProjectRulesStatus) => void) | undefined;

  private constructor() {
    this.logger = Logger.initialize(ProjectRulesService.name, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: false,
    });
    this.fileService = new FileService();
  }

  /**
   * Get singleton instance of ProjectRulesService
   */
  public static getInstance(): ProjectRulesService {
    if (!ProjectRulesService.instance) {
      ProjectRulesService.instance = new ProjectRulesService();
    }
    return ProjectRulesService.instance;
  }

  /**
   * Initialize the service - load rules and set up file watchers
   */
  public async initialize(): Promise<void> {
    this.logger.info("Initializing ProjectRulesService");

    // Load rules on startup
    await this.loadRules();

    // Set up file watchers for rule files
    this.setupFileWatchers();

    // Watch for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration("codebuddy.rules") ||
          e.affectsConfiguration("rules.customRules") ||
          e.affectsConfiguration("rules.customSystemPrompt")
        ) {
          this.loadRules();
        }
      }),
    );

    this.logger.info("ProjectRulesService initialized");
  }

  /**
   * Load rules from file system and settings
   */
  public async loadRules(): Promise<void> {
    if (!this.isEnabled()) {
      this.cachedRules = undefined;
      this.notifyStatusChange();
      return;
    }

    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      this.logger.warn("No workspace root found");
      this.cachedRules = undefined;
      this.notifyStatusChange();
      return;
    }

    try {
      // Try to find and load rule file
      const ruleFile = await this.findRuleFile(workspaceRoot);

      if (ruleFile) {
        const content = await this.readRuleFile(ruleFile);
        const { processedContent, truncated } = this.processContent(content);

        this.cachedRules = {
          content: processedContent,
          filePath: ruleFile,
          tokenCount: this.estimateTokens(processedContent),
          lastModified: new Date(),
          truncated,
        };

        this.logger.info(
          `Loaded project rules from ${ruleFile} (${this.cachedRules.tokenCount} tokens)`,
        );

        if (truncated) {
          vscode.window.showWarningMessage(
            `Project rules exceeded token limit and were truncated. Consider reducing rules content.`,
          );
        }
      } else {
        this.cachedRules = undefined;
        this.logger.info("No project rules file found");
      }

      // Merge with settings-based rules
      await this.mergeSettingsRules();

      this.notifyStatusChange();
    } catch (error: any) {
      this.logger.error("Error loading project rules:", error);
      this.cachedRules = undefined;
      this.notifyStatusChange();
    }
  }

  /**
   * Get the current rules content for prompt injection
   */
  public getRules(): string | undefined {
    if (!this.isEnabled() || !this.cachedRules) {
      return undefined;
    }
    return this.cachedRules.content;
  }

  /**
   * Check if project rules are loaded
   */
  public hasRules(): boolean {
    return this.isEnabled() && !!this.cachedRules?.content;
  }

  /**
   * Get current status for UI display
   */
  public getStatus(): IProjectRulesStatus {
    return {
      hasRules: this.hasRules(),
      tokenCount: this.cachedRules?.tokenCount ?? 0,
      filePath: this.cachedRules?.filePath,
      truncated: this.cachedRules?.truncated,
    };
  }

  /**
   * Get the rules file path (creates if doesn't exist using scaffold command)
   */
  public getRulesFilePath(): string | undefined {
    return this.cachedRules?.filePath;
  }

  /**
   * Set callback for status changes (for webview notification)
   */
  public onStatusChange(
    callback: (status: IProjectRulesStatus) => void,
  ): vscode.Disposable {
    this.statusCallback = callback;
    // Immediately notify current status
    callback(this.getStatus());
    return {
      dispose: () => {
        this.statusCallback = undefined;
      },
    };
  }

  /**
   * Create a new rules file with template content
   */
  public async createRulesFile(): Promise<string | undefined> {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      vscode.window.showErrorMessage("No workspace folder open");
      return undefined;
    }

    const codeBuddyDir = path.join(workspaceRoot, ".codebuddy");
    const rulesPath = path.join(codeBuddyDir, "rules.md");

    // Check if file already exists
    if (fs.existsSync(rulesPath)) {
      const openExisting = await vscode.window.showQuickPick(
        ["Open existing", "Overwrite"],
        {
          placeHolder: "Rules file already exists. What would you like to do?",
        },
      );

      if (openExisting === "Open existing") {
        await this.openRulesFile(rulesPath);
        return rulesPath;
      } else if (!openExisting) {
        return undefined;
      }
    }

    // Ensure .codebuddy directory exists
    if (!fs.existsSync(codeBuddyDir)) {
      fs.mkdirSync(codeBuddyDir, { recursive: true });
    }

    // Write template content
    const templateContent = this.getTemplateContent();
    fs.writeFileSync(rulesPath, templateContent, "utf-8");

    this.logger.info(`Created project rules file at ${rulesPath}`);

    // Open the file
    await this.openRulesFile(rulesPath);

    // Reload rules
    await this.loadRules();

    vscode.window.showInformationMessage(
      "Project rules file created! Edit it to customize AI behavior.",
    );

    return rulesPath;
  }

  /**
   * Open the rules file in editor
   */
  public async openRulesFile(filePath?: string): Promise<void> {
    const pathToOpen = filePath ?? this.cachedRules?.filePath;

    if (!pathToOpen) {
      // No rules file exists, offer to create one
      const create = await vscode.window.showInformationMessage(
        "No project rules file found. Would you like to create one?",
        "Create",
        "Cancel",
      );

      if (create === "Create") {
        await this.createRulesFile();
      }
      return;
    }

    try {
      const doc = await vscode.workspace.openTextDocument(pathToOpen);
      await vscode.window.showTextDocument(doc);
    } catch (error: any) {
      this.logger.error(`Failed to open rules file: ${error.message}`);
      vscode.window.showErrorMessage(
        `Failed to open rules file: ${error.message}`,
      );
    }
  }

  /**
   * Force reload rules
   */
  public async reloadRules(): Promise<void> {
    await this.loadRules();
    vscode.window.showInformationMessage(
      this.hasRules()
        ? `Project rules reloaded (${this.cachedRules?.tokenCount} tokens)`
        : "No project rules found",
    );
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
    ProjectRulesService.instance = undefined;
  }

  // ================== Private Methods ==================

  private isEnabled(): boolean {
    return vscode.workspace
      .getConfiguration()
      .get<boolean>(CONFIG_KEYS.enabled, DEFAULTS.enabled);
  }

  private getMaxTokens(): number {
    return vscode.workspace
      .getConfiguration()
      .get<number>(CONFIG_KEYS.maxTokens, DEFAULTS.maxTokens);
  }

  private getWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  private async findRuleFile(
    workspaceRoot: string,
  ): Promise<string | undefined> {
    for (const location of RULE_FILE_LOCATIONS) {
      const fullPath = path.join(workspaceRoot, location);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    // Also check for multiple rule files in .codebuddy/rules/
    const rulesDir = path.join(workspaceRoot, ".codebuddy", "rules");
    if (fs.existsSync(rulesDir) && fs.statSync(rulesDir).isDirectory()) {
      const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith(".md"));
      if (files.length > 0) {
        return rulesDir; // Return directory path to indicate multiple files
      }
    }

    return undefined;
  }

  private async readRuleFile(filePath: string): Promise<string> {
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Read all .md files in directory and concatenate
      const files = fs
        .readdirSync(filePath)
        .filter((f) => f.endsWith(".md"))
        .sort();
      const contents: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(path.join(filePath, file), "utf-8");
        contents.push(`<!-- From: ${file} -->\n${content}`);
      }

      return contents.join("\n\n---\n\n");
    } else {
      return fs.readFileSync(filePath, "utf-8");
    }
  }

  private processContent(content: string): {
    processedContent: string;
    truncated: boolean;
  } {
    const maxTokens = this.getMaxTokens();
    const maxChars = maxTokens * DEFAULTS.charsPerToken;

    if (content.length <= maxChars) {
      return { processedContent: content, truncated: false };
    }

    // Truncate at a sensible boundary (end of line)
    let truncatedContent = content.substring(0, maxChars);
    const lastNewline = truncatedContent.lastIndexOf("\n");
    if (lastNewline > maxChars * 0.8) {
      truncatedContent = truncatedContent.substring(0, lastNewline);
    }

    truncatedContent += "\n\n<!-- Rules truncated due to token limit -->";

    return { processedContent: truncatedContent, truncated: true };
  }

  private estimateTokens(content: string): number {
    return Math.ceil(content.length / DEFAULTS.charsPerToken);
  }

  private async mergeSettingsRules(): Promise<void> {
    // Get custom system prompt from settings
    const customSystemPrompt = vscode.workspace
      .getConfiguration()
      .get<string>("rules.customSystemPrompt", "");

    // Get custom rules array from settings
    const customRules = vscode.workspace
      .getConfiguration()
      .get<
        Array<{ content: string; enabled: boolean }>
      >("rules.customRules", []);

    const enabledRules = customRules
      .filter((r) => r.enabled)
      .map((r) => r.content);

    // Merge all sources
    const allRules: string[] = [];

    if (this.cachedRules?.content) {
      allRules.push(this.cachedRules.content);
    }

    if (enabledRules.length > 0) {
      allRules.push("## Settings-Based Rules\n" + enabledRules.join("\n\n"));
    }

    if (customSystemPrompt) {
      allRules.push("## Additional Instructions\n" + customSystemPrompt);
    }

    if (allRules.length > 0) {
      const mergedContent = allRules.join("\n\n---\n\n");
      const { processedContent, truncated } =
        this.processContent(mergedContent);

      if (!this.cachedRules) {
        this.cachedRules = {
          content: processedContent,
          filePath: "settings",
          tokenCount: this.estimateTokens(processedContent),
          lastModified: new Date(),
          truncated,
        };
      } else {
        this.cachedRules.content = processedContent;
        this.cachedRules.tokenCount = this.estimateTokens(processedContent);
        this.cachedRules.truncated = truncated;
      }
    }
  }

  private setupFileWatchers(): void {
    const watchers = this.fileService.createWatcher(
      {
        patterns: [
          ".codebuddy/rules.md",
          ".codebuddy/rules/*.md",
          ".codebuddyrules",
          "CODEBUDDY.md",
        ],
      },
      // onCreated
      (uri) => {
        this.logger.info(`Rules file created: ${uri.fsPath}`);
        this.loadRules();
      },
      // onChanged
      (uri) => {
        this.logger.info(`Rules file changed: ${uri.fsPath}`);
        this.loadRules();
      },
      // onDeleted
      (uri) => {
        this.logger.info(`Rules file deleted: ${uri.fsPath}`);
        this.loadRules();
      },
    );

    this.disposables.push(...watchers);
  }

  private notifyStatusChange(): void {
    if (this.statusCallback) {
      this.statusCallback(this.getStatus());
    }
  }

  private getTemplateContent(): string {
    return `# Project Rules for CodeBuddy

These rules are automatically included in every AI prompt. Use them to ensure consistent code generation that matches your project's conventions.

## Code Style

- Use [functional/class] components
- Prefer \`const\` over \`let\`, never use \`var\`
- Use [named/default] exports
- Maximum line length: [80/100/120] characters

## Architecture

- All API calls go through \`src/services/\`
- State management uses [Redux/Zustand/Context]
- Follow the [repository/service] pattern for data access

## Naming Conventions

- Components: PascalCase (\`UserProfile.tsx\`)
- Utilities: camelCase (\`formatDate.ts\`)
- Constants: SCREAMING_SNAKE_CASE
- Interfaces: prefix with \`I\` (\`IUserProfile\`)

## Error Handling

- Always use try/catch for async operations
- Log errors with context information
- Show user-friendly error messages, not stack traces

## Testing

- Write unit tests for all new functions
- Use \`describe\`/\`it\` pattern
- Mock external dependencies

## Security

- Never log sensitive data (passwords, tokens, PII)
- Sanitize all user inputs
- Use parameterized queries for database operations

## Documentation

- Add JSDoc comments to public functions
- Include usage examples for complex APIs
- Keep README up to date

---

*Tip: Remove sections that don't apply to your project. Keep rules concise for better token efficiency.*
`;
  }
}
