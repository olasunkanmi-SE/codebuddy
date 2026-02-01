import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

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
export class AgentRunningGuardService implements vscode.Disposable {
  private static instance: AgentRunningGuardService;
  private readonly logger = Logger.initialize("AgentRunningGuardService", {
    minLevel: LogLevel.DEBUG,
    enableConsole: true,
    enableFile: true,
    enableTelemetry: false,
  });
  private activeTaskExecution: vscode.TaskExecution | null = null;
  private taskProvider: vscode.Disposable | null = null;
  private activeAgentCount = 0;

  private constructor() {
    this.registerTaskProvider();
  }

  static getInstance(): AgentRunningGuardService {
    return (AgentRunningGuardService.instance ??=
      new AgentRunningGuardService());
  }

  private registerTaskProvider(): void {
    // Register a custom task provider for the agent guard task
    this.taskProvider = vscode.tasks.registerTaskProvider("codebuddy-agent", {
      provideTasks: () => [],
      resolveTask: () => undefined,
    });
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
      const shellExecution = new vscode.ShellExecution(
        isWindows
          ? "echo CodeBuddy Agent Running... && ping -n 999999 localhost > nul"
          : "echo '🤖 CodeBuddy Agent Running...' && sleep infinity",
      );

      // Create the task
      const task = new vscode.Task(
        { type: "codebuddy-agent" },
        vscode.TaskScope.Workspace,
        "CodeBuddy Agent Running",
        "CodeBuddy",
        shellExecution,
        [], // No problem matchers
      );

      // Configure task - NOT background so VS Code tracks it as running
      task.isBackground = false;
      task.presentationOptions = {
        reveal: vscode.TaskRevealKind.Silent,
        panel: vscode.TaskPanelKind.Dedicated,
        echo: false,
        showReuseMessage: false,
        clear: true,
      };

      // Execute the task
      this.activeTaskExecution = await vscode.tasks.executeTask(task);
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

    if (this.activeAgentCount > 0) {
      // Still have active agents, keep task running
      return;
    }

    // No more active agents, close the task
    this.stopGuardTask();
  }

  /**
   * Force stops the guard task regardless of agent count
   */
  stopGuardTask(): void {
    if (this.activeTaskExecution) {
      this.activeTaskExecution.terminate();
      this.activeTaskExecution = null;
      this.logger.info("Agent guard task stopped");
    }
    this.activeAgentCount = 0;
  }

  /**
   * Check if there are any active agents
   */
  hasActiveAgents(): boolean {
    return this.activeAgentCount > 0;
  }

  dispose(): void {
    this.stopGuardTask();
    this.taskProvider?.dispose();
  }
}
