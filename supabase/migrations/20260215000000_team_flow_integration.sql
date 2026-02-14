-- FlowHub Unified Database Schema (Merged RedirectFlow + TeamFlow)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. RedirectFlow Tables
-- ============================================

CREATE TABLE IF NOT EXISTS redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  notification_email TEXT,
  notification_frequency TEXT DEFAULT 'none' CHECK (notification_frequency IN ('none', 'daily_6am')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redirect_id UUID REFERENCES redirects(id) ON DELETE CASCADE,
  param_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redirects_slug ON redirects(slug);
CREATE INDEX IF NOT EXISTS idx_access_logs_redirect_id ON access_logs(redirect_id);

-- ============================================
-- 2. TeamFlow Tables
-- ============================================

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount BIGINT DEFAULT 0,
  points INTEGER DEFAULT 0,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'deleted')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  scheduled_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL UNIQUE,
  target_amount BIGINT DEFAULT 0,
  target_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_member_id ON tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);

-- ============================================
-- 3. Functions & Stats
-- ============================================

CREATE OR REPLACE FUNCTION get_redirect_stats()
RETURNS TABLE(redirect_id UUID, total_count BIGINT, unique_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.redirect_id,
    COUNT(*) as total_count,
    COUNT(DISTINCT al.ip_address) as unique_count
  FROM access_logs al
  GROUP BY al.redirect_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. RLS & Permissions for TeamFlow
-- ============================================

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

-- ============================================
-- 5. Initial Data
-- ============================================

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
