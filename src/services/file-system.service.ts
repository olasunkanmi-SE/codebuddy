import * as vscode from "vscode";
import { FSPROPS } from "../application/constant";
import { IWorkspaceInfo } from "../application/interfaces";
import { handleError } from "../application/utils";
import { Logger } from "../infrastructure/logger/logger";

export class FileSystemService {
  private logger: Logger;
  constructor() {
    this.logger = new Logger("FileSystemService");
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
    } catch (error) {
      this.logger.error("Unable to get workspace ${dir}", error);
      throw error;
    }
  }

  async getFilesFromDirectory(dir: string, pattern: string) {
    try {
      const workSpaceInfo = this.getWorkspaceInfo(dir);
      if (!workSpaceInfo) {
        throw Error("root workspace folder not found");
      }

      const directories = await vscode.workspace.fs.readDirectory(
        workSpaceInfo.root,
      );

      const directory = directories.filter(
        ([name, type]) => type === vscode.FileType.Directory && name === dir,
      );

      if (!directory) {
        throw Error(`${dir} does not exist within this workspace`);
      }

      const directoryFiles = directory.map(async ([file]) => {
        const srcUri = vscode.Uri.joinPath(workSpaceInfo.root, file);
        const srcFiles = await vscode.workspace.findFiles(
          new vscode.RelativePattern(srcUri, pattern),
        );
        return srcFiles.map((file) => file.fsPath);
      });

      const srcFilePaths = await Promise.all(directoryFiles);
      return srcFilePaths.flat();
    } catch (error) {
      handleError(
        error,
        `Error fetching the files from ${dir} with pattern ${pattern}`,
      );
      throw error;
    }
  }

  async readFile(fileName: string): Promise<{
    buffer: Uint8Array;
    string: string;
    filePath: string;
  }> {
    try {
      const rootUri = this.getRootUri();
      let fileUri: vscode.Uri;

      switch (fileName) {
        case FSPROPS.TSCONFIG_FILE:
          fileUri = vscode.Uri.joinPath(rootUri, FSPROPS.TSCONFIG_FILE);
          break;
        default:
          throw Error("Unknown fileName");
      }

      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      return {
        buffer: fileContent,
        string: Buffer.from(fileContent).toString("utf8"),
        filePath: fileUri.fsPath,
      };
    } catch (error) {
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
}
