ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "preferences" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
UPDATE "user_settings" SET "onboarding_completed" = true WHERE "onboarding_completed" IS NOT TRUE;