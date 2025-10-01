import { useState, useMemo } from "react";
import { Play, AlarmClock, Check } from "lucide-react";
import { useBetting } from "../../hooks/useBetting";
import { usePrivy } from "@privy-io/react-auth";


export default function StreamCard({
  stream,
  authenticated,
  onNavigate,
  pickActiveMarket,
  remainingMs,
  formatUSD,
  onBetClick, // New prop for mobile bet handling
}) {
  const [mode, setMode] = useState(null);
  const [amount, setAmount] = useState(20);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  // Handler for amount changes - updates both amount and syncs slider
  const handleAmountChange = (newAmount) => {
    const clampedAmount = Math.max(1, Math.min(1000, Number(newAmount || 0)));
    setAmount(clampedAmount);
  };

  // Handler for slider changes - updates both slider and amount
  const handleSliderChange = (sliderValue) => {
    const newAmount = Math.max(1, Math.min(1000, Number(sliderValue)));
    setAmount(newAmount);
  };

  const { login } = usePrivy();

  const {  placing } = useBetting();

  const activeMarket = useMemo(() => {
    const market = pickActiveMarket(stream);
    // Fallback: if no active market, use the first available market
    if (!market && Array.isArray(stream?.markets) && stream.markets.length > 0) {
      return stream.markets[0];
    }
    return market;
  }, [stream, pickActiveMarket]);
  const yesVol = Number(activeMarket?.yes_volume || 0);
  const noVol = Number(activeMarket?.no_volume || 0);
  const total = yesVol + noVol;
  const yesPct = total > 0 ? Math.round((yesVol / total) * 100) : 50;
  const volume = Number(activeMarket?.total_volume || total || 0);

  const msLeft = activeMarket ? remainingMs(activeMarket) : null;

  const timerLabel = typeof msLeft === "number"
    ? `${Math.floor(msLeft / 60000).toString().padStart(2, "0")}:${Math.floor((msLeft / 1000) % 60)
        .toString()
        .padStart(2, "0")}`
    : null;


  const handleYes = (e) => {
    e.stopPropagation();

    if (!authenticated) {
      login?.();
      return;
    }

    // On mobile, use BetBottomSheet; on desktop, show inline form
    const isMobile = window.innerWidth < 768;

    if (isMobile && onBetClick) {
      onBetClick("YES", stream, activeMarket);
    } else {
      setMode("YES");
      setError(null);
      setSuccess(null);
    }
  };

  const handleNo = (e) => {
    e.stopPropagation();

    if (!authenticated) {
      login?.();
      return;
    }

    // On mobile, use BetBottomSheet; on desktop, show inline form
    const isMobile = window.innerWidth < 768;

    if (isMobile && onBetClick) {
      onBetClick("NO", stream, activeMarket);
    } else {
      setMode("NO");
      setError(null);
      setSuccess(null);
    }
  };

  const handlePlaceBet = async (e) => {
    e.stopPropagation();

    if (!authenticated) {
      login?.();
      return;
    }

    if (!activeMarket) {
      setError("No active market available");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const side = mode === "YES";

      // Note: Actual bet placement would be:
      // await placeBet(activeMarket.id, side, amount);

      // Simulate successful bet placement for now
      console.log("Simulated bet placement:", { side, amount, marketId: activeMarket.id });

      // Reset to initial state immediately
      setMode(null);

      // Show success message
      setSuccess(`Bet placed: ${side ? "YES" : "NO"} for $${amount}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      // Don't reset mode on error so user can try again
    }
  };

  const confirmLabel =
    mode === "YES" ? `YES · ${yesPct}¢` : `NO · ${100 - yesPct}¢`;

  return (
    <div
      className={`dark-card-bg shadow-sm border h-full border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 rounded-none cursor-pointer`}
      onClick={() => onNavigate(stream.id)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(stream.id);
        }}
        className="relative w-full bg-black flex items-center justify-center rounded-none"
        style={{ height: 200 }}
      >
        {stream?.is_active && (
          <span className="absolute top-5 left-3 w-2.5 h-2.5 rounded-full bg-red-600 shadow" />
        )}
        {/* removed standby badge per design */}
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 ring-1 ring-white/20">
          <Play className="w-7 h-7 text-white opacity-95 drop-shadow fill-white stroke-[1.5]" />
        </span>

        {/* Probability tracker overlay */}
        {activeMarket && (
          <div className="pointer-events-none absolute top-3 left-0 right-0 px-4 flex items-center justify-between">
            {/* Center track and percentage */}
            <div className="mx-auto w-full max-w-[560px] relative flex items-center justify-center">
              <div className="absolute -top-4 text-white text-[10px] font-semibold select-none">
                {yesPct}%
              </div>
              <div className="w-[80%] h-2 rounded-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700/80 opacity-70 shadow-inner" />
              {/* Green indicator triangle positioned by probability */}
              <div className="absolute" style={{ left: `calc(10% + ${yesPct * 0.8}%)`, top: 10 }}>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 12L0 0H16L8 12Z" fill="#10B981" />
                </svg>
              </div>
            </div>

            {/* Countdown at right */}
            {timerLabel && (
              <div className="ml-3 shrink-0 rounded bg-white/10 text-white text-[10px] font-semibold px-3 py-1 ring-1 ring-white/15">
                {timerLabel}
              </div>
            )}
          </div>
        )}
      </button>

      <div className="p-4 flex flex-col relative">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
          {stream.hamster_name || stream.name || "Hamster Stream"}
        </h3>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {/* placeholder for avatars/participants if needed */}
          </div>
        </div>

        {/* Betting buttons - always visible, fixed height */}
        <div className="grid grid-cols-2 gap-3 mt-auto" onClick={stopPropagation}>
          <button
            type="button"
            onClick={handleYes}
            className="flex flex-row items-center justify-center py-2.5 text-sm font-semibold text-emerald-700 bg-[#ECECFD] rounded-[2px] border border-transparent"
          >
            YES · {yesPct}¢
          </button>
          <button
            type="button"
            onClick={handleNo}
            className="flex items-center justify-center py-2.5  text-sm font-semibold text-rose-600 bg-[#FFF1F2] rounded-[2px] border border-transparent"
          >
            NO · {100 - yesPct}¢
          </button>
        </div>

        {/* Desktop betting form overlay - only on md and up */}
        {mode != null && (
          <div
            className="hidden md:block absolute inset-0 dark-card-bg p-4 z-10"
            onMouseDown={stopPropagation}
            onClick={stopPropagation}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Amount: ${amount}
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode(null);
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm px-3 rounded-none">
                  <span className="text-gray-500 dark:text-gray-400 mr-1">$</span>
                  <input
                    type="number"
                    value={amount}
                    min={1}
                    max={1000}
                    step="1"
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onMouseDown={stopPropagation}
                    onClick={stopPropagation}
                    onFocus={stopPropagation}
                    className="w-24 py-1.5 outline-none border-0 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    value={amount}
                    onChange={(e) => handleSliderChange(e.target.value)}
                    onMouseDown={stopPropagation}
                    onClick={stopPropagation}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceBet}
                disabled={placing}
                className={`mt-auto w-full rounded-none text-sm font-bold py-2.5 border shadow-sm transition-opacity ${
                  placing ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  mode === "YES"
                    ? "bg-[#ECECFD] text-emerald-700 border-transparent"
                    : "bg-[#FFF1F2] text-rose-600 border-transparent"
                }`}
              >
                {placing ? "Placing..." : confirmLabel}
              </button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600">
            {success}
          </div>
        )}

        {/* Volume below buttons */}
        <div className="flex items-center justify-end mt-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Volume {formatUSD(volume)}
          </span>
        </div>
      </div>
    </div>
  );
}
