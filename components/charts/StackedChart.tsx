'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface StackedChartDataItem {
  id: number;
  name: string;
  arr_rank: string;
  code: string;
  description: string;
  value: number;
}

interface StackedChartProps {
  data: StackedChartDataItem[];
  height?: number;
  title?: string;
  valueConvention?: 'Crores' | 'Lakhs' | 'Billions';
}

interface TransformedData {
  name: string;
  [sector: string]: string | number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

// ─── Color Palette for Sectors ─────────────────────────────────────────────

const SECTOR_COLORS = [
  '#423CAB',   // Primary Purple
  '#ec4899',   // Pink
  '#7c3aed',   // Violet
  '#06b6d4',   // Cyan
  '#f59e0b',   // Amber
  '#10b981',   // Emerald
  '#ef4444',   // Red
  '#8b5cf6',   // Purple
  '#14b8a6',   // Teal
  '#f97316',   // Orange
  '#6366f1',   // Indigo
  '#84cc16',   // Lime
];

// ─── Value Formatting Helpers ────────────────────────────────────────────────

const formatValueByConvention = (value: number, convention: 'Crores' | 'Lakhs' | 'Billions' = 'Crores'): string => {
  if (convention === 'Billions') {
    return `${(value / 100).toFixed(2)}B`;
  }
  if (convention === 'Crores') {
    return `${value.toLocaleString()} Cr`;
  }
  // Lakhs
  return `${(value * 100).toLocaleString()} L`;
};

const formatYAxisTick = (value: number, convention: 'Crores' | 'Lakhs' | 'Billions' = 'Crores'): string => {
  if (convention === 'Billions') {
    return value >= 100 ? `${(value / 100).toFixed(0)}B` : `${(value / 100).toFixed(1)}B`;
  }
  if (convention === 'Crores') {
    return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value);
  }
  // Lakhs
  return value >= 100 ? `${(value / 100).toFixed(0)}k L` : `${value} L`;
};

// ─── Helper Functions ───────────────────────────────────────────────────────

const getShortForm = (name: string, maxLength: number = 12): string => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};

const formatValue = (value: number, convention: 'Crores' | 'Lakhs' | 'Billions' = 'Crores'): string => {
  return formatValueByConvention(value, convention);
};

// ─── Custom X-axis tick that stacks words vertically ────────────────────────

const VerticalXAxisTick = ({ x, y, payload }: any) => {
  const words = String(payload?.value ?? '').split(/[\s-]+/);
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="#9ca3af" fontSize={9}>
        {words.map((word: string, index: number) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : 11}>
            {word}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

// ... existing code ...

const CustomTooltip = ({ active, payload, label, valueConvention = 'Crores' }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueConvention?: 'Crores' | 'Lakhs' | 'Billions';
}) => {
  if (!active || !payload || !payload.length) return null;

  // Filter out zero values
  const validItems = payload.filter((p) => p.value > 0);

  if (validItems.length === 0) return null;

  const handleMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="
        bg-white
        dark:bg-[#14142b]
        border border-[#423CAB]/20
        dark:border-[#423CAB]/40
        rounded-xl
        shadow-2xl
        p-3
        min-w-[180px]
        relative
        z-50
      "
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
    >
      <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
        {label}
      </p>
      <div className="space-y-1 max-h-[150px] overflow-y-auto">
        {validItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                {item.name}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">
              {formatValue(item.value, valueConvention)}
            </span>
          </div>
        ))}
      </div>
      
    </div>
  );
};

// ... rest of code ...


// ─── Main Component ───────────────────────────────────────────────────────────

export default function StackedChart({
  data,
  height = 280,
  title = 'Issuer Sector Distribution',
  valueConvention = 'Crores',
}: StackedChartProps) {
  // Transform data for stacked bar chart
  const { chartData, sectors, colors } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], sectors: [], colors: [] };
    }

    // Group by name
    const grouped = new Map<string, Map<string, number>>();
    const uniqueSectors = new Set<string>();

    data.forEach((item) => {
      if (!grouped.has(item.name)) {
        grouped.set(item.name, new Map());
      }
      const issuerMap = grouped.get(item.name)!;
      issuerMap.set(item.description, item.value);
      uniqueSectors.add(item.description);
    });

    const sortedSectors = Array.from(uniqueSectors).sort();

    // Transform to Recharts format
    const transformed: TransformedData[] = [];
    grouped.forEach((sectorMap, name) => {
      const row: TransformedData = { name };
      sortedSectors.forEach((sector) => {
        row[sector] = sectorMap.get(sector) || 0;
      });
      transformed.push(row);
    });

    // Assign colors
    const sectorColors = sortedSectors.map(
      (_, i) => SECTOR_COLORS[i % SECTOR_COLORS.length]
    );

    return {
      chartData: transformed,
      sectors: sortedSectors,
      colors: sectorColors,
    };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-xs text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 60 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            strokeOpacity={0.6}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={<VerticalXAxisTick />}
            tickMargin={12}
            interval={0}
            height={60}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            tickFormatter={(v: number) => formatYAxisTick(v, valueConvention)}
            width={50}
          />
          <Tooltip
            content={<CustomTooltip valueConvention={valueConvention} />}
          />

          {sectors.map((sector, index) => (
            <Bar
              key={sector}
              dataKey={sector}
              stackId="issuer"
              fill={colors[index]}
              stroke={colors[index]}
              strokeWidth={1}
              radius={index === sectors.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={50}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {
        sectors.length > 0 && (
          <div
            className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center"
            style={{
              fontSize: '10px',
              maxHeight: '96px',
              overflowY: 'auto',
            }}
          >
            {sectors.map((sector, idx) => (
              <div key={sector} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: colors[idx] }}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {getShortForm(sector, 20)}
                </span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}