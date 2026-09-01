import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "AI-Powered ATS Scoring",
    description:
      "Upload a PDF or DOCX resume and get an instant ATS score, extracted skills, strengths, and specific improvement suggestions.",
    icon: (
      <path d="M9 12.5 11 14.5 15.5 9.5M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
    ),
  },
  {
    title: "Job Description Matching",
    description:
      "Paste any job description to see your match percentage, which skills line up, which are missing, and keywords to add.",
    icon: (
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-5 9 2 2 4-4" />
    ),
  },
  {
    title: "Cover Letter Generator",
    description:
      "Generate a tailored draft cover letter from your resume analysis in seconds — copy it or export it as a PDF.",
    icon: (
      <path d="M4 4h16v16H4V4Zm4 4h8M8 12h8M8 16h5" />
    ),
  },
  {
    title: "Interview Question Prep",
    description:
      "Get technical and behavioral interview questions generated from your own skills and background, at your chosen difficulty.",
    icon: (
      <path d="M8 10a4 4 0 1 1 5 3.87V16m-1 4h.01M4 4h16v14a2 2 0 0 1-2 2H8l-4 3V4Z" transform="translate(0 -1)" />
    ),
  },
  {
    title: "One-Click PDF Reports",
    description:
      "Download a complete report of your score, skills, strengths, suggestions, and job match — ready to reference or share.",
    icon: (
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    ),
  },
  {
    title: "Private, Secure Accounts",
    description:
      "Your resumes and analyses stay behind bcrypt-hashed passwords and JWT-secured sessions, tied only to your account.",
    icon: (
      <path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Zm-1.5 9.5 1.5 1.5 3-3.5" />
    ),
  },
];

const STEPS = [
  {
    title: "Create your account",
    description: "Sign up in seconds with an email and password — hashed and never stored in plain text.",
  },
  {
    title: "Upload your resume",
    description: "Drop in a PDF or DOCX file and let the parser extract the real text content.",
  },
  {
    title: "Get instant AI analysis",
    description: "Receive an ATS score, skills breakdown, strengths, and concrete improvement suggestions.",
  },
  {
    title: "Match, write, prepare",
    description: "Check job fit, generate a cover letter, and practice with tailored interview questions.",
  },
];

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="feature-icon"
    >
      {children}
    </svg>
  );
}

function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="nav-brand">
            <span className="brand-mark" aria-hidden="true">AI</span>
            Resume Analyzer
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">AI-powered resume intelligence</span>
              <h1>
                Know your ATS score. <span className="text-gradient">Close the gap</span> to your
                next job.
              </h1>
              <p className="hero-subtitle">
                Upload your resume and get an instant, AI-driven breakdown: an ATS score, your
                extracted skills, real strengths, and specific improvements. Then match it against
                a job description, generate a cover letter, and prep for the interview — all in
                one place.
              </p>
              <div className="hero-actions">
                <Link to="/signup" className="btn btn-primary btn-lg">
                  Create free account
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  I already have an account
                </Link>
              </div>
              <p className="hero-note">No credit card. Just a resume and a few minutes.</p>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-dot" />
                  <span className="preview-dot" />
                  <span className="preview-dot" />
                  <span className="preview-label">Example analysis</span>
                </div>
                <div className="preview-body">
                  <div className="preview-score">
                    <div className="preview-score-ring">
                      <span>82</span>
                    </div>
                    <div>
                      <p className="preview-score-title">ATS Score</p>
                      <p className="preview-score-caption">Strong match for target roles</p>
                    </div>
                  </div>
                  <div className="preview-skills">
                    {["React", "Python", "SQL", "REST APIs", "AWS"].map((skill) => (
                      <span className="skill" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="preview-match">
                    <div className="preview-match-row">
                      <span>Job match</span>
                      <span>76%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: "76%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="section-intro">
            <span className="eyebrow">What you get</span>
            <h2>Everything you need to apply with confidence</h2>
            <p>Real, working features — nothing here is a placeholder.</p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <div className="feature-card" key={feature.title}>
                <div className="feature-icon-wrap">
                  <Icon>{feature.icon}</Icon>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section section-muted" id="how-it-works">
          <div className="section-intro">
            <span className="eyebrow">How it works</span>
            <h2>From resume to ready in four steps</h2>
          </div>

          <div className="steps-grid">
            {STEPS.map((step, index) => (
              <div className="step-card" key={step.title}>
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section cta-section">
          <div className="cta-card">
            <h2>Ready to see your ATS score?</h2>
            <p>Create a free account and analyze your first resume in under a minute.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get started for free
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="nav-brand">
            <span className="brand-mark" aria-hidden="true">AI</span>
            Resume Analyzer
          </div>
          <p>Built by Sailu Chittala.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
