import { Database as DBInstance } from "better-sqlite3";
import { ICodeRepository } from "../../application/interfaces/code.repository.interface";
import { Logger, LogLevel } from "../logger/logger";

export class CodeRepository implements ICodeRepository {
  private readonly client: DBInstance | undefined;
  private static instance: CodeRepository;
  private readonly logger: Logger;
  private constructor() {
    this.logger = Logger.initialize("CodeRepository", {
      minLevel: LogLevel.DEBUG,
    });
    // this.client = dbManager.getDB();
  }

  public static getInstance(): CodeRepository {
    if (!CodeRepository.instance) {
      CodeRepository.instance = new CodeRepository();
    }
    return CodeRepository.instance;
  }

  // async createFunctionsTable(): Promise<ResultSet | undefined> {
  //   let transaction;
  //   try {
  //     transaction = await this.client?.transaction();
  //     const table = await transaction?.execute(createTableQuery());
  //     if (table) {
  //       this.logger.info("Database initialized successfully");
  //     }
  //     await transaction?.execute(createIndex());
  //     await transaction?.commit();
  //     return table;
  //   } catch (error) {
  //     if (transaction) {
  //       await transaction.rollback();
  //     }
  //     this.logger.error("Failed to initialize database", error);
  //     throw error;
  //   } finally {
  //     if (transaction) {
  //       transaction.close();
  //     }
  //   }
  // }

  // async insertFunctions(values: string): Promise<ResultSet | undefined> {
  //   let retries = 0;
  //   const maxRetries = 5;
  //   const retryDelay = 100;
  //   try {
  //     await this.createFunctionsTable();
  //   } catch (error) {
  //     this.logger.error("Failed to create table", error);
  //     throw error;
  //   }
  //   while (retries < maxRetries) {
  //     try {
  //       const query = insertDataQuery(values);
  //       const result = await this.client?.execute(query);
  //       if (result) {
  //         this.logger.info("Database initialized successfully");
  //       }
  //       return result;
  //     } catch (error: any) {
  //       if (error.code === "SQLITE_BUSY") {
  //         retries++;
  //         await new Promise((resolve) => setTimeout(resolve, retryDelay));
  //       } else {
  //         this.logger.error("Failed to initialize database", error);
  //         throw new Error(`Failed to insert into table after ${maxRetries} retries`);
  //       }
  //     }
  //   }
  // }

  // async searchSimilarFunctions(queryEmbeddings: number[], limit: number): Promise<Row[] | undefined> {
  //   try {
  //     const query = selectFunctionProps();
  //     const result: ResultSet | undefined = await this.client?.execute(
  //       `SELECT class_name,
  //         function_name,
  //         file_path,
  //         created_at FROM vector_top_k('code_functions_idx', '${JSON.stringify(queryEmbeddings)}', ${limit}) JOIN code_functions ON code_functions.rowid = id`
  //     );
  //     return result ? result.rows : undefined;
  //   } catch (error) {
  //     console.error("Failed to search similar code functions", error);
  //     throw error;
  //   }
  // }
}
