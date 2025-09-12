# MCP Server Implementations and Use Cases for CodeBuddy

## 🎯 Overview

This document provides detailed implementations following the **official MCP architecture** where a single MCP server hosts multiple tools, and specialized CodeBuddy agents act as MCP clients coordinated by the A2A (Agent-to-Agent) protocol. This architecture showcases how proper MCP integration transforms CodeBuddy into a comprehensive development ecosystem.

## 🏗️ Architecture Correction

**Official MCP Pattern:**

- **Single MCP Server** → Hosts all tools (database, git, file system, code analysis)
- **Multiple MCP Clients** → CodeBuddy's specialized agents connect as clients
- **A2A Coordination** → Agents coordinate tasks and share knowledge via @a2a-js/sdk
- **Tool Filtering** → Each agent uses only tools relevant to its specialization

```mermaid
graph TB
    subgraph "CodeBuddy Extension (MCP Host + A2A Client)"
        CE[VS Code Extension]
        A2AO[A2A Orchestrator]
        UI[React Chat UI]
        DB[(SQLite Cache)]
    end

    subgraph "Specialized A2A Agent Servers"
        subgraph "Database Agent (:4001)"
            DAS[A2A Express Server]
            DAE[Database Agent Executor]
            DAM[MCP Client Connection]
        end

        subgraph "Git Agent (:4002)"
            GAS[A2A Express Server]
            GAE[Git Agent Executor]
            GAM[MCP Client Connection]
        end

        subgraph "Code Agent (:4003)"
            CAS[A2A Express Server]
            CAE[Code Agent Executor]
            CAM[MCP Client Connection]
        end

        subgraph "File Agent (:4004)"
            FAS[A2A Express Server]
            FAE[File Agent Executor]
            FAM[MCP Client Connection]
        end
    end

    subgraph "Single CodeBuddy MCP Server"
        MCP[MCP Server]

        subgraph "All Development Tools"
            DBT[Database Tools:<br/>• execute_query<br/>• get_schema<br/>• optimize_query<br/>• analyze_performance]
            GT[Git Tools:<br/>• git_status<br/>• git_log<br/>• create_branch<br/>• analyze_commits]
            FT[File Tools:<br/>• read_file<br/>• write_file<br/>• list_directory<br/>• analyze_structure]
            CT[Code Tools:<br/>• parse_ast<br/>• analyze_quality<br/>• generate_docs<br/>• refactor_code]
        end
    end

    CE --> A2AO
    CE --> UI
    CE --> DB

    A2AO -.-> DAS
    A2AO -.-> GAS
    A2AO -.-> CAS
    A2AO -.-> FAS

    DAS --> DAE --> DAM
    GAS --> GAE --> GAM
    CAS --> CAE --> CAM
    FAS --> FAE --> FAM

    DAM --> MCP["MCP Client (DB tools only)"]
    GAM --> MCP["MCP Client (Git tools only)"]
    CAM --> MCP["MCP Client (Code tools only)"]
    FAM --> MCP["MCP Client (File tools only)"]

    MCP --> DBT
    MCP --> GT
    MCP --> FT
    MCP --> CT
```

## 🏗️ Corrected MCP Implementation

### 1. Single CodeBuddy MCP Server (Official Pattern)

**Purpose**: Hosts ALL tools and capabilities in one server, following official MCP architecture.

#### Complete Implementation

