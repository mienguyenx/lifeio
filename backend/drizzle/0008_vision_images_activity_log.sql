-- Ảnh minh hoạ cho tầm nhìn & mục đích sống (vision board)
ALTER TABLE "life_visions" ADD COLUMN IF NOT EXISTS "images" text[];
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "life_purpose_images" text[];
--> statement-breakpoint
-- Nhật ký hoạt động: máy chủ tự ghi khi người dùng tạo/sửa/xoá dữ liệu qua data gateway
CREATE TABLE IF NOT EXISTS "activity_log" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    module text NOT NULL,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    title text,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activity_log_user_created_idx ON "activity_log" (user_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activity_log_user_entity_idx ON "activity_log" (user_id, entity_id);
