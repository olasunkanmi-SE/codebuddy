import markdownit from "markdown-it";
import {
  APP_CONFIG,
  COMMON,
  generativeAiModels,
} from "../application/constant";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Memory } from "../memory/base";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { EditorHostService } from "../services/editor-host.service";

type GetConfigValueType<T> = (key: string) => T | undefined;

const fixIncompleteMarkdown = (text: string): string => {
  let processedText = text;

  // Fix incomplete bold/italic formatting
  if (processedText.endsWith("**") || processedText.endsWith("*")) {
    processedText = processedText.replace(/\*+$/, "");
  }

  // Fix incomplete header formatting
  const headerRegex = /#+ *$/;
  if (headerRegex.exec(processedText)) {
    processedText = processedText.replace(headerRegex, "");
  }

  return processedText;
};

const fixUnmatchedBoldFormatting = (text: string): string => {
  const asteriskCount = (text.match(/\*\*/g) || []).length;
  if (asteriskCount % 2 !== 0) {
    const lastDoubleAsterisk = text.lastIndexOf("**");
    if (lastDoubleAsterisk !== -1) {
      const afterLastAsterisk = text.substring(lastDoubleAsterisk + 2);
      // If there's content after the last ** and no closing **, add one
      if (
        afterLastAsterisk.trim().length > 0 &&
        !afterLastAsterisk.includes("**")
      ) {
        return text + "**";
      }
    }
  }
  return text;
};

