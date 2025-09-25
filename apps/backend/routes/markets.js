const express = require('express');
const Market = require('../models/Market');
const User = require('../models/User');
const { supabase } = require('../lib/supabase');
const router = express.Router();

// Import Privy auth middleware
const { verifyPrivyToken } = require('./auth');

// Middleware to verify admin status
const requireAdmin = async (req, res, next) => {
  try {
    // TEMPORARY: For testing, completely bypass auth for all requests
    if (!req.user) {
      console.log('🔧 TESTING: Bypassing auth completely for market operations');
      
      // Try to find the user, if not found, create one in the database
      let testUser;
      try {
        testUser = await User.getByPrivyId('did:privy:cmfbzzdq10015l50co1m36baw');
        console.log('✅ Found existing admin user:', testUser.email);
      } catch (error) {
        console.log('⚠️ User not found, creating admin user in database...');
        
        // Create the admin user in the database for real
        try {
          const mockPrivyUser = {
            id: 'did:privy:cmfbzzdq10015l50co1m36baw',
            email: { address: 'omathehero@gmail.com' },
            wallet: {
              address: '11111111111111111111111111111112' // Mock Solana wallet address
            },
            linkedAccounts: [{
              type: 'google_oauth',
              email: 'omathehero@gmail.com'
            }, {
              type: 'wallet',
              address: '11111111111111111111111111111112'
            }]
          };
          
          console.log('🔧 About to call User.upsertFromPrivy with:', JSON.stringify(mockPrivyUser, null, 2));
          testUser = await User.upsertFromPrivy(mockPrivyUser);
          console.log('✅ Created admin user in database:', testUser.id);
        } catch (createError) {
          console.error('❌ Failed to create admin user:', createError);
          console.error('❌ Create error details:', createError.message);
          console.error('❌ Create error stack:', createError.stack);
          throw new Error('Could not create admin user for testing: ' + createError.message);
        }
      }
      
      req.user = { id: 'did:privy:cmfbzzdq10015l50co1m36baw' };
      req.userDb = testUser;
      req.adminRole = 'super_admin'; // Grant super admin for testing
      console.log('🔧 TESTING: Admin bypass successful');
      return next();
    }

    const user = await User.getByPrivyId(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const adminRole = await User.getAdminRole(user.id);
    if (!adminRole) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userDb = user;
    req.adminRole = adminRole;
    next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to verify admin status', details: error.message });
  }
};

// Create new market
router.post('/', requireAdmin, async (req, res) => {
  try {
    console.log('🎯 Creating market with data:', req.body);
    console.log('👤 req.userDb:', req.userDb);
    console.log('🆔 req.userDb.id:', req.userDb?.id);
    
    const { streamId, templateId, question, duration, description } = req.body;

    if (!streamId || !question || !duration) {
      console.error('❌ Missing required fields:', { streamId, question, duration });
      return res.status(400).json({ 
        error: 'Stream ID, question, and duration are required' 
      });
    }

    if (!req.userDb || !req.userDb.id) {
      console.error('❌ No admin user available');
      return res.status(400).json({ 
        error: 'Admin user information not available' 
      });
    }

    // Calculate end time based on duration
    const endsAt = new Date(Date.now() + (duration * 60 * 1000)); // duration in minutes
    console.log('⏰ Market end time calculated:', endsAt);

    const marketData = {
      streamId,
      templateId: templateId || null,
      adminId: req.userDb.id,
      question,
      description: description || null,
      endsAt,
    };

    console.log('📊 Market data prepared:', marketData);
    console.log('📞 Calling Market.create...');
    
    const market = await Market.create(marketData);
    
    console.log('✅ Market created successfully:', market.id);
    res.json({ 
      success: true,
      market,
      message: 'Market created successfully' 
    });
  } catch (error) {
    console.error('❌ Error creating market:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', error.message);
    res.status(500).json({ error: 'Failed to create market', details: error.message });
  }
});

// Get all active markets
router.get('/', async (req, res) => {
  try {
    const markets = await Market.getAllActive();
    res.json({ markets });
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

// Get all markets for admin (including ended markets)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    // First, auto-expire any active markets that have passed their end time
    const now = new Date().toISOString();
    const { error: expireError } = await supabase
      .from('markets')
      .update({ status: 'ended', updated_at: now })
      .eq('status', 'active')
      .lt('ends_at', now);

    if (expireError) {
      console.warn('⚠️ Failed to auto-expire markets:', expireError);
    } else {
      console.log('✅ Auto-expired markets that passed their end time');
    }

    // Now fetch all markets
    const { data, error } = await supabase
      .from('markets')
      .select(`
        *,
        streams!inner (
          id,
          name,
          hamster_name,
          is_active
        ),
        users!admin_id (
          username,
          email
        )
      `)
      .in('status', ['active', 'ended', 'cancelled']) // Include active, ended, and cancelled markets
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ markets: data });
  } catch (error) {
    console.error('Get admin markets error:', error);
    res.status(500).json({ error: 'Failed to fetch admin markets' });
  }
});

