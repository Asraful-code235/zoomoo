import { useEffect, useMemo, useState } from "react";
import StreamPlayerCard from "../streams/StreamPlayerCard";

// Mobile-only top live stream player
export default function MobileTopLive() {
  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api",
    []
  );
  const [topStream, setTopStream] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/streams?include=markets`);
        const payload = await res.json();
        const list = payload?.streams || payload?.data || (Array.isArray(payload) ? payload : []);
        const streams = Array.isArray(list) ? list : [];

        // pick a stream that has an active market and likely playback
        const pickActiveMarket = (s) => {
          const ms = Array.isArray(s?.markets) ? s.markets : [];
          const active = ms.filter((m) => String(m?.status) === "active");
          const future = active.find((m) => m?.ends_at && new Date(m.ends_at) > new Date());
          return future || active[0] || null;
        };
        const volumeOf = (s) => {
          const m = pickActiveMarket(s);
          const yes = Number(m?.yes_volume || 0);
          const no = Number(m?.no_volume || 0);
          const tot = Number(m?.total_volume || 0);
          return tot || yes + no;
        };
        const sorted = streams
          .filter((s) => s?.mux_playback_id || s?.playback_id || s?.is_active)
          .sort((a, b) => volumeOf(b) - volumeOf(a));
        if (mounted) setTopStream(sorted[0] || streams[0] || null);
      } catch {
        if (mounted) setTopStream(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  if (!topStream) return null;

  return (
    <div className="block md:hidden">
      <div className="w-full bg-white">
        <div className="px-0">
          <StreamPlayerCard stream={topStream} />
        </div>
      </div>
    </div>
  );
}

