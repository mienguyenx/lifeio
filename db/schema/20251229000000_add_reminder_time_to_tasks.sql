-- Add reminder_time column to tasks table
-- This allows users to set a specific time (HH:mm) for task reminders
-- in addition to reminder_minutes (remind X minutes before deadline)

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS reminder_time TIME;

COMMENT ON COLUMN public.tasks.reminder_time IS 'Specific time (HH:mm) to remind user about this task. Used in combination with reminder_minutes for flexible reminder options.';

