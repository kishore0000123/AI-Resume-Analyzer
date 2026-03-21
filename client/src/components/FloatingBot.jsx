import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const suggestions = [
  "How to build resume?",
  "Fresher tips",
  "Project section help",
  "What to write in skills?",
  "ATS tips",
];

function getReply(text) {
  const q = text.toLowerCase().trim();

  if (q.includes("how to build") || q.includes("build resume") || q.includes("start resume")) {
    return {
      text: "1) Add your name and contact details\n2) Add a short summary\n3) Add technical skills\n4) Add 2-3 strong projects\n5) Add education and certifications\n6) Keep it one page and ATS-friendly.",
      action: "summary",
    };
  }

  if (q.includes("fresher") || q.includes("student") || q.includes("beginner")) {
    return {
      text: "As a fresher, focus on skills, projects, certifications, and internships. Use project bullets with measurable outcomes.",
      action: "projects",
    };
  }

  if (q.includes("project")) {
    return {
      text: "Project format: Problem -> Solution -> Tech stack -> Result. Keep each project to 2-4 impact bullets.",
      action: "projects",
    };
  }

  if (q.includes("skills") || q.includes("tech stack")) {
    return {
      text: "Group skills by category: Languages, Frameworks, Databases, Tools. Include only skills you can explain in interviews.",
      action: "skills",
    };
  }

  if (q.includes("ats") || q.includes("keyword")) {
    return {
      text: "ATS tips: use role keywords, clean section headings, no images/tables, and export as PDF.",
      action: null,
    };
  }

  return {
    text: "Nice question. Try: How to build resume?, Fresher tips, Project section help, or ATS tips.",
    action: null,
  };
}

export default function FloatingBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I am your Resume AI assistant. Ask anything about resume, skills, or projects.",
      action: null,
    },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, open]);

  const sendMessage = (value = null) => {
    const text = (value ?? input).trim();
    if (!text) return;

    const reply = getReply(text);
    setMessages((prev) => [
      ...prev,
      { role: "user", text, action: null },
      { role: "bot", text: reply.text, action: reply.action },
    ]);
    setInput("");
  };

  const openBuilderSection = (section) => {
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

          <div className="floating-bot-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="floating-bot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button onClick={() => sendMessage()}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
