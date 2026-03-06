// Create a new file: src/storage/database.ts

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

export class FileStorage implements IStorage {
  private storagePath = "";
  private readonly logger: Logger;

  constructor() {
    this.createCodeBuddyFolder();
    this.logger = Logger.initialize(FileStorage.name, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  async createCodeBuddyFolder() {
    const workSpaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    this.storagePath = path.join(workSpaceRoot, ".codebuddy");
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
    await this.ensureCorrectGitIgnore(workSpaceRoot);
  }

  /**
   * Ensures .codebuddy is in .gitignore
   */
  async ensureCorrectGitIgnore(workspaceRoot: string): Promise<void> {
    const gitIgnorePath = path.join(workspaceRoot, ".gitignore");
    const rule = ".codebuddy";

    let currentContent = "";
    if (fs.existsSync(gitIgnorePath)) {
      currentContent = fs.readFileSync(gitIgnorePath, "utf8");
    }

    // Already has the rule
    const lines = currentContent.split(/\r?\n/);
    if (lines.some((line) => line.trim() === rule)) {
      return;
    }

    // Remove old granular rules if present
    const oldRules = [
      ".codebuddy/*",
      "!.codebuddy/skills/",
      "!.codebuddy/rules/",
      "!.codebuddy/prompts/",
      "!.codebuddy/config.json",
      "# CodeBuddy",
    ];
    const cleanLines = lines.filter((line) => !oldRules.includes(line.trim()));

    let newContent = cleanLines.join("\n");
    if (!newContent.endsWith("\n") && newContent.length > 0) {
      newContent += "\n";
    }
    newContent += rule + "\n";

    fs.writeFileSync(gitIgnorePath, newContent, "utf8");
    this.logger.info("Updated .gitignore with .codebuddy");
  }

  /**
   * Legacy method - kept for compatibility but unused internally now
   */
  async updateGitIgnore(workspaceRoot: string, pattern: string): Promise<void> {
    // No-op to prevent regression to old behavior
    return;
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
    } catch (error: any) {
      this.logger.error(`Error reading data for key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(value, null, 2),
        "utf-8",
      );
    } catch (error: any) {
      this.logger.error(`Error storing data for key ${key}:`, error);
      throw new Error(`Failed to store data: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error: any) {
      this.logger.error(`Error deleting data for key ${key}:`, error);
    }
  }

  async has(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }
}
