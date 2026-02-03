import * as vscode from "vscode";
import { CompletionConfigService } from "./completion-config.service";
import { Logger } from "../infrastructure/logger/logger";

export class CompletionStatusBarService {
  private statusBarItem: vscode.StatusBarItem;
  private configService: CompletionConfigService;
  private logger: Logger;

  constructor(context: vscode.ExtensionContext) {
    this.logger = new Logger("CompletionStatusBarService");
    this.configService = CompletionConfigService.getInstance();

    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.command = "codebuddy.completion.openSettings";

    context.subscriptions.push(this.statusBarItem);

    // Initial update
    this.updateStatusBar();
    this.logger.info("CompletionStatusBarService initialized");

    // Listen for config changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("codebuddy.completion")) {
        this.updateStatusBar();
      }
    });
  }

  private updateStatusBar(): void {
    const config = this.configService.getConfig();

    if (config.enabled) {
      this.statusBarItem.text = `$(zap) CodeBuddy: ${config.model}`;
      this.statusBarItem.tooltip = `CodeBuddy Completions: Enabled\nModel: ${config.model}\nProvider: ${config.provider}\n\nClick to configure`;
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.text = `$(circle-slash) CodeBuddy: Off`;
      this.statusBarItem.tooltip =
        "CodeBuddy Completions: Disabled\n\nClick to configure";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
    }

    this.statusBarItem.show();
  }
}
