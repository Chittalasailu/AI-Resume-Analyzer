import { useRef, useState } from "react";
import axios from "axios";
import ATSChart from "../components/charts/ATSChart";
import SkillsChart from "../components/charts/SkillsChart";
import JobDescription from "../components/JobDescription";
import MatchResults from "../components/MatchResults";
import CoverLetter from "../components/CoverLetter";
import InterviewQuestions from "../components/InterviewQuestions";
import { generateResumeReport } from "../utils/pdfGenerator";
import { API_BASE_URL, getErrorMessage } from "../api/config";

function Dashboard({ auth }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [matchInput, setMatchInput] = useState("");
  const [matchError, setMatchError] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const fileInputRef = useRef(null);

  const firstName = auth?.user?.username || "there";

  const uploadResume = async () => {
    if (!file) {
      setUploadError("Please select a resume file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${auth?.access_token}`,
        },
      });

      setResult(response.data);
      setMatchResult(null);
      setMatchInput("");
    } catch (error) {
      setUploadError(getErrorMessage(error, "Upload failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const analyzeMatch = (jobDescription) => {
    setMatchInput(jobDescription);

    if (!jobDescription || !jobDescription.trim()) {
      setMatchError("Please enter a job description first.");
      setMatchResult(null);
      return;
    }

    setMatchError("");

    const skills = result?.analysis?.skills || [];
    const normalizedJob = jobDescription.toLowerCase();
    const normalizedSkills = skills.map((skill) => skill.toLowerCase());

    const matchingSkills = skills.filter((skill) => normalizedJob.includes(skill.toLowerCase()));
    const missingSkills = skills.filter((skill) => !normalizedJob.includes(skill.toLowerCase()));
    const keywordMatches = normalizedSkills.filter((skill) => normalizedJob.includes(skill));

    const percentage = skills.length
      ? Math.round((keywordMatches.length / skills.length) * 100)
      : 0;

    const suggestedKeywords = Array.from(
      new Set(normalizedSkills.filter((skill) => !keywordMatches.includes(skill)).slice(0, 6))
    );

    setMatchResult({ percentage, matchingSkills, missingSkills, suggestedKeywords });
  };

  const handleDownloadReport = async () => {
    if (!result) return;

    await generateResumeReport({
      filename: file?.name || "resume.pdf",
      atsScore: result.analysis.ats_score,
      skills: result.analysis.skills || [],
      strengths: result.analysis.strengths || [],
      suggestions: result.analysis.improvements || [],
      summary: result.analysis.summary || "",
      jobMatchPercentage: matchResult?.percentage ?? 0,
      matchingSkills: matchResult?.matchingSkills || [],
      missingSkills: matchResult?.missingSkills || [],
      suggestedKeywords: matchResult?.suggestedKeywords || [],
      generatedAt: new Date().toLocaleString(),
    });
  };

  const handleFileChange = (selected) => {
    if (!selected) return;
    setFile(selected);
    setUploadError("");
  };

  return (
    <div className="container dashboard-page">
      <section className="page-welcome">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Welcome back, {firstName}</h1>
          <p className="subtitle">
            Upload a resume to get an AI-powered ATS score, skills breakdown, and improvement plan.
          </p>
        </div>
      </section>

      <section className="card upload-card">
        <div
          className={`upload-box${dragActive ? " upload-box-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files.length > 0) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="upload-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          </div>
          <h2>Drag &amp; drop your resume</h2>
          <p>or click to browse — PDF or DOCX</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="sr-only"
            id="resume-file-input"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
          <label htmlFor="resume-file-input" className="sr-only">
            Choose a resume file
          </label>

          {file && (
            <p className="filename">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {file.name}
            </p>
          )}
        </div>

        {uploadError && (
          <p className="validation-message" role="alert">
            {uploadError}
          </p>
        )}

        <button
          className="btn btn-primary btn-lg analyze-btn"
          onClick={uploadResume}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" /> Analyzing...
            </>
          ) : (
            "Analyze Resume"
          )}
        </button>
      </section>

      {result && (
        <>
          <section className="dashboard-grid">
            <div className="card score-card">
              <h3>ATS Score</h3>
              <ATSChart score={result.analysis.ats_score} />
            </div>

            <div className="card">
              <h3>Skills</h3>
              <div className="skills">
                {result.analysis.skills.map((skill, i) => (
                  <span className="skill" key={i}>
                    {skill}
                  </span>
                ))}
              </div>
              <SkillsChart skills={result.analysis.skills} />
            </div>

            <div className="card">
              <h3>Strengths</h3>
              <ul className="check-list">
                {result.analysis.strengths.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Suggestions</h3>
              <ul className="dot-list">
                {result.analysis.improvements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card summary-card">
            <h3>Summary</h3>
            <p>{result.analysis.summary}</p>
          </section>

          <div className="report-actions">
            <button className="btn btn-secondary" onClick={handleDownloadReport}>
              Download Full Report
            </button>
          </div>

          <section className="match-section">
            <JobDescription onAnalyze={analyzeMatch} error={matchError} />
            <MatchResults result={matchResult} />
            <CoverLetter analysis={result.analysis} filename={file?.name || "resume"} />
            <InterviewQuestions analysis={result.analysis} jobDescription={matchInput} />
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
