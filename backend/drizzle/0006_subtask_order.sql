ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subtasks_task_id_idx" ON "subtasks" ("task_id");
