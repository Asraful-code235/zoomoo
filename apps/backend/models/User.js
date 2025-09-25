const { supabase, usingMockDatabase } = require('../lib/supabase');

class User {
  // Create or update user from Privy authentication
  static async upsertFromPrivy(privyUser) {
    try {
      console.log('🔧 USER MODEL: Processing Privy user for upsert');
      console.log('🔧 USER MODEL: Privy user structure:', JSON.stringify(privyUser, null, 2));
      
      // Extract Solana wallet address - prioritize Solana wallets
      let walletAddress = null;
      
      console.log('🔧 USER MODEL: Looking for Solana wallet...');
      
      // Check linkedAccounts for Solana wallet first (most reliable)
      if (privyUser.linkedAccounts) {
        console.log('🔧 USER MODEL: Checking linkedAccounts:', privyUser.linkedAccounts.length);
        
        // Look for Solana wallet specifically
        const solanaWallet = privyUser.linkedAccounts.find(account => 
          account.type === 'wallet' && 
          (account.chainType === 'solana' || account.chain_type === 'solana')
        );
        
        if (solanaWallet) {
          walletAddress = solanaWallet.address;
          console.log('✅ USER MODEL: Found Solana wallet in linkedAccounts:', walletAddress);
        } else {
          // No fallback to EVM wallets - Solana only project
          console.log('❌ USER MODEL: No Solana wallet found in linkedAccounts');
        }
      }
      
      // No fallback to embedded wallet - these are typically EVM wallets
      // Users must have Solana wallets created via useSolanaWallets hook
      
      // Validate that we have a Solana address (not EVM)
      if (walletAddress) {
        // Solana addresses are base58 and typically 32-44 characters
        // EVM addresses start with 0x and are 42 characters
        if (walletAddress.startsWith('0x')) {
          console.log('❌ USER MODEL: Detected EVM address, rejecting:', walletAddress);
          walletAddress = null;
        } else {
          console.log('✅ USER MODEL: Valid Solana address detected:', walletAddress);
        }
      }
      
      if (!walletAddress) {
        console.log('❌ USER MODEL: No valid Solana wallet address found!');
      }
      
      const userData = {
        privy_id: privyUser.id,
        email: privyUser.email?.address || privyUser.google?.email || null,
        username: privyUser.twitter?.username || privyUser.telegram?.username || null,
        wallet_address: walletAddress,
      };

      console.log('🔧 USER MODEL: Extracted user data:', userData);

      // Generate referral code if new user
      if (!userData.referral_code) {
        userData.referral_code = this.generateReferralCode();
      }

      console.log('🔧 USER MODEL: Final user data for upsert:', userData);

      const { data, error } = await supabase
        .from('users')
        .upsert(userData, { 
          onConflict: 'privy_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('🔧 USER MODEL: Supabase upsert error:', error);
        throw error;
      }
      
      console.log('🔧 USER MODEL: Upsert successful:', data);
      return data;
    } catch (error) {
      console.error('❌ USER MODEL: Error upserting user:', error);
      throw error;
    }
  }

  // Get user by Privy ID
  static async getByPrivyId(privyId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('privy_id', privyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If user doesn't exist and we're using mock database, create them
        if (usingMockDatabase && error.code === 'PGRST116') {
          console.log(`🔧 Auto-creating user in mock database: ${privyId}`);
          return supabase.createUser({ privy_id: privyId });
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Get user by wallet address
  static async getByWalletAddress(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user by wallet:', error);
      throw error;
    }
  }

  // Update user balance (prioritizes mock_balance, fallback to usdc_balance)
  static async updateBalance(userId, newBalance) {
    try {
      // First get the user to check which balance column exists
      const { data: user, error: getUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (getUserError) throw getUserError;

      // Determine which balance column to update
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Prioritize mock_balance if it exists, fallback to usdc_balance
      if (user.mock_balance !== undefined) {
        updateData.mock_balance = newBalance;
      } else {
        updateData.usdc_balance = newBalance;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }

  // Update user mock balance specifically (admin operations)
  static async updateMockBalance(userId, newBalance) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          mock_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating mock balance:', error);
      throw error;
    }
  }

  // Update user stats after bet
  static async updateStats(userId, isWin, earnings = 0) {
    try {
      const user = await this.getByPrivyId(userId);
      if (!user) throw new Error('User not found');

      const newWinRate = user.total_bets === 0 ? 
        (isWin ? 1 : 0) : 
        ((user.win_rate * user.total_bets) + (isWin ? 1 : 0)) / (user.total_bets + 1);

      const newStreak = isWin ? user.prediction_streak + 1 : 0;

      const { data, error } = await supabase
        .from('users')
        .update({
          total_bets: user.total_bets + 1,
          total_earnings: user.total_earnings + earnings,
          win_rate: newWinRate,
          prediction_streak: newStreak,
          longest_streak: Math.max(user.longest_streak, newStreak),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Get leaderboard by earnings
  static async getLeaderboard(timeframe = 'all', limit = 100) {
    try {
      let query = supabase
        .from('users')
        .select('id, username, email, total_earnings, total_bets, win_rate, prediction_streak')
        .order('total_earnings', { ascending: false })
        .limit(limit);

      // Add time filters for weekly/monthly
      if (timeframe === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('updated_at', weekAgo.toISOString());
      } else if (timeframe === 'monthly') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('updated_at', monthAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Generate random referral code
  static generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Check admin status
  static async getAdminRole(userId) {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.role || null;
    } catch (error) {
      console.error('Error checking admin role:', error);
      throw error;
    }
  }
}

module.exports = User;
