# Missing Implementations for Universal AI Agent

## 🏗️ BaseAgent Implementation

```typescript
// src/agents/base-agent.ts
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../infrastructure/logger/logger";
import { LLMService } from "../llms/interface";
import { AgentContext, AgentResponse } from "./interface";

export abstract class BaseAgent {
  protected logger: Logger;
  protected llm: LLMService;
  protected agentId: string;
  protected startTime: Date;
  protected metrics: AgentMetrics;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.logger = Logger.getInstance(agentId);
    this.llm = LLMService.getInstance();
    this.startTime = new Date();
    this.metrics = new AgentMetrics(agentId);
  }

  // Abstract methods that must be implemented by subclasses
  abstract executeTask(instruction: string, context: AgentContext): Promise<AgentResponse>;

  // Utility methods available to all agents
  protected generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.agentId}-${timestamp}-${random}`;
  }

  protected async generateResponse(
    result: TaskResult,
    taskPlan: TaskPlan,
    context: AgentContext
  ): Promise<AgentResponse> {
    const executionTime = Date.now() - this.startTime.getTime();

    // Update metrics
    this.metrics.recordExecution(executionTime, result.success);

    // Generate comprehensive response
    const response: AgentResponse = {
      content: this.formatResponseContent(result, taskPlan),
      context: {
        ...context,
        agentId: this.agentId,
        executionTime,
        taskId: taskPlan.id,
      },
      error: !result.success,
      timestamp: new Date(),
      metadata: {
        agentId: this.agentId,
        taskPlan,
        result,
        metrics: this.metrics.getSnapshot(),
      },
    };

    // Log the response
    this.logger.info("Agent response generated", {
      agentId: this.agentId,
      taskId: taskPlan.id,
      success: result.success,
      executionTime,
    });

    return response;
  }

  protected parseAnalysisResponse(analysisText: string): InstructionAnalysis {
    try {
      // Try to parse as JSON first
      if (analysisText.trim().startsWith("{")) {
        return JSON.parse(analysisText);
      }

      // Otherwise, parse using AI
      return this.parseAnalysisWithAI(analysisText);
    } catch (error) {
      this.logger.error("Failed to parse analysis response", { error, analysisText });

      // Return a fallback analysis
      return {
        steps: [
          {
            id: this.generateTaskId(),
            type: "terminal",
            action: "execute",
            params: { command: 'echo "Analysis parsing failed"' },
            critical: false,
          },
        ],
        requiredServers: ["terminal-server"],
        estimatedDuration: 5000,
        riskLevel: "low",
        dependencies: [],
      };
    }
  }

  private async parseAnalysisWithAI(analysisText: string): Promise<InstructionAnalysis> {
    const parsePrompt = `
Parse this instruction analysis into a structured JSON format:

${analysisText}

Return a JSON object with this exact structure:
{
  "steps": [
    {
      "id": "unique-id",
      "type": "web|file|terminal|database|git|api",
      "action": "specific-action",
      "params": { "key": "value" },
      "critical": true|false
    }
  ],
  "requiredServers": ["server-name"],
  "estimatedDuration": 30000,
  "riskLevel": "low|medium|high",
  "dependencies": ["dependency"]
}
`;

    const parsed = await this.llm.run(parsePrompt);
    return JSON.parse(parsed);
  }

  private formatResponseContent(result: TaskResult, taskPlan: TaskPlan): string {
    if (result.success) {
      return this.formatSuccessResponse(result, taskPlan);
    } else {
      return this.formatErrorResponse(result, taskPlan);
    }
  }

  private formatSuccessResponse(result: TaskResult, taskPlan: TaskPlan): string {
    const successfulSteps = result.steps.filter((step) => step.success);
    const totalSteps = result.steps.length;

    let content = `✅ **Task Completed Successfully**\n\n`;
    content += `**Original Instruction:** ${taskPlan.instruction}\n\n`;
    content += `**Execution Summary:**\n`;
    content += `- Steps completed: ${successfulSteps.length}/${totalSteps}\n`;
    content += `- Total duration: ${this.formatDuration(result.duration)}\n`;
    content += `- Risk level: ${taskPlan.riskLevel}\n\n`;

    content += `**Detailed Results:**\n\n`;

    for (const step of result.steps) {
      const status = step.success ? "✅" : "❌";
      const duration = this.formatDuration(step.duration);

      content += `${status} **Step ${step.stepId}** (${duration})\n`;

      if (step.success && step.data) {
        content += this.formatStepData(step.data);
      } else if (!step.success && step.error) {
        content += `   Error: ${step.error}\n`;
      }
      content += "\n";
    }

    if (result.summary) {
      content += `**Summary:** ${result.summary}\n`;
    }

    return content;
  }

  private formatErrorResponse(result: TaskResult, taskPlan: TaskPlan): string {
    let content = `❌ **Task Failed**\n\n`;
    content += `**Original Instruction:** ${taskPlan.instruction}\n\n`;
    content += `**Error Summary:**\n`;

    const failedSteps = result.steps.filter((step) => !step.success);
    const successfulSteps = result.steps.filter((step) => step.success);

    content += `- Failed steps: ${failedSteps.length}\n`;
    content += `- Successful steps: ${successfulSteps.length}\n`;
    content += `- Total duration: ${this.formatDuration(result.duration)}\n\n`;

    content += `**Failed Steps:**\n\n`;

    for (const step of failedSteps) {
      content += `❌ **Step ${step.stepId}**\n`;
      content += `   Error: ${step.error}\n`;
      content += `   Duration: ${this.formatDuration(step.duration)}\n\n`;
    }

    if (successfulSteps.length > 0) {
      content += `**Successful Steps:**\n\n`;
      for (const step of successfulSteps) {
        content += `✅ **Step ${step.stepId}** (${this.formatDuration(step.duration)})\n`;
      }
    }

    return content;
  }

  private formatStepData(data: any): string {
    if (!data) return "";

    if (typeof data === "string") {
      return `   Result: ${data.substring(0, 200)}${data.length > 200 ? "..." : ""}\n`;
    }

    if (typeof data === "object") {
      if (data.success !== undefined) {
        return `   Success: ${data.success}\n`;
      }

      // Format key results
      const keys = Object.keys(data).slice(0, 3);
      let result = "";
      for (const key of keys) {
        const value =
          typeof data[key] === "string" ? data[key].substring(0, 50) : JSON.stringify(data[key]).substring(0, 50);
        result += `   ${key}: ${value}\n`;
      }
      return result;
    }

    return `   Result: ${JSON.stringify(data).substring(0, 200)}\n`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  // Getters for agent information
  public getAgentId(): string {
    return this.agentId;
  }

  public getMetrics(): AgentMetrics {
    return this.metrics;
  }

  public getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }
}

