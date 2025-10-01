import StreamGrid from "../StreamGrid";
import HeroSection from "./HeroSection";
import MobileTopLive from "./MobileTopLive";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Carousel - visible on desktop only */}
      <div className="px-4 md:px-6 max-w-screen-2xl mx-auto mb-4 md:mb-8">
        <HeroSection />
      </div>
      {/* Markets */}
      <StreamGrid header="Trending markets" />
    </div>
  );
}