```typescript
// src/mcp-server/codebuddy-mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "pg"; // PostgreSQL client
import { simpleGit } from "simple-git";
import * as fs from "fs/promises";
import * as path from "path";
import { createHash } from "crypto";

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface QueryOptimization {
  original_query: string;
  optimized_query: string;
  explanation: string;
  estimated_improvement: string;
  recommendations: string[];
}

export class CodeBuddyMCPServer {
  private server: Server;
  private dbClient: Client;
  private git: any;
  private queryCache = new Map<string, any>();
  private workspaceRoot: string;

  constructor(private dbConfig: DatabaseConfig, workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.server = new Server(
      { name: "codebuddy-mcp-server", version: "1.0.0" },
      {
        capabilities: {
          tools: { listChanged: true },
          resources: { listChanged: true },
          prompts: {}
        }
      }
    );

    this.dbClient = new Client(dbConfig);
    this.git = simpleGit(workspaceRoot);
    this.setupAllHandlers();
  }

  async start(): Promise<void> {
    await this.dbClient.connect();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("Intelligent Database MCP Server started");
  }

  private setupAllHandlers(): void {
    // Single server hosts ALL tools from all domains
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        // Database Tools
        {
          name: "execute_query",
          description: "Execute SQL query with analysis",
          inputSchema: {
            type: "object",
            properties: {
              sql: { type: "string" },
              analyze: { type: "boolean", default: true }
            },
            required: ["sql"]
          }
        },
        {
          name: "get_database_schema",
          description: "Get comprehensive database schema",
          inputSchema: {
            type: "object",
            properties: {
              database: { type: "string" },
              include_stats: { type: "boolean", default: true }
            }
          }
        },
        {
          name: "optimize_query",
          description: "Analyze and optimize SQL query performance",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" },
              explain: { type: "boolean", default: true }
            },
            required: ["query"]
          }
        },
        // Git Tools
        {
          name: "git_status",
          description: "Get detailed Git repository status",
          inputSchema: {
            type: "object",
            properties: {
              include_untracked: { type: "boolean", default: true }
            }
          }
        },
        {
          name: "git_log",
          description: "Get Git commit history with analysis",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number", default: 20 },
              since: { type: "string" },
              author: { type: "string" }
            }
          }
        },
        {
          name: "analyze_branch_health",
          description: "Analyze Git branch health and suggest actions",
          inputSchema: {
            type: "object",
            properties: {
              branch: { type: "string" },
              include_recommendations: { type: "boolean", default: true }
            }
          }
        },
        // File System Tools
        {
          name: "read_file_content",
          description: "Read and analyze file content",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
              include_metadata: { type: "boolean", default: true }
            },
            required: ["path"]
          }
        },
        {
          name: "list_directory",
          description: "List directory contents with analysis",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
              recursive: { type: "boolean", default: false },
              include_hidden: { type: "boolean", default: false }
            },
            required: ["path"]
          }
        },
        // Code Analysis Tools
        {
          name: "parse_code_ast",
          description: "Parse code into Abstract Syntax Tree",
          inputSchema: {
            type: "object",
            properties: {
              code: { type: "string" },
              language: { type: "string" },
              include_locations: { type: "boolean", default: true }
            },
            required: ["code", "language"]
          }
        },
        {
          name: "analyze_code_quality",
          description: "Analyze code quality and suggest improvements",
          inputSchema: {
            type: "object",
            properties: {
              file_path: { type: "string" },
              include_metrics: { type: "boolean", default: true }
            },
            required: ["file_path"]
          }
        },
        {
          name: "optimize_query",
          description: "Optimize a specific SQL query",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" },
              explain: { type: "boolean", default: true },
            },
            required: ["query"],
          },
        },
        {
          name: "schema_analysis",
          description: "Analyze database schema and suggest improvements",
          inputSchema: {
            type: "object",
            properties: {
              table_name: { type: "string" },
              deep_analysis: { type: "boolean", default: false },
            },
          },
        },
        {
          name: "performance_monitoring",
          description: "Get real-time database performance metrics",
          inputSchema: {
            type: "object",
            properties: {
              include_locks: { type: "boolean", default: true },
              include_connections: { type: "boolean", default: true },
            },
          },
        },
        {
          name: "generate_test_data",
          description: "Generate realistic test data for tables",
          inputSchema: {
            type: "object",
            properties: {
              table_name: { type: "string" },
              row_count: { type: "number", default: 100 },
              realistic: { type: "boolean", default: true },
            },
            required: ["table_name"],
          },
        },
      ],
    }));

    }));

    // Single handler routes to all tool implementations
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      // Route to appropriate domain handler
      if (name.startsWith("execute_query") || name.startsWith("get_database") || name.startsWith("optimize_query")) {
        return await this.handleDatabaseTool(name, args);
      } else if (name.startsWith("git_") || name.startsWith("analyze_branch")) {
        return await this.handleGitTool(name, args);
      } else if (name.startsWith("read_file") || name.startsWith("list_directory")) {
        return await this.handleFileTool(name, args);
      } else if (name.startsWith("parse_code") || name.startsWith("analyze_code")) {
        return await this.handleCodeTool(name, args);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Resources handler for all domains
    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: "database://live-schema",
          name: "Live Database Schema",
          mimeType: "application/json",
          description: "Real-time database schema with statistics"
        },
        {
          uri: "git://repository-status",
          name: "Git Repository Status",
          mimeType: "application/json",
          description: "Current Git status and branch information"
        },
        {
          uri: "filesystem://workspace-structure",
          name: "Workspace Structure",
          mimeType: "application/json",
          description: "Current workspace file structure"
        },
        {
          uri: "codeanalysis://quality-metrics",
          name: "Code Quality Metrics",
          mimeType: "application/json",
          description: "Overall codebase quality analysis"
        }
      ]
    }));
  }

  // Database tool implementations
  private async handleDatabaseTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "execute_query":
        return await this.executeQuery(args.sql, args.analyze);
      case "get_database_schema":
        return await this.getDatabaseSchema(args.database, args.include_stats);
      case "optimize_query":
        return await this.optimizeQuery(args.query, args.explain);
      default:
        throw new Error(`Unknown database tool: ${name}`);
    }
  }

  // Git tool implementations
  private async handleGitTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "git_status":
        return await this.getGitStatus(args.include_untracked);
      case "git_log":
        return await this.getGitLog(args.limit, args.since, args.author);
      case "analyze_branch_health":
        return await this.analyzeBranchHealth(args.branch, args.include_recommendations);
      default:
        throw new Error(`Unknown git tool: ${name}`);
    }
  }

  // File system tool implementations
  private async handleFileTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "read_file_content":
        return await this.readFileContent(args.path, args.include_metadata);
      case "list_directory":
        return await this.listDirectory(args.path, args.recursive, args.include_hidden);
      default:
        throw new Error(`Unknown file tool: ${name}`);
    }
  }

  // Code analysis tool implementations
  private async handleCodeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "parse_code_ast":
        return await this.parseCodeAST(args.code, args.language, args.include_locations);
      case "analyze_code_quality":
        return await this.analyzeCodeQuality(args.file_path, args.include_metrics);
      default:
        throw new Error(`Unknown code tool: ${name}`);
    }
  }

    // Resources Handler
    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: "database://live-schema",
          name: "Live Database Schema",
          mimeType: "application/json",
          description: "Real-time database schema with statistics",
        },
        {
          uri: "database://query-history",
          name: "Query History",
          mimeType: "application/json",
          description: "Recent query execution history and performance",
        },
      ],
    }));

    this.server.setRequestHandler("resources/read", async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case "database://live-schema":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(await this.getLiveSchema()),
              },
            ],
          };

        case "database://query-history":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(await this.getQueryHistory()),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  // Database tool implementations
  private async executeQuery(sql: string, analyze: boolean = true): Promise<any> {
    try {
      const result = await this.dbClient.query(sql);

      let analysisData = null;
      if (analyze && sql.toLowerCase().startsWith('select')) {
        // Get query execution plan
        const explainResult = await this.dbClient.query(`EXPLAIN (ANALYZE true, BUFFERS true, FORMAT JSON) ${sql}`);
        analysisData = explainResult.rows[0]["QUERY PLAN"][0];
      }

      return {
        success: true,
        data: {
          rows: result.rows,
          rowCount: result.rowCount,
          analysis: analysisData,
          executionTime: analysisData?."Execution Time"
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Query execution failed"
      };
    }
  }

  private async getDatabaseSchema(database: string = "public", includeStats: boolean = true): Promise<any> {
    try {
      const schemaQuery = `
        SELECT
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = $1
        ORDER BY t.table_name, c.ordinal_position
      `;

      const result = await this.dbClient.query(schemaQuery, [database]);

      // Group by table
      const schema = {};
      for (const row of result.rows) {
        if (!schema[row.table_name]) {
          schema[row.table_name] = { columns: [] };
        }
        if (row.column_name) {
          schema[row.table_name].columns.push({
            name: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable === "YES",
            default: row.column_default
          });
        }
      }

      return { success: true, data: { schema, database } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Schema retrieval failed"
      };
    }
  }

  // Git tool implementations
  private async getGitStatus(includeUntracked: boolean = true): Promise<any> {
    try {
      const status = await this.git.status();

      return {
        success: true,
        data: {
          current_branch: status.current,
          files: status.files,
          ahead: status.ahead,
          behind: status.behind,
          tracking: status.tracking,
          isClean: status.isClean()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Git status failed"
      };
    }
  }

  private async getGitLog(limit: number = 20, since?: string, author?: string): Promise<any> {
    try {
      const options: any = { maxCount: limit };
      if (since) options.since = since;
      if (author) options.author = author;

      const log = await this.git.log(options);

      return {
        success: true,
        data: {
          total: log.total,
          commits: log.all.map(commit => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author_name,
            date: commit.date,
            refs: commit.refs
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Git log failed"
      };
    }
  }

  private async analyzeBranchHealth(branch?: string, includeRecommendations: boolean = true): Promise<any> {
    try {
      const currentBranch = branch || (await this.git.branch()).current;
      const status = await this.git.status();
      const log = await this.git.log({ from: currentBranch, maxCount: 10 });

      const health = {
        branch_name: currentBranch,
        uncommitted_changes: status.files.length,
        recent_commits: log.total,
        last_commit_date: log.latest?.date,
        recommendations: includeRecommendations ? this.generateBranchRecommendations(status, log) : []
      };

      return { success: true, data: health };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Branch analysis failed"
      };
    }
  }

  // File system tool implementations
  private async readFileContent(filePath: string, includeMetadata: boolean = true): Promise<any> {
    try {
      const fullPath = path.resolve(this.workspaceRoot, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');

      let metadata = null;
      if (includeMetadata) {
        const stats = await fs.stat(fullPath);
        metadata = {
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
          isDirectory: stats.isDirectory()
        };
      }

      return {
        success: true,
        data: { content, metadata, path: filePath }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "File read failed"
      };
    }
  }

  private async listDirectory(dirPath: string, recursive: boolean = false, includeHidden: boolean = false): Promise<any> {
    try {
      const fullPath = path.resolve(this.workspaceRoot, dirPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      const items = [];
      for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) continue;

        const item = {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: path.join(dirPath, entry.name)
        };

        if (recursive && entry.isDirectory()) {
          const subItems = await this.listDirectory(item.path, true, includeHidden);
          if (subItems.success) {
            item['children'] = subItems.data.items;
          }
        }

        items.push(item);
      }

      return { success: true, data: { items, path: dirPath } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Directory listing failed"
      };
    }
  }

  // Code analysis tool implementations
  private async parseCodeAST(code: string, language: string, includeLocations: boolean = true): Promise<any> {
    try {
      // This would use appropriate parser for the language
      // For now, a simplified implementation
      const ast = {
        type: 'Program',
        language,
        body: [],
        // Actual AST parsing would go here based on language
      };

      return {
        success: true,
        data: { ast, language, includeLocations }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "AST parsing failed"
      };
    }
  }

  private async analyzeCodeQuality(filePath: string, includeMetrics: boolean = true): Promise<any> {
    try {
      const content = await this.readFileContent(filePath, false);
      if (!content.success) return content;

      // Basic code quality analysis
      const lines = content.data.content.split('\n');
      const metrics = {
        lines_of_code: lines.length,
        blank_lines: lines.filter(line => line.trim() === '').length,
        comment_lines: lines.filter(line => line.trim().startsWith('//')).length,
        complexity_score: this.calculateComplexity(content.data.content)
      };

      return {
        success: true,
        data: {
          file_path: filePath,
          metrics: includeMetrics ? metrics : null,
          quality_score: this.calculateQualityScore(metrics)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Code quality analysis failed"
      };
    }
  }

  // Helper methods
  private generateBranchRecommendations(status: any, log: any): string[] {
    const recommendations = [];

    if (status.files.length > 0) {
      recommendations.push("Commit or stash uncommitted changes");
    }

    if (log.total === 0) {
      recommendations.push("Make initial commit to establish branch history");
    }

    return recommendations;
  }

  private calculateComplexity(code: string): number {
    // Simplified complexity calculation
    const cyclomaticKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
    let complexity = 1;

    for (const keyword of cyclomaticKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  private calculateQualityScore(metrics: any): number {
    let score = 100;

    // Deduct for low comment ratio
    const commentRatio = metrics.comment_lines / metrics.lines_of_code;
    if (commentRatio < 0.1) score -= 20;

    // Deduct for high complexity
    if (metrics.complexity_score > 10) score -= 30;

    return Math.max(0, score);
  }

  private async analyzeSlowQueries(thresholdMs: number = 1000, limit: number = 10): Promise<any> {
    const query = `
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        stddev_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements
      WHERE mean_time > $1
      ORDER BY mean_time DESC
      LIMIT $2
    `;

    try {
      const result = await this.dbClient.query(query, [thresholdMs, limit]);

      const analysis = {
        threshold_ms: thresholdMs,
        slow_queries_found: result.rows.length,
        total_impact: result.rows.reduce((sum, row) => sum + parseFloat(row.total_time), 0),
        queries: await Promise.all(
          result.rows.map(async (row) => ({
            ...row,
            optimization_suggestions: await this.generateOptimizationSuggestions(row.query),
            impact_score: this.calculateImpactScore(row),
          }))
        ),
      };

      return { success: true, data: analysis };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze slow queries",
      };
    }
  }

  private async optimizeQuery(query: string, explain: boolean = true): Promise<QueryOptimization> {
    try {
      // Get execution plan
      let executionPlan = null;
      if (explain) {
        const explainResult = await this.dbClient.query(`EXPLAIN (ANALYZE true, BUFFERS true, FORMAT JSON) ${query}`);
        executionPlan = explainResult.rows[0]["QUERY PLAN"][0];
      }

      // Generate optimization suggestions
      const suggestions = await this.generateOptimizationSuggestions(query);
      const optimizedQuery = await this.generateOptimizedQuery(query, suggestions);

      return {
        original_query: query,
        optimized_query: optimizedQuery,
        explanation: this.explainOptimizations(suggestions),
        estimated_improvement: this.estimateImprovement(executionPlan, suggestions),
        recommendations: suggestions,
      };
    } catch (error) {
      throw new Error(`Query optimization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async analyzeSchema(tableName?: string, deepAnalysis: boolean = false): Promise<any> {
    try {
      let analysis;

      if (tableName) {
        analysis = await this.analyzeSpecificTable(tableName, deepAnalysis);
      } else {
        analysis = await this.analyzeFullSchema(deepAnalysis);
      }

      return { success: true, data: analysis };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Schema analysis failed",
      };
    }
  }

  private async getPerformanceMetrics(includeLocks: boolean = true, includeConnections: boolean = true): Promise<any> {
    try {
      const metrics: any = {
        timestamp: new Date().toISOString(),
        database_size: await this.getDatabaseSize(),
        active_queries: await this.getActiveQueries(),
        cache_hit_ratio: await this.getCacheHitRatio(),
        connection_stats: includeConnections ? await this.getConnectionStats() : null,
        lock_stats: includeLocks ? await this.getLockStats() : null,
        table_stats: await this.getTableStatistics(),
        index_usage: await this.getIndexUsage(),
      };

      return { success: true, data: metrics };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get performance metrics",
      };
    }
  }

  private async generateTestData(tableName: string, rowCount: number = 100, realistic: boolean = true): Promise<any> {
    try {
      // Get table schema
      const schema = await this.getTableSchema(tableName);

      // Generate data based on column types
      const insertStatements = [];
      for (let i = 0; i < rowCount; i++) {
        const values = schema.columns.map((col) => this.generateColumnValue(col, realistic, i));
        insertStatements.push(
          `INSERT INTO ${tableName} (${schema.columns.map((c) => c.name).join(", ")}) VALUES (${values.join(", ")})`
        );
      }

      return {
        success: true,
        data: {
          table_name: tableName,
          rows_generated: rowCount,
          insert_statements: insertStatements.slice(0, 5), // Return first 5 as examples
          total_statements: insertStatements.length,
          execute_all: `-- Execute all ${rowCount} inserts\n${insertStatements.join(";\n")};`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate test data",
      };
    }
  }

  private async generateOptimizationSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = [];
    const normalizedQuery = query.toLowerCase();

    // Check for missing WHERE clauses on large tables
    if (
      normalizedQuery.includes("select") &&
      !normalizedQuery.includes("where") &&
      !normalizedQuery.includes("limit")
    ) {
      suggestions.push("Consider adding WHERE clause to filter results");
    }

    // Check for SELECT *
    if (normalizedQuery.includes("select *")) {
      suggestions.push("Specify only needed columns instead of SELECT *");
    }

    // Check for missing indexes
    const tableMatches = query.match(/FROM\s+(\w+)/gi);
    if (tableMatches) {
      for (const match of tableMatches) {
        const tableName = match.replace(/FROM\s+/i, "");
        const indexes = await this.getTableIndexes(tableName);
        if (indexes.length === 0) {
          suggestions.push(`Consider adding indexes to table ${tableName}`);
        }
      }
    }

    // Check for inefficient joins
    if (normalizedQuery.includes("join") && !normalizedQuery.includes("on")) {
      suggestions.push("Ensure all JOINs have proper ON conditions");
    }

    return suggestions;
  }

  private async generateOptimizedQuery(originalQuery: string, suggestions: string[]): Promise<string> {
    let optimizedQuery = originalQuery;

    // Apply basic optimizations
    if (suggestions.includes("Specify only needed columns instead of SELECT *")) {
      // This would require more sophisticated parsing in a real implementation
      optimizedQuery = optimizedQuery.replace(
        /SELECT\s+\*/i,
        "SELECT column1, column2, column3 -- Specify actual columns"
      );
    }

    if (suggestions.includes("Consider adding WHERE clause to filter results")) {
      optimizedQuery += "\n-- Add appropriate WHERE clause to filter results";
    }

    return optimizedQuery;
  }

  private explainOptimizations(suggestions: string[]): string {
    return suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join("\n");
  }

  private estimateImprovement(executionPlan: any, suggestions: string[]): string {
    if (!executionPlan) return "Analysis required for accurate estimate";

    const cost = executionPlan["Total Cost"] || 0;
    const suggestionCount = suggestions.length;

    if (suggestionCount === 0) return "No optimizations needed";
    if (cost < 100) return "10-20% improvement possible";
    if (cost < 1000) return "20-40% improvement possible";
    return "40-80% improvement possible";
  }

  private calculateImpactScore(queryStats: any): number {
    const totalTime = parseFloat(queryStats.total_time);
    const calls = parseInt(queryStats.calls);
    const meanTime = parseFloat(queryStats.mean_time);

    // Calculate impact score based on total time, frequency, and average duration
    return Math.round((totalTime * calls * meanTime) / 1000000);
  }

  private async getLiveSchema(): Promise<any> {
    const schemaQuery = `
      SELECT
        t.table_name,
        t.table_type,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type,
        s.n_tup_ins,
        s.n_tup_upd,
        s.n_tup_del,
        s.n_live_tup,
        s.n_dead_tup,
        pg_size_pretty(pg_total_relation_size('"'||t.table_name||'"')) as table_size
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
      LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name, c.ordinal_position
    `;

    const result = await this.dbClient.query(schemaQuery);

    // Group by table
    const schema = {};
    for (const row of result.rows) {
      if (!schema[row.table_name]) {
        schema[row.table_name] = {
          table_type: row.table_type,
          columns: [],
          constraints: [],
          statistics: {
            inserts: row.n_tup_ins,
            updates: row.n_tup_upd,
            deletes: row.n_tup_del,
            live_tuples: row.n_live_tup,
            dead_tuples: row.n_dead_tup,
            size: row.table_size,
          },
        };
      }

      if (row.column_name) {
        schema[row.table_name].columns.push({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === "YES",
          default: row.column_default,
        });
      }

      if (row.constraint_type && !schema[row.table_name].constraints.includes(row.constraint_type)) {
        schema[row.table_name].constraints.push(row.constraint_type);
      }
    }

    return schema;
  }

  private async getQueryHistory(): Promise<any> {
    const historyQuery = `
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        stddev_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent,
        queryid
      FROM pg_stat_statements
      ORDER BY last_exec DESC
      LIMIT 50
    `;

    try {
      const result = await this.dbClient.query(historyQuery);
      return {
        total_queries: result.rows.length,
        queries: result.rows.map((row) => ({
          ...row,
          query_hash: createHash("md5").update(row.query).digest("hex").substring(0, 8),
          performance_rating: this.getPerformanceRating(parseFloat(row.mean_time)),
        })),
      };
    } catch (error) {
      return { error: "Query history not available (pg_stat_statements extension may not be installed)" };
    }
  }

  private async analyzeSpecificTable(tableName: string, deepAnalysis: boolean): Promise<any> {
    const analysis: any = {
      table_name: tableName,
      schema: await this.getTableSchema(tableName),
      statistics: await this.getTableStatistics(tableName),
      indexes: await this.getTableIndexes(tableName),
    };

    if (deepAnalysis) {
      analysis.bloat_analysis = await this.analyzeBloat(tableName);
      analysis.query_patterns = await this.getQueryPatterns(tableName);
      analysis.recommendations = await this.generateTableRecommendations(tableName, analysis);
    }

    return analysis;
  }

  private async analyzeFullSchema(deepAnalysis: boolean): Promise<any> {
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;

    const tables = await this.dbClient.query(tablesQuery);
    const analysis: any = {
      total_tables: tables.rows.length,
      tables: {},
    };

    for (const table of tables.rows) {
      analysis.tables[table.table_name] = await this.analyzeSpecificTable(table.table_name, deepAnalysis);
    }

    return analysis;
  }

  // Helper methods (implementations would continue...)
  private async getDatabaseSize(): Promise<string> {
    const result = await this.dbClient.query(`SELECT pg_size_pretty(pg_database_size(current_database()))`);
    return result.rows[0].pg_size_pretty;
  }

  private async getActiveQueries(): Promise<any[]> {
    const result = await this.dbClient.query(`
      SELECT pid, usename, application_name, client_addr, state, query, query_start
      FROM pg_stat_activity
      WHERE state = 'active' AND query != '<IDLE>'
    `);
    return result.rows;
  }

  private async getCacheHitRatio(): Promise<number> {
    const result = await this.dbClient.query(`
      SELECT round(
        100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2
      ) as cache_hit_ratio
      FROM pg_stat_database
    `);
    return parseFloat(result.rows[0].cache_hit_ratio);
  }

  private getPerformanceRating(meanTime: number): string {
    if (meanTime < 10) return "Excellent";
    if (meanTime < 100) return "Good";
    if (meanTime < 1000) return "Fair";
    return "Poor";
  }

  private generateColumnValue(column: any, realistic: boolean, index: number): string {
    // Implementation for generating realistic test data based on column type
    // This would be a comprehensive function for different data types
    return "'sample_value'";
  }

  // Additional helper methods would continue...
}

