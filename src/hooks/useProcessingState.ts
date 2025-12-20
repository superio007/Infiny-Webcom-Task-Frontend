/**
 * Custom Hook for Processing State Management
 * Manages state transitions during the file processing workflow
 */

import { useCallback, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import {
  ProcessingStatus,
  ProcessingStage,
  ErrorState,
  APIResponse,
} from "../types";

/**
 * Processing state management hook
 * Provides utilities for managing processing state transitions
 */
export const useProcessingState = () => {
  const { state, actions } = useAppContext();

  /**
   * Transition to a new processing stage
   */
  const transitionToStage = useCallback(
    (stage: ProcessingStage, progress?: number, message?: string) => {
      const status: ProcessingStatus = {
        stage,
        progress: progress ?? state.processingStatus.progress,
        message: message ?? getDefaultMessageForStage(stage),
      };

      actions.updateProcessingStatus(status);
    },
    [state.processingStatus.progress, actions]
  );

  /**
   * Update processing progress
   */
  const updateProgress = useCallback(
    (progress: number, message?: string) => {
      const status: ProcessingStatus = {
        ...state.processingStatus,
        progress,
        message: message ?? state.processingStatus.message,
      };

      actions.updateProcessingStatus(status);
    },
    [state.processingStatus, actions]
  );

  /**
   * Start the processing workflow
   */
  const startProcessing = useCallback(() => {
    transitionToStage("uploading", 0, "Preparing to upload...");
  }, [transitionToStage]);

  /**
   * Mark upload as complete and transition to processing
   */
  const completeUpload = useCallback(() => {
    transitionToStage("processing", 90, "Processing document...");
  }, [transitionToStage]);

  /**
   * Complete processing with results
   */
  const completeProcessing = useCallback(
    (results: APIResponse) => {
      actions.setResults(results);
      // The context will automatically transition to "complete" stage
    },
    [actions]
  );

  /**
   * Handle processing error
   */
  const handleError = useCallback(
    (error: ErrorState) => {
      actions.setError(error);
      // The context will automatically transition to "error" stage
    },
    [actions]
  );

  /**
   * Reset processing state to idle
   */
  const resetToIdle = useCallback(() => {
    transitionToStage("idle", 0);
    actions.clearError();
  }, [transitionToStage, actions]);

  /**
   * Check if processing can be started
   */
  const canStartProcessing = useCallback(() => {
    return (
      state.uploadedFile !== null &&
      state.processingStatus.stage === "idle" &&
      state.error === null
    );
  }, [state.uploadedFile, state.processingStatus.stage, state.error]);

  /**
   * Check if processing can be retried
   */
  const canRetry = useCallback(() => {
    return (
      state.error !== null &&
      state.error.recoverable &&
      state.processingStatus.stage === "error"
    );
  }, [state.error, state.processingStatus.stage]);

  /**
   * Get processing stage information
   */
  const getStageInfo = useCallback(() => {
    const { stage, progress, message } = state.processingStatus;

    return {
      stage,
      progress: progress ?? 0,
      message: message ?? getDefaultMessageForStage(stage),
      isActive: stage !== "idle" && stage !== "complete" && stage !== "error",
      isComplete: stage === "complete",
      hasError: stage === "error",
      canCancel: stage === "uploading" || stage === "processing",
    };
  }, [state.processingStatus]);

  /**
   * Cancel processing (if possible)
   */
  const cancelProcessing = useCallback(() => {
    const { stage } = state.processingStatus;

    if (stage === "uploading" || stage === "processing") {
      resetToIdle();
    }
  }, [state.processingStatus, resetToIdle]);

  // Effect to handle automatic state transitions
  useEffect(() => {
    const { stage } = state.processingStatus;

    // Auto-transition from uploading to processing when progress reaches 100%
    if (
      stage === "uploading" &&
      state.processingStatus.progress === 100 &&
      !state.results &&
      !state.error
    ) {
      // Small delay to show 100% upload progress
      const timer = setTimeout(() => {
        completeUpload();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [state.processingStatus, state.results, state.error, completeUpload]);

  return {
    // Current state
    processingStatus: state.processingStatus,
    stageInfo: getStageInfo(),

    // State checks
    canStartProcessing: canStartProcessing(),
    canRetry: canRetry(),

    // Actions
    transitionToStage,
    updateProgress,
    startProcessing,
    completeUpload,
    completeProcessing,
    handleError,
    resetToIdle,
    cancelProcessing,
  };
};

/**
 * Get default message for a processing stage
 */
function getDefaultMessageForStage(stage: ProcessingStage): string {
  switch (stage) {
    case "idle":
      return "Ready to process";
    case "uploading":
      return "Uploading file...";
    case "processing":
      return "Processing document...";
    case "complete":
      return "Processing completed successfully";
    case "error":
      return "An error occurred";
    default:
      return "";
  }
}

/**
 * Get progress percentage for a stage
 */
export function getProgressForStage(stage: ProcessingStage): number {
  switch (stage) {
    case "idle":
      return 0;
    case "uploading":
      return 50; // Will be updated by actual upload progress
    case "processing":
      return 90;
    case "complete":
      return 100;
    case "error":
      return 0;
    default:
      return 0;
  }
}

/**
 * Check if a stage transition is valid
 */
export function isValidTransition(
  fromStage: ProcessingStage,
  toStage: ProcessingStage
): boolean {
  const validTransitions: Record<ProcessingStage, ProcessingStage[]> = {
    idle: ["uploading"],
    uploading: ["processing", "error", "idle"],
    processing: ["complete", "error", "idle"],
    complete: ["idle"],
    error: ["idle", "uploading"],
  };

  return validTransitions[fromStage]?.includes(toStage) ?? false;
}
