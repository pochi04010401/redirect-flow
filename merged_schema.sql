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

-- Function for Redirect Stats
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
