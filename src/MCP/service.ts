import { spawn } from "child_process";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { getConfigValue } from "../utils/utils";
import { MCPClient } from "./client";
import {
  MCPServerConfig,
  MCPServersConfig,
  MCPServiceStats,
  MCPTool,
  MCPToolResult,
} from "./types";

export class MCPService implements vscode.Disposable {
  private static instance: MCPService;
  private clients = new Map<string, MCPClient>();
  private initialized = false;
  private allTools: MCPTool[] = [];

  private toolsByName = new Map<string, MCPTool>();
  private toolsByServer = new Map<string, MCPTool[]>();
  private invocationCount = 0;
  private failureCount = 0;
  private readonly logger: Logger;

  constructor() {
    this.logger = Logger.initialize("MCPService", {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  async initialize(): Promise<void> {
    this.logger.info("Initializing MCP service...");

    const hasDocker = await this.checkDockerMCP();
    if (!hasDocker) {
      this.logger.warn("Docker MCP not available - MCP features disabled");
      vscode.window.showErrorMessage(
        "Docker MCP not available. Install Docker Desktop 27.0.0+",
      );
      throw new Error(
        "Docker MCP not available. Install Docker Desktop 27.0.0+",
      );
    }

    const config = this.loadConfiguration();

    if (Object.keys(config).length === 0) {
      this.logger.info("No MCP Server configured");
      this.initialized = true;
      return;
    }

    const connectionPromises = Object.entries(config)
      .filter(([_, serverConfig]) => serverConfig.enabled)
      .map(([servername, serverConfig]) =>
        this.connectToServer(servername, serverConfig),
      );

    const results = await Promise.allSettled(connectionPromises);
    const successful = results.filter((r) => r.status === "fulfilled").length;

    const failed = results.filter((r) => r.status === "rejected").length;

    this.logger.info(
      `MCP initialization complete: ${successful} servers connected, ${failed} failed`,
    );
  }

  async refreshTools(): Promise<void> {
    const toolArrays = await Promise.all(
      Array.from(this.clients.values()).map(async (client) => {
        try {
          return await client.getTools();
        } catch (error) {
          this.logger.error(
            `Failed to load tools from ${client.getServerName()}:`,
            error,
          );
        }
        return [];
      }),
    );

    this.allTools = toolArrays.flat();
    this.toolsByName.clear();
    this.toolsByServer.clear();

    for (const tool of this.allTools) {
      this.toolsByName.set(tool.name, tool);
      if (!this.toolsByServer.has(tool.serverName)) {
        this.toolsByServer.set(tool.serverName, []);
      }
      this.toolsByServer.get(tool.serverName)!.push(tool);
    }

    this.logger.info(
      `Loaded ${this.allTools.length} total tools from all servers`,
    );
  }

  getClient(serverName: string): MCPClient | undefined {
    return this.clients.get(serverName);
  }

  async getAllTools(): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }
    return this.allTools;
  }

  getAllToolsSync() {
    return this.allTools;
  }

  async callTool(toolName: string, args: any): Promise<MCPToolResult> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }
    this.invocationCount++;

    const tool = this.toolsByName.get(toolName);
    if (!tool) {
      this.failureCount++;
      throw new Error(`Tool "${toolName}" not found`);
    }

    const client = this.clients.get(tool.serverName);
    if (!client || !client.isConnected) {
      this.failureCount++;
      throw new Error(`Server "${tool.serverName}" not connected`);
    }

    try {
      const result = await client?.callTool(toolName, args);
      if (result.isError) {
        this.failureCount++;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      throw error;
    }
  }

  getStat(): MCPServiceStats {
    return {
      connectedServers: Array.from(this.clients.values()).filter(
        (c) => c.isConnected,
      ).length,
      totalTools: this.allTools.length,
      toolsByServer: Object.fromEntries(
        Array.from(this.toolsByServer.entries()).map(([name, client]) => [
          name,
          this.allTools.filter((t) => t.serverName === name).length,
        ]),
      ),
      totalInvocations: this.invocationCount,
      failedInvocations: this.failureCount,
      lastRefresh: Date.now(),
    };
  }

  private loadConfiguration(): MCPServersConfig {
    const servers = getConfigValue("mcp.servers");
    if (!servers || Object.keys(servers).length === 0) {
      return {
        "docker-gateway": {
          command: "docker",
          args: ["mcp", "gateway", "run"],
          description: "Docker MCP Gateway (all Catalog tools)",
          enabled: true,
        },
      };
    }
    this.logger.info(
      `Found ${Object.keys(servers).length} configured MCP Servers`,
    );
    return servers;
  }

  private checkDockerMCP(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const process = spawn("docker", ["mcp", "--help"], {
          stdio: "pipe",
        });
        process.on("error", () => resolve(false));
        process.on("exit", (code) => resolve(code === 0));

        setTimeout(() => {
          process.kill();
          resolve(false);
        }, 5000);
      } catch {
        resolve(false);
      }
    });
  }

  private async connectToServer(
    serverName: string,
    serverConfig: MCPServerConfig,
  ) {
    try {
      const client = new MCPClient(serverName, serverConfig);
      await client.connect();
      this.logger.info(`Connected to Server: ${serverName}`);
      this.clients.set(serverName, client);
    } catch (error: any) {
      this.logger.error(`Failed to connect to ${serverName}`, error);
      throw error;
    }
  }

  getToolCount(): number {
    return this.allTools.length;
  }

  async dispose() {
    this.logger.info("Disposing MCP servers");
    const disconnectPromises = Array.from(this.clients.values()).map((client) =>
      client
        .disconnect()
        .catch((error) =>
          this.logger.error(
            `Error disconnecting ${client.getServerName()}`,
            error,
          ),
        ),
    );
    await Promise.all(disconnectPromises);
    this.clients.clear();
    this.allTools = [];
    this.toolsByName.clear();
    this.toolsByServer.clear();
    this.initialized = false;

    this.logger.info("MCP service disposed");
  }

  async reload() {
    this.logger.info("Reloading MCP Configurations....");
    await this.dispose();
    this.clients.clear();
    this.initialized = false;
    this.allTools = [];

    await this.initialize();
  }
}
