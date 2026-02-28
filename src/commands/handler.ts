/* eslint-disable @typescript-eslint/no-unused-vars */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import * as vscode from "vscode";
import {
  APP_CONFIG,
  CODEBUDDY_ACTIONS,
  COMMON,
  generativeAiModels,
} from "../application/constant";
import { AnthropicWebViewProvider } from "../webview-providers/anthropic";
import { DeepseekWebViewProvider } from "../webview-providers/deepseek";
import { GeminiWebViewProvider } from "../webview-providers/gemini";
import { GroqWebViewProvider } from "../webview-providers/groq";
import { OpenAIWebViewProvider } from "../webview-providers/openai";
import { QwenWebViewProvider } from "../webview-providers/qwen";
import { GLMWebViewProvider } from "../webview-providers/glm";
import { QwenLLM } from "../llms/qwen/qwen";
import { GLMLLM } from "../llms/glm/glm";
import { WebViewProviderManager } from "../webview-providers/manager";
import {
  createAnthropicClient,
  createOpenAIClient,
  formatText,
  generateUUID,
  getConfigValue,
  getLatestChatHistory,
  getXGroKBaseURL,
  vscodeErrorMessage,
} from "../utils/utils";
import { Memory } from "../memory/base";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { Orchestrator } from "../orchestrator";
import { NotificationService } from "../services/notification.service";
import { architecturalRecommendationCommand } from "./architectural-recommendation";
import { trace, SpanStatusCode, SpanKind, Tracer } from "@opentelemetry/api";

interface ICodeCommandHandler {
  getApplicationConfig(configKey: string): string | undefined;
  getSelectedWindowArea(): string | undefined;
}

