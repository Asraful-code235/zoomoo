// components/Preloader.jsx
import React from "react";

// Optional: pass your logo path in <Preloader logoSrc={logo} />
export default function Preloader({
  show = true,
  logoSrc,                // string | undefined
  tagline = "Warming up the wheels…",
}) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Centerpiece */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6">
        {/* Hamster Wheel */}
        <div className="relative mb-8">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-gray-300/70 border-t-gray-900/80 animate-[wheelspin_3.2s_linear_infinite] will-change-transform">
            {/* spokes (using conic gradient) */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                WebkitMaskImage:
                  "radial-gradient(circle at center, transparent 42%, black 42%)",
                maskImage:
                  "radial-gradient(circle at center, transparent 42%, black 42%)",
                background:
                  "conic-gradient(from 0deg, rgba(17,24,39,0.15) 0 6deg, transparent 6deg 30deg)",
                backgroundSize: "calc(100% + 0px)",
              }}
            />
            {/* axle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-900/90 shadow-inner" />
            </div>
          </div>

          {/* Hamster running inside the wheel */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 translate-y-1">
              <div className="absolute inset-0 flex items-center justify-center animate-[hamsterrun_0.85s_ease-in-out_infinite] will-change-transform">
                <span className="text-4xl sm:text-5xl">🐹</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wordmark / Logo */}
        {logoSrc ? (
          <div className="relative mb-3">
            <img
              src={logoSrc}
              alt="Furcast"
              className="h-10 sm:h-12 object-contain drop-shadow-sm"
            />
            {/* shimmer mask overlay */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60 [@media_(prefers-reduced-motion:_reduce)]:hidden">
              <div className="w-24 h-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-[shimmer_1.8s_linear_infinite]" />
            </div>
          </div>
        ) : (
          <div className="relative mb-3">
            <div className="text-3xl sm:text-4xl font-black tracking-[0.2em] text-gray-900">
              FURCAST
            </div>
            <div className="absolute inset-0 overflow-hidden [@media_(prefers-reduced-motion:_reduce)]:hidden">
              <div className="h-full w-24 bg-gradient-to-r from-transparent via-gray-900/20 to-transparent animate-[shimmer_1.8s_linear_infinite]" />
            </div>
          </div>
        )}

        {/* Tagline */}
        <div className="text-[13px] sm:text-sm text-gray-500 font-medium flex items-center gap-2">
          <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_1.6s_ease-in-out_infinite]" />
          {tagline}
        </div>

        {/* Progress bar */}
        <div className="mt-5 w-[220px] sm:w-[260px] h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full rounded-full bg-gray-900 animate-[indeterminate_1.6s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Styles (keyframes) */}
      <style>{`
        @keyframes wheelspin {
          to { transform: rotate(360deg); }
        }
        @keyframes hamsterrun {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.02); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes indeterminate {
          0% { transform: translateX(-100%); width: 40%; }
          50% { transform: translateX(10%); width: 60%; }
          100% { transform: translateX(120%); width: 40%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-[wheelspin_3.2s_linear_infinite],
          .animate-[hamsterrun_0.85s_ease-in-out_infinite],
          .animate-[shimmer_1.8s_linear_infinite],
          .animate-[indeterminate_1.6s_ease-in-out_infinite],
          .animate-[pulse_1.6s_ease-in-out_infinite] {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
