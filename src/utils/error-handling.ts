import { Logger } from "../infrastructure/logger/logger";

/**
 * Centralized error handling utility for async operations
 * Provides consistent error logging and handling across services
 */
export class ErrorHandler {
  /**
   * Handle async errors with consistent logging and rethrowing
   */
  static async handleAsyncError<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    logger: Logger,
    shouldRethrow = true,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error: any) {
      logger.error(errorMessage, error);

      if (shouldRethrow) {
        throw error;
      }

      return null;
    }
  }

  /**
   * Handle sync errors with consistent logging
   */
  static handleSyncError<T>(
    operation: () => T,
    errorMessage: string,
    logger: Logger,
    defaultValue: T,
  ): T {
    try {
      return operation();
    } catch (error: any) {
      logger.error(errorMessage, error);
      return defaultValue;
    }
  }

  /**
   * Wrap async operations with timeout and error handling
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    errorMessage: string,
    logger: Logger,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error: any) {
      logger.error(errorMessage, error);
      throw error;
    }
  }

  /**
   * Create a safe version of an async function that won't throw
   */
  static makeSafe<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    logger: Logger,
    defaultValue: TReturn,
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      try {
        return await fn(...args);
      } catch (error: any) {
        logger.error(`Safe function call failed: ${fn.name}`, error);
        return defaultValue;
      }
    };
  }
}

/**
 * Convenience function for handling async errors
 * @deprecated Use ErrorHandler.handleAsyncError instead
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  logger: Logger,
): Promise<T> {
  return ErrorHandler.handleAsyncError(
    operation,
    errorMessage,
    logger,
    true,
  ) as Promise<T>;
}
