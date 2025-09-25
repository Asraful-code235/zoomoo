import { useEffect, useMemo, useState } from "react";

export function useMarqueeTicker() {
  const [items, setItems] = useState([]);
  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api",
    []
  );

  const mergeBets = (incoming) => {
    setItems((prev) => {
      const key = (x) => `${x.ts}-${x.userHandle}-${x.amount}-${x.marketQuestion}`;
      const merged = [...incoming, ...prev];
      const seen = new Set();
      const dedup = [];
      for (const it of merged) {
        const k = key(it);
        if (!seen.has(k)) {
          seen.add(k);
          dedup.push(it);
        }
      }
      return dedup.sort((a, b) => b.ts - a.ts).slice(0, 30);
    });
  };

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/markets/recent-bets?limit=30&sinceMin=240`);
        if (!res.ok) return;
        const payload = await res.json();
        const list = Array.isArray(payload?.bets) ? payload.bets : [];
        if (stop || !list.length) return;
        const normalized = list.map((b) => ({
          avatarUrl: b.avatarUrl || "https://placehold.co/28x28",
          userHandle: b.userHandle || "@anon",
          amount: Number(b.amount) || 0,
          marketQuestion: b.marketQuestion || "—",
          side: b.side === "YES" ? "YES" : "NO",
          ts: b.ts || Date.now(),
        }));
        mergeBets(normalized);
      } catch {}
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [apiBase]);

  useEffect(() => {
    const onRecentBet = (e) => {
      const it = e?.detail;
      if (!it) return;
      mergeBets([
        {
          avatarUrl: it.avatarUrl || "https://placehold.co/28x28",
          userHandle: it.userHandle || "@anon",
          amount: Number(it.amount) || 0,
          marketQuestion: it.marketQuestion || "—",
          side: it.side === "YES" ? "YES" : "NO",
          ts: it.ts || Date.now(),
        },
      ]);
    };
    window.addEventListener("recent-bet", onRecentBet);
    return () => window.removeEventListener("recent-bet", onRecentBet);
  }, []);

  return { items };
}


