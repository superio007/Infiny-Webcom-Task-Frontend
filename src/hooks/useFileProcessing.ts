/**
 * Custom Hook for File Processing Workflow
 * Manages the complete file upload and processing workflow
 */

import { useCallback } from "react";
import { useAppContext } from "../contexts/AppContext";
import { apiClient } from "../services/api-client";
import {
  ProcessingStatus,
  ErrorState,
  ErrorCode,
  ErrorType,
  FileValidationResult,
} from "../types";
import {
  PerformanceMonitor,
  getTimeoutMessage,
} from "../utils/performance-monitoring";

/**
 * File processing workflow hook
 * Provides functions and state for managing file upload and processing
 */
export const useFileProcessing = () => {
  const { state, actions } = useAppContext();

  /**
   * Validate a file before processing
   * @param file File to validate
   * @returns Validation result
   */
  const validateFile = useCallback((file: File): FileValidationResult => {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        errorMessage: "No file selected",
      };
    }

    // Check file type
    if (file.type !== "application/pdf") {
      return {
        isValid: false,
        errorMessage: "Only PDF files are supported",
      };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        errorMessage: "File size exceeds 50MB limit",
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        errorMessage: "File appears to be empty",
      };
    }

    return {
      isValid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    };
  }, []);

  /**
   * Process the uploaded file
   * Coordinates the complete workflow from upload to results
   */
  const processFile = useCallback(async (): Promise<void> => {
    if (!state.uploadedFile) {
      const error: ErrorState = {
        type: "validation",
        code: ErrorCode.INVALID_FILE_TYPE,
        message: "No file selected for processing",
        recoverable: true,
      };
      actions.setError(error);
      return;
    }

    // Validate file before processing
    const validation = validateFile(state.uploadedFile);
    if (!validation.isValid) {
      const error: ErrorState = {
        type: "validation",
        code: ErrorCode.INVALID_FILE_TYPE,
        message: validation.errorMessage || "File validation failed",
        recoverable: true,
      };
      actions.setError(error);
      return;
    }

    // Initialize performance monitoring
    const monitor = new PerformanceMonitor(state.uploadedFile.size);
    const isLargeFile = monitor.isLargeFile();

    try {
      // Start upload phase
      const uploadStatus: ProcessingStatus = {
        stage: "uploading",
        progress: 0,
        message: isLargeFile
          ? "Starting upload... Large file detected"
          : "Starting upload...",
      };
      actions.updateProcessingStatus(uploadStatus);

      // Process file with progress tracking
      const results = await apiClient.extractBankStatement(
        state.uploadedFile,
        (progress) => {
          const progressStatus: ProcessingStatus = {
            stage: "uploading",
            progress,
            message: isLargeFile
              ? `Uploading large file... ${progress}%`
              : `Uploading... ${progress}%`,
          };
          actions.updateProcessingStatus(progressStatus);
        }
      );

      // Mark upload complete and switch to processing phase
      monitor.markUploadComplete();
      monitor.markProcessingStart();

      const processingStatus: ProcessingStatus = {
        stage: "processing",
        progress: 90,
        message: isLargeFile
          ? "Processing document... This may take a few moments for large documents"
          : "Processing document...",
      };
      actions.updateProcessingStatus(processingStatus);

      // Set timeout message for long processing
      const expectedTime = monitor.getExpectedProcessingTime();
      monitor.setTimeout(
        "processing-timeout",
        () => {
          const elapsed = Date.now() - monitor.getMetrics().uploadStartTime;
          const timeoutMessage = getTimeoutMessage(
            state.uploadedFile!.size,
            elapsed
          );

          const timeoutStatus: ProcessingStatus = {
            stage: "processing",
            progress: 95,
            message: timeoutMessage,
          };
          actions.updateProcessingStatus(timeoutStatus);
        },
        Math.max(10000, expectedTime)
      ); // At least 10 seconds

      // Set results
      monitor.markProcessingComplete();
      actions.setResults(results);

      // Clear all timeouts
      monitor.clearAllTimeouts();
    } catch (error: any) {
      // Clear all timeouts on error
      monitor.clearAllTimeouts();

      // Handle different types of errors
      let errorState: ErrorState;

      if (error.errorCode) {
        // API error with specific code
        errorState = {
          type: mapErrorCodeToType(error.errorCode),
          code: error.errorCode,
          message: mapErrorCodeToMessage(error.errorCode, error.message),
          recoverable: isErrorRecoverable(error.errorCode),
          retryAction: () => processFile(),
        };
      } else if (error.name === "NetworkError" || error.statusCode === 0) {
        // Network error
        errorState = {
          type: "network",
          message:
            "Unable to connect to the service. Please check your internet connection.",
          recoverable: true,
          retryAction: () => processFile(),
        };
      } else {
        // Generic error
        errorState = {
          type: "processing",
          message:
            error.message || "An unexpected error occurred during processing",
          recoverable: true,
          retryAction: () => processFile(),
        };
      }

      actions.setError(errorState);
    }
  }, [state.uploadedFile, actions, validateFile]);

  /**
   * Retry processing with the current file
   */
  const retryProcessing = useCallback(async (): Promise<void> => {
    actions.clearError();
    await processFile();
  }, [actions, processFile]);

  /**
   * Reset the processing workflow
   */
  const resetProcessing = useCallback((): void => {
    actions.clearResults();
    actions.clearError();
    actions.setFile(null);
  }, [actions]);

  return {
    // State
    uploadedFile: state.uploadedFile,
    processingStatus: state.processingStatus,
    results: state.results,
    error: state.error,
    isProcessing:
      state.processingStatus.stage === "uploading" ||
      state.processingStatus.stage === "processing",
    isComplete: state.processingStatus.stage === "complete",
    hasError: state.processingStatus.stage === "error",

    // Actions
    validateFile,
    processFile,
    retryProcessing,
    resetProcessing,
    setFile: actions.setFile,
    clearError: actions.clearError,
  };
};

