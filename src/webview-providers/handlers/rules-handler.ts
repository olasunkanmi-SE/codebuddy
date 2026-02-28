import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import { ProjectRulesService } from "../../services/project-rules.service";
import { getConfigValue } from "../../utils/utils";

export class RulesHandler implements WebviewMessageHandler {
  readonly commands = [
    "rules-get-all",
    "rules-add",
    "rules-update",
    "rules-delete",
    "rules-toggle",
    "subagents-get-all",
    "subagents-toggle",
    "project-rules-open",
    "project-rules-create",
    "project-rules-reload",
    "project-rules-get-status",
    "system-prompt-update",
  ];

  private readonly DEFAULT_SUBAGENTS = [
    {
      id: "code-analyzer",
      name: "Code Analyzer",
      description:
        "Deep code analysis, security scanning, and architecture review",
      enabled: true,
      toolPatterns: [
        "analyze",
        "lint",
        "security",
        "complexity",
        "quality",
        "ast",
        "parse",
        "check",
        "scan",
        "review",
      ],
    },
    {
      id: "doc-writer",
      name: "Documentation Writer",
      description: "Generate comprehensive documentation and API references",
      enabled: true,
      toolPatterns: [
        "search",
        "read",
        "generate",
        "doc",
        "api",
        "reference",
        "web",
      ],
    },
    {
      id: "debugger",
      name: "Debugger",
      description: "Find and fix bugs with access to all available tools",
      enabled: true,
      toolPatterns: ["*"],
    },
    {
      id: "file-organizer",
      name: "File Organizer",
      description: "Restructure and organize project files and directories",
      enabled: true,
      toolPatterns: [
        "file",
        "directory",
        "list",
        "read",
        "write",
        "move",
        "rename",
        "delete",
        "structure",
        "organize",
      ],
    },
  ];

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "rules-get-all":
      case "subagents-get-all":
        try {
          const rules = getConfigValue("rules.customRules") || [];
          const systemPrompt = getConfigValue("rules.customSystemPrompt") || "";
          const subagentConfig = getConfigValue("rules.subagents") || {};
          const projectRulesStatus =
            ProjectRulesService.getInstance().getStatus();
          const subagents = this.DEFAULT_SUBAGENTS.map((s) => ({
            ...s,
            enabled: subagentConfig[s.id]?.enabled ?? s.enabled,
          }));
          ctx.webview.webview.postMessage({
            command: "rules-data",
            data: { rules, systemPrompt, subagents, projectRulesStatus },
          });
        } catch (error: any) {
          ctx.logger.error("Failed to fetch rules:", error);
        }
        break;

      case "rules-add":
        try {
          const newRule = message.message;
          if (newRule) {
            const rules = getConfigValue("rules.customRules") || [];
            const ruleWithId = {
              ...newRule,
              id: `rule-${Date.now()}`,
              createdAt: Date.now(),
            };
            rules.push(ruleWithId);
            await vscode.workspace
              .getConfiguration("ola-code-buddy")
              .update(
                "rules.customRules",
                rules,
                vscode.ConfigurationTarget.Global,
              );
            ctx.logger.info(`Added custom rule: ${ruleWithId.name}`);
            ctx.webview.webview.postMessage({
              command: "rule-added",
              data: { rule: ruleWithId },
            });
          }
        } catch (error: any) {
          ctx.logger.error("Failed to add rule:", error);
        }
        break;

      case "rules-update":
        try {
          const { id, updates } = message.message || {};
          if (id) {
            const rules = getConfigValue("rules.customRules") || [];
            const index = rules.findIndex((r: any) => r.id === id);
            if (index !== -1) {
              rules[index] = { ...rules[index], ...updates };
              await vscode.workspace
                .getConfiguration("ola-code-buddy")
                .update(
                  "rules.customRules",
                  rules,
                  vscode.ConfigurationTarget.Global,
                );
              ctx.logger.info(`Updated rule: ${id}`);
            }
          }
        } catch (error: any) {
          ctx.logger.error("Failed to update rule:", error);
        }
        break;

      case "rules-delete":
        try {
          const { id } = message.message || {};
          if (id) {
            const rules = getConfigValue("rules.customRules") || [];
            const filteredRules = rules.filter((r: any) => r.id !== id);
            await vscode.workspace
              .getConfiguration("ola-code-buddy")
              .update(
                "rules.customRules",
                filteredRules,
                vscode.ConfigurationTarget.Global,
              );
            ctx.logger.info(`Deleted rule: ${id}`);
          }
        } catch (error: any) {
          ctx.logger.error("Failed to delete rule:", error);
        }
        break;

      case "rules-toggle":
        try {
          const { id, enabled } = message.message || {};
          if (id !== undefined) {
            const rules = getConfigValue("rules.customRules") || [];
            const index = rules.findIndex((r: any) => r.id === id);
            if (index !== -1) {
              rules[index].enabled = enabled;
              await vscode.workspace
                .getConfiguration("ola-code-buddy")
                .update(
                  "rules.customRules",
                  rules,
                  vscode.ConfigurationTarget.Global,
                );
              ctx.logger.info(`Toggled rule ${id}: ${enabled}`);
            }
          }
        } catch (error: any) {
          ctx.logger.error("Failed to toggle rule:", error);
        }
        break;

      case "subagents-toggle":
        try {
          const { id, enabled } = message.message || {};
          if (id) {
            const subagentConfig = getConfigValue("rules.subagents") || {};
            subagentConfig[id] = { ...subagentConfig[id], enabled };
            await vscode.workspace
              .getConfiguration("ola-code-buddy")
              .update(
                "rules.subagents",
                subagentConfig,
                vscode.ConfigurationTarget.Global,
              );
            ctx.logger.info(`Toggled subagent ${id}: ${enabled}`);
          }
        } catch (error: any) {
          ctx.logger.error("Failed to toggle subagent:", error);
        }
        break;

      case "project-rules-open":
        try {
          await ProjectRulesService.getInstance().openRulesFile();
        } catch (error: any) {
          ctx.logger.error("Failed to open project rules:", error);
        }
        break;

      case "project-rules-create":
        try {
          await ProjectRulesService.getInstance().createRulesFile();
        } catch (error: any) {
          ctx.logger.error("Failed to create project rules:", error);
        }
        break;

      case "project-rules-reload":
        try {
          await ProjectRulesService.getInstance().reloadRules();
          const status = ProjectRulesService.getInstance().getStatus();
          ctx.webview.webview.postMessage({
            command: "project-rules-status",
            data: status,
          });
        } catch (error: any) {
          ctx.logger.error("Failed to reload project rules:", error);
        }
        break;

      case "project-rules-get-status":
        try {
          const status = ProjectRulesService.getInstance().getStatus();
          ctx.webview.webview.postMessage({
            command: "project-rules-status",
            data: status,
          });
        } catch (error: any) {
          ctx.logger.error("Failed to get project rules status:", error);
        }
        break;

      case "system-prompt-update":
        try {
          const { prompt } = message.message || {};
          await vscode.workspace
            .getConfiguration("ola-code-buddy")
            .update(
              "rules.customSystemPrompt",
              prompt || "",
              vscode.ConfigurationTarget.Global,
            );
          ctx.logger.info("Updated custom system prompt");
        } catch (error: any) {
          ctx.logger.error("Failed to update system prompt:", error);
        }
        break;
    }
  }
}
