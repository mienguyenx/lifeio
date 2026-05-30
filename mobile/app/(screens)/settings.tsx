import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
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

function SettingRow({ icon, label, value, onPress }: {
  icon: string; label: string; value?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingRow} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {onPress && <Text style={styles.settingArrow}>›</Text>}
    </TouchableOpacity>
  );
}

function SettingToggle({ icon, label, value, onToggle }: {
  icon: string; label: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.primary + '60' }}
        thumbColor={value ? C.primary : C.muted}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const notifSound = useLifeOSStore(s => s.notificationSoundEnabled);
  const setNotifSound = useLifeOSStore(s => s.setNotificationSoundEnabled);
  const pushEnabled = useLifeOSStore(s => s.pushNotificationsEnabled);
  const setPushEnabled = useLifeOSStore(s => s.setPushNotificationsEnabled);
  const trashSettings = useLifeOSStore(s => s.trashSettings);
  const setTrashSettings = useLifeOSStore(s => s.setTrashSettings);
  const pomodoroSettings = useLifeOSStore(s => s.pomodoroSettings);
  const clearAllData = useLifeOSStore(s => s.clearAllData);

  const handleClearData = () => {
    Alert.alert(
      'Xóa tất cả dữ liệu',
      'Hành động này không thể hoàn tác. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa hết', style: 'destructive', onPress: clearAllData },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Cài đặt' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông báo</Text>
            <View style={styles.sectionCards}>
              <SettingToggle icon="🔔" label="Push Notifications" value={pushEnabled} onToggle={setPushEnabled} />
              <SettingToggle icon="🔊" label="Âm thanh thông báo" value={notifSound} onToggle={setNotifSound} />
            </View>
          </View>

          {/* Pomodoro */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pomodoro</Text>
            <View style={styles.sectionCards}>
              <SettingRow icon="⏱️" label="Thời gian làm việc" value={`${pomodoroSettings.workDuration} phút`} />
              <SettingRow icon="☕" label="Nghỉ ngắn" value={`${pomodoroSettings.breakDuration} phút`} />
              <SettingRow icon="🛋️" label="Nghỉ dài" value={`${pomodoroSettings.longBreakDuration} phút`} />
            </View>
          </View>

          {/* Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dữ liệu</Text>
            <View style={styles.sectionCards}>
              <SettingToggle
                icon="🗑️"
                label="Tự động dọn thùng rác"
                value={trashSettings.enabled}
                onToggle={(v) => setTrashSettings({ enabled: v })}
              />
              <SettingRow icon="📅" label="Xóa sau" value={`${trashSettings.autoCleanupDays} ngày`} />
            </View>
          </View>

          {/* Danger zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.danger }]}>Vùng nguy hiểm</Text>
            <View style={styles.sectionCards}>
              <TouchableOpacity onPress={handleClearData} style={styles.dangerRow}>
                <Text style={styles.dangerIcon}>⚠️</Text>
                <Text style={styles.dangerLabel}>Xóa tất cả dữ liệu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Đăng xuất', 'Bạn có chắc?', [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng xuất', style: 'destructive', onPress: signOut },
                  ]);
                }}
                style={styles.dangerRow}
              >
                <Text style={styles.dangerIcon}>🚪</Text>
                <Text style={styles.dangerLabel}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App info */}
          <View style={styles.appInfo}>
            <Text style={styles.appName}>LifeOS Mobile</Text>
            <Text style={styles.appVersion}>v1.0.0</Text>
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
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { color: C.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sectionCards: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  // Setting row
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  settingIcon: { fontSize: 18 },
  settingLabel: { flex: 1, color: C.fg, fontSize: 15 },
  settingValue: { color: C.muted, fontSize: 14 },
  settingArrow: { color: C.muted, fontSize: 20 },
  // Danger
  dangerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  dangerIcon: { fontSize: 18 },
  dangerLabel: { color: C.danger, fontSize: 15 },
  // App info
  appInfo: { alignItems: 'center', marginTop: 32 },
  appName: { color: C.muted, fontSize: 14 },
  appVersion: { color: '#555', fontSize: 12, marginTop: 4 },
});
