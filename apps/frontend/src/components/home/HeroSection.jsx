export default function HeroSection() {
  return (
    <div className="w-full font-sans">
      <div
        className="rounded-3xl border border-orange-200/60 p-4 md:p-15 min-h-[40vh] md:min-h-[350px] sm:min-h-[320px] flex items-center justify-center relative overflow-hidden transition-all duration-700 ease-out hover:shadow-xl bg-cover"
        style={{
          backgroundImage: "url('/banner.jpg')",
          backgroundPosition: "center 70%",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 text-center max-w-2xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-4xl sm:text-3xl max-sm:text-2xl font-extrabold bg-gradient-to-r from-orange-800 via-orange-700 to-yellow-600 bg-clip-text text-transparent mb-6 leading-tight tracking-tight">
            Predict Your Hamster&apos;s Next Move
          </h1>

          <button className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-yellow-600 hover:to-orange-500 text-white border-none py-3 sm:py-4 px-9 text-sm sm:text-lg font-medium rounded-2xl cursor-pointer transition-all duration-300 ease-out shadow-lg shadow-orange-600/20 hover:shadow-xl hover:shadow-orange-600/30 hover:-translate-y-0.5 active:translate-y-0 active:transition-all active:duration-100 relative overflow-hidden group w-full max-w-xs sm:max-w-[280px]">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></span>
            Start Predicting
          </button>
        </div>
      </div>
    </div>
  );
}
