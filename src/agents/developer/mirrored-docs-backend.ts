import { BackendProtocol, EditResult, WriteResult } from "deepagents";
import * as path from "path";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder("utf-8");

/**
 * Mirrors documentation writes to both the LangGraph store backend and the VS Code workspace.
 */
export class MirroredDocsBackend implements BackendProtocol {
  private readonly logger: Logger;

  constructor(
    private readonly primary: BackendProtocol,
    private readonly workspaceUri: vscode.Uri | undefined,
  ) {
    this.logger = Logger.initialize("MirroredDocsBackend", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  async lsInfo(dir: string) {
    return this.primary.lsInfo(dir);
  }

  async read(filePath: string, offset?: number, limit?: number) {
    return this.primary.read(filePath, offset, limit);
  }

  async grepRaw(
    pattern: string,
    basePath?: string | null,
    glob?: string | null,
  ) {
    return this.primary.grepRaw(pattern, basePath, glob);
  }

  async globInfo(pattern: string, basePath?: string) {
    return this.primary.globInfo(pattern, basePath);
  }

  async write(filePath: string, content: string): Promise<WriteResult> {
    const result = await this.primary.write(filePath, content);
    if (!("error" in result)) {
      await this.writeWorkspaceContent(filePath, content);
    }
    return result;
  }

  async edit(
    filePath: string,
    oldString: string,
    newString: string,
    replaceAll = false,
  ): Promise<EditResult> {
    const result = await this.primary.edit(
      filePath,
      oldString,
      newString,
      replaceAll,
    );
    if ("error" in result) {
      return result;
    }

    const updatedContent = await this.getUpdatedContentSnapshot(filePath);
    if (updatedContent !== undefined) {
      await this.writeWorkspaceContent(filePath, updatedContent);
      return result;
    }

    await this.applyEditToWorkspace(filePath, oldString, newString, replaceAll);
    return result;
  }

  private async writeWorkspaceContent(filePath: string, content: string) {
    if (!this.workspaceUri) {
      this.logger.warn(
        "Skipping workspace doc mirror because no workspace folder is available.",
      );
      return;
    }

    const normalized = `/${filePath.replace(/^\/+/, "")}`;
    const relative = normalized.startsWith("/docs/")
      ? normalized.slice(1)
      : path.posix.join("docs", normalized.slice(1));

    const parts = relative.split("/").filter(Boolean);
    if (!parts.length) {
      return;
    }

    const targetUri = vscode.Uri.joinPath(this.workspaceUri, ...parts);
    const dirUri = vscode.Uri.joinPath(
      this.workspaceUri,
      ...parts.slice(0, -1),
    );

    try {
      if (parts.length > 1) {
        await vscode.workspace.fs.createDirectory(dirUri);
      }
      await vscode.workspace.fs.writeFile(
        targetUri,
        utf8Encoder.encode(content),
      );
    } catch (error) {
      this.logger.error("Failed to mirror documentation to workspace", {
        error,
      });
    }
  }

  private async applyEditToWorkspace(
    filePath: string,
    oldString: string,
    newString: string,
    replaceAll: boolean,
  ) {
    if (!this.workspaceUri) {
      return;
    }

    const currentContent = await this.readWorkspaceContent(filePath);
    if (currentContent === undefined || !currentContent.includes(oldString)) {
      return;
    }

    let updated: string;
    if (replaceAll) {
      const segments = currentContent.split(oldString);
      updated = segments.join(newString);
    } else {
      updated = currentContent.replace(oldString, newString);
    }

    await this.writeWorkspaceContent(filePath, updated);
  }

  private async readWorkspaceContent(filePath: string) {
    if (!this.workspaceUri) {
      return undefined;
    }

    const normalized = `/${filePath.replace(/^\/+/, "")}`;
    const relative = normalized.startsWith("/docs/")
      ? normalized.slice(1)
      : path.posix.join("docs", normalized.slice(1));
    const parts = relative.split("/").filter(Boolean);
    if (!parts.length) {
      return undefined;
    }

    const targetUri = vscode.Uri.joinPath(this.workspaceUri, ...parts);
    try {
      const content = await vscode.workspace.fs.readFile(targetUri);
      return utf8Decoder.decode(content);
    } catch (error) {
      this.logger.warn("Unable to read mirrored workspace documentation", {
        error,
      });
      return undefined;
    }
  }

  private async getUpdatedContentSnapshot(filePath: string) {
    try {
      const snapshot = await this.primary.read(filePath, 0, 200_000);
      return typeof snapshot === "string" ? snapshot : undefined;
    } catch (error) {
      this.logger.warn("Unable to fetch updated documentation snapshot", {
        error,
      });
      return undefined;
    }
  }
}
