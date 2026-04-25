import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator";
import ResumePreview from "../components/ResumePreview";

const templateOptions = [
  { id: "minimal", label: "Minimal", icon: "🧼" },
  { id: "modern", label: "Modern", icon: "✨" },
  { id: "developer", label: "Developer Style", icon: "💻" },
];

function getSavedBuilderDraft() {
  try {
    const raw = sessionStorage.getItem("resume_builder_draft");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

<<<<<<< HEAD
function splitLines(value) {
  return (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitSkills(value) {
  return (value || "")
    .split(",")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sectionHeading(text, color = "111827") {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { color, size: 6, space: 1 },
    },
    children: [
      new TextRun({ text, bold: true, color, size: 22 }),
    ],
  });
}

function sectionBodyLines(lines, color = "1F2937") {
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 70 },
        children: [new TextRun({ text: line, color, size: 22 })],
      })
  );
}

function sectionBulletLines(lines, color = "1F2937") {
  return lines.map(
    (line) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 70 },
        children: [new TextRun({ text: line, color, size: 22 })],
      })
  );
}


=======
>>>>>>> ef934b221b6e151f23db98c43529244412f521dd
export default function PreviewResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const draft = useMemo(() => location.state?.draft || getSavedBuilderDraft(), [location.state]);
  const [selectedTemplate, setSelectedTemplate] = useState(draft?.selectedTemplate || "minimal");

  useEffect(() => {
    if (draft?.selectedTemplate) {
      setSelectedTemplate(draft.selectedTemplate);
    }
  }, [draft?.selectedTemplate]);

  useEffect(() => {
    if (!draft?.form) return;
    sessionStorage.setItem(
      "resume_builder_draft",
      JSON.stringify({
        ...draft,
        selectedTemplate,
      })
    );
  }, [draft, selectedTemplate]);

  if (!draft?.form) {
    return (
      <main style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <div className="card" style={{ maxWidth: 560, textAlign: "center" }}>
          <div className="section-title" style={{ justifyContent: "center" }}>📝 No Draft Found</div>
          <p style={{ color: "var(--text-secondary)" }}>Start from Generate page and create your resume draft first.</p>
          <button className="btn btn-primary" onClick={() => navigate("/generate")}>Go to Generate</button>
        </div>
      </main>
    );
  }

  const { form } = draft;

  const downloadPdf = async () => {
    const previewEl = document.getElementById("resume-preview");
    if (!previewEl) {
      setFeedback({ type: "error", text: "Preview block not found." });
      return;
    }

    setIsDownloadingPdf(true);
    setCurrentStep(3);

<<<<<<< HEAD
    const html2pdf = (await import("html2pdf.js")).default;

    html2pdf()
      .set({
        margin: 8,
        filename: "generated_resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(previewEl)
      .save()
      .then(() => setFeedback({ type: "success", text: "PDF downloaded successfully." }))
      .catch(() => setFeedback({ type: "error", text: "Failed to download PDF." }))
      .finally(() => setIsDownloadingPdf(false));
  };


=======
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 8,
          filename: "generated_resume.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(previewEl)
        .save();
      
      setFeedback({ type: "success", text: "PDF downloaded successfully." });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Failed to download PDF." });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const createNewResume = () => {
>>>>>>> ef934b221b6e151f23db98c43529244412f521dd
    sessionStorage.removeItem("resume_builder_draft");
    navigate("/generate");
  };

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">👀 Resume Preview</div>
          <StepIndicator currentStep={currentStep} steps={["Fill Details", "Preview Resume", "Download"]} />
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
            Review your resume. You can edit or download as PDF.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-ghost"
              onClick={() =>
                navigate("/generate", {
                  state: {
                    draft: {
                      ...draft,
                      selectedTemplate,
                    },
                  },
                })
              }
            >
              ✏️ Edit Resume
            </button>
            <button className="btn btn-success" onClick={downloadPdf} disabled={isDownloadingPdf}>
              {isDownloadingPdf ? "Downloading..." : "📥 Download PDF"}
            </button>
            <button className="btn btn-ghost" onClick={createNewResume}>＋ Create New Resume</button>
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

        {/* Template switcher card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>🎨 Choose Template</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                Switch template — the preview updates instantly
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {templateOptions.map((tpl) => (
                <button
                  key={tpl.id}
                  className={`btn ${selectedTemplate === tpl.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  style={{ padding: "9px 18px", fontSize: "0.85rem" }}
                >
                  {tpl.icon} {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resume preview card */}
        <div className="card">
          <ResumePreview form={form} selectedTemplate={selectedTemplate} previewId="resume-preview" />
        </div>
      </div>
    </main>
  );
}
