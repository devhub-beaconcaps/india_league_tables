'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register all required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

// Modern color palette
export const colors = {
  primary: {
    DEFAULT: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    fade: 'rgba(59, 130, 246, 0.1)',
  },
  secondary: {
    DEFAULT: '#06b6d4',
    light: '#22d3ee',
    dark: '#0891b2',
    fade: 'rgba(6, 182, 212, 0.1)',
  },
  success: {
    DEFAULT: '#10b981',
    light: '#34d399',
    dark: '#059669',
    fade: 'rgba(16, 185, 129, 0.1)',
  },
  purple: {
    DEFAULT: '#8b5cf6',
    light: '#a78bfa',
    dark: '#7c3aed',
    fade: 'rgba(139, 92, 246, 0.1)',
  },
  orange: {
    DEFAULT: '#f97316',
    light: '#fb923c',
    dark: '#ea580c',
    fade: 'rgba(249, 115, 22, 0.1)',
  },
  pink: {
    DEFAULT: '#ec4899',
    light: '#f472b6',
    dark: '#db2777',
    fade: 'rgba(236, 72, 153, 0.1)',
  },
};

export const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#f8fafc',
      bodyColor: '#f8fafc',
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 13,
        weight: '600',
      },
      bodyFont: {
        size: 12,
      },
      displayColors: true,
      boxPadding: 4,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
        color: '#64748b',
        padding: 8,
      },
    },
    y: {
      grid: {
        color: 'rgba(100, 116, 139, 0.1)',
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
        color: '#64748b',
        padding: 8,
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
};

export const darkModeOptions = {
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
        color: '#94a3b8',
        padding: 8,
      },
    },
    y: {
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
        color: '#94a3b8',
        padding: 8,
      },
    },
  },
};
