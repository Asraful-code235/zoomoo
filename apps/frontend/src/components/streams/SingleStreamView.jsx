import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Modal from "../Modal";
import { useSingleStream } from "../../hooks/streams/useSingleStream";
import StreamSummaryCards from "./StreamSummaryCards";
import StreamPlayerCard from "./StreamPlayerCard";
import StreamPositionsSection from "./StreamPositionsSection";
import StreamMarketsPanel from "./StreamMarketsPanel";
import { formatCurrency, formatSignedCurrency } from "./streamFormatting";

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

  const activeMarkets = marketsByStatus.active || [];
  const resolvedMarkets = marketsByStatus.resolved || [];

  const summaryMetrics = useMemo(() => {
    const markets = stream?.markets || [];
    const aggregates = markets.reduce(
      (acc, market) => {
        acc.openInterest += Number(market.open_interest ?? market.total_liquidity ?? 0);
        acc.volume += Number(market.total_volume ?? market.volume ?? 0);
        return acc;
      },
      { openInterest: 0, volume: 0 }
    );
    const pnl = Number(stream?.room_pnl ?? stream?.pnl ?? 0);

    return [
      { label: "Open Interest", value: formatCurrency(aggregates.openInterest) },
      { label: "Room Volume", value: formatCurrency(aggregates.volume) },
      { label: "Room PnL", value: formatSignedCurrency(pnl), tone: pnl >= 0 ? "up" : "down" },
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
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Loading hamster streams...</h2>
          <p className="text-base text-gray-600">Setting up the cameras...</p>
        </div>
      </div>
    );
  }

  if (attemptedLoad && stream === null) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-800">🚧 Stream Not Found</h2>
        <p className="mb-6 text-gray-600">The stream you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          to="/streams"
          className="inline-block rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          ← Back to Streams
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 bg-white  px-4">
      <StreamSummaryCards metrics={summaryMetrics} />

      <div className="grid gap-6 xl:grid-cols-[2.25fr_1fr]">
        <div className="space-y-6">
          <StreamPlayerCard stream={stream} />
          <StreamPositionsSection
            positions={userPositions}
            positionsLoading={positionsLoading}
            userHistory={userHistory}
            onRefresh={() => fetchStream(false)}
          />
        </div>

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

      <Modal isOpen={false} onClose={() => {}} />
    </div>
  );
}
