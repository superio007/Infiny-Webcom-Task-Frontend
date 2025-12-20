/**
 * Error Mapping Utilities
 * Maps API error codes to user-friendly messages with recovery suggestions
 */

import { ErrorCode, APIError, ErrorState, ErrorType } from "../types";

/**
 * Error mapping configuration
 */
interface ErrorMapping {
  userMessage: string;
  recoverable: boolean;
  suggestedAction?: string;
  errorType: ErrorType;
}

/**
 * Comprehensive error code to user message mappings
 */
const ERROR_MAPPINGS: Record<ErrorCode, ErrorMapping> = {
  [ErrorCode.INVALID_FILE_TYPE]: {
    userMessage:
      "Please select a PDF file only. Other file types are not supported.",
    recoverable: true,
    suggestedAction: "Choose a different file",
    errorType: "validation",
  },
  [ErrorCode.INVALID_PDF]: {
    userMessage: "The PDF file appears to be corrupted or unreadable.",
    recoverable: true,
    suggestedAction: "Try a different PDF file",
    errorType: "validation",
  },
  [ErrorCode.INVALID_ENDPOINT]: {
    userMessage: "Invalid API endpoint. Please contact support.",
    recoverable: false,
    errorType: "api",
  },
  [ErrorCode.OCR_UNREADABLE]: {
    userMessage:
      "The document content could not be read. The image quality may be too low.",
    recoverable: true,
    suggestedAction: "Try a higher quality scan or a different document",
    errorType: "processing",
  },
  [ErrorCode.OCR_TIMEOUT]: {
    userMessage:
      "Document processing timed out. This may happen with large or complex documents.",
    recoverable: true,
    suggestedAction: "Try again or use a smaller document",
    errorType: "processing",
  },
  [ErrorCode.LLM_SCHEMA_VIOLATION]: {
    userMessage: "The document structure could not be properly analyzed.",
    recoverable: true,
    suggestedAction: "Try a different document or contact support",
    errorType: "processing",
  },
  [ErrorCode.LLM_UNAVAILABLE]: {
    userMessage: "The processing service is temporarily unavailable.",
    recoverable: true,
    suggestedAction: "Please try again in a few moments",
    errorType: "api",
  },
  [ErrorCode.INTERNAL_ERROR]: {
    userMessage: "An unexpected error occurred while processing your request.",
    recoverable: true,
    suggestedAction: "Please try again",
    errorType: "api",
  },
};

/**
 * Network error messages
 */
const NETWORK_ERROR_MAPPING: ErrorMapping = {
  userMessage:
    "Unable to connect to the service. Please check your internet connection.",
  recoverable: true,
  suggestedAction: "Check your connection and try again",
  errorType: "network",
};

/**
 * Timeout error messages
 */
const TIMEOUT_ERROR_MAPPING: ErrorMapping = {
  userMessage: "The request timed out. Large files may take longer to process.",
  recoverable: true,
  suggestedAction: "Try again or use a smaller file",
  errorType: "network",
};

/**
 * Map API error to user-friendly error state
 * @param apiError API error from backend
 * @returns ErrorState with user-friendly message and recovery options
 */
export function mapAPIErrorToErrorState(apiError: APIError): ErrorState {
  const mapping =
    ERROR_MAPPINGS[apiError.errorCode] ||
    ERROR_MAPPINGS[ErrorCode.INTERNAL_ERROR];

  return {
    type: mapping.errorType,
    code: apiError.errorCode,
    message: apiError.message || mapping.userMessage,
    recoverable: mapping.recoverable,
  };
}

/**
 * Map network error to error state
 * @param error Network error
 * @returns ErrorState for network issues
 */
export function mapNetworkErrorToErrorState(error: Error): ErrorState {
  return {
    type: NETWORK_ERROR_MAPPING.errorType,
    message: NETWORK_ERROR_MAPPING.userMessage,
    recoverable: NETWORK_ERROR_MAPPING.recoverable,
  };
}

/**
 * Map timeout error to error state
 * @returns ErrorState for timeout issues
 */
export function mapTimeoutErrorToErrorState(): ErrorState {
  return {
    type: TIMEOUT_ERROR_MAPPING.errorType,
    code: ErrorCode.OCR_TIMEOUT,
    message: TIMEOUT_ERROR_MAPPING.userMessage,
    recoverable: TIMEOUT_ERROR_MAPPING.recoverable,
  };
}

/**
 * Get user-friendly error message for error code
 * @param errorCode Error code from API
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(errorCode: ErrorCode): string {
  const mapping = ERROR_MAPPINGS[errorCode];
  return mapping
    ? mapping.userMessage
    : ERROR_MAPPINGS[ErrorCode.INTERNAL_ERROR].userMessage;
}

/**
 * Get suggested action for error code
 * @param errorCode Error code from API
 * @returns Suggested action or undefined
 */
export function getSuggestedAction(errorCode: ErrorCode): string | undefined {
  const mapping = ERROR_MAPPINGS[errorCode];
  return mapping?.suggestedAction;
}

/**
 * Check if error is recoverable
 * @param errorCode Error code from API
 * @returns True if error is recoverable
 */
export function isRecoverableError(errorCode: ErrorCode): boolean {
  const mapping = ERROR_MAPPINGS[errorCode];
  return mapping ? mapping.recoverable : true;
}

/**
 * Get error type for error code
 * @param errorCode Error code from API
 * @returns Error type
 */
export function getErrorType(errorCode: ErrorCode): ErrorType {
  const mapping = ERROR_MAPPINGS[errorCode];
  return mapping ? mapping.errorType : "api";
}

/**
 * Create error state from any error
 * @param error Error object (can be APIError, Error, or unknown)
 * @returns ErrorState with appropriate mapping
 */
export function createErrorState(error: unknown): ErrorState {
  // Handle API errors
  if (error && typeof error === "object" && "errorCode" in error) {
    return mapAPIErrorToErrorState(error as APIError);
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return mapNetworkErrorToErrorState(error);
    }
    if (error.message.includes("timeout")) {
      return mapTimeoutErrorToErrorState();
    }
  }

  // Default to generic error
  return {
    type: "api",
    message: "An unexpected error occurred",
    recoverable: true,
  };
}

/**
 * Format error message with suggested action
 * @param errorState Error state
 * @returns Formatted error message with action
 */
export function formatErrorMessage(errorState: ErrorState): string {
  let message = errorState.message;

  if (errorState.code) {
    const suggestedAction = getSuggestedAction(errorState.code);
    if (suggestedAction) {
      message += ` ${suggestedAction}`;
    }
  }

  return message;
}

/**
 * Get error severity level
 * @param errorState Error state
 * @returns Severity level (error, warning, info)
 */
export function getErrorSeverity(
  errorState: ErrorState
): "error" | "warning" | "info" {
  if (!errorState.recoverable) {
    return "error";
  }

  if (errorState.type === "validation") {
    return "warning";
  }

  return "error";
}
