import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function TransactionHistory({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user?.id, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const filterParam = filter !== 'all' ? `&type=${filter}` : '';
      const response = await fetch(`${apiUrl}/api/users/${user.id}/transactions?limit=100${filterParam}`);
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDemoTransaction = async (type, amount) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/users/${user.id}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          amount,
          description: `Demo ${type} for testing`,
          transaction_hash: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
      });

      if (!response.ok) throw new Error('Failed to create transaction');
      
      // Refresh transactions list
      fetchTransactions();
      setShowDepositModal(false);
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err.message);
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
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return '⬇️';
      case 'withdrawal': return '⬆️';
      case 'bet_placement': return '🎯';
      case 'bet_settlement': return '💰';
      case 'fee': return '💳';
      default: return '📄';
    }
  };

  const getTransactionClass = (type, amount) => {
    if (type === 'deposit' || type === 'bet_settlement') return 'positive';
    if (type === 'withdrawal' || type === 'bet_placement' || type === 'fee') return 'negative';
    return 'neutral';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'confirmed': { text: 'Confirmed', class: 'success' },
      'pending': { text: 'Pending', class: 'warning' },
      'failed': { text: 'Failed', class: 'error' },
      'cancelled': { text: 'Cancelled', class: 'neutral' }
    };
    
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="transaction-history">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h4>Failed to load transactions</h4>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchTransactions}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      
      {/* Summary Cards */}
      {summary && (
        <div className="transaction-summary">
          <div className="summary-card">
            <div className="summary-label">Total Deposits</div>
            <div className="summary-value positive">{formatCurrency(summary.totalDeposits)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Withdrawals</div>
            <div className="summary-value negative">{formatCurrency(summary.totalWithdrawals)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Net Flow</div>
            <div className={`summary-value ${summary.netFlow >= 0 ? 'positive' : 'negative'}`}>
              {summary.netFlow >= 0 ? '+' : ''}{formatCurrency(summary.netFlow)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Fees</div>
            <div className="summary-value neutral">{formatCurrency(summary.totalFees)}</div>
          </div>
        </div>
      )}

      {/* Header with filters and actions */}
      <div className="transactions-header">
        <div className="header-left">
          <h3>Transaction History</h3>
          <div className="transaction-filters">
            {[
              { key: 'all', label: 'All' },
              { key: 'deposit', label: 'Deposits' },
              { key: 'withdrawal', label: 'Withdrawals' },
              { key: 'bet_settlement', label: 'Settlements' },
              { key: 'bet_placement', label: 'Bets' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                className={`filter-button ${filter === filterOption.key ? 'active' : ''}`}
                onClick={() => setFilter(filterOption.key)}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="primary-action"
            onClick={() => setShowDepositModal(true)}
          >
            💰 Demo Deposit
          </button>
          <button 
            className="secondary-action"
            onClick={() => createDemoTransaction('withdrawal', 50)}
          >
            💸 Demo Withdrawal
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h4>No transactions found</h4>
            <p>
              {filter === 'all' 
                ? "Your transaction history will appear here as you deposit, withdraw, and place bets."
                : `No ${filter} transactions found. Try a different filter.`
              }
            </p>
            <button 
              className="primary-action"
              onClick={() => createDemoTransaction('deposit', 100)}
            >
              Create Demo Deposit
            </button>
          </div>
        ) : (
          <div className="transaction-items">
            {transactions.map(transaction => {
              const statusBadge = getStatusBadge(transaction.status);
              const transactionClass = getTransactionClass(transaction.type, transaction.amount);
              
              return (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-main">
                    <div className="transaction-icon">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div className="transaction-details">
                      <div className="transaction-description">
                        {transaction.description}
                      </div>
                      <div className="transaction-meta">
                        <span className="transaction-date">
                          {formatDate(transaction.created_at)}
                        </span>
                        {transaction.transaction_hash && (
                          <span className="transaction-hash">
                            Hash: {transaction.transaction_hash.slice(0, 8)}...{transaction.transaction_hash.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="transaction-right">
                    <div className={`transaction-amount ${transactionClass}`}>
                      {transactionClass === 'positive' ? '+' : transactionClass === 'negative' ? '-' : ''}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    
                    <div className={`status-badge ${statusBadge.class}`}>
                      {statusBadge.text}
                    </div>
                    
                    {transaction.fee_amount > 0 && (
                      <div className="transaction-fee">
                        Fee: {formatCurrency(transaction.fee_amount)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Demo Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Demo Deposit</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDepositModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Choose a demo deposit amount to test the transaction system:</p>
              <div className="demo-amounts">
                {[25, 50, 100, 250, 500].map(amount => (
                  <button
                    key={amount}
                    className="amount-button"
                    onClick={() => createDemoTransaction('deposit', amount)}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
