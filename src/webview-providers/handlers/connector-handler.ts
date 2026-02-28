import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import { ConnectorService } from "../../services/connector.service";

/** Configuration schemas for guided connector setup. */
const CONFIG_SCHEMAS: Record<
  string,
  { label: string; key: string; placeholder?: string; password?: boolean }[]
> = {
  slack: [
    {
      label: "Slack Bot Token",
      key: "SLACK_BOT_TOKEN",
      placeholder: "xoxb-...",
      password: true,
    },
    { label: "Slack Team ID", key: "SLACK_TEAM_ID", placeholder: "T..." },
  ],
  jira: [
    {
      label: "Jira Instance URL",
      key: "JIRA_INSTANCE_URL",
      placeholder: "https://your-domain.atlassian.net",
    },
    { label: "Jira Email", key: "JIRA_EMAIL", placeholder: "user@example.com" },
    { label: "Jira API Token", key: "JIRA_API_TOKEN", password: true },
  ],
  postgres: [
    {
      label: "Connection String",
      key: "POSTGRES_CONNECTION_STRING",
      placeholder: "postgresql://user:password@localhost:5432/db",
      password: true,
    },
  ],
  mysql: [
    {
      label: "Connection String",
      key: "MYSQL_CONNECTION_STRING",
      placeholder: "mysql://user:password@localhost:3306/db",
      password: true,
    },
  ],
  redis: [
    {
      label: "Connection String",
      key: "REDIS_CONNECTION_STRING",
      placeholder: "redis://localhost:6379",
      password: true,
    },
  ],
  mongodb: [
    {
      label: "Connection String",
      key: "MONGODB_CONNECTION_STRING",
      placeholder: "mongodb://localhost:27017",
      password: true,
    },
  ],
  n8n: [
    {
      label: "Instance URL",
      key: "N8N_HOST",
      placeholder: "http://localhost:5678",
    },
    { label: "API Key", key: "N8N_API_KEY", password: true },
  ],
  gitlab: [
    {
      label: "Personal Access Token",
      key: "GITLAB_PERSONAL_ACCESS_TOKEN",
      password: true,
    },
  ],
  notion: [
    { label: "Integration Token", key: "NOTION_API_KEY", password: true },
  ],
  linear: [{ label: "API Key", key: "LINEAR_API_KEY", password: true }],
  sentry: [{ label: "Auth Token", key: "SENTRY_AUTH_TOKEN", password: true }],
};

export class ConnectorHandler implements WebviewMessageHandler {
  readonly commands = [
    "get-connectors",
    "connect-connector",
    "disconnect-connector",
    "configure-connector",
  ];

  private async postConnectorsList(ctx: HandlerContext): Promise<void> {
    const connectors = ConnectorService.getInstance().getConnectors();
    await ctx.webview.webview.postMessage({
      type: "connectors-list",
      connectors,
    });
  }

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "get-connectors":
        await this.postConnectorsList(ctx);
        break;

      case "connect-connector":
        try {
          await ConnectorService.getInstance().connect(
            message.id,
            message.config,
          );
          await this.postConnectorsList(ctx);
          vscode.window.showInformationMessage(`Connected to ${message.id}`);
        } catch (error: any) {
          vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
        }
        break;

      case "disconnect-connector":
        try {
          await ConnectorService.getInstance().disconnect(message.id);
          await this.postConnectorsList(ctx);
          vscode.window.showInformationMessage(
            `Disconnected from ${message.id}`,
          );
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Failed to disconnect: ${error.message}`,
          );
        }
        break;

      case "configure-connector":
        await this.handleConfigure(message, ctx);
        break;
    }
  }

  private async handleConfigure(
    message: any,
    ctx: HandlerContext,
  ): Promise<void> {
    try {
      const connector = ConnectorService.getInstance().getConnector(message.id);
      if (!connector) {
        throw new Error(`Connector ${message.id} not found`);
      }

      // GitHub OAuth flow
      if (message.id === "github") {
        const selection = await vscode.window.showQuickPick(
          ["Sign in with GitHub (OAuth)", "Enter Configuration Manually"],
          {
            placeHolder: "Select authentication method for GitHub",
            ignoreFocusOut: true,
          },
        );
        if (!selection) return;

        if (selection === "Sign in with GitHub (OAuth)") {
          try {
            const session = await vscode.authentication.getSession(
              "github",
              ["repo", "user"],
              {
                createIfNone: true,
              },
            );
            if (session) {
              await ConnectorService.getInstance().connect(message.id, {
                GITHUB_PERSONAL_ACCESS_TOKEN: session.accessToken,
              });
              await this.postConnectorsList(ctx);
              vscode.window.showInformationMessage(
                `Configured ${connector.name} successfully using GitHub account`,
              );
              return;
            }
          } catch (error: any) {
            ctx.logger.error("GitHub OAuth failed", error);
            vscode.window.showErrorMessage(
              `GitHub authentication failed: ${error.message}. Please try manual configuration.`,
            );
          }
        }
      }

      // Guided config flow
      const schema = CONFIG_SCHEMAS[message.id];
      if (schema) {
        const newConfig: Record<string, any> = {};
        let cancelled = false;
        for (const field of schema) {
          const value = await vscode.window.showInputBox({
            title: `Configure ${connector.name}`,
            prompt: `Enter ${field.label}`,
            placeHolder: field.placeholder,
            password: field.password,
            ignoreFocusOut: true,
            value: connector.config?.[field.key] || "",
          });
          if (value === undefined) {
            cancelled = true;
            break;
          }
          newConfig[field.key] = value;
        }
        if (!cancelled) {
          await ConnectorService.getInstance().connect(message.id, newConfig);
          await this.postConnectorsList(ctx);
          vscode.window.showInformationMessage(
            `Configured ${connector.name} successfully`,
          );
        }
        return;
      }

      // Fallback: raw JSON configuration
      const currentConfig = JSON.stringify(connector.config || {}, null, 2);
      const newConfigStr = await vscode.window.showInputBox({
        title: `Configure ${connector.name}`,
        prompt: "Enter configuration in JSON format",
        value: currentConfig,
        placeHolder: '{"KEY": "VALUE"}',
        ignoreFocusOut: true,
      });
      if (newConfigStr) {
        try {
          const newConfig = JSON.parse(newConfigStr);
          await ConnectorService.getInstance().connect(message.id, newConfig);
          await this.postConnectorsList(ctx);
          vscode.window.showInformationMessage(
            `Configured ${connector.name} successfully`,
          );
        } catch (e: any) {
          vscode.window.showErrorMessage(
            `Invalid JSON configuration: ${e.message}`,
          );
        }
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to configure: ${error.message}`);
    }
  }
}
