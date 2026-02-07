export interface ChangeDetails {
  branchInfo: string;
  changedFiles: string[];
  diffContent: string;
}

export interface IChangeProvider {
  getChanges(targetBranch: string): Promise<ChangeDetails | null>;
  readonly name: string; // For logging purposes
}
