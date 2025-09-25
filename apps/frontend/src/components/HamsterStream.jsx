import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

export default function HamsterStream({ stream }) {
  const [isLive, setIsLive] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  if (!stream) {
    return (
      <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
        <div className="px-6 py-10 text-center">
          <div className="mb-2 text-5xl">🐹</div>
          <h3 className="mb-1 font-semibold text-gray-900">
            Stream unavailable
          </h3>
          <p className="text-sm text-gray-600">
            This room&apos;s camera is offline right now.
          </p>
        </div>
      </div>
    );
  }

  const hasPlayback = Boolean(stream.mux_playback_id);

  const enterBufferingState = () => {
    setIsBuffering(true);
    setIsLive(false);
  };

  const exitBufferingState = (live = false) => {
    setIsBuffering(false);
    if (live) setIsLive(true);
  };

  return (
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
        <div className="pointer-events-auto flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow ${
              isLive ? "bg-red-600/95" : "bg-gray-800/80"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isLive ? "bg-white animate-pulse" : "bg-white/70"
              }`}
            />
            {isLive ? "LIVE" : "OFFLINE"}
          </span>
          {isLive && (
            <span className="inline-flex items-center rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-800">
              Low latency
            </span>
          )}
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden rounded-lg bg-black">
        {hasPlayback ? (
          <>
            <MuxPlayer
              streamType="live"
              playbackId={stream.mux_playback_id}
              metadata={{
                video_id: stream.id,
                video_title: `${stream.hamster_name} Live Stream`,
                viewer_user_id: "anonymous",
              }}
              onLoadStart={enterBufferingState}
              onCanPlay={() => exitBufferingState(true)}
              onPlaying={() => exitBufferingState(true)}
              onWaiting={enterBufferingState}
              onError={() => exitBufferingState(false)}
              autoPlay
              muted
              controls
              className="h-full w-full"
            />

            {isBuffering && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                <p className="text-sm font-medium">Loading stream…</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gray-950 text-white">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <p className="text-sm font-semibold">Stream feed unavailable</p>
            <p className="mt-1 text-xs text-white/60">
              We&apos;ll switch to the live camera as soon as it comes back
              online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
