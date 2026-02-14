-- Initial Data for FlowHub

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
