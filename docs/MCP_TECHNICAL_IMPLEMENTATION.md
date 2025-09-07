# MCP Technical Implementation Guide for CodeBuddy

## 🏗️ Technical Architecture Deep Dive

### Overview

This document provides detailed technical specifications for integrating Model Context Protocol (MCP) into CodeBuddy, building upon the strategic proposal to create a comprehensive implementation guide.

## 📋 Prerequisites and Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "@modelcontextprotocol/client": "^0.5.0",
    "@modelcontextprotocol/server": "^0.5.0",
    "ws": "^8.14.0",
    "uuid": "^9.0.0",
    "zod": "^3.22.0",
    "jsonrpc-lite": "^2.2.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.0",
    "@types/uuid": "^9.0.0"
  }
}
```

### VS Code Extension Manifest Updates

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "codebuddy.mcp.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Model Context Protocol integration"
        },
        "codebuddy.mcp.servers": {
          "type": "array",
          "default": [],
          "description": "Configured MCP servers"
        },
        "codebuddy.mcp.security.strictMode": {
          "type": "boolean",
          "default": true,
          "description": "Enable strict security mode for MCP connections"
        }
      }
    },
    "commands": [
      {
        "command": "codebuddy.mcp.connectServer",
        "title": "CodeBuddy: Connect MCP Server"
      },
      {
        "command": "codebuddy.mcp.listConnections",
        "title": "CodeBuddy: List MCP Connections"
      },
      {
        "command": "codebuddy.mcp.serverStatus",
        "title": "CodeBuddy: MCP Server Status"
      }
    ]
  }
}
```

## 🔧 Core Implementation

### 1. MCP Client Service

