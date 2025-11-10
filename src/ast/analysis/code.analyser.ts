import * as path from "path";
import { TextDecoder } from "util";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { generateId } from "../../utils/utils";
import { authKeywords } from "../constants";
import { IAnalysisOutput, ICodeElement } from "../query-types";
import { LairExtractor } from "./../query-extractor";
import { CodeSearch } from "./code.search";
import { FileParser } from "./file.parser";
import { RelevanceScorer } from "./relevance.scrorer";

export class CodeAnalyzer {
  private readonly textDecoder = new TextDecoder();
  private readonly lairExtractor: LairExtractor;
  private readonly logger: Logger;
  private static instance: CodeAnalyzer;
  private readonly relevanceScorer: RelevanceScorer;

  constructor(
    private codeSearcher: CodeSearch,
    private readonly fileParser: FileParser,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.logger = Logger.initialize("QueryExecutor", {
      minLevel: LogLevel.DEBUG,
    });
    this.lairExtractor = LairExtractor.getInstance();
    this.relevanceScorer = RelevanceScorer.getInstance();
  }

  static getInstance(
    codeSearcher: CodeSearch,
    fileParser: FileParser,
    outputChannel: vscode.OutputChannel,
  ) {
    return (CodeAnalyzer.instance ??= new CodeAnalyzer(
      codeSearcher,
      fileParser,
      outputChannel,
    ));
  }

