import { useEffect, useMemo, useState } from "react";

export function useWelcome() {
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [now, setNow] = useState(Date.now());

  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api",
    []
  );

  const clampPct = (n) => {
    const v = Number(n);
    if (Number.isNaN(v)) return 50;
    return Math.max(0, Math.min(100, Math.round(v)));
  };

  const buildFallbackTrend = () =>
    Array.from({ length: 24 }).map((_, i) => ({
      ts: new Date(Date.now() - (23 - i) * 5 * 60_000).toISOString(),
      yesPct: 50,
      noPct: 50,
    }));

  const computeYesFromVolumes = (m) => {
    const y = Number(m?.yes_volume || 0);
    const n = Number(m?.no_volume || 0);
    const t = y + n;
    return t > 0 ? Math.round((y / t) * 100) : 50;
  };

  const getVideoSrc = (s) =>
    s?.hls_url || s?.hls || s?.video_url || s?.playback_url || s?.stream_url || s?.src || null;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/streams?include=markets`);
        const payload = await res.json();
        const list = payload?.streams || payload?.data || (Array.isArray(payload) ? payload : []);

        if (!Array.isArray(list) || list.length === 0) {
          if (mounted) {
            setSlides(
              Array.from({ length: 3 }).map((_, i) => ({
                id: `demo-${i + 1}`,
                name: `Hamster ${i + 1}`,
                description: "Live prediction room",
                trend: buildFallbackTrend(),
                yesFallbackPct: 50,
                thumbnail: null,
                preview: null,
                is_active: false,
                markets: [],
                videoSrc: null,
              }))
            );
            setActive(0);
          }
          return;
        }

        const ranked = [...list]
          .sort((a, b) => {
            const sum = (s) =>
              (s.markets || []).reduce((acc, m) => {
                const yes = Number(m?.yes_volume || 0);
                const no = Number(m?.no_volume || 0);
                const tot = Number(m?.total_volume || 0);
                return acc + (tot || yes + no);
              }, 0);
            return sum(b) - sum(a);
          })
          .slice(0, 5);

        const enriched = await Promise.all(
          ranked.map(async (s) => {
            let markets = Array.isArray(s?.markets) ? s.markets : [];
            if (markets.length === 0) {
              try {
                const mres = await fetch(`${apiBase}/markets/stream/${s.id}`);
                if (mres.ok) {
                  const mjson = await mres.json();
                  markets = Array.isArray(mjson?.markets) ? mjson.markets : [];
                }
              } catch {}
            }

            const activeMs = (() => {
              const ms = Array.isArray(markets) ? markets : [];
              const active = ms.filter((m) => String(m?.status) === "active");
              const future = active.find((m) => m?.ends_at && new Date(m.ends_at) > new Date());
              return future || active[0] || null;
            })();

            let yesPctLatest = 50;
            let trend = buildFallbackTrend();

            try {
              const tRes = await fetch(`${apiBase}/markets/streams/${s.id}/trend?sinceMin=180`);
              if (tRes.ok) {
                const tData = await tRes.json();
                const raw = Array.isArray(tData?.points) ? tData.points : Array.isArray(tData) ? tData : [];
                const series = raw.map((p) => ({
                  ts: p.ts || p.timestamp || p.date || new Date().toISOString(),
                  yesPct: clampPct(p.yesPct ?? p.yes_percent ?? p.yes),
                  noPct: clampPct(p.noPct ?? p.no_percent ?? p.no ?? (100 - (p.yesPct ?? 50))),
                }));
                if (series.length) {
                  trend = series;
                  yesPctLatest = series.at(-1).yesPct;
                } else if (activeMs) {
                  yesPctLatest = computeYesFromVolumes(activeMs);
                }
              } else if (activeMs) {
                yesPctLatest = computeYesFromVolumes(activeMs);
              }
            } catch {
              if (activeMs) yesPctLatest = computeYesFromVolumes(activeMs);
            }

            if (!trend?.length) {
              const y = activeMs ? computeYesFromVolumes(activeMs) : 50;
              trend = Array.from({ length: 12 }).map((_, i) => ({
                ts: new Date(Date.now() - (11 - i) * 5 * 60_000).toISOString(),
                yesPct: y,
                noPct: 100 - y,
              }));
              yesPctLatest = y;
            }

            return {
              id: s.id,
              name: s?.hamster_name || s?.name || "Hamster",
              description: s?.description || "Live prediction room",
              trend,
              yesFallbackPct: yesPctLatest,
              thumbnail: s?.thumbnail || null,
              preview: s?.preview || null,
              is_active: !!s?.is_active,
              markets,
              videoSrc: getVideoSrc(s),
            };
          })
        );

        if (mounted) {
          setSlides(enriched);
          setActive(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  return {
    slides,
    active,
    setActive,
    loading,
    autoplay,
    setAutoplay,
    hoverPoint,
    setHoverPoint,
    now,
  };
}


