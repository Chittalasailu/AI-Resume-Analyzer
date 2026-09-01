import { useMemo, useState } from "react";

function InterviewQuestions({ analysis, jobDescription }) {
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [copied, setCopied] = useState(false);

  const generateQuestions = () => {
    const skills = analysis?.skills || [];
    const strengths = analysis?.strengths || [];
    const projects = analysis?.projects || [];
    const jd = jobDescription || "";

    const skillList = skills.slice(0, 4);
    const strengthList = strengths.slice(0, 3);
    const projectList = projects.slice(0, 3);

    const technical = [];
    const behavioral = [];

    for (let i = 0; i < count; i += 1) {
      const skill = skillList[i % skillList.length] || "problem-solving";
      const strength = strengthList[i % strengthList.length] || "adaptability";
      const project = projectList[i % projectList.length] || "a recent project";
      const jdContext = jd ? `for the role described in the job description` : "for your target role";

      technical.push({
        id: i + 1,
        text: `Tell me about your experience with ${skill} ${jdContext}. How would you approach a challenging scenario using this skill?`,
      });

      behavioral.push({
        id: i + 1,
        text: `Describe a time when you demonstrated ${strength} while working on ${project}. What was the outcome and what did you learn?`,
      });
    }

    const difficultyPrefix = difficulty === "Hard" ? "Advanced" : difficulty === "Easy" ? "Foundational" : "Practical";

    const enhancedTechnical = technical.map((item, index) => ({
      ...item,
      text: `${difficultyPrefix} technical question ${index + 1}: ${item.text}`,
    }));

    const enhancedBehavioral = behavioral.map((item, index) => ({
      ...item,
      text: `${difficultyPrefix} behavioral question ${index + 1}: ${item.text}`,
    }));

    setQuestions([
      {
        title: "Technical Questions",
        items: enhancedTechnical,
      },
      {
        title: "Behavioral Questions",
        items: enhancedBehavioral,
      },
    ]);
    setCopied(false);
  };

  const copyQuestions = async () => {
    if (!questions.length) return;
    const text = questions
      .map((section) => `${section.title}\n${section.items.map((item) => `${item.id}. ${item.text}`).join("\n")}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const downloadPdf = async () => {
    if (!questions.length) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Interview Questions", margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    questions.forEach((section) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.setFont("helvetica", "bold");
      doc.text(section.title, margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      section.items.forEach((item) => {
        const text = `${item.id}. ${item.text}`;
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 12 + 6;
      });
      y += 8;
    });

    doc.save(`interview-questions-${Date.now()}.pdf`);
  };

  const hasAnalysis = useMemo(() => Boolean(analysis), [analysis]);

  return (
    <div className="card interview-card">
      <div className="section-header">
        <h3>Interview Question Generator</h3>
        <p>Generate tailored technical and behavioral questions based on your resume.</p>
      </div>

      <div className="interview-controls">
        <label>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>

        <label>
          Number of Questions
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </label>

        <button className="btn btn-primary generate-btn" onClick={generateQuestions}>
          Generate Questions
        </button>
      </div>

      {questions.length > 0 && (
        <div className="questions-actions">
          <button className="btn btn-secondary btn-sm" onClick={copyQuestions}>
            {copied ? "Copied" : "Copy Questions"}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={downloadPdf}>
            Download PDF
          </button>
        </div>
      )}

      {questions.length > 0 && (
        <div className="questions-grid">
          {questions.map((section) => (
            <div className="questions-panel" key={section.title}>
              <h4>{section.title}</h4>
              {section.items.map((item) => (
                <div className="question-item" key={`${section.title}-${item.id}`}>
                  <span className="question-number">{item.id}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!hasAnalysis && (
        <p className="validation-message">
          Analyze a resume first to unlock the interview question generator.
        </p>
      )}
    </div>
  );
}

export default InterviewQuestions;
