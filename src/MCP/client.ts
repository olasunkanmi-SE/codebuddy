import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChildProcess, spawn } from "child_process";
import {
  MCPClientState,
  MCPServerConfig,
  MCPTool,
  MCPToolResult,
} from "./types";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private state: MCPClientState = MCPClientState.DISCONNECTED;
  private toolCache: MCPTool[] | null = null;
  private toolCacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly logger: Logger;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor(
    private readonly serverName: string,
    private readonly config: MCPServerConfig
  ) {
    this.logger = Logger.initialize(`MCPClient:${serverName}`, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });

    this.client = new Client(
      { name: "CodeBuddy-Client", version: "1.0.0" },
      {
        capabilities: {
          sampling: {
            tools: {},
          },
          experimental: {
            prompts: {},
            resources: {},
          },
        },
      }
    );
  }

  async connect(): Promise<void> {
    if (this.state === MCPClientState.CONNECTED) return;

    if (this.state === MCPClientState.CONNECTING) {
      throw new Error(`Connection already in progress for ${this.serverName}`);
    }

    this.state = MCPClientState.CONNECTING;
    this.logger.info(`Connecting to MCP server: ${this.serverName}`);
    try {
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env: { ...this.config.env },
      });

      this.transport.onerror = (error) => {
        this.logger.error(`Transport error [${this.serverName}]:`, error);
        this.state = MCPClientState.ERROR;
        this.attemptReconnect();
      };

      this.transport.onclose = () => {
        this.logger.warn(`Transport closed [${this.serverName}]`);
        this.state = MCPClientState.DISCONNECTED;
        this.attemptReconnect();
      };

      await this.client.connect(this.transport);
      this.state = MCPClientState.CONNECTED;
      this.reconnectAttempts = 0;
      this.logger.info(`✅ Connected to MCP server: ${this.serverName}`);
    } catch (error: any) {
      this.state = MCPClientState.ERROR;
      this.cleanup();
      this.logger.error(`Failed to connect to ${this.serverName}:`, error);
      throw new Error(
        `MCP connection failed [${this.serverName}]: ${error.message}`
      );
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(
        `Max reconnection attempts reached for ${this.serverName}`
      );
      return;
    }
    this.reconnectAttempts++;
    const MAX_RECONNECT_DELAY_MS = 30000;
    const baseDelay = 1000 * Math.pow(2, this.reconnectAttempts - 1);
    const delay = Math.min(baseDelay, MAX_RECONNECT_DELAY_MS);
    this.logger.info(
      `Reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`
    );
    setTimeout(() => {
      this.connect().catch((error) => {
        this.logger.error("Reconnection failed:", error);
      });
    }, delay);
  }

  async getTools() {
    if (this.toolCache && Date.now() < this.toolCacheExpiry) {
      return this.toolCache;
    }

    await this.connect();
    try {
      const response = await this.client.listTools();
      this.toolCache = response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as any,
        serverName: this.serverName,
        metadata: {},
      }));
      this.toolCacheExpiry = Date.now() + this.CACHE_TTL_MS;
      this.logger.info(
        `Loaded ${this.toolCache.length} tools from ${this.serverName}`
      );

      return this.toolCache;
    } catch (error) {
      this.logger.error(`Failed to list tools from ${this.serverName}:`, error);
      throw error;
    }
  }

  async callTool(toolName: string, args: any): Promise<MCPToolResult> {
    await this.connect();
    const startTime = Date.now();

    try {
      this.logger.debug(`Calling tool: ${toolName}`, { args });
      const result = (await this.client.callTool({
        name: toolName,
        arguments: args,
      })) as any;

      const duration = Date.now() - startTime;

      this.logger.info(`Tool call succeeded: ${toolName} (${duration}ms)`);
      return {
        content: result.content,
        isError: result.isError,
        metadata: {
          duration,
          serverName: this.serverName,
          toolName,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.logger.error(`Tool call failed: ${toolName} (${duration}ms)`, error);

      return {
        content: [
          {
            type: "text",
            text: `Error calling ${toolName}: ${error.message}`,
          },
        ],
        isError: true,
        metadata: {
          duration,
          serverName: this.serverName,
          toolName,
        },
      };
    }
  }

  async disconnect(): Promise<void> {
    if ((this.state = MCPClientState.DISCONNECTED)) return;
    this.logger.info(`Disconnecting from ${this.serverName}...`);
    try {
      this.client.close();
    } catch (error) {
      this.logger.error(`Error closing client ${this.serverName}:`, error);
    }

    this.cleanup();
    this.logger.info(`Disconnected from ${this.serverName}`);
  }

  private cleanup(): void {
    if (this.process && !this.process.killed) {
      const killTimeout = setTimeout(() => {
        (this.process?.kill("SIGTERM"), 5000);
      });
      this.process.on("exit", () => clearTimeout(killTimeout));
      this.process.kill("SIGTERM");
    }

    this.transport = null;
    this.process = null;
    this.state = MCPClientState.DISCONNECTED;
    this.toolCache = null;
    this.toolCacheExpiry = 0;
  }

  isConnected(): boolean {
    return this.state === MCPClientState.CONNECTED;
  }

  getState(): MCPClientState {
    return this.state;
  }

  getServerName(): string {
    return this.serverName;
  }

  getConfig(): MCPServerConfig {
    return this.config;
  }
}
