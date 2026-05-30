import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

export default function ProfileScreen() {
  const { user: authUser } = useAuth();
  const userProfile = useLifeOSStore(s => s.user);
  const setUser = useLifeOSStore(s => s.setUser);
  const tasks = useLifeOSStore(s => s.tasks);
  const habits = useLifeOSStore(s => s.habits);
  const goals = useLifeOSStore(s => s.goals);
  const journalEntries = useLifeOSStore(s => s.journalEntries);
  const notes = useLifeOSStore(s => s.notes);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Lỗi', 'Nhập tên'); return; }
    setUser({ ...userProfile, name: name.trim() });
    setEditing(false);
  };

  // Stats
  const totalTasks = tasks.filter(t => !t.deletedAt).length;
  const doneTasks = tasks.filter(t => t.status === 'done' && !t.deletedAt).length;
  const totalHabits = habits.filter(h => !h.deletedAt).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || h.streak), 0);
  const totalGoals = goals.filter(g => !g.deletedAt).length;
  const completedGoals = goals.filter(g => g.progress >= 100 && !g.deletedAt).length;
  const totalJournals = journalEntries.length;
  const totalNotes = notes.filter(n => !n.deletedAt).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Hồ sơ' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Avatar & Name */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSave} style={styles.saveNameBtn}>
                  <Text style={styles.saveNameBtnText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setName(userProfile?.name || ''); setEditing(true); }}>
                <Text style={styles.profileName}>{userProfile?.name || 'User'}</Text>
                <Text style={styles.profileEmail}>{authUser?.email || ''}</Text>
                <Text style={styles.editHint}>Nhấn để sửa tên</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lifetime stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thống kê tổng</Text>
            <View style={styles.statsGrid}>
              {[
                { icon: '✅', label: 'Tasks', value: `${doneTasks}/${totalTasks}`, sub: 'hoàn thành' },
                { icon: '🎯', label: 'Habits', value: String(totalHabits), sub: `streak max: ${longestStreak}` },
                { icon: '🧭', label: 'Goals', value: `${completedGoals}/${totalGoals}`, sub: 'đạt được' },
                { icon: '📝', label: 'Journal', value: String(totalJournals), sub: 'bài viết' },
                { icon: '📒', label: 'Notes', value: String(totalNotes), sub: 'ghi chú' },
              ].map(stat => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statSub}>{stat.sub}</Text>
                </View>
              ))}
            </View>
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
  // Profile header
  profileHeader: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  profileName: { color: C.fg, fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  profileEmail: { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 4 },
  editHint: { color: C.primary, fontSize: 12, textAlign: 'center', marginTop: 8 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  nameInput: {
    flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    color: C.fg, fontSize: 18, textAlign: 'center',
  },
  saveNameBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 12 },
  saveNameBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  // Section
  section: { paddingHorizontal: 20 },
  sectionTitle: { color: C.fg, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: C.card, borderRadius: 16, padding: 16,
    alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { color: C.fg, fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: C.muted, fontSize: 12, marginTop: 2 },
  statSub: { color: C.primary, fontSize: 11, marginTop: 4 },
});
