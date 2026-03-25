export default function ResumePreview({ form, selectedTemplate = "minimal", previewId = "resume-preview" }) {
  const themeClass = `resume-theme-${selectedTemplate || "minimal"}`;
  const skillItems = (form.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const projectItems = (form.projects || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div id={previewId} className={`resume-preview resume-preview-${selectedTemplate || "minimal"} ${themeClass}`}>
      <div className="resume-preview-header">
        <h2>{form.name || "Your Name"}</h2>
        <p>{[form.email, form.phone, form.location].filter(Boolean).join(" | ")}</p>
      </div>
      <hr className="resume-preview-divider" />

      <h3>Professional Summary</h3>
      <p>{form.summary}</p>

      <h3>Skills</h3>
      {skillItems.length > 0 ? (
        <ul className="resume-preview-list">
          {skillItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#64748b" }}>Add comma-separated skills to preview here.</p>
      )}

      <h3>Projects</h3>
      {projectItems.length > 0 ? (
        <ul className="resume-preview-list">
          {projectItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#64748b" }}>Add project lines to preview measurable work.</p>
      )}

      {!!form.experience?.trim() && (
        <>
          <h3>Experience</h3>
          <p style={{ whiteSpace: "pre-line" }}>{form.experience}</p>
        </>
      )}

      {!!form.education?.trim() && (
        <>
          <h3>Education</h3>
          <p style={{ whiteSpace: "pre-line" }}>{form.education}</p>
        </>
      )}
    </div>
  );
}
