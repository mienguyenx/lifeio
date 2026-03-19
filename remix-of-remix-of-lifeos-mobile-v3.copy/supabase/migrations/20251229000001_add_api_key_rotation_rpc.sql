-- =====================================================
-- ADD API KEY ROTATION RPC FOR EDGE FUNCTIONS
-- Date: 2025-12-29
--
-- Purpose:
-- - Allow Edge Functions (running with anon key) to safely fetch an available API key
--   with rotation (exclude a failed key) and basic limit checks (daily/monthly)
-- - Keep existing admin-only RLS on table public.api_keys
-- - Provide a SECURITY DEFINER function to bypass RLS for this narrow use case
-- =====================================================

-- NOTE:
-- This function intentionally returns the raw api_key because it is meant to be
-- called by server-side code (Supabase Edge Functions), NOT by the client UI.

CREATE OR REPLACE FUNCTION public.get_api_key_for_provider(
  _provider TEXT,
  _exclude_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  api_key TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.id,
    ak.api_key,
    ak.name
  FROM public.api_keys ak
  WHERE ak.provider = _provider
    AND ak.is_active = true
    AND (_exclude_id IS NULL OR ak.id <> _exclude_id)
    AND (ak.limit_per_day IS NULL OR ak.current_usage_today < ak.limit_per_day)
    AND (ak.limit_per_month IS NULL OR ak.current_usage_month < ak.limit_per_month)
  ORDER BY
    ak.is_primary DESC,
    ak.usage_count ASC,
    ak.last_used_at ASC NULLS FIRST
  LIMIT 1;
END;
$$;


