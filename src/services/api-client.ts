/**
 * API Client Service for DocSift API Integration
 * Handles HTTP communication with the DocSift backend API
 */

import {
  APIResponse,
  APIError,
  ErrorCode,
  UploadRequest,
  UploadResponse,
} from "../types";

/**
 * Configuration for API client
 */
interface APIClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: APIClientConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  timeout: 500000, // 3 minutes for processing
  maxRetries: 3,
};

/**
 * API Client class for DocSift integration
 */
export class APIClient {
  private config: APIClientConfig;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Extract bank statement data from uploaded PDF file
   * @param file PDF file to process
   * @param onProgress Optional progress callback
   * @returns Promise with API response or error
   */
  async extractBankStatement(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<APIResponse> {
    // Validate file before upload
    this.validateFile(file);

    try {
      // Step 1: Upload the file (0-50% progress)
      const uploadResult = await this.uploadFile(file, onProgress);

      // Step 2: Process the uploaded file (50-90% progress)
      if (onProgress) onProgress(60);
      await this.processFile(uploadResult.jobId);
      
      if (onProgress) onProgress(80);

      // Step 3: Get the results (90-100% progress)
      if (onProgress) onProgress(90);
      const results = await this.getResults(uploadResult.jobId);
      
      if (onProgress) onProgress(100);

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload file to the backend
   * @param file PDF file to upload
   * @param onProgress Progress callback
   * @returns Upload response with jobId
   */
  private async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ jobId: string; message: string }> {
    const formData = new FormData();
    formData.append("file", file);

    // Determine if this is a large file (>10MB)
    const isLargeFile = file.size > 10 * 1024 * 1024;
    const timeout = isLargeFile ? this.config.timeout * 2 : this.config.timeout;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProgressTime = Date.now();
      let stalled = false;

      // Set up progress tracking
      if (onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 50); // Upload is 50% of total progress
            const now = Date.now();

            if (progress > 0 && now - lastProgressTime > 5000 && !stalled) {
              stalled = true;
            } else if (progress > 0) {
              lastProgressTime = now;
              stalled = false;
            }

            onProgress(progress);
          }
        });

