-- Migration: Add onboarding_completed + user_preferences to user_settings
-- Run this in Supabase SQL Editor

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;

-- Backfill: mark existing users as onboarding completed (they're already using the app)
UPDATE user_settings SET onboarding_completed = true WHERE onboarding_completed IS NULL OR onboarding_completed = false;
