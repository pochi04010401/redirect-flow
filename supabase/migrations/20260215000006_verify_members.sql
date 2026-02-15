-- Verify members
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON members TO anon;
