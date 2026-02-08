import * as vscode from "vscode";
import { SqliteDatabaseService } from "./sqlite-database.service";
import { NewsService } from "./news.service";
import { Logger } from "../infrastructure/logger/logger";
import { CodeHealthTask } from "./tasks/code-health.task";
import { DependencyCheckTask } from "./tasks/dependency-check.task";
import { StandupService } from "./standup.service";

export class SchedulerService {
  private static instance: SchedulerService;
  private dbService: SqliteDatabaseService;
  private logger: Logger;
  private intervalId: NodeJS.Timeout | undefined;
  private codeHealthTask: CodeHealthTask;
  private standupService: StandupService;
  private dependencyCheckTask: DependencyCheckTask;

  private constructor() {
    this.dbService = SqliteDatabaseService.getInstance();
    this.logger = Logger.initialize("SchedulerService", {});
    this.codeHealthTask = new CodeHealthTask();
    this.standupService = StandupService.getInstance();
    this.dependencyCheckTask = new DependencyCheckTask();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  public start(): void {
    if (this.intervalId) return;

    this.logger.info("Starting Scheduler Service...");

    // Run immediately on startup
    this.checkTasks();

    // Check every minute
    this.intervalId = setInterval(() => {
      this.checkTasks();
    }, 60 * 1000);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async checkTasks(): Promise<void> {
    try {
      const newsService = NewsService.getInstance();
      const now = new Date();
      const currentHour = now.getHours();

      // --- Task 1: Morning News (10 AM) ---
      if (currentHour >= 10) {
        await this.tryRunTask("news_morning", async () => {
          this.logger.info("Executing scheduled task: news_morning");
          await newsService.fetchAndStoreNews();
          await newsService.cleanupOldNews(7);
          vscode.window.showInformationMessage(
            "CodeBuddy: Morning tech news arrived! ☕",
          );
        });
      }

      // --- Task 2: Afternoon News (2 PM) ---
      if (currentHour >= 14) {
        await this.tryRunTask("news_afternoon", async () => {
          this.logger.info("Executing scheduled task: news_afternoon");
          await newsService.fetchAndStoreNews();
          vscode.window.showInformationMessage(
            "CodeBuddy: Afternoon tech news update! 🌇",
          );
        });
      }

      // --- Task 3: Evening News (6 PM) ---
      if (currentHour >= 18) {
        await this.tryRunTask("news_evening", async () => {
          this.logger.info("Executing scheduled task: news_evening");
          await newsService.fetchAndStoreNews();
          vscode.window.showInformationMessage(
            "CodeBuddy: Evening tech news update! 🌙",
          );
        });
      }

      // --- Task 4: Code Health Check (9 AM) ---
      if (currentHour >= 9) {
        const config = vscode.workspace.getConfiguration("codebuddy.automations");
        if (config.get<boolean>("codeHealth.enabled", true)) {
          await this.tryRunTask("code_health_daily", async () => {
            this.logger.info("Executing scheduled task: code_health_daily");
            await this.codeHealthTask.execute();
          });
        }
      }

      // --- Task 5: Daily Standup (8 AM) ---
      if (currentHour >= 8) {
        const config = vscode.workspace.getConfiguration("codebuddy.automations");
        if (config.get<boolean>("dailyStandup.enabled", true)) {
          await this.tryRunTask("daily_standup", async () => {
            this.logger.info("Executing scheduled task: daily_standup");
            await this.standupService.generateReport();
          });
        }
      }

      // --- Task 6: Dependency Check (11 AM) ---
      if (currentHour >= 11) {
        const config = vscode.workspace.getConfiguration("codebuddy.automations");
        if (config.get<boolean>("dependencyCheck.enabled", true)) {
          await this.tryRunTask("dependency_check", async () => {
            this.logger.info("Executing scheduled task: dependency_check");
            await this.dependencyCheckTask.execute();
          });
        }
      }
    } catch (error) {
      this.logger.error("Error in Scheduler Service", error);
    }
  }

  private async tryRunTask(
    taskName: string,
    action: () => Promise<void>,
  ): Promise<void> {
    const lastRunResults = this.dbService.executeSql(
      `SELECT last_run FROM scheduled_tasks WHERE name = ?`,
      [taskName],
    );

    let shouldRun = false;
    const now = new Date();

    if (lastRunResults.length === 0) {
      // Initialize task entry
      this.dbService.executeSqlCommand(
        `INSERT INTO scheduled_tasks (name, cron_expression, command, status, last_run) 
         VALUES (?, '', 'news:fetch', 'active', NULL)`,
        [taskName],
      );
      shouldRun = true;
    } else {
      const lastRunStr = lastRunResults[0].last_run;
      if (!lastRunStr) {
        shouldRun = true;
      } else {
        const lastRun = new Date(lastRunStr);
        // Run if last run was on a different day
        if (
          lastRun.getDate() !== now.getDate() ||
          lastRun.getMonth() !== now.getMonth() ||
          lastRun.getFullYear() !== now.getFullYear()
        ) {
          shouldRun = true;
        }
      }
    }

    if (shouldRun) {
      await action();
      // Update last_run
      this.dbService.executeSqlCommand(
        `UPDATE scheduled_tasks SET last_run = ? WHERE name = ?`,
        [now.toISOString(), taskName],
      );
    }
  }
}
