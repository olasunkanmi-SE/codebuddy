// src/services/change-detection/vscode-api.provider.ts
import * as vscode from "vscode";
import { IChangeProvider, ChangeDetails, VscodeGitApi } from "./types";

export class VscodeApiProvider implements IChangeProvider {
  public readonly name = "VS Code Git API";

  constructor(private readonly vscodeGit: VscodeGitApi) {}

  async getChanges(targetBranch: string): Promise<ChangeDetails | null> {
    const changes = await this.vscodeGit.getChanges();
    if (changes.length === 0) {
      return null;
    }

    const changedFiles = changes.map(
      (change) =>
        `${vscode.workspace.asRelativePath(change.resourceUri)} (${change.decorations?.tooltip || "modified"})`,
    );

    const currentBranch = (await this.vscodeGit.getBranchName()) || "HEAD";
    const branchInfo = `Current branch: ${currentBranch} (target: ${targetBranch})`;

    const diffContent = await this.vscodeGit.getChangesContent(
      changes.slice(0, 5),
    );

    return { branchInfo, changedFiles, diffContent };
  }
}
// Note: You would create a VscodeGitApi class to wrap the complex API interactions from the original code.
