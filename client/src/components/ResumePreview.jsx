// Shared helpers
function parseSkills(raw) {
  return (raw || "").split(",").map((s) => s.trim()).filter(Boolean);
}
function parseLines(raw) {
  return (raw || "").split("\n").map((s) => s.trim()).filter(Boolean);
}
function getInitials(name) {
  return (name || "YN").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── MINIMAL template ─────────────────────────────────────────────────────────
function MinimalTemplate({ form }) {
  const skills = parseSkills(form.skills);
  const projects = parseLines(form.projects);
  return (
    <div className="rp rp-minimal">
      <div className="rp-min-header">
        <h2>{form.name || "Your Name"}</h2>
        <p>{[form.email, form.phone, form.location].filter(Boolean).join("  ·  ")}</p>
      </div>
      <hr className="rp-min-rule" />
      {form.summary && (
        <section>
          <h3 className="rp-min-heading">Summary</h3>
          <p className="rp-min-body">{form.summary}</p>
        </section>
      )}
      {skills.length > 0 && (
        <section>
          <h3 className="rp-min-heading">Skills</h3>
          <div className="rp-min-tags">
            {skills.map((s) => <span key={s} className="rp-min-tag">{s}</span>)}
          </div>
        </section>
      )}
      {projects.length > 0 && (
        <section>
          <h3 className="rp-min-heading">Projects</h3>
          <ul className="rp-min-list">
            {projects.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}
      {form.experience?.trim() && (
        <section>
          <h3 className="rp-min-heading">Experience</h3>
          <p className="rp-min-body" style={{ whiteSpace: "pre-line" }}>{form.experience}</p>
        </section>
      )}
      {form.education?.trim() && (
        <section>
          <h3 className="rp-min-heading">Education</h3>
          <p className="rp-min-body" style={{ whiteSpace: "pre-line" }}>{form.education}</p>
        </section>
      )}
    </div>
  );
}

// ── MODERN template ───────────────────────────────────────────────────────────
function ModernTemplate({ form }) {
  const skills = parseSkills(form.skills);
  const projects = parseLines(form.projects);
  const skillLevels = ["Expert", "Advanced", "Proficient", "Intermediate"];
  return (
    <div className="rp rp-modern">
      {/* Rich banner header with avatar */}
      <div className="rp-mod-header">
        <div className="rp-mod-avatar">{getInitials(form.name)}</div>
        <div className="rp-mod-header-info">
          <h2 className="rp-mod-name">{form.name || "Your Name"}</h2>
          {form.location && <div className="rp-mod-location">📍 {form.location}</div>}
          <div className="rp-mod-contact">
            {[form.email, form.phone].filter(Boolean).map((c, i) => (
              <span key={i} className="rp-mod-contact-chip">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rp-mod-body">
        {/* Left sidebar */}
        <aside className="rp-mod-sidebar">
          {skills.length > 0 && (
            <div className="rp-mod-section">
              <h3 className="rp-mod-heading">Skills</h3>
              {skills.map((s, i) => (
                <div key={s} className="rp-mod-skill-bar">
                  <div className="rp-mod-skill-row">
                    <span className="rp-mod-skill-label">{s}</span>
                    <span className="rp-mod-skill-level">{skillLevels[i % skillLevels.length]}</span>
                  </div>
                  <div className="rp-mod-bar-track">
                    <div className="rp-mod-bar-fill" style={{ width: `${88 - (i % 4) * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {form.education?.trim() && (
            <div className="rp-mod-section">
              <h3 className="rp-mod-heading">Education</h3>
              <div className="rp-mod-edu-card">
                <span className="rp-mod-edu-icon">🎓</span>
                <p className="rp-mod-text" style={{ whiteSpace: "pre-line" }}>{form.education}</p>
              </div>
            </div>
          )}

          {/* Contact card at bottom */}
          <div className="rp-mod-section rp-mod-contact-card">
            <h3 className="rp-mod-heading">Contact</h3>
            {form.email && <div className="rp-mod-contact-row">✉️ {form.email}</div>}
            {form.phone && <div className="rp-mod-contact-row">📞 {form.phone}</div>}
          </div>
        </aside>

        {/* Main content */}
        <main className="rp-mod-main">
          {form.summary && (
            <div className="rp-mod-section">
              <h3 className="rp-mod-heading">Profile</h3>
              <p className="rp-mod-text">{form.summary}</p>
            </div>
          )}

          {projects.length > 0 && (
            <div className="rp-mod-section">
              <h3 className="rp-mod-heading">Projects</h3>
              {projects.map((p, i) => (
                <div key={i} className="rp-mod-project-card">
                  <div className="rp-mod-project-num">{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <span className="rp-mod-text">{p}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {form.experience?.trim() && (
            <div className="rp-mod-section">
              <h3 className="rp-mod-heading">Experience</h3>
              <div className="rp-mod-timeline">
                <div className="rp-mod-timeline-dot" />
                <p className="rp-mod-text" style={{ whiteSpace: "pre-line" }}>{form.experience}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── DEVELOPER STYLE template ──────────────────────────────────────────────────
function DeveloperTemplate({ form }) {
  const skills = parseSkills(form.skills);
  const projects = parseLines(form.projects);
  const dots = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="rp rp-dev">
      {/* Header */}
      <div className="rp-dev-header">
        <div className="rp-dev-header-top">
          <div>
            <div className="rp-dev-badge">● OPEN TO WORK</div>
            <h2 className="rp-dev-name">{form.name || "Your Name"}</h2>
            <div className="rp-dev-contact">
              {[form.email, form.phone, form.location].filter(Boolean).map((c, i) => (
                <span key={i} className="rp-dev-contact-item">
                  <span className="rp-dev-prompt">$</span> {c}
                </span>
              ))}
            </div>
          </div>
          {/* Contribution-style dots grid */}
          <div className="rp-dev-dots-grid">
            {dots.map((d) => (
              <div key={d} className={`rp-dev-dot-cell rp-dev-dot-${(d * 7 + 3) % 4}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="rp-dev-content">
        {/* git log style command block */}
        <div className="rp-dev-cmd-block">
          <span className="rp-dev-cmd-prompt">~/resume</span>
          <span className="rp-dev-cmd-git"> git log --oneline</span>
        </div>

        {form.summary && (
          <section className="rp-dev-section">
            <h3 className="rp-dev-section-title">
              <span className="rp-dev-hash">#</span> About
            </h3>
            <p className="rp-dev-text">{form.summary}</p>
          </section>
        )}

        {skills.length > 0 && (
          <section className="rp-dev-section">
            <h3 className="rp-dev-section-title">
              <span className="rp-dev-hash">#</span> Tech Stack
            </h3>
            <div className="rp-dev-skill-grid">
              {skills.map((s, i) => (
                <span key={s} className={`rp-dev-skill-chip rp-dev-chip-${i % 3}`}>{s}</span>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section className="rp-dev-section">
            <h3 className="rp-dev-section-title">
              <span className="rp-dev-hash">#</span> Projects
            </h3>
            <ul className="rp-dev-list">
              {projects.map((p, i) => (
                <li key={i} className="rp-dev-list-item">
                  <span className="rp-dev-arrow">▸</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {form.experience?.trim() && (
          <section className="rp-dev-section">
            <h3 className="rp-dev-section-title">
              <span className="rp-dev-hash">#</span> Experience
            </h3>
            <p className="rp-dev-text" style={{ whiteSpace: "pre-line" }}>{form.experience}</p>
          </section>
        )}

        {form.education?.trim() && (
          <section className="rp-dev-section">
            <h3 className="rp-dev-section-title">
              <span className="rp-dev-hash">#</span> Education
            </h3>
            <p className="rp-dev-text" style={{ whiteSpace: "pre-line" }}>{form.education}</p>
          </section>
        )}

        {/* Footer stats bar */}
        <div className="rp-dev-footer">
          <span className="rp-dev-stat">⬡ {skills.length} skills</span>
          <span className="rp-dev-stat">◈ {projects.length} projects</span>
          <span className="rp-dev-stat">✦ Available for hire</span>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ResumePreview({ form, selectedTemplate = "minimal", previewId = "resume-preview" }) {
  return (
    <div id={previewId}>
      {selectedTemplate === "modern"    && <ModernTemplate form={form} />}
      {selectedTemplate === "developer" && <DeveloperTemplate form={form} />}
      {(selectedTemplate === "minimal" || !selectedTemplate) && <MinimalTemplate form={form} />}
    </div>
  );
}
