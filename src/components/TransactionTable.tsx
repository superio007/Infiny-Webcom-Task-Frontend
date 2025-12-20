/**
 * Transaction Table Component
 * Responsive table for displaying bank statement transaction history
 */

import React, { useState, useMemo } from "react";
import { TransactionTableProps, Transaction, DateFormat } from "../types";
import {
  formatCurrency,
  formatDate,
  formatConfidence,
  getConfidenceLevel,
} from "../utils/data-formatting";

/**
 * Sort direction for table columns
 */
type SortDirection = "asc" | "desc" | null;

/**
 * Sortable column keys
 */
type SortableColumn =
  | "date"
  | "description"
  | "debitAmount"
  | "creditAmount"
  | "runningBalance";

/**
 * Transaction Table component with responsive design and sorting
 */
export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  currency,
  dateFormat,
}) => {
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check for mobile view on mount and resize
  React.useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Sort transactions based on current sort settings
  const sortedTransactions = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return transactions;
    }

    return [...transactions].sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];

      // Handle different data types
      if (sortColumn === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === "number") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [transactions, sortColumn, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get sort indicator for column headers
  const getSortIndicator = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <span className="ml-2 text-xs opacity-60">↕️</span>;
    }
    if (sortDirection === "asc") {
      return <span className="ml-2 text-xs opacity-100 text-blue-500">↑</span>;
    }
    if (sortDirection === "desc") {
      return <span className="ml-2 text-xs opacity-100 text-blue-500">↓</span>;
    }
    return null;
  };

  // Calculate totals
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        acc.totalDebits += transaction.debitAmount || 0;
        acc.totalCredits += transaction.creditAmount || 0;
        return acc;
      },
      { totalDebits: 0, totalCredits: 0 }
    );
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-md text-gray-500">
        <p className="text-sm m-0">No transactions found in this statement.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start gap-4 mb-2 flex-col md:flex-row md:items-center">
        <h3 className="text-lg font-semibold text-gray-900 m-0">
          Transaction History
        </h3>
        <div className="flex gap-4 flex-wrap text-sm text-gray-500">
          <span>
            <strong className="text-gray-900">{transactions.length}</strong>{" "}
            transactions
          </span>
          <span>
            <strong className="text-gray-900">
              {formatCurrency(totals.totalCredits, currency)}
            </strong>{" "}
            total credits
          </span>
          <span>
            <strong className="text-gray-900">
              {formatCurrency(totals.totalDebits, currency)}
            </strong>{" "}
            total debits
          </span>
        </div>
      </div>

      {isMobileView ? (
        <MobileTransactionList
          transactions={sortedTransactions}
          currency={currency}
          dateFormat={dateFormat}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  className="p-3 text-left bg-gray-50 font-semibold text-gray-700 cursor-pointer select-none transition-colors hover:bg-gray-100 sticky top-0 z-10"
                  onClick={() => handleSort("date")}
                >
                  Date
                  {getSortIndicator("date")}
                </th>
                <th
                  className="p-3 text-left bg-gray-50 font-semibold text-gray-700 cursor-pointer select-none transition-colors hover:bg-gray-100 sticky top-0 z-10 min-w-[200px] max-w-[300px]"
                  onClick={() => handleSort("description")}
                >
                  Description
                  {getSortIndicator("description")}
                </th>
                <th
                  className="p-3 text-right bg-gray-50 font-semibold text-gray-700 cursor-pointer select-none transition-colors hover:bg-gray-100 sticky top-0 z-10 w-[120px]"
                  onClick={() => handleSort("debitAmount")}
                >
                  Debit
                  {getSortIndicator("debitAmount")}
                </th>
                <th
                  className="p-3 text-right bg-gray-50 font-semibold text-gray-700 cursor-pointer select-none transition-colors hover:bg-gray-100 sticky top-0 z-10 w-[120px]"
                  onClick={() => handleSort("creditAmount")}
                >
                  Credit
                  {getSortIndicator("creditAmount")}
                </th>
                <th
                  className="p-3 text-right bg-gray-50 font-semibold text-gray-700 cursor-pointer select-none transition-colors hover:bg-gray-100 sticky top-0 z-10 w-[120px]"
                  onClick={() => handleSort("runningBalance")}
                >
                  Balance
                  {getSortIndicator("runningBalance")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction, index) => (
                <TransactionRow
                  key={index}
                  transaction={transaction}
                  currency={currency}
                  dateFormat={dateFormat}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                <td colSpan={2} className="p-3 text-gray-900">
                  <strong>Totals</strong>
                </td>
                <td className="p-3 text-right text-gray-900">
                  <strong>
                    {formatCurrency(totals.totalDebits, currency)}
                  </strong>
                </td>
                <td className="p-3 text-right text-gray-900">
                  <strong>
                    {formatCurrency(totals.totalCredits, currency)}
                  </strong>
                </td>
                <td className="p-3 text-right text-gray-900">
                  <strong>
                    {formatCurrency(
                      sortedTransactions[sortedTransactions.length - 1]
                        ?.runningBalance || 0,
                      currency
                    )}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

/**
 * Individual transaction row component
 */
interface TransactionRowProps {
  transaction: Transaction;
  currency: string;
  dateFormat: DateFormat;
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  currency,
  dateFormat,
}) => {
  const hasLowConfidence =
    transaction.confidence && transaction.confidence < 0.7;

  return (
    <tr
      className={`transition-colors hover:bg-gray-50 border-b border-gray-100 ${
        hasLowConfidence ? "bg-yellow-100 hover:bg-yellow-200" : ""
      }`}
    >
      <td className="p-3 w-[120px]">
        <span className="block font-medium">
          {formatDate(transaction.date, dateFormat)}
        </span>
        {transaction.confidence && (
          <ConfidenceIndicator confidence={transaction.confidence} />
        )}
      </td>
      <td className="p-3 min-w-[200px] max-w-[300px]">
        <span
          className="block overflow-hidden text-ellipsis whitespace-nowrap"
          title={transaction.description}
        >
          {transaction.description}
        </span>
      </td>
      <td className="p-3 text-right w-[120px]">
        {transaction.debitAmount ? (
          <span className="font-semibold text-red-600 tabular-nums">
            {formatCurrency(transaction.debitAmount, currency)}
          </span>
        ) : (
          <span className="text-gray-400 italic">—</span>
        )}
      </td>
      <td className="p-3 text-right w-[120px]">
        {transaction.creditAmount ? (
          <span className="font-semibold text-green-600 tabular-nums">
            {formatCurrency(transaction.creditAmount, currency)}
          </span>
        ) : (
          <span className="text-gray-400 italic">—</span>
        )}
      </td>
      <td className="p-3 text-right w-[120px]">
        <span className="font-semibold text-gray-900 tabular-nums">
          {formatCurrency(transaction.runningBalance, currency)}
        </span>
      </td>
    </tr>
  );
};

/**
 * Mobile-friendly transaction list component
 */
interface MobileTransactionListProps {
  transactions: Transaction[];
  currency: string;
  dateFormat: DateFormat;
}

const MobileTransactionList: React.FC<MobileTransactionListProps> = ({
  transactions,
  currency,
  dateFormat,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {transactions.map((transaction, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-md p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              {formatDate(transaction.date, dateFormat)}
            </span>
            {transaction.confidence && (
              <ConfidenceIndicator confidence={transaction.confidence} />
            )}
          </div>

          <div className="text-sm text-gray-900 mb-3 leading-relaxed">
            {transaction.description}
          </div>

          <div className="flex flex-col gap-1">
            {transaction.debitAmount && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Debit:</span>
                <span className="font-semibold text-red-600 tabular-nums">
                  -{formatCurrency(transaction.debitAmount, currency)}
                </span>
              </div>
            )}

            {transaction.creditAmount && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Credit:</span>
                <span className="font-semibold text-green-600 tabular-nums">
                  +{formatCurrency(transaction.creditAmount, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2 mt-1">
              <span className="text-gray-500 font-medium">Balance:</span>
              <span className="font-semibold text-gray-900 text-base tabular-nums">
                {formatCurrency(transaction.runningBalance, currency)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Confidence indicator component for transactions
 */
interface ConfidenceIndicatorProps {
  confidence: number;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
}) => {
  const level = getConfidenceLevel(confidence);
  const percentage = formatConfidence(confidence);

  const dotClasses = {
    high: "bg-green-500",
    medium: "bg-yellow-500",
    low: "bg-red-500",
  };

  return (
    <span
      className="inline-flex items-center ml-2"
      title={`Data confidence: ${percentage}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[level]}`}></span>
    </span>
  );
};
