import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  color: string;
  badge?: string;
}

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Ghi chép',
    items: [
      { icon: '📝', label: 'Nhật ký', route: '/(screens)/journal', color: '#8b5cf6' },
      { icon: '📒', label: 'Ghi chú', route: '/(screens)/notes', color: '#f59e0b' },
    ],
  },
  {
    title: 'Theo dõi',
    items: [
      { icon: '📊', label: 'Dashboard', route: '/(screens)/dashboard', color: '#3b82f6' },
      { icon: '🤖', label: 'AI Chat', route: '/(screens)/ai-chat', color: '#8b5cf6' },
      { icon: '❤️', label: 'Sức khỏe', route: '/(screens)/health', color: '#ef4444' },
      { icon: '💰', label: 'Tài chính', route: '/(screens)/finance', color: '#22c55e' },
      { icon: '📚', label: 'Học tập', route: '/(screens)/learning', color: '#6366f1' },
    ],
  },
  {
    title: 'Đánh giá',
    items: [
      { icon: '📋', label: 'Review tuần', route: '/(screens)/weekly-review', color: '#14b8a6' },
      { icon: '🎡', label: 'Life Wheel', route: '/(screens)/life-wheel', color: '#a855f7' },
    ],
  },
  {
    title: 'Cài đặt',
    items: [
      { icon: '👤', label: 'Hồ sơ', route: '/(screens)/profile', color: '#64748b' },
      { icon: '⚙️', label: 'Cài đặt', route: '/(screens)/settings', color: '#64748b' },
    ],
  },
];

function MenuCard({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuCard} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.menuIconText}>{item.icon}</Text>
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      {item.badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{item.badge}</Text>
        </View>
      )}
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { signOut, user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const userName = useLifeOSStore(s => s.user?.name) || 'User';

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const handleSignOut = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>

        {/* Menu sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCards}>
              {section.items.map((item) => (
                <MenuCard
                  key={item.route}
                  item={item}
                  onPress={() => handleNavigate(item.route)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  // Profile
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginTop: 16, marginBottom: 8,
    padding: 16, backgroundColor: C.card, borderRadius: 16,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { color: C.fg, fontSize: 17, fontWeight: '600' },
  profileEmail: { color: C.muted, fontSize: 13, marginTop: 2 },
  offlineBadge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  offlineText: { color: C.warning, fontSize: 11 },
  // Section
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { color: C.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sectionCards: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  // Menu Card
  menuCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuIconText: { fontSize: 18 },
  menuLabel: { flex: 1, color: C.fg, fontSize: 15 },
  menuBadge: { backgroundColor: C.danger, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  menuBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  menuArrow: { color: C.muted, fontSize: 22 },
  // Sign out
  signOutBtn: {
    marginHorizontal: 20, marginTop: 24, paddingVertical: 14,
    backgroundColor: C.card, borderRadius: 16, alignItems: 'center',
  },
  signOutText: { color: C.danger, fontSize: 15, fontWeight: '500' },
});
