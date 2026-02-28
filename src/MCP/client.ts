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
import {
  NotificationService,
  NotificationSource,
} from "../services/notification.service";

export class MCPClient {
  private client: Client;
  private transport: any | null = null;
  private process: ChildProcess | null = null;
  private state: MCPClientState = MCPClientState.DISCONNECTED;
  private toolCache: MCPTool[] | null = null;
  private toolCacheExpiry = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly logger: Logger;
  private readonly notificationService: NotificationService;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor(
    private readonly serverName: string,
    private readonly config: MCPServerConfig,
    notificationService?: NotificationService,
  ) {
    this.logger = Logger.initialize(`MCPClient:${serverName}`, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.notificationService =
      notificationService ?? NotificationService.getInstance();

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
      },
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
      // Choose transport based on server config
      const configAny = this.config as any;
      const isSSE = configAny.transport === "sse" && configAny.url;

      if (isSSE) {
        try {
          // Dynamically import SSE transport from SDK
          const { SSEClientTransport } =
            await import("@modelcontextprotocol/sdk/client/sse.js");
          const url = new URL(configAny.url);
          this.transport = new SSEClientTransport(url);
          this.logger.info(
            `Using SSE transport to ${configAny.url} for ${this.serverName}`,
          );
        } catch (err: any) {
          // Don't fall back to stdio if SSE was explicitly requested
          this.state = MCPClientState.ERROR;
          throw new Error(
            `SSE transport requested but not available: ${err.message}. ` +
              `Make sure @modelcontextprotocol/sdk is up to date and SSE server is running at ${configAny.url}`,
          );
        }
      } else if (this.config.command) {
        // Stdio transport (subprocess)
        // IMPORTANT: Merge with process.env to preserve PATH and other critical vars
        // Filter out undefined values to satisfy type requirements
        const mergedEnv: Record<string, string> = {};
        for (const [key, value] of Object.entries(process.env)) {
          if (value !== undefined) {
            mergedEnv[key] = value;
          }
        }
        if (this.config.env) {
          Object.assign(mergedEnv, this.config.env);
        }

        this.transport = new StdioClientTransport({
          command: this.config.command,
          args: this.config.args,
          env: mergedEnv,
        });
        this.logger.info(
          `Using stdio transport for ${this.serverName}: ${this.config.command} ${(this.config.args || []).join(" ")}`,
        );
      } else {
        this.state = MCPClientState.ERROR;
        throw new Error(
          `Invalid MCP server config for ${this.serverName}: ` +
            `Either set transport='sse' with url, or provide command for stdio`,
        );
      }

      // Try to capture any underlying spawned process from the transport implementation
      try {
        // Some transports expose the child process under different names
        // (process, child, proc). Try common properties safely.
        const anyTransport = this.transport as any;
        this.process =
          anyTransport.process ??
          anyTransport.child ??
          anyTransport.proc ??
          null;
        if (this.process) {
          this.logger.debug(
            `Captured transport child process for ${this.serverName}: pid=${this.process.pid}`,
          );
        }
      } catch (err) {
        this.logger.debug(
          "Unable to capture transport child process",
          err as any,
        );
      }

      if (this.transport) {
        this.transport.onerror = (error: any) => {
          this.logger.error(`Transport error [${this.serverName}]:`, error);
          this.state = MCPClientState.ERROR;
          this.attemptReconnect();
        };

        this.transport.onclose = (code?: number, reason?: any) => {
          this.logger.warn(
            `Transport closed [${this.serverName}] code=${code} reason=${String(reason)}`,
          );
          this.state = MCPClientState.DISCONNECTED;
          this.attemptReconnect();
        };
      } else {
        this.logger.warn(
          `Transport is null for ${this.serverName}, cannot attach error/close handlers`,
        );
      }

      if (!this.transport) {
        this.logger.error(`No transport available for ${this.serverName}`);
        throw new Error(`Transport not initialized for ${this.serverName}`);
      }
      await this.client.connect(this.transport);
      this.state = MCPClientState.CONNECTED;
      this.reconnectAttempts = 0;
      this.logger.info(`✅ Connected to MCP server: ${this.serverName}`);
    } catch (error: any) {
      this.state = MCPClientState.ERROR;
      this.cleanup();
      this.logger.error(`Failed to connect to ${this.serverName}:`, error);
      throw new Error(
        `MCP connection failed [${this.serverName}]: ${error.message}`,
      );
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(
        `Max reconnection attempts reached for ${this.serverName}`,
      );
      this.notificationService.addNotification(
        "error",
        "MCP Reconnection Failed",
        `MCP server "${this.serverName}" disconnected and could not reconnect after ${this.MAX_RECONNECT_ATTEMPTS} attempts.`,
        NotificationSource.MCP,
      );
      return;
    }
    this.reconnectAttempts++;
    const MAX_RECONNECT_DELAY_MS = 30000;
    const baseDelay = 1000 * Math.pow(2, this.reconnectAttempts - 1);
    const delay = Math.min(baseDelay, MAX_RECONNECT_DELAY_MS);
    this.logger.info(
      `Reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`,
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
        `Loaded ${this.toolCache.length} tools from ${this.serverName}`,
      );

