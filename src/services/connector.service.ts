import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { MCPService } from "../MCP/service";
import { MCPServerConfig, MCPServersConfig } from "../MCP/types";

export interface Connector {
  id: string;
  name: string;
  description: string;
  icon?: string; // Icon name or path
  type: "mcp" | "skill";
  status: "connected" | "disconnected" | "error" | "configuring";
  config?: Record<string, any>;
  mcpConfig?: MCPServerConfig; // If it maps to an MCP server
}

export class ConnectorService {
  private static instance: ConnectorService;
  private readonly logger: Logger;
  private mcpService: MCPService;
  private connectors: Map<string, Connector> = new Map();

  private constructor() {
    this.logger = Logger.initialize("ConnectorService", {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.mcpService = MCPService.getInstance();
    this.initializeConnectors();
  }

  public static getInstance(): ConnectorService {
    if (!ConnectorService.instance) {
      ConnectorService.instance = new ConnectorService();
    }
    return ConnectorService.instance;
  }

  private initializeConnectors() {
    this.logger.info("Initializing connectors...");
    // Add built-in connectors
    this.addBuiltInConnectors();
    // Sync with current MCP status
    this.syncWithMCP();
  }

  private addBuiltInConnectors() {
    // Google Drive
    this.connectors.set("google-drive", {
      id: "google-drive",
      name: "Google Drive",
      description: "Access and manage files in Google Drive",
      icon: "google-drive",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/gdrive"],
        env: {},
      },
    });

    // GitHub
    this.connectors.set("github", {
      id: "github",
      name: "GitHub",
      description: "Integration with GitHub repositories, issues, and PRs",
      icon: "github",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/github"],
        env: {},
      },
    });

    // Gmail
    this.connectors.set("gmail", {
      id: "gmail",
      name: "Gmail",
      description: "Read and send emails via Gmail",
      icon: "gmail",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/gmail"],
        env: {},
      },
    });

