export default function StreamSummaryCards({ metrics }) {
  if (!metrics?.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 max-w-[900px]">
      {metrics.map(({ label, value, tone }) => (
        <div
          key={label}
          className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p
            className={`mt-1 text-xl font-bold ${
              tone === "up" ? "" : tone === "down" ? "text-rose-600" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
