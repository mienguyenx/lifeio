import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { BottomSheet, FAB } from '@/components/ui';
import { SwipeableRow } from '@/components/ui/SwipeableRow';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const LOG_TYPES = [
  { key: 'weight', label: 'Cân nặng', icon: '⚖️', unit: 'kg' },
  { key: 'water', label: 'Nước uống', icon: '💧', unit: 'ml' },
  { key: 'sleep', label: 'Giấc ngủ', icon: '😴', unit: 'giờ' },
  { key: 'steps', label: 'Bước chân', icon: '🚶', unit: 'bước' },
  { key: 'exercise', label: 'Tập thể dục', icon: '🏋️', unit: 'phút' },
  { key: 'calories', label: 'Calories', icon: '🔥', unit: 'kcal' },
] as const;

// ─── Trend Arrow ───
function TrendArrow({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return <Text style={styles.trendNeutral}>—</Text>;
  if (current > previous) return <Text style={styles.trendUp}>↑ {(current - previous).toFixed(1)}</Text>;
  if (current < previous) return <Text style={styles.trendDown}>↓ {(previous - current).toFixed(1)}</Text>;
  return <Text style={styles.trendNeutral}>= 0</Text>;
}

export default function HealthScreen() {
  const healthLogs = useLifeOSStore(s => s.healthLogs);
  const addHealthLog = useLifeOSStore(s => s.addHealthLog);
  const deleteHealthLog = useLifeOSStore(s => s.deleteHealthLog);

  const [showAdd, setShowAdd] = useState(false);
  const [logType, setLogType] = useState('weight');
  const [logValue, setLogValue] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const todayLogs = useMemo(() => healthLogs.filter(l => l.date === todayStr), [healthLogs, todayStr]);
  const yesterdayLogs = useMemo(() => healthLogs.filter(l => l.date === yesterdayStr), [healthLogs, yesterdayStr]);

  const recentLogs = useMemo(() =>
    [...healthLogs].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 30),
    [healthLogs]
  );

  // Daily health score: how many metrics logged today out of 6
  const dailyScore = todayLogs.length;
  const scorePct = Math.round((dailyScore / LOG_TYPES.length) * 100);

  const handleAdd = () => {
    const value = parseFloat(logValue);
    if (isNaN(value) || value <= 0) { Alert.alert('Lỗi', 'Nhập giá trị hợp lệ'); return; }
    addHealthLog({
      id: `health-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: logType, value, unit: selectedType?.unit || '', date: todayStr,
    });
    setLogValue('');
    setShowAdd(false);
  };

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Xóa', 'Xóa bản ghi này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteHealthLog(id) },
    ]);
  }, [deleteHealthLog]);

  const selectedType = LOG_TYPES.find(t => t.key === logType);

  return (
    <>
      <Stack.Screen options={{ title: 'Sức khỏe' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Daily Summary Card ── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryEmoji}>❤️</Text>
              <View>
                <Text style={styles.summaryLabel}>Sức khỏe hôm nay</Text>
                <Text style={styles.summaryScore}>{dailyScore}/{LOG_TYPES.length} đã ghi</Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <View style={styles.summaryBar}>
                <View style={[styles.summaryBarFill, { width: `${scorePct}%` }]} />
              </View>
              <Text style={styles.summaryPct}>{scorePct}%</Text>
            </View>
          </View>

          {/* ── Quick log grid ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi nhanh</Text>
            <View style={styles.quickGrid}>
              {LOG_TYPES.map(type => {
                const todayLog = todayLogs.find(l => l.type === type.key);
                const yesterdayLog = yesterdayLogs.find(l => l.type === type.key);
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.quickCard, todayLog && styles.quickCardDone]}
                    onPress={() => { setLogType(type.key); setShowAdd(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickIcon}>{type.icon}</Text>
                    <Text style={styles.quickLabel}>{type.label}</Text>
                    {todayLog ? (
                      <>
                        <Text style={styles.quickValue}>{todayLog.value} {type.unit}</Text>
                        <TrendArrow current={todayLog.value} previous={yesterdayLog?.value} />
                      </>
                    ) : (
                      <Text style={styles.quickPlaceholder}>+ Thêm</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Recent logs (swipeable) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
            {recentLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>❤️</Text>
                <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
                <TouchableOpacity onPress={() => setShowAdd(true)}>
                  <Text style={styles.emptyAction}>+ Ghi lại ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentLogs.map(log => {
                const type = LOG_TYPES.find(t => t.key === log.type);
                return (
                  <SwipeableRow
                    key={log.id}
                    rightActions={[
                      { label: 'Xóa', color: C.danger, icon: '🗑', onPress: () => handleDelete(log.id) },
                    ]}
                  >
                    <View style={styles.logRow}>
                      <View style={[styles.logIconBg, { backgroundColor: (type ? C.primary : C.muted) + '20' }]}>
                        <Text style={styles.logIcon}>{type?.icon || '📋'}</Text>
                      </View>
                      <View style={styles.logInfo}>
                        <Text style={styles.logLabel}>{type?.label || log.type}</Text>
                        <Text style={styles.logDate}>{log.date}</Text>
                      </View>
                      <Text style={styles.logValue}>{log.value} {type?.unit || ''}</Text>
                    </View>
                  </SwipeableRow>
                );
              })
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        <FAB onPress={() => setShowAdd(true)} />

        <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)} title={`Ghi ${selectedType?.label || ''}`} height={380}>
          <View style={styles.addForm}>
            <View style={styles.typeRow}>
              {LOG_TYPES.map(type => (
                <TouchableOpacity key={type.key} onPress={() => setLogType(type.key)} style={[styles.typeChip, logType === type.key && styles.typeChipActive]}>
                  <Text style={styles.typeChipIcon}>{type.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder={`Nhập ${selectedType?.unit || 'giá trị'}`} placeholderTextColor="#666" value={logValue} onChangeText={setLogValue} keyboardType="numeric" autoFocus />
              <Text style={styles.unitLabel}>{selectedType?.unit}</Text>
            </View>
            <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Summary Card ──
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginTop: 16, padding: 16,
    backgroundColor: C.card, borderRadius: 16,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryEmoji: { fontSize: 28 },
  summaryLabel: { color: C.muted, fontSize: 12 },
  summaryScore: { color: C.fg, fontSize: 16, fontWeight: 'bold' },
  summaryRight: { alignItems: 'flex-end', gap: 4 },
  summaryBar: { width: 60, height: 6, backgroundColor: C.border, borderRadius: 3 },
  summaryBarFill: { height: 6, borderRadius: 3, backgroundColor: C.success },
  summaryPct: { color: C.muted, fontSize: 11 },

  // ── Section ──
  section: { marginTop: 16, paddingHorizontal: 20 },
  sectionTitle: { color: C.fg, fontSize: 18, fontWeight: '600', marginBottom: 12 },

  // ── Quick Grid ──
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '31%', backgroundColor: C.card, borderRadius: 14, padding: 12, alignItems: 'center' },
  quickCardDone: { borderWidth: 1, borderColor: C.success + '50' },
  quickIcon: { fontSize: 22, marginBottom: 4 },
  quickLabel: { color: C.muted, fontSize: 10, marginBottom: 4 },
  quickValue: { color: C.success, fontSize: 12, fontWeight: '600' },
  quickPlaceholder: { color: C.primary, fontSize: 12 },

  // ── Trend ──
  trendUp: { color: C.success, fontSize: 10, marginTop: 2 },
  trendDown: { color: C.danger, fontSize: 10, marginTop: 2 },
  trendNeutral: { color: C.muted, fontSize: 10, marginTop: 2 },

  // ── Log Row ──
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  logIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logIcon: { fontSize: 18 },
  logInfo: { flex: 1 },
  logLabel: { color: C.fg, fontSize: 14 },
  logDate: { color: C.muted, fontSize: 11, marginTop: 2 },
  logValue: { color: C.fg, fontSize: 15, fontWeight: '600' },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: C.fg, fontSize: 15, fontWeight: '500' },
  emptyAction: { color: C.primary, fontSize: 14, marginTop: 12, fontWeight: '500' },

  // ── Add Form ──
  addForm: { paddingVertical: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
  typeChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  typeChipActive: { backgroundColor: C.primary + '30', borderWidth: 2, borderColor: C.primary },
  typeChipIcon: { fontSize: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  input: {
    flex: 1, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: C.fg, fontSize: 20, textAlign: 'center',
  },
  unitLabel: { color: C.muted, fontSize: 16, width: 50 },
  saveBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
