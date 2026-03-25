import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import GenerateResume from "./pages/GenerateResume";
import PreviewResume from "./pages/PreviewResume";
import FloatingBot from "./components/FloatingBot";

export default function App() {
  return (
    <BrowserRouter>
      {/* Animated background orbs */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<GenerateResume />} />
          <Route path="/preview" element={<PreviewResume />} />
          <Route path="/generate-resume" element={<GenerateResume />} />
        </Routes>
        <FloatingBot />
      </div>
    </BrowserRouter>
  );
}
