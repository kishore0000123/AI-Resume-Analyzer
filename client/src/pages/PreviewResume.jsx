import { useState } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { useLocation, useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator";
import ResumePreview from "../components/ResumePreview";

function getSavedBuilderDraft() {
  try {
    const raw = sessionStorage.getItem("resume_builder_draft");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function PreviewResume() {
  const location = useLocation();
  const navigate = useNavigate();

  // Compute draft FIRST so useState can read its values
  const draft = location.state?.draft || getSavedBuilderDraft();

  const [currentStep, setCurrentStep] = useState(2);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [selectedTemplate, setSelectedTemplate] = useState(draft?.selectedTemplate || "minimal");

  const templateOptions = [
    { id: "minimal", label: "Minimal", icon: "📄" },
    { id: "modern", label: "Modern", icon: "🎨" },
    { id: "developer", label: "Developer Style", icon: "💻" },
  ];

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

  const downloadDocx = async () => {
    setIsDownloadingDocx(true);
    setCurrentStep(3);
    try {
      const sectionLines = (value) =>
        (value || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => new Paragraph({ children: [new TextRun(line)] }));

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [new TextRun({ text: form.name || "Your Name", bold: true, size: 36 })],
              }),
              new Paragraph({
                children: [new TextRun([form.email, form.phone, form.location].filter(Boolean).join(" | "))],
              }),
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true })] }),
              ...sectionLines(form.summary),
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun({ text: "SKILLS", bold: true })] }),
              ...sectionLines(form.skills),
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun({ text: "PROJECTS", bold: true })] }),
              ...sectionLines(form.projects),
              ...(form.experience.trim()
                ? [
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "EXPERIENCE", bold: true })] }),
                    ...sectionLines(form.experience),
                  ]
                : []),
              ...(form.education.trim()
                ? [
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "EDUCATION", bold: true })] }),
                    ...sectionLines(form.education),
                  ]
                : []),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "generated_resume.docx";
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({ type: "success", text: "DOCX downloaded successfully." });
    } catch {
      setFeedback({ type: "error", text: "Failed to download DOCX." });
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const createNewResume = () => {
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
            Review your resume. You can edit or download as PDF/DOCX.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => navigate("/generate", { state: { draft } })}>✏️ Edit Resume</button>
            <button className="btn btn-success" onClick={downloadPdf} disabled={isDownloadingPdf}>
              {isDownloadingPdf ? "Downloading..." : "📥 Download PDF"}
            </button>
            <button className="btn btn-primary" onClick={downloadDocx} disabled={isDownloadingDocx}>
              {isDownloadingDocx ? "Downloading..." : "📝 Download DOCX"}
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
