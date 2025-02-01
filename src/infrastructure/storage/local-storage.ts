import * as vscode from "vscode";
import { Logger } from "../logger/logger";

export class LocalStorageManager {
  private readonly localStorage: vscode.SecretStorage;
  private readonly logger: Logger;
  constructor(context: vscode.ExtensionContext) {
    this.localStorage = context.secrets;
    this.logger = new Logger("localStorageManager");
    this.localStorage.onDidChange(this.handleOnChange.bind(this));
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

  async handleOnChange(event: vscode.SecretStorageChangeEvent) {
    const value = await this.localStorage.get(event.key);
    this.logger.info(`Key: ${event.key}, Value: ${value}`);
  }
}
