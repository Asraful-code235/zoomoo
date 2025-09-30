import { useState } from "react";

export default function BetBottomSheet({
  show,
  onClose,
  market,
  stream,
  selectedSide,
}) {
  const [amount, setAmount] = useState("");

  if (!show || !market) return null;

  const yesPct = Math.max(
    0,
    Math.min(100, Math.round(Number(market?.yes_price ?? 0.5) * 100))
  );

  return (
    <div className="md:hidden fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl p-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Buy</div>
          <button className="text-sm text-gray-500" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="text-[13px] text-gray-700 mb-3 line-clamp-2">
          {market?.question || stream?.title}
        </div>
        <div className="flex items-center justify-center gap-4 my-2">
          <button
            className="w-9 h-9 rounded-md bg-gray-100 text-gray-700"
            onClick={() =>
              setAmount((v) => String(Math.max(0, Number(v || 0) - 1)))
            }
          >
            -
          </button>
          <input
            inputMode="decimal"
            pattern="[0-9]*"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9.]/g, ""))
            }
            className="w-28 text-3xl font-semibold text-gray-900 bg-transparent text-center"
            placeholder="$0"
          />
          <button
            className="w-9 h-9 rounded-md bg-gray-100 text-gray-700"
            onClick={() => setAmount((v) => String(Number(v || 0) + 1))}
          >
            +
          </button>
        </div>
        <div className="flex gap-2 justify-center mb-3">
          {["1", "20", "100"].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="px-3 py-1.5 rounded-md border text-xs text-gray-700"
            >
              +${v}
            </button>
          ))}
          <button
            onClick={() => setAmount("1000")}
            className="px-3 py-1.5 rounded-md border text-xs text-gray-700"
          >
            Max
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="h-12 rounded-md bg-[#ECECFD] text-emerald-700 font-semibold">
            YES · {yesPct}¢
          </button>
          <button className="h-12 rounded-md bg-[#FFF1F2] text-rose-600 font-semibold">
            NO · {100 - yesPct}¢
          </button>
        </div>
      </div>
    </div>
  );
}

