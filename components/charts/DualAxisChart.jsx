import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";



export default function DualAxisChart({ data = [] }) {
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
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
          }
        />

        {/* Right Axis → Outstanding */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 9, fill: "#9ca3af" }}
          tickFormatter={(v) =>
            `${(v / 1000000).toFixed(1)}M`
          }
        />

        <Tooltip />
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
        />
      </LineChart>
    </ResponsiveContainer>
  );
}