// import { Client, createClient } from "@libsql/client";
// import * as vscode from "vscode";
// import { Logger, LogLevel } from "../logger/logger";

// class DatabaseManager {
//   private client: Client | undefined;
//   private static instance: DatabaseManager;
//   private readonly logger: Logger;
//   private constructor() {
//     this.logger = Logger.initialize("DatabaseManager", {
//       minLevel: LogLevel.DEBUG,
//     });
//   }

//   /**
//    * Returns a singleton instance of the DatabaseManager, lazy-loading it if necessary.
//    * This ensures that only one instance of the DatabaseManager is created throughout the application.
//    */
//   public static getInstance(): DatabaseManager {
//     if (!DatabaseManager.instance) {
//       DatabaseManager.instance = new DatabaseManager();
//     }
//     return DatabaseManager.instance;
//   }

//   /**
//    * Retrieves a client instance, throwing an error if no client is connected.
//    * Use this method to access the connected client, ensuring that a connection is established before proceeding.
//    */
//   public getClient(): Client {
//     if (!this.client) {
//       throw new Error("Database not connected.");
//     }
//     return this.client;
//   }

//   /**
//    * Disconnects the current client, releasing any allocated resources and resetting the client reference.
//    * A confirmation message is displayed upon successful disconnection.
//    */
//   public async disconnect() {
//     if (this.client) {
//       await this.client.close();
//       this.client = undefined;
//       vscode.window.showInformationMessage("Database disconnected");
//     }
//   }

//   /**
//    * Establishes a connection to the database with retry mechanism.
//    * Attempts to connect up to 3 times with exponential backoff.
//    * Performs a health check after each connection attempt.
//    * Throws an error if all connection attempts fail.
//    *
//    * @param url The database connection URL
//    * @throws Error if connection fails after max retries
//    */
//   public async connect(url: string): Promise<void> {
//     if (this.client) {
//       this.logger.info("Client already connected");
//       return;
//     }

//     const maxRetries = 3;
//     let retryCount = 0;

//     while (retryCount < maxRetries) {
//       try {
//         this.client = createClient({
//           url: url,
//         });

//         const connected = await this.healthCheck();
//         if (connected) {
//           this.logger.info("Database connected successfully");
//           return;
//         }
//       } catch (error) {
//         this.logger.error(`Failed to connect to database`, error);
//         retryCount++;
//         if (retryCount >= maxRetries) {
//           this.logger.error(
//             `Failed to connect to database after ${maxRetries} attempts}`,
//             error,
//           );
//           throw error;
//         }
//         await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
//       }
//     }
//   }

//   /**
//    * Performs a health check on the database connection.
//    * Executes a simple query to verify connectivity.
//    *
//    * @returns A boolean indicating whether the health check passed
//    */
//   async healthCheck(): Promise<boolean> {
//     try {
//       return Boolean(await this.client?.execute("SELECT 1"));
//     } catch (error) {
//       this.logger.error("Failed to connect to database", error);
//       return false;
//     }
//   }
// }

// export const dbManager = DatabaseManager.getInstance();
