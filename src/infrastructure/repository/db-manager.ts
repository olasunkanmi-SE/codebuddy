import Database, { Database as DBInstance, Statement } from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel } from "../logger/logger";
export class DbManager {
  private db: DBInstance | undefined;
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

  getDB(): DBInstance {
    if (!this.db) {
      throw new Error("Database not open. Call open() first.");
    }
    return this.db;
  }

  open(storagePath: string, dbName: string = "codebuddy_db.sqlite"): void {
    if (this.db) {
      this.logger.info("Database already open");
      return;
    }

    try {
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
        this.logger.info(`Created storage directory: ${storagePath}`);
      }
      this.dbPath = path.join(storagePath, dbName);
      this.logger.info(`Opening database at: ${this.dbPath}`);

      this.db = new Database(this.dbPath, {
        verbose: (message: any, ...additionalArgs: any[]) =>
          this.logger.debug(message, ...additionalArgs),
      });

      this.db.pragma("journal_mode = WAL");
      this.db.exec("SELECT 1");
      this.logger.info("Database opened successfully");
    } catch (error: any) {
      this.db = undefined;
      this.dbPath = undefined;
      this.logger.error(`Failed to open database: ${error.message}`);
      throw error;
    }
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.logger.info("Database closed successfully");
      } catch (error: any) {
        this.logger.error(`Failed to close database: ${error.message}`);
      } finally {
        this.db = undefined;
        this.dbPath = undefined;
      }
    } else {
      this.logger.info("Database is already closed or not open");
    }
  }

  healthCheck(): boolean {
    if (!this.db) {
      this.logger.error("Database is not open");
      return false;
    }
    try {
      this.db.prepare("SELECT 1").get();
      this.logger.info("Database health check passed");
      return true;
    } catch (error: any) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return false;
    }
  }

  run(sql: string, ...params: any[]) {
    if (!this.db) {
      throw new Error("Database not open");
    }
    try {
      const stmt: Statement = this.db.prepare(sql);
      return stmt.run(...params);
    } catch (error: any) {
      this.logger.error(`Failed to run SQL: ${error.message}`);
      throw error;
    }
  }

  public get(sql: string, ...params: any[]) {
    if (!this.db) {
      throw new Error("Database not open");
    }
    try {
      const stmt: Statement = this.db.prepare(sql);
      return stmt.get(...params);
    } catch (error: any) {
      this.logger.error(`Failed to get data: ${error.message}`);
      throw error;
    }
  }

  public all(sql: string, ...params: any[]) {
    if (!this.db) {
      throw new Error("Database not open");
    }
    try {
      const stmt: Statement = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error: any) {
      this.logger.error(`Failed to get all data: ${error.message}`);
      throw error;
    }
  }
  public iterate(sql: string, ...params: any[]): IterableIterator<any> {
    if (!this.db) {
      throw new Error("Database not open");
    }
    try {
      const stmt: Statement = this.db.prepare(sql);
      return stmt.iterate(...params);
    } catch (error: any) {
      this.logger.error(`Failed to iterate data: ${error.message}`);
      throw error;
    }
  }

  public transaction<F extends (...args: any[]) => any>(
    fn: F,
  ): (...args: Parameters<F>) => ReturnType<F> {
    if (!this.db) {
      throw new Error("Database not open");
    }
    try {
      const transaction = this.db.transaction(fn);
      return (...args: any) => transaction(...args);
    } catch (error: any) {
      this.logger.error(`Failed to create transaction: ${error.message}`);
      throw error;
    }
  }

  public pragma(sql: string, options?: any): any {
    if (!this.db) {
      throw new Error("Database not open");
    }
    try {
      return this.db.pragma(sql, options);
    } catch (error: any) {
      this.logger.error(`Failed to execute pragma: ${error.message}`);
      throw error;
    }
  }
}
export const dbManager = DbManager.getInstance();
