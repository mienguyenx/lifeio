-- Check-in sáng / review tối theo ngày (đồng bộ giữa các thiết bị). status: done | skipped
CREATE TABLE IF NOT EXISTS "daily_checkins" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    date date NOT NULL,
    kind text NOT NULL CHECK (kind IN ('morning', 'evening')),
    status text DEFAULT 'done' NOT NULL CHECK (status IN ('done', 'skipped')),
    energy integer,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS daily_checkins_user_date_kind_idx ON "daily_checkins" (user_id, date, kind);
--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD COLUMN IF NOT EXISTS "checkin_reminders" boolean DEFAULT true NOT NULL;
