import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { SqliteDatabaseService } from "./sqlite-database.service";

export interface NotificationItem {
  id: number;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private logger: Logger;
  private dbService: SqliteDatabaseService;
  private _onDidNotificationChange = new vscode.EventEmitter<void>();
  public readonly onDidNotificationChange = this._onDidNotificationChange.event;

  private constructor() {
    this.logger = Logger.initialize("NotificationService", {});
    this.dbService = SqliteDatabaseService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Add a new notification
   */
  public async addNotification(
    type: "info" | "warning" | "error" | "success",
    title: string,
    message: string,
    source = "System",
  ): Promise<void> {
    try {
      await this.dbService.initialize();
      this.dbService.executeSqlCommand(
        `INSERT INTO notifications (type, title, message, source, read_status, timestamp) 
         VALUES (?, ?, ?, ?, 0, datetime('now'))`,
        [type, title, message, source],
      );
      this.logger.info(`Added notification: ${title}`);
      this._onDidNotificationChange.fire();
    } catch (error) {
      this.logger.error("Failed to add notification", error);
    }
  }

  /**
   * Get all notifications
   */
  public async getNotifications(
    limit = 50,
  ): Promise<NotificationItem[]> {
    try {
      await this.dbService.initialize();
      const results = this.dbService.executeSql(
        `SELECT * FROM notifications ORDER BY timestamp DESC LIMIT ?`,
        [limit],
      );

      return results.map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        timestamp: row.timestamp,
        read: row.read_status === 1,
        source: row.source,
      }));
    } catch (error) {
      this.logger.error("Failed to get notifications", error);
      return [];
    }
  }

  /**
   * Get unread notifications count
   */
  public async getUnreadCount(): Promise<number> {
    try {
      await this.dbService.initialize();
      const results = this.dbService.executeSql(
        `SELECT COUNT(*) as count FROM notifications WHERE read_status = 0`,
      );
      return results[0]?.count || 0;
    } catch (error) {
      this.logger.error("Failed to get unread count", error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  public async markAsRead(id: number): Promise<void> {
    try {
      await this.dbService.initialize();
      this.dbService.executeSqlCommand(
        `UPDATE notifications SET read_status = 1 WHERE id = ?`,
        [id],
      );
      this._onDidNotificationChange.fire();
    } catch (error) {
      this.logger.error(`Failed to mark notification ${id} as read`, error);
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<void> {
    try {
      await this.dbService.initialize();
      this.dbService.executeSqlCommand(
        `UPDATE notifications SET read_status = 1 WHERE read_status = 0`,
      );
      this._onDidNotificationChange.fire();
    } catch (error) {
      this.logger.error("Failed to mark all notifications as read", error);
    }
  }

  /**
   * Clear all notifications
   */
  public async clearAll(): Promise<void> {
    try {
      await this.dbService.initialize();
      this.dbService.executeSqlCommand(`DELETE FROM notifications`);
      this._onDidNotificationChange.fire();
    } catch (error) {
      this.logger.error("Failed to clear notifications", error);
    }
  }
}
