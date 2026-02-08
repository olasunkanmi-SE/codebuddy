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
   * Ensures .gitignore is configured to allow skills/rules but ignore logs/data
   */
  async ensureCorrectGitIgnore(workspaceRoot: string): Promise<void> {
    const gitIgnorePath = path.join(workspaceRoot, ".gitignore");
    const rules = [
      "# CodeBuddy",
      ".codebuddy/*",
      "!.codebuddy/skills/",
      "!.codebuddy/rules/",
      "!.codebuddy/prompts/",
      "!.codebuddy/config.json",
    ];

    let currentContent = "";
    if (fs.existsSync(gitIgnorePath)) {
      currentContent = fs.readFileSync(gitIgnorePath, "utf8");
    }

    // Check if we need to update
    // If we find the old ".codebuddy" (exact line), we might want to replace it
    // Or if we don't find our new rules.

    let newContent = currentContent;
    let modified = false;

    // 1. Remove strict ".codebuddy" ignore if present (as it blocks exceptions)
    const lines = newContent.split(/\r?\n/);
    const cleanLines = lines.filter(
      (line) => line.trim() !== ".codebuddy" && line.trim() !== "/.codebuddy",
    );

    if (cleanLines.length !== lines.length) {
      newContent = cleanLines.join("\n");
      modified = true;
    }

    // 2. Append new rules if not present
    const missingRules = rules.filter((rule) => !newContent.includes(rule));

    if (missingRules.length > 0) {
      if (!newContent.endsWith("\n") && newContent.length > 0) {
        newContent += "\n";
      }
      newContent += missingRules.join("\n") + "\n";
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(gitIgnorePath, newContent, "utf8");
      this.logger.info("Updated .gitignore to support committed skills/rules");
    }
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
