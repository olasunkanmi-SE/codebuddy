import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { SqliteDatabaseService } from "./sqlite-database.service";
import { NewsItem } from "../interfaces/news.interface";
import { CompletionProviderFactory } from "../llms/completion-factory";
import {
  CompletionProviderType,
  ICompletionConfig,
  CompletionTriggerMode,
} from "../interfaces/completion.interface";
import { ICodeCompleter } from "../llms/interface";

interface NewsAnalysisResult {
  topics: string[];
  relevance_score: number;
  summary: string;
}

export class NewsAnalysisService {
  private static instance: NewsAnalysisService;
  private dbService: SqliteDatabaseService;
  private logger: Logger;
  private isAnalyzing = false;

  private constructor() {
    this.dbService = SqliteDatabaseService.getInstance();
    this.logger = Logger.initialize("NewsAnalysisService", {});
  }

  public static getInstance(): NewsAnalysisService {
    if (!NewsAnalysisService.instance) {
      NewsAnalysisService.instance = new NewsAnalysisService();
    }
    return NewsAnalysisService.instance;
  }

  /**
   * Analyze pending news items using the configured LLM
   */
  public async analyzePendingItems(): Promise<void> {
    if (this.isAnalyzing) {
      this.logger.info("Analysis already in progress, skipping...");
      return;
    }

    this.isAnalyzing = true;

    try {
      await this.dbService.ensureInitialized();

      // Fetch pending items
      const pendingItems = this.dbService.executeSql(
        `SELECT * FROM news_items WHERE analysis_status = 'pending' LIMIT 5`,
      ) as any[];

      if (pendingItems.length === 0) {
        this.logger.info("No pending news items to analyze.");
        return;
      }

      this.logger.info(`Analyzing ${pendingItems.length} news items...`);

      const llm = this.getLLM();
      if (!llm) {
        this.logger.warn("No LLM provider available for news analysis.");
        return;
      }

      const projectStack = await this.detectProjectStack();
      this.logger.info(`Detected project stack: ${projectStack.join(", ")}`);

      let userTopics: string[] = [];
      try {
        const { KnowledgeService } = await import("./knowledge.service");
        userTopics = (
          await KnowledgeService.getInstance().getTopTopics(20)
        ).map((t) => t.topic);
        this.logger.info(
          `Fetched user knowledge topics: ${userTopics.join(", ")}`,
        );
      } catch (e) {
        this.logger.warn("Failed to fetch user topics", e);
      }

      for (const item of pendingItems) {
        await this.analyzeItem(item, llm, projectStack, userTopics);
      }
    } catch (error) {
      this.logger.error("Error during news analysis", error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async detectProjectStack(): Promise<string[]> {
    const stack: Set<string> = new Set();
    try {
      // Check package.json
      const packageJsonFiles = await vscode.workspace.findFiles(
        "**/package.json",
        "**/node_modules/**",
        2,
      );
      for (const uri of packageJsonFiles) {
        try {
          const content = await vscode.workspace.fs.readFile(uri);
          const json = JSON.parse(Buffer.from(content).toString("utf8"));
          if (json.dependencies)
            Object.keys(json.dependencies).forEach((d) => stack.add(d));
          if (json.devDependencies)
            Object.keys(json.devDependencies).forEach((d) => stack.add(d));
        } catch (e) {
          // ignore invalid json
        }
      }

      // Check go.mod
      const goModFiles = await vscode.workspace.findFiles("**/go.mod", null, 1);
      if (goModFiles.length > 0) {
        stack.add("Go");
      }

      // Check requirements.txt
      const reqFiles = await vscode.workspace.findFiles(
        "**/requirements.txt",
        null,
        1,
      );
      if (reqFiles.length > 0) {
        stack.add("Python");
      }

      // Check Cargo.toml
      const cargoFiles = await vscode.workspace.findFiles(
        "**/Cargo.toml",
        null,
        1,
      );
      if (cargoFiles.length > 0) {
        stack.add("Rust");
      }
    } catch (e) {
      this.logger.warn("Failed to detect project stack", e);
    }
    return Array.from(stack).slice(0, 30);
  }

  private getLLM(): ICodeCompleter | undefined {
    const config = vscode.workspace.getConfiguration("codebuddy");
    // Use the chat model configuration if available, otherwise fallback
    // We'll try to reconstruct ICompletionConfig from vscode settings
    // This part assumes standard keys used in webview/chat.
    // Since we don't have direct access to the complex config object used in the webview,
    // we'll try to grab what we can or use defaults.

    // Using a simpler approach: Try to use the "Smart" model preference or default to Local/OpenAI
    // For now, let's try to grab the first available configured provider

    // NOTE: In a real implementation, we should share the config loading logic with the webview.
    // Here we'll do a best-effort read.

    const provider = config.get<string>("modelProvider") || "local";
    const model = config.get<string>("modelName") || "llama3";
    const apiKey = config.get<string>(`${provider}.apiKey`) || "";

    const completionConfig: ICompletionConfig = {
      provider: provider as CompletionProviderType,
      model: model,
      apiKey: apiKey,
      maxTokens: 1000,
      temperature: 0.1,
      enabled: true,
      debounceMs: 0,
      triggerMode: CompletionTriggerMode.Manual,
      multiLine: false,
    };

    return CompletionProviderFactory.getInstance().getProvider(
      completionConfig,
    );
  }

  private async analyzeItem(
    item: NewsItem,
    llm: ICodeCompleter,
    projectStack: string[] = [],
    userTopics: string[] = [],
  ): Promise<void> {
    try {
      this.logger.info(`Analyzing item: ${item.title}`);

      const stackContext =
        projectStack.length > 0
          ? `User's Project Stack: ${projectStack.join(", ")}`
          : "User's Project Stack: Unknown (General Software Engineering)";

      const knowledgeContext =
        userTopics.length > 0
          ? `User's Known Topics (Proficient): ${userTopics.join(", ")}`
          : "";

      const prompt = `
You are a technical news curator for a senior software engineer.
Analyze the following news item and extract:
1. A list of technical topics (tags) - e.g., "React", "Rust", "Security", "AI".
2. A relevance score (0.0 to 1.0) based on how important this is for the user.
   - If it matches the User's Project Stack, boost the score significantly (0.8+).
   - If it matches the User's Known Topics, boost the score as it aligns with their expertise.
   - If it is a critical industry shift (e.g., major security vulnerability, new paradigm), score high regardless of stack.
   - If it is niche and unrelated to the stack or known topics, score low (0.1-0.3).
3. A very concise technical summary (tl;dr).

${stackContext}
${knowledgeContext}

News Item:
Title: ${item.title}
Source: ${item.source}
Summary: ${item.summary || "No summary available"}
URL: ${item.url}

Output ONLY valid JSON in the following format:
{
  "topics": ["tag1", "tag2"],
  "relevance_score": 0.8,
  "summary": "..."
}
`;

      const response = await llm.completeCode(prompt, {
        temperature: 0.1,
        maxTokens: 500,
      });

      // Parse JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const result: NewsAnalysisResult = JSON.parse(jsonMatch[0]);

      // Update DB
      this.dbService.executeSqlCommand(
        `UPDATE news_items 
         SET topics = ?, relevance_score = ?, summary = ?, analysis_status = 'completed'
         WHERE id = ?`,
        [
          JSON.stringify(result.topics),
          result.relevance_score,
          result.summary || item.summary, // Use new summary if available, else keep old
          item.id,
        ],
      );

      this.logger.info(`Analysis complete for: ${item.title}`);
    } catch (error) {
      this.logger.error(`Failed to analyze item ${item.id}`, error);
      // Mark as failed so we don't retry forever in a tight loop
      this.dbService.executeSqlCommand(
        `UPDATE news_items SET analysis_status = 'failed' WHERE id = ?`,
        [item.id],
      );
    }
  }
}
