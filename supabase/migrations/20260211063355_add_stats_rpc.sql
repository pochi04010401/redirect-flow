-- Aggregation function for real-time stats
CREATE OR REPLACE FUNCTION get_redirect_stats()
RETURNS TABLE (
  redirect_id UUID,
  total_count BIGINT,
  unique_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.redirect_id,
    COUNT(*)::BIGINT as total_count,
    COUNT(DISTINCT l.param_id)::BIGINT as unique_count
  FROM access_logs l
  GROUP BY l.redirect_id;
END;
$$;
