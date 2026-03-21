import { useState } from "react";
import { useNavigate } from "react-router-dom";

const QUICK_PROMPTS = [
  "How to build resume?",
  "Fresher tips",
  "Project section help",
  "What to write in skills?",
  "ATS tips",
];

function getBotReply(input) {
  const text = input.toLowerCase().trim();

  if (text.includes("how to build") || text.includes("build resume") || text.includes("start resume")) {
    return {
      reply:
        "1) Add your name and contact details\n2) Add a short summary (2-3 lines)\n3) Add technical skills\n4) Add 2-3 projects with impact\n5) Add education/certifications\n6) Keep it 1 page and ATS-friendly",
      action: "summary",
    };
  }

  if (text.includes("fresher") || text.includes("student") || text.includes("beginner")) {
    return {
      reply:
        "As a fresher, focus on skills, projects, certifications, and internships. Use project bullets in this format: problem -> solution -> tech stack -> measurable result.",
      action: "projects",
    };
  }

  if (text.includes("project")) {
    return {
      reply:
        "Write each project with 4 parts: 1) Problem you solved 2) What you built 3) Tech stack 4) Result (speed, users, accuracy, etc.). Use action verbs like Built, Designed, Implemented.",
      action: "projects",
    };
  }

  if (text.includes("skill") || text.includes("tech stack")) {
    return {
      reply:
        "Create a clean skill list grouped by category: Languages, Frameworks, Databases, Tools. Keep only skills you can explain in interviews.",
      action: "skills",
    };
  }

  if (text.includes("ats") || text.includes("keyword")) {
    return {
      reply:
        "ATS tips: match keywords from job description, avoid tables/images, keep clear headings, use standard section names, and save as PDF.",
      action: null,
    };
  }

  return {
    reply: "Try asking: 'How to build resume?', 'Fresher tips', 'Project section help', or 'What to write in skills?'",
    action: null,
  };
}

export default function MentorBot() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi, I am your Resume Mentor Bot. Ask me anything about building a resume, projects, skills, or ATS optimization.",
      action: null,
    },
  ]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const openBuilderSection = (section) => {
    navigate(`/generate-resume?section=${section}`);
  };

  const sendMessage = (valueFromChip = null) => {
    const userText = (valueFromChip ?? input).trim();
    if (!userText) return;

    const { reply, action } = getBotReply(userText);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, action: null },
      { role: "bot", text: reply, action },
    ]);
    setInput("");
  };

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="card">
          <div className="section-title">🤖 Resume Mentor Bot</div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 14 }}>
            Ask beginner-friendly resume questions and get actionable guidance.
          </p>

          <div className="mentor-quick-chips">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="mentor-chat-window">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mentor-bubble ${msg.role === "bot" ? "mentor-bubble-bot" : "mentor-bubble-user"}`}>
                <p style={{ whiteSpace: "pre-line", marginBottom: msg.action ? 10 : 0 }}>
                  {msg.role === "user" ? "🧑 " : "🤖 "}
                  {msg.text}
                </p>
                {msg.role === "bot" && msg.action && (
                  <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => openBuilderSection(msg.action)}>
                    Open {msg.action} in Builder
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mentor-input-row">
            <input
              className="resume-input"
              placeholder="Ask: how to build resume?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button className="btn btn-success" onClick={() => sendMessage()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}