# Agent-to-Agent (A2A) Communication Protocol

## Overview

The Agent-to-Agent (A2A) communication protocol enables seamless collaboration between specialist agents in our multi-agent system. We leverage the `@a2a-js/sdk` framework to provide standardized message formats, task coordination, and inter-agent communication patterns that allow agents to work together effectively on complex tasks.

## SDK Integration

### A2A SDK Setup

```typescript
import {
  // Message and Task types from the SDK
  MessageSendParams,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  Message,
  Task,

  // State and content handling
  TaskState,
  FilePart,
  DataPart,
  Part,

  // Agent representation
  AgentCard,
} from "@a2a-js/sdk";
import { A2AClient } from "@a2a-js/sdk/client";
```

### Protocol Architecture

```
┌─────────────────────────────────────────────────────┐
│            @a2a-js/sdk Application Layer            │
│  - Task Coordination (Task, TaskState)             │
│  - Message Handling (Message, MessageSendParams)   │
│  - Agent Management (AgentCard)                    │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│            A2A Client Communication Layer           │
│  - A2AClient for message routing                   │
│  - Event handling (TaskStatusUpdateEvent)          │
│  - Artifact management (TaskArtifactUpdateEvent)   │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│               Transport & Network Layer             │
│  - SDK-managed connections                         │
│  - Built-in reliability & error handling          │
│  - Security & authentication                      │
└─────────────────────────────────────────────────────┘
```

## Agent Communication Patterns

### A2A Client Initialization

```typescript
class BaseAgent {
  protected a2aClient: A2AClient;
  protected mcpClient: MCPClient; // MCP integration for tool access
  protected agentCard: AgentCard;

  constructor(config: AgentConfiguration) {
    this.agentCard = {
      id: config.agentId,
      name: config.agentName,
      description: config.description,
      capabilities: config.capabilities,
      version: config.version,
    };

    // A2A client for inter-agent communication
    this.a2aClient = new A2AClient({
      agentCard: this.agentCard,
      endpoint: config.a2aEndpoint,
      credentials: config.credentials,
    });

    // MCP client for tool access
    this.mcpClient = new MCPClient({
      serverEndpoint: config.mcpServerEndpoint,
      credentials: config.mcpCredentials
    });
  }

  async initialize(): Promise<void> {
    // Initialize both A2A and MCP connections
    await Promise.all([
      this.a2aClient.connect(),
      this.mcpClient.connect()
    ]);

    await this.registerTaskHandlers();
    await this.registerEventHandlers();
    await this.initializeMCPTools();
  }

  protected abstract async initializeMCPTools(): Promise<void>;
}
}
```

### Task-Based Communication

Instead of custom message types, we use the SDK's Task-based communication:

````

#### 1. Task Creation and Assignment with MCP Tool Integration

```typescript
// Git Agent uses MCP tools and A2A communication
class GitAgent extends BaseAgent {
  private gitTools: Map<string, MCPTool> = new Map();

  protected async initializeMCPTools(): Promise<void> {
    // Initialize MCP tools for Git operations
    this.gitTools.set('git-clone', await this.mcpClient.getTool('git-clone'));
    this.gitTools.set('git-analysis', await this.mcpClient.getTool('git-log-analysis'));
    this.gitTools.set('github-api', await this.mcpClient.getTool('github-api'));
  }

  async analyzeRepositoryAndNotifyAgents(repositoryUrl: string): Promise<void> {
    // Step 1: Use MCP to perform Git analysis
    const cloneTool = this.gitTools.get('git-clone');
    const analysisTool = this.gitTools.get('git-analysis');

    // Clone repository using MCP tool
    const cloneResult = await this.mcpClient.invokeTool('git-clone', {
      url: repositoryUrl,
      path: `/tmp/analysis-${Date.now()}`
    });

    // Perform analysis using MCP tool
    const analysisResult = await this.mcpClient.invokeTool('git-log-analysis', {
      repositoryPath: cloneResult.path,
      analysisType: 'security_focused'
    });

    // Step 2: Use A2A to request database storage from Database Agent
    const storageTask: Task = {
      id: `store-analysis-${Date.now()}`,
      title: "Store Git Analysis Results",
      description: `Store analysis results for repository ${repositoryUrl}`,
      assignedTo: "database-agent",
      state: TaskState.PENDING,
      priority: "normal",
      data: {
        action: "store_repository_analysis",
        repositoryUrl,
        analysisData: analysisResult
      }
    };

    await this.a2aClient.sendTask(storageTask);

    // Step 3: Use A2A to request code review if issues found
    if (analysisResult.potentialIssues?.length > 0) {
      const reviewTask: Task = {
        id: `review-analysis-${Date.now()}`,
        title: "Review Potential Code Issues",
        description: `Review ${analysisResult.potentialIssues.length} potential issues`,
        assignedTo: "code-review-agent",
        state: TaskState.PENDING,
        priority: "high",
        data: {
          action: "review_identified_issues",
          repositoryUrl,
          issues: analysisResult.potentialIssues,
          analysisContext: analysisResult.context
        }
      };

      await this.a2aClient.sendTask(reviewTask);
    }
  }
}
````

#### 2. Task Handling with MCP Tool Execution

```typescript
// Database Agent handles A2A tasks using MCP tools
class DatabaseAgent extends BaseAgent {
  private dbTools: Map<string, MCPTool> = new Map();

