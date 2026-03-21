import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span>🧠</span>
          <span>ResumeAI</span>
        </Link>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link to="/" className={pathname === "/" ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: "8px 18px", fontSize: "0.875rem" }}>
            Upload
          </Link>
          <Link to="/dashboard" className={pathname === "/dashboard" ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: "8px 18px", fontSize: "0.875rem" }}>
            Dashboard
          </Link>
          <Link to="/generate-resume" className={pathname === "/generate-resume" ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: "8px 18px", fontSize: "0.875rem" }}>
            Generate Resume
          </Link>
        </div>
      </div>
    </nav>
  );
}
