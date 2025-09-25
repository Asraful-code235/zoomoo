#!/usr/bin/env node

/**
 * Script to fund a user with mock balance for testing
 * Usage: node scripts/fund-user.js <user-privy-id> <amount>
 * Example: node scripts/fund-user.js did:privy:clxxx123 100
 */

const { supabase } = require('../lib/supabase');
const User = require('../models/User');

async function fundUser(privyId, amount) {
  try {
    console.log(`🎯 Funding user ${privyId} with $${amount}...`);

    // Validate amount
    const fundAmount = parseFloat(amount);
    if (isNaN(fundAmount) || fundAmount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    if (fundAmount > 10000) {
      throw new Error('Maximum funding amount is $10,000');
    }

    // Get user by Privy ID
    let user = await User.getByPrivyId(privyId);
    
    if (!user) {
      console.log('🔄 User not found, creating new user...');
      // Auto-create user with basic data
      const userData = {
        privy_id: privyId,
        email: `user-${privyId.slice(-8)}@temp.com`,
        wallet_address: 'temp-wallet-address',
        username: `User${privyId.slice(-8)}`,
        usdc_balance: 0.00,
        mock_balance: 0.00, // Start with 0 mock balance
        total_earnings: 0,
        total_bets: 0,
        win_rate: 0,
        prediction_streak: 0,
        longest_streak: 0
      };

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      user = newUser;
      console.log(`✅ Created new user: ${user.id}`);
    }

    // Get current balance
    const currentBalance = parseFloat(
      user.mock_balance !== undefined && user.mock_balance !== null 
        ? user.mock_balance 
        : user.usdc_balance || 0
    );
    
    const newBalance = currentBalance + fundAmount;

    // Update balance (prefer mock_balance if column exists)
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (user.mock_balance !== undefined) {
      updateData.mock_balance = newBalance;
      console.log(`💰 Updating mock_balance: $${currentBalance} → $${newBalance}`);
    } else {
      updateData.usdc_balance = newBalance;
      console.log(`💰 Updating usdc_balance (fallback): $${currentBalance} → $${newBalance}`);
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`);
    }

    console.log(`✅ Successfully funded user!`);
    console.log(`   User: ${privyId}`);
    console.log(`   Previous Balance: $${currentBalance.toFixed(2)}`);
    console.log(`   Added: $${fundAmount.toFixed(2)}`);
    console.log(`   New Balance: $${newBalance.toFixed(2)}`);

    return { success: true, user, oldBalance: currentBalance, newBalance };

  } catch (error) {
    console.error(`❌ Error funding user:`, error);
    return { success: false, error: error.message };
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('Usage: node scripts/fund-user.js <user-privy-id> <amount>');
    console.log('Example: node scripts/fund-user.js did:privy:clxxx123 100');
    process.exit(1);
  }

  const [privyId, amount] = args;
  
  fundUser(privyId, amount).then(result => {
    if (result.success) {
      console.log('🎉 Funding completed successfully!');
      process.exit(0);
    } else {
      console.error('💥 Funding failed:', result.error);
      process.exit(1);
    }
  });
}

module.exports = { fundUser };