  protected async initializeMCPTools(): Promise<void> {
    // Initialize MCP tools for database operations
    this.dbTools.set("sql-executor", await this.mcpClient.getTool("sql-executor"));
    this.dbTools.set("query-optimizer", await this.mcpClient.getTool("query-optimizer"));
    this.dbTools.set("schema-analyzer", await this.mcpClient.getTool("schema-analyzer"));
  }

  protected async registerTaskHandlers(): Promise<void> {
    this.a2aClient.onTaskReceived(async (task: Task) => {
      if (task.data?.action === "store_repository_analysis") {
        await this.handleStoreRepositoryAnalysis(task);
      } else if (task.data?.action === "optimize_query") {
        await this.handleQueryOptimization(task);
      }
    });
  }

  private async handleStoreRepositoryAnalysis(task: Task): Promise<void> {
    try {
      // Update A2A task status
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.IN_PROGRESS,
        message: "Processing repository analysis storage",
      } as TaskStatusUpdateEvent);

      // Use MCP tool to execute database operations
      const sqlResult = await this.mcpClient.invokeTool("sql-executor", {
        query: `INSERT INTO repository_analysis (url, analysis_data, created_at) 
                VALUES (?, ?, NOW())`,
        parameters: [task.data.repositoryUrl, JSON.stringify(task.data.analysisData)],
      });

      // Update A2A task with success
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.COMPLETED,
        message: "Repository analysis stored successfully",
        result: {
          recordId: sqlResult.insertId,
          timestamp: new Date().toISOString(),
        },
      } as TaskStatusUpdateEvent);
    } catch (error) {
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.FAILED,
        message: `Failed to store analysis: ${error.message}`,
        error: error,
      } as TaskStatusUpdateEvent);
    }
  }

  private async handleQueryOptimization(task: Task): Promise<void> {
    try {
      // Use MCP query optimizer tool
      const optimizationResult = await this.mcpClient.invokeTool("query-optimizer", {
        query: task.data.originalQuery,
        database: task.data.databaseType,
        schema: task.data.schemaInfo,
      });

      // Send optimization results back via A2A
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.COMPLETED,
        message: "Query optimization completed",
        result: {
          originalQuery: task.data.originalQuery,
          optimizedQuery: optimizationResult.optimizedQuery,
          estimatedImprovement: optimizationResult.performanceGain,
          recommendations: optimizationResult.recommendations,
        },
      } as TaskStatusUpdateEvent);
    } catch (error) {
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.FAILED,
        message: `Query optimization failed: ${error.message}`,
        error: error,
      } as TaskStatusUpdateEvent);
    }
  }
}
```

#### 3. Code Review Agent with MCP Tool Integration

```typescript
// Code Review Agent combines MCP tools with A2A communication
class CodeReviewAgent extends BaseAgent {
  private analysisTools: Map<string, MCPTool> = new Map();

