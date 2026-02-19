'use client';

import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { colors } from './ChartContainer';

export function StatCard({ title, value, change, trend, chartData, height = 60 }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: { radius: 0 },
    },
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <h3 className="stat-value">{value}</h3>
          <div className={cn('stat-change', trend === 'up' ? 'positive' : 'negative')}>
            {trend === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {change}
          </div>
        </div>
        {chartData && (
          <div style={{ width: 100, height }}>
            <Line data={chartData} options={options} />
          </div>
        )}
      </div>
    </div>
  );
}

export function MiniChart({ data, height = 40, color = colors.primary.DEFAULT }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        borderColor: color,
      },
      point: { radius: 0 },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}

import { cn } from '../../lib/utils';
