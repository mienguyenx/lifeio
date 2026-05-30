import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StatusBar, Alert, RefreshControl,
  StyleSheet, FlatList,
} from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useDataSync } from '@/hooks/sync/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { FAB } from '@/components/ui/FAB';
import type { Note } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

function NoteCard({ note, onPress, onTogglePin, onDelete, onToggleFavorite }: {
  note: Note;
  onPress: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <SwipeableRow
      leftActions={[
        { label: note.isPinned ? 'Bỏ ghim' : 'Ghim', color: C.warning, icon: '📌', onPress: () => onTogglePin(note.id) },
      ]}
      rightActions={[
        { label: note.isFavorite ? 'Bỏ ⭐' : '⭐', color: C.primary, icon: '⭐', onPress: () => onToggleFavorite(note.id) },
        { label: 'Xóa', color: C.danger, icon: '🗑', onPress: () => onDelete(note.id) },
      ]}
    >
      <TouchableOpacity onPress={() => onPress(note)} style={styles.noteCard} activeOpacity={0.7}>
        <View style={styles.noteCardHeader}>
          <View style={styles.noteTitleRow}>
            {note.isPinned && <Text style={styles.pinIcon}>📌</Text>}
            <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Không có tiêu đề'}</Text>
          </View>
          {note.isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
        </View>
        <Text style={styles.noteContent} numberOfLines={3}>
          {note.content || 'Không có nội dung'}
        </Text>
        <Text style={styles.noteDate}>
          {format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
        </Text>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

function EditNoteModal({ visible, onClose, editNote }: {
  visible: boolean;
  onClose: () => void;
  editNote?: Note | null;
}) {
  const addNote = useLifeOSStore(s => s.addNote);
  const updateNote = useLifeOSStore(s => s.updateNote);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (editNote) {
      setTitle(editNote.title);
      setContent(editNote.content);
    } else {
      setTitle(''); setContent('');
    }
  }, [editNote, visible]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề hoặc nội dung');
      return;
    }

    if (editNote) {
      updateNote(editNote.id, {
        title: title.trim(),
        content: content.trim(),
      });
    } else {
      addNote({
        title: title.trim(),
        content: content.trim(),
      });
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
          <Text style={styles.modalTitle}>{editNote ? 'Sửa ghi chú' : 'Ghi chú mới'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.noteTitleInput}
            placeholder="Tiêu đề"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={styles.noteContentInput}
            placeholder="Bắt đầu viết..."
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function NotesScreen() {
  const notes = useLifeOSStore(s => s.notes);
  const toggleNotePin = useLifeOSStore(s => s.toggleNotePin);
  const toggleNoteFavorite = useLifeOSStore(s => s.toggleNoteFavorite);
  const deleteNote = useLifeOSStore(s => s.deleteNote);
  const { loadAllData } = useDataSync();
  const { isOnline } = useOnlineStatus();

  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pinned' | 'favorites'>('all');

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true); await loadAllData(); setRefreshing(false);
  };

  const activeNotes = useMemo(() => notes.filter(n => !n.deletedAt && !n.archivedAt), [notes]);

  const filteredNotes = useMemo(() => {
    let result = activeNotes;
    if (filter === 'pinned') result = result.filter(n => n.isPinned);
    if (filter === 'favorites') result = result.filter(n => n.isFavorite);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [activeNotes, searchQuery, filter]);

  const pinnedCount = activeNotes.filter(n => n.isPinned).length;
  const favCount = activeNotes.filter(n => n.isFavorite).length;

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Xóa ghi chú', 'Bạn có chắc?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteNote(id) },
    ]);
  }, [deleteNote]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ghi chú</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{activeNotes.length}</Text>
        </View>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Tìm kiếm ghi chú..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ── Filter tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {([
          { key: 'all', label: 'Tất cả', count: activeNotes.length },
          { key: 'pinned', label: '📌 Ghim', count: pinnedCount },
          { key: 'favorites', label: '⭐ Yêu thích', count: favCount },
        ] as const).map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label} {f.count > 0 ? `(${f.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Notes list ── */}
      <FlatList
        data={filteredNotes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={setEditNote}
            onTogglePin={toggleNotePin}
            onDelete={handleDelete}
            onToggleFavorite={toggleNoteFavorite}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📒</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy ghi chú' : 'Chưa có ghi chú nào'}
            </Text>
            <TouchableOpacity onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyAction}>
                {searchQuery ? 'Xóa bộ lọc' : '+ Tạo ghi chú mới'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
      />

      {/* ── FAB ── */}
      <FAB onPress={() => { setEditNote(null); setShowAdd(true); }} />

      <EditNoteModal
        visible={showAdd || !!editNote}
        onClose={() => { setShowAdd(false); setEditNote(null); }}
        editNote={editNote}
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
  countBadge: { backgroundColor: C.card, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countBadgeText: { color: C.muted, fontSize: 14 },
  offlineBadge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  offlineText: { color: C.warning, fontSize: 12 },

  // ── Search ──
  searchContainer: { paddingHorizontal: 20, paddingVertical: 6 },
  searchInput: { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, color: C.fg, fontSize: 15, borderWidth: 1, borderColor: C.border },

  // ── Filters ──
  filterScroll: { maxHeight: 44, marginBottom: 4 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card },
  filterTabActive: { backgroundColor: C.primary },
  filterTabText: { color: C.muted, fontSize: 13 },
  filterTabTextActive: { color: 'white' },

  // ── Note Card ──
  noteCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10 },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  noteTitle: { color: C.fg, fontSize: 16, fontWeight: '600', flex: 1 },
  pinIcon: { fontSize: 12 },
  noteContent: { color: C.muted, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  noteDate: { color: '#666', fontSize: 11 },
  favoriteIcon: { fontSize: 12 },

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
  noteTitleInput: { color: C.fg, fontSize: 22, fontWeight: 'bold', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16 },
  noteContentInput: { color: C.fg, fontSize: 16, lineHeight: 24, minHeight: 300 },
});
