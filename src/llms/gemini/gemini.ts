import {
  ChatSession,
  Content,
  EmbedContentResponse,
  FunctionCall,
  FunctionCallingMode,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import * as vscode from "vscode";
import { Orchestrator } from "../../agents/orchestrator";
import { COMMON } from "../../application/constant";
import { Memory } from "../../memory/base";
import { CodeBuddyToolProvider } from "../../providers/tool";
import { createPrompt } from "../../utils/prompt";
import { BaseLLM } from "../base";
import { GeminiModelResponseType, ILlmConfig } from "../interface";
import { Message } from "../message";
import { Logger } from "../../infrastructure/logger/logger";

export class GeminiLLM
  extends BaseLLM<GeminiModelResponseType>
  implements vscode.Disposable
{
  private readonly generativeAi: GoogleGenerativeAI;
  private response: EmbedContentResponse | GenerateContentResult | undefined;
  protected readonly orchestrator: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];
  private static instance: GeminiLLM | undefined;
  private model: GenerativeModel | undefined;
  private lastFunctionCalls: Set<string> = new Set();
  private readonly timeOutMs: number = 30000;

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    this.generativeAi = new GoogleGenerativeAI(this.config.apiKey);
    this.response = undefined;
    this.orchestrator = Orchestrator.getInstance();
    CodeBuddyToolProvider.initialize();
    this.intializeDisposable();
    this.logger = new Logger("GeminiLLM");
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
    if (!GeminiLLM.instance) {
      GeminiLLM.instance = new GeminiLLM(config);
    }
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
            stopSequences: [
              "Thank you",
              "Done",
              "End",
              "stuck in a loop",
              "loop",
            ],
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

  async generateContentWithTools(
    userInput: string,
  ): Promise<GenerateContentResult> {
    try {
      await this.buildChatHistory(
        userInput,
        undefined,
        undefined,
        undefined,
        true,
      );
      const prompt = createPrompt(userInput);
      const contents = Memory.get(COMMON.GEMINI_CHAT_HISTORY) as Content[];
      const tools: any = this.getTools();
      const model = this.getModel({ systemInstruction: prompt, tools });
      const generateContentResponse: GenerateContentResult =
        await model.generateContent({
          contents,
          toolConfig: {
            functionCallingConfig: { mode: FunctionCallingMode.AUTO },
          },
        });
      return generateContentResponse;
    } catch (error: any) {
      throw Error(error);
    }
  }

  calculateDynamicCallLimit(userQuery: string): number {
    // Note: Dynamic limit based on token usage, query length, and complexity
    const baseLimit = 5;
    const queryLength = userQuery.length;
    const complexityFactor = Math.min(1 + Math.floor(queryLength / 100), 3);
    return baseLimit * complexityFactor;
  }

  async processUserQuery(
    userInput: string,
  ): Promise<string | GenerateContentResult | undefined> {
    let finalResult: string | GenerateContentResult | undefined;
    let userQuery = userInput;
    const MAX_BASE_CALLS = 5;
    let callCount = 0;
    try {
      const snapShot = Memory.get(
        COMMON.GEMINI_SNAPSHOT,
      ) as GeminiModelResponseType;
      if (snapShot) {
        this.loadSnapShot(snapShot);
      }
      while (callCount < this.calculateDynamicCallLimit(userQuery)) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("TImeout Exceeded")),
            this.timeOutMs,
          ),
        );
        const responsePromise = this.generateContentWithTools(userQuery);
        const result = (await Promise.race([
          responsePromise,
          timeoutPromise,
        ])) as GeminiModelResponseType;
        this.response = result;
        if (result && "response" in result) {
          const {
            text,
            usageMetadata,
            functionCalls,
            candidates,
            promptFeedback,
          } = result.response;
          const tokenCount = usageMetadata?.totalTokenCount ?? 0;
          const toolCalls = functionCalls ? functionCalls() : [];
          const currentCallSignatures = toolCalls
            ? toolCalls
                .map((call) => `${call.name}:${JSON.stringify(call.args)}`)
                .join(";")
            : "";
          if (this.lastFunctionCalls.has(currentCallSignatures)) {
            this.logger.warn(
              "Detecting no progress: same function calls repeated",
              "",
            );
            const regeneratedQuery = await this.generateText(
              userQuery,
              "Rewrite the user query to more clearly and effectively express the user's underlying intent. The goal is to enable the system to retrieve and utilize the available tools more accurately. Identify the core information need and rephrase the query to highlight it. Consider what information the tools need to function optimally and ensure the query provides it.",
            );
            this.orchestrator.publish(
              "onQuery",
              JSON.stringify(regeneratedQuery),
            );
            let answer = await this.processUserQuery(regeneratedQuery);
            if (typeof answer === "string") {
              finalResult = answer;
              this.orchestrator.publish("onQuery", JSON.stringify(answer));
            }
            break;
          }
          this.lastFunctionCalls.add(currentCallSignatures);
          if (this.lastFunctionCalls.size > 10) {
            this.lastFunctionCalls = new Set(
              [...this.lastFunctionCalls].slice(-10),
            );
          }
          if (toolCalls && toolCalls.length > 0) {
            for (const functionCall of toolCalls) {
              try {
                const functionResult =
                  await this.handleSingleFunctionCall(functionCall);
                userQuery = `Tool result: ${JSON.stringify(functionResult)}. What is your next step?`;
                //TODO need to update the properties later
                await this.buildChatHistory(
                  userQuery,
                  functionCall,
                  functionResult,
                  undefined,
                  false,
                );
                const snapShot = this.createSnapShot({
                  lastQuery: userQuery,
                  lastCall: functionCall,
                  lastResult: functionResult,
                });
                Memory.set(COMMON.GEMINI_SNAPSHOT, snapShot);
                callCount++;
              } catch (error: any) {
                this.logger.error("Error processing function call", error);
                const retry = await vscode.window.showErrorMessage(
                  `Function call failed: ${error.message}. Retry or abort?`,
                  "Retry",
                  "Abort",
                );
                if (retry === "Retry") {
                  continue;
                } else {
                  finalResult = `Function call error: ${error.message}. Falling back to last response.`;
                  break;
                }
              }
            }
          } else {
            finalResult = text();
            this.orchestrator.publish("onQuery", String(finalResult));
            console.log();
            break;
          }
          if (callCount >= this.calculateDynamicCallLimit(userQuery)) {
            throw new Error("Dynamic call limit reached");
          }
        }
      }
      if (!finalResult) {
        throw new Error("No final result generated after function calls");
      }
      // Should I clear the memory at this point or retry.
      const snapshot = Memory.get(COMMON.GEMINI_SNAPSHOT);
      if (snapshot?.length > 0) {
        Memory.removeItems(
          COMMON.GEMINI_SNAPSHOT,
          Memory.get(COMMON.GEMINI_SNAPSHOT).length,
        );
      }

      return finalResult;
    } catch (error: any) {
      // Note. Use this approach to return error messages back to the FE
      this.orchestrator.publish(
        "onError",
        "Model not responding at this time, please try again",
      );
      vscode.window.showErrorMessage("Error processing user query");
      this.logger.error(
        "Error generating, queries, thoughts from user query",
        error,
      );
      throw error;
    }
  }

  private async handleSingleFunctionCall(
    functionCall: FunctionCall,
    attempt: number = 0,
  ): Promise<any> {
    const MAX_RETRIES = 3;
    const args = functionCall.args as Record<string, any>;
    const name = functionCall.name;

    try {
      const tools = CodeBuddyToolProvider.getTools();
      const tool = tools.find((tool) => tool.config().name === name);
      if (!tool) {
        throw new Error(`No tool found for function: ${name}`);
      }
      const query = Object.values(args);
      const executionResult = await await tool.execute(query);
      return {
        name,
        response: {
          name,
          content: executionResult,
        },
      };
    } catch (error: any) {
      if (attempt < MAX_RETRIES) {
        this.logger.warn(
          `Retry attempt ${attempt + 1} for function ${name}`,
          JSON.stringify({ error, args }),
        );
        return this.handleSingleFunctionCall(functionCall, attempt + 1);
      }
    }
  }

  async run(userQuery: string) {
    try {
      const result = await this.processUserQuery(userQuery);
      return result;
    } catch (error) {
      this.logger.error("Error occured will running the agent", error);
      throw error;
    }
  }

  private async buildChatHistory(
    userQuery: string,
    functionCall?: any,
    functionResponse?: any,
    chat?: ChatSession,
    isInitialQuery: boolean = false,
  ): Promise<Content[]> {
    let chatHistory: any = Memory.get(COMMON.GEMINI_CHAT_HISTORY) || [];
    Memory.removeItems(COMMON.GEMINI_CHAT_HISTORY);
    if (!isInitialQuery && chatHistory.length === 0) {
      throw new Error("No chat history available for non-initial query");
    }

    const userMessage = Message.of({
      role: "user",
      parts: [
        {
          text: userQuery,
        },
      ],
    });

    chatHistory.push(userMessage) as [];

    if (!isInitialQuery && functionCall && chat) {
      chatHistory.push(
        Message.of({
          role: "model",
          parts: [{ functionCall }],
        }),
      );

      const observationResult = await chat.sendMessage(
        `Tool result: ${JSON.stringify(functionResponse)}`,
      );
      chatHistory.push(
        Message.of({
          role: "user",
          parts: [{ text: observationResult.response.text() }],
        }),
      );
    }
    if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
    Memory.set(COMMON.GEMINI_CHAT_HISTORY, chatHistory);
    return chatHistory;
  }

  public createSnapShot(data?: any): any {
    return {
      ...this.response,
      lastQuery: data?.lastQuery,
      lastCall: data?.lastCall,
      lastResult: data?.lastResult,
      chatHistory: Memory.get(COMMON.GEMINI_CHAT_HISTORY),
    };
  }

  public loadSnapShot(snapshot: ReturnType<typeof this.createSnapShot>): void {
    if (snapshot) {
      this.response = snapshot;
    }
    if (snapshot.history) {
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
}
