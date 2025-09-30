export default function StreamSummaryCards({ metrics }) {
  if (!metrics?.length) return null;

  return (
    <div className="grid grid-cols-4 gap-3 w-full">
      {metrics.map(({ label, value, tone }) => (
        <div
          key={label}
          className="flex flex-col justify-between rounded-[4px] md:border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 md:px-4 py-3"
        >
          <p className="text-[8px] md:text-[11px] font-semibold uppercase  tracking-wide text-[#00000080] dark:text-gray-400">{label}</p>
          <p
            className={`mt-1 text-[10px] md:text-xl font-bold ${
              tone === "up" ? "text-emerald-600 dark:text-emerald-400" : tone === "down" ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
