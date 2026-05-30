import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StatusBar, Alert, RefreshControl,
  StyleSheet, FlatList,
} from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useDataSync } from '@/hooks/sync/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FAB } from '@/components/ui/FAB';
import type { Habit, LifeArea } from '@/types/lifeos';
import { LIFE_AREAS } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const FREQ_LABELS: Record<string, string> = {
  daily: 'Hàng ngày', weekly: 'Hàng tuần', custom: 'Tùy chỉnh',
};

const TIME_GROUPS = [
  { key: 'morning', label: '🌅 Buổi sáng', range: [5, 12] },
  { key: 'afternoon', label: '☀️ Buổi chiều', range: [12, 18] },
  { key: 'evening', label: '🌙 Buổi tối', range: [18, 24] },
  { key: 'anytime', label: '⏰ Bất kỳ lúc nào', range: [0, 24] },
];

// ─── Ultra-compact Habit Row with Swipe ───
function HabitRow({ habit, todayStr, onToggle, onEdit, onDelete }: {
  habit: Habit; todayStr: string;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const isDone = habit.completedDates.includes(todayStr);
  const area = LIFE_AREAS.find(a => a.id === habit.area);
  const target = habit.targetPerDay || 1;
  const todayCompletion = habit.completions?.find(c => c.date === todayStr);
  const currentCount = todayCompletion?.count || (isDone ? 1 : 0);

  return (
    <SwipeableRow
      leftActions={[{
        label: isDone ? 'Undo' : 'Done',
        color: isDone ? C.warning : C.success,
        icon: isDone ? '↩' : '✓',
        onPress: onToggle,
      }]}
      rightActions={[
        { label: 'Sửa', color: '#3b82f6', icon: '✏️', onPress: onEdit },
        { label: 'Xóa', color: C.danger, icon: '🗑', onPress: onDelete },
      ]}
    >
      <TouchableOpacity onPress={onToggle} onLongPress={onEdit} delayLongPress={500} style={styles.habitRow} activeOpacity={0.7}>
        {/* Check button — large tap target */}
        <View style={[styles.habitCheck, isDone && styles.habitCheckDone]}>
          {isDone ? (
            <Text style={styles.habitCheckmark}>✓</Text>
          ) : (
            <Text style={styles.habitCheckIcon}>{habit.icon || area?.icon || '○'}</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.habitContent}>
          <Text style={[styles.habitName, isDone && styles.habitNameDone]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.habitMeta}>
            {habit.streak > 0 && (
              <View style={styles.streakPill}>
                <Text style={styles.streakPillText}>🔥 {habit.streak}</Text>
              </View>
            )}
            {target > 1 && (
              <Text style={styles.habitMetaText}>
                {currentCount}/{target} {habit.targetUnit || ''}
              </Text>
            )}
          </View>
        </View>

        {/* Mini 7-day dots */}
        <View style={styles.weekDots}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const done = habit.completedDates.includes(dateStr);
            return (
              <View
                key={i}
                style={[
                  styles.weekDot,
                  done && styles.weekDotDone,
                  dateStr === todayStr && styles.weekDotToday,
                ]}
              />
            );
          })}
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

// ─── Add/Edit Habit Modal ───
function AddHabitModal({ visible, onClose, editHabit }: {
  visible: boolean; onClose: () => void; editHabit?: Habit | null;
}) {
  const addHabit = useLifeOSStore(s => s.addHabit);
  const updateHabit = useLifeOSStore(s => s.updateHabit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<LifeArea | ''>('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [targetPerDay, setTargetPerDay] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (editHabit) {
      setName(editHabit.name);
      setDescription(editHabit.description || '');
      setArea(editHabit.area || '');
      setFrequency(editHabit.frequency);
      setTargetPerDay(editHabit.targetPerDay ? String(editHabit.targetPerDay) : '');
      setTargetUnit(editHabit.targetUnit || '');
      setIcon(editHabit.icon || '');
    } else {
      setName(''); setDescription(''); setArea(''); setFrequency('daily');
      setTargetPerDay(''); setTargetUnit(''); setIcon('');
    }
  }, [editHabit, visible]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên habit'); return; }
    if (!area) { Alert.alert('Lỗi', 'Vui lòng chọn lĩnh vực'); return; }
    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      area: area as LifeArea,
      frequency,
      targetPerDay: targetPerDay ? parseInt(targetPerDay, 10) : undefined,
      targetUnit: targetUnit.trim() || undefined,
      icon: icon.trim() || undefined,
    };
    if (editHabit) { updateHabit(editHabit.id, data); }
    else { addHabit(data); }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editHabit ? 'Sửa thói quen' : 'Thêm thói quen'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Lưu</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <View style={styles.field}>
            <Text style={styles.label}>Tên *</Text>
            <TextInput style={styles.input} placeholder="VD: Uống 2L nước" placeholderTextColor="#666" value={name} onChangeText={setName} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Mô tả (tùy chọn)" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={2} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Icon (emoji)</Text>
            <TextInput style={[styles.input, { width: 80, textAlign: 'center', fontSize: 24 }]} placeholder="💧" placeholderTextColor="#666" value={icon} onChangeText={setIcon} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Lĩnh vực *</Text>
            <View style={styles.areaRow}>
              {LIFE_AREAS.map(a => (
                <TouchableOpacity key={a.id} onPress={() => setArea(area === a.id ? '' : a.id)} style={[styles.areaChip, area === a.id && styles.areaChipActive]}>
                  <Text style={[styles.areaChipText, area === a.id && styles.areaChipTextActive]}>{a.icon} {a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Tần suất</Text>
            <View style={styles.freqRow}>
              {(['daily', 'weekly', 'custom'] as const).map(f => (
                <TouchableOpacity key={f} onPress={() => setFrequency(f)} style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}>
                  <Text style={[styles.freqBtnText, frequency === f && styles.freqBtnTextActive]}>{FREQ_LABELS[f]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mục tiêu / ngày (tùy chọn)</Text>
            <View style={styles.targetRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="VD: 8" placeholderTextColor="#666" value={targetPerDay} onChangeText={setTargetPerDay} keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1.5 }]} placeholder="Đơn vị: ly, phút" placeholderTextColor="#666" value={targetUnit} onChangeText={setTargetUnit} />
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Quick Add Bottom Sheet ───
function QuickAddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addHabit = useLifeOSStore(s => s.addHabit);
  const [name, setName] = useState('');
  const [area, setArea] = useState<LifeArea | ''>('');

  const handleAdd = () => {
    if (!name.trim() || !area) return;
    addHabit({ name: name.trim(), area: area as LifeArea, frequency: 'daily' });
    setName(''); setArea('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Thêm nhanh thói quen" height={340}>
      <View style={styles.quickForm}>
        <TextInput
          style={styles.quickInput}
          placeholder="Tên thói quen..."
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Text style={styles.quickLabel}>Lĩnh vực</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAreaScroll}>
          {LIFE_AREAS.map(a => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setArea(area === a.id ? '' : a.id)}
              style={[styles.quickAreaChip, area === a.id && styles.quickAreaChipActive]}
            >
              <Text style={styles.quickAreaIcon}>{a.icon}</Text>
              <Text style={[styles.quickAreaText, area === a.id && { color: C.primary }]}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.quickAddBtn, (!name.trim() || !area) && { opacity: 0.4 }]}
          disabled={!name.trim() || !area}
        >
          <Text style={styles.quickAddBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ─── Filter Bottom Sheet ───
const FILTER_OPTIONS = [
  { key: 'all', label: 'Tất cả', icon: '📋' },
  { key: 'active', label: 'Chưa xong', icon: '⏳' },
  { key: 'done', label: 'Đã xong', icon: '✅' },
];
const SORT_OPTIONS = [
  { key: 'streak', label: 'Streak cao nhất', icon: '🔥' },
  { key: 'name', label: 'Tên A-Z', icon: '🔤' },
  { key: 'area', label: 'Lĩnh vực', icon: '📂' },
];

function FilterSheet({ visible, onClose, filter, sort, onFilterChange, onSortChange }: {
  visible: boolean; onClose: () => void;
  filter: string; sort: string;
  onFilterChange: (f: string) => void; onSortChange: (s: string) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Lọc & Sắp xếp" height={380}>
      <View style={{ gap: 16 }}>
        <Text style={styles.sheetLabel}>Hiển thị</Text>
        <View style={styles.sheetRow}>
          {FILTER_OPTIONS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => { onFilterChange(f.key); }}
              style={[styles.sheetChip, filter === f.key && styles.sheetChipActive]}
            >
              <Text style={styles.sheetChipIcon}>{f.icon}</Text>
              <Text style={[styles.sheetChipText, filter === f.key && { color: C.primary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sheetLabel}>Sắp xếp</Text>
        <View style={styles.sheetRow}>
          {SORT_OPTIONS.map(s => (
            <TouchableOpacity
              key={s.key}
              onPress={() => { onSortChange(s.key); }}
              style={[styles.sheetChip, sort === s.key && styles.sheetChipActive]}
            >
              <Text style={styles.sheetChipIcon}>{s.icon}</Text>
              <Text style={[styles.sheetChipText, sort === s.key && { color: C.primary }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

// ═══════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════
export default function HabitsScreen() {
  const habits = useLifeOSStore(s => s.habits);
  const toggleHabitCompletion = useLifeOSStore(s => s.toggleHabitCompletion);
  const deleteHabit = useLifeOSStore(s => s.deleteHabit);
  const { loadAllData } = useDataSync();
  const { isOnline } = useOnlineStatus();

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('streak');
  const [showAdd, setShowAdd] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const activeHabits = useMemo(() => habits.filter(h => !h.deletedAt && !h.archivedAt), [habits]);

  const filteredHabits = useMemo(() => {
    let list = activeHabits.filter(h => {
      if (filter === 'active') return !h.completedDates.includes(todayStr);
      if (filter === 'done') return h.completedDates.includes(todayStr);
      return true;
    });
    list.sort((a, b) => {
      // Always uncompleted first
      const aDone = a.completedDates.includes(todayStr) ? 1 : 0;
      const bDone = b.completedDates.includes(todayStr) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'area') return (a.area || '').localeCompare(b.area || '');
      return b.streak - a.streak; // default: streak
    });
    return list;
  }, [activeHabits, filter, sort, todayStr]);

  const completedToday = activeHabits.filter(h => h.completedDates.includes(todayStr)).length;
  const totalActive = activeHabits.length;
  const completionRate = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;
  const longestStreak = activeHabits.reduce((max, h) => Math.max(max, h.bestStreak || h.streak), 0);
  const totalStreaks = activeHabits.reduce((sum, h) => sum + h.streak, 0);

  const handleToggle = useCallback((id: string) => {
    toggleHabitCompletion(id, todayStr);
  }, [toggleHabitCompletion, todayStr]);

  const handleDelete = useCallback((habit: Habit) => {
    Alert.alert('Xóa thói quen', `Bạn có chắc muốn xóa "${habit.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteHabit(habit.id) },
    ]);
  }, [deleteHabit]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Thói quen</Text>
        </View>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>⚙ Lọc</Text>
        </TouchableOpacity>
      </View>

      {/* ── Streak Dashboard ── */}
      <View style={styles.dashRow}>
        <View style={styles.dashCard}>
          <Text style={styles.dashValue}>{completedToday}/{totalActive}</Text>
          <Text style={styles.dashLabel}>Hôm nay</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>
        </View>
        <View style={styles.dashCard}>
          <Text style={[styles.dashValue, { color: C.warning }]}>🔥 {longestStreak}</Text>
          <Text style={styles.dashLabel}>Best streak</Text>
        </View>
        <View style={styles.dashCard}>
          <Text style={[styles.dashValue, { color: C.success }]}>{completionRate}%</Text>
          <Text style={styles.dashLabel}>Tỷ lệ</Text>
        </View>
      </View>

      {/* ── Inline filter tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTER_OPTIONS.map(f => {
          const count = f.key === 'all' ? activeHabits.length : f.key === 'done' ? completedToday : totalActive - completedToday;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
                {f.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Habits List ── */}
      <FlatList
        data={filteredHabits}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            todayStr={todayStr}
            onToggle={() => handleToggle(item.id)}
            onEdit={() => setEditHabit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Chưa có thói quen nào</Text>
            <Text style={styles.emptySubtitle}>Nhấn + để thêm thói quen mới</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* ── FAB with long press for full form ── */}
      <FAB
        onPress={() => setShowQuickAdd(true)}
        onLongPress={() => { setEditHabit(null); setShowAdd(true); }}
      />

      {/* ── Sheets & Modals ── */}
      <QuickAddSheet visible={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
      <FilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
      />
      <AddHabitModal
        visible={showAdd || !!editHabit}
        onClose={() => { setShowAdd(false); setEditHabit(null); }}
        editHabit={editHabit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { color: C.fg, fontSize: 24, fontWeight: 'bold' },
  offlineBadge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  offlineText: { color: C.warning, fontSize: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterBtnText: { color: C.muted, fontSize: 13 },

  // ── Dashboard ──
  dashRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  dashCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12, alignItems: 'center' },
  dashValue: { color: C.fg, fontSize: 20, fontWeight: 'bold' },
  dashLabel: { color: C.muted, fontSize: 11, marginTop: 2 },
  progressBar: { height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 8, width: '100%' },
  progressFill: { height: 4, backgroundColor: C.success, borderRadius: 2 },

  // ── Filters ──
  filterScroll: { maxHeight: 44, marginBottom: 4 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card },
  filterTabActive: { backgroundColor: C.primary },
  filterTabText: { color: C.muted, fontSize: 13 },
  filterTabTextActive: { color: 'white' },

  // ── Habit Row (ultra-compact) ──
  habitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 20,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  habitCheck: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: C.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  habitCheckDone: { backgroundColor: C.success, borderColor: C.success },
  habitCheckmark: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  habitCheckIcon: { fontSize: 18 },
  habitContent: { flex: 1 },
  habitName: { color: C.fg, fontSize: 15, fontWeight: '500' },
  habitNameDone: { color: C.muted, textDecorationLine: 'line-through' },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  streakPill: { backgroundColor: C.warning + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  streakPillText: { color: C.warning, fontSize: 11, fontWeight: '600' },
  habitMetaText: { color: C.muted, fontSize: 12 },

  // ── Week dots ──
  weekDots: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  weekDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  weekDotDone: { backgroundColor: C.success },
  weekDotToday: { borderWidth: 1.5, borderColor: C.primary },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: C.fg, fontSize: 16, fontWeight: '500' },
  emptySubtitle: { color: C.muted, fontSize: 14, marginTop: 4 },

  // ── Quick Add Sheet ──
  quickForm: { gap: 12 },
  quickInput: {
    backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: C.fg, fontSize: 16,
  },
  quickLabel: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 4 },
  quickAreaScroll: { gap: 8 },
  quickAreaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  quickAreaChipActive: { borderColor: C.primary, backgroundColor: C.primary + '15' },
  quickAreaIcon: { fontSize: 14 },
  quickAreaText: { color: C.muted, fontSize: 12 },
  quickAddBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  quickAddBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // ── Filter Sheet ──
  sheetLabel: { color: C.fg, fontSize: 14, fontWeight: '600' },
  sheetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  sheetChipActive: { borderColor: C.primary, backgroundColor: C.primary + '15' },
  sheetChipIcon: { fontSize: 14 },
  sheetChipText: { color: C.muted, fontSize: 13 },

  // ── Modal ──
  modalContainer: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalCancel: { color: C.muted, fontSize: 16 },
  modalTitle: { color: C.fg, fontSize: 16, fontWeight: '600' },
  modalSave: { color: C.primary, fontSize: 16, fontWeight: '600' },
  modalBody: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  field: { marginBottom: 20 },
  label: { color: C.fg, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.fg, fontSize: 16 },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  areaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  areaChipActive: { borderColor: C.primary, backgroundColor: 'rgba(139,92,246,0.1)' },
  areaChipText: { color: C.muted, fontSize: 13 },
  areaChipTextActive: { color: C.primary },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  freqBtnActive: { borderColor: C.primary, backgroundColor: 'rgba(139,92,246,0.1)' },
  freqBtnText: { color: C.muted, fontSize: 13 },
  freqBtnTextActive: { color: C.primary },
  targetRow: { flexDirection: 'row', gap: 8 },
});
