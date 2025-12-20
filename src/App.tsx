import React from "react";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { UploadPanel } from "./components/UploadPanel";
import { ResultsPanel } from "./components/ResultsPanel";

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

const AppContent: React.FC = () => {
  const { state, actions } = useAppContext();

  // Debug logging
  console.log("🔍 App state:", {
    stage: state.processingStatus.stage,
    hasResults: !!state.results,
    results: state.results,
    error: state.error,
  });

  const handleFileSelect = (file: File | null) => {
    actions.setFile(file);
  };

  const handleProcessFile = async () => {
    if (state.uploadedFile) {
      await actions.startProcessing();
    }
  };

  const handleClearResults = () => {
    actions.clearResults();
  };

  const handleClearError = () => {
    actions.clearError();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
            Bank Statement Web UI
          </h1>
          <p className="text-lg text-gray-600 font-normal">
            Upload and process PDF bank statements
          </p>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full" id="main-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[500px_1fr] gap-8 min-h-[calc(100vh-200px)] items-start">
          <section
            className="flex justify-center items-start"
            aria-label="File Upload"
          >
            <UploadPanel
              onFileSelect={handleFileSelect}
              onProcessFile={handleProcessFile}
              selectedFile={state.uploadedFile}
              isProcessing={
                state.processingStatus.stage === "uploading" ||
                state.processingStatus.stage === "processing"
              }
              uploadProgress={state.processingStatus.progress}
            />
          </section>

          <section
            className="flex flex-col min-h-[500px]"
            aria-label="Processing Results"
          >
            <ResultsPanel
              results={state.results}
              isVisible={
                state.processingStatus.stage === "complete" ||
                (state.results !== null &&
                  state.results.users &&
                  state.results.users.length > 0)
              }
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
