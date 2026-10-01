import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { JournalEntry } from '@/types/lifeos';
import { entryFromDraft, journalStats, type JournalDraft } from '../utils/journal.utils';

export function useJournal() {
  const raw = useLifeOSStore((s) => s.journalEntries);
  const tags = useLifeOSStore((s) => s.journalTags);
  const addTag = useLifeOSStore((s) => s.addJournalTag);
  const updateTag = useLifeOSStore((s) => s.updateJournalTag);
  const deleteTag = useLifeOSStore((s) => s.deleteJournalTag);
  const userName = useLifeOSStore((s) => s.user?.name);
  const synced = useSyncedStore();
  const entries = useMemo(() => [...raw].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '')), [raw]);
  const stats = useMemo(() => journalStats(raw), [raw]);
  const tagOf = useCallback((id: string) => tags.find((t) => t.id === id), [tags]);

  const create = useCallback((d: JournalDraft) => {
    if (!d.content.trim()) return;
    synced.addJournalEntry(entryFromDraft(d));
    toast.success('Đã lưu nhật ký ✍️');
  }, [synced]);
  const edit = useCallback((e: JournalEntry, d: JournalDraft) => {
    synced.updateJournalEntry(e.id, { ...entryFromDraft(d), areas: d.areas, tags: d.tags, images: d.images, gratitude: d.gratitude.split('\n').filter(Boolean) });
    toast.success('Đã cập nhật nhật ký');
  }, [synced]);
  const remove = useCallback((e: JournalEntry) => { synced.deleteJournalEntry(e.id); toast.success('Đã xóa nhật ký'); }, [synced]);

  return { entries, tags, stats, tagOf, userName, create, edit, remove, addTag, updateTag, deleteTag };
}
export type JournalApi = ReturnType<typeof useJournal>;
