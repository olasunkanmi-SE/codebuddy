// src/services/change-detection/change-detector.service.ts
import * as vscode from "vscode";
import { IChangeProvider, ChangeDetails } from "./types";

export class ChangeDetector {
  constructor(private readonly providers: IChangeProvider[]) {}

  async findChanges(targetBranch: string): Promise<ChangeDetails> {
    for (const provider of this.providers) {
      try {
        const result = await provider.getChanges(targetBranch);
        if (result) {
          console.log(`Successfully found changes using: ${provider.name}`);
          return result;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
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
