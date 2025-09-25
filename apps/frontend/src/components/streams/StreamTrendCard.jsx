import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { chartTickFormatter } from "./streamFormatting";

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow">
      <div className="font-semibold text-gray-900">{chartTickFormatter(point.ts)}</div>
      <div className="mt-1 flex flex-col gap-0.5">
        <span className="font-semibold text-blue-600">NO {Math.round(point.noPct)}%</span>
        <span className="font-semibold text-emerald-600">YES {Math.round(point.yesPct)}%</span>
      </div>
    </div>
  );
}

export default function StreamTrendCard({
  trend,
  latestPoint,
  hoverPoint,
  setHoverPoint,
  bare = false,
  className = "",
}) {
  const containerClass = bare
    ? className
    : `rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 ${className}`.trim();

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            YES {latestPoint ? Math.round(latestPoint.yesPct) : "—"}%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            NO {latestPoint ? Math.round(latestPoint.noPct) : "—"}%
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">YES / NO Trend</h3>
      </div>

      <div className="mt-4 h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trend}
            margin={{ top: 10, right: 14, bottom: 10, left: 0 }}
            onMouseMove={(state) => {
              const next = state?.activePayload?.[0]?.payload;
              if (next && next !== hoverPoint) setHoverPoint(next);
            }}
            onMouseLeave={() => setHoverPoint(null)}
          >
            <CartesianGrid stroke="#eef2ff" strokeDasharray="4 4" />
            <XAxis
              dataKey="ts"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickMargin={10}
              stroke="#e2e8f0"
              tickFormatter={chartTickFormatter}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              stroke="#e2e8f0"
              tickFormatter={(value) => `${value}%`}
              width={40}
            />
            <Tooltip cursor={{ stroke: "#94a3b8", strokeDasharray: 4 }} content={<TrendTooltip />} />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="circle"
              iconSize={10}
              formatter={(value) => (value === "yesPct" ? "YES" : "NO")}
            />
            <Line type="monotone" dataKey="noPct" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="yesPct" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
