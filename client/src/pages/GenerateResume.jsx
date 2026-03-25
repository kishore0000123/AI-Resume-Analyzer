import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getRoleSuggestions } from "../api/client";
import StepIndicator from "../components/StepIndicator";
import ResumeForm from "../components/ResumeForm";
import ResumePreview from "../components/ResumePreview";

function parseNameFromText(text) {
  if (!text) return "";
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const candidate = lines.find((line) => {
    const words = line.split(" ").filter(Boolean);
    return words.length >= 2 && words.length <= 4 && /^[a-zA-Z .'-]+$/.test(line);
  });
  return candidate || "";
}

function getAnalysisDraft() {
  try {
    const raw = sessionStorage.getItem("last_analysis");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getSavedBuilderDraft() {
  try {
    const raw = sessionStorage.getItem("resume_builder_draft");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const templateOptions = [
  { id: "minimal", label: "Minimal" },
  { id: "modern", label: "Modern" },
  { id: "developer", label: "Developer Style" },
];

export default function GenerateResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [selectedRole, setSelectedRole] = useState("Frontend Developer");
  const [roleData, setRoleData] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: "",
    projects: "",
    experience: "",
    education: "",
  });

  const summaryRef = useRef(null);
  const skillsRef = useRef(null);
  const projectsRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);

  const analysis = useMemo(() => getAnalysisDraft(), []);
  const roleOptions = ["Frontend Developer", "Backend Developer", "Data Scientist"];
  const requiredFields = ["name", "email", "skills", "summary"];
  const hasAnyContent = useMemo(() => Object.values(form).some((v) => v.trim()), [form]);

  const fieldErrors = useMemo(() => {
    return {
      name: !form.name.trim() ? "Name is required" : "",
      email: !form.email.trim()
        ? "Email is required"
        : !/^\S+@\S+\.\S+$/.test(form.email.trim())
          ? "Enter a valid email"
          : "",
      skills: !form.skills.trim() ? "Skills are required" : "",
      summary: !form.summary.trim() ? "Summary is required" : "",
    };
  }, [form]);

  useEffect(() => {
    const draftFromNav = location.state?.draft;
    const savedDraft = getSavedBuilderDraft();
    const initial = draftFromNav || savedDraft;
    if (initial?.form) {
      setForm((prev) => ({ ...prev, ...initial.form }));
      if (initial.selectedTemplate) setSelectedTemplate(initial.selectedTemplate);
    }
  }, [location.state]);

  useEffect(() => {
    sessionStorage.setItem("resume_builder_draft", JSON.stringify({ form, selectedTemplate }));
  }, [form, selectedTemplate]);

  useEffect(() => {
    const section = searchParams.get("section");
    const refMap = {
      summary: summaryRef,
      skills: skillsRef,
      projects: projectsRef,
      experience: experienceRef,
      education: educationRef,
    };
    const targetRef = refMap[section];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      targetRef.current.focus();
    }
  }, [searchParams]);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam) setSelectedRole(roleParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchRole = async () => {
      setLoadingRole(true);
      try {
        const currentSkills = form.skills
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const { data } = await getRoleSuggestions(selectedRole, currentSkills);
        setRoleData(data);
      } catch {
        setRoleData(null);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchRole();
  }, [selectedRole, form.skills]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showFieldError = (field) => Boolean((touched[field] || submitAttempted) && fieldErrors[field]);

  const hasRequiredMissing = useMemo(
    () => requiredFields.some((field) => Boolean(fieldErrors[field])),
    [requiredFields, fieldErrors]
  );

  useEffect(() => {
    if (submitAttempted && hasRequiredMissing) {
      setSuggestionsOpen(true);
    }
  }, [submitAttempted, hasRequiredMissing]);

  const validateForm = () => {
    setSubmitAttempted(true);
    const invalid = requiredFields.filter((field) => fieldErrors[field]);
    if (invalid.length > 0) {
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(requiredFields.map((f) => [f, true])),
      }));
    }
    return invalid;
  };

  const autofillFromAnalysis = () => {
    if (!analysis) {
      setFeedback({ type: "error", text: "No analysis found. Analyze a resume first." });
      return;
    }

    const skills = (analysis.skills || []).join(", ");
    const strengths = analysis.score?.strengths?.slice(0, 2).join(" ") || "";
    const bestRole = analysis.best_role?.role || "";
    const summary = [
      bestRole ? `Aspiring ${bestRole} with hands-on project experience.` : "Motivated candidate with practical technical project experience.",
      strengths,
    ]
      .filter(Boolean)
      .join(" ");

    const projectLines = (analysis.job_matches || [])
      .slice(0, 2)
      .map((job) => `Built portfolio projects aligned with ${job.role} competencies (${job.match_percent}% match).`)
      .join("\n");

    setForm((prev) => ({
      ...prev,
      name: prev.name || parseNameFromText(analysis.text),
      skills: prev.skills || skills,
      summary: prev.summary || summary,
      projects: prev.projects || projectLines,
    }));

    setFeedback({ type: "success", text: "Autofill complete. Review fields and continue." });
  };

  const goToPreview = () => {
    const invalid = validateForm();
    if (invalid.length > 0) {
      setFeedback({ type: "error", text: "Please fix highlighted required fields before preview." });
      return;
    }

    setFeedback({ type: "", text: "" });
    navigate("/preview", {
      state: {
        draft: {
          form,
          selectedTemplate,
        },
      },
    });
  };

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 1240 }}>
        <div className="card section-fade section-fade-1" style={{ marginBottom: 20 }}>
          <div className="section-title">🧾 Resume Generator</div>
          <StepIndicator currentStep={hasAnyContent ? 2 : 1} steps={["Fill Details", "Live Preview", "Download"]} />
          <p style={{ color: "var(--text-secondary)", marginBottom: 18 }}>
            Fill the form, then click Generate Resume to open preview and download options.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {templateOptions.map((tpl) => (
              <button
                key={tpl.id}
                className={`btn ${selectedTemplate === tpl.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSelectedTemplate(tpl.id)}
                style={{ padding: "8px 14px", fontSize: "0.85rem" }}
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <div className="builder-actions">
            <button className="btn btn-ghost" onClick={autofillFromAnalysis}>✨ Autofill From Analyzer</button>
            <button className="btn btn-primary" onClick={goToPreview}>🚀 Generate Resume</button>
          </div>

          {feedback.text && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${feedback.type === "error" ? "rgba(244,63,94,0.35)" : "rgba(34,211,164,0.35)"}`,
                background: feedback.type === "error" ? "rgba(244,63,94,0.1)" : "rgba(34,211,164,0.1)",
                color: feedback.type === "error" ? "var(--danger)" : "var(--success)",
                fontSize: "0.9rem",
              }}
            >
              {feedback.text}
            </div>
          )}
        </div>

        <div className="generate-layout">
          <div className="card section-fade section-fade-2" style={{ marginBottom: 20 }}>
            <div className="section-title">✍️ Resume Form</div>
            <ResumeForm
              form={form}
              updateField={updateField}
              handleBlur={handleBlur}
              showFieldError={showFieldError}
              fieldErrors={fieldErrors}
              refs={{ summaryRef, skillsRef, projectsRef, experienceRef, educationRef }}
            />
          </div>

          <div className="preview-sticky">
            <div className="card section-fade section-fade-3" style={{ marginBottom: 20 }}>
              <div className="section-title">👀 Live Preview</div>
              {hasAnyContent ? (
                <ResumePreview form={form} selectedTemplate={selectedTemplate} previewId="generate-live-preview" />
              ) : (
                <p style={{ color: "var(--text-muted)" }}>Start typing in the form to see live preview.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card section-fade section-fade-4" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div className="section-title">🎯 Role Suggestions</div>
            <button className="btn btn-ghost" onClick={() => setSuggestionsOpen((v) => !v)}>
              {suggestionsOpen ? "Hide Suggestions" : "Show Suggestions"}
            </button>
            </div>
            <div className={`suggestions-collapse ${suggestionsOpen ? "open" : ""}`}>
              <div className="suggestions-collapse-inner">
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <select
                className="resume-input"
                style={{ maxWidth: 260 }}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {loadingRole ? (
              <p style={{ color: "var(--text-muted)" }}>Loading suggestions...</p>
            ) : roleData ? (
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                <p><strong style={{ color: "var(--text-primary)" }}>Missing Skills:</strong> {roleData.missing_skills.join(", ") || "None"}</p>
                <p><strong style={{ color: "var(--text-primary)" }}>Project Ideas:</strong></p>
                <ul style={{ paddingLeft: 18 }}>
                  {roleData.project_ideas.map((idea) => <li key={idea}>{idea}</li>)}
                </ul>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>Role suggestions unavailable.</p>
            )}

            <div className="resume-side-note">
              <strong>Tip:</strong> Keep summary and skills role-specific. Use measurable outcomes in projects.
            </div>
              </div>
            </div>
            {!suggestionsOpen && (
              <p style={{ color: "var(--text-secondary)", marginTop: 2 }}>
                Suggestions are available when you need missing skills and project ideas.
              </p>
            )}
        </div>
      </div>
    </main>
  );
}
