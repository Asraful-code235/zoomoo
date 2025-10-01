import { useMemo, useState } from "react";
import { formatCents, formatCurrency, parseSide } from "./streamFormatting";

const PLACEHOLDER_POSITIONS = [
  {
    id: "p1",
    market: "Hamster #7 < 35s",
    side: "YES",
    size: 250,
    entryCents: 62,
    priceCents: 68,
    pnlValue: 15,
  },
  {
    id: "p2",
    market: "Team Relay ≤2 pens",
    side: "YES",
    size: 120,
    entryCents: 58,
    priceCents: 52,
    pnlValue: -7.2,
  },
  {
    id: "p3",
    market: "Team Relay ≤2 pens",
    side: "YES",
    size: 120,
    entryCents: 58,
    priceCents: 52,
    pnlValue: -7.2,
  },
  {
    id: "p4",
    market: "#3 jumps first try",
    side: "NO",
    size: 80,
    entryCents: 59,
    priceCents: 55,
    pnlValue: 3.2,
  },
  {
    id: "p5",
    market: "#3 jumps first try",
    side: "NO",
    size: 80,
    entryCents: 59,
    priceCents: 55,
    pnlValue: 3.2,
  },
];

const PLACEHOLDER_ORDERS = [
  {
    id: "o1",
    market: "Hamster #7 < 35s",
    side: "YES",
    size: 250,
    outcome: "YES",
    payout: 265,
    settledAt: "2024-01-01T16:12:00Z",
  },
  {
    id: "o2",
    market: "Team Relay ≤2 pens",
    side: "YES",
    size: 120,
    outcome: "NO",
    payout: 0,
    settledAt: "2024-01-01T16:12:00Z",
  },
  {
    id: "o3",
    market: "#3 jumps first try",
    side: "NO",
    size: 80,
    outcome: "YES",
    payout: 160,
    settledAt: "2024-01-01T16:12:00Z",
  },
];

const toCurrency = (value) => formatCurrency(Number(value ?? 0));

const normalisePosition = (position, marketLookup) => {
  const market =
    position.market || marketLookup.get(String(position.market_id)) || {};
  const isYes = parseSide(position.side);
  const amount = Number(position.amount ?? 0);
  const shares = Number(position.shares ?? amount);
  const entryPrice = Number(
    position.price ?? position.entry_price ?? position.average_price ?? 0.5
  );

  const yesVolume = Number(market.yes_volume ?? 0);
  const noVolume = Number(market.no_volume ?? 0);
  const totalVolume = yesVolume + noVolume;
  const yesPrice =
    totalVolume > 0 ? yesVolume / totalVolume : Number(market.yes_price ?? 0.5);
  const currentPrice = isYes ? yesPrice : 1 - yesPrice;

  const pnlValue = currentPrice * shares - amount;

  return {
    id:
      position.id ||
      `${position.market_id}-${position.side}-${position.amount}`,
    market: market.question || "Market",
    side: isYes ? "YES" : "NO",
    size: amount,
    shares,
    entryCents: Math.round(entryPrice * 100),
    priceCents: Math.round(currentPrice * 100),
    pnlValue,
  };
};

const normaliseOrder = (entry) => {
  const isYes = parseSide(entry.side);
  const winningSide = entry.market?.winning_side || entry.result;
  return {
    id: entry.id || `${entry.market?.id}-${entry.side}-${entry.amount}`,
    market: entry.market?.question || "Market",
    side: isYes ? "YES" : "NO",
    size: Number(entry.amount ?? entry.size ?? 0),
    outcome: winningSide ? winningSide.toString().toUpperCase() : null,
    payout: Number(entry.payout ?? entry.settlement_amount ?? 0),
    settledAt:
      entry.market?.resolved_at || entry.updated_at || entry.created_at || null,
  };
};

const sideBadgeClass = (value) =>
  value === "YES"
    ? "border-[#ECECFD] bg-[#ECECFD] text-[#096]"
    : "border-[#FFC9C999] bg-[#FFC9C999] text-[#F54900]";

