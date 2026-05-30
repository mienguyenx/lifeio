import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StatusBar, Alert, RefreshControl,
  StyleSheet, SectionList,
} from 'react-native';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useTasksSync } from '@/hooks/sync/useTasksSync';
import { useDataSync } from '@/hooks/sync/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FAB } from '@/components/ui/FAB';
import type { Task, LifeArea } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: C.danger, medium: C.warning, low: C.success,
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Thấp', medium: 'Trung bình', high: 'Cao',
};
const PRIORITIES = ['low', 'medium', 'high'] as const;
const AREAS: LifeArea[] = ['health', 'career', 'finance', 'relationships', 'personal', 'fun', 'learning', 'contribution'];

// ─── Swipeable Task Row ───
function TaskRow({ task, onPress, onToggle, onDelete }: {
  task: Task;
  onPress: (task: Task) => void;
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === 'done';
  return (
    <SwipeableRow
      leftActions={[{
        label: isDone ? 'Undo' : 'Done',
        color: C.success,
        icon: isDone ? '↩' : '✓',
        onPress: () => onToggle(task.id, task.status),
      }]}
      rightActions={[
        { label: 'Sửa', color: '#3b82f6', icon: '✏️', onPress: () => onPress(task) },
        { label: 'Xóa', color: C.danger, icon: '🗑', onPress: () => onDelete(task.id) },
      ]}
    >
      <TouchableOpacity onPress={() => onToggle(task.id, task.status)} onLongPress={() => onPress(task)} delayLongPress={500} style={styles.taskRow} activeOpacity={0.7}>
        <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
          {isDone && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
            <Text style={styles.taskMetaText}>{PRIORITY_LABELS[task.priority]}</Text>
            {task.dueDate && (
              <Text style={styles.taskMetaText}>· {format(new Date(task.dueDate), 'dd/MM')}</Text>
            )}
            {(task.subtasks?.length ?? 0) > 0 && (
              <Text style={styles.taskMetaText}>
                · {task.subtasks!.filter(s => s.completed).length}/{task.subtasks!.length}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

// ─── Add/Edit Task Modal ───
function AddTaskModal({ visible, onClose, editTask }: {
  visible: boolean; onClose: () => void; editTask?: Task | null;
}) {
  const addTask = useLifeOSStore(s => s.addTask);
  const updateTask = useLifeOSStore(s => s.updateTask);
  const { saveTask, updateTask: syncUpdate } = useTasksSync();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [area, setArea] = useState<LifeArea | ''>('');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setPriority(editTask.priority as 'low' | 'medium' | 'high');
      setDueDate(editTask.dueDate || '');
      setArea(editTask.area || '');
    } else {
      setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setArea('');
    }
  }, [editTask, visible]);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề'); return; }
    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: 'todo' as const,
      dueDate: dueDate || undefined,
      area: area || undefined,
    };
    if (editTask) {
      updateTask(editTask.id, taskData);
      await syncUpdate(editTask.id, taskData);
    } else {
      const newTask: Task = {
        ...taskData, id: crypto.randomUUID(),
        createdAt: new Date().toISOString(), completedPomodoros: 0, subtasks: [],
      } as Task;
      addTask(taskData);
      await saveTask(newTask);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Hủy</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{editTask ? 'Sửa công việc' : 'Thêm công việc'}</Text>
          <TouchableOpacity onPress={handleSave}><Text style={styles.modalSave}>Lưu</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <View style={styles.field}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput style={styles.input} placeholder="Nhập tiêu đề" placeholderTextColor="#666" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Mô tả (tùy chọn)" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Ưu tiên</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity key={p} onPress={() => setPriority(p)} style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}>
                  <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[p] }]} />
                  <Text style={[styles.priorityBtnText, priority === p && styles.priorityBtnTextActive]}>{PRIORITY_LABELS[p]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Ngày hết hạn (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2025-12-31" placeholderTextColor="#666" value={dueDate} onChangeText={setDueDate} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Lĩnh vực</Text>
            <View style={styles.areaRow}>
              {AREAS.map(a => (
                <TouchableOpacity key={a} onPress={() => setArea(area === a ? '' : a)} style={[styles.areaChip, area === a && styles.areaChipActive]}>
                  <Text style={[styles.areaChipText, area === a && styles.areaChipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Quick Add Sheet ───
function QuickAddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addTask = useLifeOSStore(s => s.addTask);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, status: 'todo', dueDate: new Date().toISOString().split('T')[0] });
    setTitle(''); setPriority('medium');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Thêm nhanh công việc" height={280}>
      <View style={styles.quickForm}>
        <TextInput
          style={styles.quickInput}
          placeholder="Tên công việc..."
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          autoFocus
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <View style={styles.quickPriorityRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPriority(p)}
              style={[styles.quickPriorityChip, priority === p && { borderColor: PRIORITY_COLORS[p], backgroundColor: PRIORITY_COLORS[p] + '20' }]}
            >
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[p] }]} />
              <Text style={[styles.quickPriorityText, priority === p && { color: PRIORITY_COLORS[p] }]}>{PRIORITY_LABELS[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleAdd} style={[styles.quickAddBtn, !title.trim() && { opacity: 0.4 }]} disabled={!title.trim()}>
          <Text style={styles.quickAddBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const TABS = [
  { key: 'grouped', label: '📋 Nhóm' },
  { key: 'all', label: 'Tất cả' },
  { key: 'todo', label: 'Cần làm' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'done', label: 'Xong' },
];

// ═══════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════
export default function TasksScreen() {
  const tasks = useLifeOSStore(s => s.tasks);
  const updateTask = useLifeOSStore(s => s.updateTask);
  const deleteTask = useLifeOSStore(s => s.deleteTask);
  const { updateTask: syncUpdate } = useTasksSync();
  const { loadAllData } = useDataSync();
  const { isOnline } = useOnlineStatus();

  const [tab, setTab] = useState('grouped');
  const [showAdd, setShowAdd] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [doneCollapsed, setDoneCollapsed] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const activeTasks = useMemo(() => tasks.filter(t => !t.deletedAt && !t.archived), [tasks]);

  // Stats
  const overdueTasks = useMemo(() =>
    activeTasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < todayStr),
    [activeTasks, todayStr]
  );
  const todayTasks = useMemo(() =>
    activeTasks.filter(t => t.status !== 'done' && t.dueDate === todayStr),
    [activeTasks, todayStr]
  );
  const upcomingTasks = useMemo(() =>
    activeTasks.filter(t => t.status !== 'done' && (!t.dueDate || t.dueDate > todayStr)),
    [activeTasks, todayStr]
  );
  const doneTasks = useMemo(() => activeTasks.filter(t => t.status === 'done'), [activeTasks]);
  const doneRate = activeTasks.length > 0 ? Math.round((doneTasks.length / activeTasks.length) * 100) : 0;

  // Grouped sections for SectionList
  const sections = useMemo(() => {
    if (tab === 'grouped') {
      const secs = [];
      if (overdueTasks.length > 0) secs.push({ title: '🔴 Quá hạn', data: overdueTasks, accent: C.danger });
      if (todayTasks.length > 0) secs.push({ title: '🟡 Hôm nay', data: todayTasks, accent: C.warning });
      if (upcomingTasks.length > 0) secs.push({ title: '🔵 Sắp tới', data: upcomingTasks, accent: C.primary });
      if (!doneCollapsed && doneTasks.length > 0) secs.push({ title: '✅ Đã xong', data: doneTasks, accent: C.success });
      return secs;
    }
    // Flat filter
    const filtered = activeTasks.filter(t => tab === 'all' || t.status === tab);
    filtered.sort((a, b) => {
      const order = { in_progress: 0, todo: 1, deferred: 2, done: 3 };
      const ao = order[a.status as keyof typeof order] ?? 99;
      const bo = order[b.status as keyof typeof order] ?? 99;
      if (ao !== bo) return ao - bo;
      const po = { high: 0, medium: 1, low: 2 };
      return (po[a.priority as keyof typeof po] ?? 99) - (po[b.priority as keyof typeof po] ?? 99);
    });
    return [{ title: '', data: filtered, accent: C.fg }];
  }, [tab, overdueTasks, todayTasks, upcomingTasks, doneTasks, doneCollapsed, activeTasks]);

  const handleToggle = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    const updates = {
      status: newStatus as Task['status'],
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
    };
    updateTask(id, updates);
    await syncUpdate(id, updates);
  }, [updateTask, syncUpdate]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Xóa task', 'Bạn có chắc?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  }, [deleteTask]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Công việc</Text>
        </View>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* ── Quick Stats ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statBadge, { borderColor: C.danger + '40' }]}>
          <Text style={[styles.statBadgeVal, { color: C.danger }]}>{overdueTasks.length}</Text>
          <Text style={styles.statBadgeLabel}>quá hạn</Text>
        </View>
        <View style={[styles.statBadge, { borderColor: C.warning + '40' }]}>
          <Text style={[styles.statBadgeVal, { color: C.warning }]}>{todayTasks.length}</Text>
          <Text style={styles.statBadgeLabel}>hôm nay</Text>
        </View>
        <View style={[styles.statBadge, { borderColor: C.primary + '40' }]}>
          <Text style={[styles.statBadgeVal, { color: C.primary }]}>{upcomingTasks.length}</Text>
          <Text style={styles.statBadgeLabel}>sắp tới</Text>
        </View>
        <View style={[styles.statBadge, { borderColor: C.success + '40' }]}>
          <Text style={[styles.statBadgeVal, { color: C.success }]}>{doneRate}%</Text>
          <Text style={styles.statBadgeLabel}>xong</Text>
        </View>
      </View>

      {/* ── Sticky tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Grouped Section List ── */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: section.accent }]}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TaskRow task={item} onPress={setEditTask} onToggle={handleToggle} onDelete={handleDelete} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Không có công việc nào</Text>
            <TouchableOpacity onPress={() => setShowQuickAdd(true)}>
              <Text style={styles.emptyAction}>+ Thêm task mới</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          tab === 'grouped' && doneTasks.length > 0 ? (
            <TouchableOpacity onPress={() => setDoneCollapsed(!doneCollapsed)} style={styles.doneToggle}>
              <Text style={styles.doneToggleText}>
                {doneCollapsed ? `Hiện ${doneTasks.length} task đã xong ▸` : `Ẩn task đã xong ▾`}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* ── FAB ── */}
      <FAB
        onPress={() => setShowQuickAdd(true)}
        onLongPress={() => { setEditTask(null); setShowAdd(true); }}
      />

      {/* ── Sheets & Modals ── */}
      <QuickAddSheet visible={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
      <AddTaskModal
        visible={showAdd || !!editTask}
        onClose={() => { setShowAdd(false); setEditTask(null); }}
        editTask={editTask}
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
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  statBadge: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1,
  },
  statBadgeVal: { fontSize: 18, fontWeight: 'bold' },
  statBadgeLabel: { color: C.muted, fontSize: 10, marginTop: 2 },

  // ── Tabs ──
  tabScroll: { maxHeight: 44, marginBottom: 4 },
  tabContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  tabItem: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card },
  tabItemActive: { backgroundColor: C.primary },
  tabText: { color: C.muted, fontSize: 13 },
  tabTextActive: { color: 'white', fontWeight: '500' },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: C.bg,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  sectionCount: { color: C.muted, fontSize: 12 },

  // ── Task Row ──
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 20,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: C.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskTitle: { color: C.fg, fontSize: 15 },
  taskTitleDone: { textDecorationLine: 'line-through', color: C.muted },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskMetaText: { color: C.muted, fontSize: 12 },

  // ── Done toggle ──
  doneToggle: { paddingVertical: 14, alignItems: 'center' },
  doneToggleText: { color: C.muted, fontSize: 13 },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: C.fg, fontSize: 16, fontWeight: '500' },
  emptyAction: { color: C.primary, fontSize: 14, marginTop: 12, fontWeight: '500' },

  // ── Quick Add ──
  quickForm: { gap: 12 },
  quickInput: {
    backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: C.fg, fontSize: 16,
  },
  quickPriorityRow: { flexDirection: 'row', gap: 8 },
  quickPriorityChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.card,
  },
  quickPriorityText: { color: C.muted, fontSize: 12 },
  quickAddBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  quickAddBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },

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
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  priorityBtnActive: { borderColor: C.primary, backgroundColor: 'rgba(139,92,246,0.1)' },
  priorityBtnText: { color: C.muted, fontSize: 13 },
  priorityBtnTextActive: { color: C.primary },
  areaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  areaChipActive: { borderColor: C.primary, backgroundColor: 'rgba(139,92,246,0.1)' },
  areaChipText: { color: C.muted, fontSize: 13 },
  areaChipTextActive: { color: C.primary },
});
