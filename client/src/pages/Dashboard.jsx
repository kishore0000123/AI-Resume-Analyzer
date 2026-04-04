import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ScoreGauge from "../components/ScoreGauge";
import SkillBadge from "../components/SkillBadge";
import {
  getHistory,
  suggestImprovements,
  suggestImprovementsFromText,
  optimizeResume,
  optimizeResumeFromText,
} from "../api/client";

function JobCard({ job, index }) {
  return (
    <div 
      className="card section-fade" 
      style={{ 
        animationDelay: `${index * 0.1}s`,
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: "1.5rem" }}>{job.icon || "💼"}</div>
        <div style={{ 
          fontSize: "0.75rem", 
          fontWeight: 700, 
          padding: "4px 10px", 
          borderRadius: 99, 
          background: "rgba(108,99,255,0.1)", 
          color: "var(--accent-1)" 
        }}>
          {job.match_percent}% Match
        </div>
      </div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>{job.role}</h3>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16 }}>{job.description}</p>
      
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          Key Skills
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(job.skills || []).slice(0, 4).map(s => (
            <span key={s} style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 4, background: "var(--bg-body)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  const file = state?.file || null;
  const [suggestions, setSuggestions] = useState(null);
  const [suggestSections, setSuggestSections] = useState(null);
  const [quickWins, setQuickWins] = useState([]);
  const [suggestMode, setSuggestMode] = useState(null); 
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [optimized, setOptimized] = useState(null);
  const [optimizeMode, setOptimizeMode] = useState(null);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyMsg, setHistoryMsg] = useState("");
  const [actionError, setActionError] = useState("");
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
  const canUseTextFallback = Boolean(result?.text && result.text.trim().length >= 50);
  const breakdownMax = {
    skills: 30,
    sections: 25,
    length: 20,
    keyword_density: 15,
    achievements: 10,
  };

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

      const optimizeResult = data.optimized;
      let improvedText = "";
      let mode = "offline";

      if (typeof optimizeResult === "string") {
        improvedText = optimizeResult;
      } else if (optimizeResult?.optimized) {
        improvedText = optimizeResult.optimized;
        mode = optimizeResult.mode || "offline";
      } else if (optimizeResult?.suggestions) {
        improvedText = (optimizeResult.suggestions || []).join("\n");
        mode = "offline";
      }

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

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "skills", label: "Skills", icon: "🧠" },
    { id: "jobs", label: "Job Matches", icon: "💼" },
    { id: "fix", label: "Fix My Resume", icon: "✍️" },
    { id: "suggestions", label: "Get Suggestions", icon: "💡" },
    { id: "history", label: "History", icon: "🗂️" },
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

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-primary" onClick={() => navigate("/generate")}>
              🛠 Generate Resume
            </button>
            <button className="btn btn-ghost" onClick={handleSuggest} disabled={loadingSuggest || (!file && !canUseTextFallback)}>
              {loadingSuggest ? "Loading…" : "💡 Get Suggestions"}
            </button>
            <button className="btn btn-ghost" onClick={handleOptimize} disabled={loadingOptimize || (!file && !canUseTextFallback)}>
              {loadingOptimize ? "Optimizing…" : "✍️ Fix My Resume"}
            </button>
          </div>

          {actionError && (
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(244,63,94,0.35)", background: "rgba(244,63,94,0.1)", color: "var(--danger)", fontSize: "0.88rem" }}>
              {actionError}
            </div>
          )}
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
            <div className="card" style={{ textAlign: "center" }}>
              <div className="section-title" style={{ justifyContent: "center" }}>🎯 Resume Score</div>
              <ScoreGauge score={score.total} />
              <div style={{ marginTop: 24 }}>
                {Object.entries(score.breakdown).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-2)" }}>{Math.round((val / (breakdownMax[key] || 100)) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="card">
                <div className="section-title">✅ Strengths</div>
                {score.strengths.length > 0 ? (
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {score.strengths.map((s, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(34,211,164,0.07)", border: "1px solid rgba(34,211,164,0.15)" }}>
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
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)" }}>
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
            <div style={{ marginTop: 32 }}>
              <div className="section-title">📋 Resume Sections</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {Object.entries(score.sections_found).map(([section, found]) => (
                  <div key={section} style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: found ? "rgba(34,211,164,0.08)" : "rgba(244,63,94,0.06)", border: `1px solid ${found ? "rgba(34,211,164,0.2)" : "rgba(244,63,94,0.15)"}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{found ? "✅" : "❌"}</span>
                    <span style={{ fontSize: "0.875rem", textTransform: "capitalize", color: found ? "var(--success)" : "var(--text-secondary)" }}>{section}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── JOBS TAB ────────────────────────────────────── */}
        {activeTab === "jobs" && (
          <div>
            <div style={{ marginBottom: 20, color: "var(--text-secondary)" }}>Top job roles ranked by your current resume profile:</div>
            {bestRole && (
              <div className="card" style={{ marginBottom: 16, background: "rgba(34,211,164,0.08)", borderColor: "rgba(34,211,164,0.22)" }}>
                <div className="section-title" style={{ marginBottom: 8 }}>🔥 Best Role Suggestion</div>
                <p style={{ margin: 0, color: "var(--text-primary)" }}>{bestRole.icon} <strong>{bestRole.role}</strong> ({bestRole.match_percent}%)</p>
              </div>
            )}
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {job_matches.map((job, i) => <JobCard key={job.role} job={job} index={i} />)}
            </div>
          </div>
        )}

        {/* ─── FIX TAB ─────────────────────────────────────── */}
        {activeTab === "fix" && (
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>✨ Resume Improvement Dashboard</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Compare your original resume with AI-enhanced version</p>
                </div>
              </div>
            </div>

            {!optimized ? (
              <div className="card" style={{ textAlign: "center", padding: "48px 28px" }}>
                <p style={{ fontSize: "3rem", marginBottom: 16 }}>✍️</p>
                <p style={{ color: "var(--text-secondary)", marginBottom: 22, fontSize: "1rem" }}>Generate an improved, ATS-friendly version of your resume content.</p>
                <button className="btn btn-primary" onClick={handleOptimize} disabled={loadingOptimize || (!file && !canUseTextFallback)}>
                  {loadingOptimize ? "Optimizing…" : "✍️ Improve My Resume"}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                  <div className="card" style={{ border: "1px solid rgba(108,99,255,0.3)", background: "rgba(108,99,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: "1.4rem" }}>📄</span>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-1)", margin: 0 }}>Original Resume</h3>
                    </div>
                    <div style={{ height: "400px", overflowY: "auto", padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {result?.text || "No resume text available"}
                    </div>
                  </div>
                  <div className="card" style={{ border: "1px solid rgba(34,211,164,0.3)", background: "rgba(34,211,164,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: "1.4rem" }}>✨</span>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--success)", margin: 0 }}>Improved Resume</h3>
                    </div>
                    <div style={{ height: "400px", overflowY: "auto", padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text-primary)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {optimized || "Processing..."}
                    </div>
                  </div>
                </div>
                <div className="card" style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button className="btn btn-primary" onClick={handleOptimize} disabled={loadingOptimize || (!file && !canUseTextFallback)} style={{ flex: "1 1 auto", minWidth: 160 }}>{loadingOptimize ? "Regenerating…" : "🔄 Regenerate"}</button>
                    <button className="btn btn-success" onClick={handleDownloadOptimized} disabled={!optimized} style={{ flex: "1 1 auto", minWidth: 160 }}>⬇ Download (.txt)</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SUGGESTIONS TAB ─────────────────────────────── */}
        {activeTab === "suggestions" && (
          <div className="card">
            <div className="section-title">💡 Get Suggestions</div>
            {suggestions ? (
              <div style={{ display: "grid", gap: 16 }}>
                {quickWins.length > 0 && (
                  <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }}>
                    <div className="section-title" style={{ fontSize: "0.95rem", marginBottom: 8 }}>⚡ Quick Wins</div>
                    <ul style={{ paddingLeft: 18, color: "var(--text-primary)", lineHeight: 1.65 }}>
                      {quickWins.map((tip) => <li key={tip}>{tip}</li>)}
                    </ul>
                  </div>
                )}
                {suggestSections && Object.entries(suggestSections).map(([section, items]) => (
                  items?.length ? (
                    <div key={section} style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "capitalize", marginBottom: 8 }}>{section.replace(/_/g, " ")}</div>
                      <ul style={{ paddingLeft: 18, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                        {items.map((tip) => <li key={tip}>{tip}</li>)}
                      </ul>
                    </div>
                  ) : null
                ))}
                <ol style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                  {suggestions.map((s, i) => (
                    <li key={`${s}-${i}`} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                      <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                      <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "var(--text-primary)", marginTop: 2 }}>{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Get short improvement tips only.</p>
                <button className="btn btn-primary" onClick={handleSuggest} disabled={loadingSuggest || (!file && !canUseTextFallback)}>{loadingSuggest ? "Loading…" : "💡 Get Suggestions"}</button>
              </div>
            )}
          </div>
        )}

        {/* ─── HISTORY TAB ─────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="card">
            <div className="section-title">🗂️ Analysis History</div>
            {loadingHistory ? <div style={{ padding: "16px 0", color: "var(--text-secondary)" }}>Loading history...</div> : historyItems.length === 0 ? <div style={{ padding: "16px 0", color: "var(--text-muted)" }}>No history yet.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {historyItems.map((item, idx) => (
                  <div key={`${item.filename}-${idx}`} style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--text-primary)" }}>{item.filename || "Untitled resume"}</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Score: {item?.score?.total ?? "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
