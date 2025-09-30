import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import StreamCard from "./streams/StreamCard";
import { useStreams } from "../hooks/useStreams";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import { useMarketData } from "../hooks/useMarketData";
import MobileMarketCard from "./markets/MobileMarketCard";
import MobileBetButtons from "./markets/MobileBetButtons";
import BetBottomSheet from "./markets/BetBottomSheet";
import MarketHeader from "./markets/MarketHeader";
import { LoadingState, EmptyState } from "./markets/LoadingState";

export default function StreamGrid() {
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
  const { streams, initialLoading, refreshing, myActiveSides } = useStreams(
    apiBase,
    authenticated,
    user?.id
  );
  const { pickActiveMarket, remainingMs, formatUSD, sortStreams } = useMarketData();
  const sortedStreams = useMemo(
    () => sortStreams(streams, sortKey),
    [streams, sortKey, sortStreams]
  );

  const {
    activeSlide,
    containerW,
    dragX,
    isDragging,
    sliderRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useSwipeGesture(sortedStreams.length);

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

  const activeStream = sortedStreams[activeSlide] || sortedStreams[0];
  const activeMarket = activeStream
    ? pickActiveMarket(activeStream) ||
      (Array.isArray(activeStream?.markets) ? activeStream.markets[0] : null)
    : null;

  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
      <MarketHeader refreshing={refreshing} sortKey={sortKey} setSortKey={setSortKey} />

      {/* Desktop grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {sortedStreams.map((stream, index) => {
          const market = pickActiveMarket(stream);
          const mySide =
            market && myActiveSides[market.id]
              ? myActiveSides[market.id]
              : undefined;

          return (
            <div key={stream.id} style={{ animationDelay: `${index * 0.05}s` }}>
              <StreamCard
                stream={stream}
                index={index}
                authenticated={authenticated}
                onNavigate={handleCardClick}
                pickActiveMarket={pickActiveMarket}
                remainingMs={remainingMs}
                formatUSD={formatUSD}
                mySide={mySide}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
