import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView, StatusBar, StyleSheet,
} from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useDataSync } from '@/hooks/sync/useDataSync';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { Task } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: C.danger, medium: C.warning, low: C.success,
};

function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const isDone = task.status === 'done';
  return (
    <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.taskRow} activeOpacity={0.7}>
      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
        {isDone && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
          {task.dueDate && (
            <Text style={styles.taskDate}>
              {format(new Date(task.dueDate), 'dd/MM', { locale: vi })}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const { signOut } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { loadAllData } = useDataSync();
  const tasks = useLifeOSStore(s => s.tasks);
  const updateTask = useLifeOSStore(s => s.updateTask);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayTasks = tasks.filter(t =>
    !t.deletedAt && !t.archived &&
    (t.status === 'in_progress' || t.dueDate === todayStr || t.status === 'todo')
  ).slice(0, 20);

  const doneTasks = todayTasks.filter(t => t.status === 'done');
  const pendingTasks = todayTasks.filter(t => t.status !== 'done');

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask(id, {
      status: newStatus as Task['status'],
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerDate}>
              {format(today, 'EEEE, dd MMMM', { locale: vi })}
            </Text>
            <Text style={styles.headerTitle}>Hôm nay</Text>
          </View>
          <View style={styles.headerRight}>
            {!isOnline && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
            <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Hoàn thành</Text>
            <Text style={styles.statValue}>{doneTasks.length}</Text>
            <Text style={styles.statSub}>/ {todayTasks.length} tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Còn lại</Text>
            <Text style={[styles.statValue, { color: C.primary }]}>{pendingTasks.length}</Text>
            <Text style={styles.statSub}>tasks cần làm</Text>
          </View>
        </View>

        {/* Task list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công việc hôm nay</Text>
          {todayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>Không có task nào!</Text>
              <Text style={styles.emptySubtitle}>Thêm task mới trong tab Công việc</Text>
            </View>
          ) : (
            <>
              {pendingTasks.map(task => (
                <TaskItem key={task.id} task={task} onToggle={handleToggle} />
              ))}
              {doneTasks.length > 0 && (
                <>
                  <Text style={styles.doneLabel}>Đã hoàn thành</Text>
                  {doneTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={handleToggle} />
                  ))}
                </>
              )}
            </>
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerDate: { color: C.muted, fontSize: 13 },
  headerTitle: { color: C.fg, fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offlineBadge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  offlineText: { color: C.warning, fontSize: 12 },
  signOutBtn: { padding: 8 },
  signOutText: { color: C.muted, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16 },
  statLabel: { color: C.muted, fontSize: 12, marginBottom: 4 },
  statValue: { color: C.fg, fontSize: 28, fontWeight: 'bold' },
  statSub: { color: C.muted, fontSize: 12 },
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { color: C.fg, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.muted, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskTitle: { color: C.fg, fontSize: 15 },
  taskTitleDone: { textDecorationLine: 'line-through', color: C.muted },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskDate: { color: C.muted, fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: C.fg, fontSize: 16, fontWeight: '500' },
  emptySubtitle: { color: C.muted, fontSize: 14, marginTop: 4 },
  doneLabel: { color: C.muted, fontSize: 13, marginTop: 16, marginBottom: 8 },
});
