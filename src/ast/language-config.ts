/**
 * Language Configuration
 *
 * Defines grammar paths and Tree-sitter queries for each supported language.
 */

import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface ILanguageConfig {
  readonly grammarPath: string;
  readonly languageIdMap: readonly string[];
  readonly queries: {
    readonly functionDefinitions?: string;
    readonly classDefinitions?: string;
    readonly methodDefinitions?: string;
  };
}

const logger = Logger.initialize("extension-main", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

export const languageConfigs: Readonly<Record<string, ILanguageConfig>> = {
  javascript: {
    grammarPath: "src/grammars/tree-sitter-javascript.wasm",
    languageIdMap: ["js", "jsx", "mjs", "cjs", "javascript"],
    queries: {
      functionDefinitions: `
                (function_declaration name: (identifier) @name) @function.definition
                (variable_declarator name: (identifier) @name value: (function_expression)) @function.definition
                (variable_declarator name: (identifier) @name value: (arrow_function)) @function.definition
            `,
      classDefinitions: `(class_declaration name: (identifier) @name) @class.definition`,
      methodDefinitions: `(method_definition name: (property_identifier) @name) @method.definition`,
    },
  },
  typescript: {
    grammarPath: "src/grammars/tree-sitter-tsx.wasm",
    languageIdMap: ["ts", "tsx", "mts", "cts", "typescript"],
    queries: {
      functionDefinitions: `
                (function_declaration name: (identifier) @name) @function.definition
                (variable_declarator name: (identifier) @name value: (arrow_function)) @function.definition
                (variable_declarator name: (identifier) @name value: (function_expression)) @function.definition
            `,
      classDefinitions: `(class_declaration name: (type_identifier) @name) @class.definition`,
      methodDefinitions: `(method_definition name: (property_identifier) @name) @method.definition`,
    },
  },
  python: {
    grammarPath: "src/grammars/tree-sitter-python.wasm",
    languageIdMap: ["py", "python"],
    queries: {
      functionDefinitions: `(function_definition name: (identifier) @name) @function.definition`,
      classDefinitions: `(class_definition name: (identifier) @name) @class.definition`,
      methodDefinitions: `(function_definition name: (identifier) @name) @method.definition`,
    },
  },
  java: {
    grammarPath: "src/grammars/tree-sitter-java.wasm",
    languageIdMap: ["java"],
    queries: {
      functionDefinitions: `(method_declaration name: (identifier) @name) @function.definition`,
      classDefinitions: `(class_declaration name: (identifier) @name) @class.definition`,
      methodDefinitions: `(method_declaration name: (identifier) @name) @method.definition`,
    },
  },
  go: {
    grammarPath: "src/grammars/tree-sitter-go.wasm",
    languageIdMap: ["go"],
    queries: {
      functionDefinitions: `(function_declaration name: (identifier) @name) @function.definition`,
      classDefinitions: `(type_declaration name: (type_identifier) @name value: (struct_type)) @class.definition`,
    },
  },
  rust: {
    grammarPath: "src/grammars/tree-sitter-rust.wasm",
    languageIdMap: ["rs", "rust"],
    queries: {
      functionDefinitions: `(function_item name: (identifier) @name) @function.definition`,
      classDefinitions: `(struct_item name: (type_identifier) @name) @class.definition`,
      methodDefinitions: `(function_item name: (identifier) @name) @method.definition`,
    },
  },
};

export function validateLanguageConfig(
  languageId: string,
  config: ILanguageConfig,
): boolean {
  if (!config.grammarPath) {
    logger.error(`Invalid config for ${languageId}: missing grammarPath`);
    return false;
  }

  if (
    !config.queries?.functionDefinitions &&
    !config.queries?.classDefinitions
  ) {
    logger.warn(`Warning: ${languageId} has no query definition`);
  }
  return true;
}