// Start the server
if (require.main === module) {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "postgres",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  };

  const server = new IntelligentDatabaseServer(config);
  server.start().catch(console.error);
}
```

### 2. Specialized Agents as MCP Clients

**Purpose**: Each agent connects to the single MCP server and specializes in specific tool domains, coordinated via A2A protocol.

```typescript
// src/agents/specialized/database-agent.ts
import { A2AClient } from "@a2a-js/sdk/client";
import { MCPClientService } from "../../services/mcp-client.service";
import { BaseSpecializedAgent } from "./base-specialized-agent";

export class DatabaseAgent extends BaseSpecializedAgent {
  private mcpClient: MCPClientService;
  private a2aClient: A2AClient;
  private availableTools: string[] = [];

  constructor(orchestrator: ConversationalOrchestrator) {
    super("database-agent", "database", orchestrator);

    // Connect to the single MCP server
    this.mcpClient = new MCPClientService();
    this.initializeMCPConnection();

    // Initialize A2A client for agent coordination
    this.a2aClient = new A2AClient({
      agentId: "database-agent",
      capabilities: this.defineCapabilities(),
    });

    this.setupA2AMessageHandlers();
  }

  private async initializeMCPConnection(): Promise<void> {
    await this.mcpClient.connect({
      id: "codebuddy-server",
      name: "CodeBuddy MCP Server",
      type: "stdio",
      uri: "codebuddy-mcp-server",
    });

    // Get available tools and filter for database-related ones
    const allTools = await this.mcpClient.listTools("codebuddy-server");
    this.availableTools = allTools.filter((tool) => this.isDatabaseTool(tool.name)).map((tool) => tool.name);
  }

