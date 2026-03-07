import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { getAPIKeyAndModel, getGenerativeAiModel } from "../utils/utils";
import { SqliteVectorStore, VectorDocument } from "./sqlite-vector-store";
import { EmbeddingService } from "./embedding";

const MIN_RESPONSE_LENGTH = 200;
const MAX_RESPONSE_LENGTH = 8000;
const THROTTLE_INTERVAL_MS = 30_000; // Minimum 30s between extraction calls

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.0-flash",
  anthropic: "claude-3-5-haiku-latest",
  openai: "gpt-4o-mini",
};

const LLM_EXTRACTION_CONFIG = {
  maxTokens: 1024,
  temperature: 0.3,
} as const;

const EXTRACTION_SYSTEM_INSTRUCTION = `You are a knowledge extraction assistant. Extract key factual findings, technical decisions, code patterns, and actionable insights as concise bullet points.

Rules:
- Each bullet should be a self-contained fact or insight (understandable without the original conversation)
- Skip pleasantries, filler, and meta-commentary (e.g. "Here's what I found")
- Focus on technical content: algorithms, patterns, configurations, API details, architecture decisions
- If the response contains code, summarize what the code does rather than repeating it
- Return ONLY the bullet points, one per line, prefixed with "- "
- If the response has no extractable knowledge (e.g. it's a greeting or clarification question), return exactly: NONE`;

/**
 * Extracts key findings from AI responses and stores them in the vector store
 * as "research_note" chunks for cross-session knowledge accumulation.
 *
 * Runs asynchronously after each response — never blocks the user.
 */
interface ResearchNotesExtractorDeps {
  vectorStore?: SqliteVectorStore;
  logger?: Logger;
}

export class ResearchNotesExtractor {
  private static instance: ResearchNotesExtractor;
  private readonly logger: Logger;
  private readonly vectorStore: SqliteVectorStore;
  private embeddingService: EmbeddingService | undefined;
  private anthropic: Anthropic | undefined;
  private genAI: GoogleGenerativeAI | undefined;
  private openai: OpenAI | undefined;
  private provider: string;
  private modelName: string | undefined;
  private lastExtractionTime = 0;
  private isExtractionEnabled = false;
  private extractionInProgress = false;

  private constructor(deps?: ResearchNotesExtractorDeps) {
    this.logger =
      deps?.logger ??
      Logger.initialize("ResearchNotesExtractor", {
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableFile: true,
        enableTelemetry: true,
      });
    this.vectorStore = deps?.vectorStore ?? SqliteVectorStore.getInstance();
    this.provider = "";
    this.initializeProvider();
  }

  static getInstance(): ResearchNotesExtractor {
    return (ResearchNotesExtractor.instance ??= new ResearchNotesExtractor());
  }

  /** Create an instance with injected dependencies — for testing only. */
  static createForTesting(
    deps: ResearchNotesExtractorDeps,
  ): ResearchNotesExtractor {
    return new ResearchNotesExtractor(deps);
  }

  private initializeProvider(): void {
    try {
      const providerName = getGenerativeAiModel() || "Gemini";
      const { apiKey, model, baseUrl } = getAPIKeyAndModel(providerName);
      this.provider = providerName.toLowerCase();
      this.modelName = model;

      if (!apiKey) {
        this.logger.warn(
          "No API key configured — research notes extraction disabled",
        );
        this.isExtractionEnabled = false;
        return;
      }

      // Initialize LLM client based on provider
      switch (this.provider) {
        case "gemini":
          this.genAI = new GoogleGenerativeAI(apiKey);
          break;
        case "anthropic":
          this.anthropic = new Anthropic({ apiKey });
          break;
        default:
          // OpenAI-compatible providers (OpenAI, DeepSeek, Groq, Qwen, GLM, Local)
          this.openai = new OpenAI({ apiKey, baseURL: baseUrl });
          break;
      }

      // Initialize embedding service for vectorizing notes
      this.embeddingService = new EmbeddingService({
        apiKey,
        provider: providerName,
        baseUrl,
      });

      this.isExtractionEnabled = true;
    } catch (error) {
      this.isExtractionEnabled = false;
      this.logger.warn("Failed to initialize research notes provider", error);
    }
  }

  /**
   * Determine if a response is worth extracting notes from.
   */
  private shouldExtract(_userQuery: string, aiResponse: string): boolean {
    if (aiResponse.length < MIN_RESPONSE_LENGTH) {
      return false;
    }

    // Skip responses that are mostly code blocks with little explanatory text
    const completeCodeBlocks = (aiResponse.match(/```[\s\S]*?```/g) || [])
      .length;
    const textOutsideCode = aiResponse.replace(/```[\s\S]*?```/g, "").trim();
    if (
      completeCodeBlocks > 0 &&
      textOutsideCode.length < MIN_RESPONSE_LENGTH
    ) {
      return false;
    }

    return true;
  }

