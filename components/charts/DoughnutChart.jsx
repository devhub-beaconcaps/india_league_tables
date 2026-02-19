'use client';

import { Doughnut } from 'react-chartjs-2';

export function DoughnutChart({ data, height = 150, showCenterText = false, centerText = '' }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={data} options={options} />
      {showCenterText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[var(--color-foreground)]">
            {centerText}
          </span>
        </div>
      )}
    </div>
  );
}
