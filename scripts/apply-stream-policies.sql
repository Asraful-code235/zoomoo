-- Apply database policies to fix stream creation issues
-- Run this in your Supabase SQL Editor

-- First, ensure the mux_stream_id column exists
ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS mux_stream_id VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN streams.mux_stream_id IS 'Actual Mux Live Stream ID from Mux API';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access to streams" ON streams;
DROP POLICY IF EXISTS "Allow admin create streams" ON streams;
DROP POLICY IF EXISTS "Allow admin update streams" ON streams;
DROP POLICY IF EXISTS "Allow admin delete streams" ON streams;
DROP POLICY IF EXISTS "Allow all insert on streams for testing" ON streams;
DROP POLICY IF EXISTS "Allow all update on streams for testing" ON streams;
DROP POLICY IF EXISTS "Allow all delete on streams for testing" ON streams;

-- Create comprehensive policies for streams
-- 1. Allow public read access (for viewing streams)
CREATE POLICY "Public read access to streams" ON streams
    FOR SELECT
    USING (true);

-- 2. Temporary permissive policies for testing
-- These allow any operation on streams - replace with proper admin policies later
CREATE POLICY "Allow all insert on streams for testing" ON streams
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all update on streams for testing" ON streams
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow all delete on streams for testing" ON streams
    FOR DELETE
    USING (true);

-- Ensure RLS is enabled
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'streams';

-- Show table structure (alternative to \d command)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'streams' 
ORDER BY ordinal_position;
