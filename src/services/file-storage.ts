// Create a new file: src/storage/database.ts

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

export class FileStorage implements IStorage {
  private readonly storagePath: string;

  constructor() {
    this.storagePath = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "", ".codebuddy");
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.storagePath, `${key}.json`);
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const filePath = this.getFilePath(key);
      if (!fs.existsSync(filePath)) {
        return undefined;
      }
      const data = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error reading data for key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      await fs.promises.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw new Error(`Failed to store data: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error(`Error deleting data for key ${key}:`, error);
    }
  }

  async has(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }
}
