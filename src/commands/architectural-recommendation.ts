import * as vscode from "vscode";
import { PersistentCodebaseUnderstandingService } from "../services/persistent-codebase-understanding.service";
import { GeminiLLM } from "../llms/gemini/gemini";
import { getAPIKeyAndModel, formatText } from "../utils/utils";
import { LLMOutputSanitizer } from "../utils/llm-output-sanitizer";

export const architecturalRecommendationCommand = async () => {
  const persistentCodebaseService =
    PersistentCodebaseUnderstandingService.getInstance();

  // Initialize the service if not already done
  try {
    await persistentCodebaseService.initialize();
  } catch (error) {
    const errorMessage = "Failed to initialize codebase analysis service.";
    vscode.window.showErrorMessage(
      `${errorMessage} ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return;
  }

  const apiKeyInfo = getAPIKeyAndModel("gemini");

  if (!apiKeyInfo.apiKey || !apiKeyInfo.model) {
    vscode.window.showErrorMessage("Gemini API key or model not configured.");
    return;
  }

  const gemini = new GeminiLLM({
    apiKey: apiKeyInfo.apiKey,
    model: apiKeyInfo.model,
  });

  const question = await vscode.window.showInputBox({
    prompt: "What would you like to know about this codebase?",
    placeHolder:
      "e.g., How is authentication handled? What are the API endpoints? I want to build an admin dashboard, what APIs do I need?",
  });

  if (!question) {
    return;
  }

  // Check if we should force refresh or use cache
  const summary = await persistentCodebaseService.getAnalysisSummary();
  let useCache = true;

  if (!summary.hasCache) {
    const choice = await vscode.window.showInformationMessage(
      "No cached analysis found. This will take some time to analyze your codebase.",
      "Analyze Now",
      "Cancel",
    );
    if (choice !== "Analyze Now") {
      return;
    }
    useCache = false;
  } else if (summary.lastAnalysis) {
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

      if (choice === "Cancel") {
        return;
      } else if (choice === "Refresh Analysis") {
        useCache = false;
      }
    }
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Analyzing codebase to answer your question...",
      cancellable: true,
    },
    async (progress, token) => {
      progress.report({ increment: 0 });

      try {
        // Get comprehensive codebase analysis
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

        // Create context from persistent analysis
        const context = createContextFromAnalysis(analysis);

        if (token.isCancellationRequested) {
          return;
        }

        progress.report({ increment: 50, message: "Generating response..." });

        const prompt = `
You are a senior software architect and full-stack developer with extensive experience analyzing codebases. Based on the comprehensive codebase analysis below, provide detailed, accurate answers to the user's question.

**Comprehensive Codebase Analysis:**
${context}

**User's Question:**
${question}

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

**Focus on being accurate, specific, and helpful. Use the actual codebase analysis to provide concrete, evidence-based answers.**

**CRITICAL: Provide a complete response. Do not truncate your answer. Ensure your response is fully finished and does not end abruptly mid-sentence or mid-word.**
        `.trim();

        const result = await gemini.generateText(prompt);
        progress.report({ increment: 90 });

        // Sanitize the LLM output before displaying in webview
        const sanitizedContent = LLMOutputSanitizer.sanitizeLLMOutput(
          result,
          false,
        );

        // Format the content to HTML with markdown rendering
        let formattedContent: string;
        try {
          formattedContent = formatText(sanitizedContent);
        } catch (error) {
          console.warn(
            "Markdown parsing failed, falling back to plain text:",
            error,
          );
          // Fallback to plain text if markdown parsing fails
          formattedContent = `<pre>${LLMOutputSanitizer.sanitizeText(sanitizedContent)}</pre>`;
        }

        progress.report({ increment: 100 });

        const panel = vscode.window.createWebviewPanel(
          "codebaseAnalysis",
          "Codebase Analysis & Recommendations",
          vscode.ViewColumn.One,
          {
            enableScripts: false, // Disable scripts for security
            localResourceRoots: [], // No local resources needed
          },
        );

        // Create secure HTML wrapper with proper CSP
        const secureHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'self'; font-src 'self' data: https://fonts.gstatic.com; connect-src https:;">
              <title>Codebase Analysis</title>
              <style>
                  body { 
                      font-family: "JetBrains Mono", "SF Mono", "Geist Mono", "Fira Code", "Cascadia Code", "Roboto Mono", "Consolas", "Monaco", monospace;
                      color: var(--vscode-foreground); 
                      background: var(--vscode-editor-background);
                      padding: 20px;
                      line-height: 1.6;
                      font-size: 14px;
                      -webkit-font-smoothing: antialiased;
                      -moz-osx-font-smoothing: grayscale;
                  }
                  h1, h2, h3 { 
                      color: var(--vscode-titleBar-activeForeground);
                      font-family: "JetBrains Mono", "SF Mono", "Geist Mono", "Fira Code", "Cascadia Code", "Roboto Mono", "Consolas", "Monaco", monospace;
                      font-weight: 600;
                      letter-spacing: -0.025em;
                  }
                  code { 
                      font-family: "JetBrains Mono", "SF Mono", "Geist Mono", "Fira Code", "Cascadia Code", "Roboto Mono", "Consolas", "Monaco", monospace;
                      background: var(--vscode-textCodeBlock-background); 
                      padding: 2px 6px; 
                      border-radius: 4px;
                      font-size: 13px;
                      font-weight: 500;
                  }
                  pre { 
                      font-family: "JetBrains Mono", "SF Mono", "Geist Mono", "Fira Code", "Cascadia Code", "Roboto Mono", "Consolas", "Monaco", monospace;
                      background: var(--vscode-textCodeBlock-background); 
                      padding: 16px; 
                      border-radius: 8px; 
                      overflow-x: auto;
                      font-size: 13px;
                      line-height: 1.5;
                      border: 1px solid var(--vscode-widget-border);
                  }
                  pre code {
                      background: transparent;
                      padding: 0;
                      font-size: inherit;
                  }
                  blockquote { 
                      border-left: 4px solid var(--vscode-textLink-foreground); 
                      margin: 0; 
                      padding-left: 10px; 
                  }
              </style>
          </head>
          <body>
              ${formattedContent}
          </body>
          </html>
        `;

        panel.webview.html = secureHtml;
      } catch (error) {
        console.error("Error in architectural recommendation:", error);
        vscode.window.showErrorMessage(
          `Failed to analyze codebase: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );
};

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
