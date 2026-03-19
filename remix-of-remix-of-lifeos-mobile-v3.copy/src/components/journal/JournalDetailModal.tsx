import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Pencil, Trash2, Image, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea, type JournalEntry, type JournalTag } from '@/types/lifeos';

const MOOD_OPTIONS = [
  { value: 1, icon: '😢', label: 'Rất tệ' },
  { value: 2, icon: '😕', label: 'Tệ' },
  { value: 3, icon: '😐', label: 'Bình thường' },
  { value: 4, icon: '🙂', label: 'Tốt' },
  { value: 5, icon: '😄', label: 'Rất tốt' },
];

const ENERGY_OPTIONS = [
  { value: 1, icon: '🔋', label: 'Kiệt sức' },
  { value: 2, icon: '🪫', label: 'Mệt' },
  { value: 3, icon: '⚡', label: 'Bình thường' },
  { value: 4, icon: '💪', label: 'Năng lượng' },
  { value: 5, icon: '🚀', label: 'Tràn đầy' },
];

interface JournalDetailModalProps {
  entry: JournalEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<JournalEntry>) => void;
  onDelete: (id: string) => void;
  journalTags: JournalTag[];
}

export function JournalDetailModal({
  entry,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  journalTags,
}: JournalDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    content: '',
    mood: 3 as 1 | 2 | 3 | 4 | 5,
    energy: 3 as 1 | 2 | 3 | 4 | 5,
    areas: [] as LifeArea[],
    gratitude: '',
    tags: [] as string[],
    images: [] as string[],
  });
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entry) {
      setEditData({
        content: entry.content,
        mood: entry.mood,
        energy: entry.energy,
        areas: entry.areas || [],
        gratitude: entry.gratitude?.join('\n') || '',
        tags: entry.tags || [],
        images: entry.images || [],
      });
      setIsEditing(false);
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = () => {
    onUpdate(entry.id, {
      content: editData.content,
      mood: editData.mood,
      energy: editData.energy,
      areas: editData.areas.length > 0 ? editData.areas : undefined,
      gratitude: editData.gratitude ? editData.gratitude.split('\n').filter(Boolean) : undefined,
      tags: editData.tags.length > 0 ? editData.tags : undefined,
      images: editData.images.length > 0 ? editData.images : undefined,
    });
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(entry.id);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  const toggleArea = (area: LifeArea) => {
    setEditData((prev) => ({
      ...prev,
      areas: prev.areas.includes(area) ? prev.areas.filter((a) => a !== area) : [...prev.areas, area],
    }));
  };

  const toggleTag = (tagId: string) => {
    setEditData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((t) => t !== tagId) : [...prev.tags, tagId],
    }));
  };

  const addImageUrl = () => {
    if (imageUrl.trim() && !editData.images.includes(imageUrl.trim())) {
      setEditData((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
      setImageUrl('');
    }
  };

  const removeImage = (url: string) => {
    setEditData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== url),
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl && !editData.images.includes(dataUrl)) {
          setEditData((prev) => ({
            ...prev,
            images: [...prev.images, dataUrl],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const moodOption = MOOD_OPTIONS.find((m) => m.value === entry.mood);
  const energyOption = ENERGY_OPTIONS.find((e) => e.value === entry.energy);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {format(new Date(entry.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4 mt-4">
            {/* Mood */}
            <div>
              <Label>Tâm trạng</Label>
              <div className="flex gap-2 mt-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditData({ ...editData, mood: option.value as any })}
                    className={cn(
                      "flex-1 p-2 rounded-lg text-center transition-all",
                      editData.mood === option.value ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <span className="text-xl">{option.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div>
              <Label>Năng lượng</Label>
              <div className="flex gap-2 mt-2">
                {ENERGY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditData({ ...editData, energy: option.value as any })}
                    className={cn(
                      "flex-1 p-2 rounded-lg text-center transition-all",
                      editData.energy === option.value ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <span className="text-xl">{option.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <Label>Nội dung</Label>
              <Textarea
                value={editData.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {journalTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-all flex items-center gap-1.5",
                      editData.tags.includes(tag.id) ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Areas */}
            <div>
              <Label>Lĩnh vực</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LIFE_AREAS.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-all",
                      editData.areas.includes(area.id) ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {area.icon} {area.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <Label>Hình ảnh</Label>
              <div className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập URL hình ảnh..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                  />
                  <Button type="button" variant="secondary" size="icon" onClick={addImageUrl}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button type="button" variant="secondary" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
                {editData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {editData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt="" className="w-full h-20 object-cover rounded-lg" />
                        <button
                          onClick={() => removeImage(img)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gratitude */}
            <div>
              <Label>Gratitude</Label>
              <Textarea
                value={editData.gratitude}
                onChange={(e) => setEditData({ ...editData, gratitude: e.target.value })}
                rows={2}
                className="mt-2"
              />
            </div>

            <Button className="w-full" onClick={handleSave}>Lưu thay đổi</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                <span className="text-xl">{moodOption?.icon}</span>
                <span className="text-sm">{moodOption?.label}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                <span className="text-xl">{energyOption?.icon}</span>
                <span className="text-sm">{energyOption?.label}</span>
              </div>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tagId) => {
                  const tag = journalTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge key={tagId} variant="secondary" className="gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            )}

            <div>
              <p className="whitespace-pre-wrap text-sm">{entry.content}</p>
            </div>

            {/* Images */}
            {entry.images && entry.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {entry.images.map((img, idx) => (
                  <img key={idx} src={img} alt="" className="w-full h-32 object-cover rounded-lg" />
                ))}
              </div>
            )}

            {entry.areas && entry.areas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.areas.map((areaId) => {
                  const area = LIFE_AREAS.find((a) => a.id === areaId);
                  return (
                    <span
                      key={areaId}
                      className="text-xs px-2 py-0.5 rounded-full bg-secondary"
                    >
                      {area?.icon} {area?.name}
                    </span>
                  );
                })}
              </div>
            )}

            {entry.gratitude && entry.gratitude.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">🙏 Gratitude</p>
                <ul className="text-sm space-y-1">
                  {entry.gratitude.map((item, i) => (
                    <li key={i} className="text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa nhật ký ngày {entry ? format(new Date(entry.date), 'dd/MM/yyyy', { locale: vi }) : ''}? Nhật ký sẽ được chuyển vào thùng rác và có thể khôi phục sau.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
