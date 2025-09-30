import { useMemo, useState } from "react";
import { formatCurrency } from "./streamFormatting";
import BetBottomSheet from "./BetBottomSheet";

const PLACEHOLDER_ACTIVE_MARKETS = [
  {
    id: "placeholder-active-1",
    question: "Will the hamster finish under 60 seconds?",
    total_volume: 4300,
    yes_volume: 0,
    no_volume: 0,
    yes_price: 0.52,
    ends_at: new Date().toISOString(),
  },
  {
    id: "placeholder-active-2",
    question: "Will the hamster finish under 60 seconds?",
    total_volume: 4300,
    yes_volume: 0,
    no_volume: 0,
    yes_price: 0.52,
    ends_at: new Date().toISOString(),
  },
  {
    id: "placeholder-active-3",
    question: "Will the hamster finish under 60 seconds?",
    total_volume: 4300,
    yes_volume: 0,
    no_volume: 0,
    yes_price: 0.52,
    ends_at: new Date().toISOString(),
  },
];

const PLACEHOLDER_RESOLVED_MARKETS = [
  {
    id: "placeholder-resolved-1",
    question: "Will the hamster finish under 60 seconds?",
    total_volume: 4300,
    yes_volume: 0,
    no_volume: 0,
    yes_price: 0.52,
    ends_at: new Date().toISOString(),
    winning_side: "YES",
  },
  {
    id: "placeholder-resolved-2",
    question: "Will the hamster finish under 60 seconds?",
    total_volume: 4300,
    yes_volume: 0,
    no_volume: 0,
    yes_price: 0.52,
    ends_at: new Date().toISOString(),
    winning_side: "NO",
  },
];

