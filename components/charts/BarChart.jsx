'use client';

import { Bar } from 'react-chartjs-2';
import { commonOptions } from './ChartContainer';

export function BarChart({ data, height = 200, horizontal = false }) {
  const options = {
    ...commonOptions,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        stacked: true,
      },
      y: {
        ...commonOptions.scales.y,
        stacked: true,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
