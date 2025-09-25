-- Fix RLS policies for markets table to allow admin operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin create markets" ON markets;
DROP POLICY IF EXISTS "Allow public read markets" ON markets;
DROP POLICY IF EXISTS "Allow admin update markets" ON markets;

-- Create more permissive policies for testing
CREATE POLICY "Allow all insert on markets" ON markets
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all select on markets" ON markets
    FOR SELECT
    USING (true);

CREATE POLICY "Allow all update on markets" ON markets
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow all delete on markets" ON markets
    FOR DELETE
    USING (true);

-- Ensure RLS is enabled
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
