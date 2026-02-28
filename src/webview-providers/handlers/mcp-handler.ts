import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import { MCPService } from "../../MCP/service";
import { MCPClientState } from "../../MCP/types";
import { MCP_PRESETS } from "../../MCP/presets";
import { LocalModelService } from "../../llms/local/service";
import { getConfigValue } from "../../utils/utils";

export class MCPHandler implements WebviewMessageHandler {
  readonly commands = [
    "mcp-get-servers",
    "mcp-toggle-server",
    "mcp-toggle-tool",
    "mcp-refresh-tools",
    "get-local-models",
    "open-mcp-settings",
    "mcp-get-presets",
    "mcp-add-preset",
    "mcp-remove-preset",
  ];

  private buildServersData(
    allTools: any[],
    allServerConfigs: Record<string, any>,
  ) {
    return Object.entries(allServerConfigs).map(
      ([id, config]: [string, any]) => {
        const serverTools = allTools.filter((t) => t.serverName === id);
        const mcpService = MCPService.getInstance();
        const client = mcpService.getClient(id);

        let status: "connected" | "disconnected" | "connecting" | "error" =
          "disconnected";
        if (client) {
          const clientState =
            client.getState?.() || MCPClientState.DISCONNECTED;
          if (clientState === MCPClientState.CONNECTED) status = "connected";
          else if (clientState === MCPClientState.CONNECTING)
            status = "connecting";
          else if (clientState === MCPClientState.ERROR) status = "error";
        }

        const allDisabledTools: Record<string, string[]> =
          getConfigValue("codebuddy.mcp.disabledTools") || {};
        const disabledTools = allDisabledTools[id] || [];

        return {
          id,
          name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          description: config.description || `MCP Server: ${id}`,
          status,
          enabled: config.enabled !== false,
          toolCount: serverTools.length,
          tools: serverTools.map((t) => ({
            name: t.name,
            description: t.description,
            serverName: t.serverName,
            enabled: !disabledTools.includes(t.name),
          })),
        };
      },
    );
  }

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "mcp-get-servers":
        try {
          ctx.logger.info("Fetching MCP servers data...");
          const mcpService = MCPService.getInstance();
          const allTools = await mcpService.getAllTools();
          const serverConfigs = getConfigValue("codebuddy.mcp.servers") || {};
          const allServerConfigs: Record<string, any> = {
            ...mcpService.getServerConfigs(),
            ...serverConfigs,
          };
          const servers = this.buildServersData(allTools, allServerConfigs);
          ctx.webview.webview.postMessage({
            command: "mcp-servers-data",
            data: { servers },
          });
        } catch (error: any) {
          ctx.logger.error("Failed to fetch MCP servers:", error);
          ctx.webview.webview.postMessage({
            command: "mcp-servers-data",
            data: { servers: [], error: error.message },
          });
        }
        break;

      case "mcp-toggle-server":
        try {
          const { serverName, enabled } = message.message || {};
          ctx.logger.info(`Toggling MCP server ${serverName}: ${enabled}`);
          const currentServers = JSON.parse(
            JSON.stringify(getConfigValue("codebuddy.mcp.servers") || {}),
          );
          if (currentServers[serverName]) {
            currentServers[serverName].enabled = enabled;
            await vscode.workspace
              .getConfiguration("codebuddy")
              .update(
                "mcp.servers",
                currentServers,
                vscode.ConfigurationTarget.Global,
              );
          }
          ctx.webview.webview.postMessage({
            command: "mcp-server-updated",
            data: { serverName, enabled },
          });
          const mcpService = MCPService.getInstance();
          if (!enabled) {
            const client = mcpService.getClient(serverName);
            if (client) {
              await client.disconnect();
            }
          } else {
            try {
              await mcpService.reload();
            } catch (reloadError: any) {
              ctx.logger.warn(
                `Server "${serverName}" enabled but connection failed: ${reloadError.message}`,
              );
            }
          }
        } catch (error: any) {
          ctx.logger.error("Failed to toggle MCP server:", error);
        }
        break;

      case "mcp-toggle-tool":
        try {
          const { serverName, toolName, enabled } = message.message || {};
          ctx.logger.info(
            `Toggling MCP tool ${serverName}.${toolName}: ${enabled}`,
          );
          const allDisabled: Record<string, string[]> = JSON.parse(
            JSON.stringify(getConfigValue("codebuddy.mcp.disabledTools") || {}),
          );
          let disabledTools: string[] = allDisabled[serverName] || [];
          if (enabled) {
            disabledTools = disabledTools.filter((t) => t !== toolName);
          } else {
            if (!disabledTools.includes(toolName)) {
              disabledTools.push(toolName);
            }
          }
          if (disabledTools.length > 0) {
            allDisabled[serverName] = disabledTools;
          } else {
            delete allDisabled[serverName];
          }
          await vscode.workspace
            .getConfiguration("codebuddy")
            .update(
              "mcp.disabledTools",
              allDisabled,
              vscode.ConfigurationTarget.Global,
            );
          ctx.webview.webview.postMessage({
            command: "mcp-tool-updated",
            data: { serverName, toolName, enabled },
          });
        } catch (error: any) {
          ctx.logger.error("Failed to toggle MCP tool:", error);
        }
        break;

