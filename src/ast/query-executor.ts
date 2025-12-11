import { Query, QueryMatch, Tree } from "web-tree-sitter";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class QueryExecutor {
  private logger: Logger;
  static instance: QueryExecutor;

  constructor() {
    this.logger = Logger.initialize("QueryExecutor", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance() {
    return (QueryExecutor.instance ??= new QueryExecutor());
  }

  execute(
    tree: Tree,
    lang: string,
    queryType: string,
    queryString?: string,
  ): QueryMatch[] {
    if (!queryString) {
      return [];
    }
    try {
      const query = new Query(tree.language, queryString);
      return Array.from(query.matches(tree.rootNode));
    } catch (error) {
      this.logger.error(`Error in ${queryType} query for ${lang}: ${error}`);
      return [];
    }
  }

  executeMultiple(
    tree: Tree,
    language: string,
    queries: Array<{ query?: string; type: string }>,
  ): Map<string, QueryMatch[]> {
    const result = new Map<string, QueryMatch[]>();
    for (const { query, type } of queries) {
      result.set(type, this.execute(tree, language, type, query));
    }
    return result;
  }

  isValidQuery(tree: Tree, queryString: string): boolean {
    try {
      new Query(tree.language, queryString);
      return true;
    } catch (error) {
      return false;
    }
  }
}
