import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, StatusBar, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

// ─── Progress Ring (mini) ───
function MiniRing({ progress, size = 48, color }: { progress: number; size?: number; color: string }) {
  const filled = Math.round((progress / 100) * 8);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: C.border }} />
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: color,
        borderTopColor: filled >= 1 ? color : 'transparent',
        borderRightColor: filled >= 3 ? color : 'transparent',
        borderBottomColor: filled >= 5 ? color : 'transparent',
        borderLeftColor: filled >= 7 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <Text style={{ color: C.fg, fontSize: size * 0.24, fontWeight: 'bold' }}>{Math.round(progress)}%</Text>
    </View>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const PERIODS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
] as const;

export default function DashboardScreen() {
  const tasks = useLifeOSStore(s => s.tasks);
  const habits = useLifeOSStore(s => s.habits);
  const goals = useLifeOSStore(s => s.goals);
  const journalEntries = useLifeOSStore(s => s.journalEntries);
  const notes = useLifeOSStore(s => s.notes);

  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const todayStr = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const now = new Date();
    const activeTasks = tasks.filter(t => !t.deletedAt && !t.archived);
    const activeHabits = habits.filter(h => !h.deletedAt && !h.archivedAt);
    const activeGoals = goals.filter(g => !g.deletedAt);
    const activeNotes = notes.filter(n => !n.deletedAt && !n.archivedAt);

    // Period-filtered tasks
    let periodTasks = activeTasks;
    if (period === 'today') {
      periodTasks = activeTasks.filter(t => t.dueDate === todayStr || (!t.dueDate && t.status !== 'done'));
    } else if (period === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      const ws = weekAgo.toISOString().split('T')[0];
      periodTasks = activeTasks.filter(t => (t.dueDate && t.dueDate >= ws) || t.completedAt && t.completedAt >= ws);
    }
    const donePeriodTasks = periodTasks.filter(t => t.status === 'done');

    // Habits today
    const doneHabits = activeHabits.filter(h => h.completedDates.includes(todayStr));

    // Goals
    const doneGoals = activeGoals.filter(g => g.progress >= 100);
    const avgGoalProgress = activeGoals.length > 0
      ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
      : 0;

    // Journal
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const periodJournals = period === 'today'
      ? journalEntries.filter(j => j.date === todayStr)
      : period === 'week'
        ? journalEntries.filter(j => j.date >= weekStr)
        : journalEntries.filter(j => j.date.startsWith(todayStr.slice(0, 7)));
    const avgMood = periodJournals.length > 0
      ? (periodJournals.reduce((s, j) => s + j.mood, 0) / periodJournals.length).toFixed(1)
      : '—';

    // Overall score
    const taskPct = periodTasks.length > 0 ? (donePeriodTasks.length / periodTasks.length) * 100 : 100;
    const habitPct = activeHabits.length > 0 ? (doneHabits.length / activeHabits.length) * 100 : 100;
    const overallScore = Math.round((taskPct + habitPct + avgGoalProgress) / 3);

    return {
      totalTasks: periodTasks.length, doneTasks: donePeriodTasks.length,
      totalHabits: activeHabits.length, doneHabits: doneHabits.length,
      totalGoals: activeGoals.length, doneGoals: doneGoals.length,
      avgGoalProgress, totalNotes: activeNotes.length,
      journalCount: periodJournals.length, avgMood,
      overallScore,
    };
  }, [tasks, habits, goals, journalEntries, notes, todayStr, period]);

  return (
    <>
      <Stack.Screen options={{ title: 'Dashboard' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Period Toggle ── */}
          <View style={styles.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={[styles.periodTab, period === p.key && styles.periodTabActive]}>
                <Text style={[styles.periodTabText, period === p.key && styles.periodTabTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Overall Score ── */}
          <View style={styles.scoreCard}>
            <MiniRing progress={stats.overallScore} size={72} color={stats.overallScore >= 70 ? C.success : stats.overallScore >= 40 ? C.primary : C.warning} />
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.scoreLabel}>Điểm tổng hợp</Text>
              <Text style={styles.scoreValue}>{stats.overallScore}/100</Text>
              <Text style={styles.scoreHint}>
                {stats.overallScore >= 80 ? '🔥 Tuyệt vời!' : stats.overallScore >= 50 ? '💪 Khá tốt' : '🌱 Cố gắng thêm'}
              </Text>
            </View>
          </View>

          {/* ── Widget Grid ── */}
          <View style={styles.section}>
            <View style={styles.widgetGrid}>
              <TouchableOpacity style={styles.widgetCard} onPress={() => router.push('/(tabs)/tasks' as any)} activeOpacity={0.7}>
                <View style={styles.widgetHeader}>
                  <Text style={styles.widgetIcon}>✅</Text>
                  <Text style={styles.widgetArrow}>›</Text>
                </View>
                <Text style={styles.widgetValue}>{stats.doneTasks}<Text style={styles.widgetTotal}>/{stats.totalTasks}</Text></Text>
                <Text style={styles.widgetLabel}>Tasks</Text>
                <ProgressBar value={stats.doneTasks} max={stats.totalTasks} color={C.success} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.widgetCard} onPress={() => router.push('/(tabs)/habits' as any)} activeOpacity={0.7}>
                <View style={styles.widgetHeader}>
                  <Text style={styles.widgetIcon}>🔄</Text>
                  <Text style={styles.widgetArrow}>›</Text>
                </View>
                <Text style={styles.widgetValue}>{stats.doneHabits}<Text style={styles.widgetTotal}>/{stats.totalHabits}</Text></Text>
                <Text style={styles.widgetLabel}>Habits</Text>
                <ProgressBar value={stats.doneHabits} max={stats.totalHabits} color={C.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.widgetCard} onPress={() => router.push('/(tabs)/goals' as any)} activeOpacity={0.7}>
                <View style={styles.widgetHeader}>
                  <Text style={styles.widgetIcon}>🎯</Text>
                  <Text style={styles.widgetArrow}>›</Text>
                </View>
                <Text style={styles.widgetValue}>{stats.avgGoalProgress}<Text style={styles.widgetTotal}>%</Text></Text>
                <Text style={styles.widgetLabel}>Goals</Text>
                <ProgressBar value={stats.avgGoalProgress} max={100} color={C.warning} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.widgetCard} onPress={() => router.push('/(screens)/journal' as any)} activeOpacity={0.7}>
                <View style={styles.widgetHeader}>
                  <Text style={styles.widgetIcon}>😊</Text>
                  <Text style={styles.widgetArrow}>›</Text>
                </View>
                <Text style={styles.widgetValue}>{stats.avgMood}</Text>
                <Text style={styles.widgetLabel}>Mood TB</Text>
                <ProgressBar value={parseFloat(stats.avgMood) || 0} max={5} color='#ec4899' />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Module Quick Links ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modules</Text>
            {[
              { icon: '✅', label: 'Công việc', sub: `${stats.doneTasks}/${stats.totalTasks} hoàn thành`, color: C.success, route: '/(tabs)/tasks' },
              { icon: '🔄', label: 'Thói quen', sub: `${stats.doneHabits}/${stats.totalHabits} hôm nay`, color: C.primary, route: '/(tabs)/habits' },
              { icon: '🎯', label: 'Mục tiêu', sub: `${stats.doneGoals} xong / ${stats.totalGoals} tổng`, color: C.warning, route: '/(tabs)/goals' },
              { icon: '📝', label: 'Nhật ký', sub: `${stats.journalCount} bài · mood ${stats.avgMood}`, color: '#ec4899', route: '/(screens)/journal' },
              { icon: '📒', label: 'Ghi chú', sub: `${stats.totalNotes} ghi chú`, color: '#f59e0b', route: '/(screens)/notes' },
              { icon: '🤖', label: 'AI Chat', sub: 'Hỏi trợ lý AI', color: C.primary, route: '/(screens)/ai-chat' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.moduleRow}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.moduleIconBg, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.moduleIcon}>{item.icon}</Text>
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleLabel}>{item.label}</Text>
                  <Text style={styles.moduleSub}>{item.sub}</Text>
                </View>
                <Text style={styles.moduleArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Period Toggle ──
  periodRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  periodTab: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: C.card },
  periodTabActive: { backgroundColor: C.primary },
  periodTabText: { color: C.muted, fontSize: 13, fontWeight: '500' },
  periodTabTextActive: { color: 'white' },

  // ── Score Card ──
  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginVertical: 8, padding: 16,
    backgroundColor: C.card, borderRadius: 16,
  },
  scoreLabel: { color: C.muted, fontSize: 12 },
  scoreValue: { color: C.fg, fontSize: 24, fontWeight: 'bold' },
  scoreHint: { color: C.muted, fontSize: 12, marginTop: 2 },

  // ── Section ──
  section: { marginTop: 12, paddingHorizontal: 20 },
  sectionTitle: { color: C.fg, fontSize: 18, fontWeight: '600', marginBottom: 12 },

  // ── Widget Grid ──
  widgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  widgetCard: { width: '48%', backgroundColor: C.card, borderRadius: 16, padding: 14 },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  widgetIcon: { fontSize: 22 },
  widgetArrow: { color: C.muted, fontSize: 18 },
  widgetValue: { color: C.fg, fontSize: 24, fontWeight: 'bold' },
  widgetTotal: { color: C.muted, fontSize: 14, fontWeight: '500' },
  widgetLabel: { color: C.muted, fontSize: 12, marginTop: 2, marginBottom: 8 },

  // ── Progress ──
  progressBg: { height: 4, backgroundColor: C.border, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2, minWidth: 2 },

  // ── Module Rows ──
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  moduleIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moduleIcon: { fontSize: 20 },
  moduleInfo: { flex: 1 },
  moduleLabel: { color: C.fg, fontSize: 15, fontWeight: '500' },
  moduleSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  moduleArrow: { color: C.muted, fontSize: 22 },
});