      case "mcp-refresh-tools":
        try {
          ctx.logger.info("Refreshing MCP tools...");
          const mcpService = MCPService.getInstance();
          await mcpService.refreshTools();
          const allTools = await mcpService.getAllTools();
          const serverConfigs = getConfigValue("codebuddy.mcp.servers") || {};
          const allServerConfigs: Record<string, any> = {
            ...mcpService.getServerConfigs(),
            ...serverConfigs,
          };
          const servers = this.buildServersData(allTools, allServerConfigs);
          ctx.webview.webview.postMessage({
            command: "mcp-servers-data",
            data: { servers },
          });
          vscode.window.showInformationMessage(
            `MCP tools refreshed: ${allTools.length} tools available`,
          );
        } catch (error: any) {
          ctx.logger.error("Failed to refresh MCP tools:", error);
          ctx.webview.webview.postMessage({
            command: "mcp-servers-data",
            data: { servers: [], error: error.message },
          });
        }
        break;

      case "get-local-models":
        try {
          ctx.logger.info("Fetching local models...");
          const localModelService = LocalModelService.getInstance();
          const models = await localModelService.getLocalModels();
          const isModelRunnerAvailable =
            await localModelService.isModelRunnerAvailable();
          const isOllamaRunning = await localModelService.isOllamaRunning();
          ctx.webview.webview.postMessage({
            command: "local-models-data",
            data: { models, isModelRunnerAvailable, isOllamaRunning },
          });
        } catch (error: any) {
          ctx.logger.error("Failed to fetch local models:", error);
          ctx.webview.webview.postMessage({
            command: "local-models-data",
            data: { models: [], error: error.message },
          });
        }
        break;

      case "open-mcp-settings":
        ctx.logger.info("Opening MCP settings...");
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "@ext:fiatinnovations.ola-code-buddy mcp",
        );
        break;

      case "mcp-get-presets": {
        const currentServers = getConfigValue("codebuddy.mcp.servers") || {};
        const presets = MCP_PRESETS.map((p) => ({
          ...p,
          installed: !!currentServers[p.id],
        }));
        ctx.webview.webview.postMessage({
          command: "mcp-presets-data",
          data: { presets },
        });
        break;
      }

      case "mcp-add-preset": {
        try {
          const { presetId } = message.message || {};
          const preset = MCP_PRESETS.find((p) => p.id === presetId);
          if (!preset) {
            throw new Error(`Unknown MCP preset: ${presetId}`);
          }
          const currentServers = JSON.parse(
            JSON.stringify(getConfigValue("codebuddy.mcp.servers") || {}),
          );
          currentServers[preset.id] = { ...preset.config };
          await vscode.workspace
            .getConfiguration("codebuddy")
            .update(
              "mcp.servers",
              currentServers,
              vscode.ConfigurationTarget.Global,
            );
          ctx.logger.info(`Added MCP preset server: ${preset.name}`);
          ctx.webview.webview.postMessage({
            command: "mcp-preset-added",
            data: { presetId, name: preset.name },
          });
          try {
            const mcpService = MCPService.getInstance();
            await mcpService.reload();
          } catch (reloadError: any) {
            ctx.logger.warn(
              `MCP preset "${preset.name}" saved but server connection failed: ${reloadError.message}. It will connect on next use.`,
            );
          }
        } catch (error: any) {
          ctx.logger.error("Failed to add MCP preset:", error);
          vscode.window.showErrorMessage(
            `Failed to add MCP preset: ${error.message}`,
          );
          ctx.webview.webview.postMessage({
            command: "mcp-preset-error",
            data: { error: error.message },
          });
        }
        break;
      }

      case "mcp-remove-preset": {
        try {
          const { presetId } = message.message || {};
          const currentServers = JSON.parse(
            JSON.stringify(getConfigValue("codebuddy.mcp.servers") || {}),
          );
          if (currentServers[presetId]) {
            delete currentServers[presetId];
            await vscode.workspace
              .getConfiguration("codebuddy")
              .update(
                "mcp.servers",
                currentServers,
                vscode.ConfigurationTarget.Global,
              );
            const mcpService = MCPService.getInstance();
            const client = mcpService.getClient(presetId);
            if (client) {
              await client.disconnect();
            }
            await mcpService.reload();
            ctx.logger.info(`Removed MCP preset server: ${presetId}`);
          } else {
            ctx.logger.info(
              `MCP preset server not found (already removed): ${presetId}`,
            );
          }
          ctx.webview.webview.postMessage({
            command: "mcp-preset-removed",
            data: { presetId },
          });
        } catch (error: any) {
          ctx.logger.error("Failed to remove MCP preset:", error);
          ctx.webview.webview.postMessage({
            command: "mcp-preset-error",
            data: { error: error.message },
          });
        }
        break;
      }
    }
  }
}
