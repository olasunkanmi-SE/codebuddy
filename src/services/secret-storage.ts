import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { APP_CONFIG } from "../application/constant";
import { Orchestrator } from "../agents/orchestrator";

export class SecretStorageService implements vscode.Disposable {
  private readonly localStorage: vscode.SecretStorage;
  private readonly logger: Logger;
  private readonly disposables: vscode.Disposable[] = [];
  protected readonly orchestrator: Orchestrator;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.localStorage = context.secrets;
    this.logger = Logger.initialize("LocalStorageManager", {
      minLevel: LogLevel.DEBUG,
    });
    this.orchestrator = Orchestrator.getInstance();
    this.disposables.push(
      this.localStorage.onDidChange(this.handleSecretStorageChange.bind(this)),
    );
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(
        this.handleConfigurationChange.bind(this),
      ),
    );
  }

  async add(key: string, value: string): Promise<void> {
    await this.localStorage.store(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    return await this.localStorage.get(key);
  }

  async delete(key: string) {
    await this.localStorage.delete(key);
  }

  async handleSecretStorageChange(event: vscode.SecretStorageChangeEvent) {
    const value = await this.localStorage.get(event.key);
    this.logger.info(`${event.key}'s value has been changed in SecretStorage`);
    return value;
  }

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

  async handleConfigurationChange(event: vscode.ConfigurationChangeEvent) {
    for (const change of Object.values(APP_CONFIG)) {
      if (event.affectsConfiguration(change)) {
        this.logConfigurationChange(change, "");
      }
    }
  }

  getModelOption(): string | undefined {
    return vscode.workspace.getConfiguration().get<string>("option");
  }

  setModelOption(value: string): Thenable<void> {
    return vscode.workspace
      .getConfiguration()
      .update("generativeAi.option", value, vscode.ConfigurationTarget.Global);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
