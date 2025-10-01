import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function BetBottomSheet({
  show,
  onClose,
  market,
  selectedSide: initialSide,
}) {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [currentSide, setCurrentSide] = useState(initialSide);
  const [betAmount, setBetAmount] = useState("20");
  const [isMounted, setIsMounted] = useState(show);
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
      if (show) {
        setIsMounted(true);
        setIsSheetVisible(true);
      } else if (isMounted) {
        setIsSheetVisible(false);
        setIsMounted(false);
      }
      return () => {};
    }

    if (show) {
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
  }, [show, isMounted]);

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
    if (show) {
      setCurrentSide(initialSide);
    }
  }, [show, initialSide]);

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
    // TODO: Implement bet placement logic
    console.log("Placing bet:", { side: currentSide, amount: betAmount, market });
    onClose();
  };

  const toggleMode = () => {
    setCurrentSide(currentSide === "YES" ? "NO" : "YES");
  };

  if (!isMounted || !market) return null;

  const isYes = currentSide?.toUpperCase() === "YES";
  const actionText = isYes ? "Buy" : "Sell";
  const estimatedPayout = betAmount
    ? (parseFloat(betAmount) * 1.62).toFixed(2)
    : "0";

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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Est. payout: ${estimatedPayout}
                </p>
                <span
                  className={`text-xs font-semibold ${
                    isYes ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {currentSide}
                </span>
              </div>
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
                className="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-xs font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
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
              disabled={!betAmount || parseFloat(betAmount) <= 0}
              className={`w-full rounded-[4px] py-4 text-base font-bold transition ${
                isYes
                  ? "bg-[#ECECFD] text-emerald-600"
                  : "bg-[#FFF1F2] text-rose-600"
              } ${
                !betAmount || parseFloat(betAmount) <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              style={{ boxShadow: "0 2px 1px 0 #06060C" }}
            >
              {`${currentSide?.toUpperCase()} · ${
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

  const content = mobileContent;

  return createPortal(content, document.body);
}