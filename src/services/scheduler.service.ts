import * as vscode from 'vscode';
import { SqliteDatabaseService } from './sqlite-database.service';
import { NewsService } from './news.service';
import { Logger } from '../infrastructure/logger/logger';

export class SchedulerService {
    private static instance: SchedulerService;
    private dbService: SqliteDatabaseService;
    private logger: Logger;
    private intervalId: NodeJS.Timeout | undefined;

    private constructor() {
        this.dbService = SqliteDatabaseService.getInstance();
        this.logger = Logger.initialize('SchedulerService', {});
    }

    public static getInstance(): SchedulerService {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService();
        }
        return SchedulerService.instance;
    }

    public start(): void {
        if (this.intervalId) return;

        this.logger.info('Starting Scheduler Service...');
        
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
            // For now, we'll hardcode the "Morning News" task logic
            // In a full implementation, we would query the `scheduled_tasks` table
            // and parse cron expressions.
            
            // Check if we fetched news today
            const lastRunResults = this.dbService.executeSql(
                `SELECT last_run FROM scheduled_tasks WHERE name = 'daily_news'`
            );
            
            const now = new Date();
            let shouldRun = false;

            if (lastRunResults.length === 0) {
                // First time running, create the task entry
                this.dbService.executeSqlCommand(
                    `INSERT INTO scheduled_tasks (name, cron_expression, command, status) 
                     VALUES ('daily_news', '0 9 * * *', 'news:fetch', 'active')`
                );
                shouldRun = true;
            } else {
                const lastRun = lastRunResults[0].last_run ? new Date(lastRunResults[0].last_run) : null;
                if (!lastRun) {
                    shouldRun = true;
                } else {
                    // Check if last run was on a previous day
                    if (lastRun.getDate() !== now.getDate() || lastRun.getMonth() !== now.getMonth() || lastRun.getFullYear() !== now.getFullYear()) {
                        shouldRun = true;
                    }
                }
            }

            if (shouldRun) {
                this.logger.info('Executing scheduled task: daily_news');
                await NewsService.getInstance().fetchAndStoreNews();
                
                // Update last_run
                this.dbService.executeSqlCommand(
                    `UPDATE scheduled_tasks SET last_run = ? WHERE name = 'daily_news'`,
                    [now.toISOString()]
                );
                
                // Notify user
                vscode.window.showInformationMessage('CodeBuddy: Daily software news fetched!');
            }

        } catch (error) {
            this.logger.error('Error in Scheduler Service', error);
        }
    }
}
