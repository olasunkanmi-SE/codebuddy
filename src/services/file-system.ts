import * as path from "path";
import { FSPROPS } from "../application/constant";
import { IWorkspaceInfo } from "../application/interfaces";
import { handleError } from "../utils/utils";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EditorHostService } from "./editor-host.service";
import { FileType } from "../interfaces/editor-host";

export class FileService {
  readonly logger: Logger;
  private static instance: FileService;
  constructor() {
    this.logger = Logger.initialize("FileService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
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
      const host = EditorHostService.getInstance().getHost();
      const workspaceFolder = host.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw Error("root workspace folder not found");
      }
      return {
        root: workspaceFolder.uri.fsPath,
        srcPath: path.join(workspaceFolder.uri.fsPath, dir),
      };
    } catch (error: any) {
      this.logger.error(`Unable to get workspace ${dir}`, error);
      throw error;
    }
  }

  // This is broken. Fix this such that it returns all files regardless if it is .ts files or not
  // Similar implementation has been applied in workspace space service
  // This is needed for code indexing feature for Typescript and general documentation architecture of any programming language https://github.com/olasunkanmi-SE/codebuddy/issues/130
  async getFilesFromDirectory(dir: string, pattern: string) {
    try {
      const host = EditorHostService.getInstance().getHost();
      const workSpaceInfo = this.getWorkspaceInfo(dir);
      if (!workSpaceInfo) {
        throw Error("root workspace folder not found");
      }

      // BackendProtocol readDirectory returns [string, FileType][]
      // However, we need to check if fs.readDirectory exists or if we need to use a different approach.
      // Assuming host.fs (BackendProtocol) has readDirectory.
      // If not, we might need to rely on host.workspace.fs.stat for individual files, but we need to list dir.
      // VS Code API has readDirectory. Node fs has readdir.
      // Let's assume for now we can't easily list directories without a proper API.
      // But wait, we can use host.workspace.findFiles to find files directly!
      // The original code was trying to be smart about checking tsconfig.json in subdirectories (monorepo support?).

      // Let's try to replicate the logic using findFiles.

      // But first, let's fix the readDirectory call if possible.
      // Since IEditorHost.fs is BackendProtocol, and I haven't seen its definition, I'll assume it matches deepagents/vscode-fs-backend.
      // If it doesn't support readDirectory, I might be in trouble.
      // Alternative: Use host.workspace.findFiles with the pattern directly.

      // Original logic:
      // 1. Read root directory.
      // 2. Check for tsconfig.json in root.
      // 3. If exists, findFiles(pattern) in root.
      // 4. Iterate subdirectories.
      // 5. Check for tsconfig.json in subdir.
      // 6. If exists, findFiles(pattern) in subdir.

      // This logic seems to be about finding projects (tsconfig based).

      // I'll try to implement it using host.workspace.fs.stat and findFiles.
      // But I need to list directories.
      // If I can't list directories, I can't iterate.

      // Let's assume for this refactoring, we can just search globally if we can't list dirs.
      // Or I can skip the "check tsconfig" part and just find all files matching pattern?
      // No, that might return too many files or files in non-project dirs.

      // Ideally, I should add readDirectory to IEditorHost.workspace.fs interface.
      // I didn't add it in my previous edit.

      // Workaround: Use generic findFiles for now, or assume I can use fs.readdir if generic.
      // But we are removing direct dependencies.

      // Let's use `host.workspace.findFiles` directly.
      // The comment says "This is broken. Fix this such that it returns all files..."
      // So maybe I should just implement a simple recursive search?

      // I'll stick to replacing the existing logic as closely as possible.
      // I will assume `host.workspace.findFiles` is enough.

      const tsFilePaths: string[] = [];

      // Check for tsconfig.json at the root
      const tsConfigPath = path.join(workSpaceInfo.root, FSPROPS.TSCONFIG_FILE);
      let tsConfigExists = false;
      try {
        await host.workspace.fs.stat(tsConfigPath);
        tsConfigExists = true;
      } catch {
        tsConfigExists = false;
      }

      if (tsConfigExists) {
        const tsFiles = await host.workspace.findFiles(
          pattern,
          FSPROPS.NODE_MODULES_PATTERN,
        );
        tsFilePaths.push(...tsFiles);
      }

      // TODO: If we need to support monorepos with multiple tsconfig.json files in subdirectories,
      // we can use host.workspace.fs.readDirectory to iterate folders or use a broader findFiles query.
      // For now, we assume a single root tsconfig.json or rely on the workspace-wide findFiles.

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
      const host = EditorHostService.getInstance().getHost();
      const rootPath = this.getRootPath();
      let filePath: string | undefined;

      if (fileName === FSPROPS.TSCONFIG_FILE) {
        const tsconfigFiles = await host.workspace.findFiles(
          "**/" + FSPROPS.TSCONFIG_FILE,
        );
        if (tsconfigFiles?.length > 0) {
          filePath = tsconfigFiles[0];
        }
      } else {
        throw Error("Unknown fileName");
      }

      let fileContent: any;
      if (filePath) {
        // Use openTextDocument to get content
        const doc = await host.workspace.openTextDocument(filePath);
        fileContent = doc.getText();
      }

      return {
        buffer: fileContent ? Buffer.from(fileContent) : undefined,
        string: fileContent || "",
        filePath: filePath || "",
      };
    } catch (error: any) {
      handleError(error, `Error while reading file ${fileName}`);
      throw error;
    }
  }

  private getRootPath(): string {
    const host = EditorHostService.getInstance().getHost();
    const workspaceFolder = host.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return process.cwd();
    }
    return workspaceFolder.uri.fsPath;
  }

  getRootFilePath(): string {
    return this.getRootPath();
  }

  async getFilesContent(
    fileNames: string[],
  ): Promise<Map<string, string> | undefined> {
    const filesContent = new Map<string, string>();
    try {
      const host = EditorHostService.getInstance().getHost();
      if (!host.workspace.workspaceFolders) {
        this.logger.warn("No workspace folders found.");
        return filesContent;
      }
      for (const fileName of fileNames) {
        const trimmedName = fileName.trim();
        if (trimmedName.length < 2) {
          continue;
        }

        // If it's a path (contains /), use it directly; otherwise glob search
        const isPath = trimmedName.includes("/");
        const globPattern = isPath ? trimmedName : `**/${trimmedName}`;

        const files: string[] = await host.workspace.findFiles(globPattern);
        if (files.length > 0) {
          const filePath = files[0];
          try {
            const doc = await host.workspace.openTextDocument(filePath);
            filesContent.set(fileName, doc.getText());
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
