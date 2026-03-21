export default function SkillBadge({ skill, variant = "primary" }) {
  return (
    <span className={`skill-badge skill-badge-${variant}`}>
      {skill}
    </span>
  );
}
