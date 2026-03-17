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
    return `${(numValue / 1000000).toFixed(1)}M`;
  };

  // Custom tooltip formatter - matches Recharts expected signature
  const formatTooltipValue = (
    value: number | string,
    name: string,
    item: PayloadItem,
    index: number,
    payload: PayloadItem[]
  ): [string, string] | string => {
    const numValue = Number(value);
    let formatted: string;

    if (name === "Outstanding") {
      formatted = `${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      formatted = `${(numValue / 1000).toFixed(1)}k`;
    } else {
      formatted = numValue.toLocaleString();
    }

    return [formatted, name];
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

        {/* Alternative: Simpler approach without custom formatter */}
        <Tooltip
          formatter={(value: number | string, name: string) => {
            const num = Number(value);
            if (name === "Outstanding") return [`${(num / 1000000).toFixed(2)}M`, name];
            if (num >= 1000) return [`${(num / 1000).toFixed(1)}k`, name];
            return [num.toLocaleString(), name];
          }}
        />
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