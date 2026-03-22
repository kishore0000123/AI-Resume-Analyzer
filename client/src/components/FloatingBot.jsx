import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { askBotQuestion } from "../api/client";

const suggestions = [
  "How to build resume?",
  "Fresher tips",
  "Frontend Developer role",
  "Backend Developer role",
  "Data Scientist role",
  "Project section help",
  "What to write in skills?",
  "ATS tips",
];

function getReply(text, stage) {
  const q = text.toLowerCase().trim();

  if (stage === "fresher" && (q.includes("yes") || q.includes("start") || q.includes("ok") || q.includes("sure"))) {
    return {
      text:
        "Awesome, let us build your fresher resume step-by-step.\n\n" +
        "Step 1: Add your name, email, and phone.\n" +
        "Step 2: Add a short summary (2-3 lines).\n" +
        "Step 3: Add skills and at least 2 projects with outcomes.\n\n" +
        "Click below to start in Resume Builder.",
      action: "summary",
      nextStage: "building",
    };
  }

  if (q.includes("how to build") || q.includes("build resume") || q.includes("start resume")) {
    return {
      text: "1) Add your name and contact details\n2) Add a short summary\n3) Add technical skills\n4) Add 2-3 strong projects\n5) Add education and certifications\n6) Keep it one page and ATS-friendly.",
      action: "summary",
      nextStage: null,
    };
  }

  if (q.includes("frontend developer") || q.includes("frontend role")) {
    return {
      text: "For Frontend Developer roles, prioritize React, JavaScript, TypeScript, HTML/CSS, and responsive UI projects.",
      action: "role:Frontend Developer",
      nextStage: null,
    };
  }

  if (q.includes("backend developer") || q.includes("backend role")) {
    return {
      text: "For Backend Developer roles, prioritize Python/Node, FastAPI/Express, SQL, APIs, and scalable backend projects.",
      action: "role:Backend Developer",
      nextStage: null,
    };
  }

  if (q.includes("data scientist") || q.includes("data analyst") || q.includes("data role")) {
    return {
      text: "For Data roles, show Python, SQL, Pandas, ML basics, and projects with clear metrics and insights.",
      action: "role:Data Scientist",
      nextStage: null,
    };
  }

  if (q.includes("fresher") || q.includes("student") || q.includes("beginner") || q.includes("no experience")) {
    return {
      text:
        "Great. As a fresher, your resume should focus on:\n\n" +
        "- Strong projects\n" +
        "- Skills (React, Node, Python, etc.)\n" +
        "- Certifications\n" +
        "- Internships (if any)\n\n" +
        "Do you want me to help you build a fresher resume step-by-step?",
      action: null,
      nextStage: "fresher",
    };
  }

  if (q.includes("project")) {
    return {
      text: "Project format: Problem -> Solution -> Tech stack -> Result. Keep each project to 2-4 impact bullets.",
      action: "projects",
      nextStage: null,
    };
  }

  if (q.includes("skills") || q.includes("tech stack")) {
    return {
      text: "Group skills by category: Languages, Frameworks, Databases, Tools. Include only skills you can explain in interviews.",
      action: "skills",
      nextStage: null,
    };
  }

  if (q.includes("ats") || q.includes("keyword")) {
    return {
      text: "ATS tips: use role keywords, clean section headings, no images/tables, and export as PDF.",
      action: null,
      nextStage: null,
    };
  }

  return {
    text: "Hi! I'm your Resume AI assistant. I can help you build a strong resume. What would you like to start with?",
    action: null,
    nextStage: null,
  };
}

export default function FloatingBot() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I am your Resume AI assistant. Ask anything about resume, skills, or projects.",
      action: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, open]);

  const sendMessage = async (value = null) => {
    const text = (value ?? input).trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { role: "user", text, action: null }]);
    setInput("");

    setIsSending(true);
    try {
      const { data } = await askBotQuestion(text);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || "I could not generate a response.", action: data.action || null },
      ]);
      if ((text.toLowerCase().includes("fresher") || text.toLowerCase().includes("student") || text.toLowerCase().includes("beginner")) && !data.action) {
        setStage("fresher");
      } else if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("start")) {
        setStage("building");
      } else {
        setStage(null);
      }
    } catch {
      const reply = getReply(text, stage);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: reply.text, action: reply.action },
      ]);
      setStage(reply.nextStage);
    } finally {
      setIsSending(false);
    }
  };

  const openBuilderSection = (section) => {
    if (section?.startsWith("role:")) {
      const role = section.replace("role:", "");
      navigate(`/generate-resume?role=${encodeURIComponent(role)}&section=skills`);
      setOpen(false);
      return;
    }
    navigate(`/generate-resume?section=${section}`);
    setOpen(false);
  };

  return (
    <>
      <button className="floating-bot-icon" onClick={() => setOpen((prev) => !prev)} aria-label="Open Resume Bot">
        🤖
      </button>

      {open && (
        <div className="floating-bot-popup">
          <div className="floating-bot-header">
            <span>Resume AI Bot</span>
            <button className="floating-bot-close" onClick={() => setOpen(false)} aria-label="Close bot">
              ✖
            </button>
          </div>

          <div className="floating-bot-body" ref={chatRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`floating-msg ${msg.role}`}>
                <p style={{ whiteSpace: "pre-line" }}>{msg.text}</p>
                {msg.role === "bot" && msg.action && (
                  <button className="floating-action-btn" onClick={() => openBuilderSection(msg.action)}>
                    Open {msg.action}
                  </button>
                )}
              </div>
            ))}
          </div>

          {messages.length <= 2 && (
            <div className="floating-bot-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="floating-bot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button onClick={() => sendMessage()} disabled={isSending}>{isSending ? "..." : "➤"}</button>
          </div>
        </div>
      )}
    </>
  );
}
