import { useState } from "react";

export default function JobCard({ job, index }) {
  const [hovered, setHovered] = useState(false);
  const { role, icon, match_percent, matched_skills, missing_skills } = job;

  const color =
    match_percent >= 70 ? "var(--success)" :
    match_percent >= 40 ? "var(--warning)" :
    "var(--text-secondary)";

  return (
    <div
      className="card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        borderColor: hovered ? "var(--border-accent)" : "var(--border)",
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{icon}</div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{role}</h3>
        </div>
        <div style={{
          fontSize: "1.5rem", fontWeight: 800, color,
          filter: match_percent >= 70 ? "drop-shadow(0 0 8px var(--success))" : "none",
        }}>
          {match_percent}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-track" style={{ marginBottom: 14 }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${match_percent}%`,
            background: match_percent >= 70
              ? "linear-gradient(90deg, var(--success), #0ea87a)"
              : match_percent >= 40
              ? "linear-gradient(90deg, var(--warning), #d97706)"
              : "linear-gradient(90deg, var(--text-muted), var(--text-secondary))",
          }}
        />
      </div>

      {/* Matched skills */}
      {matched_skills.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Matched</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {matched_skills.slice(0, 4).map((s) => (
              <span key={s} className="skill-badge skill-badge-success">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {missing_skills.length > 0 && (
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Missing</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {missing_skills.slice(0, 3).map((s) => (
              <span key={s} className="skill-badge skill-badge-danger">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
