-- =====================================================
-- GOOGLE DRIVE TOKENS TABLE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Google Drive Tokens Table
CREATE TABLE IF NOT EXISTS public.google_drive_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- Encrypted token (should be encrypted in production)
  refresh_token TEXT, -- If available from OAuth flow
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL, -- Token expiry time
  scope TEXT, -- OAuth scopes granted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- One token per user
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_user_id ON public.google_drive_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_expires_at ON public.google_drive_tokens(expires_at);

-- RLS Policies
ALTER TABLE public.google_drive_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own Google Drive tokens" ON public.google_drive_tokens;
DROP POLICY IF EXISTS "Users can insert own Google Drive tokens" ON public.google_drive_tokens;
DROP POLICY IF EXISTS "Users can update own Google Drive tokens" ON public.google_drive_tokens;
DROP POLICY IF EXISTS "Users can delete own Google Drive tokens" ON public.google_drive_tokens;
DROP POLICY IF EXISTS "Admins can view all Google Drive tokens" ON public.google_drive_tokens;
DROP POLICY IF EXISTS "Admins can manage all Google Drive tokens" ON public.google_drive_tokens;

-- Users can view their own tokens
CREATE POLICY "Users can view own Google Drive tokens" ON public.google_drive_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own Google Drive tokens" ON public.google_drive_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own Google Drive tokens" ON public.google_drive_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own Google Drive tokens" ON public.google_drive_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all tokens
CREATE POLICY "Admins can view all Google Drive tokens" ON public.google_drive_tokens
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all tokens
CREATE POLICY "Admins can manage all Google Drive tokens" ON public.google_drive_tokens
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_google_drive_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_drive_tokens_updated_at ON public.google_drive_tokens;
CREATE TRIGGER google_drive_tokens_updated_at
  BEFORE UPDATE ON public.google_drive_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_drive_tokens_updated_at();