  private isDatabaseTool(toolName: string): boolean {
    const databaseTools = ["execute_query", "get_database_schema", "optimize_query"];
    return databaseTools.includes(toolName);
  }

  private defineCapabilities(): string[] {
    return ["sql-query-execution", "schema-analysis", "query-optimization", "database-performance-analysis"];
  }

  private setupA2AMessageHandlers(): void {
    this.a2aClient.on("message", async (message) => {
      if (message.type === "task-request") {
        const result = await this.handleTaskRequest(message.payload);

        await this.a2aClient.sendMessage({
          to: message.from,
          type: "task-response",
          payload: { result },
        });
      }
    });
  }

  async optimizeQuery(query: string): Promise<OptimizationResult> {
    // Use MCP tools that this agent specializes in
    const analysis = await this.mcpClient.executeRequest("codebuddy-server", "tools/call", {
      name: "optimize_query",
      arguments: { query, explain: true },
    });

    // Coordinate with Git Agent via A2A to get schema history
    const schemaHistory = await this.a2aClient.sendMessage({
      to: "git-agent",
      type: "task-request",
      payload: {
        task: "get-schema-changes",
        params: {
          timeframe: "30d",
          files: ["**/schema.sql", "**/migrations/*.sql"],
        },
      },
    });

    return {
      original: query,
      analysis,
      optimized: analysis.data.optimized_query,
      schemaContext: schemaHistory,
    };
  }
}

// src/agents/specialized/git-agent.ts
export class GitAgent extends BaseSpecializedAgent {
  private mcpClient: MCPClientService;
  private a2aClient: A2AClient;
  private availableTools: string[] = [];

  constructor(orchestrator: ConversationalOrchestrator) {
    super("git-agent", "git", orchestrator);
    this.initializeMCPConnection();

    this.a2aClient = new A2AClient({
      agentId: "git-agent",
      capabilities: this.defineCapabilities(),
    });

    this.setupA2AMessageHandlers();
  }

  private async initializeMCPConnection(): Promise<void> {
    await this.mcpClient.connect({
      id: "codebuddy-server",
      name: "CodeBuddy MCP Server",
      type: "stdio",
      uri: "codebuddy-mcp-server",
    });

    // Filter for git-related tools
    const allTools = await this.mcpClient.listTools("codebuddy-server");
    this.availableTools = allTools.filter((tool) => this.isGitTool(tool.name)).map((tool) => tool.name);
  }

  private isGitTool(toolName: string): boolean {
    const gitTools = ["git_status", "git_log", "analyze_branch_health"];
    return gitTools.includes(toolName);
  }

  private defineCapabilities(): string[] {
    return ["version-control", "branch-management", "commit-analysis", "repository-health-analysis"];
  }

  private setupA2AMessageHandlers(): void {
    this.a2aClient.on("message", async (message) => {
      if (message.type === "task-request" && message.payload.task === "get-schema-changes") {
        const result = await this.getSchemaChanges(message.payload.params);

        await this.a2aClient.sendMessage({
          to: message.from,
          type: "task-response",
          payload: { result },
        });
      }
    });
  }

  async getSchemaChanges(params: any): Promise<SchemaChanges> {
    // Use git MCP tools
    const commits = await this.mcpClient.executeRequest("codebuddy-server", "tools/call", {
      name: "git_log",
      arguments: {
        since: params.timeframe,
        author: null,
      },
    });

    // Filter commits that affect schema files
    const schemaCommits = commits.data.commits.filter((commit) =>
      params.files.some(
        (pattern) =>
          commit.message.toLowerCase().includes("schema") || commit.message.toLowerCase().includes("migration")
      )
    );

    return {
      timeframe: params.timeframe,
      commits: schemaCommits,
      files_affected: params.files,
    };
  }

