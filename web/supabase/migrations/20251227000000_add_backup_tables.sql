-- =====================================================
-- BACKUP HISTORY & PROGRESS TRACKING TABLES
-- =====================================================

-- Backup History Table
CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL DEFAULT 'google_drive', -- 'google_drive', 'local', 's3', etc.
  file_name TEXT NOT NULL,
  file_id TEXT, -- Google Drive file ID or other storage ID
  file_size BIGINT, -- Size in bytes
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional backup metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backup Progress Table (for real-time tracking)
CREATE TABLE IF NOT EXISTS public.backup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_history_id UUID NOT NULL REFERENCES public.backup_history(id) ON DELETE CASCADE,
  step TEXT NOT NULL, -- 'preparing', 'uploading', 'verifying', etc.
  progress INTEGER DEFAULT 0, -- 0-100
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backup Settings Table (admin configuration)
CREATE TABLE IF NOT EXISTS public.backup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backup_history_user_id ON public.backup_history(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON public.backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON public.backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_progress_backup_id ON public.backup_progress(backup_history_id);
CREATE INDEX IF NOT EXISTS idx_backup_progress_created_at ON public.backup_progress(created_at DESC);

-- RLS Policies
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own backup history
CREATE POLICY "Users can view own backup history" ON public.backup_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own backups
CREATE POLICY "Users can create own backups" ON public.backup_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own backups
CREATE POLICY "Users can update own backups" ON public.backup_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all backups
CREATE POLICY "Admins can view all backups" ON public.backup_history
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all backups
CREATE POLICY "Admins can manage all backups" ON public.backup_history
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Users can view progress for their own backups
CREATE POLICY "Users can view own backup progress" ON public.backup_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.backup_history 
      WHERE backup_history.id = backup_progress.backup_history_id 
      AND backup_history.user_id = auth.uid()
    )
  );

-- Users can create progress for their own backups
CREATE POLICY "Users can create own backup progress" ON public.backup_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.backup_history 
      WHERE backup_history.id = backup_progress.backup_history_id 
      AND backup_history.user_id = auth.uid()
    )
  );

-- Admins can view all progress
CREATE POLICY "Admins can view all backup progress" ON public.backup_progress
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all progress
CREATE POLICY "Admins can manage all backup progress" ON public.backup_progress
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage backup settings
CREATE POLICY "Admins can manage backup settings" ON public.backup_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can view backup settings (to check if feature is enabled)
CREATE POLICY "Everyone can view backup settings" ON public.backup_settings
  FOR SELECT USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_backup_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backup_history_updated_at
  BEFORE UPDATE ON public.backup_history
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_history_updated_at();

CREATE TRIGGER backup_settings_updated_at
  BEFORE UPDATE ON public.backup_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_history_updated_at();

-- Insert default backup settings
INSERT INTO public.backup_settings (key, value, description, is_enabled) VALUES
  ('google_drive_enabled', '{"enabled": false}', 'Enable Google Drive backup feature', false),
  ('google_drive_client_id', '{"value": ""}', 'Google Drive Client ID', true),
  ('google_drive_api_key', '{"value": ""}', 'Google Drive API Key', true),
  ('backup_frequency', '{"frequency": "daily"}', 'Default backup frequency', true),
  ('auto_backup_enabled', '{"enabled": false}', 'Enable automatic backups', false),
  ('backup_retention_days', '{"days": 30}', 'Number of days to keep backups', true)
ON CONFLICT (key) DO NOTHING;

