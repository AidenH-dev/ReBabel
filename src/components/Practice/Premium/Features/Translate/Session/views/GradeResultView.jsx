// Grade Result View - 2 Category Doughnut Charts (Grammar & Vocabulary)

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function GradeResultView({ gradeResult }) {
  const chartRefs = useRef({});

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getChartColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const categories = [
    { id: 'grammarChart', key: 'grammar', label: 'Grammar & Structure' },
    { id: 'vocabularyChart', key: 'vocabulary', label: 'Vocabulary' },
  ];

  // Render charts when grade result changes
  useEffect(() => {
    if (!gradeResult) return;

    // Destroy existing charts
    Object.keys(chartRefs.current).forEach((chartId) => {
      if (chartRefs.current[chartId]) {
        chartRefs.current[chartId].destroy();
        delete chartRefs.current[chartId];
      }
    });

    // Create new charts
    categories.forEach(({ id, key }) => {
      const value = gradeResult.grades[key] || 0;
      const color = getChartColor(value);

      const canvas = document.getElementById(id);
      if (canvas) {
        chartRefs.current[id] = new Chart(canvas, {
          type: 'doughnut',
          data: {
            datasets: [
              {
                data: [value, 100 - value],
                backgroundColor: [color, 'rgba(200,200,200,0.15)'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            cutout: '72%',
            plugins: {
              tooltip: { enabled: false },
              legend: { display: false },
            },
            animation: {
              animateRotate: true,
              animateScale: false,
            },
          },
        });
      }
    });

    // Cleanup
    return () => {
      Object.keys(chartRefs.current).forEach((chartId) => {
        if (chartRefs.current[chartId]) {
          chartRefs.current[chartId].destroy();
        }
      });
    };
  }, [gradeResult]);

  if (!gradeResult) return null;

  const avgScore = Math.round(
    ((gradeResult.grades.grammar || 0) + (gradeResult.grades.vocabulary || 0)) /
      2
  );

  return (
    <div className="max-h-none lg:max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
      <div className="space-y-4">
        {/* Score Circles */}
        <div className="flex justify-center gap-8">
          {categories.map(({ id, key, label }) => {
            const score = gradeResult.grades[key] || 0;
            const displayScore = Math.floor(score);
            return (
              <div key={id} className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24">
                  <canvas id={id}></canvas>
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getScoreColor(score)}`}
                  >
                    {displayScore}%
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Average Score */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Average
            </span>
            <span className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore}%
            </span>
          </div>
        </div>

        {/* AI Feedback */}
        {gradeResult.feedback && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Feedback
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {gradeResult.feedback}
            </p>
          </div>
        )}

        {/* Error Details (expandable) */}
        {gradeResult.errors && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#e30a5f]">
              View Error Details
            </summary>
            <div className="mt-2 space-y-2">
              {Object.entries(gradeResult.errors).map(
                ([category, errors]) =>
                  errors &&
                  errors.length > 0 && (
                    <div
                      key={category}
                      className="p-3 bg-gray-50 dark:bg-white/5 rounded"
                    >
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {category === 'grammar'
                          ? 'Grammar & Structure'
                          : 'Vocabulary'}
                      </p>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        {errors.map((err, idx) => (
                          <li key={idx}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
