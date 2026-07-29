import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

function CoverLetter({ analysis, filename }) {
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const generateLetter = () => {
    if (!companyName.trim() || !jobTitle.trim()) {
      setCoverLetter("Please enter both the company name and job title.");
      return;
    }

    const skills = analysis?.skills || [];
    const strengths = analysis?.strengths || [];
    const summary = analysis?.summary || "";

    const skillText = skills.slice(0, 5).join(", ");
    const strengthText = strengths.slice(0, 3).join("; ");

    const letter = `Dear Hiring Manager at ${companyName},

I am excited to apply for the ${jobTitle} position at ${companyName}. With a strong foundation in ${skillText} and a demonstrated ability to contribute meaningfully to professional teams, I am confident in my ability to add value to your organization.

My background reflects a combination of technical strength and practical problem-solving. ${summary || "I bring a thoughtful and results-oriented approach to my work, with a clear focus on continuous improvement and delivering quality outcomes."} My key strengths include ${strengthText || "adaptability, collaboration, and strong communication"}, which allow me to contribute effectively in fast-paced environments.

I am particularly drawn to ${companyName} because of its reputation for innovation and growth. I would welcome the opportunity to discuss how my experience and skills can support your team and help advance your goals in the ${jobTitle} role.

Thank you for your time and consideration. I look forward to the opportunity to speak with you further about how I can contribute to ${companyName}.

Sincerely,
${filename || "Applicant"}`;

    setCoverLetter(letter);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!coverLetter) return;

    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const downloadAsPdf = () => {
    if (!coverLetter) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const lines = doc.splitTextToSize(coverLetter, pageWidth - margin * 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Cover Letter", margin, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(lines, margin, 80);
    doc.save(`cover-letter-${Date.now()}.pdf`);
  };

  const canGenerate = useMemo(() => Boolean(analysis), [analysis]);

  return (
    <div className="card cover-letter-card">
      <div className="section-header">
        <h3>Cover Letter Generator</h3>
        <p>Create a polished draft using your resume analysis.</p>
      </div>

      <div className="cover-letter-form">
        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Job Title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />

        <button className="generate-btn" onClick={generateLetter}>
          ✨ Generate Cover Letter
        </button>
      </div>

      {coverLetter && (
        <div className="cover-letter-output">
          <div className="cover-letter-actions">
            <button className="secondary-btn" onClick={copyToClipboard}>
              {copied ? "✅ Copied" : "📋 Copy to Clipboard"}
            </button>
            <button className="secondary-btn" onClick={downloadAsPdf}>
              ⬇️ Download as PDF
            </button>
          </div>

          <div className="cover-letter-text">{coverLetter}</div>
        </div>
      )}

      {!canGenerate && (
        <p className="validation-message">
          Analyze a resume first to unlock the cover letter generator.
        </p>
      )}
    </div>
  );
}

export default CoverLetter;
