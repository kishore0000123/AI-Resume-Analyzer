import { useState } from "react";

const suggestions = [
  "How to build resume?",
  "Fresher tips",
  "Project section help",
  "What to write in skills?",
  "ATS tips",
];

function getBotReply(text) {
  const q = text.toLowerCase().trim();

  if (q.includes("how to build") || q.includes("build resume") || q.includes("start resume")) {
    return {
      text: "1. Add your name and contact details\n2. Add skills (React, Python, SQL, etc.)\n3. Add 2-3 projects with impact\n4. Add education and certifications\n5. Keep it one page and ATS-friendly.",
      action: "summary",
    };
  }

  if (q.includes("fresher") || q.includes("student") || q.includes("beginner")) {
    return {
      text: "As a fresher, focus on projects, skills, certifications, and internships. Show outcomes using numbers whenever possible.",
      action: "projects",
    };
  }

  if (q.includes("project")) {
    return {
      text: "Write projects as: Problem -> Solution -> Tech Stack -> Result. Use action verbs like Built, Designed, Implemented.",
      action: "projects",
    };
  }

  if (q.includes("skills") || q.includes("tech stack")) {
    return {
      text: "Add grouped skills: Languages, Frameworks, Databases, Tools. Include only what you can explain confidently.",
      action: "skills",
    };
  }

  if (q.includes("ats") || q.includes("keyword")) {
    return {
      text: "ATS tips: match job keywords, use standard section names, avoid tables/images, keep formatting clean, export as PDF.",
      action: null,
    };
  }

  return {
    text: "Good question. Ask me: 'How to build resume?', 'Fresher tips', 'Project section help', or 'What to write in skills?'.",
    action: null,
  };
}

export default function ResumeBot({ onAction }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi, I am your Resume Mentor Bot. Ask me anything about building a resume, projects, or ATS optimization.",
      action: null,
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (value = null) => {
    const text = (value ?? input).trim();
    if (!text) return;

    const reply = getBotReply(text);
    setMessages((prev) => [
      ...prev,
      { role: "user", text, action: null },
      { role: "bot", text: reply.text, action: reply.action },
    ]);
    setInput("");
  };

  return (
    <div className="bot-container">
      <h2>Resume Mentor Bot</h2>
      <p className="subtitle">Beginner-friendly resume questions and actionable guidance.</p>

      <div className="suggestions">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => handleSend(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            <p style={{ whiteSpace: "pre-line" }}>
              {msg.role === "user" ? "🧑 " : "🤖 "}
              {msg.text}
            </p>
            {msg.role === "bot" && msg.action && onAction && (
              <button
                className="bot-action-btn"
                onClick={() => onAction(msg.action)}
              >
                Open {msg.action} in Builder
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="input-box">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button onClick={() => handleSend()}>Send</button>
      </div>
    </div>
  );
}
