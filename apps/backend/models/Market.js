const { supabase } = require('../lib/supabase');

class Market {
  // Create new market

  // Create new market (Hard-reset trend history for the stream)
  static async create(marketData) {
    try {
      console.log('🎯 Creating market in database:', marketData);

      const insertData = {
        stream_id: marketData.streamId,
        template_id: marketData.templateId,
        admin_id: marketData.adminId,
        question: marketData.question,
        description: marketData.description,
        ends_at: marketData.endsAt.toISOString(),
        status: 'active',
        yes_volume: 0,
        no_volume: 0,
        total_volume: 0,
        total_bets: 0
      };

      console.log('📊 Insert data prepared:', insertData);

      const { data, error } = await supabase
        .from('markets')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error details:', error);
        throw error;
      }

      console.log('💾 Market saved to database:', data.id);

      // 🔥 OPTION C: Hard reset trend points for this stream
      try {
        console.log('🧹 Deleting prior trend_points for stream:', data.stream_id);
        const { error: delErr } = await supabase
          .from('trend_points')
          .delete()
          .eq('stream_id', data.stream_id);

        if (delErr) {
          console.warn('⚠️ Failed to delete prior trend_points:', delErr.message || delErr);
        } else {
          console.log('✅ Cleared prior trend_points for stream:', data.stream_id);
        }
      } catch (wipeErr) {
        console.warn('⚠️ Trend wipe try/catch hit:', wipeErr?.message || wipeErr);
      }

      // Log a fresh baseline point for the new market (0/0 → chart starts clean)
      try {
        await Market.logTrendPointFromMarket(data);
        console.log('📈 Wrote initial trend point for new market');
      } catch (e) {
        console.warn('⚠️ Could not write initial trend point:', e?.message || e);
      }

      return data;
    } catch (error) {
      console.error('❌ Market.create error:', error);
      throw error;
    }
  }

  


  // Get all active markets
  static async getAllActive() {
    try {
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
        .eq('status', 'active')
        .eq('streams.is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching active markets:', error);
      throw error;
    }
  }

  // Get markets for a specific stream
  static async getByStreamId(streamId) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select(`
          *,
          users!admin_id (
            username,
            email
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stream markets:', error);
      throw error;
    }
  }

  // Get market by ID
  static async getById(marketId) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select(`
          *,
          streams!inner (
            id,
            name,
            hamster_name
          ),
          users!admin_id (
            username,
            email
          )
        `)
        .eq('id', marketId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching market:', error);
      throw error;
    }
  }

  // Resolve market
  static async resolve(marketId, outcome, resolutionNotes, adminId) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .update({
          status: 'resolved',
          outcome: outcome,
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', marketId)
        .eq('admin_id', adminId) // Only the creating admin can resolve
        .select()
        .single();

      if (error) throw error;

      // Implement payout logic
      await Market.processPayouts(marketId, outcome);

      // Log a final trend point after resolution
      try {
        await Market.logTrendPointFromMarket(data);
      } catch (e) {
        console.warn('⚠️ Failed to write trend point on resolve:', e?.message || e);
      }

      return data;
    } catch (error) {
      console.error('Error resolving market:', error);
      throw error;
    }
  }

  // Process payouts for resolved market
  static async processPayouts(marketId, outcome) {
    try {
      console.log(`💰 Processing payouts for market ${marketId}, outcome: ${outcome ? 'YES' : 'NO'}`);

      // Get all positions for this market
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('market_id', marketId);

      if (positionsError) throw positionsError;

      if (positions.length === 0) {
        console.log('📭 No positions found for market');
        return;
      }

      // Separate winners and losers
      const winners = positions.filter(position => position.side === outcome);
      const losers = positions.filter(position => position.side !== outcome);

      console.log(`🎯 Winners: ${winners.length}, Losers: ${losers.length}`);

      // Calculate total payout pool (all losing bets)
      const totalPool = losers.reduce((sum, position) => sum + parseFloat(position.amount), 0);
      const totalWinningShares = winners.reduce((sum, position) => sum + parseFloat(position.shares), 0);

      console.log(`💸 Total payout pool: $${totalPool}, Total winning shares: ${totalWinningShares}`);

      // Process each position
      for (const position of positions) {
        const isWinner = position.side === outcome;
        let payout = 0;

        if (isWinner && totalWinningShares > 0) {
          // Winner gets their original bet + share of losing pool
          const originalBet = parseFloat(position.amount);
          const shareOfPool = (parseFloat(position.shares) / totalWinningShares) * totalPool;
          payout = originalBet + shareOfPool;
        }
        // Losers get 0 payout (they lose their bet)

        // Update position with payout and winner status
        const { error: updateError } = await supabase
          .from('positions')
          .update({
            is_winner: isWinner,
            payout: payout,
            updated_at: new Date().toISOString()
          })
          .eq('id', position.id);

        if (updateError) {
          console.error(`❌ Failed to update position ${position.id}:`, updateError);
          continue;
        }

        // Credit winner's balance
        if (isWinner && payout > 0) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('mock_balance, usdc_balance')
            .eq('id', position.user_id)
            .single();

          if (userError) {
            console.error(`❌ Failed to get user ${position.user_id}:`, userError);
            continue;
          }

          // Add payout to appropriate balance
          const currentBalance = parseFloat(
            user.mock_balance !== undefined && user.mock_balance !== null
              ? user.mock_balance
              : user.usdc_balance || 0
          );
          const newBalance = currentBalance + payout;

          const updateData = { updated_at: new Date().toISOString() };
          if (user.mock_balance !== undefined && user.mock_balance !== null) {
            updateData.mock_balance = newBalance;
          } else {
            updateData.usdc_balance = newBalance;
          }

          const { error: balanceError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', position.user_id);

          if (balanceError) {
            console.error(`❌ Failed to update balance for user ${position.user_id}:`, balanceError);
          } else {
            console.log(`✅ Paid out $${payout.toFixed(2)} to user ${position.user_id}`);
          }
        }
      }

      console.log(`🎉 Payout processing completed for market ${marketId}`);
    } catch (error) {
      console.error('❌ Error processing payouts:', error);
      throw error;
    }
  }

  // End market (when time expires)
  static async endMarket(marketId) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .update({
          status: 'ended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', marketId)
        .eq('status', 'active')
        .select()
        .single();

      if (error) throw error;

      // Log trend snapshot at end time
      try {
        await Market.logTrendPointFromMarket(data);
      } catch (e) {
        console.warn('⚠️ Failed to write trend point on endMarket:', e?.message || e);
      }

      return data;
    } catch (error) {
      console.error('Error ending market:', error);
      throw error;
    }
  }

  // Cancel market and refund all positions
  static async cancel(marketId, reason, adminId) {
    try {
      console.log('🚫 Starting market cancellation:', marketId, 'Reason:', reason);
      
      // Get current market data
      const market = await this.getById(marketId);
      if (!market) throw new Error('Market not found');

      // Only allow cancellation of active or ended markets (not already resolved/cancelled)
      if (!['active', 'ended'].includes(market.status)) {
        throw new Error('Only active or ended markets can be cancelled');
      }

      // Get all positions for this market
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          users (
            id,
            username,
            email,
            mock_balance,
            usdc_balance
          )
        `)
        .eq('market_id', marketId);

      if (positionsError) throw positionsError;

      console.log(`💰 Found ${positions.length} positions to refund`);

      // Calculate total refunds per user
      const userRefunds = {};
      let totalRefundAmount = 0;

      positions.forEach(position => {
        const userId = position.user_id;
        const refundAmount = parseFloat(position.amount) + parseFloat(position.transaction_fee || 0);
        
        if (!userRefunds[userId]) {
          userRefunds[userId] = {
            user: position.users,
            totalRefund: 0,
            positions: []
          };
        }
        
        userRefunds[userId].totalRefund += refundAmount;
        userRefunds[userId].positions.push(position);
        totalRefundAmount += refundAmount;
      });

      console.log(`💸 Total refund amount: $${totalRefundAmount.toFixed(2)} for ${Object.keys(userRefunds).length} users`);

      // Process refunds for each user
      const refundPromises = Object.entries(userRefunds).map(async ([userId, refundData]) => {
        const user = refundData.user;
        const refundAmount = refundData.totalRefund;
        
        // Use mock_balance if available, otherwise usdc_balance
        const currentBalance = parseFloat(user.mock_balance !== undefined ? user.mock_balance : user.usdc_balance || 0);
        const newBalance = currentBalance + refundAmount;
        
        // Update user balance
        const balanceField = user.mock_balance !== undefined ? 'mock_balance' : 'usdc_balance';
        const { error: balanceError } = await supabase
          .from('users')
          .update({ [balanceField]: newBalance })
          .eq('id', userId);
          
        if (balanceError) {
          console.error(`❌ Failed to refund user ${userId}:`, balanceError);
          throw balanceError;
        }
        
        console.log(`✅ Refunded $${refundAmount.toFixed(2)} to user ${user.username || user.email} (${userId})`);
        
        return {
          userId,
          username: user.username,
          email: user.email,
          refundAmount,
          newBalance,
          positionCount: refundData.positions.length
        };
      });

      const refundResults = await Promise.all(refundPromises);

      // Mark market as cancelled
      const { data: cancelledMarket, error: cancelError } = await supabase
        .from('markets')
        .update({
          status: 'cancelled',
          outcome: null, // No outcome for cancelled markets
          resolution_notes: `Market cancelled by admin. Reason: ${reason}`,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', marketId)
        .select()
        .single();

      if (cancelError) throw cancelError;

      // Mark all positions as refunded (we could add a status field to positions table)
      const { error: positionsUpdateError } = await supabase
        .from('positions')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('market_id', marketId);

      if (positionsUpdateError) {
        console.warn('⚠️ Failed to update position status:', positionsUpdateError);
      }

      // Log a trend point even on cancel (snapshot)
      try {
        await Market.logTrendPointFromMarket(cancelledMarket);
      } catch (e) {
        console.warn('⚠️ Failed to write trend point on cancel:', e?.message || e);
      }

      console.log('✅ Market cancellation completed successfully');
      
      return {
        market: cancelledMarket,
        refunds: refundResults,
        totalRefunded: totalRefundAmount,
        positionsCount: positions.length
      };
      
    } catch (error) {
      console.error('❌ Error cancelling market:', error);
      throw error;
    }
  }

  // Renew/extend an ended market
  static async renew(marketId, additionalMinutes = 30, newQuestion = null) {
    try {
      // Get current market data
      const market = await this.getById(marketId);
      if (!market) throw new Error('Market not found');

      // Only allow renewal of ended markets
      if (market.status !== 'ended') {
        throw new Error('Only ended markets can be renewed');
      }

      // Calculate new end time
      const now = new Date();
      const newEndsAt = new Date(now.getTime() + additionalMinutes * 60 * 1000);

      // Prepare update data
      let updateData = {
        status: 'active',
        ends_at: newEndsAt.toISOString(),
        updated_at: now.toISOString(),
      };

      if (newQuestion) {
        updateData.question = newQuestion;
      }

      const { data, error } = await supabase
        .from('markets')
        .update(updateData)
        .eq('id', marketId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Market renewed successfully:', data.id);

      // Log a trend point after renewal (new period)
      try {
        await Market.logTrendPointFromMarket(data);
      } catch (e) {
        console.warn('⚠️ Failed to write trend point on renew:', e?.message || e);
      }

      return data;
    } catch (error) {
      console.error('Error renewing market:', error);
      throw error;
    }
  }

  // Update market volume and stats
  static async updateStats(marketId, betAmount, isYes) {
    try {
      // Get current market data
      const market = await this.getById(marketId);
      if (!market) throw new Error('Market not found');

      const newTotalVolume = parseFloat(market.total_volume || 0) + parseFloat(betAmount);
      const newTotalBets = (market.total_bets || 0) + 1;
      
      let updateData = {
        total_volume: newTotalVolume,
        total_bets: newTotalBets,
        updated_at: new Date().toISOString(),
      };

      if (isYes) {
        updateData.yes_volume = parseFloat(market.yes_volume || 0) + parseFloat(betAmount);
      } else {
        updateData.no_volume = parseFloat(market.no_volume || 0) + parseFloat(betAmount);
      }

      const { data, error } = await supabase
        .from('markets')
        .update(updateData)
        .eq('id', marketId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating market stats:', error);
      throw error;
    }
  }

  // 👇 NEW: insert a trend point based on a market row
  static async logTrendPointFromMarket(marketRow) {
    if (!marketRow) throw new Error('marketRow required');
    const payload = {
      stream_id: marketRow.stream_id,
      market_id: marketRow.id,
      // store raw vols so we can recompute pct consistently
      yes_volume: Number(marketRow.yes_volume || 0),
      no_volume: Number(marketRow.no_volume || 0),
      ts: new Date().toISOString()
    };

    const { error } = await supabase
      .from('trend_points')
      .insert(payload);

    if (error) throw error;

    return true;
  }

  // 👇 NEW: read trend points for a stream for the last N minutes (ordered asc)
  static async getStreamTrend(streamId, sinceMin = 180, limit = 2000) {
    const sinceISO = new Date(Date.now() - sinceMin * 60 * 1000).toISOString();

    // Prefer explicit trend_points if table exists; otherwise fallback to markets snapshot (coarse)
    try {
      const { data, error } = await supabase
        .from('trend_points')
        .select('ts, yes_volume, no_volume')
        .eq('stream_id', streamId)
        .gte('ts', sinceISO)
        .order('ts', { ascending: true })
        .limit(limit);

      if (error) throw error;
      if (data && data.length) return data;
    } catch (e) {
      console.warn('⚠️ trend_points read failed or table missing, falling back:', e?.message || e);
    }

    // Fallback: synthesize from markets (will look flatter)
    const { data: markets, error: mErr } = await supabase
      .from('markets')
      .select('created_at, ends_at, yes_volume, no_volume')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true });

    if (mErr) throw mErr;

    return (markets || []).map(m => ({
      ts: m.created_at || m.ends_at || new Date().toISOString(),
      yes_volume: Number(m.yes_volume || 0),
      no_volume: Number(m.no_volume || 0),
    }));
  }
}

module.exports = Market;
