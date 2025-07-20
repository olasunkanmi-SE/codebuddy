import {
  FileEntry,
  FolderEntry,
  IContextInfo,
  IWorkspaceService,
} from "../application/interfaces/workspace.interface";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { randomUUID } from "crypto";
import { Orchestrator } from "../agents/orchestrator";

export class WorkspaceService implements IWorkspaceService {
  protected readonly orchestrator: Orchestrator;
  private static instance: WorkspaceService;
  private readonly logger: Logger;
  private readonly excludedDirectories = [
    "node_modules",
    "build",
    ".git",
    "dist",
  ];
  private readonly excludedFiles = ["package-lock.json", ".vscode", ".env"];

  private constructor() {
    this.logger = Logger.initialize("WorkspaceService", {
      minLevel: LogLevel.DEBUG,
    });
    this.orchestrator = Orchestrator.getInstance();
    this.setUpWorkspaceListeners();
  }

  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  public getActiveFile(): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    const fileNameWithPath = activeEditor?.document?.fileName;
    if (fileNameWithPath) {
      this.setUpWorkspaceListeners();
      return path.basename(fileNameWithPath);
    }
  }

  private setUpWorkspaceListeners() {
    vscode.window.onDidChangeActiveTextEditor((editor) =>
      this.orchestrator.publish(
        "onActiveworkspaceUpdate",
        this.getActiveFile(),
      ),
    );
  }

  public async getWorkspaceFiles(
    rootPath: string,
  ): Promise<Record<string, string>> {
    try {
      const workspaceFiles: Record<string, string> = {};
      await this.traverseDirectory(rootPath, workspaceFiles);
      return workspaceFiles;
    } catch (error: any) {
      this.logger.error("Error getting the workspace files", error);
      throw new Error(`Error getting workspace files: ${error.message}`); // Include message
    }
  }

  private async traverseDirectory(
    dir: string,
    workspaceFiles: Record<string, string>,
  ): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        !this.excludedDirectories.some((dir) => entry.name.includes(dir))
      ) {
        await this.traverseDirectory(fullPath, workspaceFiles);
      } else if (
        entry.isFile() &&
        !this.excludedFiles.some((file) => entry.name.includes(file))
      ) {
        await this.readFileAndStore(fullPath, workspaceFiles);
      }
    }
  }

  private async readFileAndStore(
    fullPath: string,
    workspaceFiles: Record<string, string>,
  ): Promise<void> {
    try {
      const fileContent = await fs.promises.readFile(fullPath, "utf8");
      const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (rootPath) {
        workspaceFiles[path.relative(rootPath, fullPath)] = fileContent;
      } else {
        this.logger.warn(
          `Could not determine workspace root for file: ${fullPath}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error reading file ${fullPath}:`, error);
      throw new Error(`Error reading file ${fullPath}: ${error.message}`);
    }
  }

  public async getContextInfo(
    useWorkspaceContext: boolean,
  ): Promise<IContextInfo> {
    const activeFileContent = this.getActiveFile();
    const openFiles = this.getOpenFiles();
    let workspaceFiles: FolderEntry | undefined;

    if (useWorkspaceContext) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const rootPath = workspaceFolders
        ? workspaceFolders[0].uri.fsPath
        : undefined;

      if (rootPath) {
        workspaceFiles = await this.getFolderStructure(rootPath);
      }
    }

    return {
      activeFileContent,
      workspaceFiles: workspaceFiles
        ? new Map([["root", [workspaceFiles]]])
        : undefined,
      openFiles,
    };
  }

  public async getAllFiles(): Promise<vscode.Uri[] | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return undefined;
    }
    const rootPath = workspaceFolders[0].uri;
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(rootPath, "**/*"),
      new vscode.RelativePattern(
        rootPath,
        "**/{node_modules,build,dist,.git,out}/**",
      ),
    );
    return files;
  }

  private async getFolderStructure(rootPath: string): Promise<FolderEntry> {
    try {
      return await this.traverseDirectoryForStructure(rootPath, rootPath);
    } catch (error: any) {
      this.logger.error("Error getting the folder structure", error);
      throw new Error(`Error getting folder structure: ${error.message}`);
    }
  }

  public getOpenFiles(): { path: string; language: string }[] {
    return vscode.workspace.textDocuments.map((doc) => ({
      path: doc.uri.fsPath,
      language: String(doc.languageId),
    }));
  }

  public async getFolderToFilesMap(
    rootPath: string,
  ): Promise<Map<string, string[]>> {
    try {
      const folderToFilesMap: Map<string, string[]> = new Map();
      await this.traverseDirectoryForFolderMap(rootPath, folderToFilesMap);
      return folderToFilesMap;
    } catch (error: any) {
      this.logger.error("Error getting the folder to files map", error);
      throw new Error(`Error getting folder to files map: ${error.message}`);
    }
  }

  private async traverseDirectoryForFolderMap(
    dir: string,
    folderToFilesMap: Map<string, string[]>,
  ): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      console.log("Entry Name:", entry.name);
      if (
        entry.isDirectory() &&
        this.excludedDirectories.some((dir) => entry.name.includes(dir))
      ) {
        await this.traverseDirectoryForFolderMap(fullPath, folderToFilesMap);
      } else if (
        entry.isFile() &&
        !this.excludedFiles.some((file) => entry.name.includes(file))
      ) {
        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (rootPath) {
          const relativePath = path.relative(rootPath, fullPath);
          const folderPath = path.dirname(relativePath);

          if (!folderToFilesMap.has(folderPath)) {
            folderToFilesMap.set(folderPath, []);
          }

          folderToFilesMap.get(folderPath)?.push(path.basename(fullPath)); // Store only the file name
        } else {
          this.logger.warn(
            `Could not determine workspace root for file: ${fullPath}`,
          );
        }
      }
    }
  }

  private async traverseDirectoryForStructure(
    dir: string,
    rootPath: string,
  ): Promise<FolderEntry> {
    const folderName = path.basename(dir);
    const folderEntry: FolderEntry = {
      id: randomUUID(),
      type: "folder",
      name: folderName,
      children: [],
    };
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (
        entry.isDirectory() &&
        !this.excludedDirectories.some((dir) => entry.name.includes(dir))
      ) {
        const childFolder = await this.traverseDirectoryForStructure(
          fullPath,
          rootPath,
        );
        folderEntry.children.push(childFolder);
      } else if (
        entry.isFile() &&
        !this.excludedFiles.some((file) => entry.name.includes(file))
      ) {
        const fileEntry: FileEntry = {
          id: randomUUID(),
          type: "file",
          name: entry.name,
        };
        folderEntry.children.push(fileEntry);
      }
    }

    return folderEntry;
  }
}
