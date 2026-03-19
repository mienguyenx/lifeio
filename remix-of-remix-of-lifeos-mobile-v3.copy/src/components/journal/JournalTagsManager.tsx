import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { JournalTag } from '@/types/lifeos';

const PRESET_COLORS = [
  '0 84% 60%',      // Red
  '25 95% 53%',     // Orange
  '45 93% 47%',     // Yellow
  '142 71% 45%',    // Green
  '199 89% 48%',    // Cyan
  '217 91% 60%',    // Blue
  '262 83% 58%',    // Purple
  '330 81% 60%',    // Pink
];

interface JournalTagsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: JournalTag[];
  onAddTag: (name: string, color: string) => string;
  onUpdateTag: (id: string, updates: Partial<JournalTag>) => void;
  onDeleteTag: (id: string) => void;
}

export function JournalTagsManager({
  open,
  onOpenChange,
  tags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}: JournalTagsManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAddTag = () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName || trimmedName.length > 50) return;
    onAddTag(trimmedName, newTagColor);
    setNewTagName('');
    setNewTagColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  };

  const startEditing = (tag: JournalTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const saveEditing = () => {
    if (!editingId || !editName.trim() || editName.trim().length > 50) return;
    onUpdateTag(editingId, { name: editName.trim(), color: editColor });
    cancelEditing();
  };

  const handleDelete = (id: string) => {
    onDeleteTag(id);
    if (editingId === id) {
      cancelEditing();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Quản lý Tags
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Add new tag */}
          <div className="space-y-2">
            <Label>Thêm tag mới</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tên tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value.slice(0, 50))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1"
              />
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 4).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-md transition-all",
                      newTagColor === color && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ backgroundColor: `hsl(${color})` }}
                  />
                ))}
              </div>
              <Button size="icon" onClick={handleAddTag} disabled={!newTagName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              {PRESET_COLORS.slice(4).map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-md transition-all",
                    newTagColor === color && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{ backgroundColor: `hsl(${color})` }}
                />
              ))}
            </div>
          </div>

          {/* Existing tags */}
          <div className="space-y-2">
            <Label>Tags hiện có ({tags.length})</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có tag nào
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                  >
                    {editingId === tag.id ? (
                      <>
                        <div className="flex gap-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={cn(
                                "w-5 h-5 rounded transition-all",
                                editColor === color && "ring-2 ring-primary"
                              )}
                              style={{ backgroundColor: `hsl(${color})` }}
                            />
                          ))}
                        </div>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value.slice(0, 50))}
                          className="flex-1 h-8"
                          autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEditing}>
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditing}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: `hsl(${tag.color})` }}
                        />
                        <span className="flex-1 text-sm font-medium">{tag.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEditing(tag)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(tag.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
