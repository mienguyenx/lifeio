-- =====================================================
-- API KEYS MANAGEMENT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'gemini', 'perplexity', etc.
  name TEXT NOT NULL, -- Friendly name for the key
  api_key TEXT NOT NULL, -- Encrypted or plain (depending on security requirements)
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false, -- Primary key to use by default
  usage_count INTEGER NOT NULL DEFAULT 0, -- Track usage
  limit_per_day INTEGER, -- Daily limit if any
  limit_per_month INTEGER, -- Monthly limit if any
  current_usage_today INTEGER NOT NULL DEFAULT 0,
  current_usage_month INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error TEXT, -- Last error message if any
  error_count INTEGER NOT NULL DEFAULT 0, -- Consecutive errors
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, name) -- Prevent duplicate names for same provider
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON public.api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_primary ON public.api_keys(is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins can view all API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can insert API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can update API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can delete API keys" ON public.api_keys;

CREATE POLICY "Admins can view all API keys" ON public.api_keys 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert API keys" ON public.api_keys 
  FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update API keys" ON public.api_keys 
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete API keys" ON public.api_keys 
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Function to get active API key for a provider
CREATE OR REPLACE FUNCTION public.get_active_api_key(_provider TEXT)
RETURNS TABLE (
  id UUID,
  api_key TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _key_record RECORD;
BEGIN
  -- Try to get primary key first
  SELECT ak.id, ak.api_key, ak.name
  INTO _key_record
  FROM public.api_keys ak
  WHERE ak.provider = _provider
    AND ak.is_active = true
    AND ak.is_primary = true
  LIMIT 1;

  -- If no primary, get any active key
  IF _key_record IS NULL THEN
    SELECT ak.id, ak.api_key, ak.name
    INTO _key_record
    FROM public.api_keys ak
    WHERE ak.provider = _provider
      AND ak.is_active = true
    ORDER BY ak.usage_count ASC, ak.last_used_at ASC NULLS FIRST
    LIMIT 1;
  END IF;

  -- Return the key
  IF _key_record IS NOT NULL THEN
    RETURN QUERY SELECT _key_record.id, _key_record.api_key, _key_record.name;
  END IF;
END;
$$;

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_api_key_usage(_key_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.api_keys
  SET 
    usage_count = usage_count + 1,
    current_usage_today = current_usage_today + 1,
    current_usage_month = current_usage_month + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE id = _key_id;
END;
$$;

-- Function to record error
CREATE OR REPLACE FUNCTION public.record_api_key_error(_key_id UUID, _error_message TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.api_keys
  SET 
    last_error = _error_message,
    error_count = error_count + 1,
    updated_at = now()
  WHERE id = _key_id;
  
  -- Auto-disable if too many errors
  UPDATE public.api_keys
  SET is_active = false
  WHERE id = _key_id AND error_count >= 5;
END;
$$;

-- Function to reset daily usage (should be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_daily_api_key_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.api_keys
  SET current_usage_today = 0
  WHERE current_usage_today > 0;
END;
$$;

-- Function to reset monthly usage (should be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_api_key_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.api_keys
  SET current_usage_month = 0
  WHERE current_usage_month > 0;
END;
$$;

