import { useMemo, useState } from "react";
import {
  chartTickFormatter,
  formatCents,
  formatCurrency,
  parseSide,
} from "./streamFormatting";

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

export default function StreamPositionsSection({
  positions,
  positionsLoading,
  userHistory,
  onRefresh,
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
      <div className="space-y-3">
        <div className="space-y-3 md:hidden">
          {tablePositions.map((row) => {
            const pnlPositive = row.pnlValue >= 0;
            const pnlAmount = toCurrency(Math.abs(row.pnlValue));
            const signedPnl = `${pnlPositive ? "+" : "-"}${pnlAmount}`;

            return (
              <div
                key={row.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {row.market}
                  </p>
                  <span
                    className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium ${
                      row.side === "YES"
                        ? "bg-[#ECECFD] text-[#1D4ED8]"
                        : "bg-[#FFE8EC] text-[#DB2777]"
                    }`}
                  >
                    {row.side}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500">
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-gray-500">
                      Size
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {toCurrency(row.size)}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-gray-500">
                      Entry
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {formatCents(row.entryCents)}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-gray-500">
                      Price
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {formatCents(row.priceCents)}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-gray-500">
                      PnL
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        pnlPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {signedPnl}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 sm:w-auto"
                  >
                    Close 50%
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 sm:w-auto"
                  >
                    Close 100%
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-hidden rounded-2xl bg-white md:block">
          <table className="w-full bg-white text-sm">
            <thead className="border-b pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-3">Market</th>
                <th className="py-3">Side</th>
                <th className="py-3">Size ($)</th>
                <th className="py-3">Entry</th>
                <th className="py-3">Price</th>
                <th className="py-3">PnL</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tablePositions.map((row) => {
                const pnlPositive = row.pnlValue >= 0;
                const pnlAmount = toCurrency(Math.abs(row.pnlValue));

                return (
                  <tr key={row.id} className="transition-colors hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">
                      <span className="line-clamp-2 leading-snug">
                        {row.market}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex min-w-[44px] items-center justify-center px-3 py-1.5 text-xs font-medium ${
                          row.side === "YES"
                            ? "bg-[#ECECFD] text-[#1D4ED8]"
                            : "bg-[#FFE8EC] text-[#DB2777]"
                        }`}
                      >
                        {row.side}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {toCurrency(row.size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCents(row.entryCents)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCents(row.priceCents)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        pnlPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {`${pnlPositive ? "+" : "-"}${pnlAmount}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50"
                        >
                          Close 50%
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50"
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
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {tableOrders.map((row) => {
          const payoutPositive = row.payout >= row.size;
          const outcomeIsYes = row.outcome?.toUpperCase() === "YES";

          return (
            <div
              key={row.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  {row.market}
                </p>
                <span
                  className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium ${
                    row.side === "YES"
                      ? "bg-[#ECECFD] text-[#1D4ED8]"
                      : "bg-[#FFE8EC] text-[#DB2777]"
                  }`}
                >
                  {row.side}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500">
                <div>
                  <p className="font-semibold uppercase tracking-wide text-gray-500">
                    Size
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {toCurrency(row.size)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-gray-500">
                    Outcome
                  </p>
                  {row.outcome ? (
                    <span
                      className={`mt-1 inline-flex min-w-[44px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                        outcomeIsYes
                          ? "bg-[#ECECFD] text-[#1D4ED8]"
                          : "bg-[#FFE8EC] text-[#DB2777]"
                      }`}
                    >
                      {row.outcome}
                    </span>
                  ) : (
                    <p className="mt-1 text-sm text-gray-600">—</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-gray-500">
                    Payout
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      payoutPositive ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {toCurrency(row.payout)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-gray-500">
                    Settled
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {row.settledAt ? chartTickFormatter(row.settledAt) : "—"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl bg-white md:block">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="py-3">Market</th>
              <th className="py-3">Side</th>
              <th className="py-3">Size ($)</th>
              <th className="py-3">Outcome</th>
              <th className="py-3">Payout</th>
              <th className="py-3">Settled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tableOrders.map((row) => {
              const payoutPositive = row.payout >= row.size;
              const outcomeIsYes = row.outcome?.toUpperCase() === "YES";

              return (
                <tr key={row.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <span className="line-clamp-2 leading-snug">
                      {row.market}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex min-w-[44px] items-center justify-center px-3 py-1.5 text-xs font-medium ${
                        row.side === "YES"
                          ? "bg-[#ECECFD] text-[#1D4ED8]"
                          : "bg-[#FFE8EC] text-[#DB2777]"
                      }`}
                    >
                      {row.side}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-semibold text-gray-900">
                    {toCurrency(row.size)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {row.outcome ? (
                      <span
                        className={`inline-flex min-w-[44px] items-center justify-center px-3 py-1.5 text-xs font-medium ${
                          outcomeIsYes
                            ? "bg-[#ECECFD] text-[#1D4ED8]"
                            : "bg-[#FFE8EC] text-[#DB2777]"
                        }`}
                      >
                        {row.outcome}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={`py-3 text-sm font-semibold ${
                      payoutPositive ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {toCurrency(row.payout)}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {row.settledAt ? chartTickFormatter(row.settledAt) : "—"}
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
    <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-[#E5E5E5] px-3 py-2 md:gap-4 md:px-4">
        <button
          type="button"
          onClick={() => setActiveTab("positions")}
          className={` px-3 py-1.5 text-sm font-medium transition ${
            activeTab === "positions"
              ? "bg-white text-[#262626]"
              : "text-[#4A5565] hover:text-gray-800"
          }`}
        >
          Positions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={` px-3 py-1.5 text-sm font-medium transition ${
            activeTab === "orders"
              ? "bg-white text-[#262626]"
              : "text-[#4A5565] hover:text-gray-800"
          }`}
        >
          Orders
        </button>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="ml-auto text-xs font-semibold text-gray-400 transition hover:text-gray-600"
          >
            Refresh
          </button>
        )}
      </div>
      <div className="bg-white p-3 md:p-4">
        {activeTab === "positions" ? renderPositions() : renderOrders()}
      </div>
    </div>
  );
}
