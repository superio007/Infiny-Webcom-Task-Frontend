/**
 * API Integration Types
 * Interfaces matching the DocSift API backend for seamless integration
 */

/**
 * Error codes used throughout the API
 */
export enum ErrorCode {
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  INVALID_PDF = "INVALID_PDF",
  UNSUPPORTED_PDF_VERSION = "UNSUPPORTED_PDF_VERSION",
  ENCRYPTED_PDF = "ENCRYPTED_PDF",
  UNSUPPORTED_PDF_FEATURES = "UNSUPPORTED_PDF_FEATURES",
  CORRUPTED_PDF = "CORRUPTED_PDF",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_ENDPOINT = "INVALID_ENDPOINT",
  OCR_UNREADABLE = "OCR_UNREADABLE",
  OCR_TIMEOUT = "OCR_TIMEOUT",
  LLM_SCHEMA_VIOLATION = "LLM_SCHEMA_VIOLATION",
  LLM_UNAVAILABLE = "LLM_UNAVAILABLE",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Field result with value and confidence score
 */
export interface FieldResult {
  value: string | null;
  confidence: number;
}

/**
 * Warning types for partial processing issues
 */
export interface Warning {
  type: "OCR_TIMEOUT" | "OCR_UNREADABLE" | "LLM_SCHEMA_VIOLATION";
  pageNumber?: number;
  message: string;
}

/**
 * User entity representing a bank account holder
 */
export interface UserEntity {
  userId: string;
  name: FieldResult;
  address: FieldResult;
  accountNumber: FieldResult;
  bank: FieldResult;
  pages: number[];
  transactions?: Transaction[];
  accountInfo?: AccountInfo;
}

/**
 * Successful API response structure from /v1/extract/bank-statement
 */
export interface APIResponse {
  requestId: string;
  promptVersion: string;
  schemaVersion: string;
  users: UserEntity[];
  warnings: Warning[];
}

/**
 * API error response structure
 */
export interface APIError {
  requestId?: string;
  errorCode: ErrorCode;
  message: string;
  statusCode: number;
}

/**
 * File upload request configuration
 */
export interface UploadRequest {
  file: File;
  onProgress?: (progress: number) => void;
}

/**
 * Upload response with progress tracking
 */
export interface UploadResponse {
  success: boolean;
  data?: APIResponse;
  error?: APIError;
}

/**
 * UI State Management Types
 * Interfaces for managing application state and component interactions
 */

/**
 * Processing status stages
 */
export type ProcessingStage =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

/**
 * Processing status with progress tracking
 */
export interface ProcessingStatus {
  stage: ProcessingStage;
  progress?: number;
  message?: string;
}

/**
 * Error state types
 */
export type ErrorType = "validation" | "api" | "network" | "processing";

/**
 * Error state with recovery information
 */
export interface ErrorState {
  type: ErrorType;
  code?: ErrorCode;
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
}

/**
 * Tab information for account navigation
 */
export interface TabInfo {
  id: string;
  label: string;
  hasWarnings: boolean;
  confidence: number;
}

/**
 * Tab state management
 */
export interface TabState {
  activeTabId: string;
  availableTabs: TabInfo[];
}

/**
 * Application state
 */
export interface AppState {
  uploadedFile: File | null;
  processingStatus: ProcessingStatus;
  results: APIResponse | null;
  error: ErrorState | null;
}

/**
 * Application context actions
 */
export interface AppActions {
  setFile: (file: File | null) => void;
  startProcessing: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Application context value
 */
export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

/**
 * Component Props Interfaces
 */

/**
 * Upload Panel component props
 */
export interface UploadPanelProps {
  onFileSelect: (file: File) => void;
  onProcessFile: () => void;
  selectedFile: File | null;
  isProcessing: boolean;
  uploadProgress?: number;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
}

/**
 * Results Panel component props
 */
export interface ResultsPanelProps {
  results: APIResponse | null;
  isVisible: boolean;
}

/**
 * Account display data
 */
export interface AccountDisplayData {
  userId: string;
  tabLabel: string;
  accountInfo: AccountInfo;
  transactions: Transaction[];
  confidence: ConfidenceIndicators;
}

/**
 * Account information display
 */
export interface AccountInfo {
  bankName: string;
  accountHolder: string;
  maskedAccountNumber: string;
  accountType?: string;
  currency: string;
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  balances: {
    opening: number;
    closing: number;
  };
}

/**
 * Transaction data
 */
export interface Transaction {
  date: string;
  description: string;
  debitAmount?: number;
  creditAmount?: number;
  runningBalance: number;
  confidence?: number;
}

/**
 * Account Tab component props
 */
export interface AccountTabProps {
  account: UserEntity;
  isActive: boolean;
  onSelect: () => void;
  warnings: Warning[];
}

/**
 * Transaction Table component props
 */
export interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY";
}

/**
 * Error Handler component props
 */
export interface ErrorHandlerProps {
  error: ErrorState | null;
  onRetry?: () => void;
  onClear: () => void;
}

/**
 * Confidence indicators for data quality
 */
export interface ConfidenceIndicators {
  overall: number;
  fields: {
    [fieldName: string]: number;
  };
}

/**
 * Display Formatting and Responsive Design Types
 */

/**
 * Date format options
 */
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY";

/**
 * Currency format options
 */
export type CurrencyFormat = "symbol" | "code";

/**
 * Number formatting configuration
 */
export interface NumberFormat {
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

/**
 * Display settings
 */
export interface DisplaySettings {
  dateFormat: DateFormat;
  currencyFormat: CurrencyFormat;
  numberFormat: NumberFormat;
}

/**
 * Breakpoint configuration for responsive design
 */
export interface BreakpointConfig {
  mobile: number; // 768px
  tablet: number; // 1024px
  desktop: number; // 1200px
}

/**
 * Panel layout options
 */
export type PanelLayout = "stacked" | "side-by-side";

/**
 * Layout state for responsive design
 */
export interface LayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  panelLayout: PanelLayout;
}
