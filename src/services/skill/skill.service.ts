/**
 * Skill Service
 *
 * Main service class for managing skills lifecycle.
 * Coordinates between SkillRegistry, SkillInstaller, and state persistence.
 */

import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { SkillRegistry } from "./skill-registry";
import { SkillInstaller } from "./skill-installer";
import {
  escapeShellArg,
  isValidEnvVarName,
  buildEnvExports,
} from "./shell-escape";
import {
  Skill,
  SkillDefinition,
  SkillState,
  SkillEnvironment,
  EnableSkillResult,
  InstallResult,
  DependencyCheckResult,
  AuthFailureResult,
  SkillConfigStatus,
  DEFAULT_SKILL_STATE,
  DEFAULT_ENVIRONMENTS,
  SKILL_CATEGORIES,
  SkillCategoryInfo,
} from "./interfaces";

const SKILL_STATES_CONFIG_KEY = "codebuddy.skills.states";

/**
 * Sensitive system environment variables that skills must not override.
 * These could be used for privilege escalation or system manipulation.
 */
const SENSITIVE_SYSTEM_ENV_VARS = new Set([
  // Dynamic linker preloading - major security risk
  "LD_PRELOAD",
  "LD_LIBRARY_PATH",
  "DYLD_INSERT_LIBRARIES",
  "DYLD_LIBRARY_PATH",
  // PATH manipulation can redirect command execution
  "PATH",
  // Shell/environment manipulation
  "SHELL",
  "HOME",
  "USER",
  "LOGNAME",
  "PWD",
  // Temp directory redirection
  "TMPDIR",
  "TEMP",
  "TMP",
  // Field separator manipulation (for command injection)
  "IFS",
  // Editor/pager hijacking
  "EDITOR",
  "VISUAL",
  "PAGER",
  // SSH agent hijacking
  "SSH_AUTH_SOCK",
  // Process environment
  "LD_AUDIT",
  "LD_DEBUG",
]);

export class SkillService {
  private static instance: SkillService | null = null;
  private static extensionPath: string | null = null;
  private readonly logger: Logger;
  private readonly registry: SkillRegistry;
  private readonly installer: SkillInstaller;
  private skillStates: Map<string, SkillState> = new Map();
  private initialized = false;

  private constructor(extensionPath: string) {
    this.logger = Logger.initialize("SkillService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: false,
    });

