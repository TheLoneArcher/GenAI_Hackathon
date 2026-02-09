-- 1. Ensure Admins can manage profiles
-- Add a policy where users with 'admin' role can update any profile
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Performance index for Agent Logs (to quickly fetch latest steps)
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);

-- 3. Optional: Add 'last_action' to agents table for faster UI lookups
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_action TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;
