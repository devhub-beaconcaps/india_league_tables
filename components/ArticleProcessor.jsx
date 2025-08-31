// components/ArticleProcessor.jsx
"use client";
import { useState } from "react";

export default function ArticleProcessor() {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/process-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process article");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style>{`
      .articleProcessor {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.inputGroup {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.urlInput {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.processButton {
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.processButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.errorMessage {
  color: #d32f2f;
  padding: 1rem;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.articleResult {
  margin-top: 2rem;
}

.originalSummary, .researchedContent, .references {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.section {
  margin-bottom: 1.5rem;
}

.keyFindings {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #e8f5e9;
  border-radius: 4px;
}

.references ul {
  padding-left: 1.5rem;
}

.processingInfo {
  font-style: italic;
  color: #666;
  text-align: right;
}
      `}</style>
      <div className="article-processor">
        <form onSubmit={handleSubmit} className="processor-form">
          <div className="input-group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste article or blog URL here"
              required
              disabled={isProcessing}
              className="url-input"
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="process-button"
            >
              {isProcessing ? "Processing..." : "Analyze & Research"}
            </button>
          </div>
        </form>

        {error && <div className="error-message">Error: {error}</div>}

        {result && <ArticleResult result={result} />}
      </div>
    </>
  );
}

// Component to display results
function ArticleResult({ result }) {
  return (
    <div className="article-result">
      <h2>Researched Article: {result.researched.title}</h2>

      <div className="original-summary">
        <h3>Original Article Summary</h3>
        <p>
          <strong>Title:</strong> {result.original.title}
        </p>
        <p>
          <strong>URL:</strong>{" "}
          <a href={result.original.url} target="_blank">
            {result.original.url}
          </a>
        </p>
      </div>

      <div className="researched-content">
        <h3>Enhanced Content</h3>
        {result.researched.sections.map((section, index) => (
          <div key={index} className="section">
            <h4>{section.originalHeading}</h4>
            <p>{section.researchedContent}</p>
            {section.keyFindings && (
              <div className="key-findings">
                <strong>Key Findings:</strong>
                <ul>
                  {section.keyFindings.map((finding, i) => (
                    <li key={i}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {result.researched.references &&
        result.researched.references.length > 0 && (
          <div className="references">
            <h3>References</h3>
            <ul>
              {result.researched.references.map((ref, index) => (
                <li key={index}>{ref}</li>
              ))}
            </ul>
          </div>
        )}

      <div className="processing-info">
        <p>Processed on: {new Date(result.processedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
