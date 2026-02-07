import * as path from "path";
import { IFileUploader } from "../application/interfaces";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { Orchestrator } from "../orchestrator";
import { EditorHostService } from "./editor-host.service";
import { FileType } from "../interfaces/editor-host";

export class FileManager implements IFileUploader {
  private static instance: FileManager;
  private readonly logger: Logger;
  protected readonly orchestrator: Orchestrator;
  constructor(
    private readonly context: any,
    private readonly fileDir: string,
  ) {
    this.orchestrator = Orchestrator.getInstance();
    this.logger = Logger.initialize("FileManager", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.fileDir = path.join(this.context.extensionPath, this.fileDir);
    // Directory creation moved to ensureFileDir to handle async IEditorHost
  }

  private async ensureFileDir(): Promise<void> {
    const host = EditorHostService.getInstance().getHost();
    try {
      await host.workspace.fs.stat(this.fileDir);
    } catch {
      await host.workspace.fs.createDirectory(this.fileDir);
    }
  }

  static initialize(context: any, fileDir: string) {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager(context, fileDir);
    }
    return FileManager.instance;
  }

  /**
   * Uploads a file to the file directory asynchronously.
   * This function reads the file content, deletes any existing files,
   * and writes the new file to the file system.
   * @param file - The file to upload, represented as a file path string
   * @throws {Error} If the upload process fails
   * */
  async uploadFile(file: string): Promise<void> {
    try {
      await this.ensureFileDir();
      const host = EditorHostService.getInstance().getHost();
      const content = await host.workspace.fs.readFile(file);
      const contentStr = new TextDecoder().decode(content);
      const fileName = path.basename(file);
      const files = await this.getFiles();
      // if (files.length > 0) {
      //   await this.deleteFiles(files);
      // }
      // Create a global state this.context.globalState
      const filePath = path.join(this.fileDir, fileName);

      let exists = false;
      try {
        await host.workspace.fs.stat(filePath);
        exists = true;
      } catch {
        exists = false;
      }

      if (exists) {
        this.logger.info(`A file with the name ${fileName} already exists.`);
        return;
      }

      await host.workspace.fs.writeFile(filePath, content);
      EditorHostService.getInstance()
        .getHost()
        .window.showInformationMessage(`File uploaded successfully`);
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
      const host = EditorHostService.getInstance().getHost();
      const content = await host.workspace.fs.readFile(fullPath);
      return new TextDecoder().decode(content);
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
      await this.ensureFileDir();
      const host = EditorHostService.getInstance().getHost();
      const deletePromises = files.map((file) => {
        const fileName = path.basename(file);
        return host.workspace.fs.delete(path.join(this.fileDir, fileName));
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
      await this.ensureFileDir();
      const host = EditorHostService.getInstance().getHost();
      const files = await host.workspace.fs.readDirectory(this.fileDir);
      return files.map(([file]) => path.join(this.fileDir, file));
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
    const filePaths = await EditorHostService.getInstance()
      .getHost()
      .window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          files: ["pdf", "txt", "csv"],
        },
      });

    if (filePaths?.[0]) {
      const host = EditorHostService.getInstance().getHost();
      const stat = await host.workspace.fs.stat(filePaths[0]);
      const fileSize = stat.size;

      if (fileSize > MAX_FILE_SIZE) {
        this.logger.info(
          `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        );
        return;
      }

      await this.uploadFile(filePaths[0]);
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
      await this.ensureFileDir();
      let created = false;
      const filePath = path.join(this.fileDir, filename);
      const host = EditorHostService.getInstance().getHost();

      let exists = false;
      try {
        await host.workspace.fs.stat(filePath);
        exists = true;
      } catch {
        exists = false;
      }

      //TODO After upload sace the file url in a long term memory config DB. This application should have a long term memory.
      if (!exists) {
        await host.workspace.fs.writeFile(filePath, new Uint8Array(0));
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