/**
 * Map error codes to error types
 */
function mapErrorCodeToType(errorCode: ErrorCode): ErrorType {
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
 * Map error codes to user-friendly messages
 */
function mapErrorCodeToMessage(
  errorCode: ErrorCode,
  originalMessage?: string
): string {
  switch (errorCode) {
    case ErrorCode.INVALID_FILE_TYPE:
      return "Please select a PDF file only. Other file types are not supported.";
    case ErrorCode.INVALID_PDF:
      return "The PDF file appears to be corrupted or unreadable. Please try a different file.";
    case ErrorCode.LLM_UNAVAILABLE:
      return "The processing service is temporarily unavailable. Please try again in a few moments.";
    case ErrorCode.OCR_TIMEOUT:
      return "Processing is taking longer than expected. This may happen with large or complex documents.";
    case ErrorCode.OCR_UNREADABLE:
      return "Some parts of the document could not be read. Please ensure the PDF has clear, readable text.";
    case ErrorCode.INTERNAL_ERROR:
      return "An unexpected error occurred. Please try again or contact support if the problem persists.";
    default:
      return (
        originalMessage ||
        "An error occurred during processing. Please try again."
      );
  }
}

/**
 * Determine if an error is recoverable (user can retry)
 */
function isErrorRecoverable(errorCode: ErrorCode): boolean {
  switch (errorCode) {
    case ErrorCode.INVALID_FILE_TYPE:
    case ErrorCode.INVALID_PDF:
      return true; // User can select a different file
    case ErrorCode.LLM_UNAVAILABLE:
    case ErrorCode.OCR_TIMEOUT:
    case ErrorCode.INTERNAL_ERROR:
      return true; // Temporary issues, can retry
    case ErrorCode.OCR_UNREADABLE:
      return true; // User can try a different file
    default:
      return true; // Default to recoverable
  }
}
