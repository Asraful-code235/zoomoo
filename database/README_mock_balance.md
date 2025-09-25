# Adding Mock Balance Column

## Current Status
The system is coded to use `mock_balance` column but falls back to `usdc_balance` when `mock_balance` doesn't exist.

## To Add Mock Balance Column in Supabase

1. **Go to Supabase Dashboard**
2. **Navigate to:** Table Editor → `users` table
3. **Add New Column:**
   - **Name:** `mock_balance`
   - **Type:** `numeric` (decimal)
   - **Default Value:** `0.00`
   - **Allow NULL:** `false`
   - **Description:** "Mock balance for betting (separate from real USDC)"

## After Adding the Column

Once the column exists, the system will automatically:
- ✅ **Admin funding** → Updates `mock_balance` instead of `usdc_balance`
- ✅ **Betting system** → Uses `mock_balance` for all betting operations
- ✅ **Frontend display** → Shows `mock_balance` in admin panel and betting balance
- ✅ **Clear separation** → Real USDC (`usdc_balance`) vs Mock money (`mock_balance`)

## Current Behavior (Without mock_balance column)
- Uses `usdc_balance` as fallback for all betting operations
- System works but doesn't distinguish between real/mock funds
- All existing balances will be treated as mock money

## Benefits of Adding mock_balance Column
- 🎯 **Clear separation** between real blockchain USDC and mock betting funds
- 💰 **Admin control** over mock funding without affecting real balances
- 🔒 **Safety** - No accidental mixing of real and mock funds
- 📊 **Better tracking** of mock vs real money in the system