export default function StreamMarketsPanel({
  betAmount,
  setBetAmount,
  quickAmounts,
  activeMarkets,
  resolvedMarkets,
  placing,
  hasBetOnMarket,
  placeInlineBet,
}) {
  const [activeTab, setActiveTab] = useState("active");
  const [expandedMarketId, setExpandedMarketId] = useState(null);
  const [localAmount, setLocalAmount] = useState(betAmount || "");
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedSide, setSelectedSide] = useState(null);

  const markets = useMemo(() => {
    if (activeTab === "active") {
      return activeMarkets?.length ? activeMarkets : PLACEHOLDER_ACTIVE_MARKETS;
    }
    return resolvedMarkets?.length
      ? resolvedMarkets
      : PLACEHOLDER_RESOLVED_MARKETS;
  }, [activeTab, activeMarkets, resolvedMarkets]);

  const toggleMarket = (marketId) => {
    if (expandedMarketId === marketId) {
      setExpandedMarketId(null);
      return;
    }
    setExpandedMarketId(marketId);
    setLocalAmount(betAmount || "");
  };

  const handleAmountChange = (value) => {
    setLocalAmount(value);
    setBetAmount(value);
  };

  const handleQuickSelect = (value) => {
    const asString = String(value);
    setLocalAmount(asString);
    setBetAmount(asString);
  };

  const handleBet = (side, marketId) => {
    const market = markets.find((m) => m.id === marketId);
    setSelectedMarket(market);
    setSelectedSide(side ? "YES" : "NO");
    setBottomSheetOpen(true);
  };

  const handleBottomSheetClose = () => {
    setBottomSheetOpen(false);
    setSelectedMarket(null);
    setSelectedSide(null);
  };

  const handleBottomSheetConfirm = () => {
    if (!localAmount || Number(localAmount) <= 0 || !selectedMarket) {
      return;
    }
    placeInlineBet(selectedSide === "YES", selectedMarket.id);
    handleBottomSheetClose();
  };

  const renderMarketCard = (market) => {
    const isPlaceholder = String(market.id ?? "").startsWith("placeholder");
    const yesVolume = Number(market.yes_volume ?? 0);
    const noVolume = Number(market.no_volume ?? 0);
    const totalVolume = yesVolume + noVolume;
    const hasBet = hasBetOnMarket(market.id);
    const isResolved = activeTab === "resolved";
    const isExpanded = expandedMarketId === market.id;

    return (
      <div
        key={market.id}
        className={`rounded-[4px] border  ${
          isExpanded
            ? "border-gray-300 dark:border-gray-600"
            : "border-gray-200 dark:border-gray-700"
        } bg-white dark:bg-gray-800 p-3 transition hover:border-gray-300 dark:hover:border-gray-600`}
      >
        {isResolved ? (
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-3 max-w-md">
                {market.question}
              </h4>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center rounded-[4px] bg-[#F3F4F6] dark:bg-blue-900/30 px-2 py-1 text-[10px] font-semibold  uppercase tracking-wide">
                Resolved
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => toggleMarket(market.id)}
            className="flex w-full items-start justify-between gap-3 text-left"
          >
            <div className="flex-1">
              <h4 className="text-sm md:text-sm text-xs font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-3 max-w-md">
                {market.question}
              </h4>
            </div>
          </button>
        )}

        {isResolved ? (
          <div className="mt-2 flex items-center justify-between text-xs md:text-xs">
            <div className="text-gray-600 dark:text-gray-400">
              Volume:
              <span className="ml-1 font-semibold text-gray-800 dark:text-gray-200">
                {formatCurrency(market.total_volume ?? market.volume ?? totalVolume)}
              </span>
            </div>
            <div>
              <span
                className={`inline-flex min-w-[52px] items-center justify-center rounded-[4px] px-3 py-1.5 text-xs font-semibold ${
                  market.winning_side?.toUpperCase() === "YES"
                    ? "bg-[#ECECFD] text-[#096]"
                    : "bg-[#FFC9C9] text-[#F54900]"
                }`}
              >
                {(market.winning_side ? "YES" : "NO")}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3 text-xs md:text-xs text-gray-500 dark:text-gray-400">
            <div className="truncate">
              Volume:
              <span className="ml-1 font-semibold text-gray-800 dark:text-gray-200">
                {formatCurrency(
                  market.total_volume ?? market.volume ?? totalVolume
                )}
              </span>
            </div>
            <div className="flex items-center text-xs md:text-xs h-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBet(true, market.id);
                }}
                disabled={placing || hasBet}
                className={`btn-primary inline-flex cursor-pointer items-center justify-center rounded-[4px] rounded-r-none px-3 py-1 text-xs md:text-xs font-semibold text-emerald-600 transition ${
                  placing || hasBet ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  background: "linear-gradient(90deg, rgba(38, 92, 255, 0.08) 0%, rgba(38, 92, 255, 0.08) 33.33%, rgba(170, 0, 255, 0.08) 66.67%, rgba(170, 0, 255, 0.08) 100%)"
                }}
              >
                Yes
              </button>
              <div className="bg-[linear-gradient(90deg,rgba(59,130,246,0.4)_0%,rgba(255,100,103,0.4)_100%)] w-[1px] h-6"></div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBet(false, market.id);
                }}
                disabled={placing || hasBet}
                className={`btn-secondary inline-flex cursor-pointer items-center justify-center rounded-[4px] rounded-l-none px-3 py-1 text-xs md:text-xs font-semibold text-rose-600 transition ${
                  placing || hasBet ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  background: "linear-gradient(90deg, rgba(38, 92, 255, 0.08) 0%, rgba(38, 92, 255, 0.08) 33.33%, rgba(170, 0, 255, 0.08) 66.67%, rgba(170, 0, 255, 0.08) 100%)"
                }}
              >
                No
              </button>
            </div>
          </div>
        )}

        {!isResolved && isExpanded && (
          <div className="mt-2 rounded-[4px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-3">
            <label className="text-xs md:text-[11px] font-semibold text-gray-600 dark:text-gray-300">
              Amount (USD)
            </label>
            <div className="mt-1 flex items-center rounded-[4px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus-within:border-gray-900 dark:focus-within:border-gray-400">
              <span className="mr-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                $
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={localAmount}
                onChange={(event) => handleAmountChange(event.target.value)}
                className="w-full border-0 bg-transparent text-xs md:text-sm text-gray-900 dark:text-gray-100 outline-none"
                placeholder="10.00"
                disabled={isPlaceholder}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuickSelect(value)}
                  className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-600 px-3 py-1 text-xs md:text-xs font-semibold text-gray-700 dark:text-gray-300 transition hover:border-gray-300 dark:hover:border-gray-500"
                  disabled={isPlaceholder}
                >
                  ${value}
                </button>
              ))}
            </div>
            {hasBet && !isPlaceholder && (
              <p className="mt-2 rounded-[4px] bg-amber-50 dark:bg-amber-900 px-2 py-1 text-xs md:text-[11px] font-medium text-amber-700 dark:text-amber-300">
                You already have a position in this market.
              </p>
            )}
            <p className="mt-2 text-xs md:text-[11px] text-gray-500 dark:text-gray-400">
              Min $1 · Max $1,000 · 2% fee applied on placement.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="space-y-4 bg-white dark:bg-gray-900">
      <div>
        <div className="md:mt-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-1">
          <div
            className="inline-flex rounded-[4px] p-[1px]"
            
          >
            <div className="flex bg-white dark:bg-gray-900 rounded-[3px]">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1 text-xs md:text-sm font-semibold transition rounded-l-[3px] ${
                  activeTab === "active"
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("resolved")}
                className={`px-3 py-1 text-xs md:text-sm font-semibold transition rounded-r-[3px] ${
                  activeTab === "resolved"
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Resolved
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          {markets.length ? (
            markets.map((market) => renderMarketCard(market))
          ) : (
            <div className="rounded-[4px] border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 text-center text-xs md:text-xs font-semibold text-gray-500 dark:text-gray-400">
              {activeTab === "active"
                ? "No active markets at the moment."
                : "No resolved markets yet."}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet for Mobile Betting */}
      <BetBottomSheet
        isOpen={bottomSheetOpen}
        onClose={handleBottomSheetClose}
        market={selectedMarket}
        side={selectedSide}
        betAmount={localAmount}
        setBetAmount={handleAmountChange}
        onConfirm={handleBottomSheetConfirm}
        placing={placing}
      />
    </aside>
  );
}
