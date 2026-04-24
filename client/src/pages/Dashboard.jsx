import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ScoreGauge from "../components/ScoreGauge";
import SkillBadge from "../components/SkillBadge";

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

  const { filename, score, skills } = result;
  
  // Destructure the new properties from score
  const { total, breakdown, missing_skills, weak_sections, low_keyword_match, suggestions } = score;

  // Breakdown max values based on the scoring logic in backend
  const breakdownMax = {
    skills: 30,
    sections: 25,
    length: 20,
    keyword_density: 15,
    achievements: 10
  };

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container">
        
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
              Analysis for <span className="gradient-text">{filename}</span>
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Detailed breakdown of your resume's performance and areas for improvement.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            Upload Another
          </button>
        </div>

        {/* Top Grid: Score & Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", marginBottom: "24px" }}>
          
          {/* Left Panel: Score Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div className="section-title" style={{ justifyContent: "center", marginBottom: "20px" }}>🎯 Overall Score</div>
            <ScoreGauge score={total} />
            <div style={{ marginTop: "20px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Based on industry standards and ATS best practices.
            </div>
          </div>

          {/* Right Panel: Breakdown Cards */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="section-title" style={{ marginBottom: "10px" }}>📊 Detailed Analysis</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              {/* Work Experience / Sections */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>Section Coverage</span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>
                    {Math.round((breakdown.sections / breakdownMax.sections) * 100)}/100
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${(breakdown.sections / breakdownMax.sections) * 100}%` }}></div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>Relevant Skills</span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>
                    {Math.round((breakdown.skills / breakdownMax.skills) * 100)}/100
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${(breakdown.skills / breakdownMax.skills) * 100}%` }}></div>
                </div>
              </div>

              {/* Keyword Match */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>Keyword Density</span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>
                    {Math.round((breakdown.keyword_density / breakdownMax.keyword_density) * 100)}/100
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${(breakdown.keyword_density / breakdownMax.keyword_density) * 100}%` }}></div>
                </div>
              </div>

              {/* Formatting / Length */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>Brevity & Length</span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>
                    {Math.round((breakdown.length / breakdownMax.length) * 100)}/100
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${(breakdown.length / breakdownMax.length) * 100}%` }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Section: Why this score? */}
        <div className="card">
          <div className="section-title" style={{ fontSize: "1.4rem", marginBottom: "24px" }}>🤔 Why this score?</div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            
            {/* Weak Sections */}
            <div style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: "var(--radius-md)", padding: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--danger)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span> Weak Sections
              </h3>
              {weak_sections && weak_sections.length > 0 ? (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {weak_sections.map(sec => (
                    <li key={sec} style={{ color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "var(--danger)" }}>✗</span> Missing or weak {sec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "var(--success)", margin: 0 }}>✓ All critical sections are present and strong!</p>
              )}
            </div>

            {/* Missing Skills */}
            <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "var(--radius-md)", padding: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--warning)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📉</span> Missing Skills
              </h3>
              {missing_skills && missing_skills.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {missing_skills.map(skill => (
                    <SkillBadge key={skill} skill={skill} variant="warning" />
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--success)", margin: 0 }}>✓ Strong skill coverage detected.</p>
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
                </ul>
              ) : (
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Your resume looks solid. No major suggestions right now.</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
