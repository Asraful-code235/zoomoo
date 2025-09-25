import { Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { AlarmClock, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useWelcome } from "../../hooks/home/useWelcome";

export default function Welcome() {
  const { authenticated, login } = usePrivy();
  const { slides, active, setActive, loading, autoplay, setAutoplay, hoverPoint, setHoverPoint } = useWelcome();

  const ensureTwoPoints = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if (arr.length >= 2) return arr;
    const p = arr[0];
    const ts = p?.ts ? new Date(p.ts).getTime() : Date.now();
    return [{ ...p, ts: new Date(ts - 1000).toISOString() }, p];
  };

  const current = slides[active];
  const preparedTrend = useMemo(() => ensureTwoPoints(current?.trend || []), [current?.trend]);
  const latestPoint = hoverPoint || (preparedTrend.length ? preparedTrend[preparedTrend.length - 1] : null);
  const displayYesPct = latestPoint ? latestPoint.yesPct : current?.yesFallbackPct ?? 50;
  const displayNoPct = 100 - displayYesPct;
  const mediaPoster = current?.thumbnail || current?.preview || undefined;
  const bannerHeights = "h-[260px] md:h-[300px] lg:h-[320px]";

  const pickActiveMarket = (stream) => {
    const ms = Array.isArray(stream?.markets) ? stream.markets : [];
    const active = ms.filter((m) => String(m?.status) === "active");
    const future = active.find((m) => m?.ends_at && new Date(m.ends_at) > new Date());
    return future || active[0] || null;
  };
  const remainingMs = (market) => {
    if (!market?.ends_at) return null;
    const end = new Date(market.ends_at).getTime();
    return Math.max(0, end - Date.now());
  };
  const activeMarket = current ? pickActiveMarket(current) : null;
  const msLeft = activeMarket ? remainingMs(activeMarket) : null;
  const ended = typeof msLeft === "number" && msLeft === 0;
  const urgent = typeof msLeft === "number" && msLeft > 0 && msLeft <= 30000;
  const hasScheduled = Array.isArray(current?.markets) && current.markets.some((m) => ["pending", "scheduled"].includes(String(m?.status)));
  const hasEndedOnly = Array.isArray(current?.markets) && !activeMarket && current.markets.some((m) => ["ended", "resolved"].includes(String(m?.status)));
  let badge = { label: "Standby", tone: "standby" };
  if (activeMarket) {
    if (activeMarket.ends_at && typeof msLeft === "number") {
      badge = ended ? { label: "Ended", tone: "ended" } : { label: `${Math.floor(msLeft/60000).toString().padStart(2,'0')}:${Math.floor((msLeft/1000)%60).toString().padStart(2,'0')}`, tone: urgent ? "urgent" : "active" };
    } else {
      badge = { label: "Active", tone: "active" };
    }
  } else if (hasScheduled) {
    badge = { label: "Scheduled", tone: "standby" };
  } else if (hasEndedOnly) {
    badge = { label: "Ended", tone: "ended" };
  }
  const badgeClass = {
    active: "bg-emerald-600 text-white",
    urgent: "bg-amber-600 text-white animate-pulse",
    ended: "bg-gray-700 text-white",
    standby: "bg-gray-800/80 text-white",
  }[badge.tone] || "bg-gray-800/80 text-white";

  const handleOddsClick = (e) => {
    if (!authenticated) {
      e.preventDefault();
      login?.();
    }
  };

  const go = (dir) => setActive((i) => (dir === "prev" ? (i - 1 + slides.length) % slides.length : (i + 1) % slides.length));

  return (
    <div className="w-full animate-fade-in">
      <section className="relative w-full" aria-label="Top streams" onMouseEnter={() => setAutoplay(false)} onMouseLeave={() => setAutoplay(true)}>
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="p-4 md:p-5 lg:p-6">
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight truncate">{loading ? "Loading…" : current?.name || "Hamster"}</h2>
                <p className="text-sm text-gray-600 line-clamp-2">{loading ? "Fetching streams & markets…" : current?.description || "Live prediction room"}</p>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Link to={current ? `/streams/${current.id}` : "/streams"} onClick={handleOddsClick} className={`relative group rounded-xl overflow-hidden border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300 ${bannerHeights} block`}>
                  {current?.videoSrc ? (
                    <video className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={current.videoSrc} poster={mediaPoster} muted playsInline autoPlay loop />
                  ) : mediaPoster ? (
                    <img src={mediaPoster} alt={current?.name || "Stream preview"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                  )}
                  {current?.is_active && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-red-600/95 text-white px-2.5 py-1 text-[11px] font-semibold shadow"><span className="w-2 h-2 rounded-full bg-white animate-pulse" />LIVE</div>
                  )}
                  <div className={["absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm", badgeClass].join(" ")} title={badge.tone === "standby" ? "No active market right now" : badge.tone === "ended" ? "Market ended" : "Time remaining"}>
                    <AlarmClock className="w-4 h-4" />
                    <span>{current ? badge.label : "--:--"}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/30 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:bg-black/40">
                      <Play className="w-7 h-7 text-white opacity-95 drop-shadow fill-white stroke-[1.5]" />
                    </span>
                  </div>
                </Link>
                <div className={`grid ${bannerHeights}`} style={{ gridTemplateRows: "auto 1fr auto" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-600">YES {displayYesPct}%</span>
                    <span className="text-xs font-semibold text-blue-600">NO {displayNoPct}%</span>
                  </div>
                  <div className="relative min-h-0 mt-2">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-gray-50 to-white ring-1 ring-gray-200/70">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={preparedTrend} margin={{ top: 8, right: 12, bottom: 8, left: 8 }} onMouseMove={(s) => { const next = s?.activePayload?.[0]?.payload; if (next && next !== hoverPoint) setHoverPoint(next); }} onMouseLeave={() => setHoverPoint(null)}>
                          <CartesianGrid stroke="#eef2f7" strokeDasharray="4 4" />
                          <XAxis dataKey="ts" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} minTickGap={20} tickFormatter={(v) => { try { const d = new Date(v); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`; } catch { return v; } }} />
                          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={34} />
                          <Tooltip wrapperStyle={{ outline: "none" }} contentStyle={{ borderRadius: 10, border: "1px solid rgba(229,231,235,0.8)", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", boxShadow: "0 8px 30px rgba(0,0,0,0.06)", fontSize: 12, padding: "6px 10px" }} labelStyle={{ color: "#111827", fontWeight: 600 }} formatter={(value, _name, item) => [`${Math.round(value)}%`, item?.dataKey === "yesPct" ? "YES" : "NO"]} labelFormatter={(label) => { try { return new Date(label).toLocaleString(); } catch { return label; } }} />
                          <Line type="linear" dataKey="yesPct" name="YES" stroke="#10B981" strokeWidth={2.25} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
                          <Line type="linear" dataKey="noPct" name="NO" stroke="#2563EB" strokeWidth={2.25} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link to={current ? `/streams/${current.id}` : "/streams"} onClick={handleOddsClick} className={["group relative inline-flex items-center justify-center", "rounded-lg px-3 py-2 text-sm font-bold tracking-wide", "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white", "shadow-md hover:shadow-lg hover:brightness-110 active:brightness-95", "ring-1 ring-emerald-500/40 hover:ring-emerald-400/60", "transition-all duration-150 text-center no-underline", !current ? "pointer-events-none opacity-60" : ""].join(" ")} title="Bet YES">YES</Link>
                    <Link to={current ? `/streams/${current.id}` : "/streams"} onClick={handleOddsClick} className={["group relative inline-flex items-center justify-center", "rounded-lg px-3 py-2 text-sm font-bold tracking-wide", "bg-gradient-to-b from-rose-500 to-rose-600 text-white", "shadow-md hover:shadow-lg hover:brightness-110 active:brightness-95", "ring-1 ring-rose-500/40 hover:ring-rose-400/60", "transition-all duration-150 text-center no-underline", !current ? "pointer-events-none opacity-60" : ""].join(" ")} title="Bet NO">NO</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 md:px-5 lg:px-6 py-3 flex items-center justify-center gap-2">
              <button aria-label="Previous" onClick={() => go("prev")} className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm ring-1 ring-gray-200/80 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400">
                <ChevronLeft className="w-5 h-5 text-gray-900" />
              </button>
              <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} aria-label={`Go to slide ${i + 1}`} onClick={() => { setHoverPoint(null); setActive(i); }} className={["h-2.5 rounded-full ring-1 ring-black/5 transition-all duration-300", i === active ? "w-6 bg-gray-900" : "w-2.5 bg-gray-300/80 hover:bg-gray-400"].join(" ")} />
                ))}
              </div>
              <button aria-label="Next" onClick={() => go("next")} className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm ring-1 ring-gray-200/80 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400">
                <ChevronRight className="w-5 h-5 text-gray-900" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


