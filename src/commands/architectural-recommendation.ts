import * as vscode from "vscode";
import * as path from "path";
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
import {
  TokenBudgetAllocator,
  createAnalysisBudget,
  RelevanceScoring,
} from "../services/analyzers/token-budget";
import type {
  CodeSnippet,
  CachedAnalysis,
  EndpointData,
  ModelData,
  RelationshipData,
  DirectoryData,
  BudgetItem,
  DependencyData,
} from "../interfaces/analysis.interface";

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
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error("Error in architectural recommendation:", errorMessage);
        vscode.window.showErrorMessage(
          `Failed to analyze codebase (Model: ${selectedModel}): ${errorMessage}`,
        );
      }
    },
  );
}

// ============================================================================
// Section Generator Helpers (use TokenBudgetAllocator for intelligent limits)
// ============================================================================

function generateOverviewSection(analysis: CachedAnalysis): string {
  return [
    `## Codebase Overview`,
    `- **Total Files:** ${analysis.summary.totalFiles}`,
    `- **Total Lines:** ${analysis.summary.totalLines}`,
    `- **Complexity:** ${analysis.summary.complexity}`,
    `- **Git Branch:** ${analysis.gitState?.branch || "unknown"}`,
    `- **Last Analysis:** ${analysis.analysisMetadata?.createdAt || "unknown"}`,
  ].join("\n");
}

function generateFrameworksSection(analysis: CachedAnalysis): string {
  const lines = [`## Frameworks & Technologies`];
  const frameworks = analysis.frameworks || [];
  if (frameworks.length > 0) {
    lines.push(frameworks.map((f: string) => `- ${f}`).join("\n"));
  } else {
    lines.push("No specific frameworks detected");
  }
  return lines.join("\n");
}

function generateLanguageSection(analysis: CachedAnalysis): string {
  const lines = [`## Language Distribution`];
  const langDist = analysis.summary?.languageDistribution || {};
  const sortedLangs = Object.entries(langDist).sort(
    (a, b) => (b[1] as number) - (a[1] as number),
  );
  lines.push(
    sortedLangs.map(([ext, count]) => `- ${ext}: ${count} files`).join("\n"),
  );
  return lines.join("\n");
}

function generateDependenciesSection(
  analysis: CachedAnalysis,
  budget: TokenBudgetAllocator,
  userQuestion?: string,
): string {
  const lines = [`## Key Dependencies`];
  const deps = analysis.dependencies || {};
  const depEntries = Object.entries(deps);

  if (depEntries.length === 0) {
    logger.debug("No dependencies found in analysis");
    return lines.join("\n") + "\nNo dependencies found";
  }

  logger.debug(
    `Processing ${depEntries.length} dependencies with budget allocator`,
  );

  // Use budget allocator for selection
  const depItems: BudgetItem<DependencyData>[] = depEntries.map(
    ([name, version]) => ({
      data: { name, version: version as string },
      size: `- ${name}: ${version}`.length + 1,
      priority: scoreDependency(name, userQuestion),
    }),
  );

  const selected = budget.selectWithinBudget<BudgetItem<DependencyData>>(
    "dependencies",
    depItems,
    (item) => item.size,
    (item) => item.priority ?? 1,
  );

  logger.debug(
    `Selected ${selected.length}/${depEntries.length} dependencies within budget`,
  );

  if (selected.length > 0) {
    lines.push(
      selected
        .map((item) => `- ${item.data.name}: ${item.data.version}`)
        .join("\n"),
    );
  } else {
    lines.push("No dependencies found");
  }
  return lines.join("\n");
}

function scoreDependency(name: string, question?: string): number {
  let score = 1;
  const lowerName = name.toLowerCase();

  // Exact-match set for frameworks/libraries to avoid false positives
  // (e.g. "next-auth" should not match as "Next.js")
  const FRAMEWORK_EXACT_NAMES = new Set([
    "react",
    "react-dom",
    "vue",
    "@angular/core",
    "svelte",
    "next",
    "nuxt",
    "express",
    "fastify",
    "@nestjs/core",
    "koa",
    "hono",
    "@prisma/client",
    "prisma",
    "typeorm",
    "mongoose",
    "sequelize",
    "drizzle-orm",
    "typescript",
    "webpack",
    "vite",
    "esbuild",
  ]);
  if (FRAMEWORK_EXACT_NAMES.has(lowerName)) {
    score += 3;
  }

  // Question relevance
  if (question) {
    const questionLower = question.toLowerCase();
    if (questionLower.includes(lowerName)) {
      score += 5;
    }
  }

  return score;
}

