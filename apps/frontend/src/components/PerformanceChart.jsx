import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PerformanceChart({ user }) {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const chartRef = useRef();

  useEffect(() => {
    if (user?.id) {
      fetchPerformanceData();
    }
  }, [user?.id, period]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/users/${user.id}/performance?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
      
      const data = await response.json();
      setPerformanceData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching performance data:', err);
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

  const getPeriodLabel = (period) => {
    switch (period) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 3 Months';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  if (loading) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>Portfolio Performance</h3>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>Portfolio Performance</h3>
        </div>
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h4>Failed to load chart</h4>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchPerformanceData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData || !performanceData.performance) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>Portfolio Performance</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <h4>No performance data available</h4>
          <p>Start betting to see your portfolio performance over time.</p>
        </div>
      </div>
    );
  }

  const { performance, summary } = performanceData;

  // Prepare chart data
  const chartData = {
    labels: performance.map(p => format(parseISO(p.date), 'MMM dd')),
    datasets: [
      {
        label: 'Portfolio Value',
        data: performance.map(p => p.total_balance),
        borderColor: 'rgb(52, 152, 219)',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Invested Amount',
        data: performance.map(p => p.invested_amount),
        borderColor: 'rgb(149, 165, 166)',
        backgroundColor: 'rgba(149, 165, 166, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderDash: [5, 5]
      },
      {
        label: 'Realized P&L',
        data: performance.map(p => p.realized_pnl),
        borderColor: 'rgb(39, 174, 96)',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value (USD)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
    elements: {
      point: {
        hoverBorderWidth: 3
      }
    }
  };

  return (
    <div className="performance-chart">
      
      {/* Chart Header */}
      <div className="chart-header">
        <div className="chart-title">
          <h3>Portfolio Performance</h3>
          <span className="chart-subtitle">{getPeriodLabel(period)}</span>
        </div>
        
        <div className="period-selector">
          {['7d', '30d', '90d', '1y'].map(p => (
            <button
              key={p}
              className={`period-button ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="stat-label">Total Return</div>
            <div className={`stat-value ${summary.totalReturn >= 0 ? 'positive' : 'negative'}`}>
              {summary.totalReturn >= 0 ? '+' : ''}{formatCurrency(summary.totalReturn)}
              <span className="stat-percent">
                ({summary.totalReturnPercent >= 0 ? '+' : ''}{summary.totalReturnPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-label">Best Day</div>
            <div className="stat-value positive">
              +{formatCurrency(summary.bestDay)}
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-label">Worst Day</div>
            <div className="stat-value negative">
              {formatCurrency(summary.worstDay)}
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">
              {summary.winRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="chart-container">
        <Line 
          ref={chartRef}
          data={chartData} 
          options={chartOptions}
          height={300}
        />
      </div>

    </div>
  );
}
