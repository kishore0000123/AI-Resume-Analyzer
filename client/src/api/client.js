import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export const analyzeResume = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
};

export const suggestImprovements = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/suggest", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const suggestImprovementsFromText = (text, skills = []) =>
  API.post("/suggest-text", { text, skills });

export const optimizeResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/optimize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const optimizeResumeFromText = (text, skills = []) =>
  API.post("/optimize-text", { text, skills });

export const getHistory = (limit = 20) => API.get(`/history?limit=${limit}`);

export const askBotQuestion = (question) => API.post("/chat", { question });

export const getRoleSuggestions = (role, currentSkills = []) =>
  API.post("/role-suggestions", { role, current_skills: currentSkills });

export const jdMatch = (file, jdText) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jd_text", jdText);
  return API.post("/jd-match", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const jdMatchFromText = (resumeText, jdText, skills = []) =>
  API.post("/jd-match-text", {
    resume_text: resumeText,
    jd_text: jdText,
    skills,
  });

export const generateInterviewQuestions = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/interview-questions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export default API;
