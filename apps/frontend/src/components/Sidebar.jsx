import { cloneElement, isValidElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

export default function Sidebar({ logo }) {
  const { authenticated, login, logout } = usePrivy();
  const location = useLocation();

  const navItems = [
    { to: "/market", label: "Live", icon: "/live.svg" },
    { to: "/streams", label: "Feed", icon: "/feed.svg" },
    { to: "/leaderboard", label: "Leaderboard", icon: "/leaderboard.svg" },
    { to: "/", label: "Dashboard", icon: "/dashboard.svg" },
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
          className="w-6 h-6 object-contain"
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
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 w-28 shrink-0 bg-white border-r border-gray-200 flex-col shadow-sm">
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
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            {renderIcon(icon)}
            {label}
          </Link>
        ))}

        {/* Profile / Auth Controls */}
        {authenticated ? (
          <>
            <Link
              to="/profile"
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                🐹
              </div>
              Profile
            </Link>
            <button
              type="button"
              onClick={() => logout?.()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => login?.()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg p-3 text-center text-xs font-semibold text-gray-900 bg-gray-50 transition-colors hover:bg-gray-100"
          >
            Log In
          </button>
        )}
      </div>
    </aside>
  );
}
