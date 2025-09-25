import HamsterStream from "../HamsterStream";

export default function StreamPlayerCard({ stream }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="relative overflow-hidden rounded-xl bg-gray-900">
        <HamsterStream stream={stream} />
      </div>
    </div>
  );
}