  protected async initializeMCPTools(): Promise<void> {
    // Initialize MCP tools for code analysis
    this.analysisTools.set("eslint", await this.mcpClient.getTool("eslint-analyzer"));
    this.analysisTools.set("sonarqube", await this.mcpClient.getTool("sonarqube-analyzer"));
    this.analysisTools.set("semgrep", await this.mcpClient.getTool("semgrep-scanner"));
    this.analysisTools.set("security-scanner", await this.mcpClient.getTool("vulnerability-scanner"));
  }

  protected async registerTaskHandlers(): Promise<void> {
    this.a2aClient.onTaskReceived(async (task: Task) => {
      if (task.data?.action === "review_identified_issues") {
        await this.handleIssueReview(task);
      } else if (task.data?.action === "comprehensive_security_scan") {
        await this.handleSecurityScan(task);
      }
    });
  }

  private async handleIssueReview(task: Task): Promise<void> {
    try {
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.IN_PROGRESS,
        message: "Performing comprehensive code review",
      } as TaskStatusUpdateEvent);

      // Use multiple MCP tools for comprehensive analysis
      const [eslintResults, sonarResults, securityResults] = await Promise.all([
        this.mcpClient.invokeTool("eslint-analyzer", {
          repositoryUrl: task.data.repositoryUrl,
          focusAreas: task.data.issues.map((issue) => issue.file),
        }),
        this.mcpClient.invokeTool("sonarqube-analyzer", {
          repositoryUrl: task.data.repositoryUrl,
          analysisType: "quality_gates",
        }),
        this.mcpClient.invokeTool("semgrep-scanner", {
          repositoryUrl: task.data.repositoryUrl,
          rulesets: ["security", "performance"],
        }),
      ]);

      // Consolidate results and create comprehensive report
      const consolidatedReport = this.consolidateAnalysisResults({
        eslint: eslintResults,
        sonar: sonarResults,
        security: securityResults,
        originalIssues: task.data.issues,
      });

      // Send security alerts via A2A if critical issues found
      if (consolidatedReport.criticalIssues.length > 0) {
        await this.sendSecurityAlerts(consolidatedReport.criticalIssues, task.data.repositoryUrl);
      }

      // Complete the task with comprehensive results
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.COMPLETED,
        message: "Code review completed",
        result: consolidatedReport,
      } as TaskStatusUpdateEvent);
    } catch (error) {
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.FAILED,
        message: `Code review failed: ${error.message}`,
        error: error,
      } as TaskStatusUpdateEvent);
    }
  }

  async sendSecurityAlerts(criticalIssues: SecurityIssue[], repositoryUrl: string): Promise<void> {
    for (const issue of criticalIssues) {
      const messageParams: MessageSendParams = {
        to: "broadcast", // Alert all relevant agents
        content: {
          type: "security_alert",
          data: {
            severity: issue.severity,
            description: issue.description,
            location: {
              file: issue.file,
              line: issue.line,
            },
            repositoryUrl,
            recommendedAction: issue.recommendation,
          },
        },
        priority: "critical",
      };

      await this.a2aClient.sendMessage(messageParams);
    }
  }
}
```

#### 4. File and Data Artifact Sharing with MCP Integration

```typescript
// Git Agent shares MCP-generated analysis artifacts via A2A
class GitAgent extends BaseAgent {
  async shareDetailedAnalysisResults(taskId: string, repositoryPath: string): Promise<void> {
    try {
      // Use MCP tools to generate comprehensive analysis artifacts
      const [commitAnalysis, branchAnalysis, securityScan] = await Promise.all([
        this.mcpClient.invokeTool("git-log-analysis", {
          repositoryPath,
          analysisType: "detailed_commit_patterns",
        }),
        this.mcpClient.invokeTool("git-branch-analysis", {
          repositoryPath,
          includeMetrics: true,
        }),
        this.mcpClient.invokeTool("git-security-scan", {
          repositoryPath,
          scanType: "secrets_and_patterns",
        }),
      ]);

      // Create structured data artifacts using A2A SDK
      const commitDataPart: DataPart = {
        type: "data",
        mimeType: "application/json",
        data: JSON.stringify({
          analysis: commitAnalysis,
          metadata: {
            generatedBy: "git-mcp-tools",
            timestamp: new Date().toISOString(),
            repositoryPath,
          },
        }),
      };

      const reportFilePart: FilePart = {
        type: "file",
        name: "security-scan-report.md",
        mimeType: "text/markdown",
        content: this.generateMarkdownReport(securityScan, branchAnalysis),
      };

      // Share artifacts via A2A
      await this.a2aClient.updateTaskArtifact({
        taskId: taskId,
        artifactId: `git-analysis-${Date.now()}`,
        parts: [commitDataPart, reportFilePart],
        description: "Comprehensive Git repository analysis results",
      } as TaskArtifactUpdateEvent);
    } catch (error) {
      console.error("Failed to generate and share analysis artifacts:", error);
    }
  }

