import { useMemo, useState } from "react";
import { formatCurrency, formatEndsAt } from "./streamFormatting";

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
    if (!localAmount || Number(localAmount) <= 0) {
      return;
    }
    placeInlineBet(side, marketId);
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
        className={`rounded border ${
          isExpanded ? "border-gray-300" : "border-gray-200"
        } bg-white p-3 shadow-sm transition hover:border-gray-300`}
      >
        <button
          type="button"
          onClick={() => toggleMarket(market.id)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div>
            <h4 className="text-sm font-medium text-[#000000CC] leading-snug line-clamp-3">
              {market.question}
            </h4>
          </div>
          <div className="shrink-0 text-right text-xs font-semibold text-gray-500">
            <div>Ends: {formatEndsAt(market.ends_at)}</div>
          </div>
        </button>

        {isResolved ? (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            <span>Result</span>
            <span
              className={`inline-flex min-w-[42px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                market.winning_side?.toUpperCase() === "YES"
                  ? "bg-[#E6F0FF] text-[#1D4ED8]"
                  : "bg-[#FFE8EC] text-[#DB2777]"
              }`}
            >
              {(market.winning_side || "—").toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              <div className="mt-2 text-xs text-gray-500">
                Volume:{" "}
                <span className="font-semibold text-gray-800">
                  {formatCurrency(
                    market.total_volume ?? market.volume ?? totalVolume
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBet(true, market.id)}
                disabled={placing || hasBet || isPlaceholder}
                className={`inline-flex items-center justify-center px-4 py-1 text-xs font-semibold transition cursor-pointer hover:shadow-sm ${
                  placing || hasBet || isPlaceholder
                    ? "bg-[#ECECFD] text-green-600 opacity-60"
                    : "bg-[#ECECFD] text-green-600 hover:bg-emerald-100"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleBet(false, market.id)}
                disabled={placing || hasBet || isPlaceholder}
                className={`inline-flex items-center justify-center px-4 py-1 text-xs font-semibold transition ${
                  placing || hasBet || isPlaceholder
                    ? "bg-[#FFC9C9] text-red-600 opacity-60"
                    : "bg-[#FFC9C9] text-red-600 hover:bg-rose-100"
                }`}
              >
                No
              </button>
            </div>
          </div>
        )}

        {!isResolved && isExpanded && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <label className="text-[11px] font-semibold text-gray-600">
              Amount (USD)
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-gray-900">
              <span className="mr-2 text-gray-500">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={localAmount}
                onChange={(event) => handleAmountChange(event.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
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
                  className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                  disabled={isPlaceholder}
                >
                  ${value}
                </button>
              ))}
            </div>
            {hasBet && !isPlaceholder && (
              <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                You already have a position in this market.
              </p>
            )}
            <p className="mt-2 text-[11px] text-gray-500">
              Min $1 · Max $1,000 · 2% fee applied on placement.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="space-y-6 bg-white">
      <div className="">
        <div className="mt-6 flex gap-3 text-sm border-b pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={` px-3 py-1 transition ${
              activeTab === "active"
                ? "bg-[#F9FAFB] text-black"
                : "text-[#10182880] hover:text-gray-900"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resolved")}
            className={` px-3 py-1 transition ${
              activeTab === "resolved"
                 ? "bg-[#F9FAFB] text-black"
             : "text-[#10182880] hover:text-gray-900"
            }`}
          >
            Resolved
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {markets.length ? (
            markets.map((market) => renderMarketCard(market))
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs font-semibold text-gray-500">
              {activeTab === "active"
                ? "No active markets at the moment."
                : "No resolved markets yet."}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
