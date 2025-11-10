import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { execFile } from "child_process";
import { rgPath } from "@vscode/ripgrep";
import { defaultIgnorePatterns } from "../constants";

export class CodeSearch {
  private logger: Logger;
  private static instance: CodeSearch;

  constructor(private readonly outputChannel: vscode.OutputChannel) {
    this.logger = Logger.initialize("QueryExecutor", {
      minLevel: LogLevel.DEBUG,
    });
  }

  private getIgnorePatterns() {
    return defaultIgnorePatterns;
  }

  private buildRipgrepArgs(
    pattern: string,
    workspaceRoot: string,
    additionalArgs: string[] = [],
  ): string[] {
    const args = ["--regexp", pattern, "--files-with-matches", "--ignore-case"];

    for (const ignorePattern of this.getIgnorePatterns()) {
      args.push("--glob", `!${ignorePattern}`);
    }

    args.push(...additionalArgs);

    args.push(workspaceRoot);

    return args;
  }

  static getInstance(outputChannel: vscode.OutputChannel) {
    return (CodeSearch.instance ??= new CodeSearch(outputChannel));
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async search(
    patterns: string[],
    workspaceRoot: string,
    cancellationToken?: vscode.CancellationToken,
  ): Promise<string> {
    const escapedPatterns = patterns.map((p) => this.escapeRegex(p));
    const combinedPattern = escapedPatterns.map((p) => `(${p})`).join("|");

    const args = this.buildRipgrepArgs(combinedPattern, workspaceRoot);

    this.outputChannel.appendLine(
      `Running ripgrep with pattern: ${combinedPattern}`,
    );
    this.logger.info(`Running ripgrep with pattern: ${combinedPattern}`);

    return new Promise((resolve, reject) => {
      const child = execFile(
        rgPath,
        args,
        { maxBuffer: 1024 * 1024 * 10, cwd: workspaceRoot, timeout: 60000 },
        (error, stdout) => {
          if (cancellationToken?.isCancellationRequested) {
            this.outputChannel.appendLine("Ripgrep cancelled by user.");
            this.logger.info(`Ripgrep cancelled by user.`);
            return reject(new vscode.CancellationError());
          }

          if (error && (error as any).code !== 1) {
            const errorMsg = error.message;
            this.outputChannel.appendLine(`Ripgrep error: ${errorMsg}`);
            this.logger.info(`ipgrep error: ${errorMsg}`);
            reject(error);
          } else {
            const files = stdout.trim().split("\n").filter(Boolean);
            resolve(files.join("\n"));
          }
        },
      );
      cancellationToken?.onCancellationRequested(() => {
        child.kill();
        this.outputChannel.appendLine(
          "Ripgrep process terminated due to cancellation.",
        );
        this.logger.info("Ripgrep process terminated due to cancellation.");
      });
    });
  }

  /**
   * Searches for exact phrase (uses quotes)
   */
  async searchExact(
    phrase: string,
    workspaceRoot: string,
    cancellationToken?: vscode.CancellationToken,
  ): Promise<string[]> {
    const args = this.buildRipgrepArgs(
      phrase,
      workspaceRoot,
      ["--fixed-strings"], // Additional arg
    );
    return new Promise((resolve, reject) => {
      const child = execFile(
        rgPath,
        args,
        {
          maxBuffer: 1024 * 1024 * 10,
          cwd: workspaceRoot,
          timeout: 60000,
        },
        (error, stdout) => {
          if (cancellationToken?.isCancellationRequested) {
            return reject(new vscode.CancellationError());
          }

          if (error && (error as any).code !== 1) {
            reject(error);
          } else {
            resolve(stdout.trim().split("\n").filter(Boolean));
          }
        },
      );

      cancellationToken?.onCancellationRequested(() => {
        child.kill();
      });
    });
  }

  /**
   * Searches with file type filters
   */
  async searchWithTypes(
    patterns: string[],
    workspaceRoot: string,
    fileExtensions: string[],
    cancellationToken?: vscode.CancellationToken,
  ): Promise<string[]> {
    const combinedPattern = patterns.map((p) => `(${p})`).join("|");

    // Build additional args for file types
    const additionalArgs: string[] = [];
    for (const ext of fileExtensions) {
      additionalArgs.push("--glob", `*.${ext}`);
    }

    const args = this.buildRipgrepArgs(
      combinedPattern,
      workspaceRoot,
      additionalArgs, // Type filters added
    );

    for (const ext of fileExtensions) {
      args.push("--glob", `*.${ext}`);
    }

    args.push(workspaceRoot);

    return new Promise((resolve, reject) => {
      const child = execFile(
        rgPath,
        args,
        {
          maxBuffer: 1024 * 1024 * 10,
          cwd: workspaceRoot,
          timeout: 60000,
        },
        (error, stdout) => {
          if (cancellationToken?.isCancellationRequested) {
            return reject(new vscode.CancellationError());
          }

          if (error && (error as any).code !== 1) {
            reject(error);
          } else {
            resolve(stdout.trim().split("\n").filter(Boolean));
          }
        },
      );

      cancellationToken?.onCancellationRequested(() => {
        child.kill();
      });
    });
  }
}
