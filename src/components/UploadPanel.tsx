import React, { useState, useRef, useCallback } from "react";
import { UploadPanelProps, FileValidationResult } from "../types";
import { validateFile, extractFileInfo } from "../utils/file-validation";

/**
 * Upload Panel Component
 * Handles file selection, validation, and upload initiation with drag-and-drop support
 */
export const UploadPanel: React.FC<UploadPanelProps> = ({
  onFileSelect,
  onProcessFile,
  selectedFile,
  isProcessing,
  uploadProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationResult, setValidationResult] =
    useState<FileValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles file selection and validation
   */
  const handleFileSelection = useCallback(
    (file: File | null) => {
      if (!file) {
        setValidationResult(null);
        onFileSelect(null);
        return;
      }

      const validation = validateFile(file);
      setValidationResult(validation);

      if (validation.isValid) {
        onFileSelect(file);
      } else {
        onFileSelect(null);
      }
    },
    [onFileSelect]
  );

  /**
   * Handles file input change event
   */
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    handleFileSelection(file);
  };

  /**
   * Handles drag over event
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  /**
   * Handles drag leave event
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  /**
   * Handles file drop event
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    const file = files.length > 0 ? files[0] : null;
    handleFileSelection(file);
  };

  /**
   * Handles click on drop zone to open file dialog
   */
  const handleDropZoneClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Handles process file button click
   */
  const handleProcessClick = () => {
    if (!selectedFile) {
      setValidationResult({
        isValid: false,
        errorMessage: "Please select a PDF file before processing.",
      });
      return;
    }

    if (validationResult?.isValid) {
      onProcessFile();
    }
  };

  /**
   * Clears the selected file
   */
  const handleClearFile = () => {
    handleFileSelection(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Gets the appropriate status message
   */
  const getStatusMessage = () => {
    if (isProcessing) {
      if (uploadProgress !== undefined) {
        const isLargeFile =
          selectedFile && selectedFile.size > 10 * 1024 * 1024;
        const progressText = `${Math.round(uploadProgress)}%`;

        if (uploadProgress < 100) {
          return isLargeFile
            ? `Uploading large file... ${progressText}`
            : `Uploading... ${progressText}`;
        } else {
          return isLargeFile
            ? "Processing large document... This may take a few moments"
            : "Processing document...";
        }
      }
      return "Processing document...";
    }
    return null;
  };

  /**
   * Gets file size information for display
   */
  const getFileSizeInfo = () => {
    if (!selectedFile) return null;

    const sizeInMB = selectedFile.size / (1024 * 1024);
    const isLargeFile = sizeInMB > 10;

    return {
      sizeInMB: Math.round(sizeInMB * 10) / 10, // Round to 1 decimal
      isLargeFile,
      sizeWarning: isLargeFile
        ? "Large file - processing may take longer"
        : null,
    };
  };

  const fileInfo = selectedFile ? extractFileInfo(selectedFile) : null;
  const fileSizeInfo = getFileSizeInfo();
  const hasValidFile = selectedFile && validationResult?.isValid;
  const statusMessage = getStatusMessage();

  return (
    <div className="flex flex-col gap-6 p-8 bg-white rounded-lg shadow-lg max-w-[500px] w-full">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Upload Bank Statement
        </h2>
        <p className="text-gray-600 text-sm">
          Select a PDF bank statement to extract structured data
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 bg-gray-50 relative ${
          isDragOver
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300"
        } ${
          isProcessing
            ? "cursor-not-allowed opacity-60 border-gray-300 bg-gray-100"
            : "hover:border-blue-500 hover:bg-blue-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleDropZoneClick}
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-label="Click to select file or drag and drop PDF file here"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isProcessing) {
            e.preventDefault();
            handleDropZoneClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="sr-only"
          disabled={isProcessing}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-4">
          {!selectedFile ? (
            <>
              <div className="text-5xl opacity-70">📄</div>
              <p className="text-lg font-medium text-gray-700">
                Click to select or drag and drop your PDF
              </p>
              <p className="text-sm text-gray-500">
                PDF files only, up to 50MB
              </p>
            </>
          ) : (
            <div className="flex items-center gap-4 w-full max-w-xs">
              <div className="text-5xl opacity-70">📄</div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-700 break-words mb-1">
                  {fileInfo?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {fileInfo?.size} • {fileInfo?.lastModified}
                </p>
              </div>
              {!isProcessing && (
                <button
                  type="button"
                  className="bg-red-500 text-white border-0 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-xs transition-colors duration-200 flex-shrink-0 hover:bg-red-600 focus:outline-2 focus:outline-red-500 focus:outline-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  aria-label="Remove selected file"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Error Display */}
      {validationResult && !validationResult.isValid && (
        <div
          className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-700"
          role="alert"
          aria-live="polite"
          id="validation-error"
        >
          <span className="flex-shrink-0 text-base" aria-hidden="true">
            ⚠️
          </span>
          <span className="text-sm leading-relaxed">
            {validationResult.errorMessage}
          </span>
        </div>
      )}

      {/* Large File Warning */}
      {fileSizeInfo?.isLargeFile && !isProcessing && hasValidFile && (
        <div
          className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700"
          role="status"
          aria-live="polite"
        >
          <span className="flex-shrink-0 text-base" aria-hidden="true">
            ℹ️
          </span>
          <span className="text-sm leading-relaxed">
            {fileSizeInfo.sizeWarning} ({fileSizeInfo.sizeInMB} MB)
          </span>
        </div>
      )}

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          {uploadProgress !== undefined ? (
            <div
              className="w-full h-2 bg-gray-200 rounded overflow-hidden"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-blue-500 transition-all duration-300 rounded"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          ) : (
            <div
              className="w-6 h-6 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"
              aria-hidden="true"
            />
          )}
          {statusMessage && (
            <p
              className="text-center text-gray-500 text-sm m-0"
              aria-live="polite"
              aria-atomic="true"
            >
              {statusMessage}
            </p>
          )}
        </div>
      )}

      {/* Process Button */}
      <button
        type="button"
        className={`w-full py-3.5 px-8 text-base font-medium rounded-md transition-all duration-200 ${
          !hasValidFile || isProcessing
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 text-white cursor-pointer hover:bg-blue-600 hover:-translate-y-0.5 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
        }`}
        onClick={handleProcessClick}
        disabled={!hasValidFile || isProcessing}
        aria-describedby={
          validationResult && !validationResult.isValid
            ? "validation-error"
            : undefined
        }
        aria-label={
          isProcessing
            ? "Processing file, please wait"
            : hasValidFile
            ? `Process ${selectedFile?.name}`
            : "Select a PDF file to process"
        }
      >
        {isProcessing ? "Processing..." : "Process File"}
        <span className="sr-only">
          {!hasValidFile && "Please select a PDF file first"}
        </span>
      </button>
    </div>
  );
};

export default UploadPanel;
