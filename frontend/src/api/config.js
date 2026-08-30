// Base URL of the backend API. Set VITE_API_URL in a .env file to override
// (see .env.example). Falls back to the deployed Render backend so existing
// production builds keep working without requiring the env var to be set.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://ai-resume-analyzer-b219.onrender.com";
