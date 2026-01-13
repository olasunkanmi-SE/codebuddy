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
  private serverConfigs: MCPServersConfig = {};
  private toolsLoadedPerServer = new Map<string, boolean>();

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
    this.initialize();
  }

  static getInstance(): MCPService {
    return (MCPService.instance ??= new MCPService());
  }

  async initialize(): Promise<void> {
    this.logger.info("Initializing MCP service...");

    const hasDocker = await this.checkDockerMCP();
    if (!hasDocker) {
      this.logger.warn("Docker MCP not available - MCP features disabled");
      vscode.window.showErrorMessage(
        "Docker MCP not available. Install Docker Desktop 27.0.0+"
      );
      throw new Error(
        "Docker MCP not available. Install Docker Desktop 27.0.0+"
      );
    }

    const config = this.loadConfiguration();
    this.serverConfigs = config;
    this.initialized = true;

    if (Object.keys(config).length === 0) {
      this.logger.info("No MCP Server configured");
      return;
    }

    const enabledServers = Object.entries(config).filter(
      ([_, serverConfig]) => serverConfig.enabled
    ).length;
    this.logger.info(
      `MCP initialization complete: ${enabledServers} servers available for on-demand connection`
    );
  }

  async ensureServerConnected(serverName: string): Promise<void> {
    if (this.clients.has(serverName)) {
      const client = this.clients.get(serverName);
      if (client?.isConnected) {
        return;
      }
    }

    const config = this.serverConfigs[serverName];
    if (!config) {
      throw new Error(`Server "${serverName}" not found in configuration`);
    }

    if (!config.enabled) {
      throw new Error(`Server "${serverName}" is disabled`);
    }

    await this.connectToServer(serverName, config);
  }

  async ensureToolsLoaded(serverName: string) {
    if (this.toolsLoadedPerServer.get(serverName)) {
      return;
    }

    await this.ensureServerConnected(serverName);
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server "${serverName}" not found`);
    }

    try {
      const tools = await client.getTools();
      const toolsEntries = tools.map((tool) => [tool.name, tool] as const);
      toolsEntries.forEach(([name, tool]) => this.toolsByName.set(name, tool));
      this.toolsByServer.set(serverName, tools);
      this.toolsLoadedPerServer.set(serverName, true);
      this.logger.info(`Loaded ${tools.length} tools from ${serverName}`);
    } catch (error) {
      this.logger.error(`Failed to load tools from ${serverName}:`, error);
      throw error;
    }
  }

  async refreshTools(serverName?: string): Promise<void> {
    if (serverName) {
      this.toolsLoadedPerServer.set(serverName, false);
      const toolsToRemove = this.toolsByServer.get(serverName) ?? [];
      for (const tool of toolsToRemove) {
        this.toolsByName.delete(tool.name);
      }
      this.toolsByServer.delete(serverName);

      await this.ensureServerConnected(serverName);
    } else {
      this.toolsByName.clear();
      this.toolsByServer.clear();
      this.toolsLoadedPerServer.clear();

      const loadedPromises = Array.from(this.clients.keys()).map((name) =>
        this.ensureServerConnected(name).catch((error) => {
          this.logger.error(`Failed to load tools from ${name}:`, error);
        })
      );

      await Promise.all(loadedPromises);

      this.logger.info(
        `Loaded ${this.toolsByName.size} total tools from all servers`
      );
    }
  }

  getClient(serverName: string): MCPClient | undefined {
    return this.clients.get(serverName);
  }

  async getAllTools(): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }
    const loadedPromises = Object.entries(this.serverConfigs)
      .filter(([_, config]) => config.enabled)
      .filter(([serverName]) => !this.toolsLoadedPerServer.get(serverName))
      .map(([serverName]) =>
        this.ensureToolsLoaded(serverName).catch((error) => {
          this.logger.error(`Failed to load tools from ${serverName}:`, error);
        })
      );
    await Promise.all(loadedPromises);
    return Array.from(this.toolsByName.values());
  }

  async getToolsFromServer(serverName: string) {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }

    await this.ensureToolsLoaded(serverName);
    return this.toolsByServer.get(serverName) ?? [];
  }

  async callTool(toolName: string, args: any): Promise<MCPToolResult> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }
    this.invocationCount++;

    let tool = this.toolsByName.get(toolName);
    if (!tool) {
      this.logger.debug(
        `Tool "${toolName}" not in cache, searching servers...`
      );

      await this.getAllTools();
      tool = this.toolsByName.get(toolName);

      if (!tool) {
        this.failureCount++;
        throw new Error(`Server "${toolName}" not connected`);
      }
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
        (c) => c.isConnected
      ).length,
      totalTools: this.toolsByName.size,
      toolsByServer: Object.fromEntries(
        Array.from(this.toolsByServer.entries()).map(([name, tools]) => [
          name,
          tools.length,
        ])
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
      `Found ${Object.keys(servers).length} configured MCP Servers`
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
    serverConfig: MCPServerConfig
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
    return this.toolsByName.size;
  }

  async dispose() {
    this.logger.info("Disposing MCP servers");
    const disconnectPromises = Array.from(this.clients.values()).map((client) =>
      client
        .disconnect()
        .catch((error) =>
          this.logger.error(
            `Error disconnecting ${client.getServerName()}`,
            error
          )
        )
    );
    await Promise.all(disconnectPromises);
    this.clients.clear();
    this.serverConfigs = {};
    this.toolsByName.clear();
    this.toolsByServer.clear();
    this.toolsLoadedPerServer.clear();
    this.initialized = false;

    this.logger.info("MCP service disposed");
  }

  async reload() {
    this.logger.info("Reloading MCP Configurations....");
    await this.dispose();
    await this.initialize();
  }
}