    this.registry = new SkillRegistry(extensionPath);
    this.installer = new SkillInstaller(extensionPath);
  }

  /**
   * Set the extension path (must be called during extension activation)
   */
  public static setExtensionPath(path: string): void {
    SkillService.extensionPath = path;
  }

  /**
   * Get or create the singleton instance
   */
  public static getInstance(): SkillService {
    if (!SkillService.instance) {
      if (!SkillService.extensionPath) {
        throw new Error(
          "SkillService.setExtensionPath() must be called before getInstance()",
        );
      }
      SkillService.instance = new SkillService(SkillService.extensionPath);
    }
    return SkillService.instance;
  }

  /**
   * Reset the singleton (for testing)
   */
  public static resetInstance(): void {
    SkillService.instance = null;
  }

  /**
   * Initialize the skill service
   */
  public async initialize(workspacePath?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.log(LogLevel.INFO, "Initializing SkillService...");

    // Load skill definitions
    await this.registry.loadAll(workspacePath);

    // Load persisted states
    await this.loadSkillStates();

    // Clean up orphaned states (skills that no longer exist)
    await this.cleanupOrphanedStates();

    // Detect package managers
    await this.installer.detectPackageManagers();

    this.initialized = true;
    this.logger.log(LogLevel.INFO, "SkillService initialized");
  }

  /**
   * Get all skills with their current states
   */
  public async getSkills(): Promise<Skill[]> {
    const definitions = this.registry.getAllSkills();

    const skills: Skill[] = await Promise.all(
      definitions.map(async (def) => {
        const state = this.skillStates.get(def.name) ?? {
          ...DEFAULT_SKILL_STATE,
        };

        // Check installation status if enabled
        if (state.enabled && def.dependencies) {
          const checkResult = await this.installer.checkInstalled(def);
          state.installed = checkResult.installed;
        }

        return {
          ...def,
          state,
        };
      }),
    );

    return skills;
  }

  /**
   * Get skills grouped by category
   */
  public async getSkillsByCategory(): Promise<Map<string, Skill[]>> {
    const skills = await this.getSkills();
    const grouped = new Map<string, Skill[]>();

    for (const category of SKILL_CATEGORIES) {
      grouped.set(category.id, []);
    }

    for (const skill of skills) {
      const categorySkills = grouped.get(skill.category) ?? [];
      categorySkills.push(skill);
      grouped.set(skill.category, categorySkills);
    }

    return grouped;
  }

  /**
   * Get only enabled skills
   */
  public async getEnabledSkills(): Promise<Skill[]> {
    const skills = await this.getSkills();
    return skills.filter((s) => s.state.enabled);
  }

  /**
   * Get a specific skill by name
   */
  public async getSkill(name: string): Promise<Skill | undefined> {
    const def = this.registry.getSkill(name);
    if (!def) return undefined;

    const state = this.skillStates.get(name) ?? { ...DEFAULT_SKILL_STATE };

    if (state.enabled && def.dependencies) {
      const checkResult = await this.installer.checkInstalled(def);
      state.installed = checkResult.installed;
    }

    return {
      ...def,
      state,
    };
  }

  /**
   * Enable a skill
   */
  public async enableSkill(
    skillId: string,
    scope: "workspace" | "global" = "workspace",
  ): Promise<EnableSkillResult> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${skillId}`,
      };
    }

    // Check if CLI is installed
    if (skill.dependencies) {
      const checkResult = await this.installer.checkInstalled(skill);

      if (!checkResult.installed) {
        const installCommand = await this.installer.getInstallCommand(skill);

        return {
          success: false,
          requiresInstall: true,
          installCommand: installCommand ?? undefined,
          error: `${skill.dependencies.cli} is not installed`,
        };
      }
    }

    // Check if configuration is required
    const requiresConfig = this.checkRequiresConfig(skill);

    // Update state
    const state: SkillState = {
      ...this.skillStates.get(skillId),
      enabled: true,
      installed: true,
      configured: !requiresConfig,
      scope,
    };

    this.skillStates.set(skillId, state);
    await this.saveSkillStates();

    this.logger.log(
      LogLevel.INFO,
      `Skill enabled: ${skillId} (scope: ${scope})`,
    );

    return {
      success: true,
      requiresConfig,
    };
  }

  /**
   * Disable a skill
   */
  public async disableSkill(
    skillId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${skillId}`,
      };
    }

    const currentState = this.skillStates.get(skillId);
    if (currentState) {
      currentState.enabled = false;
      this.skillStates.set(skillId, currentState);
    } else {
      this.skillStates.set(skillId, {
        ...DEFAULT_SKILL_STATE,
        enabled: false,
      });
    }

    await this.saveSkillStates();

    this.logger.log(LogLevel.INFO, `Skill disabled: ${skillId}`);

    return { success: true };
  }

  /**
   * Install a skill's CLI dependencies
   */
  public async installDependencies(skillId: string): Promise<InstallResult> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${skillId}`,
      };
    }

    if (!skill.dependencies) {
      return {
        success: true,
      };
    }

    return this.installer.install(skill);
  }

  /**
   * Check if a skill's dependencies are installed
   */
  public async checkDependencies(
    skillId: string,
  ): Promise<DependencyCheckResult> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return { installed: false };
    }

    return this.installer.checkInstalled(skill);
  }

  /**
   * Configure a skill with user-provided values
   */
  public async configureSkill(
    skillId: string,
    config: Record<string, string | number | boolean>,
  ): Promise<{ success: boolean; error?: string }> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${skillId}`,
      };
    }

    // Store config values (secrets should be stored in VS Code's secret storage)
    const state = this.skillStates.get(skillId) ?? { ...DEFAULT_SKILL_STATE };
    state.configValues = config;
    state.configured = true;
    this.skillStates.set(skillId, state);

    await this.saveSkillStates();

    // Handle secret storage separately
    if (skill.config) {
      for (const field of skill.config) {
        if (field.type === "secret" && config[field.name]) {
          await this.storeSecret(
            skillId,
            field.name,
            String(config[field.name]),
          );
          // Remove secrets from regular config
          delete state.configValues[field.name];
        }
      }
      await this.saveSkillStates();
    }

    this.logger.log(LogLevel.INFO, `Skill configured: ${skillId}`);

    return { success: true };
  }

  /**
   * Run a skill's setup command
   */
  public async runSetupCommand(skillId: string): Promise<void> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      vscode.window.showErrorMessage(`Skill not found: ${skillId}`);
      return;
    }

    await this.installer.runSetupCommand(skill);
  }

  /**
   * Get install command for a skill
   */
  public async getInstallCommand(skillId: string): Promise<string | null> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) return null;

    return this.installer.getInstallCommand(skill);
  }

  /**
   * Get all skill categories
   */
  public getCategories(): SkillCategoryInfo[] {
    return SKILL_CATEGORIES;
  }

  /**
   * Get platform information
   */
  public getPlatformInfo(): {
    platform: string;
    arch: string;
    packageManagers: string[];
  } {
    return this.installer.getPlatformInfo();
  }

  /**
   * Reload skills from all sources and clean up orphaned states
   */
  public async reload(workspacePath?: string): Promise<void> {
    await this.registry.loadAll(workspacePath);
    await this.cleanupOrphanedStates();
    this.logger.log(
      LogLevel.INFO,
      "Skills reloaded and orphaned states cleaned",
    );
  }

  /**
   * Check if a skill requires configuration
   */
  private checkRequiresConfig(skill: SkillDefinition): boolean {
    if (!skill.config) return false;

    return skill.config.some((field) => field.required);
  }

  /**
   * Load skill states from VS Code configuration
   */
  private async loadSkillStates(): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    const states = config.get<Record<string, SkillState>>(
      SKILL_STATES_CONFIG_KEY,
      {},
    );

    this.skillStates = new Map(Object.entries(states));
    this.logger.log(
      LogLevel.DEBUG,
      `Loaded ${this.skillStates.size} skill states`,
    );
  }

  /**
   * Clean up states for skills that no longer exist
   */
  private async cleanupOrphanedStates(): Promise<void> {
    const validSkillNames = new Set(
      this.registry.getAllSkills().map((s) => s.name),
    );
    const orphanedStates: string[] = [];

    for (const skillId of this.skillStates.keys()) {
      if (!validSkillNames.has(skillId)) {
        orphanedStates.push(skillId);
      }
    }

    if (orphanedStates.length > 0) {
      for (const skillId of orphanedStates) {
        this.skillStates.delete(skillId);
        this.logger.log(
          LogLevel.DEBUG,
          `Removed orphaned skill state: ${skillId}`,
        );
      }
      await this.saveSkillStates();
      this.logger.log(
        LogLevel.INFO,
        `Cleaned up ${orphanedStates.length} orphaned skill states: ${orphanedStates.join(", ")}`,
      );
    }
  }

  /**
   * Save skill states to VS Code configuration
   */
  private async saveSkillStates(): Promise<void> {
    const states: Record<string, SkillState> = {};

    for (const [name, state] of this.skillStates) {
      // Don't persist sensitive data
      const { configValues, ...safeState } = state;
      states[name] = {
        ...safeState,
        // Only keep non-sensitive config values
        configValues: configValues
          ? Object.fromEntries(
              Object.entries(configValues).filter(
                ([key]) =>
                  !key.toLowerCase().includes("token") &&
                  !key.toLowerCase().includes("secret") &&
                  !key.toLowerCase().includes("password"),
              ),
            )
          : undefined,
      };
    }

    await vscode.workspace
      .getConfiguration()
      .update(
        SKILL_STATES_CONFIG_KEY,
        states,
        vscode.ConfigurationTarget.Global,
      );

    this.logger.log(
      LogLevel.DEBUG,
      `Saved ${this.skillStates.size} skill states`,
    );
  }

  /**
   * Store a secret value in VS Code's secret storage
   * @param skillId - The skill ID
   * @param key - The secret key name
   * @param value - The secret value
   * @param environmentId - Optional environment ID (defaults to active environment)
   */
  private async storeSecret(
    skillId: string,
    key: string,
    value: string,
    environmentId?: string,
  ): Promise<void> {
    const state = this.skillStates.get(skillId);
    const envId = environmentId ?? state?.activeEnvironment ?? "default";
    const secretKey = `codebuddy.skill.${skillId}.${envId}.${key}`;

    // Get the extension context's secrets
    const secrets = (global as { codebuddySecrets?: vscode.SecretStorage })
      .codebuddySecrets;
    if (secrets) {
      await secrets.store(secretKey, value);
      this.logger.log(LogLevel.DEBUG, `Stored secret: ${secretKey}`);
    } else {
      this.logger.warn("Secret storage not available");
    }
  }

  /**
   * Retrieve a secret value from VS Code's secret storage
   * @param skillId - The skill ID
   * @param key - The secret key name
   * @param environmentId - Optional environment ID (defaults to active environment)
   */
  public async getSecret(
    skillId: string,
    key: string,
    environmentId?: string,
  ): Promise<string | undefined> {
    const state = this.skillStates.get(skillId);
    const envId = environmentId ?? state?.activeEnvironment ?? "default";
    const secretKey = `codebuddy.skill.${skillId}.${envId}.${key}`;

    const secrets = (global as { codebuddySecrets?: vscode.SecretStorage })
      .codebuddySecrets;
    if (secrets) {
      return secrets.get(secretKey);
    }

    return undefined;
  }

  /**
   * Get environment variables for a skill from stored config/secrets
   * Uses the active environment or specified environment
   * @param skillId - The skill ID
   * @param environmentId - Optional environment ID (defaults to active)
   * @returns Map of env var names to their values
   */
  public async getSkillEnvVars(
    skillId: string,
    environmentId?: string,
  ): Promise<Record<string, string>> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      this.logger.warn(`Skill not found: ${skillId}`);
      return {};
    }

    const envVars: Record<string, string> = {};
    const state = this.skillStates.get(skillId);
    const envId = environmentId ?? state?.activeEnvironment ?? "default";

    // Get env var names from auth.envVars
    const envVarNames: string[] = skill.auth?.envVars ?? [];

    // Map from envVarName to config field name for lookup
    const envVarToFieldName: Record<string, string> = {};

    // Also include config fields, using envVarName if specified, otherwise field.name
    if (skill.config) {
      for (const field of skill.config) {
        // Use explicit envVarName if specified, otherwise use field.name if it looks like an env var
        const targetEnvVar = field.envVarName ?? field.name;
        const shouldInclude =
          field.envVarName || /^[A-Z][A-Z0-9_]*$/.test(field.name);

        if (shouldInclude && !envVarNames.includes(targetEnvVar)) {
          envVarNames.push(targetEnvVar);
          // Track mapping so we can look up by field name when envVarName differs
          if (field.envVarName) {
            envVarToFieldName[targetEnvVar] = field.name;
          }
        }
      }
    }

    // Track collisions for logging (only warn once per skill)
    const collisions: string[] = [];

    // Populate env vars from secrets and config values for the specific environment
    for (const envVar of envVarNames) {
      // Security: Skip sensitive system env vars to prevent privilege escalation
      if (SENSITIVE_SYSTEM_ENV_VARS.has(envVar.toUpperCase())) {
        collisions.push(envVar);
        continue;
      }

      // Determine field name to look up (may differ from envVar if envVarName mapping exists)
      const fieldName = envVarToFieldName[envVar] ?? envVar;

      // First check secrets (environment-specific) - try both envVar and fieldName
      let secretValue = await this.getSecret(skillId, envVar, envId);
      if (!secretValue && fieldName !== envVar) {
        secretValue = await this.getSecret(skillId, fieldName, envId);
      }
      if (secretValue) {
        envVars[envVar] = secretValue;
        continue;
      }

      // Then check environment-specific config values - try both envVar and fieldName
      const envConfig = state?.environmentConfigs?.[envId];
      if (envConfig?.[envVar]) {
        envVars[envVar] = String(envConfig[envVar]);
        continue;
      }
      if (fieldName !== envVar && envConfig?.[fieldName]) {
        envVars[envVar] = String(envConfig[fieldName]);
        continue;
      }

      // Fallback to legacy configValues (for backward compatibility) - try both
      if (state?.configValues?.[envVar]) {
        envVars[envVar] = String(state.configValues[envVar]);
      } else if (fieldName !== envVar && state?.configValues?.[fieldName]) {
        envVars[envVar] = String(state.configValues[fieldName]);
      }
    }

    // Log security warning if collisions were detected
    if (collisions.length > 0) {
      this.logger.warn(
        `Security: Skill "${skillId}" attempted to set sensitive system env vars (blocked): ${collisions.join(", ")}`,
      );
    }

    return envVars;
  }

  /**
   * Run a command with skill's environment variables injected
   * Returns the terminal for interaction.
   *
   * Security: Environment variables are validated and injected via VS Code's
   * terminal API, which is safer than shell-level export statements.
   *
   * @param skillId - The skill ID to get environment for
   * @param command - The command to run (should be from trusted source)
   * @param options - Optional terminal name and working directory
   */
  public async runSkillCommand(
    skillId: string,
    command: string,
    options?: { name?: string; cwd?: string },
  ): Promise<vscode.Terminal> {
    const skill = this.registry.getSkill(skillId);
    const displayName = skill?.displayName ?? skillId;

    // Validate command isn't empty or suspiciously long
    if (!command || command.trim().length === 0) {
      throw new Error("Cannot run empty command");
    }
    if (command.length > 5000) {
      throw new Error("Command exceeds maximum allowed length");
    }

    // Get and validate env vars for the skill
    const skillEnvVars = await this.getSkillEnvVars(skillId);

    // Filter env vars to only include valid names
    const safeEnvVars: Record<string, string> = {};
    for (const [key, value] of Object.entries(skillEnvVars)) {
      if (isValidEnvVarName(key)) {
        safeEnvVars[key] = value;
      } else {
        this.logger.warn(`Skipping invalid env var name: ${key}`);
      }
    }

    // Merge with process env using VS Code's safe env injection
    const env: Record<string, string> = {
      ...process.env,
      ...safeEnvVars,
    } as Record<string, string>;

    // Sanitize terminal name (prevent injection in terminal title)
    const safeName = (options?.name ?? displayName)
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .slice(0, 50);

    // Create terminal with injected env vars
    // VS Code handles env injection securely (not via shell export)
    const terminal = vscode.window.createTerminal({
      name: safeName,
      env,
      cwd: options?.cwd,
    });

    terminal.show();
    terminal.sendText(command);

    // Log without exposing command details (could contain sensitive info)
    this.logger.log(
      LogLevel.INFO,
      `Running command for ${skillId} with ${Object.keys(safeEnvVars).length} env vars`,
    );

    return terminal;
  }

  /**
   * Get environment variables as shell export statements
   * Useful for agents to prepend to commands.
   *
   * Security: Values are properly escaped using shell-safe escaping.
   */
  public async getSkillEnvExports(skillId: string): Promise<string> {
    const envVars = await this.getSkillEnvVars(skillId);

    if (Object.keys(envVars).length === 0) {
      return "";
    }

    // Use the secure buildEnvExports utility which properly escapes values
    return buildEnvExports(envVars);
  }

  /**
   * Check if a skill has all required configuration set
   */
  public async isSkillConfigured(skillId: string): Promise<SkillConfigStatus> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return { configured: false, missing: [] };
    }

    const missing: string[] = [];

    if (skill.config) {
      for (const field of skill.config) {
        if (field.required) {
          const hasSecret = await this.getSecret(skillId, field.name);
          const state = this.skillStates.get(skillId);
          const hasConfig = state?.configValues?.[field.name];

          if (!hasSecret && !hasConfig) {
            missing.push(field.name);
          }
        }
      }
    }

    return {
      configured: missing.length === 0,
      missing,
    };
  }

  /**
   * Get the skills prompt for the agent system prompt
   * (Integration with existing SkillManager)
   */
  public async getSkillsPrompt(): Promise<string> {
    const enabledSkills = await this.getEnabledSkills();

    if (enabledSkills.length === 0) {
      return "";
    }

    let prompt = `\n\n## 🛠️ Available Skills\nYou have access to the following skills via their respective CLI commands. You can use them by running the commands described in their documentation using the 'RunCommand' tool.\n\n`;
    prompt += `**Note**: API keys and credentials configured for these skills are automatically injected as environment variables when running commands.\n\n`;
    prompt += `**Environments**: Each skill can have multiple environments (e.g., LOCAL, QA, PROD) with different credentials. The active environment is shown below.\n\n`;
    prompt += `**Auth Error Handling**: If a skill command fails with authentication errors (401, 403, "unauthorized", "invalid key", etc.), inform the user and suggest they reconfigure credentials or switch environments via Settings → Skills.\n\n`;

    for (const skill of enabledSkills) {
      // Get active environment
      const activeEnv = this.getActiveEnvironment(skill.name);
      const environments = this.getEnvironments(skill.name);

      // Check if skill has env vars configured
      const envVars = await this.getSkillEnvVars(skill.name);
      const hasEnvVars = Object.keys(envVars).length > 0;
      const configStatus = await this.isSkillConfigured(skill.name);

      prompt += `### Skill: ${skill.displayName}\n${skill.description}\n`;

      // Show environment info
      if (environments.length > 1 || activeEnv?.id !== "default") {
        prompt += `\n**Active Environment**: ${activeEnv?.displayName ?? "Default"}`;
        if (environments.length > 1) {
          const otherEnvs = environments
            .filter((e) => e.id !== activeEnv?.id)
            .map((e) => e.displayName);
          prompt += ` (Available: ${otherEnvs.join(", ")})`;
        }
        prompt += `\n`;
      }

      if (hasEnvVars) {
        prompt += `**Configured env vars**: ${Object.keys(envVars).join(", ")}\n`;
      } else if (skill.auth?.envVars?.length) {
        prompt += `**Required env vars** (not configured): ${skill.auth.envVars.join(", ")}\n`;
      }

      if (!configStatus.configured && configStatus.missing.length > 0) {
        prompt += `⚠️ **Missing config**: ${configStatus.missing.join(", ")} - ask user to configure before using\n`;
      }

      prompt += `\n${skill.content}\n\n---\n\n`;
    }

    return prompt;
  }

  // ============================================
  // Auth Failure Handling & Recovery
  // ============================================

  /**
   * Common auth error patterns for various CLIs
   */
  private static readonly AUTH_ERROR_PATTERNS = [
    // Generic
    /unauthorized/i,
    /authentication failed/i,
    /auth(entication)? error/i,
    /invalid (api[_-]?)?key/i,
    /invalid (access[_-]?)?token/i,
    /invalid credentials/i,
    /access denied/i,
    /permission denied/i,
    /forbidden/i,
    /401/,
    /403/,
    // Datadog
    /invalid api key/i,
    /api key.*invalid/i,
    // AWS
    /InvalidAccessKeyId/i,
    /SignatureDoesNotMatch/i,
    /ExpiredToken/i,
    // GitHub/GitLab
    /bad credentials/i,
    /invalid oauth token/i,
    // Google/Gmail
    /invalid_grant/i,
    /token.*expired/i,
    /refresh token.*invalid/i,
    // Jira
    /client must be authenticated/i,
    // Generic API
    /api[_-]?key.*required/i,
    /missing.*authorization/i,
  ];

  /**
   * Check if command output indicates an authentication failure
   */
  public isAuthError(output: string): boolean {
    return SkillService.AUTH_ERROR_PATTERNS.some((pattern) =>
      pattern.test(output),
    );
  }

  /**
   * Handle authentication failure for a skill
   * Shows UI to reconfigure credentials and returns result
   */
  public async handleAuthFailure(
    skillId: string,
    errorOutput?: string,
  ): Promise<AuthFailureResult> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return { reconfigured: false, action: "cancel" };
    }

    // Log the auth failure
    this.logger.warn(`Auth failure for skill ${skillId}`, { errorOutput });

    // Update skill state
    const state = this.skillStates.get(skillId) ?? { ...DEFAULT_SKILL_STATE };
    state.lastError = errorOutput ?? "Authentication failed";
    state.configured = false;
    this.skillStates.set(skillId, state);
    await this.saveSkillStates();

    // Show user options
    const hasSetupCommand = !!skill.auth?.setupCommand;
    const options: string[] = ["Re-enter Credentials"];
    if (hasSetupCommand) {
      options.push("Run Setup Command");
    }
    options.push("Cancel");

    const choice = await vscode.window.showWarningMessage(
      `Authentication failed for ${skill.displayName}. ${errorOutput ? `Error: ${errorOutput.slice(0, 100)}...` : ""}`,
      ...options,
    );

    if (choice === "Re-enter Credentials") {
      const reconfigured = await this.promptReconfigureSkill(skillId);
      return { reconfigured, action: "reconfigure" };
    } else if (choice === "Run Setup Command" && hasSetupCommand) {
      await this.runSetupCommand(skillId);
      return { reconfigured: false, action: "setup" };
    }

    return { reconfigured: false, action: "cancel" };
  }

  /**
   * Prompt user to reconfigure a skill's credentials via input boxes
   */
  public async promptReconfigureSkill(skillId: string): Promise<boolean> {
    const skill = this.registry.getSkill(skillId);
    if (!skill || !skill.config) {
      vscode.window.showErrorMessage(
        `No configuration available for ${skillId}`,
      );
      return false;
    }

    const newConfig: Record<string, string | number | boolean> = {};

    // Get existing values for defaults
    const existingEnvVars = await this.getSkillEnvVars(skillId);

    for (const field of skill.config) {
      // Skip non-essential fields
      if (!field.required && field.type !== "secret") {
        continue;
      }

      const existingValue = existingEnvVars[field.name];
      const maskedValue = existingValue
        ? `${existingValue.slice(0, 4)}${"*".repeat(Math.min(existingValue.length - 4, 20))}`
        : undefined;

      const input = await vscode.window.showInputBox({
        title: `${skill.displayName}: ${field.label}`,
        prompt: field.placeholder ?? `Enter ${field.label}`,
        password: field.type === "secret",
        placeHolder: maskedValue ?? field.placeholder,
        ignoreFocusOut: true,
        validateInput: (value) => {
          if (field.required && !value && !existingValue) {
            return `${field.label} is required`;
          }
          return undefined;
        },
      });

      // User cancelled
      if (input === undefined) {
        vscode.window.showWarningMessage("Configuration cancelled");
        return false;
      }

      // Only update if user provided a new value
      if (input) {
        newConfig[field.name] = input;
      }
    }

    // Save the new configuration
    if (Object.keys(newConfig).length > 0) {
      const result = await this.configureSkill(skillId, newConfig);
      if (result.success) {
        vscode.window.showInformationMessage(
          `${skill.displayName} credentials updated successfully`,
        );
        return true;
      } else {
        vscode.window.showErrorMessage(
          `Failed to save credentials: ${result.error}`,
        );
        return false;
      }
    }

    return false;
  }

  /**
   * Clear all credentials for a skill (all environments)
   */
  public async clearSkillCredentials(skillId: string): Promise<void> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return;
    }

    const state = this.skillStates.get(skillId);
    const environments = state?.environments ?? DEFAULT_ENVIRONMENTS;

    // Clear secrets for all environments
    const secrets = (global as { codebuddySecrets?: vscode.SecretStorage })
      .codebuddySecrets;
    if (secrets && skill.config) {
      for (const env of environments) {
        for (const field of skill.config) {
          if (field.type === "secret") {
            const secretKey = `codebuddy.skill.${skillId}.${env.id}.${field.name}`;
            await secrets.delete(secretKey);
          }
        }
      }
      // Also clear legacy secrets (without environment prefix)
      for (const field of skill.config) {
        if (field.type === "secret") {
          const secretKey = `codebuddy.skill.${skillId}.${field.name}`;
          await secrets.delete(secretKey);
        }
      }
    }

    // Clear config values
    if (state) {
      state.configValues = undefined;
      state.environmentConfigs = {};
      state.configured = false;
      this.skillStates.set(skillId, state);
      await this.saveSkillStates();
    }

    this.logger.log(LogLevel.INFO, `Cleared credentials for skill: ${skillId}`);
    vscode.window.showInformationMessage(
      `Credentials cleared for ${skill.displayName} (all environments)`,
    );
  }

  /**
   * Clear credentials for a specific environment
   */
  public async clearEnvironmentCredentials(
    skillId: string,
    environmentId: string,
  ): Promise<void> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return;
    }

    const state = this.skillStates.get(skillId);
    const env = state?.environments?.find((e) => e.id === environmentId);

    // Clear secrets for the specific environment
    const secrets = (global as { codebuddySecrets?: vscode.SecretStorage })
      .codebuddySecrets;
    if (secrets && skill.config) {
      for (const field of skill.config) {
        if (field.type === "secret") {
          const secretKey = `codebuddy.skill.${skillId}.${environmentId}.${field.name}`;
          await secrets.delete(secretKey);
        }
      }
    }

    // Clear environment config
    if (state?.environmentConfigs) {
      state.environmentConfigs[environmentId] = {};
      this.skillStates.set(skillId, state);
      await this.saveSkillStates();
    }

    this.logger.log(
      LogLevel.INFO,
      `Cleared credentials for skill: ${skillId}, environment: ${environmentId}`,
    );
    vscode.window.showInformationMessage(
      `Credentials cleared for ${skill.displayName} (${env?.displayName ?? environmentId})`,
    );
  }

  /**
   * Get auth failure recovery instructions for agents
   * Returns a string the agent can use to guide recovery
   */
  public async getAuthRecoveryInstructions(skillId: string): Promise<string> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return `Skill ${skillId} not found.`;
    }

    const { configured, missing } = await this.isSkillConfigured(skillId);

    let instructions = `## Authentication Recovery for ${skill.displayName}\n\n`;

    if (!configured && missing.length > 0) {
      instructions += `**Missing credentials**: ${missing.join(", ")}\n\n`;
    }

    instructions += `**To fix authentication issues:**\n`;
    instructions += `1. Ask the user to provide new credentials\n`;
    instructions += `2. Use the skill configuration UI in Settings → Skills → ${skill.displayName}\n`;

    if (skill.auth?.setupCommand) {
      instructions += `3. Or run the setup command: \`${skill.auth.setupCommand}\`\n`;
    }

    if (skill.auth?.envVars?.length) {
      instructions += `\n**Required environment variables:**\n`;
      for (const envVar of skill.auth.envVars) {
        instructions += `- \`${envVar}\`\n`;
      }
    }

    return instructions;
  }

  // ============================================
  // Environment Management
  // ============================================

  /**
   * Create a new environment for a skill
   */
  public async createEnvironment(
    skillId: string,
    environment: Omit<SkillEnvironment, "createdAt">,
  ): Promise<{ success: boolean; error?: string }> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return { success: false, error: `Skill not found: ${skillId}` };
    }

    const state = this.skillStates.get(skillId) ?? { ...DEFAULT_SKILL_STATE };

    // Initialize environments if not present
    if (!state.environments) {
      state.environments = [...DEFAULT_ENVIRONMENTS];
    }

    // Check for duplicate
    if (state.environments.some((env) => env.id === environment.id)) {
      return {
        success: false,
        error: `Environment "${environment.id}" already exists`,
      };
    }

    // Add the new environment
    state.environments.push({
      ...environment,
      createdAt: Date.now(),
    });

    // Initialize config storage for the environment
    if (!state.environmentConfigs) {
      state.environmentConfigs = {};
    }
    state.environmentConfigs[environment.id] = {};

    this.skillStates.set(skillId, state);
    await this.saveSkillStates();

    this.logger.log(
      LogLevel.INFO,
      `Created environment "${environment.displayName}" for skill ${skillId}`,
    );

    return { success: true };
  }

  /**
   * Delete an environment for a skill
   */
  public async deleteEnvironment(
    skillId: string,
    environmentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (environmentId === "default") {
      return { success: false, error: "Cannot delete the default environment" };
    }

    const state = this.skillStates.get(skillId);
    if (!state?.environments) {
      return { success: false, error: "No environments found" };
    }

    const envIndex = state.environments.findIndex(
      (env) => env.id === environmentId,
    );
    if (envIndex === -1) {
      return {
        success: false,
        error: `Environment "${environmentId}" not found`,
      };
    }

    // Remove the environment
    state.environments.splice(envIndex, 1);

    // Remove associated config
    if (state.environmentConfigs) {
      delete state.environmentConfigs[environmentId];
    }

    // Clear secrets for this environment
    const skill = this.registry.getSkill(skillId);
    if (skill?.config) {
      const secrets = (global as { codebuddySecrets?: vscode.SecretStorage })
        .codebuddySecrets;
      if (secrets) {
        for (const field of skill.config) {
          if (field.type === "secret") {
            const secretKey = `codebuddy.skill.${skillId}.${environmentId}.${field.name}`;
            await secrets.delete(secretKey);
          }
        }
      }
    }

    // Switch to default if we deleted the active environment
    if (state.activeEnvironment === environmentId) {
      state.activeEnvironment = "default";
    }

    this.skillStates.set(skillId, state);
    await this.saveSkillStates();

    this.logger.log(
      LogLevel.INFO,
      `Deleted environment "${environmentId}" for skill ${skillId}`,
    );

    return { success: true };
  }

  /**
   * Switch the active environment for a skill
   */
  public async switchEnvironment(
    skillId: string,
    environmentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const state = this.skillStates.get(skillId);
    if (!state) {
      return { success: false, error: `Skill state not found: ${skillId}` };
    }

    const environments = state.environments ?? DEFAULT_ENVIRONMENTS;
    const env = environments.find((e) => e.id === environmentId);
    if (!env) {
      return {
        success: false,
        error: `Environment "${environmentId}" not found`,
      };
    }

    state.activeEnvironment = environmentId;
    this.skillStates.set(skillId, state);
    await this.saveSkillStates();

    const skill = this.registry.getSkill(skillId);
    this.logger.log(
      LogLevel.INFO,
      `Switched ${skill?.displayName ?? skillId} to environment "${env.displayName}"`,
    );

    vscode.window.showInformationMessage(
      `${skill?.displayName ?? skillId}: Switched to ${env.displayName} environment`,
    );

    return { success: true };
  }

  /**
   * Get all environments for a skill
   */
  public getEnvironments(skillId: string): SkillEnvironment[] {
    const state = this.skillStates.get(skillId);
    return state?.environments ?? [...DEFAULT_ENVIRONMENTS];
  }

  /**
   * Get the active environment for a skill
   */
  public getActiveEnvironment(skillId: string): SkillEnvironment | undefined {
    const state = this.skillStates.get(skillId);
    const environments = state?.environments ?? DEFAULT_ENVIRONMENTS;
    const activeId = state?.activeEnvironment ?? "default";
    return environments.find((e) => e.id === activeId);
  }

  /**
   * Configure credentials for a specific environment
   */
  public async configureEnvironment(
    skillId: string,
    environmentId: string,
    config: Record<string, string | number | boolean>,
  ): Promise<{ success: boolean; error?: string }> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      return { success: false, error: `Skill not found: ${skillId}` };
    }

    const state = this.skillStates.get(skillId) ?? { ...DEFAULT_SKILL_STATE };
    const environments = state.environments ?? DEFAULT_ENVIRONMENTS;

    if (!environments.some((e) => e.id === environmentId)) {
      return {
        success: false,
        error: `Environment "${environmentId}" not found`,
      };
    }

    // Initialize environment configs if not present
    if (!state.environmentConfigs) {
      state.environmentConfigs = {};
    }
    if (!state.environmentConfigs[environmentId]) {
      state.environmentConfigs[environmentId] = {};
    }

    // Store secrets in SecretStorage, others in config
    if (skill.config) {
      for (const field of skill.config) {
        if (config[field.name] !== undefined) {
          if (field.type === "secret") {
            await this.storeSecret(
              skillId,
              field.name,
              String(config[field.name]),
              environmentId,
            );
          } else {
            state.environmentConfigs[environmentId][field.name] =
              config[field.name];
          }
        }
      }
    }

    state.configured = true;
    this.skillStates.set(skillId, state);
    await this.saveSkillStates();

    this.logger.log(
      LogLevel.INFO,
      `Configured environment "${environmentId}" for skill ${skillId}`,
    );

    return { success: true };
  }

  /**
   * Prompt user to create a new environment
   */
  public async promptCreateEnvironment(
    skillId: string,
  ): Promise<SkillEnvironment | undefined> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      vscode.window.showErrorMessage(`Skill not found: ${skillId}`);
      return undefined;
    }

    // Get environment ID
    const id = await vscode.window.showInputBox({
      title: `Create Environment for ${skill.displayName}`,
      prompt: "Enter environment ID (e.g., local, qa, staging, prod)",
      placeHolder: "qa",
      validateInput: (value) => {
        if (!value) return "Environment ID is required";
        if (!/^[a-z][a-z0-9-]*$/.test(value)) {
          return "ID must start with a letter and contain only lowercase letters, numbers, and hyphens";
        }
        const existing = this.getEnvironments(skillId);
        if (existing.some((e) => e.id === value)) {
          return `Environment "${value}" already exists`;
        }
        return undefined;
      },
    });

    if (!id) return undefined;

    // Get display name
    const displayName = await vscode.window.showInputBox({
      title: `Create Environment for ${skill.displayName}`,
      prompt: "Enter display name",
      placeHolder: "QA Environment",
      value: id.toUpperCase(),
    });

    if (!displayName) return undefined;

    // Select color
    const colorOptions: Array<{
      label: string;
      value: SkillEnvironment["color"];
    }> = [
      { label: "$(circle-filled) Blue", value: "blue" },
      { label: "$(circle-filled) Green", value: "green" },
      { label: "$(circle-filled) Yellow", value: "yellow" },
      { label: "$(circle-filled) Red", value: "red" },
      { label: "$(circle-filled) Purple", value: "purple" },
      { label: "$(circle-filled) Gray", value: "gray" },
    ];

    const colorChoice = await vscode.window.showQuickPick(colorOptions, {
      title: "Select environment color",
      placeHolder: "Choose a color to identify this environment",
    });

    const environment: Omit<SkillEnvironment, "createdAt"> = {
      id,
      displayName,
      color: colorChoice?.value ?? "gray",
    };

    const result = await this.createEnvironment(skillId, environment);
    if (result.success) {
      vscode.window.showInformationMessage(
        `Created environment "${displayName}" for ${skill.displayName}`,
      );

      // Ask if user wants to configure it now
      const configure = await vscode.window.showQuickPick(["Yes", "No"], {
        title: `Configure ${displayName} credentials now?`,
      });

      if (configure === "Yes") {
        await this.promptConfigureEnvironment(skillId, id);
      }

      return { ...environment, createdAt: Date.now() };
    } else {
      vscode.window.showErrorMessage(
        `Failed to create environment: ${result.error}`,
      );
      return undefined;
    }
  }

  /**
   * Prompt user to configure an environment's credentials
   */
  public async promptConfigureEnvironment(
    skillId: string,
    environmentId: string,
  ): Promise<boolean> {
    const skill = this.registry.getSkill(skillId);
    if (!skill || !skill.config) {
      vscode.window.showErrorMessage(
        `No configuration available for ${skillId}`,
      );
      return false;
    }

    const env = this.getEnvironments(skillId).find(
      (e) => e.id === environmentId,
    );
    if (!env) {
      vscode.window.showErrorMessage(
        `Environment "${environmentId}" not found`,
      );
      return false;
    }

    const newConfig: Record<string, string | number | boolean> = {};

    for (const field of skill.config) {
      if (!field.required && field.type !== "secret") {
        continue;
      }

      const existingValue = await this.getSecret(
        skillId,
        field.name,
        environmentId,
      );
      const maskedValue = existingValue
        ? `${existingValue.slice(0, 4)}${"*".repeat(Math.min(existingValue.length - 4, 20))}`
        : undefined;

      const input = await vscode.window.showInputBox({
        title: `${skill.displayName} (${env.displayName}): ${field.label}`,
        prompt: field.placeholder ?? `Enter ${field.label}`,
        password: field.type === "secret",
        placeHolder: maskedValue ?? field.placeholder,
        ignoreFocusOut: true,
        validateInput: (value) => {
          if (field.required && !value && !existingValue) {
            return `${field.label} is required`;
          }
          return undefined;
        },
      });

      if (input === undefined) {
        vscode.window.showWarningMessage("Configuration cancelled");
        return false;
      }

      if (input) {
        newConfig[field.name] = input;
      }
    }

    if (Object.keys(newConfig).length > 0) {
      const result = await this.configureEnvironment(
        skillId,
        environmentId,
        newConfig,
      );
      if (result.success) {
        vscode.window.showInformationMessage(
          `${skill.displayName} (${env.displayName}) configured successfully`,
        );
        return true;
      } else {
        vscode.window.showErrorMessage(
          `Failed to save configuration: ${result.error}`,
        );
        return false;
      }
    }

    return false;
  }

  /**
   * Prompt user to switch environment
   */
  public async promptSwitchEnvironment(skillId: string): Promise<boolean> {
    const skill = this.registry.getSkill(skillId);
    if (!skill) {
      vscode.window.showErrorMessage(`Skill not found: ${skillId}`);
      return false;
    }

    const environments = this.getEnvironments(skillId);
    const activeEnv = this.getActiveEnvironment(skillId);

    const options = environments.map((env) => ({
      label: `${env.id === activeEnv?.id ? "$(check) " : ""}${env.displayName}`,
      description: env.id === activeEnv?.id ? "(active)" : "",
      id: env.id,
    }));

    // Add option to create new environment
    options.push({
      label: "$(add) Create New Environment",
      description: "",
      id: "__create__",
    });

    const choice = await vscode.window.showQuickPick(options, {
      title: `${skill.displayName}: Select Environment`,
      placeHolder: `Current: ${activeEnv?.displayName ?? "Default"}`,
    });

    if (!choice) return false;

    if (choice.id === "__create__") {
      const newEnv = await this.promptCreateEnvironment(skillId);
      if (newEnv) {
        return this.switchEnvironment(skillId, newEnv.id).then(
          (r) => r.success,
        );
      }
      return false;
    }

    if (choice.id !== activeEnv?.id) {
      const result = await this.switchEnvironment(skillId, choice.id);
      return result.success;
    }

    return true;
  }
}
