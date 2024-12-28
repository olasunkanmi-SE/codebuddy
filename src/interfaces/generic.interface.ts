import * as ts from "typescript";
import * as vscode from "vscode";

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
  // constructor?: string //Check for this also
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

export enum SomeEnum {
  MORNING = "morning",
}

export interface ICodebaseKnowledgeExtractor {}

export interface IFileUploader {
  uploadFile(file: vscode.Uri): Promise<void>;
  getFiles(): Promise<string[]>;
  uploadFileHandler(): Promise<void>;
}
