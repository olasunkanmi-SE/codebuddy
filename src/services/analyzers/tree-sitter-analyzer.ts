/**
 * Tree-sitter based code analyzer for accurate AST extraction
 * Supports: JavaScript, TypeScript, Python, Java, Go, Rust, PHP
 *
 * This replaces the regex-based analyzers with accurate Tree-sitter parsing.
 */

import * as path from "path";
import * as fs from "fs";
import { Parser, Language, Tree } from "web-tree-sitter";
import { FileAnalyzer } from "./index";

// Type alias for Tree-sitter syntax nodes (web-tree-sitter doesn't export SyntaxNode directly)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SyntaxNode = any;

// Language-specific query patterns for API endpoint detection
const API_ENDPOINT_QUERIES: Record<string, RegExp[]> = {
  // JavaScript/TypeScript: Express, NestJS, Fastify, Hono
  javascript: [
    /(?:app|router|server)\.(get|post|put|delete|patch|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /@(Get|Post|Put|Delete|Patch|Options|Head)\s*\(\s*['"`]?([^'"`\)]*)/gi, // NestJS
    /fastify\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
  ],
  typescript: [
    /(?:app|router|server)\.(get|post|put|delete|patch|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /@(Get|Post|Put|Delete|Patch|Options|Head)\s*\(\s*['"`]?([^'"`\)]*)/gi, // NestJS
    /fastify\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
  ],
  // Python: FastAPI, Flask, Django
  python: [
    /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /@app\.route\s*\(\s*['"`]([^'"`]+)['"`]/gi, // Flask
    /path\s*\(\s*['"`]([^'"`]+)['"`]/gi, // Django
  ],
  // Java: Spring, JAX-RS
  java: [
    /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\(\s*(?:value\s*=\s*)?['"`]?([^'"`\)]*)/gi,
    /@(GET|POST|PUT|DELETE|PATCH)\s*\n\s*@Path\s*\(\s*['"`]([^'"`]+)['"`]\)/gi, // JAX-RS
  ],
  // Go: Gin, Chi, Echo, net/http
  go: [
    /(?:r|router|e|echo|g|gin)\.(GET|POST|PUT|DELETE|PATCH|Handle)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /HandleFunc\s*\(\s*['"`]([^'"`]+)['"`]/gi, // net/http
    /\.Route\s*\(\s*['"`]([^'"`]+)['"`]/gi, // Chi
  ],
  // Rust: Actix, Axum, Rocket
  rust: [
    /#\[(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\]/gi, // Actix/Rocket
    /\.route\s*\(\s*['"`]([^'"`]+)['"`]/gi, // Axum
  ],
  // PHP: Laravel, Symfony
  php: [
    /Route::(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi, // Laravel
    /#\[Route\s*\(\s*['"`]([^'"`]+)['"`]/gi, // Symfony/PHP 8 attributes
    /@Route\s*\(\s*['"`]([^'"`]+)['"`]/gi, // Symfony annotations
  ],
};

// File extension to language mapping
const EXT_TO_LANGUAGE: Record<string, string> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".py": "python",
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
  ".php": "php",
  ".phtml": "php",
};

export interface ExtractedClass {
  name: string;
  type: "class" | "interface" | "struct" | "trait" | "enum";
  extends?: string;
  implements?: string[];
  methods: ExtractedMethod[];
  properties: ExtractedProperty[];
  decorators?: string[];
  startLine: number;
  endLine: number;
}

export interface ExtractedMethod {
  name: string;
  params: string[];
  returnType?: string;
  visibility?: "public" | "private" | "protected";
  isStatic?: boolean;
  isAsync?: boolean;
  decorators?: string[];
  startLine: number;
}

export interface ExtractedProperty {
  name: string;
  type?: string;
  visibility?: "public" | "private" | "protected";
  isOptional?: boolean;
}

export interface ExtractedFunction {
  name: string;
  params: string[];
  returnType?: string;
  isExported?: boolean;
  isAsync?: boolean;
  decorators?: string[];
  startLine: number;
}

export interface ExtractedEndpoint {
  method: string;
  path: string;
  handler?: string;
  file: string;
  line: number;
}

export interface ExtractedImport {
  source: string;
  specifiers: string[];
  isDefault?: boolean;
  isNamespace?: boolean;
}

export interface TreeSitterAnalysisResult {
  classes: ExtractedClass[];
  functions: ExtractedFunction[];
  endpoints: ExtractedEndpoint[];
  imports: ExtractedImport[];
  exports: string[];
  components?: ExtractedClass[]; // React components
  codeSnippet?: string; // First N lines of file
}

/**
 * Tree-sitter based analyzer for accurate code extraction
 */
export class TreeSitterAnalyzer implements FileAnalyzer {
  private parser: Parser | null = null;
  private languageCache = new Map<string, Language>();
  private initPromise: Promise<void> | null = null;
  private grammarsPath: string;

  constructor(grammarsPath?: string) {
    // Default to common paths
    this.grammarsPath =
      grammarsPath ||
      path.join(__dirname, "..", "..", "..", "dist", "grammars");
  }

  /**
   * Initialize Tree-sitter parser
   */
  async initialize(): Promise<void> {
    if (this.parser) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const wasmPath = path.join(this.grammarsPath, "tree-sitter.wasm");

      // Check if we're in a worker context (no vscode)
      const locateFile = (file: string) => {
        return path.join(path.dirname(wasmPath), file);
      };

      await Parser.init({ locateFile } as any);
      this.parser = new Parser();
    })();

    return this.initPromise;
  }

  /**
   * Load language grammar
   */
  private async loadLanguage(languageId: string): Promise<Language | null> {
    if (this.languageCache.has(languageId)) {
      return this.languageCache.get(languageId)!;
    }

    const grammarFiles: Record<string, string> = {
      javascript: "tree-sitter-javascript.wasm",
      typescript: "tree-sitter-tsx.wasm",
      python: "tree-sitter-python.wasm",
      java: "tree-sitter-java.wasm",
      go: "tree-sitter-go.wasm",
      rust: "tree-sitter-rust.wasm",
      php: "tree-sitter-php.wasm",
    };

    const grammarFile = grammarFiles[languageId];
    if (!grammarFile) return null;

    const grammarPath = path.join(this.grammarsPath, grammarFile);
    if (!fs.existsSync(grammarPath)) {
      console.warn(`Grammar not found: ${grammarPath}`);
      return null;
    }

    try {
      const language = await Language.load(grammarPath);
      this.languageCache.set(languageId, language);
      return language;
    } catch (error) {
      console.error(`Failed to load grammar for ${languageId}:`, error);
      return null;
    }
  }

  /**
   * Check if this analyzer can handle the file
   */
  canAnalyze(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext in EXT_TO_LANGUAGE;
  }

  /**
   * Get language ID from file path
   */
  getLanguageId(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    return EXT_TO_LANGUAGE[ext] || null;
  }

  /**
   * Main analysis entry point
   */
  async analyze(
    content: string,
    filePath: string,
  ): Promise<TreeSitterAnalysisResult> {
    await this.initialize();

    const languageId = this.getLanguageId(filePath);
    if (!languageId || !this.parser) {
      return this.createEmptyResult(filePath);
    }

    const language = await this.loadLanguage(languageId);
    if (!language) {
      return this.createEmptyResult(filePath);
    }

    this.parser.setLanguage(language);
    const tree = this.parser.parse(content);

    if (!tree) {
      return this.createEmptyResult(filePath);
    }

    const result: TreeSitterAnalysisResult = {
      classes: this.extractClasses(tree, content, languageId),
      functions: this.extractFunctions(tree, content, languageId),
      endpoints: this.extractEndpoints(content, filePath, languageId),
      imports: this.extractImports(tree, content, languageId),
      exports: this.extractExports(tree, content, languageId),
      codeSnippet: this.getCodeSnippet(content, 50),
    };

    // Extract React components for JS/TS
    if (languageId === "javascript" || languageId === "typescript") {
      result.components = this.extractReactComponents(tree, content);
    }

    return result;
  }

  /**
   * Extract classes, interfaces, structs, traits, enums
   */
  private extractClasses(
    tree: Tree,
    content: string,
    languageId: string,
  ): ExtractedClass[] {
    const classes: ExtractedClass[] = [];
    const rootNode = tree.rootNode;

    const classNodeTypes = this.getClassNodeTypes(languageId);

    const visit = (node: SyntaxNode) => {
      if (classNodeTypes.includes(node.type)) {
        const extracted = this.extractClassInfo(node, content, languageId);
        if (extracted) {
          classes.push(extracted);
        }
      }
      for (const child of node.children) {
        visit(child);
      }
    };

    visit(rootNode);
    return classes;
  }

  /**
   * Get class-like node types for a language
   */
  private getClassNodeTypes(languageId: string): string[] {
    switch (languageId) {
      case "javascript":
      case "typescript":
        return [
          "class_declaration",
          "interface_declaration",
          "type_alias_declaration",
        ];
      case "python":
        return ["class_definition"];
      case "java":
        return [
          "class_declaration",
          "interface_declaration",
          "enum_declaration",
        ];
      case "go":
        return ["type_declaration"];
      case "rust":
        return ["struct_item", "enum_item", "trait_item", "impl_item"];
      case "php":
        return [
          "class_declaration",
          "interface_declaration",
          "trait_declaration",
          "enum_declaration",
        ];
      default:
        return [];
    }
  }

  /**
   * Extract class information from AST node
   */
  private extractClassInfo(
    node: SyntaxNode,
    content: string,
    languageId: string,
  ): ExtractedClass | null {
    let name = "";
    let type: ExtractedClass["type"] = "class";
    let extendsClause: string | undefined;
    const implementsClauses: string[] = [];
    const methods: ExtractedMethod[] = [];
    const properties: ExtractedProperty[] = [];
    const decorators: string[] = [];

    // Find name based on language
    const nameNode = node.childForFieldName("name");
    if (nameNode) {
      name = nameNode.text;
    }

    if (!name) return null;

    // Determine type
    if (node.type.includes("interface")) type = "interface";
    else if (node.type.includes("struct")) type = "struct";
    else if (node.type.includes("trait")) type = "trait";
    else if (node.type.includes("enum")) type = "enum";

    // Extract extends/implements
    for (const child of node.children) {
      if (child.type === "extends_clause" || child.type === "class_heritage") {
        const superClass = child.children.find(
          (c: any) => c.type === "identifier" || c.type === "type_identifier",
        );
        if (superClass) extendsClause = superClass.text;
      }
      if (child.type === "implements_clause") {
        for (const impl of child.children) {
          if (impl.type === "identifier" || impl.type === "type_identifier") {
            implementsClauses.push(impl.text);
          }
        }
      }
    }

    // Extract methods
    const methodTypes = this.getMethodNodeTypes(languageId);
    const visitMethods = (n: SyntaxNode) => {
      if (methodTypes.includes(n.type)) {
        const method = this.extractMethodInfo(n, content, languageId);
        if (method) methods.push(method);
      }
      for (const child of n.children) {
        visitMethods(child);
      }
    };
    visitMethods(node);

    // Extract decorators (for languages that support them)
    if (languageId === "typescript" || languageId === "javascript") {
      const prevSibling = node.previousSibling;
      if (prevSibling?.type === "decorator") {
        decorators.push(prevSibling.text);
      }
    }

    return {
      name,
      type,
      extends: extendsClause,
      implements: implementsClauses.length > 0 ? implementsClauses : undefined,
      methods,
      properties,
      decorators: decorators.length > 0 ? decorators : undefined,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
    };
  }

  /**
   * Get method node types for a language
   */
  private getMethodNodeTypes(languageId: string): string[] {
    switch (languageId) {
      case "javascript":
      case "typescript":
        return ["method_definition", "public_field_definition"];
      case "python":
        return ["function_definition"];
      case "java":
        return ["method_declaration", "constructor_declaration"];
      case "go":
        return ["method_declaration", "function_declaration"];
      case "rust":
        return ["function_item"];
      case "php":
        return ["method_declaration"];
      default:
        return [];
    }
  }

  /**
   * Extract method information
   */
  private extractMethodInfo(
    node: SyntaxNode,
    content: string,
    languageId: string,
  ): ExtractedMethod | null {
    const nameNode = node.childForFieldName("name");
    if (!nameNode) return null;

    const name = nameNode.text;
    const params: string[] = [];
    let visibility: ExtractedMethod["visibility"] = "public";
    let isStatic = false;
    let isAsync = false;

    // Extract parameters
    const paramsNode = node.childForFieldName("parameters");
    if (paramsNode) {
      for (const param of paramsNode.children) {
        if (
          param.type === "identifier" ||
          param.type === "required_parameter" ||
          param.type === "optional_parameter"
        ) {
          const paramName = param.childForFieldName("name") || param;
          params.push(paramName.text);
        }
      }
    }

    // Check modifiers
    for (const child of node.children) {
      if (child.text === "private") visibility = "private";
      if (child.text === "protected") visibility = "protected";
      if (child.text === "static") isStatic = true;
      if (child.text === "async") isAsync = true;
    }

    return {
      name,
      params,
      visibility,
      isStatic: isStatic || undefined,
      isAsync: isAsync || undefined,
      startLine: node.startPosition.row + 1,
    };
  }

  /**
   * Extract standalone functions
   */
  private extractFunctions(
    tree: Tree,
    content: string,
    languageId: string,
  ): ExtractedFunction[] {
    const functions: ExtractedFunction[] = [];
    const rootNode = tree.rootNode;

    const functionTypes = this.getFunctionNodeTypes(languageId);

    const visit = (node: SyntaxNode, depth: number) => {
      // Only extract top-level functions (depth 1 for most, 2 for module patterns)
      if (functionTypes.includes(node.type) && depth <= 2) {
        const fn = this.extractFunctionInfo(node, content, languageId);
        if (fn) functions.push(fn);
      }

      for (const child of node.children) {
        visit(child, depth + 1);
      }
    };

    visit(rootNode, 0);
    return functions;
  }

  /**
   * Get function node types for a language
   */
  private getFunctionNodeTypes(languageId: string): string[] {
    switch (languageId) {
      case "javascript":
      case "typescript":
        return [
          "function_declaration",
          "arrow_function",
          "function_expression",
          "lexical_declaration",
        ];
      case "python":
        return ["function_definition"];
      case "java":
        return ["method_declaration"];
      case "go":
        return ["function_declaration"];
      case "rust":
        return ["function_item"];
      case "php":
        return ["function_definition"];
      default:
        return [];
    }
  }

  /**
   * Extract function information
   */
  private extractFunctionInfo(
    node: SyntaxNode,
    content: string,
    languageId: string,
  ): ExtractedFunction | null {
    let name = "";
    const params: string[] = [];
    let isExported = false;
    let isAsync = false;

    // Handle different function declaration patterns
    if (
      node.type === "lexical_declaration" ||
      node.type === "variable_declaration"
    ) {
      // const foo = () => {} or const foo = function() {}
      const declarator = node.children.find(
        (c: any) => c.type === "variable_declarator",
      );
      if (declarator) {
        const nameNode = declarator.childForFieldName("name");
        const valueNode = declarator.childForFieldName("value");
        if (
          nameNode &&
          valueNode &&
          (valueNode.type === "arrow_function" ||
            valueNode.type === "function_expression")
        ) {
          name = nameNode.text;
        }
      }
    } else {
      const nameNode = node.childForFieldName("name");
      if (nameNode) name = nameNode.text;
    }

    if (!name) return null;

    // Extract parameters
    const paramsNode = node.childForFieldName("parameters");
    if (paramsNode) {
      for (const param of paramsNode.children) {
        if (param.type !== "(" && param.type !== ")" && param.type !== ",") {
          const paramName = param.childForFieldName("name") || param;
          if (paramName.type === "identifier") {
            params.push(paramName.text);
          }
        }
      }
    }

    // Check if exported
    const parent = node.parent;
    if (parent?.type === "export_statement") {
      isExported = true;
    }

    // Check for async
    for (const child of node.children) {
      if (child.text === "async") isAsync = true;
    }

    return {
      name,
      params,
      isExported: isExported || undefined,
      isAsync: isAsync || undefined,
      startLine: node.startPosition.row + 1,
    };
  }

  /**
   * Extract API endpoints using regex patterns
   */
  private extractEndpoints(
    content: string,
    filePath: string,
    languageId: string,
  ): ExtractedEndpoint[] {
    const endpoints: ExtractedEndpoint[] = [];
    const patterns = API_ENDPOINT_QUERIES[languageId] || [];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = (match[1] || "GET").toUpperCase();
        const path = match[2] || match[1] || "";

        if (path && !path.startsWith("@")) {
          const line = content.substring(0, match.index).split("\n").length;
          endpoints.push({
            method,
            path: path.startsWith("/") ? path : `/${path}`,
            file: filePath,
            line,
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Extract imports
   */
  private extractImports(
    tree: Tree,
    content: string,
    languageId: string,
  ): ExtractedImport[] {
    const imports: ExtractedImport[] = [];
    const rootNode = tree.rootNode;

    const importTypes = this.getImportNodeTypes(languageId);

    const visit = (node: SyntaxNode) => {
      if (importTypes.includes(node.type)) {
        const imp = this.extractImportInfo(node, languageId);
        if (imp) imports.push(imp);
      }
      for (const child of node.children) {
        visit(child);
      }
    };

    visit(rootNode);
    return imports;
  }

  /**
   * Get import node types
   */
  private getImportNodeTypes(languageId: string): string[] {
    switch (languageId) {
      case "javascript":
      case "typescript":
        return ["import_statement"];
      case "python":
        return ["import_statement", "import_from_statement"];
      case "java":
        return ["import_declaration"];
      case "go":
        return ["import_declaration"];
      case "rust":
        return ["use_declaration"];
      case "php":
        return ["namespace_use_declaration"];
      default:
        return [];
    }
  }

  /**
   * Extract import information
   */
  private extractImportInfo(
    node: SyntaxNode,
    languageId: string,
  ): ExtractedImport | null {
    let source = "";
    const specifiers: string[] = [];
    let isDefault = false;
    let isNamespace = false;

    if (languageId === "javascript" || languageId === "typescript") {
      // Find source
      const sourceNode = node.childForFieldName("source");
      if (sourceNode) {
        source = sourceNode.text.replace(/['"]/g, "");
      }

      // Find specifiers
      for (const child of node.children) {
        if (child.type === "import_clause") {
          for (const spec of child.children) {
            if (spec.type === "identifier") {
              specifiers.push(spec.text);
              isDefault = true;
            } else if (spec.type === "namespace_import") {
              isNamespace = true;
              const asNode = spec.children.find(
                (c: any) => c.type === "identifier",
              );
              if (asNode) specifiers.push(asNode.text);
            } else if (spec.type === "named_imports") {
              for (const named of spec.children) {
                if (named.type === "import_specifier") {
                  const nameNode = named.childForFieldName("name");
                  if (nameNode) specifiers.push(nameNode.text);
                }
              }
            }
          }
        }
      }
    } else if (languageId === "python") {
      // Python imports
      const moduleNode = node.childForFieldName("module_name");
      if (moduleNode) {
        source = moduleNode.text;
      }

      for (const child of node.children) {
        if (child.type === "dotted_name") {
          if (!source) source = child.text;
        } else if (
          child.type === "aliased_import" ||
          child.type === "import_from_as_name"
        ) {
          const nameNode = child.children[0];
          if (nameNode) specifiers.push(nameNode.text);
        }
      }
    }

    if (!source) return null;

    return {
      source,
      specifiers,
      isDefault: isDefault || undefined,
      isNamespace: isNamespace || undefined,
    };
  }

  /**
   * Extract exports
   */
  private extractExports(
    tree: Tree,
    content: string,
    languageId: string,
  ): string[] {
    const exports: string[] = [];
    const rootNode = tree.rootNode;

    const visit = (node: SyntaxNode) => {
      if (
        node.type === "export_statement" ||
        node.type === "export_declaration"
      ) {
        // Find exported name
        for (const child of node.children) {
          if (
            child.type === "function_declaration" ||
            child.type === "class_declaration"
          ) {
            const nameNode = child.childForFieldName("name");
            if (nameNode) exports.push(nameNode.text);
          } else if (child.type === "lexical_declaration") {
            const declarator = child.children.find(
              (c: any) => c.type === "variable_declarator",
            );
            if (declarator) {
              const nameNode = declarator.childForFieldName("name");
              if (nameNode) exports.push(nameNode.text);
            }
          } else if (child.type === "export_clause") {
            for (const spec of child.children) {
              if (spec.type === "export_specifier") {
                const nameNode = spec.childForFieldName("name");
                if (nameNode) exports.push(nameNode.text);
              }
            }
          }
        }
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    visit(rootNode);
    return exports;
  }

  /**
   * Extract React components (functional and class-based)
   */
  private extractReactComponents(
    tree: Tree,
    content: string,
  ): ExtractedClass[] {
    const components: ExtractedClass[] = [];
    const rootNode = tree.rootNode;

    const visit = (node: SyntaxNode) => {
      // Functional components: const Foo = () => <div>...</div>
      if (
        node.type === "lexical_declaration" ||
        node.type === "variable_declaration"
      ) {
        const declarator = node.children.find(
          (c: any) => c.type === "variable_declarator",
        );
        if (declarator) {
          const nameNode = declarator.childForFieldName("name");
          const valueNode = declarator.childForFieldName("value");

          if (nameNode && valueNode) {
            const name = nameNode.text;
            // Check if name starts with uppercase (React convention)
            if (
              name[0] === name[0].toUpperCase() &&
              name[0] !== name[0].toLowerCase()
            ) {
              // Check if it returns JSX
              const hasJSX = this.containsJSX(valueNode);
              if (hasJSX) {
                components.push({
                  name,
                  type: "class", // Treat as class for consistency
                  methods: [],
                  properties: [],
                  startLine: node.startPosition.row + 1,
                  endLine: node.endPosition.row + 1,
                });
              }
            }
          }
        }
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    visit(rootNode);
    return components;
  }

  /**
   * Check if node contains JSX
   */
  private containsJSX(node: SyntaxNode): boolean {
    if (
      node.type === "jsx_element" ||
      node.type === "jsx_self_closing_element"
    ) {
      return true;
    }
    for (const child of node.children) {
      if (this.containsJSX(child)) return true;
    }
    return false;
  }

  /**
   * Get first N lines of code as snippet
   */
  private getCodeSnippet(content: string, maxLines: number): string {
    const lines = content.split("\n").slice(0, maxLines);
    return lines.join("\n");
  }

  /**
   * Create empty result
   */
  private createEmptyResult(filePath: string): TreeSitterAnalysisResult {
    return {
      classes: [],
      functions: [],
      endpoints: [],
      imports: [],
      exports: [],
    };
  }
}

/**
 * Singleton instance for use in workers
 */
let analyzerInstance: TreeSitterAnalyzer | null = null;

export function getTreeSitterAnalyzer(
  grammarsPath?: string,
): TreeSitterAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new TreeSitterAnalyzer(grammarsPath);
  }
  return analyzerInstance;
}
