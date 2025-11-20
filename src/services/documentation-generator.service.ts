import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";
import { CodebaseUnderstandingService } from "./codebase-understanding.service";
import { WorkspaceService } from "./workspace-service";

export interface DocumentationConfig {
  includeArchitecture: boolean;
  includeAPI: boolean;
  includeUsage: boolean;
  includeContributing: boolean;
  includeLicense: boolean;
  outputFormat: "markdown" | "html" | "both";
  diagramFormat: "mermaid" | "plantuml" | "ascii";
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses: Array<{
    status: number;
    description: string;
    schema?: string;
  }>;
  example?: string;
}

export interface ComponentDoc {
  name: string;
  type: "component" | "service" | "class" | "function";
  description: string;
  props?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  methods?: Array<{
    name: string;
    parameters: string[];
    returnType: string;
    description: string;
  }>;
  usage?: string;
}

export interface ArchitectureInfo {
  overview: string;
  mainComponents: ComponentDoc[];
  dataFlow: string[];
  dependencies: Array<{
    name: string;
    version: string;
    purpose: string;
  }>;
  patterns: string[];
  diagram: string;
}

/**
 * Intelligent Documentation Generator Service
 * Automatically generates and maintains comprehensive documentation
 * from codebase analysis and existing comments
 */
export class DocumentationGeneratorService {
  private readonly logger: Logger;
  private readonly codebaseService: CodebaseUnderstandingService;
  private readonly workspaceService: WorkspaceService;
  private readonly outputDir: string;

