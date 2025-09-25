-- Safe version that won't error if policies already exist

-- Drop and recreate policies safely
DROP POLICY IF EXISTS "Allow all insert on markets" ON markets;
DROP POLICY IF EXISTS "Allow all select on markets" ON markets;
DROP POLICY IF EXISTS "Allow all update on markets" ON markets;
DROP POLICY IF EXISTS "Allow all delete on markets" ON markets;

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
