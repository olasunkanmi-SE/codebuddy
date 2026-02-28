import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";

/**
 * Maps webview settings-change commands to their VS Code configuration keys.
 * All commands follow the same pattern: log the change and update the config.
 */
const SETTING_MAP: Record<string, string> = {
  "streaming-change-event": "codebuddy.enableStreaming",
  "compact-mode-change-event": "codebuddy.compactMode",
  "auto-approve-change-event": "codebuddy.autoApprove",
  "allow-file-edits-change-event": "codebuddy.allowFileEdits",
  "allow-terminal-change-event": "codebuddy.allowTerminal",
  "verbose-logging-change-event": "codebuddy.verboseLogging",
  "index-codebase-change-event": "codebuddy.indexCodebase",
  "context-window-change-event": "codebuddy.contextWindow",
  "include-hidden-change-event": "codebuddy.includeHidden",
  "max-file-size-change-event": "codebuddy.maxFileSize",
  "font-size-change-event": "chatview.font.size",
  "font-family-change-event": "font.family",
  "daily-standup-change-event": "codebuddy.automations.dailyStandup.enabled",
  "code-health-change-event": "codebuddy.automations.codeHealth.enabled",
  "dependency-check-change-event":
    "codebuddy.automations.dependencyCheck.enabled",
  "git-watchdog-change-event": "codebuddy.automations.gitWatchdog.enabled",
  "end-of-day-summary-change-event":
    "codebuddy.automations.endOfDaySummary.enabled",
};

export class SettingsHandler implements WebviewMessageHandler {
  readonly commands = [
    ...Object.keys(SETTING_MAP),
    "theme-change-event",
    "language-change-event",
    "nickname-change-event",
    "update-user-info",
    "updateConfiguration",
    "update-model-event",
    "reindex-workspace-event",
    "open-codebuddy-settings",
  ];

  constructor(
    private readonly orchestrator: {
      publish: (event: string, ...args: any[]) => void;
    },
    private readonly extensionUri: vscode.Uri,
  ) {}

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    const { command } = message;

    // Bulk config-update pattern
    if (SETTING_MAP[command]) {
      ctx.logger.info(`${command}: ${message.message}`);
      await vscode.workspace
        .getConfiguration()
        .update(
          SETTING_MAP[command],
          message.message,
          vscode.ConfigurationTarget.Global,
        );
      return;
    }

    switch (command) {
      case "theme-change-event":
        ctx.logger.info(`Theme changed to: ${message.message}`);
        this.orchestrator.publish("onUpdateThemePreferences", message.message, {
          theme: message.message,
        });
        break;

      case "language-change-event": {
        const l10n = await import("@vscode/l10n");
        ctx.logger.info(`Language changed to: ${message.message}`);
        await vscode.workspace
          .getConfiguration()
          .update(
            "codebuddy.language",
            message.message,
            vscode.ConfigurationTarget.Global,
          );

        if (message.message && message.message !== "en") {
          const bundleUri = vscode.Uri.joinPath(
            this.extensionUri,
            "l10n",
            `bundle.l10n.${message.message}.json`,
          );
          l10n.config({ uri: bundleUri.toString() });
        } else {
          l10n.config({ contents: "{}" });
        }

        if (
          message.message !== "en" &&
          message.message !== vscode.env.language
        ) {
          const langMap: Record<string, string> = {
            es: "Spanish",
            fr: "French",
            de: "German",
            ja: "Japanese",
            "zh-cn": "Chinese (Simplified)",
            yo: "Yoruba",
          };
          const langName = langMap[message.message] || message.message;
          vscode.window
            .showInformationMessage(
              l10n.t(
                "To also translate right-click menu commands, change VS Code's display language to {0}.",
                langName,
              ),
              l10n.t("Change Display Language"),
            )
            .then((choice) => {
              if (choice) {
                vscode.commands.executeCommand(
                  "workbench.action.configureLocale",
                );
              }
            });
        }
        break;
      }

      case "nickname-change-event":
        ctx.logger.info(`Nickname changed to: ${message.message}`);
        this.orchestrator.publish("onUpdateUserPreferences", {
          message: JSON.stringify({ username: message.message }),
        });
        break;

      case "update-user-info":
        this.orchestrator.publish("onUpdateUserPreferences", message);
        break;

      case "updateConfiguration": {
        const { key, value } = message;
        if (key && value !== undefined) {
          await vscode.workspace
            .getConfiguration()
            .update(key, value, vscode.ConfigurationTarget.Global);
        }
        break;
      }

      case "update-model-event":
        if (message.message) {
          await vscode.workspace
            .getConfiguration()
            .update(
              "generativeAi.option",
              message.message,
              vscode.ConfigurationTarget.Global,
            );
        }
        this.orchestrator.publish("onModelChange", message);
        break;

      case "reindex-workspace-event":
        ctx.logger.info("Reindexing workspace...");
        vscode.commands.executeCommand("codebuddy.indexWorkspace");
        break;

      case "open-codebuddy-settings":
        ctx.logger.info("Opening CodeBuddy settings...");
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "@ext:fiatinnovations.ola-code-buddy",
        );
        break;
    }
  }
}
