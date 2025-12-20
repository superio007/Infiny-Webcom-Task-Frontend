/**
 * Retry Handler Service
 * Provides retry mechanisms and error recovery strategies
 */

import { ErrorCode, ErrorState, ErrorType } from "../types";

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
  retryableErrors: ErrorCode[]; // Which errors can be retried
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.LLM_UNAVAILABLE,
    ErrorCode.OCR_TIMEOUT,
    ErrorCode.INTERNAL_ERROR,
  ],
};

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attemptNumber: number;
  totalAttempts: number;
  delay: number;
  error: ErrorState;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: ErrorState;
  attempts: RetryAttempt[];
}

/**
 * Retry handler class
 */
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute operation with retry logic
   * @param operation Function to execute
   * @param onRetry Optional callback for retry attempts
   * @returns Promise with retry result
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: RetryAttempt) => void
  ): Promise<RetryResult<T>> {
    const attempts: RetryAttempt[] = [];
    let lastError: ErrorState;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts,
        };
      } catch (error: any) {
        const errorState = this.normalizeError(error);
        lastError = errorState;

        const retryAttempt: RetryAttempt = {
          attemptNumber: attempt,
          totalAttempts: this.config.maxAttempts,
          delay: this.calculateDelay(attempt),
          error: errorState,
        };

        attempts.push(retryAttempt);

        // Check if error is retryable
        if (!this.isRetryableError(errorState)) {
          break;
        }

        // Don't wait after the last attempt
        if (attempt < this.config.maxAttempts) {
          // Notify about retry attempt
          if (onRetry) {
            onRetry(retryAttempt);
          }

          // Wait before retry
          await this.delay(retryAttempt.delay);
        }
      }
    }

    return {
      success: false,
      error: lastError!,
      attempts,
    };
  }

  /**
   * Check if an error is retryable
   * @param error Error state
   * @returns True if error can be retried
   */
  isRetryableError(error: ErrorState): boolean {
    // Check by error code
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check by error type
    switch (error.type) {
      case "network":
      case "api":
        return true;
      case "processing":
        return (
          error.code === ErrorCode.OCR_TIMEOUT ||
          error.code === ErrorCode.INTERNAL_ERROR
        );
      case "validation":
        return false; // Validation errors are not retryable
      default:
        return false;
    }
  }

  /**
   * Calculate delay for retry attempt
   * @param attempt Attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number): number {
    const delay =
      this.config.baseDelay *
      Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Normalize error to ErrorState
   * @param error Raw error
   * @returns Normalized error state
   */
  private normalizeError(error: any): ErrorState {
    if (error.errorCode) {
      // API error
      return {
        type: this.mapErrorCodeToType(error.errorCode),
        code: error.errorCode,
        message: error.message || "API error occurred",
        recoverable: this.isRetryableError({
          type: "api",
          code: error.errorCode,
        } as ErrorState),
      };
    }

    if (error.name === "NetworkError" || error.statusCode === 0) {
      // Network error
      return {
        type: "network",
        message: "Network error occurred",
        recoverable: true,
      };
    }

    // Generic error
    return {
      type: "processing",
      message: error.message || "An unexpected error occurred",
      recoverable: false,
    };
  }

  /**
   * Map error code to error type
   */
  private mapErrorCodeToType(errorCode: ErrorCode): ErrorType {
    switch (errorCode) {
      case ErrorCode.INVALID_FILE_TYPE:
      case ErrorCode.INVALID_PDF:
        return "validation";
      case ErrorCode.LLM_UNAVAILABLE:
      case ErrorCode.INTERNAL_ERROR:
        return "api";
      case ErrorCode.OCR_TIMEOUT:
      case ErrorCode.OCR_UNREADABLE:
        return "processing";
      default:
        return "processing";
    }
  }

  /**
   * Create delay promise
   * @param ms Milliseconds to wait
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default retry handler instance
 */
export const retryHandler = new RetryHandler();

/**
 * Convenience function for retrying operations
 * @param operation Function to execute
 * @param config Optional retry configuration
 * @param onRetry Optional retry callback
 * @returns Promise with retry result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  onRetry?: (attempt: RetryAttempt) => void
): Promise<RetryResult<T>> {
  const handler = config ? new RetryHandler(config) : retryHandler;
  return handler.executeWithRetry(operation, onRetry);
}

/**
 * Create retry action for error state
 * @param operation Original operation to retry
 * @param config Optional retry configuration
 * @returns Retry function
 */
export function createRetryAction<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): () => Promise<T> {
  return async () => {
    const result = await withRetry(operation, config);
    if (result.success && result.result !== undefined) {
      return result.result;
    }
    throw result.error;
  };
}
