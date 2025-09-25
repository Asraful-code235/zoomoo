import { useState, useEffect } from 'react';

export default function ProfileHistory({ user }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch betting history and stats in parallel
      const [historyRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/${user.id}/history`),
        fetch(`${apiUrl}/api/users/${user.id}/stats`)
      ]);

      if (!historyRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch user data');
      }

      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      setHistory(historyData.positions || []);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
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

  const getProfitClass = (profitLoss) => {
    if (profitLoss > 0) return 'profit-positive';
    if (profitLoss < 0) return 'profit-negative';
    return 'profit-neutral';
  };

  const filteredHistory = history.filter(position => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return position.market.status !== 'resolved';
    if (activeTab === 'won') return position.is_winner === true;
    if (activeTab === 'lost') return position.is_winner === false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading betting history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">❌</div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">Failed to load history</h4>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            onClick={fetchUserData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

 return (
  <div className="space-y-8">
    {/* Stats */}
    {stats && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.allTime.totalBets}</div>
          <div className="text-xs text-gray-600 mt-1">Total Bets</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.allTime.totalEarnings)}</div>
          <div className="text-xs text-gray-600 mt-1">Total Earnings</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-gray-900">{(stats.allTime.winRate * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-600 mt-1">Win Rate</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.allTime.currentStreak}</div>
          <div className="text-xs text-gray-600 mt-1">Current Streak</div>
        </div>
      </div>
    )}

    {/* History card */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 m-0">Betting History</h3>
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50">
          {["all", "active", "won", "lost"].map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition ${
                activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {key}
              {key === "all" ? ` (${history.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-10">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">No records to display</h4>
            <p className="text-xs text-gray-600">Your predictions will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((position) => (
              <div
                key={position.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {position.market.question}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-3">
                      <span>{formatDate(position.created_at)}</span>
                      <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium">
                        {position.market.hamster_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        position.side ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {position.side ? "YES" : "NO"}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(position.amount)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                        position.market.status === "resolved"
                          ? "bg-gray-100 text-gray-700"
                          : position.market.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {position.status_display || position.market.status}
                    </span>
                    {position.market.status === "resolved" && (
                      <span
                        className={`text-sm font-bold ${
                          position.profit_loss > 0
                            ? "text-green-600"
                            : position.profit_loss < 0
                            ? "text-rose-600"
                            : "text-gray-600"
                        }`}
                      >
                        {position.profit_loss >= 0 ? "+" : ""}
                        {formatCurrency(position.profit_loss)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

}
