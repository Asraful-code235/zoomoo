import StreamGrid from "../StreamGrid";
import HeroSection from "./HeroSection";

export default function Dashboard() {
  return (
    <div className="w-full">
      <div className="px-4 md:px-6 max-w-screen-2xl mx-auto mb-6 md:mb-8 ">
        <HeroSection />
      </div>
      <StreamGrid />
    </div>
  );
}


