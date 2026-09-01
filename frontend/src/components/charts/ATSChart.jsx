import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

function getScoreBand(score) {
  if (score >= 80) return { label: "Excellent", color: "#16a34a", track: "#dcfce7" };
  if (score >= 60) return { label: "Good", color: "#2563eb", track: "#dbeafe" };
  if (score >= 40) return { label: "Fair", color: "#d97706", track: "#fef3c7" };
  return { label: "Needs work", color: "#dc2626", track: "#fee2e2" };
}

function ATSChart({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const band = getScoreBand(safeScore);

  const data = {
    labels: ["Score", "Remaining"],
    datasets: [
      {
        data: [safeScore, 100 - safeScore],
        backgroundColor: [band.color, band.track],
        borderWidth: 0,
        borderRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "76%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="ats-gauge">
      <div className="gauge-wrapper">
        <Doughnut data={data} options={options} />
        <div className="gauge-center" aria-hidden="true">
          <span className="gauge-score">{safeScore}</span>
          <span className="gauge-max">/ 100</span>
        </div>
      </div>
      <span className="gauge-band" style={{ color: band.color, backgroundColor: band.track }}>
        {band.label}
      </span>
    </div>
  );
}

export default ATSChart;
