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
import type { Goal, LifeArea, Milestone } from '@/types/lifeos';
import { LIFE_AREAS } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

// ─── Progress Ring (improved 8-segment) ───
function ProgressRing({ progress, size = 60, strokeWidth = 5 }: { progress: number; size?: number; strokeWidth?: number }) {
  const color = progress >= 100 ? C.success : progress >= 50 ? C.primary : C.warning;
  const segments = 8;
  const filled = Math.round((progress / 100) * segments);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeWidth, borderColor: C.border,
      }} />
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeWidth, borderColor: color,
        borderTopColor: filled >= 1 ? color : 'transparent',
        borderRightColor: filled >= 3 ? color : 'transparent',
        borderBottomColor: filled >= 5 ? color : 'transparent',
        borderLeftColor: filled >= 7 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <Text style={{ color: C.fg, fontSize: size * 0.22, fontWeight: 'bold' }}>
        {Math.round(progress)}%
      </Text>
    </View>
  );
}

// ─── Quick Update Slider ───
function ProgressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps = [0, 10, 25, 50, 75, 90, 100];
  return (
    <View style={styles.sliderRow}>
      {steps.map(s => (
        <TouchableOpacity
          key={s}
          onPress={() => onChange(s)}
          style={[styles.sliderStep, value >= s && styles.sliderStepFilled, s === value && styles.sliderStepActive]}
        >
          <Text style={[styles.sliderStepText, value >= s && { color: 'white' }]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Goal Card with swipe ───
function GoalCard({ goal, onPress, onToggleMilestone, onDelete, onQuickUpdate }: {
  goal: Goal;
  onPress: (goal: Goal) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onDelete: (goalId: string) => void;
  onQuickUpdate: (goal: Goal) => void;
}) {
  const area = LIFE_AREAS.find(a => a.id === goal.area);
  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <SwipeableRow
      leftActions={[{ label: 'Cập nhật', color: C.primary, icon: '📊', onPress: () => onQuickUpdate(goal) }]}
      rightActions={[
        { label: 'Sửa', color: '#3b82f6', icon: '✏️', onPress: () => onPress(goal) },
        { label: 'Xóa', color: C.danger, icon: '🗑', onPress: () => onDelete(goal.id) },
      ]}
    >
      <TouchableOpacity onPress={() => onPress(goal)} onLongPress={() => onQuickUpdate(goal)} delayLongPress={500} style={styles.goalCard} activeOpacity={0.7}>
        <View style={styles.goalCardHeader}>
          <ProgressRing progress={goal.progress} />
          <View style={styles.goalCardInfo}>
            <Text style={[styles.goalTitle, goal.progress >= 100 && { color: C.success }]} numberOfLines={2}>
              {goal.progress >= 100 ? '🏆 ' : ''}{goal.title}
            </Text>
            <View style={styles.goalBadgeRow}>
              {area && (
                <View style={styles.areaBadge}>
                  <Text style={styles.areaBadgeText}>{area.icon} {area.name}</Text>
                </View>
              )}
              {daysLeft !== null && (
                <View style={[styles.daysBadge, daysLeft < 0 && { backgroundColor: C.danger + '20', borderColor: C.danger + '40' }]}>
                  <Text style={[styles.daysText, daysLeft < 0 && { color: C.danger }]}>
                    {daysLeft < 0 ? `Quá ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Hôm nay' : `${daysLeft}d`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.goalProgressBar}>
          <View style={[styles.goalProgressFill, { width: `${Math.min(goal.progress, 100)}%`, backgroundColor: goal.progress >= 100 ? C.success : C.primary }]} />
        </View>

        {goal.milestones.length > 0 && (
          <View style={styles.milestonesSection}>
            <Text style={styles.milestonesLabel}>
              Milestones ({completedMilestones}/{goal.milestones.length})
            </Text>
            {goal.milestones.slice(0, 3).map(m => (
              <TouchableOpacity key={m.id} onPress={() => onToggleMilestone(goal.id, m.id)} style={styles.milestoneRow}>
                <View style={[styles.milestoneCheck, m.completed && styles.milestoneCheckDone]}>
                  {m.completed && <Text style={styles.milestoneCheckmark}>✓</Text>}
                </View>
                <Text style={[styles.milestoneTitle, m.completed && styles.milestoneTitleDone]} numberOfLines={1}>
                  {m.title}
                </Text>
              </TouchableOpacity>
            ))}
            {goal.milestones.length > 3 && (
              <Text style={styles.moreText}>+{goal.milestones.length - 3} khác</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </SwipeableRow>
  );
}

// ─── Add/Edit Goal Modal ───
function AddGoalModal({ visible, onClose, editGoal }: {
  visible: boolean; onClose: () => void; editGoal?: Goal | null;
}) {
  const addGoal = useLifeOSStore(s => s.addGoal);
  const updateGoal = useLifeOSStore(s => s.updateGoal);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<LifeArea | ''>('');
  const [targetDate, setTargetDate] = useState('');
  const [milestoneTexts, setMilestoneTexts] = useState<string[]>(['']);

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || '');
      setArea(editGoal.area || '');
      setTargetDate(editGoal.targetDate || '');
      setMilestoneTexts(editGoal.milestones.map(m => m.title));
    } else {
      setTitle(''); setDescription(''); setArea(''); setTargetDate('');
      setMilestoneTexts(['']);
    }
  }, [editGoal, visible]);

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề'); return; }
    if (!area) { Alert.alert('Lỗi', 'Vui lòng chọn lĩnh vực'); return; }
    const milestones = milestoneTexts.filter(m => m.trim());
    if (editGoal) {
      updateGoal(editGoal.id, {
        title: title.trim(), description: description.trim() || undefined,
        area: area as LifeArea, targetDate: targetDate || undefined,
      });
    } else {
      addGoal({
        title: title.trim(), description: description.trim() || undefined,
        area: area as LifeArea, targetDate: targetDate || undefined, milestones,
      });
    }
    onClose();
  };

  const addMilestoneField = () => setMilestoneTexts([...milestoneTexts, '']);
  const updateMilestoneText = (index: number, text: string) => {
    const updated = [...milestoneTexts]; updated[index] = text; setMilestoneTexts(updated);
  };
  const removeMilestoneField = (index: number) => {
    if (milestoneTexts.length <= 1) return;
    setMilestoneTexts(milestoneTexts.filter((_, i) => i !== index));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Hủy</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{editGoal ? 'Sửa mục tiêu' : 'Thêm mục tiêu'}</Text>
          <TouchableOpacity onPress={handleSave}><Text style={styles.modalSave}>Lưu</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <View style={styles.field}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput style={styles.input} placeholder="VD: Học IELTS 7.0" placeholderTextColor="#666" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Mô tả (tùy chọn)" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
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
            <Text style={styles.label}>Ngày mục tiêu (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2026-12-31" placeholderTextColor="#666" value={targetDate} onChangeText={setTargetDate} />
          </View>
          {!editGoal && (
            <View style={styles.field}>
              <View style={styles.milestonesHeader}>
                <Text style={styles.label}>Milestones</Text>
                <TouchableOpacity onPress={addMilestoneField}><Text style={styles.addMilestoneBtn}>+ Thêm</Text></TouchableOpacity>
              </View>
              {milestoneTexts.map((text, index) => (
                <View key={index} style={styles.milestoneInputRow}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={`Milestone ${index + 1}`} placeholderTextColor="#666" value={text} onChangeText={(t) => updateMilestoneText(index, t)} />
                  {milestoneTexts.length > 1 && (
                    <TouchableOpacity onPress={() => removeMilestoneField(index)} style={styles.removeMilestoneBtn}>
                      <Text style={styles.removeMilestoneBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Quick Update Sheet ───
function QuickUpdateSheet({ visible, onClose, goal }: {
  visible: boolean; onClose: () => void; goal: Goal | null;
}) {
  const updateGoal = useLifeOSStore(s => s.updateGoal);
  const [progress, setProgress] = useState(0);

  useEffect(() => { if (goal) setProgress(goal.progress); }, [goal]);

  const handleSave = () => {
    if (goal) { updateGoal(goal.id, { progress }); }
    onClose();
  };

  if (!goal) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`Cập nhật: ${goal.title}`} height={260}>
      <View style={{ gap: 16 }}>
        <View style={styles.quickUpdateRow}>
          <ProgressRing progress={progress} size={72} strokeWidth={6} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.quickUpdateLabel}>Tiến độ hiện tại</Text>
            <Text style={styles.quickUpdateValue}>{progress}%</Text>
          </View>
        </View>
        <ProgressSlider value={progress} onChange={setProgress} />
        <TouchableOpacity onPress={handleSave} style={styles.quickSaveBtn}>
          <Text style={styles.quickSaveBtnText}>Lưu tiến độ</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const FILTERS = [
  { key: 'all', label: 'Tất cả', icon: '📋' },
  { key: 'active', label: 'Đang làm', icon: '🏃' },
  { key: 'completed', label: 'Hoàn thành', icon: '🏆' },
];

// ═══════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════
export default function GoalsScreen() {
  const goals = useLifeOSStore(s => s.goals);
  const toggleMilestone = useLifeOSStore(s => s.toggleMilestone);
  const deleteGoal = useLifeOSStore(s => s.deleteGoal);
  const { loadAllData } = useDataSync();
  const { isOnline } = useOnlineStatus();

  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [quickUpdateGoal, setQuickUpdateGoal] = useState<Goal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true); await loadAllData(); setRefreshing(false);
  };

  const activeGoals = useMemo(() => goals.filter(g => !g.deletedAt), [goals]);

  const filteredGoals = useMemo(() =>
    activeGoals
      .filter(g => {
        if (filter === 'active') return g.progress < 100;
        if (filter === 'completed') return g.progress >= 100;
        return true;
      })
      .sort((a, b) => {
        if (a.progress >= 100 && b.progress < 100) return 1;
        if (a.progress < 100 && b.progress >= 100) return -1;
        return b.progress - a.progress;
      }),
    [activeGoals, filter]
  );

  const totalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;
  const completedCount = activeGoals.filter(g => g.progress >= 100).length;
  const inProgressCount = activeGoals.length - completedCount;

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Xóa mục tiêu', 'Bạn có chắc?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  }, [deleteGoal]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mục tiêu</Text>
        </View>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* ── Stats Dashboard ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCardBig}>
          <ProgressRing progress={totalProgress} size={64} strokeWidth={6} />
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.statBigLabel}>Tổng tiến độ</Text>
            <Text style={styles.statBigValue}>{totalProgress}%</Text>
          </View>
        </View>
        <View style={styles.statMini}>
          <Text style={[styles.statMiniVal, { color: C.primary }]}>{inProgressCount}</Text>
          <Text style={styles.statMiniLabel}>đang làm</Text>
        </View>
        <View style={styles.statMini}>
          <Text style={[styles.statMiniVal, { color: C.success }]}>{completedCount}</Text>
          <Text style={styles.statMiniLabel}>xong</Text>
        </View>
      </View>

      {/* ── Filter tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterTab, filter === f.key && styles.filterTabActive]}>
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>{f.icon} {f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Goals list ── */}
      <FlatList
        data={filteredGoals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onPress={setEditGoal}
            onToggleMilestone={toggleMilestone}
            onDelete={handleDelete}
            onQuickUpdate={setQuickUpdateGoal}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Chưa có mục tiêu nào</Text>
            <TouchableOpacity onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyAction}>+ Thêm mục tiêu mới</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
      />

      {/* ── FAB ── */}
      <FAB onPress={() => { setEditGoal(null); setShowAdd(true); }} />

      {/* ── Sheets & Modals ── */}
      <QuickUpdateSheet visible={!!quickUpdateGoal} onClose={() => setQuickUpdateGoal(null)} goal={quickUpdateGoal} />
      <AddGoalModal
        visible={showAdd || !!editGoal}
        onClose={() => { setShowAdd(false); setEditGoal(null); }}
        editGoal={editGoal}
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

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center' },
  statCardBig: { flex: 2, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 14 },
  statBigLabel: { color: C.muted, fontSize: 12 },
  statBigValue: { color: C.fg, fontSize: 22, fontWeight: 'bold' },
  statMini: { flex: 1, alignItems: 'center', backgroundColor: C.card, borderRadius: 14, paddingVertical: 14 },
  statMiniVal: { fontSize: 22, fontWeight: 'bold' },
  statMiniLabel: { color: C.muted, fontSize: 10, marginTop: 2 },

  // ── Filters ──
  filterScroll: { maxHeight: 44, marginBottom: 4 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card },
  filterTabActive: { backgroundColor: C.primary },
  filterTabText: { color: C.muted, fontSize: 13 },
  filterTabTextActive: { color: 'white' },

  // ── Goal Card ──
  goalCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  goalCardHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  goalCardInfo: { flex: 1 },
  goalTitle: { color: C.fg, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  goalBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  areaBadge: { backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  areaBadgeText: { color: C.primary, fontSize: 12 },
  daysBadge: { backgroundColor: C.muted + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  daysText: { color: C.muted, fontSize: 11 },
  goalProgressBar: { height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 12 },
  goalProgressFill: { height: 4, borderRadius: 2 },

  // ── Milestones ──
  milestonesSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  milestonesLabel: { color: C.muted, fontSize: 12, marginBottom: 8 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  milestoneCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.muted, alignItems: 'center', justifyContent: 'center' },
  milestoneCheckDone: { backgroundColor: C.success, borderColor: C.success },
  milestoneCheckmark: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  milestoneTitle: { color: C.fg, fontSize: 13, flex: 1 },
  milestoneTitleDone: { textDecorationLine: 'line-through', color: C.muted },
  moreText: { color: C.muted, fontSize: 12, marginTop: 4 },

  // ── Quick Update Sheet ──
  quickUpdateRow: { flexDirection: 'row', alignItems: 'center' },
  quickUpdateLabel: { color: C.muted, fontSize: 12 },
  quickUpdateValue: { color: C.fg, fontSize: 28, fontWeight: 'bold' },
  sliderRow: { flexDirection: 'row', gap: 6 },
  sliderStep: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.border,
  },
  sliderStepFilled: { backgroundColor: C.primary + '40' },
  sliderStepActive: { backgroundColor: C.primary, borderWidth: 2, borderColor: 'white' },
  sliderStepText: { color: C.muted, fontSize: 11, fontWeight: '600' },
  quickSaveBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  quickSaveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: C.fg, fontSize: 16, fontWeight: '500' },
  emptyAction: { color: C.primary, fontSize: 14, marginTop: 12, fontWeight: '500' },

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
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  areaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  areaChipActive: { borderColor: C.primary, backgroundColor: 'rgba(139,92,246,0.1)' },
  areaChipText: { color: C.muted, fontSize: 13 },
  areaChipTextActive: { color: C.primary },
  milestonesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addMilestoneBtn: { color: C.primary, fontSize: 14, fontWeight: '500' },
  milestoneInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeMilestoneBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' },
  removeMilestoneBtnText: { color: C.danger, fontSize: 14 },
});