  constructor() {
    this.logger = Logger.initialize("DocumentationGeneratorService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.codebaseService = CodebaseUnderstandingService.getInstance();
    this.workspaceService = WorkspaceService.getInstance();

    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
    this.outputDir = path.join(workspaceRoot, "docs", "generated");
  }

  /**
   * Generate comprehensive documentation for the entire codebase
   */
  async generateComprehensiveDocumentation(
    config: DocumentationConfig,
    cancellationToken?: vscode.CancellationToken,
    progress?: vscode.Progress<{ increment?: number; message?: string }>,
  ): Promise<void> {
    try {
      this.logger.info("Starting comprehensive documentation generation");
      progress?.report({ increment: 0, message: "Analyzing codebase..." });

      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Get comprehensive codebase analysis
      const codebaseContext = await this.codebaseService.getCodebaseContext(
        false,
        cancellationToken,
        progress,
      );

      if (cancellationToken?.isCancellationRequested) return;

      progress?.report({
        increment: 20,
        message: "Extracting API endpoints...",
      });
      const apiEndpoints = await this.extractAPIEndpoints(codebaseContext);

      progress?.report({ increment: 40, message: "Analyzing architecture..." });
      const architecture = await this.analyzeArchitecture(codebaseContext);

      progress?.report({ increment: 60, message: "Generating README..." });
      if (config.includeUsage) {
        await this.generateREADME(architecture, apiEndpoints, config);
      }

      progress?.report({
        increment: 70,
        message: "Generating API documentation...",
      });
      if (config.includeAPI && apiEndpoints.length > 0) {
        await this.generateAPIDocumentation(apiEndpoints, config);
      }

      progress?.report({
        increment: 80,
        message: "Creating architecture diagrams...",
      });
      if (config.includeArchitecture) {
        await this.generateArchitectureDiagram(architecture, config);
      }

      progress?.report({
        increment: 90,
        message: "Generating component documentation...",
      });
      await this.generateComponentDocumentation(
        architecture.mainComponents,
        config,
      );

      progress?.report({
        increment: 95,
        message: "Creating navigation index...",
      });
      await this.generateDocumentationIndex(config);

      progress?.report({
        increment: 100,
        message: "Documentation generation complete!",
      });

      // Open the main documentation file
      await this.openGeneratedDocumentation();

      this.logger.info("Documentation generation completed successfully");
      vscode.window.showInformationMessage(
        "📚 Documentation generated successfully! Check the docs/generated folder.",
      );
    } catch (error: any) {
      this.logger.error("Error generating documentation", error);
      vscode.window.showErrorMessage(
        `Documentation generation failed: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Generate README.md from codebase analysis
   */
  async generateREADME(
    architecture: ArchitectureInfo,
    apiEndpoints: APIEndpoint[],
    config: DocumentationConfig,
  ): Promise<void> {
    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
    const packageJsonPath = path.join(workspaceRoot, "package.json");

    let projectInfo = {
      name: path.basename(workspaceRoot),
      description: "",
      version: "1.0.0",
      author: "",
      license: "MIT",
    };

    // Read package.json if it exists
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8"),
        );
        projectInfo = {
          name: packageJson.name || projectInfo.name,
          description: packageJson.description || "",
          version: packageJson.version || projectInfo.version,
          author: packageJson.author || "",
          license: packageJson.license || projectInfo.license,
        };
      } catch (error: any) {
        this.logger.warn("Could not parse package.json", error);
      }
    }

    const readme = this.generateREADMEContent(
      projectInfo,
      architecture,
      apiEndpoints,
      config,
    );
    await this.writeFile("README.md", readme);
  }

  /**
   * Extract API endpoints from codebase analysis
   */
  private async extractAPIEndpoints(
    codebaseContext: string,
  ): Promise<APIEndpoint[]> {
    // This would use LLM to analyze the codebase context and extract API endpoints
    // For now, we'll create a basic implementation
    const endpoints: APIEndpoint[] = [];

    // Look for common API patterns in the codebase context
    const apiPatterns = [
      /app\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
      /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
      /@(Get|Post|Put|Delete|Patch)\s*\(['"`]([^'"`]+)['"`]/gi,
    ];

    for (const pattern of apiPatterns) {
      let match;
      while ((match = pattern.exec(codebaseContext)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          path: match[2],
          description: `${match[1].toUpperCase()} endpoint for ${match[2]}`,
          parameters: [],
          responses: [
            { status: 200, description: "Success" },
            { status: 400, description: "Bad Request" },
            { status: 500, description: "Internal Server Error" },
          ],
        });
      }
    }

    return endpoints;
  }

  /**
   * Analyze architecture from codebase context
   */
  private async analyzeArchitecture(
    codebaseContext: string,
  ): Promise<ArchitectureInfo> {
    // Extract main components and patterns
    const components: ComponentDoc[] = [];
    const patterns: string[] = [];
    const dependencies: Array<{
      name: string;
      version: string;
      purpose: string;
    }> = [];

    // Basic pattern detection
    if (codebaseContext.includes("express"))
      patterns.push("Express.js REST API");
    if (codebaseContext.includes("react")) patterns.push("React Frontend");
    if (codebaseContext.includes("typescript")) patterns.push("TypeScript");
    if (codebaseContext.includes("mongodb")) patterns.push("MongoDB Database");
    if (codebaseContext.includes("postgresql"))
      patterns.push("PostgreSQL Database");

    // Generate architecture diagram in Mermaid format
    const diagram = this.generateMermaidArchitectureDiagram(patterns);

    return {
      overview: this.generateArchitectureOverview(patterns),
      mainComponents: components,
      dataFlow: this.extractDataFlow(codebaseContext),
      dependencies,
      patterns,
      diagram,
    };
  }

  private generateREADMEContent(
    projectInfo: any,
    architecture: ArchitectureInfo,
    apiEndpoints: APIEndpoint[],
    config: DocumentationConfig,
  ): string {
    return `# ${projectInfo.name}

${projectInfo.description}

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Overview

${architecture.overview}

### Key Features

${architecture.patterns.map((pattern) => `- ${pattern}`).join("\n")}

## 🏗️ Architecture

${architecture.diagram}

### Main Components

${architecture.mainComponents
  .map(
    (component) =>
      `- **${component.name}** (${component.type}): ${component.description}`,
  )
  .join("\n")}

## 📦 Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start the application
npm start
\`\`\`

## 🎯 Usage

### Basic Usage

\`\`\`javascript
// Basic usage example will be generated based on main entry points
\`\`\`

### Configuration

Details about configuration options and environment variables.

## 📚 API Documentation

${
  apiEndpoints.length > 0
    ? `### Endpoints\n\n${apiEndpoints
        .slice(0, 5)
        .map(
          (endpoint) =>
            `#### ${endpoint.method} ${endpoint.path}\n${endpoint.description}\n`,
        )
        .join(
          "\n",
        )}\n\n[View complete API documentation](./docs/generated/api.md)`
    : "No API endpoints detected in the current codebase."
}

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the ${projectInfo.license} License.

---

*This documentation was automatically generated by CodeBuddy's Intelligent Documentation Generator.*
`;
  }

  private generateMermaidArchitectureDiagram(patterns: string[]): string {
    return `
\`\`\`mermaid
graph TD
    A[Client] --> B[API Gateway]
    B --> C[Application Layer]
    C --> D[Business Logic]
    D --> E[Data Layer]
    E --> F[Database]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
\`\`\`
`;
  }

  private generateArchitectureOverview(patterns: string[]): string {
    const baseOverview =
      "This application follows modern software architecture principles with clear separation of concerns.";

    if (patterns.includes("Express.js REST API")) {
      return `${baseOverview} It's built as a REST API using Express.js, providing scalable and maintainable backend services.`;
    }

    if (patterns.includes("React Frontend")) {
      return `${baseOverview} The frontend is built with React, offering a modern and responsive user interface.`;
    }

    return baseOverview;
  }

  private extractDataFlow(codebaseContext: string): string[] {
    const flows = [
      "Client sends request to API endpoint",
      "Request is validated and processed",
      "Business logic is executed",
      "Data is retrieved/modified in database",
      "Response is formatted and sent back",
    ];
    return flows;
  }

  /**
   * Generate API documentation
   */
  async generateAPIDocumentation(
    endpoints: APIEndpoint[],
    config: DocumentationConfig,
  ): Promise<void> {
    const apiDoc = `# API Documentation

## Overview

This document describes the available API endpoints for this application.

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

## Endpoints

${endpoints
  .map(
    (endpoint) => `
### ${endpoint.method} ${endpoint.path}

${endpoint.description}

**Parameters:**
${
  endpoint.parameters.length > 0
    ? endpoint.parameters
        .map(
          (param) =>
            `- \`${param.name}\` (${param.type}) - ${param.description} ${param.required ? "**Required**" : "*Optional*"}`,
        )
        .join("\n")
    : "No parameters required."
}

**Responses:**
${endpoint.responses.map((response) => `- \`${response.status}\` - ${response.description}`).join("\n")}

${endpoint.example ? `**Example:**\n\`\`\`json\n${endpoint.example}\n\`\`\`` : ""}

---
`,
  )
  .join("\n")}

*Generated automatically by CodeBuddy Documentation Generator*
`;

    await this.writeFile("api.md", apiDoc);
  }

  /**
   * Generate architecture diagram
   */
  async generateArchitectureDiagram(
    architecture: ArchitectureInfo,
    config: DocumentationConfig,
  ): Promise<void> {
    const diagramDoc = `# Architecture Documentation

## System Architecture

${architecture.diagram}

## Component Overview

${architecture.mainComponents
  .map(
    (component) => `
### ${component.name}

**Type:** ${component.type}
**Description:** ${component.description}

${
  component.methods
    ? `
**Methods:**
${component.methods.map((method) => `- \`${method.name}(${method.parameters.join(", ")})\` → \`${method.returnType}\` - ${method.description}`).join("\n")}
`
    : ""
}

${
  component.usage
    ? `
**Usage:**
\`\`\`javascript
${component.usage}
\`\`\`
`
    : ""
}
`,
  )
  .join("\n")}

## Data Flow

${architecture.dataFlow.map((flow, index) => `${index + 1}. ${flow}`).join("\n")}

## Design Patterns

${architecture.patterns.map((pattern) => `- ${pattern}`).join("\n")}

*Generated automatically by CodeBuddy Documentation Generator*
`;

