/**
 * Results Panel Component
 * Displays processed bank statement data with account information and confidence indicators
 */

import React, { useState, useEffect } from "react";
import {
  ResultsPanelProps,
  UserEntity,
  Warning,
  AccountInfo,
  Transaction,
  ConfidenceIndicators,
  DateFormat,
} from "../types";
import {
  maskAccountNumber,
  formatCurrency,
  formatDate,
  formatStatementPeriod,
  formatConfidence,
  getConfidenceLevel,
} from "../utils/data-formatting";
import { TransactionTable } from "./TransactionTable";
import { AccountTabList } from "./AccountTabList";

/**
 * Results Panel component for displaying processed bank statement data
 */
export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  isVisible,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [dateFormat] = useState<DateFormat>("DD/MM/YYYY");

  // Debug logging
  console.log("📊 ResultsPanel props:", {
    isVisible,
    hasResults: !!results,
    results: results,
    usersCount: results?.users?.length || 0,
  });

  // Set active tab if not set and we have users - MUST be called before any early returns
  useEffect(() => {
    if (results && results.users && results.users.length > 0 && !activeTabId) {
      console.log(
        "🎯 Setting active tab to first user:",
        results.users[0].userId
      );
      setActiveTabId(results.users[0].userId);
    }
  }, [results, activeTabId]);

  // Don't render if not visible
  if (!isVisible) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-lg">
        <div className="text-center text-gray-600 p-8">
          <p className="text-base leading-relaxed m-0">
            Upload and process a PDF bank statement to see results here.
          </p>
        </div>
      </div>
    );
  }

  // Don't render if no results or no users
  if (!results || !results.users || results.users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-lg">
        <div className="text-center text-gray-600 p-8">
          <p className="text-base leading-relaxed m-0">
            No results available. Please try uploading a valid PDF bank
            statement.
          </p>
        </div>
      </div>
    );
  }

  // Get warnings for a specific user
  const getWarningsForUser = (userId: string): Warning[] => {
    const user = results.users.find((u) => u.userId === userId);
    if (!user) return [];

    return (results.warnings || []).filter((warning) =>
      user.pages.includes(warning.pageNumber || 0)
    );
  };

  // Transform UserEntity to AccountInfo - use real backend data if available
  const transformToAccountInfo = (user: UserEntity): AccountInfo => {
    // Use real backend data if available, otherwise fall back to mock data
    if (user.accountInfo) {
      // Mask the account number if it's not already masked
      const accountNumber = user.accountInfo.maskedAccountNumber;
      const maskedNumber =
        accountNumber && accountNumber.includes("*")
          ? accountNumber
          : maskAccountNumber(accountNumber || "");

      return {
        ...user.accountInfo,
        maskedAccountNumber: maskedNumber,
      };
    }

    // Fallback to constructing from user data
    return {
      bankName: user.bank.value || "Unknown Bank",
      accountHolder: user.name.value || "Unknown Account Holder",
      maskedAccountNumber: maskAccountNumber(user.accountNumber.value || ""),
      accountType: "Checking", // This would come from API in real implementation
      currency: "USD", // This would come from API in real implementation
      statementPeriod: {
        startDate: "2024-01-01", // This would come from API
        endDate: "2024-01-31", // This would come from API
      },
      balances: {
        opening: 1000.0, // This would come from API
        closing: 1500.0, // This would come from API
      },
    };
  };

  // Calculate confidence indicators
  const calculateConfidence = (user: UserEntity): ConfidenceIndicators => {
    const fields = {
      name: user.name.confidence,
      bank: user.bank.confidence,
      accountNumber: user.accountNumber.confidence,
      address: user.address.confidence,
    };

    const overall =
      Object.values(fields).reduce((sum, conf) => sum + conf, 0) /
      Object.values(fields).length;

    return {
      overall,
      fields,
    };
  };

  // Mock transaction data - in real implementation this would come from API
  const getMockTransactions = (): Transaction[] => [
    {
      date: "2024-01-01",
      description: "Opening Balance",
      creditAmount: 1000.0,
      runningBalance: 1000.0,
      confidence: 0.95,
    },
    {
      date: "2024-01-05",
      description: "Direct Deposit - Salary",
      creditAmount: 2500.0,
      runningBalance: 3500.0,
      confidence: 0.98,
    },
    {
      date: "2024-01-10",
      description: "ATM Withdrawal",
      debitAmount: 100.0,
      runningBalance: 3400.0,
      confidence: 0.92,
    },
    {
      date: "2024-01-15",
      description: "Online Purchase - Amazon",
      debitAmount: 89.99,
      runningBalance: 3310.01,
      confidence: 0.88,
    },
    {
      date: "2024-01-20",
      description: "Utility Bill Payment",
      debitAmount: 150.0,
      runningBalance: 3160.01,
      confidence: 0.94,
    },
  ];

  const activeUser = results.users.find((user) => user.userId === activeTabId);
  const hasMultipleAccounts = results.users.length > 1;

  // Handle tab selection with smooth transitions
  const handleTabSelect = (userId: string) => {
    setActiveTabId(userId);
  };

  console.log("🎯 Rendering ResultsPanel with activeUser:", activeUser?.userId);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900 m-0">
          Bank Statement Results
        </h2>
        {(results.warnings?.length || 0) > 0 && (
          <div className="flex items-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-900 rounded text-sm font-medium">
              ⚠️ {results.warnings?.length || 0} warning(s)
            </span>
          </div>
        )}
      </div>

      {/* Conditional rendering: Show tabs only for multiple accounts */}
      {hasMultipleAccounts && (
        <AccountTabList
          accounts={results.users}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          warnings={results.warnings || []}
        />
      )}

      {/* Display active account content */}
      {activeUser && (
        <div
          className={`flex-1 overflow-y-auto p-6 ${
            hasMultipleAccounts ? "" : "pt-4"
          }`}
          role="tabpanel"
          id={`account-panel-${activeUser.userId}`}
          aria-labelledby={
            hasMultipleAccounts ? `account-tab-${activeUser.userId}` : undefined
          }
        >
          <AccountDisplay
            user={activeUser}
            warnings={getWarningsForUser(activeUser.userId)}
            dateFormat={dateFormat}
            showAccountTitle={!hasMultipleAccounts}
            transformToAccountInfo={transformToAccountInfo}
            calculateConfidence={calculateConfidence}
            getMockTransactions={getMockTransactions}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Account Display component for individual account information
 */
interface AccountDisplayProps {
  user: UserEntity;
  warnings: Warning[];
  dateFormat: DateFormat;
  showAccountTitle?: boolean;
  transformToAccountInfo: (user: UserEntity) => AccountInfo;
  calculateConfidence: (user: UserEntity) => ConfidenceIndicators;
  getMockTransactions: () => Transaction[];
}

const AccountDisplay: React.FC<AccountDisplayProps> = ({
  user,
  warnings,
  dateFormat,
  showAccountTitle = true,
  transformToAccountInfo,
  calculateConfidence,
  getMockTransactions,
}) => {
  const accountInfo = transformToAccountInfo(user);
  const confidence = calculateConfidence(user);

  // Use real transactions from user data, fallback to mock if none available
  const transactions =
    user.transactions && user.transactions.length > 0
      ? user.transactions
      : getMockTransactions();

  console.log("🔍 AccountDisplay transactions:", {
    hasUserTransactions: !!(user.transactions && user.transactions.length > 0),
    transactionCount: transactions.length,
    firstTransaction: transactions[0],
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Account Information Section */}
      <div>
        {showAccountTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-0">
            Account Information
          </h3>
        )}
        {!showAccountTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-0">
            {accountInfo.bankName} {accountInfo.maskedAccountNumber}
          </h3>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Bank Name
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">{accountInfo.bankName}</span>
              <ConfidenceIndicator confidence={user.bank.confidence} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Account Holder
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">{accountInfo.accountHolder}</span>
              <ConfidenceIndicator confidence={user.name.confidence} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Account Number
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">
                {accountInfo.maskedAccountNumber}
              </span>
              <ConfidenceIndicator confidence={user.accountNumber.confidence} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Account Type
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">{accountInfo.accountType}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Currency
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">{accountInfo.currency}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Statement Period
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">
                {formatStatementPeriod(
                  accountInfo.statementPeriod.startDate,
                  accountInfo.statementPeriod.endDate,
                  dateFormat
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Opening Balance
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">
                {formatCurrency(
                  accountInfo.balances.opening,
                  accountInfo.currency
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">
              Closing Balance
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">
                {formatCurrency(
                  accountInfo.balances.closing,
                  accountInfo.currency
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Confidence */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <label className="text-sm font-medium text-gray-500">
            Overall Data Quality
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold px-3 py-1 rounded ${
                getConfidenceLevel(confidence.overall) === "high"
                  ? "bg-green-100 text-green-800"
                  : getConfidenceLevel(confidence.overall) === "medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {formatConfidence(confidence.overall)}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {getConfidenceLevel(confidence.overall).toUpperCase()} CONFIDENCE
            </span>
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-400 rounded-md">
          <h4 className="text-base font-semibold text-yellow-900 mb-3 mt-0">
            Processing Warnings
          </h4>
          <div className="flex flex-col gap-3">
            {warnings.map((warning, index) => (
              <div key={index} className="flex gap-3 items-start">
                <span className="text-base mt-0.5">⚠️</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-yellow-900">
                    {warning.type}
                  </span>
                  {warning.pageNumber && (
                    <span className="text-xs text-gray-500 ml-2">
                      Page {warning.pageNumber}
                    </span>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed mt-1 mb-0">
                    {warning.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div>
        <TransactionTable
          transactions={transactions}
          currency={accountInfo.currency}
          dateFormat={dateFormat}
        />
      </div>
    </div>
  );
};

/**
 * Confidence Indicator component
 */
interface ConfidenceIndicatorProps {
  confidence: number;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
}) => {
  const level = getConfidenceLevel(confidence);
  const percentage = formatConfidence(confidence);

  const colorClasses = {
    high: "text-green-800",
    medium: "text-yellow-800",
    low: "text-red-800",
  };

  const dotClasses = {
    high: "bg-green-500",
    medium: "bg-yellow-500",
    low: "bg-red-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs`}
      title={`Confidence: ${percentage}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[level]}`}></span>
      <span className={`font-medium ${colorClasses[level]}`}>{percentage}</span>
    </span>
  );
};

// Helper function to transform UserEntity to AccountInfo (would be moved to utils in real implementation)
function transformToAccountInfo(user: UserEntity): AccountInfo {
  return {
    bankName: user.bank.value || "Unknown Bank",
    accountHolder: user.name.value || "Unknown Account Holder",
    maskedAccountNumber: maskAccountNumber(user.accountNumber.value || ""),
    accountType: "Checking", // This would come from API in real implementation
    currency: "USD", // This would come from API in real implementation
    statementPeriod: {
      startDate: "2024-01-01", // This would come from API
      endDate: "2024-01-31", // This would come from API
    },
    balances: {
      opening: 1000.0, // This would come from API
      closing: 1500.0, // This would come from API
    },
  };
}

// Helper function to calculate confidence indicators
function calculateConfidence(user: UserEntity): ConfidenceIndicators {
  const fields = {
    name: user.name.confidence,
    bank: user.bank.confidence,
    accountNumber: user.accountNumber.confidence,
    address: user.address.confidence,
  };

  const overall =
    Object.values(fields).reduce((sum, conf) => sum + conf, 0) /
    Object.values(fields).length;

  return {
    overall,
    fields,
  };
}