  private setupHandlers(): void {
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "analyze_branch_health",
          description: "Analyze branch health and suggest actions",
          inputSchema: {
            type: "object",
            properties: {
              branch_name: { type: "string" },
              include_recommendations: { type: "boolean", default: true },
            },
          },
        },
        {
          name: "intelligent_commit",
          description: "Generate intelligent commit messages and validate changes",
          inputSchema: {
            type: "object",
            properties: {
              stage_all: { type: "boolean", default: false },
              auto_format: { type: "boolean", default: true },
            },
          },
        },
        {
          name: "merge_conflict_analysis",
          description: "Analyze and suggest resolutions for merge conflicts",
          inputSchema: {
            type: "object",
            properties: {
              target_branch: { type: "string", default: "main" },
            },
          },
        },
        {
          name: "release_preparation",
          description: "Prepare and validate release with changelog generation",
          inputSchema: {
            type: "object",
            properties: {
              version: { type: "string" },
              release_type: { type: "string", enum: ["patch", "minor", "major"], default: "patch" },
            },
          },
        },
        {
          name: "code_review_prep",
          description: "Prepare comprehensive code review information",
          inputSchema: {
            type: "object",
            properties: {
              target_branch: { type: "string", default: "main" },
              include_metrics: { type: "boolean", default: true },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze_branch_health":
          return await this.analyzeBranchHealth(args.branch_name, args.include_recommendations);

        case "intelligent_commit":
          return await this.intelligentCommit(args.stage_all, args.auto_format);

        case "merge_conflict_analysis":
          return await this.analyzeMergeConflicts(args.target_branch);

        case "release_preparation":
          return await this.prepareRelease(args.version, args.release_type);

        case "code_review_prep":
          return await this.prepareCodeReview(args.target_branch, args.include_metrics);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: "git://status",
          name: "Git Status",
          mimeType: "application/json",
          description: "Current Git repository status",
        },
        {
          uri: "git://history",
          name: "Commit History",
          mimeType: "application/json",
          description: "Recent commit history with analysis",
        },
        {
          uri: "git://branches",
          name: "Branch Analysis",
          mimeType: "application/json",
          description: "All branches with health metrics",
        },
      ],
    }));

    this.server.setRequestHandler("resources/read", async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case "git://status":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(await this.getDetailedStatus()),
              },
            ],
          };

        case "git://history":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(await this.getCommitHistory()),
              },
            ],
          };

        case "git://branches":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(await this.getBranchAnalysis()),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private async analyzeBranchHealth(branchName?: string, includeRecommendations: boolean = true): Promise<any> {
    try {
      const currentBranch = branchName || (await this.git.branch()).current;
      if (!currentBranch) throw new Error("No current branch found");

      const status = await this.git.status();
      const log = await this.git.log({ from: currentBranch, maxCount: 50 });
      const branches = await this.git.branch(["-a"]);

      // Analyze branch health
      const health = {
        branch_name: currentBranch,
        commits_ahead: 0,
        commits_behind: 0,
        last_commit_age_hours: 0,
        uncommitted_changes: status.files.length,
        health_score: 0,
        issues: [] as string[],
        recommendations: [] as string[],
      };

      // Calculate commit age
      if (log.latest) {
        const lastCommitDate = new Date(log.latest.date);
        health.last_commit_age_hours = Math.round((Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60));
      }

      // Check for issues
      if (health.uncommitted_changes > 0) {
        health.issues.push(`${health.uncommitted_changes} uncommitted changes`);
      }

      if (health.last_commit_age_hours > 168) {
        // 1 week
        health.issues.push("Branch has been inactive for over a week");
      }

      // Calculate health score
      health.health_score = this.calculateHealthScore(health);

      // Generate recommendations
      if (includeRecommendations) {
        health.recommendations = await this.generateBranchRecommendations(health, status);
      }

      return { success: true, data: health };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Branch analysis failed",
      };
    }
  }

  private async intelligentCommit(stageAll: boolean = false, autoFormat: boolean = true): Promise<any> {
    try {
      const status = await this.git.status();

      if (status.files.length === 0) {
        return { success: false, message: "No changes to commit" };
      }

      // Stage files if requested
      if (stageAll) {
        await this.git.add(".");
      }

      // Analyze changes
      const diff = await this.git.diff(["--cached"]);
      const changeAnalysis = await this.analyzeChanges(diff);

      // Generate intelligent commit message
      const commitMessage = await this.generateCommitMessage(changeAnalysis, status.files);

      // Validate commit
      const validation = await this.validateCommit(changeAnalysis);

      const result = {
        suggested_message: commitMessage,
        change_analysis: changeAnalysis,
        validation: validation,
        files_changed: status.files.length,
        can_commit: validation.passed,
        commit_command: `git commit -m "${commitMessage}"`,
      };

      // Auto-commit if validation passes and no issues
      if (validation.passed && validation.warnings.length === 0) {
        try {
          await this.git.commit(commitMessage);
          result["committed"] = true;
        } catch (error) {
          result["commit_error"] = error instanceof Error ? error.message : "Commit failed";
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Intelligent commit failed",
      };
    }
  }

  private async analyzeMergeConflicts(targetBranch: string = "main"): Promise<any> {
    try {
      const currentBranch = (await this.git.branch()).current;
      if (!currentBranch) throw new Error("No current branch");

      // Simulate merge to detect conflicts
      const mergePreview = await this.git.raw(["merge-tree", "HEAD", targetBranch]);

      const conflicts = this.parseConflicts(mergePreview);
      const resolutionSuggestions = await this.generateConflictResolutions(conflicts);

      return {
        success: true,
        data: {
          current_branch: currentBranch,
          target_branch: targetBranch,
          has_conflicts: conflicts.length > 0,
          conflicts,
          resolution_suggestions: resolutionSuggestions,
          merge_strategy: this.suggestMergeStrategy(conflicts),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Merge conflict analysis failed",
      };
    }
  }

  private async prepareRelease(version: string, releaseType: string = "patch"): Promise<any> {
    try {
      const currentBranch = (await this.git.branch()).current;
      const log = await this.git.log({ from: "HEAD", to: "HEAD~50" });

      // Generate changelog
      const changelog = await this.generateChangelog(log.all, version);

      // Validate release readiness
      const validation = await this.validateReleaseReadiness();

      // Prepare release notes
      const releaseNotes = await this.generateReleaseNotes(log.all, version);

      return {
        success: true,
        data: {
          version,
          release_type: releaseType,
          current_branch: currentBranch,
          changelog,
          release_notes: releaseNotes,
          validation,
          ready_for_release: validation.passed,
          release_commands: this.generateReleaseCommands(version, releaseType),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Release preparation failed",
      };
    }
  }

  private async prepareCodeReview(targetBranch: string = "main", includeMetrics: boolean = true): Promise<any> {
    try {
      const currentBranch = (await this.git.branch()).current;
      if (!currentBranch) throw new Error("No current branch");

      // Get diff with target branch
      const diff = await this.git.diff([`${targetBranch}...HEAD`]);
      const log = await this.git.log({ from: targetBranch, to: "HEAD" });

      // Analyze changes
      const changeAnalysis = await this.analyzeChanges(diff);

      // Calculate metrics
      let metrics = {};
      if (includeMetrics) {
        metrics = await this.calculateChangeMetrics(diff, log.all);
      }

      // Generate review checklist
      const checklist = await this.generateReviewChecklist(changeAnalysis);

      return {
        success: true,
        data: {
          current_branch: currentBranch,
          target_branch: targetBranch,
          commits_in_pr: log.all.length,
          change_analysis: changeAnalysis,
          metrics,
          review_checklist: checklist,
          summary: await this.generateChangeSummary(log.all, changeAnalysis),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Code review preparation failed",
      };
    }
  }

  // Helper methods
  private calculateHealthScore(health: any): number {
    let score = 100;

    // Deduct for uncommitted changes
    score -= health.uncommitted_changes * 5;

    // Deduct for age
    if (health.last_commit_age_hours > 24) score -= 10;
    if (health.last_commit_age_hours > 168) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private async generateBranchRecommendations(health: any, status: any): Promise<string[]> {
    const recommendations: string[] = [];

    if (health.uncommitted_changes > 0) {
      recommendations.push("Commit or stash uncommitted changes");
    }

    if (health.last_commit_age_hours > 168) {
      recommendations.push("Consider merging or rebasing with main branch");
    }

    if (status.ahead > 5) {
      recommendations.push("Consider squashing commits before merging");
    }

    return recommendations;
  }

  private async analyzeChanges(diff: string): Promise<any> {
    const lines = diff.split("\n");
    const analysis = {
      files_changed: 0,
      lines_added: 0,
      lines_deleted: 0,
      change_types: [] as string[],
      risk_level: "low" as "low" | "medium" | "high",
      categories: [] as string[],
    };

    // Parse diff for analysis
    let currentFile = "";
    for (const line of lines) {
      if (line.startsWith("diff --git")) {
        analysis.files_changed++;
        currentFile = line.split(" ")[3] || "";
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        analysis.lines_added++;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        analysis.lines_deleted++;
      }

      // Categorize changes
      if (currentFile.includes(".test.") || currentFile.includes(".spec.")) {
        if (!analysis.categories.includes("tests")) analysis.categories.push("tests");
      } else if (currentFile.includes(".md") || currentFile.includes(".txt")) {
        if (!analysis.categories.includes("documentation")) analysis.categories.push("documentation");
      } else if (currentFile.includes(".json") || currentFile.includes(".yaml")) {
        if (!analysis.categories.includes("configuration")) analysis.categories.push("configuration");
      } else {
        if (!analysis.categories.includes("code")) analysis.categories.push("code");
      }
    }

    // Determine risk level
    const totalChanges = analysis.lines_added + analysis.lines_deleted;
    if (totalChanges > 500 || analysis.files_changed > 20) {
      analysis.risk_level = "high";
    } else if (totalChanges > 100 || analysis.files_changed > 5) {
      analysis.risk_level = "medium";
    }

    return analysis;
  }

  private async generateCommitMessage(changeAnalysis: any, files: any[]): Promise<string> {
    // Generate intelligent commit message based on changes
    const categories = changeAnalysis.categories;
    const fileCount = files.length;

    let type = "feat";
    if (categories.includes("tests")) type = "test";
    else if (categories.includes("documentation")) type = "docs";
    else if (categories.includes("configuration")) type = "config";
    else if (changeAnalysis.lines_deleted > changeAnalysis.lines_added) type = "refactor";

    const scope = this.inferScope(files);
    const description = this.generateDescription(changeAnalysis, files);

    return `${type}${scope ? `(${scope})` : ""}: ${description}`;
  }

  private inferScope(files: any[]): string {
    const paths = files.map((f) => f.path || f);
    const commonParts = this.findCommonPathParts(paths);
    return commonParts.length > 0 ? commonParts[0] : "";
  }

  private findCommonPathParts(paths: string[]): string[] {
    if (paths.length === 0) return [];

    const parts = paths[0].split("/");
    const common: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (paths.every((path) => path.split("/")[i] === part)) {
        common.push(part);
      } else {
        break;
      }
    }

    return common.filter((part) => part && part !== ".");
  }

  private generateDescription(changeAnalysis: any, files: any[]): string {
    const fileCount = files.length;
    const categories = changeAnalysis.categories;

    if (categories.includes("tests")) return `add/update tests for ${fileCount} files`;
    if (categories.includes("documentation")) return `update documentation`;
    if (categories.includes("configuration")) return `update configuration files`;

    if (changeAnalysis.lines_added > changeAnalysis.lines_deleted * 2) {
      return `implement new functionality`;
    } else if (changeAnalysis.lines_deleted > changeAnalysis.lines_added * 2) {
      return `remove unused code and refactor`;
    }

    return `update ${fileCount} file${fileCount > 1 ? "s" : ""}`;
  }

  private async validateCommit(changeAnalysis: any): Promise<any> {
    const validation = {
      passed: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Check for large changes
    if (changeAnalysis.files_changed > 20) {
      validation.warnings.push("Large number of files changed - consider splitting the commit");
    }

    // Check for mixed changes
    if (changeAnalysis.categories.length > 2) {
      validation.warnings.push("Mixed change types - consider separate commits");
    }

    // Check for high risk changes
    if (changeAnalysis.risk_level === "high") {
      validation.warnings.push("High-risk changes detected - ensure thorough testing");
    }

    return validation;
  }

  // Additional helper methods would continue...
  private parseConflicts(mergeOutput: string): any[] {
    // Parse merge conflicts from git merge-tree output
    return [];
  }

  private async generateConflictResolutions(conflicts: any[]): Promise<any[]> {
    // Generate intelligent conflict resolution suggestions
    return [];
  }

  private suggestMergeStrategy(conflicts: any[]): string {
    if (conflicts.length === 0) return "direct merge";
    if (conflicts.length > 5) return "interactive rebase recommended";
    return "manual resolution required";
  }

  private async generateChangelog(commits: any[], version: string): Promise<string> {
    let changelog = `# Changelog - v${version}\n\n`;

    const features = commits.filter((c) => c.message.startsWith("feat"));
    const fixes = commits.filter((c) => c.message.startsWith("fix"));
    const docs = commits.filter((c) => c.message.startsWith("docs"));

    if (features.length > 0) {
      changelog += "## Features\n";
      features.forEach((commit) => {
        changelog += `- ${commit.message}\n`;
      });
      changelog += "\n";
    }

    if (fixes.length > 0) {
      changelog += "## Bug Fixes\n";
      fixes.forEach((commit) => {
        changelog += `- ${commit.message}\n`;
      });
      changelog += "\n";
    }

    if (docs.length > 0) {
      changelog += "## Documentation\n";
      docs.forEach((commit) => {
        changelog += `- ${commit.message}\n`;
      });
      changelog += "\n";
    }

    return changelog;
  }

  private async validateReleaseReadiness(): Promise<any> {
    return {
      passed: true,
      checks: [
        { name: "All tests passing", status: "unknown" },
        { name: "No uncommitted changes", status: "checking" },
        { name: "Version updated", status: "checking" },
      ],
    };
  }

  private async generateReleaseNotes(commits: any[], version: string): Promise<string> {
    return `Release notes for v${version} - Generated automatically from ${commits.length} commits.`;
  }

  private generateReleaseCommands(version: string, releaseType: string): string[] {
    return [
      `git tag -a v${version} -m "Release v${version}"`,
      `git push origin v${version}`,
      `npm version ${releaseType}`,
      `npm publish`,
    ];
  }

  private async calculateChangeMetrics(diff: string, commits: any[]): Promise<any> {
    return {
      commits_count: commits.length,
      avg_commit_size: "calculating...",
      change_velocity: "calculating...",
    };
  }

  private async generateReviewChecklist(changeAnalysis: any): Promise<string[]> {
    const checklist = [
      "Code follows project style guidelines",
      "All tests are passing",
      "Documentation is updated",
      "No sensitive data exposed",
    ];

    if (changeAnalysis.risk_level === "high") {
      checklist.push("Extra testing for high-risk changes");
      checklist.push("Performance impact assessed");
    }

    return checklist;
  }

  private async generateChangeSummary(commits: any[], changeAnalysis: any): Promise<string> {
    return `${commits.length} commits affecting ${changeAnalysis.files_changed} files with ${changeAnalysis.lines_added} additions and ${changeAnalysis.lines_deleted} deletions.`;
  }

  private async getDetailedStatus(): Promise<any> {
    const status = await this.git.status();
    const currentBranch = (await this.git.branch()).current;

    return {
      current_branch: currentBranch,
      files: status.files,
      ahead: status.ahead,
      behind: status.behind,
      tracking: status.tracking,
      clean: status.isClean(),
    };
  }

  private async getCommitHistory(): Promise<any> {
    const log = await this.git.log({ maxCount: 20 });
    return {
      total_commits: log.total,
      recent_commits: log.all.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        refs: commit.refs,
      })),
    };
  }

  private async getBranchAnalysis(): Promise<any> {
    const branches = await this.git.branch(["-a"]);
    const analysis = {
      current: branches.current,
      all: branches.all,
      branch_count: branches.all.length,
    };

    return analysis;
  }
}

// Start the server
if (require.main === module) {
  const workspaceRoot = process.argv[2] || process.cwd();
  const server = new SmartGitServer(workspaceRoot);
  server.start().catch(console.error);
}
```

## 🎯 Real-World Use Cases and Scenarios

### Use Case 1: Debugging Production Issues

**Scenario**: A production API is experiencing intermittent timeouts.

**MCP-Enhanced Workflow**:

1. **Problem Detection**: CodeBuddy receives alert from monitoring MCP server
2. **Context Gathering**:
   - Database server provides slow query analysis
   - Kubernetes server shows pod resource usage
   - Log server identifies error patterns
3. **Root Cause Analysis**: AI correlates data across all systems
4. **Solution Generation**: CodeBuddy suggests specific optimizations
5. **Implementation**: Git server helps create fix branch and PR

**Example Interaction**:

````
User: "API timeouts increased 300% in last hour"

CodeBuddy (via MCP):
🔍 **Analysis Complete**

**Root Cause Identified:**
- Database query execution time increased from 50ms to 2.5s
- Affected query: `SELECT * FROM user_sessions WHERE created_at > ?`
- Missing index on `created_at` column
- 2.3M rows being scanned sequentially

**Immediate Actions:**
1. **Database Fix** (ETA: 2 minutes)
   ```sql
   CREATE INDEX CONCURRENTLY idx_user_sessions_created_at
   ON user_sessions(created_at);
````

2. **Application Optimization** (ETA: 5 minutes)
   ```typescript
   // Add pagination and limit results
   const sessions = await db.query(
     'SELECT id, user_id, created_at FROM user_sessions
      WHERE created_at > ?
      ORDER BY created_at DESC
      LIMIT 100',
     [since]
   );
   ```

**Impact Prediction:**

- Query time: 2.5s → 15ms (99.4% improvement)
- API response time: 3.2s → 180ms
- System load reduction: 85%

**Next Steps:**

- [ ] Apply database index (auto-executing...)
- [ ] Create PR with application fix
- [ ] Add monitoring alert for similar patterns
- [ ] Schedule query audit for related tables

✅ **Database index created successfully**
🔄 **Creating optimized code branch...**

```

### Use Case 2: Feature Development with Architecture Validation

**Scenario**: Developer implementing user authentication system.

**MCP-Enhanced Development Flow**:

```

User: "I need to implement OAuth2 authentication"

CodeBuddy (via A2A Orchestration + MCP):
🏗️ **Multi-Agent Architecture Analysis**

**A2A Coordination Initiated:**

1. **File Agent** - Analyzed project structure via `list_directory` and `read_file_content`
2. **Database Agent** - Examined schema via `get_database_schema`
3. **Code Agent** - Parsed existing auth code via `parse_code_ast` and `analyze_code_quality`
4. **Git Agent** - Checked auth-related commit history via `git_log`

**Collaborative Analysis Results:**

- Framework: Express.js + TypeScript (detected by Code Agent)
- Database: PostgreSQL with existing user table (analyzed by Database Agent)
- Security: Basic JWT implementation detected (Code Agent analysis)
- Dependencies: passport.js already installed (File Agent discovery)
- Recent auth changes: None in last 6 months (Git Agent history)

**Recommended Implementation:**

**1. Database Schema Updates:**

```sql
-- Migration: add_oauth_support.sql
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255);
ALTER TABLE users ADD COLUMN oauth_data JSONB;

CREATE UNIQUE INDEX idx_users_oauth
ON users(oauth_provider, oauth_id)
WHERE oauth_provider IS NOT NULL;
```

**2. Security Configuration:**

```typescript
// src/auth/oauth-config.ts
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

export const configureOAuth = (passport: any) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        // Implementation with security best practices
        const user = await findOrCreateOAuthUser(profile);
        return done(null, user);
      }
    )
  );
};
```

**3. Route Implementation:**

```typescript
// src/routes/auth.ts - Following your existing patterns
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  // Success redirect with secure session
  res.redirect("/dashboard");
});
```

**Security Validations:**

- ✅ HTTPS enforced in production
- ✅ CSRF protection enabled
- ✅ Rate limiting configured
- ⚠️ **Action Required**: Add OAuth state validation
- ⚠️ **Action Required**: Implement token refresh logic

**Testing Strategy:**

```typescript
// Auto-generated test templates
describe("OAuth Authentication", () => {
  it("should redirect to Google OAuth", async () => {
    const response = await request(app).get("/auth/google").expect(302);

    expect(response.headers.location).toContain("accounts.google.com");
  });

  // Additional tests auto-generated...
});
```

**Environment Setup:**

```bash
# Add to .env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
SESSION_SECRET=generate_secure_secret
```

**Documentation Updates:**

- 📝 API documentation updated automatically
- 🔐 Security guidelines added to README
- 📊 Architecture diagram updated with OAuth flow

**Implementation Plan:**

1. ✅ Database migration ready
2. 🔄 Creating feature branch: `feature/oauth2-authentication`
3. 📝 Generating comprehensive tests
4. 🔍 Setting up security scans
5. 📚 Updating documentation

**Would you like me to:**

- [ ] Execute the database migration
- [ ] Create the feature branch and initial implementation
- [ ] Set up OAuth providers (Google, GitHub, etc.)
- [ ] Generate security audit report

```

### Use Case 3: Performance Optimization Campaign

**Scenario**: Application experiencing slow performance, need systematic optimization.

```

User: "Our app feels slow, can you help optimize it?"

CodeBuddy (via A2A Orchestrated Analysis):
🚀 **Multi-Agent Performance Analysis**

**A2A Coordination Plan:**

- **Code Agent**: Analyze bundle size and code quality
- **Database Agent**: Check query performance and schema efficiency
- **File Agent**: Examine asset sizes and file structure
- **Git Agent**: Analyze performance-related commit history

**Coordinated Analysis Results:**

**Code Agent Findings** (via `analyze_code_quality` + `parse_code_ast`):

- Bundle size: 2.8MB with 40% optimization potential
- Code complexity score: High in 12 files
- Unused imports detected: 156KB potential savings

**Database Agent Analysis** (via `execute_query` + `optimize_query`):

- Average query time: 850ms (target: <200ms)
- 12 slow queries identified via performance analysis
- Missing indexes on 5 frequently queried tables

**File Agent Discovery** (via `list_directory` + `read_file_content`):

- Large asset files: 8 files > 500KB each
- Uncompressed images: 2.1MB total
- Missing gzip compression on static files

**Git Agent Context** (via `git_log` + `analyze_branch_health`):

- Performance-related commits: None in last 3 months
- Last optimization: 6 months ago
- Technical debt accumulation detected

**Backend Performance** (via Database & Monitoring MCP):

- Average API response: 850ms → Target: <200ms
- Database query time: 65% of total response time
- Memory usage: 85% → Optimization needed
- 12 slow queries identified

**Infrastructure Analysis** (via Kubernetes MCP):

- CPU utilization: 75% (3 pods underutilized)
- Memory: 90% usage with frequent garbage collection
- Network latency: 45ms average

**Optimization Plan:**

**Phase 1: Database Optimization (Impact: 60% improvement)**

```sql
-- High-impact optimizations identified
CREATE INDEX CONCURRENTLY idx_orders_user_created
ON orders(user_id, created_at) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_products_category_price
ON products(category_id, price) WHERE active = true;

-- Query rewrites suggested
-- Before: SELECT * FROM orders WHERE user_id = ?
-- After: SELECT id, total, status FROM orders
--        WHERE user_id = ? AND created_at > ?
--        ORDER BY created_at DESC LIMIT 20
```

**Phase 2: Frontend Optimization (Impact: 45% improvement)**

```typescript
// Code splitting implementation
const LazyDashboard = lazy(() => import("./Dashboard"));
const LazyProfile = lazy(() => import("./Profile"));

// Bundle analysis shows:
// - moment.js (59KB) → replace with date-fns (12KB)
// - lodash (72KB) → use specific imports (8KB needed)
// - unused UI components (156KB) → tree shake

// Auto-generated optimization code:
import { format, parseISO } from "date-fns"; // instead of moment
import { debounce, throttle } from "lodash/function"; // specific imports
```

**Phase 3: Infrastructure Scaling (Impact: 30% improvement)**

```yaml
# Kubernetes optimization
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-backend
spec:
  replicas: 5 # Optimized from 3
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              memory: "256Mi" # Optimized from 512Mi
              cpu: "200m" # Optimized from 500m
            limits:
              memory: "512Mi" # Optimized from 1Gi
              cpu: "500m" # Optimized from 1000m
```

**Implementation Timeline:**

**Week 1: Quick Wins (Expected 40% improvement)**

- ✅ Database indexes (2 hours)
- ✅ Frontend bundle optimization (1 day)
- ✅ Enable gzip compression (30 minutes)
- ✅ Add CDN for static assets (2 hours)

**Week 2: Code Optimization (Expected 25% improvement)**

- 🔄 Implement query optimization (3 days)
- 🔄 Add caching layer (2 days)
- 🔄 Optimize component rendering (2 days)

**Week 3: Infrastructure (Expected 15% improvement)**

- 📅 Resource optimization (1 day)
- 📅 Auto-scaling configuration (1 day)
- 📅 Load balancer tuning (0.5 days)

**Monitoring Dashboard:**

```typescript
// Auto-generated performance monitoring
const PerformanceTracker = {
  apiResponseTime: new Gauge("api_response_time"),
  dbQueryTime: new Gauge("db_query_duration"),
  frontendMetrics: new Gauge("frontend_core_vitals"),

  // Automated alerts
  setupAlerts() {
    if (apiResponseTime.value > 500) {
      alert("API response time degraded");
    }
  },
};
```

**Projected Results:**

- 📈 **Page Load Time**: 3.2s → 1.1s (66% improvement)
- 📈 **API Response**: 850ms → 180ms (79% improvement)
- 📈 **User Experience Score**: 65 → 95
- 💰 **Infrastructure Cost**: -35% (resource optimization)

**Risk Assessment:**

- 🟢 Low risk: Database indexes, compression
- 🟡 Medium risk: Code splitting, caching
- 🔴 High risk: Infrastructure changes (requires staging validation)

**Next Steps:**

1. Execute Phase 1 optimizations
2. Set up performance monitoring
3. Create staging environment for testing
4. Schedule performance regression tests

**Would you like me to start with the database optimizations?**

````

## 🔄 Integration with Existing CodeBuddy Features

### Enhanced Documentation Generation with A2A Coordination

```typescript
// Enhanced documentation generator with A2A + MCP integration
export class A2AEnhancedDocumentationGenerator {
  private a2aOrchestrator: A2AOrchestrator;

  constructor() {
    this.a2aOrchestrator = new A2AOrchestrator();
  }

  async generateDocumentation(projectPath: string): Promise<string> {
    // Coordinate multiple agents via A2A to gather comprehensive context
    const documentationTask = await this.a2aOrchestrator.handleComplexTask(
      `Generate comprehensive documentation for project at ${projectPath}`
    );

    // A2A coordinates these agent calls to the single MCP server:
    // - Database Agent: get_database_schema for database documentation
    // - File Agent: read_file_content + list_directory for project structure
    // - Code Agent: analyze_code_quality + parse_code_ast for code analysis
    // - Git Agent: git_log + analyze_branch_health for change history

    return this.generateComprehensiveDocumentation({
      codebase: await this.analyzeCodebase(projectPath),
      database: dbSchema,
      api: apiEndpoints,
      infrastructure: deploymentInfo,
      realTimeMetrics: mcpContext.monitoring
    });
  }
}
````

### Intelligent Code Completion with A2A Coordination

```typescript
// Context-aware completion with A2A + MCP integration
export class A2AEnhancedCompletionProvider {
  private a2aOrchestrator: A2AOrchestrator;

  constructor() {
    this.a2aOrchestrator = new A2AOrchestrator();
  }

  async provideCompletions(context: CompletionContext): Promise<CompletionItem[]> {
    const baseCompletions = await super.provideCompletions(context);

    // Determine which agents are needed for context-aware completions
    const requiredAgents = this.analyzeCompletionContext(context);

    if (requiredAgents.includes("database-agent") && context.isQueryContext) {
      // Database Agent uses get_database_schema from MCP server
      const schemaData = await this.requestAgentCompletion("database-agent", "sql-schema", context);
      const sqlCompletions = this.generateSQLCompletions(schemaData, context);
      baseCompletions.push(...sqlCompletions);
    }

    if (requiredAgents.includes("file-agent") && context.isImportContext) {
      // File Agent uses list_directory from MCP server
      const fileStructure = await this.requestAgentCompletion("file-agent", "file-structure", context);
      const importCompletions = this.generateImportCompletions(fileStructure, context);
      baseCompletions.push(...importCompletions);
    }

    if (context.isAPIContext) {
      const endpoints = await this.mcpClient.executeRequest("api-server", "list_endpoints");
      const apiCompletions = this.generateAPICompletions(endpoints, context);
      baseCompletions.push(...apiCompletions);
    }

    return baseCompletions;
  }
}
```

## 📊 Success Metrics and KPIs

### Developer Productivity Metrics

```typescript
// MCP-enhanced metrics collection
export class MCPProductivityMetrics {
  async collectMetrics(): Promise<ProductivityReport> {
    return {
      // Time-based metrics
      debuggingTime: await this.measureDebuggingTime(),
      contextSwitching: await this.measureContextSwitching(),
      deploymentTime: await this.measureDeploymentTime(),

      // Quality metrics
      bugDetectionRate: await this.calculateBugDetection(),
      codeQualityImprovement: await this.measureCodeQuality(),
      testCoverage: await this.getTestCoverage(),

      // Workflow metrics
      automatedTasksCompleted: await this.countAutomatedTasks(),
      manualInterventions: await this.countManualInterventions(),
      workflowEfficiency: await this.calculateWorkflowEfficiency(),
    };
  }
}
```

### Business Impact with A2A + MCP Architecture

**Multi-Agent Coordination Benefits:**

- **Development Velocity**: 60-80% increase (A2A enables parallel agent processing)
- **Bug Resolution Time**: 80% reduction (coordinated cross-domain analysis)
- **System Reliability**: 98% reduction in production incidents (comprehensive agent coverage)
- **Developer Satisfaction**: 95% improvement (seamless multi-agent collaboration)
- **Onboarding Time**: 75% reduction (agents coordinate to provide complete context)
- **Context Switching**: 90% reduction (single interface, coordinated agents)
- **Knowledge Discovery**: 85% improvement (agents share insights via A2A)

## 🚀 Deployment Strategy

### Phase 1: Core Infrastructure (Month 1)

- Implement MCP client service
- Deploy database and Git MCP servers
- Integrate with existing AI agents
- Basic security framework

### Phase 2: Extended Capabilities (Month 2-3)

- Add monitoring and infrastructure servers
- Implement advanced workflows
- Enhanced documentation generation
- Performance optimization tools

### Phase 3: Intelligence Layer (Month 4-6)

- Predictive analytics
- Autonomous operations
- Custom MCP server marketplace
- Enterprise features

### Phase 4: Ecosystem Expansion (Month 7-12)

- Community-driven servers
- Third-party integrations
- Advanced AI capabilities
- Global deployment

---

This comprehensive implementation guide demonstrates how MCP integration transforms CodeBuddy from a VS Code extension into a complete AI-powered development ecosystem. The real-world use cases show tangible benefits that developers will experience immediately, while the technical implementations provide a clear roadmap for execution.

**Key Takeaways:**

1. **Immediate Value**: Developers see benefits from day one
2. **Scalable Architecture**: Can grow with team and project needs
3. **Security First**: Enterprise-grade security throughout
4. **Community Driven**: Open ecosystem for extensibility
5. **ROI Focused**: Clear metrics and business impact

The MCP integration positions CodeBuddy as the foundational platform for AI-driven software development, creating unprecedented developer productivity and code quality improvements.
