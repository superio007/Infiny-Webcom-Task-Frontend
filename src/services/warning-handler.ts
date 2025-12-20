/**
 * Warning Handler Service
 * Handles partial success scenarios with warnings from API responses
 */

import { Warning, APIResponse } from "../types";

/**
 * Warning severity levels
 */
export type WarningSeverity = "low" | "medium" | "high";

/**
 * Processed warning with additional metadata
 */
export interface ProcessedWarning extends Warning {
  severity: WarningSeverity;
  userMessage: string;
  affectedPages: number[];
}

/**
 * Warning summary for display
 */
export interface WarningSummary {
  totalWarnings: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
  };
  byType: {
    [key: string]: number;
  };
  hasWarnings: boolean;
  criticalWarnings: ProcessedWarning[];
}

/**
 * Process warnings from API response
 * @param response API response with warnings
 * @returns Processed warnings with metadata
 */
export function processWarnings(response: APIResponse): ProcessedWarning[] {
  if (!response.warnings || response.warnings.length === 0) {
    return [];
  }

  return response.warnings.map((warning) => ({
    ...warning,
    severity: getWarningSeverity(warning),
    userMessage: getWarningUserMessage(warning),
    affectedPages: warning.pageNumber ? [warning.pageNumber] : [],
  }));
}

/**
 * Get warning summary for display
 * @param warnings Processed warnings
 * @returns Warning summary
 */
export function getWarningSummary(
  warnings: ProcessedWarning[]
): WarningSummary {
  const summary: WarningSummary = {
    totalWarnings: warnings.length,
    bySeverity: {
      low: 0,
      medium: 0,
      high: 0,
    },
    byType: {},
    hasWarnings: warnings.length > 0,
    criticalWarnings: [],
  };

  warnings.forEach((warning) => {
    // Count by severity
    summary.bySeverity[warning.severity]++;

    // Count by type
    summary.byType[warning.type] = (summary.byType[warning.type] || 0) + 1;

    // Collect critical warnings
    if (warning.severity === "high") {
      summary.criticalWarnings.push(warning);
    }
  });

  return summary;
}

/**
 * Determine warning severity based on type
 * @param warning Warning object
 * @returns Severity level
 */
function getWarningSeverity(warning: Warning): WarningSeverity {
  switch (warning.type) {
    case "OCR_TIMEOUT":
      return "high"; // Critical - page not processed
    case "OCR_UNREADABLE":
      return "high"; // Critical - page not readable
    case "LLM_SCHEMA_VIOLATION":
      return "medium"; // Moderate - data may be incomplete
    default:
      return "low";
  }
}

/**
 * Get user-friendly message for warning
 * @param warning Warning object
 * @returns User-friendly message
 */
function getWarningUserMessage(warning: Warning): string {
  const pageInfo = warning.pageNumber ? ` on page ${warning.pageNumber}` : "";

  switch (warning.type) {
    case "OCR_TIMEOUT":
      return `Processing timed out${pageInfo}. Some data may be missing.`;
    case "OCR_UNREADABLE":
      return `Text could not be read${pageInfo}. The page may have poor quality or be an image.`;
    case "LLM_SCHEMA_VIOLATION":
      return `Data extraction had issues${pageInfo}. Some fields may be incomplete.`;
    default:
      return warning.message || `Warning${pageInfo}`;
  }
}

/**
 * Check if warnings should prevent displaying results
 * @param warnings Processed warnings
 * @returns True if results should still be displayed
 */
export function shouldDisplayResults(warnings: ProcessedWarning[]): boolean {
  // Display results even with warnings, unless all pages failed
  const criticalWarnings = warnings.filter((w) => w.severity === "high");

  // If more than 50% of warnings are critical, consider not displaying
  // But for now, we always display partial results
  return true;
}

/**
 * Group warnings by page number
 * @param warnings Processed warnings
 * @returns Warnings grouped by page
 */
export function groupWarningsByPage(
  warnings: ProcessedWarning[]
): Map<number, ProcessedWarning[]> {
  const grouped = new Map<number, ProcessedWarning[]>();

  warnings.forEach((warning) => {
    if (warning.pageNumber) {
      const pageWarnings = grouped.get(warning.pageNumber) || [];
      pageWarnings.push(warning);
      grouped.set(warning.pageNumber, pageWarnings);
    }
  });

  return grouped;
}

/**
 * Get warning icon based on severity
 * @param severity Warning severity
 * @returns Icon name or emoji
 */
export function getWarningIcon(severity: WarningSeverity): string {
  switch (severity) {
    case "high":
      return "⚠️";
    case "medium":
      return "⚡";
    case "low":
      return "ℹ️";
    default:
      return "ℹ️";
  }
}

/**
 * Format warning for display
 * @param warning Processed warning
 * @returns Formatted warning string
 */
export function formatWarning(warning: ProcessedWarning): string {
  const icon = getWarningIcon(warning.severity);
  return `${icon} ${warning.userMessage}`;
}
