import { useEffect, useState } from "react";

export default function ScoreGauge({ score }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  useEffect(() => {
    let start = 0;
    const step = () => {
      start += 2;
      if (start >= score) { setDisplayed(score); return; }
      setDisplayed(start);
      requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), 200);
  }, [score]);

  const offset = circumference - (displayed / 100) * circumference;

  const color =
    displayed >= 75 ? "#22d3a4" :
    displayed >= 50 ? "#f59e0b" :
    "#f43f5e";

  const label =
    displayed >= 75 ? "Excellent" :
    displayed >= 55 ? "Good" :
    displayed >= 35 ? "Fair" :
    "Needs Work";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <svg width={radius * 2} height={radius * 2} style={{ filter: `drop-shadow(0 0 18px ${color}55)` }}>
        {/* Background track */}
        <circle
          cx={radius} cy={radius} r={normalizedRadius}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Animated progress */}
        <circle
          cx={radius} cy={radius} r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.05s ease" }}
        />
        {/* Score text */}
        <text x="50%" y="44%" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">
          {displayed}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter, sans-serif">
          / 100
        </text>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{label}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Resume Score</div>
      </div>
    </div>
  );
}
