import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { useStreams } from "../hooks/useStreams";
import { useMarketData } from "../hooks/useMarketData";
import BetBottomSheet from "./markets/BetBottomSheet";
import MarketHeader from "./markets/MarketHeader";
import { LoadingState, EmptyState } from "./markets/LoadingState";

export default function Feed() {
  const { authenticated, login, user } = usePrivy();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState("trending");
  const [showSheet, setShowSheet] = useState(false);
  const [selectedSide, setSelectedSide] = useState("YES");
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);

  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api",
    []
  );

  // Custom hooks
  const { streams, initialLoading, refreshing } = useStreams(
    apiBase,
    authenticated,
    user?.id
  );
  const { pickActiveMarket, sortStreams } = useMarketData();
  const sortedStreams = useMemo(
    () => sortStreams(streams, sortKey),
    [streams, sortKey, sortStreams]
  );

  // Handlers
  const handleCardClick = (streamId) => {
    if (!authenticated) {
      login?.();
    } else {
      navigate(`/streams/${streamId}`);
    }
  };

  const handleBetClick = (side, stream, market) => {
    if (!authenticated) {
      login?.();
      return;
    }
    setSelectedSide(side);
    setSelectedStream(stream);
    setSelectedMarket(market);
    setShowSheet(true);
  };

  if (initialLoading) return <LoadingState />;
  if (streams.length === 0) return <EmptyState />;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Header */}
      <MarketHeader refreshing={refreshing} sortKey={sortKey} setSortKey={setSortKey} header="Feed" />

      {/* Feed Cards - Vertical Layout */}
      <div className="space-y-4">
        {sortedStreams.map((stream) => {
          const market = pickActiveMarket(stream) || (Array.isArray(stream?.markets) ? stream.markets[0] : null);

          return (
            <FeedCard
              key={stream.id}
              stream={stream}
              market={market}
              onCardClick={() => handleCardClick(stream.id)}
            />
          );
        })}
      </div>

      {/* Bottom sheet */}
      <BetBottomSheet
        show={showSheet}
        onClose={() => setShowSheet(false)}
        market={selectedMarket}
        stream={selectedStream}
        selectedSide={selectedSide}
      />
    </div>
  );
}

function FeedCard({ stream, market, onCardClick }) {
  const yesVol = Number(market?.yes_volume || 0);
  const noVol = Number(market?.no_volume || 0);
  const totalVol = Number(market?.total_volume ?? yesVol + noVol);
  const totalShares = Math.round(totalVol / 100); // Approximate shares

  // Determine outcome based on current prices
  const yesPrice = Number(market?.yes_price ?? 0.5);
  const outcome = yesPrice > 0.5 ? "YES" : "NO";
  const outcomeColor = outcome === "YES" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatTimeAgo = () => {
    if (!market?.created_at) return "32 min ago";
    const now = Date.now();
    const created = new Date(market.created_at).getTime();
    const diff = now - created;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onCardClick}
    >
      {/* Header: Avatar + Name + Time + Timer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {stream?.hamster_name?.charAt(0)?.toUpperCase() || "O"}
          </div>
          {/* Name + Time */}
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {stream?.hamster_name || "Ozempicdealer"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              • {formatTimeAgo()}
            </div>
          </div>
        </div>
        {/* Timer */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          00:17
        </div>
      </div>

      {/* Stats Row: Outcome, Shares, Value */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outcome</div>
          <div className={`text-sm font-semibold ${outcomeColor}`}>{outcome}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shares</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{totalShares}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(totalVol)}</div>
        </div>
      </div>

      {/* Market Question */}
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Market</div>
        <div className="text-sm text-gray-900 dark:text-white">
          {market?.question ||
            stream?.market_question ||
            stream?.title ||
            "Will the hamster finish under 60 seconds?"}
        </div>
      </div>
    </div>
  );
}

