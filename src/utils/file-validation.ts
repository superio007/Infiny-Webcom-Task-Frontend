import { FileValidationResult } from "../types";

/**
 * Maximum file size in bytes (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Allowed MIME types for PDF files
 */
const ALLOWED_MIME_TYPES = ["application/pdf"];

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = [".pdf"];

/**
 * Validates a file for PDF type and size constraints
 * @param file - The file to validate
 * @returns FileValidationResult with validation status and details
 */
export function validateFile(file: File): FileValidationResult {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      errorMessage: "No file selected. Please choose a PDF file to upload.",
    };
  }

  // Extract file info
  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
  };

  // Validate file type by MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      errorMessage:
        "Please select a PDF file only. Other file types are not supported.",
      fileInfo,
    };
  }

  // Validate file extension as additional check
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      errorMessage:
        "Please select a PDF file only. Other file types are not supported.",
      fileInfo,
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      isValid: false,
      errorMessage: `File size (${fileSizeMB}MB) exceeds the maximum limit of ${maxSizeMB}MB. Please choose a smaller file.`,
      fileInfo,
    };
  }

  // Validate file is not empty
  if (file.size === 0) {
    return {
      isValid: false,
      errorMessage:
        "The selected file is empty. Please choose a valid PDF file.",
      fileInfo,
    };
  }

  // File is valid
  return {
    isValid: true,
    fileInfo,
  };
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Extracts and formats file information for display
 * @param file - The file to extract info from
 * @returns Formatted file information object
 */
export function extractFileInfo(file: File) {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type || "Unknown",
    lastModified: new Date(file.lastModified).toLocaleDateString(),
  };
}

/**
 * Checks if a file appears to be a valid PDF by examining its header
 * @param file - The file to check
 * @returns Promise<boolean> indicating if file appears to be a PDF
 */
export async function isPDFFile(file: File): Promise<boolean> {
  try {
    // Read first few bytes to check PDF signature
    const arrayBuffer = await file.slice(0, 5).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // PDF files start with "%PDF-"
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

    if (uint8Array.length < 5) return false;

    for (let i = 0; i < 5; i++) {
      if (uint8Array[i] !== pdfSignature[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn("Error checking PDF signature:", error);
    return false;
  }
}

/**
 * Comprehensive file validation including content validation
 * @param file - The file to validate
 * @returns Promise<FileValidationResult> with comprehensive validation
 */
export async function validateFileComprehensive(
  file: File
): Promise<FileValidationResult> {
  // First run basic validation
  const basicValidation = validateFile(file);

  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Check PDF content signature
  const isPDF = await isPDFFile(file);

  if (!isPDF) {
    return {
      isValid: false,
      errorMessage:
        "The selected file does not appear to be a valid PDF. Please choose a different file.",
      fileInfo: basicValidation.fileInfo,
    };
  }

  return basicValidation;
}