  private generateMarkdownReport(securityScan: any, branchAnalysis: any): string {
    return `
# Git Repository Analysis Report

## Security Scan Results
- **Issues Found**: ${securityScan.issues.length}
- **Critical**: ${securityScan.issues.filter((i) => i.severity === "critical").length}
- **High**: ${securityScan.issues.filter((i) => i.severity === "high").length}

## Branch Analysis
- **Active Branches**: ${branchAnalysis.activeBranches}
- **Stale Branches**: ${branchAnalysis.staleBranches}
- **Merge Conflicts**: ${branchAnalysis.potentialConflicts}

## Recommendations
${securityScan.recommendations.map((r) => `- ${r}`).join("\n")}
    `;
  }

  // Method to retrieve shared analysis from other agents
  async processSharedDatabaseInsights(event: TaskArtifactUpdateEvent): Promise<void> {
    for (const part of event.parts) {
      if (part.type === "data" && part.mimeType === "application/json") {
        const data = JSON.parse((part as DataPart).data);

        if (data.analysisType === "query_performance") {
          // Use MCP tools to correlate database performance with code changes
          const correlationResult = await this.mcpClient.invokeTool("git-correlation-analysis", {
            performanceData: data.performanceMetrics,
            timeframe: data.timeframe,
            repositoryPath: data.repositoryPath,
          });

          // Share correlation findings with other agents
          await this.shareCorrelationFindings(correlationResult, event.taskId);
        }
      }
    }
  }
}
```

## Agent Discovery and Capability Management

### Agent Registration with SDK

```typescript
// Automatic agent registration using AgentCard
class SpecialistAgent extends BaseAgent {
  constructor(config: AgentConfiguration) {
    super(config);

    // Define agent capabilities in the AgentCard
    this.agentCard = {
      id: config.agentId,
      name: config.agentName,
      description: config.description,
      capabilities: this.defineCapabilities(),
      version: config.version,
      metadata: {
        domain: config.domain, // 'git', 'database', 'code-review'
        tools: config.availableTools,
        sla: config.serviceLevel,
      },
    };
  }

  protected abstract defineCapabilities(): string[];
}

// Git Agent capabilities
class GitAgent extends SpecialistAgent {
  protected defineCapabilities(): string[] {
    return [
      "repository.analyze",
      "repository.clone",
      "repository.metadata.extract",
      "commits.analyze",
      "branches.manage",
      "pull_requests.review",
      "github.api.access",
      "gitlab.api.access",
    ];
  }
}

// Database Agent capabilities
class DatabaseAgent extends SpecialistAgent {
  protected defineCapabilities(): string[] {
    return [
      "database.query.execute",
      "database.query.optimize",
      "database.schema.analyze",
      "database.performance.monitor",
      "database.migrations.validate",
      "sql.review",
      "data.quality.assess",
    ];
  }
}
```

### Dynamic Agent Discovery

```typescript
// Finding agents by capability using SDK
class AgentDiscoveryService {
  constructor(private a2aClient: A2AClient) {}

  async findAgentsByCapability(capability: string): Promise<AgentCard[]> {
    // SDK handles agent discovery and capability matching
    return await this.a2aClient.discoverAgents({
      capability: capability,
      online: true,
    });
  }

  async findBestAgentForTask(taskRequirements: TaskRequirements): Promise<AgentCard | null> {
    const candidates = await this.a2aClient.discoverAgents({
      capabilities: taskRequirements.requiredCapabilities,
      domain: taskRequirements.domain,
      online: true,
    });

    // Score agents based on load, performance, and specialization
    return this.scoreAndSelectAgent(candidates, taskRequirements);
  }
}
```

## Task State Management and Workflows

### Task Lifecycle Management

```typescript
// Workflow orchestration using SDK task states
class WorkflowOrchestrator {
  private a2aClient: A2AClient;
  private activeWorkflows: Map<string, WorkflowInstance> = new Map();

