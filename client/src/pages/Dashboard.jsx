import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ScoreGauge from "../components/ScoreGauge";
import JobCard from "../components/JobCard";
import SkillBadge from "../components/SkillBadge";
import {
  getHistory,
  suggestImprovements,
  suggestImprovementsFromText,
  optimizeResume,
  optimizeResumeFromText,
  jdMatch,
  jdMatchFromText,
  generateInterviewQuestions,
} from "../api/client";

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
  const [suggestSections, setSuggestSections] = useState(null);
  const [quickWins, setQuickWins] = useState([]);
  const [suggestMode, setSuggestMode] = useState(null); // "ai" | "offline"
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [jdText, setJdText] = useState("");
  const [jdResult, setJdResult] = useState(null);
  const [loadingJd, setLoadingJd] = useState(false);

  const [optimized, setOptimized] = useState(null);
  const [optimizeMode, setOptimizeMode] = useState(null);
  const [loadingOptimize, setLoadingOptimize] = useState(false);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyMsg, setHistoryMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Interview Questions state
  const [interviewData, setInterviewData] = useState(null);
  const [loadingInterview, setLoadingInterview] = useState(false);

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
  const canUseTextFallback = Boolean(result?.text && result.text.trim().length >= 50);

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
    if (!file && !canUseTextFallback) {
      setActionError("Re-upload resume to use this feature.");
      return;
    }

    setLoadingSuggest(true);
    setActionError("");
    try {
      const { data } = file
        ? await suggestImprovements(file)
        : await suggestImprovementsFromText(result.text, skills);

      setSuggestions(data.suggestions?.suggestions ?? data.suggestions ?? []);
      setSuggestSections(data.suggestions?.sections ?? null);
      setQuickWins(data.suggestions?.quick_wins ?? []);
      setSuggestMode(data.suggestions?.mode ?? "offline");
      setActiveTab("suggestions");
    } catch (e) {
      console.error(e);
      setActionError(e?.response?.data?.detail || "Failed to get suggestions.");
    } finally {
      setLoadingSuggest(false);
    }
  };

  const handleJdMatch = async () => {
    if (!jdText.trim() || jdText.trim().length < 20) {
      setActionError("Paste a larger job description (at least 20 characters).");
      return;
    }

    if (!file && !canUseTextFallback) {
      setActionError("Re-upload resume to use this feature.");
      return;
    }

    setLoadingJd(true);
    setActionError("");
    try {
      const { data } = file
        ? await jdMatch(file, jdText)
        : await jdMatchFromText(result.text, jdText, skills);
      setJdResult(data);
    } catch (e) {
      console.error(e);
      setActionError(e?.response?.data?.detail || "Failed to run JD matching.");
    } finally {
      setLoadingJd(false);
    }
  };

  const handleOptimize = async () => {
    if (!file && !canUseTextFallback) {
      setActionError("Re-upload resume to use this feature.");
      return;
    }

    setLoadingOptimize(true);
    setActionError("");
    try {
      const { data } = file
        ? await optimizeResume(file)
        : await optimizeResumeFromText(result.text, skills);
      
      // Backend returns: { optimized: { mode, optimized, suggestions } }
      const optimizeResult = data.optimized;
      let improvedText = "";
      let mode = "offline";
      
      if (typeof optimizeResult === "string") {
        improvedText = optimizeResult;
      } else if (optimizeResult?.optimized) {
        improvedText = optimizeResult.optimized;
        mode = optimizeResult.mode || "offline";
      } else if (optimizeResult?.suggestions) {
        // Offline mode: no optimized text, just suggestions
        improvedText = (optimizeResult.suggestions || []).join("\n");
        mode = "offline";
      }
      
      console.log("Optimize response:", { raw: optimizeResult, processed: improvedText, mode });
      setOptimized(improvedText || "Unable to generate improvements. Try again.");
      setOptimizeMode(mode);
      setActiveTab("fix");
    } catch (e) {
      console.error(e);
      setActionError(e?.response?.data?.detail || "Failed to optimize resume.");
    } finally {
      setLoadingOptimize(false);
    }
  };

  const handleDownloadOptimized = () => {
    if (!optimized) return;
    const blob = new Blob([optimized], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "improved_resume.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateInterview = async () => {
    if (!file) return;
    setLoadingInterview(true);
    try {
      const { data } = await generateInterviewQuestions(file);
      setInterviewData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInterview(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "skills", label: "Skills", icon: "🧠" },
    { id: "jobs", label: "Job Matches", icon: "💼" },
    { id: "jd", label: "JD Match", icon: "🧩" },
    { id: "fix", label: "Fix My Resume", icon: "✍️" },
    { id: "interview", label: "Interview Prep", icon: "🎤" },
    { id: "history", label: "History", icon: "🗂️" },
    { id: "suggestions", label: "Get Suggestions", icon: "💡" },
  ];

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container">
        <div className="dashboard-shell">
          <div className="dashboard-main">
            {/* Hero */}
            <section className="dashboard-hero card">
              <div className="dashboard-hero-top">
                <div>
                  <div className="dashboard-eyebrow">ATS Resume Analyzer</div>
                  <h1 className="dashboard-title">
                    Analysis for <span className="gradient-text">{filename}</span>
                  </h1>
                  <p className="dashboard-subtitle">
                    Professional resume insights, job matching, and AI rewrite tools in one place.
                  </p>
                </div>

          {/* AI action buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {!file && !canUseTextFallback && (
              <span style={{ fontSize: "0.8rem", color: "var(--warning)", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 99, padding: "4px 12px" }}>
               
              </span>
            )}
            <button
              className="btn btn-primary"
              onClick={() => navigate("/generate")}
              title="Open Resume Builder"
            >
              🛠 Generate Resume
            </button>
            <button
              id="suggest-btn"
              className="btn btn-ghost"
              onClick={handleSuggest}
              disabled={loadingSuggest || (!file && !canUseTextFallback)}
              title={!file && !canUseTextFallback ? "Re-upload your resume to get AI suggestions" : ""}
            >
              {loadingSuggest ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading…</> : "💡 Get Suggestions"}
            </button>

          </div>
            </div>

              <div className="dashboard-hero-footer">
                <span className="status-pill status-pill-info">{skills.length} skills detected</span>
                <span className="status-pill status-pill-success">{score.word_count} words analyzed</span>
                <span className="status-pill status-pill-primary">{bestRole?.role || "Role ranking pending"}</span>
                {!file && !canUseTextFallback && <span className="status-pill status-pill-warning">Re-upload resume to enable AI actions</span>}
              </div>

              {actionError && <div className="alert-box alert-error">{actionError}</div>}
            </section>

            <div className="tab-strip">
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

            {loadingSuggest && <div className="loading-banner">Analyzing resume suggestions...</div>}
            {loadingJd && <div className="loading-banner">Matching resume to the job description...</div>}
            {loadingOptimize && <div className="loading-banner">Generating improved resume content...</div>}

            {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="overview-grid">

            {/* Score card */}
            <div className="card insight-score-card" style={{ textAlign: "center" }}>
              <div className="section-title" style={{ justifyContent: "center" }}>🎯 Resume Score</div>
              <ScoreGauge score={score.total} />

              <div style={{ marginTop: 24 }}>
                {Object.entries(score.breakdown).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-2)" }}>
                      {Math.round((val / (breakdownMax[key] || 100)) * 100)}%
                    </span>
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
              Top job roles ranked by your current resume profile:
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
              <div className="section-title" style={{ margin: 0 }}>💡 Get Suggestions</div>
              {suggestMode === "ai" && (
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "3px 10px", borderRadius: 99,
                  background: suggestMode === "ai" ? "rgba(34,211,164,0.12)" : "rgba(245,158,11,0.12)",
                  color: suggestMode === "ai" ? "var(--success)" : "var(--warning)",
                  border: `1px solid ${suggestMode === "ai" ? "rgba(34,211,164,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}>
                  ✨ AI Mode
                </span>
              )}
            </div>
            {suggestions ? (
              <div style={{ display: "grid", gap: 16 }}>
                {quickWins.length > 0 && (
                  <div style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(56,189,248,0.08)",
                    border: "1px solid rgba(56,189,248,0.25)",
                  }}>
                    <div className="section-title" style={{ fontSize: "0.95rem", marginBottom: 8 }}>⚡ Quick Wins</div>
                    <ul style={{ paddingLeft: 18, color: "var(--text-primary)", lineHeight: 1.65 }}>
                      {quickWins.map((tip) => <li key={tip}>{tip}</li>)}
                    </ul>
                  </div>
                )}

                {suggestSections && Object.entries(suggestSections).map(([section, items]) => (
                  items?.length ? (
                    <div key={section} style={{
                      padding: "14px 16px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                    }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "capitalize", marginBottom: 8 }}>
                        {section.replace(/_/g, " ")}
                      </div>
                      <ul style={{ paddingLeft: 18, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                        {items.map((tip) => <li key={tip}>{tip}</li>)}
                      </ul>
                    </div>
                  ) : null
                ))}

                <ol style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                  {suggestions.map((s, i) => (
                    <li key={`${s}-${i}`} style={{
                      display: "flex", gap: 16, alignItems: "flex-start",
                      padding: "14px 16px", borderRadius: "var(--radius-md)",
                      background: "var(--bg-surface)", border: "1px solid var(--border)",
                    }}>
                      <div style={{
                        minWidth: 28, height: 28, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", fontWeight: 700, color: "#fff",
                      }}>{i + 1}</div>
                      <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "var(--text-primary)", marginTop: 2 }}>{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                  Get short improvement tips only. This section does not rewrite your full resume.
                </p>
                <button className="btn btn-primary" onClick={handleSuggest} disabled={loadingSuggest || (!file && !canUseTextFallback)}>
                  {loadingSuggest ? "Loading…" : "💡 Get Suggestions"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── INTERVIEW PREP TAB ───────────────────────────── */}
        {activeTab === "interview" && (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div className="section-title" style={{ margin: 0 }}>🎤 Interview Prep</div>
              {interviewData?.mode === "ai" && (
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: "rgba(34,211,164,0.12)",
                  color: "var(--success)",
                  border: "1px solid rgba(34,211,164,0.3)",
                }}>
                  ✨ AI Mode
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: "0.9rem" }}>
              Get tailored interview questions based on your resume and detected best role.
            </p>

            {!interviewData ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                  {!file ? "Re-upload your resume to generate interview questions." : "Click below to generate questions tailored to your background."}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateInterview}
                  disabled={loadingInterview || !file}
                >
                  {loadingInterview ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</> : "🎤 Generate Questions"}
                </button>
              </div>
            ) : (
              <div>
                {interviewData.role && (
                  <div style={{ marginBottom: 20, padding: "10px 16px", borderRadius: "var(--radius-sm)",
                    background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                    color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    🎯 Questions tailored for: <strong style={{ color: "var(--text-primary)" }}>{interviewData.role}</strong>
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12, color: "var(--accent-2)" }}>⚙️ Technical Questions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(interviewData.questions?.technical || []).map((q, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start",
                        padding: "14px 18px", borderRadius: "var(--radius-md)",
                        background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                        <div style={{ minWidth: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                        <p style={{ fontSize: "0.92rem", lineHeight: 1.65, color: "var(--text-primary)", margin: 0, paddingTop: 3 }}>{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12, color: "#f59e0b" }}>🤝 Behavioral Questions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(interviewData.questions?.behavioral || []).map((q, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start",
                        padding: "14px 18px", borderRadius: "var(--radius-md)",
                        background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <div style={{ minWidth: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #f59e0b, #f97316)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                        <p style={{ fontSize: "0.92rem", lineHeight: 1.65, color: "var(--text-primary)", margin: 0, paddingTop: 3 }}>{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <button className="btn btn-ghost" onClick={handleGenerateInterview} disabled={loadingInterview || !file}>
                    {loadingInterview ? "Regenerating…" : "🔄 Regenerate"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="insight-rail">
        <div className="card insight-rail-card">
          <div className="section-title">🧠 AI Insight Panel</div>
          <div className="insight-stack">
            {insightCards.map((item) => (
              <div key={item.title} className="insight-item">
                <div className="insight-item-header">
                  <span className="insight-item-icon">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <p className="insight-item-body" style={{ color: item.accent }}>{item.body}</p>
              </div>
            ))}
          </div>

          {suggestions?.length > 0 && (
            <div className="insight-section">
              <div className="insight-section-title">Top Suggestions</div>
              <ul className="insight-list">
                {suggestions.slice(0, 4).map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}

          {topMissingSkills.length > 0 && (
            <div className="insight-section">
              <div className="insight-section-title">Skill Gaps</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {topMissingSkills.map((skill) => <SkillBadge key={skill} skill={skill} variant="warning" />)}
              </div>
            </div>
          )}

          <div className="insight-section">
            <div className="insight-section-title">Action Flow</div>
            <div className="insight-flow">
              <span className="status-pill status-pill-primary">1. Upload</span>
              <span className="status-pill status-pill-success">2. Analyze</span>
              <span className="status-pill status-pill-info">3. Improve</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</main>
  );
}
