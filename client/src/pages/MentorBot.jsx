import { useNavigate } from "react-router-dom";
import ResumeBot from "../components/ResumeBot";

export default function MentorBot() {
  const navigate = useNavigate();

  const openBuilderSection = (section) => {
    navigate(`/generate?section=${section}`);
  };

  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="card">
          <ResumeBot onAction={openBuilderSection} />
        </div>
      </div>
    </main>
  );
}