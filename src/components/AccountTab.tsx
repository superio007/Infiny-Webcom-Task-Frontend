/**
 * Account Tab Component
 * Individual tab component for navigating between multiple bank accounts
 */

import React from "react";
import { AccountTabProps, ConfidenceIndicators } from "../types";
import {
  maskAccountNumber,
  formatConfidence,
  getConfidenceLevel,
} from "../utils/data-formatting";

/**
 * Account Tab component for individual account navigation
 */
export const AccountTab: React.FC<AccountTabProps> = ({
  account,
  isActive,
  onSelect,
  warnings,
}) => {
  // Calculate confidence indicators for the account
  const calculateConfidence = (): ConfidenceIndicators => {
    const fields = {
      name: account.name.confidence,
      bank: account.bank.confidence,
      accountNumber: account.accountNumber.confidence,
      address: account.address.confidence,
    };

    const overall =
      Object.values(fields).reduce((sum, conf) => sum + conf, 0) /
      Object.values(fields).length;

    return {
      overall,
      fields,
    };
  };

  const confidence = calculateConfidence();
  const confidenceLevel = getConfidenceLevel(confidence.overall);
  const confidencePercentage = formatConfidence(confidence.overall);

  // Create tab label with bank name and masked account number
  const bankName = account.bank.value || "Unknown Bank";
  const maskedAccountNumber = maskAccountNumber(
    account.accountNumber.value || ""
  );
  const tabLabel = `${bankName} ${maskedAccountNumber}`;

  // Create accessible description
  const accessibleDescription = `${tabLabel}${
    warnings.length > 0 ? `, ${warnings.length} warnings` : ""
  }, ${confidenceLevel} confidence ${confidencePercentage}`;

  // Handle tab selection
  const handleClick = () => {
    onSelect();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <button
      className={`flex flex-col items-center gap-1 p-3 border-0 bg-transparent cursor-pointer transition-all duration-200 min-w-[120px] min-h-[48px] relative font-inherit text-center hover:bg-gray-100 focus:outline-2 focus:outline-blue-500 focus:-outline-offset-2 focus:z-[2] ${
        isActive ? "bg-white border-b-2 border-blue-500" : ""
      } ${
        warnings.length > 0
          ? "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-yellow-500 before:rounded-t"
          : ""
      } md:flex-row md:justify-between md:items-center md:text-left md:w-full md:min-h-[56px] md:px-6 md:py-3 ${
        isActive ? "md:border-b-0 md:border-l-[3px] md:border-blue-500" : ""
      } ${
        warnings.length > 0
          ? "md:before:top-0 md:before:left-0 md:before:bottom-0 md:before:right-auto md:before:w-[3px] md:before:h-auto md:before:rounded-r md:before:rounded-l-0"
          : ""
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="tab"
      aria-selected={isActive}
      aria-controls={`account-panel-${account.userId}`}
      id={`account-tab-${account.userId}`}
      tabIndex={isActive ? 0 : -1}
      aria-label={accessibleDescription}
      title={accessibleDescription}
    >
      <span className="flex flex-col gap-0.5 items-center min-w-0 md:flex-col md:items-start md:flex-1">
        <span
          className={`text-sm font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] md:max-w-none md:text-left ${
            isActive ? "text-blue-500" : "text-gray-700"
          }`}
        >
          {bankName}
        </span>
        <span
          className={`text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] md:max-w-none md:text-left ${
            isActive ? "text-blue-500" : "text-gray-500"
          }`}
        >
          {maskedAccountNumber}
        </span>
      </span>

      <div className="flex items-center gap-1.5 mt-1 md:mt-0 md:gap-2">
        {/* Warning badge for accounts with processing issues */}
        {warnings.length > 0 && (
          <span
            className="text-base leading-none opacity-80"
            aria-hidden="true"
            role="img"
          >
            ⚠️
          </span>
        )}

        {/* Confidence indicator */}
        <span className="flex items-center gap-1" aria-hidden="true">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              confidenceLevel === "high"
                ? "bg-green-500"
                : confidenceLevel === "medium"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          ></span>
        </span>
      </div>

      {/* Screen reader only content */}
      <span className="sr-only">
        {isActive ? "Currently selected account" : "Select this account"}
      </span>
    </button>
  );
};
