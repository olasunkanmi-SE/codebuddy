import { Logger } from "../infrastructure/logger/logger";
import { ChatHistoryManager } from "../services/chat-history-manager";
import { GroqLLM } from "../llms/groq/groq";
import { LogLevel } from "../services/telemetry";

/**
 * Encapsulates all token-aware chat history pruning / summarisation logic
 * that was previously embedded in BaseWebViewProvider.
 */
export class ChatHistoryPruningService {
  private readonly logger: Logger;

  constructor(
    private readonly chatHistoryManager: ChatHistoryManager,
    private readonly groqLLM: GroqLLM | null,
    private readonly getTokenCounts: (input: string) => Promise<number>,
  ) {
    this.logger = Logger.initialize("ChatHistoryPruningService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  async generateSummaryForModel(
    historyToSummarize: any[],
  ): Promise<string | undefined> {
    const summarizationPrompt = `
    The following is a conversation history. Please provide a concise summary of the key information, decisions, and topics discussed. 
    Focus on retaining facts, names, and important context that would be necessary to continue the conversation without confusion.

    CONVERSATION HISTORY:
    ${historyToSummarize.map((msg) => `${msg.role}: ${msg.parts[0].text}`).join("\n")}
  `;

    const response = await this.groqLLM?.generateText(summarizationPrompt);
    if (!response) {
      return undefined;
    }
    return response;
  }

  async pruneChatHistoryWithSummary(
    history: any[],
    maxTokens: number,
    systemInstruction: string,
    agentId?: string,
  ): Promise<any[]> {
    const systemInstructionTokens =
      systemInstruction.length > 0
        ? await this.getTokenCounts(systemInstruction)
        : 0;

    const historyWithTokens = await Promise.all(
      history.map(async (msg) => ({
        message: msg,
        tokens: await this.getTokenCounts(
          msg.parts ? msg.parts[0].text : msg.content,
        ),
      })),
    );

    const currentTokenCount =
      systemInstructionTokens +
      historyWithTokens.reduce((sum, item) => sum + item.tokens, 0);
    this.logger.info(
      `Initial token count (history + system instruction): ${currentTokenCount}`,
    );

    if (currentTokenCount <= maxTokens) {
      this.logger.info("Token count is within the limit. No pruning needed.");
      return history;
    }

    this.logger.info(
      `Token count ${currentTokenCount} exceeds limit of ${maxTokens}. Attempting summarization.`,
    );

    const MESSAGES_TO_KEEP_RECENT = 4;
    const MIN_MESSAGES_FOR_SUMMARY = MESSAGES_TO_KEEP_RECENT + 2;

    if (historyWithTokens.length < MIN_MESSAGES_FOR_SUMMARY) {
      this.logger.warn(
        "History is too short to summarize. Falling back to simple pruning.",
      );
      return this.pruneChatHistory(history, maxTokens, systemInstruction);
    }

    const sliceIndex = historyWithTokens.length - MESSAGES_TO_KEEP_RECENT;
    const messagesToSummarize = historyWithTokens.slice(0, sliceIndex);
    const recentMessages = historyWithTokens.slice(sliceIndex);

    this.logger.info(
      `Summarizing ${messagesToSummarize.length} messages and keeping ${recentMessages.length} recent messages.`,
    );

    const summaryText = await this.generateSummaryForModel(
      messagesToSummarize.map((item) => item.message),
    );

    if (summaryText && agentId) {
      await this.chatHistoryManager.saveSummary(agentId, summaryText);
      this.logger.info(`Saved chat summary for agent ${agentId}`);
    }

    const summaryTokens = await this.getTokenCounts(summaryText ?? "");

    const summaryMessage = history[0].parts
      ? {
          role: "user",
          parts: [
            {
              text: `[System Note: This is a summary of our earlier conversation to preserve context]:\n${summaryText}`,
            },
          ],
        }
      : {
          role: "user",
          content: `[System Note: This is a summary of our earlier conversation to preserve context]:\n${summaryText}`,
        };

    const newHistoryWithTokens = [
      { message: summaryMessage, tokens: summaryTokens },
      ...recentMessages,
    ];

    let newTotalTokens =
      systemInstructionTokens +
      newHistoryWithTokens.reduce((sum, item) => sum + item.tokens, 0);

    this.logger.info(`History summarized. New token count: ${newTotalTokens}`);

    while (newTotalTokens > maxTokens && newHistoryWithTokens.length >= 2) {
      this.logger.warn(
        `Token count ${newTotalTokens} still exceeds limit after summarization. Pruning oldest message from new history...`,
      );
      const userMessage = newHistoryWithTokens.shift()!;
      const modelMessage = newHistoryWithTokens.shift()!;
      newTotalTokens -= userMessage.tokens + modelMessage.tokens;
    }

    if (
      newHistoryWithTokens.length > 0 &&
      newHistoryWithTokens[0].message.role !== "user"
    ) {
      this.logger.error(
        "History unexpectedly does not start with 'user' after summarization. Removing leading model message.",
      );
      newHistoryWithTokens.shift();
    }

    return newHistoryWithTokens.map((item) => item.message);
  }

  async pruneChatHistory(
    history: any[],
    maxTokens: number,
    systemInstruction: string,
  ): Promise<any[]> {
    try {
      const mutableHistory = [...history];
      while (mutableHistory.length > 0 && mutableHistory[0].role !== "user") {
        this.logger.warn(
          `History does not start with 'user'. Removing oldest message to correct pattern.`,
        );
        mutableHistory.shift();
      }

      if (mutableHistory.length === 0) {
        this.logger.warn(
          "History is empty after initial validation. Starting fresh.",
        );
        return [];
      }

      const systemInstructionTokens = await this.getTokenCounts(
        systemInstruction || "",
      );

      const historyWithTokens = await Promise.all(
        mutableHistory.map(async (msg) => ({
          message: msg,
          tokens: await this.getTokenCounts(
            (msg.parts ? msg.parts[0].text : msg.content) || "",
          ),
        })),
      );

      let currentTokenCount =
        systemInstructionTokens +
        historyWithTokens.reduce((sum, item) => sum + item.tokens, 0);
      this.logger.info(
        `Initial token count (history + system instruction): ${currentTokenCount}`,
      );

      while (currentTokenCount > maxTokens && historyWithTokens.length >= 2) {
        this.logger.info(
          `Token count ${currentTokenCount} exceeds limit of ${maxTokens}. Removing oldest user-model pair...`,
        );
        const userMessage = historyWithTokens.shift()!;
        const modelMessage = historyWithTokens.shift()!;
        const tokensRemoved = userMessage.tokens + modelMessage.tokens;
        currentTokenCount -= tokensRemoved;
        this.logger.info(
          `Removed pair with ${tokensRemoved} tokens. New token count: ${currentTokenCount}`,
        );
      }

      if (currentTokenCount > maxTokens) {
        this.logger.warn(
          `Token count ${currentTokenCount} still exceeds limit after pruning.`,
        );
      }

      if (historyWithTokens.length === 0) {
        this.logger.warn(`History is empty after pruning. Starting fresh.`);
      } else if (historyWithTokens[0].message.role !== "user") {
        this.logger.error(
          `History unexpectedly does not start with 'user' after pruning. Correcting...`,
        );
        while (
          historyWithTokens.length > 0 &&
          historyWithTokens[0].message.role !== "user"
        ) {
          const removed = historyWithTokens.shift()!;
          currentTokenCount -= removed.tokens;
        }
      }

      return historyWithTokens.map((item) => item.message);
    } catch (error: any) {
      this.logger.info("Error while pruning chat history", error);
      throw new Error(error.message);
    }
  }
}
