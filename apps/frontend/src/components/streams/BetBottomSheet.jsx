import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function BetBottomSheet({
  isOpen,
  onClose,
  market,
  side: initialSide,
  betAmount,
  setBetAmount,
  onConfirm,
  placing,
}) {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [currentSide, setCurrentSide] = useState(initialSide);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    let timeoutId;
    let rafId;

    if (typeof window === "undefined") {
      if (isOpen) {
        setIsMounted(true);
        setIsSheetVisible(true);
      } else if (isMounted) {
        setIsSheetVisible(false);
        setIsMounted(false);
      }
      return () => {};
    }

    if (isOpen) {
      setIsMounted(true);
      rafId = window.requestAnimationFrame(() => {
        setIsSheetVisible(true);
      });
    } else if (isMounted) {
      setIsSheetVisible(false);
      timeoutId = window.setTimeout(() => {
        setIsMounted(false);
      }, 300);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isOpen, isMounted]);

  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMounted]);

  useEffect(() => {
    if (isOpen) {
      setCurrentSide(initialSide);
    }
  }, [isOpen, initialSide]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return () => {};
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;

    if (diff > 100) {
      onClose();
    }

    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
  };

  const handleQuickAmount = (amount) => {
    if (amount === "MAX") {
      setBetAmount("1000");
    } else {
      setBetAmount(String(amount));
    }
  };

  const handleAmountChange = (value) => {
    const numValue = parseFloat(value);
    if (
      value === "" ||
      (!isNaN(numValue) && numValue >= 0 && numValue <= 1000)
    ) {
      setBetAmount(value);
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const toggleMode = () => {
    setCurrentSide(currentSide === "YES" ? "NO" : "YES");
  };

  if (!isMounted) return null;

  const isYes = currentSide?.toUpperCase() === "YES";
  const actionText = isYes ? "Buy" : "Sell";
  const estimatedPayout = betAmount
    ? (parseFloat(betAmount) * 1.62).toFixed(2)
    : "0";

  const yesPrice = Number(market?.yes_price ?? market?.yesPrice ?? 0.5);
  const yesPriceCents = Math.round(Math.max(0, Math.min(1, yesPrice)) * 100);
  const noPriceCents = Math.max(0, Math.min(100, 100 - yesPriceCents));
  const selectedPriceCents = isYes ? yesPriceCents : noPriceCents;
  const yesPercent = Math.min(100, Math.max(0, Math.round(yesPrice * 100)));
  const quickSelections = [1, 20, 50, 100, "MAX"];

  const backdrop = (
    <div
      className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
        isSheetVisible
          ? isDesktop
            ? "bg-opacity-40"
            : "bg-opacity-50"
          : "bg-opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />
  );

  const desktopContent = (
    <>
      {backdrop}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
        <div
          className={`w-full max-w-lg transform transition-all duration-300 ${
            isSheetVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0 pointer-events-none"
          }`}
        >
          <div className="rounded border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col gap-3 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Place Order
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100">
                    {market?.question || "Market question"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <span>Live Odds</span>
                  <span>{yesPercent}% Yes</span>
                </div>
                <div className="relative mt-3 h-[6px] w-full overflow-hidden  rounded-full ">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${yesPercent}%`,
                      backgroundColor:
                        "radial-gradient(3140.4% 60.01% at 60% 50%, var(--color-white-60, rgba(255, 255, 255, 0.60)) 0%, var(--color-white-0, rgba(255, 255, 255, 0.00)) 40%)",
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 h-full w-full rounded-full border border-gray-200/60 dark:border-gray-700/60" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentSide("YES")}
                  className={`rounded-[4px] text-center border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-500 ${
                    isYes
                      ? "border-transparent bg-[#ECECFD] text-[#096] dark:border-transparent dark:bg-[#2A314A] dark:text-emerald-300"
                      : "border-gray-200 bg-white text-gray-700 hover:border-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-emerald-400/60"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    YES
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSide("NO")}
                  className={`rounded-[4px] border text-center px-4 py-3  transition focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-500 ${
                    !isYes
                      ? "border-transparent bg-[#FFF1F2] text-[#F54900] dark:border-transparent dark:bg-[#3C2226] dark:text-rose-300"
                      : "border-gray-200 bg-white text-gray-700 hover:border-rose-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-rose-400/60"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    NO
                  </p>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <span>Amount (USDC)</span>
                  <button
                    type="button"
                    onClick={() => handleAmountChange("")}
                    className="text-xs font-semibold text-gray-500 transition hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[4px] border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#0F1116]">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      inputMode="decimal"
                      value={betAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-24 bg-transparent text-lg font-semibold text-gray-900 outline-none dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    USDC
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickSelections.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className="rounded-[2px] border border-transparent bg-[rgba(245,245,245,0.5)] px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#ECECFD] dark:bg-[#1A1C24] dark:text-gray-200 dark:hover:bg-[#252838]"
                  >
                    {amount === "MAX"
                      ? "MAX"
                      : `+$${Number(amount).toFixed(2)}`}
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Price: {selectedPriceCents}¢ · Est. payout: ${estimatedPayout}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-[4px] border border-gray-300 bg-transparent py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 dark:border-transparent dark:bg-[#111217] dark:text-gray-200 dark:hover:bg-[#171922]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={placing || !betAmount || parseFloat(betAmount) <= 0}
                  className={`flex-1 rounded-[4px] py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                    isYes
                      ? "bg-transparent text-emerald-600 hover:bg-[#ECECFD] focus:ring-emerald-200 dark:bg-[#A6FF81] dark:text-gray-900 dark:hover:bg-[#9AF873]"
                      : "bg-transparent text-rose-600 hover:bg-[#FFF1F2] focus:ring-rose-200 dark:bg-[#A6FF81] dark:text-gray-900 dark:hover:bg-[#9AF873]"
                  } ${
                    placing || !betAmount || parseFloat(betAmount) <= 0
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  {placing ? "Placing..." : actionText.toUpperCase()}
                </button>
              </div>

              <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
                By trading, you agree to the{" "}
                <a href="#" className="underline">
                  Terms of Use
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const mobileContent = (
    <>
      {backdrop}

      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t shadow-2xl transform transition-transform duration-300 ease-out ${
          isSheetVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          height: "50vh",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-3">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex flex-col h-full pb-8 overflow-y-auto p-4">
          {/* BUY/SELL Dropdown Button */}
          <div className="mb-4 relative w-20">
            <button
              type="button"
              onClick={toggleMode}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-[4px] text-left"
            >
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                {actionText}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="text-gray-600 dark:text-gray-400"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Market Question */}
          <div className="flex items-start gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {market?.question?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {market?.question || "Market question"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Est. payout: ${estimatedPayout}
                <span
                  className={`ml-2 font-semibold ${
                    isYes ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {currentSide}
                </span>
              </p>
            </div>
          </div>

          {/* Amount Input Section - Centered */}
          <div className="flex-1 flex flex-col items-center justify-center mb-6">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  const current = parseFloat(betAmount) || 0;
                  if (current > 0) {
                    handleAmountChange(String(Math.max(0, current - 1)));
                  }
                }}
                className="flex h-12 w-12 items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-xl"
              >
                −
              </button>

              <div className="flex items-center">
                <span className="text-4xl font-bold text-gray-400 dark:text-gray-500 mr-2">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  inputMode="decimal"
                  value={betAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-32 text-5xl font-bold text-center bg-transparent text-gray-900 dark:text-gray-100 outline-none border-none"
                  placeholder="0"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const current = parseFloat(betAmount) || 0;
                  if (current < 1000) {
                    handleAmountChange(String(Math.min(1000, current + 1)));
                  }
                }}
                className="flex h-12 w-12 items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Amount Buttons - Above Action Button */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {quickSelections.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount)}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {amount === "MAX" ? "Max" : `+$${Number(amount).toFixed(0)}`}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pb-4">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={placing || !betAmount || parseFloat(betAmount) <= 0}
              className={`w-full rounded-[4px] py-4 text-base font-bold transition ${
                isYes
                  ? "bg-[#ECECFD] text-emerald-600"
                  : "bg-[#FFF1F2] text-rose-600"
              } ${
                placing || !betAmount || parseFloat(betAmount) <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              style={{ boxShadow: "0 2px 1px 0 #06060C" }}
            >
              {placing
                ? "Placing..."
                : `${currentSide?.toUpperCase()} · ${
                    betAmount ? parseFloat(betAmount).toFixed(0) : 0
                  }¢`}
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
              By trading, you agree to the{" "}
              <a href="#" className="underline">
                Terms of Use
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const content = isDesktop ? desktopContent : mobileContent;

  return createPortal(content, document.body);
}
