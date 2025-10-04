import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

export default function SortControls({ sortKey, setSortKey }) {
  const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "volume", label: "Volume" },
    { value: "time_left", label: "Ending Soon" },
    { value: "newest", label: "Newest" },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-600 focus:border-transparent"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ArrowUpDown className="h-4 w-4" aria-hidden />
        <span className='max-md:hidden'>Sort</span>
        <ChevronDown className="h-4 w-4 max-md:hidden" aria-hidden />
      </button>

      <div
        className={`absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg transition-opacity z-10 ${
          isOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <ul role="listbox" className="py-1 text-sm text-gray-700 dark:text-gray-300">
          {sortOptions.map((option) => {
            const isSelected = sortKey === option.value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSortKey(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isSelected ? 'font-semibold text-gray-900 dark:text-white' : ''
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
