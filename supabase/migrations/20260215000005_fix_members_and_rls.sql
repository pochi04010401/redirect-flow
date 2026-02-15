-- Fix: Ensure members exist and RLS allows select

-- 1. Insert members if not exist
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

-- 2. Make sure RLS is correct
DROP POLICY IF EXISTS "Allow authenticated select members" ON members;
CREATE POLICY "Allow authenticated select members" ON members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert tasks" ON tasks;
CREATE POLICY "Allow authenticated insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
