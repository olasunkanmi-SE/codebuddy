import { IContextInfo, IWorkspaceService } from "../application/interfaces/workspace.interface";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../infrastructure/logger/logger";

export class WorkspaceService implements IWorkspaceService {
  private static instance: WorkspaceService;
  private readonly logger: Logger;

  private constructor() {
    this.logger = new Logger(WorkspaceService.name);
  }

  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  public getActiveFileContent(): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    return activeEditor?.document.getText();
  }

  public async getWorkspaceFiles(rootPath: string): Promise<Record<string, string>> {
    try {
      const workspaceFiles: Record<string, string> = {};
      await this.traverseDirectory(rootPath, workspaceFiles);
      return workspaceFiles;
    } catch (error: any) {
      this.logger.error("Error getting the workspace files", error);
      throw new Error(`Error getting workspace files: ${error.message}`); // Include message
    }
  }

  private async traverseDirectory(dir: string, workspaceFiles: Record<string, string>): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.includes(".git")) {
        await this.traverseDirectory(fullPath, workspaceFiles);
      } else if (entry.isFile()) {
        await this.readFileAndStore(fullPath, workspaceFiles);
      }
    }
  }

  private async readFileAndStore(fullPath: string, workspaceFiles: Record<string, string>): Promise<void> {
    try {
      const fileContent = await fs.promises.readFile(fullPath, "utf8");
      const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (rootPath) {
        workspaceFiles[path.relative(rootPath, fullPath)] = fileContent;
      } else {
        this.logger.warn(`Could not determine workspace root for file: ${fullPath}`);
      }
    } catch (error: any) {
      this.logger.error(`Error reading file ${fullPath}:`, error);
      throw new Error(`Error reading file ${fullPath}: ${error.message}`);
    }
  }

  public async getContextInfo(useWorkspaceContext: boolean): Promise<IContextInfo> {
    const activeFileContent = this.getActiveFileContent();
    const openFiles = this.getOpenFiles();
    let workspaceFiles: Record<string, string> | undefined;

    if (useWorkspaceContext) {
      workspaceFiles = await this.getWorkspaceFilesFromWorkspaceFolders();
    }

    return {
      activeFileContent,
      workspaceFiles,
      openFiles,
    };
  }

  private async getWorkspaceFilesFromWorkspaceFolders(): Promise<Record<string, string> | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;
    if (rootPath) {
      return await this.getWorkspaceFiles(rootPath);
    }
    return undefined;
  }

  public getOpenFiles(): { path: string; language: string }[] {
    return vscode.workspace.textDocuments.map((doc) => ({ path: doc.uri.fsPath, language: doc.languageId }));
  }

  public async getFolderToFilesMap(rootPath: string): Promise<Map<string, string[]>> {
    try {
      const folderToFilesMap: Map<string, string[]> = new Map();
      await this.traverseDirectoryForFolderMap(rootPath, folderToFilesMap);
      return folderToFilesMap;
    } catch (error: any) {
      this.logger.error("Error getting the folder to files map", error);
      throw new Error(`Error getting folder to files map: ${error.message}`);
    }
  }

  private async traverseDirectoryForFolderMap(dir: string, folderToFilesMap: Map<string, string[]>): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.includes(".git")) {
        await this.traverseDirectoryForFolderMap(fullPath, folderToFilesMap);
      } else if (entry.isFile()) {
        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (rootPath) {
          const relativePath = path.relative(rootPath, fullPath);
          const folderPath = path.dirname(relativePath);

          if (!folderToFilesMap.has(folderPath)) {
            folderToFilesMap.set(folderPath, []);
          }

          folderToFilesMap.get(folderPath)?.push(path.basename(fullPath)); // Store only the file name
        } else {
          this.logger.warn(`Could not determine workspace root for file: ${fullPath}`);
        }
      }
    }
  }
}
