import { Link } from "react-router-dom";

export default function StreamOverviewHeader({ stream, refreshing, lastUpdated, onRefresh }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/streams"
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            title="Back to Streams"
          >
            ← Back
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-lg text-white">
            🐹
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 md:text-xl">{stream.hamster_name}</h1>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Live Stream · Prediction Markets</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
          {refreshing && <span className="text-emerald-600">Refreshing…</span>}
          {lastUpdated && (
            <span>Updated {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
