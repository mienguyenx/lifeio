import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StatusBar, Alert, RefreshControl,
  StyleSheet, FlatList,
} from 'react-native';
import { format } from 'date-fns';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useTasksSync } from '@/hooks/sync/useTasksSync';
import { useDataSync } from '@/hooks/sync/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
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

function TaskRow({ task, onPress, onToggle }: {
  task: Task;
  onPress: (task: Task) => void;
  onToggle: (id: string, status: string) => void;
}) {
  const isDone = task.status === 'done';
  return (
    <TouchableOpacity onPress={() => onPress(task)} style={styles.taskRow} activeOpacity={0.7}>
      <TouchableOpacity
        onPress={() => onToggle(task.id, task.status)}
        style={[styles.checkbox, isDone && styles.checkboxDone]}
      >
        {isDone && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
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
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function AddTaskModal({ visible, onClose, editTask }: {
  visible: boolean;
  onClose: () => void;
  editTask?: Task | null;
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
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        completedPomodoros: 0,
        subtasks: [],
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
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editTask ? 'Sửa công việc' : 'Thêm công việc'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.field}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề công việc"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Mô tả chi tiết (tùy chọn)"
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ưu tiên</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}
                >
                  <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[p] }]} />
                  <Text style={[styles.priorityBtnText, priority === p && styles.priorityBtnTextActive]}>
                    {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ngày hết hạn (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-12-31"
              placeholderTextColor="#666"
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lĩnh vực</Text>
            <View style={styles.areaRow}>
              {AREAS.map(a => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setArea(area === a ? '' : a)}
                  style={[styles.areaChip, area === a && styles.areaChipActive]}
                >
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

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'todo', label: 'Cần làm' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'deferred', label: 'Hoãn' },
  { key: 'done', label: 'Xong' },
];

export default function TasksScreen() {
  const tasks = useLifeOSStore(s => s.tasks);
  const updateTask = useLifeOSStore(s => s.updateTask);
  const { updateTask: syncUpdate } = useTasksSync();
  const { loadAllData } = useDataSync();
  const { isOnline } = useOnlineStatus();

  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const filteredTasks = tasks
    .filter(t => !t.deletedAt && (filter === 'all' || t.status === filter))
    .sort((a, b) => {
      const order = { in_progress: 0, todo: 1, deferred: 2, done: 3 };
      const ao = order[a.status as keyof typeof order] ?? 99;
      const bo = order[b.status as keyof typeof order] ?? 99;
      if (ao !== bo) return ao - bo;
      const po = { high: 0, medium: 1, low: 2 };
      return (po[a.priority as keyof typeof po] ?? 99) - (po[b.priority as keyof typeof po] ?? 99);
    });

  const counts: Record<string, number> = {
    all: tasks.filter(t => !t.deletedAt).length,
    todo: tasks.filter(t => !t.deletedAt && t.status === 'todo').length,
    in_progress: tasks.filter(t => !t.deletedAt && t.status === 'in_progress').length,
    deferred: tasks.filter(t => !t.deletedAt && t.status === 'deferred').length,
    done: tasks.filter(t => !t.deletedAt && t.status === 'done').length,
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    const updates = {
      status: newStatus as Task['status'],
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
    };
    updateTask(id, updates);
    await syncUpdate(id, updates);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Công việc</Text>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
            <View style={[styles.filterCount, filter === f.key && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, filter === f.key && styles.filterCountTextActive]}>
                {counts[f.key]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task list */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskRow task={item} onPress={setEditTask} onToggle={handleToggle} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Không có công việc nào</Text>
            <Text style={styles.emptySubtitle}>Nhấn nút + để thêm công việc mới</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { setEditTask(null); setShowAdd(true); }}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: C.fg, fontSize: 24, fontWeight: 'bold' },
  offlineBadge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' },
  offlineText: { color: C.warning, fontSize: 12 },
  filterScroll: { maxHeight: 48, marginBottom: 4 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card },
  filterTabActive: { backgroundColor: C.primary },
  filterTabText: { color: C.muted, fontSize: 13 },
  filterTabTextActive: { color: 'white' },
  filterCount: { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterCountText: { color: C.muted, fontSize: 11 },
  filterCountTextActive: { color: 'white' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskTitle: { color: C.fg, fontSize: 14 },
  taskTitleDone: { textDecorationLine: 'line-through', color: C.muted },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskMetaText: { color: C.muted, fontSize: 12 },
  chevron: { color: C.muted, fontSize: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: C.fg, fontSize: 16, fontWeight: '500' },
  emptySubtitle: { color: C.muted, fontSize: 14, marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: 'white', fontSize: 28, lineHeight: 32 },
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: C.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
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
