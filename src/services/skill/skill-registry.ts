/**
 * Skill Registry
 *
 * Discovers and loads skill definitions from multiple sources:
 * - Built-in: Bundled with the extension (skills/ directory)
 * - Workspace: Project-specific (.codebuddy/skills/)
 * - Global: User's personal skills (~/.codebuddy/skills/)
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import {
  SkillDefinition,
  SkillCategory,
  SkillSource,
  SkillDependencies,
  SkillConfigField,
  SkillAuth,
  InstallConfig,
} from "./interfaces";

/**
 * Raw parsed frontmatter from a skill file
 */
interface ParsedFrontmatter {
  name?: string;
  description?: string;
  // Supported attributes
  "argument-hint"?: string;
  compatibility?: string;
  "disable-model-invocation"?: boolean;
  license?: string;
  "user-invocable"?: boolean;
  // Custom metadata for skill system
  metadata?: {
    displayName?: string;
    icon?: string;
    category?: string;
    version?: string;
    dependencies?: {
      cli?: string;
      checkCommand?: string;
      install?: Record<string, unknown>;
    };
    config?: Array<Record<string, unknown>>;
    auth?: Record<string, unknown>;
  };
  // Legacy: Also support direct properties for backward compatibility
  displayName?: string;
  icon?: string;
  category?: string;
  version?: string;
  dependencies?: {
    cli?: string;
    checkCommand?: string;
    install?: Record<string, unknown>;
  };
  config?: Array<Record<string, unknown>>;
  auth?: Record<string, unknown>;
}

