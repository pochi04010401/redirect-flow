-- Cleanup members and add unique constraint
DELETE FROM members a USING members b WHERE a.id < b.id AND a.name = b.name;
ALTER TABLE members ADD CONSTRAINT members_name_key UNIQUE (name);

-- Allow public select for members (since they are just names/colors, no sensitive info)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select members" ON members;
CREATE POLICY "Allow public select members" ON members FOR SELECT USING (true);

-- Ensure tasks can be inserted by authenticated users
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated insert tasks" ON tasks;
CREATE POLICY "Allow authenticated insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated select tasks" ON tasks;
CREATE POLICY "Allow authenticated select tasks" ON tasks FOR SELECT TO authenticated USING (true);
