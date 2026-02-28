import * as vscode from "vscode";

export interface ChangeDetails {
  branchInfo: string;
  changedFiles: string[];
  diffContent: string;
  diffStats?: string;
}

export interface IChangeProvider {
  getChanges(targetBranch: string): Promise<ChangeDetails | null>;
  readonly name: string; // For logging purposes
}

export interface VscodeGitApi {
  getChanges(): Promise<vscode.SourceControlResourceState[]>;

  getBranchName(): Promise<string | undefined>;

  getChangesContent(
    changes: vscode.SourceControlResourceState[],
  ): Promise<string>;
}