        xhr.upload.addEventListener("load", () => {
          onProgress(50); // Upload complete, processing starts
        });
      }

      xhr.timeout = timeout;

      xhr.addEventListener("load", () => {
        try {
          const response = JSON.parse(xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            const error = this.createAPIError(xhr.status, response);
            reject(error);
          }
        } catch (parseError) {
          const error = this.createAPIError(xhr.status, {
            errorCode: ErrorCode.INTERNAL_ERROR,
            message: "Invalid response format from server",
          });
          reject(error);
        }
      });

      xhr.addEventListener("error", () => {
        const error = this.createAPIError(0, {
          errorCode: ErrorCode.INTERNAL_ERROR,
          message: "Network error occurred during upload",
        });
        reject(error);
      });

      xhr.addEventListener("timeout", () => {
        const message = isLargeFile
          ? "Upload timed out. Large files may take longer to upload. Please try again or use a smaller file."
          : "Upload timed out. Please try again.";

        const error = this.createAPIError(408, {
          errorCode: ErrorCode.OCR_TIMEOUT,
          message,
        });
        reject(error);
      });

      // Send request to correct backend endpoint
      const endpoint = `${this.config.baseURL}/api/statements/upload`;
      xhr.open("POST", endpoint);

      if (isLargeFile) {
        xhr.setRequestHeader("X-Large-File", "true");
      }

      xhr.send(formData);
    });
  }

  /**
   * Process the uploaded file
   * @param jobId Job ID from upload response
   * @returns Processing response
   */
  private async processFile(jobId: string): Promise<any> {
    // Use longer timeout for processing endpoint (3 minutes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500000); // 3 minutes

    try {
      const response = await fetch(
        `${this.config.baseURL}/api/statements/process/${jobId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createAPIError(response.status, errorData);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw this.createAPIError(408, {
          errorCode: ErrorCode.OCR_TIMEOUT,
          message: 'Processing timed out. This may happen with complex documents. Please try again.',
        });
      }
      
      throw error;
    }
  }

  /**
   * Get processing results
   * @param jobId Job ID from upload response
   * @returns Processing results
   */
  private async getResults(jobId: string): Promise<APIResponse> {
    const response = await fetch(
      `${this.config.baseURL}/api/statements/result/${jobId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createAPIError(response.status, errorData);
    }

    const backendResult = await response.json();
    
    // Transform backend response to match frontend APIResponse interface
    return this.transformBackendResponse(backendResult);
  }

  /**
   * Transform backend response to match frontend APIResponse interface
   * @param backendResult Backend result response
   * @returns Transformed APIResponse
   */
  private transformBackendResponse(backendResult: any): APIResponse {
    console.log('🔄 Transforming backend response:', backendResult);
    
    // Transform accounts to users format
    const users = (backendResult.accounts || []).map((account: any, index: number) => {
      // Transform transactions to match frontend interface
      const transformedTransactions = (account.transactions || []).map((txn: any, txnIndex: number) => {
        // Calculate running balance if not provided
        let runningBalance = txn.balance;
        if (runningBalance === null || runningBalance === undefined) {
          // Calculate from opening balance and previous transactions
          const openingBalance = account.openingBalance || 0;
          let calculatedBalance = openingBalance;
          
          // Add up all transactions up to this point
          for (let i = 0; i <= txnIndex; i++) {
            const prevTxn = account.transactions[i];
            if (prevTxn.credit) calculatedBalance += prevTxn.credit;
            if (prevTxn.debit) calculatedBalance -= prevTxn.debit;
          }
          
          runningBalance = calculatedBalance;
        }
        
        return {
          date: txn.date,
          description: txn.description,
          debitAmount: txn.debit,
          creditAmount: txn.credit,
          runningBalance: runningBalance,
          confidence: 0.9 // Default confidence for transactions
        };
      });

      return {
        userId: `account-${index + 1}`,
        name: {
          value: account.accountHolderName || "Unknown Account Holder",
          confidence: 0.95
        },
        address: {
          value: account.address || "",
          confidence: 0.8
        },
        accountNumber: {
          value: account.accountNumber || "",
          confidence: 0.9
        },
        bank: {
          value: account.bankName || "Unknown Bank",
          confidence: 0.9
        },
        pages: [1], // Default to page 1
        transactions: transformedTransactions,
        // Add account-level financial data for frontend use
        accountInfo: {
          bankName: account.bankName || "Unknown Bank",
          accountHolder: account.accountHolderName || "Unknown Account Holder",
          maskedAccountNumber: account.accountNumber || "",
          accountType: account.accountType || "Unknown",
          currency: account.currency || "USD",
          statementPeriod: {
            startDate: account.statementStartDate || null,
            endDate: account.statementEndDate || null,
          },
          balances: {
            opening: account.openingBalance || 0,
            closing: account.closingBalance || 0,
          },
        }
      };
    });

    const transformedResponse = {
      requestId: `req-${Date.now()}`,
      promptVersion: "1.0",
      schemaVersion: "1.0",
      users: users,
      warnings: [] // No warnings for now
    };

    console.log('✅ Transformed response:', transformedResponse);
    return transformedResponse;
  }

  /**
   * Validate connection to the API
   * @returns Promise indicating if connection is successful
   */
  async validateConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.baseURL}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate file before upload
   * @param file File to validate
   * @throws APIError if file is invalid
   */
  private validateFile(file: File): void {
    // Check file type
    if (file.type !== "application/pdf") {
      throw this.createAPIError(400, {
        errorCode: ErrorCode.INVALID_FILE_TYPE,
        message: "Only PDF files are supported",
      });
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      throw this.createAPIError(400, {
        errorCode: ErrorCode.INVALID_FILE_TYPE,
        message: "File size exceeds 50MB limit",
      });
    }

    // Check if file is empty
    if (file.size === 0) {
      throw this.createAPIError(400, {
        errorCode: ErrorCode.INVALID_PDF,
        message: "File appears to be empty",
      });
    }
  }

  /**
   * Create standardized API error object
   * @param statusCode HTTP status code
   * @param errorData Error data from response
   * @returns APIError object
   */
  private createAPIError(statusCode: number, errorData: any): APIError {
    return {
      requestId: errorData.requestId,
      errorCode: errorData.errorCode || ErrorCode.INTERNAL_ERROR,
      message: errorData.message || "An unexpected error occurred",
      statusCode,
    };
  }

}

/**
 * Default API client instance
 */
export const apiClient = new APIClient();

/**
 * Convenience function for extracting bank statements
 * @param request Upload request with file and progress callback
 * @returns Promise with upload response
 */
export async function extractBankStatement(
  request: UploadRequest
): Promise<UploadResponse> {
  try {
    const data = await apiClient.extractBankStatement(
      request.file,
      request.onProgress
    );
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error as APIError,
    };
  }
}
