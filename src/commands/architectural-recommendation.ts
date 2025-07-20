import * as vscode from "vscode";
import { CodebaseUnderstandingService } from "../services/codebase-understanding.service";
import { GeminiLLM } from "../llms/gemini/gemini";
import { getAPIKeyAndModel, formatText } from "../utils/utils";
import { LLMOutputSanitizer } from "../utils/llm-output-sanitizer";

export const architecturalRecommendationCommand = async () => {
  const codebaseUnderstandingService =
    CodebaseUnderstandingService.getInstance();
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

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Analyzing codebase to answer your question...",
      cancellable: true,
    },
    async (progress, token) => {
      progress.report({ increment: 0 });

      // Get comprehensive codebase context with progress reporting
      const context = await codebaseUnderstandingService.getCodebaseContext(
        false,
        token,
        progress,
      );

      if (token.isCancellationRequested) {
        return;
      }

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
   - Specific file references using the clickable links provided (e.g., [[1]], [[2]], etc.)
   - Concrete examples from the actual codebase
   - Clear, actionable next steps
   - When referencing files or components, use the provided clickable references like [[1]](file_path) so users can navigate directly to the source

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
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src 'self';">
            <title>Codebase Analysis</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    color: var(--vscode-foreground); 
                    background: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }
                h1, h2, h3 { color: var(--vscode-titleBar-activeForeground); }
                code { 
                    background: var(--vscode-textCodeBlock-background); 
                    padding: 2px 4px; 
                    border-radius: 3px; 
                }
                pre { 
                    background: var(--vscode-textCodeBlock-background); 
                    padding: 10px; 
                    border-radius: 5px; 
                    overflow-x: auto; 
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
    },
  );
};
