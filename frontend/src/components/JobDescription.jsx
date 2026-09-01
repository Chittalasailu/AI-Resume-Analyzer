import { useState } from "react";

function JobDescription({ onAnalyze, error }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    onAnalyze(text);
  };

  return (
    <div className="card match-input-card">
      <div className="section-header">
        <h3>Resume vs Job Description Matching</h3>
        <p>Paste a job description to see how well your resume aligns.</p>
      </div>

      <label htmlFor="job-description-textarea" className="sr-only">
        Job description
      </label>
      <textarea
        id="job-description-textarea"
        className="job-description-input"
        placeholder="Paste the job description here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && (
        <p className="validation-message" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary analyze-match-btn" onClick={handleSubmit}>
        Analyze Match
      </button>
    </div>
  );
}

export default JobDescription;
