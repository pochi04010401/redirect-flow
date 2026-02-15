-- Restore RLS after testing
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Ensure authenticated policies are active
DO $$
BEGIN
    -- This is idempotent since we check if policy doesn't exist, 
    -- but here we just want to make sure RLS is ON.
    -- The policies from 20260215000001 should still be there.
    NULL;
END
$$;
