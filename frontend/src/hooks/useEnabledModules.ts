import { useMemo } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { NAV_GROUPS, QUICK_ACTIONS, type NavGroup } from '@/components/layout/navigationConfig';
import { MODULES, isModuleOn, isPathOn, isQuickOn, type ModuleId } from '@/lib/modules';

/** Menu/Thêm nhanh chỉ hiện tính năng người dùng đã bật (lõi luôn hiện). */
export function useEnabledModules() {
  const enabled = useLifeOSStore((s) => s.userPreferences?.enabledModules);
  return useMemo(() => {
    const navGroups: NavGroup[] = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => isPathOn(enabled, i.path)) })).filter((g) => g.items.length);
    // Người dùng đã chọn tính năng → gộp thành 1 nhóm "Không gian của bạn" (đỡ lắt nhắt), tiện ích để ở "Thêm".
    const UTIL = ['/ai-memory', '/personalization', '/trash'];
    const flat = navGroups.flatMap((g) => g.items);
    const compactGroups: NavGroup[] = enabled
      ? [
          { id: 'mine', label: 'Không gian của bạn', desc: '', items: flat.filter((i) => !UTIL.includes(i.path)) },
          { id: 'more', label: 'Thêm', desc: '', collapsible: true, items: flat.filter((i) => UTIL.includes(i.path)) },
        ]
      : navGroups;
    const quickActions = QUICK_ACTIONS.filter((a) => isQuickOn(enabled, a.id));
    const hidden = MODULES.filter((m) => !isModuleOn(enabled, m.id));
    return { enabled, navGroups, compactGroups, quickActions, hiddenCount: hidden.length, isOn: (id: ModuleId) => isModuleOn(enabled, id) };
  }, [enabled]);
}
