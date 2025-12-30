import { useEffect, useState } from "react";
import axios from "axios";
const PdfUploader = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState();

  // Create + cleanup PDF preview URL
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // const res = await fetch("http://localhost:4000/parse-resume", {
      //   method: "POST",
      //   body: formData,
      //   signal: controller.signal,
      // });
      const res = await axios.post(
        "http://localhost:4000/parse-resume",
        formData
      );

      setResult(res.data);
      setDone(true);
    } catch (err) {
      setError(err.name === "AbortError" ? "Request timed out" : err.message);
    } finally {
      clearTimeout(timeout);
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
  };

  return (
    <div className="container mx-auto flex justify-center items-center min-h-screen p-6">
      {!done ? (
        <form onSubmit={handleSubmit} className="w-full max-w-xl">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-64 border border-dashed rounded cursor-pointer hover:bg-gray-50"
          >
            <p className="text-sm">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs mt-1">PDF only</p>
            {file && <p className="mt-2 text-sm font-medium">{file.name}</p>}

            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? "Processing..." : "Upload & Parse"}
          </button>

          {loading && (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
              <p className="mt-2 text-sm">Processing your PDF...</p>
            </div>
          )}
        </form>
      ) : (
        <div className="flex gap-10 w-full max-w-6xl">
          {/* Structured Data */}
          {/* Structured Data */}
          <div className="w-1/2">
            <h2 className="text-lg font-semibold mb-2">Extracted Data</h2>

            <div className="flex flex-col gap-3">
              <div className="bg-white p-3 rounded-xl border">
                <strong>Full Name:</strong> {result?.data?.fullName ?? "N/A"}
              </div>

              <div className="bg-white p-3 rounded-xl border">
                <strong>Email:</strong> {result?.data?.email ?? "N/A"}
              </div>

              <div className="bg-white p-3 rounded-xl border">
                <strong>Phone:</strong> {result?.data?.phone ?? "N/A"}
              </div>
            </div>

            {/* Skills */}
            {/* <div className="mt-4">
              <h3 className="font-semibold mb-2">
                <strong>Skills</strong>
              </h3>

              <div className="flex flex-col gap-3">
                {result?.data?.skills?.map((skillObj, index) => {
                  const category = Object.keys(skillObj)[0];
                  const items = skillObj[category];

                  return (
                    <div key={index} className="bg-white p-3 rounded-xl border">
                      <strong className="capitalize">{category}</strong>
                      <ul className="list-disc list-inside mt-1">
                        {items?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div> */}

            {/* Work Experience */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Work Experience</h3>

              <div className="flex flex-col gap-3">
                {result?.data?.workExperience?.map((exp, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl border flex flex-col gap-1"
                  >
                    <span className="font-semibold">{exp.company}</span>
                    <span className="text-sm">{exp.role}</span>
                    <span className="text-xs text-gray-600">
                      {exp.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Education</h3>

              <div className="flex flex-col gap-3">
                {result?.data?.education?.map((edu, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl border flex flex-col gap-1"
                  >
                    <span className="font-semibold">{edu.institution}</span>
                    <span className="text-sm">{edu.degree}</span>
                    <span className="text-xs text-gray-600">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={reset}
              className="mt-6 px-4 py-2 bg-black text-white rounded"
            >
              Upload another PDF
            </button>
          </div>

          {/* PDF Preview */}
          <div className="w-1/2">
            <h2 className="text-lg font-semibold mb-2">PDF Preview</h2>
            {previewUrl && (
              <embed
                src={previewUrl}
                type="application/pdf"
                width="100%"
                height="600"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
