// src/services/change-detection/change-detector.service.ts
import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { IChangeProvider, ChangeDetails } from "./types";

export class ChangeDetector {
  private readonly logger: Logger;

  constructor(private readonly providers: IChangeProvider[]) {
    this.logger = Logger.initialize("ChangeDetector", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  async findChanges(targetBranch: string): Promise<ChangeDetails> {
    for (const provider of this.providers) {
      try {
        const result = await provider.getChanges(targetBranch);
        if (result) {
          this.logger.info(
            `Successfully found changes using: ${provider.name}`,
          );
          return result;
        }
      } catch (error) {
        this.logger.warn(`Provider ${provider.name} failed:`, error);
      }
    }

    // Final fallback if no providers succeed
    vscode.window.showWarningMessage(
      "Could not detect any Git changes. The review might be less accurate.",
    );
    return {
      branchInfo: `Current branch vs ${targetBranch} (No changes detected)`,
      changedFiles: [],
      diffContent:
        "Note: No specific file changes were detected. Performing a general code quality assessment.",
    };
  }
}
