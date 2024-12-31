import * as path from "path";
import * as vscode from "vscode";
import { IWorkspaceInfo } from "../application/interfaces";
import { handleError } from "../application/utils";

export class FileSystemService {
  /**
   * Retrieves workspace information for a given directory
   * @param dir - Directory path to get workspace information for
   * @returns IWorkspaceInfo object containing root URI and source path, or undefined if not found
   * @throws Error if workspace folder is not found
   */
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

  /**
   * Retrieves all files matching a pattern from a specified directory
   * @param dir - Directory to search in
   * @param pattern - File pattern to match (e.g., "*.ts")
   * @returns Promise resolving to array of file paths
   * @throws Error if workspace folder or directory is not found
   */
  async getFilesFromDirectory(dir: string, pattern: string): Promise<string[]> {
    try {
      const workSpaceInfo = this.getWorkspaceInfo(dir);
      if (!workSpaceInfo) {
        vscode.window.showErrorMessage("root workspace folder not found");
        throw Error("root workspace folder not found");
      }
      const directories = await vscode.workspace.fs.readDirectory(
        workSpaceInfo?.root,
      );
      const directory = directories.filter(
        ([name, type]) => type === vscode.FileType.Directory && name === dir,
      );
      if (!directory) {
        vscode.window.showErrorMessage(
          `${dir} does not exist within this workspace`,
        );
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

  /**
   * Reads content of a TypeScript file
   * @param fileName - Name of the TypeScript file to read
   * @returns Promise resolving to object containing:
   *          - buffer: raw file content as Uint8Array
   *          - string: file content as UTF-8 string
   *          - filePath: complete file path
   * @throws Error if file is not a TypeScript file or cannot be read
   */
  async readFile(fileName: string): Promise<{
    string: string;
    filePath: string;
  }> {
    try {
      const rootPath: string = this.getRootFilePath();
      let joinedPath = "";
      joinedPath = path.join(rootPath, fileName);
      const uri = vscode.Uri.file(joinedPath);
      const fileContent = await vscode.workspace.fs.readFile(uri);
      return {
        string: Buffer.from(fileContent).toString("utf8"),
        filePath: joinedPath,
      };
    } catch (error) {
      handleError(error, `Error while reading file ${fileName}`);
      throw error;
    }
  }

  /**
   * Gets the root file path of the current workspace
   * @returns String representing the root file system path of the workspace,
   *          or current working directory if workspace is not found
   */
  getRootFilePath(): string {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? process.cwd();
  }
}
