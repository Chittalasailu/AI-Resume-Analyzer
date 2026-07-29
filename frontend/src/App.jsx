import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import ATSChart from "./components/charts/ATSChart";
import SkillsChart from "./components/charts/SkillsChart";
import JobDescription from "./components/JobDescription";
import MatchResults from "./components/MatchResults";
import CoverLetter from "./components/CoverLetter";
import InterviewQuestions from "./components/InterviewQuestions";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import History from "./pages/History";
import { generateResumeReport } from "./utils/pdfGenerator";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matchInput, setMatchInput] = useState("");
  const [matchError, setMatchError] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem("auth") || "null"));
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.access_token) {
      localStorage.setItem("auth", JSON.stringify(auth));
    }
  }, [auth]);

  const uploadResume = async () => {
    if (!file) {
      alert("Please select a resume.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const response = await axios.post(
        "https://ai-resume-analyzer-b219.onrender.com/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${auth?.access_token}`,
          },
        }
      );

      setResult(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || "Upload failed");
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

    const matchingSkills = skills.filter((skill) =>
      normalizedJob.includes(skill.toLowerCase())
    );

    const missingSkills = skills.filter(
      (skill) => !normalizedJob.includes(skill.toLowerCase())
    );

    const keywordMatches = normalizedSkills.filter((skill) =>
      normalizedJob.includes(skill)
    );

    const percentage = skills.length
      ? Math.round((keywordMatches.length / skills.length) * 100)
      : 0;

    const suggestedKeywords = Array.from(
      new Set(
        normalizedSkills
          .filter((skill) => !keywordMatches.includes(skill))
          .slice(0, 6)
      )
    );

    setMatchResult({
      percentage,
      matchingSkills,
      missingSkills,
      suggestedKeywords,
    });
  };

  const handleDownloadReport = () => {
    if (!result) {
      alert("Please analyze a resume first.");
      return;
    }

    generateResumeReport({
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

  const handleLogin = (data) => {
    setAuth(data);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setAuth(null);
    navigate("/login");
  };

  const ProtectedRoute = ({ children }) => {
    if (!auth?.access_token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <div>
      {auth?.access_token && (
        <nav className="top-nav">
          <div className="nav-brand">AI Resume Analyzer</div>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/history">History</Link>
            <Link to="/profile">Profile</Link>
            <button className="nav-logout" onClick={handleLogout}>Logout</button>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="container">
                <h1>🤖 AI Resume Analyzer</h1>

                <p className="subtitle">
                  Upload your resume and receive an AI-powered analysis.
                </p>

                <div
                  className="upload-box"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                      setFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <h2>📄 Drag & Drop Resume</h2>

                  <p>or choose a file</p>

                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                  />

                  {file && <p className="filename">✅ {file.name}</p>}
                </div>

                <button onClick={uploadResume}>🚀 Analyze Resume</button>

                {loading && <h2 className="loading">Analyzing...</h2>}

                {result && (
                  <>
                    <div className="dashboard">
                      <div className="card score-card">
                        <h3>ATS Score</h3>
                        <div className="score">{result.analysis.ats_score}</div>
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
                        <ul>
                          {result.analysis.strengths.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="card">
                        <h3>Suggestions</h3>
                        <ul>
                          {result.analysis.improvements.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="card summary-card">
                      <h3>Summary</h3>
                      <p>{result.analysis.summary}</p>
                    </div>

                    <div className="report-actions">
                      <button className="download-btn" onClick={handleDownloadReport}>
                        ⬇️ Download Report
                      </button>
                    </div>

                    <div className="match-section">
                      <JobDescription onAnalyze={analyzeMatch} error={matchError} />
                      <MatchResults result={matchResult} />
                      <CoverLetter analysis={result.analysis} filename={file?.name || "resume"} />
                      <InterviewQuestions analysis={result.analysis} jobDescription={matchInput} />
                    </div>
                  </>
                )}
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History token={auth?.access_token} user={auth?.user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="container">
                <div className="card profile-card">
                  <h2>Profile</h2>
                  <p><strong>Username:</strong> {auth?.user?.username}</p>
                  <p><strong>Email:</strong> {auth?.user?.email}</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={auth?.access_token ? "/" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;