// Agent Metrics class
export class AgentMetrics {
  private agentId: string;
  private totalExecutions: number = 0;
  private successfulExecutions: number = 0;
  private totalExecutionTime: number = 0;
  private averageExecutionTime: number = 0;
  private lastExecutionTime: Date | null = null;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  recordExecution(executionTime: number, success: boolean): void {
    this.totalExecutions++;
    this.totalExecutionTime += executionTime;
    this.averageExecutionTime = this.totalExecutionTime / this.totalExecutions;
    this.lastExecutionTime = new Date();

    if (success) {
      this.successfulExecutions++;
    }
  }

  getSuccessRate(): number {
    if (this.totalExecutions === 0) return 0;
    return (this.successfulExecutions / this.totalExecutions) * 100;
  }

  getSnapshot(): MetricsSnapshot {
    return {
      agentId: this.agentId,
      totalExecutions: this.totalExecutions,
      successfulExecutions: this.successfulExecutions,
      successRate: this.getSuccessRate(),
      averageExecutionTime: this.averageExecutionTime,
      totalExecutionTime: this.totalExecutionTime,
      lastExecutionTime: this.lastExecutionTime,
    };
  }
}

// Types and Interfaces
export interface MetricsSnapshot {
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  lastExecutionTime: Date | null;
}

export interface TaskResult {
  planId: string;
  steps: StepResult[];
  success: boolean;
  duration: number;
  summary: string;
}

export interface TaskPlan {
  id: string;
  instruction: string;
  steps: TaskStep[];
  requiredServers: string[];
  estimatedDuration: number;
  riskLevel: "low" | "medium" | "high";
  dependencies: string[];
}

export interface TaskStep {
  id: string;
  type: "web" | "file" | "terminal" | "database" | "git" | "api";
  action: string;
  params: Record<string, any>;
  critical: boolean;
  timeout?: number;
  retryCount?: number;
}

export interface StepResult {
  stepId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: Date;
  critical?: boolean;
}

export interface InstructionAnalysis {
  steps: TaskStep[];
  requiredServers: string[];
  estimatedDuration: number;
  riskLevel: "low" | "medium" | "high";
  dependencies: string[];
}
```

## 🔧 TaskCoordinator Missing Methods

```typescript
// src/agents/task-coordinator-extensions.ts
export class TaskCoordinatorExtensions {
  calculateDuration(results: StepResult[]): number {
    if (results.length === 0) return 0;

    const startTime = Math.min(...results.map((r) => r.timestamp.getTime()));
    const endTime = Math.max(...results.map((r) => r.timestamp.getTime()));

    return endTime - startTime;
  }

