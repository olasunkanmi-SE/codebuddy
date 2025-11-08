import * as vscode from "vscode";
import { FSPROPS } from "../application/constant";
import { IWorkspaceInfo } from "../application/interfaces";
import { handleError } from "../utils/utils";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class FileService {
  readonly logger: Logger;
  private static instance: FileService;
  constructor() {
    this.logger = Logger.initialize("FileService", {
      minLevel: LogLevel.DEBUG,
    });
  }

  static getInstance() {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  getWorkspaceInfo(dir: string): IWorkspaceInfo | undefined {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw Error("root workspace folder not found");
      }
      return {
        root: workspaceFolder.uri,
        srcPath: vscode.Uri.joinPath(workspaceFolder.uri, dir).fsPath,
      };
    } catch (error: any) {
      this.logger.error("Unable to get workspace ${dir}", error);
      throw error;
    }
  }

  // This is broken. Fix this such that it returns all files regardless if it is .ts files or not
  // Similar implementation has been applied in workspace space service
  // This is needed for code indexing feature for Typescript and general documentation architecture of any programming language https://github.com/olasunkanmi-SE/codebuddy/issues/130
  async getFilesFromDirectory(dir: string, pattern: string) {
    try {
      const workSpaceInfo = this.getWorkspaceInfo(dir);
      if (!workSpaceInfo) {
        throw Error("root workspace folder not found");
      }

      const directories = await vscode.workspace.fs.readDirectory(
        workSpaceInfo.root,
      );
      const tsFilePaths: string[] = [];

      // Check for tsconfig.json at the root
      const tsConfigUrl = vscode.Uri.joinPath(
        workSpaceInfo.root,
        FSPROPS.TSCONFIG_FILE,
      );

      const tsConfigExists =
        (await Promise.resolve(vscode.workspace.fs.stat(tsConfigUrl)).catch(
          () => null,
        )) !== null;

      if (tsConfigExists) {
        const tsFiles = await vscode.workspace.findFiles(
          new vscode.RelativePattern(workSpaceInfo.root, pattern),
          FSPROPS.NODE_MODULES_PATTERN,
        );
        tsFilePaths.push(...tsFiles.map((file) => file.fsPath));
      }

      for (const [name, type] of directories) {
        if (type === vscode.FileType.Directory) {
          const dirUri = vscode.Uri.joinPath(workSpaceInfo.root, name);
          const tsConfigUrl = vscode.Uri.joinPath(
            dirUri,
            FSPROPS.TSCONFIG_FILE,
          );

          const tsConfigExists =
            (await Promise.resolve(vscode.workspace.fs.stat(tsConfigUrl)).catch(
              () => null,
            )) !== null;
          if (tsConfigExists) {
            const tsFiles = await vscode.workspace.findFiles(
              new vscode.RelativePattern(dirUri, pattern),
              FSPROPS.NODE_MODULES_PATTERN,
            );
            tsFilePaths.push(...tsFiles.map((file) => file.fsPath));
          }
        }
      }
      return tsFilePaths;
    } catch (error: any) {
      handleError(
        error,
        `Error fetching the files from ${dir} with pattern ${pattern}`,
      );
      throw error;
    }
  }

  async readFile(fileName: string): Promise<any> {
    try {
      const rootUri = this.getRootUri();
      let fileUri: vscode.Uri | undefined;

      if (fileName === FSPROPS.TSCONFIG_FILE) {
        const tsconfigFiles = await vscode.workspace.findFiles(
          new vscode.RelativePattern(rootUri, "**tsconfig.json"),
        );
        if (tsconfigFiles?.length > 0) {
          fileUri = tsconfigFiles[0];
        }
        // fileUri = vscode.Uri.joinPath(rootUri, FSPROPS.TSCONFIG_FILE);
      } else {
        throw Error("Unknown fileName");
      }
      let fileContent: any;
      if (fileUri) {
        fileContent = await vscode.workspace.fs.readFile(fileUri);
      }

      return {
        buffer: fileContent,
        string: fileContent ? Buffer.from(fileContent).toString("utf8") : "",
        filePath: fileUri ? fileUri.fsPath : "",
      };
    } catch (error: any) {
      handleError(error, `Error while reading file ${fileName}`);
      throw error;
    }
  }

  private getRootUri(): vscode.Uri {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return vscode.Uri.file(process.cwd());
    }
    return workspaceFolder.uri;
  }

  getRootFilePath(): string {
    return this.getRootUri().fsPath;
  }

  async getFilesContent(
    fileNames: string[],
  ): Promise<Map<string, string> | undefined> {
    const filesContent = new Map<string, string>();
    try {
      if (!vscode.workspace.workspaceFolders) {
        this.logger.warn("No workspace folders found.");
        return filesContent;
      }
      for (const fileName of fileNames) {
        if (fileName.length < 2) {
          continue;
        }
        const files: vscode.Uri[] = await vscode.workspace.findFiles(
          `**/${fileName.trim()}`,
        );
        if (files.length > 0) {
          const fileUri = files[0];
          try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            filesContent.set(
              fileName,
              Buffer.from(fileContent).toString("utf8"),
            );
          } catch (error: any) {
            this.logger.error(`Error reading file ${fileName}: ${error}`);
            throw new Error(error);
          }
        } else {
          this.logger.warn(`File not found: ${fileName}`);
        }
      }
      return filesContent;
    } catch (error: any) {
      return filesContent;
    }
  }
}
