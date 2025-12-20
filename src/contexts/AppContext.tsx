/**
 * Application Context for Global State Management
 * Provides centralized state management for the bank statement processing workflow
 */

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  AppState,
  ProcessingStatus,
  ErrorState,
  APIResponse,
  ErrorCode,
  ErrorType,
} from "../types";
import {
  processWarnings,
  shouldDisplayResults,
} from "../services/warning-handler";
import { withRetry } from "../services/retry-handler";

/**
 * Initial application state
 */
const initialState: AppState = {
  uploadedFile: null,
  processingStatus: {
    stage: "idle",
    progress: 0,
    message: undefined,
  },
  results: null,
  error: null,
};

/**
 * Action types for state management
 */
type AppAction =
  | { type: "SET_FILE"; payload: File | null }
  | { type: "SET_PROCESSING_STATUS"; payload: ProcessingStatus }
  | { type: "SET_RESULTS"; payload: APIResponse }
  | { type: "SET_ERROR"; payload: ErrorState }
  | { type: "CLEAR_RESULTS" }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET_STATE" };

/**
 * State reducer for managing application state transitions
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_FILE":
      return {
        ...state,
        uploadedFile: action.payload,
        // Clear previous results and errors when new file is selected
        results: null,
        error: null,
        processingStatus: {
          stage: "idle",
          progress: 0,
        },
      };

    case "SET_PROCESSING_STATUS":
      return {
        ...state,
        processingStatus: action.payload,
        // Clear error when processing starts
        error: action.payload.stage === "uploading" ? null : state.error,
      };

    case "SET_RESULTS":
      return {
        ...state,
        results: action.payload,
        processingStatus: {
          stage: "complete",
          progress: 100,
          message: "Processing completed successfully",
        },
        error: null,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        processingStatus: {
          stage: "error",
          progress: 0,
          message: action.payload.message,
        },
      };

    case "CLEAR_RESULTS":
      return {
        ...state,
        results: null,
        processingStatus: {
          stage: "idle",
          progress: 0,
        },
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
        processingStatus: {
          stage: "idle",
          progress: 0,
        },
      };

    case "RESET_STATE":
      return initialState;

    default:
      return state;
  }
}

/**
 * Extended actions interface including internal actions
 */
interface AppContextActions {
  setFile: (file: File | null) => void;
  startProcessing: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  updateProcessingStatus: (status: ProcessingStatus) => void;
  setResults: (results: APIResponse) => void;
  setError: (error: ErrorState) => void;
  resetState: () => void;
}

/**
 * Application context value
 */
interface AppContextValue {
  state: AppState;
  actions: AppContextActions;
}

/**
 * Application Context
 */
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Props for AppProvider component
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * Application Context Provider
 * Wraps the application and provides global state management
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  /**
   * Set the uploaded file
   */
  const setFile = (file: File | null) => {
    dispatch({ type: "SET_FILE", payload: file });
  };

  /**
   * Start processing the uploaded file
   * Coordinates the complete workflow from upload to results
   */
  const startProcessing = async (): Promise<void> => {
    if (!state.uploadedFile) {
      const error: ErrorState = {
        type: "validation",
        code: ErrorCode.INVALID_FILE_TYPE,
        message: "No file selected for processing",
        recoverable: true,
      };
      dispatch({ type: "SET_ERROR", payload: error });
      return;
    }

    // Import API client dynamically to avoid circular dependencies
    const { apiClient } = await import("../services/api-client");

    try {
      // Start upload phase
      dispatch({
        type: "SET_PROCESSING_STATUS",
        payload: {
          stage: "uploading",
          progress: 0,
          message: "Starting upload...",
        },
      });

      // Process file with retry logic
      const retryResult = await withRetry(
        async () => {
          return await apiClient.extractBankStatement(
            state.uploadedFile!,
            (progress) => {
              dispatch({
                type: "SET_PROCESSING_STATUS",
                payload: {
                  stage: "uploading",
                  progress,
                  message: `Uploading... ${progress}%`,
                },
              });
            }
          );
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
        },
        (attempt) => {
          // Handle retry attempts
          dispatch({
            type: "SET_PROCESSING_STATUS",
            payload: {
              stage: "uploading",
              progress: 0,
              message: `Retrying... (attempt ${attempt.attemptNumber}/${attempt.totalAttempts})`,
            },
          });
        }
      );

      if (!retryResult.success) {
        throw retryResult.error;
      }

      const results = retryResult.result!;

      // Switch to processing phase
      dispatch({
        type: "SET_PROCESSING_STATUS",
        payload: {
          stage: "processing",
          progress: 90,
          message: "Processing document...",
        },
      });

      // Process warnings if any
      const processedWarnings = processWarnings(results);

      // Check if results should be displayed despite warnings
      if (!shouldDisplayResults(processedWarnings)) {
        throw new Error("Too many critical errors in document processing");
      }

      // Set results (this will automatically transition to "complete" stage)
      console.log('🎯 Setting results in AppContext:', results);
      dispatch({ type: "SET_RESULTS", payload: results });
    } catch (error: any) {
      // Handle different types of errors
      let errorState: ErrorState;

      if (error.errorCode) {
        // API error with specific code
        errorState = {
          type: mapErrorCodeToType(error.errorCode),
          code: error.errorCode,
          message: mapErrorCodeToMessage(error.errorCode, error.message),
          recoverable: isErrorRecoverable(error.errorCode),
          retryAction: () => startProcessing(),
        };
      } else if (error.name === "NetworkError" || error.statusCode === 0) {
        // Network error
        errorState = {
          type: "network",
          message:
            "Unable to connect to the service. Please check your internet connection.",
          recoverable: true,
          retryAction: () => startProcessing(),
        };
      } else {
        // Generic error
        errorState = {
          type: "processing",
          message:
            error.message || "An unexpected error occurred during processing",
          recoverable: true,
          retryAction: () => startProcessing(),
        };
      }

      dispatch({ type: "SET_ERROR", payload: errorState });
    }
  };

  /**
   * Clear processing results
   */
  const clearResults = () => {
    dispatch({ type: "CLEAR_RESULTS" });
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  /**
   * Update processing status
   */
  const updateProcessingStatus = (status: ProcessingStatus) => {
    dispatch({ type: "SET_PROCESSING_STATUS", payload: status });
  };

  /**
   * Set processing results
   */
  const setResults = (results: APIResponse) => {
    dispatch({ type: "SET_RESULTS", payload: results });
  };

  /**
   * Set error state
   */
  const setError = (error: ErrorState) => {
    dispatch({ type: "SET_ERROR", payload: error });
  };

  /**
   * Reset application state
   */
  const resetState = () => {
    dispatch({ type: "RESET_STATE" });
  };

  const actions: AppContextActions = {
    setFile,
    startProcessing,
    clearResults,
    clearError,
    updateProcessingStatus,
    setResults,
    setError,
    resetState,
  };

  const contextValue: AppContextValue = {
    state,
    actions,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

/**
 * Hook to use the application context
 * @returns Application context value
 * @throws Error if used outside of AppProvider
 */
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
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

/**
 * Utility function to create error states
 */
export const createErrorState = (
  type: ErrorType,
  message: string,
  code?: ErrorCode,
  recoverable: boolean = true,
  retryAction?: () => void
): ErrorState => {
  return {
    type,
    code,
    message,
    recoverable,
    retryAction,
  };
};
