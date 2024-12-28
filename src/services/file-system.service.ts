import * as path from "path";
import * as ts from "typescript";
import * as vscode from "vscode";
import { FSPROPS } from "../application/constant";
import { IWorkspaceInfo } from "../application/interfaces";
import { handleError } from "../application/utils";

export class FileSystemService {
  getWorkspaceInfo(dir: string): IWorkspaceInfo | undefined {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw Error("root workspace folder not found");
      }
      return {
        root: workspaceFolder.uri,
        srcPath: path.posix.join(workspaceFolder.uri.path, dir),
      };
    } catch (error) {
      handleError(error, `Unable to get workspace ${dir} `);
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
        workSpaceInfo?.root,
      );
      const directory = directories.filter(
        ([name, type]) => type === vscode.FileType.Directory && name === dir,
      );
      if (!directory) {
        throw Error(`${dir} does not exist within this workspace`);
      }
      const directoryFiles = directory.map(async ([file]) => {
        const filePath = path.posix.join(workSpaceInfo.root.path, file);
        const srcUri = vscode.Uri.file(filePath);
        const srcFiles = await vscode.workspace.findFiles(
          new vscode.RelativePattern(srcUri, pattern),
        );
        return srcFiles.map((file) => file.path);
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
    buffer: Uint8Array<ArrayBufferLike>;
    string: string;
    filePath: string;
  }> {
    try {
      const rootPath: string = this.getRootFilePath();
      let joinedPath = "";
      switch (fileName) {
        case FSPROPS.TSCONFIG_FILE:
          joinedPath = path.join(rootPath, FSPROPS.TSCONFIG_FILE);
          break;
        default:
          throw Error("Unknown fileName");
      }
      const uri = vscode.Uri.file(joinedPath);
      const fileContent = await vscode.workspace.fs.readFile(uri);
      return {
        buffer: fileContent,
        string: Buffer.from(fileContent).toString("utf8"),
        filePath: joinedPath,
      };
    } catch (error) {
      handleError(error, `Error while reading file ${fileName}`);
      throw error;
    }
  }

  getRootFilePath(): string {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? process.cwd();
  }
}
