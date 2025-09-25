import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { 
  X, 
  Copy, 
  Check,
  LayoutDashboard, 
  FileText, 
  Wallet, 
  Users,
  LogOut,
  User
} from 'lucide-react';

export default function MobileSidebar({ isOpen, onClose, customImages = {} }) {
  const { authenticated, user, logout } = usePrivy();
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Get wallet address
  const walletAddress = user?.wallet?.address || 
    user?.linkedAccounts?.find(acc => acc.type === 'wallet')?.address ||
    'No wallet connected';

  const formatAddress = (address) => {
    if (!address || address === 'No wallet connected') return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const copyAddress = async () => {
    if (walletAddress && walletAddress !== 'No wallet connected') {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const navigationItems = [
    { 
      to: "/", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      customIcon: customImages.dashboard
    },
    { 
      to: "/thesis", 
      label: "Thesis", 
      icon: FileText,
      customIcon: customImages.thesis
    },
    { 
      to: "/buy-coins", 
      label: "Buy Coins", 
      icon: Wallet,
      customIcon: customImages.buyCoins
    },
    { 
      to: "/community", 
      label: "Join Our Community", 
      icon: Users,
      customIcon: customImages.community
    },
  ];

  const handleNavClick = (to) => {
    onClose();
  };

  const handleLogout = () => {
    logout?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* User Profile Section */}
          {authenticated && user && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg">
                  {customImages.profile ? (
                    <img 
                      src={customImages.profile} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.email?.address || user.google?.email || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Connected
                  </div>
                </div>
              </div>
              
              {/* Wallet Address */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
                    <div className="text-sm font-mono text-gray-900">
                      {formatAddress(walletAddress)}
                    </div>
                  </div>
                  {walletAddress !== 'No wallet connected' && (
                    <button
                      onClick={copyAddress}
                      className="p-2 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      {copiedAddress ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map(({ to, label, icon: Icon, customIcon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => handleNavClick(to)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {customIcon ? (
                  <img 
                    src={customIcon} 
                    alt={label} 
                    className="w-5 h-5"
                  />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          {authenticated && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
