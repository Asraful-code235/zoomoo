// StreamGrid.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import StreamCard from "./streams/StreamCard";
import SortControls from "./SortControls";
import { formatEndsAt, formatCurrency } from "./streams/streamFormatting";

export default function StreamGrid() {
  const { authenticated, login, user } = usePrivy();
  const navigate = useNavigate();

  const [streams, setStreams] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef(null);

  // swipe tracking
  const [containerW, setContainerW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 360));
  const [touchStartX, setTouchStartX] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // bottom sheet state
  const [showSheet, setShowSheet] = useState(false);
  const [selectedSide, setSelectedSide] = useState("YES");
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [amount, setAmount] = useState("");

  // Ensure we reset to the first card whenever dataset changes
  useEffect(() => {
    setActiveSlide(0);
    setDragX(0);
  }, [streams]);

  // measure container width
  useEffect(() => {
    const update = () => {
      if (sliderRef?.current) {
        const w = sliderRef.current.offsetWidth || sliderRef.current.clientWidth || window.innerWidth;
        if (w && w !== containerW) setContainerW(w);
      } else if (typeof window !== 'undefined') {
        setContainerW(window.innerWidth);
      }
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro && sliderRef?.current) ro.observe(sliderRef.current);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro && sliderRef?.current) ro.unobserve(sliderRef.current);
    };
  }, [containerW]);

  const onTouchStart = (e) => {
    setIsDragging(true);
    setTouchStartX(e.touches[0].clientX);
  };
  const onTouchMove = (e) => {
    if (!isDragging || touchStartX == null) return;
    setDragX(e.touches[0].clientX - touchStartX);
  };
  const onTouchEnd = () => {
    if (!isDragging) return;
    const threshold = Math.min(80, containerW * 0.15);
    if (dragX < -threshold && activeSlide < (sortedStreams?.length || 1) - 1) {
      setActiveSlide((i) => i + 1);
    } else if (dragX > threshold && activeSlide > 0) {
      setActiveSlide((i) => i - 1);
    }
    setDragX(0);
    setIsDragging(false);
  };
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
      <div className="mb-6 md:mb-8 flex gap-3 flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
             Markets
            {refreshing && <span className="ml-2 text-xs text-gray-500">Refreshing…</span>}
          </h2>
        </div>
        <SortControls sortKey={sortKey} setSortKey={setSortKey} />
      </div>
      {/* Mobile: one-card-per-page swipe slider with floating YES/NO */}
      <div className="md:hidden -mx-6 pb-36">
     
        <div
          ref={sliderRef}
          className="relative w-full overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex"
            style={{
              width: Math.max(1, containerW) * (sortedStreams?.length || 1),
              transform: `translate3d(${-(activeSlide * Math.max(1, containerW)) + dragX}px, 0, 0)`,
              transition: isDragging ? "none" : "transform 300ms ease",
            }}
          >
            {sortedStreams.map((stream) => {
              const m = pickActiveMarket(stream) || (Array.isArray(stream?.markets) ? stream.markets[0] : null);
              const yesVol = Number(m?.yes_volume || 0);
              const noVol = Number(m?.no_volume || 0);
              const totalVol = Number(m?.total_volume ?? yesVol + noVol);
              return (
                <div key={stream.id} className="shrink-0" style={{ width: Math.max(1, containerW) }}>
                  <div className="px-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
                      {/* Top row: Question (big) + Ends time on the right */}
                      <div className="flex w-full items-start justify-between gap-3 text-left">
                        <h4 className="text-[17px] font-semibold text-gray-900 leading-snug line-clamp-2">
                          {m?.question || stream?.market_question || stream?.title || stream?.name || stream?.hamster_name || "Market"}
                        </h4>
                        <div className="shrink-0 text-right text-sm font-medium text-gray-500">Ends: {formatEndsAt(m?.ends_at)}</div>
                      </div>
                      {/* Bottom row: VOL (left) · % (center) · Yes/No segmented (right) */}
                      {(() => { const yesPct = Math.max(0, Math.min(100, Math.round((Number(m?.yes_price ?? 0.5))*100))); return (
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="text-sm text-gray-700"><span className="text-gray-500">VOL:</span> <span className="font-semibold text-gray-900">{formatCurrency(totalVol)}</span></div>
                          <div className="text-sm font-semibold text-gray-800">{yesPct}%</div>
                          <div className="inline-flex overflow-hidden rounded-md border border-gray-200">
                            <span className="px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-50">Yes</span>
                            <span className="px-3 py-1 text-sm font-semibold text-rose-600 bg-rose-50">No</span>
                          </div>
                        </div>
                      ); })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile fixed YES/NO for active slide */}
      {sortedStreams.length > 0 && (
        (() => {
          const stream = sortedStreams[activeSlide] || sortedStreams[0];
          const m = stream ? (pickActiveMarket(stream) || (Array.isArray(stream?.markets) ? stream.markets[0] : null)) : null;
          if (!m) return null;
          const yesPct = Math.max(0, Math.min(100, Math.round(((Number(m?.yes_price ?? 0.5)) * 100))));
          return (
            <div className="md:hidden fixed inset-x-0 z-[60] bg-white/95 backdrop-blur border-t border-gray-200 p-3" style={{ bottom: "calc(env(safe-area-inset-bottom) + 64px)" }}>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedSide('YES'); setSelectedStream(stream); setSelectedMarket(m); setShowSheet(true); }}
                  className="h-14 rounded-md bg-[#ECECFD] text-emerald-700 text-sm font-semibold flex items-center justify-center shadow-sm"
                >
                  YES · {yesPct}¢
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedSide('NO'); setSelectedStream(stream); setSelectedMarket(m); setShowSheet(true); }}
                  className="h-14 rounded-md bg-[#FFF1F2] text-rose-600 text-sm font-semibold flex items-center justify-center shadow-sm"
                >
                  NO · {100 - yesPct}¢
                </button>
              </div>
            </div>
          );
        })()
      )}

      {/* Bottom sheet: amount entry */}
      {showSheet && selectedMarket && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl p-4"
               style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Buy</div>
              <button className="text-sm text-gray-500" onClick={() => setShowSheet(false)}>Close</button>
            </div>
            <div className="text-[13px] text-gray-700 mb-3 line-clamp-2">{selectedMarket?.question || selectedStream?.title}</div>
            <div className="flex items-center justify-center gap-4 my-2">
              <button className="w-9 h-9 rounded-md bg-gray-100 text-gray-700" onClick={() => setAmount((v)=> String(Math.max(0, Number(v||0)-1)))}>-</button>
              <input inputMode="decimal" pattern="[0-9]*" value={amount} onChange={(e)=> setAmount(e.target.value.replace(/[^0-9.]/g,''))}
                     className="w-28 text-3xl font-semibold text-gray-900 bg-transparent text-center" placeholder="$0" />
              <button className="w-9 h-9 rounded-md bg-gray-100 text-gray-700" onClick={() => setAmount((v)=> String(Number(v||0)+1))}>+</button>
            </div>
            <div className="flex gap-2 justify-center mb-3">
              {['1','20','100'].map((v)=> (
                <button key={v} onClick={() => setAmount(v)} className="px-3 py-1.5 rounded-md border text-xs text-gray-700">+${v}</button>
              ))}
              <button onClick={() => setAmount('1000')} className="px-3 py-1.5 rounded-md border text-xs text-gray-700">Max</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(() => { const p = Math.max(0, Math.min(100, Math.round((Number(selectedMarket?.yes_price ?? 0.5))*100))); return (
                <>
                  <button className="h-12 rounded-md bg-[#ECECFD] text-emerald-700 font-semibold">YES · {p}¢</button>
                  <button className="h-12 rounded-md bg-[#FFF1F2] text-rose-600 font-semibold">NO · {100 - p}¢</button>
                </>
              ); })()}
            </div>
          </div>
        </div>
      )}


      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
