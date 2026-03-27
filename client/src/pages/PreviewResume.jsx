import { useEffect, useMemo, useState } from "react";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
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

function buildMinimalDocx(form) {
  const contact = [form.email, form.phone, form.location].filter(Boolean).join(" | ");
  const summaryLines = splitLines(form.summary);
  const skillLines = splitSkills(form.skills);
  const projectLines = splitLines(form.projects);
  const experienceLines = splitLines(form.experience);
  const educationLines = splitLines(form.education);

  const children = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [new TextRun({ text: form.name || "Your Name", bold: true, color: "111827", size: 56 })],
    }),
    ...(contact
      ? [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 220 },
            children: [new TextRun({ text: contact, color: "475569", size: 21 })],
          }),
        ]
      : [new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] })]),
  ];

  if (summaryLines.length > 0) {
    children.push(sectionHeading("PROFESSIONAL SUMMARY", "111827"));
    children.push(...sectionBodyLines(summaryLines, "1F2937"));
  }

  if (skillLines.length > 0) {
    children.push(sectionHeading("SKILLS", "111827"));
    children.push(...sectionBulletLines(skillLines, "1F2937"));
  }

  if (projectLines.length > 0) {
    children.push(sectionHeading("PROJECTS", "111827"));
    children.push(...sectionBulletLines(projectLines, "1F2937"));
  }

  if (experienceLines.length > 0) {
    children.push(sectionHeading("EXPERIENCE", "111827"));
    children.push(...sectionBodyLines(experienceLines, "1F2937"));
  }

  if (educationLines.length > 0) {
    children.push(sectionHeading("EDUCATION", "111827"));
    children.push(...sectionBodyLines(educationLines, "1F2937"));
  }

  return new Document({ sections: [{ children }] });
}

function buildModernDocx(form) {
  const contact = [form.email, form.phone, form.location].filter(Boolean).join(" | ");
  const summaryLines = splitLines(form.summary);
  const skillLines = splitSkills(form.skills);
  const projectLines = splitLines(form.projects);
  const experienceLines = splitLines(form.experience);
  const educationLines = splitLines(form.education);

  const blueHeading = (text) => sectionHeading(text, "1D4ED8");

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: form.name || "Your Name", bold: true, color: "1D4ED8", size: 54 })],
    }),
    ...(contact
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [new TextRun({ text: contact, color: "2563EB", size: 21 })],
          }),
        ]
      : [new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] })]),
  ];

  if (summaryLines.length > 0) {
    children.push(blueHeading("PROFILE"));
    children.push(...sectionBodyLines(summaryLines, "1E3A8A"));
  }

  if (skillLines.length > 0) {
    children.push(blueHeading("SKILLS"));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: skillLines.join("  •  "), color: "1E40AF", size: 22 })],
      })
    );
  }

  if (projectLines.length > 0) {
    children.push(blueHeading("PROJECT HIGHLIGHTS"));
    children.push(...sectionBulletLines(projectLines, "1E3A8A"));
  }

  if (experienceLines.length > 0) {
    children.push(blueHeading("EXPERIENCE"));
    children.push(...sectionBodyLines(experienceLines, "1E3A8A"));
  }

  if (educationLines.length > 0) {
    children.push(blueHeading("EDUCATION"));
    children.push(...sectionBodyLines(educationLines, "1E3A8A"));
  }

  return new Document({ sections: [{ children }] });
}

function buildDeveloperDocx(form) {
  const contact = [form.email, form.phone, form.location].filter(Boolean).join(" | ");
  const summaryLines = splitLines(form.summary);
  const skillLines = splitSkills(form.skills);
  const projectLines = splitLines(form.projects);
  const experienceLines = splitLines(form.experience);
  const educationLines = splitLines(form.education);

  const devHeading = (text) =>
    new Paragraph({
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({ text: `$ ${text.toLowerCase()}`, bold: true, color: "059669", size: 22, font: "Consolas" }),
      ],
    });

  const devLine = (text) =>
    new Paragraph({
      spacing: { after: 70 },
      children: [new TextRun({ text, color: "111827", size: 22, font: "Consolas" })],
    });

  const children = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: form.name || "Your Name", bold: true, color: "065F46", size: 52, font: "Consolas" })],
    }),
    ...(contact ? [devLine(`> ${contact}`)] : []),
    devLine("$ git log --resume --oneline"),
  ];

  if (summaryLines.length > 0) {
    children.push(devHeading("about"));
    summaryLines.forEach((line) => children.push(devLine(line)));
  }

  if (skillLines.length > 0) {
    children.push(devHeading("tech-stack"));
    children.push(devLine(skillLines.map((skill) => `#${skill.replace(/\s+/g, "_")}`).join(" ")));
  }

  if (projectLines.length > 0) {
    children.push(devHeading("projects"));
    projectLines.forEach((line) => children.push(devLine(`▸ ${line}`)));
  }

  if (experienceLines.length > 0) {
    children.push(devHeading("experience"));
    experienceLines.forEach((line) => children.push(devLine(line)));
  }

  if (educationLines.length > 0) {
    children.push(devHeading("education"));
    educationLines.forEach((line) => children.push(devLine(line)));
  }

  return new Document({ sections: [{ children }] });
}

function buildDocxByTemplate(form, selectedTemplate) {
  if (selectedTemplate === "modern") return buildModernDocx(form);
  if (selectedTemplate === "developer") return buildDeveloperDocx(form);
  return buildMinimalDocx(form);
}

export default function PreviewResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
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
      const doc = buildDocxByTemplate(form, selectedTemplate);

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileLabel = selectedTemplate === "minimal" ? "minimal" : selectedTemplate;
      link.download = `generated_resume_${fileLabel}.docx`;
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