  async executeWorkflow(workflowDefinition: WorkflowDefinition, input: any): Promise<WorkflowResult> {
    const workflowId = `workflow-${Date.now()}`;
    const instance = new WorkflowInstance(workflowId, workflowDefinition, input);

    this.activeWorkflows.set(workflowId, instance);

    try {
      for (const step of workflowDefinition.steps) {
        await this.executeWorkflowStep(step, instance);
      }

      return instance.getResult();
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  private async executeWorkflowStep(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    // Find appropriate agent for step
    const targetAgent = await this.findAgentForStep(step);

    // Create task for step
    const task: Task = {
      id: `${instance.id}-step-${step.id}`,
      title: step.name,
      description: step.description,
      assignedTo: targetAgent.id,
      state: TaskState.PENDING,
      priority: step.priority || "normal",
      data: {
        workflowId: instance.id,
        stepId: step.id,
        action: step.action,
        parameters: this.resolveStepParameters(step, instance),
      },
      dependencies: step.dependencies,
      deadline: step.timeout ? new Date(Date.now() + step.timeout) : undefined,
    };

    // Send task and wait for completion
    await this.a2aClient.sendTask(task);
    await this.waitForTaskCompletion(task.id, step.timeout);

    // Update workflow instance with step results
    const completedTask = await this.a2aClient.getTask(task.id);
    instance.addStepResult(step.id, completedTask);
  }

  private async waitForTaskCompletion(taskId: string, timeout?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = timeout
        ? setTimeout(() => {
            reject(new Error(`Task ${taskId} timed out`));
          }, timeout)
        : null;

      this.a2aClient.onTaskStatusUpdate((event: TaskStatusUpdateEvent) => {
        if (event.taskId === taskId) {
          if (event.state === TaskState.COMPLETED) {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            resolve();
          } else if (event.state === TaskState.FAILED) {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            reject(new Error(`Task failed: ${event.message}`));
          }
        }
      });
    });
  }
}
```

## Event Handling and Notifications

### SDK Event System

```typescript
// Event handling with SDK event types
class EventDrivenAgent extends BaseAgent {
  protected async registerEventHandlers(): Promise<void> {
    // Task status change events
    this.a2aClient.onTaskStatusUpdate(async (event: TaskStatusUpdateEvent) => {
      await this.handleTaskStatusUpdate(event);
    });

    // Task artifact updates
    this.a2aClient.onTaskArtifactUpdate(async (event: TaskArtifactUpdateEvent) => {
      await this.handleTaskArtifactUpdate(event);
    });

    // Direct messages
    this.a2aClient.onMessage(async (message: Message) => {
      await this.handleIncomingMessage(message);
    });
  }

  private async handleTaskStatusUpdate(event: TaskStatusUpdateEvent): Promise<void> {
    console.log(`Task ${event.taskId} status changed to ${event.state}`);

    if (event.state === TaskState.FAILED && event.error) {
      await this.handleTaskFailure(event.taskId, event.error);
    }
  }