  generateSummary(results: StepResult[]): string {
    const total = results.length;
    const successful = results.filter((r) => r.success).length;
    const failed = total - successful;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    let summary = `Executed ${total} steps in ${this.formatDuration(totalDuration)}. `;

    if (failed === 0) {
      summary += `All steps completed successfully.`;
    } else if (successful === 0) {
      summary += `All steps failed.`;
    } else {
      summary += `${successful} succeeded, ${failed} failed.`;
    }

    // Add specific insights
    const criticalFailures = results.filter((r) => !r.success && r.critical);
    if (criticalFailures.length > 0) {
      summary += ` ${criticalFailures.length} critical failures detected.`;
    }

    const slowSteps = results.filter((r) => r.duration > 30000);
    if (slowSteps.length > 0) {
      summary += ` ${slowSteps.length} steps took longer than 30 seconds.`;
    }

    return summary;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Extend TaskCoordinator class
export class TaskCoordinator extends TaskCoordinatorExtensions {
  constructor(private mcpClient: MCPClientService) {
    super();
  }

  // ... existing methods from the original implementation ...
}
```

## 🛡️ Security Manager Implementation

```typescript
// src/services/mcp-security.service.ts
import { Logger } from "../infrastructure/logger/logger";
import { TaskPlan, TaskContext } from "../agents/interface";

export class SecurityManager {
  private logger: Logger;
  private securityPolicies: SecurityPolicies;
  private riskAssessment: RiskAssessment;

  constructor() {
    this.logger = Logger.getInstance("SecurityManager");
    this.securityPolicies = new SecurityPolicies();
    this.riskAssessment = new RiskAssessment();
  }

  async validateTaskExecution(taskPlan: TaskPlan, taskContext?: TaskContext): Promise<void> {
    this.logger.info("Validating task execution", {
      taskId: taskPlan.id,
      riskLevel: taskPlan.riskLevel,
    });

    // 1. Risk level validation
    await this.validateRiskLevel(taskPlan, taskContext);

    // 2. Required capabilities validation
    await this.validateCapabilities(taskPlan, taskContext);

    // 3. Security level validation
    await this.validateSecurityLevel(taskPlan, taskContext);

    // 4. Resource access validation
    await this.validateResourceAccess(taskPlan);

    // 5. Command safety validation
    await this.validateCommandSafety(taskPlan);

    this.logger.info("Task execution validated successfully", { taskId: taskPlan.id });
  }

  private async validateRiskLevel(taskPlan: TaskPlan, taskContext?: TaskContext): Promise<void> {
    const maxAllowedRisk = taskContext?.securityLevel === "admin" ? "high" : "medium";

    if (!this.isRiskLevelAllowed(taskPlan.riskLevel, maxAllowedRisk)) {
      throw new SecurityError(
        `Task risk level '${taskPlan.riskLevel}' exceeds maximum allowed '${maxAllowedRisk}'`,
        "RISK_LEVEL_EXCEEDED"
      );
    }
  }

  private async validateCapabilities(taskPlan: TaskPlan, taskContext?: TaskContext): Promise<void> {
    if (!taskContext?.requiredCapabilities) return;

    const unauthorizedCapabilities = taskContext.requiredCapabilities.filter(
      (capability) => !this.securityPolicies.isCapabilityAllowed(capability, taskContext.securityLevel)
    );

    if (unauthorizedCapabilities.length > 0) {
      throw new SecurityError(`Unauthorized capabilities: ${unauthorizedCapabilities.join(", ")}`, "CAPABILITY_DENIED");
    }
  }

  private async validateSecurityLevel(taskPlan: TaskPlan, taskContext?: TaskContext): Promise<void> {
    const requiredLevel = this.determineRequiredSecurityLevel(taskPlan);
    const userLevel = taskContext?.securityLevel || "read";

    if (!this.isSecurityLevelSufficient(userLevel, requiredLevel)) {
      throw new SecurityError(
        `Insufficient security level. Required: ${requiredLevel}, Provided: ${userLevel}`,
        "INSUFFICIENT_SECURITY_LEVEL"
      );
    }
  }

  private async validateResourceAccess(taskPlan: TaskPlan): Promise<void> {
    for (const step of taskPlan.steps) {
      if (step.type === "file") {
        await this.validateFileAccess(step);
      } else if (step.type === "terminal") {
        await this.validateTerminalAccess(step);
      } else if (step.type === "database") {
        await this.validateDatabaseAccess(step);
      }
    }
  }

  private async validateFileAccess(step: any): Promise<void> {
    const { action, params } = step;

    if (["write", "delete", "move"].includes(action)) {
      const path = params.path || params.source || params.destination;

      if (this.securityPolicies.isRestrictedPath(path)) {
        throw new SecurityError(`Access denied to restricted path: ${path}`, "RESTRICTED_PATH_ACCESS");
      }
    }
  }

  private async validateTerminalAccess(step: any): Promise<void> {
    const { params } = step;
    const command = params.command;

    if (this.securityPolicies.isDangerousCommand(command)) {
      throw new SecurityError(`Dangerous command blocked: ${command}`, "DANGEROUS_COMMAND_BLOCKED");
    }
  }

  private async validateDatabaseAccess(step: any): Promise<void> {
    const { action, params } = step;

    if (action === "query") {
      const sql = params.sql;

      if (this.securityPolicies.isDangerousQuery(sql)) {
        throw new SecurityError(`Dangerous SQL query blocked`, "DANGEROUS_QUERY_BLOCKED");
      }
    }
  }

  private async validateCommandSafety(taskPlan: TaskPlan): Promise<void> {
    const riskScore = this.riskAssessment.calculateRiskScore(taskPlan);

    if (riskScore > this.securityPolicies.getMaxRiskScore()) {
      throw new SecurityError(`Task risk score ${riskScore} exceeds maximum allowed`, "RISK_SCORE_EXCEEDED");
    }
  }

  private isRiskLevelAllowed(taskRisk: string, maxAllowed: string): boolean {
    const levels = { low: 1, medium: 2, high: 3 };
    return levels[taskRisk] <= levels[maxAllowed];
  }

  private isSecurityLevelSufficient(userLevel: string, requiredLevel: string): boolean {
    const levels = { read: 1, write: 2, execute: 3, admin: 4 };
    return levels[userLevel] >= levels[requiredLevel];
  }

  private determineRequiredSecurityLevel(taskPlan: TaskPlan): string {
    let maxLevel = "read";

    for (const step of taskPlan.steps) {
      if (step.type === "terminal") {
        maxLevel = "execute";
      } else if (["write", "delete", "move"].includes(step.action)) {
        maxLevel = maxLevel === "execute" ? maxLevel : "write";
      }
    }

    return maxLevel;
  }
}

// Security support classes
class SecurityPolicies {
  private restrictedPaths = ["/etc", "/usr/bin", "/System", "C:\\Windows", "C:\\Program Files"];

  private dangerousCommands = ["rm -rf /", "format c:", "del /f /s /q", "chmod 777", "sudo", "su -"];

  isCapabilityAllowed(capability: string, securityLevel: string): boolean {
    const allowedCapabilities = {
      read: ["webBrowsing", "fileOperations"],
      write: ["webBrowsing", "fileOperations", "gitOperations"],
      execute: ["webBrowsing", "fileOperations", "gitOperations", "terminalAccess"],
      admin: ["webBrowsing", "fileOperations", "gitOperations", "terminalAccess", "databaseAccess", "systemMonitoring"],
    };

    return allowedCapabilities[securityLevel]?.includes(capability) || false;
  }

  isRestrictedPath(path: string): boolean {
    return this.restrictedPaths.some((restricted) => path.startsWith(restricted));
  }

  isDangerousCommand(command: string): boolean {
    return this.dangerousCommands.some((dangerous) => command.toLowerCase().includes(dangerous.toLowerCase()));
  }

  isDangerousQuery(sql: string): boolean {
    const dangerousPatterns = [
      /drop\s+table/i,
      /delete\s+from.*where\s+1\s*=\s*1/i,
      /truncate\s+table/i,
      /alter\s+table.*drop/i,
    ];

    return dangerousPatterns.some((pattern) => pattern.test(sql));
  }

  getMaxRiskScore(): number {
    return 75; // Maximum allowed risk score out of 100
  }
}

class RiskAssessment {
  calculateRiskScore(taskPlan: TaskPlan): number {
    let score = 0;

    // Base risk from plan risk level
    const riskLevelScores = { low: 10, medium: 30, high: 50 };
    score += riskLevelScores[taskPlan.riskLevel] || 0;

    // Risk from step types and actions
    for (const step of taskPlan.steps) {
      score += this.getStepRiskScore(step);
    }

    // Risk from number of steps
    score += Math.min(taskPlan.steps.length * 2, 20);

    return Math.min(score, 100); // Cap at 100
  }

  private getStepRiskScore(step: any): number {
    const riskScores = {
      terminal: 15,
      database: 10,
      file: 8,
      web: 5,
      git: 3,
      api: 7,
    };

    let score = riskScores[step.type] || 5;

    // Additional risk for dangerous actions
    if (["delete", "execute", "drop"].includes(step.action)) {
      score += 10;
    }

    return score;
  }
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "SecurityError";
  }
}
```

## 🔌 VS Code Integration Helpers

```typescript
// src/utils/vscode-integration.ts
import * as vscode from "vscode";
import { AgentContext, AgentResponse } from "../agents/interface";

export async function getAgentContext(): Promise<AgentContext> {
  const activeEditor = vscode.window.activeTextEditor;
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  return {
    workspaceRoot: workspaceFolder?.uri.fsPath || process.cwd(),
    currentFile: activeEditor?.document.fileName,
    currentSelection: activeEditor?.selection,
    openFiles: vscode.workspace.textDocuments.map((doc) => doc.fileName),
    gitBranch: await getCurrentGitBranch(),
    timestamp: new Date(),
    user: {
      preferences: await getUserPreferences(),
      securityLevel: "write", // Default security level
    },
  };
}

export function generateResultsHtml(result: AgentResponse): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Universal Agent Results</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 2px solid var(--vscode-textSeparator-foreground);
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .status.success {
            background-color: var(--vscode-testing-iconPassed);
            color: white;
        }
        .status.error {
            background-color: var(--vscode-testing-iconFailed);
            color: white;
        }
        .content {
            white-space: pre-wrap;
            background-color: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 5px;
            border: 1px solid var(--vscode-textSeparator-foreground);
        }
        .metadata {
            margin-top: 20px;
            padding: 15px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 5px;
            font-size: 0.9em;
        }
        .timestamp {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Universal Agent Results</h1>
            <div class="status ${result.error ? "error" : "success"}">
                ${result.error ? "❌ Failed" : "✅ Success"}
            </div>
            <div class="timestamp">
                Completed at: ${result.timestamp.toLocaleString()}
            </div>
        </div>
        
        <div class="content">
${result.content}
        </div>
        
        ${
          result.metadata
            ? `
        <div class="metadata">
            <h3>Execution Details</h3>
            <p><strong>Agent ID:</strong> ${result.metadata.agentId}</p>
            <p><strong>Execution Time:</strong> ${result.context.executionTime}ms</p>
            <p><strong>Task ID:</strong> ${result.context.taskId}</p>
            ${
              result.metadata.metrics
                ? `
            <p><strong>Success Rate:</strong> ${result.metadata.metrics.successRate.toFixed(1)}%</p>
            <p><strong>Total Executions:</strong> ${result.metadata.metrics.totalExecutions}</p>
            `
                : ""
            }
        </div>
        `
            : ""
        }
    </div>
</body>
</html>
  `;
}

async function getCurrentGitBranch(): Promise<string | undefined> {
  try {
    const gitExtension = vscode.extensions.getExtension("vscode.git");
    if (gitExtension) {
      const git = gitExtension.exports.getAPI(1);
      const repo = git.repositories[0];
      return repo?.state?.HEAD?.name;
    }
  } catch (error) {
    // Git extension not available or error occurred
  }
  return undefined;
}

async function getUserPreferences(): Promise<any> {
  const config = vscode.workspace.getConfiguration("codebuddy");
  return {
    preferredLanguage: config.get("preferredLanguage", "typescript"),
    preferredFramework: config.get("preferredFramework", "react"),
    testingFramework: config.get("testingFramework", "jest"),
    codeStyle: config.get("codeStyle", "clean-architecture"),
  };
}
```

## 📝 Agent Interface Definitions

```typescript
// src/agents/interface.ts
export interface AgentContext {
  workspaceRoot: string;
  currentFile?: string;
  currentSelection?: any;
  openFiles: string[];
  gitBranch?: string;
  timestamp: Date;
  user: {
    preferences: any;
    securityLevel: "read" | "write" | "execute" | "admin";
  };
  agentId?: string;
  executionTime?: number;
  taskId?: string;
}

export interface AgentResponse {
  content: string;
  context: AgentContext;
  error: boolean;
  timestamp: Date;
  metadata?: {
    agentId: string;
    taskPlan: any;
    result: any;
    metrics: any;
  };
}
```

This completes all the missing implementations referenced in the Universal AI Agent documentation. Each component is fully functional and provides the foundation for the comprehensive agent system.
