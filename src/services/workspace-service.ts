import {
  FileEntry,
  FolderEntry,
  IContextInfo,
  IWorkspaceService,
} from "../application/interfaces/workspace.interface";
import * as path from "path";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { randomUUID } from "crypto";
import { Orchestrator } from "../orchestrator";
import { EditorHostService } from "./editor-host.service";
import { FileType } from "../interfaces/editor-host";

export class WorkspaceService implements IWorkspaceService {
  protected readonly orchestrator: Orchestrator;
  private static instance: WorkspaceService;
  private readonly logger: Logger;
  private readonly excludedDirectories = [
    "node_modules",
    "build",
    ".git",
    "dist",
    ".codebuddy",
  ];
  private readonly excludedFiles = ["package-lock.json", ".vscode", ".env"];

  private constructor() {
    this.logger = Logger.initialize("WorkspaceService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.orchestrator = Orchestrator.getInstance();
  }

  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  // public getActiveFile(): string | undefined {
  //   const host = EditorHostService.getInstance().getHost();
  //   // TODO: Implement getActiveTextEditor in IEditorHost if needed
  //   return undefined;
  // }

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
    const host = EditorHostService.getInstance().getHost();
    const entries = await host.workspace.fs.readDirectory(dir);

    for (const [name, type] of entries) {
      const fullPath = path.join(dir, name);
      if (
        type === FileType.Directory &&
        !this.excludedDirectories.some((dir) => name.includes(dir))
      ) {
        await this.traverseDirectory(fullPath, workspaceFiles);
      } else if (
        type === FileType.File &&
        !this.excludedFiles.some((file) => name.includes(file))
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
      const host = EditorHostService.getInstance().getHost();
      const contentBytes = await host.workspace.fs.readFile(fullPath);
      const fileContent = new TextDecoder().decode(contentBytes);

      const rootPath = host.workspace.rootPath;
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
    const openFiles = this.getOpenFiles();
    let workspaceFiles: FolderEntry | undefined;

    if (useWorkspaceContext) {
      const host = EditorHostService.getInstance().getHost();
      const rootPath = host.workspace.rootPath;

      if (rootPath) {
        workspaceFiles = await this.getFolderStructure(rootPath);
      }
    }

    return {
      workspaceFiles: workspaceFiles
        ? new Map([["root", [workspaceFiles]]])
        : undefined,
      openFiles,
    };
  }

  public async getAllFiles(): Promise<string[] | undefined> {
    const host = EditorHostService.getInstance().getHost();
    const rootPath = host.workspace.rootPath;
    if (!rootPath) {
      return undefined;
    }

    // findFiles signature in IEditorHost: findFiles(include: string, exclude?: string): Promise<string[]>
    // VS Code implementation uses glob patterns.
    const files = await host.workspace.findFiles(
      "**/*",
      "**/{node_modules,build,dist,.git,out}/**",
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
    const host = EditorHostService.getInstance().getHost();
    return host.workspace.textDocuments.map((doc) => ({
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
    const host = EditorHostService.getInstance().getHost();
    const entries = await host.workspace.fs.readDirectory(dir);

    for (const [name, type] of entries) {
      const fullPath = path.join(dir, name);
      this.logger.info("Entry Name:", name);
      if (
        type === FileType.Directory &&
        !this.excludedDirectories.some((excluded) => name.includes(excluded))
      ) {
        await this.traverseDirectoryForFolderMap(fullPath, folderToFilesMap);
      } else if (
        type === FileType.File &&
        !this.excludedFiles.some((excluded) => name.includes(excluded))
      ) {
        const rootPath = host.workspace.rootPath;
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
    const host = EditorHostService.getInstance().getHost();
    const entries = await host.workspace.fs.readDirectory(dir);

    for (const [name, type] of entries) {
      const fullPath = path.join(dir, name);

      if (
        type === FileType.Directory &&
        !this.excludedDirectories.some((excluded) => name.includes(excluded))
      ) {
        const childFolder = await this.traverseDirectoryForStructure(
          fullPath,
          rootPath,
        );
        folderEntry.children.push(childFolder);
      } else if (
        type === FileType.File &&
        !this.excludedFiles.some((excluded) => name.includes(excluded))
      ) {
        const fileEntry: FileEntry = {
          id: randomUUID(),
          type: "file",
          name: name,
        };
        folderEntry.children.push(fileEntry);
      }
    }

    return folderEntry;
  }
}
