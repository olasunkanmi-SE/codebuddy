import {
  EmbedContentResponse,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { BaseMessage } from "@langchain/core/messages";
import * as vscode from "vscode";
// import { langGraphAgent } from "../../agents/langgraph/graphs/agent";
import { Orchestrator } from "../../orchestrator";
import { COMMON } from "../../application/constant";
import { Logger } from "../../infrastructure/logger/logger";
import { Memory } from "../../memory/base";
import { LogLevel } from "../../services/telemetry";
import { CodeBuddyToolProvider } from "../../tools/factory/tool";
import { generateUUID, getAPIKeyAndModel } from "../../utils/utils";
import { BaseLLM } from "../base";
import { GroqLLM } from "../groq/groq";
import {
  GeminiLLMSnapShot,
  ICodeCompleter,
  ICodeCompletionOptions,
  ILlmConfig,
} from "../interface";
import { Message } from "../message";
import { createAdvancedDeveloperAgent } from "../../agents/developer/agent";

export class GeminiLLM
  extends BaseLLM<GeminiLLMSnapShot>
  implements vscode.Disposable, ICodeCompleter
{
  private readonly generativeAi: GoogleGenerativeAI;
  private response: EmbedContentResponse | GenerateContentResult | undefined;
  protected readonly orchestrator: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];
  private static instance: GeminiLLM | undefined;
  private model: GenerativeModel | undefined;
  private lastFunctionCalls: Set<string> = new Set();
  private readonly timeOutMs: number = 30000;
  private readonly groqLLM: GroqLLM;
  private planSteps: string[] = [];
  private currentStepIndex = 0;
  private initialThought = "";
  private userQuery = "";

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    this.generativeAi = new GoogleGenerativeAI(this.config.apiKey);
    this.response = undefined;
    this.orchestrator = Orchestrator.getInstance();
    CodeBuddyToolProvider.initialize();
    this.intializeDisposable();
    this.logger = Logger.initialize("GeminiLLM", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.groqLLM = GroqLLM.getInstance({
      apiKey: getAPIKeyAndModel("groq").apiKey,
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    });
  }

  private intializeDisposable(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(() =>
        this.handleConfigurationChange(),
      ),
    );
  }

  // TODO handle configuration, when you introduce multiple LLM Agents
  private handleConfigurationChange() {
    this.model = undefined;
  }

  static getInstance(config: ILlmConfig) {
    GeminiLLM.instance ??= new GeminiLLM(config);
    return GeminiLLM.instance;
  }

  public async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const model: GenerativeModel = this.getModel();
      const result: EmbedContentResponse = await model.embedContent(text);
      this.response = result;
      return result.embedding.values;
    } catch (error) {
      this.logger.error("Failed to generate embeddings", { error, text });
      throw new Error("Embedding generation failed");
    }
  }

  async completeCode(
    prompt: string,
    options?: ICodeCompletionOptions,
  ): Promise<string> {
    const stopSequences = options?.stopSequences;
    const maxOutputTokens = options?.maxTokens || 128;
    const temperature = options?.temperature || 0.1;

    try {
      const model = this.getModel(); // Gets model with current config
      // Override generation config for this specific call
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          stopSequences,
          maxOutputTokens,
          temperature,
        },
      });

      return result.response.text();
    } catch (error) {
      this.logger.error("Failed to complete code", { error });
      return "";
    }
  }

  public async generateText(
    prompt: string,
    instruction?: string,
  ): Promise<string> {
    try {
      const model = this.getModel();
      const result: GenerateContentResult = await model.generateContent(prompt);
      this.response = result;
      return result.response.text();
    } catch (error) {
      this.logger.error("Failed to generate text", error);
      throw new Error("Text generation failed");
    }
  }

  getModel(modelParams?: Partial<ILlmConfig>): GenerativeModel {
    try {
      const model: GenerativeModel | undefined =
        this.generativeAi.getGenerativeModel({
          model: this.config.model,
          tools: modelParams?.tools ?? this.config.tools,
          systemInstruction:
            modelParams?.systemInstruction ?? this.config.systemInstruction,
          generationConfig: {
            maxOutputTokens: 8192, // Increase output token limit
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            // Minimize stop sequences to prevent premature truncation
            stopSequences: ["stuck in a loop", "infinite loop detected"],
          },
        });
      if (!model) {
        throw new Error(`Error retrieving model ${this.config.model}`);
      }
      this.model = model;
      return model;
    } catch (error) {
      this.logger.error("An error occurred while retrieving the model", error);
      throw new Error("Failed to retrieve model");
    }
  }

  private getTools(): { functionDeclarations: any[] } {
    const tools = CodeBuddyToolProvider.getTools();
    return {
      functionDeclarations: tools.map((tool) => tool.config()),
    };
  }

  calculateDynamicCallLimit(userQuery: string): number {
    // Note: Dynamic limit based on token usage, query length, and complexity
    const baseLimit = 5;
    const queryLength = userQuery.length;
    const complexityFactor = Math.min(1 + Math.floor(queryLength / 100), 3);
    return baseLimit * complexityFactor;
  }

  handleUserQuery(messages: BaseMessage[]): string {
    if (!messages || messages.length === 0) {
      return "";
    }
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage?.content) {
      return "";
    }

    const content = lastMessage.content;

    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter(
          (part): part is { type: "text"; text: string } =>
            part.type === "text" && typeof part.text === "string",
        )
        .map((textPart) => textPart.text)
        .join(" ");
    }
    this.logger.warn("Received unexpected message content type", { content });
    return JSON.stringify(content);
  }

  async *runx(userMessage: string) {
    try {
      const agent = await createAdvancedDeveloperAgent({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (agent as any).stream({
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });
      for await (const event of result) {
        for (const [nodeName, update] of Object.entries(event)) {
          yield { node: nodeName, update };
          this.logger.log(LogLevel.INFO, `Stream event from node: ${nodeName}`);
        }
      }
    } catch (error: any) {
      this.logger.error("Agent execution failed:", error);
      throw error;
    }
  }

  async processUserQuery(userInput: string): Promise<any> {
    const stream = await this.runx(userInput);
    for await (const update of stream) {
      const nodeUpdate = update?.update as any;
      if (nodeUpdate?.messages) {
        const lastMessageContent = this.handleUserQuery(nodeUpdate.messages);
        if (lastMessageContent) {
          this.orchestrator.publish("onQuery", String(lastMessageContent));
        }
      }
    }
  }

  // async processUserQuery(userInput: string): Promise<any> {
  //   const apiKey = getAPIKeyAndModel("gemini").apiKey;
  //   const model = getAPIKeyAndModel("gemini").model;
  //   const agent = langGraphAgent.create({ apiKey, model: model ?? "" });
  //   const stream = await agent.runx(userInput);
  //   for await (const update of stream) {
  //     if (update?.update?.messages) {
  //       const lastMessageContent = this.handleUserQuery(update.update.messages);
  //       if (lastMessageContent) {
  //         this.orchestrator.publish("onQuery", String(lastMessageContent));
  //       }
  //     }
  //   }
  // }

  // async run(userQuery: string) {
  //   try {
  //     const traceId = generateUUID();
  //     Logger.setTraceId(traceId);
  //     this.userQuery = userQuery;
  //     const result = await this.processUserQuery(userQuery);
  //     return result;
  //   } catch (error) {
  //     console.error("Error occured will running the agent", error);
  //     throw error;
  //   }
  // }

  public createSnapShot(data?: any): GeminiLLMSnapShot {
    const snapshot: GeminiLLMSnapShot = {
      lastQuery: data?.lastQuery,
      lastCall: data?.lastCall,
      lastResult: data?.lastResult,
      chatHistory: Memory.get(COMMON.GEMINI_CHAT_HISTORY),
      planSteps: data?.planSteps,
      currentStepIndex: data?.currentStepIndex,
      response: (this.response as GenerateContentResult)?.response, //Conditionally assign the response and assert its type
      embedding: (this.response as EmbedContentResponse)?.embedding, //Conditionally assign the embedding and assert its type
    };

    return snapshot;
  }

  public loadSnapShot(snapshot: ReturnType<typeof this.createSnapShot>): void {
    if (snapshot) {
      this.response = snapshot;
    }
    if (snapshot.planSteps) {
      this.planSteps = snapshot.planSteps;
    }
    if (snapshot.currentStepIndex !== 0) {
      this.currentStepIndex = snapshot.currentStepIndex;
    }
    if (snapshot.chatHistory) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, snapshot.chatHistory);
    }
    if (snapshot.lastQuery) {
      this.lastFunctionCalls.clear();
    }
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    Memory.delete(COMMON.GEMINI_CHAT_HISTORY);
    Memory.delete(COMMON.GEMINI_SNAPSHOT);
  }

  // Note: Call Groq provider directly. Remove from Gemini
  private async fallBackToGroq(userInput: string): Promise<string | undefined> {
    try {
      const finalResult = await this.groqLLM.generateText(userInput);
      if (finalResult) {
        const systemMessage = Message.of({
          role: "system",
          content: finalResult,
        });

        let chatHistory = Memory.has(COMMON.GROQ_CHAT_HISTORY)
          ? Memory.get(COMMON.GROQ_CHAT_HISTORY)
          : [systemMessage];

        chatHistory = [...chatHistory, systemMessage];
        this.orchestrator.publish("onQuery", String(finalResult));
      }
      return finalResult;
    } catch (error: any) {
      this.logger.info(error.message);
      throw new Error(error);
    }
  }
}
