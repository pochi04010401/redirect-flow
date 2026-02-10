-- RedirectFlow Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Redirects table
CREATE TABLE redirects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL, -- 12 random characters
  target_url TEXT NOT NULL,
  notification_email TEXT,
  notification_frequency TEXT DEFAULT 'none' CHECK (notification_frequency IN ('none', 'daily_6am')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Access logs table
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redirect_id UUID REFERENCES redirects(id) ON DELETE CASCADE,
  param_id TEXT, -- The "id" parameter from URL
  ip_address TEXT, -- For unique user counting
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_redirects_slug ON redirects(slug);
CREATE INDEX idx_access_logs_redirect_id ON access_logs(redirect_id);
CREATE INDEX idx_access_logs_param_id ON access_logs(param_id);

-- RLS (Row Level Security) - Basic setup
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to redirects for everyone (needed for the redirect logic)
CREATE POLICY "Allow public read of redirects" ON redirects FOR SELECT USING (true);

-- Access logs only insertable by anyone (public API), but readable by authenticated users
CREATE POLICY "Allow public insert of access logs" ON access_logs FOR INSERT WITH CHECK (true);

-- Admin policies (Authenticated users can do everything)
CREATE POLICY "Allow admin full access to redirects" ON redirects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access to access logs" ON access_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
