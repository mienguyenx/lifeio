import { useState } from 'react';
import { Users, UserPlus, Link2, Copy, Check, Mail, Eye, Edit, X, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Goal, GoalCollaborator } from '@/types/lifeos';

interface GoalCollaborationCardProps {
  goal: Goal;
  onUpdate: (updates: Partial<Goal>) => void;
}

export function GoalCollaborationCard({ goal, onUpdate }: GoalCollaborationCardProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const collaborators = goal.collaborators || [];
  const shareCode = goal.shareCode || generateShareCode();

  function generateShareCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  const shareUrl = `${window.location.origin}/goals/shared/${shareCode}`;

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Email không hợp lệ');
      return;
    }

    if (collaborators.some(c => c.email === inviteEmail)) {
      toast.error('Người này đã được mời');
      return;
    }

    const newCollaborator: GoalCollaborator = {
      id: Date.now().toString(),
      email: inviteEmail.trim(),
      role: inviteRole,
      invitedAt: new Date().toISOString(),
    };

    onUpdate({
      collaborators: [...collaborators, newCollaborator],
      shareCode: shareCode,
    });

    setInviteEmail('');
    toast.success(`Đã mời ${inviteEmail}`);
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    onUpdate({
      collaborators: collaborators.filter(c => c.id !== collaboratorId),
    });
    toast.success('Đã xóa người theo dõi');
  };

  const handleTogglePublic = (isPublic: boolean) => {
    onUpdate({
      isPublic,
      shareCode: isPublic ? (goal.shareCode || generateShareCode()) : goal.shareCode,
    });
    toast.success(isPublic ? 'Đã bật link công khai' : 'Đã tắt link công khai');
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Đã copy link');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể copy link');
    }
  };

  const handleChangeRole = (collaboratorId: string, newRole: 'viewer' | 'editor') => {
    onUpdate({
      collaborators: collaborators.map(c => 
        c.id === collaboratorId ? { ...c, role: newRole } : c
      ),
    });
    toast.success('Đã cập nhật quyền');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Cộng tác
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-1" />
                Mời
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Mời cộng tác viên</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Invite by Email */}
                <div className="space-y-2">
                  <Label>Mời qua email</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      type="email"
                    />
                    <Select value={inviteRole} onValueChange={(v: 'viewer' | 'editor') => setInviteRole(v)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Xem
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-1">
                            <Edit className="w-3 h-3" /> Sửa
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInvite} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Gửi lời mời
                  </Button>
                </div>

                {/* Public Link */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Link công khai</Label>
                    <Switch
                      checked={goal.isPublic || false}
                      onCheckedChange={handleTogglePublic}
                    />
                  </div>
                  {goal.isPublic && (
                    <div className="flex gap-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="text-xs"
                      />
                      <Button variant="outline" size="icon" onClick={copyShareLink}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Ai có link đều có thể xem tiến độ goal
                  </p>
                </div>

                {/* Current Collaborators */}
                {collaborators.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Cộng tác viên ({collaborators.length})</Label>
                    <div className="space-y-2">
                      {collaborators.map((collab) => (
                        <div key={collab.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {collab.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{collab.name || collab.email}</p>
                            <p className="text-[10px] text-muted-foreground">{collab.email}</p>
                          </div>
                          <Select 
                            value={collab.role} 
                            onValueChange={(v: 'viewer' | 'editor') => handleChangeRole(collab.id, v)}
                          >
                            <SelectTrigger className="w-20 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Xem</SelectItem>
                              <SelectItem value="editor">Sửa</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveCollaborator(collab.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Status */}
        <div className="space-y-2">
          {collaborators.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collab) => (
                  <Avatar key={collab.id} className="w-6 h-6 border-2 border-background">
                    <AvatarFallback className="text-[10px]">
                      {collab.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {collaborators.length > 3 && (
                  <Avatar className="w-6 h-6 border-2 border-background">
                    <AvatarFallback className="text-[10px] bg-muted">
                      +{collaborators.length - 3}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {collaborators.length} cộng tác viên
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Chưa có cộng tác viên
            </p>
          )}

          {goal.isPublic && (
            <div className="flex items-center gap-2 text-xs">
              <Link2 className="w-3 h-3 text-success" />
              <span className="text-success">Link công khai đang bật</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs ml-auto"
                onClick={copyShareLink}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
