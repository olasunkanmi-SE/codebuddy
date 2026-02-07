import { TreeSitterParser } from "../ast/parser/tree-sitter.parser";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import {
  ICompletionContext,
  IImportSignature,
} from "../interfaces/completion.interface";
import { IOutputChannel } from "../interfaces/output-channel";
import { ITextDocument } from "../interfaces/editor-host";
// import { SyntaxNode } from "web-tree-sitter";

export class ContextCompletionService {
  private static instance: ContextCompletionService;
  private logger: Logger;
  private parser: TreeSitterParser | null = null;
  private readonly maxPrefixTokens = 2000;
  private readonly maxSuffixTokens = 500;

  private constructor(extensionPath: string, outputChannel: IOutputChannel) {
    this.logger = Logger.initialize("ContextCompletionService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.parser = TreeSitterParser.getInstance(extensionPath, outputChannel);
  }

  public static getInstance(
    extensionPath: string,
    outputChannel: IOutputChannel,
  ): ContextCompletionService {
    if (!ContextCompletionService.instance) {
      ContextCompletionService.instance = new ContextCompletionService(
        extensionPath,
        outputChannel,
      );
    }
    return ContextCompletionService.instance;
  }

  /**
   * Gather context for the current cursor position
   */
  public async gatherContext(
    document: ITextDocument,
    position: { line: number; character: number },
  ): Promise<ICompletionContext> {
    // 1. Get Prefix and Suffix (basic text splitting)
    // We limit the size to avoid blowing up the context window
    const fullText = document.getText();
    const offset = document.offsetAt(position);

    const prefixStart = Math.max(0, offset - this.maxPrefixTokens * 4); // Approx 4 chars per token
    const suffixEnd = Math.min(
      fullText.length,
      offset + this.maxSuffixTokens * 4,
    );

    const prefix = fullText.substring(prefixStart, offset);
    const suffix = fullText.substring(offset, suffixEnd);

    // 2. Extract Imports using Tree-Sitter
    let imports: IImportSignature[] = [];
    try {
      if (this.parser) {
        // Attempt initialization if not ready
        if (!this.parser.initialized()) {
          this.logger.debug(
            "TreeSitter parser not ready, attempting initialization...",
          );
          try {
            await this.parser.initialize();
          } catch (initError) {
            this.logger.error("Failed to initialize TreeSitter parser", {
              error: initError,
            });
          }
        }

        if (this.parser.initialized()) {
          imports = await this.extractImportSignatures(document);
        } else {
          this.logger.warn(
            "TreeSitter parser not ready after initialization attempt, skipping import extraction",
          );
        }
      }
    } catch (e) {
      this.logger.error("Failed to extract imports", { error: e });
    }

    return {
      prefix,
      suffix,
      languageId: document.languageId,
      imports,
      cursorPosition: position,
    };
  }

  /**
   * Extract imported symbols using Tree-Sitter AST
   */
  private async extractImportSignatures(
    document: ITextDocument,
  ): Promise<IImportSignature[]> {
    const tree = await this.parser?.parse(
      document.getText(),
      document.languageId,
    );
    if (!tree) return [];

    const rootNode = tree.rootNode;
    const imports: IImportSignature[] = [];

    // Query for imports based on language
    // This is a simplified example. In reality, we need per-language queries.
    if (
      document.languageId === "typescript" ||
      document.languageId === "javascript" ||
      document.languageId === "typescriptreact"
    ) {
      this.extractTsImports(rootNode, imports);
    } else if (document.languageId === "python") {
      this.extractPythonImports(rootNode, imports);
    }

    return imports;
  }

  private extractTsImports(root: any, imports: IImportSignature[]) {
    // Look for 'import_statement' nodes
    // (import_clause (named_imports (import_specifier (identifier) @name)))
    // This is manual traversal. Ideally, we use tree.query() with S-expressions.

    // Using a simple traversal for robustness if grammar varies
    for (const child of root.children) {
      if (child.type === "import_statement") {
        const sourceNode = child.childForFieldName("source");
        const sourcePath = sourceNode?.text.replace(/['"]/g, "") || "";

        // Find what is being imported
        // This is a simplification. A real implementation needs to handle default vs named imports.
        const importClause = child.children.find(
          (c: any) => c.type === "import_clause",
        );
        if (importClause) {
          const namedImports = importClause.children.find(
            (c: any) => c.type === "named_imports",
          );
          if (namedImports) {
            for (const specifier of namedImports.children) {
              if (specifier.type === "import_specifier") {
                const nameNode = specifier.children.find(
                  (n: any) => n.type === "identifier",
                );
                if (nameNode) {
                  imports.push({
                    name: nameNode.text,
                    signature: `import { ${nameNode.text} } from '${sourcePath}'`, // Placeholder signature
                    file: sourcePath,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  private extractPythonImports(root: any, imports: IImportSignature[]) {
    for (const child of root.children) {
      if (
        child.type === "import_from_statement" ||
        child.type === "import_statement"
      ) {
        // Python extraction logic
        imports.push({
          name: "python_import_placeholder",
          signature: child.text,
          file: "unknown",
        });
      }
    }
  }
}
