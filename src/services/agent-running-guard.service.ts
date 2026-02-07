import { Logger, LogLevel } from "../infrastructure/logger/logger";
import {
  IDisposable,
  ITaskExecution,
  TaskRevealKind,
  TaskPanelKind,
} from "../interfaces/editor-host";
import { EditorHostService } from "./editor-host.service";

/**
 * AgentRunningGuardService
 *
 * Creates a VS Code task that runs while an agent is active.
 * When VS Code is closed with a running task, it will prompt:
 * "There are running tasks. Do you want to terminate them?"
 *
 * This provides a safeguard against accidentally closing VS Code
 * while the CodeBuddy agent is still working.
 */
export class AgentRunningGuardService implements IDisposable {
  private static instance: AgentRunningGuardService;
  private readonly logger = Logger.initialize("AgentRunningGuardService", {
    minLevel: LogLevel.DEBUG,
    enableConsole: true,
    enableFile: true,
    enableTelemetry: false,
  });
  private activeTaskExecution: ITaskExecution | null = null;
  private activeAgentCount = 0;

  private constructor() {
    // No need to register task provider explicitly with EditorHost abstraction
  }

  static getInstance(): AgentRunningGuardService {
    return (AgentRunningGuardService.instance ??=
      new AgentRunningGuardService());
  }

  /**
   * Call when an agent starts running.
   * Creates a background task if not already running.
   */
  async notifyAgentStarted(): Promise<void> {
    this.activeAgentCount++;
    this.logger.info(`Agent started. Active agents: ${this.activeAgentCount}`);

    if (this.activeTaskExecution) {
      return;
    }

    try {
      // Use ShellExecution with a long-running process that VS Code will detect
      // This ensures VS Code prompts "There are running tasks" when closing
      const isWindows = process.platform === "win32";
      const command = isWindows
        ? "echo CodeBuddy Agent Running... && ping -n 999999 localhost > nul"
        : "echo '🤖 CodeBuddy Agent Running...' && sleep infinity";

      // Create the task using EditorHostService
      const task = EditorHostService.getInstance()
        .getHost()
        .tasks.createShellTask("CodeBuddy Agent Running", command);

      // Configure task - NOT background so VS Code tracks it as running
      task.isBackground = false;
      task.presentationOptions = {
        reveal: TaskRevealKind.Silent,
        panel: TaskPanelKind.Dedicated,
        echo: false,
        showReuseMessage: false,
        clear: true,
      };

      // Execute the task
      this.activeTaskExecution = await EditorHostService.getInstance()
        .getHost()
        .tasks.executeTask(task);
      this.logger.info("Agent guard task started (shell execution)");
    } catch (error: any) {
      this.logger.error("Failed to start agent guard task", error);
    }
  }

  /**
   * Call when an agent finishes running.
   * Stops the background task if no more agents are active.
   */
  notifyAgentStopped(): void {
    this.activeAgentCount = Math.max(0, this.activeAgentCount - 1);
    this.logger.info(
      `Agent stopped. Remaining active: ${this.activeAgentCount}`,
    );

    if (this.activeAgentCount === 0 && this.activeTaskExecution) {
      try {
        this.activeTaskExecution.terminate();
        this.activeTaskExecution = null;
        this.logger.info("Agent guard task terminated");
      } catch (error: any) {
        this.logger.error("Failed to terminate agent guard task", error);
      }
    }
  }

  dispose(): void {
    if (this.activeTaskExecution) {
      this.activeTaskExecution.terminate();
      this.activeTaskExecution = null;
    }
  }
}
