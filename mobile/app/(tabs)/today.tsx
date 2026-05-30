import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, SafeAreaView, StatusBar, StyleSheet,
  Dimensions, Animated,
} from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { router } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useDataSync } from '@/hooks/sync/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { Task, Habit } from '@/types/lifeos';

const { width: SCREEN_W } = Dimensions.get('window');
const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: C.danger, medium: C.warning, low: C.success,
};

const GREETINGS = ['Chào buổi sáng', 'Chào buổi trưa', 'Chào buổi chiều', 'Chào buổi tối'];
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 14) return GREETINGS[1];
  if (h < 18) return GREETINGS[2];
  return GREETINGS[3];
}

const QUOTES = [
  'Mỗi ngày mới là một cơ hội mới.',
  'Tiến bộ, không phải hoàn hảo.',
  'Hành trình ngàn dặm bắt đầu từ một bước.',
  'Kỷ luật là cầu nối giữa mục tiêu và thành tựu.',
  'Đừng đợi hoàn hảo, hãy bắt đầu ngay.',
];

// ─── Progress Ring ───
function ProgressRing({ size, strokeWidth, progress, color }: {
  size: number; strokeWidth: number; progress: number; color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      {/* Background circle */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeWidth,
        borderColor: C.border, opacity: 0.3,
      }} />
      {/* Progress arc (simplified with border trick) */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeWidth,
        borderColor: color,
        borderTopColor: progress > 0.25 ? color : 'transparent',
        borderRightColor: progress > 0.5 ? color : 'transparent',
        borderBottomColor: progress > 0.75 ? color : 'transparent',
        borderLeftColor: progress > 0 ? color : 'transparent',
        opacity: progress > 0 ? 1 : 0.2,
      }} />
    </View>
  );
}

// ─── Swipeable Task Item ───
function TaskItem({ task, onToggle, onDelete }: {
  task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void;
}) {
  const isDone = task.status === 'done';
  return (
    <SwipeableRow
      leftActions={[{ label: isDone ? 'Undo' : 'Done', color: C.success, icon: '✓', onPress: () => onToggle(task.id) }]}
      rightActions={[{ label: 'Xóa', color: C.danger, icon: '🗑', onPress: () => onDelete(task.id) }]}
    >
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
    </SwipeableRow>
  );
}

