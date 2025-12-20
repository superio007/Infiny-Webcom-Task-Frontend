/**
 * Confidence Indicator Component
 * Displays confidence scores for uncertain data extraction
 */

import React from "react";
import { ConfidenceIndicators, FieldResult } from "../types";

/**
 * Props for ConfidenceIndicator component
 */
interface ConfidenceIndicatorProps {
  confidence: number;
  label?: string;
  size?: "small" | "medium" | "large";
  showPercentage?: boolean;
  className?: string;
}

/**
 * Confidence Indicator Component
 * Shows visual confidence score with color coding
 */
export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  label,
  size = "medium",
  showPercentage = true,
  className = "",
}) => {
  const getConfidenceLevel = (score: number): "high" | "medium" | "low" => {
    if (score >= 0.8) return "high";
    if (score >= 0.5) return "medium";
    return "low";
  };

  const getConfidenceIcon = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "✅";
      case "medium":
        return "⚠️";
      case "low":
        return "❌";
    }
  };

  const getConfidenceText = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "High Confidence";
      case "medium":
        return "Medium Confidence";
      case "low":
        return "Low Confidence";
    }
  };

  const level = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
        level === "high"
          ? "bg-green-50 text-green-800 border border-green-200"
          : level === "medium"
          ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
          : "bg-red-50 text-red-800 border border-red-200"
      } ${
        size === "small"
          ? "px-1.5 py-0.5 text-xs gap-1"
          : size === "large"
          ? "px-3 py-1.5 text-sm gap-2"
          : "px-2 py-1 text-xs gap-1.5"
      } ${className}`}
      title={`${getConfidenceText(level)}: ${percentage}%`}
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {getConfidenceIcon(level)}
      </span>

      {label && <span className="font-semibold">{label}</span>}

      <div
        className={`bg-black bg-opacity-10 rounded-sm overflow-hidden ${
          size === "small"
            ? "w-[30px] h-[3px]"
            : size === "large"
            ? "w-[60px] h-[6px]"
            : "w-[40px] h-1"
        }`}
      >
        <div
          className={`h-full rounded-sm transition-all duration-300 ${
            level === "high"
              ? "bg-green-600"
              : level === "medium"
              ? "bg-yellow-600"
              : "bg-red-600"
          }`}
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>

      {showPercentage && (
        <span className="font-semibold min-w-[32px] text-right">
          {percentage}%
        </span>
      )}

      <span className="sr-only">
        {getConfidenceText(level)}: {percentage}%
      </span>
    </div>
  );
};

/**
 * Props for FieldConfidenceIndicator component
 */
interface FieldConfidenceIndicatorProps {
  field: FieldResult;
  fieldName: string;
  className?: string;
}

/**
 * Field Confidence Indicator Component
 * Shows confidence for individual field results
 */
export const FieldConfidenceIndicator: React.FC<
  FieldConfidenceIndicatorProps
> = ({ field, fieldName, className = "" }) => {
  if (!field || field.confidence === undefined) {
    return null;
  }

  const shouldShowWarning = field.confidence < 0.7;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm">{field.value || "Not detected"}</span>

        {shouldShowWarning && (
          <ConfidenceIndicator
            confidence={field.confidence}
            size="small"
            showPercentage={false}
          />
        )}
      </div>

      {shouldShowWarning && (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded text-xs text-yellow-800">
          <span className="text-xs flex-shrink-0" aria-hidden="true">
            ⚠️
          </span>
          <span className="leading-tight">
            Low confidence ({Math.round(field.confidence * 100)}%) - please
            verify
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Props for OverallConfidenceIndicator component
 */
interface OverallConfidenceIndicatorProps {
  indicators: ConfidenceIndicators;
  className?: string;
  showDetails?: boolean;
}

/**
 * Overall Confidence Indicator Component
 * Shows overall confidence with field breakdown
 */
export const OverallConfidenceIndicator: React.FC<
  OverallConfidenceIndicatorProps
> = ({ indicators, className = "", showDetails = false }) => {
  const overallLevel =
    indicators.overall >= 0.8
      ? "high"
      : indicators.overall >= 0.5
      ? "medium"
      : "low";

  const lowConfidenceFields = Object.entries(indicators.fields)
    .filter(([_, confidence]) => confidence < 0.7)
    .sort(([_, a], [__, b]) => a - b);

  return (
    <div
      className={`rounded-lg p-4 bg-gray-50 border border-gray-200 my-3 ${className}`}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-base font-semibold text-gray-900 m-0">
          Data Quality Assessment
        </h4>
        <ConfidenceIndicator
          confidence={indicators.overall}
          label="Overall"
          size="large"
        />
      </div>

      {showDetails && lowConfidenceFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-500 mb-2 mt-0">
            Fields requiring verification:
          </h5>
          <div className="flex flex-col gap-2">
            {lowConfidenceFields.map(([fieldName, confidence]) => (
              <div
                key={fieldName}
                className="flex justify-between items-center px-2 py-1.5 bg-white rounded border border-gray-200"
              >
                <span className="text-sm text-gray-900">
                  {fieldName
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </span>
                <ConfidenceIndicator confidence={confidence} size="small" />
              </div>
            ))}
          </div>
        </div>
      )}

      {lowConfidenceFields.length === 0 && showDetails && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md mt-3">
          <span className="text-base flex-shrink-0" aria-hidden="true">
            ✅
          </span>
          <span className="text-sm text-green-800">
            All fields extracted with high confidence
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Props for ConfidenceBadge component
 */
interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

/**
 * Confidence Badge Component
 * Compact confidence indicator for inline use
 */
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  className = "",
}) => {
  const level =
    confidence >= 0.8 ? "high" : confidence >= 0.5 ? "medium" : "low";

  const percentage = Math.round(confidence * 100);

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold leading-tight ${
        level === "high"
          ? "bg-green-50 text-green-800"
          : level === "medium"
          ? "bg-yellow-50 text-yellow-800"
          : "bg-red-50 text-red-800"
      } ${className}`}
      title={`Confidence: ${percentage}%`}
    >
      {percentage}%
    </span>
  );
};

export default ConfidenceIndicator;