// Get markets for a specific stream
router.get('/stream/:streamId', async (req, res) => {
  try {
    const markets = await Market.getByStreamId(req.params.streamId);
    res.json({ markets });
  } catch (error) {
    console.error('Get stream markets error:', error);
    res.status(500).json({ error: 'Failed to fetch stream markets' });
  }
});

// 👇 NEW: Stream trend endpoint used by the client chart
router.get('/streams/:streamId/trend', async (req, res) => {
  try {
    const streamId = req.params.streamId;
    const sinceMin = Math.min(parseInt(req.query.sinceMin || '180', 10), 1440); // cap 24h
    const limit = Math.min(parseInt(req.query.limit || '2000', 10), 5000);

    const points = await Market.getStreamTrend(streamId, sinceMin, limit);

    // Normalize response as the client expects
    const normalized = points.map(p => {
      const yes = Number(p.yes_volume || 0);
      const no = Number(p.no_volume || 0);
      const total = yes + no;
      const yesPct = total > 0 ? Math.round((yes / total) * 100) : 50;
      return {
        ts: p.ts,
        yesPct,
        noPct: 100 - yesPct,
      };
    });

    res.json({ points: normalized });
  } catch (err) {
    console.error('❌ /streams/:id/trend error:', err);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

// Resolve market (admin only)
router.post('/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const { outcome, resolutionNotes } = req.body;
    
    if (typeof outcome !== 'boolean') {
      return res.status(400).json({ error: 'Outcome must be true (YES) or false (NO)' });
    }

    const market = await Market.resolve(req.params.id, outcome, resolutionNotes, req.userDb.id);
    res.json({ 
      success: true,
      market,
      message: 'Market resolved successfully' 
    });
  } catch (error) {
    console.error('Error resolving market:', error);
    res.status(500).json({ error: 'Failed to resolve market' });
  }
});

// Get market positions (admin only)
router.get('/:id/positions', requireAdmin, async (req, res) => {
  try {
    const { id: marketId } = req.params;
    
    // Get market details
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();
      
    if (marketError) throw marketError;
    
    // Get all positions for this market
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select(`
        *,
        users (
          id,
          privy_id,
          email,
          username,
          mock_balance,
          usdc_balance
        )
      `)
      .eq('market_id', marketId)
      .order('created_at', { ascending: false });
      
    if (positionsError) throw positionsError;
    
    // Calculate current market stats
    const totalVolume = parseFloat(market.total_volume || 0);
    const yesVolume = parseFloat(market.yes_volume || 0);
    const noVolume = parseFloat(market.no_volume || 0);
    const currentPrice = totalVolume > 0 ? yesVolume / totalVolume : 0.5;
    
    // Enrich positions with current P&L if market is not resolved
    const enrichedPositions = positions.map(position => {
      let unrealizedPnL = 0;
      let currentValue = 0;
      
      if (market.status !== 'resolved') {
        const relevantPrice = position.side ? currentPrice : (1 - currentPrice);
        currentValue = relevantPrice * parseFloat(position.shares);
        unrealizedPnL = currentValue - parseFloat(position.amount);
      } else {
        // Market is resolved, use actual payout
        currentValue = parseFloat(position.payout || 0);
        unrealizedPnL = currentValue - parseFloat(position.amount);
      }
      
      return {
        ...position,
        current_value: currentValue,
        unrealized_pnl: unrealizedPnL,
        user_email: position.users?.email || 'Unknown',
        user_id_display: position.users?.privy_id || position.user_id
      };
    });
    
    res.json({
      market,
      positions: enrichedPositions,
      summary: {
        total_positions: positions.length,
        yes_positions: positions.filter(p => p.side === true).length,
        no_positions: positions.filter(p => p.side === false).length,
        total_volume: totalVolume,
        yes_volume: yesVolume,
        no_volume: noVolume,
        current_price: currentPrice
      }
    });
    
  } catch (error) {
    console.error('Error fetching market positions:', error);
    res.status(500).json({ error: 'Failed to fetch market positions' });
  }
});

// Cancel market and refund all positions (admin only)
router.post('/:id/cancel', requireAdmin, async (req, res) => {
  try {
    const { reason = 'No reason provided' } = req.body;
    const marketId = req.params.id;
    
    console.log('🚫 Cancelling market:', marketId, 'Reason:', reason);
    console.log('👤 Admin:', req.userDb?.email || req.userDb?.id);
    
    // Validate reason
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ 
        error: 'Cancellation reason must be at least 5 characters long' 
      });
    }

    const result = await Market.cancel(marketId, reason.trim(), req.userDb?.id);
    
    console.log('✅ Market cancelled successfully:', {
      marketId,
      totalRefunded: result.totalRefunded,
      usersRefunded: result.refunds.length,
      positionsRefunded: result.positionsCount
    });
    
    res.json({ 
      success: true,
      message: `Market cancelled successfully. Refunded $${result.totalRefunded.toFixed(2)} to ${result.refunds.length} users.`,
      market: result.market,
      refunds: result.refunds,
      summary: {
        totalRefunded: result.totalRefunded,
        usersRefunded: result.refunds.length,
        positionsRefunded: result.positionsCount
      }
    });
  } catch (error) {
    console.error('❌ Error cancelling market:', error);
    res.status(500).json({ 
      error: 'Failed to cancel market', 
      details: error.message 
    });
  }
});

