import { useState, useEffect, useCallback, useMemo } from "react";

export function useStreams(apiBase, authenticated, userId) {
  const [streams, setStreams] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myActiveSides, setMyActiveSides] = useState({});

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
    if (!authenticated || !userId) {
      setMyActiveSides({});
      return;
    }
    try {
      const res = await fetch(`${apiBase}/users/${encodeURIComponent(userId)}/active`);
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
  }, [apiBase, authenticated, userId]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchStreams(true), fetchMyActivePositions()]);
    })();
  }, [fetchStreams, fetchMyActivePositions]);

  useEffect(() => {
    const id = setInterval(async () => {
      await Promise.all([fetchStreams(false), fetchMyActivePositions()]);
    }, 45000);
    return () => clearInterval(id);
  }, [fetchStreams, fetchMyActivePositions]);

  return {
    streams,
    initialLoading,
    refreshing,
    myActiveSides,
    refetch: () => Promise.all([fetchStreams(false), fetchMyActivePositions()]),
  };
}

