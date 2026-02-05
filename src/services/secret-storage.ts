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

  constructor(private readonly context: vscode.ExtensionContext) {
    this.localStorage = context.secrets;
    this.logger = Logger.initialize("LocalStorageManager", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.orchestrator = Orchestrator.getInstance();
    this.registerDisposables();
    this.publishPreferences();
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
    const preferences = {
      username,
      theme: theme || "tokyo night", // default theme
      fontFamily,
      fontSize,
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
   * Disposes of all disposables (event listeners, etc.) managed by this service.
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
