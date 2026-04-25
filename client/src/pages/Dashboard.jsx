import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ScoreGauge from "../components/ScoreGauge";
import SkillBadge from "../components/SkillBadge";
import JobCard from "../components/JobCard";
import {
  getHistory,
  suggestImprovements,
  suggestImprovementsFromText,
  optimizeResume,
  optimizeResumeFromText,
  generateInterviewQuestions,
} from "../api/client";

export default function Dashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [result] = useState(() => {
    if (state?.result) {
      sessionStorage.setItem("last_analysis", JSON.stringify(state.result));
      return state.result;
    }
    const cached = sessionStorage.getItem("last_analysis");
    return cached ? JSON.parse(cached) : null;
  });

  const file = state?.file || null;

  const [activeTab, setActiveTab] = useState("overview");
  const [suggestions, setSuggestions] = useState([]);
  const [optimized, setOptimized] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [interviewData, setInterviewData] = useState(null);

  if (!result) {
    return (
      <main style={{ textAlign: "center", padding: 40 }}>
        <h2>No resume analyzed</h2>
        <button onClick={() => navigate("/")}>Upload Resume</button>
      </main>
    );
  }

  const { filename, score, skills, job_matches } = result;

  // ===== ACTIONS =====

  const handleSuggest = async () => {
    const { data } = file
      ? await suggestImprovements(file)
      : await suggestImprovementsFromText(result.text, skills);

    setSuggestions(
      data.suggestions?.suggestions || data.suggestions || []
    );

    setActiveTab("suggestions");
  };

  const handleOptimize = async () => {
    const { data } = file
      ? await optimizeResume(file)
      : await optimizeResumeFromText(result.text, skills);

    const optimizeResult = data.optimized;

    let finalText = "";

    if (typeof optimizeResult === "string") {
      finalText = optimizeResult;
    } else if (optimizeResult?.optimized) {
      finalText = optimizeResult.optimized;
    } else if (optimizeResult?.suggestions) {
      finalText = optimizeResult.suggestions.join("\n");
    } else {
      finalText = "No optimization result";
    }

    setOptimized(finalText);
    setActiveTab("fix");
  };

  const handleHistory = async () => {
    const { data } = await getHistory(10);
    setHistoryItems(data.history || []);
    setActiveTab("history");
  };

  const handleInterview = async () => {
    const { data } = await generateInterviewQuestions(file);
    setInterviewData(data);
    setActiveTab("interview");
  };

  // ===== UI =====

  return (
    <main className="container" style={{ marginTop: 30 }}>
      <h1 className="gradient-text" style={{ marginBottom: 20 }}>
        📊 Dashboard - {filename}
      </h1>

      {/* ===== TOP SECTION ===== */}
      <div className="dashboard-shell">
        
        {/* LEFT MAIN */}
        <div className="dashboard-main">

          {/* SCORE + ACTIONS */}
          <div className="card">
            <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
              
              {/* SCORE */}
              <div style={{ textAlign: "center" }}>
                <ScoreGauge score={score.total} />
                <p style={{ marginTop: 10 }}>ATS Score</p>
              </div>

              {/* ACTIONS */}
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: 10 }}>Actions</h3>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-primary" onClick={handleSuggest}>
                    💡 Suggestions
                  </button>

                  <button className="btn btn-success" onClick={handleOptimize}>
                    ✍️ Fix Resume
                  </button>

                  <button className="btn btn-ghost" onClick={handleHistory}>
                    🗂 History
                  </button>

                  <button className="btn btn-ghost" onClick={handleInterview}>
                    🎤 Interview
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SKILLS */}
          <div className="card">
            <h3 className="section-title">Skills</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {skills.map((s) => (
                <SkillBadge key={s} skill={s} />
              ))}
            </div>
          </div>

          {/* JOB MATCHES */}
          <div className="card">
            <h3 className="section-title">Job Matches</h3>
            {job_matches.map((job, i) => (
              <JobCard key={i} job={job} />
            ))}
          </div>

          {/* DYNAMIC OUTPUT */}
          {activeTab === "suggestions" && (
            <div className="card">
              <h3>Suggestions</h3>
              <ul>
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "fix" && (
            <div className="card">
              <h3>Optimized Resume</h3>
              <pre>{optimized}</pre>
            </div>
          )}

          {activeTab === "history" && (
            <div className="card">
              <h3>History</h3>
              {historyItems.map((h, i) => (
                <p key={i}>
                  {h.filename} - {h.score?.total}
                </p>
              ))}
            </div>
          )}

          {activeTab === "interview" && (
            <div className="card">
              <h3>Interview Questions</h3>

              <h4>Technical</h4>
              {interviewData?.questions?.technical?.map((q, i) => (
                <p key={i}>⚙️ {q}</p>
              ))}

              <h4>Behavioral</h4>
              {interviewData?.questions?.behavioral?.map((q, i) => (
                <p key={i}>🤝 {q}</p>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE PANEL */}
        <div className="insight-rail">
          <div className="card insight-rail-card">
            <h3 className="section-title">Insights</h3>

            <div className="insight-stack">
              <div className="insight-item">
                <p><b>Score:</b> {score.total}</p>
              </div>

              <div className="insight-item">
                <p><b>Skills:</b> {skills.length}</p>
              </div>

              <div className="insight-item">
                <p><b>Matches:</b> {job_matches.length}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}