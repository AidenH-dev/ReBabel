import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

export default function SrsItemHistoryChart({ history, itemName }) {
  if (!history || history.length === 0) return null;

  // Sort chronologically (oldest first) for the chart
  const sorted = [...history].sort(
    (a, b) => new Date(a.time_created) - new Date(b.time_created)
  );

  const labels = sorted.map((h) => {
    const d = new Date(h.time_created);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const data = {
    labels,
    datasets: [
      {
        label: 'SRS Level',
        data: sorted.map((h) => h.srs_level),
        borderColor: 'var(--brand-pink)',
        backgroundColor: 'var(--brand-pink)',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        stepped: 'before',
        tension: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (ctx) => `Level ${ctx[0].raw}`,
          label: (ctx) => labels[ctx.dataIndex],
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 9,
        ticks: {
          stepSize: 1,
          color: isDark ? '#9ca3af' : '#6b7280',
          font: { size: 10 },
        },
        grid: {
          color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      },
      x: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: { size: 10 },
          maxRotation: 0,
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="mt-2 mb-1">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate mb-1">
        Level History
      </p>
      <div className="h-[180px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