// ─── Swipeable Habit Item ───
function HabitItem({ habit, todayStr, isDone, onToggle }: {
  habit: Habit; todayStr: string; isDone: boolean; onToggle: () => void;
}) {
  return (
    <SwipeableRow
      leftActions={[{
        label: isDone ? 'Undo' : 'Done',
        color: isDone ? C.warning : C.success,
        icon: isDone ? '↩' : '✓',
        onPress: onToggle,
      }]}
    >
      <TouchableOpacity onPress={onToggle} style={styles.habitRow} activeOpacity={0.7}>
        <View style={[styles.habitCheck, isDone && styles.habitCheckDone]}>
          {isDone ? (
            <Text style={{ fontSize: 13, color: 'white' }}>✓</Text>
          ) : (
            <Text style={{ fontSize: 16 }}>{habit.icon || '○'}</Text>
          )}
        </View>
        <Text style={[styles.habitName, isDone && styles.habitNameDone]} numberOfLines={1}>
          {habit.name}
        </Text>
        {habit.streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {habit.streak}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SwipeableRow>
  );
}

// ─── Section Header (collapsible) ───
function SectionHeader({ title, count, total, collapsed, onToggle }: {
  title: string; count?: number; total?: number; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.sectionHeader} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof count === 'number' && typeof total === 'number' && (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{count}/{total}</Text>
        </View>
      )}
      <Text style={styles.collapseIcon}>{collapsed ? '▸' : '▾'}</Text>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════
export default function TodayScreen() {
  const { isOnline } = useOnlineStatus();
  const { loadAllData } = useDataSync();
  const tasks = useLifeOSStore(s => s.tasks);
  const habits = useLifeOSStore(s => s.habits);
  const journalEntries = useLifeOSStore(s => s.journalEntries);
  const updateTask = useLifeOSStore(s => s.updateTask);
  const deleteTask = useLifeOSStore(s => s.deleteTask);
  const toggleHabitCompletion = useLifeOSStore(s => s.toggleHabitCompletion);
  const addTask = useLifeOSStore(s => s.addTask);
  const addDailyIntention = useLifeOSStore(s => s.addDailyIntention);
  const getTodayIntention = useLifeOSStore(s => s.getTodayIntention);
  const userName = useLifeOSStore(s => s.user?.name) || 'User';

  const [refreshing, setRefreshing] = useState(false);
  const [habitsCollapsed, setHabitsCollapsed] = useState(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);
  const [doneCollapsed, setDoneCollapsed] = useState(true);

  // Quick add states
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [showIntention, setShowIntention] = useState(false);
  const [intentionText, setIntentionText] = useState('');

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const greeting = getGreeting();
  const quoteOfDay = QUOTES[today.getDate() % QUOTES.length];
  const intention = getTodayIntention();

  // ── Data ──
  const todayTasks = useMemo(() =>
    tasks.filter(t =>
      !t.deletedAt && !t.archived &&
      (t.status === 'in_progress' || t.dueDate === todayStr || t.status === 'todo')
    ).slice(0, 30),
    [tasks, todayStr]
  );
  const doneTasks = useMemo(() => todayTasks.filter(t => t.status === 'done'), [todayTasks]);
  const pendingTasks = useMemo(() => todayTasks.filter(t => t.status !== 'done'), [todayTasks]);

  const activeHabits = useMemo(() => habits.filter(h => !h.deletedAt && !h.archivedAt), [habits]);
  const completedHabits = useMemo(() => activeHabits.filter(h => h.completedDates.includes(todayStr)), [activeHabits, todayStr]);
  const pendingHabits = useMemo(() => activeHabits.filter(h => !h.completedDates.includes(todayStr)), [activeHabits, todayStr]);

  // Overall day progress
  const totalItems = todayTasks.length + activeHabits.length;
  const doneItems = doneTasks.length + completedHabits.length;
  const dayProgress = totalItems > 0 ? doneItems / totalItems : 0;
  const dayPct = Math.round(dayProgress * 100);

  // Journal today?
  const hasJournalToday = journalEntries.some(j => j.date === todayStr);

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleToggle = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask(id, {
      status: newStatus as Task['status'],
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
    });
  }, [tasks, updateTask]);

  const handleDeleteTask = useCallback((id: string) => {
    deleteTask(id);
  }, [deleteTask]);

  const handleQuickAddTask = () => {
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      priority: 'medium',
      status: 'todo',
      dueDate: todayStr,
    });
    setQuickTaskTitle('');
    setShowQuickTask(false);
  };

  const handleAddIntention = () => {
    if (!intentionText.trim()) return;
    addDailyIntention(intentionText.trim());
    setIntentionText('');
    setShowIntention(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerDate}>
              {format(today, 'EEEE, dd MMMM', { locale: vi })}
            </Text>
            <Text style={styles.headerGreeting}>{greeting}, {userName.split(' ')[0]} 👋</Text>
          </View>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>

        {/* ── Summary Card with Progress Ring ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.ringWrapper}>
              <ProgressRing size={72} strokeWidth={6} progress={dayProgress} color={C.primary} />
              <Text style={styles.ringPct}>{dayPct}%</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryTitle}>Tiến độ hôm nay</Text>
            <Text style={styles.summaryDetail}>
              {doneItems}/{totalItems} hoàn thành
            </Text>
            <View style={styles.summaryMini}>
              <Text style={styles.miniStat}>✅ {doneTasks.length}/{todayTasks.length} tasks</Text>
              <Text style={styles.miniStat}>🎯 {completedHabits.length}/{activeHabits.length} habits</Text>
            </View>
            {/* Quote */}
            <Text style={styles.quote}>"{quoteOfDay}"</Text>
          </View>
        </View>

        {/* ── Daily Intention ── */}
        {intention ? (
          <View style={styles.intentionCard}>
            <Text style={styles.intentionLabel}>🎯 Mục tiêu hôm nay</Text>
            <Text style={styles.intentionText}>{intention.intention}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.intentionPrompt} onPress={() => setShowIntention(true)}>
            <Text style={styles.intentionPromptText}>🎯 Đặt mục tiêu cho hôm nay →</Text>
          </TouchableOpacity>
        )}

        {/* ── Quick Actions Strip ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickStrip} contentContainerStyle={styles.quickStripContent}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => setShowQuickTask(true)}>
            <View style={[styles.quickIcon, { backgroundColor: C.success + '20' }]}>
              <Text style={styles.quickIconText}>✚</Text>
            </View>
            <Text style={styles.quickLabel}>Thêm task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/habits' as any)}>
            <View style={[styles.quickIcon, { backgroundColor: C.primary + '20' }]}>
              <Text style={styles.quickIconText}>🎯</Text>
            </View>
            <Text style={styles.quickLabel}>Thói quen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(screens)/journal' as any)}>
            <View style={[styles.quickIcon, { backgroundColor: '#ec4899' + '20' }]}>
              <Text style={styles.quickIconText}>{hasJournalToday ? '📝' : '✏️'}</Text>
            </View>
            <Text style={styles.quickLabel}>{hasJournalToday ? 'Nhật ký' : 'Viết NK'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(screens)/dashboard' as any)}>
            <View style={[styles.quickIcon, { backgroundColor: '#3b82f6' + '20' }]}>
              <Text style={styles.quickIconText}>📊</Text>
            </View>
            <Text style={styles.quickLabel}>Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Habits Section (collapsible) ── */}
        {activeHabits.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="🎯 Thói quen"
              count={completedHabits.length}
              total={activeHabits.length}
              collapsed={habitsCollapsed}
              onToggle={() => setHabitsCollapsed(!habitsCollapsed)}
            />
            {!habitsCollapsed && (
              <>
                {pendingHabits.map(h => (
                  <HabitItem
                    key={h.id}
                    habit={h}
                    todayStr={todayStr}
                    isDone={false}
                    onToggle={() => toggleHabitCompletion(h.id, todayStr)}
                  />
                ))}
                {completedHabits.map(h => (
                  <HabitItem
                    key={h.id}
                    habit={h}
                    todayStr={todayStr}
                    isDone={true}
                    onToggle={() => toggleHabitCompletion(h.id, todayStr)}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Tasks Section (collapsible) ── */}
        <View style={styles.section}>
          <SectionHeader
            title="✅ Công việc"
            count={doneTasks.length}
            total={todayTasks.length}
            collapsed={tasksCollapsed}
            onToggle={() => setTasksCollapsed(!tasksCollapsed)}
          />
          {!tasksCollapsed && (
            <>
              {pendingTasks.length === 0 && doneTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎉</Text>
                  <Text style={styles.emptyTitle}>Không có task!</Text>
                  <TouchableOpacity onPress={() => setShowQuickTask(true)}>
                    <Text style={styles.emptyAction}>+ Thêm task mới</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {pendingTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDeleteTask} />
                  ))}
                  {doneTasks.length > 0 && (
                    <>
                      <TouchableOpacity onPress={() => setDoneCollapsed(!doneCollapsed)} style={styles.doneToggle}>
                        <Text style={styles.doneLabel}>
                          Đã hoàn thành ({doneTasks.length}) {doneCollapsed ? '▸' : '▾'}
                        </Text>
                      </TouchableOpacity>
                      {!doneCollapsed && doneTasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDeleteTask} />
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Quick Add Task Bottom Sheet ── */}
      <BottomSheet visible={showQuickTask} onClose={() => setShowQuickTask(false)} title="Thêm task nhanh" height={220}>
        <View style={styles.quickAddForm}>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Tên công việc..."
            placeholderTextColor="#666"
            value={quickTaskTitle}
            onChangeText={setQuickTaskTitle}
            autoFocus
            onSubmitEditing={handleQuickAddTask}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleQuickAddTask} style={styles.quickAddBtn}>
            <Text style={styles.quickAddBtnText}>Thêm</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ── Intention Bottom Sheet ── */}
      <BottomSheet visible={showIntention} onClose={() => setShowIntention(false)} title="Mục tiêu hôm nay" height={220}>
        <View style={styles.quickAddForm}>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Hôm nay tôi muốn..."
            placeholderTextColor="#666"
            value={intentionText}
            onChangeText={setIntentionText}
            autoFocus
            onSubmitEditing={handleAddIntention}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleAddIntention} style={styles.quickAddBtn}>
            <Text style={styles.quickAddBtnText}>Đặt mục tiêu</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  headerDate: { color: C.muted, fontSize: 13 },
  headerGreeting: { color: C.fg, fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  offlineBadge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  offlineText: { color: C.warning, fontSize: 12 },

  // ── Summary Card ──
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 20, marginTop: 16, padding: 20,
    backgroundColor: C.card, borderRadius: 20,
  },
  summaryLeft: { alignItems: 'center' },
  ringWrapper: { alignItems: 'center', justifyContent: 'center' },
  ringPct: {
    position: 'absolute', color: C.fg, fontSize: 16, fontWeight: 'bold',
    top: 24,
  },
  summaryRight: { flex: 1 },
  summaryTitle: { color: C.fg, fontSize: 16, fontWeight: '600' },
  summaryDetail: { color: C.muted, fontSize: 13, marginTop: 2 },
  summaryMini: { flexDirection: 'row', gap: 12, marginTop: 8 },
  miniStat: { color: C.muted, fontSize: 12 },
  quote: { color: '#555', fontSize: 11, fontStyle: 'italic', marginTop: 8 },

  // ── Intention ──
  intentionCard: {
    marginHorizontal: 20, marginTop: 12, padding: 14,
    backgroundColor: C.primary + '15', borderRadius: 14,
    borderWidth: 1, borderColor: C.primary + '30',
  },
  intentionLabel: { color: C.primary, fontSize: 12, fontWeight: '600' },
  intentionText: { color: C.fg, fontSize: 14, marginTop: 4 },
  intentionPrompt: {
    marginHorizontal: 20, marginTop: 12, paddingVertical: 12,
    paddingHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
  },
  intentionPromptText: { color: C.muted, fontSize: 13, textAlign: 'center' },

  // ── Quick Actions ──
  quickStrip: { marginTop: 16 },
  quickStripContent: { paddingHorizontal: 20, gap: 12 },
  quickBtn: { alignItems: 'center', width: 70 },
  quickIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  quickIconText: { fontSize: 20 },
  quickLabel: { color: C.muted, fontSize: 11, textAlign: 'center' },

  // ── Section ──
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { flex: 1, color: C.fg, fontSize: 17, fontWeight: '600' },
  sectionBadge: { backgroundColor: C.primary + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 8 },
  sectionBadgeText: { color: C.primary, fontSize: 12, fontWeight: '600' },
  collapseIcon: { color: C.muted, fontSize: 14 },

  // ── Habit ──
  habitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 4,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  habitCheck: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: C.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  habitCheckDone: { backgroundColor: C.success, borderColor: C.success },
  habitName: { flex: 1, color: C.fg, fontSize: 15 },
  habitNameDone: { textDecorationLine: 'line-through', color: C.muted },
  streakBadge: { backgroundColor: C.warning + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  streakText: { color: C.warning, fontSize: 12, fontWeight: '500' },

  // ── Task ──
  taskRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, paddingHorizontal: 4,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.muted, marginTop: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskTitle: { color: C.fg, fontSize: 15 },
  taskTitleDone: { textDecorationLine: 'line-through', color: C.muted },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskDate: { color: C.muted, fontSize: 12 },

  // ── Done section ──
  doneToggle: { paddingVertical: 10 },
  doneLabel: { color: C.muted, fontSize: 13 },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: C.fg, fontSize: 15, fontWeight: '500' },
  emptyAction: { color: C.primary, fontSize: 14, marginTop: 12, fontWeight: '500' },

  // ── Quick Add ──
  quickAddForm: { paddingVertical: 12, gap: 12 },
  quickAddInput: {
    backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: C.fg, fontSize: 16,
  },
  quickAddBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  quickAddBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
