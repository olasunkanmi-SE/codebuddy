import { ICodeRepository } from "../../application/interfaces/code.repository.interface";
import { Client, createClient, ResultSet, Row } from "@libsql/client";
import { Logger } from "../logger/logger";
import { createTableQuery, insertDataQuery, selectFunctionProps } from "./sql";

export class CodeRepository implements ICodeRepository {
  private client: Client | undefined;
  private static instance: CodeRepository;
  private readonly logger: Logger;
  private constructor() {
    this.logger = new Logger("CodeRepository");
  }

  public static async createInstance(): Promise<CodeRepository> {
    if (!CodeRepository.instance) {
      CodeRepository.instance = new CodeRepository();
      await CodeRepository.instance.init();
    }
    return CodeRepository.instance;
  }

  private async connectDB(): Promise<Client> {
    try {
      return (this.client = createClient({
        url: "file:dev.db",
      }));
    } catch (error) {
      this.logger.error("Failed to initialize database", error);
      throw error;
    }
  }

  private async init(): Promise<void> {
    try {
      this.client = await this.connectDB();
    } catch (error) {
      this.logger.error("Failed to initialize database", error);
      throw error;
    }
  }

  public static getInstance(): CodeRepository {
    if (!CodeRepository.instance) {
      CodeRepository.instance = new CodeRepository();
    }
    return CodeRepository.instance;
  }

  async CreateTable(): Promise<ResultSet[] | undefined> {
    try {
      const query = createTableQuery();
      const table = await this.client?.batch(query, "write");
      if (table) {
        this.logger.info("Database initialized successfully");
      }
      return table;
    } catch (error) {
      this.logger.error("Failed to initialize database", error);
      throw error;
    }
  }

  async InsertData(values: string) {
    try {
      const query = insertDataQuery(values);
      const table = await this.client?.batch(query, "write");
      if (table) {
        this.logger.info("Database initialized successfully");
      }
      return table;
    } catch (error) {
      this.logger.error("Failed to initialize database", error);
      throw error;
    }
  }

  async searchSimilarFunctions(
    queryEmbeddings: number[],
    limit: number
  ): Promise<Row[] | undefined> {
    try {
      const query = selectFunctionProps();
      const result: ResultSet | undefined = await this.client?.execute({
        sql: query,
        args: [JSON.stringify(queryEmbeddings), limit],
      });
      return result ? result.rows : undefined;
    } catch (error) {
      this.logger.error("Failed to search similar code functions", error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return Boolean(await this.client?.execute("SELECT 1"));
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.client?.close();
      this.logger.info("Database connection closed");
    } catch (error) {
      this.logger.error("Failed to close database connection", error);
      throw error;
    }
  }
}
