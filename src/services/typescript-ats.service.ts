import * as path from "path";
import * as ts from "typescript";
import * as vscode from "vscode";
import { Orchestrator } from "../orchestrator";
import { FSPROPS } from "../application/constant";
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
} from "../application/interfaces";
import { ITypeScriptCodeMapper } from "../application/interfaces/ts.code.mapper.interface";
import { handleError } from "../utils/utils";
import { FileService } from "./file-system";
import { Memory } from "../memory/base";

export class TypeScriptAtsMapper implements ITypeScriptCodeMapper {
  private program: ts.Program | undefined;
  private typeChecker: ts.TypeChecker | undefined;
  private readonly fsService: FileService;
  private static instance: TypeScriptAtsMapper;
  protected readonly orchestrator: Orchestrator;
  constructor() {
    this.fsService = FileService.getInstance();
    this.orchestrator = Orchestrator.getInstance();
  }

  public async init() {
    await this.initializeTypescriptProgram();
  }

  public static async getInstance(): Promise<TypeScriptAtsMapper> {
    if (!TypeScriptAtsMapper.instance) {
      TypeScriptAtsMapper.instance = new TypeScriptAtsMapper();
      // TODO remove this init flow at this point
      await TypeScriptAtsMapper.instance.init();
    }
    return TypeScriptAtsMapper.instance;
  }

