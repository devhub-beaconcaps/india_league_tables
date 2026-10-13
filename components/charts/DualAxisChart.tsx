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
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================

export type ValueConvention = "Billions" | "Crores" | "Lakhs";

interface ChartDataPoint {
  month: string;
  issue: number;
  redemption: number;
  outstanding: number;
  [key: string]: string | number;
}

interface DualAxisChartProps {
  data?: ChartDataPoint[];
  /** Rupee display unit — must match the parent page's valueConvention */
  valueConvention?: ValueConvention;
}

// ============================================================================
// FORMATTERS (base data is assumed to be in Crores)
// ============================================================================

/** Full value shown in tooltip — e.g. "1,234 Cr", "12.34B", "1,23,400 L" */
const formatValueByConvention = (
  value: number,
  convention: ValueConvention
): string => {
  if (convention === "Billions") return `${(value / 100).toFixed(2)}B`;
  if (convention === "Crores") return `${value.toLocaleString()} Cr`;
  return `${(value * 100).toLocaleString()} L`;
};

/** Short tick label — e.g. "5k Cr", "2.5L Cr", "50L" */
const formatYAxisTick = (value: number, convention: ValueConvention): string => {
  if (convention === "Billions") {
    return value >= 100
      ? `${(value / 100).toFixed(0)}B`
      : `${(value / 100).toFixed(1)}B`;
  }

  if (convention === "Crores") {
    if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L Cr`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k Cr`;
    return `${value} Cr`;
  }

  // Lakhs
  if (value >= 1_00_000) return `${(value / 1000).toFixed(0)}k L`;
  if (value >= 100) return `${(value / 100).toFixed(0)}k L`;
  return `${value} L`;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function DualAxisChart({
  data = [],
  valueConvention = "Crores",
}: DualAxisChartProps): JSX.Element {
  const tickFormatter = (value: number | string) =>
    formatYAxisTick(Number(value), valueConvention);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-[#14142b] border border-gray-200 dark:border-[#423CAB]/40 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
          {label}
          <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
            (Rupees in {valueConvention})
          </span>
        </p>

        {payload.map((p: any, i: number) => {
          const color =
            (p.color as string) ||
            (p.stroke as string) ||
            (p.fill as string) ||
            "#000";

          return (
            <div
              key={i}
              className="flex items-center justify-between gap-4 mb-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {p.name}
                </span>
              </div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                {formatValueByConvention(Number(p.value ?? 0), valueConvention)}
              </div>
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
        margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e5e7eb"
          strokeOpacity={0.6}
          vertical={false}
        />

        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} />

        {/* Left Axis → Issue & Redemption */}
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 9, fill: "#9ca3af" }}
          tickFormatter={tickFormatter}
          width={58}
        />

        {/* Right Axis → Outstanding */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 9, fill: "#9ca3af" }}
          tickFormatter={tickFormatter}
          width={58}
        />

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