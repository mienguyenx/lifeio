-- Thông báo đẩy (Web Push) trên điện thoại/máy tính + tùy chọn thông báo + hộp thư thông báo máy chủ
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    device_label text,
    platform text,
    failure_count integer DEFAULT 0 NOT NULL,
    last_error text,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON "push_subscriptions" (user_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_prefs" (
    user_id uuid PRIMARY KEY REFERENCES "users"(id) ON DELETE CASCADE,
    task_reminders boolean DEFAULT true NOT NULL,
    habit_reminders boolean DEFAULT true NOT NULL,
    overdue_alerts boolean DEFAULT true NOT NULL,
    daily_digest boolean DEFAULT true NOT NULL,
    digest_time time DEFAULT '08:00' NOT NULL,
    quiet_start time,
    quiet_end time,
    timezone text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notifications" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    type text DEFAULT 'system' NOT NULL,
    title text NOT NULL,
    body text,
    url text,
    tag text,
    dedupe_key text UNIQUE,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS user_notifications_user_idx ON "user_notifications" (user_id, created_at DESC);