function generateEndpointsSection(
  analysis: CachedAnalysis,
  budget: TokenBudgetAllocator,
  userQuestion?: string,
): string {
  const lines = [`## API Endpoints`];
  const endpoints = analysis.apiEndpoints || [];

  if (endpoints.length === 0) {
    logger.debug("No API endpoints found in analysis");
    return lines.join("\n") + "\nNo API endpoints detected";
  }

  logger.debug(
    `Processing ${endpoints.length} API endpoints with budget allocator`,
  );

  // Use budget allocator for selection
  const endpointItems: BudgetItem<EndpointData>[] = endpoints.map(
    (ep: any) => ({
      data: ep as EndpointData,
      size:
        `- **${ep.method}** \`${ep.path}\` → ${ep.file?.split("/").pop() || "unknown"}${ep.line ? `:${ep.line}` : ""}`
          .length + 1,
      priority: RelevanceScoring.scoreEndpoint(ep, userQuestion),
    }),
  );

  const selected = budget.selectWithinBudget<BudgetItem<EndpointData>>(
    "endpoints",
    endpointItems,
    (item) => item.size,
    (item) => item.priority ?? 1,
  );

  if (selected.length === 0) {
    logger.debug("No endpoints selected within budget");
    return lines.join("\n") + "\nNo API endpoints detected";
  }

  logger.debug(
    `Selected ${selected.length}/${endpoints.length} endpoints within budget`,
  );

  // Group by base path
  const grouped = new Map<string, EndpointData[]>();
  for (const item of selected) {
    const ep = item.data;
    const basePath = ep.path.split("/").slice(0, 3).join("/") || "/";
    if (!grouped.has(basePath)) grouped.set(basePath, []);
    grouped.get(basePath)!.push(ep);
  }

  for (const [basePath, eps] of grouped) {
    lines.push(`\n### ${basePath}`);
    for (const ep of eps) {
      const fileName = ep.file?.split("/").pop() || "unknown";
      lines.push(
        `- **${ep.method}** \`${ep.path}\` → ${fileName}${ep.line ? `:${ep.line}` : ""}`,
      );
    }
  }

  return lines.join("\n");
}

function generateModelsSection(
  analysis: CachedAnalysis,
  budget: TokenBudgetAllocator,
  userQuestion?: string,
): string {
  const lines = [`## Data Models & Types`];
  const models = analysis.dataModels || [];

  if (models.length === 0) {
    logger.debug("No data models found in analysis");
    return lines.join("\n") + "\nNo data models detected";
  }

  logger.debug(`Processing ${models.length} data models with budget allocator`);

  // Use budget allocator for selection
  const modelItems: BudgetItem<ModelData>[] = models.map((model: any) => ({
    data: model as ModelData,
    size:
      `- **${model.name}** (${model.file?.split("/").pop() || ""})`.length + 20,
    priority: RelevanceScoring.scoreModel(model, userQuestion),
  }));

  const selected = budget.selectWithinBudget<BudgetItem<ModelData>>(
    "models",
    modelItems,
    (item) => item.size,
    (item) => item.priority ?? 1,
  );

  if (selected.length === 0) {
    logger.debug("No models selected within budget");
    return lines.join("\n") + "\nNo data models detected";
  }

  logger.debug(
    `Selected ${selected.length}/${models.length} models within budget`,
  );

  // Group by type
  const classes = selected.filter((m) => m.data.type === "class");
  const interfaces = selected.filter(
    (m) => m.data.type === "interface" || m.data.type === "type",
  );
  const components = selected.filter((m) => m.data.type === "react_component");
  const functions = selected.filter((m) => m.data.type === "function");

  if (classes.length > 0) {
    lines.push(`\n### Classes (${classes.length})`);
    for (const item of classes) {
      const cls = item.data;
      const fileName = cls.file?.split("/").pop() || "";
      let detail = `- **${cls.name}**`;
      if (cls.extends) detail += ` extends ${cls.extends}`;
      if (cls.implements?.length)
        detail += ` implements ${cls.implements.join(", ")}`;
      detail += ` (${fileName})`;
      if (cls.methods?.length)
        detail += `\n  - Methods: ${cls.methods.slice(0, 5).join(", ")}${cls.methods.length > 5 ? "..." : ""}`;
      lines.push(detail);
    }
  }

  if (interfaces.length > 0) {
    lines.push(`\n### Interfaces & Types (${interfaces.length})`);
    for (const item of interfaces) {
      const iface = item.data;
      const fileName = iface.file?.split("/").pop() || "";
      lines.push(`- **${iface.name}** (${fileName})`);
    }
  }

  if (components.length > 0) {
    lines.push(`\n### React Components (${components.length})`);
    for (const item of components) {
      const comp = item.data;
      const fileName = comp.file?.split("/").pop() || "";
      lines.push(`- **${comp.name}** (${fileName})`);
    }
  }

  if (
    functions.length > 0 &&
    functions.filter((f) => f.data.isExported).length > 0
  ) {
    lines.push(`\n### Exported Functions`);
    for (const item of functions.filter((f) => f.data.isExported)) {
      const fn = item.data;
      const fileName = fn.file?.split("/").pop() || "";
      lines.push(`- **${fn.name}** (${fileName})`);
    }
  }

  return lines.join("\n");
}

