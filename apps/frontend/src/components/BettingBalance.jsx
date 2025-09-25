import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function BettingBalance() {
  const { authenticated, user } = usePrivy();
  const [balance, setBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBettingBalance = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${user.id}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        // Use mock_balance if available, fallback to usdc_balance
        const mockBalance = data.user?.mock_balance !== undefined ? data.user.mock_balance : data.user?.usdc_balance || 0;
        setBalance(parseFloat(mockBalance).toFixed(2));
      } else {
        throw new Error('Failed to fetch balance');
      }
    } catch (err) {
      console.error('Error fetching betting balance:', err);
      setError(err.message);
      setBalance('--');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && user?.id) {
      fetchBettingBalance();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchBettingBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, user?.id]);

  if (!authenticated) {
    return null;
  }

  return (
    <div className="betting-balance-card">
      <div className="balance-header">
        <span className="balance-label">💰 Betting Balance</span>
        <button 
          className="refresh-button"
          onClick={fetchBettingBalance}
          disabled={isLoading}
          title="Refresh betting balance"
        >
          🔄
        </button>
      </div>
      <div className="balance-display">
        <span className="balance-amount">
          {isLoading ? (
            'Loading...'
          ) : error ? (
            <span style={{ color: '#e74c3c' }}>{error}</span>
          ) : (
            `$${balance}`
          )}
        </span>
        <span className="balance-subtitle">Mock USDC</span>
      </div>
      <div className="balance-note">
        <small>💡 This is your mock balance for betting. Contact admin for funding.</small>
      </div>
    </div>
  );
}