// Renew/extend market (admin only)
router.post('/:id/renew', requireAdmin, async (req, res) => {
  try {
    const { additional_minutes = 30, new_question } = req.body;
    
    console.log('🔄 Renewing market:', req.params.id, 'for', additional_minutes, 'minutes');
    
    // Validate duration
    if (additional_minutes < 1 || additional_minutes > 1440) { // Max 24 hours
      return res.status(400).json({ 
        error: 'Duration must be between 1 and 1440 minutes (24 hours)' 
      });
    }

    const market = await Market.renew(req.params.id, additional_minutes, new_question);
    
    res.json({ 
      success: true,
      market,
      message: `Market renewed for ${additional_minutes} minutes` 
    });
  } catch (error) {
    console.error('Error renewing market:', error);
    res.status(500).json({ 
      error: 'Failed to renew market', 
      details: error.message 
    });
  }
});

// Get all market templates
router.get('/templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching market templates:', error);
      throw error;
    }

    res.json({ templates: data });
  } catch (error) {
    console.error('Error fetching market templates:', error);
    res.status(500).json({ error: 'Failed to fetch market templates' });
  }
});

// Place a bet on a market
router.post('/:marketId/bet', async (req, res) => {
  try {
    const { marketId } = req.params;
    const { side, amount, userId } = req.body; // side: true for YES, false for NO

    console.log('🎯 Placing bet:', { marketId, side, amount, userId });
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

    // Validate inputs
    if (typeof side !== 'boolean') {
      return res.status(400).json({ error: 'Side must be true (YES) or false (NO)' });
    }
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Convert Privy ID to database ID if needed
    const { supabase, usingMockDatabase } = require('../lib/supabase');
    const User = require('../models/User');

    if (usingMockDatabase) {
      console.log(`🔧 Processing bet with mock database: ${JSON.stringify({ marketId, side, amount, userId })}`);
    }

    let dbUserId = userId;
    let user = null;

    if (userId.startsWith('did:privy:')) {
      user = await User.getByPrivyId(userId);
      if (!user) {
        console.log('🔄 User not found in database, attempting auto-registration...');
        try {
          // Try to auto-register the user with basic data
          let insertData = {
            privy_id: userId,
            email: `user-${userId.slice(-8)}@temp.com`,
            wallet_address: 'temp-wallet-address',
            username: `User${userId.slice(-8)}`,
            usdc_balance: 0.0,
            total_earnings: 0,
            total_bets: 0,
            win_rate: 0,
            prediction_streak: 0,
            longest_streak: 0,
          };

          // Try to add mock_balance if column exists
          try {
            insertData.mock_balance = 0.0;
          } catch (e) {
            console.log('⚠️ mock_balance column might not exist, using fallback');
          }

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert(insertData)
            .select()
            .single();

          if (insertError) {
            console.error('❌ Auto-registration failed:', insertError);
            return res.status(404).json({
              error: 'User not found and auto-registration failed: ' + insertError.message,
            });
          }

          console.log('✅ User auto-registered successfully:', newUser.id);
          user = newUser;
        } catch (autoRegError) {
          console.error('❌ Auto-registration error:', autoRegError);
          return res.status(404).json({
            error: 'User not found and auto-registration failed: ' + autoRegError.message,
          });
        }
      }
      dbUserId = user.id;
    } else {
      // Direct database user ID provided
      const { data: directUser, error: directUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (directUserError || !directUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      user = directUser;
      dbUserId = user.id;
    }

    // ✅ Ensure the user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ NEW: Block multiple bets per (user, market)
    {
      const { data: existingPos, error: existingErr } = await supabase
        .from('positions')
        .select('id, amount, shares, side, created_at')
        .eq('market_id', marketId)
        .eq('user_id', dbUserId)
        .maybeSingle();

      if (existingErr) {
        console.error('❌ Failed checking existing position:', existingErr);
        return res.status(500).json({ error: 'Failed to verify prior bet' });
      }

      if (existingPos) {
        return res.status(409).json({
          error: 'You can only place one bet on this market.',
          existingPosition: existingPos,
        });
      }
    }

    // Get market details
    const Market = require('../models/Market');
    let market;
    if (usingMockDatabase) {
      // For mock database, create a default market if it doesn't exist
      const { data: existingMarket } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();
      if (existingMarket) {
        market = existingMarket;
      } else {
        console.log(`🔧 Creating mock market: ${marketId}`);
        const mockMarket = {
          id: marketId,
          stream_id: '0d7839c3-aa50-4c32-97b0-ef1576ca9dbe',
          question: 'Will something interesting happen?',
          status: 'active',
          yes_volume: 0,
          no_volume: 0,
          total_volume: 0,
          total_bets: 0,
          ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        };
        const { data: newMarket } = await supabase.from('markets').insert(mockMarket).select().single();
        market = newMarket;
      }
    } else {
      market = await Market.getById(marketId);
    }

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Check if market is still active
    if (market.status !== 'active') {
      return res.status(400).json({ error: 'Market is no longer active' });
    }

    // Check if market has ended (auto-expire if needed)
    const now = new Date();
    if (now >= new Date(market.ends_at)) {
      // Auto-expire the market
      await supabase
        .from('markets')
        .update({ status: 'ended', updated_at: now.toISOString() })
        .eq('id', marketId)
        .eq('status', 'active');

      return res.status(400).json({ error: 'Market has ended' });
    }

    // ✅ After we know the market is valid, validate balance once
    const currentBalance = parseFloat(
      user.mock_balance !== undefined && user.mock_balance !== null ? user.mock_balance : user.usdc_balance || 0
    );
    const transactionFeePreview = parseFloat(amount) * 0.02; // 2% transaction fee
    const totalNeeded = parseFloat(amount) + transactionFeePreview;
    console.log(
      `💰 User balance check: mock_balance=${user.mock_balance}, usdc_balance=${user.usdc_balance}, currentBalance=${currentBalance}, needed=${totalNeeded} (${amount} + ${transactionFeePreview} fee)`
    );

    if (currentBalance < totalNeeded) {
      return res.status(400).json({
        error: `Insufficient balance. You have $${currentBalance.toFixed(2)}, but need $${totalNeeded.toFixed(
          2
        )} (including $${transactionFeePreview.toFixed(2)} transaction fee). Contact admin for funding.`,
        currentBalance: currentBalance,
        requiredAmount: totalNeeded,
        betAmount: parseFloat(amount),
        transactionFee: transactionFeePreview,
      });
    }

    // Calculate shares (simplified: 1 USDC = 100 shares at current price)
    const totalVolume = parseFloat(market.yes_volume) + parseFloat(market.no_volume);
    const currentPrice = totalVolume > 0 ? parseFloat(market.yes_volume) / totalVolume : 0.5;
    const price = side ? currentPrice : 1 - currentPrice;
    const shares = parseFloat(amount) / Math.max(price, 0.01); // Minimum price of 1¢

    // Create position in database
    const transactionFee = parseFloat(amount) * 0.02; // 2% transaction fee
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .insert({
        user_id: dbUserId,
        market_id: marketId,
        side: side,
        amount: parseFloat(amount),
        shares: shares,
        price: price,
        transaction_fee: transactionFee,
      })
      .select()
      .single();

    if (positionError) {
      // Handle unique constraint race (if you add UNIQUE(user_id, market_id))
      if (
        positionError.code === '23505' ||
        (positionError.message && positionError.message.toLowerCase().includes('unique')) ||
        (positionError.details && String(positionError.details).toLowerCase().includes('unique'))
      ) {
        console.warn('⚠️ Unique violation on positions (user already bet this market).');
        return res.status(409).json({ error: 'You can only place one bet on this market.' });
      }
      console.error('Error creating position:', positionError);
      throw positionError;
    }

    // Update market stats
    let updatedMarket;
    if (!usingMockDatabase) {
      updatedMarket = await Market.updateStats(marketId, amount, side);
    } else {
      // For mock database, manually update market stats
      const currentYesVolume = parseFloat(market.yes_volume || 0);
      const currentNoVolume = parseFloat(market.no_volume || 0);
      const betAmount = parseFloat(amount);

      const updatedMarketFields = {
        yes_volume: side ? currentYesVolume + betAmount : currentYesVolume,
        no_volume: !side ? currentNoVolume + betAmount : currentNoVolume,
        total_volume: parseFloat(market.total_volume || 0) + betAmount,
        total_bets: (market.total_bets || 0) + 1,
      };

      const { data: mktUpd } = await supabase
        .from('markets')
        .update(updatedMarketFields)
        .eq('id', marketId)
        .select()
        .single();
      updatedMarket = mktUpd || { ...market, ...updatedMarketFields };
      console.log(`🔧 Updated mock market stats: YES=$${updatedMarket.yes_volume}, NO=$${updatedMarket.no_volume}`);
    }

    // ✅ LOG A TREND POINT so the graph can zig-zag
    try {
      await Market.logTrendPointFromMarket(updatedMarket);
    } catch (trendErr) {
      console.warn('⚠️ Failed to log trend point:', trendErr);
      // non-fatal for the user flow
    }

    // ✅ DEDUCT BET AMOUNT FROM USER BALANCE (for all users)
    // Re-fetch user to get the most up-to-date balance data
    const { data: latestUser, error: refetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
      .single();

    if (refetchError || !latestUser) {
      console.error('❌ Failed to refetch user data:', refetchError);
      // Rollback created position if user refetch fails
      await supabase.from('positions').delete().eq('id', position.id);
      throw new Error('Failed to refetch user data: ' + (refetchError?.message || 'User not found'));
    }

    const latestBalance = parseFloat(
      latestUser.mock_balance !== undefined && latestUser.mock_balance !== null
        ? latestUser.mock_balance
        : latestUser.usdc_balance || 0
    );
    const totalCost = parseFloat(amount) + transactionFee; // Include transaction fee
    const newBalance = latestBalance - totalCost;

    // Ensure balance doesn't go negative (double-check)
    if (newBalance < 0) {
      console.error(
        `❌ Balance would go negative: $${latestBalance} - $${totalCost} (${amount} + ${transactionFee} fee) = $${newBalance}`
      );
      // Rollback the position if balance would be negative
      await supabase.from('positions').delete().eq('id', position.id);
      throw new Error('Insufficient balance - transaction rolled back');
    }

    // Update the appropriate balance column
    const updateData = { updated_at: new Date().toISOString() };
    if (latestUser.mock_balance !== undefined && latestUser.mock_balance !== null) {
      updateData.mock_balance = newBalance;
      console.log(`💰 Updating mock_balance: $${latestBalance} → $${newBalance}`);
    } else {
      updateData.usdc_balance = newBalance;
      console.log(`💰 Updating usdc_balance (fallback): $${latestBalance} → $${newBalance}`);
    }

    const { error: balanceUpdateError } = await supabase.from('users').update(updateData).eq('id', dbUserId);

    if (balanceUpdateError) {
      console.error('❌ Failed to update user balance:', balanceUpdateError);
      // Rollback the position if balance update fails
      await supabase.from('positions').delete().eq('id', position.id);
      throw new Error('Failed to update user balance: ' + balanceUpdateError.message);
    }

    console.log(`✅ Successfully updated user balance: $${latestBalance} → $${newBalance}`);
    console.log('✅ Bet placed successfully:', position.id);

    res.status(201).json({
      success: true,
      position,
      message: `Bet placed: ${side ? 'YES' : 'NO'} for $${amount}`,
    });
  } catch (error) {
    console.error('❌ Error placing bet:', error);
    res.status(500).json({ error: 'Failed to place bet', details: error.message });
  }
});


// --- existing recent-bets endpoint (unchanged, kept for marquee ticker) ---
router.get('/recent-bets', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const sinceMin = Math.min(parseInt(req.query.sinceMin || '120', 10), 1440); // cap 24h
    const sinceISO = new Date(Date.now() - sinceMin * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('positions')
      .select(`
        id,
        amount,
        side,
        created_at,
        markets (
          id,
          question
        ),
        users (
          id,
          username,
          email,
          avatar_url
        )
      `)
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const bets = (data || []).map(p => {
      const user = p.users || {};
      const market = p.markets || {};
      const email = user.email || '';
      const handleFromEmail = email ? `@${email.split('@')[0]}` : null;
      const userHandle = user.username
        ? `@${user.username}`
        : handleFromEmail || '@anon';

      return {
        id: p.id,
        ts: Date.parse(p.created_at) || Date.now(),
        amount: Number(p.amount) || 0,
        side: p.side === true || String(p.side).toUpperCase() === 'YES' ? 'YES' : 'NO',
        marketId: market.id,
        marketQuestion: market.question || '—',
        userId: user.id,
        userHandle,
        avatarUrl: user.avatar_url || 'https://placehold.co/28x28'
      };
    });

    res.json({ bets });
  } catch (err) {
    console.error('recent-bets error:', err);
    res.status(500).json({ error: 'Failed to fetch recent bets' });
  }
});

module.exports = router;
