import * as vscode from "vscode";
import { DocumentationConfig } from "../interfaces/documentation.interface";
import { DocumentationGeneratorService } from "../services/documentation-generator.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

const logger = Logger.initialize("extension-main", {
  minLevel: LogLevel.DEBUG,
});

/**
 * Command to generate intelligent documentation for the codebase
 */
export const generateDocumentationCommand = async () => {
  try {
    // Check if we have a workspace open
    if (!vscode.workspace.workspaceFolders?.length) {
      vscode.window.showErrorMessage(
        "Please open a workspace to generate documentation.",
      );
      return;
    }

    const documentationService = new DocumentationGeneratorService();

    // Show configuration options to the user
    const config = await showDocumentationConfigDialog();
    if (!config) {
      return; // User cancelled
    }

    // Show progress and generate documentation
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "🚀 Generating Intelligent Documentation...",
        cancellable: true,
      },
      async (progress, token) => {
        try {
          await documentationService.generateComprehensiveDocumentation(
            config,
            token,
            progress,
          );
        } catch (error: any) {
          logger.error("Documentation generation failed:", error);
          throw error;
        }
      },
    );
  } catch (error: any) {
    logger.error("Documentation generation command failed:", error);
    vscode.window.showErrorMessage(
      `Failed to generate documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

/**
 * Show configuration dialog for documentation generation
 */
async function showDocumentationConfigDialog(): Promise<
  DocumentationConfig | undefined
> {
  const options: vscode.QuickPickItem[] = [
    {
      label: "📚 Complete Documentation Suite",
      description:
        "Generate README, API docs, architecture diagrams, and component docs",
      picked: true,
    },
    {
      label: "📖 README Only",
      description: "Generate comprehensive README.md file",
    },
    {
      label: "🔌 API Documentation",
      description: "Focus on API endpoint documentation",
    },
    {
      label: "🏗️ Architecture Documentation",
      description: "Generate architecture diagrams and system overview",
    },
    {
      label: "🧩 Component Documentation",
      description: "Document components, classes, and modules",
    },
  ];

  const selection = await vscode.window.showQuickPick(options, {
    title: "📚 Documentation Generator - Select Documentation Type",
    placeHolder: "Choose what documentation to generate",
    canPickMany: false,
  });

  if (!selection) {
    return undefined;
  }

  // Get additional options
  const outputFormat = await vscode.window.showQuickPick(
    [
      {
        label: "Markdown (.md)",
        description: "Standard markdown format",
        value: "markdown",
      },
      { label: "HTML", description: "HTML format with styling", value: "html" },
      {
        label: "Both",
        description: "Generate both Markdown and HTML",
        value: "both",
      },
    ],
    {
      title: "Select Output Format",
      placeHolder: "Choose output format",
    },
  );

  if (!outputFormat) {
    return undefined;
  }

  const diagramFormat = await vscode.window.showQuickPick(
    [
      {
        label: "Mermaid",
        description: "Mermaid diagrams (GitHub compatible)",
        value: "mermaid",
      },
      {
        label: "PlantUML",
        description: "PlantUML diagrams",
        value: "plantuml",
      },
      { label: "ASCII", description: "Simple ASCII diagrams", value: "ascii" },
    ],
    {
      title: "Select Diagram Format",
      placeHolder: "Choose diagram format for architecture",
    },
  );

  if (!diagramFormat) {
    return undefined;
  }

  // Map selection to configuration
  const config: DocumentationConfig = {
    includeReadme: false,
    includeArchitecture: false,
    includeAPI: false,
    includeComponents: false,
    includeUsage: false,
    includeContributing: true,
    includeLicense: true,
    outputFormat: outputFormat.value as "markdown" | "html" | "both",
    diagramFormat: diagramFormat.value as "mermaid" | "plantuml" | "ascii",
    outputDirectory: "docs",
  };

  switch (selection.label) {
    case "📚 Complete Documentation Suite":
      config.includeArchitecture = true;
      config.includeAPI = true;
      config.includeUsage = true;
      break;
    case "📖 README Only":
      config.includeUsage = true;
      break;
    case "🔌 API Documentation":
      config.includeAPI = true;
      break;
    case "🏗️ Architecture Documentation":
      config.includeArchitecture = true;
      break;
    case "🧩 Component Documentation":
      config.includeUsage = true;
      break;
  }

  return config;
}

/**
 * Command to regenerate existing documentation
 */
export const regenerateDocumentationCommand = async () => {
  const choice = await vscode.window.showInformationMessage(
    "🔄 Regenerate Documentation",
    "This will update existing documentation files. Continue?",
    "Yes, Regenerate",
    "Cancel",
  );

  if (choice === "Yes, Regenerate") {
    await generateDocumentationCommand();
  }
};

/**
 * Command to open generated documentation
 */
export const openDocumentationCommand = async () => {
  try {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage("No workspace open");
      return;
    }

    const docPaths = [
      vscode.Uri.file(`${workspaceRoot}/README.md`),
      vscode.Uri.file(`${workspaceRoot}/docs/generated/index.md`),
      vscode.Uri.file(`${workspaceRoot}/docs/generated/api.md`),
      vscode.Uri.file(`${workspaceRoot}/docs/generated/architecture.md`),
    ];

    const availableDocs = [];
    for (const docPath of docPaths) {
      try {
        await vscode.workspace.fs.stat(docPath);
        availableDocs.push({
          label: docPath.path.split("/").pop()?.replace(".md", "") || "Unknown",
          description: docPath.fsPath,
          uri: docPath,
        });
      } catch {
        // File doesn't exist, skip
      }
    }

    if (availableDocs.length === 0) {
      const generate = await vscode.window.showInformationMessage(
        "No documentation found. Would you like to generate it?",
        "Generate Documentation",
        "Cancel",
      );

      if (generate === "Generate Documentation") {
        await generateDocumentationCommand();
      }
      return;
    }

    const selected = await vscode.window.showQuickPick(availableDocs, {
      title: "📖 Open Documentation",
      placeHolder: "Select documentation file to open",
    });

    if (selected) {
      const document = await vscode.workspace.openTextDocument(selected.uri);
      await vscode.window.showTextDocument(document);
    }
  } catch (error: any) {
    logger.error("Failed to open documentation:", error);
    vscode.window.showErrorMessage("Failed to open documentation");
  }
};
