import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
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

export const optimizeResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/optimize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getHistory = (limit = 20) => API.get(`/history?limit=${limit}`);

export default API;
