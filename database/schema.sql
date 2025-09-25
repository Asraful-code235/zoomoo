-- Zoomies Database Schema
-- Live Hamster Prediction Markets

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (linked to Privy authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    privy_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    username VARCHAR(50),
    display_name VARCHAR(100), -- For profile display
    avatar_url TEXT, -- Profile picture URL
    bio TEXT, -- User bio/description
    wallet_address VARCHAR(88) NOT NULL, -- Solana wallet address
    usdc_balance DECIMAL(20, 6) DEFAULT 0,
    total_earnings DECIMAL(20, 6) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 4) DEFAULT 0, -- 0.0000 to 1.0000
    prediction_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    referral_earnings DECIMAL(20, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Admin roles table
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'regular_admin')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Hamster streams table
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    hamster_name VARCHAR(50) NOT NULL,
    description TEXT,
    mux_playback_id VARCHAR(255),
    mux_stream_key VARCHAR(255),
    assigned_admin_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    viewer_count INTEGER DEFAULT 0,
    total_bets_placed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market templates (for admins to create bet types)
CREATE TABLE market_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    question_template TEXT NOT NULL, -- e.g., "Will {hamster} {action} in next {duration}?"
    category VARCHAR(50) NOT NULL, -- 'drinking', 'wheel', 'sleeping', etc.
    default_duration_minutes INTEGER DEFAULT 5,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Markets/Bets table
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    template_id UUID REFERENCES market_templates(id),
    admin_id UUID REFERENCES users(id) NOT NULL,
    question TEXT NOT NULL,
    description TEXT,
    
    -- Market timing
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Market state
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'resolved', 'cancelled')),
    outcome BOOLEAN, -- true for YES, false for NO, null if not resolved
    
    -- Market stats
    total_volume DECIMAL(20, 6) DEFAULT 0,
    yes_volume DECIMAL(20, 6) DEFAULT 0,
    no_volume DECIMAL(20, 6) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    
    -- Resolution
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual user positions/bets
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Position details
    side BOOLEAN NOT NULL, -- true for YES, false for NO
    amount DECIMAL(20, 6) NOT NULL,
    price DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000 (price per share)
    shares DECIMAL(20, 6) NOT NULL, -- amount / price
    
    -- Transaction details
    transaction_fee DECIMAL(20, 6) NOT NULL,
    
    -- Outcome
    is_winner BOOLEAN,
    payout DECIMAL(20, 6) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order book for trading
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Order details
    side BOOLEAN NOT NULL, -- true for YES, false for NO
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('buy', 'sell')),
    amount DECIMAL(20, 6) NOT NULL,
    price DECIMAL(5, 4) NOT NULL,
    filled_amount DECIMAL(20, 6) DEFAULT 0,
    
    -- Order state
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    
    -- Tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'completed')),
    qualified_at TIMESTAMP WITH TIME ZONE, -- when referee made 5 bets + $10 deposit
    total_commission DECIMAL(20, 6) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(referee_id)
);

-- Commission payments
CREATE TABLE commission_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Payment details
    referee_fee DECIMAL(20, 6) NOT NULL, -- 10% of this goes to referrer
    commission_amount DECIMAL(20, 6) NOT NULL, -- actual commission paid
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements/Badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL, -- emoji
    condition_type VARCHAR(30) NOT NULL, -- 'first_bet', 'win_streak', 'total_earnings', etc.
    condition_value INTEGER, -- threshold value if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Market price history (for charts)
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    price DECIMAL(5, 4) NOT NULL,
    volume DECIMAL(20, 6) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform stats and analytics
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    -- User metrics
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    
    -- Trading metrics
    total_volume DECIMAL(20, 6) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    total_markets INTEGER DEFAULT 0,
    
    -- Revenue metrics
    platform_fees DECIMAL(20, 6) DEFAULT 0,
    referral_commissions DECIMAL(20, 6) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_privy_id ON users(privy_id);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_markets_stream_id ON markets(stream_id);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_ends_at ON markets(ends_at);
CREATE INDEX idx_positions_market_id ON positions(market_id);
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_orders_market_id ON orders(market_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_price_history_market_id ON price_history(market_id);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Insert default market templates
INSERT INTO market_templates (name, question_template, category, default_duration_minutes) VALUES
('Drinking Water', 'Will {hamster} drink water in the next {duration} minutes?', 'drinking', 3),
('Using Wheel', 'Will {hamster} use the exercise wheel in the next {duration} minutes?', 'exercise', 5),
('Eating Food', 'Will {hamster} eat food in the next {duration} minutes?', 'eating', 2),
('Sleeping/Resting', 'Will {hamster} go to sleep in the next {duration} minutes?', 'sleeping', 10),
('Grooming', 'Will {hamster} groom themselves in the next {duration} minutes?', 'grooming', 5),
('Wheel Spins Count', 'Will {hamster} spin the wheel more than {count} times in {duration} minutes?', 'exercise', 5),
('First to Act', 'Which hamster will {action} first?', 'competition', 10);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, condition_type, condition_value) VALUES
('First Blood', 'Place your first bet', '🩸', 'first_bet', 1),
('Hamster Whisperer', 'Win 5 bets in a row', '🔮', 'win_streak', 5),
('High Roller', 'Place a bet of $50 or more', '💎', 'single_bet_amount', 5000), -- in cents
('Profitable Prophet', 'Earn $100 in total winnings', '💰', 'total_earnings', 10000),
('Night Owl', 'Place a bet after midnight', '🦉', 'late_night_bet', 0),
('Early Bird', 'Place a bet before 6 AM', '🐦', 'early_morning_bet', 0),
('Streak Master', 'Win 10 bets in a row', '🔥', 'win_streak', 10),
('Wheel Expert', 'Win 20 wheel-related bets', '🎯', 'category_wins', 20),
('Social Butterfly', 'Refer 5 friends', '🦋', 'referrals_made', 5),
('Diamond Hands', 'Hold positions worth $500+', '💎', 'portfolio_value', 50000);
