export default function MobileBetButtons({
  market,
  onYesClick,
  onNoClick,
}) {
  if (!market) return null;

  const yesPct = Math.max(
    0,
    Math.min(100, Math.round(Number(market?.yes_price ?? 0.5) * 100))
  );

  return (
    <div
      className="md:hidden fixed inset-x-0 z-[60] bg-white/95 backdrop-blur border-t border-gray-200 p-3"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 64px)" }}
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onYesClick}
          className="h-14 rounded-md bg-[#ECECFD] text-emerald-700 text-sm font-semibold flex items-center justify-center shadow-sm"
        >
          YES · {yesPct}¢
        </button>
        <button
          type="button"
          onClick={onNoClick}
          className="h-14 rounded-md bg-[#FFF1F2] text-rose-600 text-sm font-semibold flex items-center justify-center shadow-sm"
        >
          NO · {100 - yesPct}¢
        </button>
      </div>
    </div>
  );
}

