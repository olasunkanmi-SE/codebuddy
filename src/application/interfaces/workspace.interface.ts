export interface IWorkspaceService {
  getWorkspaceFiles(rootPath: string): Promise<Record<string, string>>;
  getActiveFileContent(): string | undefined;
  getContextInfo(useWorkspaceContext: boolean): Promise<IContextInfo>;
}

export interface IContextInfo {
  activeFileContent: string | undefined;
  workspaceFiles?: Record<string, string>;
  openFiles: IOpenFiles[];
}

export interface IOpenFiles {
  path: string;
  language: string;
}