```typescript
// src/services/mcp-client.service.ts
import { Client } from "@modelcontextprotocol/client";
import { WebSocketTransport } from "@modelcontextprotocol/client/websocket";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { SecurityManager } from "./mcp-security.service";

export interface MCPServerConfig {
  id: string;
  name: string;
  type: "websocket" | "stdio" | "http";
  uri: string;
  capabilities?: string[];
  credentials?: {
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
  };
  security?: {
    allowedMethods?: string[];
    requireAuth?: boolean;
    timeout?: number;
  };
}

export interface MCPConnection {
  id: string;
  client: Client;
  config: MCPServerConfig;
  status: "connected" | "disconnected" | "connecting" | "error";
  lastActivity: Date;
  capabilities: string[];
}

export class MCPClientService {
  private connections = new Map<string, MCPConnection>();
  private logger: Logger;
  private securityManager: SecurityManager;
  private eventEmitter = new vscode.EventEmitter<{
    type: "connection" | "disconnection" | "error" | "response";
    serverId: string;
    data?: any;
  }>();

  constructor() {
    this.logger = Logger.initialize("MCPClientService");
    this.securityManager = new SecurityManager();
  }

  /**
   * Connect to an MCP server
   */
  async connect(config: MCPServerConfig): Promise<MCPConnection> {
    this.logger.info(`Connecting to MCP server: ${config.name}`);

    try {
      // Validate security settings
      await this.securityManager.validateServerConfig(config);

      // Create transport based on type
      const transport = this.createTransport(config);

      // Create client
      const client = new Client({
        name: "CodeBuddy",
        version: vscode.extensions.getExtension("fiatinnovations.ola-code-buddy")?.packageJSON.version || "1.0.0",
      });

      // Connect
      await client.connect(transport);

      // Get server capabilities
      const capabilities = await this.getServerCapabilities(client);

      const connection: MCPConnection = {
        id: config.id,
        client,
        config,
        status: "connected",
        lastActivity: new Date(),
        capabilities,
      };

      this.connections.set(config.id, connection);

      this.eventEmitter.fire({
        type: "connection",
        serverId: config.id,
        data: { capabilities },
      });

      this.logger.info(`Successfully connected to MCP server: ${config.name}`);
      return connection;
    } catch (error) {
      this.logger.error(`Failed to connect to MCP server ${config.name}:`, error);
      throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection found for server: ${serverId}`);
    }

    try {
      await connection.client.close();
      connection.status = "disconnected";
      this.connections.delete(serverId);

      this.eventEmitter.fire({
        type: "disconnection",
        serverId,
      });

      this.logger.info(`Disconnected from MCP server: ${serverId}`);
    } catch (error) {
      this.logger.error(`Error disconnecting from MCP server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a request on an MCP server
   */
  async executeRequest(serverId: string, method: string, params?: any): Promise<any> {
    const connection = this.connections.get(serverId);
    if (!connection || connection.status !== "connected") {
      throw new Error(`No active connection to server: ${serverId}`);
    }

    try {
      // Security validation
      await this.securityManager.validateRequest(connection.config, method, params);

      // Update activity
      connection.lastActivity = new Date();

      // Execute request based on method type
      let response;
      if (method.startsWith("tools/")) {
        response = await this.executeTool(connection, method, params);
      } else if (method.startsWith("resources/")) {
        response = await this.getResource(connection, method, params);
      } else if (method.startsWith("prompts/")) {
        response = await this.getPrompt(connection, method, params);
      } else {
        // Generic request
        response = await connection.client.request({ method, params });
      }

      this.eventEmitter.fire({
        type: "response",
        serverId,
        data: { method, response },
      });

      return response;
    } catch (error) {
      this.logger.error(`MCP request failed for ${serverId}.${method}:`, error);

      this.eventEmitter.fire({
        type: "error",
        serverId,
        data: { method, error: error instanceof Error ? error.message : "Unknown error" },
      });

      throw error;
    }
  }

  /**
   * List available tools from a server
   */
  async listTools(serverId: string): Promise<any[]> {
    const response = await this.executeRequest(serverId, "tools/list");
    return response.tools || [];
  }

  /**
   * List available resources from a server
   */
  async listResources(serverId: string): Promise<any[]> {
    const response = await this.executeRequest(serverId, "resources/list");
    return response.resources || [];
  }

  /**
   * Get connection status
   */
  getConnectionStatus(serverId: string): MCPConnection | undefined {
    return this.connections.get(serverId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Health check for all connections
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const health = new Map<string, boolean>();

    for (const [serverId, connection] of this.connections) {
      try {
        await connection.client.request({ method: "ping" });
        health.set(serverId, true);
      } catch (error) {
        health.set(serverId, false);
        this.logger.warn(`Health check failed for server ${serverId}:`, error);
      }
    }

    return health;
  }

  private createTransport(config: MCPServerConfig) {
    switch (config.type) {
      case "websocket":
        return new WebSocketTransport(config.uri);
      case "stdio":
        return new StdioClientTransport({
          command: config.uri.split(" ")[0],
          args: config.uri.split(" ").slice(1),
        });
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  private async getServerCapabilities(client: Client): Promise<string[]> {
    try {
      const response = await client.request({ method: "initialize" });
      return response.capabilities ? Object.keys(response.capabilities) : [];
    } catch (error) {
      this.logger.warn("Failed to get server capabilities:", error);
      return [];
    }
  }

  private async executeTool(connection: MCPConnection, method: string, params: any): Promise<any> {
    const toolName = method.replace("tools/", "").replace("/call", "");
    return await connection.client.request({
      method: "tools/call",
      params: {
        name: toolName,
        arguments: params,
      },
    });
  }

  private async getResource(connection: MCPConnection, method: string, params: any): Promise<any> {
    const resourceUri = method.replace("resources/", "").replace("/read", "");
    return await connection.client.request({
      method: "resources/read",
      params: {
        uri: resourceUri,
        ...params,
      },
    });
  }

  private async getPrompt(connection: MCPConnection, method: string, params: any): Promise<any> {
    const promptName = method.replace("prompts/", "").replace("/get", "");
    return await connection.client.request({
      method: "prompts/get",
      params: {
        name: promptName,
        arguments: params,
      },
    });
  }

  dispose(): void {
    // Close all connections
    for (const connection of this.connections.values()) {
      try {
        connection.client.close();
      } catch (error) {
        this.logger.warn("Error closing MCP connection:", error);
      }
    }
    this.connections.clear();
    this.eventEmitter.dispose();
  }
}
```

### 2. Security Manager

```typescript
// src/services/mcp-security.service.ts
import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { MCPServerConfig } from "./mcp-client.service";

export interface SecurityPolicy {
  allowedServers: string[];
  blockedMethods: string[];
  maxRequestSize: number;
  timeoutMs: number;
  requireAuthentication: boolean;
  auditRequests: boolean;
}

export class SecurityManager {
  private logger: Logger;
  private policy: SecurityPolicy;

  constructor() {
    this.logger = Logger.initialize("MCPSecurityManager");
    this.policy = this.loadSecurityPolicy();
  }

  async validateServerConfig(config: MCPServerConfig): Promise<void> {
    // Check if server is in allow list
    if (this.policy.allowedServers.length > 0 && !this.policy.allowedServers.includes(config.id)) {
      throw new Error(`Server ${config.id} is not in the allowed list`);
    }

    // Validate URI format
    if (!this.isValidUri(config.uri)) {
      throw new Error(`Invalid URI format: ${config.uri}`);
    }

    // Check authentication requirements
    if (this.policy.requireAuthentication && !config.credentials) {
      throw new Error(`Authentication required for server ${config.id}`);
    }

    this.logger.info(`Security validation passed for server: ${config.id}`);
  }

  async validateRequest(config: MCPServerConfig, method: string, params?: any): Promise<void> {
    // Check blocked methods
    if (this.policy.blockedMethods.includes(method)) {
      throw new Error(`Method ${method} is blocked by security policy`);
    }

    // Check request size
    const requestSize = JSON.stringify(params || {}).length;
    if (requestSize > this.policy.maxRequestSize) {
      throw new Error(`Request size ${requestSize} exceeds maximum ${this.policy.maxRequestSize}`);
    }

    // Audit request if enabled
    if (this.policy.auditRequests) {
      this.auditRequest(config.id, method, params);
    }

    this.logger.debug(`Security validation passed for request: ${config.id}.${method}`);
  }

  private loadSecurityPolicy(): SecurityPolicy {
    const config = vscode.workspace.getConfiguration("codebuddy.mcp.security");

    return {
      allowedServers: config.get("allowedServers", []),
      blockedMethods: config.get("blockedMethods", ["system/", "file/write", "process/"]),
      maxRequestSize: config.get("maxRequestSize", 1024 * 1024), // 1MB
      timeoutMs: config.get("timeoutMs", 30000), // 30 seconds
      requireAuthentication: config.get("requireAuthentication", false),
      auditRequests: config.get("auditRequests", true),
    };
  }

  private isValidUri(uri: string): boolean {
    try {
      new URL(uri);
      return true;
    } catch {
      // Check if it's a command for stdio transport
      return /^[\w\-./]+(\s+[\w\-./]+)*$/.test(uri);
    }
  }

  private auditRequest(serverId: string, method: string, params?: any): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      serverId,
      method,
      paramsHash: params ? this.hashParams(params) : null,
    };

    this.logger.info("MCP Request Audit:", auditEntry);
  }

  private hashParams(params: any): string {
    // Simple hash for audit purposes
    return Buffer.from(JSON.stringify(params)).toString("base64").substring(0, 32);
  }
}
```

### 3. MCP-Enhanced AI Agents

```typescript
// src/agents/mcp-enhanced-agent.ts
import { BaseAgent } from "./base-agent";
import { MCPClientService } from "../services/mcp-client.service";
import { AgentContext, AgentResponse } from "./interface";

export class MCPEnhancedAgent extends BaseAgent {
  constructor(
    private mcpClient: MCPClientService,
    agentType: string
  ) {
    super(agentType);
  }

  async processQuery(query: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Analyze query to determine required MCP capabilities
      const requiredCapabilities = await this.analyzeQueryRequirements(query, context);

      // Find available servers with required capabilities
      const availableServers = this.findServersWithCapabilities(requiredCapabilities);

      if (availableServers.length === 0) {
        // Fallback to base agent behavior
        return await super.processQuery(query, context);
      }

      // Gather enhanced context from MCP servers
      const mcpContext = await this.gatherMCPContext(availableServers, query, context);

      // Merge contexts
      const enhancedContext: AgentContext = {
        ...context,
        mcpData: mcpContext,
        capabilities: requiredCapabilities,
      };

      // Process with enhanced context
      return await this.processWithMCPContext(query, enhancedContext);
    } catch (error) {
      this.logger.error("MCP-enhanced processing failed:", error);
      // Graceful fallback to base agent
      return await super.processQuery(query, context);
    }
  }

  private async analyzeQueryRequirements(query: string, context: AgentContext): Promise<string[]> {
    const capabilities: string[] = [];

    // Database-related queries
    if (/\b(database|sql|query|table|schema)\b/i.test(query)) {
      capabilities.push("database");
    }

    // Infrastructure-related queries
    if (/\b(kubernetes|docker|deploy|scale|pods?)\b/i.test(query)) {
      capabilities.push("kubernetes");
    }

    // Git-related queries
    if (/\b(git|commit|branch|merge|pr|pull request)\b/i.test(query)) {
      capabilities.push("git");
    }

    // File system queries
    if (/\b(file|directory|read|write|create)\b/i.test(query)) {
      capabilities.push("filesystem");
    }

    // API-related queries
    if (/\b(api|endpoint|rest|http|request)\b/i.test(query)) {
      capabilities.push("api");
    }

    // Monitoring queries
    if (/\b(logs|metrics|monitoring|performance|errors?)\b/i.test(query)) {
      capabilities.push("monitoring");
    }

    return capabilities;
  }

  private findServersWithCapabilities(requiredCapabilities: string[]): string[] {
    const connections = this.mcpClient.getAllConnections();
    const matchingServers: string[] = [];

    for (const connection of connections) {
      if (connection.status === "connected") {
        const hasRequiredCapabilities = requiredCapabilities.some((capability) =>
          connection.capabilities.includes(capability)
        );

        if (hasRequiredCapabilities) {
          matchingServers.push(connection.id);
        }
      }
    }

    return matchingServers;
  }

  private async gatherMCPContext(
    serverIds: string[],
    query: string,
    context: AgentContext
  ): Promise<Record<string, any>> {
    const mcpContext: Record<string, any> = {};

    const gatherPromises = serverIds.map(async (serverId) => {
      try {
        const contextData = await this.gatherServerContext(serverId, query, context);
        mcpContext[serverId] = contextData;
      } catch (error) {
        this.logger.warn(`Failed to gather context from server ${serverId}:`, error);
        mcpContext[serverId] = { error: error instanceof Error ? error.message : "Unknown error" };
      }
    });

    await Promise.allSettled(gatherPromises);
    return mcpContext;
  }

  private async gatherServerContext(serverId: string, query: string, context: AgentContext): Promise<any> {
    const connection = this.mcpClient.getConnectionStatus(serverId);
    if (!connection) return null;

    // Different strategies based on server capabilities
    if (connection.capabilities.includes("database")) {
      return await this.gatherDatabaseContext(serverId, query, context);
    }

    if (connection.capabilities.includes("kubernetes")) {
      return await this.gatherKubernetesContext(serverId, query, context);
    }

    if (connection.capabilities.includes("git")) {
      return await this.gatherGitContext(serverId, query, context);
    }

    if (connection.capabilities.includes("monitoring")) {
      return await this.gatherMonitoringContext(serverId, query, context);
    }

    // Generic context gathering
    return await this.gatherGenericContext(serverId, query, context);
  }

  private async gatherDatabaseContext(serverId: string, query: string, context: AgentContext): Promise<any> {
    const dbContext: any = {};

    try {
      // Get database schema
      dbContext.schema = await this.mcpClient.executeRequest(serverId, "database/schema");

      // Get recent query performance if query-related
      if (/\b(slow|performance|optimize)\b/i.test(query)) {
        dbContext.performance = await this.mcpClient.executeRequest(serverId, "database/performance");
      }

      // Get table statistics
      dbContext.statistics = await this.mcpClient.executeRequest(serverId, "database/statistics");
    } catch (error) {
      dbContext.error = error instanceof Error ? error.message : "Failed to gather database context";
    }

    return dbContext;
  }

  private async gatherKubernetesContext(serverId: string, query: string, context: AgentContext): Promise<any> {
    const k8sContext: any = {};

    try {
      // Get cluster info
      k8sContext.cluster = await this.mcpClient.executeRequest(serverId, "kubernetes/cluster-info");

      // Get pods status
      k8sContext.pods = await this.mcpClient.executeRequest(serverId, "kubernetes/pods");

      // Get services
      k8sContext.services = await this.mcpClient.executeRequest(serverId, "kubernetes/services");

      // Get recent events if troubleshooting
      if (/\b(error|fail|problem|issue)\b/i.test(query)) {
        k8sContext.events = await this.mcpClient.executeRequest(serverId, "kubernetes/events");
      }
    } catch (error) {
      k8sContext.error = error instanceof Error ? error.message : "Failed to gather Kubernetes context";
    }

    return k8sContext;
  }

  private async gatherGitContext(serverId: string, query: string, context: AgentContext): Promise<any> {
    const gitContext: any = {};

    try {
      // Get current branch and status
      gitContext.status = await this.mcpClient.executeRequest(serverId, "git/status");

      // Get recent commits
      gitContext.commits = await this.mcpClient.executeRequest(serverId, "git/log", { limit: 10 });

      // Get branches
      gitContext.branches = await this.mcpClient.executeRequest(serverId, "git/branches");

      // Get diff if relevant
      if (/\b(diff|change|modify)\b/i.test(query)) {
        gitContext.diff = await this.mcpClient.executeRequest(serverId, "git/diff");
      }
    } catch (error) {
      gitContext.error = error instanceof Error ? error.message : "Failed to gather Git context";
    }

    return gitContext;
  }

  private async gatherMonitoringContext(serverId: string, query: string, context: AgentContext): Promise<any> {
    const monitoringContext: any = {};

    try {
      // Get system metrics
      monitoringContext.metrics = await this.mcpClient.executeRequest(serverId, "monitoring/metrics");

      // Get recent logs if error-related
      if (/\b(error|exception|fail|log)\b/i.test(query)) {
        monitoringContext.logs = await this.mcpClient.executeRequest(serverId, "monitoring/logs", {
          level: "error",
          limit: 50,
        });
      }

      // Get alerts
      monitoringContext.alerts = await this.mcpClient.executeRequest(serverId, "monitoring/alerts");
    } catch (error) {
      monitoringContext.error = error instanceof Error ? error.message : "Failed to gather monitoring context";
    }

    return monitoringContext;
  }

  private async gatherGenericContext(serverId: string, query: string, context: AgentContext): Promise<any> {
    try {
      // Try to get available resources
      const resources = await this.mcpClient.listResources(serverId);
      const tools = await this.mcpClient.listTools(serverId);

      return {
        resources: resources.slice(0, 10), // Limit to avoid overwhelming context
        tools: tools.slice(0, 10),
        capabilities: this.mcpClient.getConnectionStatus(serverId)?.capabilities || [],
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to gather generic context" };
    }
  }

  private async processWithMCPContext(query: string, enhancedContext: AgentContext): Promise<AgentResponse> {
    // Enhanced processing logic with MCP context
    const mcpData = enhancedContext.mcpData || {};

    // Create enriched prompt with MCP context
    const enrichedPrompt = this.createEnrichedPrompt(query, enhancedContext, mcpData);

    // Process with the enhanced prompt
    const response = await this.llm.run(enrichedPrompt);

    return {
      content: response,
      context: enhancedContext,
      mcpData,
      timestamp: new Date(),
    };
  }

  private createEnrichedPrompt(query: string, context: AgentContext, mcpData: Record<string, any>): string {
    let prompt = `User Query: ${query}\n\n`;

    // Add codebase context
    if (context.activeFileContent) {
      prompt += `Current File Context:\n${context.activeFileContent}\n\n`;
    }

    // Add MCP context
    if (Object.keys(mcpData).length > 0) {
      prompt += `Real-time System Context:\n`;

      for (const [serverId, data] of Object.entries(mcpData)) {
        if (data && !data.error) {
          prompt += `\n${serverId} Data:\n${JSON.stringify(data, null, 2)}\n`;
        }
      }
      prompt += "\n";
    }

    prompt += `Please provide a comprehensive response that takes into account both the code context and the real-time system information provided above.`;

    return prompt;
  }
}
```

### 4. MCP Server Examples

```typescript
// src/mcp-servers/database-server.ts
import { Server } from "@modelcontextprotocol/server";
import { z } from "zod";

export class DatabaseMCPServer {
  private server: Server;

  constructor(private databaseConfig: any) {
    this.server = new Server(
      {
        name: "database-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tool: Execute Query
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "execute_query":
          return await this.executeQuery(args.sql, args.params);
        case "get_schema":
          return await this.getSchema(args.database);
        case "optimize_query":
          return await this.optimizeQuery(args.query);
        case "get_performance_stats":
          return await this.getPerformanceStats();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Resource: Database Schema
    this.server.setRequestHandler("resources/read", async (request) => {
      const { uri } = request.params;

      if (uri === "database://schema") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(await this.getFullSchema()),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // List available tools
    this.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [
          {
            name: "execute_query",
            description: "Execute a SQL query",
            inputSchema: {
              type: "object",
              properties: {
                sql: { type: "string" },
                params: { type: "array" },
              },
              required: ["sql"],
            },
          },
          {
            name: "get_schema",
            description: "Get database schema",
            inputSchema: {
              type: "object",
              properties: {
                database: { type: "string" },
              },
            },
          },
          {
            name: "optimize_query",
            description: "Get query optimization suggestions",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string" },
              },
              required: ["query"],
            },
          },
        ],
      };
    });
  }

  private async executeQuery(sql: string, params?: any[]): Promise<any> {
    // Implementation depends on your database client
    // This is a placeholder
    try {
      // Execute query with your database client
      const result = await this.databaseConfig.client.query(sql, params);
      return {
        success: true,
        data: result.rows || result,
        rowCount: result.rowCount || result.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Query execution failed",
      };
    }
  }

  private async getSchema(database?: string): Promise<any> {
    // Get database schema information
    try {
      const tables = await this.databaseConfig.client.query(
        `
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = $1
        ORDER BY table_name, ordinal_position
      `,
        [database || "public"]
      );

      const schema = {};
      for (const row of tables.rows) {
        if (!schema[row.table_name]) {
          schema[row.table_name] = [];
        }
        schema[row.table_name].push({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === "YES",
        });
      }

      return { schema, database: database || "public" };
    } catch (error) {
      throw new Error(`Failed to get schema: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async optimizeQuery(query: string): Promise<any> {
    try {
      // Get query execution plan
      const plan = await this.databaseConfig.client.query(`EXPLAIN ANALYZE ${query}`);

      // Analyze plan and provide suggestions
      const suggestions = this.analyzeExecutionPlan(plan.rows);

      return {
        original_query: query,
        execution_plan: plan.rows,
        suggestions,
        estimated_improvement: this.calculateImprovementEstimate(suggestions),
      };
    } catch (error) {
      throw new Error(`Query optimization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async getPerformanceStats(): Promise<any> {
    try {
      // Get database performance statistics
      const stats = await this.databaseConfig.client.query(`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins,
          n_tup_upd,
          n_tup_del
        FROM pg_stat_user_tables
        ORDER BY seq_scan DESC
        LIMIT 20
      `);

      return {
        table_stats: stats.rows,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get performance stats: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private analyzeExecutionPlan(planRows: any[]): string[] {
    const suggestions: string[] = [];

    for (const row of planRows) {
      const line = row["QUERY PLAN"];

      if (line.includes("Seq Scan")) {
        suggestions.push("Consider adding an index to avoid sequential scans");
      }

      if (line.includes("cost=") && line.includes("rows=")) {
        const cost = parseFloat(line.match(/cost=[\d.]+\.\.(\d+\.\d+)/)?.[1] || "0");
        if (cost > 1000) {
          suggestions.push("High query cost detected - consider query optimization");
        }
      }

      if (line.includes("Sort") && line.includes("external")) {
        suggestions.push("Sort operation using external storage - consider increasing work_mem");
      }
    }

    return suggestions;
  }

  private calculateImprovementEstimate(suggestions: string[]): string {
    if (suggestions.length === 0) return "No improvements needed";
    if (suggestions.length <= 2) return "10-30% potential improvement";
    if (suggestions.length <= 4) return "30-60% potential improvement";
    return "60%+ potential improvement";
  }

  async start(transport: any): Promise<void> {
    await this.server.connect(transport);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}
```

### 5. Configuration Management

```typescript
// src/services/mcp-config.service.ts
import * as vscode from "vscode";
import { MCPServerConfig } from "./mcp-client.service";
import { Logger } from "../infrastructure/logger/logger";

export class MCPConfigService {
  private logger: Logger;
  private configKey = "codebuddy.mcp.servers";

  constructor() {
    this.logger = Logger.initialize("MCPConfigService");
  }

  async getServerConfigs(): Promise<MCPServerConfig[]> {
    const config = vscode.workspace.getConfiguration();
    const servers = config.get<MCPServerConfig[]>(this.configKey, []);

    // Validate configurations
    return servers.filter((server) => this.validateConfig(server));
  }

  async addServerConfig(config: MCPServerConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid server configuration");
    }

    const servers = await this.getServerConfigs();

    // Check for duplicate IDs
    if (servers.some((s) => s.id === config.id)) {
      throw new Error(`Server with ID ${config.id} already exists`);
    }

    servers.push(config);
    await this.saveServerConfigs(servers);

    this.logger.info(`Added MCP server configuration: ${config.name}`);
  }

  async updateServerConfig(id: string, updates: Partial<MCPServerConfig>): Promise<void> {
    const servers = await this.getServerConfigs();
    const index = servers.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Server with ID ${id} not found`);
    }

    servers[index] = { ...servers[index], ...updates };

    if (!this.validateConfig(servers[index])) {
      throw new Error("Updated configuration is invalid");
    }

    await this.saveServerConfigs(servers);
    this.logger.info(`Updated MCP server configuration: ${id}`);
  }

  async removeServerConfig(id: string): Promise<void> {
    const servers = await this.getServerConfigs();
    const filtered = servers.filter((s) => s.id !== id);

    if (filtered.length === servers.length) {
      throw new Error(`Server with ID ${id} not found`);
    }

    await this.saveServerConfigs(filtered);
    this.logger.info(`Removed MCP server configuration: ${id}`);
  }

  private async saveServerConfigs(servers: MCPServerConfig[]): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    await config.update(this.configKey, servers, vscode.ConfigurationTarget.Global);
  }

  private validateConfig(config: MCPServerConfig): boolean {
    if (!config.id || !config.name || !config.type || !config.uri) {
      return false;
    }

    const validTypes = ["websocket", "stdio", "http"];
    if (!validTypes.includes(config.type)) {
      return false;
    }

    return true;
  }

  // Predefined server configurations
  getPresetConfigs(): MCPServerConfig[] {
    return [
      {
        id: "git-server",
        name: "Git Server",
        type: "stdio",
        uri: "mcp-git-server",
        capabilities: ["git", "version-control"],
      },
      {
        id: "filesystem-server",
        name: "File System Server",
        type: "stdio",
        uri: "mcp-filesystem-server",
        capabilities: ["filesystem", "files"],
      },
      {
        id: "database-server",
        name: "Database Server",
        type: "websocket",
        uri: "ws://localhost:8080/mcp",
        capabilities: ["database", "sql"],
        security: {
          requireAuth: true,
          allowedMethods: ["query", "schema", "optimize"],
        },
      },
    ];
  }
}
```

## 🔌 VS Code Integration

### Command Implementations

```typescript
// src/commands/mcp-commands.ts
import * as vscode from "vscode";
import { MCPClientService } from "../services/mcp-client.service";
import { MCPConfigService } from "../services/mcp-config.service";