  /**
   * Initializes a TypeScript program by reading the TS configuration file and creating a new program instance.
   * This method sets up the program and type checker for further compilation and analysis.
   */
  // TODO The way to return the src file should be dynamic.
  // Users may have mono repos or may open the folder at an higher level folder
  private async initializeTypescriptProgram(): Promise<void> {
    try {
      const fileContent = await this.fsService.readFile(FSPROPS.TSCONFIG_FILE);
      if (!fileContent) {
        throw Error;
      }
      const { string, filePath } = fileContent;
      const configFile = ts.readConfigFile(filePath, () => string);

      const compilerOptions: ts.ParsedCommandLine =
        ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          this.fsService?.getRootFilePath(),
        );

      this.program = ts.createProgram(
        compilerOptions.fileNames,
        compilerOptions.options,
      );

      this.typeChecker = this.getTypeChecker();
    } catch (error: any) {
      handleError(error, `unable to initialize knowledgebase extractions`);
      throw error;
    }
  }

  //the root folder should be relative to src folder
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
    sourceFile: ts.SourceFile,
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
      handleError(error, `Unable to extract class meta data`);
      throw error;
    }
  }

  private aggregateFunctions(
    node: DeclarationFunctionNode,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo,
  ): IFunctionInfo | null {
    const functionInfo: IFunctionInfo | null =
      this.getFunctionDetails(node, sourceFile) ?? null;
    if (functionInfo) {
      info?.functions?.push(functionInfo);
    }
    return functionInfo;
  }

  /**
   * Extracts property information from a TypeScript property declaration and adds it
   * to the class or module information object if valid. This aggregation helps build
   * a complete representation of the class/module structure.
   */
  private aggergateProperties(
    node: ts.PropertyDeclaration,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo,
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
    info: IClassInfo | IModuleInfo,
  ) {
    const interfaceInfo = this.extractInterfaceInfo(node, sourceFile);
    if (interfaceInfo) {
      info?.interfaces?.push(interfaceInfo);
    }
    return interfaceInfo;
  }

  /**
   * Extracts and aggregates enum information from enum declarations into the parent
   * class or module information object. Helps maintain a complete type system
   * representation within the code structure.
   */
  private aggregateEnums(
    node: ts.EnumDeclaration,
    sourceFile: ts.SourceFile,
    info: IClassInfo | IModuleInfo,
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
    member?: ts.ClassElement,
  ): IFunctionInfo | null {
    try {
      let classFunctions = null;
      const currentElement = member ?? node;
      if (
        ts.isMethodDeclaration(currentElement) ||
        ts.isFunctionDeclaration(currentElement) ||
        ts.isArrowFunction(currentElement)
      ) {
        classFunctions = this.aggregateFunctions(
          currentElement,
          sourceFile,
          info,
        );
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
      return classFunctions;
    } catch (error: any) {
      handleError(error, `Unable to process class members`);
      throw error;
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
    sourceFile: ts.SourceFile,
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
      handleError(error, `Unable to extract property parameters`);
      throw error;
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
    sourceFile: ts.SourceFile,
  ): IProperty[] {
    try {
      const properties = node.parameters.map((param) => {
        const name = param.name.getText(sourceFile);
        const type = param.type ? this.getTypeAtLocation(param) : undefined;
        return {
          name,
          type,
        };
      });
      return properties;
    } catch (error: any) {
      handleError(error, "unable to extract function parameters");
      throw error;
    }
  }

  extractArrowFunctionParameters(
    node: ts.ArrowFunction,
    sourceFile: ts.SourceFile,
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
    sourceFile: ts.SourceFile,
  ): IFunctionInfo | null {
    try {
      if (!node.name) {
        throw Error("Node name not found");
      }

      const name: string = node.name.getText(sourceFile);
      const content: string = this.getFunctionNodeText(node, sourceFile);
      const parameters: IProperty[] = this.extractFunctionParameters(
        node,
        sourceFile,
      );

      const details = this.functionDetailsMapper(
        name,
        content,
        parameters,
        node,
      );
      return details;
    } catch (error: any) {
      handleError(error, "unable to get function details");
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
    node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction,
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
      this.typeChecker.getTypeAtLocation(node),
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
    sourceFile: ts.SourceFile,
  ) {
    try {
      const printer: ts.Printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        removeComments: true,
      });
      return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
    } catch (error: any) {
      handleError(error, `Unable to get function node text`);
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
    relativePath: string,
  ): IModuleInfo {
    return {
      path: path.normalize(relativePath),
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
      const filesMap = new Map<string, string>();
      const rootDir: string = this.fsService.getRootFilePath();
      const normalizedRootDir = path.normalize(rootDir);
      const codebaseMap: ICodebaseMap = {};
      const repoNames: string = path.basename(normalizedRootDir);
      codebaseMap[repoNames] = { modules: {} };

      const tsFiles = await this.fsService.getFilesFromDirectory(
        rootDir,
        FSPROPS.TS_FILE_PATTERN,
      );
      if (!tsFiles?.length) {
        throw Error(`No Typescript files found`);
      }
      tsFiles.forEach((filePath) => {
        const moduleRalativePath = path.relative(normalizedRootDir, filePath);
        const sourceFile = this.getSourceFile(filePath);

        if (!sourceFile) {
          throw Error(`No source file found for ${filePath}`);
        }

        const moduleInfo: IModuleInfo = this.extractModuleInfo(
          sourceFile,
          moduleRalativePath,
        );
        ts.forEachChild(sourceFile, (node) => {
          if (ts.isClassDeclaration(node)) {
            const classInfo: IClassInfo = this.extractClassMetaData(
              node,
              sourceFile,
            );

            if (classInfo) {
              if (classInfo.name) {
                filesMap.set(classInfo.name, moduleRalativePath);
              }
              moduleInfo?.classes?.push(classInfo);
            }
            const functionInfo: IFunctionInfo | null = this.processClassMembers(
              node,
              sourceFile,
              moduleInfo,
            );
            if (functionInfo?.name) {
              filesMap.set(functionInfo.name, moduleRalativePath);
            }
          }

          if (
            ts.isMethodDeclaration(node) ||
            ts.isFunctionDeclaration(node) ||
            (ts.isVariableDeclaration(node) && ts.isArrowFunction(node))
          ) {
            const functionInfo = this.aggregateFunctions(
              node,
              sourceFile,
              moduleInfo,
            );
            if (functionInfo?.name) {
              filesMap.set(functionInfo.name, moduleRalativePath);
            }
          }

          if (ts.isPropertyDeclaration(node)) {
            this.aggergateProperties(node, sourceFile, moduleInfo);
          }

          if (ts.isInterfaceDeclaration(node)) {
            const interfaceInfo = this.aggregateInterfaces(
              node,
              sourceFile,
              moduleInfo,
            );
            filesMap.set(interfaceInfo.name, moduleRalativePath);
          }

          if (ts.isEnumDeclaration(node)) {
            this.aggregateEnums(node, sourceFile, moduleInfo);
          }
          codebaseMap[repoNames].modules[moduleRalativePath] = moduleInfo;
        });
      });
      Memory.set("codeIndex", filesMap);
      return codebaseMap;
    } catch (error: any) {
      handleError(error, "Error fetching the files");
      throw Error;
    }
  }

  extractInterfaceInfo(
    node: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile,
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
      handleError(error, `Unable to extract interface info`);
      throw error;
    }
  }

  extractEnumInfo(
    node: ts.EnumDeclaration,
    sourceFile: ts.SourceFile,
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
