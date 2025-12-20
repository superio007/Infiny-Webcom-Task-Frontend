/**
 * Error Handler Component
 * Displays error messages with appropriate styling and recovery actions
 */

import React from "react";
import { ErrorHandlerProps, ErrorState, ErrorCode } from "../types";
import { getSuggestedAction, getErrorSeverity } from "../services/error-mapper";

/**
 * Error Handler Component
 * Provides user-friendly error display with recovery options
 */
export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onClear,
}) => {
  if (!error) {
    return null;
  }

  const severity = getErrorSeverity(error);
  const suggestedAction = error.code
    ? getSuggestedAction(error.code)
    : undefined;

  const handleRetry = () => {
    if (error.retryAction) {
      error.retryAction();
    } else if (onRetry) {
      onRetry();
    }
  };

  const getErrorIcon = () => {
    switch (severity) {
      case "error":
        return "⚠️";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "⚠️";
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case "validation":
        return "File Validation Error";
      case "api":
        return "Service Error";
      case "network":
        return "Connection Error";
      case "processing":
        return "Processing Error";
      default:
        return "Error";
    }
  };

  return (
    <div
      className={`rounded-lg p-4 my-4 border shadow-sm ${
        severity === "error"
          ? "bg-red-50 border-red-200 text-red-900"
          : severity === "warning"
          ? "bg-yellow-50 border-yellow-200 text-yellow-900"
          : "bg-blue-50 border-blue-200 text-blue-900"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl flex-shrink-0" aria-hidden="true">
            {getErrorIcon()}
          </span>
          <h3 className="text-base font-semibold leading-tight m-0">
            {getErrorTitle()}
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm leading-relaxed m-0">{error.message}</p>

          {suggestedAction && (
            <p className="text-sm leading-relaxed italic m-0">
              <strong>Suggestion:</strong> {suggestedAction}
            </p>
          )}

          {error.code && (
            <p className="text-xs font-mono opacity-70 m-0">
              Error Code: {error.code}
            </p>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          {error.recoverable && (
            <button
              type="button"
              className="px-4 py-2 border border-blue-500 rounded-md bg-blue-500 text-white text-sm font-medium cursor-pointer transition-all duration-200 min-w-[80px] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
              onClick={handleRetry}
              aria-label="Retry the operation"
            >
              Try Again
            </button>
          )}

          <button
            type="button"
            className="px-4 py-2 border border-current rounded-md bg-transparent text-sm font-medium cursor-pointer transition-all duration-200 min-w-[80px] hover:-translate-y-0.5 hover:shadow-md hover:bg-black hover:bg-opacity-5 active:translate-y-0 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
            onClick={onClear}
            aria-label="Clear the error and start over"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Error Message Component
 * Simple error message display without actions
 */
interface ErrorMessageProps {
  message: string;
  type?: "error" | "warning" | "info";
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = "error",
  className = "",
}) => {
  const getIcon = () => {
    switch (type) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "❌";
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm leading-relaxed ${
        type === "error"
          ? "bg-red-50 text-red-900"
          : type === "warning"
          ? "bg-yellow-50 text-yellow-900"
          : "bg-blue-50 text-blue-900"
      } ${className}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-base flex-shrink-0" aria-hidden="true">
        {getIcon()}
      </span>
      <span className="flex-1">{message}</span>
    </div>
  );
};

/**
 * Inline Error Component
 * For form field validation errors
 */
interface InlineErrorProps {
  message: string;
  fieldId?: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  fieldId,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 mt-1 text-xs text-red-900 ${className}`}
      role="alert"
      aria-live="polite"
      id={fieldId ? `${fieldId}-error` : undefined}
    >
      <span className="text-sm flex-shrink-0" aria-hidden="true">
        ⚠️
      </span>
      <span className="flex-1 leading-tight">{message}</span>
    </div>
  );
};

export default ErrorHandler;
