import * as ts from "typescript";
import {
  IClassInfo,
  ICodebaseMap,
  IEnumInfo,
  IFunctionInfo,
  IInterfaceInfo,
  IProperty,
  TNode,
} from "./generic.interface";

export interface ITypeScriptCodeMapper {
  /**
   * Extracts information about a TypeScript class declaration.
   *
   * @param node The TypeScript class declaration to extract information from.
   * @param sourceFile The source file containing the class declaration.
   * @returns An IClassInfo object containing the name, methods, properties, interfaces, and enums of the class.
   */
  extractClassMetaData(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
  ): IClassInfo;

  /**
   * Extracts property information from a TypeScript property declaration.
   *
   * @param node A property declaration node.
   * @param sourceFile The source file containing the node.
   * @returns An object with 'name' and 'type' properties.
   */
  extractPropertyParameters(
    node: ts.PropertyDeclaration,
    sourceFile: ts.SourceFile,
  ): IProperty;

  /**
   * Extracts the parameters of a function from a given node.
   *
   * @param node The node containing the function parameters.
   * @param sourceFile The source file containing the node.
   * @returns An array of function parameter objects.
   */
  extractFunctionParameters(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile,
  ): IProperty[];

  /**
   * Retrieves and returns function details from a given function declaration or method declaration node.
   *
   * @param node The function declaration or method declaration node to extract details from.
   * @param sourceFile The source file containing the node.
   * @returns An object containing function details, or null if the node has no name.
   */
  getFunctionDetails(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile,
  ): IFunctionInfo | null;

  /**
   * Retrieves the type of a given function or method declaration.
   *
   * @param node A function or method declaration node.
   * @returns A string representation of the function or method type, or undefined if type checking is unavailable.
   */
  getTypeAtLocation(
    node:
      | ts.FunctionDeclaration
      | ts.MethodDeclaration
      | ts.ParameterDeclaration
      | ts.PropertyDeclaration
      | ts.PropertySignature,
  ): string | undefined;

  /**
   * Retrieves and concatenates JSDoc comments associated with a given TypeScript node.
   *
   * @param node The TypeScript node to extract comments from.
   * @returns Concatenated JSDoc comments.
   */
  getComment(node: TNode): string;

  /**
   * Generates a string representation of a given function or method declaration node.
   * This method leverages the TypeScript printer to produce a source code string,
   * removing any comments and using line feed as the new line character.
   *
   * @param node The function or method declaration node to be printed.
   * @param sourceFile The source file that contains the node to be printed.
   * @returns A string representation of the given node.
   */
  getFunctionNodeText(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile,
  ): string;

  /**
   * Retrieves a list of TypeScript files, excluding test and mock files.
   * @returns A promise that resolves with a list of TypeScript files.
   */
  // getTsFiles(): Promise<string[]>;

  /**
   * Builds a hierarchical map of the codebase by traversing TypeScript files
   * and extracting module and class information.
   */
  buildCodebaseMap(): Promise<Map<string, string>>;

  /**
   * Extracts interface information from a TypeScript interface declaration.
   *
   * @param node The interface declaration node to extract information from.
   * @param sourceFile The source file containing the interface declaration.
   * @returns An IInterfaceInfo object containing the name, properties, and summary of the interface.
   */
  extractInterfaceInfo(
    node: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile,
  ): IInterfaceInfo;

  /**
   * Extracts enum information from a TypeScript enum declaration.
   *
   * @param node The enum declaration node to extract information from.
   * @param sourceFile The source file containing the enum declaration.
   * @returns An IEnumInfo object containing the name, members, and summary of the enum.
   */
  extractEnumInfo(
    node: ts.EnumDeclaration,
    sourceFile: ts.SourceFile,
  ): IEnumInfo;

  /**
   * Builds a dependency graph for a TypeScript source file.
   *
   * @param sourceFile The TypeScript source file to build the dependency graph for.
   * @returns An array of dependencies for the source file.
   */
  buildDependencyGraph(sourceFile: ts.SourceFile): string[];
}
