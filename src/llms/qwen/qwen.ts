import * as vscode from "vscode";
import { Orchestrator } from "../../orchestrator";
import { COMMON } from "../../application/constant";
import { Memory } from "../../memory/base";
import { CodeBuddyToolProvider } from "../../tools/factory/tool";
import { createPrompt } from "../../utils/prompt";
import { BaseLLM } from "../base";
import { ILlmConfig } from "../interface";
import { Message } from "../message";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";

// Define interfaces for Qwen responses
interface QwenLLMSnapshot {
  response?: any;
  lastQuery?: string;
  lastCall?: any;
  lastResult?: any;
  chatHistory?: any[];
}

export class QwenLLM
  extends BaseLLM<QwenLLMSnapshot>
  implements vscode.Disposable
{
  private readonly client: OpenAI;
  private response: any;
  protected readonly orchestrator: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];
  private static instance: QwenLLM | undefined;
  private lastFunctionCalls: Set<string> = new Set();
  private readonly timeOutMs: number = 30000;

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL:
        config.baseUrl ||
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    });
    this.response = undefined;
    this.orchestrator = Orchestrator.getInstance();
    this.logger = Logger.initialize("QwenLLM", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    CodeBuddyToolProvider.initialize();
    this.initializeDisposable();
  }

  private initializeDisposable(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(() =>
        this.handleConfigurationChange(),
      ),
    );
  }

  private handleConfigurationChange() {
    // Reset client when configuration changes
  }

  static getInstance(config: ILlmConfig): QwenLLM {
    if (!QwenLLM.instance) {
      QwenLLM.instance = new QwenLLM(config);
    } else {
      QwenLLM.instance.updateConfig(config);
    }
    return QwenLLM.instance;
  }

  public updateConfig(config: ILlmConfig) {
    this.config = config;
  }

  getEmbeddingModel(): string {
    return this.config.additionalConfig?.embeddingModel || "text-embedding-v1";
  }

  public async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.getEmbeddingModel(),
        input: text,
      });

      this.response = response;
      return response.data[0].embedding;
    } catch (error: any) {
      this.logger.error("Failed to generate embeddings", { error, text });
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  public async generateText(
    prompt: string,
    instruction?: string,
  ): Promise<string> {
    try {
      const messages = [
        {
          role: "system",
          content:
            instruction ||
            this.config.systemInstruction ||
            "You are a helpful assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ];

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as ChatCompletionMessageParam[],
        temperature: 0.1,
        max_tokens: 5024,
      });

      this.response = response;
      return response.choices[0].message.content || "";
    } catch (error: any) {
      this.logger.error("Failed to generate text", error);
      throw new Error(`Text generation failed: ${error}`);
    }
  }

  public getModel(): any {
    return this.client;
  }

  private getTools(): { functions: any[] } {
    const tools = CodeBuddyToolProvider.getTools();
    return {
      functions: tools.map((tool) => {
        const config = tool.config();
        return {
          name: config.name,
          description: config.description,
          parameters: config.parameters,
        };
      }),
    };
  }

  async generateContentWithTools(userInput: string): Promise<any> {
    try {
      await this.buildChatHistory(
        userInput,
        undefined,
        undefined,
        undefined,
        true,
      );
      const prompt = createPrompt(userInput);
      const contents = Memory.get(COMMON.QWEN_CHAT_HISTORY) || [];

      const messages = [
        {
          role: "system",
          content:
            prompt ||
            this.config.systemInstruction ||
            "You are a helpful assistant.",
        },
        ...contents.map((msg: any) => ({
          role:
            msg.role === "model"
              ? "assistant"
              : msg.role === "system"
                ? "assistant"
                : msg.role,
          content:
            typeof msg.content === "string"
              ? msg.content
              : msg.parts && msg.parts[0]
                ? msg.parts[0].text
                : "",
          function_call:
            msg.parts && msg.parts[0] && msg.parts[0].functionCall
              ? {
                  name: msg.parts[0].functionCall.name,
                  arguments: JSON.stringify(msg.parts[0].functionCall.args),
                }
              : undefined,
        })),
      ];

      const tools = this.getTools().functions;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        temperature: 0.1,
        max_tokens: 5024,
        functions: tools,
        function_call: "auto",
      });

      return {
        response: {
          text: () => response.choices[0].message.content || "",
          functionCalls: () => {
            if (response.choices[0].message.function_call) {
              return [
                {
                  name: response.choices[0].message.function_call.name,
                  args: JSON.parse(
                    response.choices[0].message.function_call.arguments,
                  ),
                },
              ];
            }
            return [];
          },
          usageMetadata: {
            totalTokenCount: response.usage?.total_tokens || 0,
          },
          candidates: response.choices,
          promptFeedback: {},
        },
      };
    } catch (error: any) {
      this.logger.error("Error generating content with tools", error);
      throw new Error(error.message || "Failed to generate content with tools");
    }
  }

  calculateDynamicCallLimit(userQuery: string): number {
    const baseLimit = 5;
    const queryLength = userQuery.length;
    const complexityFactor = Math.min(1 + Math.floor(queryLength / 100), 3);
    return baseLimit * complexityFactor;
  }

  async processUserQuery(userInput: string): Promise<string | any | undefined> {
    let finalResult: string | any | undefined;
    let userQuery = userInput;
    let callCount = 0;

    try {
      const snapShot = Memory.get("QWEN_SNAPSHOT") as QwenLLMSnapshot;
      if (snapShot) {
        this.loadSnapShot(snapShot);
      }

      while (callCount < this.calculateDynamicCallLimit(userQuery)) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout Exceeded")),
            this.timeOutMs,
          ),
        );

        const responsePromise = this.generateContentWithTools(userQuery);
        const result = (await Promise.race([
          responsePromise,
          timeoutPromise,
        ])) as QwenLLMSnapshot;

        this.response = result;

        if (result && "response" in result) {
          const { text, functionCalls, usageMetadata } = result.response;

          const tokenCount = usageMetadata?.totalTokenCount || 0;
          const toolCalls = functionCalls ? functionCalls() : [];

          const currentCallSignatures = toolCalls
            ? toolCalls
                .map((call: any) => `${call.name}:${JSON.stringify(call.args)}`)
                .join(";")
            : "";

          if (
            this.lastFunctionCalls.has(currentCallSignatures) &&
            currentCallSignatures
          ) {
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

            const answer = await this.processUserQuery(regeneratedQuery);
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
            this.logger.info(
              `Function calls detected: ${JSON.stringify(toolCalls)}`,
            );

            for (const functionCall of toolCalls) {
              try {
                const functionResult =
                  await this.handleSingleFunctionCall(functionCall);
                userQuery = `Tool result: ${JSON.stringify(functionResult)}. What is your next step?`;

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

                Memory.set("QWEN_SNAPSHOT", snapShot);
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
            this.logger.info("No function calls, using text response");
            finalResult = text();
            this.orchestrator.publish("onQuery", String(finalResult));
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

      const snapshot = Memory.get("QWEN_SNAPSHOT");
      if (snapshot?.length > 0) {
        Memory.removeItems("QWEN_SNAPSHOT", Memory.get("QWEN_SNAPSHOT").length);
      }

      return finalResult;
    } catch (error: any) {
      this.orchestrator.publish(
        "onError",
        "Model not responding at this time, please try again",
      );
      vscode.window.showErrorMessage("Error processing user query");
      this.logger.error(
        "Error generating queries, thoughts from user query",
        error,
      );
      throw error;
    }
  }

  private async handleSingleFunctionCall(
    functionCall: any,
    attempt = 0,
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
      const executionResult = await tool.execute(query);

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
          JSON.stringify({ error: error.message, args }),
        );
        return this.handleSingleFunctionCall(functionCall, attempt + 1);
      }
      throw error;
    }
  }

  async run(userQuery: string) {
    try {
      const result = await this.processUserQuery(userQuery);
      return result;
    } catch (error: any) {
      this.logger.error("Error occurred while running the agent", error);
      throw error;
    }
  }

  private async buildChatHistory(
    userQuery: string,
    functionCall?: any,
    functionResponse?: any,
    chat?: any,
    isInitialQuery = false,
  ): Promise<any[]> {
    let chatHistory: any = Memory.get(COMMON.QWEN_CHAT_HISTORY) || [];
    Memory.removeItems(COMMON.QWEN_CHAT_HISTORY);

    if (!isInitialQuery && chatHistory.length === 0) {
      throw new Error("No chat history available for non-initial query");
    }

    const userMessage = Message.of({
      role: "user",
      content: userQuery,
    });

    chatHistory.push(userMessage);

    if (!isInitialQuery && functionCall && functionResponse) {
      chatHistory.push(
        Message.of({
          role: "assistant",
          content: "",
          parts: [
            {
              functionCall: {
                name: functionCall.name,
                args: functionCall.args,
              },
            },
          ],
        }),
      );

      chatHistory.push(
        Message.of({
          role: "user",
          content: `Tool result: ${JSON.stringify(functionResponse)}`,
        }),
      );
    }

    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-50);
    }

    Memory.set(COMMON.QWEN_CHAT_HISTORY, chatHistory);
    return chatHistory;
  }

  public createSnapShot(data?: any): QwenLLMSnapshot {
    return {
      response: this.response,
      lastQuery: data?.lastQuery,
      lastCall: data?.lastCall,
      lastResult: data?.lastResult,
      chatHistory: Memory.get(COMMON.QWEN_CHAT_HISTORY),
    };
  }

  public loadSnapShot(snapshot: QwenLLMSnapshot): void {
    if (snapshot) {
      this.response = snapshot.response;
    }

    if (snapshot.chatHistory) {
      Memory.set(COMMON.QWEN_CHAT_HISTORY, snapshot.chatHistory);
    }

    if (snapshot.lastQuery) {
      this.lastFunctionCalls.clear();
    }
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    Memory.delete(COMMON.QWEN_CHAT_HISTORY);
    Memory.delete("QWEN_SNAPSHOT");
  }
}
