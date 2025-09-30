import { useMemo, useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import StreamCard from "../streams/StreamCard";
import { useStreams } from "../../hooks/useStreams";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { useMarketData } from "../../hooks/useMarketData";
import MobileMarketCard from "./MobileMarketCard";
import MobileBetButtons from "./MobileBetButtons";
import BetBottomSheet from "./BetBottomSheet";
import MarketHeader from "./MarketHeader";
import { LoadingState, EmptyState } from "./LoadingState";
import MarketChart from "./MarketChart";

export default function MarketPage() {
  const { authenticated, login, user } = usePrivy();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState("trending");
  const [showSheet, setShowSheet] = useState(false);
  const [selectedSide, setSelectedSide] = useState("YES");
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [carouselSlide, setCarouselSlide] = useState(0);

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

  // Auto-rotate carousel every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselSlide((prev) => (prev + 1) % Math.min(3, sortedStreams.length));
    }, 8000);
    return () => clearInterval(interval);
  }, [sortedStreams.length]);

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

  // Get carousel streams (first 3)
  const carouselStreams = sortedStreams.slice(0, 3);
  const currentCarouselStream = carouselStreams[carouselSlide] || carouselStreams[0];
  const currentCarouselMarket = currentCarouselStream
    ? pickActiveMarket(currentCarouselStream) ||
      (Array.isArray(currentCarouselStream?.markets) ? currentCarouselStream.markets[0] : null)
    : null;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Carousel: Video + Chart - Max height 372px */}
      <div className="mb-6">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden" style={{ maxHeight: "372px" }}>
          {/* Question at top */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
              {currentCarouselMarket?.question ||
                currentCarouselStream?.market_question ||
                currentCarouselStream?.title ||
                "Will the hamster finish under 60 seconds?"}
            </h2>
          </div>

          {/* Video + Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0" style={{ height: "320px" }}>
            {/* Left: Video */}
            <div className="relative bg-black h-full">
              {currentCarouselStream?.playback_id ? (
                <MuxPlayer
                  streamType="on-demand"
                  playbackId={currentCarouselStream.playback_id}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🐹</div>
                    <p className="text-gray-400 text-sm">No stream available</p>
                  </div>
                </div>
              )}

              {/* Timer overlay */}
              <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
                00:17
              </div>
            </div>

            {/* Right: Chart */}
            <div className="h-full">
              <MarketChart market={currentCarouselMarket} />
            </div>
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex justify-center gap-1.5 z-10">
            {carouselStreams.map((_, index) => (
              <button
                key={index}
                onClick={() => setCarouselSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === carouselSlide
                    ? "w-6 h-1.5 bg-gray-900 dark:bg-white"
                    : "w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 dark:hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === carouselSlide ? "true" : "false"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Markets Section */}
      <MarketHeader refreshing={refreshing} sortKey={sortKey} setSortKey={setSortKey} />

      {/* Mobile: Swipeable cards */}
      <div className="md:hidden -mx-4 pb-36">
        <div
          ref={sliderRef}
          className="relative w-full overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex"
            style={{
              width: Math.max(1, containerW) * sortedStreams.length,
              transform: `translate3d(${-(activeSlide * Math.max(1, containerW)) + dragX}px, 0, 0)`,
              transition: isDragging ? "none" : "transform 300ms ease",
            }}
          >
            {sortedStreams.map((stream) => {
              const market =
                pickActiveMarket(stream) ||
                (Array.isArray(stream?.markets) ? stream.markets[0] : null);
              return (
                <MobileMarketCard
                  key={stream.id}
                  stream={stream}
                  market={market}
                  containerW={containerW}
                  onClick={() => handleCardClick(stream.id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile bet buttons */}
      <MobileBetButtons
        market={activeMarket}
        onYesClick={() => handleBetClick("YES", activeStream, activeMarket)}
        onNoClick={() => handleBetClick("NO", activeStream, activeMarket)}
      />

      {/* Bottom sheet */}
      <BetBottomSheet
        show={showSheet}
        onClose={() => setShowSheet(false)}
        market={selectedMarket}
        stream={selectedStream}
        selectedSide={selectedSide}
      />

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

