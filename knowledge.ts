import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import * as glob from "glob";

interface FunctionInfo {
  name: string;
  content: string;
  parameters: string[];
  returnType?: string;
}

interface ClassInfo {
  name: string;
  functions: FunctionInfo[];
  properties: Array<{ name: string; type: string }>;
}

interface ModuleInfo {
  path: string;
  classes: ClassInfo[];
  functions: FunctionInfo[];
}

interface CodebaseMap {
  [repositoryName: string]: {
    modules: {
      [modulePath: string]: ModuleInfo;
    };
  };
}

class CodebaseKnowledgeExtractor {
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;

  constructor(rootDir: string) {
    // Create program with all TypeScript files in the repository
    const tsConfigPath = path.join(rootDir, "tsconfig.json");
    const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      rootDir
    );

    this.program = ts.createProgram(
      compilerOptions.fileNames,
      compilerOptions.options
    );
    this.typeChecker = this.program.getTypeChecker();
  }

  extractCodebaseKnowledge(rootDir: string): CodebaseMap {
    const codebaseMap: CodebaseMap = {};
    const repositoryName = path.basename(rootDir);
    codebaseMap[repositoryName] = { modules: {} };

    // Use glob to find all TypeScript files
    const tsFiles = glob.sync(path.join(rootDir, "**", "*.{ts,tsx}"), {
      ignore: ["**/node_modules/**", "**/*.d.ts"],
    });

    tsFiles.forEach((filePath) => {
      const moduleRelativePath = path.relative(rootDir, filePath);
      const sourceFile = this.program.getSourceFile(filePath);

      if (sourceFile) {
        const moduleInfo: ModuleInfo = {
          path: moduleRelativePath,
          classes: [],
          functions: [],
        };

        // Traverse the AST
        ts.forEachChild(sourceFile, (node) => {
          if (ts.isClassDeclaration(node)) {
            const classInfo = this.extractClassInfo(node, sourceFile);
            if (classInfo) {
              moduleInfo.classes.push(classInfo);
            }
          }

          if (ts.isFunctionDeclaration(node)) {
            const functionInfo = this.extractFunctionInfo(node, sourceFile);
            if (functionInfo) {
              moduleInfo.functions.push(functionInfo);
            }
          }
        });

        // Only add modules with content
        if (moduleInfo.classes.length > 0 || moduleInfo.functions.length > 0) {
          codebaseMap[repositoryName].modules[moduleRelativePath] = moduleInfo;
        }
      }
    });

    return codebaseMap;
  }

  private extractClassInfo(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile
  ): ClassInfo | null {
    if (!node.name) return null;

    const className = node.name.getText(sourceFile);
    const classInfo: ClassInfo = {
      name: className,
      functions: [],
      properties: [],
    };

    // Extract class methods and properties
    node.members.forEach((member) => {
      if (ts.isMethodDeclaration(member)) {
        const functionInfo = this.extractFunctionInfo(member, sourceFile);
        if (functionInfo) {
          classInfo.functions.push(functionInfo);
        }
      }

      if (ts.isPropertyDeclaration(member)) {
        const propertyName = member.name.getText(sourceFile);
        const type = this.typeChecker.typeToString(
          this.typeChecker.getTypeAtLocation(member)
        );

        classInfo.properties.push({
          name: propertyName,
          type: type,
        });
      }
    });

    return classInfo;
  }

  private extractFunctionInfo(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): FunctionInfo | null {
    // Ensure the function has a name
    if (!node.name) return null;

    const functionName = node.name.getText(sourceFile);

    // Extract function content (without implementation)
    const functionContent = this.getPrintedNodeWithoutBody(node, sourceFile);

    // Extract parameters
    const parameters = node.parameters.map(
      (param) =>
        param.name.getText(sourceFile) +
        ": " +
        this.typeChecker.typeToString(this.typeChecker.getTypeAtLocation(param))
    );

    // Extract return type
    let returnType;
    if (node.type) {
      returnType = this.typeChecker.typeToString(
        this.typeChecker.getTypeAtLocation(node.type)
      );
    }

    return {
      name: functionName,
      content: functionContent,
      parameters,
      returnType,
    };
  }

  private getPrintedNodeWithoutBody(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): string {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

    // Create a copy of the node and remove the body
    const nodeCopy = ts.factory.createFunctionDeclaration(
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      node.type,
      undefined // No body
    );

    return printer.printNode(ts.EmitHint.Unspecified, nodeCopy, sourceFile);
  }

  // Method to save the extracted knowledge base to a file
  saveCodebaseMap(codebaseMap: CodebaseMap, outputPath: string) {
    fs.writeFileSync(outputPath, JSON.stringify(codebaseMap, null, 2));
  }
}

// Example usage in a VSCode extension
export function extractCodebaseKnowledge(rootDir: string, outputPath: string) {
  try {
    const extractor = new CodebaseKnowledgeExtractor(rootDir);
    const codebaseMap = extractor.extractCodebaseKnowledge(rootDir);

    extractor.saveCodebaseMap(codebaseMap, outputPath);

    return codebaseMap;
  } catch (error) {
    console.error("Error extracting codebase knowledge:", error);
    return null;
  }
}
