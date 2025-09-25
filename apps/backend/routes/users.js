const express = require('express');
const { supabase, usingMockDatabase } = require('../lib/supabase');
const User = require('../models/User');
const router = express.Router();

// Import admin middleware from markets routes
const { verifyPrivyToken } = require('./auth');

// Admin middleware (simplified version for user funding)
const requireAdmin = async (req, res, next) => {
  try {
    // TEMPORARY: For testing, completely bypass auth for admin operations
    if (!req.user) {
      console.log('🔧 TESTING: Bypassing auth for admin user funding');
      
      // Set mock admin user
      req.user = { id: 'did:privy:cmfbzzdq10015l50co1m36baw' };
      req.adminRole = 'super_admin';
      return next();
    }

    // In production, you'd verify admin role here
    req.adminRole = 'super_admin';
    next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// Helper function to convert Privy ID to database user ID
const getDbUserId = async (userId) => {
  // If it looks like a Privy ID (starts with 'did:privy:'), convert it
  if (userId.startsWith('did:privy:')) {
    const user = await User.getByPrivyId(userId);
    if (!user) {
      throw new Error(`User with Privy ID ${userId} not found in database. User may need to complete authentication flow first.`);
    }
    return user.id;
  }
  // Otherwise assume it's already a database UUID
  return userId;
};

// Get user betting history
router.get('/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    // Get user's betting positions with market details
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        markets (
          id,
          question,
          description,
          status,
          outcome,
          starts_at,
          ends_at,
          resolved_at,
          streams (
            name,
            hamster_name
          )
        )
      `)
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate additional stats for each position
    const enrichedPositions = positions.map(position => {
      const market = position.markets;
      const isResolved = market.status === 'resolved';
      const userWon = isResolved ? position.is_winner : null;
      
      return {
        ...position,
        market: {
          ...market,
          hamster_name: market.streams?.hamster_name,
          stream_name: market.streams?.name
        },
        profit_loss: userWon ? position.payout - position.amount : (isResolved ? -position.amount : 0),
        status_display: isResolved ? (userWon ? 'Won' : 'Lost') : 'Pending'
      };
    });

    res.json({
      positions: enrichedPositions,
      total: positions.length,
      hasMore: positions.length === limit
    });

  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: 'Failed to fetch betting history' });
  }
});

// Get user statistics
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    // Get user's basic stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('usdc_balance, mock_balance, total_bets, total_earnings, win_rate, prediction_streak, longest_streak')
      .eq('id', dbUserId)
      .single();

    if (userError) throw userError;

    // Get recent performance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentPositions, error: positionsError } = await supabase
      .from('positions')
      .select(`
        amount,
        payout,
        is_winner,
        created_at,
        markets (
          status,
          resolved_at
        )
      `)
      .eq('user_id', dbUserId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (positionsError) throw positionsError;

    // Calculate recent stats
    const recentStats = recentPositions.reduce((acc, position) => {
      const isResolved = position.markets.status === 'resolved';
      
      acc.totalBets += 1;
      acc.totalVolume += parseFloat(position.amount);
      
      if (isResolved) {
        acc.resolvedBets += 1;
        if (position.is_winner) {
          acc.wins += 1;
          acc.totalWinnings += parseFloat(position.payout);
        } else {
          acc.losses += 1;
        }
        acc.totalProfit += parseFloat(position.payout || 0) - parseFloat(position.amount);
      }
      
      return acc;
    }, {
      totalBets: 0,
      totalVolume: 0,
      resolvedBets: 0,
      wins: 0,
      losses: 0,
      totalWinnings: 0,
      totalProfit: 0
    });

    const recentWinRate = recentStats.resolvedBets > 0 
      ? recentStats.wins / recentStats.resolvedBets 
      : 0;

    res.json({
      user: {
        usdc_balance: user.usdc_balance,
        mock_balance: user.mock_balance,
        total_bets: user.total_bets,
        total_earnings: user.total_earnings,
        win_rate: user.win_rate,
        prediction_streak: user.prediction_streak,
        longest_streak: user.longest_streak
      },
      allTime: {
        totalBets: user.total_bets,
        totalEarnings: parseFloat(user.total_earnings),
        winRate: parseFloat(user.win_rate),
        currentStreak: user.prediction_streak,
        longestStreak: user.longest_streak
      },
      recent30Days: {
        totalBets: recentStats.totalBets,
        totalVolume: recentStats.totalVolume,
        winRate: recentWinRate,
        wins: recentStats.wins,
        losses: recentStats.losses,
        totalProfit: recentStats.totalProfit,
        resolvedBets: recentStats.resolvedBets
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user's active positions
router.get('/:userId/active', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    let activePositions;
    
    if (usingMockDatabase) {
      // Mock database implementation
      console.log('🔧 Using mock database for active positions');
      const { data: positions, error: posError } = await supabase.from('positions').select('*').eq('user_id', dbUserId);
      if (posError) throw posError;
      
      const enrichedPositions = [];
      
      for (const position of positions) {
        // Get market data
        const { data: market, error: marketError } = await supabase.from('markets').select('*').eq('id', position.market_id).single();
        if (marketError || !market) {
          console.log(`⚠️ Market ${position.market_id} not found for position ${position.id}`);
          continue; // Skip if market not found
        }
        
        // Get stream data
        const { data: stream, error: streamError } = await supabase.from('streams').select('*').eq('id', market.stream_id).single();
        if (streamError) continue; // Skip if stream not found
        
        // Only include active or ended markets (not resolved)
        if (!['active', 'ended'].includes(market.status)) continue;
        
        const currentPrice = market.yes_volume / (market.yes_volume + market.no_volume) || 0.5;
        const userPosition = position.side ? 'YES' : 'NO';
        const relevantPrice = position.side ? currentPrice : (1 - currentPrice);
        
        enrichedPositions.push({
          ...position,
          market: {
            ...market,
            hamster_name: stream?.hamster_name,
            stream_name: stream?.name,
            current_price: currentPrice
          },
          position_side: userPosition,
          unrealized_pnl: (relevantPrice * position.shares) - position.amount
        });
      }
      
      activePositions = enrichedPositions;
    } else {
      // Supabase implementation
      const { data: positions, error } = await supabase
        .from('positions')
        .select(`
          *,
          markets (
            id,
            stream_id,
            question,
            status,
            ends_at,
            total_volume,
            yes_volume,
            no_volume,
            streams (
              id,
              name,
              hamster_name
            )
          )
        `)
        .eq('user_id', dbUserId)
        .in('markets.status', ['active', 'ended'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      activePositions = positions.map(position => {
        const market = position.markets;
        const currentPrice = market.yes_volume / (market.yes_volume + market.no_volume) || 0.5;
        const userPosition = position.side ? 'YES' : 'NO';
        const relevantPrice = position.side ? currentPrice : (1 - currentPrice);
        
        return {
          ...position,
          market: {
            ...market,
            hamster_name: market.streams?.hamster_name,
            stream_name: market.streams?.name,
            current_price: currentPrice
          },
          position_side: userPosition,
          unrealized_pnl: (relevantPrice * position.shares) - position.amount
        };
      });
    }

    res.json({
      activePositions: activePositions,
      total: activePositions.length
    });

  } catch (error) {
    console.error('Error fetching active positions:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch active positions', details: error.message });
  }
});

// Get user preferences
router.get('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', dbUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaultPreferences = {
        notifications_enabled: true,
        email_notifications: true,
        push_notifications: false,
        theme: 'light'
      };
      
      // Create default preferences
      const { data: newPreferences, error: createError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: dbUserId,
          ...defaultPreferences
        })
        .select()
        .single();

      if (createError) throw createError;
      
      return res.json(newPreferences);
    }

    res.json(preferences);

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

// Update user preferences
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    // Validate allowed fields
    const allowedFields = [
      'notifications_enabled',
      'email_notifications', 
      'push_notifications',
      'theme'
    ];

    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .update(filteredUpdates)
      .eq('user_id', dbUserId)
      .select()
      .single();

    if (error) throw error;

    res.json(preferences);

  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// Update user profile information
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    // Validate allowed fields
    const allowedFields = [
      'display_name',
      'bio',
      'avatar_url'
    ];

    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(filteredUpdates)
      .eq('id', dbUserId)
      .select('id, display_name, bio, avatar_url, email, created_at, updated_at')
      .single();

    if (error) throw error;

    res.json(user);

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user transaction history
router.get('/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, type } = req.query;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    let query = supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by transaction type if specified
    if (type && ['deposit', 'withdrawal', 'bet_settlement', 'bet_placement'].includes(type)) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Calculate summary statistics
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit' && t.status === 'confirmed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'confirmed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalFees = transactions
      .reduce((sum, t) => sum + parseFloat(t.fee_amount || 0), 0);

    res.json({
      transactions: transactions || [],
      summary: {
        totalDeposits,
        totalWithdrawals,
        totalFees,
        netFlow: totalDeposits - totalWithdrawals
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: transactions.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Get portfolio performance data for charts
router.get('/:userId/performance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d', type = 'daily' } = req.query;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get portfolio snapshots
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', dbUserId)
      .eq('snapshot_type', type)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (snapshotsError) throw snapshotsError;

    // If no snapshots exist, create synthetic data from current positions
    if (!snapshots || snapshots.length === 0) {
      // Get current user stats for synthetic data
      const { data: currentStats, error: statsError } = await supabase
        .from('users')
        .select('total_bets, total_earnings, win_rate')
        .eq('id', dbUserId)
        .single();

      if (statsError) throw statsError;

      // Create synthetic daily data points
      const syntheticData = [];
      const daysInPeriod = Math.min(30, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
      
      for (let i = 0; i < daysInPeriod; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Simulate gradual progression
        const progress = i / (daysInPeriod - 1);
        const currentEarnings = parseFloat(currentStats.total_earnings || 0);
        
        syntheticData.push({
          date: date.toISOString().split('T')[0],
          total_balance: Math.max(0, currentEarnings * progress),
          invested_amount: Math.max(0, (currentEarnings + 1000) * progress),
          unrealized_pnl: currentEarnings * progress,
          realized_pnl: currentEarnings * progress * 0.7,
          win_rate: parseFloat(currentStats.win_rate || 0),
          total_positions_count: Math.floor((currentStats.total_bets || 0) * progress)
        });
      }

      return res.json({
        performance: syntheticData,
        period,
        summary: {
          totalReturn: currentEarnings,
          totalReturnPercent: currentEarnings > 0 ? ((currentEarnings / 1000) * 100) : 0,
          bestDay: Math.max(...syntheticData.map(d => d.unrealized_pnl)),
          worstDay: Math.min(...syntheticData.map(d => d.unrealized_pnl)),
          avgDailyReturn: currentEarnings / daysInPeriod,
          winRate: parseFloat(currentStats.win_rate || 0) * 100
        }
      });
    }

    // Calculate performance metrics from real snapshots
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];
    
    const totalReturn = lastSnapshot.total_balance - firstSnapshot.total_balance;
    const totalReturnPercent = firstSnapshot.total_balance > 0 
      ? ((totalReturn / firstSnapshot.total_balance) * 100) 
      : 0;

    const bestDay = Math.max(...snapshots.map(s => s.unrealized_pnl));
    const worstDay = Math.min(...snapshots.map(s => s.unrealized_pnl));
    const avgDailyReturn = totalReturn / snapshots.length;

    res.json({
      performance: snapshots.map(s => ({
        date: s.snapshot_date,
        total_balance: parseFloat(s.total_balance),
        invested_amount: parseFloat(s.invested_amount),
        unrealized_pnl: parseFloat(s.unrealized_pnl),
        realized_pnl: parseFloat(s.realized_pnl),
        win_rate: parseFloat(s.win_rate) * 100,
        total_positions_count: s.total_positions_count
      })),
      period,
      summary: {
        totalReturn,
        totalReturnPercent,
        bestDay,
        worstDay,
        avgDailyReturn,
        winRate: lastSnapshot.win_rate * 100
      }
    });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// Create a new transaction (for deposits/withdrawals)
router.post('/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, amount, description, transaction_hash } = req.body;
    
    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    // Validate transaction type
    if (!['deposit', 'withdrawal'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const { data: transaction, error } = await supabase
      .from('user_transactions')
      .insert({
        user_id: dbUserId,
        type,
        amount: parseFloat(amount),
        description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} of ${amount} USDC`,
        transaction_hash,
        status: transaction_hash ? 'confirmed' : 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(transaction);

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Fund user account (Admin only)
router.post('/:userId/fund', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason = 'Admin funding' } = req.body;
    
    console.log('💰 Admin funding user:', { userId, amount, reason });

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (parseFloat(amount) > 10000) {
      return res.status(400).json({ error: 'Maximum funding amount is $10,000' });
    }

    // Convert Privy ID to database ID if needed
    const dbUserId = await getDbUserId(userId);

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate new balance (use mock_balance if available, fallback to usdc_balance)
    const currentBalance = parseFloat(user.mock_balance !== undefined ? user.mock_balance : user.usdc_balance || 0);
    const newBalance = currentBalance + parseFloat(amount);

    // Update user balance (prefer mock_balance if column exists)
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    // Try to update mock_balance first, fallback to usdc_balance
    if (user.mock_balance !== undefined) {
      updateData.mock_balance = newBalance;
    } else {
      updateData.usdc_balance = newBalance;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', dbUserId);

    if (updateError) {
      console.error('❌ Failed to update user balance:', updateError);
      throw updateError;
    }

    // Log the funding transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: dbUserId,
        type: 'funding',
        amount: parseFloat(amount),
        description: reason,
        status: 'completed'
      });

    if (transactionError) {
      console.warn('⚠️ Failed to log funding transaction:', transactionError);
    }

    console.log(`✅ Funded user ${user.username || user.email}: $${currentBalance} → $${newBalance}`);

    res.json({
      success: true,
      message: `Successfully funded ${user.username || user.email} with $${amount}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        previousBalance: currentBalance,
        newBalance: newBalance,
        fundingAmount: parseFloat(amount)
      }
    });

  } catch (error) {
    console.error('❌ Error funding user:', error);
    res.status(500).json({ error: 'Failed to fund user account', details: error.message });
  }
});

// Get all users (Admin only) - for funding UI
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, privy_id, username, email, usdc_balance, mock_balance, total_bets, total_earnings, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      users: users || [],
      total: users?.length || 0,
      hasMore: users?.length === limit
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
router.get('/:id/positions', async (req, res) => {
  try {
    const userId = req.params.id;         // can be db id OR privy id
    const { status = 'all', limit = 50 } = req.query;

    // Resolve privy id -> db id if needed
    let dbUserId = userId;
    if (userId.startsWith('did:privy:')) {
      const { data: u, error: ue } = await supabase
        .from('users')
        .select('id, privy_id')
        .eq('privy_id', userId)
        .single();
      if (ue || !u) return res.status(404).json({ error: 'User not found' });
      dbUserId = u.id;
    }

    // Base positions query
    let query = supabase
      .from('positions')
      .select(`
        *,
        markets:markets(*)
      `)
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .limit(Math.min(parseInt(limit, 10) || 50, 200));

    // Optional status filter (by market status)
    if (status === 'resolved') query = query.eq('markets.status', 'resolved');
    else if (status === 'active') query = query.eq('markets.status', 'active');

    const { data, error } = await query;
    if (error) throw error;

    res.json({ positions: data || [] });
  } catch (e) {
    console.error('users/:id/positions error:', e);
    res.status(500).json({ error: 'Failed to fetch positions', details: e.message });
  }
});
module.exports = router;
