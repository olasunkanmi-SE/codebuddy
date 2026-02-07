import Anthropic from "@anthropic-ai/sdk";
import { IExtensionContext } from "../interfaces/editor-host";
import { EditorHostService } from "../services/editor-host.service";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { createAnthropicClient, getAPIKeyAndModel } from "../utils/utils";
import { BaseWebViewProvider, LLMMessage } from "./base";

export class AnthropicWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: Anthropic;
  constructor(
    extensionUri: any,
    apiKey: string,
    generativeAiModel: string,
    context: IExtensionContext,
    protected baseUrl?: string,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.model = createAnthropicClient(this.apiKey, this.baseUrl);
  }

  /**
   * Override to update Anthropic-specific chatHistory array
   */
  updateProviderChatHistory(history: any[]): void {
    try {
      // Convert to Anthropic's IMessageInput format
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
          parts: msg.parts,
        }),
      );

      this.logger.debug(
        `Updated Anthropic chatHistory array with ${this.chatHistory.length} messages`,
      );
    } catch (error: any) {
      this.logger.warn("Failed to update Anthropic chat history array:", error);
      this.chatHistory = []; // Reset to empty on error
    }
  }

  public async sendResponse(
    response: string,
    currentChat: string,
  ): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push(
          Message.of({
            role: "assistant",
            content: response,
          }),
        );
      } else {
        this.chatHistory.push(
          Message.of({
            role: "user",
            content: response,
          }),
        );
      }
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error: any) {
      this.logger.error(error);
    }
  }

  async *streamResponse(
    message: LLMMessage,
    metaData?: any,
  ): AsyncGenerator<string, void, unknown> {
    let systemInstruction = "";
    let userMessage = "";

    if (typeof message === "object") {
      systemInstruction = message.systemInstruction;
      userMessage = message.userMessage;
    }

    this.chatHistory = Memory.has("chatHistory")
      ? Memory.get("chatHistory")
      : [];

    try {
      if (this.chatHistory?.length > 0) {
        this.updateProviderChatHistory(this.chatHistory);
      }
      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      const { max_tokens } = GROQ_CONFIG;

      const msg = userMessage?.length ? userMessage : message;

      const messageWithContext = `${msg} \n context: ${context ?? ""}`;

      const currentMessage = Message.of({
        role: "user",
        content: messageWithContext,
      });

      this.chatHistory = [...this.chatHistory, currentMessage];

      Memory.set("chatHistory", this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction,
        "agentId",
      );

      const stream = await this.model.messages.create({
        messages: history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        model: this.generativeAiModel,
        max_tokens,
        stream: true,
        system: [
          {
            text: systemInstruction?.length
              ? systemInstruction
              : "You are an helpful assistant",

            type: "text",
          },
        ],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          yield chunk.delta.text;
        }
      }
    } catch (error: any) {
      if (
        this.chatHistory?.length &&
        this.chatHistory[this.chatHistory.length - 1].role === "user"
      ) {
        this.chatHistory.pop();
      }

      Memory.set("chatHistory", this.chatHistory);
      if (error.status === "401") {
        EditorHostService.getInstance()
          .getHost()
          .window.showErrorMessage(
            "Invalid API key. Please update your API key",
          );
        this.logger.error("Invalid API key. Please update your API key", error);
      }
      if (error.status === "503") {
        EditorHostService.getInstance()
          .getHost()
          .window.showErrorMessage("Rate limiting error, try again later");
      }
      this.logger.error("Error generating anthropic response", error.stack);
      throw error;
    }
  }

  async generateResponse(
    message: LLMMessage,
    metaData?: any,
  ): Promise<string | undefined> {
    let systemInstruction = "";
    let userMessage = "";

    if (typeof message === "object") {
      systemInstruction = message.systemInstruction;
      userMessage = message.userMessage;
    }

    this.chatHistory = Memory.has("chatHistory")
      ? Memory.get("chatHistory")
      : [];

    try {
      if (this.chatHistory?.length > 0) {
        this.updateProviderChatHistory(this.chatHistory);
      }
      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      const { max_tokens } = GROQ_CONFIG;

      const msg = userMessage?.length ? userMessage : message;

      const messageWithContext = `${msg} \n context: ${context ?? ""}`;

      const currentMessage = Message.of({
        role: "user",
        content: messageWithContext,
      });

      this.chatHistory = [...this.chatHistory, currentMessage];

      Memory.set("chatHistory", this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction,
        "agentId",
      );

      const chatCompletion = await this.model.messages.create({
        messages: history,
        model: this.generativeAiModel,
        max_tokens,
        stream: false,
        system: [
          {
            text: systemInstruction?.length
              ? systemInstruction
              : "You are an helpful assistant",

            type: "text",
          },
        ],
      });
      const firstContent = chatCompletion.content[0];
      let response = "";
      if ("text" in firstContent && typeof firstContent.text === "string") {
        response = firstContent.text;
      } else if (
        "content" in firstContent &&
        typeof (firstContent as any).content === "string"
      ) {
        response = (firstContent as any).content;
      }
      return response;
    } catch (error: any) {
      if (
        this.chatHistory?.length &&
        this.chatHistory[this.chatHistory.length - 1].role === "user"
      ) {
        this.chatHistory.pop();
      }

      Memory.set("chatHistory", this.chatHistory);
      if (error.status === "401") {
        EditorHostService.getInstance()
          .getHost()
          .window.showErrorMessage(
            "Invalid API key. Please update your API key",
          );
        this.logger.error("Invalid API key. Please update your API key", error);
      }
      if (error.status === "503") {
        EditorHostService.getInstance()
          .getHost()
          .window.showErrorMessage("Rate limiting error, try again later");
      }
      this.logger.error("Error generating anthropic response", error.stack);
      throw error;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }

  async getTokenCounts(input: string): Promise<number> {
    const { model: aiModel } = getAPIKeyAndModel("anthropic");
    const body = {
      model: aiModel,
      messages: [{ role: "user", content: input }],
    } as any;
    const geminiResult = await this.model.messages.countTokens(body);
    return geminiResult.input_tokens;
  }
}
