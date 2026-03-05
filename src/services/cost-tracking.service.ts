/**
 * CostTrackingService — Tracks token usage and estimated costs per conversation.
 *
 * Accumulates input/output tokens from LLM responses during agent streaming
 * and provides Cline-style cost estimates based on per-provider pricing.
 */

export interface ITokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface IConversationCost extends ITokenUsage {
  provider: string;
  model: string;
  requestCount: number;
}

interface IPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

// Pricing per 1M tokens (USD) — updated as of mid-2025.
// Falls back to a conservative default for unknown models.
const MODEL_PRICING: Record<string, IPricing> = {
  // Anthropic
  "claude-sonnet-4-6": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-sonnet-4-20250514": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-opus-4-20250514": { inputPerMillion: 15, outputPerMillion: 75 },
  "claude-3-7-sonnet-20250219": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-3-5-sonnet-20241022": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-3-5-haiku-20241022": { inputPerMillion: 0.8, outputPerMillion: 4 },
  "claude-3-opus-20240229": { inputPerMillion: 15, outputPerMillion: 75 },
  "claude-3-haiku-20240307": { inputPerMillion: 0.25, outputPerMillion: 1.25 },

  // OpenAI
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gpt-4-turbo": { inputPerMillion: 10, outputPerMillion: 30 },
  "gpt-4": { inputPerMillion: 30, outputPerMillion: 60 },
  "o3-mini": { inputPerMillion: 1.1, outputPerMillion: 4.4 },

  // Google Gemini
  "gemini-2.5-pro": { inputPerMillion: 1.25, outputPerMillion: 10 },
  "gemini-2.5-flash": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gemini-2.0-flash": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  "gemini-1.5-pro": { inputPerMillion: 1.25, outputPerMillion: 5 },
  "gemini-1.5-flash": { inputPerMillion: 0.075, outputPerMillion: 0.3 },

  // Groq (hosted models — pricing may vary)
  "llama-3.3-70b-versatile": { inputPerMillion: 0.59, outputPerMillion: 0.79 },
  "llama-3.1-8b-instant": { inputPerMillion: 0.05, outputPerMillion: 0.08 },
  "llama3-70b-8192": { inputPerMillion: 0.59, outputPerMillion: 0.79 },
  "llama3-8b-8192": { inputPerMillion: 0.05, outputPerMillion: 0.08 },
  "mixtral-8x7b-32768": { inputPerMillion: 0.24, outputPerMillion: 0.24 },
  "gemma2-9b-it": { inputPerMillion: 0.2, outputPerMillion: 0.2 },

  // DeepSeek
  "deepseek-chat": { inputPerMillion: 0.27, outputPerMillion: 1.1 },
  "deepseek-coder": { inputPerMillion: 0.14, outputPerMillion: 0.28 },
  "deepseek-reasoner": { inputPerMillion: 0.55, outputPerMillion: 2.19 },

  // Qwen
  "qwen-plus": { inputPerMillion: 0.8, outputPerMillion: 2 },
  "qwen-turbo": { inputPerMillion: 0.3, outputPerMillion: 0.6 },
  "qwen-max": { inputPerMillion: 2.4, outputPerMillion: 9.6 },

  // GLM
  "glm-4-plus": { inputPerMillion: 0.7, outputPerMillion: 0.7 },
  "glm-4": { inputPerMillion: 1.4, outputPerMillion: 1.4 },
  "glm-4-flash": { inputPerMillion: 0.007, outputPerMillion: 0.007 },
};

// Conservative fallback for unknown models
const DEFAULT_PRICING: IPricing = {
  inputPerMillion: 3,
  outputPerMillion: 15,
};

export class CostTrackingService {
  private static instance: CostTrackingService;
  private conversations = new Map<string, IConversationCost>();

  static getInstance(): CostTrackingService {
    return (CostTrackingService.instance ??= new CostTrackingService());
  }

  /**
   * Records token usage for a conversation turn.
   */
  recordUsage(
    threadId: string,
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): IConversationCost {
    const existing = this.conversations.get(threadId);
    const totalInput = (existing?.inputTokens ?? 0) + inputTokens;
    const totalOutput = (existing?.outputTokens ?? 0) + outputTokens;
    const pricing = this.getPricing(model);
    const cost =
      (totalInput * pricing.inputPerMillion +
        totalOutput * pricing.outputPerMillion) /
      1_000_000;

    const record: IConversationCost = {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      totalTokens: totalInput + totalOutput,
      estimatedCostUSD: Math.round(cost * 1_000_000) / 1_000_000, // 6 decimal places
      provider,
      model,
      requestCount: (existing?.requestCount ?? 0) + 1,
    };

    this.conversations.set(threadId, record);
    return record;
  }

  /**
   * Returns current cost data for a conversation, or null if none tracked.
   */
  getConversationCost(threadId: string): IConversationCost | null {
    return this.conversations.get(threadId) ?? null;
  }

  /**
   * Resets tracking for a conversation (e.g. on new session).
   */
  resetConversation(threadId: string): void {
    this.conversations.delete(threadId);
  }

  /**
   * Resets all tracked conversations.
   */
  resetAll(): void {
    this.conversations.clear();
  }

  private getPricing(model: string): IPricing {
    // Try exact match first
    if (MODEL_PRICING[model]) {
      return MODEL_PRICING[model];
    }
    // Try prefix match (e.g. "claude-3-5-sonnet-latest" → "claude-3-5-sonnet-20241022")
    const normalised = model.toLowerCase();
    for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
      if (normalised.startsWith(key) || key.startsWith(normalised)) {
        return pricing;
      }
    }
    return DEFAULT_PRICING;
  }
}
