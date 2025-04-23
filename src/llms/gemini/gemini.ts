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
import { CodeBuddyToolProvider } from "../../tools/factory/tool";
import { createPrompt } from "../../utils/prompt";
import { BaseLLM } from "../base";
import {
  GeminiModelResponseType,
  ILlmConfig,
  GeminiLLMSnapShot,
} from "../interface";
import { Message } from "../message";
import { Logger } from "../../infrastructure/logger/logger";
import { GroqLLM } from "../groq/groq";
import { getAPIKeyAndModel } from "../../utils/utils";

export class GeminiLLM
  extends BaseLLM<GeminiLLMSnapShot>
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
    this.logger = new Logger("GeminiLLM");
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

  /**
   * Processes tool calls from the language model.
   * @param toolCalls An array of function calls to process.
   * @param userInput The original user input.
   * @returns A promise that resolves to the final result string or undefined if an error occurs.
   */
  private async processToolCalls(
    toolCalls: FunctionCall[],
    userInput: string,
  ): Promise<any> {
    let finalResult: string | undefined = undefined;
    try {
      let userQuery = userInput;
      let callCount = 0;

      for (const functionCall of toolCalls) {
        try {
          const functionResult =
            await this.handleSingleFunctionCall(functionCall);

          if (functionCall.name === "think") {
            const thought = functionResult?.content;
            this.initialThought = this.initialThought ?? thought;
            if (thought) {
              this.orchestrator.publish("onStrategizing", thought);
              this.planSteps = this.parseThought(thought);
              if (this.planSteps?.length > 0) {
                userQuery = `Tool result: ${JSON.stringify(functionResult.content)} \n. Based on these plans, Plans: ${this.planSteps} from the tool result \n What is your next step?`;
              } else {
                userQuery = `Tool result: ${JSON.stringify(functionResult.content)}. What is your next step?`;
                this.planSteps = [];
              }
            }
          } else {
            userQuery = `Tool result: ${JSON.stringify(functionResult.content)}`;
          }

          finalResult = userQuery;

          await this.buildChatHistory(
            userQuery,
            functionCall.name,
            functionResult,
            undefined,
            false,
          );

          const snapShot = this.createSnapShot({
            lastQuery: userQuery,
            lastCall: functionCall.name,
            lastResult: functionResult,
            currentStepIndex: this.currentStepIndex,
            planSteps: this.planSteps,
          });
          Memory.set(COMMON.GEMINI_SNAPSHOT, snapShot);
          callCount++;
        } catch (error: any) {
          console.error("Error processing function call", error);
          // Send this to the webview instead
          const retry = await vscode.window.showErrorMessage(
            `Function call failed: ${error.message}. Retry or abort?`,
            "Retry",
            "Abort",
          );

          if (retry === "Retry") {
            finalResult = await this.fallBackToGroq(
              `User Input: ${this.userQuery} \n Plans: ${userInput}Write production ready code to demonstrate your solution`,
            );
          } else {
            finalResult = `Function call error: ${error.message}. Falling back to last response.`;
            break; // Exit the loop and return the error result
          }
        }
      }
      return finalResult;
    } catch (error) {
      console.error("Error processing tool calls", error);
      finalResult = await this.fallBackToGroq(
        `User Input: ${this.userQuery} \n Plans: ${userInput}Write production ready code to demonstrate your solution`,
      );
    }
  }

  async processUserQuery(
    userInput: string,
  ): Promise<string | GenerateContentResult | undefined> {
    let finalResult: string | GenerateContentResult | undefined;
    let userQuery = userInput;
    const MAX_BASE_CALLS = 5;
    let callCount = 0;
    try {
      let snapShot = Memory.get(COMMON.GEMINI_SNAPSHOT) as GeminiLLMSnapShot;
      if (snapShot) {
        this.loadSnapShot(snapShot);
        this.planSteps = snapShot.planSteps;
        this.currentStepIndex = snapShot.currentStepIndex;
      }

      // if (this.currentStepIndex < this.planSteps?.length) {
      //   userQuery = `Continuing with the plan. Step ${this.currentStepIndex + 1} of ${this.planSteps.length}: "${this.planSteps[this.currentStepIndex]}". Please execute this step.`;
      // } else {
      //   this.currentStepIndex = 0;
      //   this.planSteps = [];
      // }

      while (callCount < this.calculateDynamicCallLimit(userQuery)) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("TImeout Exceeded")),
            this.timeOutMs,
          ),
        );
        const responsePromise = await this.generateContentWithTools(userQuery);
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
          if ((functionCalls?.()?.length ?? 0) === 0) {
            finalResult = text();
            break;
          }

          // Note consider tokencount
          const tokenCount = usageMetadata?.totalTokenCount ?? 0;
          const toolCalls = functionCalls ? functionCalls() : [];
          const currentCallSignatures = toolCalls
            ? toolCalls
                .map((call) => `${call.name}:${JSON.stringify(call.args)}`)
                .join(";")
            : "";
          if (this.lastFunctionCalls.has(currentCallSignatures)) {
            finalResult = await this.groqLLM.generateText(userInput);
            if (finalResult) {
              finalResult = await this.fallBackToGroq(
                `User Input: ${this.userQuery} \n Plans: ${userInput} Write production ready code to demonstrate your solution`,
              );
              return finalResult;
            }
          }
          this.lastFunctionCalls.add(currentCallSignatures);
          if (this.lastFunctionCalls.size > 10) {
            this.lastFunctionCalls = new Set(
              [...this.lastFunctionCalls].slice(-10),
            );
          }
          if (toolCalls && toolCalls.length > 0) {
            finalResult = await this.processToolCalls(toolCalls, userQuery);
            userQuery = finalResult as string;
          } else {
            finalResult = text();
            break;
          }

          // if (
          //   this.planSteps?.length > 0 &&
          //   toolCalls.every((call) => call.name !== "think")
          // ) {
          //   this.currentStepIndex++;
          //   if (this.currentStepIndex < this.planSteps.length) {
          //     userQuery = `Continuing with the plan. Step ${this.currentStepIndex + 1} of ${this.planSteps.length}: "${this.planSteps[this.currentStepIndex]}". Please execute this step`;
          //   } else {
          //     this.currentStepIndex = 0;
          //     this.planSteps = [];
          //     userQuery =
          //       "Plan execution completed. What is the final answer or next steps based on the completed plan?";
          //   }
          // }
          if (callCount >= this.calculateDynamicCallLimit(userQuery)) {
            throw new Error("Dynamic call limit reached");
          }
        }
      }
      if (!finalResult) {
        throw new Error("No final result generated after function calls");
      }
      const snapshot = Memory.get(COMMON.GEMINI_SNAPSHOT);
      if (snapshot?.length > 0) {
        Memory.removeItems(
          COMMON.GEMINI_SNAPSHOT,
          Memory.get(COMMON.GEMINI_SNAPSHOT).length,
        );
      }
      this.orchestrator.publish("onQuery", String(finalResult));
      return finalResult;
    } catch (error: any) {
      // this.orchestrator.publish(
      //   "onError",
      //   "Model not responding at this time, please try again"
      // );
      console.log("Error processing user query", error);
      finalResult = await this.fallBackToGroq(
        `User Input: ${this.userQuery} \n Plans: ${userInput}Write production ready code to demonstrate your solution`,
      );
      console.log("Model not responding at this time, please try again", error);
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
        content: executionResult,
      };
    } catch (error: any) {
      if (attempt < MAX_RETRIES) {
        console.warn(
          `Retry attempt ${attempt + 1} for function ${name}`,
          JSON.stringify({ error, args }),
        );
        return this.handleSingleFunctionCall(functionCall, attempt + 1);
      }
    }
  }

  async run(userQuery: string) {
    try {
      this.userQuery = userQuery;
      const result = await this.processUserQuery(userQuery);
      return result;
    } catch (error) {
      console.error("Error occured will running the agent", error);
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
    // Check if it makes sense to kind of seperate agent and Edit Mode memory, when switching.
    let chatHistory: any = Memory.get(COMMON.GEMINI_CHAT_HISTORY) || [];
    Memory.removeItems(COMMON.GEMINI_CHAT_HISTORY);
    if (!isInitialQuery && chatHistory.length === 0) {
      console.warn("No chat history available for non-initial query");
      // throw new Error("No chat history available for non-initial query");
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
      let finalResult = await this.groqLLM.generateText(userInput);
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

// On each step publish to frontend, somwtimes the
//response take a while, use the states to keep the user engaged.
