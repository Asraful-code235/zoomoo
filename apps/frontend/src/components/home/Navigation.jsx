import { useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { LayoutDashboard, Trophy, FileText, User, Crown, Wallet, LogOut, Menu } from "lucide-react";
import MobileSidebar from "../MobileSidebar";

export default function Navigation({ logo }) {
  const { authenticated, user, login, logout } = usePrivy();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userEmail =
    user?.email?.address ||
    user?.google?.email ||
    user?.linkedAccounts?.find((acc) => acc.type === "google_oauth")?.email;

  const isAdmin =
    userEmail === "admin@zoomies.com" ||
    userEmail === "omathehero@gmail.com" ||
    userEmail === "test-7860@privy.io" ||
    (typeof userEmail === "string" && userEmail.includes("admin"));

  const links = useMemo(() => {
    const base = [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/thesis", label: "Thesis", icon: FileText },
      { to: "/profile", label: "Profile", icon: User },
    ];
    if (isAdmin) base.push({ to: "/admin", label: "Admin", icon: Crown });
    return base;
  }, [isAdmin]);

  const handleNavClick = (e, to) => {
    if (!authenticated) {
      e.preventDefault();
      login?.();
    }
  };

  return (
    <>
      <aside className="hidden md:flex lg:hidden md:fixed md:inset-y-0 md:left-0 md:z-40 w-24 shrink-0 bg-white border-r-2 border-[rgb(241,244,247)]">
        <div className="flex h-full w-full flex-col">
          <div className="px-2 text-center">
            <Link to="/" onClick={(e) => handleNavClick(e, "/")} className="block">
              <img src={logo} alt="Furcast" className="mx-auto w-[96px] md:w-[104px] lg:w-[112px] h-auto" />
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1.5">
            {links.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={(e) => handleNavClick(e, to)}
                  className="group flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 transition-all no-underline text-center"
                >
                  <span
                    className={[
                      "flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                      isActive ? "bg-[rgb(230,230,230)]" : "bg-transparent group-hover:bg-[rgb(230,230,230)]",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "w-6 h-6 transition-colors",
                        isActive
                          ? "text-[rgb(15,15,15)]"
                          : "text-[rgb(163,163,163)] group-hover:text-[rgb(15,15,15)]",
                      ].join(" ")}
                    />
                  </span>
                  <span
                    className={[
                      "block max-w-full truncate text-[12px] font-semibold leading-tight transition-colors",
                      isActive ? "text-[rgb(15,15,15)]" : "text-[rgb(163,163,163)] group-hover:text-[rgb(15,15,15)]",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-auto px-2 pb-5 pt-3 bg-white">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={(e) => handleNavClick(e, "/buy")}
                className="flex flex-col items-center gap-1 text-[rgb(15,15,15)] hover:opacity-90"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-[rgb(230,230,230)] transition-colors">
                  <Wallet className="w-6 h-6" />
                </span>
                <span className="text-[12px] font-semibold">Buy coins</span>
              </button>

              {!authenticated ? (
                <button type="button" onClick={() => login?.()} className="flex flex-col items-center gap-1">
                  <span className="flex items-center justify-center w-10 h-10 rounded-md bg-black text-white">
                    <User className="w-6 h-6" />
                  </span>
                  <span className="text-[12px] font-semibold text-[rgb(15,15,15)]">Log In</span>
                </button>
              ) : (
                <button type="button" onClick={() => logout?.()} className="flex flex-col items-center gap-1">
                  <span className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-[rgb(230,230,230)] border-2 border-[rgb(241,244,247)]">
                    <LogOut className="w-6 h-6 text-[rgb(15,15,15)]" />
                  </span>
                  <span className="text-[12px] font-semibold text-[rgb(15,15,15)]">Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white border-b-2 border-[rgb(241,244,247)]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" onClick={(e) => handleNavClick(e, "/")} className="no-underline">
            <img src={logo} alt="Furcast" className="h-12 w-auto sm:h-14" />
          </Link>

          {!authenticated ? (
            <button onClick={() => login?.()} className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg">
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold">Log In</span>
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 text-[rgb(15,15,15)] px-3 py-2 rounded-lg border border-[rgb(241,244,247)] hover:bg-[rgb(230,230,230)]"
            >
              <Menu className="w-5 h-5" />
              <span className="text-sm font-semibold">Menu</span>
            </button>
          )}
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t-2 border-[rgb(241,244,247)]">
        <div className="grid grid-cols-4">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={(e) => handleNavClick(e, to)}
                className="flex flex-col items-center justify-center py-2.5 no-underline group"
              >
                <span
                  className={[
                    "flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                    isActive ? "bg-[rgb(230,230,230)]" : "bg-transparent group-hover:bg-[rgb(230,230,230)]",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "w-6 h-6 transition-colors",
                      isActive
                        ? "text-[rgb(15,15,15)]"
                        : "text-[rgb(163,163,163)] group-hover:text-[rgb(15,15,15)]",
                    ].join(" ")}
                  />
                </span>
                <span
                  className={[
                    "text-[12px] font-semibold mt-0.5 transition-colors",
                    isActive ? "text-[rgb(15,15,15)]" : "text-[rgb(163,163,163)]",
                  ].join(" ")}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}

