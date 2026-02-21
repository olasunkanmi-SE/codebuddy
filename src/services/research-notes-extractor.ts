import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { getAPIKeyAndModel, getGenerativeAiModel } from "../utils/utils";
import { SqliteVectorStore, VectorDocument } from "./sqlite-vector-store";
import { EmbeddingService } from "./embedding";

const EXTRACTION_PROMPT = `You are a knowledge extraction assistant. Given an AI assistant's response to a user query, extract the key factual findings, technical decisions, code patterns, and actionable insights as concise bullet points.

Rules:
- Each bullet should be a self-contained fact or insight (understandable without the original conversation)
- Skip pleasantries, filler, and meta-commentary (e.g. "Here's what I found")
- Focus on technical content: algorithms, patterns, configurations, API details, architecture decisions
- If the response contains code, summarize what the code does rather than repeating it
- Return ONLY the bullet points, one per line, prefixed with "- "
- If the response has no extractable knowledge (e.g. it's a greeting or clarification question), return exactly: NONE

User Query:
{query}

AI Response:
{response}

Research Notes:`;

const MIN_RESPONSE_LENGTH = 200;
const MAX_RESPONSE_LENGTH = 8000;
const THROTTLE_INTERVAL_MS = 30_000; // Minimum 30s between extraction calls

/**
 * Extracts key findings from AI responses and stores them in the vector store
 * as "research_note" chunks for cross-session knowledge accumulation.
 *
 * Runs asynchronously after each response — never blocks the user.
 */
export class ResearchNotesExtractor {
  private static instance: ResearchNotesExtractor;
  private readonly logger: Logger;
  private readonly vectorStore: SqliteVectorStore;
  private embeddingService: EmbeddingService | undefined;
  private genAI: GoogleGenerativeAI | undefined;
  private openai: OpenAI | undefined;
  private provider: string;
  private modelName: string | undefined;
  private lastExtractionTime = 0;
  private isExtractionEnabled = false;

  private constructor() {
    this.logger = Logger.initialize("ResearchNotesExtractor", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.vectorStore = SqliteVectorStore.getInstance();
    this.provider = "";
    this.initializeProvider();
  }

  static getInstance(): ResearchNotesExtractor {
    return (ResearchNotesExtractor.instance ??= new ResearchNotesExtractor());
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

      // Initialize LLM client for extraction
      if (this.provider === "gemini") {
        this.genAI = new GoogleGenerativeAI(apiKey);
      } else {
        // OpenAI-compatible providers (OpenAI, DeepSeek, Groq, Local)
        this.openai = new OpenAI({ apiKey, baseURL: baseUrl });
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
  private shouldExtract(userQuery: string, aiResponse: string): boolean {
    // Too short — likely a greeting or simple answer
    if (aiResponse.length < MIN_RESPONSE_LENGTH) {
      return false;
    }

    // Skip pure code-generation responses (likely a diff/patch)
    const codeBlockCount = (aiResponse.match(/```/g) || []).length / 2;
    const textOutsideCode = aiResponse.replace(/```[\s\S]*?```/g, "").trim();
    if (codeBlockCount > 0 && textOutsideCode.length < 200) {
      return false;
    }

    return true;
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

    const prompt = EXTRACTION_PROMPT.replace("{query}", userQuery).replace(
      "{response}",
      truncatedResponse,
    );

    let raw = "";

    if (this.genAI) {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName || "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      raw = result.response.text();
    } else if (this.openai) {
      const result = await this.openai.chat.completions.create({
        model: this.modelName || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.3,
      });
      raw = result.choices[0]?.message?.content || "";
    } else {
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
   * Process an AI response: extract notes, embed them, and store in the vector store.
   * This runs fire-and-forget — it should never block the user's response.
   */
  async processResponse(
    userQuery: string,
    aiResponse: string,
    threadId?: string,
  ): Promise<void> {
    if (!this.isExtractionEnabled || !this.vectorStore.isReady) {
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

    if (!this.shouldExtract(userQuery, aiResponse)) {
      this.logger.debug(
        "Response too short or code-only — skipping extraction",
      );
      return;
    }

    this.lastExtractionTime = now;

    try {
      const notes = await this.extractNotes(userQuery, aiResponse);
      if (notes.length === 0) {
        this.logger.debug("No extractable research notes found");
        return;
      }

      this.logger.info(
        `Extracted ${notes.length} research notes from response`,
      );

      const docs: VectorDocument[] = [];
      const timestamp = Date.now();

      for (const note of notes) {
        let embedding: number[] = [];

        if (this.embeddingService) {
          try {
            embedding =
              (await this.embeddingService.generateEmbedding(note)) || [];
          } catch {
            // Store without embedding — keyword search still works
          }
        }

        docs.push({
          id: `research_note::${threadId || "default"}::${timestamp}::${docs.length}`,
          text: `[Query: ${userQuery}] ${note}`,
          vector: embedding,
          filePath: `research_notes/${threadId || "default"}`,
          startLine: 0,
          endLine: 0,
          chunkType: "research_note",
          language: "",
        });
      }

      if (docs.length > 0) {
        this.vectorStore.addDocuments(docs);
        this.vectorStore.saveToDisk();
        this.logger.info(
          `Stored ${docs.length} research notes (${docs.filter((d) => d.vector.length > 0).length} with embeddings)`,
        );
      }
    } catch (error) {
      // Never let extraction failures affect the user experience
      this.logger.warn("Research notes extraction failed", error);
    }
  }
}
