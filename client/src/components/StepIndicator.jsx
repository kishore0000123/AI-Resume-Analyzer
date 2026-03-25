export default function StepIndicator({ currentStep = 1, steps = [] }) {
  return (
    <div className="builder-stepper">
      {steps.map((label, idx) => (
        <div key={label} className={`builder-step ${currentStep >= idx + 1 ? "active" : ""}`}>
          {idx + 1}. {label}
        </div>
      ))}
    </div>
  );
}