  private async handleTaskArtifactUpdate(event: TaskArtifactUpdateEvent): Promise<void> {
    console.log(`New artifact ${event.artifactId} for task ${event.taskId}`);

    // Process artifact parts
    for (const part of event.parts) {
      if (part.type === "file") {
        await this.processFilePart(part as FilePart);
      } else if (part.type === "data") {
        await this.processDataPart(part as DataPart);
      }
    }
  }
}
```

## Error Handling and Resilience

### SDK-Based Error Handling

```typescript
// Error handling using SDK patterns
class ResilientAgent extends BaseAgent {
  async sendTaskWithRetry(task: Task, maxRetries: number = 3): Promise<void> {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        await this.a2aClient.sendTask(task);
        return; // Success
      } catch (error) {
        attempts++;

        if (attempts >= maxRetries) {
          throw new Error(`Failed to send task after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff
        const delay = Math.pow(2, attempts) * 1000;
        await this.sleep(delay);
      }
    }
  }

  async handleTaskWithFallback(task: Task): Promise<void> {
    try {
      await this.processTask(task);
    } catch (error) {
      // Try alternative processing approach
      await this.processTaskFallback(task, error);
    }
  }

  private async processTaskFallback(task: Task, originalError: Error): Promise<void> {
    // Update task with fallback processing
    await this.a2aClient.updateTaskStatus({
      taskId: task.id,
      state: TaskState.IN_PROGRESS,
      message: `Primary processing failed, using fallback: ${originalError.message}`,
    } as TaskStatusUpdateEvent);

    // Implement fallback logic
    // ...
  }
}
```

## Agent Coordination Patterns

### Multi-Agent Collaboration

```typescript
// Complex workflow involving multiple agents
class CollaborativeWorkflow {
  constructor(private a2aClient: A2AClient) {}

  async executeCodeReviewWorkflow(pullRequestId: string): Promise<ReviewResult> {
    const workflowId = `code-review-${pullRequestId}`;

    // Step 1: Git agent analyzes changes
    const gitAnalysisTask: Task = {
      id: `${workflowId}-git-analysis`,
      title: "Analyze Pull Request Changes",
      assignedTo: "git-agent",
      state: TaskState.PENDING,
      data: {
        action: "analyze_pull_request",
        pullRequestId: pullRequestId,
      },
    };

    await this.a2aClient.sendTask(gitAnalysisTask);
    const gitResults = await this.waitForTaskCompletion(gitAnalysisTask.id);

    // Step 2: Code review agent performs analysis
    const codeReviewTask: Task = {
      id: `${workflowId}-code-review`,
      title: "Perform Code Quality Analysis",
      assignedTo: "code-review-agent",
      state: TaskState.PENDING,
      data: {
        action: "analyze_code_quality",
        changes: gitResults.result.changes,
        files: gitResults.result.modifiedFiles,
      },
      dependencies: [gitAnalysisTask.id],
    };

    await this.a2aClient.sendTask(codeReviewTask);
    const reviewResults = await this.waitForTaskCompletion(codeReviewTask.id);

    // Step 3: Database agent stores results
    const storageTask: Task = {
      id: `${workflowId}-storage`,
      title: "Store Review Results",
      assignedTo: "database-agent",
      state: TaskState.PENDING,
      data: {
        action: "store_review_results",
        pullRequestId: pullRequestId,
        gitAnalysis: gitResults.result,
        codeReview: reviewResults.result,
      },
      dependencies: [codeReviewTask.id],
    };

    await this.a2aClient.sendTask(storageTask);
    await this.waitForTaskCompletion(storageTask.id);

    return {
      workflowId,
      gitAnalysis: gitResults.result,
      codeReview: reviewResults.result,
      status: "completed",
    };
  }
}
```

## Configuration and Integration

### SDK Configuration

```json
{
  "a2a-integration": {
    "sdk": {
      "version": "latest",
      "endpoint": "wss://a2a.example.com/ws",
      "authentication": {
        "type": "api-key",
        "key": "env:A2A_API_KEY"
      },
      "connection": {
        "reconnect": true,
        "heartbeat-interval": 30000,
        "max-reconnect-attempts": 5
      }
    },
    "mcp-integration": {
      "authorization-server": {
        "endpoint": "http://auth-server.internal:8080",
        "client-id": "git-agent",
        "client-secret": "env:AUTH_CLIENT_SECRET",
        "token-endpoint": "/oauth2/token"
      },
      "resource-servers": {
        "git-tools": {
          "endpoint": "http://localhost:8001",
          "required-scopes": ["git:read", "git:write", "github:api"]
        },
        "database-tools": {
          "endpoint": "http://localhost:8002",
          "required-scopes": ["db:read", "db:write"]
        },
        "code-analysis": {
          "endpoint": "http://localhost:8003",
          "required-scopes": ["code:scan", "security:audit"]
        }
        }
      },
      "tool-caching": {
        "enabled": true,
        "ttl": 3600,
        "max-cache-size": "100MB"
      }
    },
    "agent-config": {
      "registration": {
        "auto-register": true,
        "health-check-interval": 60000,
        "capability-announcement": true
      },
      "task-handling": {
        "max-concurrent-tasks": 10,
        "task-timeout": 300000,
        "retry-failed-tasks": true,
        "mcp-tool-timeout": 60000
      },
      "messaging": {
        "message-persistence": true,
        "delivery-confirmation": true,
        "priority-queuing": true
      }
    },
    "monitoring": {
      "metrics-enabled": true,
      "event-logging": true,
      "performance-tracking": true,
      "mcp-tool-metrics": true
    }
  }
}
```

### Agent Initialization with Both A2A SDK and MCP

```typescript
// Complete agent setup using both A2A SDK and MCP integration
class SpecialistAgentRunner {
  async initializeAgent(config: AgentConfiguration): Promise<BaseAgent> {
    // Create appropriate agent type
    let agent: BaseAgent;

    switch (config.type) {
      case "git":
        agent = new GitAgent(config);
        break;
      case "database":
        agent = new DatabaseAgent(config);
        break;
      case "code-review":
        agent = new CodeReviewAgent(config);
        break;
      default:
        throw new Error(`Unknown agent type: ${config.type}`);
    }

    // Initialize both A2A and MCP connections
    await agent.initialize();

    // Set up health monitoring for both systems
    this.setupHealthMonitoring(agent);

    // Register shutdown handlers
    this.registerShutdownHandlers(agent);

    return agent;
  }

  private setupHealthMonitoring(agent: BaseAgent): void {
    setInterval(async () => {
      // Monitor both A2A and MCP health
      const [a2aHealth, mcpHealth] = await Promise.all([agent.getA2AHealthStatus(), agent.getMCPHealthStatus()]);

      const combinedHealth = {
        overall: a2aHealth.healthy && mcpHealth.healthy,
        a2a: a2aHealth,
        mcp: mcpHealth,
        capabilities: agent.agentCard.capabilities,
        activeTools: mcpHealth.availableTools?.length || 0,
      };

      await agent.a2aClient.reportHealth(combinedHealth);
    }, 60000); // Report health every minute
  }

  private registerShutdownHandlers(agent: BaseAgent): void {
    process.on("SIGTERM", async () => {
      console.log("Graceful shutdown initiated...");

      // Shutdown both A2A and MCP connections
      await Promise.all([agent.a2aClient.disconnect(), agent.mcpClient.disconnect()]);

      process.exit(0);
    });
  }
}
```

## Performance Optimization with SDK

### Task Batching and MCP Tool Optimization

```typescript
// Optimized agent using both A2A batching and MCP tool caching
class OptimizedAgent extends BaseAgent {
  private taskQueue: Task[] = [];
  private processingBatch = false;
  private mcpToolCache: Map<string, CachedToolResult> = new Map();

  protected async registerTaskHandlers(): Promise<void> {
    // Batch process A2A tasks for efficiency
    this.a2aClient.onTaskReceived(async (task: Task) => {
      this.taskQueue.push(task);

      if (!this.processingBatch) {
        this.processingBatch = true;
        setTimeout(() => this.processBatchedTasks(), 100); // Batch delay
      }
    });
  }

  private async processBatchedTasks(): Promise<void> {
    const batch = this.taskQueue.splice(0, 10); // Process up to 10 tasks

    // Group tasks by MCP tool requirements for optimized execution
    const tasksByTool = this.groupTasksByMCPTools(batch);

    // Process each tool group in parallel
    const processPromises = Object.entries(tasksByTool).map(([toolName, tasks]) =>
      this.processMCPToolBatch(toolName, tasks)
    );

    await Promise.allSettled(processPromises);

    this.processingBatch = false;

    // Process remaining tasks if any
    if (this.taskQueue.length > 0) {
      setTimeout(() => this.processBatchedTasks(), 100);
    }
  }

  private async processMCPToolBatch(toolName: string, tasks: Task[]): Promise<void> {
    try {
      // Check if we can batch MCP tool calls
      if (this.canBatchMCPTool(toolName)) {
        const batchParameters = tasks.map((task) => task.data.parameters);
        const batchResult = await this.mcpClient.invokeTool(toolName, {
          batch: true,
          requests: batchParameters,
        });

        // Update individual A2A tasks with batch results
        tasks.forEach((task, index) => {
          this.updateTaskWithMCPResult(task, batchResult.results[index]);
        });
      } else {
        // Process individually with caching
        for (const task of tasks) {
          await this.processTaskWithMCPTools(task);
        }
      }
    } catch (error) {
      // Update all tasks in batch with error
      tasks.forEach((task) => {
        this.a2aClient.updateTaskStatus({
          taskId: task.id,
          state: TaskState.FAILED,
          message: `Batch processing failed: ${error.message}`,
          error: error,
        } as TaskStatusUpdateEvent);
      });
    }
  }

  private async processTaskWithMCPTools(task: Task): Promise<void> {
    try {
      // Check cache first
      const cacheKey = this.generateMCPCacheKey(task);
      const cachedResult = this.mcpToolCache.get(cacheKey);

      let mcpResult;
      if (cachedResult && !this.isCacheExpired(cachedResult)) {
        mcpResult = cachedResult.result;
      } else {
        // Execute MCP tool
        mcpResult = await this.mcpClient.invokeTool(task.data.mcpTool, task.data.parameters);

        // Cache result
        this.mcpToolCache.set(cacheKey, {
          result: mcpResult,
          timestamp: Date.now(),
          ttl: 300000, // 5 minutes
        });
      }

      // Update A2A task with MCP result
      await this.updateTaskWithMCPResult(task, mcpResult);
    } catch (error) {
      await this.a2aClient.updateTaskStatus({
        taskId: task.id,
        state: TaskState.FAILED,
        message: `MCP tool execution failed: ${error.message}`,
        error: error,
      } as TaskStatusUpdateEvent);
    }
  }

  private async updateTaskWithMCPResult(task: Task, mcpResult: any): Promise<void> {
    await this.a2aClient.updateTaskStatus({
      taskId: task.id,
      state: TaskState.COMPLETED,
      message: "Task completed using MCP tools",
      result: {
        mcpToolUsed: task.data.mcpTool,
        toolResult: mcpResult,
        executionTime: mcpResult.executionTime,
        fromCache: mcpResult.fromCache || false,
      },
    } as TaskStatusUpdateEvent);
  }
}
```

This updated A2A protocol documentation now properly integrates with MCP, providing:

## Integration Summary: A2A + MCP

### **Dual Protocol Architecture**

- **A2A SDK** handles **inter-agent communication**: task coordination, messaging, workflow orchestration
- **MCP** handles **tool access**: domain-specific tools, external systems, specialized capabilities

### **How They Work Together**

1. **Agent receives A2A task** → determines required MCP tools
2. **Executes MCP tools** → performs actual work (Git operations, database queries, code analysis)
3. **Returns results via A2A** → shares outcomes with other agents
4. **Coordinates workflows** → orchestrates complex multi-agent, multi-tool processes

### **Key Benefits**

1. **SDK-based communication** using `A2AClient` and standard SDK types for reliable agent coordination
2. **MCP tool integration** for accessing specialized domain tools (Git CLI, database clients, analyzers)
3. **Task-oriented workflows** with `Task`, `TaskState`, and comprehensive status management
4. **Built-in agent discovery** through `AgentCard` and capability matching
5. **Artifact sharing** using `FilePart` and `DataPart` for file and data exchange generated by MCP tools
6. **Event-driven architecture** with SDK event handlers for real-time coordination
7. **Performance optimizations** using both SDK batching and MCP tool caching
8. **Unified configuration** managing both A2A connections and MCP server endpoints

### **Example Workflow Integration**

```
User Request → A2A Orchestrator → Git Agent
                     ↓
Git Agent: A2A.receiveTask() → MCP.invokeTool('git-analysis') → A2A.sendResults()
                     ↓
Database Agent: A2A.receiveTask() → MCP.invokeTool('sql-executor') → A2A.sendResults()
                     ↓
Code Review Agent: A2A.receiveTask() → MCP.invokeTool('security-scanner') → A2A.broadcastAlert()
```

The approach now properly combines the proven A2A SDK foundation for agent communication with MCP's powerful tool access capabilities, creating a comprehensive system where agents can both collaborate effectively AND access their specialized tools seamlessly.
