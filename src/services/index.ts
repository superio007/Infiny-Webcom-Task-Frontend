// API Client Service
export { APIClient, apiClient, extractBankStatement } from "./api-client";

// Error Mapping Utilities
export {
  mapAPIErrorToErrorState,
  mapNetworkErrorToErrorState,
  mapTimeoutErrorToErrorState,
  getUserFriendlyMessage,
  getSuggestedAction,
  isRecoverableError,
  getErrorType,
  createErrorState,
  formatErrorMessage,
  getErrorSeverity,
} from "./error-mapper";

// Warning Handler Service
export {
  processWarnings,
  getWarningSummary,
  shouldDisplayResults,
  groupWarningsByPage,
  getWarningIcon,
  formatWarning,
  type ProcessedWarning,
  type WarningSummary,
  type WarningSeverity,
} from "./warning-handler";

// Retry Handler Service
export {
  RetryHandler,
  retryHandler,
  withRetry,
  createRetryAction,
  type RetryConfig,
  type RetryAttempt,
  type RetryResult,
} from "./retry-handler";