function generateSnippetsSection(
  analysis: CachedAnalysis,
  budget: TokenBudgetAllocator,
  userQuestion?: string,
): string {
  const codeSnippets: CodeSnippet[] = analysis.codeSnippets || [];
  if (codeSnippets.length === 0) {
    logger.debug("No code snippets found in analysis");
    return "";
  }

  logger.debug(
    `Processing ${codeSnippets.length} code snippets with budget allocator`,
  );

  const lines = [
    `## Key Code Files`,
    `_Showing important files for context._\n`,
  ];

  // Use budget allocator for selection with file scoring
  const snippetItems: BudgetItem<CodeSnippet>[] = codeSnippets.map(
    (snippet) => ({
      data: snippet,
      size: `### ${getRelativePath(snippet.file)}\n\`\`\`${snippet.language}\n${snippet.content}\n\`\`\`\n`
        .length,
      priority: RelevanceScoring.scoreFile(snippet.file, {
        question: userQuestion,
      }),
    }),
  );

  // Capture remaining budget BEFORE selectWithinBudget consumes it
  const availableBudget = budget.getRemaining("codeSnippets");

  const selected = budget.selectWithinBudget<BudgetItem<CodeSnippet>>(
    "codeSnippets",
    snippetItems,
    (item) => item.size,
    (item) => item.priority ?? 1,
  );

  logger.debug(
    `Selected ${selected.length}/${codeSnippets.length} code snippets within budget`,
  );

  // Use the pre-captured budget for per-snippet allocation
  const perSnippetBudget = Math.floor(
    availableBudget / Math.max(selected.length, 1),
  );

  for (const item of selected) {
    const snippet = item.data;
    const relativePath = getRelativePath(snippet.file);
    lines.push(`### ${relativePath}`);
    lines.push("```" + (snippet.language || "typescript"));

    // Truncate if content exceeds per-snippet budget allocation
    const maxContentLen = Math.max(perSnippetBudget - 50, 500); // Minimum 500 chars per snippet
    if (snippet.content.length > maxContentLen) {
      const truncatedLines = snippet.content
        .substring(0, maxContentLen)
        .split("\n");
      lines.push(truncatedLines.join("\n"));
      lines.push("// ... (truncated)");
    } else {
      lines.push(snippet.content);
    }
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

function generateRelationshipsSection(
  analysis: CachedAnalysis,
  budget: TokenBudgetAllocator,
): string {
  const relationships = analysis.domainRelationships || [];
  if (relationships.length === 0) {
    logger.debug("No domain relationships found in analysis");
    return "";
  }

  logger.debug(
    `Processing ${relationships.length} domain relationships with budget allocator`,
  );

  const lines = [`## Domain Relationships`];
  const relItems: BudgetItem<RelationshipData>[] = relationships.map(
    (rel: any) => ({
      data: rel as RelationshipData,
      size:
        `- **${rel.entity}** → ${rel.relatedEntities?.join(", ") || "none"}`
          .length + 1,
      priority: 1,
    }),
  );

  const selected = budget.selectWithinBudget<BudgetItem<RelationshipData>>(
    "relationships",
    relItems,
    (item) => item.size,
    (item) => item.priority ?? 1,
  );

  logger.debug(
    `Selected ${selected.length}/${relationships.length} relationships within budget`,
  );

  for (const item of selected) {
    const rel = item.data;
    lines.push(
      `- **${rel.entity}** → ${rel.relatedEntities?.join(", ") || "none"}`,
    );
  }

  return lines.join("\n");
}

function generateFileStructureSection(
  analysis: CachedAnalysis,
  budget: TokenBudgetAllocator,
): string {
  const files = analysis.files || [];
  if (files.length === 0) {
    logger.debug("No files found in analysis");
    return `## Project Structure\nNo files analyzed`;
  }

  logger.debug(
    `Processing ${files.length} files for project structure section`,
  );

  const lines = [`## Project Structure`];

  // Group by directory
  const byDir = new Map<string, string[]>();
  for (const file of files) {
    const dir = file.split("/").slice(0, -1).join("/") || ".";
    const fileName = file.split("/").pop() || file;
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir)!.push(fileName);
  }

  // Create items for budget selection
  const dirItems: BudgetItem<DirectoryData>[] = Array.from(byDir.entries()).map(
    ([dir, dirFiles]) => ({
      data: { dir, files: dirFiles },
      size:
        `- **${dir.split("/").slice(-2).join("/")}/** (${dirFiles.length} files)`
          .length + 1,
      priority: dirFiles.length, // More files = higher priority
    }),
  );

  const selected = budget.selectWithinBudget<BudgetItem<DirectoryData>>(
    "fileList",
    dirItems,
    (item) => item.size,
    (item) => item.priority ?? 1,
  );

  logger.debug(
    `Selected ${selected.length}/${byDir.size} directories within budget`,
  );

  for (const item of selected) {
    const shortDir =
      item.data.dir.split("/").slice(-2).join("/") || item.data.dir;
    lines.push(`- **${shortDir}/** (${item.data.files.length} files)`);
    if (item.data.files.length <= 3) {
      lines.push(`  - ${item.data.files.join(", ")}`);
    }
  }

  return lines.join("\n");
}

/**
 * Create rich analysis context from persistent analysis data
 * Uses token budget allocation for optimal context utilization
 */
function createContextFromAnalysis(
  analysis: CachedAnalysis,
  userQuestion?: string,
  totalBudgetChars: number = 32000,
): string {
  logger.debug(
    `Creating context from analysis with ${totalBudgetChars} char budget`,
  );

  const budget = createAnalysisBudget(totalBudgetChars);

  const sections: string[] = [];

  // === SECTION 1: Codebase Overview (always include) ===
  sections.push(
    budget.truncateToFit("overview", generateOverviewSection(analysis)),
  );
  sections.push("");

  // === SECTION 2: Frameworks & Technologies ===
  sections.push(
    budget.truncateToFit("frameworks", generateFrameworksSection(analysis)),
  );
  sections.push("");

  // === SECTION 3: Language Distribution ===
  sections.push(
    budget.truncateToFit("languages", generateLanguageSection(analysis)),
  );
  sections.push("");

  // === SECTION 4: Dependencies (prioritized with budget) ===
  sections.push(generateDependenciesSection(analysis, budget, userQuestion));
  sections.push("");

  // === SECTION 5: API Endpoints (using budget) ===
  sections.push(generateEndpointsSection(analysis, budget, userQuestion));
  sections.push("");

  // === SECTION 6: Data Models (using budget) ===
  sections.push(generateModelsSection(analysis, budget, userQuestion));
  sections.push("");

  // === SECTION 7: Code Snippets (using budget) ===
  const snippetsSection = generateSnippetsSection(
    analysis,
    budget,
    userQuestion,
  );
  if (snippetsSection) {
    sections.push(snippetsSection);
    sections.push("");
  }

  // === SECTION 8: Domain Relationships (using budget) ===
  const relationshipsSection = generateRelationshipsSection(analysis, budget);
  if (relationshipsSection) {
    sections.push(relationshipsSection);
    sections.push("");
  }

  // === SECTION 9: File Structure (using budget) ===
  sections.push(generateFileStructureSection(analysis, budget));

  // Log budget summary
  const budgetSummary = budget.getSummary();
  logger.debug(
    `Context generation complete. Budget usage: ${JSON.stringify(
      budgetSummary.map((s) => ({
        name: s.name,
        used: s.used,
        remaining: s.remaining,
      })),
    )}`,
  );

  return sections.join("\n");
}

/**
 * Get relative path from workspace root
 * Uses VS Code workspace API when available, with marker-based fallback
 */
function getRelativePath(fullPath: string): string {
  if (!fullPath) return "unknown";

  // 1. Best: VS Code workspace API with path.relative for cross-platform correctness
  try {
    const uri = vscode.Uri.file(fullPath);
    const wsFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (wsFolder) {
      const rel = path.relative(wsFolder.uri.fsPath, fullPath);
      // Ensure we didn't escape the workspace (path.relative returns '../...' if so)
      if (!rel.startsWith("..")) return rel;
    }
  } catch {
    // Not in extension host context or workspace API unavailable
  }

  // 2. Fallback: find the first known project root marker and make relative from it
  const ROOT_MARKERS = ["src", "lib", "app", "pages", "components"];
  const normalized = fullPath.replace(/\\/g, "/");

  for (const marker of ROOT_MARKERS) {
    // Use indexOf (not lastIndexOf) to find the outermost marker,
    // which is correct for monorepos with nested src/ directories.
    const idx = normalized.indexOf(`/${marker}/`);
    if (idx !== -1) {
      return normalized.slice(idx + 1); // includes the marker dir: "src/controllers/..."
    }
  }

  // 3. Last resort: basename only (safe — no absolute path leakage)
  return path.basename(fullPath);
}
