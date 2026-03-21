import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ScoreGauge from "../components/ScoreGauge";
import JobCard from "../components/JobCard";
import SkillBadge from "../components/SkillBadge";
import { getHistory, optimizeResume, suggestImprovements } from "../api/client";

export default function Dashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Load from session storage if page refreshed
  const [result] = useState(() => {
    if (state?.result) {
      sessionStorage.setItem("last_analysis", JSON.stringify(state.result));
      return state.result;
    }
    const cached = sessionStorage.getItem("last_analysis");
    return cached ? JSON.parse(cached) : null;
  });

  // Note: the original File object cannot be easily saved to sessionStorage
  const file = state?.file || null;

  const [suggestions, setSuggestions] = useState(null);
  const [suggestMode, setSuggestMode] = useState(null);      // "ai" | "offline"
  const [optimized, setOptimized] = useState(null);
  const [optimizeMode, setOptimizeMode] = useState(null);    // "ai" | "offline"
  const [optimizeFallback, setOptimizeFallback] = useState(null); // list when offline
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyMsg, setHistoryMsg] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  if (!result) {
    return (
      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: "4rem", marginBottom: 24 }}>🤔</div>
          <h2 style={{ marginBottom: 12 }}>No resume analyzed yet</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>Upload a PDF to see your results here.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>← Upload Resume</button>
        </div>
      </main>
    );
  }

  const { skills, score, job_matches, filename } = result;
  const bestRole = result.best_role;

  const handleOpenTab = async (tabId) => {
    setActiveTab(tabId);
    if (tabId !== "history" || historyItems.length > 0 || loadingHistory) return;

    setLoadingHistory(true);
    setHistoryMsg("");
    try {
      const { data } = await getHistory(20);
      setHistoryItems(data.history ?? []);
      if (data.available === false) {
        setHistoryMsg(data.message || "History is currently unavailable.");
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed to load history.";
      setHistoryMsg(msg);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSuggest = async () => {
    if (!file) return;
    setLoadingSuggest(true);
    try {
      const { data } = await suggestImprovements(file);
      // Backend returns { suggestions: [...], mode: "ai" | "offline" }
      setSuggestions(data.suggestions?.suggestions ?? data.suggestions ?? []);
      setSuggestMode(data.suggestions?.mode ?? "offline");
      setActiveTab("suggestions");
    } catch (e) { console.error(e); }
    finally { setLoadingSuggest(false); }
  };

  const handleOptimize = async () => {
    if (!file) return;
    setLoadingOptimize(true);
    try {
      const { data } = await optimizeResume(file);
      // Backend returns { mode: "ai"|"offline", optimized: str, suggestions: [] }
      const mode = data.mode ?? data.optimized?.mode ?? "offline";
      const text = typeof data.optimized === "string" ? data.optimized : (data.optimized?.optimized ?? "");
      const tips = data.suggestions ?? data.optimized?.suggestions ?? [];
      setOptimizeMode(mode);
      setOptimized(text);
      setOptimizeFallback(tips);
      setActiveTab("optimized");
    } catch (e) { console.error(e); }
    finally { setLoadingOptimize(false); }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "skills", label: "Skills", icon: "🧠" },
    { id: "jobs", label: "Job Matches", icon: "💼" },
    { id: "history", label: "History", icon: "🗂️" },
    { id: "suggestions", label: "Suggestions", icon: "💡" },
    { id: "optimized", label: "Optimized", icon: "✨" },
  ];

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div>
            <button className="btn btn-ghost" style={{ marginBottom: 16, fontSize: "0.85rem" }} onClick={() => navigate("/")}>
              ← Upload Another
            </button>
            <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800 }}>
              Analysis for <span className="gradient-text">{filename}</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 6 }}>
              {skills.length} skills detected · {score.word_count} words
            </p>
          </div>

          {/* AI action buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {!file && (
              <span style={{ fontSize: "0.8rem", color: "var(--warning)", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 99, padding: "4px 12px" }}>
                ⚠ Re-upload to use AI features
              </span>
            )}
            <button
              id="suggest-btn"
              className="btn btn-ghost"
              onClick={handleSuggest}
              disabled={loadingSuggest || !file}
              title={!file ? "Re-upload your resume to get AI suggestions" : ""}
            >
              {loadingSuggest ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading…</> : "💡 Get Suggestions"}
            </button>
            <button
              id="optimize-btn"
              className="btn btn-success"
              onClick={handleOptimize}
              disabled={loadingOptimize || !file}
              title={!file ? "Re-upload your resume to optimize" : ""}
            >
              {loadingOptimize ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Optimizing…</> : "🚀 Optimize Resume"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleOpenTab(tab.id)}
              className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "8px 18px", fontSize: "0.875rem", whiteSpace: "nowrap" }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "280px 1fr", alignItems: "start" }}>

            {/* Score card */}
            <div className="card" style={{ textAlign: "center" }}>
              <div className="section-title" style={{ justifyContent: "center" }}>🎯 Resume Score</div>
              <ScoreGauge score={score.total} />

              <div style={{ marginTop: 24 }}>
                {Object.entries(score.breakdown).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-2)" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="card">
                <div className="section-title">✅ Strengths</div>
                {score.strengths.length > 0 ? (
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {score.strengths.map((s, i) => (
                      <li key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "10px 14px", borderRadius: "var(--radius-sm)",
                        background: "rgba(34,211,164,0.07)", border: "1px solid rgba(34,211,164,0.15)",
                      }}>
                        <span style={{ color: "var(--success)", marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: "var(--text-muted)" }}>No notable strengths detected.</p>}
              </div>

              <div className="card">
                <div className="section-title">⚠️ Areas to Improve</div>
                {score.weaknesses.length > 0 ? (
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {score.weaknesses.map((w, i) => (
                      <li key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "10px 14px", borderRadius: "var(--radius-sm)",
                        background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)",
                      }}>
                        <span style={{ color: "var(--danger)", marginTop: 1 }}>✗</span>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{w}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: "var(--text-muted)" }}>No major weaknesses detected!</p>}
              </div>
            </div>
          </div>
        )}

        {/* ─── SKILLS TAB ──────────────────────────────────── */}
        {activeTab === "skills" && (
          <div className="card">
            <div className="section-title">🧠 Detected Skills ({skills.length})</div>
            {skills.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {skills.map((s) => <SkillBadge key={s} skill={s} variant="primary" />)}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</p>
                <p>No skills detected. Make sure your resume clearly lists your tech stack.</p>
              </div>
            )}

            {/* Sections detected */}
            <div style={{ marginTop: 32 }}>
              <div className="section-title">📋 Resume Sections</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {Object.entries(score.sections_found).map(([section, found]) => (
                  <div key={section} style={{
                    padding: "12px 16px", borderRadius: "var(--radius-md)",
                    background: found ? "rgba(34,211,164,0.08)" : "rgba(244,63,94,0.06)",
                    border: `1px solid ${found ? "rgba(34,211,164,0.2)" : "rgba(244,63,94,0.15)"}`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span>{found ? "✅" : "❌"}</span>
                    <span style={{ fontSize: "0.875rem", textTransform: "capitalize", color: found ? "var(--success)" : "var(--text-secondary)" }}>
                      {section}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── JOBS TAB ────────────────────────────────────── */}
        {activeTab === "jobs" && (
          <div>
            <div style={{ marginBottom: 20, color: "var(--text-secondary)" }}>
              Top job roles based on your skill set:
            </div>
            {bestRole && (
              <div className="card" style={{ marginBottom: 16, background: "rgba(34,211,164,0.08)", borderColor: "rgba(34,211,164,0.22)" }}>
                <div className="section-title" style={{ marginBottom: 8 }}>🔥 Best Role Suggestion</div>
                <p style={{ margin: 0, color: "var(--text-primary)" }}>
                  {bestRole.icon} <strong>{bestRole.role}</strong> ({bestRole.match_percent}%)
                </p>
              </div>
            )}
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {job_matches.map((job, i) => <JobCard key={job.role} job={job} index={i} />)}
            </div>
          </div>
        )}

        {/* ─── HISTORY TAB ─────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="card">
            <div className="section-title">🗂️ Analysis History</div>
            {loadingHistory ? (
              <div style={{ padding: "16px 0", color: "var(--text-secondary)" }}>Loading history...</div>
            ) : historyMsg ? (
              <div style={{
                marginTop: 8, padding: "14px 18px",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "var(--radius-md)", color: "var(--warning)", fontSize: "0.9rem",
              }}>
                {historyMsg}
              </div>
            ) : historyItems.length === 0 ? (
              <div style={{ padding: "16px 0", color: "var(--text-muted)" }}>No history yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {historyItems.map((item, idx) => (
                  <div key={`${item.filename}-${idx}`} style={{
                    padding: "14px 16px", borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)", background: "var(--bg-surface)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--text-primary)" }}>{item.filename || "Untitled resume"}</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Score: {item?.score?.total ?? "N/A"}</span>
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Skills: {item.skills?.length ?? 0} · Matches: {item.job_matches?.length ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SUGGESTIONS TAB ─────────────────────────────── */}
        {activeTab === "suggestions" && (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div className="section-title" style={{ margin: 0 }}>💡 AI Improvement Suggestions</div>
              {suggestMode && (
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "3px 10px", borderRadius: 99,
                  background: suggestMode === "ai" ? "rgba(34,211,164,0.12)" : "rgba(245,158,11,0.12)",
                  color: suggestMode === "ai" ? "var(--success)" : "var(--warning)",
                  border: `1px solid ${suggestMode === "ai" ? "rgba(34,211,164,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}>
                  {suggestMode === "ai" ? "✨ AI Mode" : "⚡ Offline Mode"}
                </span>
              )}
            </div>
            {suggestions ? (
              <ol style={{ display: "flex", flexDirection: "column", gap: 16, listStyle: "none" }}>
                {suggestions.map((s, i) => (
                  <li key={i} style={{
                    display: "flex", gap: 16, alignItems: "flex-start",
                    padding: "16px 20px", borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                  }}>
                    <div style={{
                      minWidth: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.875rem", fontWeight: 700, color: "#fff",
                    }}>{i + 1}</div>
                    <p style={{ fontSize: "0.95rem", lineHeight: 1.65, color: "var(--text-primary)", marginTop: 4 }}>{s}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                  Click "Get Suggestions" to receive personalized AI tips for your resume.
                </p>
                <button className="btn btn-primary" onClick={handleSuggest} disabled={loadingSuggest || !file}>
                  {loadingSuggest ? "Loading…" : "💡 Get Suggestions"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── OPTIMIZED TAB ───────────────────────────────── */}
        {activeTab === "optimized" && (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div className="section-title" style={{ margin: 0 }}>✨ AI-Optimized Resume</div>
              {optimizeMode && (
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "3px 10px", borderRadius: 99,
                  background: optimizeMode === "ai" ? "rgba(34,211,164,0.12)" : "rgba(245,158,11,0.12)",
                  color: optimizeMode === "ai" ? "var(--success)" : "var(--warning)",
                  border: `1px solid ${optimizeMode === "ai" ? "rgba(34,211,164,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}>
                  {optimizeMode === "ai" ? "✨ AI Mode" : "⚡ Offline Mode"}
                </span>
              )}
            </div>

            {/* AI mode — full rewritten resume text */}
            {optimized && optimized.trim().length > 0 ? (
              <div>
                <div style={{
                  background: "var(--bg-surface)", borderRadius: "var(--radius-md)",
                  padding: "24px", border: "1px solid var(--border)",
                  whiteSpace: "pre-wrap", lineHeight: 1.8,
                  fontSize: "0.9rem", color: "var(--text-secondary)",
                  maxHeight: 600, overflowY: "auto",
                }}>
                  {optimized}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigator.clipboard.writeText(optimized)}
                  >
                    📋 Copy to Clipboard
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      const blob = new Blob([optimized], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Optimized_${filename.replace(".pdf", "")}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    📥 Download as Text
                  </button>
                </div>
              </div>

            /* Offline mode — show actionable tips */
            ) : optimizeFallback && optimizeFallback.length > 0 ? (
              <div>
                <div style={{
                  padding: "12px 16px", borderRadius: "var(--radius-sm)",
                  background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
                  fontSize: "0.85rem", color: "var(--warning)", marginBottom: 20,
                }}>
                  ⚡ OpenAI quota exceeded — showing rule-based optimization tips instead.
                  Add billing at platform.openai.com to get a full AI-rewritten resume.
                </div>
                <ol style={{ display: "flex", flexDirection: "column", gap: 14, listStyle: "none" }}>
                  {optimizeFallback.map((tip, i) => (
                    <li key={i} style={{
                      display: "flex", gap: 14, alignItems: "flex-start",
                      padding: "14px 18px", borderRadius: "var(--radius-md)",
                      background: "var(--bg-surface)", border: "1px solid var(--border)",
                    }}>
                      <div style={{
                        minWidth: 28, height: 28, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", fontWeight: 700, color: "#fff",
                      }}>{i + 1}</div>
                      <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "var(--text-primary)", marginTop: 2 }}>{tip}</p>
                    </li>
                  ))}
                </ol>
              </div>

            /* Not yet run */
            ) : optimizeMode == null ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                  Let AI rewrite your resume to be more impactful and ATS-friendly.
                </p>
                <button className="btn btn-success" onClick={handleOptimize} disabled={loadingOptimize || !file}>
                  {loadingOptimize ? "Optimizing…" : "🚀 Optimize My Resume"}
                </button>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </main>
  );
}
