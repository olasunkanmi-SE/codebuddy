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

  // Tool storage: support multiple tools with same name
  private toolsByName = new Map<string, MCPTool[]>();
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

    const config = this.loadConfiguration();
    this.serverConfigs = config;
    this.initialized = true;

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

    if (Object.keys(config).length === 0) {
      this.logger.info("No MCP Server configured");
      return;
    }

    const enabledServers = Object.entries(config).filter(
      ([_, serverConfig]) => serverConfig.enabled,
    ).length;

    if (this.isGatewayMode()) {
      this.logger.info(
        "MCP initialization complete: Docker Gateway mode - unified catalog with 200+ tools available on-demand",
      );
    } else {
      this.logger.info(
        `MCP initialization complete: ${enabledServers} servers available for on-demand connection`,
      );
    }
  }

  /**
   * Check if running in Docker Gateway mode (single unified catalog)
   */
  private isGatewayMode(): boolean {
    return (
      Object.keys(this.serverConfigs).length === 1 &&
      this.serverConfigs["docker-gateway"]?.enabled === true
    );
  }

  async ensureServerConnected(serverName: string): Promise<void> {
    if (this.clients.has(serverName)) {
      const client = this.clients.get(serverName);
      if (client && client.isConnected && client.isConnected()) {
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

  async ensureToolsLoaded(serverName: string): Promise<void> {
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

      // Store tools by server
      this.toolsByServer.set(serverName, tools);

      // Store tools by name (supporting multiple tools with same name)
      for (const tool of tools) {
        const existing = this.toolsByName.get(tool.name) ?? [];
        existing.push(tool);
        this.toolsByName.set(tool.name, existing);
      }

      this.toolsLoadedPerServer.set(serverName, true);

      if (this.isGatewayMode()) {
        this.logger.info(
          `Loaded ${tools.length} tools from Docker Gateway (unified catalog)`,
        );
      } else {
        this.logger.info(`Loaded ${tools.length} tools from ${serverName}`);
      }

      // Log any name collisions
      const collisions = Array.from(this.toolsByName.entries())
        .filter(([_, tools]) => tools.length > 1)
        .map(([name, tools]) => `${name} (${tools.length} servers)`);

      if (collisions.length > 0) {
        this.logger.debug(
          `Tool name collisions detected: ${collisions.join(", ")}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to load tools from ${serverName}:`, error);
      throw error;
    }
  }

  async refreshTools(serverName?: string): Promise<void> {
    if (serverName) {
      // Refresh single server
      this.logger.info(`Refreshing tools from ${serverName}...`);

      this.toolsLoadedPerServer.delete(serverName);

      // Remove tools from this server
      const tools = this.toolsByServer.get(serverName) ?? [];
      for (const tool of tools) {
        const existing = this.toolsByName.get(tool.name) ?? [];
        const filtered = existing.filter((t) => t.serverName !== serverName);
        if (filtered.length === 0) {
          this.toolsByName.delete(tool.name);
        } else {
          this.toolsByName.set(tool.name, filtered);
        }
      }
      this.toolsByServer.delete(serverName);

      // Reload tools
      await this.ensureToolsLoaded(serverName);
    } else {
      // Refresh all servers
      this.logger.info("Refreshing all tools...");

      this.toolsByName.clear();
      this.toolsByServer.clear();
      this.toolsLoadedPerServer.clear();

      // Only reload servers that are currently connected
      const connectedServers = Array.from(this.clients.keys());
      const results = await Promise.allSettled(
        connectedServers.map((name) => this.ensureToolsLoaded(name)),
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        this.logger.warn(
          `Failed to reload tools from ${failures.length} server(s)`,
        );
      }

      this.logger.info(
        `Loaded ${this.getUniqueToolCount()} unique tools from ${connectedServers.length} server(s)`,
      );
    }
  }

  getClient(serverName: string): MCPClient | undefined {
    return this.clients.get(serverName);
  }

  async getAllTools(): Promise<MCPTool[]> {
    if (this.isGatewayMode()) {
      // Gateway mode: load from single unified source
      if (!this.toolsLoadedPerServer.get("docker-gateway")) {
        await this.ensureToolsLoaded("docker-gateway");
      }
    } else {
      // Multi-server mode: load from each enabled server
      const loadPromises = Object.entries(this.serverConfigs)
        .filter(([_, config]) => config.enabled)
        .filter(([serverName]) => !this.toolsLoadedPerServer.get(serverName))
        .map(([serverName]) =>
          this.ensureToolsLoaded(serverName).catch((error) => {
            this.logger.error(
              `Failed to load tools from ${serverName}:`,
              error,
            );
          }),
        );

      await Promise.all(loadPromises);
    }

    // Return all tools (flattened from the multi-value map)
    return Array.from(this.toolsByName.values()).flat();
  }

  async getToolsFromServer(serverName: string): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }

    await this.ensureToolsLoaded(serverName);
    return this.toolsByServer.get(serverName) ?? [];
  }

  /**
   * Call a tool by name. If multiple servers provide the same tool,
   * tries the first one. You can specify serverName.toolName to be explicit.
   */
  async callTool(
    toolName: string,
    args: any,
    preferredServer?: string,
  ): Promise<MCPToolResult> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }
    this.invocationCount++;

    // Support serverName.toolName syntax
    let server = preferredServer;
    let name = toolName;
    if (toolName.includes(".")) {
      const parts = toolName.split(".", 2);
      server = parts[0];
      name = parts[1];
    }

    let tools = this.toolsByName.get(name);

    // If tool not in cache, try loading all tools
    if (!tools || tools.length === 0) {
      this.logger.debug(`Tool "${name}" not in cache, loading all tools...`);

      await this.getAllTools();
      tools = this.toolsByName.get(name);

      if (!tools || tools.length === 0) {
        this.failureCount++;
        throw new Error(`Tool "${name}" not found in any connected server`);
      }
    }

    // Filter by preferred server if specified
    const candidateTools = server
      ? tools.filter((t) => t.serverName === server)
      : tools;

    if (candidateTools.length === 0) {
      this.failureCount++;
      throw new Error(`Tool "${name}" not found on server "${server}"`);
    }

    // Log warning if multiple tools match and no preference specified
    if (!server && candidateTools.length > 1) {
      this.logger.debug(
        `Multiple servers provide "${name}": ${candidateTools
          .map((t) => t.serverName)
          .join(", ")}. Using ${candidateTools[0].serverName}`,
      );
    }

    const tool = candidateTools[0];
    const client = this.clients.get(tool.serverName);

    if (!client || !client.isConnected || !client.isConnected()) {
      this.failureCount++;
      throw new Error(`Server "${tool.serverName}" not connected`);
    }

    try {
      const result = await client.callTool(name, args);
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
        (c) => c.isConnected && c.isConnected(),
      ).length,
      totalTools: this.getAllToolsSync().length,
      uniqueTools: this.getUniqueToolCount(),
      toolsByServer: Object.fromEntries(
        Array.from(this.toolsByServer.entries()).map(([name, tools]) => [
          name,
          tools.length,
        ]),
      ),
      totalInvocations: this.invocationCount,
      failedInvocations: this.failureCount,
      isGatewayMode: this.isGatewayMode(),
      lastRefresh: Date.now(),
    };
  }

  private getUniqueToolCount(): number {
    return this.toolsByName.size;
  }

  private getAllToolsSync(): MCPTool[] {
    return Array.from(this.toolsByName.values()).flat();
  }

  private loadConfiguration(): MCPServersConfig {
    const servers = getConfigValue("mcp.servers");
    if (!servers || Object.keys(servers).length === 0) {
      this.logger.info(
        "No custom MCP configuration found, using Docker Gateway default",
      );
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
      `Found ${Object.keys(servers).length} configured MCP Server(s)`,
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

  /**
   * Connect to a server with retry logic for resilience
   */
  private async connectToServer(
    serverName: string,
    serverConfig: MCPServerConfig,
    maxRetries = 3,
  ): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const client = new MCPClient(serverName, serverConfig);
        await client.connect();

        this.clients.set(serverName, client);

        if (this.isGatewayMode()) {
          this.logger.info(
            `Connected to Docker Gateway - unified MCP catalog ready`,
          );
        } else {
          this.logger.info(`Connected to Server: ${serverName}`);
        }
        return;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries - 1;

        if (isLastAttempt) {
          this.logger.error(
            `Failed to connect to ${serverName} after ${maxRetries} attempts`,
            error,
          );
          throw error;
        }

        const waitTime = 1000 * (attempt + 1);
        this.logger.warn(
          `Connection attempt ${attempt + 1} failed for ${serverName}, retrying in ${waitTime}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  getToolCount(): number {
    return this.getAllToolsSync().length;
  }

  async dispose(): Promise<void> {
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
    this.serverConfigs = {};
    this.toolsByName.clear();
    this.toolsByServer.clear();
    this.toolsLoadedPerServer.clear();
    this.initialized = false;

    this.logger.info("MCP service disposed");
  }

  async reload(): Promise<void> {
    this.logger.info("Reloading MCP Configurations....");
    await this.dispose();
    await this.initialize();
  }
}
