import { UUID } from "crypto";

export interface IWorkspaceService {
  getWorkspaceFiles(rootPath: string): Promise<Record<string, string>>;
  getContextInfo(useWorkspaceContext: boolean): Promise<IContextInfo>;
}

export interface IContextInfo {
  activeFileContent?: string;
  workspaceFiles?: Map<string, FolderEntry[]>;
  openFiles: IOpenFiles[];
}

export interface IOpenFiles {
  path: string;
  language: string;
}

export interface FolderEntry {
  id: UUID;
  type: "folder";
  name: string;
  children: (FolderEntry | FileEntry)[];
}

export interface FileEntry {
  id: UUID;
  type: "file";
  name: string;
}
