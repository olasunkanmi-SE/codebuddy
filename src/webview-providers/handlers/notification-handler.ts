import { WebviewMessageHandler, HandlerContext } from "./types";
import { NotificationService } from "../../services/notification.service";

export class NotificationHandler implements WebviewMessageHandler {
  readonly commands = [
    "notifications-get",
    "notifications-mark-read",
    "notifications-mark-all-read",
    "notifications-clear-all",
    "notifications-delete",
  ];

  constructor(
    private readonly notificationService: NotificationService,
    private readonly synchronizeNotifications: () => Promise<void>,
  ) {}

  async handle(message: any, _ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "notifications-get":
        await this.synchronizeNotifications();
        break;

      case "notifications-mark-read":
        if (message.ids && Array.isArray(message.ids)) {
          for (const id of message.ids) {
            await this.notificationService.markAsRead(id);
          }
        } else if (message.id) {
          await this.notificationService.markAsRead(message.id);
        }
        await this.synchronizeNotifications();
        break;

      case "notifications-mark-all-read":
        await this.notificationService.markAllAsRead();
        await this.synchronizeNotifications();
        break;

      case "notifications-clear-all":
        await this.notificationService.clearAll();
        await this.synchronizeNotifications();
        break;

      case "notifications-delete":
        if (message.id) {
          await this.notificationService.deleteNotification(message.id);
        }
        await this.synchronizeNotifications();
        break;
    }
  }
}
