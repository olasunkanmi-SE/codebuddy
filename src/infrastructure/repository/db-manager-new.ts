import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel } from "../logger/logger";

export class DbManager {
  private db: any = undefined;
  private static instance: DbManager;
  private readonly logger: Logger;
  private dbPath: string | undefined;

  private constructor() {
    this.logger = Logger.initialize("DbManager", {
      minLevel: LogLevel.DEBUG,
    });
  }

  static getInstance(): DbManager {
    if (!DbManager.instance) {
      DbManager.instance = new DbManager();
    }
    return DbManager.instance;
  }

  getDB(): any {
    return this.db;
  }

  // Stub methods for chat history functionality
  run(sql: string, ...params: any[]): void {
    this.logger.warn("DbManager.run called but database is disabled");
  }

  get(sql: string, ...params: any[]): any {
    this.logger.warn("DbManager.get called but database is disabled");
    return undefined;
  }

  all(sql: string, ...params: any[]): any[] {
    this.logger.warn("DbManager.all called but database is disabled");
    return [];
  }

  close(): void {
    this.logger.info("DbManager.close called");
  }
}

export const dbManager = DbManager.getInstance();
