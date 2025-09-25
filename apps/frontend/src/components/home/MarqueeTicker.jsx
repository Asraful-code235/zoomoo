import { useMemo } from "react";
import { useMarqueeTicker } from "../../hooks/useMarqueeTicker";

export default function MarqueeTicker() {
  const { items } = useMarqueeTicker();
  const hasItems = items.length > 0;

  const tickerItems = useMemo(() => {
    if (!hasItems) return [];
    const sanitized = items.map((item, index) => ({
      ...item,
      key: `${item.userHandle}-${item.ts}-${index}`,
    }));
    return [...sanitized, ...sanitized];
  }, [items, hasItems]);

  if (!hasItems) return null;

  const renderTickerChip = (item) => (
    <span
      key={item.key}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/60 px-3 text-xs font-semibold text-emerald-900 shadow-sm sm:h-10 sm:text-sm"
    >
      <img
        src={item.avatarUrl}
        alt=""
        aria-hidden
        className="h-6 w-6 rounded-full border border-emerald-200/50"
      />
      <span className="text-emerald-800/80">@{item.userHandle?.replace(/^@/, "")}</span>
      <span className="text-emerald-700/80">bet</span>
      <span className="text-emerald-900">{Number(item.amount).toLocaleString()}&nbsp;USDC</span>
      <span className="text-emerald-700/80">on</span>
      <span className="truncate text-emerald-900/90 max-w-[220px] sm:max-w-[320px]">
        {item.marketQuestion}
      </span>
      <span
        className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold ${
          item.side === "YES"
            ? "bg-emerald-600/10 text-emerald-700"
            : "bg-rose-600/10 text-rose-700"
        }`}
      >
        {item.side}
      </span>
    </span>
  );

  return (
    <section className="relative overflow-hidden border-y border-gray-200 bg-white">
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
        <span className="hidden whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:inline-flex">
          High rollers
        </span>

        <div className="relative flex-1 overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-3 sm:gap-5">
            {tickerItems.map((item, index) => renderTickerChip({ ...item, key: `${item.key}-a${index}` }))}
          </div>
          <div className="marquee-track marquee-track--alt absolute inset-y-0 left-full flex w-max items-center gap-3 sm:gap-5" aria-hidden>
            {tickerItems.map((item, index) => renderTickerChip({ ...item, key: `${item.key}-b${index}` }))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 24s linear infinite;
        }
        .marquee-track--alt {
          animation-delay: -12s;
        }
        @media (max-width: 640px) {
          .marquee-track {
            animation-duration: 32s;
          }
          .marquee-track--alt {
            animation-delay: -16s;
          }
        }
      `}</style>
    </section>
  );
}