export class SkillRegistry {
  private readonly logger: Logger;
  private builtInSkills: Map<string, SkillDefinition> = new Map();
  private workspaceSkills: Map<string, SkillDefinition> = new Map();
  private globalSkills: Map<string, SkillDefinition> = new Map();
  private extensionPath: string;

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
    this.logger = Logger.initialize("SkillRegistry", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: false,
    });
  }

  /**
   * Load all skills from all sources
   */
  public async loadAll(workspacePath?: string): Promise<void> {
    await Promise.all([
      this.loadBuiltInSkills(),
      this.loadGlobalSkills(),
      workspacePath
        ? this.loadWorkspaceSkills(workspacePath)
        : Promise.resolve(),
    ]);

    this.logger.log(
      LogLevel.INFO,
      `Loaded skills: ${this.builtInSkills.size} built-in, ` +
        `${this.globalSkills.size} global, ${this.workspaceSkills.size} workspace`,
    );
  }

  /**
   * Load built-in skills from the extension's skills/ directory
   */
  public async loadBuiltInSkills(): Promise<void> {
    const skillsDir = path.join(this.extensionPath, "skills");
    this.builtInSkills = await this.loadSkillsFromDirectory(
      skillsDir,
      "builtin",
    );
  }

  /**
   * Load workspace-specific skills from .codebuddy/skills/
   */
  public async loadWorkspaceSkills(workspacePath: string): Promise<void> {
    const skillsDir = path.join(workspacePath, ".codebuddy", "skills");
    this.workspaceSkills = await this.loadSkillsFromDirectory(
      skillsDir,
      "workspace",
    );
  }

  /**
   * Load global user skills from ~/.codebuddy/skills/
   */
  public async loadGlobalSkills(): Promise<void> {
    const skillsDir = path.join(os.homedir(), ".codebuddy", "skills");
    this.globalSkills = await this.loadSkillsFromDirectory(skillsDir, "global");
  }

  /**
   * Get all skills, merged with precedence: workspace > global > builtin
   */
  public getAllSkills(): SkillDefinition[] {
    const merged = new Map<string, SkillDefinition>();

    // Add built-in first (lowest precedence)
    for (const [name, skill] of this.builtInSkills) {
      merged.set(name, skill);
    }

    // Override with global
    for (const [name, skill] of this.globalSkills) {
      merged.set(name, skill);
    }

    // Override with workspace (highest precedence)
    for (const [name, skill] of this.workspaceSkills) {
      merged.set(name, skill);
    }

    return Array.from(merged.values());
  }

  /**
   * Get a specific skill by name
   */
  public getSkill(name: string): SkillDefinition | undefined {
    // Check in order of precedence
    return (
      this.workspaceSkills.get(name) ??
      this.globalSkills.get(name) ??
      this.builtInSkills.get(name)
    );
  }

  /**
   * Get built-in skills only
   */
  public getBuiltInSkills(): SkillDefinition[] {
    return Array.from(this.builtInSkills.values());
  }

  /**
   * Get workspace skills only
   */
  public getWorkspaceSkills(): SkillDefinition[] {
    return Array.from(this.workspaceSkills.values());
  }

  /**
   * Get global skills only
   */
  public getGlobalSkills(): SkillDefinition[] {
    return Array.from(this.globalSkills.values());
  }

  /**
   * Load skills from a directory
   */
  private async loadSkillsFromDirectory(
    dir: string,
    source: SkillSource,
  ): Promise<Map<string, SkillDefinition>> {
    const skills = new Map<string, SkillDefinition>();

    if (!fs.existsSync(dir)) {
      return skills;
    }

    try {
      const files = await this.findAllSkillFiles(dir);
      for (const file of files) {
        try {
          const content = await fs.promises.readFile(file, "utf-8");
          const skill = this.parseSkillDefinition(content, source, file);
          if (skill) {
            skills.set(skill.name, skill);
            this.logger.log(
              LogLevel.DEBUG,
              `Loaded skill: ${skill.name} from ${file}`,
            );
          }
        } catch (error) {
          this.logger.warn(`Failed to parse skill file: ${file}`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Error loading skills from ${dir}:`, error);
    }

    return skills;
  }

  /**
   * Recursively find all skill files in a directory
   */
  private async findAllSkillFiles(dir: string): Promise<string[]> {
    const results: string[] = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push(...(await this.findAllSkillFiles(fullPath)));
      } else if (
        entry.name.toLowerCase().endsWith("skill.md") ||
        entry.name.toLowerCase().endsWith(".skill.md")
      ) {
        results.push(fullPath);
      }
    }

    return results;
  }

  /**
   * Parse a skill definition from file content
   */
  private parseSkillDefinition(
    content: string,
    source: SkillSource,
    filePath: string,
  ): SkillDefinition | null {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      this.logger.warn(`No frontmatter found in ${filePath}`);
      return null;
    }

    const frontmatterYaml = match[1];
    const body = match[2].trim();

    const frontmatter = this.parseYamlFrontmatter(frontmatterYaml);
    if (!frontmatter.name) {
      this.logger.warn(`No name in frontmatter for ${filePath}`);
      return null;
    }

    // Get metadata from the metadata block or fall back to root level (backward compatibility)
    const meta = frontmatter.metadata || {};
    const displayName =
      meta.displayName ||
      frontmatter.displayName ||
      this.toDisplayName(frontmatter.name);
    const icon = meta.icon || frontmatter.icon;
    const category = meta.category || frontmatter.category;
    const version = meta.version || frontmatter.version || "1.0.0";
    const dependencies = meta.dependencies || frontmatter.dependencies;
    const config = meta.config || frontmatter.config;
    const auth = meta.auth || frontmatter.auth;

    // Build the skill definition
    const skill: SkillDefinition = {
      name: frontmatter.name,
      displayName,
      description: this.cleanString(frontmatter.description || ""),
      icon,
      category: this.parseCategory(category),
      version,
      content: body,
      source,
      filePath,
    };

    // Parse dependencies if present
    if (dependencies) {
      skill.dependencies = this.parseDependencies(dependencies);
    }

    // Parse config fields if present
    if (config && Array.isArray(config)) {
      skill.config = this.parseConfigFields(config);
    }

    // Parse auth if present
    if (auth) {
      skill.auth = this.parseAuth(auth);
    }

    return skill;
  }

  /**
   * Simple YAML frontmatter parser
   * Handles basic key-value pairs and nested objects
   */
  private parseYamlFrontmatter(yaml: string): ParsedFrontmatter {
    const result: ParsedFrontmatter = {};
    const lines = yaml.split("\n");
    let currentKey: string | null = null;
    let currentIndent = 0;
    const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
      { obj: result as Record<string, unknown>, indent: 0 },
    ];

    for (const line of lines) {
      if (line.trim() === "" || line.trim().startsWith("#")) continue;

      const indent = line.search(/\S/);
      const trimmed = line.trim();

      // Handle list items
      if (trimmed.startsWith("- ")) {
        const parent = stack[stack.length - 1].obj;
        if (currentKey && Array.isArray(parent[currentKey])) {
          const listItem = trimmed.slice(2).trim();
          // Check if it's a complex list item
          if (listItem.includes(":")) {
            const obj: Record<string, unknown> = {};
            const [key, value] = this.parseKeyValue(listItem);
            obj[key] = value;
            (parent[currentKey] as Array<unknown>).push(obj);
            stack.push({ obj, indent: indent + 2 });
          } else {
            (parent[currentKey] as Array<unknown>).push(
              this.parseValue(listItem),
            );
          }
        }
        continue;
      }

      // Pop stack if indent decreased
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const colonIndex = trimmed.indexOf(":");
      if (colonIndex === -1) continue;

      const [key, value] = this.parseKeyValue(trimmed);
      const parent = stack[stack.length - 1].obj;

      if (value === "") {
        // Nested object or array
        const nextLine = lines[lines.indexOf(line) + 1];
        if (nextLine && nextLine.trim().startsWith("-")) {
          parent[key] = [];
          currentKey = key;
        } else {
          parent[key] = {};
          stack.push({ obj: parent[key] as Record<string, unknown>, indent });
        }
      } else {
        parent[key] = this.parseValue(value);
      }
      currentKey = key;
      currentIndent = indent;
    }

    return result;
  }

  private parseKeyValue(line: string): [string, string] {
    const colonIndex = line.indexOf(":");
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    return [key, value];
  }

  private parseValue(value: string): string | number | boolean {
    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }
    // Boolean
    if (value === "true") return true;
    if (value === "false") return false;
    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) return parseFloat(value);
    return value;
  }

  private cleanString(value: string): string {
    let cleaned = value.trim();
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned;
  }

  private toDisplayName(name: string): string {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private parseCategory(category?: string): SkillCategory {
    const validCategories: SkillCategory[] = [
      "project-management",
      "version-control",
      "communication",
      "cloud-devops",
      "databases",
      "monitoring",
      "other",
    ];

    if (category && validCategories.includes(category as SkillCategory)) {
      return category as SkillCategory;
    }
    return "other";
  }

  private parseDependencies(
    deps: Record<string, unknown>,
  ): SkillDependencies | undefined {
    if (!deps.cli || !deps.checkCommand) {
      return undefined;
    }

    const result: SkillDependencies = {
      cli: String(deps.cli),
      checkCommand: String(deps.checkCommand),
      install: {},
    };

    // Parse bundled install script path
    if (deps.bundledInstall) {
      result.bundledInstall = String(deps.bundledInstall);
    }

    if (deps.install && typeof deps.install === "object") {
      const install = deps.install as Record<string, unknown>;

      for (const os of ["darwin", "linux", "windows"] as const) {
        if (install[os] && typeof install[os] === "object") {
          result.install[os] = this.parseInstallConfig(
            install[os] as Record<string, unknown>,
          );
        }
      }
    }

    return result;
  }

  private parseInstallConfig(config: Record<string, unknown>): InstallConfig {
    const result: InstallConfig = {};

    if (config.brew) result.brew = String(config.brew);
    if (config.apt) result.apt = String(config.apt);
    if (config.dnf) result.dnf = String(config.dnf);
    if (config.scoop) result.scoop = String(config.scoop);
    if (config.choco) result.choco = String(config.choco);
    if (config.winget) result.winget = String(config.winget);
    if (config.script) result.script = String(config.script);

    return result;
  }

  private parseConfigFields(
    configs: Array<Record<string, unknown>>,
  ): SkillConfigField[] {
    return configs
      .map((cfg) => {
        if (!cfg.name || !cfg.label) return null;

        const field: SkillConfigField = {
          name: String(cfg.name),
          label: String(cfg.label),
          type: this.parseConfigFieldType(cfg.type),
          required: cfg.required === true,
        };

        if (cfg.placeholder) field.placeholder = String(cfg.placeholder);
        if (cfg.helpUrl) field.helpUrl = String(cfg.helpUrl);
        if (cfg.defaultValue !== undefined) {
          field.defaultValue = cfg.defaultValue as string | number | boolean;
        }

        return field;
      })
      .filter((f): f is SkillConfigField => f !== null);
  }

  private parseConfigFieldType(type: unknown): SkillConfigField["type"] {
    const validTypes = ["string", "secret", "number", "boolean", "select"];
    if (typeof type === "string" && validTypes.includes(type)) {
      return type as SkillConfigField["type"];
    }
    return "string";
  }

  private parseAuth(auth: Record<string, unknown>): SkillAuth {
    const result: SkillAuth = {
      type: "none",
    };

    if (auth.type) {
      const validTypes = ["api-key", "oauth", "basic", "none"];
      if (validTypes.includes(String(auth.type))) {
        result.type = auth.type as SkillAuth["type"];
      }
    }

    if (auth.setupCommand) {
      result.setupCommand = String(auth.setupCommand);
    }

    if (auth.oauthProvider) {
      result.oauthProvider = String(auth.oauthProvider);
    }

    // Parse envVars array
    if (auth.envVars && Array.isArray(auth.envVars)) {
      result.envVars = auth.envVars.map((v) => String(v));
    }

    return result;
  }
}
