import { JSX } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts";

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface ChartDataPoint {
  month: string;
  issue: number;
  redemption: number;
  outstanding: number;
  [key: string]: string | number;
}

interface DualAxisChartProps {
  data?: ChartDataPoint[];
}

// Recharts payload item type
interface PayloadItem {
  value: number | string;
  name: string;
  dataKey?: string;
  payload?: ChartDataPoint;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export default function DualAxisChart({
  data = [],
}: DualAxisChartProps): JSX.Element {

  // Left axis tick formatter (Issue & Redemption)
  const formatLeftAxisTick = (value: number | string): string => {
    const numValue = Number(value);
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(0)}k`;
    }
    return String(value);
  };

  // Right axis tick formatter (Outstanding)
  const formatRightAxisTick = (value: number | string): string => {
    const numValue = Number(value);
    // show in lakhs (1 L = 100,000)
    return `${(numValue / 100000).toFixed(1)}L`;
  };

  // Custom tooltip for this component only. Uses dark:bg-[#14142b].
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-[#14142b] border border-gray-200 dark:border-[#423CAB]/40 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        {payload.map((p: any, i: number) => {
          const num = Number(p.value || 0);
          let formatted: string;
          if (p.name === 'Outstanding') formatted = `${(num / 100000).toFixed(2)}L`;
          else if (num >= 1000) formatted = `${(num / 1000).toFixed(1)}k`;
          else formatted = num.toLocaleString();

          const color = (p.color as string) || (p.stroke as string) || (p.fill as string) || '#000';

          return (
            <div key={i} className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-300">{p.name}</span>
              </div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">{formatted}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e5e7eb"
          strokeOpacity={0.6}
          vertical={false}
        />

        <XAxis
          dataKey="month"
          tick={{ fontSize: 9, fill: "#9ca3af" }}
        />

        {/* Left Axis → Issue & Redemption */}
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 9, fill: "#9ca3af" }}
          tickFormatter={formatLeftAxisTick}
        />

        {/* Right Axis → Outstanding */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 9, fill: "#9ca3af" }}
          tickFormatter={formatRightAxisTick}
        />

        {/* Component-local custom tooltip (dark:bg-[#14142b]) */}
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 9 }} />

        {/* Issue */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="issue"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={{ r: 2 }}
          name="Issue"
          activeDot={{ r: 4 }}
        />

        {/* Redemption */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="redemption"
          stroke="#ec4899"
          strokeWidth={2}
          dot={{ r: 2 }}
          name="Redemption"
          activeDot={{ r: 4 }}
        />

        {/* Outstanding */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="outstanding"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 2 }}
          name="Outstanding"
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}