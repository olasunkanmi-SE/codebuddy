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

  // Phase 1 : Eager check for Docker, but only needed for stdio
  private dockerAvailable = false;
  private dockerPath = "docker";
  private idleTimer: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000;
  private dockerWarningShown = false;
  private dockerRetryInProgress = false;

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

    // Check Docker status immediately
    try {
      this.dockerAvailable = await this.checkDockerMCP();
      if (!this.dockerAvailable) {
        this.logger.warn("Docker MCP not available - MCP features disabled");
      }
    } catch (error) {
      this.logger.error("Failed to check Docker MCP availability", error);
      this.dockerAvailable = false;
    }

    this.initialized = true;

    if (Object.keys(config).length === 0) {
      this.logger.info("No MCP Server configured");
      return;
    }

    const enabledServers = Object.entries(config).filter(
      ([_, serverConfig]) => serverConfig.enabled,
    ).length;

    if (this.isGatewayMode()) {
      this.logger.info(
        "MCP initialization complete: Docker Gateway mode - tools available on-demand",
      );
    } else {
      this.logger.info(
        `MCP initialization complete: ${enabledServers} servers available for on-demand connection`,
      );
    }
  }

  /**
   * Ensure gateway is connected
   */
  private async ensureGatewayConnected(): Promise<void> {
    this.logger.debug(
      `ensureGatewayConnected: isGatewayMode=${this.isGatewayMode()}`,
    );

    if (!this.isGatewayMode()) {
      return;
    }

    const client = this.clients.get("docker-gateway");
    if (client && client.isConnected()) {
      return;
    }

    const gatewayConfig = this.serverConfigs["docker-gateway"];
    const isSSE = (gatewayConfig as any)?.transport === "sse";

    // Only check Docker if using stdio transport (not SSE)
    if (!isSSE) {
      // Docker path already resolved in initialize()
      if (!this.dockerAvailable) {
        this.logger.warn("Docker not available (checked during init)");
        throw new Error("Docker MCP not available");
      }

      // Update command to use resolved path if available
      if (
        (gatewayConfig as any).command === "docker" &&
        this.dockerPath &&
        this.dockerPath !== "docker"
      ) {
        this.logger.info(
          `Updating Docker Gateway command to use resolved path: ${this.dockerPath}`,
        );
        (gatewayConfig as any).command = this.dockerPath;
      }

      // Ensure we inject the corrected PATH into env for the actual client connection
      if (!(gatewayConfig as any).env) {
        (gatewayConfig as any).env = {};
      }

      const currentPath = process.env.PATH || "";
      const extraPath =
        process.platform === "darwin"
          ? ":/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/local/bin"
          : "";
      (gatewayConfig as any).env.PATH = currentPath + extraPath;
    }

    this.logger.info(
      isSSE
        ? `Starting MCP Gateway via SSE to ${(gatewayConfig as any).url}...`
        : "Starting Docker MCP Gateway on-demand...",
    );
    await this.ensureServerConnected("docker-gateway");
  }

  /**
   * Re-check Docker availability when previously unavailable
   */
  private async retryDockerAvailability(): Promise<void> {
    if (this.dockerRetryInProgress) {
      return;
    }

    this.dockerRetryInProgress = true;
    try {
      const availableNow = await this.checkDockerMCP();
      this.dockerAvailable = availableNow;
      if (availableNow) {
        this.logger.info(
          "Docker MCP detected on retry; enabling gateway mode.",
        );
      }
    } finally {
      this.dockerRetryInProgress = false;
    }
  }

  /**
   * Reset idle timer after activity
   */
  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(async () => {
      this.logger.info(
        `MCP Gateway idle for ${this.IDLE_TIMEOUT_MS / 1000}s, shutting down to save resources...`,
      );
      await this.shutdownIdleGateway();
    }, this.IDLE_TIMEOUT_MS);
  }

  /**
   * Shutdown gateway when idle
   */
  private async shutdownIdleGateway(): Promise<void> {
    if (!this.isGatewayMode()) {
      return;
    }

    const client = this.clients.get("docker-gateway");
    if (client) {
      try {
        await client.disconnect();
        this.clients.delete("docker-gateway");
        this.toolsLoadedPerServer.delete("docker-gateway");

        // Clear tool caches for this server
        const serverTools = this.toolsByServer.get("docker-gateway") ?? [];
        for (const tool of serverTools) {
          const existing = this.toolsByName.get(tool.name) ?? [];
          const filtered = existing.filter(
            (t) => t.serverName !== "docker-gateway",
          );
          if (filtered.length === 0) {
            this.toolsByName.delete(tool.name);
          } else {
            this.toolsByName.set(tool.name, filtered);
          }
        }
        this.toolsByServer.delete("docker-gateway");

        this.logger.info("Docker MCP Gateway shutdown complete (idle timeout)");
      } catch (error) {
        this.logger.error("Error during idle gateway shutdown:", error);
      }
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
    this.logger.debug(`ensureToolsLoaded for "${serverName}"`);

    if (this.toolsLoadedPerServer.get(serverName)) {
      this.logger.debug(`Tools already loaded for "${serverName}"`);
      return;
    }

    await this.ensureServerConnected(serverName);
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server "${serverName}" not found`);
    }

    try {
      this.logger.debug(`Getting tools from client "${serverName}"...`);
      const tools = await client.getTools();
      this.logger.debug(`Got ${tools.length} tools from "${serverName}"`);

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

  /** Expose the merged server configs (docker-gateway + user-defined). */
  getServerConfigs(): MCPServersConfig {
    return this.serverConfigs;
  }

  async getAllTools(): Promise<MCPTool[]> {
    this.logger.debug("getAllTools called");

    // Ensure initialization is complete
    if (!this.initialized) {
      await this.initialize();
    }

    // Phase 1: Ensure gateway is connected (lazy start)
    // Only attempt connection if Docker IS available
    if (this.dockerAvailable) {
      try {
        await this.ensureGatewayConnected();
      } catch (error) {
        this.logger.error("Failed to connect to gateway", error);
      }
    } else {
      await this.retryDockerAvailability();
      if (!this.dockerAvailable) {
        this.logger.warn(
          "Skipping gateway connection because Docker is not available",
        );
      }
    }

    this.resetIdleTimer();

    if (this.isGatewayMode()) {
      // If docker is not available, we can't do anything in gateway mode
      if (!this.dockerAvailable) {
        if (!this.dockerWarningShown) {
          this.dockerWarningShown = true;
          vscode.window.showWarningMessage(
            "CodeBuddy MCP: Docker MCP gateway not detected. Start Docker Desktop (with MCP enabled) or install the MCP CLI, then retry.",
          );
        }
        return [];
      }

      // Gateway mode: load from single unified source
      if (!this.toolsLoadedPerServer.get("docker-gateway")) {
        try {
          await this.ensureToolsLoaded("docker-gateway");
        } catch (error) {
          this.logger.error("Failed to load tools from gateway", error);
        }
      }
    } else {
      this.logger.debug("In multi-server mode");
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

    // Return all tools, filtering out disabled ones
    const allTools = Array.from(this.toolsByName.values()).flat();
    const disabledSets = new Map<string, Set<string>>();
    for (const tool of allTools) {
      if (!disabledSets.has(tool.serverName)) {
        disabledSets.set(
          tool.serverName,
          this.getDisabledTools(tool.serverName),
        );
      }
    }
    const tools = allTools.filter(
      (t) => !disabledSets.get(t.serverName)?.has(t.name),
    );
    this.logger.debug(
      `getAllTools returning ${tools.length} tools (${allTools.length - tools.length} disabled)`,
    );
    return tools;
  }

  async getToolsFromServer(serverName: string): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }

    await this.ensureToolsLoaded(serverName);
    return this.toolsByServer.get(serverName) ?? [];
  }

  async callTool(
    toolName: string,
    args: any,
    preferredServer?: string,
  ): Promise<MCPToolResult> {
    if (!this.initialized) {
      throw new Error("MCP service not initialized");
    }

    // Phase 1: Ensure gateway is connected (lazy start)
    await this.ensureGatewayConnected();

    // Phase 2: Reset idle timer on every tool call
    this.resetIdleTimer();

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

    if (!tools || tools.length === 0) {
      await this.getAllTools();
      tools = this.toolsByName.get(name);

      if (!tools || tools.length === 0) {
        this.failureCount++;
        throw new Error(`Tool "${name}" not found in any connected server`);
      }
    }

    const candidateTools = server
      ? tools.filter((t) => t.serverName === server)
      : tools;

    if (candidateTools.length === 0) {
      this.failureCount++;
      throw new Error(`Tool "${name}" not found on server "${server}"`);
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
    const servers = getConfigValue("codebuddy.mcp.servers");
    this.logger.debug(
      `loadConfiguration - mcp.servers from config: ${JSON.stringify(servers)}`,
    );

    // Start with docker-gateway as default
    const result: MCPServersConfig = {
      "docker-gateway": {
        command: "docker",
        args: ["mcp", "gateway", "run"],
        description: "Docker MCP Gateway (all Catalog tools)",
        enabled: true,
      },
    };

    if (!servers || Object.keys(servers).length === 0) {
      this.logger.info(
        "No custom MCP configuration found, using Docker Gateway default",
      );
      return result;
    }

    // Deep copy to avoid proxy mutation issues and merge with gateway
    const serversCopy: MCPServersConfig = JSON.parse(JSON.stringify(servers));
    Object.assign(result, serversCopy);

    this.logger.info(
      `Found ${Object.keys(result).length} configured MCP Server(s) (including Docker Gateway)`,
    );
    return result;
  }

  /**
   * Get the set of disabled tool names for a given server.
   */
  getDisabledTools(serverName: string): Set<string> {
    const allDisabled: Record<string, string[]> =
      getConfigValue("codebuddy.mcp.disabledTools") || {};
    const disabled = allDisabled[serverName] || [];
    return new Set(disabled);
  }

  private async checkDockerMCP(): Promise<boolean> {
    const potentialPaths = [
      "docker",
      "/usr/local/bin/docker",
      "/opt/homebrew/bin/docker",
      "/usr/bin/docker",
      "/opt/local/bin/docker",
    ];

    for (const cmd of potentialPaths) {
      if (await this.testDockerCommand(cmd)) {
        this.dockerPath = cmd;
        this.logger.info(`Found Docker executable at: ${cmd}`);
        return true;
      }
    }

    return false;
  }

  private testDockerCommand(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { spawn } = require("child_process");
        // Ensure we pass environment where PATH includes standard binary locations
        const env = {
          ...process.env,
          PATH:
            process.env.PATH +
            (process.platform === "darwin"
              ? ":/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
              : ""),
        };

        const proc = spawn(command, ["mcp", "--help"], {
          stdio: "pipe",
          env,
          shell: false,
        });

        proc.on("error", () => resolve(false));
        proc.on("exit", (code: number | null) => resolve(code === 0));

        setTimeout(() => {
          proc.kill();
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

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

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
    this.dockerAvailable = false;

    this.logger.info("MCP service disposed");
  }

  async reload(): Promise<void> {
    this.logger.info("Reloading MCP Configurations....");
    await this.dispose();
    await this.initialize();
  }
}