    // Google Calendar
    this.connectors.set("google-calendar", {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Manage your calendar events",
      icon: "calendar",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/google-calendar"],
        env: {},
      },
    });

    // Postgres
    this.connectors.set("postgres", {
      id: "postgres",
      name: "PostgreSQL",
      description: "Connect to PostgreSQL database",
      icon: "database",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/postgres"],
        env: {},
      },
    });

    // MySQL
    this.connectors.set("mysql", {
      id: "mysql",
      name: "MySQL",
      description: "Connect to MySQL database",
      icon: "mysql",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/mysql"],
        env: {},
      },
    });

    // Redis
    this.connectors.set("redis", {
      id: "redis",
      name: "Redis",
      description: "Connect to Redis (Local/Cloud)",
      icon: "redis",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/redis"],
        env: {},
      },
    });

    // MongoDB
    this.connectors.set("mongodb", {
      id: "mongodb",
      name: "MongoDB",
      description: "Connect to MongoDB (Local/Cloud)",
      icon: "mongodb",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/mongodb"],
        env: {},
      },
    });

    // n8n
    this.connectors.set("n8n", {
      id: "n8n",
      name: "n8n",
      description: "Workflow automation (Local/Cloud)",
      icon: "n8n",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/n8n"],
        env: {},
      },
    });

    // Slack
    this.connectors.set("slack", {
      id: "slack",
      name: "Slack",
      description: "Integration with Slack for messaging and notifications",
      icon: "slack",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/slack"],
        env: {},
      },
    });

    // Jira
    this.connectors.set("jira", {
      id: "jira",
      name: "Jira",
      description: "Manage Jira issues and projects",
      icon: "jira",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/jira"],
        env: {},
      },
    });

    // Linear
    this.connectors.set("linear", {
      id: "linear",
      name: "Linear",
      description: "Linear issue tracking integration",
      icon: "linear",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/linear"],
        env: {},
      },
    });

    // GitLab
    this.connectors.set("gitlab", {
      id: "gitlab",
      name: "GitLab",
      description: "GitLab repositories and CI/CD pipelines",
      icon: "gitlab",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/gitlab"],
        env: {},
      },
    });

    // Notion
    this.connectors.set("notion", {
      id: "notion",
      name: "Notion",
      description: "Access and manage Notion pages and databases",
      icon: "notion",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/notion"],
        env: {},
      },
    });

    // Sentry
    this.connectors.set("sentry", {
      id: "sentry",
      name: "Sentry",
      description: "Monitor application errors and performance",
      icon: "sentry",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/sentry"],
        env: {},
      },
    });

    // AWS
    this.connectors.set("aws", {
      id: "aws",
      name: "AWS",
      description: "Manage AWS resources and services",
      icon: "aws",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/aws"],
        env: {},
      },
    });

    // Kubernetes
    this.connectors.set("kubernetes", {
      id: "kubernetes",
      name: "Kubernetes",
      description: "Manage Kubernetes clusters and resources",
      icon: "kubernetes",
      type: "mcp",
      status: "disconnected",
      mcpConfig: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/kubernetes"],
        env: {},
      },
    });

    // Load persisted state
    const config = vscode.workspace.getConfiguration("codebuddy.connectors");
    const savedConnectors = config.get<Record<string, any>>("states") || {};

    for (const [id, savedState] of Object.entries(savedConnectors)) {
      const connector = this.connectors.get(id);
      if (connector) {
        connector.status = savedState.status;
        connector.config = savedState.config;
        this.connectors.set(id, connector);
      }
    }
  }

  public getConnectors(): Connector[] {
    return Array.from(this.connectors.values());
  }

  public getConnector(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  public async connect(
    connectorId: string,
    config?: Record<string, any>,
  ): Promise<void> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    this.logger.info(`Connecting connector: ${connectorId}`);

    // Update connector config
    if (config) {
      connector.config = { ...connector.config, ...config };
      // If MCP, inject config into env vars or args
      if (connector.type === "mcp" && connector.mcpConfig) {
        // Naive mapping: config keys to env vars
        // In reality, we might need a mapper
        if (!connector.mcpConfig.env) connector.mcpConfig.env = {};
        Object.entries(config).forEach(([key, value]) => {
          if (connector.mcpConfig?.env) {
            connector.mcpConfig.env[key.toUpperCase()] = String(value);
          }
        });
      }
    }

    connector.status = "connected";

    // Persist state
    await this.saveState(connectorId, {
      status: "connected",
      config: connector.config,
    });

    // If MCP, add to configuration
    if (connector.type === "mcp" && connector.mcpConfig) {
      const config = vscode.workspace.getConfiguration("codebuddy.mcp");
      const servers = config.get<MCPServersConfig>("servers") || {};

      // Construct the server config
      const serverConfig: MCPServerConfig = {
        command: connector.mcpConfig.command,
        args: connector.mcpConfig.args,
        env: connector.mcpConfig.env,
        enabled: true,
      };

      servers[connectorId] = serverConfig;
      await config.update(
        "servers",
        servers,
        vscode.ConfigurationTarget.Global,
      );

      // Reload MCP Service
      await this.mcpService.initialize();
    }

    this.logger.info(`Connector ${connectorId} connected`);
  }

  public async disconnect(connectorId: string): Promise<void> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    this.logger.info(`Disconnecting connector: ${connectorId}`);
    connector.status = "disconnected";

    // Persist state
    await this.saveState(connectorId, {
      status: "disconnected",
      config: connector.config,
    });

    // Remove from MCP configuration if it's an MCP connector
    if (connector.type === "mcp") {
      const config = vscode.workspace.getConfiguration("codebuddy.mcp");
      const servers = config.get<MCPServersConfig>("servers") || {};

      if (servers[connectorId]) {
        delete servers[connectorId];
        await config.update(
          "servers",
          servers,
          vscode.ConfigurationTarget.Global,
        );

        // Reload MCP Service
        await this.mcpService.initialize();
      }
    }

    this.logger.info(`Connector ${connectorId} disconnected`);
  }

  private async saveState(id: string, state: { status: string; config?: any }) {
    const config = vscode.workspace.getConfiguration("codebuddy.connectors");
    const states = config.get<Record<string, any>>("states") || {};
    states[id] = state;
    await config.update("states", states, vscode.ConfigurationTarget.Global);
  }

  private syncWithMCP() {
    // Check MCPService for active servers and update connector status
    // This allows us to reflect externally configured MCP servers
    const stats = this.mcpService.getStat();
    // This is a bit tricky as MCPService doesn't expose raw server configs easily in public API
    // We might need to enhance MCPService to get details about connected servers
  }
}