      return this.toolCache;
    } catch (error: any) {
      this.logger.error(`Failed to list tools from ${this.serverName}:`, error);
      // If the failure appears to be a connection closure, attempt a reconnect and retry once
      const msg = String(error?.message ?? "").toLowerCase();
      if (
        msg.includes("connection closed") ||
        msg.includes("transport closed") ||
        error?.code === -32000
      ) {
        this.logger.info(
          "Detected closed connection while listing tools, attempting reconnect and retry...",
        );
        try {
          await this.connect();
          const retryResp = await this.client.listTools();
          this.toolCache = retryResp.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema as any,
            serverName: this.serverName,
            metadata: {},
          }));
          this.toolCacheExpiry = Date.now() + this.CACHE_TTL_MS;
          return this.toolCache;
        } catch (retryErr) {
          this.logger.error("Retry to list tools failed:", retryErr);
        }
      }
      throw error;
    }
  }

  async callTool(toolName: string, args: any): Promise<MCPToolResult> {
    await this.connect();
    const startTime = Date.now();

    // Attempt the call, if it fails due to closed connection try one reconnect+retry.
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        this.logger.debug(`Calling tool: ${toolName} (attempt ${attempts})`, {
          args,
        });
        const result = (await this.client.callTool({
          name: toolName,
          arguments: args,
        })) as any;

        const duration = Date.now() - startTime;
        this.logger.info(
          `Tool call succeeded: ${toolName} (${duration}ms) attempts=${attempts}`,
        );
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
        this.logger.error(
          `Tool call failed: ${toolName} (${duration}ms) attempt=${attempts}`,
          error,
        );

        const msg = String(error?.message ?? "").toLowerCase();
        const isConnectionClosed =
          msg.includes("connection closed") ||
          msg.includes("transport closed") ||
          error?.code === -32000;

        if (isConnectionClosed && attempts < maxAttempts) {
          this.logger.info(
            `Connection closed detected during tool call ${toolName}, reconnecting and retrying (attempt ${attempts + 1})`,
          );
          try {
            await this.connect();
            continue; // retry
          } catch (reconnectErr) {
            this.logger.error(
              "Reconnect during tool call retry failed:",
              reconnectErr,
            );
            break;
          }
        }

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

    // Fallback error if loop exits unexpectedly
    const dur = Date.now() - startTime;
    return {
      content: [
        {
          type: "text",
          text: `Error calling ${toolName}: connection failed after ${maxAttempts} attempts`,
        },
      ],
      isError: true,
      metadata: {
        duration: dur,
        serverName: this.serverName,
        toolName,
      },
    };
  }

  async disconnect(): Promise<void> {
    if (this.state === MCPClientState.DISCONNECTED) return;
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
        try {
          this.process?.kill("SIGTERM");
        } catch (e) {
          this.logger.debug("Error killing transport process:", e as any);
        }
      }, 5000);
      this.process.on("exit", () => clearTimeout(killTimeout));
      try {
        this.process.kill("SIGTERM");
      } catch (e) {
        this.logger.debug("Error sending SIGTERM to process:", e as any);
      }
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
