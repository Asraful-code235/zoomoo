import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Modal from "../Modal";
import { useSingleStream } from "../../hooks/streams/useSingleStream";
import StreamSummaryCards from "./StreamSummaryCards";
import StreamPlayerCard from "./StreamPlayerCard";
import StreamPositionsSection from "./StreamPositionsSection";
import StreamMarketsPanel from "./StreamMarketsPanel";
import { formatCurrency, formatSignedCurrency } from "./streamFormatting";
import MarketChart from "../markets/MarketChart";

const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function SingleStreamView() {
  const { streamId } = useParams();
  const {
    stream,
    loading,
    attemptedLoad,
    userPositions,
    userHistory,
    positionsLoading,
    betAmount,
    setBetAmount,
    placing,
    marketsByStatus,
    hasBetOnMarket,
    placeInlineBet,
    fetchStream,
  } = useSingleStream(streamId);

  const [isLiveView, setIsLiveView] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeMarkets = marketsByStatus.active || [];
  const resolvedMarkets = marketsByStatus.resolved || [];

  const summaryMetrics = useMemo(() => {
    const markets = stream?.markets || [];
    const aggregates = markets.reduce(
      (acc, market) => {
        acc.openInterest += Number(
          market.open_interest ?? market.total_liquidity ?? 0
        );
        acc.volume += Number(market.total_volume ?? market.volume ?? 0);
        return acc;
      },
      { openInterest: 0, volume: 0 }
    );
    const pnl = Number(stream?.room_pnl ?? stream?.pnl ?? 0);

    return [
      {
        label: "Open Interest",
        value: formatCurrency(aggregates.openInterest),
      },
      { label: "Room Volume", value: formatCurrency(aggregates.volume) },
      {
        label: "Room PnL",
        value: formatSignedCurrency(pnl),
        tone: pnl >= 0 ? "up" : "down",
      },
      { label: "Active Markets", value: String(activeMarkets.length || 0) },
    ];
  }, [stream?.markets, stream?.room_pnl, stream?.pnl, activeMarkets.length]);

  if (loading || !attemptedLoad) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="mb-8">
            <div className="text-6xl animate-bounce-slow mb-4">🐹</div>
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Loading hamster streams...
          </h2>
          <p className="text-base text-gray-600">Setting up the cameras...</p>
        </div>
      </div>
    );
  }

  if (attemptedLoad && stream === null) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-800">
          🚧 Stream Not Found
        </h2>
        <p className="mb-6 text-gray-600">
          The stream you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/streams"
          className="inline-block rounded-[4px] bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          ← Back to Streams
        </Link>
      </div>
    );
  }

  const handleToggleView = () => {
    setIsLiveView((prev) => !prev);
  };

  const handleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Get the first active market for the chart
  const currentMarket = activeMarkets[0] || null;

  return (
    <div className="w-full bg-white dark:bg-[#0D0F11] px-4 py-6">
      {/* Desktop Layout: LEFT column (cards + stream + positions) | RIGHT column (markets) */}
      <div className="flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto">
        {/* LEFT COLUMN: Summary Cards + Live Stream + Positions/Orders */}
        <div className="flex-1 space-y-3 md:space-y-6 min-w-0">
          <StreamSummaryCards metrics={summaryMetrics} />

          {/* Live Stream / Chart Card */}
          <div className="rounded-[4px] max-md:border-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 p-2 px-0 md:px-6">
              {isLiveView ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <button
                    type="button"
                    onClick={handleFullscreen}
                    className="flex h-8 w-8 items-center justify-center rounded-[4px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    title="Toggle fullscreen"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M14 14H0V0H14V14ZM1.75 12.25H12.25V1.75H1.75V12.25ZM11.5938 11.5938H5.90625V7H11.5938V11.5938Z"
                        fill="#737373"
                      />
                    </svg>
                  </button>
                </div>
              ) : <div></div>}

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span>{isLiveView ? "Live" : "Chart"}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isLiveView}
                  onClick={handleToggleView}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isLiveView
                      ? "bg-emerald-500 focus-visible:ring-emerald-400"
                      : "bg-gray-300 dark:bg-gray-600 focus-visible:ring-gray-400"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      isLiveView ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-2 px-0 md:px-6 md:pb-6">
              {isLiveView ? (
                <StreamPlayerCard stream={stream} />
              ) : (
                <div className="h-64 md:h-80">
                  <MarketChart market={currentMarket} />
                </div>
              )}
            </div>
          </div>

          {/* Positions/Orders Section */}
          <StreamPositionsSection
            positions={userPositions}
            positionsLoading={positionsLoading}
            userHistory={userHistory}
            onRefresh={() => fetchStream(false)}
          />
        </div>

        {/* RIGHT COLUMN: Active/Resolved Markets Panel */}
        <div className="w-full md:w-[380px] md:flex-shrink-0">
          <StreamMarketsPanel
            quickAmounts={QUICK_AMOUNTS}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            activeMarkets={activeMarkets}
            resolvedMarkets={resolvedMarkets}
            placing={placing}
            hasBetOnMarket={hasBetOnMarket}
            placeInlineBet={placeInlineBet}
          />
        </div>
      </div>

      <Modal isOpen={false} onClose={() => {}} />

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={handleFullscreen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-white"
                title="Exit fullscreen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Fullscreen content */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                {isLiveView ? (
                  <StreamPlayerCard stream={stream} />
                ) : (
                  <div className="h-[80vh]">
                    <MarketChart market={currentMarket} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
