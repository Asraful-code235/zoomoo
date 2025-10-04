export function LoadingState() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="mb-8">
          <div className="text-6xl animate-bounce-slow mb-4">🐹</div>
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-gray-700 dark:border-t-gray-300 rounded-full animate-spin mx-auto mb-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Loading hamster streams...
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400">Setting up the cameras...</p>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4 animate-float">🚧</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          No streams available
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Our hamsters are taking a break! Check back soon.
        </p>
      </div>
    </div>
  );
}

