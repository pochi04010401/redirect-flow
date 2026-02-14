-- RLS & Permissions for TeamFlow

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Simple authenticated policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated select members') THEN
        CREATE POLICY "Allow authenticated select members" ON members FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert members') THEN
        CREATE POLICY "Allow authenticated insert members" ON members FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update members') THEN
        CREATE POLICY "Allow authenticated update members" ON members FOR UPDATE TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated select tasks') THEN
        CREATE POLICY "Allow authenticated select tasks" ON tasks FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert tasks') THEN
        CREATE POLICY "Allow authenticated insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update tasks') THEN
        CREATE POLICY "Allow authenticated update tasks" ON tasks FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated delete tasks') THEN
        CREATE POLICY "Allow authenticated delete tasks" ON tasks FOR DELETE TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated select goals') THEN
        CREATE POLICY "Allow authenticated select goals" ON monthly_goals FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert goals') THEN
        CREATE POLICY "Allow authenticated insert goals" ON monthly_goals FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update goals') THEN
        CREATE POLICY "Allow authenticated update goals" ON monthly_goals FOR UPDATE TO authenticated USING (true);
    END IF;
END
$$;

-- Initial Data
INSERT INTO members (name, color) VALUES
  ('田中さん', '#FFB3BA'),
  ('佐藤さん', '#BAFFC9'),
  ('鈴木さん', '#BAE1FF'),
  ('高橋さん', '#FFFFBA'),
  ('伊藤さん', '#FFDFbA'),
  ('渡辺さん', '#E0BBE4'),
  ('山本さん', '#957DAD'),
  ('中村さん', '#D4A5A5')
ON CONFLICT DO NOTHING;

INSERT INTO monthly_goals (month, target_amount, target_points) VALUES
  (TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 10000000, 1000)
ON CONFLICT DO NOTHING;
