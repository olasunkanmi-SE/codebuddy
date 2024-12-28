import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import * as vscode from "vscode";
import {
  DeclarationFunctionNode,
  DeclarationOrFunctionNode,
  IClassInfo,
  ICodebaseMap,
  IEnumInfo,
  IFunctionInfo,
  IInterfaceInfo,
  IModuleInfo,
  IProperty,
  TNode,
} from "../interfaces";
import { ITypeScriptCodeMapper } from "../interfaces/ts.code.mapper.interface";

export class TypeScriptCodeMapper implements ITypeScriptCodeMapper {
  private program: ts.Program | undefined;
  private typeChecker: ts.TypeChecker | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.initializeTypescriptProgram();
  }

  /**
   * Initializes a TypeScript program by reading the TS configuration file and creating a new program instance.
   * This method sets up the program and type checker for further compilation and analysis.
   */
  private async initializeTypescriptProgram(): Promise<void> {
    try {
      const rootDir: string = this.getRootFolder();
      const tsConfigPath: string =
        path.join(rootDir, "tsconfig.json") ??
        path.join(rootDir, "package.json");
      if (!tsConfigPath) {
        console.error("This is not a typescript code base");
        return;
      }
      const uri = vscode.Uri.file(tsConfigPath);
      const fileContent = await vscode.workspace.fs.readFile(uri);
      const configFile = ts.readConfigFile(tsConfigPath, () =>
        fileContent.toString()
      );

      const compilerOptions: ts.ParsedCommandLine =
        ts.parseJsonConfigFileContent(configFile.config, ts.sys, rootDir);

      this.program = ts.createProgram(
        compilerOptions.fileNames,
        compilerOptions.options
      );

      this.typeChecker = this.getTypeChecker();
    } catch (error: any) {
      console.error(error, "initializeTypescriptProgram", "");
      throw Error(error);
    }
  }

  getRootFolder(): string {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? process.cwd();
  }

  /**
   * Extracts information about a TypeScript class declaration.
   * This function iterates over the members of the class, identifying methods,
   * properties, interfaces, and enums, and compiles this information into an IClassInfo object.
   *
   * @param node The TypeScript class declaration to extract information from.
   * @param sourceFile The source file containing the class declaration.
   * @returns An IClassInfo object containing the name, methods, properties, interfaces, and enums of the class.
   */
  extractClassMetaData(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile
  ): IClassInfo {
    try {
      const className: string | undefined = node?.name?.getText(sourceFile);
      const classInfo: IClassInfo = {
        name: className,
        functions: [],
        properties: [],
        interfaces: [],
        enums: [],
      };

      node.members.forEach((member) => {
        this.processClassMembers(node, sourceFile, classInfo, member);
      });
      return classInfo;
    } catch (error: any) {
      console.error(error, "extractClassInfo", { node, sourceFile });
      throw Error(error);
    }
  }

  private aggregateFunctions(
    node: DeclarationFunctionNode,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo
  ): void {
    const functionInfo: IFunctionInfo | null =
      this.getFunctionDetails(node, sourceFile) ?? null;
    if (functionInfo) {
      info?.functions?.push(functionInfo);
    }
  }

  /**
   * Extracts property information from a TypeScript property declaration and adds it
   * to the class or module information object if valid. This aggregation helps build
   * a complete representation of the class/module structure.
   */
  private aggergateProperties(
    node: ts.PropertyDeclaration,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo
  ) {
    const propertyInfo = this.extractPropertyParameters(node, sourceFile);
    if (propertyInfo) {
      info?.properties?.push(propertyInfo);
    }
  }

  /**
   * Processes interface declarations and aggregates them into the parent class or module
   * information object. Essential for maintaining the hierarchical structure of interfaces
   * within their containing scope.
   */
  private aggregateInterfaces(
    node: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo
  ) {
    const interfaceInfo = this.extractInterfaceInfo(node, sourceFile);
    if (interfaceInfo) {
      info?.interfaces?.push(interfaceInfo);
    }
  }

  /**
   * Extracts and aggregates enum information from enum declarations into the parent
   * class or module information object. Helps maintain a complete type system
   * representation within the code structure.
   */
  private aggregateEnums(
    node: ts.EnumDeclaration,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo
  ) {
    const enumInfo = this.extractEnumInfo(node, sourceFile);
    if (enumInfo) {
      info?.enums?.push(enumInfo);
    }
  }

  /**
   * Retrieves and processes child elements of a class declaration, extracting
   * relevant information about methods, properties, interfaces, and enums.
   *
   * @param node The class declaration node to process.
   * @param member The current class element being processed.
   * @param sourceFile The source file containing the class declaration.
   * @param index The current index within the class declaration.
   * @param classInfo The object to store extracted class information.
   */
  private processClassMembers(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo,
    member?: ts.ClassElement
  ): void {
    const currentElement = member ? member : node;
    if (
      ts.isMethodDeclaration(currentElement) ||
      ts.isFunctionDeclaration(currentElement) ||
      ts.isArrowFunction(currentElement)
    ) {
      this.aggregateFunctions(currentElement, sourceFile, info);
    }

    if (ts.isPropertyDeclaration(currentElement)) {
      this.aggergateProperties(currentElement, sourceFile, info);
    }

    if (ts.isInterfaceDeclaration(node)) {
      this.aggregateInterfaces(node, sourceFile, info);
    }

    if (ts.isEnumDeclaration(node)) {
      this.aggregateEnums(node, sourceFile, info);
    }
  }

  /**
   * Extracts property information from a TypeScript property declaration.
   *
   * This function takes a node representing a property declaration and its source file,
   * and returns an object containing the property's name and type. If the type is not
   * explicitly specified, it is inferred from the property declaration.
   *
   * @param node
   * @param sourceFile
   * @returns An object with 'name' and 'type' properties.
   */
  extractPropertyParameters(
    node: ts.PropertyDeclaration,
    sourceFile: ts.SourceFile
  ): IProperty {
    try {
      const name: string = node.name.getText(sourceFile);
      let type;

      if (node.type) {
        type = this.getTypeAtLocation(node);
      } else {
        const inferredType: ts.Type | undefined =
          this.typeChecker?.getTypeAtLocation(node);
        type = inferredType
          ? this.typeChecker?.typeToString(inferredType)
          : undefined;
      }
      const property = {
        name,
        type,
      };
      return property;
    } catch (error: any) {
      console.error(error, "extractPropertyParameters", { node, sourceFile });
      throw Error(error);
    }
  }

  /**
   * Extracts the parameters of a function from a given node.
   *
   * @param node The node containing the function parameters.
   * @param sourceFile The source file containing the node.
   * @returns An array of function parameter objects.
   */
  extractFunctionParameters(
    node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction,
    sourceFile: ts.SourceFile
  ): IProperty[] {
    const properties = node.parameters.map((param) => {
      const name = param.name.getText(sourceFile);
      const type = param.type ? this.getTypeAtLocation(param) : undefined;
      return {
        name,
        type,
      };
    });
    return properties;
  }

  extractArrowFunctionParameters(
    node: ts.ArrowFunction,
    sourceFile: ts.SourceFile
  ): IProperty[] {
    const properties = node.parameters.map((param) => {
      const name = param.name.getText(sourceFile);
      const type = param.type ? this.getTypeAtLocation(param) : undefined;
      return {
        name,
        type,
      };
    });
    return properties;
  }

  /**
   * Extracts and returns function details from a given function declaration or method declaration node.
   *
   * @param node The function declaration or method declaration node to extract details from.
   * @param sourceFile The source file containing the node.
   * @returns An object containing function details, or null if the node has no name.
   */
  getFunctionDetails(
    node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction,
    sourceFile: ts.SourceFile
  ): IFunctionInfo | null {
    try {
      if (!node.name) {
        return null;
      }

      const name: string = node.name.getText(sourceFile);
      const content: string = this.getFunctionNodeText(node, sourceFile);
      const parameters: IProperty[] = this.extractFunctionParameters(
        node,
        sourceFile
      );

      const details = this.functionDetailsMapper(
        name,
        content,
        parameters,
        node
      );
      return details;
    } catch (error: any) {
      console.error(error, "extractFunctionInfo", { node, sourceFile });
      throw Error(error);
    }
  }

  /**
   * Maps a function declaration or method declaration to a details object,
   * extracting relevant information such as name, content, parameters, return type, and comments.
   *
   * @param name The name of the function.
   * @param content The content of the function.
   * @param parameters An array of property definitions for the function parameters.
   * @param node The TypeScript function or method declaration node.
   * @returns An object containing the function details.
   */
  private functionDetailsMapper(
    name: string,
    content: string,
    parameters: IProperty[],
    node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction
  ) {
    return {
      name,
      content,
      parameters,
      returnType: node.type ? this.getTypeAtLocation(node) : "any",
      comments: this.getComment(node),
    };
  }

  /**
   * Retrieves the type of a given function or method declaration.
   *
   * @param node A function or method declaration node.
   * @returns A string representation of the function or method type, or undefined if type checking is unavailable.
   */
  getTypeAtLocation(node: DeclarationOrFunctionNode): string | undefined {
    const type = this.typeChecker?.typeToString(
      this.typeChecker.getTypeAtLocation(node)
    );
    return type;
  }

  /**
   * Retrieves and concatenates JSDoc comments associated with a given TypeScript node.
   *
   * @param {TNode} node - The TypeScript node to extract comments from.
   * @returns {string} Concatenated JSDoc comments.
   */
  getComment(node: TNode): string {
    return ts
      .getJSDocCommentsAndTags(node)
      .map((comment) => comment.comment || "")
      .join("\n");
  }

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
    node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction,
    sourceFile: ts.SourceFile
  ) {
    const printer: ts.Printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: true,
    });
    return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  }

  /**
   * Finds the root directory of a project by searching for a 'package.json' file
   * starting from the given current directory and traversing up the directory tree.
   *
   * @param {string} [currentDir=process.cwd()] - The directory to start searching from.
   * @returns {string} The root directory of the project, or the current working directory if no 'package.json' file is found.
   */
  findProjectRoot(currentDir: string = process.cwd()): string {
    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    return process.cwd();
  }

  async getTsFiles(): Promise<string[] | undefined> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri;
      if (!workspaceFolder) {
        console.error("No workspace folders found");
        return;
      }
      const directories =
        await vscode.workspace.fs.readDirectory(workspaceFolder);
      const srcDirectories = directories
        .filter(
          ([name, type]) => type === vscode.FileType.Directory && name === "src"
        )
        .map(async ([directory]) => {
          const filePath = path.posix.join(workspaceFolder.path, directory);
          const srcUri = vscode.Uri.file(filePath);
          const srcFiles = await vscode.workspace.findFiles(
            new vscode.RelativePattern(srcUri, "**/*.ts")
          );
          return srcFiles.map((file) => file.path);
        });
      const srcFilePaths = await Promise.all(srcDirectories);
      return srcFilePaths.flat();
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Error fetching the files ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Extracts module information from a TypeScript source file.
   *
   * @param sourceFile The TypeScript source file.
   * @param relativePath The relative path of the module.
   * @returns The module information.
   */
  private extractModuleInfo(
    sourceFile: ts.SourceFile,
    relativePath: string
  ): IModuleInfo {
    return {
      path: relativePath,
      classes: [],
      functions: [],
      interfaces: [],
      enums: [],
      dependencies: this.buildDependencyGraph(sourceFile),
    };
  }

  /**
   * Retrieves a source file from the TypeScript program by its filename.
   *
   * @param fileName - The path to the source file to retrieve
   * @returns The SourceFile object if found, undefined otherwise
   */
  getSourceFile(fileName: string): ts.SourceFile | undefined {
    return this.program?.getSourceFile(fileName);
  }

  /**
   * Gets an array of all root file names in the TypeScript program.
   * Root files are the entry points specified in the tsconfig.json or passed to the compiler.
   *
   * @returns A readonly array of file paths, or undefined if the program is not initialized
   */
  getRootFileNames(): readonly string[] | undefined {
    return this.program?.getRootFileNames();
  }

  /**
   * Returns the current TypeScript program instance.
   * The program object represents the entire TypeScript project and provides
   * access to the compiler's internal state.
   *
   * @returns The TypeScript Program object, or undefined if not initialized
   */
  getProgram(): ts.Program | undefined {
    return this.program;
  }

  /**
   * Retrieves the TypeChecker instance from the current program.
   * The TypeChecker is responsible for type analysis and provides
   * APIs for querying type information.
   *
   * @returns The TypeScript TypeChecker object, or undefined if the program is not initialized
   * @remarks This method creates a new type checker instance each time it's called,
   *          consider caching the result if multiple calls are needed
   */
  getTypeChecker(): ts.TypeChecker | undefined {
    const program = this.getProgram();
    return program ? program.getTypeChecker() : undefined;
  }

  /**
   * Builds a hierarchical map of the codebase by traversing TypeScript files
   * and extracting module and class information.
   */
  async buildCodebaseMap(): Promise<ICodebaseMap> {
    try {
      const rootDir: string = process.cwd();
      const codebaseMap: ICodebaseMap = {};
      const repoNames: string = path.basename(rootDir);
      codebaseMap[repoNames] = { modules: {} };

      const tsFiles: string[] | undefined = await this.getTsFiles();
      tsFiles!.forEach((filePath) => {
        const moduleRalativePath = path.relative(rootDir, filePath);
        const sourceFile = this.getSourceFile(filePath);

        if (!sourceFile) {
          throw Error(`No source file found for ${filePath}`);
        }

        const moduleInfo: IModuleInfo = this.extractModuleInfo(
          sourceFile,
          moduleRalativePath
        );
        ts.forEachChild(sourceFile, (node) => {
          if (ts.isClassDeclaration(node)) {
            const classInfo = this.extractClassMetaData(node, sourceFile);
            if (classInfo) {
              moduleInfo?.classes?.push(classInfo);
            }
            this.processClassMembers(node, sourceFile, moduleInfo);
          }

          if (
            ts.isMethodDeclaration(node) ||
            ts.isFunctionDeclaration(node) ||
            (ts.isVariableDeclaration(node) && ts.isArrowFunction(node))
          ) {
            this.aggregateFunctions(node, sourceFile, moduleInfo);
          }

          if (ts.isPropertyDeclaration(node)) {
            this.aggergateProperties(node, sourceFile, moduleInfo);
          }

          if (ts.isInterfaceDeclaration(node)) {
            this.aggregateInterfaces(node, sourceFile, moduleInfo);
          }

          if (ts.isEnumDeclaration(node)) {
            this.aggregateEnums(node, sourceFile, moduleInfo);
          }
          codebaseMap[repoNames].modules[moduleRalativePath] = moduleInfo;
        });
      });
      return codebaseMap;
    } catch (error) {
      this.handleError(error, "Error fetching the files");
      throw Error;
    }
  }

  private handleError(error: unknown, message?: string): void {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Error";
    vscode.window.showErrorMessage(`${message}, ${errorMessage}`);
  }

  extractInterfaceInfo(
    node: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile
  ): IInterfaceInfo {
    try {
      const interfaceName: string = node.name.getText(sourceFile);

      const properties: IProperty[] = node.members
        .filter(ts.isPropertySignature)
        .map((prop) => {
          const name = prop.name.getText(sourceFile);
          const type = prop.type ? this.getTypeAtLocation(prop) : "any";
          return { name, type };
        });

      return {
        name: interfaceName,
        properties,
        summary: this.getComment(node),
      };
    } catch (error: any) {
      console.error(error, "extractInterfaceInfo", {
        node,
        sourceFile,
      });
      throw Error(error);
    }
  }

  extractEnumInfo(
    node: ts.EnumDeclaration,
    sourceFile: ts.SourceFile
  ): IEnumInfo {
    const enumName = node.name.getText(sourceFile);
    const members = node.members.map((member) => {
      const name = member.name.getText(sourceFile);
      const value = member.initializer
        ? member.initializer.getText(sourceFile)
        : undefined;
      return { name, value };
    });

    return {
      name: enumName,
      members: members,
      summary: this.getComment(node),
    };
  }

  buildDependencyGraph(sourceFile: ts.SourceFile): string[] {
    const imports = sourceFile.statements.filter(ts.isImportDeclaration);
    return imports.map((i) => {
      return ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, i, sourceFile);
    });
  }
}
