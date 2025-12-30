import { useEffect, useState } from "react";
import axios from "axios";

const PdfUploader = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeAccount, setActiveAccount] = useState(0);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setDone(false);
    setError("");
    setResult(null);
    setActiveAccount(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${import.meta.env.VITE_URL}/parse-bank-statement`,
        formData
      );

      setResult(res.data.data);
      setDone(true);
    } catch (err) {
      setError(err.message || "Failed to process PDF");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
    setDone(false);
    setLoading(false);
    setActiveAccount(0);
  };

  const account = result?.accounts?.[activeAccount];

  return (
    <div className="container mx-auto min-h-screen p-6">
      {!done ? (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto flex flex-col gap-4"
        >
          <label className="flex flex-col items-center justify-center h-64 border border-dashed rounded cursor-pointer">
            <p className="text-sm">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs mt-1">PDF only</p>
            {file && <p className="mt-2 text-sm font-medium">{file.name}</p>}
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? "Processing..." : "Upload & Parse"}
          </button>

          {loading && (
            <div className="flex justify-center mt-4">
              <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          )}
        </form>
      ) : (
        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* LEFT: DATA */}
          <div className="w-1/2 space-y-4">
            {/* ACCOUNT TABS */}
            <div className="flex gap-2 border-b pb-2">
              {result.accounts.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveAccount(idx)}
                  className={`px-3 py-1 rounded text-sm ${
                    idx === activeAccount
                      ? "bg-black text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {acc.bankName || "Unknown Bank"} #{idx + 1}
                </button>
              ))}
            </div>

            {/* ACCOUNT SUMMARY */}
            <div className="border rounded-xl p-4 space-y-3 text-sm">
              <h2 className="font-semibold text-lg">Account Summary</h2>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Bank:</strong> {account.bankName || "N/A"}
                </div>
                <div>
                  <strong>Account No:</strong> {account.accountNumber || "N/A"}
                </div>
                <div>
                  <strong>Holder:</strong> {account.accountHolderName || "N/A"}
                </div>
                <div>
                  <strong>Type:</strong> {account.accountType || "N/A"}
                </div>
                <div>
                  <strong>Currency:</strong> {account.currency || "N/A"}
                </div>
                <div>
                  <strong>Period:</strong> {account.statementStartDate || "?"} –{" "}
                  {account.statementEndDate || "?"}
                </div>
              </div>
            </div>

            {/* TRANSACTIONS */}
            <div className="border rounded-xl overflow-auto max-h-96">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Debit</th>
                    <th className="p-2">Credit</th>
                    <th className="p-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {account.transactions.map((tx, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{tx.date}</td>
                      <td className="p-2">{tx.description}</td>
                      <td className="p-2">{tx.debitAmount || "-"}</td>
                      <td className="p-2">{tx.creditAmount || "-"}</td>
                      <td className="p-2">{tx.runningBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={reset}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Upload another PDF
            </button>
          </div>

          {/* RIGHT: PDF PREVIEW */}
          <div className="w-1/2">
            <h2 className="text-lg font-semibold mb-2">PDF Preview</h2>
            {previewUrl && (
              <embed
                src={previewUrl}
                type="application/pdf"
                width="100%"
                height="700"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