export abstract class CodeCommandHandler implements ICodeCommandHandler {
  context: vscode.ExtensionContext;
  protected readonly orchestrator: Orchestrator;
  protected error?: string;
  protected logger: Logger;
  private readonly tracer: Tracer;
  private readonly notificationService: NotificationService;
  constructor(
    private readonly action: string,
    _context: vscode.ExtensionContext,
    errorMessage?: string,
  ) {
    this.context = _context;
    this.error = errorMessage;
    this.logger = Logger.initialize("CodeCommandHandler", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.orchestrator = Orchestrator.getInstance();
    this.tracer = trace.getTracer("codebuddy-commands");
    this.notificationService = NotificationService.getInstance();
  }

  /**
   * Read all provider config values fresh from VS Code settings.
   * This ensures model/provider changes take effect immediately
   * without requiring an extension restart.
   */
  private getActiveConfig() {
    return {
      generativeAi: getConfigValue(APP_CONFIG.generativeAi) ?? "",
      geminiApiKey: getConfigValue(APP_CONFIG.geminiKey) ?? "",
      geminiModel: getConfigValue(APP_CONFIG.geminiModel) ?? "",
      groqApiKey: getConfigValue(APP_CONFIG.groqApiKey) ?? "",
      groqModel: getConfigValue(APP_CONFIG.groqModel) ?? "",
      anthropicModel: getConfigValue(APP_CONFIG.anthropicModel) ?? "",
      anthropicApiKey: getConfigValue(APP_CONFIG.anthropicApiKey) ?? "",
      xGrokApiKey: getConfigValue(APP_CONFIG.grokApiKey) ?? "",
      xGrokModel: getConfigValue(APP_CONFIG.grokModel) ?? "",
      openaiApiKey: getConfigValue(APP_CONFIG.openaiApiKey) ?? "",
      openaiModel: getConfigValue(APP_CONFIG.openaiModel) ?? "",
      qwenApiKey: getConfigValue(APP_CONFIG.qwenApiKey) ?? "",
      qwenModel: getConfigValue(APP_CONFIG.qwenModel) ?? "",
      glmApiKey: getConfigValue(APP_CONFIG.glmApiKey) ?? "",
      glmModel: getConfigValue(APP_CONFIG.glmModel) ?? "",
    };
  }

  getApplicationConfig(configKey: string): string | undefined {
    return getConfigValue(configKey);
  }

  /**
   * Get command feedback with action name and description
   */
  private getCommandFeedback(action: string): {
    action: string;
    description: string;
  } {
    const commandDescriptions: Record<
      string,
      { action: string; description: string }
    > = {
      [CODEBUDDY_ACTIONS.comment]: {
        action: "Adding Code Comments",
        description:
          "CodeBuddy is analyzing your code and adding meaningful comments that explain the intent and logic...",
      },
      [CODEBUDDY_ACTIONS.review]: {
        action: "Reviewing Code Quality",
        description:
          "CodeBuddy is conducting a comprehensive code review covering security, performance, and best practices...",
      },
      [CODEBUDDY_ACTIONS.refactor]: {
        action: "Refactoring Code",
        description:
          "CodeBuddy is applying SOLID principles and design patterns to improve code maintainability...",
      },
      [CODEBUDDY_ACTIONS.optimize]: {
        action: "Optimizing Performance",
        description:
          "CodeBuddy is analyzing algorithms and data structures to enhance code performance and efficiency...",
      },
      [CODEBUDDY_ACTIONS.fix]: {
        action: "Fixing Code Issues",
        description:
          "CodeBuddy is diagnosing the error and implementing defensive programming solutions...",
      },
      [CODEBUDDY_ACTIONS.explain]: {
        action: "Explaining Code Logic",
        description:
          "CodeBuddy is breaking down complex code into clear, educational explanations with real-world context...",
      },
      [CODEBUDDY_ACTIONS.commitMessage]: {
        action: "Generating Commit Message",
        description:
          "CodeBuddy is analyzing your staged changes and crafting a professional commit message...",
      },
      [CODEBUDDY_ACTIONS.interviewMe]: {
        action: "Preparing Interview Questions",
        description:
          "CodeBuddy is creating comprehensive technical interview questions based on your code...",
      },
      [CODEBUDDY_ACTIONS.generateUnitTest]: {
        action: "Generating Unit Tests",
        description:
          "CodeBuddy is creating comprehensive test suites with edge cases and mocking strategies...",
      },
      [CODEBUDDY_ACTIONS.generateDiagram]: {
        action: "Creating System Diagram",
        description:
          "CodeBuddy is visualizing your code architecture with professional Mermaid diagrams...",
      },
      [CODEBUDDY_ACTIONS.reviewPR]: {
        action: "Reviewing Pull Request",
        description:
          "CodeBuddy is conducting a thorough PR review with security, performance, and architecture analysis...",
      },
      [CODEBUDDY_ACTIONS.inlineChat]: {
        action: "Processing Inline Request",
        description:
          "CodeBuddy is analyzing your inline query and generating a contextual response...",
      },
      [CODEBUDDY_ACTIONS.architecturalRecommendation]: {
        action: "Generating Architectural Recommendations",
        description:
          "CodeBuddy is analyzing your codebase to provide architectural recommendations...",
      },
    };

    return (
      commandDescriptions[action] || {
        action: "Processing Request",
        description:
          "CodeBuddy is analyzing your code and generating a response...",
      }
    );
  }

  /**
   * Send command feedback to the webview
   */
  private async sendCommandFeedback(action: string): Promise<void> {
    const feedback = this.getCommandFeedback(action);
    const { generativeAi } = this.getActiveConfig();

    switch (generativeAi) {
      case generativeAiModels.GROQ:
        await GroqWebViewProvider.webView?.webview.postMessage({
          type: "codebuddy-commands",
          message: feedback,
        });
        break;
      case generativeAiModels.GEMINI:
        await GeminiWebViewProvider.webView?.webview.postMessage({
          type: "codebuddy-commands",
          message: feedback,
        });
        break;
      case generativeAiModels.DEEPSEEK:
        await DeepseekWebViewProvider.webView?.webview.postMessage({
          type: "codebuddy-commands",
          message: feedback,
        });
        break;
      case generativeAiModels.ANTHROPIC:
      case generativeAiModels.GROK:
        await AnthropicWebViewProvider.webView?.webview.postMessage({
          type: "codebuddy-commands",
          message: feedback,
        });
        break;
      case generativeAiModels.OPENAI:
        await OpenAIWebViewProvider.webView?.webview.postMessage({
          type: "codebuddy-commands",
          message: feedback,
        });
        break;
      case generativeAiModels.QWEN:
        await QwenWebViewProvider.webView?.webview.postMessage({
          type: "codebuddy-commands",
          message: feedback,
        });
        break;
      case generativeAiModels.GLM:
        await GLMWebViewProvider.webView?.webview.postMessage({
          type: "codebuddy-commands",
          message: feedback,
        });
        break;
      default:
        this.logger.error("Unknown generative AI", "");
        break;
    }
  }

  protected createModel():
    | { generativeAi: string; model: any; modelName: string }
    | undefined {
    try {
      const config = this.getActiveConfig();
      let model;
      let modelName = "";
      if (!config.generativeAi) {
        vscodeErrorMessage(
          "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
        );
      }
      if (config.generativeAi === generativeAiModels.GROQ) {
        const apiKey = config.groqApiKey;
        modelName = config.groqModel;
        if (!apiKey || !modelName) {
          vscodeErrorMessage(
            "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
          );
        }
        model = this.createGroqModel(apiKey);
      }

      if (config.generativeAi === generativeAiModels.GEMINI) {
        const apiKey = config.geminiApiKey;
        modelName = config.geminiModel;
        model = this.createGeminiModel(apiKey, modelName);
      }

      if (config.generativeAi === generativeAiModels.ANTHROPIC) {
        const apiKey: string = config.anthropicApiKey;
        modelName = config.anthropicModel;
        model = this.createAnthropicModel(apiKey);
      }

      if (config.generativeAi === generativeAiModels.GROK) {
        const apiKey: string = config.xGrokApiKey;
        modelName = config.xGrokModel;
        model = this.createAnthropicModel(apiKey);
      }

      if (config.generativeAi === generativeAiModels.OPENAI) {
        const apiKey: string = config.openaiApiKey;
        modelName = config.openaiModel;
        model = createOpenAIClient(apiKey);
      }

      if (config.generativeAi === generativeAiModels.QWEN) {
        const apiKey: string = config.qwenApiKey;
        modelName = config.qwenModel;
        model = QwenLLM.getInstance({ apiKey, model: modelName }).getModel();
      }

      if (config.generativeAi === generativeAiModels.GLM) {
        const apiKey: string = config.glmApiKey;
        modelName = config.glmModel;
        model = GLMLLM.getInstance({ apiKey, model: modelName }).getModel();
      }
      return { generativeAi: config.generativeAi, model, modelName };
    } catch (error: any) {
      this.logger.error("Error creating model:", error);
      vscode.window.showErrorMessage(
        "An error occurred while creating the model. Please try again.",
      );
      this.notificationService.addNotification(
        "error",
        "Model Creation Failed",
        error?.message ||
          "Failed to create model. Check your API configuration.",
        "Commands",
      );
    }
  }

  getSelectedWindowArea(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.logger.info("No active text editor.");
      return;
    }
    const selection: vscode.Selection | undefined = editor.selection;
    const selectedArea: string | undefined = editor.document.getText(selection);
    return selectedArea;
  }

