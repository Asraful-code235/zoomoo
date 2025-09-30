import { useState, useEffect, useCallback, useMemo } from "react";

export function useMarketData() {
  const [now, setNow] = useState(Date.now());

  // 1s heartbeat for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const pickActiveMarket = useCallback((stream) => {
    const ms = Array.isArray(stream?.markets) ? stream.markets : [];
    const active = ms.filter((m) => String(m?.status) === "active");

    // Prefer active & future-dated
    const future = active.find(
      (m) => m?.ends_at && new Date(m.ends_at) > new Date()
    );
    if (future) return future;

    // Otherwise any "active"
    return active[0] || null;
  }, []);

  const remainingMs = useCallback(
    (market) => {
      if (!market?.ends_at) return null;
      const end = new Date(market.ends_at).getTime();
      return Math.max(0, end - now);
    },
    [now]
  );

  const formatUSD = useCallback(
    (n) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(Number(n || 0)),
    []
  );

  const sortStreams = useCallback(
    (streams, sortKey) => {
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
        return list.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
      }
      return list;
    },
    [pickActiveMarket, remainingMs]
  );

  return {
    now,
    pickActiveMarket,
    remainingMs,
    formatUSD,
    sortStreams,
  };
}

