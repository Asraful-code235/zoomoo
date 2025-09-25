import { useState, useEffect, useCallback } from 'react';
import WalletInfo from './WalletInfo';
import PerformanceChart from './PerformanceChart';
import TransactionHistory from './TransactionHistory';
import { usePositionUpdates } from '../hooks/useWebSocket';

export default function ProfileWallet({ user }) {
  const [activePositions, setActivePositions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Real-time position updates
  const handlePositionUpdate = useCallback((update) => {
    console.log('Position update received:', update);
    setLastUpdate(new Date());
    
    // Refresh wallet data when positions update
    if (user?.id) {
      fetchWalletData();
    }
  }, [user?.id]);

  const { connectionStatus, isConnected } = usePositionUpdates(user?.id, handlePositionUpdate);

  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
    }
  }, [user?.id]);

  // Listen for market resolution events to refresh positions
  useEffect(() => {
    const handleMarketResolved = (event) => {
      console.log('🔄 Market resolved event received in ProfileWallet, refreshing data');
      if (user?.id) {
        fetchWalletData();
      }
    };

    const handleMarketCancelled = (event) => {
      console.log('🚫 Market cancelled event received in ProfileWallet, refreshing data');
      if (user?.id) {
        fetchWalletData();
      }
    };

    window.addEventListener('marketResolved', handleMarketResolved);
    window.addEventListener('marketCancelled', handleMarketCancelled);
    return () => {
      window.removeEventListener('marketResolved', handleMarketResolved);
      window.removeEventListener('marketCancelled', handleMarketCancelled);
    };
  }, [user?.id]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch active positions and stats in parallel
      const [activeRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/${user.id}/active`),
        fetch(`${apiUrl}/api/users/${user.id}/stats`)
      ]);

      if (!activeRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const activeData = await activeRes.json();
      const statsData = await statsRes.json();

      setActivePositions(activeData.activePositions || []);
      setPortfolio({
        totalInvested: activeData.activePositions?.reduce((sum, pos) => sum + parseFloat(pos.amount), 0) || 0,
        unrealizedPnL: activeData.activePositions?.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pnl || 0), 0) || 0,
        stats: statsData
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getProfitClass = (amount) => {
    if (amount > 0) return 'profit-positive';
    if (amount < 0) return 'profit-negative';
    return 'profit-neutral';
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-success-300 border-t-success-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">❌</div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">Failed to load wallet</h4>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            onClick={fetchWalletData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

 return (
  <div className="space-y-6">
    {/* Wallet summary (keeps your WalletInfo component) */}
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <WalletInfo />
    </div>

    {portfolio && (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 m-0">Portfolio Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(portfolio.totalInvested)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Invested</div>
            </div>
            <div className="text-center">
              <div
                className={`text-xl font-bold ${
                  portfolio.unrealizedPnL > 0
                    ? "text-green-600"
                    : portfolio.unrealizedPnL < 0
                    ? "text-rose-600"
                    : "text-gray-900"
                }`}
              >
                {portfolio.unrealizedPnL >= 0 ? "+" : ""}
                {formatCurrency(portfolio.unrealizedPnL)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Unrealized P&L</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{activePositions.length}</div>
              <div className="text-xs text-gray-600 mt-1">Active Positions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {(portfolio.stats.allTime.winRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Win Rate</div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Tabs header with live chip */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50">
          {["overview", "transactions", "analytics"].map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition ${
                activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {key === "overview" ? `Active Positions (${activePositions.length})` : key}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
              connectionStatus === "connected"
                ? "bg-green-50 text-green-700 border-green-200"
                : connectionStatus === "connecting"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {connectionStatus === "connected"
              ? "Live"
              : connectionStatus === "connecting"
              ? "Connecting…"
              : "Offline"}
          </span>
          {lastUpdate && isConnected && (
            <span className="text-xs text-gray-600">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <>
            {activePositions.length === 0 ? (
              <div className="text-center py-10">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">No active positions</h4>
                <p className="text-xs text-gray-600">Your open predictions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePositions.map((position) => (
                  <div
                    key={position.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">{position.market.question}</div>
                        <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-3">
                          <span>{position.market.hamster_name}</span>
                          <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium">
                            {getTimeRemaining(position.market.ends_at)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          position.side
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {position.side ? "YES" : "NO"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Invested</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(position.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Current Value</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(
                            position.shares *
                              (position.side ? position.market.current_price : 1 - position.market.current_price)
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">P&L</span>
                        <span
                          className={`font-semibold ${
                            position.unrealized_pnl > 0
                              ? "text-green-600"
                              : position.unrealized_pnl < 0
                              ? "text-rose-600"
                              : "text-gray-900"
                          }`}
                        >
                          {position.unrealized_pnl >= 0 ? "+" : ""}
                          {formatCurrency(position.unrealized_pnl)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 bg-white rounded-lg p-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Current Price</span>
                        <span className="text-gray-900 font-medium">
                          {(
                            (position.side
                              ? position.market.current_price
                              : 1 - position.market.current_price) * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            position.side ? "bg-green-500" : "bg-rose-500"
                          }`}
                          style={{
                            width: `${
                              (position.side
                                ? position.market.current_price
                                : 1 - position.market.current_price) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "transactions" && <TransactionHistory user={user} />}

        {activeTab === "analytics" && <PerformanceChart user={user} />}
      </div>
    </div>
  </div>
);

}
