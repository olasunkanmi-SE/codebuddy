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
import { IMessageInput, Message } from "../message";
import { IFileToolResponse } from "../../application/interfaces/agent.interface";

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

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    this.generativeAi = new GoogleGenerativeAI(this.config.apiKey);
    this.response = undefined;
    this.orchestrator = Orchestrator.getInstance();
    CodeBuddyToolProvider.initialize();
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
      this.logger.error("Error generating embeddings", error);
      throw new Error("Failed to generate embeddings");
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
      this.logger.error("Error generating text", error);
      throw new Error("Failed to generate text");
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

  async processUserQuery(userInput: string): Promise<FunctionCall | undefined> {
    try {
      await this.buildChatHistory(userInput);
      const prompt = createPrompt(userInput);
      const contents = Memory.get(COMMON.GEMINI_CHAT_HISTORY);
      const tools: any = this.getTools();
      const model = this.getModel({ systemInstruction: prompt, tools });
      const generateContentResponse: GenerateContentResult =
        await model.generateContent({
          contents,
          toolConfig: {
            functionCallingConfig: { mode: FunctionCallingMode.AUTO },
          },
        });
      this.response = generateContentResponse;
      const { text, usageMetadata, functionCalls, candidates, promptFeedback } =
        generateContentResponse.response;
      const tokenCount = usageMetadata?.totalTokenCount ?? 0;
      this.orchestrator.publish(
        "onQuery",
        JSON.stringify("making function call"),
      );
      const toolCalls = functionCalls();
      return toolCalls ? toolCalls[0] : undefined;
    } catch (error: any) {
      this.orchestrator.publish("onError", error);
      vscode.window.showErrorMessage("Error processing user query");
      this.logger.error(
        "Error generating, queries, thoughts from user query",
        error,
      );
      throw error;
    }
  }

  async processFunctionCallResult(
    functionCall: FunctionCall,
    userQuery: string,
  ) {
    try {
      const content = Memory.get(COMMON.GEMINI_CHAT_HISTORY) as Content[];
      if (!this.model) {
        throw new Error("Ai Model is required");
      }
      const chat = await this.model.startChat({
        history: [...content],
      });
      const functionResponse = await this.handleFunctionCall(functionCall);
      const history: any = await this.buildChatHistory(
        userQuery,
        functionCall,
        functionResponse,
        chat,
      );

      const response: GenerateContentResult = await this.model.generateContent({
        contents: history,
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingMode.AUTO },
        },
      });
      this.response = response;
      const { text, usageMetadata, functionCalls, candidates, promptFeedback } =
        response.response;
      const toolCalls = functionCalls();
      let toolResponse;
      if (toolCalls && toolCalls.length > 0) {
        toolCalls.forEach(async (tool) => {
          this.logger.info(`calling ${tool.name} `);
          toolResponse = await this.handleFunctionCall(tool);
          const content = toolResponse.response.content as IFileToolResponse[];
          const retrievedData = content.map(
            (c) => `${c.function} in ${c.content}`,
          );
          const prompt = `How is authentication handled within this code base. You are presented with 
          2 choices, each choices contains a function that is supposed to be the answer to the user query,
          for example How is authentication handled within this code base
          choices: ${retrievedData.join(",")}
          Return the function that answers this question best. Do not modify the function, return the function as it has been written
          State the name of the class of the function, and give a little background on what you have found`;
          this.logger.info(`calling ${JSON.stringify(response.response)} `);
          await this.generateText(prompt);
          console.log(toolResponse);
          history.push(
            Message.of({
              role: "model",
              parts: [{ functionCall: tool }],
            }),
          );

          history.push(
            Message.of({
              role: "user",
              parts: [{ functionResponse: toolResponse }],
            }),
          );
        });
        return this.response;
      } else {
        console.log(text());
        return text();
      }
    } catch (error) {
      this.logger.error("Error while processing function call results", error);
      throw error;
    }
  }

  private async handleFunctionCall(functionCall: FunctionCall) {
    try {
      if (!functionCall) {
        throw new Error("No functionCall available");
      }
      const tools = CodeBuddyToolProvider.getTools();
      const args = functionCall.args as any;
      const name = functionCall.name;
      let executionResult;
      switch (name) {
        case "search_vector_db": {
          const { query } = args;
          const searchTool = tools.find(
            (t) => t.config().name === "search_vector_db",
          );
          if (searchTool) {
            executionResult = await searchTool.execute(query);
          }
          return {
            name,
            response: {
              name,
              content: executionResult,
            },
          };
        }
        case "analyze_files_for_question": {
          const fileTool = tools.find(
            (t) => t.config().name === "analyze_files_for_question",
          );
          const files = args.files;
          if (fileTool) {
            executionResult = await await fileTool.execute(files);
          }
          return {
            name,
            response: {
              name,
              content: executionResult,
            },
          };
        }
        default:
          throw new Error(`Unsupported function: ${functionCall.name}`);
      }
    } catch (error) {
      this.logger.error("Error while handling function call", error);
      throw error;
    }
  }

  async run(userQuery: string) {
    try {
      const functionCall = await this.processUserQuery(userQuery);
      if (!functionCall) {
        throw new Error("No functionCall available");
      }
      const result = this.processFunctionCallResult(functionCall, userQuery);
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
  ): Promise<Content[]> {
    Memory.removeItems(COMMON.GEMINI_CHAT_HISTORY);
    const userMessage = Message.of({
      role: "user",
      parts: [
        {
          text: userQuery,
        },
      ],
    });

    let chatHistory: IMessageInput[] = Memory.has(COMMON.GEMINI_CHAT_HISTORY)
      ? Memory.get(COMMON.GEMINI_CHAT_HISTORY)
      : [userMessage];

    if (userMessage) {
      chatHistory.push(userMessage);
    }

    if (functionCall) {
      chatHistory.push(
        Message.of({
          role: "model",
          parts: [{ functionCall }],
        }),
      );
    }

    if (chat && functionResponse) {
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
    Memory.set(COMMON.GEMINI_CHAT_HISTORY, chatHistory);
    return Memory.get(COMMON.GEMINI_CHAT_HISTORY) as Content[];
  }

  getTools() {
    const tools = CodeBuddyToolProvider.getTools();
    return {
      functionDeclarations: tools.map((t) => t.config()),
    };
  }

  public createSnapShot(data?: any): GeminiModelResponseType {
    return { ...this.response, ...data };
  }

  public loadSnapShot(snapshot: ReturnType<typeof this.createSnapShot>): void {
    Object.assign(this, snapshot);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