  async analyze(
    workspaceRoot: string,
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    cancellationToken: vscode.CancellationToken,
  ) {
    progress.report({
      message: "Scanning files with ripgrep...",
      increment: 5,
    });
    let result: string;
    let relevantFiles: string[];
    try {
      result = await this.codeSearcher.search(
        authKeywords,
        workspaceRoot,
        cancellationToken,
      );

      if (cancellationToken.isCancellationRequested) {
        return null;
      }
      if (result.length === 0) {
        this.outputChannel.appendLine(
          "No files related to authentication found.",
        );
        this.logger.info("No files related to authentication found.");
        return this.createEmptyOutput();
      }
      relevantFiles = result.split("\n");
    } catch (error: any) {
      if (error instanceof vscode.CancellationError) {
        return null;
      }
      this.logger.error(
        `Error returning relevant files for keywords ${authKeywords}`,
        error.stack,
      );
      throw error;
    }

    progress.report({ message: "Parsing files...", increment: 0 });
    const allAuthElements: ICodeElement[] = [];
    const progressIncrement = 70 / relevantFiles.length;

    for (let i = 0; i < relevantFiles.length; i++) {
      if (cancellationToken.isCancellationRequested) {
        return null;
      }

      const filePath = relevantFiles[i];
      const fileName = path.basename(filePath);
      const progressPercent = Math.round((i / relevantFiles.length) * 100);

      progress.report({
        message: `[${progressPercent}%] Parsing ${fileName}`,
        increment: progressIncrement,
      });

      try {
        const parsed = await this.fileParser.parseFile(filePath);
        if (parsed) {
          const lairElements = await this.lairExtractor.extract(parsed);

          const authElements = this.lairExtractor.filterByKeyWords(
            lairElements,
            authKeywords,
          );

          allAuthElements.push(...authElements);
        } else {
          const textElements = await this.performTextSearch(
            filePath,
            workspaceRoot,
          );
          allAuthElements.push(...textElements);
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.outputChannel.appendLine(
          `Error processing file ${filePath}: ${errorMsg}`,
        );
        this.logger.error(
          `Error processing file ${filePath}: ${errorMsg}`,
          error.stack,
        );
      }
    }
    if (cancellationToken.isCancellationRequested) {
      return null;
    }

    progress.report({ message: "Generating summary...", increment: 20 });

    if (allAuthElements.length === 0) {
      this.outputChannel.appendLine(
        "No authentication-related code elements found.",
      );
      this.logger.info("No authentication-related code elements found.");
      return this.createEmptyOutput();
    }

    // Step 3: Apply relevance scoring and filtering
    progress.report({
      message: "Scoring and filtering results...",
      increment: 15,
    });
    const filteredElements = this.applyRelevanceFiltering(allAuthElements);

    // Step 4: Format final results
    progress.report({ message: "Generating summary...", increment: 5 });
    return this.formatResults(filteredElements, workspaceRoot);
  }

  private async performTextSearch(
    filePath: string,
    workspaceRoot: string,
  ): Promise<ICodeElement[]> {
    this.outputChannel.appendLine(
      `Falling back to text search for ${path.relative(workspaceRoot, filePath)}`,
    );
    this.logger.info(
      `Falling back to text search for ${path.relative(workspaceRoot, filePath)}`,
    );

    const elements: ICodeElement[] = [];

    try {
      const content = this.textDecoder.decode(
        await vscode.workspace.fs.readFile(vscode.Uri.file(filePath)),
      );

      const lines = content.split("\n");
      const lowerKeywords = authKeywords.map((k) => k.toLowerCase());

      lines.forEach((line, index) => {
        if (lowerKeywords.some((kw) => line.toLowerCase().includes(kw))) {
          elements.push({
            id: generateId(),
            type: "other",
            name: `Line ${index + 1}`,
            filePath,
            startPosition: { row: index, column: 0 },
            endPosition: { row: index, column: line.length },
            codeSnippet: line.trim(),
            children: [],
          });
        }
      });
    } catch (error: any) {
      this.outputChannel.appendLine(`Error reading file ${filePath}: ${error}`);
      this.logger.error(
        `Error reading file ${filePath}: ${error}`,
        error.stack,
      );
    }
    return elements;
  }

  private formatResults(
    elements: ICodeElement[],
    workspaceRoot: string,
  ): IAnalysisOutput {
    const groupedByFile = new Map<string, ICodeElement[]>();
    const elementsByType: Record<string, number> = {};

    for (const element of elements) {
      if (!groupedByFile.has(element.filePath)) {
        groupedByFile.set(element.filePath, []);
      }
      groupedByFile.get(element.filePath)!.push(element);
      elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
    }

    return {
      summary: {
        totalElements: elements.length,
        fileCount: groupedByFile.size,
        elementsByType,
      },
      files: Array.from(groupedByFile.entries()).map(
        ([filePath, elements]) => ({
          path: filePath,
          relativePath: path.relative(workspaceRoot, filePath),
          elements,
        }),
      ),
    };
  }

  /**
   * Creates an empty output structure
   */
  private createEmptyOutput(): IAnalysisOutput {
    return {
      summary: {
        totalElements: 0,
        fileCount: 0,
        elementsByType: {},
      },
      files: [],
    };
  }

  private applyRelevanceFiltering(elements: ICodeElement[]): ICodeElement[] {
    const uniqueElements = this.deduplicateElements(elements);
    const filterConfig = this.relevanceScorer.recommendConfig(
      uniqueElements.length,
    );

    this.outputChannel.appendLine(
      `Using config: minScore=${filterConfig.minScore}, maxElements=${filterConfig.maxElements}`,
    );
    this.logger.info(
      `Using config: minScore=${filterConfig.minScore}, maxElements=${filterConfig.maxElements}`,
    );

    const scoredElements = this.relevanceScorer.filterByRelevance(
      uniqueElements,
      filterConfig,
    );

    this.outputChannel.appendLine(
      `Filtered to ${scoredElements.length} most relevant elements\n`,
    );

    this.logger.info(
      `Filtered to ${scoredElements.length} most relevant elements\n`,
    );

    this.outputChannel.appendLine("=== TOP 10 MOST RELEVANT ELEMENTS ===");
    this.logger.info("=== TOP 10 MOST RELEVANT ELEMENTS ===");

    scoredElements.slice(0, 10).forEach((scored, i) => {
      this.outputChannel.appendLine(
        `${i + 1}. [${scored.element.type}] ${scored.element.name} (Score: ${scored.score})`,
      );
      this.outputChannel.appendLine(`Reasons: ${scored.reasons.join("; ")}`);
      this.logger.info(`Reasons: ${scored.reasons.join("; ")}`);
    });
    this.outputChannel.appendLine("");

    const llmSummary = this.relevanceScorer.generateLLMSummary(scoredElements);
    this.outputChannel.appendLine("=== LLM SUMMARY ===");
    this.logger.info("=== LLM SUMMARY ===");

    this.outputChannel.appendLine(
      `Total elements for LLM: ${llmSummary.elementCount}`,
    );
    this.logger.info("Total elements for LLM: ${llmSummary.elementCount}");

    this.outputChannel.appendLine(
      `Estimated tokens: ~${llmSummary.estimatedTokens}`,
    );
    this.logger.info(`Estimated tokens: ~${llmSummary.estimatedTokens}`);
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine(llmSummary.summary);

    return scoredElements.map((s) => s.element);
  }

  private deduplicateElements(elements: ICodeElement[]): ICodeElement[] {
    const seen = new Set<string>();
    const unique: ICodeElement[] = [];

    for (const element of elements) {
      const key = `${element.filePath}:${element.startPosition.row}:${element.startPosition.column}:${element.type}:${element.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(element);
      }
    }
    return unique;
  }
}
