export default function ResumeForm({
  form,
  updateField,
  handleBlur,
  showFieldError,
  fieldErrors,
  refs,
}) {
  return (
    <>
      <div className="resume-form-grid">
        <div className="resume-field-wrap">
          <input
            id="full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            className={`resume-input ${showFieldError("name") ? "resume-field-error" : ""}`}
            placeholder="Full Name *"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            onBlur={() => handleBlur("name")}
          />
          {showFieldError("name") && <span className="resume-field-error-text">{fieldErrors.name}</span>}
        </div>

        <div className="resume-field-wrap">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`resume-input ${showFieldError("email") ? "resume-field-error" : ""}`}
            placeholder="Email *"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
          />
          {showFieldError("email") && <span className="resume-field-error-text">{fieldErrors.email}</span>}
        </div>

        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="resume-input"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
        <input
          id="location"
          name="location"
          type="text"
          autoComplete="address-level2"
          className="resume-input"
          placeholder="Location"
          value={form.location}
          onChange={(e) => updateField("location", e.target.value)}
        />
      </div>

      <textarea
        ref={refs.summaryRef}
        id="summary"
        name="summary"
        autoComplete="off"
        className={`resume-textarea ${showFieldError("summary") ? "resume-field-error" : ""}`}
        placeholder="Professional Summary *"
        value={form.summary}
        onChange={(e) => updateField("summary", e.target.value)}
        onBlur={() => handleBlur("summary")}
      />
      {showFieldError("summary") && <span className="resume-field-error-text">{fieldErrors.summary}</span>}

      <textarea
        ref={refs.skillsRef}
        id="skills"
        name="skills"
        autoComplete="off"
        className={`resume-textarea ${showFieldError("skills") ? "resume-field-error" : ""}`}
        placeholder="Skills (comma separated) *"
        value={form.skills}
        onChange={(e) => updateField("skills", e.target.value)}
        onBlur={() => handleBlur("skills")}
      />
      {showFieldError("skills") && <span className="resume-field-error-text">{fieldErrors.skills}</span>}

      <textarea
        ref={refs.projectsRef}
        id="projects"
        name="projects"
        autoComplete="off"
        className="resume-textarea"
        placeholder="Projects"
        value={form.projects}
        onChange={(e) => updateField("projects", e.target.value)}
      />
      <textarea
        ref={refs.experienceRef}
        id="experience"
        name="experience"
        autoComplete="off"
        className="resume-textarea"
        placeholder="Experience"
        value={form.experience}
        onChange={(e) => updateField("experience", e.target.value)}
      />
      <textarea
        ref={refs.educationRef}
        id="education"
        name="education"
        autoComplete="off"
        className="resume-textarea"
        placeholder="Education"
        value={form.education}
        onChange={(e) => updateField("education", e.target.value)}
      />
    </>
  );
}
