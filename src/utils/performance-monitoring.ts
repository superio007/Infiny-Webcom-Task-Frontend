/**
 * Performance Monitoring Utilities
 * Handles performance tracking and timeout management for large file operations
 */

/**
 * Performance metrics for file operations
 */
export interface PerformanceMetrics {
  fileSize: number;
  uploadStartTime: number;
  uploadEndTime?: number;
  processingStartTime?: number;
  processingEndTime?: number;
  totalDuration?: number;
  uploadDuration?: number;
  processingDuration?: number;
}

/**
 * Performance monitoring class for tracking file operations
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(fileSize: number) {
    this.metrics = {
      fileSize,
      uploadStartTime: Date.now(),
    };
  }

  /**
   * Mark upload completion
   */
  markUploadComplete(): void {
    this.metrics.uploadEndTime = Date.now();
    this.metrics.uploadDuration =
      this.metrics.uploadEndTime - this.metrics.uploadStartTime;
  }

  /**
   * Mark processing start
   */
  markProcessingStart(): void {
    this.metrics.processingStartTime = Date.now();
  }

  /**
   * Mark processing completion
   */
  markProcessingComplete(): void {
    if (this.metrics.processingStartTime) {
      this.metrics.processingEndTime = Date.now();
      this.metrics.processingDuration =
        this.metrics.processingEndTime - this.metrics.processingStartTime;
    }

    this.metrics.totalDuration = Date.now() - this.metrics.uploadStartTime;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if file is considered large (>10MB)
   */
  isLargeFile(): boolean {
    return this.metrics.fileSize > 10 * 1024 * 1024;
  }

  /**
   * Get expected processing time based on file size
   */
  getExpectedProcessingTime(): number {
    const sizeInMB = this.metrics.fileSize / (1024 * 1024);

    // Base time + additional time per MB
    const baseTime = 5000; // 5 seconds base
    const timePerMB = 1000; // 1 second per MB

    return baseTime + sizeInMB * timePerMB;
  }

  /**
   * Set a timeout with callback
   */
  setTimeout(name: string, callback: () => void, delay: number): void {
    // Clear existing timeout if any
    this.clearTimeout(name);

    const timeoutId = setTimeout(() => {
      callback();
      this.timeouts.delete(name);
    }, delay);

    this.timeouts.set(name, timeoutId);
  }

  /**
   * Clear a specific timeout
   */
  clearTimeout(name: string): void {
    const timeoutId = this.timeouts.get(name);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(name);
    }
  }

  /**
   * Clear all timeouts
   */
  clearAllTimeouts(): void {
    this.timeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.timeouts.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): string {
    const sizeInMB =
      Math.round((this.metrics.fileSize / (1024 * 1024)) * 10) / 10;
    const totalTime = this.metrics.totalDuration
      ? Math.round(this.metrics.totalDuration / 1000)
      : 0;

    return `File: ${sizeInMB}MB, Total time: ${totalTime}s`;
  }
}

/**
 * Utility functions for performance monitoring
 */

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
}

/**
 * Format duration for display
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.round(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Check if operation is taking longer than expected
 */
export function isOperationSlow(
  startTime: number,
  expectedDuration: number
): boolean {
  const elapsed = Date.now() - startTime;
  return elapsed > expectedDuration * 1.5; // 50% longer than expected
}

/**
 * Get appropriate timeout message based on file size and elapsed time
 */
export function getTimeoutMessage(
  fileSize: number,
  elapsedTime: number
): string {
  const sizeInMB = fileSize / (1024 * 1024);
  const elapsedSeconds = Math.round(elapsedTime / 1000);

  if (sizeInMB > 20) {
    return `Processing large file (${Math.round(
      sizeInMB
    )}MB)... This may take several minutes. Elapsed: ${elapsedSeconds}s`;
  } else if (sizeInMB > 10) {
    return `Processing may take a few moments for large documents. Elapsed: ${elapsedSeconds}s`;
  } else {
    return `Processing is taking longer than expected. Elapsed: ${elapsedSeconds}s`;
  }
}

/**
 * Create a performance-aware progress callback
 */
export function createProgressCallback(
  monitor: PerformanceMonitor,
  onProgress: (progress: number, message?: string) => void
): (progress: number) => void {
  let lastUpdateTime = Date.now();

  return (progress: number) => {
    const now = Date.now();
    const elapsed = now - monitor.getMetrics().uploadStartTime;

    // Throttle progress updates to avoid overwhelming the UI
    if (now - lastUpdateTime < 100 && progress < 100) {
      return; // Update at most every 100ms
    }

    lastUpdateTime = now;

    let message: string | undefined;

    if (monitor.isLargeFile()) {
      if (progress < 100) {
        message = `Uploading large file... ${progress}%`;
      } else {
        message = "Processing large document... This may take a few moments";
      }
    }

    onProgress(progress, message);
  };
}
