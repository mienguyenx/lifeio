-- =====================================================
-- Lịch sử thay đổi cho Module Area
-- =====================================================
-- Tạo các bảng để lưu trữ lịch sử thay đổi của:
-- - Personal Values
-- - Life Roles
-- - Life Visions
-- - Personal Traits
-- - Life Milestones
-- =====================================================

-- Bảng lịch sử Personal Values
CREATE TABLE IF NOT EXISTS public.personal_values_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_id UUID NOT NULL REFERENCES public.personal_values(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored')),
  old_data JSONB, -- Dữ liệu cũ (trước khi thay đổi)
  new_data JSONB, -- Dữ liệu mới (sau khi thay đổi)
  changed_fields TEXT[], -- Danh sách các field đã thay đổi
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng lịch sử Life Roles
CREATE TABLE IF NOT EXISTS public.life_roles_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.life_roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored', 'activated', 'deactivated')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng lịch sử Life Visions
CREATE TABLE IF NOT EXISTS public.life_visions_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vision_id UUID NOT NULL REFERENCES public.life_visions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng lịch sử Personal Traits
CREATE TABLE IF NOT EXISTS public.personal_traits_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trait_id UUID NOT NULL REFERENCES public.personal_traits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng lịch sử Life Milestones
CREATE TABLE IF NOT EXISTS public.life_milestones_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.life_milestones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored', 'completed')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes để tối ưu query
CREATE INDEX IF NOT EXISTS idx_personal_values_history_value_id ON public.personal_values_history(value_id);
CREATE INDEX IF NOT EXISTS idx_personal_values_history_user_id ON public.personal_values_history(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_values_history_created_at ON public.personal_values_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_life_roles_history_role_id ON public.life_roles_history(role_id);
CREATE INDEX IF NOT EXISTS idx_life_roles_history_user_id ON public.life_roles_history(user_id);
CREATE INDEX IF NOT EXISTS idx_life_roles_history_created_at ON public.life_roles_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_life_visions_history_vision_id ON public.life_visions_history(vision_id);
CREATE INDEX IF NOT EXISTS idx_life_visions_history_user_id ON public.life_visions_history(user_id);
CREATE INDEX IF NOT EXISTS idx_life_visions_history_created_at ON public.life_visions_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_personal_traits_history_trait_id ON public.personal_traits_history(trait_id);
CREATE INDEX IF NOT EXISTS idx_personal_traits_history_user_id ON public.personal_traits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_traits_history_created_at ON public.personal_traits_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_life_milestones_history_milestone_id ON public.life_milestones_history(milestone_id);
CREATE INDEX IF NOT EXISTS idx_life_milestones_history_user_id ON public.life_milestones_history(user_id);
CREATE INDEX IF NOT EXISTS idx_life_milestones_history_created_at ON public.life_milestones_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.personal_values_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_roles_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_visions_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_traits_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_milestones_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own history
CREATE POLICY "Users can view own personal_values_history" ON public.personal_values_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own life_roles_history" ON public.life_roles_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own life_visions_history" ON public.life_visions_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own personal_traits_history" ON public.personal_traits_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own life_milestones_history" ON public.life_milestones_history
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Functions để tự động tạo history records
-- =====================================================

-- Function tạo history cho Personal Values
CREATE OR REPLACE FUNCTION public.log_personal_value_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_array TEXT[];
BEGIN
  -- Xác định action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    new_data_json := to_jsonb(NEW);
    old_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    -- Xác định các field đã thay đổi
    changed_fields_array := ARRAY[]::TEXT[];
    IF OLD.name IS DISTINCT FROM NEW.name THEN changed_fields_array := array_append(changed_fields_array, 'name'); END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN changed_fields_array := array_append(changed_fields_array, 'description'); END IF;
    IF OLD.icon IS DISTINCT FROM NEW.icon THEN changed_fields_array := array_append(changed_fields_array, 'icon'); END IF;
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN changed_fields_array := array_append(changed_fields_array, 'priority'); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  END IF;

  -- Insert vào history table
  INSERT INTO public.personal_values_history (
    value_id,
    user_id,
    action,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    old_data_json,
    new_data_json,
    changed_fields_array
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo triggers
DROP TRIGGER IF EXISTS personal_values_history_trigger ON public.personal_values;
CREATE TRIGGER personal_values_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.personal_values
  FOR EACH ROW EXECUTE FUNCTION public.log_personal_value_change();

-- Tương tự cho các bảng khác (có thể tạo functions tương tự)
-- Function cho Life Roles
CREATE OR REPLACE FUNCTION public.log_life_role_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_array TEXT[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    new_data_json := to_jsonb(NEW);
    old_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    changed_fields_array := ARRAY[]::TEXT[];
    IF OLD.name IS DISTINCT FROM NEW.name THEN changed_fields_array := array_append(changed_fields_array, 'name'); END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN changed_fields_array := array_append(changed_fields_array, 'description'); END IF;
    IF OLD.icon IS DISTINCT FROM NEW.icon THEN changed_fields_array := array_append(changed_fields_array, 'icon'); END IF;
    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN 
      changed_fields_array := array_append(changed_fields_array, 'is_active');
      action_type := CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  END IF;

  INSERT INTO public.life_roles_history (
    role_id,
    user_id,
    action,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    old_data_json,
    new_data_json,
    changed_fields_array
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS life_roles_history_trigger ON public.life_roles;
CREATE TRIGGER life_roles_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.life_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_life_role_change();

-- Function cho Life Visions
CREATE OR REPLACE FUNCTION public.log_life_vision_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_array TEXT[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    new_data_json := to_jsonb(NEW);
    old_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    changed_fields_array := ARRAY[]::TEXT[];
    IF OLD.statement IS DISTINCT FROM NEW.statement THEN changed_fields_array := array_append(changed_fields_array, 'statement'); END IF;
    IF OLD.timeframe IS DISTINCT FROM NEW.timeframe THEN changed_fields_array := array_append(changed_fields_array, 'timeframe'); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  END IF;

  INSERT INTO public.life_visions_history (
    vision_id,
    user_id,
    action,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    old_data_json,
    new_data_json,
    changed_fields_array
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS life_visions_history_trigger ON public.life_visions;
CREATE TRIGGER life_visions_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.life_visions
  FOR EACH ROW EXECUTE FUNCTION public.log_life_vision_change();

-- Function cho Personal Traits
CREATE OR REPLACE FUNCTION public.log_personal_trait_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_array TEXT[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    new_data_json := to_jsonb(NEW);
    old_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    changed_fields_array := ARRAY[]::TEXT[];
    IF OLD.name IS DISTINCT FROM NEW.name THEN changed_fields_array := array_append(changed_fields_array, 'name'); END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN changed_fields_array := array_append(changed_fields_array, 'description'); END IF;
    IF OLD.trait_type IS DISTINCT FROM NEW.trait_type THEN changed_fields_array := array_append(changed_fields_array, 'trait_type'); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  END IF;

  INSERT INTO public.personal_traits_history (
    trait_id,
    user_id,
    action,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    old_data_json,
    new_data_json,
    changed_fields_array
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS personal_traits_history_trigger ON public.personal_traits;
CREATE TRIGGER personal_traits_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.personal_traits
  FOR EACH ROW EXECUTE FUNCTION public.log_personal_trait_change();

-- Function cho Life Milestones
CREATE OR REPLACE FUNCTION public.log_life_milestone_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_array TEXT[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    new_data_json := to_jsonb(NEW);
    old_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    changed_fields_array := ARRAY[]::TEXT[];
    IF OLD.title IS DISTINCT FROM NEW.title THEN changed_fields_array := array_append(changed_fields_array, 'title'); END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN changed_fields_array := array_append(changed_fields_array, 'description'); END IF;
    IF OLD.date IS DISTINCT FROM NEW.date THEN changed_fields_array := array_append(changed_fields_array, 'date'); END IF;
    IF OLD.area IS DISTINCT FROM NEW.area THEN changed_fields_array := array_append(changed_fields_array, 'area'); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
    changed_fields_array := ARRAY[]::TEXT[];
  END IF;

  INSERT INTO public.life_milestones_history (
    milestone_id,
    user_id,
    action,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    old_data_json,
    new_data_json,
    changed_fields_array
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS life_milestones_history_trigger ON public.life_milestones;
CREATE TRIGGER life_milestones_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.life_milestones
  FOR EACH ROW EXECUTE FUNCTION public.log_life_milestone_change();

-- =====================================================
-- HOÀN THÀNH!
-- =====================================================
-- Các bảng lịch sử đã được tạo và triggers đã được thiết lập
-- Tất cả thay đổi sẽ được tự động ghi lại
-- =====================================================