    await this.writeFile("architecture.md", diagramDoc);
  }

  /**
   * Generate component documentation
   */
  async generateComponentDocumentation(
    components: ComponentDoc[],
    config: DocumentationConfig,
  ): Promise<void> {
    const componentDoc = `# Component Documentation

This document provides detailed information about the main components in the application.

${components
  .map(
    (component) => `
## ${component.name}

**Type:** ${component.type}
**Description:** ${component.description}

${
  component.props
    ? `
### Props
${component.props.map((prop) => `- \`${prop.name}\` (\`${prop.type}\`) - ${prop.description} ${prop.required ? "**Required**" : "*Optional*"}`).join("\n")}
`
    : ""
}

${
  component.methods
    ? `
### Methods
${component.methods.map((method) => `- \`${method.name}(${method.parameters.join(", ")})\` → \`${method.returnType}\` - ${method.description}`).join("\n")}
`
    : ""
}

${
  component.usage
    ? `
### Usage Example
\`\`\`javascript
${component.usage}
\`\`\`
`
    : ""
}

---
`,
  )
  .join("\n")}

*Generated automatically by CodeBuddy Documentation Generator*
`;

    await this.writeFile("components.md", componentDoc);
  }

  /**
   * Generate documentation index
   */
  async generateDocumentationIndex(config: DocumentationConfig): Promise<void> {
    const indexDoc = `# Documentation Index

Welcome to the automatically generated documentation for this project.

## 📚 Available Documentation

- [**README**](../../README.md) - Project overview and quick start guide
- [**API Documentation**](./api.md) - Complete API reference
- [**Architecture**](./architecture.md) - System architecture and design patterns  
- [**Components**](./components.md) - Detailed component documentation

## 🔄 Regenerating Documentation

This documentation is automatically generated by CodeBuddy. To regenerate:

1. Open Command Palette (\`Ctrl+Shift+P\` / \`Cmd+Shift+P\`)
2. Type "CodeBuddy: Generate Documentation"
3. Select your documentation preferences
4. Documentation will be updated automatically

## 📝 Last Generated

Generated on: ${new Date().toISOString()}

---

*Powered by CodeBuddy's Intelligent Documentation Generator*
`;

    await this.writeFile("index.md", indexDoc);
  }

  /**
   * Utility methods
   */
  private async ensureOutputDirectory(): Promise<void> {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private async writeFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content, "utf8");
    this.logger.info(`Generated documentation file: ${filename}`);
  }

  private async openGeneratedDocumentation(): Promise<void> {
    const readmePath = path.join(
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "",
      "README.md",
    );
    if (fs.existsSync(readmePath)) {
      const doc = await vscode.workspace.openTextDocument(readmePath);
      await vscode.window.showTextDocument(doc);
    }
  }
}
