-- Add renewal tracking fields to markets table
ALTER TABLE markets 
ADD COLUMN renewal_count INTEGER DEFAULT 0,
ADD COLUMN renewed_at TIMESTAMP WITH TIME ZONE[];

-- Add index for better performance when querying renewed markets
CREATE INDEX idx_markets_renewal_count ON markets(renewal_count);

-- Update existing markets to have renewal_count = 0
UPDATE markets SET renewal_count = 0 WHERE renewal_count IS NULL;
