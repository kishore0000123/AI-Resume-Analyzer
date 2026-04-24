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
  jdMatch,
  jdMatchFromText,
  generateInterviewQuestions,
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

  // DESTRUCTURE NEW SCORE ARCHITECTURE
  const { filename, score, skills, job_matches, best_role } = result;
  const { total, breakdown, missing_skills, weak_sections, suggestions: aiSuggestions } = score;

  const canUseTextFallback = Boolean(result?.text && result.text.trim().length >= 50);
  const topJobMatch = job_matches?.[0] || null;
  const topMissingSkills = missing_skills?.slice(0, 4) || [];

  const breakdownMax = {
    skills: 30,
    sections: 25,
    length: 20,
    keyword_density: 15,
    achievements: 10
  };

  const handleOpenTab = async (tabId) => {
    setActiveTab(tabId);
    if (tabId !== "history" || historyItems.length > 0 || loadingHistory) return;
    setLoadingHistory(true);
    setHistoryMsg("");
    try {
      const { data } = await getHistory(20);
      setHistoryItems(data.history ?? []);
      if (data.available === false) setHistoryMsg(data.message || "History unavailable.");
    } catch (e) {
      setHistoryMsg("Failed to load history.");
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
      setActionError("Failed to get suggestions.");
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
      const { data } = file ? await optimizeResume(file) : await optimizeResumeFromText(result.text, skills);
      const res = data.optimized;
      setOptimized(typeof res === "string" ? res : res?.optimized || (res?.suggestions || []).join("\n"));
      setOptimizeMode(res?.mode || "offline");
      setActiveTab("fix");
    } catch (e) {
      setActionError("Failed to optimize resume.");
    } finally {
      setLoadingOptimize(false);
    }
  };

  const handleJdMatch = async () => {
    if (!jdText.trim() || jdText.length < 20) {
      setActionError("Paste a longer job description.");
      return;
    }
    setLoadingJd(true);
    setActionError("");
    try {
      const { data } = file ? await jdMatch(file, jdText) : await jdMatchFromText(result.text, jdText, skills);
      setJdResult(data);
    } catch (e) {
      setActionError("Failed to run JD match.");
    } finally {
      setLoadingJd(false);
    }
  };

  const handleGenerateInterview = async () => {
    if (!file) return;
    setLoadingInterview(true);
    try {
      const { data } = await generateInterviewQuestions(file);
      setInterviewData(data);
      setActiveTab("interview");
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
    { id: "suggestions", label: "Get Suggestions", icon: "💡" },
    { id: "interview", label: "Interview Prep", icon: "🎤" },
    { id: "history", label: "History", icon: "🗂️" },
  ];

  return (
    <main style={{ padding: "40px 0 100px" }}>
      <div className="container">
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: 8 }}>
              Analysis for <span className="gradient-text">{filename}</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>Detailed breakdown of your resume's performance.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => navigate("/")}>← Upload New</button>
            <button className="btn btn-primary" onClick={() => navigate("/generate")}>🛠 Build Resume</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>
          <div>
            {/* Tab Strip */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => handleOpenTab(tab.id)}
                  style={{ whiteSpace: "nowrap", padding: "10px 20px" }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "overview" && (
                <div style={{ display: "grid", gap: 24 }}>
                  {/* Score & Progress Panel */}
                  <div className="card" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 40, padding: 40, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div className="section-title" style={{ justifyContent: "center", marginBottom: 20 }}>🎯 Overall Score</div>
                      <ScoreGauge score={total} />
                    </div>
                    <div>
                      <div className="section-title" style={{ marginBottom: 20 }}>📊 Detailed Breakdown</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 40px" }}>
                        {Object.entries(breakdown).map(([key, val]) => (
                          <div key={key}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem" }}>
                              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                              <span style={{ color: "var(--accent-1)", fontWeight: 700 }}>
                                {Math.round((val / (breakdownMax[key] || 100)) * 100)}%
                              </span>
                            </div>
                            <div className="progress-bar-track">
                              <div className="progress-bar-fill" style={{ width: `${(val / (breakdownMax[key] || 100)) * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Explainable Insights */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    {/* Weak Sections */}
                    <div className="card" style={{ background: "rgba(244,63,94,0.02)" }}>
                      <h3 style={{ fontSize: "1.1rem", color: "var(--danger)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>⚠️</span> Weak Sections
                      </h3>
                      {weak_sections && weak_sections.length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                          {weak_sections.map(sec => (
                            <li key={sec} style={{ color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                              <span style={{ color: "var(--danger)" }}>✗</span> Missing or weak {sec}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: "var(--success)", margin: 0, fontSize: "0.9rem" }}>✓ All critical sections are present!</p>
                      )}
                    </div>

                    {/* Missing Skills */}
                    <div className="card" style={{ background: "rgba(245,158,11,0.02)" }}>
                      <h3 style={{ fontSize: "1.1rem", color: "var(--warning)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📉</span> Missing Skills
                      </h3>
                      {missing_skills && missing_skills.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {missing_skills.slice(0, 8).map(skill => (
                            <SkillBadge key={skill} skill={skill} variant="warning" />
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: "var(--success)", margin: 0, fontSize: "0.9rem" }}>✓ Strong skill coverage detected.</p>
                      )}
                    </div>

                    {/* AI Suggestions */}
                    <div className="card" style={{ background: "rgba(34,211,164,0.02)" }}>
                      <h3 style={{ fontSize: "1.1rem", color: "var(--success)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>💡</span> Actionable Insights
                      </h3>
                      {aiSuggestions && aiSuggestions.length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                          {aiSuggestions.slice(0, 3).map((sug, i) => (
                            <li key={i} style={{ color: "var(--text-primary)", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5, fontSize: "0.9rem" }}>
                              <span style={{ color: "var(--success)", marginTop: "2px" }}>✓</span> {sug}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>Resume looks solid.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="card">
                  <div className="section-title">🧠 Extracted Skills ({skills.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {skills.map(s => <SkillBadge key={s} skill={s} variant="primary" />)}
                  </div>
                </div>
              )}

              {activeTab === "jobs" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                  {job_matches.map((job, i) => <JobCard key={job.role} job={job} index={i} />)}
                </div>
              )}

              {activeTab === "jd" && (
                <div className="card">
                  <div className="section-title">🧩 Match Against Job Description</div>
                  <textarea
                    className="resume-textarea"
                    placeholder="Paste the Job Description here..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    style={{ minHeight: 200, marginBottom: 16 }}
                  />
                  <button className="btn btn-primary" onClick={handleJdMatch} disabled={loadingJd}>
                    {loadingJd ? "Analyzing..." : "Check Match Score"}
                  </button>
                  {jdResult && (
                    <div style={{ marginTop: 24, padding: "20px", background: "var(--bg-body)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 12 }}>Match Score: {jdResult.match_percent}%</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--success)" }}>Matched Skills</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {jdResult.matched_skills.map(s => <SkillBadge key={s} skill={s} variant="success" />)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--warning)" }}>Missing Keywords</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {jdResult.missing_skills.map(s => <SkillBadge key={s} skill={s} variant="warning" />)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "fix" && (
                <div className="card">
                  <div className="section-title">✍️ AI Resume Fixer</div>
                  {!optimized ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Generate an ATS-optimized version of your resume content.</p>
                      <button className="btn btn-primary" onClick={handleOptimize} disabled={loadingOptimize}>
                        {loadingOptimize ? "Generating..." : "Improve My Content"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 20 }}>
                      <div style={{ padding: "20px", background: "#f9fafb", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.9rem" }}>
                        {optimized}
                      </div>
                      <button className="btn btn-primary" onClick={() => {
                        const blob = new Blob([optimized], { type: "text/plain" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "optimized_resume.txt";
                        a.click();
                      }}>Download as Text</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "suggestions" && (
                <div className="card">
                  <div className="section-title">💡 Content Suggestions</div>
                  {!suggestions ? (
                    <button className="btn btn-primary" onClick={handleSuggest} disabled={loadingSuggest}>
                      {loadingSuggest ? "Analyzing..." : "Get AI Suggestions"}
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {quickWins.length > 0 && (
                        <div style={{ padding: "16px", background: "rgba(34,211,164,0.1)", borderRadius: "var(--radius-md)", border: "1px solid var(--success)" }}>
                          <div style={{ fontWeight: 700, color: "var(--success)", marginBottom: 8 }}>⚡ Quick Wins</div>
                          <ul style={{ paddingLeft: 20 }}>{quickWins.map((w, i) => <li key={i}>{w}</li>)}</ul>
                        </div>
                      )}
                      <ul style={{ paddingLeft: 20 }}>{suggestions.map((s, i) => <li key={i} style={{ marginBottom: 12 }}>{s}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "interview" && (
                <div className="card">
                  <div className="section-title">🎤 Interview Preparation</div>
                  {!interviewData ? (
                    <button className="btn btn-primary" onClick={handleGenerateInterview} disabled={loadingInterview}>
                      {loadingInterview ? "Generating..." : "Generate Interview Questions"}
                    </button>
                  ) : (
                    <div style={{ display: "grid", gap: 24 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--accent-1)", marginBottom: 12 }}>Technical Questions</div>
                        <ul style={{ paddingLeft: 20 }}>{interviewData.questions.technical.map((q, i) => <li key={i} style={{ marginBottom: 8 }}>{q}</li>)}</ul>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--accent-2)", marginBottom: 12 }}>Behavioral Questions</div>
                        <ul style={{ paddingLeft: 20 }}>{interviewData.questions.behavioral.map((q, i) => <li key={i} style={{ marginBottom: 8 }}>{q}</li>)}</ul>
                      </div>
                    </div>
                  )}
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

                  {/* Actionable Suggestions */}
                  <div style={{ background: "rgba(34,211,164,0.05)", border: "1px solid rgba(34,211,164,0.15)", borderRadius: "var(--radius-md)", padding: "20px" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--success)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>💡</span> Actionable Insights
                    </h3>
                    {suggestions && suggestions.length > 0 ? (
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {suggestions.map((sug, i) => (
                          <li key={i} style={{ color: "var(--text-primary)", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
                            <span style={{ color: "var(--success)", marginTop: "2px" }}>✓</span> {sug}
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

          {/* Right Insight Rail */}
              <aside>
                <div className="card" style={{ position: "sticky", top: 40 }}>
                  <div className="section-title">🧠 AI Insight Rail</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ padding: "12px", background: "rgba(108,99,255,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(108,99,255,0.1)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}>TOP SKILL GAP</div>
                      <div style={{ color: "var(--warning)", fontWeight: 800 }}>{topMissingSkills[0] || "None"}</div>
                    </div>
                    <div style={{ padding: "12px", background: "rgba(34,211,164,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(34,211,164,0.1)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}>TARGETING</div>
                      <div style={{ color: "var(--success)", fontWeight: 800 }}>{best_role?.role || "Analyzing..."}</div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      💡 <strong>Tip:</strong> Improving your word count to 400+ words can increase your ATS score by up to 15%.
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
        );
}