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
          <Link to="/" className={`btn btn-ghost ${pathname === "/" ? "" : ""}`} style={{ padding: "8px 18px", fontSize: "0.875rem" }}>
            Upload
          </Link>
          {pathname === "/dashboard" && (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "0.875rem" }}>
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
