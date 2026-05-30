import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StatusBar, Alert, RefreshControl,
  StyleSheet, FlatList,
} from 'react-native';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useDataSync } from '@/hooks/sync/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { FAB } from '@/components/ui/FAB';
import type { JournalEntry } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const MOODS = [
  { value: 1, emoji: '😢', label: 'Rất tệ' },
  { value: 2, emoji: '😕', label: 'Tệ' },
  { value: 3, emoji: '😐', label: 'Bình thường' },
  { value: 4, emoji: '😊', label: 'Tốt' },
  { value: 5, emoji: '🤩', label: 'Tuyệt vời' },
] as const;

const ENERGY_LEVELS = [
  { value: 1, emoji: '🪫', label: 'Rất thấp' },
  { value: 2, emoji: '😴', label: 'Thấp' },
  { value: 3, emoji: '⚡', label: 'Trung bình' },
  { value: 4, emoji: '🔥', label: 'Cao' },
  { value: 5, emoji: '💥', label: 'Rất cao' },
] as const;

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Hôm nay';
  if (isYesterday(date)) return 'Hôm qua';
  return format(date, 'EEEE, dd/MM', { locale: vi });
}

function JournalCard({ entry, onPress, onDelete }: {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  const mood = MOODS.find(m => m.value === entry.mood);
  const energy = ENERGY_LEVELS.find(e => e.value === entry.energy);

  return (
    <SwipeableRow
      rightActions={[
        { label: 'Sửa', color: '#3b82f6', icon: '✏️', onPress: () => onPress(entry) },
        { label: 'Xóa', color: C.danger, icon: '🗑', onPress: () => onDelete(entry.id) },
      ]}
    >
      <TouchableOpacity onPress={() => onPress(entry)} style={styles.journalCard} activeOpacity={0.7}>
        <View style={styles.journalCardHeader}>
          <Text style={styles.journalDate}>{formatEntryDate(entry.date)}</Text>
          <View style={styles.moodEnergyRow}>
            {mood && (
              <View style={[styles.moodPill, { backgroundColor: getMoodColor(entry.mood) + '20' }]}>
                <Text style={styles.moodPillEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodPillLabel, { color: getMoodColor(entry.mood) }]}>{mood.label}</Text>
              </View>
            )}
            {energy && <Text style={styles.moodEmoji}>{energy.emoji}</Text>}
          </View>
        </View>
        <Text style={styles.journalContent} numberOfLines={3}>
          {entry.content}
        </Text>
        {entry.gratitude && entry.gratitude.length > 0 && (
          <View style={styles.gratitudeSection}>
            <Text style={styles.gratitudeLabel}>🙏 Biết ơn:</Text>
            {entry.gratitude.slice(0, 2).map((g, i) => (
              <Text key={i} style={styles.gratitudeItem} numberOfLines={1}>• {g}</Text>
            ))}
            {entry.gratitude.length > 2 && (
              <Text style={styles.moreText}>+{entry.gratitude.length - 2} khác</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </SwipeableRow>
  );
}

function getMoodColor(mood: number): string {
  if (mood <= 1) return C.danger;
  if (mood <= 2) return C.warning;
  if (mood <= 3) return C.muted;
  if (mood <= 4) return C.primary;
  return C.success;
}

function AddJournalModal({ visible, onClose, editEntry }: {
  visible: boolean;
  onClose: () => void;
  editEntry?: JournalEntry | null;
}) {
  const addJournalEntry = useLifeOSStore(s => s.addJournalEntry);
  const updateJournalEntry = useLifeOSStore(s => s.updateJournalEntry);

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [gratitudeText, setGratitudeText] = useState('');

  useEffect(() => {
    if (editEntry) {
      setContent(editEntry.content);
      setMood(editEntry.mood);
      setEnergy(editEntry.energy);
      setGratitudeText((editEntry.gratitude || []).join('\n'));
    } else {
      setContent(''); setMood(3); setEnergy(3); setGratitudeText('');
    }
  }, [editEntry, visible]);

  const handleSave = () => {
    if (!content.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập nội dung'); return; }

    const gratitude = gratitudeText.split('\n').filter(g => g.trim()).map(g => g.trim());
    const today = new Date().toISOString().split('T')[0];

    if (editEntry) {
      updateJournalEntry(editEntry.id, { content: content.trim(), mood, energy, gratitude });
    } else {
      addJournalEntry({ date: today, content: content.trim(), mood, energy, gratitude });
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
          <Text style={styles.modalTitle}>{editEntry ? 'Sửa nhật ký' : 'Viết nhật ký'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          {/* Mood selector */}
          <View style={styles.field}>
            <Text style={styles.label}>Tâm trạng</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setMood(m.value as typeof mood)}
                  style={[styles.moodBtn, mood === m.value && styles.moodBtnActive]}
                >
                  <Text style={styles.moodBtnEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodBtnLabel, mood === m.value && styles.moodBtnLabelActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Energy selector */}
          <View style={styles.field}>
            <Text style={styles.label}>Năng lượng</Text>
            <View style={styles.moodRow}>
              {ENERGY_LEVELS.map(e => (
                <TouchableOpacity
                  key={e.value}
                  onPress={() => setEnergy(e.value as typeof energy)}
                  style={[styles.moodBtn, energy === e.value && styles.moodBtnActive]}
                >
                  <Text style={styles.moodBtnEmoji}>{e.emoji}</Text>
                  <Text style={[styles.moodBtnLabel, energy === e.value && styles.moodBtnLabelActive]}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content */}
          <View style={styles.field}>
            <Text style={styles.label}>Nội dung *</Text>
            <TextInput
              style={[styles.input, styles.inputLarge]}
              placeholder="Hôm nay bạn cảm thấy thế nào? Có gì đặc biệt xảy ra?"
              placeholderTextColor="#666"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Gratitude */}
          <View style={styles.field}>
            <Text style={styles.label}>🙏 Biết ơn (mỗi dòng 1 điều)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder={"Được gặp bạn bè\nHoàn thành dự án\nSức khỏe tốt"}
              placeholderTextColor="#666"
              value={gratitudeText}
              onChangeText={setGratitudeText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function JournalScreen() {
  const journalEntries = useLifeOSStore(s => s.journalEntries);
  const deleteJournalEntry = useLifeOSStore(s => s.deleteJournalEntry);
  const { loadAllData } = useDataSync();
  const { isOnline } = useOnlineStatus();

  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true); await loadAllData(); setRefreshing(false);
  };

  const sortedEntries = useMemo(() =>
    [...journalEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [journalEntries]
  );

  const todayEntry = sortedEntries.find(e => e.date === new Date().toISOString().split('T')[0]);

  // Stats
  const totalEntries = journalEntries.length;
  const avgMood = totalEntries > 0
    ? (journalEntries.reduce((sum, e) => sum + e.mood, 0) / totalEntries).toFixed(1)
    : '—';
  const avgMoodNum = totalEntries > 0 ? journalEntries.reduce((sum, e) => sum + e.mood, 0) / totalEntries : 3;

  // Streak calculation
  const streak = useMemo(() => {
    let s = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (journalEntries.some(e => e.date === dateStr)) s++;
      else if (i > 0) break;
    }
    return s;
  }, [journalEntries]);

  // Recent mood trend (last 7 entries)
  const recentMoods = useMemo(() =>
    sortedEntries.slice(0, 7).reverse(),
    [sortedEntries]
  );

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Xóa nhật ký', 'Bạn có chắc?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteJournalEntry(id) },
    ]);
  }, [deleteJournalEntry]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Nhật ký</Text>
        </View>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getMoodColor(Math.round(avgMoodNum)) }]}>
            {MOODS.find(m => m.value === Math.round(avgMoodNum))?.emoji || '😐'} {avgMood}
          </Text>
          <Text style={styles.statLabel}>tâm trạng TB</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalEntries}</Text>
          <Text style={styles.statLabel}>bài viết</Text>
        </View>
      </View>

      {/* ── Mood Trend ── */}
      {recentMoods.length >= 3 && (
        <View style={styles.trendRow}>
          <Text style={styles.trendLabel}>7 ngày gần đây:</Text>
          <View style={styles.trendDots}>
            {recentMoods.map((e, i) => (
              <View key={i} style={[styles.trendDot, { backgroundColor: getMoodColor(e.mood) }]}>
                <Text style={styles.trendDotText}>{MOODS.find(m => m.value === e.mood)?.emoji}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Quick write prompt ── */}
      {!todayEntry && (
        <TouchableOpacity
          style={styles.quickWriteCard}
          onPress={() => { setEditEntry(null); setShowAdd(true); }}
        >
          <Text style={styles.quickWriteEmoji}>✍️</Text>
          <View style={styles.quickWriteContent}>
            <Text style={styles.quickWriteTitle}>Viết nhật ký hôm nay</Text>
            <Text style={styles.quickWriteSubtitle}>Ghi lại cảm xúc và suy nghĩ của bạn</Text>
          </View>
          <Text style={styles.quickWriteArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* ── Journal list ── */}
      <FlatList
        data={sortedEntries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <JournalCard entry={item} onPress={setEditEntry} onDelete={handleDelete} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>Chưa có bài viết nào</Text>
            <TouchableOpacity onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyAction}>+ Viết bài đầu tiên</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
      />

      {/* ── FAB ── */}
      <FAB onPress={() => { setEditEntry(null); setShowAdd(true); }} icon="✏️" />

      <AddJournalModal
        visible={showAdd || !!editEntry}
        onClose={() => { setShowAdd(false); setEditEntry(null); }}
        editEntry={editEntry}
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
  statCard: { flex: 1, alignItems: 'center', backgroundColor: C.card, borderRadius: 14, paddingVertical: 12 },
  statValue: { color: C.fg, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: C.muted, fontSize: 10, marginTop: 2 },

  // ── Mood Trend ──
  trendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 6,
  },
  trendLabel: { color: C.muted, fontSize: 12 },
  trendDots: { flexDirection: 'row', gap: 6 },
  trendDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trendDotText: { fontSize: 14 },

  // ── Quick Write ──
  quickWriteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginVertical: 8, padding: 16,
    backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  quickWriteEmoji: { fontSize: 28 },
  quickWriteContent: { flex: 1 },
  quickWriteTitle: { color: C.fg, fontSize: 15, fontWeight: '600' },
  quickWriteSubtitle: { color: C.muted, fontSize: 13, marginTop: 2 },
  quickWriteArrow: { color: C.primary, fontSize: 20 },

  // ── Journal Card ──
  journalCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  journalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  journalDate: { color: C.muted, fontSize: 13, fontWeight: '500' },
  moodEnergyRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  moodEmoji: { fontSize: 18 },
  moodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  moodPillEmoji: { fontSize: 14 },
  moodPillLabel: { fontSize: 11, fontWeight: '500' },
  journalContent: { color: C.fg, fontSize: 14, lineHeight: 20 },
  gratitudeSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  gratitudeLabel: { color: C.muted, fontSize: 12, marginBottom: 4 },
  gratitudeItem: { color: C.fg, fontSize: 13, marginLeft: 4 },
  moreText: { color: C.muted, fontSize: 12, marginTop: 4 },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: C.fg, fontSize: 16, fontWeight: '500' },
  emptyAction: { color: C.primary, fontSize: 14, marginTop: 12, fontWeight: '500' },

  // ── Modal ──
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
  inputLarge: { minHeight: 140, textAlignVertical: 'top' },

  // ── Mood Selector ──
  moodRow: { flexDirection: 'row', gap: 6 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  moodBtnActive: { borderColor: C.primary, backgroundColor: 'rgba(139,92,246,0.1)' },
  moodBtnEmoji: { fontSize: 22, marginBottom: 4 },
  moodBtnLabel: { color: C.muted, fontSize: 10 },
  moodBtnLabelActive: { color: C.primary },
});
