import StreamGrid from "../StreamGrid";
import HeroSection from "./HeroSection";
import MobileTopLive from "./MobileTopLive";

export default function Dashboard() {
  return (
    <div className="w-full">
      {/* Hero hidden on mobile (<md) */}
      <div className="px-4 md:px-6 max-w-screen-2xl mx-auto mb-4 md:mb-8">
        <div className="hidden md:block">
          <HeroSection />
        </div>
      </div>

      {/* Live stream at the very top on mobile */}
      <div className="block md:hidden mb-8 px-4">
        <MobileTopLive />
      </div>

      {/* Markets */}
      <StreamGrid />
    </div>
  );
}


