import { CacheManager } from "../cache/cache.manager";
import { TreeSitterParser } from "../parser/tree-sitter.parser";
import { IParsedFile } from "../query-types";
import { LanguageDetector } from "../parser/language-detector";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { IOutputChannel } from "../../interfaces/output-channel";
import { EditorHostService } from "../../services/editor-host.service";
import { TextDecoder } from "util";

export class FileParser {
  private readonly logger: Logger;
  private static instance: FileParser;

  constructor(
    private parser: TreeSitterParser,
    private cacheManager: CacheManager,
    private outputChannel: IOutputChannel,
  ) {
    this.logger = Logger.initialize("QueryExecutor", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(
    parser: TreeSitterParser,
    cacheManager: CacheManager,
    outputChannel: IOutputChannel,
  ) {
    return (FileParser.instance ??= new FileParser(
      parser,
      cacheManager,
      outputChannel,
    ));
  }

  async parseFile(filePath: string): Promise<IParsedFile | undefined> {
    try {
      const contentBytes = await EditorHostService.getInstance()
        .getHost()
        .workspace.fs.readFile(filePath);
      const content = new TextDecoder().decode(contentBytes);
      const cached = await this.cacheManager.get(filePath, content);
      if (cached) {
        return cached;
      }
      const language = LanguageDetector.detectFromFilePath(filePath);
      if (!language) {
        return undefined;
      }
      const tree = await this.parser.parse(content, language);
      if (!tree) {
        return undefined;
      }
      const parsedFile: IParsedFile = {
        tree,
        language,
        content,
        filePath,
      };
      this.cacheManager.set(filePath, parsedFile);
      return parsedFile;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(
        `Error parsing file ${filePath}: ${errorMsg}`,
      );
      this.logger.error(
        `Error parsing file ${filePath}: ${errorMsg}`,
        error.stack,
      );
      return undefined;
    }
  }

  /**
   * Parses multiple files in parallel using Promise.all
   */
  async parseFiles(
    filePaths: string[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<Map<string, IParsedFile>> {
    const results = new Map<string, IParsedFile>();
    let completed = 0;

    const parsePromises = filePaths.map(async (filePath) => {
      try {
        const parsed = await this.parseFile(filePath);
        completed++;
        if (onProgress) {
          onProgress(completed, filePaths.length);
        }

        return { filePath, parsed };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.outputChannel.appendLine(`Error parsing ${filePath}: ${errorMsg}`);
        this.logger.info(`Error parsing ${filePath}: ${errorMsg}`);

        completed++;
        if (onProgress) {
          onProgress(completed, filePaths.length);
        }

        return { filePath, parsed: undefined };
      }
    });

    const parsedResults = await Promise.all(parsePromises);

    for (const { filePath, parsed } of parsedResults) {
      if (parsed) {
        results.set(filePath, parsed);
      }
    }

    return results;
  }

  async parseFilesBatched(
    filePaths: string[],
    batchSize: number,
    onProgress?: (current: number, total: number) => void,
  ): Promise<Map<string, IParsedFile>> {
    const result = new Map<string, IParsedFile>();
    let completed = 0;

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchPromise = batch.map(async (filePath) => {
        try {
          const parsed = await this.parseFile(filePath);
          return { filePath, parsed };
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          this.outputChannel.appendLine(
            `Error parsing ${filePath}: ${errorMsg}`,
          );
          this.logger.error(`Error parsing ${filePath}: ${errorMsg}`);
          return { filePath, parsed: undefined };
        }
      });
      const batchResults = await Promise.all(batchPromise);

      for (const { filePath, parsed } of batchResults) {
        if (parsed) {
          result.set(filePath, parsed);
        }

        completed++;
        if (onProgress) {
          onProgress(completed, filePath.length);
        }
      }
    }
    return result;
  }

  canParse(filePath: string): boolean {
    return LanguageDetector.isSupported(filePath);
  }

  getCacheStats(): { size: number; hits: number } {
    return {
      size: this.cacheManager.size(),
      hits: 0,
    };
  }
}
