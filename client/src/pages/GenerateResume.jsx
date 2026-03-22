import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { useSearchParams } from "react-router-dom";
import { getRoleSuggestions } from "../api/client";

const templateOptions = [
  { id: "minimal", label: "Minimal" },
  { id: "modern", label: "Modern" },
  { id: "developer", label: "Developer Style" },
];

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

export default function GenerateResume() {
  const [searchParams] = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [selectedRole, setSelectedRole] = useState("Frontend Developer");
  const [roleData, setRoleData] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);
  const summaryRef = useRef(null);
  const skillsRef = useRef(null);
  const projectsRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);
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

  const analysis = useMemo(() => getAnalysisDraft(), []);

  const roleOptions = ["Frontend Developer", "Backend Developer", "Data Scientist"];

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
    if (roleParam) {
      setSelectedRole(roleParam);
    }
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
  }, [selectedRole]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const applyRoleSuggestions = () => {
    if (!roleData) return;
    const mergedSkills = Array.from(new Set([
      ...form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      ...roleData.recommended_skills,
    ])).join(", ");

    const projectBlock = roleData.project_ideas
      .map((p, i) => `${i + 1}. ${p}`)
      .join("\n");

    setForm((prev) => ({
      ...prev,
      skills: mergedSkills,
      projects: prev.projects ? `${prev.projects}\n${projectBlock}` : projectBlock,
      summary:
        prev.summary ||
        `Targeting ${roleData.role} roles with focus on ${roleData.ats_keywords.slice(0, 3).join(", ")}.`,
    }));
  };

  const autofillFromAnalysis = () => {
    if (!analysis) return;

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
  };

  const generateResumeText = () => {
    return [
      form.name,
      [form.email, form.phone, form.location].filter(Boolean).join(" | "),
      "",
      "PROFESSIONAL SUMMARY",
      form.summary,
      "",
      "SKILLS",
      form.skills,
      "",
      "PROJECTS",
      form.projects,
      "",
      "EXPERIENCE",
      form.experience,
      "",
      "EDUCATION",
      form.education,
    ]
      .filter((line) => line !== undefined)
      .join("\n");
  };

  const writeMultiline = (doc, text, x, y, maxWidth, lineHeight = 6) => {
    const lines = doc.splitTextToSize(text || "", maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  const buildPdf = (template = selectedTemplate, starterText = null, starterName = "resume") => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    const sourceText = starterText || generateResumeText();

    if (template === "modern") {
      doc.setFillColor(18, 26, 45);
      doc.rect(0, 0, pageWidth, 34, "F");
      doc.setTextColor(240, 242, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.text(form.name || "Your Name", margin, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text([form.email, form.phone, form.location].filter(Boolean).join(" | "), margin, 25);
      doc.setTextColor(20, 20, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      writeMultiline(doc, sourceText, margin, 42, pageWidth - margin * 2, 5.5);
    } else if (template === "developer") {
      doc.setFillColor(10, 14, 24);
      doc.rect(0, 0, pageWidth, 297, "F");
      doc.setTextColor(34, 211, 164);
      doc.setFont("courier", "bold");
      doc.setFontSize(18);
      doc.text(form.name || "Your Name", margin, 18);
      doc.setTextColor(240, 242, 255);
      doc.setFont("courier", "normal");
      doc.setFontSize(10);
      doc.text([form.email, form.phone, form.location].filter(Boolean).join(" | "), margin, 24);
      doc.setFontSize(10.5);
      writeMultiline(doc, sourceText, margin, 34, pageWidth - margin * 2, 5.5);
    } else {
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(form.name || "Your Name", margin, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text([form.email, form.phone, form.location].filter(Boolean).join(" | "), margin, 27);
      doc.setFontSize(11);
      writeMultiline(doc, sourceText, margin, 38, pageWidth - margin * 2, 5.7);
    }

    doc.save(`${starterName}.pdf`);
  };

  const downloadResume = () => {
    buildPdf(selectedTemplate, null, "generated_resume");
  };

  const downloadStarterTemplate = (kind) => {
    const starterTemplates = {
      fresher: `Fresher Candidate\nexample@email.com | +91 90000 00000 | City\n\nPROFESSIONAL SUMMARY\nEntry-level candidate with strong fundamentals in software development and eagerness to learn.\n\nSKILLS\nJava, Python, SQL, Git, HTML, CSS\n\nPROJECTS\nBuilt a student management web app using React and Node.js.\nCreated a data dashboard using Python and Pandas.\n\nEDUCATION\nB.Tech in Computer Science, 2026`,
      developer: `Developer Candidate\nexample@email.com | +91 90000 00000 | City\n\nPROFESSIONAL SUMMARY\nFull Stack Developer with experience in shipping scalable web features and API integrations.\n\nSKILLS\nReact, Node.js, FastAPI, MongoDB, Docker, AWS\n\nEXPERIENCE\nDeveloped and maintained production-ready modules for internal tools.\nImproved API response time by 30% through query optimization.\n\nPROJECTS\nBuilt AI Resume Analyzer with scoring, job-match insights, and optimization support.`,
      internship: `Internship Candidate\nexample@email.com | +91 90000 00000 | City\n\nPROFESSIONAL SUMMARY\nMotivated student seeking software internship with a focus on web development and AI tools.\n\nSKILLS\nJavaScript, React, Python, FastAPI, GitHub\n\nPROJECTS\nBuilt an internship tracker app with role filters and reminders.\nCreated a resume analysis tool with skill extraction and ATS scoring.\n\nEDUCATION\nB.Sc Computer Science, 2027`,
      student: `Student Beginner\nexample@email.com | +91 90000 00000 | City\n\nPROFESSIONAL SUMMARY\nBeginner student building strong software engineering fundamentals with academic and self-driven projects.\n\nSKILLS\nC, Python, HTML, CSS, JavaScript, Git\n\nACADEMIC PROJECTS\nDesigned a student attendance tracker with basic analytics dashboard.\nBuilt a mini web app for task reminders using React and local storage.\n\nCERTIFICATIONS\nCompleted foundational courses in Web Development and Python Programming.\n\nEDUCATION\nB.Tech / B.Sc (Current), Expected Graduation: 2027`,
    };

    buildPdf("minimal", starterTemplates[kind], `${kind}_starter_resume`);
  };

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">🛠️ Resume Builder + PDF Download</div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 18 }}>
            Build a clean resume from form inputs, pick a template, and download as PDF.
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={autofillFromAnalysis}>✨ Autofill From Analyzer</button>
            <button className="btn btn-success" onClick={downloadResume}>📥 Download My Resume (PDF)</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">🎯 Role-Based Suggestions</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <select
              className="resume-input"
              style={{ maxWidth: 260 }}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn btn-primary" onClick={applyRoleSuggestions} disabled={!roleData || loadingRole}>
              {loadingRole ? "Loading..." : "Apply To Builder"}
            </button>
          </div>

          {roleData ? (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
              <p><strong style={{ color: "var(--text-primary)" }}>Missing Skills:</strong> {roleData.missing_skills.join(", ") || "None"}</p>
              <p><strong style={{ color: "var(--text-primary)" }}>ATS Keywords:</strong> {roleData.ats_keywords.join(", ")}</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Project Ideas:</strong></p>
              <ul style={{ paddingLeft: 18 }}>
                {roleData.project_ideas.map((idea) => <li key={idea}>{idea}</li>)}
              </ul>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Role suggestions unavailable.</p>
          )}
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">🧾 Resume Details</div>
          <div className="resume-form-grid">
            <input className="resume-input" placeholder="Full Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            <input className="resume-input" placeholder="Email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            <input className="resume-input" placeholder="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            <input className="resume-input" placeholder="Location" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
          </div>

          <textarea ref={summaryRef} className="resume-textarea" placeholder="Professional Summary" value={form.summary} onChange={(e) => updateField("summary", e.target.value)} />
          <textarea ref={skillsRef} className="resume-textarea" placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => updateField("skills", e.target.value)} />
          <textarea ref={projectsRef} className="resume-textarea" placeholder="Projects" value={form.projects} onChange={(e) => updateField("projects", e.target.value)} />
          <textarea ref={experienceRef} className="resume-textarea" placeholder="Experience" value={form.experience} onChange={(e) => updateField("experience", e.target.value)} />
          <textarea ref={educationRef} className="resume-textarea" placeholder="Education" value={form.education} onChange={(e) => updateField("education", e.target.value)} />
        </div>

        <div className="card">
          <div className="section-title">📦 Starter Template Downloads</div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 14 }}>
            Quick download options for common use-cases.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => downloadStarterTemplate("fresher")}>Fresher Resume</button>
            <button className="btn btn-ghost" onClick={() => downloadStarterTemplate("developer")}>Developer Resume</button>
            <button className="btn btn-ghost" onClick={() => downloadStarterTemplate("internship")}>Internship Resume</button>
            <button className="btn btn-ghost" onClick={() => downloadStarterTemplate("student")}>Student Beginner Resume</button>
          </div>
        </div>
      </div>
    </main>
  );
}
