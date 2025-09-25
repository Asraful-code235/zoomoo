-- Migration: Add transaction history tables
-- For tracking USDC deposits, withdrawals, and bet settlements

-- User transactions table (deposits/withdrawals)
CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bet_settlement', 'bet_placement', 'fee')),
    amount DECIMAL(20, 6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDC',
    
    -- Blockchain details
    transaction_hash VARCHAR(88), -- Solana transaction signature
    block_number BIGINT,
    block_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Internal tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    internal_reference VARCHAR(255), -- Link to positions table for bet-related transactions
    
    -- Metadata
    description TEXT,
    fee_amount DECIMAL(20, 6) DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio snapshots for performance tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Portfolio values at snapshot time
    total_balance DECIMAL(20, 6) NOT NULL,
    invested_amount DECIMAL(20, 6) NOT NULL,
    unrealized_pnl DECIMAL(20, 6) NOT NULL,
    realized_pnl DECIMAL(20, 6) NOT NULL,
    
    -- Statistics
    active_positions_count INTEGER DEFAULT 0,
    total_positions_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 4) DEFAULT 0,
    
    -- Snapshot metadata
    snapshot_type VARCHAR(20) DEFAULT 'daily' CHECK (snapshot_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_type ON user_transactions(type);
CREATE INDEX IF NOT EXISTS idx_user_transactions_status ON user_transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_transactions_created_at ON user_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_transactions_hash ON user_transactions(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_type ON portfolio_snapshots(snapshot_type);

-- Add constraint for unique daily snapshots per user
ALTER TABLE portfolio_snapshots 
ADD CONSTRAINT unique_user_daily_snapshot 
UNIQUE(user_id, snapshot_date, snapshot_type);
