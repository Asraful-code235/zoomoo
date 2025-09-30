import { useState, useEffect, useCallback } from "react";

const carouselImages = [
  {
    url: "/banner/carosule_1.png",
    alt: "Hamster prediction banner 1",
  },
  {
    url: "/banner/carousel_2.png",
    alt: "Hamster prediction banner 2",
  },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  return (
    <div className="w-full font-sans">
      {/* Carousel Container with aspect ratio 1320:390.57 */}
      <div
        className="relative w-full mx-auto rounded overflow-hidden max-md:min-h-[242px] "
        style={{ aspectRatio: "1320/390.57" }}
      >
        {/* Carousel Images */}
        <div className="relative w-full h-full">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              style={{
                backgroundImage: `url(${image.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#d3d3d3",
              }}
            >
              {/* Overlay for better text/button visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          ))}

          {/* Title - Centered */}
          {/* <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-center leading-tight tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              Predict Your Hamster&apos;s Next Move
            </h1>
          </div> */}

          {/* Start Predicting Button - Bottom Right */}
          <div className="absolute max-md:hidden bottom-6 right-6 md:bottom-8 md:right-8 z-30">
            <button
              className="flex items-center justify-center flex-shrink-0 w-[314.286px] h-[64.892px] rounded-[16px] bg-gradient-to-r from-[#F54900] to-[#D08700] shadow-[0_10px_15px_-3px_rgba(245,74,0,0.20),0_4px_6px_-4px_rgba(245,74,0,0.20)] hover:scale-105 active:scale-95 transition-all duration-300 ease-out text-white font-bold text-sm md:text-base"
              style={{
                padding: "19.82px 90.463px 21.432px 90.48px",
              }}
              onClick={() => {
                // Add your navigation logic here
                console.log("Start Predicting clicked");
              }}
            >
              Start Predicting
            </button>
          </div>

          <div className=" absolute bottom-1 left-0 right-0 justify-center gap-2 -mt-4 z-20 flex md:hidden">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? "w-6 h-2.5 bg-black"
                    : "w-2.5 h-2.5 bg-gray-400 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide ? "true" : "false"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Carousel Navigation Dots - Below Banner on Desktop */}
      <div className=" justify-center gap-2 -mt-4 md:mt-5 hidden md:flex">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? "w-8 h-2 bg-black"
                : "w-2 h-2 bg-gray-400 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  );
}
