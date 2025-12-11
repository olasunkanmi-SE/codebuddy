// src/services/change-detection/git-cli.provider.ts
import * as vscode from "vscode";
import { GitActions } from "../../services/git-actions";
import { IChangeProvider, ChangeDetails } from "./types";

export class GitCliProvider implements IChangeProvider {
  public readonly name = "Git CLI";

  constructor(private readonly gitActions: GitActions) {}

  async getChanges(targetBranch: string): Promise<ChangeDetails | null> {
    const modifiedFiles = await this.gitActions.getModifiedFiles(targetBranch);
    if (modifiedFiles.length === 0) {
      return null; // No changes found, let the next provider try
    }

    const prDiff = await this.gitActions.getPRDifferenceSummary(targetBranch);
    const currentBranchInfo = await this.gitActions.getCurrentBranchInfo();

    vscode.window.showInformationMessage(
      `🔍 Reviewing PR via Git CLI: ${currentBranchInfo.current} → ${targetBranch} (${modifiedFiles.length} files changed)`,
    );

    return {
      branchInfo: `${currentBranchInfo.current} → ${targetBranch}`,
      changedFiles: modifiedFiles,
      diffContent: prDiff,
    };
  }
}
