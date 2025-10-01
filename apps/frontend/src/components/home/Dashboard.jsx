import { useState } from "react";
import StreamPositionsSection from "../streams/StreamPositionsSection";

const USER_PROFILE = {
  name: "Gowther",
  handle: "Joined Sep 2025 • 0 views",
};

const PROFILE_INITIALS = USER_PROFILE.name
  .split(" ")
  .map((chunk) => chunk.charAt(0))
  .slice(0, 2)
  .join("")
  .toUpperCase();

const METRIC_CARDS = [
  { label: "Balance", value: "—" },
  { label: "Realized PnL", value: "$1,258,450.23", tone: "positive" },
  { label: "Predictions", value: "—" },
  { label: "Positions Value", value: "—" },
];

const WALLET_DETAILS = {
  address: "GZzVnAw...KFj1Ze4j",
  note: "Only deposit USDC on Solana",
};

export default function Dashboard() {
  const [copied, setCopied] = useState(false);

  console.log("copied",copied)

  const handleCopy = async () => {
    if (
      typeof navigator === "undefined" ||
      !("clipboard" in navigator) ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(WALLET_DETAILS.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error(error)

      setCopied(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0D0F11] pb-12 pt-6">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {/* Mobile-First Layout */}
        <div className="space-y-6">
          {/* User Profile Section */}
          <section className="rounded-[4px] md:border border-gray-200 dark:border-gray-700 dark-card-bg p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Profile Image */}
                <div className="flex h-16 w-16 items-center justify-center rounded-[12px] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                    {PROFILE_INITIALS}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {USER_PROFILE.name}
                    </h2>
                    <button
                      type="button"
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11.333 2L14 4.667l-9.333 9.333H2v-2.667L11.333 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {WALLET_DETAILS.address}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="4" width="8" height="8" rx="1" />
                        <path d="M2 10V3a1 1 0 0 1 1-1h7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="rounded-[4px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Export
              </button>
            </div>

            {/* Stats Cards Section */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {METRIC_CARDS.map((card) => (
                <div
                  key={card.label}
                  className="flex flex-col rounded-[4px] border border-gray-200 dark:border-gray-700 dark-card-bg px-3 py-3 md:px-4 md:py-4"
                >
                  <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    {card.label}
                  </p>
                  <p
                    className={`text-sm md:text-lg font-bold ${
                      card.tone === "positive"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Positions/Orders Section with Tabs */}
          <section className="rounded-[4px] md:border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <StreamPositionsSection />
          </section>
        </div>
      </div>
    </div>
  );
}
