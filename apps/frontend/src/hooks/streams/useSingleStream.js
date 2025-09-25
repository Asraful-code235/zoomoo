import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useModal } from "../../hooks/useModal";
import { positionStorage } from "../../utils/positionStorage";

export function useSingleStream(streamId) {
  const { authenticated, user } = usePrivy();
  const modal = useModal();

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attemptedLoad, setAttemptedLoad] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userPositions, setUserPositions] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [trend, setTrend] = useState([]);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [countdown, setCountdown] = useState({ label: "No active market", ms: 0 });
  const totalsRef = useRef({ yes: 0, no: 0, seeded: false });
  const fetchAbortersRef = useRef([]);

  const apiBase = useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:3001", []);

  const clampPct = (n) => {
    const v = Number(n);
    if (Number.isNaN(v)) return 50;
    return Math.max(0, Math.min(100, Math.round(v)));
  };

  const ensureTwoPoints = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if (arr.length >= 2) return arr;
    const p = arr[0];
    const ts = p?.ts ? new Date(p.ts).getTime() : Date.now();
    return [{ ...p, ts: new Date(ts - 1000).toISOString() }, p];
  };

  const trackedFetch = async (url, init) => {
    const ac = new AbortController();
    fetchAbortersRef.current.push(ac);
    try {
      const res = await fetch(url, { ...(init || {}), signal: ac.signal });
      return res;
    } finally {
      fetchAbortersRef.current = fetchAbortersRef.current.filter((x) => x !== ac);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setAttemptedLoad(false);
      await Promise.all([
        fetchStream(true),
        authenticated && user?.id ? fetchUserPositions(true) : Promise.resolve(),
        authenticated && user?.id ? fetchUserHistory() : Promise.resolve(),
      ]);
      if (!active) return;
      setAttemptedLoad(true);
      setLoading(false);
    })();
    return () => {
      active = false;
      fetchAbortersRef.current.forEach((a) => a.abort());
      fetchAbortersRef.current = [];
    };
  }, [streamId, authenticated, user?.id]);

  useEffect(() => {
    const id = setInterval(async () => {
      setRefreshing(true);
      await Promise.all([
        fetchStream(false),
        authenticated && user?.id ? fetchUserPositions(false) : Promise.resolve(),
        authenticated && user?.id ? fetchUserHistory() : Promise.resolve(),
      ]);
      setRefreshing(false);
    }, 30000);
    return () => clearInterval(id);
  }, [streamId, authenticated, user?.id]);

  useEffect(() => {
    const softRefresh = async () => {
      setRefreshing(true);
      await fetchStream(false);
      if (authenticated && user?.id) {
        await Promise.all([fetchUserPositions(false), fetchUserHistory()]);
      }
      setRefreshing(false);
    };
    window.addEventListener("marketResolved", softRefresh);
    window.addEventListener("marketCancelled", softRefresh);
    window.addEventListener("marketRenewed", softRefresh);
    return () => {
      window.removeEventListener("marketResolved", softRefresh);
      window.removeEventListener("marketCancelled", softRefresh);
      window.removeEventListener("marketRenewed", softRefresh);
    };
  }, [authenticated, user?.id]);

  useEffect(() => {
    const onRecentBet = (e) => {
      const d = e?.detail;
      if (!d || String(d.streamId) !== String(streamId)) return;
      const amt = Number(d.amount) || 0;
      if (amt <= 0) return;
      if (!totalsRef.current.seeded) seedTotalsFromMarkets(stream?.markets);
      if (d.side === "YES") totalsRef.current.yes += amt;
      else totalsRef.current.no += amt;
      const yes = totalsRef.current.yes;
      const no = totalsRef.current.no;
      const total = yes + no || 1;
      const yesPct = clampPct((yes / total) * 100);
      const noPct = 100 - yesPct;
      const ts = new Date(Date.now() + Math.floor(Math.random() * 200)).toISOString();
      setTrend((prev) => [...prev, { ts, yesPct, noPct }]);
      setHoverPoint({ ts, yesPct, noPct });
    };
    window.addEventListener("recent-bet", onRecentBet);
    return () => window.removeEventListener("recent-bet", onRecentBet);
  }, [streamId, stream?.markets]);

  useEffect(() => {
    const id = setInterval(() => updateCountdown(stream?.markets || []), 1000);
    return () => clearInterval(id);
  }, [stream?.markets]);

  const fetchUserPositions = async (initial = false) => {
    try {
      if (!authenticated || !user?.id) return;
      if (initial) setPositionsLoading(true);
      const res = await trackedFetch(`${apiBase}/api/users/${user.id}/active`);
      if (res.ok) {
        const data = await res.json();
        const streamPositions = (data.activePositions || []).filter(
          (p) => p.market?.stream_id === streamId
        );
        setUserPositions(streamPositions);
        return;
      }
      const localPositions = positionStorage.getStreamPositions(user.id, String(streamId));
      const enriched = localPositions.map((position) => {
        const currentPrice = 0.5;
        const relevantPrice = position.side ? currentPrice : 1 - currentPrice;
        const unrealized_pnl = relevantPrice * position.shares - position.amount;
        return {
          ...position,
          market: { ...position.market, current_price: currentPrice },
          unrealized_pnl,
        };
      });
      setUserPositions(enriched);
    } catch {
      setUserPositions([]);
    } finally {
      if (initial) setPositionsLoading(false);
    }
  };

  const fetchUserHistory = async () => {
    try {
      if (!authenticated || !user?.id) {
        setUserHistory([]);
        return;
      }
      const res = await trackedFetch(
        `${apiBase}/api/users/${user.id}/positions?status=resolved&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        const list = (data.positions || data || [])
          .filter((p) => p.market?.stream_id === streamId)
          .sort(
            (a, b) =>
              new Date(b?.market?.resolved_at || b.updated_at || 0) -
              new Date(a?.market?.resolved_at || a.updated_at || 0)
          )
          .slice(0, 3);
        setUserHistory(list);
        return;
      }
      const local = positionStorage
        .getStreamPositions(user.id, String(streamId))
        .filter(
          (p) =>
            p.market?.stream_id === String(streamId) &&
            (p.market?.status === "ended" || p.market?.status === "resolved")
        )
        .sort(
          (a, b) =>
            new Date(b.market?.resolved_at || b.updated_at || 0) -
            new Date(a.market?.resolved_at || a.updated_at || 0)
        )
        .slice(0, 3);
      setUserHistory(local);
    } catch {
      setUserHistory([]);
    }
  };

  const fetchStream = async (initial = false) => {
    const currentId = String(streamId || "");
    if (!currentId) return;
    try {
      const streamRes = await trackedFetch(`${apiBase}/api/streams/${currentId}`);
      if (!streamRes.ok) {
        if (streamRes.status === 404) {
          if (String(streamId || "") === currentId) setStream(null);
        }
        return;
      }
      const streamData = await streamRes.json();
      const marketsRes = await trackedFetch(`${apiBase}/api/markets/stream/${currentId}`);
      let markets = [];
      if (marketsRes.ok) {
        const m = await marketsRes.json();
        markets = m.markets || [];
      }
      if (String(streamId || "") !== currentId) return;
      setStream({ ...streamData.stream, markets });
      if (markets.length) {
        markets.forEach((m) => positionStorage.updateMarketStatus(m.id, m.status));
      }
      setLastUpdated(new Date());
      seedTotalsFromMarkets(markets);
      await fetchTrendPoints(markets);
      updateCountdown(markets);
    } catch {}
  };

  const seedTotalsFromMarkets = (markets) => {
    try {
      const yes = (markets || []).reduce((s, m) => s + Number(m.yes_volume || 0), 0);
      const no = (markets || []).reduce((s, m) => s + Number(m.no_volume || 0), 0);
      totalsRef.current = { yes, no, seeded: true };
    } catch {
      totalsRef.current = { yes: 0, no: 0, seeded: true };
    }
  };

  const fetchTrendPoints = async (markets) => {
    try {
      const t = await trackedFetch(`${apiBase}/api/markets/streams/${streamId}/trend?sinceMin=180`);
      if (t.ok) {
        const data = await t.json();
        const arr = Array.isArray(data?.points)
          ? data.points
          : Array.isArray(data)
          ? data
          : [];
        const normalized = arr.map((p) => ({
          ts: p.ts || p.timestamp || p.date || new Date().toISOString(),
          yesPct: clampPct(p.yesPct ?? p.yes_percent ?? p.yes),
          noPct: clampPct(p.noPct ?? p.no_percent ?? p.no ?? (100 - (p.yesPct ?? 50))),
        }));
        if (normalized.length) {
          setTrend(normalized);
          setHoverPoint(normalized[normalized.length - 1]);
          return;
        }
      }
    } catch {}

    const pts = (markets || [])
      .filter((m) => m.created_at || m.ends_at)
      .sort(
        (a, b) =>
          new Date(a.created_at || a.ends_at).getTime() -
          new Date(b.created_at || b.ends_at).getTime()
      )
      .map((m) => {
        const yes = Number(m.yes_volume || 0);
        const no = Number(m.no_volume || 0);
        const total = yes + no || 1;
        const yesPct = clampPct((yes / total) * 100);
        return { ts: m.created_at || m.ends_at, yesPct, noPct: 100 - yesPct };
      });

    const fallback =
      pts.length > 0
        ? pts
        : Array.from({ length: 24 }).map((_, i) => ({
            ts: new Date(Date.now() - (23 - i) * 5 * 60_000).toISOString(),
            yesPct: 50,
            noPct: 50,
          }));

    setTrend(fallback);
    setHoverPoint(fallback[fallback.length - 1]);
  };

  const updateCountdown = (markets) => {
    const active = (markets || []).find(
      (m) => m.status === "active" && new Date(m.ends_at) > new Date()
    );
    if (!active || !active.ends_at) {
      setCountdown({ label: "No active market", ms: 0 });
      return;
    }
    const now = Date.now();
    const end = new Date(active.ends_at).getTime();
    const ms = Math.max(0, end - now);

    const asHHMMSS = (msLeft) => {
      const s = Math.floor(msLeft / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      return h > 0
        ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
        : `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    };

    setCountdown({
      label: ms > 0 ? `Ends in ${asHHMMSS(ms)}` : "Ended",
      ms,
    });

    if (ms === 0) {
      (async () => {
        setRefreshing(true);
        await fetchStream(false);
        setRefreshing(false);
      })();
    }
  };

  const marketsByStatus = useMemo(() => {
    const list = stream?.markets || [];
    return {
      active: list.filter((m) => m.status === "active" && new Date(m.ends_at) > new Date()),
      pending: list.filter((m) => m.status === "pending" || m.status === "scheduled"),
      resolved: list.filter((m) => m.status === "ended" || m.status === "resolved"),
    };
  }, [stream?.markets]);

  const getCurrentActiveMarket = (mbs) => mbs.active?.[0] || null;

  const hasBetOnMarket = useCallback(
    (marketId) => {
      if (!marketId) return false;
      return (userPositions || []).some((p) => {
        const mid = p.market_id || p.market?.id;
        return String(mid) === String(marketId);
      });
    },
    [userPositions]
  );

  const hasBetActive = useMemo(() => {
    if (!authenticated || !user?.id) return false;
    const activeMarket = getCurrentActiveMarket(marketsByStatus);
    if (!activeMarket) return false;
    return hasBetOnMarket(activeMarket.id);
  }, [authenticated, user?.id, marketsByStatus, hasBetOnMarket]);

  const formatUSD = (n) => {
    const v = Number(n ?? 0);
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const placeInlineBet = async (side, targetMarketId) => {
    if (!authenticated) {
      return modal.showWarning("Please sign in to place bets!", "Authentication Required");
    }
    const amt = parseFloat(betAmount);
    if (!Number.isFinite(amt) || amt <= 0) return modal.showWarning("Enter a valid amount", "Invalid Amount");
    if (amt < 1) return modal.showWarning("Minimum bet is $1", "Too Low");
    if (amt > 1000) return modal.showWarning("Maximum bet is $1,000", "Too High");
    const resolveMarket = (marketId) => {
      if (!marketId) return getCurrentActiveMarket(marketsByStatus);
      return (stream?.markets || []).find((m) => String(m.id) === String(marketId)) || getCurrentActiveMarket(marketsByStatus);
    };

    const target = resolveMarket(targetMarketId);
    if (!target) return modal.showWarning("No active market to bet on right now.", "No Market");
    if (hasBetOnMarket(target.id)) {
      return modal.showWarning("You’ve already placed a bet on this market.", "One Bet Per Market");
    }
    const fee = +(amt * 0.02).toFixed(2);
    const totalCost = +(amt + fee).toFixed(2);
    try {
      setPlacing(true);
      const res = await fetch(`${apiBase}/api/markets/${target.id}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, amount: amt, userId: user.id }),
      });
      const data = await res.json();
      if (res.status === 409) {
        modal.showWarning("You’ve already placed a bet on this market.", "One Bet Per Market");
        await fetchUserPositions(false);
        return;
      }
      if (!res.ok) {
        if (data?.error?.toLowerCase?.().includes("insufficient")) {
          const cb = data?.currentBalance ?? 0;
          const need = data?.requiredAmount ?? totalCost;
          modal.showError(
            `You have $${formatUSD(cb)} but need $${formatUSD(need)} (incl. $${formatUSD(fee)} fee).`,
            "Insufficient Balance"
          );
        } else {
          modal.showError(data?.error || "Failed to place bet", "Bet Failed");
        }
        return;
      }
      modal.showSuccess(
        `Bet placed on ${side ? "YES" : "NO"} · $${formatUSD(amt)} (fee $${formatUSD(fee)})`,
        "Bet Placed!"
      );
      setBetAmount("");
      positionStorage.addPosition(user.id, {
        market_id: target.id,
        side,
        amount: amt,
        shares: data?.position?.shares ?? amt,
        price: data?.position?.price ?? (side ? 0.5 : 0.5),
        transaction_fee: fee,
        market: { ...target, stream_id: streamId, current_price: 0.5, status: target.status || "active" },
      });
      window.dispatchEvent(
        new CustomEvent("recent-bet", {
          detail: {
            userHandle:
              user?.twitter?.username ||
              user?.telegram?.username ||
              user?.email?.address?.split("@")[0] ||
              "anon",
            avatarUrl:
              user?.farcaster?.pfp || user?.twitter?.profilePictureUrl || "https://placehold.co/28x28",
            amount: amt,
            side: side ? "YES" : "NO",
            marketQuestion: target.question,
            ts: Date.now(),
            streamId,
            marketId: target.id,
          },
        })
      );
      await Promise.all([fetchStream(false), fetchUserPositions(false), fetchUserHistory()]);
    } catch {
      modal.showError("Network error. Please try again.", "Connection Error");
    } finally {
      setPlacing(false);
    }
  };

  return {
    // state
    stream,
    loading,
    attemptedLoad,
    refreshing,
    lastUpdated,
    userPositions,
    userHistory,
    positionsLoading,
    betAmount,
    setBetAmount,
    placing,
    trend: ensureTwoPoints(trend),
    hoverPoint,
    setHoverPoint,
    countdown,
    marketsByStatus,
    hasBetActive,
    hasBetOnMarket,
    placeInlineBet,
    fetchStream,
    fetchUserPositions,
  };
}