  private createGeminiModel(apiKey: string, name: string): GenerativeModel {
    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: name });
    return model;
  }

  private createAnthropicModel(apiKey: string): Anthropic {
    let xGrokBaseURL;
    if (getConfigValue(APP_CONFIG.generativeAi) === generativeAiModels.GROK) {
      xGrokBaseURL = getXGroKBaseURL();
    }
    return createAnthropicClient(apiKey, xGrokBaseURL);
  }

  private createGroqModel(apiKey: string): Groq {
    return new Groq({ apiKey });
  }

  protected async generateModelResponse(
    text: string,
  ): Promise<string | Anthropic.Messages.Message | undefined> {
    const span = this.tracer.startSpan("llm.generate", {
      kind: SpanKind.CLIENT,
      attributes: {
        "llm.provider": this.getActiveConfig().generativeAi || "unknown",
        "llm.action": this.action,
      },
    });
    try {
      if (text?.length > 0) {
        this.orchestrator.publish("onUserPrompt", text);
      }
      const activeModel = this.createModel();
      if (!activeModel) {
        throw new Error("Model not found. Check your settings.");
      }

      const { generativeAi, model, modelName } = activeModel;
      if (!generativeAi || !generativeAiModels) {
        throw new Error("Model not found. Check your settings.");
      }
      span.setAttribute("llm.model", modelName || "unknown");
      let response;
      switch (generativeAi) {
        case generativeAiModels.GEMINI:
          response = await this.generateGeminiResponse(model, text);
          break;
        case generativeAiModels.ANTHROPIC:
          if (modelName) {
            response = await this.anthropicResponse(model, modelName, text);
          }
          break;
        case generativeAiModels.GROQ:
          if (modelName) {
            response = await this.groqResponse(model, text, modelName);
          }
          break;
        case generativeAiModels.GROK:
          if (modelName) {
            response = await this.anthropicResponse(model, modelName, text);
          }
          break;
        case generativeAiModels.OPENAI:
          if (modelName) {
            response = await this.openAIResponse(model, modelName, text);
          }
          break;
        case generativeAiModels.QWEN:
          if (modelName) {
            response = await this.qwenResponse(model, modelName, text);
          }
          break;
        case generativeAiModels.GLM:
          if (modelName) {
            response = await this.glmResponse(model, modelName, text);
          }
          break;
        default:
          throw new Error("Unsupported model name.");
      }

      if (!response) {
        throw new Error(
          "Could not generate response. Check your settings, ensure the API keys and Model Name is added properly.",
        );
      }
      if (this.action.includes("chart")) {
        if (typeof response === "string") {
          response = this.cleanGraphString(response);
        }
      }
      span.setAttribute(
        "llm.response_length",
        typeof response === "string" ? response.length : 0,
      );
      span.setStatus({ code: SpanStatusCode.OK });
      return response;
    } catch (error: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error?.message || "Unknown error",
      });
      span.recordException(error);
      this.logger.error("Error generating response:", error);
      vscode.window.showErrorMessage(
        "An error occurred while generating the response. Please try again.",
      );
      this.notificationService.addNotification(
        "error",
        "Response Generation Failed",
        error?.message ||
          "Failed to generate a response. Please check your API key and model settings.",
        "Commands",
      );
    } finally {
      span.end();
    }
  }

  cleanGraphString(inputString: string) {
    if (inputString.includes("|>")) {
      return inputString.replace(/\|>/g, "|");
    }
    return inputString;
  }

  async generateGeminiResponse(
    model: any,
    text: string,
  ): Promise<string | undefined> {
    const result = await model.generateContent(text);
    return result ? await result.response.text() : undefined;
  }

  private async anthropicResponse(
    model: Anthropic,
    generativeAiModel: string,
    userPrompt: string,
  ): Promise<string | undefined> {
    try {
      const response = await model.messages.create({
        model: generativeAiModel,
        system: "",
        max_tokens: 3024,
        messages: [{ role: "user", content: userPrompt }],
      });
      const firstContent = response.content[0];
      if (
        firstContent &&
        typeof firstContent === "object" &&
        "text" in firstContent &&
        typeof firstContent.text === "string"
      ) {
        return firstContent.text;
      }
      return undefined;
    } catch (error: any) {
      this.logger.error("Error generating response:", error);
    }
  }

  private async groqResponse(
    model: Groq,
    prompt: string,
    generativeAiModel: string,
  ): Promise<string | undefined> {
    try {
      const chatHistory = Memory.has(COMMON.ANTHROPIC_CHAT_HISTORY)
        ? Memory.get(COMMON.GROQ_CHAT_HISTORY)
        : [];
      const params = {
        messages: [
          ...chatHistory,
          {
            role: "user",
            content: prompt,
          },
        ],
        model: generativeAiModel,
      };

      const completion: Groq.Chat.ChatCompletion =
        await model.chat.completions.create(params);
      return completion.choices[0]?.message?.content ?? undefined;
    } catch (error: any) {
      this.logger.error("Error generating response:", error);
    }
  }

  private async openAIResponse(
    model: OpenAI,
    generativeAiModel: string,
    prompt: string,
  ): Promise<string | undefined> {
    try {
      const chatHistory = Memory.has(COMMON.OPENAI_CHAT_HISTORY)
        ? Memory.get(COMMON.OPENAI_CHAT_HISTORY)
        : [];
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...chatHistory,
        { role: "user", content: prompt },
      ];
      const completion = await model.chat.completions.create({
        messages,
        model: generativeAiModel,
      });
      return completion.choices[0]?.message?.content ?? undefined;
    } catch (error: any) {
      this.logger.error("Error generating OpenAI response:", error);
    }
  }

  private async qwenResponse(
    model: OpenAI,
    generativeAiModel: string,
    prompt: string,
  ): Promise<string | undefined> {
    try {
      const chatHistory = Memory.has(COMMON.QWEN_CHAT_HISTORY)
        ? Memory.get(COMMON.QWEN_CHAT_HISTORY)
        : [];
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...chatHistory,
        { role: "user", content: prompt },
      ];
      const completion = await model.chat.completions.create({
        messages,
        model: generativeAiModel,
      });
      return completion.choices[0]?.message?.content ?? undefined;
    } catch (error: any) {
      this.logger.error("Error generating Qwen response:", error);
    }
  }

  private async glmResponse(
    model: OpenAI,
    generativeAiModel: string,
    prompt: string,
  ): Promise<string | undefined> {
    try {
      const chatHistory = Memory.has(COMMON.GLM_CHAT_HISTORY)
        ? Memory.get(COMMON.GLM_CHAT_HISTORY)
        : [];
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...chatHistory,
        { role: "user", content: prompt },
      ];
      const completion = await model.chat.completions.create({
        messages,
        model: generativeAiModel,
      });
      return completion.choices[0]?.message?.content ?? undefined;
    } catch (error: any) {
      this.logger.error("Error generating GLM response:", error);
    }
  }

  abstract formatResponse(comment: string): string;

  abstract createPrompt(text?: string): any;

  async generateResponse(
    message?: string,
  ): Promise<string | Anthropic.Messages.Message | undefined> {
    this.logger.info(this.action);
    let prompt;
    const selectedCode = this.getSelectedWindowArea();
    if (!message && !selectedCode) {
      vscode.window.showErrorMessage("select a piece of code.");
      return;
    }

    if (message && selectedCode) {
      prompt = await this.createPrompt(`${message} \n ${selectedCode}`);
    } else {
      message
        ? (prompt = await this.createPrompt(message))
        : (prompt = await this.createPrompt(selectedCode));
    }

    if (!prompt) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }

    const response = await this.generateModelResponse(prompt);
    const model = getConfigValue("generativeAi.option");

    if (prompt && response) {
      let chatHistory;
      switch (model) {
        case generativeAiModels.GEMINI:
          chatHistory = getLatestChatHistory(COMMON.GEMINI_CHAT_HISTORY);
          Memory.set(COMMON.GEMINI_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              parts: [{ text: prompt }],
            },
            {
              role: "model",
              parts: [{ text: response }],
            },
          ]);
          break;
        case generativeAiModels.GROQ:
          chatHistory = getLatestChatHistory(COMMON.GROQ_CHAT_HISTORY);
          Memory.set(COMMON.GROQ_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "system",
              content: response,
            },
          ]);
          break;
        case generativeAiModels.ANTHROPIC:
          chatHistory = getLatestChatHistory(COMMON.ANTHROPIC_CHAT_HISTORY);
          Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ]);
          break;
        case generativeAiModels.GROK:
          chatHistory = getLatestChatHistory(COMMON.ANTHROPIC_CHAT_HISTORY);
          Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ]);
          break;
        case generativeAiModels.OPENAI:
          chatHistory = getLatestChatHistory(COMMON.OPENAI_CHAT_HISTORY);
          Memory.set(COMMON.OPENAI_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ]);
          break;
        case generativeAiModels.QWEN:
          chatHistory = getLatestChatHistory(COMMON.QWEN_CHAT_HISTORY);
          Memory.set(COMMON.QWEN_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ]);
          break;
        case generativeAiModels.GLM:
          chatHistory = getLatestChatHistory(COMMON.GLM_CHAT_HISTORY);
          Memory.set(COMMON.GLM_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ]);
          break;
        default:
          throw new Error(`Generative model ${model} not available`);
      }
    }
    return response;
  }

  async getUserInLineChat(): Promise<string | undefined> {
    try {
      const userPrompt = await vscode.window.showInputBox({
        placeHolder: "Enter instructions for CodeBuddy",
        ignoreFocusOut: true,
        validateInput: (text) => {
          return text === ""
            ? "Enter instructions for CodeBuddy or press Escape to close chat box"
            : null;
        },
      });
      return userPrompt;
    } catch (error: any) {
      this.logger.error("Error generating inline chat", error);
    }
  }

  async execute(action?: string, message?: string): Promise<void> {
    const commandAction = action || this.action;
    const span = this.tracer.startSpan(`command.${commandAction}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        "command.action": commandAction,
        "command.has_message": !!message,
        "command.provider": this.getActiveConfig().generativeAi || "unknown",
      },
    });
    try {
      // Send command feedback immediately at the start
      await this.sendCommandFeedback(commandAction);

      this.logger.info(this.action);
      let prompt;
      const selectedCode = this.getSelectedWindowArea();
      if (!message && !selectedCode) {
        vscode.window.showErrorMessage("select a piece of code.");
        span.setStatus({ code: SpanStatusCode.UNSET });
        return;
      }

      if (message && selectedCode) {
        prompt = await this.createPrompt(`${message} \n ${selectedCode}`);
      } else {
        message
          ? (prompt = await this.createPrompt(message))
          : (prompt = await this.createPrompt(selectedCode));
      }

      if (!prompt) {
        vscode.window.showErrorMessage("model not reponding, try again later");
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to create prompt",
        });
        return;
      }

      span.addEvent("prompt_created");

      const providerManager = WebViewProviderManager.getInstance(this.context);
      const provider = providerManager.getCurrentProvider();

      if (!provider) {
        vscode.window.showErrorMessage("Provider not initialized");
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Provider not initialized",
        });
        return;
      }

      const requestId = generateUUID();
      await provider.currentWebView?.webview.postMessage({
        type: "onStreamStart",
        payload: { requestId },
      });

      span.addEvent("stream_start");
      let fullResponse = "";
      try {
        for await (const chunk of provider.streamResponse(prompt)) {
          fullResponse += chunk;
          await provider.currentWebView?.webview.postMessage({
            type: "onStreamChunk",
            payload: { requestId, content: chunk },
          });
        }
      } catch (error: any) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error?.message || "Streaming error",
        });
        span.recordException(error);
        this.logger.error("Error during streaming", error);
        await provider.currentWebView?.webview.postMessage({
          type: "onStreamError",
          payload: { requestId, error: error.message },
        });
        this.notificationService.addNotification(
          "error",
          "Command Streaming Failed",
          error?.message || "An error occurred while streaming the response.",
          "Commands",
        );
        return;
      }

      const formattedResponse = this.formatResponse(fullResponse);

      await provider.currentWebView?.webview.postMessage({
        type: "onStreamEnd",
        payload: { requestId, content: formattedResponse },
      });

      span.setAttribute("command.response_length", fullResponse.length);
      span.addEvent("stream_end");
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error?.message || "Unknown error",
      });
      span.recordException(error);
      this.logger.error(
        "Error while passing model response to the webview",
        error,
      );
      this.notificationService.addNotification(
        "error",
        "Command Execution Failed",
        error?.message ||
          "An unexpected error occurred while executing the command.",
        "Commands",
      );
    } finally {
      span.end();
    }
  }
}
