ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subtasks_task_id_idx" ON "subtasks" ("task_id");
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_tasks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_parent_id_idx" ON "tasks" ("parent_id");
