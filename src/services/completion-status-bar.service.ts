import { CompletionConfigService } from "./completion-config.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EditorHostService } from "./editor-host.service";
import { IStatusBarItem, StatusBarAlignment } from "../interfaces/editor-host";

export class CompletionStatusBarService {
  private statusBarItem: IStatusBarItem;
  private configService: CompletionConfigService;
  private logger: Logger;

  constructor(context: any) {
    this.logger = Logger.initialize("CompletionStatusBarService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.configService = CompletionConfigService.getInstance();
    const editorHost = EditorHostService.getInstance().getHost();

    this.statusBarItem = editorHost.window.createStatusBarItem(
      StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.command = "codebuddy.completion.openSettings";

    context.subscriptions.push(this.statusBarItem);

    // Initial update
    this.updateStatusBar();
    this.logger.info("CompletionStatusBarService initialized");

    // Listen for config changes
    editorHost.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("codebuddy.completion")) {
        this.updateStatusBar();
      }
    });
  }

  private updateStatusBar(): void {
    const config = this.configService.getConfig();
    const editorHost = EditorHostService.getInstance().getHost();

    if (config.enabled) {
      this.statusBarItem.text = `$(zap) CodeBuddy: ${config.model}`;
      this.statusBarItem.tooltip = `CodeBuddy Completions: Enabled\nModel: ${config.model}\nProvider: ${config.provider}\n\nClick to configure`;
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.text = `$(circle-slash) CodeBuddy: Off`;
      this.statusBarItem.tooltip =
        "CodeBuddy Completions: Disabled\n\nClick to configure";
      this.statusBarItem.backgroundColor = editorHost.createThemeColor(
        "statusBarItem.warningBackground",
      );
    }

    this.statusBarItem.show();
  }
}
