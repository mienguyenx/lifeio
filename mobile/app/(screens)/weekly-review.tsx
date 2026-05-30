import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { FAB } from '@/components/ui';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const WIZARD_STEPS = [
  { key: 'reflect', title: 'Nhìn lại', icon: '🔍', desc: 'Đánh giá tuần vừa qua' },
  { key: 'rate', title: 'Đánh giá', icon: '⭐', desc: 'Chấm điểm tuần' },
  { key: 'plan', title: 'Lên kế hoạch', icon: '🎯', desc: 'Focus tuần tới' },
] as const;

const RATING_LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];

export default function WeeklyReviewScreen() {
  const weeklyReviews = useLifeOSStore(s => s.weeklyReviews);
  const addWeeklyReview = useLifeOSStore(s => s.addWeeklyReview);
  const tasks = useLifeOSStore(s => s.tasks);
  const habits = useLifeOSStore(s => s.habits);
  const goals = useLifeOSStore(s => s.goals);

  const [showNew, setShowNew] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [overallRating, setOverallRating] = useState<1|2|3|4|5>(3);

  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const weekStats = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.deletedAt && !t.archived);
    const weekDone = activeTasks.filter(t =>
      t.status === 'done' && t.completedAt && t.completedAt >= weekStart && t.completedAt <= weekEnd + 'T23:59:59'
    );
    const activeHabits = habits.filter(h => !h.deletedAt && !h.archivedAt);
    const totalHabitDays = activeHabits.length * 7;
    const completedHabitDays = activeHabits.reduce((sum, h) => {
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        if (h.completedDates.includes(d.toISOString().split('T')[0])) count++;
      }
      return sum + count;
    }, 0);
    return {
      tasksCompleted: weekDone.length, totalTasks: activeTasks.length,
      habitRate: totalHabitDays > 0 ? Math.round((completedHabitDays / totalHabitDays) * 100) : 0,
      goalsCount: goals.filter(g => !g.deletedAt).length,
    };
  }, [tasks, habits, goals, weekStart, weekEnd]);

  const hasCurrentReview = weeklyReviews.some(r => r.weekStart === weekStart);

  const handleSave = () => {
    if (!wins.trim() && !challenges.trim()) {
      Alert.alert('Lỗi', 'Viết ít nhất 1 điều thắng lợi hoặc thách thức');
      return;
    }
    addWeeklyReview({
      weekStart,
      wins: wins.split('\n').filter(w => w.trim()),
      challenges: challenges.split('\n').filter(c => c.trim()),
      lessonsLearned: lessonsLearned.split('\n').filter(l => l.trim()),
      nextWeekFocus: nextWeekFocus.split('\n').filter(g => g.trim()),
      overallRating,
    });
    setWins(''); setChallenges(''); setLessonsLearned(''); setNextWeekFocus('');
    setShowNew(false); setWizardStep(0);
  };

  const startWizard = () => { setShowNew(true); setWizardStep(0); };
  const canGoNext = wizardStep < 2;
  const canGoPrev = wizardStep > 0;

  const sortedReviews = [...weeklyReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return (
    <>
      <Stack.Screen options={{ title: 'Review tuần' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Week Summary Card ── */}
          <View style={styles.weekCard}>
            <Text style={styles.weekLabel}>Tuần {format(today, "'W'w", { locale: vi })}</Text>
            <Text style={styles.weekRange}>{format(new Date(weekStart), 'dd/MM')} - {format(new Date(weekEnd), 'dd/MM')}</Text>
            <View style={styles.weekStats}>
              <View style={styles.weekStat}>
                <Text style={styles.weekStatValue}>{weekStats.tasksCompleted}</Text>
                <Text style={styles.weekStatLabel}>Tasks xong</Text>
              </View>
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatValue, { color: C.primary }]}>{weekStats.habitRate}%</Text>
                <Text style={styles.weekStatLabel}>Habit rate</Text>
              </View>
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatValue, { color: C.warning }]}>{weekStats.goalsCount}</Text>
                <Text style={styles.weekStatLabel}>Goals</Text>
              </View>
            </View>
          </View>

          {/* ── Prompt or Wizard ── */}
          {!showNew && !hasCurrentReview && (
            <TouchableOpacity style={styles.promptCard} onPress={startWizard}>
              <Text style={styles.promptEmoji}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.promptTitle}>Viết review tuần này</Text>
                <Text style={styles.promptSub}>3 bước: Nhìn lại → Đánh giá → Kế hoạch</Text>
              </View>
              <Text style={styles.promptArrow}>→</Text>
            </TouchableOpacity>
          )}

          {showNew && (
            <View style={styles.wizardCard}>
              {/* Step indicators */}
              <View style={styles.stepRow}>
                {WIZARD_STEPS.map((s, i) => (
                  <TouchableOpacity key={s.key} onPress={() => setWizardStep(i)} style={styles.stepItem}>
                    <View style={[styles.stepDot, i === wizardStep && styles.stepDotActive, i < wizardStep && styles.stepDotDone]}>
                      <Text style={styles.stepDotText}>{i < wizardStep ? '✓' : s.icon}</Text>
                    </View>
                    <Text style={[styles.stepLabel, i === wizardStep && styles.stepLabelActive]}>{s.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.stepProgress}>
                <View style={[styles.stepProgressFill, { width: `${((wizardStep + 1) / 3) * 100}%` }]} />
              </View>

              {/* Step 0: Reflect */}
              {wizardStep === 0 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>🔍 Nhìn lại tuần vừa qua</Text>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>🏆 Thắng lợi (mỗi dòng 1 điều)</Text>
                    <TextInput style={styles.textArea} placeholder="Hoàn thành dự án X..." placeholderTextColor="#666" value={wins} onChangeText={setWins} multiline textAlignVertical="top" />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>⚡ Thách thức</Text>
                    <TextInput style={styles.textArea} placeholder="Khó tập trung..." placeholderTextColor="#666" value={challenges} onChangeText={setChallenges} multiline textAlignVertical="top" />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>💡 Bài học rút ra</Text>
                    <TextInput style={styles.textArea} placeholder="Cần chia nhỏ task hơn..." placeholderTextColor="#666" value={lessonsLearned} onChangeText={setLessonsLearned} multiline textAlignVertical="top" />
                  </View>
                </View>
              )}

              {/* Step 1: Rate */}
              {wizardStep === 1 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>⭐ Đánh giá tuần này</Text>
                  <Text style={styles.ratingQuestion}>Tuần này của bạn thế nào?</Text>
                  <View style={styles.ratingRow}>
                    {([1,2,3,4,5] as const).map(r => (
                      <TouchableOpacity key={r} onPress={() => setOverallRating(r)} style={[styles.ratingBtn, overallRating === r && styles.ratingBtnActive]}>
                        <Text style={[styles.ratingBtnEmoji, overallRating === r && styles.ratingBtnEmojiActive]}>
                          {['', '😞', '😐', '🙂', '😊', '🤩'][r]}
                        </Text>
                        <Text style={[styles.ratingBtnNum, overallRating === r && { color: C.primary }]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.ratingLabel}>{RATING_LABELS[overallRating]}</Text>

                  {/* Mini stats reminder */}
                  <View style={styles.miniStats}>
                    <View style={styles.miniStat}><Text style={styles.miniStatValue}>✅ {weekStats.tasksCompleted}</Text><Text style={styles.miniStatLabel}>tasks</Text></View>
                    <View style={styles.miniStat}><Text style={styles.miniStatValue}>🔄 {weekStats.habitRate}%</Text><Text style={styles.miniStatLabel}>habits</Text></View>
                  </View>
                </View>
              )}

              {/* Step 2: Plan */}
              {wizardStep === 2 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>🎯 Kế hoạch tuần tới</Text>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Focus chính (mỗi dòng 1 mục)</Text>
                    <TextInput style={[styles.textArea, { minHeight: 120 }]} placeholder="Hoàn thành module Y\nĐọc 2 chương sách..." placeholderTextColor="#666" value={nextWeekFocus} onChangeText={setNextWeekFocus} multiline textAlignVertical="top" />
                  </View>
                </View>
              )}

              {/* Nav buttons */}
              <View style={styles.wizardNav}>
                {canGoPrev ? (
                  <TouchableOpacity onPress={() => setWizardStep(s => s - 1)} style={styles.navBtnSecondary}>
                    <Text style={styles.navBtnSecondaryText}>← Quay lại</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => { setShowNew(false); setWizardStep(0); }} style={styles.navBtnSecondary}>
                    <Text style={styles.navBtnSecondaryText}>Hủy</Text>
                  </TouchableOpacity>
                )}
                {canGoNext ? (
                  <TouchableOpacity onPress={() => setWizardStep(s => s + 1)} style={styles.navBtnPrimary}>
                    <Text style={styles.navBtnPrimaryText}>Tiếp →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleSave} style={styles.navBtnPrimary}>
                    <Text style={styles.navBtnPrimaryText}>✓ Lưu review</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Past Reviews ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử review</Text>
            {sortedReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Chưa có review nào</Text>
              </View>
            ) : (
              sortedReviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewWeek}>Tuần {review.weekStart}</Text>
                    <View style={styles.reviewRating}>
                      <Text style={styles.reviewRatingText}>
                        {['', '😞', '😐', '🙂', '😊', '🤩'][review.overallRating || 3]} {review.overallRating || 3}/5
                      </Text>
                    </View>
                  </View>
                  {review.wins && review.wins.length > 0 && (
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>🏆 Thắng lợi</Text>
                      {review.wins.map((w: string, i: number) => <Text key={i} style={styles.reviewItem}>• {w}</Text>)}
                    </View>
                  )}
                  {review.challenges && review.challenges.length > 0 && (
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>⚡ Thách thức</Text>
                      {review.challenges.map((c: string, i: number) => <Text key={i} style={styles.reviewItem}>• {c}</Text>)}
                    </View>
                  )}
                  {review.lessonsLearned && review.lessonsLearned.length > 0 && (
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>💡 Bài học</Text>
                      {review.lessonsLearned.map((l: string, i: number) => <Text key={i} style={styles.reviewItem}>• {l}</Text>)}
                    </View>
                  )}
                  {review.nextWeekFocus && review.nextWeekFocus.length > 0 && (
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>🎯 Focus</Text>
                      {review.nextWeekFocus.map((f: string, i: number) => <Text key={i} style={styles.reviewItem}>• {f}</Text>)}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        {!showNew && !hasCurrentReview && <FAB onPress={startWizard} />}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Week Card ──
  weekCard: { margin: 20, padding: 20, backgroundColor: C.card, borderRadius: 20 },
  weekLabel: { color: C.primary, fontSize: 14, fontWeight: '600' },
  weekRange: { color: C.fg, fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  weekStats: { flexDirection: 'row', marginTop: 16, gap: 12 },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatValue: { color: C.fg, fontSize: 22, fontWeight: 'bold' },
  weekStatLabel: { color: C.muted, fontSize: 11, marginTop: 2 },

  // ── Prompt ──
  promptCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 16, padding: 16,
    backgroundColor: C.primary + '15', borderRadius: 16,
    borderWidth: 1, borderColor: C.primary + '30',
  },
  promptEmoji: { fontSize: 28 },
  promptTitle: { color: C.fg, fontSize: 15, fontWeight: '600' },
  promptSub: { color: C.muted, fontSize: 13, marginTop: 2 },
  promptArrow: { color: C.primary, fontSize: 20 },

  // ── Wizard ──
  wizardCard: { marginHorizontal: 20, backgroundColor: C.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: C.primary, borderWidth: 2, borderColor: C.primary },
  stepDotDone: { backgroundColor: C.success + '30' },
  stepDotText: { fontSize: 16 },
  stepLabel: { color: C.muted, fontSize: 11 },
  stepLabelActive: { color: C.primary, fontWeight: '600' },
  stepProgress: { height: 3, backgroundColor: C.border, borderRadius: 2, marginBottom: 20 },
  stepProgressFill: { height: 3, borderRadius: 2, backgroundColor: C.primary },
  stepContent: { minHeight: 200 },
  stepTitle: { color: C.fg, fontSize: 18, fontWeight: '600', marginBottom: 16 },

  // ── Fields ──
  field: { marginBottom: 16 },
  fieldLabel: { color: C.fg, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  textArea: {
    backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: C.fg, fontSize: 15, minHeight: 70, textAlignVertical: 'top',
  },

  // ── Rating ──
  ratingQuestion: { color: C.muted, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  ratingBtn: {
    width: 52, height: 64, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  ratingBtnActive: { borderColor: C.primary, backgroundColor: C.primary + '20' },
  ratingBtnEmoji: { fontSize: 22 },
  ratingBtnEmojiActive: { fontSize: 26 },
  ratingBtnNum: { color: C.muted, fontSize: 12, fontWeight: '600' },
  ratingLabel: { color: C.primary, fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 16 },
  miniStats: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { color: C.fg, fontSize: 14, fontWeight: '600' },
  miniStatLabel: { color: C.muted, fontSize: 11, marginTop: 2 },

  // ── Nav ──
  wizardNav: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navBtnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  navBtnSecondaryText: { color: C.muted, fontSize: 14 },
  navBtnPrimary: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
  navBtnPrimaryText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // ── Section ──
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { color: C.fg, fontSize: 18, fontWeight: '600', marginBottom: 12 },

  // ── Review Cards ──
  reviewCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewWeek: { color: C.primary, fontSize: 13, fontWeight: '600' },
  reviewRating: { backgroundColor: C.primary + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  reviewRatingText: { color: C.primary, fontSize: 12 },
  reviewSection: { marginBottom: 8 },
  reviewLabel: { color: C.muted, fontSize: 12, marginBottom: 4 },
  reviewItem: { color: C.fg, fontSize: 14, marginLeft: 4, lineHeight: 20 },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: C.fg, fontSize: 15 },
});
