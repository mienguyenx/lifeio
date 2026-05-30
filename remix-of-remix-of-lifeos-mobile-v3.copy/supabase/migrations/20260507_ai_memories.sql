-- AI Memories table
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON ai_memories;
CREATE POLICY "Admin full access" ON ai_memories
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users read own memories" ON ai_memories;
CREATE POLICY "Users read own memories" ON ai_memories
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_memories_updated_at ON ai_memories;
CREATE TRIGGER ai_memories_updated_at
  BEFORE UPDATE ON ai_memories
  FOR EACH ROW EXECUTE FUNCTION update_ai_memories_updated_at();
