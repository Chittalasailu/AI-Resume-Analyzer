import { useEffect, useState } from "react";
import axios from "axios";

function History({ token, user, onLogout }) {
  const [analyses, setAnalyses] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAnalyses(response.data.analyses || []);
    } catch {
      setAnalyses([]);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const deleteAnalysis = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAnalyses((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>History</h1>
          <p className="subtitle">Review your saved resume analyses and downloads.</p>
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="card empty-state">
          <h3>No saved analyses yet</h3>
          <p>Upload and analyze a resume to start building your history.</p>
        </div>
      ) : (
        <div className="history-grid">
          {analyses.map((item) => (
            <div className="card history-card" key={item.id}>
              <h3>{item.filename}</h3>
              <p><strong>ATS Score:</strong> {item.ats_score}</p>
              <p><strong>Job Match:</strong> {item.job_match}%</p>
              <p><strong>Uploaded:</strong> {new Date(item.created_at).toLocaleString()}</p>
              <div className="history-actions">
                <button className="secondary-btn">View</button>
                <button className="secondary-btn">Download PDF</button>
                <button className="secondary-btn danger-btn" onClick={() => deleteAnalysis(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
