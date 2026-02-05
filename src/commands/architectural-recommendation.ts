import * as vscode from "vscode";
import { PersistentCodebaseUnderstandingService } from "../services/persistent-codebase-understanding.service";
import { GeminiLLM } from "../llms/gemini/gemini";
import { GroqLLM } from "../llms/groq/groq";
import { DeepseekLLM } from "../llms/deepseek/deepseek";
import { LocalLLM } from "../llms/local/local";
import { AnthropicLLM } from "../llms/anthropic/anthropic";
import { getAPIKeyAndModel, getConfigValue } from "../utils/utils";
import { LLMOutputSanitizer } from "../utils/llm-output-sanitizer";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "../services/telemetry";
import { Orchestrator } from "../orchestrator";
import { generativeAiModels } from "../application/constant";
import { ILlmConfig } from "../llms/interface";

const orchestrator = Orchestrator.getInstance();

/**
 * Determines if analysis cache should be refreshed based on age and availability
 */
async function shouldRefreshAnalysis(summary: any): Promise<boolean> {
  if (!summary.hasCache) {
    return true;
  }

  if (summary.lastAnalysis) {
    const lastAnalysisDate = new Date(summary.lastAnalysis);
    const hoursSinceAnalysis =
      (Date.now() - lastAnalysisDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceAnalysis > 24;
  }

  return false;
}

const logger = Logger.initialize("extension-main", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

/**
 * Prompts user for cache refresh decision when analysis is stale
 */
async function getUserCacheDecision(
  summary: any,
): Promise<"use" | "refresh" | "cancel"> {
  if (!summary.hasCache) {
    const choice = await vscode.window.showInformationMessage(
      "No cached analysis found. This will take some time to analyze your codebase.",
      "Analyze Now",
      "Cancel",
    );
    return choice === "Analyze Now" ? "refresh" : "cancel";
  }

  if (summary.lastAnalysis) {
    const lastAnalysisDate = new Date(summary.lastAnalysis);
    const hoursSinceAnalysis =
      (Date.now() - lastAnalysisDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceAnalysis > 24) {
      const choice = await vscode.window.showInformationMessage(
        `Cached analysis is ${Math.round(hoursSinceAnalysis)} hours old. Would you like to refresh it?`,
        "Use Cache",
        "Refresh Analysis",
        "Cancel",
      );

      if (choice === "Cancel") return "cancel";
      return choice === "Refresh Analysis" ? "refresh" : "use";
    }
  }

  return "use";
}

export async function architecturalRecommendationCommand(): Promise<void> {
  const persistentCodebaseService =
    PersistentCodebaseUnderstandingService.getInstance();

  let selectedModel: string | undefined;

  // 1. Try to get confirmed active model from WebView Manager (Source of Truth)
  try {
    const manager = (globalThis as any).providerManager;
    if (manager && typeof manager.getActiveModelName === "function") {
      selectedModel = manager.getActiveModelName();
    }
  } catch (e) {
    // ignore
  }

  // 2. Fallback to config if manager didn't provide it
  if (!selectedModel) {
    selectedModel = getConfigValue("generativeAi.option") as string;
  }
  const rawModel = selectedModel; // for debugging

  // Fallback: Check for namespaced config check if global is default or missing
  if (!selectedModel || selectedModel === "Gemini") {
    const namespaced = getConfigValue(
      "codebuddy.generativeAi.option",
    ) as string;
    if (namespaced && namespaced !== "Gemini") {
      selectedModel = namespaced;
    }
  }

  // Robustness check: validation and normalization
  if (!selectedModel) {
    selectedModel = "Gemini"; // Default
  }
  selectedModel = selectedModel.trim();
  const currentModel = selectedModel; // Capture for closure

  // Try to find case-insensitive match against known models
  const modelEnum = Object.values(generativeAiModels).find(
    (m) => m.toLowerCase() === currentModel.toLowerCase(),
  );

  // Debug: Show currently selected model
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const debug_msg = `Analysis Model Selection:\nRaw: '${rawModel}'\nFinal: '${modelEnum || selectedModel}'`;
  logger.info(debug_msg);
  // vscode.window.showInformationMessage(debug_msg);

  if (modelEnum) {
    selectedModel = modelEnum;
  }

  let llmProvider: any;

  try {
    switch (selectedModel) {
      case generativeAiModels.GEMINI: {
        const apiKeyInfo = getAPIKeyAndModel("gemini");
        if (!apiKeyInfo.apiKey || !apiKeyInfo.model)
          throw new Error("Gemini not configured");
        llmProvider = new GeminiLLM({
          apiKey: apiKeyInfo.apiKey,
          model: apiKeyInfo.model,
        });
        break;
      }
      case generativeAiModels.GROQ: {
        const apiKeyInfo = getAPIKeyAndModel("groq");
        if (!apiKeyInfo.apiKey || !apiKeyInfo.model)
          throw new Error("Groq not configured");
        llmProvider = new GroqLLM({
          apiKey: apiKeyInfo.apiKey,
          model: apiKeyInfo.model,
        });
        break;
      }
      case generativeAiModels.DEEPSEEK: {
        const apiKeyInfo = getAPIKeyAndModel("deepseek");
        if (!apiKeyInfo.apiKey || !apiKeyInfo.model)
          throw new Error("Deepseek not configured");
        llmProvider = new DeepseekLLM({
          apiKey: apiKeyInfo.apiKey,
          model: apiKeyInfo.model,
          baseUrl: apiKeyInfo.baseUrl,
        });
        break;
      }
      case generativeAiModels.LOCAL: {
        const apiKeyInfo = getAPIKeyAndModel("local");
        llmProvider = new LocalLLM({
          apiKey: apiKeyInfo.apiKey,
          model: apiKeyInfo.model || "qwen2.5-coder",
          baseUrl: apiKeyInfo.baseUrl,
        });
        break;
      }
      case generativeAiModels.ANTHROPIC: {
        const apiKeyInfo = getAPIKeyAndModel("anthropic");
        if (!apiKeyInfo.apiKey || !apiKeyInfo.model)
          throw new Error("Anthropic not configured");
        llmProvider = new AnthropicLLM({
          apiKey: apiKeyInfo.apiKey,
          model: apiKeyInfo.model,
        });
        break;
      }
      case generativeAiModels.OPENAI:
      case generativeAiModels.QWEN:
      case generativeAiModels.GLM: {
        const normalizedKey =
          selectedModel === generativeAiModels.OPENAI
            ? "openai"
            : selectedModel === generativeAiModels.QWEN
              ? "qwen"
              : "glm";

        const apiKeyInfo = getAPIKeyAndModel(normalizedKey);

        llmProvider = new LocalLLM({
          apiKey: apiKeyInfo.apiKey,
          model: apiKeyInfo.model || "gpt-4o",
          baseUrl:
            apiKeyInfo.baseUrl ||
            (normalizedKey === "openai"
              ? "https://api.openai.com/v1"
              : undefined),
        });
        break;
      }
      default: {
        const apiKeyInfo = getAPIKeyAndModel("gemini");
        if (!apiKeyInfo.apiKey || !apiKeyInfo.model)
          throw new Error(`Selected model '${selectedModel}' not configured.`);

        logger.info(
          `CodebaseAnalysis: Falling back to Gemini for model '${selectedModel}'`,
        );
        llmProvider = new GeminiLLM({
          apiKey: apiKeyInfo.apiKey,
          model: apiKeyInfo.model,
        });
      }
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(
      `Model Error (Selected: ${selectedModel}): ${error.message}. Please configure settings.`,
    );
    return;
  }

  const question = await vscode.window.showInputBox({
    prompt: "What would you like to know about this codebase?",
    placeHolder:
      "e.g., How is authentication handled? What are the API endpoints? I want to build an admin dashboard, what APIs do I need?",
  });

  if (!question) {
    return;
  }

  const summary = await persistentCodebaseService.getAnalysisSummary();
  const cacheDecision = await getUserCacheDecision(summary);

  if (cacheDecision === "cancel") {
    return;
  }

  const useCache = cacheDecision === "use";

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Analyzing codebase to answer your question...",
      cancellable: true,
    },
    async (progress, token) => {
      progress.report({ increment: 0 });

      try {
        const analysis = useCache
          ? await persistentCodebaseService.getComprehensiveAnalysis(token)
          : await persistentCodebaseService.forceRefreshAnalysis(token);

        if (token.isCancellationRequested || !analysis) {
          return;
        }

        progress.report({
          increment: 30,
          message: "Preparing analysis context...",
        });

        const context = createContextFromAnalysis(analysis);
        const sanitizedContext = context
          .replace(/`/g, "\\`")
          .replace(/\${/g, "\\${");
        const sanitizedQuestion = question
          .replace(/`/g, "\\`")
          .replace(/\${/g, "\\${");

        if (token.isCancellationRequested) {
          return;
        }

        progress.report({ increment: 50, message: "Generating response..." });

        const prompt = `
You are a senior software architect and full-stack developer with extensive experience analyzing codebases. Based on the comprehensive codebase analysis below, provide detailed, accurate answers to the user's question.

**Comprehensive Codebase Analysis:**
${sanitizedContext}

**User's Question:**
${sanitizedQuestion}

**Instructions:**
1. **Analyze the question type**:
   - If it's about HOW something is implemented (e.g., "How is authentication handled?"), focus on explaining existing patterns, files, and implementations
   - If it's about BUILDING something new (e.g., "I want to build an admin dashboard"), provide architectural recommendations and implementation guidance
   - If it's about UNDERSTANDING the codebase (e.g., "What are the main components?"), provide clear explanations of the architecture and structure
2. **For implementation questions** ("How is X handled?"):
   - Explain the existing patterns found in the codebase
   - Reference specific files and code patterns
   - Describe the flow and architecture
   - Mention any dependencies or frameworks involved
3. **For building/enhancement questions**:
   - Provide specific, actionable recommendations
   - Suggest exact endpoint paths, data models, and implementation approach
   - Consider the existing architecture and recommend consistent patterns
   - Include code examples where helpful
4. **For general understanding questions**:
   - Provide clear overviews of the codebase structure
   - Explain the main architectural patterns
   - Describe key components and their relationships
5. **Always include**:
   - Specific file references when possible
   - Concrete examples from the actual codebase
   - Clear, actionable next steps
   - A Mermaid sequence diagram.

**Focus on being accurate, specific, and helpful. Use the actual codebase analysis to provide concrete, evidence-based answers.**

**CRITICAL: Provide a complete response. Do not truncate your answer. Ensure your response is fully finished and does not end abruptly mid-sentence or mid-word.**
        `.trim();

        const result = await llmProvider.generateText(prompt);
        progress.report({ increment: 90, message: "Finalizing response..." });

        // 💭 REASONING: Sanitize the LLM output to ensure it's valid, well-formed markdown.
        const sanitizedContent = LLMOutputSanitizer.sanitizeLLMOutput(
          result,
          false,
        );

        // 💡 CHANGE: Instead of creating a webview, we now create a new untitled markdown file.
        // This makes the content easy for the user to copy, edit, and save.
        const doc = await vscode.workspace.openTextDocument({
          content: sanitizedContent,
          language: "markdown",
        });

        orchestrator.publish("onQuery", String(sanitizedContent));

        // Show the document in a new editor tab.
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

        progress.report({ increment: 100, message: "Done!" });
      } catch (error: any) {
        logger.error("Error in architectural recommendation:", error);
        vscode.window.showErrorMessage(
          `Failed to analyze codebase (Model: ${selectedModel}): ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );
}

/**
 * Create analysis context from persistent analysis data
 */
function createContextFromAnalysis(analysis: any): string {
  const sections = [
    `## Codebase Overview`,
    `**Total Files:** ${analysis.summary.totalFiles}`,
    `**Total Lines:** ${analysis.summary.totalLines}`,
    `**Complexity:** ${analysis.summary.complexity}`,
    `**Git Branch:** ${analysis.gitState.branch}`,
    `**Last Analysis:** ${analysis.analysisMetadata.createdAt}`,
    ``,
    `## Frameworks & Technologies`,
    analysis.frameworks.length > 0
      ? analysis.frameworks.map((f: string) => `- ${f}`).join("\n")
      : "No specific frameworks detected",
    ``,
    `## Dependencies`,
    Object.keys(analysis.dependencies).length > 0
      ? Object.entries(analysis.dependencies)
          .slice(0, 20) // Limit to avoid overwhelming the context
          .map(([name, version]) => `- ${name}: ${version}`)
          .join("\n")
      : "No dependencies found",
    ``,
    `## API Endpoints`,
    analysis.apiEndpoints.length > 0
      ? analysis.apiEndpoints
          .slice(0, 15) // Limit endpoints
          .map(
            (endpoint: any) =>
              `- ${endpoint.method} ${endpoint.path} (${endpoint.file})`,
          )
          .join("\n")
      : "No API endpoints detected",
    ``,
    `## Data Models`,
    analysis.dataModels.length > 0
      ? analysis.dataModels
          .slice(0, 10) // Limit models
          .map(
            (model: any) => `- ${model.name} (${model.type}) - ${model.file}`,
          )
          .join("\n")
      : "No data models detected",
    ``,
    `## File Structure`,
    analysis.files.length > 0
      ? analysis.files
          .slice(0, 30) // Limit files shown
          .map(
            (file: string, index: number) =>
              `[[${index + 1}]](${file}) ${file}`,
          )
          .join("\n")
      : "No files analyzed",
    ``,
    `## Language Distribution`,
    Object.entries(analysis.summary.languageDistribution)
      .map(([ext, count]) => `- ${ext}: ${count} files`)
      .join("\n"),
  ];

  return sections.join("\n");
}
