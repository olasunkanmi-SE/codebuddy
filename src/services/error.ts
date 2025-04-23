// Create a new file: src/infrastructure/error/error-handler.ts

import { Logger, LogLevel } from "../infrastructure/logger/logger";

export enum ErrorCode {
  API_ERROR = "API_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  FUNCTION_CALL_ERROR = "FUNCTION_CALL_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SECURITY_ERROR = "SECURITY_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface RetryConfig {
  maxRetries: number;
  backoffFactor: number;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: ErrorCode[];
}

export class RetryableOperation {
  private logger: Logger;

  constructor(
    private config: RetryConfig = {
      maxRetries: 3,
      backoffFactor: 2,
      initialDelay: 1000,
      maxDelay: 10000,
      retryableErrors: [
        ErrorCode.API_ERROR,
        ErrorCode.TIMEOUT_ERROR,
        ErrorCode.FUNCTION_CALL_ERROR,
      ],
    },
  ) {
    this.logger = Logger.initialize("RetryableOperation", {
      minLevel: LogLevel.DEBUG,
    });
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: string = "operation",
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry for specific error types
        if (
          error instanceof AppError &&
          !this.config.retryableErrors.includes(error.code)
        ) {
          this.logger.error(`Non-retryable error in ${context}`, {
            error,
            attempt,
          });
          throw error;
        }

        if (attempt >= this.config.maxRetries) {
          this.logger.error(`Max retries reached for ${context}`, {
            error,
            attempts: attempt,
          });
          throw new AppError(
            ErrorCode.UNKNOWN_ERROR,
            `Failed after ${attempt} attempts: ${lastError.message}`,
            lastError,
          );
        }

        const delay = Math.min(
          this.config.initialDelay *
            Math.pow(this.config.backoffFactor, attempt),
          this.config.maxDelay,
        );

        this.logger.warn(
          `Retry attempt ${attempt + 1} for ${context} after ${delay}ms`,
          String({ error: lastError }),
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never happen due to the throw in the loop above
    throw new AppError(
      ErrorCode.UNKNOWN_ERROR,
      `Unexpected error: ${lastError?.message || "Unknown error"}`,
      lastError,
    );
  }
}