export class MCPCommands {
  constructor(
    private mcpClient: MCPClientService,
    private configService: MCPConfigService
  ) {}

  async connectServer(): Promise<void> {
    try {
      const configs = await this.configService.getServerConfigs();
      const presets = this.configService.getPresetConfigs();

      const allConfigs = [...configs, ...presets];
      const options = allConfigs.map((config) => ({
        label: config.name,
        description: `${config.type} - ${config.uri}`,
        config,
      }));

      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: "Select an MCP server to connect to",
      });

      if (selected) {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Connecting to ${selected.config.name}...`,
            cancellable: false,
          },
          async () => {
            await this.mcpClient.connect(selected.config);
          }
        );

        vscode.window.showInformationMessage(`Connected to ${selected.config.name}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async listConnections(): Promise<void> {
    const connections = this.mcpClient.getAllConnections();

    if (connections.length === 0) {
      vscode.window.showInformationMessage("No active MCP connections");
      return;
    }

    const panel = vscode.window.createWebviewPanel("mcpConnections", "MCP Connections", vscode.ViewColumn.One, {
      enableScripts: true,
    });

    panel.webview.html = this.generateConnectionsHtml(connections);
  }

  async serverStatus(): Promise<void> {
    try {
      const healthStatus = await this.mcpClient.healthCheck();
      const connections = this.mcpClient.getAllConnections();

      let statusMessage = "**MCP Server Status**\n\n";

      for (const connection of connections) {
        const isHealthy = healthStatus.get(connection.id);
        const status = connection.status;
        const emoji = isHealthy ? "✅" : "❌";

        statusMessage += `${emoji} **${connection.config.name}**\n`;
        statusMessage += `   Status: ${status}\n`;
        statusMessage += `   Type: ${connection.config.type}\n`;
        statusMessage += `   URI: ${connection.config.uri}\n`;
        statusMessage += `   Capabilities: ${connection.capabilities.join(", ")}\n`;
        statusMessage += `   Last Activity: ${connection.lastActivity.toLocaleString()}\n\n`;
      }

      const document = await vscode.workspace.openTextDocument({
        content: statusMessage,
        language: "markdown",
      });

      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to get server status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private generateConnectionsHtml(connections: any[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: var(--vscode-font-family); }
          .connection { 
            border: 1px solid var(--vscode-panel-border);
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
          }
          .status-connected { border-left: 4px solid #00ff00; }
          .status-disconnected { border-left: 4px solid #ff0000; }
          .capabilities { 
            background: var(--vscode-textCodeBlock-background);
            padding: 5px;
            border-radius: 3px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>MCP Connections</h1>
        ${connections
          .map(
            (conn) => `
          <div class="connection status-${conn.status}">
            <h3>${conn.config.name}</h3>
            <p><strong>Status:</strong> ${conn.status}</p>
            <p><strong>Type:</strong> ${conn.config.type}</p>
            <p><strong>URI:</strong> ${conn.config.uri}</p>
            <p><strong>Capabilities:</strong></p>
            <div class="capabilities">${conn.capabilities.join(", ")}</div>
            <p><strong>Last Activity:</strong> ${conn.lastActivity.toLocaleString()}</p>
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;
  }
}
```

## 📊 Testing Strategy

### Unit Tests

```typescript
// src/test/mcp-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from "mocha";
import { MCPClientService, MCPServerConfig } from "../services/mcp-client.service";

describe("MCPClientService", () => {
  let mcpClient: MCPClientService;
  let mockServerConfig: MCPServerConfig;

  beforeEach(() => {
    mcpClient = new MCPClientService();
    mockServerConfig = {
      id: "test-server",
      name: "Test Server",
      type: "websocket",
      uri: "ws://localhost:8080/mcp",
      capabilities: ["test"],
    };
  });

  afterEach(() => {
    mcpClient.dispose();
  });

  describe("connect", () => {
    it("should successfully connect to a valid server", async () => {
      // Mock transport would be needed here
      // const connection = await mcpClient.connect(mockServerConfig);
      // expect(connection.status).to.equal('connected');
    });

    it("should handle connection failures gracefully", async () => {
      const invalidConfig = {
        ...mockServerConfig,
        uri: "invalid://uri",
      };

      try {
        await mcpClient.connect(invalidConfig);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("executeRequest", () => {
    it("should execute requests on connected servers", async () => {
      // Test implementation
    });

    it("should handle request failures", async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

```typescript
// src/test/mcp-integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from "mocha";
import { MCPEnhancedAgent } from "../agents/mcp-enhanced-agent";
import { MCPClientService } from "../services/mcp-client.service";

describe("MCP Integration", () => {
  let agent: MCPEnhancedAgent;
  let mcpClient: MCPClientService;

  beforeEach(async () => {
    mcpClient = new MCPClientService();
    agent = new MCPEnhancedAgent(mcpClient, "test-agent");
  });

  afterEach(() => {
    mcpClient.dispose();
  });

  it("should enhance queries with MCP context", async () => {
    // Set up mock MCP server
    // Test query processing with MCP context
  });

  it("should fallback gracefully when MCP is unavailable", async () => {
    // Test graceful degradation
  });
});
```

## 🚀 Deployment and Distribution

### Extension Packaging Updates

```json
{
  "scripts": {
    "package:mcp": "npm run compile && npm run build:webview && node esbuild-mcp.js --production",
    "test:mcp": "npm run compile && npm run test -- --grep 'MCP'",
    "dev:mcp-servers": "concurrently \"npm run dev:db-server\" \"npm run dev:git-server\""
  }
}
```

### Build Configuration

```javascript
// esbuild-mcp.js
const esbuild = require("esbuild");

const production = process.argv.includes("--production");

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts", "src/mcp-servers/database-server.ts", "src/mcp-servers/git-server.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outdir: "dist",
    external: ["vscode"],
    define: {
      "process.env.NODE_ENV": production ? '"production"' : '"development"',
    },
  });

  if (production) {
    await ctx.rebuild();
    await ctx.dispose();
  } else {
    await ctx.watch();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## 📈 Performance Considerations

### Connection Pooling

```typescript
// src/services/mcp-connection-pool.ts
export class MCPConnectionPool {
  private pools = new Map<string, MCPConnection[]>();
  private maxConnections = 5;

  async getConnection(serverId: string): Promise<MCPConnection> {
    const pool = this.pools.get(serverId) || [];

    // Find available connection
    const available = pool.find((conn) => conn.status === "connected");
    if (available) {
      return available;
    }

    // Create new connection if under limit
    if (pool.length < this.maxConnections) {
      const newConnection = await this.createConnection(serverId);
      pool.push(newConnection);
      this.pools.set(serverId, pool);
      return newConnection;
    }

    throw new Error(`No available connections for server: ${serverId}`);
  }
}
```

### Caching Strategy

```typescript
// src/services/mcp-cache.service.ts
export class MCPCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any, ttl: number = 300000): void {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
}
```

## 🔧 Monitoring and Observability

### Metrics Collection

```typescript
// src/services/mcp-metrics.service.ts
export class MCPMetricsService {
  private metrics = {
    connectionsTotal: 0,
    requestsTotal: 0,
    errorsTotal: 0,
    requestDuration: new Map<string, number[]>(),
  };

  recordConnection(serverId: string): void {
    this.metrics.connectionsTotal++;
  }

  recordRequest(serverId: string, method: string, duration: number): void {
    this.metrics.requestsTotal++;

    const key = `${serverId}.${method}`;
    if (!this.metrics.requestDuration.has(key)) {
      this.metrics.requestDuration.set(key, []);
    }
    this.metrics.requestDuration.get(key)!.push(duration);
  }

  recordError(serverId: string, error: Error): void {
    this.metrics.errorsTotal++;
  }

  getMetrics(): any {
    return {
      ...this.metrics,
      averageRequestDuration: this.calculateAverages(),
    };
  }

  private calculateAverages(): Record<string, number> {
    const averages: Record<string, number> = {};

    for (const [key, durations] of this.metrics.requestDuration) {
      const sum = durations.reduce((a, b) => a + b, 0);
      averages[key] = sum / durations.length;
    }

    return averages;
  }
}
```

---

This technical implementation guide provides a comprehensive foundation for integrating MCP into CodeBuddy. The modular architecture ensures maintainability and extensibility while the security framework provides enterprise-grade protection. The implementation can be executed in phases, allowing for iterative development and testing.

**Next Steps:**

1. Set up development environment with MCP SDK
2. Implement core MCPClientService
3. Create basic MCP servers (Git, Database)
4. Integrate with existing AI agents
5. Add comprehensive testing
6. Deploy and monitor in production

_This implementation transforms CodeBuddy from a VS Code extension into a comprehensive AI-powered development platform._
