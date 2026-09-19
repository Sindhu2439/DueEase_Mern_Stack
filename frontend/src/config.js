const API_BASE_URL =
  window.location.hostname === "dueease-frontend.onrender.com"
    ? "https://dueease-backend.onrender.com"
    : import.meta.env.VITE_API_URL || "http://localhost:5000";

export default API_BASE_URL;