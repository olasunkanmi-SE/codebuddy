import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { IFileUploader } from "../application/interfaces";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { Orchestrator } from "../agents/orchestrator";

export class FileManager implements IFileUploader {
  private static instance: FileManager;
  private readonly logger: Logger;
  protected readonly orchestrator: Orchestrator;
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly fileDir: string,
  ) {
    this.orchestrator = Orchestrator.getInstance();
    this.logger = Logger.initialize("FileManager", {
      minLevel: LogLevel.DEBUG,
    });
    this.fileDir = path.join(this.context.extensionPath, this.fileDir);
    if (!fs.existsSync(this.fileDir)) {
      fs.mkdirSync(this.fileDir);
    }
  }

  static initialize(context: vscode.ExtensionContext, fileDir: string) {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager(context, fileDir);
    }
    return FileManager.instance;
  }

  /**
   * Uploads a file to the file directory asynchronously.
   * This function reads the file content, deletes any existing files,
   * and writes the new file to the file system.
   * @param file - The file to upload, represented as a vscode Uri
   * @throws {Error} If the upload process fails
   * */
  async uploadFile(file: vscode.Uri): Promise<void> {
    try {
      const content = await fs.promises.readFile(file.fsPath, "utf8");
      const fileName = path.basename(file.fsPath);
      const files = await this.getFiles();
      // if (files.length > 0) {
      //   await this.deleteFiles(files);
      // }
      // Create a global state this.context.globalState
      const filePath = path.join(this.fileDir, fileName);
      if (fs.existsSync(filePath)) {
        this.logger.info(`A file with the name ${fileName} already exists.`);
        return;
      }

      await fs.promises.writeFile(filePath, content);
      vscode.window.showInformationMessage(`File uploaded successfully`);
      this.orchestrator.publish(
        "onFileUpload",
        JSON.stringify({ fileName, filePath }),
      );
    } catch (error: any) {
      this.logger.info(`Failed to upload file, please try again`);
      throw error;
    }
  }

  async getFileNames(): Promise<string[]> {
    const files = await this.getFiles();
    return files.map((file) => {
      const fileName = path.basename(file);
      return fileName;
    });
  }

  async readFileAsync(filePath: string): Promise<string> {
    const fullPath = path.resolve(filePath);
    try {
      const content = await fs.promises.readFile(fullPath, "utf8");
      return content;
    } catch (error: any) {
      this.logger.info(`Error reading while file`);
      throw error;
    }
  }

  /**
   * Deletes multiple files asynchronously.
   * This function maps over the provided file names, constructs the full file paths,
   * and uses fs.promises.unlink to delete the files.
   * @param files - An array of file names to delete
   * @throws {Error} If any of the files cannot be deleted
   * */
  async deleteFiles(files: string[]): Promise<void> {
    try {
      const deletePromises = files.map((file) => {
        const fileName = path.basename(file);
        return fs.promises.unlink(path.join(this.fileDir, fileName));
      });
      await Promise.all(deletePromises);
    } catch (error: any) {
      this.logger.info(`Unable to delete files`);
      throw error;
    }
  }

  /**
   * Asynchronously retrieves a list of file files from the designated directory.
   * @returns A Promise that resolves to an array of file paths (strings)
   * @throws {Error} If an error occurs while reading the directory
   */
  async getFiles(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.fileDir);
      return files.map((file) => path.join(this.fileDir, file));
    } catch (error: any) {
      this.logger.info(`Error fetching the files`);
      throw error;
    }
  }

  /**
   * Handles uploading a file asynchronously.
   * Prompts the user to select a text file, uploads it, and handles any errors that occur.
   * @returns A Promise that resolves when the upload is complete or rejected with an error
   * */

  async uploadFileHandler(): Promise<void> {
    const MAX_FILE_SIZE = 40 * 1024 * 1024; // 5MB, adjust as needed
    const file: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        files: ["pdf", "txt", "csv"],
      },
    });

    if (file?.[0]) {
      try {
        const fileSize = fs.statSync(file[0].fsPath).size;

        if (fileSize > MAX_FILE_SIZE) {
          this.logger.info(
            `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
          );
          return;
        }

        await this.uploadFile(file[0]);
      } catch (error: any) {
        throw error;
      }
    }
  }

  /**
   * Creates a new file asynchronously.
   * This function checks if the file exists, and if not, creates it.
   * @param filename - The name of the file to create
   * @param content - The content to write to the file
   * @throws {Error} If the file cannot be created
   */
  async createFile(filename: string): Promise<boolean> {
    try {
      let created = false;
      const filePath = path.join(this.fileDir, filename);
      //TODO After upload sace the file url in a long term memory config DB. This application should have a long term memory.
      if (!fs.existsSync(filePath)) {
        await fs.promises.writeFile(filePath, "");
        this.logger.info(`File ${filename} created successfully`);
        created = true;
      } else {
        this.logger.info(`File ${filename} already exists`);
      }
      return created;
    } catch (error: any) {
      this.logger.info(`Failed to create file: ${error.message}`);
      throw error;
    }
  }
}
