import { cloneElement, isValidElement, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Sidebar({ logo }) {
  const { authenticated, login, logout } = usePrivy();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown]);

  const navItems = [
    { to: "/market", label: "Live", icon: "/live.svg" },
    { to: "/streams", label: "Feed", icon: "/feed.svg" },
    { to: "/leaderboard", label: "Leaderboard", icon: "/leaderboard.svg" },
    { to: "/dashboard", label: "Dashboard", icon: "/dashboard.svg" },
  ];

  const footerItems = [
    { to: "/buy-coins", label: "Buy coins", icon: "/buy_coin.svg" },
    { to: "/community", label: "Community", icon: "/community.svg" },
  ];

  const renderIcon = (icon) => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      return (
        <img
          src={icon}
          alt=""
          aria-hidden
          className="w-6 h-6 object-contain dark:invert"
        />
      );
    }

    if (isValidElement(icon)) {
      return cloneElement(icon, {
        className: `w-6 h-6 ${icon.props.className ?? ''}`.trim(),
        'aria-hidden': true,
      });
    }

    const IconComponent = icon;
    return <IconComponent className="w-6 h-6" aria-hidden />;
  };

  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 w-28 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col shadow-sm transition-colors duration-200">
      {/* Logo */}
      <div className="px-2 py-4 text-center">
        <Link to="/" className="block">
          <img src={logo} alt="Furcast" className="h-14 w-auto mx-auto" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4">
        {navItems.map(({ to, label, icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-xs font-medium text-center transition-colors ${
                isActive
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {renderIcon(icon)}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="px-3 py-4 space-y-4">
        {footerItems.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            {renderIcon(icon)}
            {label}
          </Link>
        ))}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
          Theme
        </button>

        {/* Profile / Auth Controls */}
        {authenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-700 text-xs text-white">
                🐹
              </div>
              Profile
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-700 text-xs text-white">
                    🐹
                  </div>
                  View Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    logout?.();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => login?.()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Log In
          </button>
        )}
      </div>
    </aside>
  );
}
