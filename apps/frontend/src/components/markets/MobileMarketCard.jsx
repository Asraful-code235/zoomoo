import { formatEndsAt, formatCurrency } from "../streams/streamFormatting";

export default function MobileMarketCard({ stream, market, containerW, onClick }) {
  const yesVol = Number(market?.yes_volume || 0);
  const noVol = Number(market?.no_volume || 0);
  const totalVol = Number(market?.total_volume ?? yesVol + noVol);
  const yesPct = Math.max(
    0,
    Math.min(100, Math.round(Number(market?.yes_price ?? 0.5) * 100))
  );

  return (
    <div
      className="shrink-0"
      style={{ width: Math.max(1, containerW) }}
      onClick={onClick}
    >
      <div className="px-6">
        <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col">
          {/* Top row: Question + Ends time */}
          <div className="flex w-full items-start justify-between gap-3 text-left">
            <h4 className="text-[17px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
              {market?.question ||
                stream?.market_question ||
                stream?.title ||
                stream?.name ||
                stream?.hamster_name ||
                "Market"}
            </h4>
            <div className="shrink-0 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
              Ends: {formatEndsAt(market?.ends_at)}
            </div>
          </div>

          {/* Bottom row: VOL · % · Yes/No segmented */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="text-gray-500 dark:text-gray-400">VOL:</span>{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalVol)}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{yesPct}%</div>
            <div className="inline-flex overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <span className="px-3 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                Yes
              </span>
              <span className="px-3 py-1 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30">
                No
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

