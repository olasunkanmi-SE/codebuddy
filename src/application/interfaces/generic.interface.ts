import * as ts from "typescript";
import * as vscode from "vscode";
import * as https from "https";

export interface IFunctionInfo {
  name: string;
  content: string;
  parameters: IProperty[];
  returnType?: string;
  comments?: string;
  summary?: string;
}

export interface IClassInfo {
  name?: string;
  functions: IFunctionInfo[];
  properties: IProperty[];
  summary?: string;
  imports?: string;
  interfaces?: IInterfaceInfo[];
  enums?: IEnumInfo[];
}

export interface IInterfaceInfo {
  name: string;
  properties: IProperty[];
  summary?: string;
}

export interface IEnumInfo {
  name: string;
  members: IProperty[];
  summary?: string;
}

export interface IModuleInfo {
  name?: string;
  path: string;
  classes?: IClassInfo[];
  functions?: IFunctionInfo[];
  interfaces?: IInterfaceInfo[];
  enums?: IEnumInfo[];
  dependencies: string[];
  properties?: IProperty[];
}

export interface ICodebaseMap {
  [repo: string]: {
    modules: {
      [path: string]: IModuleInfo;
    };
  };
}

export type TNode =
  | ts.FunctionDeclaration
  | ts.MethodDeclaration
  | ts.InterfaceDeclaration
  | ts.EnumDeclaration
  | ts.ArrowFunction;

export type DeclarationOrFunctionNode =
  | ts.FunctionDeclaration
  | ts.MethodDeclaration
  | ts.ParameterDeclaration
  | ts.PropertyDeclaration
  | ts.PropertySignature
  | ts.ArrowFunction;

export type DeclarationFunctionNode =
  | ts.FunctionDeclaration
  | ts.MethodDeclaration
  | ts.ArrowFunction
  | (ts.ClassElement & ts.FunctionDeclaration)
  | (ts.ClassElement & ts.ArrowFunction)
  | (ts.ClassElement & ts.MethodDeclaration);

export interface IProperty {
  name: string;
  type?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICodebaseKnowledgeExtractor {}

export interface IFileUploader {
  uploadFile(file: vscode.Uri): Promise<void>;
  getFiles(): Promise<string[]>;
  uploadFileHandler(): Promise<
    { fileName: string; filePath: string } | undefined
  >;
}

export interface IWorkspaceInfo {
  root: vscode.Uri;
  srcPath: string;
}

export interface IFunctionData {
  className: string;
  path: string;
  name: string;
  compositeText: string;
  content: string;
  description?: string;
  processedAt?: string;
  embedding?: number[];
  returnType?: string;
  dependencies?: string[];
}

export interface IFunctionParameter {
  name: string;
  type: string;
}

export interface ICodeClass {
  name: string;
  functions: IMappedFunction[];
}

export interface ICodeEntry {
  path: string;
  classes: ICodeClass[];
  functions?: IMappedFunction[];
  dependencies: string[];
}

export interface ICodeMap {
  [key: string]: any;
}

export interface IMappedFunction {
  name: string;
  comments?: string;
  description?: string;
  content?: string;
  parameters: IFunctionParameter[];
  returnType: string;
  compositeText?: string;
}

export interface IMappedCode {
  path: string;
  functions?: IMappedFunction[];
  className?: string;
  dependencies?: string[];
}

export interface IRequestOptions {
  hostname: string;
  path: string;
  method: string;
  headers?: any;
  jwtToken?: string;
}

export interface HttpRequestOptions extends https.RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  excerpt?: string;
}
