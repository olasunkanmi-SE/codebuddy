import { DocumentationConfig } from "../interfaces/documentation.interface";
import { DocumentationGeneratorService } from "../services/documentation-generator.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EditorHostService } from "../services/editor-host.service";
import { IQuickPickItem } from "../interfaces/editor-host";

const logger = Logger.initialize("extension-main", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

/**
 * Command to generate intelligent documentation for the codebase
 */
export const generateDocumentationCommand = async () => {
  const editorHost = EditorHostService.getInstance().getHost();
  try {
    // Check if we have a workspace open
    if (!editorHost.workspace.workspaceFolders?.length) {
      editorHost.window.showErrorMessage(
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
    await editorHost.window.withProgress(
      {
        location: "Notification",
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
    editorHost.window.showErrorMessage(
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
  const editorHost = EditorHostService.getInstance().getHost();
  const options: IQuickPickItem[] = [
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

  const selection = (await editorHost.window.showQuickPick(options, {
    title: "📚 Documentation Generator - Select Documentation Type",
    placeHolder: "Choose what documentation to generate",
    canPickMany: false,
  })) as IQuickPickItem | undefined;

  if (!selection) {
    return undefined;
  }

  // Get additional options
  const outputFormat = (await editorHost.window.showQuickPick(
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
  )) as IQuickPickItem | undefined;

  if (!outputFormat) {
    return undefined;
  }

  const diagramFormat = (await editorHost.window.showQuickPick(
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
  )) as IQuickPickItem | undefined;

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
  const editorHost = EditorHostService.getInstance().getHost();
  const choice = await editorHost.window.showInformationMessage(
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
  const editorHost = EditorHostService.getInstance().getHost();
  try {
    const workspaceRoot = editorHost.workspace.rootPath;
    if (!workspaceRoot) {
      editorHost.window.showErrorMessage("No workspace open");
      return;
    }

    const docPaths = [
      `${workspaceRoot}/README.md`,
      `${workspaceRoot}/docs/generated/index.md`,
      `${workspaceRoot}/docs/generated/api.md`,
      `${workspaceRoot}/docs/generated/architecture.md`,
    ];

    const availableDocs: IQuickPickItem[] = [];
    for (const docPath of docPaths) {
      try {
        await editorHost.workspace.fs.stat(docPath);
        availableDocs.push({
          label: docPath.split("/").pop()?.replace(".md", "") || "Unknown",
          description: docPath,
          uri: docPath,
        });
      } catch {
        // File doesn't exist, skip
      }
    }

    if (availableDocs.length === 0) {
      const generate = await editorHost.window.showInformationMessage(
        "No documentation found. Would you like to generate it?",
        "Generate Documentation",
        "Cancel",
      );

      if (generate === "Generate Documentation") {
        await generateDocumentationCommand();
      }
      return;
    }

    const selected = (await editorHost.window.showQuickPick(availableDocs, {
      title: "📖 Open Documentation",
      placeHolder: "Select documentation file to open",
    })) as IQuickPickItem | undefined;

    if (selected) {
      const document = await editorHost.workspace.openTextDocument(
        selected.uri,
      );
      await editorHost.window.showTextDocument(document);
    }
  } catch (error: any) {
    logger.error("Failed to open documentation:", error);
    editorHost.window.showErrorMessage("Failed to open documentation");
  }
};
