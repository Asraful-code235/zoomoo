import { useEffect, useMemo, useState } from "react";

export default function Leaderboard() {
  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api",
    []
  );

  const [timeframe, setTimeframe] = useState("all"); // 'all' | 'weekly' | 'monthly'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(Number(n || 0));

  const displayName = (u) => {
    const name = u?.username || u?.email || String(u?.id || "user");
    // If it looks like an email, show the part before @
    if (name.includes("@")) return name.split("@")[0];
    // Truncate long identifiers (addresses, ids)
    return name.length > 12 ? `${name.slice(0, 4)}…${name.slice(-4)}` : name;
  };

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiBase}/auth/leaderboard?timeframe=${timeframe}&limit=100`);
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        const list = Array.isArray(data?.leaderboard) ? data.leaderboard : [];
        if (!stop) setRows(list);
      } catch (e) {
        if (!stop) setError(e.message || "Error fetching leaderboard");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [apiBase, timeframe]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Leaderboard</h1>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs md:text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none"
        >
          <option value="all">All time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center text-gray-600">
          Loading leaderboard…
        </div>
      )}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Podium */}
          <div className="flex items-end justify-center gap-3 md:gap-6 mt-1 mb-3">
            {/* 2nd */}
            <PodiumCard
              rank={2}
              user={top3[1]}
              height={140}
              tone="silver"
              formatUSD={formatUSD}
              displayName={displayName}
            />
            {/* 1st */}
            <PodiumCard
              rank={1}
              user={top3[0]}
              height={180}
              tone="gold"
              highlight
              formatUSD={formatUSD}
              displayName={displayName}
            />
            {/* 3rd */}
            <PodiumCard
              rank={3}
              user={top3[2]}
              height={120}
              tone="bronze"
              formatUSD={formatUSD}
              displayName={displayName}
            />
          </div>

          {/* List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {rest.length === 0 ? (
              <div className="py-10 text-center text-gray-600 text-sm">No more entries</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {rest.map((u, i) => (
                  <li key={u.id || i} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-6 text-xs font-bold text-gray-600">{i + 4}</span>
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">{displayName(u)}</span>
                    <span className={`text-sm font-semibold ${Number(u.total_earnings || 0) >= 0 ? "text-green-600" : "text-rose-600"}`}>
                      {formatUSD(u.total_earnings || 0)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PodiumCard({ rank, user, height = 120, tone = "silver", highlight = false, formatUSD, displayName }) {
  const toneMap = {
    gold: "bg-gradient-to-b from-yellow-300/80 via-yellow-200 to-yellow-100 border-yellow-300",
    silver: "bg-gradient-to-b from-gray-400/70 via-gray-300 to-gray-100 border-gray-300",
    bronze: "bg-gradient-to-b from-rose-300/70 via-rose-200 to-rose-100 border-rose-300",
  };

  if (!user) {
    return (
      <div
        style={{ height }}
        className={`flex-1 min-w-[96px] rounded-xl border ${toneMap[tone]} shadow-sm`} />
    );
  }

  return (
    <div
      style={{ height }}
      className={`flex-1 min-w-[96px] rounded-xl border ${toneMap[tone]} relative flex items-end justify-center overflow-hidden shadow`}
    >
      {/* rank badge */}
      <div className="absolute top-3 right-2 w-7 h-7 rounded-full bg-white text-gray-900 text-xs font-bold grid place-items-center border border-gray-200 shadow-sm">
        {rank}
      </div>
      <div className="text-center pb-3 px-2">
        <div className={`text-[11px] md:text-xs font-semibold ${highlight ? "text-gray-900" : "text-gray-700"} truncate`}>{displayName(user)}</div>
        <div className="text-xs md:text-sm font-bold text-green-600">{formatUSD(user.total_earnings || 0)}</div>
      </div>
    </div>
  );
}

