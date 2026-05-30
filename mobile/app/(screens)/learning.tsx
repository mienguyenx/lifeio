import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { BottomSheet, FAB } from '@/components/ui';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'in_progress': { label: 'Đang học', color: C.primary },
  'completed': { label: 'Hoàn thành', color: C.success },
  'planned': { label: 'Dự kiến', color: C.muted },
  'reading': { label: 'Đang đọc', color: C.primary },
  'read': { label: 'Đã đọc', color: C.success },
  'to_read': { label: 'Muốn đọc', color: C.muted },
};

type Tab = 'courses' | 'books';

export default function LearningScreen() {
  const courses = useLifeOSStore(s => s.learningCourses);
  const books = useLifeOSStore(s => s.learningBooks);
  const addCourse = useLifeOSStore(s => s.addLearningCourse);
  const addBook = useLifeOSStore(s => s.addLearningBook);
  const deleteCourse = useLifeOSStore(s => s.deleteLearningCourse);
  const deleteBook = useLifeOSStore(s => s.deleteLearningBook);

  const [tab, setTab] = useState<Tab>('courses');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [author, setAuthor] = useState('');

  const sortedCourses = useMemo(() =>
    [...courses].sort((a, b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
      return 0;
    }),
    [courses]
  );

  const sortedBooks = useMemo(() =>
    [...books].sort((a, b) => {
      if (a.status === 'reading' && b.status !== 'reading') return -1;
      if (a.status !== 'reading' && b.status === 'reading') return 1;
      return 0;
    }),
    [books]
  );

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Lỗi', 'Nhập tên'); return; }
    if (tab === 'courses') {
      addCourse({
        id: `course-${Date.now()}`,
        title: title.trim(),
        platform: platform.trim() || undefined,
        status: 'in_progress',
        progress: 0,
      });
    } else {
      addBook({
        id: `book-${Date.now()}`,
        title: title.trim(),
        author: author.trim() || undefined,
        status: 'reading',
      });
    }
    setTitle(''); setPlatform(''); setAuthor(''); setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xóa', 'Xóa mục này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => tab === 'courses' ? deleteCourse(id) : deleteBook(id) },
    ]);
  };

  const inProgressCount = courses.filter(c => c.status === 'in_progress').length;
  const readingCount = books.filter(b => b.status === 'reading').length;

  return (
    <>
      <Stack.Screen options={{ title: 'Học tập' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📚</Text>
              <Text style={styles.statValue}>{courses.length}</Text>
              <Text style={styles.statLabel}>Khóa học</Text>
              <Text style={styles.statSub}>{inProgressCount} đang học</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📖</Text>
              <Text style={styles.statValue}>{books.length}</Text>
              <Text style={styles.statLabel}>Sách</Text>
              <Text style={styles.statSub}>{readingCount} đang đọc</Text>
            </View>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setTab('courses')}
              style={[styles.tabBtn, tab === 'courses' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === 'courses' && styles.tabBtnTextActive]}>
                📚 Khóa học ({courses.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('books')}
              style={[styles.tabBtn, tab === 'books' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === 'books' && styles.tabBtnTextActive]}>
                📖 Sách ({books.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <View style={styles.section}>
            {tab === 'courses' ? (
              sortedCourses.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📚</Text>
                  <Text style={styles.emptyTitle}>Chưa có khóa học</Text>
                </View>
              ) : (
                sortedCourses.map(c => {
                  const st = STATUS_LABELS[c.status] || { label: c.status, color: C.muted };
                  return (
                    <TouchableOpacity
                      key={c.id} style={styles.itemCard}
                      onLongPress={() => handleDelete(c.id)} delayLongPress={500}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{c.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
                          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                      {c.platform && <Text style={styles.itemSub}>{c.platform}</Text>}
                      {typeof c.progress === 'number' && (
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${c.progress}%` }]} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )
            ) : (
              sortedBooks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📖</Text>
                  <Text style={styles.emptyTitle}>Chưa có sách</Text>
                </View>
              ) : (
                sortedBooks.map(b => {
                  const st = STATUS_LABELS[b.status] || { label: b.status, color: C.muted };
                  return (
                    <TouchableOpacity
                      key={b.id} style={styles.itemCard}
                      onLongPress={() => handleDelete(b.id)} delayLongPress={500}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{b.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
                          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                      {b.author && <Text style={styles.itemSub}>✍️ {b.author}</Text>}
                    </TouchableOpacity>
                  );
                })
              )
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        <FAB onPress={() => setShowAdd(true)} />

        <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)} title={tab === 'courses' ? 'Thêm khóa học' : 'Thêm sách'} height={340}>
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder={tab === 'courses' ? 'Tên khóa học' : 'Tên sách'}
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            {tab === 'courses' ? (
              <TextInput
                style={styles.input}
                placeholder="Nền tảng (Udemy, Coursera...)"
                placeholderTextColor="#666"
                value={platform}
                onChangeText={setPlatform}
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Tác giả"
                placeholderTextColor="#666"
                value={author}
                onChangeText={setAuthor}
              />
            )}
            <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Thêm</Text>
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
  // Stats
  statsRow: { flexDirection: 'row', gap: 12, padding: 20 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16, alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statValue: { color: C.fg, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: C.muted, fontSize: 12, marginTop: 2 },
  statSub: { color: C.primary, fontSize: 11, marginTop: 4 },
  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: C.card, alignItems: 'center' },
  tabBtnActive: { backgroundColor: C.primary },
  tabBtnText: { color: C.muted, fontSize: 13, fontWeight: '500' },
  tabBtnTextActive: { color: 'white' },
  // Section
  section: { paddingHorizontal: 20 },
  // Item card
  itemCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  itemTitle: { flex: 1, color: C.fg, fontSize: 15, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  itemSub: { color: C.muted, fontSize: 12, marginTop: 6 },
  progressBar: { height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 10 },
  progressFill: { height: 4, backgroundColor: C.primary, borderRadius: 2 },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: C.fg, fontSize: 15 },
  // Add form
  addForm: { paddingVertical: 12, gap: 12 },
  input: {
    backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: C.fg, fontSize: 16,
  },
  saveBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
