import SortControls from "../SortControls";

export default function MarketHeader({
  refreshing,
  sortKey,
  setSortKey,
  header = "Market",
}) {
  return (
    <div className="mb-6 md:mb-8 flex gap-3 flex-row md:items-center justify-between">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {header}
          {refreshing && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              Refreshing…
            </span>
          )}
        </h2>
      </div>
      <SortControls sortKey={sortKey} setSortKey={setSortKey} />
    </div>
  );
}