export const formatText = (text?: string): string => {
  if (!text) return "";

  try {
    let processedText = fixIncompleteMarkdown(text);
    processedText = fixUnmatchedBoldFormatting(processedText);

    // Extract mermaid blocks before markdown-it processing to keep syntax intact
    processedText = processedText.replace(
      /```mermaid\s*([\s\S]*?)```/g,
      (_, codeBlock: string) => {
        const trimmedCode = codeBlock.trim();
        if (!trimmedCode) {
          return "";
        }

        const encodedCode = Buffer.from(trimmedCode, "utf-8").toString(
          "base64",
        );
        return `\n\n<div class="mermaid-container" data-mermaid="${encodedCode}"></div>\n\n`;
      },
    );

    const md = markdownit({
      html: true,
      linkify: true,
      breaks: true,
    });

    return md.render(processedText);
  } catch (error: any) {
    // If markdown parsing fails, provide a more robust fallback
    console.warn(
      "Markdown parsing failed, providing HTML-safe fallback:",
      error,
    );

    // Create a safe HTML fallback with basic formatting
    const safeFallback = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\n/g, "<br/>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, "<code>$1</code>") // Inline code
      .replace(/^### (.*$)/gim, "<h3>$1</h3>") // H3
      .replace(/^## (.*$)/gim, "<h2>$1</h2>") // H2
      .replace(/^# (.*$)/gim, "<h1>$1</h1>"); // H1

    return `<div class="markdown-fallback">${safeFallback}</div>`;
  }
};

export const getConfigValue: GetConfigValueType<any> = <T>(
  key: string,
): T | undefined => {
  return EditorHostService.getInstance()
    .getHost()
    .workspace.getConfiguration()
    .get<T>(key);
};

export const setConfigValue = <T>(key: string, value: T) => {
  EditorHostService.getInstance()
    .getHost()
    .workspace.getConfiguration()
    .update(key, value);
};

export const vscodeErrorMessage = (error: string, metaData?: any) => {
  return EditorHostService.getInstance()
    .getHost()
    .window.showErrorMessage(error);
};

export const getLatestChatHistory = (key: string) => {
  let chatHistory = Memory.has(key) ? Memory.get(key) : [];
  if (chatHistory?.length > 3) {
    chatHistory = chatHistory.slice(-3);
  }
  return chatHistory;
};

export const resetChatHistory = (model: string) => {
  switch (model) {
    case generativeAiModels.ANTHROPIC:
      Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, []);
      break;
    case generativeAiModels.GEMINI:
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      break;
    case generativeAiModels.GROQ:
      Memory.set(COMMON.GROQ_CHAT_HISTORY, []);
      break;
    case generativeAiModels.OPENAI:
      Memory.set(COMMON.OPENAI_CHAT_HISTORY, []);
      break;
    case generativeAiModels.QWEN:
      Memory.set(COMMON.QWEN_CHAT_HISTORY, []);
      break;
    case generativeAiModels.GLM:
      Memory.set(COMMON.GLM_CHAT_HISTORY, []);
      break;
    default:
      break;
  }
};

export const getXGroKBaseURL = () => {
  return "https://api.x.ai/";
};

export const createAnthropicClient = (apiKey: string, baseURL?: string) => {
  if (baseURL) {
    return new Anthropic({
      apiKey,
      baseURL,
    });
  }
  return new Anthropic({
    apiKey,
  });
};

export const createOpenAIClient = (apiKey: string, baseURL?: string) => {
  if (baseURL) {
    return new OpenAI({
      apiKey,
      baseURL,
    });
  }
  return new OpenAI({
    apiKey,
  });
};

export const getGenerativeAiModel = (): string | undefined => {
  return getConfigValue("generativeAi.option");
};

// This function generates a random 32-character string (nonce) using alphanumeric characters
// A nonce is a unique, random value used for security purposes, typically to prevent replay attacks
// and ensure script integrity when using Content Security Policy (CSP)
export const getNonce = () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const handleError = (error: unknown, message?: string): void => {
  const errorMessage = error instanceof Error ? error.message : "Unknown Error";
  EditorHostService.getInstance()
    .getHost()
    .window.showErrorMessage(`${message}, ${errorMessage}`);
};

export const handleWarning = (message?: string, args?: string): void => {
  EditorHostService.getInstance()
    .getHost()
    .window.showWarningMessage(`${message}, ${args}`);
};

export const showInfoMessage = (message?: string): void => {
  EditorHostService.getInstance()
    .getHost()
    .window.showInformationMessage(`${message}`);
};

/**
 * Retrieves the Gemini API key from the application configuration, which is required for code indexing.
 * @returns {string} The API key.
 */
/**
 * Retrieves the API key and model name based on the provided model identifier.
 * @param {string} model - The identifier of the model (e.g., "gemini", "groq", "anthropic").
 * @returns {APIKeyConfig} An object containing the API key and the model name.
 * @throws {Error} If the API key is not found in the configuration.
 */
export const getAPIKeyAndModel = (
  model: string,
): { apiKey: string; model?: string; baseUrl?: string } => {
  const {
    geminiKey,
    groqApiKey,
    groqModel,
    anthropicApiKey,
    geminiModel,
    anthropicModel,
    tavilyApiKey,
    openaiApiKey,
    openaiModel,
    qwenApiKey,
    qwenModel,
    glmApiKey,
    glmModel,
    localBaseUrl,
    localModel,
    localApiKey,
  } = APP_CONFIG;
  let apiKey: string | undefined;
  let modelName: string | undefined;
  let baseUrl: string | undefined;

  const lowerCaseModel = model.toLowerCase();

  switch (lowerCaseModel) {
    case "gemini":
      apiKey = getConfigValue(geminiKey);
      modelName = getConfigValue(geminiModel);
      break;
    case "groq":
      apiKey = getConfigValue(groqApiKey);
      modelName = getConfigValue(groqModel);
      break;
    case "anthropic":
      apiKey = getConfigValue(anthropicApiKey);
      modelName = getConfigValue(anthropicModel);
      break;
    case "tavily":
      apiKey = getConfigValue(tavilyApiKey);
      break;
    case "openai":
      apiKey = getConfigValue(openaiApiKey);
      modelName = getConfigValue(openaiModel);
      break;
    case "qwen":
      apiKey = getConfigValue(qwenApiKey);
      modelName = getConfigValue(qwenModel);
      baseUrl = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
      break;
    case "glm":
      apiKey = getConfigValue(glmApiKey);
      modelName = getConfigValue(glmModel);
      baseUrl = "https://open.bigmodel.cn/api/paas/v4";
      break;
    case "deepseek":
      apiKey = getConfigValue(APP_CONFIG.deepseekApiKey);
      modelName = getConfigValue(APP_CONFIG.deepseekModel);
      baseUrl = "https://api.deepseek.com";
      break;
    case "local":
      apiKey = getConfigValue(localApiKey) || "not-needed";
      modelName = getConfigValue(localModel);
      baseUrl = getConfigValue(APP_CONFIG.localBaseUrl);
      break;
    default:
      throw new Error(`Unsupported model: ${model}`);
  }

  if (!apiKey && lowerCaseModel !== "local") {
    throw new Error(
      `API key not found for model: ${model}. Please add the API key in the extension configuration.`,
    );
  }

  return { apiKey: apiKey || "", model: modelName, baseUrl };
};

export const generateQueryString = (query: string) =>
  `q=${encodeURIComponent(query)}`;

export const generateId = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const generateUUID = () => {
  return crypto.randomUUID();
};

export const isWebSearchConfigured = (): boolean => {
  try {
    const key = getAPIKeyAndModel("tavily").apiKey;
    return Boolean(key) && key !== "apiKey";
  } catch (error) {
    return false;
  }
};
