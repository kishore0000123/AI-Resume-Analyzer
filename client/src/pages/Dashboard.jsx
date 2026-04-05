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

  const { skills, score, job_matches, filename } = result;
  const bestRole = result.best_role;
  const canUseTextFallback = Boolean(result?.text && result.text.trim().length >= 50);
  const topJobMatch = job_matches?.[0] || null;
  const topMissingSkills = topJobMatch?.missing_skills?.slice(0, 4) || [];

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

  const heroMetricCards = [
    { label: "Resume Score", value: `${score.total}%`, hint: "Overall ATS health", tone: "primary" },
    { label: "Detected Skills", value: `${skills.length}`, hint: "Keywords extracted", tone: "info" },
    { label: "Best Role Fit", value: topJobMatch ? `${topJobMatch.match_percent}%` : "N/A", hint: topJobMatch?.role || "No match yet", tone: "success" },
    { label: "Word Count", value: `${score.word_count}`, hint: "Content depth", tone: "warning" },
  ];

  return (
    <main style={{ padding: "40px 0 100px" }}>
      <div className="container">
        {/* Hero Section */}
        <section className="card" style={{ marginBottom: 32, padding: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--accent-2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>ATS Resume Analyzer</div>
              <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: 8 }}>
                Analysis for <span className="gradient-text">{filename}</span>
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>Professional resume insights and AI-powered improvement tools.</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => navigate("/")}>← Upload New</button>
              <button className="btn btn-primary" onClick={() => navigate("/generate")}>🛠 Build Resume</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 }}>
            {heroMetricCards.map((card) => (
              <div key={card.label} style={{ padding: "20px", borderRadius: "var(--radius-md)", background: "var(--bg-body)", border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>{card.value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>{card.hint}</div>
              </div>
            ))}
          </div>

          {actionError && <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", background: "rgba(244,63,94,0.1)", border: "1px solid var(--danger)", color: "var(--danger)", fontSize: "0.9rem" }}>{actionError}</div>}
        </section>

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
                  <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                    <div className="section-title" style={{ justifyContent: "center" }}>🎯 Resume Health Score</div>
                    <ScoreGauge score={score.total} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginTop: 32 }}>
                      {Object.entries(score.breakdown).map(([key, val]) => (
                        <div key={key}>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{val} pts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div className="card">
                      <div className="section-title">✅ Key Strengths</div>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {score.strengths.map((s, i) => <li key={i} style={{ marginBottom: 12, fontSize: "0.9rem", display: "flex", gap: 10 }}><span style={{ color: "var(--success)" }}>✓</span> {s}</li>)}
                      </ul>
                    </div>
                    <div className="card">
                      <div className="section-title">⚠️ Areas for Growth</div>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {score.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: 12, fontSize: "0.9rem", display: "flex", gap: 10 }}><span style={{ color: "var(--danger)" }}>✗</span> {w}</li>)}
                      </ul>
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

              {activeTab === "history" && (
                <div className="card">
                  <div className="section-title">🗂️ Analysis History</div>
                  {historyItems.length === 0 ? <p style={{ color: "var(--text-muted)" }}>{historyMsg || "No history found."}</p> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {historyItems.map((item, i) => (
                        <div key={i} style={{ padding: "12px 16px", background: "var(--bg-body)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                          <strong>{item.filename}</strong>
                          <span>Score: {item.score.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
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
                  <div style={{ color: "var(--success)", fontWeight: 800 }}>{bestRole?.role || "Analyzing..."}</div>
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