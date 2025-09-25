import { useState, useMemo } from "react";
import { Play, AlarmClock, Check } from "lucide-react";
import { useBetting } from "../../hooks/useBetting";

export default function StreamCard({
  stream,
  index,
  authenticated,
  onNavigate,
  pickActiveMarket,
  remainingMs,
  formatUSD,
  mySide,
}) {
  const [mode, setMode] = useState(null);
  const [amount, setAmount] = useState(20);
  const [probability, setProbability] = useState(50);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const stopPropagation = (event) => event.stopPropagation();

  const { placeBet, placing } = useBetting();

  const activeMarket = useMemo(
    () => pickActiveMarket(stream),
    [stream, pickActiveMarket]
  );
  const yesVol = Number(activeMarket?.yes_volume || 0);
  const noVol = Number(activeMarket?.no_volume || 0);
  const total = yesVol + noVol;
  const yesPct = total > 0 ? Math.round((yesVol / total) * 100) : 50;
  const volume = Number(activeMarket?.total_volume || total || 0);

  const msLeft = activeMarket ? remainingMs(activeMarket) : null;
  const ended = typeof msLeft === "number" && msLeft === 0;
  const urgent = typeof msLeft === "number" && msLeft > 0 && msLeft <= 30000;

  const timerLabel = typeof msLeft === "number"
    ? `${Math.floor(msLeft / 60000).toString().padStart(2, "0")}:${Math.floor((msLeft / 1000) % 60)
        .toString()
        .padStart(2, "0")}`
    : null;

  let badge = { label: "Standby", tone: "standby" };
  if (activeMarket) {
    if (activeMarket.ends_at && typeof msLeft === "number") {
      const mm = Math.floor(msLeft / 60000)
        .toString()
        .padStart(2, "0");
      const ss = Math.floor((msLeft / 1000) % 60)
        .toString()
        .padStart(2, "0");
      badge = ended
        ? { label: "Ended", tone: "ended" }
        : { label: `${mm}:${ss}`, tone: urgent ? "urgent" : "active" };
    } else {
      badge = { label: "Active", tone: "active" };
    }
  }
  const badgeClass =
    {
      active: "bg-emerald-600 text-white",
      urgent: "bg-amber-600 text-white animate-pulse",
      ended: "bg-gray-700 text-white",
      standby: "bg-gray-800/80 text-white",
    }[badge.tone] || "bg-gray-800/80 text-white";

  const handleYes = (e) => {
    e.stopPropagation();
    setMode("YES");
    setError(null);
    setSuccess(null);
  };

  const handleNo = (e) => {
    e.stopPropagation();
    setMode("NO");
    setError(null);
    setSuccess(null);
  };

  const handlePlaceBet = async (e) => {
    e.stopPropagation();

    if (!activeMarket) {
      setError("No active market available");
      return;
    }

    try {
      setError(null);
      const side = mode === "YES";
      await placeBet(activeMarket.id, side, amount);
      setSuccess(`Bet placed: ${mode} for $${amount}`);
      setMode(null); // Reset to initial state

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmLabel =
    mode === "YES" ? `YES · ${yesPct}¢` : `NO · ${100 - yesPct}¢`;

  return (
    <div
      className={`bg-white shadow-sm border h-full border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300 rounded-none cursor-pointer`}
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
          <span className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-red-600 shadow" />
        )}
        {/* removed standby badge per design */}
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 ring-1 ring-white/20">
          <Play className="w-7 h-7 text-white opacity-95 drop-shadow fill-white stroke-[1.5]" />
        </span>

        {/* Probability tracker overlay */}
        {activeMarket && (
          <div className="pointer-events-none absolute top-2 left-0 right-0 px-4 flex items-center justify-between">
            {/* Center track and percentage */}
            <div className="mx-auto w-full max-w-[560px] relative flex items-center justify-center">
              <div className="absolute -top-4 text-white text-sm font-semibold select-none">
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
              <div className="ml-3 shrink-0 rounded-md bg-white/10 text-white text-sm font-semibold px-3 py-1 ring-1 ring-white/15">
                {timerLabel}
              </div>
            )}
          </div>
        )}
        {/* Mobile floating YES/NO buttons over the video */}
        <div className="absolute inset-x-3 bottom-3 md:hidden pointer-events-none">
          <div className="grid grid-cols-2 gap-2">
            <div
              role="button"
              tabIndex={0}
              onClick={handleYes}
              onMouseDown={stopPropagation}
              className="pointer-events-auto h-11 rounded-md bg-[#ECECFD] text-emerald-700 text-sm font-semibold flex items-center justify-center"
            >
              YES · {yesPct}¢
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={handleNo}
              onMouseDown={stopPropagation}
              className="pointer-events-auto h-11 rounded-md bg-[#FFF1F2] text-rose-600 text-sm font-semibold flex items-center justify-center"
            >
              NO · {100 - yesPct}¢
            </div>
          </div>
        </div>

      </button>

      <div className="p-4 flex flex-col">
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {stream.hamster_name || stream.name || "Hamster Stream"}
        </h3>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {/* placeholder for avatars/participants if needed */}
          </div>
        </div>

        {mode == null ? (
          <div className="hidden md:grid grid-cols-2 gap-3 mt-auto">
            <button
              type="button"
              onClick={handleYes}
              className="w-full text-sm font-semibold h-11 px-3 text-emerald-700 bg-[#ECECFD] rounded-none border border-transparent"
            >
              YES · {yesPct}¢
            </button>
            <button
              type="button"
              onClick={handleNo}
              className="w-full text-sm font-semibold h-11 px-3 text-rose-600 bg-[#FFF1F2] rounded-none border border-transparent"
            >
              NO · {100 - yesPct}¢
            </button>
          </div>
        ) : (
          <div className="mt-auto" onMouseDown={stopPropagation} onClick={stopPropagation}>
            <label className="text-[11px] font-semibold text-gray-700 mb-1 block">
              Amount (USD)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-gray-200 shadow-sm px-3 rounded-none">
                <span className="text-gray-500 mr-1">$</span>
                <input
                  type="number"
                  value={amount}
                  min={1}
                  max={1000}
                  step="1"
                  onChange={(e) =>
                    setAmount(
                      Math.max(1, Math.min(1000, Number(e.target.value || 0)))
                    )
                  }
                  onMouseDown={stopPropagation}
                  onClick={stopPropagation}
                  onFocus={stopPropagation}
                  className="w-24 py-1.5 outline-none border-0 text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
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
              className={`mt-3 w-full rounded-none text-sm font-bold py-2.5 border shadow-sm transition-opacity ${
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
          <span className="text-xs font-medium text-gray-600">
            Volume {formatUSD(volume)}
          </span>
        </div>
      </div>
      {/* Mobile amount entry bottom sheet */}
      {mode != null && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMode(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-900">Place bet</div>
              <button type="button" className="text-sm text-gray-500" onClick={() => setMode(null)}>
                Cancel
              </button>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {mode === "YES" ? (
                <>
                  YES · {yesPct}¢
                </>
              ) : (
                <>
                  NO · {100 - yesPct}¢
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center bg-white border border-gray-200 shadow-sm px-3 rounded-md">
                <span className="text-gray-500 mr-1">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={amount}
                  min={1}
                  max={1000}
                  step="1"
                  onChange={(e) => setAmount(Math.max(1, Math.min(1000, Number(e.target.value || 0))))}
                  className="w-28 py-2 outline-none border-0 text-base"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="px-3 h-9 rounded-md border text-sm text-gray-700" onClick={() => setAmount(1)}>$1</button>
                <button type="button" className="px-3 h-9 rounded-md border text-sm text-gray-700" onClick={() => setAmount(20)}>$20</button>
                <button type="button" className="px-3 h-9 rounded-md border text-sm text-gray-700" onClick={() => setAmount(100)}>$100</button>
                <button type="button" className="px-3 h-9 rounded-md border text-sm text-gray-700" onClick={() => setAmount(1000)}>Max</button>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePlaceBet}
              disabled={placing}
              className={`w-full rounded-md text-sm font-bold h-11 border shadow-sm transition-opacity ${
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

    </div>
  );
}
