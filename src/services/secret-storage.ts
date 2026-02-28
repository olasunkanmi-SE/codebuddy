import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { APP_CONFIG } from "../application/constant";
import { Orchestrator } from "../orchestrator";
import { IEventPayload } from "../emitter/interface";

export class SecretStorageService implements vscode.Disposable {
  private readonly localStorage: vscode.SecretStorage;
  private readonly logger: Logger;
  private readonly disposables: vscode.Disposable[] = [];
  protected readonly orchestrator: Orchestrator;
  private static instance: SecretStorageService | undefined;
  private apiKeyCache = new Map<string, string>();

  constructor(private readonly context: vscode.ExtensionContext) {
    this.localStorage = context.secrets;
    this.logger = Logger.initialize("LocalStorageManager", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.orchestrator = Orchestrator.getInstance();
    SecretStorageService.instance = this;
    this.registerDisposables();
    this.publishPreferences();
  }

  /**
   * Initialize the singleton instance with the extension context.
   * Must be called once during extension activation before any API key access.
   */
  static initialize(context: vscode.ExtensionContext): SecretStorageService {
    if (!SecretStorageService.instance) {
      new SecretStorageService(context);
    }
    return SecretStorageService.instance!;
  }

  /**
   * Get the singleton instance. Throws if not yet initialized.
   */
  static getInstance(): SecretStorageService {
    if (!SecretStorageService.instance) {
      throw new Error(
        "SecretStorageService not initialized. Call initialize() first.",
      );
    }
    return SecretStorageService.instance;
  }

  registerDisposables() {
    this.disposables.push(
      this.localStorage.onDidChange(this.handleSecretStorageChange.bind(this)),
      vscode.workspace.onDidChangeConfiguration(
        this.handleConfigurationChange.bind(this),
      ),
      this.orchestrator.onUpdateUserPreferences(
        this.handleUpdateSecrets.bind(this),
      ),
      this.orchestrator.onUpdateThemePreferences(
        this.handleUpdateThemePreferences.bind(this),
      ),
    );
  }
  /**
   * Adds a key-value pair to the secret storage.
   * @param key The key to store the value under.
   * @param value The value to store.
   */
  async add(key: string, value: string): Promise<void> {
    await this.localStorage.store(key, value);
  }

  /**
   * Handles updating secret preferences received from an event payload.
   * Currently only stores the username from the preferences.
   * Note: There's a TODO to move sensitive information, especially API keys, to secrets.
   * @param {IEventPayload} payload - Contains type and message data
   * @throws {Error} If message parsing fails
   */
  async handleUpdateSecrets({ type, message }: IEventPayload) {
    try {
      const data = message.message;
      const preferences = JSON.parse(data);
      await this.add("codebuddy-username", preferences.username);
      await this.publishPreferences();
    } catch (error: any) {
      this.logger.error("Error parsing message", error);
      throw new Error("Error parsing message");
    }
  }

  async publishPreferences() {
    const username = await this.get("codebuddy-username");
    const theme = await this.get("codebuddy-theme");
    const config = vscode.workspace.getConfiguration();
    const fontFamily = config.get<string>("font.family") || "JetBrains Mono";
    const fontSize = config.get<number>("chatview.font.size") || 16;
    const enableStreaming =
      config.get<boolean>("codebuddy.enableStreaming") ?? true;
    const nickname = config.get<string>("codebuddy.nickname") || username || "";
    const autoApprove = config.get<boolean>("codebuddy.autoApprove") ?? false;
    const allowFileEdits =
      config.get<boolean>("codebuddy.allowFileEdits") ?? true;
    const allowTerminal =
      config.get<boolean>("codebuddy.allowTerminal") ?? true;
    const verboseLogging =
      config.get<boolean>("codebuddy.verboseLogging") ?? false;
    const indexCodebase =
      config.get<boolean>("codebuddy.indexCodebase") ?? false;
    const contextWindow =
      config.get<string>("codebuddy.contextWindow") || "16k";
    const includeHidden =
      config.get<boolean>("codebuddy.includeHidden") ?? false;
    const maxFileSize = config.get<string>("codebuddy.maxFileSize") || "1";
    const compactMode = config.get<boolean>("codebuddy.compactMode") ?? false;
    const dailyStandupEnabled =
      config.get<boolean>("codebuddy.automations.dailyStandup.enabled") ?? true;
    const codeHealthEnabled =
      config.get<boolean>("codebuddy.automations.codeHealth.enabled") ?? true;
    const dependencyCheckEnabled =
      config.get<boolean>("codebuddy.automations.dependencyCheck.enabled") ??
      true;
    const browserType = config.get<string>("codebuddy.browserType") || "reader";
    const language = config.get<string>("codebuddy.language") || "en";
    const selectedModel = config.get<string>("generativeAi.option") || "Groq";
    const preferences = {
      username: nickname || username,
      theme: theme || "tokyo night", // default theme
      selectedModel,
      fontFamily,
      fontSize,
      enableStreaming,
      autoApprove,
      allowFileEdits,
      allowTerminal,
      verboseLogging,
      indexCodebase,
      contextWindow,
      includeHidden,
      maxFileSize,
      compactMode,
      dailyStandupEnabled,
      codeHealthEnabled,
      dependencyCheckEnabled,
      browserType,
      language,
    };
    this.orchestrator.publish(
      "onGetUserPreferences",
      JSON.stringify(preferences),
    );
  }

  /**
   * Handles updating theme preferences received from an event payload.
   * @param {IEventPayload} payload - Contains type and message data with theme
   * @throws {Error} If message parsing fails
   */
  async handleUpdateThemePreferences({ type, message }: IEventPayload) {
    try {
      const theme = message.theme || message; // Handle both object and string formats
      await this.add("codebuddy-theme", theme);
      await this.publishPreferences();
      this.logger.info(`Theme preference updated to: ${theme}`);
    } catch (error: any) {
      this.logger.error("Error updating theme preferences", error);
      throw new Error("Error updating theme preferences");
    }
  }

  /**
   * Retrieves a value from the secret storage based on the provided key.
   * @param key The key to retrieve the value for.
   * @returns The value associated with the key, or undefined if the key does not exist.
   */
  async get(key: string): Promise<string | undefined> {
    return await this.localStorage.get(key);
  }

  /**
   * Deletes a key-value pair from the secret storage.
   * @param key The key to delete.
   */
  async delete(key: string) {
    await this.localStorage.delete(key);
  }

  /**
   * Handles changes in the secret storage, logging the change and returning the new value.
   * @param event The event containing information about the change.
   * @returns The new value of the changed secret.
   */
  async handleSecretStorageChange(event: vscode.SecretStorageChangeEvent) {
    const value = await this.localStorage.get(event.key);
    this.logger.info(`${event.key}'s value has been changed in SecretStorage`);

    // Update API key cache when a stored API key changes
    if (event.key.startsWith("apikey:")) {
      const configKey = event.key.substring("apikey:".length);
      if (value) {
        this.apiKeyCache.set(configKey, value);
      } else {
        this.apiKeyCache.delete(configKey);
      }
    }

    return value;
  }

  /**
   * Logs changes to the configuration, redacting sensitive information like API keys.
   * @param configKey The configuration key that changed.
   * @param messagePrefix A prefix to add to the log message.
   */
  private logConfigurationChange(configKey: string, messagePrefix: string) {
    const data: any = {};
    const newValue = vscode.workspace
      .getConfiguration()
      .get<string | number>(configKey);
    const sensitiveValues = newValue ? "Configured" : "Not Configured";
    const logMessage =
      typeof newValue === "string" &&
      (configKey.endsWith("apiKey") || configKey.endsWith("apiKeys"))
        ? `${messagePrefix} ${sensitiveValues}`
        : `${messagePrefix} ${newValue}`;
    data[configKey] = newValue;
    this.logger.info(`Configuration change detected: ${logMessage}`);
    this.orchestrator.publish("onConfigurationChange", JSON.stringify(data));
  }

  /**
   * Handles changes in the VS Code configuration, logging relevant changes.
   * @param event The event containing information about the configuration change.
   */
  async handleConfigurationChange(event: vscode.ConfigurationChangeEvent) {
    for (const change of Object.values(APP_CONFIG)) {
      if (event.affectsConfiguration(change)) {
        this.logConfigurationChange(change, "");

        // Auto-persist API key changes from VS Code settings to SecretStorage.
        // This ensures that if a user enters an API key in the regular settings,
        // it is securely moved to the OS keychain for better protection.
        if (change.endsWith("apiKey") || change.endsWith("apiKeys")) {
          const newValue = vscode.workspace
            .getConfiguration()
            .get<string>(change);
          if (
            newValue &&
            newValue !== "apiKey" &&
            newValue !== "not-needed" &&
            newValue !== ""
          ) {
            await this.storeApiKey(change, newValue);
            this.logger.info(`Updated API key in secure storage for ${change}`);
          }
        }
      }
    }
  }

  /**
   * Sets the value of a configuration setting.
   * @param option The configuration option to set.
   * @param value The value to set for the configuration option.
   * @param configurationTarget The scope in which to update the configuration (defaults to Global).
   * @returns A promise that resolves when the configuration has been updated.
   */
  setConfig(
    option: string,
    value: any,
    configurationTarget: vscode.ConfigurationTarget = vscode.ConfigurationTarget
      .Global,
  ): Thenable<void> {
    this.logger.info(
      `Updating configuration: ${option} to ${typeof value === "object" ? JSON.stringify(value) : value}`,
    );
    return vscode.workspace.getConfiguration().update(option, value);
  }

  /**
   * Retrieves the value of the 'generativeAi.option' configuration setting.
   * @returns The value of the 'generativeAi.option' setting, or undefined if not set.
   */
  getOption(option: string): string | undefined {
    return vscode.workspace.getConfiguration().get<string>(option);
  }

  /**
   * Sets the value of the 'generativeAi.option' configuration setting.
   * @param value The value to set for the 'generativeAi.option' setting.
   * @returns A promise that resolves when the configuration has been updated.
   */
  setModelOption(value: string): Thenable<void> {
    return vscode.workspace
      .getConfiguration()
      .update("generativeAi.option", value, vscode.ConfigurationTarget.Global);
  }

  /**
   * Migrate API keys from VS Code settings to OS-level SecretStorage.
   * Called once during extension activation. Handles three cases:
   * - First run: copies settings values into SecretStorage.
   * - Subsequent runs: loads existing SecretStorage values into cache.
   * - Offline edits: if a user changed a key in settings.json while the
   *   extension was inactive, the new value is synced to SecretStorage.
   * Original settings values are left unchanged for backward compatibility.
   */
  async migrateApiKeys(): Promise<void> {
    const apiKeyConfigs = [
      APP_CONFIG.geminiKey,
      APP_CONFIG.groqApiKey,
      APP_CONFIG.anthropicApiKey,
      APP_CONFIG.deepseekApiKey,
      APP_CONFIG.openaiApiKey,
      APP_CONFIG.qwenApiKey,
      APP_CONFIG.glmApiKey,
      APP_CONFIG.tavilyApiKey,
      APP_CONFIG.localApiKey,
    ];

    for (const configKey of apiKeyConfigs) {
      const existingSecret = await this.get(`apikey:${configKey}`);
      const settingsValue = vscode.workspace
        .getConfiguration()
        .get<string>(configKey);
      const isValidSettingsValue =
        settingsValue &&
        settingsValue !== "apiKey" &&
        settingsValue !== "not-needed" &&
        settingsValue !== "";

      if (
        existingSecret &&
        isValidSettingsValue &&
        settingsValue !== existingSecret
      ) {
        // Settings value was changed while extension was inactive — sync to SecretStorage
        await this.add(`apikey:${configKey}`, settingsValue);
        this.apiKeyCache.set(configKey, settingsValue);
        this.logger.info(
          `Synced updated API key for ${configKey} to secure storage`,
        );
      } else if (existingSecret) {
        this.apiKeyCache.set(configKey, existingSecret);
      } else if (isValidSettingsValue) {
        // First-time migration from settings to SecretStorage
        await this.add(`apikey:${configKey}`, settingsValue);
        this.apiKeyCache.set(configKey, settingsValue);
        this.logger.info(`Migrated API key for ${configKey} to secure storage`);
      }
    }
  }

  /**
   * Get an API key from the secure cache (populated from OS keychain on init).
   * Returns undefined if no key is stored for this config key.
   */
  getApiKey(configKey: string): string | undefined {
    return this.apiKeyCache.get(configKey);
  }

  /**
   * Store an API key in SecretStorage (OS keychain) and update the local cache.
   */
  async storeApiKey(configKey: string, value: string): Promise<void> {
    await this.add(`apikey:${configKey}`, value);
    this.apiKeyCache.set(configKey, value);
  }

  /**
   * Disposes of all disposables (event listeners, etc.) managed by this service.
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    SecretStorageService.instance = undefined;
  }
}
