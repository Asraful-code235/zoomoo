export default function StreamSummaryCards({ metrics }) {
  if (!metrics?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, tone }) => (
        <div
          key={label}
          className="flex h-24 flex-col justify-center rounded-2xl border border-gray-200 bg-white px-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
