import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel } from "../logger/logger";
import { FileManager } from "../../services/file-manager";
import { dbManager } from "./database-manager";

export class InitDatabaseManager implements vscode.Disposable {
  private static instance: InitDatabaseManager;
  private isConnected: boolean = false;
  private connectionType: "file" | "memory" = "file";
  private readonly logger: Logger;

  private constructor() {
    this.logger = Logger.initialize("InitDatabaseManager", {
      minLevel: LogLevel.DEBUG,
    });
  }

  /**
   * Returns a singleton instance of the DatabaseManager, lazy-loading it if necessary.
   * This ensures that only one instance of the DatabaseManager is created throughout the application.
   */
  public static getInstance(): InitDatabaseManager {
    InitDatabaseManager.instance ??= new InitDatabaseManager();

    return InitDatabaseManager.instance;
  }

  async initialize(context: vscode.ExtensionContext): Promise<boolean> {
    try {
      await this.createFileDB(context);
      await this.connectToDatabase(context);
      this.isConnected = true;
      return true;
    } catch (error) {
      this.logger.error(
        "Database initialization failed, continuing with limited functionality",
        error,
      );
      vscode.window.showWarningMessage(
        "Some features requiring database access will be limited. The extension will continue to function.",
      );
      return false;
    }
  }

  async createFileDB(context: vscode.ExtensionContext) {
    try {
      const fileUploader = new FileManager(context, "repo");
      const files = await fileUploader.getFiles();
      if (!files?.find((file) => file.includes("dev.db"))) {
        await fileUploader.createFile("dev.db");
      }
    } catch (error: any) {
      this.logger.warn("Unable to create DB file, will try to continue", error);
      // Don't throw, just log and continue
    }
  }

  async connectToDatabase(context: vscode.ExtensionContext) {
    const dbDir = path.join(context.extensionPath, "repo");
    const dbPath = path.join(dbDir, "dev.db");
    const isWindows = dbPath.includes("\\");
    const filePath = isWindows ? `file:/${dbPath}` : `file:${dbPath}`;

    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch (error) {
      this.logger.warn("Failed to create database directory", error);
      return this.setupInMemoryDatabase();
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await dbManager.connect(filePath);
        this.connectionType = "file";
        return;
      } catch (error: any) {
        this.logger.warn(`Attempt ${attempt} to connect to DB failed`, error);
        if (attempt === maxRetries) {
          this.logger.warn("Switching to in-memory database");
          return this.setupInMemoryDatabase();
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  async setupInMemoryDatabase() {
    try {
      await dbManager.connect(":memory:");
      this.connectionType = "memory";
      vscode.window.showInformationMessage(
        "Using in-memory database due to connection issues.",
      );
    } catch (error) {
      this.logger.error("Failed to set up in-memory database", error);
      // Don't throw, just set as not connected
      this.isConnected = false;
    }
  }

  isDbConnected(): boolean {
    return this.isConnected;
  }

  dispose() {
    try {
      if (this.isConnected) {
        dbManager.close();
        this.isConnected = false;
      }
    } catch (error) {
      this.logger.error("Error closing database connection", error);
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.isConnected) {
        await dbManager.close();
        this.isConnected = false;
      }
    } catch (error) {
      this.logger.error("Error closing database connection", error);
    }
  }
}

export const dbManagerInstance = InitDatabaseManager.getInstance();
