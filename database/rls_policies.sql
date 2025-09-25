-- Row Level Security Policies for Zoomies
-- This file contains the missing RLS policies that need to be added to Supabase

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Policy 1: Allow anyone to insert new users (for registration)
CREATE POLICY "Anyone can register new users" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (true); -- For now, allow reading all user data (public profiles)

-- Policy 3: Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (privy_id = auth.jwt() ->> 'sub')
  WITH CHECK (privy_id = auth.jwt() ->> 'sub');

-- ============================================
-- POSITIONS TABLE POLICIES  
-- ============================================

-- Policy 1: Users can read their own positions
CREATE POLICY "Users can read own positions" ON positions
  FOR SELECT 
  USING (user_id = (
    SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
  ));

-- Policy 2: Users can insert their own positions
CREATE POLICY "Users can create own positions" ON positions
  FOR INSERT 
  WITH CHECK (user_id = (
    SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
  ));

-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

-- Policy 1: Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT 
  USING (user_id = (
    SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
  ));

-- Policy 2: Users can insert their own orders
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT 
  WITH CHECK (user_id = (
    SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
  ));

-- Policy 3: Users can update their own orders
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE 
  USING (user_id = (
    SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
  ));

-- ============================================
-- REFERRALS TABLE POLICIES
-- ============================================

-- Policy 1: Users can read referrals where they are involved
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT 
  USING (
    referred_user_id = (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub') OR
    referring_user_id = (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

-- Policy 2: Users can create referrals
CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT 
  WITH CHECK (true); -- Allow anyone to create referrals

-- ============================================
-- PUBLIC READ ACCESS
-- ============================================

-- Allow public read access to certain tables (no auth required)
-- These are for public data like markets, streams, leaderboards

-- Markets: Public read access
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to markets" ON markets
  FOR SELECT 
  USING (true);

-- Streams: Public read access  
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to streams" ON streams
  FOR SELECT 
  USING (true);

-- Market templates: Public read access
ALTER TABLE market_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to market templates" ON market_templates
  FOR SELECT 
  USING (true);

-- Daily stats: Public read access
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to daily stats" ON daily_stats
  FOR SELECT 
  USING (true);

-- Price history: Public read access
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to price history" ON price_history
  FOR SELECT 
  USING (true);
