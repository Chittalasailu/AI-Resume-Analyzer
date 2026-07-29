function MatchResults({ result }) {
  if (!result) {
    return null;
  }

  const { percentage, matchingSkills, missingSkills, suggestedKeywords } = result;

  return (
    <div className="card match-results-card">
      <div className="section-header">
        <h3>Match Overview</h3>
        <p>Frontend keyword-based compatibility analysis.</p>
      </div>

      <div className="match-score-block">
        <div className="match-score-circle">
          <span>{percentage}%</span>
        </div>
        <div className="match-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percentage}%` }} />
          </div>
          <p className="match-caption">Overall match with the job description</p>
        </div>
      </div>

      <div className="results-grid">
        <div className="results-panel">
          <h4>Matching Skills</h4>
          <ul>
            {matchingSkills.length > 0 ? (
              matchingSkills.map((skill, index) => <li key={index}>{skill}</li>)
            ) : (
              <li>No direct matches found.</li>
            )}
          </ul>
        </div>

        <div className="results-panel">
          <h4>Missing Skills</h4>
          <ul>
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, index) => <li key={index}>{skill}</li>)
            ) : (
              <li>Great job — no missing skills detected.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="results-panel keywords-panel">
        <h4>Suggested Keywords</h4>
        <div className="skills">
          {suggestedKeywords.length > 0 ? (
            suggestedKeywords.map((keyword, index) => (
              <span className="skill" key={index}>
                {keyword}
              </span>
            ))
          ) : (
            <p>No keyword suggestions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchResults;
