import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { askBotQuestion } from "../api/client";

const suggestions = [
  "I am a fresher, how to build a resume?",
  "What skills should I add for full stack developer?",
  "How can I improve ATS score?",
  "How do I write project bullets?",
  "Write a summary for fresher profile",
];

function buildLocalFallbackReply(text) {
  const q = text.toLowerCase().trim();
  if (q.includes("full stack") || q.includes("fullstack")) {
    return {
      text:
        "A full stack developer should show frontend, backend, database, and tooling skills.\n\n" +
        "Suggested stack:\n" +
        "- Frontend: HTML, CSS, JavaScript, React\n" +
        "- Backend: Node.js/Express or FastAPI\n" +
        "- Database: MongoDB or PostgreSQL\n" +
        "- Tools: Git, GitHub, Postman",
      action: "role:Full Stack Developer",
    };
  }

  if (q.includes("fresher") || q.includes("build resume") || q.includes("start resume")) {
    return {
      text:
        "If you are a fresher, focus on skills, projects, and education.\n\n" +
        "1. Header (name, email, phone, links)\n" +
        "2. 2-3 line summary\n" +
        "3. Skills by category\n" +
        "4. 2-3 projects with outcomes\n" +
        "5. Education and certifications",
      action: "summary",
    };
  }

  return {
    text:
      "I can help with fresher resumes, role-based skills, ATS improvement, and project bullets.\n" +
      "Try asking: I am a fresher, how to build a resume?",
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
    } catch {
      const reply = buildLocalFallbackReply(text);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: reply.text, action: reply.action },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const openBuilderSection = (section) => {
    if (section?.startsWith("role:")) {
      const role = section.replace("role:", "");
      navigate(`/generate?role=${encodeURIComponent(role)}&section=skills`);
      setOpen(false);
      return;
    }
    navigate(`/generate?section=${section}`);
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
