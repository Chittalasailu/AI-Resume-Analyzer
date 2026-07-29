import { Bar } from "react-chartjs-2";
import "chart.js/auto";

function ATSChart({ score = 0 }) {
  const safeScore = Number(score) || 0;

  const data = {
    labels: ["ATS Score"],
    datasets: [
      {
        label: "Score",
        data: [safeScore],
        backgroundColor: ["rgba(37, 99, 235, 0.85)"],
        borderColor: ["rgba(29, 78, 216, 1)"],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw}/100`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  return (
    <div className="chart-wrapper">
      <Bar data={data} options={options} />
    </div>
  );
}

export default ATSChart;
