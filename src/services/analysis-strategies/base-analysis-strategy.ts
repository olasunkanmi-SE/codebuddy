import * as vscode from "vscode";
import * as fs from "fs";
import { Logger } from "../../infrastructure/logger/logger";
import { LogLevel } from "../telemetry";

export interface IAnalysisStrategy {
  analyze(files: string[]): Promise<any>;
}

export abstract class BaseAnalysisStrategy implements IAnalysisStrategy {
  protected readonly logger: Logger;

  constructor(protected readonly strategyName: string) {
    this.logger = Logger.initialize(`${strategyName}Strategy`, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  abstract analyze(files: string[]): Promise<any>;

  protected async readFileContent(filePath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = await vscode.workspace.fs.readFile(
        vscode.Uri.file(filePath),
      );
      return Buffer.from(content).toString("utf8");
    } catch (error: any) {
      this.logger.warn(`Failed to read file ${filePath}`, error);
      return null;
    }
  }

  protected filterFilesByExtensions(
    files: string[],
    extensions: string[],
  ): string[] {
    return files.filter((file) => extensions.some((ext) => file.endsWith(ext)));
  }

  protected filterFilesByPatterns(
    files: string[],
    patterns: RegExp[],
  ): string[] {
    return files.filter((file) =>
      patterns.some((pattern) => pattern.test(file)),
    );
  }
}
