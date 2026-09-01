// Base URL of the backend API. Set VITE_API_URL in a .env file to override
// (see .env.example). Falls back to the deployed Render backend so existing
// production builds keep working without requiring the env var to be set.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://ai-resume-analyzer-b219.onrender.com";

// Extracts a safe, displayable string from an axios error. FastAPI returns
// `detail` as a plain string for most errors, but as an array of
// { msg, loc, ... } objects for request-validation (422) failures — render
// either shape (and a total network failure) as one readable line.
export function getErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : null))
      .filter(Boolean)
      .join(" ") || fallback;
  }

  if (!err?.response) {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  return fallback;
}
