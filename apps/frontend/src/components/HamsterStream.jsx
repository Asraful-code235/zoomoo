// HamsterStream.jsx
import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

export default function HamsterStream({ stream }) {
  const [isLive, setIsLive] = useState(false);

  if (!stream) {
    return (
      <div className="w-full h-full rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
        <div className="text-center px-4 py-10">
          <div className="text-5xl mb-2">🐹</div>
          <h3 className="text-gray-900 font-semibold mb-1">Stream Unavailable</h3>
          <p className="text-sm text-gray-600">This stream is currently offline.</p>
        </div>
      </div>
    );
  }

  const viewers = Number(stream.viewer_count || 0);

  return (
    <div className="relative h-full">
      {/* Top overlay: status + viewers */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/95 text-white px-2.5 py-1 text-[11px] font-semibold shadow">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800/80 text-white px-2.5 py-1 text-[11px] font-semibold">
              OFFLINE
            </span>
          )}
          {isLive && (
            <span className="inline-flex items-center rounded-full bg-white/90 text-gray-800 px-2.5 py-1 text-[11px] font-medium border border-gray-200">
              Low latency
            </span>
          )}
        </div>
        <div className="pointer-events-auto">
          <span className="inline-flex items-center rounded-full bg-white/90 text-gray-900 px-2.5 py-1 text-[11px] font-medium border border-gray-200">
            {new Intl.NumberFormat("en-US").format(viewers)} watching
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="absolute inset-0 rounded-lg overflow-hidden bg-black/90">
        {stream.mux_playback_id ? (
          <MuxPlayer
            streamType="live"
            playbackId={stream.mux_playback_id}
            metadata={{
              video_id: stream.id,
              video_title: `${stream.hamster_name} Live Stream`,
              viewer_user_id: "anonymous",
            }}
            onLoadStart={() => setIsLive(false)}
            onCanPlay={() => setIsLive(true)}
            onError={() => setIsLive(false)}
            autoPlay
            muted={false}
            controls
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white/90">
              <div className="text-6xl mb-2">🐹</div>
              <p className="text-sm">Setting up {stream.hamster_name}&apos;s camera…</p>
            </div>
          </div>
        )}
      </div>
      {/* Note: Active Predictions panel removed */}
    </div>
  );
}