export default function StreamPositionsSection({
  positions,
  positionsLoading,
  userHistory,
}) {
  const [activeTab, setActiveTab] = useState("positions");

  const marketLookup = useMemo(() => {
    const lookup = new Map();
    (positions || []).forEach((position) => {
      const market = position.market;
      if (market?.id) lookup.set(String(market.id), market);
    });
    (userHistory || []).forEach((entry) => {
      const market = entry.market;
      if (market?.id) lookup.set(String(market.id), market);
    });
    return lookup;
  }, [positions, userHistory]);

  const hasRealPositions = Array.isArray(positions) && positions.length > 0;
  const hasRealOrders = Array.isArray(userHistory) && userHistory.length > 0;

  const tablePositions = hasRealPositions
    ? positions.map((position) => normalisePosition(position, marketLookup))
    : PLACEHOLDER_POSITIONS;

  const tableOrders = hasRealOrders
    ? userHistory.map((entry) => normaliseOrder(entry))
    : PLACEHOLDER_ORDERS;

  const renderPositions = () => {
    if (positionsLoading) {
      return (
        <div className="flex items-center justify-center py-12 text-sm font-semibold text-gray-500">
          Loading positions…
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-3 md:hidden">
          {tablePositions.map((row) => {
            const chancePercent = Math.min(
              100,
              Math.max(0, Math.round(row.priceCents ?? 0))
            );
            const payout = row.size + row.pnlValue;

            return (
              <div
                key={row.id}
                className="rounded-[4px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Left side: Hamster Icon */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-blue-500 text-2xl">
                      🐹
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        row.side === "YES"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {row.side === "YES" ? "Yes" : "No"}
                    </p>
                  </div>

                  {/* Right side: Question, Chance, and Payout */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Top row: Question and Refresh */}
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 pr-2">
                        {row.market}
                      </p>
                      <button
                        type="button"
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition flex-shrink-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                      </button>
                    </div>

                    {/* Bottom row: Chance and Payout */}
                    <div className="flex flex-col items-end">
                      <p
                        className={`text-sm font-medium flex items-center gap-1 ${
                          row.side === "YES"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {chancePercent}% chance
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                        >
                          <path d="M6 2L10 10H2L6 2Z" />
                        </svg>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Pays out {toCurrency(payout)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-hidden rounded-[4px] bg-white dark:bg-transparent md:block">
          <table className="w-full">
            <thead className=" dark:bg-[#141518] text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr className="dark:bg-transparent border-b">
                <th className=" py-3 text-left font-semibold">Market</th>
                <th className=" py-3 text-left font-semibold">Outcome</th>
                <th className=" py-3 text-left font-semibold">Size ($)</th>
                <th className="py-3 text-left font-semibold">Entry</th>
                <th className="py-3 text-left font-semibold">Shares</th>
                <th className=" py-3 text-left font-semibold">PnL</th>
                <th className="py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-[#18191d]">
              {tablePositions.map((row) => {
                const pnlPositive = row.pnlValue >= 0;
                const pnlAmount = toCurrency(Math.abs(row.pnlValue));

                return (
                  <tr
                    key={row.id}
                    className="transition-colors dark:hover:bg-[#18191d] "
                  >
                    <td className=" py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <span className="line-clamp-1 leading-snug">
                        {row.market}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex min-w-[42px] items-center justify-center rounded px-2.5 py-1 text-xs font-semibold ${sideBadgeClass(
                          row.side
                        )}`}
                      >
                        {row.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {toCurrency(row.size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatCents(row.entryCents)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatCents(row.priceCents)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold ${
                        pnlPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {`${pnlPositive ? "+" : "-"}${pnlAmount}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-[4px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          Close 50%
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-[4px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          Close 100%
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOrders = () => (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {tableOrders.map((row) => {
          return (
            <div
              key={row.id}
              className="rounded-[4px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {row.market.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {row.market}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                    {toCurrency(row.size)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded border px-3 py-1 text-xs font-semibold tracking-wide ${sideBadgeClass(
                    row.side
                  )}`}
                >
                  {row.side}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                    Shares
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatCents(row.priceCents)}
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-[4px] bg-gray-100 dark:bg-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[4px] bg-white dark:bg-transparent md:block">
        <table className="w-full">
          <thead className=" dark:bg-[#141518] text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <tr>
              <th className=" py-3 text-left">Market</th>
              <th className=" py-3 text-left">Side</th>
              <th className="py-3 text-left">Size ($)</th>
              <th className="py-3 text-left">Shares</th>
              <th className="py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {tableOrders.map((row) => {
              return (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className=" py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <span className="line-clamp-2 leading-snug">
                      {row.market}
                    </span>
                  </td>
                  <td className=" py-4">
                    <span
                      className={`inline-flex min-w-[52px] items-center justify-center rounded border px-3 py-1.5 text-xs font-semibold tracking-wide ${sideBadgeClass(
                        row.side
                      )}`}
                    >
                      {row.side}
                    </span>
                  </td>
                  <td className=" py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {toCurrency(row.size)}
                  </td>
                  <td className=" py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatCents(row.priceCents)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-[4px] bg-gray-100 dark:bg-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Share
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="rounded-[4px] md:border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518]">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-[#F5F5F5] dark:bg-[#141518] px-3 py-3 md:gap-4 md:px-4 m-2 rounded">
        <button
          type="button"
          onClick={() => setActiveTab("positions")}
          className={`rounded-[4px] px-4 py-2 text-sm font-semibold transition ${
            activeTab === "positions"
              ? "bg-white dark:bg-[#DEF6A5] text-gray-900 dark:text-[#000000CC]"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 "
          }`}
        >
          Positions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`rounded-[4px] px-4 py-2 text-sm font-semibold transition ${
            activeTab === "orders"
              ? "bg-white dark:bg-[#DEF6A5] text-gray-900 dark:text-[#000000CC]"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          Orders
        </button>
      </div>
      <div className="bg-white dark:bg-[#141518] px-4 md:px-6 pb-6">
        {activeTab === "positions" ? renderPositions() : renderOrders()}
      </div>
    </div>
  );
}
