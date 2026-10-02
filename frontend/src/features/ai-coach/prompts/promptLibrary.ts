// Thư viện prompt AI Coach — đọc từ admin_ai_prompts (category "coach:*").
import { useQuery } from '@tanstack/react-query';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';

export interface CoachPrompt {
  id: string; name: string; prompt_key: string; category: string; description: string | null;
  user_prompt_template: string | null; variables: string[] | null;
}

export const CATEGORY_LABELS: Record<string, string> = {
  system: 'Hệ thống', general: 'Chung', coach: 'AI Coach',
  planning: 'Lập kế hoạch', goals: 'Mục tiêu', habits: 'Thói quen', productivity: 'Năng suất', reflection: 'Nhìn lại',
  mindset: 'Tư duy', health: 'Sức khỏe', finance: 'Tài chính', learning: 'Học tập', relationships: 'Mối quan hệ',
};
/** "coach:planning" → "Lập kế hoạch" ; "system" → "Hệ thống" */
export const categoryLabel = (c: string) => {
  const [group, sub] = c.split(':');
  if (sub) return CATEGORY_LABELS[sub] ?? sub;
  return CATEGORY_LABELS[group] ?? group;
};
export const categoryGroup = (c: string) => c.split(':')[0];

const VAR_LABELS: Record<string, string> = {
  cam_giac: 'Cảm giác khi thức dậy', chi_tieu: 'Các khoản chi chính', chu_de: 'Chủ đề', danh_sach_viec: 'Danh sách việc', du_an: 'Dự án',
  gio_day: 'Giờ dậy', gio_ngu: 'Giờ ngủ', han: 'Hạn chót', hom_nay: 'Hôm nay bạn đã làm gì', khoang_thoi_gian: 'Khoảng thời gian',
  ky_nang: 'Kỹ năng', lich_co_dinh: 'Lịch cố định', linh_vuc: 'Lĩnh vực', ly_do: 'Lý do', mong_muon: 'Điều bạn mong muốn',
  muc_dich: 'Mục đích', muc_tieu: 'Mục tiêu', nguoi: 'Người đó', quan_he: 'Mối quan hệ', so_gio: 'Số giờ', so_ngay: 'Số ngày',
  so_phut: 'Số phút', so_tien: 'Số tiền', suy_nghi: 'Suy nghĩ', tam_trang: 'Tâm trạng', thoi_gian: 'Thời gian', thoi_han: 'Thời hạn',
  thoi_quen_xau: 'Thói quen muốn bỏ', thoi_quen: 'Thói quen', thu_nhap: 'Thu nhập', tinh_huong: 'Tình huống', trinh_do: 'Trình độ',
  uu_tien: 'Ưu tiên', van_de: 'Vấn đề', viec_can_lam: 'Việc cần làm', viec: 'Việc',
};
/** Biến {{ten_bien}} → nhãn dễ đọc (từ điển, hoặc "ten_bien" → "Ten bien"). */
export const varLabel = (v: string) => {
  if (VAR_LABELS[v]) return VAR_LABELS[v];
  const s = v.replace(/[_-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const varsOf = (p: Pick<CoachPrompt, 'variables' | 'user_prompt_template'>) =>
  p.variables?.length ? p.variables : [...new Set([...(p.user_prompt_template ?? '').matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1]))];
export const fillTemplate = (tpl: string, values: Record<string, string>) =>
  tpl.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k: string) => values[k]?.trim() || `[${varLabel(k)}]`);

export function useCoachPrompts(enabled = true) {
  return useQuery({
    queryKey: ['coach-prompts'],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_ai_prompts')
        .select('id,name,prompt_key,category,description,user_prompt_template,variables')
        .eq('is_active', true)
        .like('category', 'coach%')
        .order('category', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as CoachPrompt[]).filter((p) => p.user_prompt_template?.trim());
    },
  });
}
