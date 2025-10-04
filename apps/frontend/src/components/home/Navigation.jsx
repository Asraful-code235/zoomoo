import { useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Home, LineChart, Trophy, User, TrendingUp, Moon, Sun } from "lucide-react";
import MobileSidebar from "../MobileSidebar";
import MarqueeTicker from "./MarqueeTicker";
import { useTheme } from "../../hooks/useTheme";

export default function Navigation({ logo }) {
  const { authenticated, user, login } = usePrivy();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userEmail =
    user?.email?.address ||
    user?.google?.email ||
    user?.linkedAccounts?.find((acc) => acc.type === "google_oauth")?.email;

  const bottomNavLinks = useMemo(
    () => [
      { to: "/", label: "Home", icon: Home },
      { to: "/market", label: "Market", icon: LineChart },
      { to: "/feed", label: "Feed", icon: TrendingUp },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
    []
  );

  const handleNavClick = (event, to) => {
    const protectedPaths = new Set(["/buy-coins", "/profile", "/admin"]);
    if (!authenticated && protectedPaths.has(to)) {
      event.preventDefault();
      login?.();
    }
  };

  const profileAvatar = user?.farcaster?.pfp || user?.twitter?.profilePictureUrl;
  const profileLabel = user?.farcaster?.username || user?.twitter?.username || userEmail || "Profile";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm block md:hidden transition-colors duration-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" onClick={(event) => handleNavClick(event, "/")}
            className="flex items-center gap-3 no-underline">
            <img src={logo} alt="Furcast" className="h-10 w-auto" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {authenticated ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-left shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-700 text-sm font-semibold text-white">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt={profileLabel} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    profileLabel?.slice(0, 1)?.toUpperCase() || <User className="h-4 w-4" />
                  )}
                </span>

              </button>
            ) : (
              <button
                onClick={() => login?.()}
                className="rounded-full bg-gray-900 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                Log In
              </button>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 transition-colors duration-200">
          <MarqueeTicker />
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="grid grid-cols-4">
          {bottomNavLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={(event) => handleNavClick(event, to)}
                className="flex flex-col items-center justify-center gap-1 py-2 no-underline"
              >
                {Icon && (
                  <Icon className={`h-5 w-5 ${isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`} />
                )}
                <span className={`text-xs font-semibold ${isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
