import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Timer, Save, Mail, Phone, Calendar, Camera, Edit2, Settings } from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { VisionValuesManager } from '@/components/profile/VisionValuesManager';

export default function MePage() {
  const { user: authUser } = useAuth();
  const user = useLifeOSStore((s) => s.user);
  const setUser = useLifeOSStore((s) => s.setUser);
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const tasks = useLifeOSStore((s) => s.tasks);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  
  // Profile edit states
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [bio, setBio] = useState(user.bio || '');

  const totalPomodoros = pomodoroSessions.filter((s) => s.phase === 'work').length;
  const totalMinutes = totalPomodoros * pomodoroSettings.workDuration;

  // Calculate profile completion
  const profileFields = [
    user.name,
    user.email,
    user.avatar,
    user.bio,
    user.vision,
    user.values?.length,
    user.roles?.length,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ảnh quá lớn (tối đa 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ avatar: reader.result as string });
        toast.success('Đã cập nhật ảnh đại diện');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setUser({
      name,
      email,
      phone,
      birthday,
      bio,
    });
    setEditingProfile(false);
    toast.success('Đã lưu thông tin cá nhân!');
  };

  return (
    <div className={cn("p-4 md:p-6 space-y-6", !isMobile && "max-w-2xl mx-auto")}>
      {/* Profile Header with Avatar */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-background border-4 border-background shadow-lg flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Name and Bio */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{user.name || authUser?.user_metadata?.name || 'LifeOS User'}</h1>
              {user.bio && <p className="text-muted-foreground text-sm mt-1">{user.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                {(user.email || authUser?.email) && (
                  <Badge variant="secondary" className="text-xs">
                    <Mail className="w-3 h-3 mr-1" /> {user.email || authUser?.email}
                  </Badge>
                )}
              </div>
            </div>

            {/* Edit & Settings buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setName(user.name || '');
                  setEmail(user.email || '');
                  setPhone(user.phone || '');
                  setBirthday(user.birthday || '');
                  setBio(user.bio || '');
                  setEditingProfile(!editingProfile);
                }}
              >
                <Edit2 className="w-4 h-4 mr-1" /> {editingProfile ? 'Hủy' : 'Sửa'}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Hoàn thành profile</span>
              <span className="text-sm font-medium">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            {profileCompletion < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                Thêm {!user.email && 'email, '}{!user.bio && 'bio, '}{!user.vision && 'tầm nhìn '} để hoàn thiện profile
              </p>
            )}
          </div>

          {/* Edit Profile Form */}
          {editingProfile && (
            <div className="mt-6 space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" /> Họ tên
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên của bạn"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" /> Số điện thoại
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0123 456 789"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" /> Ngày sinh
                  </Label>
                  <Input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Edit2 className="w-4 h-4" /> Bio
                </Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Giới thiệu ngắn về bản thân..."
                  rows={2}
                />
              </div>
              <Button onClick={handleSaveProfile} className="w-full">
                <Save className="w-4 h-4 mr-2" /> Lưu thông tin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{habits.filter(h => !h.archivedAt).length}</div>
            <p className="text-xs text-muted-foreground">Habits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-area-career">{tasks.filter(t => t.status !== 'done' && !t.archived).length}</div>
            <p className="text-xs text-muted-foreground">Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-area-learning">{goals.filter(g => g.status !== 'archived').length}</div>
            <p className="text-xs text-muted-foreground">Goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pomodoro-work">🍅 {totalPomodoros}</div>
            <p className="text-xs text-muted-foreground">Pomodoros</p>
          </CardContent>
        </Card>
      </div>

      {/* Pomodoro Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="w-5 h-5 text-pomodoro-work" /> Pomodoro Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-pomodoro-work">🍅 {totalPomodoros}</div>
              <p className="text-xs text-muted-foreground mt-1">Tổng sessions</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">Thời gian làm việc</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vision, Values, Roles - Enhanced */}
      <VisionValuesManager />
    </div>
  );
}
