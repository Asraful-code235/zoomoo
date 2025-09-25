// StreamGrid.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import StreamCard from "./streams/StreamCard";
import SortControls from "./SortControls";

export default function StreamGrid() {
  const { authenticated, login, user } = usePrivy();
  const navigate = useNavigate();

  const [streams, setStreams] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myActiveSides, setMyActiveSides] = useState({});
  const [now, setNow] = useState(Date.now());

  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api",
    []
  );

  // --- sorting state MUST be declared before any early returns to keep hooks order stable
  const [sortKey, setSortKey] = useState("trending");

  // Return ONLY a true active market (and prefer one that hasn't expired yet)
  const pickActiveMarket = useCallback((stream) => {
    const ms = Array.isArray(stream?.markets) ? stream.markets : [];
    const active = ms.filter((m) => String(m?.status) === "active");

    // Prefer active & future-dated
    const future = active.find((m) => m?.ends_at && new Date(m.ends_at) > new Date());
    if (future) return future;

    // Otherwise any "active"
    return active[0] || null;
  }, []);

  const remainingMs = useCallback((market) => {
    if (!market?.ends_at) return null;
    const end = new Date(market.ends_at).getTime();
    return Math.max(0, end - now);
  }, [now]);

  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  // Pull streams; if markets missing/empty, hydrate per-stream to avoid dummy stats
  const fetchStreams = useCallback(async (showSpinnerOnStart = false) => {
    try {
      if (showSpinnerOnStart) setInitialLoading(true);
      else setRefreshing(true);

      const res = await fetch(`${apiBase}/streams?include=markets`);
      const payload = await res.json();
      let list = payload?.streams || payload?.data || (Array.isArray(payload) ? payload : []);
      list = Array.isArray(list) ? list : [];

      // Hydrate markets if missing/empty
      const hydrated = await Promise.all(
        list.map(async (s) => {
          if (Array.isArray(s.markets) && s.markets.length > 0) return s;
          try {
            const mres = await fetch(`${apiBase}/markets/stream/${s.id}`);
            if (mres.ok) {
              const mjson = await mres.json();
              return { ...s, markets: mjson?.markets || [] };
            }
          } catch (e) {
            console.error("Error fetching markets for stream:", e);
          }
          return { ...s, markets: Array.isArray(s.markets) ? s.markets : [] };
        })
      );

      setStreams(hydrated);
    } catch (e) {
      console.error("Error fetching streams:", e);
      setStreams([]);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [apiBase]);

  const fetchMyActivePositions = useCallback(async () => {
    if (!authenticated || !user?.id) {
      setMyActiveSides({});
      return;
    }
    try {
      const res = await fetch(`${apiBase}/users/${encodeURIComponent(user.id)}/active`);
      if (!res.ok) {
        setMyActiveSides({});
        return;
      }
      const { activePositions = [] } = await res.json();
      const map = {};
      for (const p of activePositions) {
        const marketId = p.market_id || p?.market?.id;
        if (!marketId) continue;
        map[marketId] = p.side ? "YES" : "NO";
      }
      setMyActiveSides(map);
    } catch (e) {
      console.error("Error fetching user active positions:", e);
      setMyActiveSides({});
    }
  }, [apiBase, authenticated, user?.id]);

  useEffect(() => {
    (async () => { await Promise.all([fetchStreams(true), fetchMyActivePositions()]); })();
  }, [fetchStreams, fetchMyActivePositions]);

  useEffect(() => {
    const id = setInterval(async () => {
      await Promise.all([fetchStreams(false), fetchMyActivePositions()]);
    }, 45000);
    return () => clearInterval(id);
  }, [fetchStreams, fetchMyActivePositions]);

  // 1s heartbeat for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // derive sorted list (before early returns)
  const sortedStreams = useMemo(() => {
    const list = [...streams];
    const volumeOf = (s) => {
      const m = pickActiveMarket(s);
      const yes = Number(m?.yes_volume || 0);
      const no = Number(m?.no_volume || 0);
      const tot = Number(m?.total_volume || 0);
      return tot || yes + no;
    };
    if (sortKey === "trending" || sortKey === "volume") {
      return list.sort((a, b) => volumeOf(b) - volumeOf(a));
    }
    if (sortKey === "time_left") {
      const left = (s) => {
        const m = pickActiveMarket(s);
        return m ? remainingMs(m) ?? Infinity : Infinity;
      };
      return list.sort((a, b) => left(a) - left(b));
    }
    if (sortKey === "newest") {
      return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return list;
  }, [streams, sortKey, pickActiveMarket, remainingMs]);

  if (initialLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="mb-8">
            <div className="text-6xl animate-bounce-slow mb-4">🐹</div>
            <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading hamster streams...</h2>
          <p className="text-base text-gray-600">Setting up the cameras...</p>
        </div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-float">🚧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No streams available</h2>
          <p className="text-base text-gray-600">Our hamsters are taking a break! Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
      <div className="mb-6 md:mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Trending Markets
            {refreshing && <span className="ml-2 text-xs text-gray-500">Refreshing…</span>}
          </h2>
          <p className="text-gray-600">Watch and predict hamster behaviors in real time.</p>
        </div>
        <SortControls sortKey={sortKey} setSortKey={setSortKey} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedStreams.map((stream, index) => {
          const activeMarket = pickActiveMarket(stream);
          const mySide = activeMarket && myActiveSides[activeMarket.id] ? myActiveSides[activeMarket.id] : undefined;

          return (
            <div key={stream.id} style={{ animationDelay: `${index * 0.05}s` }}>
              <StreamCard
                stream={stream}
                index={index}
                authenticated={authenticated}
                onNavigate={(id) => (!authenticated ? login?.() : navigate(`/streams/${id}`))}
                pickActiveMarket={pickActiveMarket}
                remainingMs={remainingMs}
                formatUSD={formatUSD}
                mySide={mySide}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
