import { Pie } from "react-chartjs-2";
import "chart.js/auto";

function SkillsChart({ skills = [] }) {
  const labels = skills.length > 0 ? skills : ["No skills detected"];
  const dataValues = skills.length > 0 ? skills.map(() => 1) : [1];

  const colors = [
    "#2563eb",
    "#3b82f6",
    "#60a5fa",
    "#93c5fd",
    "#1d4ed8",
    "#312e81",
    "#7c3aed",
    "#8b5cf6",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: labels.map((_, index) => colors[index % colors.length]),
        borderColor: ["#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="chart-wrapper pie-chart-wrapper">
      <Pie data={data} options={options} />
    </div>
  );
}

export default SkillsChart;
