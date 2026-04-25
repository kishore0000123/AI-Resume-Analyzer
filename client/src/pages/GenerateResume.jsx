import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import StepIndicator from "../components/StepIndicator";
import ResumeForm from "../components/ResumeForm";
import ResumePreview from "../components/ResumePreview";

const BUILDER_DRAFT_KEY = "resume_builder_draft";

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
    const raw = sessionStorage.getItem(BUILDER_DRAFT_KEY) || localStorage.getItem(BUILDER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function GenerateResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
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
  const didInitDraft = useRef(false);

  const analysis = useMemo(() => getAnalysisDraft(), []);
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

  const hasRequiredMissing = useMemo(
    () => requiredFields.some((field) => Boolean(fieldErrors[field])),
    [fieldErrors]
  );

  useEffect(() => {
    if (didInitDraft.current) return;

    const draftFromNav = location.state?.draft;
    const savedDraft = getSavedBuilderDraft();
    const initial = draftFromNav || savedDraft;
    if (initial?.form) {
      setForm((prev) => ({ ...prev, ...initial.form }));
      if (initial.selectedTemplate) setSelectedTemplate(initial.selectedTemplate);
    } else if (analysis?.text) {
      const detectedName = parseNameFromText(analysis.text);
      setForm((prev) => ({
        ...prev,
        name: detectedName,
        skills: (analysis.skills || []).join(", "),
      }));
    }

    const templateFromUrl = searchParams.get("template");
    if (templateFromUrl) {
      const exists = templateOptions.find((t) => t.id === templateFromUrl);
      if (exists) setSelectedTemplate(templateFromUrl);
    }

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


    didInitDraft.current = true;
  }, [analysis, location.state, searchParams]);
  useEffect(() => {
    if (hasAnyContent) {
      const timer = setTimeout(() => {
        const draft = { form, selectedTemplate };
        sessionStorage.setItem(BUILDER_DRAFT_KEY, JSON.stringify(draft));
        localStorage.setItem(BUILDER_DRAFT_KEY, JSON.stringify(draft));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [form, selectedTemplate, hasAnyContent]);

  const handleInputChange = (field, value) => {
  const updateField = (field, value) => {
 ef934b221b6e151f23db98c43529244412f521dd
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutofill = (section, content) => {
    handleInputChange(section, content);
    setFeedback({ type: "success", text: `Autofilled ${section}!` });
    setTimeout(() => setFeedback({ type: "", text: "" }), 3000);
  };

  const validateAndPreview = () => {
    setSubmitAttempted(true);
    if (hasRequiredMissing) {
      const firstErrorField = requiredFields.find((f) => fieldErrors[f]);
      const refMap = {
        summary: summaryRef,
        skills: skillsRef,
        experience: experienceRef,
      };
      refMap[firstErrorField]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFeedback({ type: "error", text: "Please fill all required fields correctly." });
      return;
    }
    const draft = { form, selectedTemplate };
    sessionStorage.setItem("resume_builder_draft", JSON.stringify(draft));
    navigate("/preview");
  };

  return (
    <main style={{ padding: "40px 0 100px" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>🛠 Resume Builder</h1>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
            <button className="btn btn-primary" onClick={validateAndPreview}>Preview & Download →</button>
          </div>
        </div>

        <StepIndicator currentStep={2} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 32, alignItems: "start" }}>
          <div className="card">
            <div style={{ marginBottom: 24 }}>
              <div className="section-title">🎨 Choose Template</div>
              <div style={{ display: "flex", gap: 10 }}>
                {templateOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`btn ${selectedTemplate === t.id ? "btn-primary" : "btn-ghost"}`}
                    style={{ flex: 1, fontSize: "0.85rem" }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <ResumeForm
              form={form}
              onChange={handleInputChange}
              onAutofill={handleAutofill}
              analysis={analysis}
              errors={submitAttempted ? fieldErrors : {}}
              refs={{ summaryRef, skillsRef, projectsRef, experienceRef, educationRef }}
            />

            {feedback.text && (
              <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: "var(--radius-sm)", background: feedback.type === "success" ? "rgba(34,211,164,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${feedback.type === "success" ? "var(--success)" : "var(--danger)"}`, color: feedback.type === "success" ? "var(--success)" : "var(--danger)", fontSize: "0.9rem" }}>
                {feedback.text}
              </div>
            )}
          </div>

          <div style={{ position: "sticky", top: 40 }}>
            <div className="section-title">📄 Live Preview</div>
            <div className="preview-container" style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "#fff", boxShadow: "var(--shadow-lg)" }}>
              <ResumePreview data={form} template={selectedTemplate} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
}
