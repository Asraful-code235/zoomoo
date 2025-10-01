import { Link } from "react-router-dom";
import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  X,
  Copy,
  LayoutDashboard,
  FileText,
  Wallet,
  Users,
  LogOut,
  User,
} from "lucide-react";

export default function MobileSidebar({ isOpen, onClose }) {
  const { authenticated, user, logout } = usePrivy();

  const walletAddress = useMemo(() => {
    return (
      user?.wallet?.address ||
      user?.linkedAccounts?.find((acc) => acc.type === "wallet")?.address ||
      null
    );
  }, [user?.wallet?.address, user?.linkedAccounts]);

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const displayName = truncatedAddress
    ? truncatedAddress
    : user?.email?.address || user?.google?.email || "Connected";

  const profileImage =
    user?.farcaster?.pfp ||
    user?.twitter?.profilePictureUrl ||
    user?.telegram?.profilePictureUrl ||
    user?.profilePictureUrl ||
    null;

  const navigationItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/thesis", label: "Thesis", icon: FileText },
    { to: "/buy-coins", label: "Buy coins", icon: Wallet },
  ];

  const secondaryItems = [
    { to: "/community", label: "Join our community", icon: Users },
  ];

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress).catch(() => {});
  };

  const handleNav = () => {
    onClose?.();
  };

  const handleLogout = () => {
    logout?.();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full dark-card-bg transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-5">
            {authenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-700 text-white">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</span>
                {truncatedAddress && (
                  <button
                    onClick={handleCopy}
                    className="rounded-full p-2 text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Menu</span>
            )}

            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <nav className="space-y-6 text-gray-900 dark:text-white">
              <div className="space-y-4">
                {navigationItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={handleNav}
                    className="flex items-center gap-3 text-sm font-medium transition hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
              </div>

              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                {secondaryItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={handleNav}
                    className="flex items-center gap-3 text-sm font-medium transition hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}

                {authenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-sm font-semibold text-red-500 dark:text-red-400 transition hover:text-red-600 dark:hover:text-red-300"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
