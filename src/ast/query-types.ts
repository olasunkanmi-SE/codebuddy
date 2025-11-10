/**
 * Language Agnostic Intermediate Representation (LAIR) Types
 *
 * These types define the structure for representing code elements
 * in a language-independent way.
 */

import { Tree } from "web-tree-sitter";

export type ElementType =
  | "function"
  | "class"
  | "method"
  | "variable"
  | "block"
  | "import"
  | "call"
  | "other";

export interface IPosition {
  readonly row: number;
  readonly column: number;
}

export interface ICodeElement {
  readonly id: string;
  readonly type: ElementType;
  readonly name: string;
  readonly filePath: string;
  readonly startPosition: IPosition;
  readonly endPosition: IPosition;
  readonly codeSnippet: string;
  readonly parent?: string;
  children: ICodeElement[];
}

export interface IAnalysisSummary {
  totalElements: number;
  fileCount: number;
  elementsByType: Record<string, number>;
}

export interface IAnalysisOutput {
  summary: IAnalysisSummary;
  files: IFileAnalysis[];
}

export interface IFileAnalysis {
  path: string;
  relativePath: string;
  elements: ICodeElement[];
}

export interface IParsedFile {
  tree: Tree;
  language: string;
  content: string;
  filePath: string;
}
