// src/services/change-detection/change-detector.service.ts
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { IChangeProvider, ChangeDetails } from "./types";
import {
  NotificationService,
  NotificationSource,
} from "../../services/notification.service";

export class ChangeDetector {
  private readonly logger: Logger;
  private readonly notificationService: NotificationService;

  constructor(
    private readonly providers: IChangeProvider[],
    notificationService?: NotificationService,
  ) {
    this.logger = Logger.initialize("ChangeDetector", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.notificationService =
      notificationService ?? NotificationService.getInstance();
  }

  async findChanges(targetBranch: string): Promise<ChangeDetails> {
    for (const provider of this.providers) {
      try {
        const result = await provider.getChanges(targetBranch);
        if (result) {
          this.logger.info(
            `Successfully found changes using: ${provider.name}`,
          );
          return result;
        }
      } catch (error) {
        this.logger.warn(`Provider ${provider.name} failed:`, error);
      }
    }

    // Final fallback if no providers succeed
    this.notificationService.addNotification(
      "warning",
      "No Git Changes Detected",
      "Could not detect Git changes for PR review. The review may be less accurate.",
      NotificationSource.PRReview,
    );
    return {
      branchInfo: `Current branch vs ${targetBranch} (No changes detected)`,
      changedFiles: [],
      diffContent:
        "Note: No specific file changes were detected. Performing a general code quality assessment.",
    };
  }
}
