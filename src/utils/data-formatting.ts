/**
 * Data Formatting Utilities
 * Utilities for formatting account numbers, currency, and dates consistently
 */

import { DateFormat, CurrencyFormat, NumberFormat } from "../types";

/**
 * Default number formatting configuration
 */
const DEFAULT_NUMBER_FORMAT: NumberFormat = {
  decimals: 2,
  thousandsSeparator: ",",
  decimalSeparator: ".",
};

/**
 * Mask account number to show only last 4 digits
 * @param accountNumber Full account number
 * @returns Masked account number (e.g., "****1234")
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) {
    return "****";
  }

  // Remove any non-digit characters and get last 4 digits
  const digits = accountNumber.replace(/\D/g, "");
  const lastFour = digits.slice(-4);

  return `****${lastFour}`;
}

/**
 * Format currency amount with symbol and proper decimals
 * @param amount Numeric amount
 * @param currency Currency code (e.g., "USD", "EUR", "GBP")
 * @param format Format type - "symbol" or "code"
 * @param numberFormat Number formatting configuration
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  format: CurrencyFormat = "symbol",
  numberFormat: NumberFormat = DEFAULT_NUMBER_FORMAT
): string {
  // Handle null/undefined amounts
  if (amount === null || amount === undefined || isNaN(amount)) {
    return format === "symbol"
      ? getCurrencySymbol(currency) + "0.00"
      : `0.00 ${currency}`;
  }

  // Format the number with proper decimals and separators
  const formattedNumber = formatNumber(Math.abs(amount), numberFormat);

  // Add currency symbol or code
  const currencyDisplay =
    format === "symbol" ? getCurrencySymbol(currency) : currency;

  // Handle negative amounts
  const sign = amount < 0 ? "-" : "";

  if (format === "symbol") {
    return `${sign}${currencyDisplay}${formattedNumber}`;
  } else {
    return `${sign}${formattedNumber} ${currencyDisplay}`;
  }
}

/**
 * Format number with thousands separators and decimal places
 * @param amount Numeric amount
 * @param numberFormat Number formatting configuration
 * @returns Formatted number string
 */
export function formatNumber(
  amount: number,
  numberFormat: NumberFormat = DEFAULT_NUMBER_FORMAT
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return (
      "0" + numberFormat.decimalSeparator + "0".repeat(numberFormat.decimals)
    );
  }

  // Round to specified decimal places
  const rounded =
    Math.round(amount * Math.pow(10, numberFormat.decimals)) /
    Math.pow(10, numberFormat.decimals);

  // Split into integer and decimal parts
  const parts = rounded.toFixed(numberFormat.decimals).split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] || "";

  // Add thousands separators
  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    numberFormat.thousandsSeparator
  );

  // Combine with decimal separator
  if (numberFormat.decimals > 0) {
    return formattedInteger + numberFormat.decimalSeparator + decimalPart;
  } else {
    return formattedInteger;
  }
}

/**
 * Format date string consistently
 * @param dateString Date string in various formats
 * @param format Target date format
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  format: DateFormat = "DD/MM/YYYY"
): string {
  if (!dateString) {
    return "";
  }

  // Try to parse the date string
  const date = parseDate(dateString);
  if (!date || isNaN(date.getTime())) {
    return dateString; // Return original if parsing fails
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  if (format === "DD/MM/YYYY") {
    return `${day}/${month}/${year}`;
  } else if (format === "MM/DD/YYYY") {
    return `${month}/${day}/${year}`;
  }

  return dateString;
}

/**
 * Parse date string from various formats
 * @param dateString Date string to parse
 * @returns Date object or null if parsing fails
 */
function parseDate(dateString: string): Date | null {
  if (!dateString) {
    return null;
  }

  // Clean the date string
  const cleaned = dateString.trim();

  // Try ISO format first
  let date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try common date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY or MM-DD-YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY or MM.DD.YYYY
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      const [, part1, part2, part3] = match;

      // For YYYY-MM-DD format
      if (format.source.includes("(\\d{4})-(\\d{1,2})-(\\d{1,2})")) {
        date = new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
      } else {
        // For other formats, assume DD/MM/YYYY (European format)
        // This can be made configurable based on locale
        date = new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
      }

      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Get currency symbol for common currencies
 * @param currency Currency code
 * @returns Currency symbol
 */
function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    CNY: "¥",
    SEK: "kr",
    NZD: "NZ$",
  };

  return symbols[currency.toUpperCase()] || currency;
}

/**
 * Format confidence score as percentage
 * @param confidence Confidence score (0-1)
 * @returns Formatted percentage string
 */
export function formatConfidence(confidence: number): string {
  if (confidence === null || confidence === undefined || isNaN(confidence)) {
    return "0%";
  }

  const percentage = Math.round(confidence * 100);
  return `${percentage}%`;
}

/**
 * Get confidence level description
 * @param confidence Confidence score (0-1)
 * @returns Confidence level description
 */
export function getConfidenceLevel(
  confidence: number
): "high" | "medium" | "low" {
  if (confidence >= 0.8) {
    return "high";
  } else if (confidence >= 0.6) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Format statement period as readable string
 * @param startDate Start date string
 * @param endDate End date string
 * @param dateFormat Date format to use
 * @returns Formatted period string
 */
export function formatStatementPeriod(
  startDate: string,
  endDate: string,
  dateFormat: DateFormat = "DD/MM/YYYY"
): string {
  const formattedStart = formatDate(startDate, dateFormat);
  const formattedEnd = formatDate(endDate, dateFormat);

  if (!formattedStart || !formattedEnd) {
    return "";
  }

  return `${formattedStart} - ${formattedEnd}`;
}
