import HamsterStream from "../HamsterStream";

export default function StreamPlayerCard({ stream }) {
  return (
      <div className="relative overflow-hidden ">
        <div className="relative w-full pt-[56.25%]">
          <HamsterStream stream={stream} />
        </div>
      </div>
  );
}
