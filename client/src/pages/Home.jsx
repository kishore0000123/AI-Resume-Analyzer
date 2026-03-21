import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import { analyzeResume } from "../api/client";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await analyzeResume(file);
      navigate("/dashboard", { state: { result: data, file } });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to connect to server. Make sure the backend is running on port 8000.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", padding: "60px 0" }}>
      <div className="container">
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* Hero header */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)",
              borderRadius: "99px", padding: "6px 18px", marginBottom: "24px",
              fontSize: "0.85rem", color: "var(--accent-2)", fontWeight: 600,
            }}>
              <span>✨</span> AI-Powered Resume Analysis
            </div>

            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "20px" }}>
              Get Your Resume{" "}
              <span className="gradient-text">Analyzed by AI</span>
              {" "}in Seconds
            </h1>

            <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
              Upload your PDF resume and instantly receive a score, extracted skills,
              job match percentages, and actionable AI suggestions.
            </p>
          </div>

          {/* Upload zone */}
          <UploadZone onFileSelect={setFile} file={file} loading={loading} />

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, padding: "14px 18px",
              background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)",
              borderRadius: "var(--radius-md)", color: "var(--danger)", fontSize: "0.875rem",
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
            <button
              id="analyze-btn"
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!file || loading}
              style={{ fontSize: "1rem", padding: "14px 40px", gap: "10px" }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Analyzing…
                </>
              ) : (
                <>🚀 Analyze My Resume</>
              )}
            </button>
          </div>

          {/* Feature pills */}
          <div style={{
            marginTop: 44, display: "flex", flexWrap: "wrap",
            justifyContent: "center", gap: "12px",
          }}>
            {[
              { icon: "🎯", label: "Resume Score" },
              { icon: "🧠", label: "Skill Extraction" },
              { icon: "💼", label: "Job Matching" },
              { icon: "💡", label: "AI Suggestions" },
              { icon: "✍️", label: "Resume Optimizer" },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 99, padding: "8px 18px",
                fontSize: "0.875rem", color: "var(--text-secondary)",
              }}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
