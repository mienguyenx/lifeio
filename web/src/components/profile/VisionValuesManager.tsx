import { useState } from 'react';
import { Eye, Heart, Users, Target, Star, Sparkles, Plus, Edit2, Trash2, Save, X, Lightbulb, Trophy, TrendingUp, TrendingDown, Wand2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { PersonalValue, LifeRole, LifeVision, PersonalTrait, LifeMilestone, LIFE_AREAS } from '@/types/lifeos';
import { useVisionValuesSuggestions } from '@/hooks/useVisionValuesSuggestions';
import { VisionValuesGuide } from './VisionValuesGuide';
import { AreaModuleHistory } from './AreaModuleHistory';
import { useProfileSync } from '@/hooks/sync/useProfileSync';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['💪', '❤️', '🎯', '⭐', '🔥', '💎', '🌟', '🚀', '💡', '🎨', '📚', '🏆', '🌱', '⚡', '🎭', '🤝', '💼', '🧘', '🏠', '👨‍👩‍👧‍👦'];

export function VisionValuesManager() {
  const user = useLifeOSStore((s) => s.user);
  const setUser = useLifeOSStore((s) => s.setUser);
  const goals = useLifeOSStore((s) => s.goals);

  // AI Suggestions
  const {
    loading: aiLoading,
    getPurposeSuggestions,
    getVisionSuggestions,
    getValueSuggestions,
    getRoleSuggestions,
    getTraitSuggestions,
    getMilestoneSuggestions,
  } = useVisionValuesSuggestions();

  // Suggestion states
  const [purposeSuggestions, setPurposeSuggestions] = useState<string[]>([]);
  const [visionSuggestions, setVisionSuggestions] = useState<Array<{ statement: string; timeframe: string }>>([]);
  const [valueSuggestions, setValueSuggestions] = useState<Array<{ name: string; description: string; icon: string }>>([]);
  const [roleSuggestions, setRoleSuggestions] = useState<Array<{ name: string; description: string; icon: string }>>([]);
  const [traitSuggestions, setTraitSuggestions] = useState<{ strengths: Array<{ name: string; description: string }>; weaknesses: Array<{ name: string; description: string }> } | null>(null);
  const [milestoneSuggestions, setMilestoneSuggestions] = useState<Array<{ title: string; description: string; area: string }>>([]);

  // State for dialogs
  const [editingVision, setEditingVision] = useState<LifeVision | null>(null);
  const [editingValue, setEditingValue] = useState<PersonalValue | null>(null);
  const [editingRole, setEditingRole] = useState<LifeRole | null>(null);
  const [editingTrait, setEditingTrait] = useState<PersonalTrait | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<LifeMilestone | null>(null);
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [purposeText, setPurposeText] = useState(user.lifePurpose || '');

  // Dialog open states
  const [visionDialogOpen, setVisionDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [traitDialogOpen, setTraitDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  // Form states
  const [visionForm, setVisionForm] = useState<{ statement: string; timeframe: '1-year' | '5-year' | '10-year' | 'lifetime' }>({ statement: '', timeframe: '5-year' });
  const [valueForm, setValueForm] = useState<{ name: string; description: string; priority: 1 | 2 | 3 | 4 | 5; icon: string }>({ name: '', description: '', priority: 3, icon: '⭐' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '', icon: '👤', linkedGoalIds: [] as string[] });
  const [traitForm, setTraitForm] = useState<{ name: string; description: string; type: 'strength' | 'weakness' }>({ name: '', description: '', type: 'strength' });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', date: '', area: undefined as string | undefined });

  // Use undefined instead of [] to distinguish between "no data" and "empty array"
  // This ensures that cleared data (undefined) is different from empty data ([])
  const visions = user.visions ?? [];
  const personalValues = user.personalValues ?? [];
  const lifeRoles = user.lifeRoles ?? [];
  const traits = user.traits ?? [];
  const milestones = user.milestones ?? [];

  // AI Suggestion handlers
  const handleGetPurposeSuggestions = async () => {
    const result = await getPurposeSuggestions({ bio: user.bio });
    if (result?.suggestions) {
      setPurposeSuggestions(result.suggestions);
      toast.success('Đã tải gợi ý mục đích sống!');
    }
  };

  const handleGetVisionSuggestions = async () => {
    const result = await getVisionSuggestions({ purpose: user.lifePurpose });
    if (result?.suggestions) {
      setVisionSuggestions(result.suggestions);
      toast.success('Đã tải gợi ý tầm nhìn!');
    }
  };

  const handleGetValueSuggestions = async () => {
    const result = await getValueSuggestions({ purpose: user.lifePurpose });
    if (result?.suggestions) {
      setValueSuggestions(result.suggestions);
      toast.success('Đã tải gợi ý giá trị!');
    }
  };

  const handleGetRoleSuggestions = async () => {
    const result = await getRoleSuggestions({ bio: user.bio });
    if (result?.suggestions) {
      setRoleSuggestions(result.suggestions);
      toast.success('Đã tải gợi ý vai trò!');
    }
  };

  const handleGetTraitSuggestions = async () => {
    const result = await getTraitSuggestions();
    if (result) {
      setTraitSuggestions(result);
      toast.success('Đã tải gợi ý đặc điểm!');
    }
  };

  const handleGetMilestoneSuggestions = async () => {
    const result = await getMilestoneSuggestions();
    if (result?.suggestions) {
      setMilestoneSuggestions(result.suggestions);
      toast.success('Đã tải gợi ý cột mốc!');
    }
  };

  // Life Purpose handlers
  const handleSavePurpose = () => {
    setUser({ lifePurpose: purposeText });
    setEditingPurpose(false);
    toast.success('Đã lưu mục đích sống!');
  };

  // Vision handlers
  const handleSaveVision = async () => {
    const newVision: LifeVision = {
      id: editingVision?.id || crypto.randomUUID(),
      statement: visionForm.statement,
      timeframe: visionForm.timeframe,
      createdAt: editingVision?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await saveLifeVision(newVision);
    if (success) {
      const updatedVisions = editingVision
        ? visions.map(v => v.id === editingVision.id ? newVision : v)
        : [...visions, newVision];

      setUser({ visions: updatedVisions });
      setVisionDialogOpen(false);
      setEditingVision(null);
      setVisionForm({ statement: '', timeframe: '5-year' });
      toast.success(editingVision ? 'Đã cập nhật tầm nhìn!' : 'Đã thêm tầm nhìn mới!');
    } else {
      toast.error('Không thể lưu tầm nhìn. Vui lòng thử lại.');
    }
  };

  const handleDeleteVision = async (id: string) => {
    const success = await deleteLifeVision(id);
    if (success) {
      setUser({ visions: visions.filter(v => v.id !== id) });
      toast.success('Đã xóa tầm nhìn');
    } else {
      toast.error('Không thể xóa tầm nhìn. Vui lòng thử lại.');
    }
  };

  // Value handlers
  const handleSaveValue = async () => {
    const newValue: PersonalValue = {
      id: editingValue?.id || crypto.randomUUID(),
      name: valueForm.name,
      description: valueForm.description,
      priority: valueForm.priority as 1 | 2 | 3 | 4 | 5,
      icon: valueForm.icon,
      createdAt: editingValue?.createdAt || new Date().toISOString(),
    };

    // Save to database first (history will be auto-created by trigger)
    const success = await savePersonalValue(newValue);
    if (success) {
      const updatedValues = editingValue
        ? personalValues.map(v => v.id === editingValue.id ? newValue : v)
        : [...personalValues, newValue];

      // Sort by priority
      updatedValues.sort((a, b) => a.priority - b.priority);

      setUser({ personalValues: updatedValues });
      setValueDialogOpen(false);
      setEditingValue(null);
      setValueForm({ name: '', description: '', priority: 3, icon: '⭐' });
      toast.success(editingValue ? 'Đã cập nhật giá trị!' : 'Đã thêm giá trị mới!');
    } else {
      toast.error('Không thể lưu giá trị. Vui lòng thử lại.');
    }
  };

  const handleDeleteValue = async (id: string) => {
    // Delete from database first (history will be auto-created by trigger)
    const success = await deletePersonalValue(id);
    if (success) {
      setUser({ personalValues: personalValues.filter(v => v.id !== id) });
      toast.success('Đã xóa giá trị');
    } else {
      toast.error('Không thể xóa giá trị. Vui lòng thử lại.');
    }
  };

  // Role handlers
  const handleSaveRole = async () => {
    const newRole: LifeRole = {
      id: editingRole?.id || crypto.randomUUID(),
      name: roleForm.name,
      description: roleForm.description,
      icon: roleForm.icon,
      linkedGoalIds: roleForm.linkedGoalIds,
      isActive: true,
      createdAt: editingRole?.createdAt || new Date().toISOString(),
    };

    const success = await saveLifeRole(newRole);
    if (success) {
      const updatedRoles = editingRole
        ? lifeRoles.map(r => r.id === editingRole.id ? newRole : r)
        : [...lifeRoles, newRole];

      setUser({ lifeRoles: updatedRoles });
      setRoleDialogOpen(false);
      setEditingRole(null);
      setRoleForm({ name: '', description: '', icon: '👤', linkedGoalIds: [] });
      toast.success(editingRole ? 'Đã cập nhật vai trò!' : 'Đã thêm vai trò mới!');
    } else {
      toast.error('Không thể lưu vai trò. Vui lòng thử lại.');
    }
  };

  const handleDeleteRole = async (id: string) => {
    const success = await deleteLifeRole(id);
    if (success) {
      setUser({ lifeRoles: lifeRoles.filter(r => r.id !== id) });
      toast.success('Đã xóa vai trò');
    } else {
      toast.error('Không thể xóa vai trò. Vui lòng thử lại.');
    }
  };

  // Trait handlers
  const handleSaveTrait = async () => {
    const newTrait: PersonalTrait = {
      id: editingTrait?.id || crypto.randomUUID(),
      name: traitForm.name,
      description: traitForm.description,
      type: traitForm.type,
      createdAt: editingTrait?.createdAt || new Date().toISOString(),
    };

    const success = await savePersonalTrait(newTrait);
    if (success) {
      const updatedTraits = editingTrait
        ? traits.map(t => t.id === editingTrait.id ? newTrait : t)
        : [...traits, newTrait];

      setUser({ traits: updatedTraits });
      setTraitDialogOpen(false);
      setEditingTrait(null);
      setTraitForm({ name: '', description: '', type: 'strength' });
      toast.success(editingTrait ? 'Đã cập nhật!' : 'Đã thêm thành công!');
    } else {
      toast.error('Không thể lưu đặc điểm. Vui lòng thử lại.');
    }
  };

  const handleDeleteTrait = async (id: string) => {
    const success = await deletePersonalTrait(id);
    if (success) {
      setUser({ traits: traits.filter(t => t.id !== id) });
      toast.success('Đã xóa');
    } else {
      toast.error('Không thể xóa đặc điểm. Vui lòng thử lại.');
    }
  };

  // Milestone handlers
  const handleSaveMilestone = async () => {
    const newMilestone: LifeMilestone = {
      id: editingMilestone?.id || crypto.randomUUID(),
      title: milestoneForm.title,
      description: milestoneForm.description,
      date: milestoneForm.date,
      area: milestoneForm.area as any,
      createdAt: editingMilestone?.createdAt || new Date().toISOString(),
    };

    const success = await saveLifeMilestone(newMilestone);
    if (success) {
      const updatedMilestones = editingMilestone
        ? milestones.map(m => m.id === editingMilestone.id ? newMilestone : m)
        : [...milestones, newMilestone];

      // Sort by date (newest first)
      updatedMilestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUser({ milestones: updatedMilestones });
      setMilestoneDialogOpen(false);
      setEditingMilestone(null);
      setMilestoneForm({ title: '', description: '', date: '', area: undefined });
      toast.success(editingMilestone ? 'Đã cập nhật!' : 'Đã thêm cột mốc!');
    } else {
      toast.error('Không thể lưu cột mốc. Vui lòng thử lại.');
    }
  };

  const handleDeleteMilestone = (id: string) => {
    setUser({ milestones: milestones.filter(m => m.id !== id) });
    toast.success('Đã xóa cột mốc');
  };

  const openEditVision = (vision: LifeVision) => {
    setEditingVision(vision);
    setVisionForm({ statement: vision.statement, timeframe: vision.timeframe || '5-year' });
    setVisionDialogOpen(true);
  };

  const openEditValue = (value: PersonalValue) => {
    setEditingValue(value);
    setValueForm({ name: value.name, description: value.description || '', priority: value.priority, icon: value.icon || '⭐' });
    setValueDialogOpen(true);
  };

  const openEditRole = (role: LifeRole) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || '', icon: role.icon || '👤', linkedGoalIds: role.linkedGoalIds || [] });
    setRoleDialogOpen(true);
  };

  const openEditTrait = (trait: PersonalTrait) => {
    setEditingTrait(trait);
    setTraitForm({ name: trait.name, description: trait.description || '', type: trait.type });
    setTraitDialogOpen(true);
  };

  const openEditMilestone = (milestone: LifeMilestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({ title: milestone.title, description: milestone.description || '', date: milestone.date, area: milestone.area });
    setMilestoneDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Vision & Values
          </CardTitle>
          <VisionValuesGuide />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="purpose" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="purpose" className="text-xs">Mục đích</TabsTrigger>
            <TabsTrigger value="vision" className="text-xs">Tầm nhìn</TabsTrigger>
            <TabsTrigger value="values" className="text-xs">Giá trị</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">Vai trò</TabsTrigger>
            <TabsTrigger value="traits" className="text-xs">Đặc điểm</TabsTrigger>
          </TabsList>

          {/* Life Purpose Tab */}
          <TabsContent value="purpose" className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
              {editingPurpose ? (
                <div className="space-y-4">
                  <Textarea
                    value={purposeText}
                    onChange={(e) => setPurposeText(e.target.value)}
                    placeholder="Mục đích sống của tôi là..."
                    rows={4}
                    className="text-center text-lg"
                  />
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button onClick={handleSavePurpose}>
                      <Save className="w-4 h-4 mr-1" /> Lưu
                    </Button>
                    <Button variant="outline" onClick={() => setEditingPurpose(false)}>
                      <X className="w-4 h-4 mr-1" /> Hủy
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleGetPurposeSuggestions}
                      disabled={aiLoading === 'purpose'}
                    >
                      {aiLoading === 'purpose' ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-1" />
                      )}
                      Gợi ý AI
                    </Button>
                  </div>
                  {/* Purpose Suggestions */}
                  {purposeSuggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm text-muted-foreground">Gợi ý từ AI:</Label>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {purposeSuggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors text-left text-sm"
                              onClick={() => {
                                setPurposeText(suggestion);
                                toast.success('Đã chọn gợi ý!');
                              }}
                            >
                              "{suggestion}"
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p className="text-xl font-medium italic mb-4">
                    "{user.lifePurpose || 'Chưa xác định mục đích sống'}"
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => {
                      setPurposeText(user.lifePurpose || '');
                      setEditingPurpose(true);
                    }}>
                      <Edit2 className="w-4 h-4 mr-1" /> Chỉnh sửa
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={async () => {
                        await handleGetPurposeSuggestions();
                        setPurposeText(user.lifePurpose || '');
                        setEditingPurpose(true);
                      }}
                      disabled={aiLoading === 'purpose'}
                    >
                      {aiLoading === 'purpose' ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-1" />
                      )}
                      Gợi ý AI
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Life Milestones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Cột mốc cuộc đời
                </Label>
                <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingMilestone(null);
                      setMilestoneForm({ title: '', description: '', date: '', area: undefined });
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> Thêm
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMilestone ? 'Sửa cột mốc' : 'Thêm cột mốc mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tiêu đề</Label>
                        <Input
                          value={milestoneForm.title}
                          onChange={(e) => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="VD: Tốt nghiệp đại học"
                        />
                      </div>
                      <div>
                        <Label>Mô tả</Label>
                        <Textarea
                          value={milestoneForm.description}
                          onChange={(e) => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Chi tiết về cột mốc..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Ngày đạt được</Label>
                          <Input
                            type="date"
                            value={milestoneForm.date}
                            onChange={(e) => setMilestoneForm(f => ({ ...f, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Lĩnh vực</Label>
                          <Select
                            value={milestoneForm.area}
                            onValueChange={(v) => setMilestoneForm(f => ({ ...f, area: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn..." />
                            </SelectTrigger>
                            <SelectContent>
                              {LIFE_AREAS.map(area => (
                                <SelectItem key={area.id} value={area.id}>
                                  {area.icon} {area.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleSaveMilestone} className="w-full" disabled={!milestoneForm.title || !milestoneForm.date}>
                        <Save className="w-4 h-4 mr-1" /> Lưu
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có cột mốc nào</p>
                ) : (
                  milestones.map(milestone => {
                    const area = LIFE_AREAS.find(a => a.id === milestone.area);
                    return (
                      <div key={milestone.id} className="flex items-start gap-3 p-3 bg-secondary rounded-lg group">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{milestone.title}</span>
                            {area && <Badge variant="outline" className="text-xs">{area.icon}</Badge>}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          )}
                          <span className="text-xs text-muted-foreground">{new Date(milestone.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 items-center">
                            <AreaModuleHistory triggerVariant="icon" moduleType="milestones" entityId={milestone.id} entityName={milestone.title} />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditMilestone(milestone)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMilestone(milestone.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent value="vision" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleGetVisionSuggestions}
                disabled={aiLoading === 'vision'}
              >
                {aiLoading === 'vision' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-1" />
                )}
                Gợi ý AI
              </Button>
              <Dialog open={visionDialogOpen} onOpenChange={setVisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingVision(null);
                    setVisionForm({ statement: '', timeframe: '5-year' });
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm tầm nhìn
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingVision ? 'Sửa tầm nhìn' : 'Thêm tầm nhìn mới'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Khung thời gian</Label>
                      <Select
                        value={visionForm.timeframe}
                        onValueChange={(v: any) => setVisionForm(f => ({ ...f, timeframe: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-year">1 năm</SelectItem>
                          <SelectItem value="5-year">5 năm</SelectItem>
                          <SelectItem value="10-year">10 năm</SelectItem>
                          <SelectItem value="lifetime">Cả đời</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tầm nhìn</Label>
                      <Textarea
                        value={visionForm.statement}
                        onChange={(e) => setVisionForm(f => ({ ...f, statement: e.target.value }))}
                        placeholder="Mô tả tầm nhìn của bạn..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleSaveVision} className="w-full" disabled={!visionForm.statement}>
                      <Save className="w-4 h-4 mr-1" /> Lưu
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Vision Suggestions */}
            {visionSuggestions.length > 0 && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">Gợi ý từ AI (nhấn để thêm):</Label>
                <div className="space-y-2">
                  {visionSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-background rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        const newVision: LifeVision = {
                          id: crypto.randomUUID(),
                          statement: suggestion.statement,
                          timeframe: (suggestion.timeframe as any) || '5-year',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                        setUser({ visions: [...visions, newVision] });
                        setVisionSuggestions(visionSuggestions.filter((_, i) => i !== idx));
                        toast.success('Đã thêm tầm nhìn!');
                      }}
                    >
                      <Badge variant="outline" className="mb-1">
                        {suggestion.timeframe === '1-year' ? '1 năm' : 
                         suggestion.timeframe === '5-year' ? '5 năm' :
                         suggestion.timeframe === '10-year' ? '10 năm' : 'Cả đời'}
                      </Badge>
                      <p className="text-sm">{suggestion.statement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {visions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Chưa có tầm nhìn nào. Hãy thêm tầm nhìn để định hướng cuộc sống.</p>
              ) : (
                visions.map(vision => (
                  <div key={vision.id} className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border group">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">
                        {vision.timeframe === '1-year' ? '1 năm' : 
                         vision.timeframe === '5-year' ? '5 năm' :
                         vision.timeframe === '10-year' ? '10 năm' : 'Cả đời'}
                      </Badge>
                      <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 items-center">
                        <AreaModuleHistory triggerVariant="icon" moduleType="visions" entityId={vision.id} entityName={vision.statement.substring(0, 30)} />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditVision(vision)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteVision(vision.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{vision.statement}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cập nhật: {new Date(vision.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Values Tab */}
          <TabsContent value="values" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleGetValueSuggestions}
                disabled={aiLoading === 'values'}
              >
                {aiLoading === 'values' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-1" />
                )}
                Gợi ý AI
              </Button>
              <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingValue(null);
                    setValueForm({ name: '', description: '', priority: 3, icon: '⭐' });
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm giá trị
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingValue ? 'Sửa giá trị' : 'Thêm giá trị mới'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Icon</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setValueForm(f => ({ ...f, icon: emoji }))}
                            className={cn(
                              "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                              valueForm.icon === emoji ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Tên giá trị</Label>
                      <Input
                        value={valueForm.name}
                        onChange={(e) => setValueForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="VD: Trung thực, Kiên trì..."
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={valueForm.description}
                        onChange={(e) => setValueForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Giá trị này có ý nghĩa gì với bạn?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Mức độ ưu tiên (1 = cao nhất)</Label>
                      <Select
                        value={String(valueForm.priority)}
                        onValueChange={(v) => setValueForm(f => ({ ...f, priority: parseInt(v) as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(p => (
                            <SelectItem key={p} value={String(p)}>
                              {'⭐'.repeat(6 - p)} Mức {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSaveValue} className="w-full" disabled={!valueForm.name}>
                      <Save className="w-4 h-4 mr-1" /> Lưu
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Value Suggestions */}
            {valueSuggestions.length > 0 && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">Gợi ý từ AI (nhấn để thêm):</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {valueSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-background rounded-lg cursor-pointer hover:bg-accent/50 transition-colors flex items-start gap-2"
                      onClick={() => {
                        const newValue: PersonalValue = {
                          id: crypto.randomUUID(),
                          name: suggestion.name,
                          description: suggestion.description,
                          icon: suggestion.icon || '⭐',
                          priority: (idx + 1) as 1 | 2 | 3 | 4 | 5,
                          createdAt: new Date().toISOString(),
                        };
                        setUser({ personalValues: [...personalValues, newValue].sort((a, b) => a.priority - b.priority) });
                        setValueSuggestions(valueSuggestions.filter((_, i) => i !== idx));
                        toast.success('Đã thêm giá trị!');
                      }}
                    >
                      <span className="text-xl">{suggestion.icon}</span>
                      <div>
                        <span className="font-medium text-sm">{suggestion.name}</span>
                        <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {personalValues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Chưa có giá trị nào. Hãy thêm những giá trị cốt lõi của bạn.</p>
              ) : (
                personalValues.map((value, index) => (
                  <div key={value.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg group">
                    <span className="text-2xl">{value.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{value.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {'⭐'.repeat(6 - value.priority)}
                        </Badge>
                      </div>
                      {value.description && (
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      )}
                    </div>
                    <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 items-center">
                      <AreaModuleHistory triggerVariant="icon" moduleType="personalValues" entityId={value.id} entityName={value.name} />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditValue(value)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteValue(value.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleGetRoleSuggestions}
                disabled={aiLoading === 'roles'}
              >
                {aiLoading === 'roles' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-1" />
                )}
                Gợi ý AI
              </Button>
              <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingRole(null);
                    setRoleForm({ name: '', description: '', icon: '👤', linkedGoalIds: [] });
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm vai trò
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRole ? 'Sửa vai trò' : 'Thêm vai trò mới'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Icon</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setRoleForm(f => ({ ...f, icon: emoji }))}
                            className={cn(
                              "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                              roleForm.icon === emoji ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Tên vai trò</Label>
                      <Input
                        value={roleForm.name}
                        onChange={(e) => setRoleForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="VD: Con, Bạn, Nhân viên..."
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={roleForm.description}
                        onChange={(e) => setRoleForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Vai trò này đòi hỏi gì ở bạn?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Goals liên quan</Label>
                      <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                        {goals.filter(g => g.status !== 'archived').map(goal => (
                          <Badge
                            key={goal.id}
                            variant={roleForm.linkedGoalIds.includes(goal.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setRoleForm(f => ({
                                ...f,
                                linkedGoalIds: f.linkedGoalIds.includes(goal.id)
                                  ? f.linkedGoalIds.filter(id => id !== goal.id)
                                  : [...f.linkedGoalIds, goal.id]
                              }));
                            }}
                          >
                            {goal.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleSaveRole} className="w-full" disabled={!roleForm.name}>
                      <Save className="w-4 h-4 mr-1" /> Lưu
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Role Suggestions */}
            {roleSuggestions.length > 0 && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">Gợi ý từ AI (nhấn để thêm):</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roleSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-background rounded-lg cursor-pointer hover:bg-accent/50 transition-colors flex items-start gap-2"
                      onClick={() => {
                        const newRole: LifeRole = {
                          id: crypto.randomUUID(),
                          name: suggestion.name,
                          description: suggestion.description,
                          icon: suggestion.icon || '👤',
                          isActive: true,
                          createdAt: new Date().toISOString(),
                        };
                        setUser({ lifeRoles: [...lifeRoles, newRole] });
                        setRoleSuggestions(roleSuggestions.filter((_, i) => i !== idx));
                        toast.success('Đã thêm vai trò!');
                      }}
                    >
                      <span className="text-xl">{suggestion.icon}</span>
                      <div>
                        <span className="font-medium text-sm">{suggestion.name}</span>
                        <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {lifeRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Chưa có vai trò nào. Hãy định nghĩa các vai trò trong cuộc sống.</p>
              ) : (
                lifeRoles.map(role => (
                  <div key={role.id} className="p-4 bg-secondary rounded-xl group">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{role.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{role.name}</span>
                          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 items-center">
                            <AreaModuleHistory triggerVariant="icon" moduleType="lifeRoles" entityId={role.id} entityName={role.name} />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditRole(role)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRole(role.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                        )}
                        {role.linkedGoalIds && role.linkedGoalIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.linkedGoalIds.map(goalId => {
                              const goal = goals.find(g => g.id === goalId);
                              return goal ? (
                                <Badge key={goalId} variant="outline" className="text-xs">
                                  <Target className="w-3 h-3 mr-1" /> {goal.title}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Traits Tab */}
          <TabsContent value="traits" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleGetTraitSuggestions}
                disabled={aiLoading === 'traits'}
              >
                {aiLoading === 'traits' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-1" />
                )}
                Gợi ý AI
              </Button>
              <Dialog open={traitDialogOpen} onOpenChange={setTraitDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingTrait(null);
                    setTraitForm({ name: '', description: '', type: 'strength' });
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm đặc điểm
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTrait ? 'Sửa đặc điểm' : 'Thêm đặc điểm mới'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Loại</Label>
                      <Select
                        value={traitForm.type}
                        onValueChange={(v: any) => setTraitForm(f => ({ ...f, type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strength">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-500" /> Điểm mạnh
                            </span>
                          </SelectItem>
                          <SelectItem value="weakness">
                            <span className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-red-500" /> Điểm yếu
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tên</Label>
                      <Input
                        value={traitForm.name}
                        onChange={(e) => setTraitForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="VD: Kiên nhẫn, Hay lo lắng..."
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={traitForm.description}
                        onChange={(e) => setTraitForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Chi tiết về đặc điểm này..."
                        rows={2}
                      />
                    </div>
                    <Button onClick={handleSaveTrait} className="w-full" disabled={!traitForm.name}>
                      <Save className="w-4 h-4 mr-1" /> Lưu
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Trait Suggestions */}
            {traitSuggestions && (traitSuggestions.strengths?.length > 0 || traitSuggestions.weaknesses?.length > 0) && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">Gợi ý từ AI (nhấn để thêm):</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  {traitSuggestions.strengths?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-green-500 font-medium">Điểm mạnh:</span>
                      {traitSuggestions.strengths.map((s, idx) => (
                        <div key={idx} className="p-2 bg-green-500/10 rounded cursor-pointer hover:bg-green-500/20 text-sm"
                          onClick={() => {
                            const newTrait: PersonalTrait = { id: crypto.randomUUID(), name: s.name, description: s.description, type: 'strength', createdAt: new Date().toISOString() };
                            setUser({ traits: [...traits, newTrait] });
                            setTraitSuggestions({ ...traitSuggestions, strengths: traitSuggestions.strengths.filter((_, i) => i !== idx) });
                            toast.success('Đã thêm!');
                          }}>
                          <span className="font-medium">{s.name}</span>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {traitSuggestions.weaknesses?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-red-500 font-medium">Điểm yếu:</span>
                      {traitSuggestions.weaknesses.map((s, idx) => (
                        <div key={idx} className="p-2 bg-red-500/10 rounded cursor-pointer hover:bg-red-500/20 text-sm"
                          onClick={() => {
                            const newTrait: PersonalTrait = { id: crypto.randomUUID(), name: s.name, description: s.description, type: 'weakness', createdAt: new Date().toISOString() };
                            setUser({ traits: [...traits, newTrait] });
                            setTraitSuggestions({ ...traitSuggestions, weaknesses: traitSuggestions.weaknesses.filter((_, i) => i !== idx) });
                            toast.success('Đã thêm!');
                          }}>
                          <span className="font-medium">{s.name}</span>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Điểm mạnh
                </Label>
                <div className="space-y-2">
                  {traits.filter(t => t.type === 'strength').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có điểm mạnh</p>
                  ) : (
                    traits.filter(t => t.type === 'strength').map(trait => (
                      <div key={trait.id} className="p-3 bg-green-500/10 rounded-lg group flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{trait.name}</span>
                          {trait.description && (
                            <p className="text-xs text-muted-foreground">{trait.description}</p>
                          )}
                        </div>
                        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 items-center">
                          <AreaModuleHistory triggerVariant="icon" moduleType="traits" entityId={trait.id} entityName={trait.name} />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditTrait(trait)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteTrait(trait.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Điểm yếu
                </Label>
                <div className="space-y-2">
                  {traits.filter(t => t.type === 'weakness').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có điểm yếu</p>
                  ) : (
                    traits.filter(t => t.type === 'weakness').map(trait => (
                      <div key={trait.id} className="p-3 bg-red-500/10 rounded-lg group flex items-start gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{trait.name}</span>
                          {trait.description && (
                            <p className="text-xs text-muted-foreground">{trait.description}</p>
                          )}
                        </div>
                        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 items-center">
                          <AreaModuleHistory triggerVariant="icon" moduleType="traits" entityId={trait.id} entityName={trait.name} />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditTrait(trait)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteTrait(trait.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}