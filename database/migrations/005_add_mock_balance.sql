-- Add mock_balance column for betting system
-- This is separate from usdc_balance (which represents real USDC)

ALTER TABLE users 
ADD COLUMN mock_balance DECIMAL(20, 6) DEFAULT 0.00;

-- Add index for better performance
CREATE INDEX idx_users_mock_balance ON users(mock_balance);

-- Update existing users to have 0 mock balance
UPDATE users SET mock_balance = 0.00 WHERE mock_balance IS NULL;

-- Add constraint to ensure mock_balance is not negative
ALTER TABLE users 
ADD CONSTRAINT check_mock_balance_positive 
CHECK (mock_balance >= 0);
