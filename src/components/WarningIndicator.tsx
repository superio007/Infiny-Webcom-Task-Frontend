/**
 * Warning Indicator Component
 * Displays processing warnings and partial success indicators
 */

import React from "react";
import { Warning } from "../types";

/**
 * Props for WarningIndicator component
 */
interface WarningIndicatorProps {
  warnings: Warning[];
  className?: string;
  showDetails?: boolean;
}

/**
 * Warning Indicator Component
 * Shows visual indicators for processing warnings
 */
export const WarningIndicator: React.FC<WarningIndicatorProps> = ({
  warnings,
  className = "",
  showDetails = true,
}) => {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  const getWarningIcon = (type: Warning["type"]) => {
    switch (type) {
      case "OCR_TIMEOUT":
        return "⏱️";
      case "OCR_UNREADABLE":
        return "👁️";
      case "LLM_SCHEMA_VIOLATION":
        return "📋";
      default:
        return "⚠️";
    }
  };

  const getWarningTitle = (type: Warning["type"]) => {
    switch (type) {
      case "OCR_TIMEOUT":
        return "Processing Timeout";
      case "OCR_UNREADABLE":
        return "Unreadable Content";
      case "LLM_SCHEMA_VIOLATION":
        return "Data Structure Issue";
      default:
        return "Warning";
    }
  };

  const getSeverityClass = (type: Warning["type"]) => {
    switch (type) {
      case "OCR_TIMEOUT":
        return "warning-indicator--medium";
      case "OCR_UNREADABLE":
        return "warning-indicator--high";
      case "LLM_SCHEMA_VIOLATION":
        return "warning-indicator--medium";
      default:
        return "warning-indicator--medium";
    }
  };

  // Group warnings by type
  const groupedWarnings = warnings.reduce((acc, warning) => {
    if (!acc[warning.type]) {
      acc[warning.type] = [];
    }
    acc[warning.type].push(warning);
    return acc;
  }, {} as Record<Warning["type"], Warning[]>);

  return (
    <div
      className={`rounded-md p-3 bg-yellow-50 border border-yellow-200 text-yellow-900 my-2 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base flex-shrink-0" aria-hidden="true">
          ⚠️
        </span>
        <span className="font-semibold text-sm">
          {warnings.length === 1 ? "1 Warning" : `${warnings.length} Warnings`}
        </span>
      </div>

      {showDetails && (
        <div className="flex flex-col gap-2">
          {Object.entries(groupedWarnings).map(([type, typeWarnings]) => (
            <div
              key={type}
              className={`p-2 rounded border-l-[3px] ${
                getSeverityClass(type as Warning["type"]) ===
                "warning-indicator--high"
                  ? "bg-red-50 border-l-red-200 text-red-900"
                  : "bg-yellow-50 border-l-yellow-200 text-yellow-900"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm flex-shrink-0" aria-hidden="true">
                  {getWarningIcon(type as Warning["type"])}
                </span>
                <span className="font-medium text-xs">
                  {getWarningTitle(type as Warning["type"])}
                </span>
                {typeWarnings.length > 1 && (
                  <span className="text-xs opacity-70">
                    ({typeWarnings.length})
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 ml-5">
                {typeWarnings.map((warning, index) => (
                  <div key={index} className="text-xs leading-relaxed">
                    {warning.message}
                    {warning.pageNumber && (
                      <span className="italic opacity-70 ml-1">
                        (Page {warning.pageNumber})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Props for WarningBadge component
 */
interface WarningBadgeProps {
  count: number;
  severity?: "low" | "medium" | "high";
  className?: string;
  onClick?: () => void;
}

/**
 * Warning Badge Component
 * Compact warning indicator for tabs and other UI elements
 */
export const WarningBadge: React.FC<WarningBadgeProps> = ({
  count,
  severity = "medium",
  className = "",
  onClick,
}) => {
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${
        severity === "low"
          ? "bg-blue-50 text-blue-900"
          : severity === "high"
          ? "bg-red-50 text-red-900"
          : "bg-yellow-50 text-yellow-900"
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${count} warning${count > 1 ? "s" : ""}`}
    >
      <span className="text-[10px]" aria-hidden="true">
        ⚠️
      </span>
      <span className="leading-none">{count}</span>
    </span>
  );
};

/**
 * Props for PartialSuccessIndicator component
 */
interface PartialSuccessIndicatorProps {
  totalPages: number;
  successfulPages: number;
  warnings: Warning[];
  className?: string;
}

/**
 * Partial Success Indicator Component
 * Shows processing success rate with warnings
 */
export const PartialSuccessIndicator: React.FC<
  PartialSuccessIndicatorProps
> = ({ totalPages, successfulPages, warnings, className = "" }) => {
  const successRate = (successfulPages / totalPages) * 100;
  const hasWarnings = warnings.length > 0;

  const getStatusIcon = () => {
    if (successRate === 100 && !hasWarnings) {
      return "✅";
    } else if (successRate >= 80) {
      return "⚠️";
    } else {
      return "❌";
    }
  };

  const getStatusText = () => {
    if (successRate === 100 && !hasWarnings) {
      return "Complete Success";
    } else if (successRate >= 80) {
      return "Partial Success";
    } else {
      return "Limited Success";
    }
  };

  const getStatusClass = () => {
    if (successRate === 100 && !hasWarnings) {
      return "partial-success--complete";
    } else if (successRate >= 80) {
      return "partial-success--partial";
    } else {
      return "partial-success--limited";
    }
  };

  return (
    <div
      className={`rounded-lg p-4 my-3 border ${
        successRate === 100 && !hasWarnings
          ? "bg-green-50 border-green-200 text-green-800"
          : successRate >= 80
          ? "bg-yellow-50 border-yellow-200 text-yellow-900"
          : "bg-red-50 border-red-200 text-red-900"
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg flex-shrink-0" aria-hidden="true">
          {getStatusIcon()}
        </span>
        <span className="font-semibold text-base">{getStatusText()}</span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="w-full h-2 bg-black bg-opacity-10 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-300 ${
                successRate === 100 && !hasWarnings
                  ? "bg-green-600"
                  : successRate >= 80
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${successRate}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-xs opacity-80">
            {successfulPages} of {totalPages} pages processed successfully
          </span>
        </div>

        {hasWarnings && (
          <div className="mt-1">
            <WarningIndicator warnings={warnings} showDetails={false} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WarningIndicator;