  /**
   * Route a prompt to the configured LLM provider.
   * @throws if no provider is initialized
   */
  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const model =
      this.modelName || DEFAULT_MODELS[this.provider] || DEFAULT_MODELS.openai;

    if (this.genAI) {
      const genModel = this.genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
      });
      const result = await genModel.generateContent(userPrompt);
      return result.response.text();
    }

    if (this.anthropic) {
      const result = await this.anthropic.messages.create({
        model,
        max_tokens: LLM_EXTRACTION_CONFIG.maxTokens,
        temperature: LLM_EXTRACTION_CONFIG.temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = result.content[0];
      return block.type === "text" ? block.text : "";
    }

    if (this.openai) {
      const result = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: LLM_EXTRACTION_CONFIG.maxTokens,
        temperature: LLM_EXTRACTION_CONFIG.temperature,
      });
      return result.choices[0]?.message?.content || "";
    }

    throw new Error(
      `No LLM provider initialized for extraction (provider: "${this.provider}")`,
    );
  }

  /**
   * Extract research notes from an AI response using a lightweight LLM call.
   */
  private async extractNotes(
    userQuery: string,
    aiResponse: string,
  ): Promise<string[]> {
    // Truncate to avoid blowing up the extraction context
    const truncatedResponse =
      aiResponse.length > MAX_RESPONSE_LENGTH
        ? aiResponse.slice(0, MAX_RESPONSE_LENGTH) + "\n...(truncated)"
        : aiResponse;

    const userPrompt = `User Query:\n${userQuery}\n\nAI Response:\n${truncatedResponse}\n\nResearch Notes:`;

    const raw = await this.callLLM(EXTRACTION_SYSTEM_INSTRUCTION, userPrompt);
    if (!raw) {
      return [];
    }

    // Parse bullet points
    if (raw.trim() === "NONE") {
      return [];
    }

    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim())
      .filter((note) => note.length > 10);
  }

  /**
   * Extracts and stores research notes from an AI response.
   * Runs asynchronously — safe to call without awaiting.
   *
   * @param userQuery - The original user question that prompted the response
   * @param aiResponse - The full AI response text to extract knowledge from
   * @param threadId - Optional conversation thread identifier for grouping notes
   */
  async processResponse(
    userQuery: string,
    aiResponse: string,
    threadId?: string,
  ): Promise<void> {
    if (!this.isExtractionEnabled || !this.vectorStore.isReady) {
      return;
    }

    // Mutex: only one extraction at a time
    if (this.extractionInProgress) {
      this.logger.debug("Extraction already in progress — skipping");
      return;
    }

    // Throttle: skip if last extraction was too recent
    const now = Date.now();
    if (now - this.lastExtractionTime < THROTTLE_INTERVAL_MS) {
      this.logger.debug(
        "Extraction throttled — skipping (too soon after last extraction)",
      );
      return;
    }

    // Claim the slot before any early-exit checks that follow
    this.extractionInProgress = true;
    this.lastExtractionTime = now;

    try {
      if (!this.shouldExtract(userQuery, aiResponse)) {
        this.logger.debug(
          "Response too short or code-only — skipping extraction",
        );
        return;
      }

      const notes = await this.extractNotes(userQuery, aiResponse);
      if (notes.length === 0) {
        this.logger.debug("No extractable research notes found");
        return;
      }

      this.logger.info(
        `Extracted ${notes.length} research notes from response`,
      );

      const thread = threadId || "default";

      // Generate embeddings — guard once outside the loop
      let embeddings: number[][];
      if (this.embeddingService) {
        embeddings = await Promise.all(
          notes.map((note) =>
            this.embeddingService!.generateEmbedding(note)
              .then((v) => v || [])
              .catch(() => [] as number[]),
          ),
        );
      } else {
        this.logger.debug(
          "Embedding service unavailable — storing notes without vectors",
        );
        embeddings = notes.map(() => []);
      }

      const docs: VectorDocument[] = notes.map((note, i) => ({
        id: `research_note::${thread}::${randomUUID()}`,
        text: `[Query: ${userQuery}] ${note}`,
        vector: embeddings[i],
        filePath: `research_notes/${thread}`,
        startLine: 0,
        endLine: 0,
        chunkType: "research_note",
        language: "",
      }));

      this.vectorStore.addDocuments(docs);
      this.vectorStore.saveToDisk();
      this.logger.info(
        `Stored ${docs.length} research notes (${embeddings.filter((e) => e.length > 0).length} with embeddings)`,
      );
    } catch (error) {
      // Never let extraction failures affect the user experience
      this.logger.warn("Research notes extraction failed", error);
    } finally {
      // Guarantee mutex release on all exit paths (early returns, success, or error)
      this.extractionInProgress = false;
    }
  }
}
