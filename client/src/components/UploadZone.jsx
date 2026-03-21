import { useRef, useState } from "react";

export default function UploadZone({ onFileSelect, file, loading }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") onFileSelect(dropped);
  };

  const handleChange = (e) => {
    const picked = e.target.files[0];
    if (picked) onFileSelect(picked);
  };

  return (
    <div
      className="upload-zone"
      onClick={() => !loading && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      data-dragging={dragging}
      data-has-file={!!file}
      style={{
        border: `2px dashed ${dragging ? "var(--accent-1)" : file ? "var(--success)" : "var(--border)"}`,
        borderRadius: "var(--radius-xl)",
        padding: "60px 40px",
        textAlign: "center",
        cursor: loading ? "wait" : "pointer",
        background: dragging
          ? "rgba(108, 99, 255, 0.08)"
          : file
          ? "rgba(34, 211, 164, 0.05)"
          : "var(--bg-card)",
        transition: "all 0.25s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf" onChange={handleChange} style={{ display: "none" }} id="resume-upload" />

      {/* Glow ring */}
      {(dragging || file) && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          background: `radial-gradient(ellipse at center, ${file ? "rgba(34,211,164,0.08)" : "rgba(108,99,255,0.1)"} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div className="spinner" />
          <p style={{ color: "var(--text-secondary)" }}>Analyzing your resume…</p>
        </div>
      ) : file ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "3rem" }}>✅</div>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--success)" }}>{file.name}</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {(file.size / 1024).toFixed(1)} KB • Click to change
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(108,99,255,0.2), rgba(167,139,250,0.15))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", marginBottom: 4,
          }}>📄</div>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Drop your resume here
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            or <span style={{ color: "var(--accent-2)", fontWeight: 600 }}>click to browse</span>
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>PDF only • Max 10MB</p>
        </div>
      )}
    </div>
  );
}
