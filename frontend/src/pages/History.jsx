import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, getErrorMessage } from "../api/config";
import { generateResumeReport } from "../utils/pdfGenerator";

function History({ token }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyses(response.data.analyses || []);
    } catch (err) {
      setAnalyses([]);
      setError(getErrorMessage(err, "Could not load your history."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const deleteAnalysis = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyses((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Could not delete this analysis. Please try again.");
    } finally {
      setConfirmingId(null);
    }
  };

  const downloadItem = async (item) => {
    await generateResumeReport({
      filename: item.filename,
      atsScore: item.ats_score,
      skills: item.skills || [],
      strengths: item.strengths || [],
      suggestions: item.suggestions || [],
      summary: item.summary || "",
      jobMatchPercentage: item.job_match || 0,
      matchingSkills: [],
      missingSkills: [],
      suggestedKeywords: [],
      generatedAt: new Date(item.created_at).toLocaleString(),
    });
  };

  return (
    <div className="container">
      <section className="page-welcome">
        <div>
          <span className="eyebrow">History</span>
          <h1>Analysis history</h1>
          <p className="subtitle">Review your saved resume analyses and export them anytime.</p>
        </div>
      </section>

      {error && (
        <p className="validation-message" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card empty-state">
          <span className="spinner spinner-dark" aria-hidden="true" />
          <p>Loading your history...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12.5 11 14.5 15.5 9.5M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
          <h3>No saved analyses yet</h3>
          <p>Upload and analyze a resume to start building your history.</p>
          <Link to="/dashboard" className="btn btn-primary">
            Analyze a resume
          </Link>
        </div>
      ) : (
        <div className="history-grid">
          {analyses.map((item) => (
            <div className="card history-card" key={item.id}>
              <div className="history-card-header">
                <h3>{item.filename}</h3>
                <span className="score-pill">{item.ats_score}</span>
              </div>
              <p className="history-meta">
                <strong>Job match:</strong> {item.job_match || 0}%
              </p>
              <p className="history-meta">
                <strong>Uploaded:</strong> {new Date(item.created_at).toLocaleString()}
              </p>

              {expandedId === item.id && (
                <div className="history-details">
                  {item.skills?.length > 0 && (
                    <div className="skills">
                      {item.skills.map((skill, i) => (
                        <span className="skill" key={i}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.summary && <p className="history-summary">{item.summary}</p>}
                </div>
              )}

              <div className="history-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  aria-expanded={expandedId === item.id}
                >
                  {expandedId === item.id ? "Hide details" : "View"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => downloadItem(item)}>
                  Download PDF
                </button>
                {confirmingId === item.id ? (
                  <>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteAnalysis(item.id)}
                    >
                      Confirm delete
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setConfirmingId(item.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
