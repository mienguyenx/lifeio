import { useState, useMemo } from 'react';
import { Users, Heart, Phone, Mail, Calendar, MessageSquare, Plus, Target, Star, UserPlus, Clock, ChevronLeft, ChevronRight, Lightbulb, PanelRightClose, PanelRight, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { toast } from 'sonner';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { useRelationshipsSync, type Contact, type Interaction } from '@/hooks/sync/useRelationshipsSync';

const RELATIONSHIP_TYPES = [
  { id: 'family', name: 'Gia đình', icon: '👨‍👩‍👧‍👦', color: 'text-rose-500' },
  { id: 'friend', name: 'Bạn bè', icon: '👋', color: 'text-blue-500' },
  { id: 'colleague', name: 'Đồng nghiệp', icon: '💼', color: 'text-amber-500' },
  { id: 'mentor', name: 'Mentor', icon: '🎓', color: 'text-purple-500' },
  { id: 'other', name: 'Khác', icon: '👤', color: 'text-gray-500' },
];

const INTERACTION_TYPES = [
  { id: 'call', name: 'Gọi điện', icon: '📞' },
  { id: 'message', name: 'Nhắn tin', icon: '💬' },
  { id: 'meeting', name: 'Gặp mặt', icon: '🤝' },
  { id: 'video_call', name: 'Video call', icon: '📹' },
  { id: 'other', name: 'Khác', icon: '📝' },
];

const RELATIONSHIP_TIPS = [
  { icon: '💬', text: 'Chủ động liên lạc với người thân mỗi tuần' },
  { icon: '🎁', text: 'Nhớ những ngày quan trọng của họ' },
  { icon: '👂', text: 'Lắng nghe nhiều hơn là nói' },
  { icon: '🤝', text: 'Luôn giữ lời hứa và đáng tin cậy' },
  { icon: '❤️', text: 'Thể hiện sự biết ơn thường xuyên' },
];

export default function RelationshipsPage() {
  const { goals, lifeWheelScores, relationshipsContacts, relationshipsInteractions, addRelationshipContact, updateRelationshipContact, deleteRelationshipContact, addRelationshipInteraction, updateRelationshipInteraction, deleteRelationshipInteraction } = useLifeOSStore();
  const { saveContact, updateContact: syncUpdateContact, deleteContact: syncDeleteContact, saveInteraction, updateInteraction: syncUpdateInteraction, deleteInteraction: syncDeleteInteraction } = useRelationshipsSync();
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isEditInteractionOpen, setIsEditInteractionOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [activeTab, setActiveTab] = useState('contacts');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('relationships-sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Use data from store
  const contacts = relationshipsContacts;
  const interactions = relationshipsInteractions;

  const [newContact, setNewContact] = useState({
    name: '',
    relationship: 'friend' as const,
    phone: '',
    email: '',
    importance: 3 as 1 | 2 | 3 | 4 | 5,
    notes: '',
  });

  const [newInteraction, setNewInteraction] = useState({
    contactId: '',
    type: 'call' as const,
    notes: '',
    duration: '',
  });

  const toggleSidebar = () => {
    const newValue = !isSidebarOpen;
    setIsSidebarOpen(newValue);
    localStorage.setItem('relationships-sidebar-open', JSON.stringify(newValue));
  };

  // Relationships-related goals
  const relationshipGoals = useMemo(() => 
    goals.filter(g => g.area === 'relationships' && !g.deletedAt),
    [goals]
  );

  // Relationship score
  const relationshipScore = lifeWheelScores['relationships'] || 5;

  // Stats
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const needsAttention = contacts.filter(c => {
      if (!c.lastContact) return true;
      const days = differenceInDays(new Date(), parseISO(c.lastContact));
      return (c.importance >= 4 && days > 7) || (c.importance >= 2 && days > 30);
    }).length;
    
    const thisMonthInteractions = interactions.filter(i => {
      const date = parseISO(i.date);
      return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
    }).length;
    
    return { totalContacts, needsAttention, thisMonthInteractions };
  }, [contacts, interactions]);

  // Contacts needing attention
  const contactsNeedingAttention = useMemo(() => {
    return contacts.filter(c => {
      if (!c.lastContact) return true;
      const days = differenceInDays(new Date(), parseISO(c.lastContact));
      return (c.importance >= 4 && days > 7) || (c.importance >= 2 && days > 30);
    }).sort((a, b) => b.importance - a.importance);
  }, [contacts]);

  const handleAddContact = async () => {
    if (!newContact.name) return;
    
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: newContact.name,
      relationship: newContact.relationship,
      phone: newContact.phone || undefined,
      email: newContact.email || undefined,
      importance: newContact.importance,
      notes: newContact.notes || undefined,
      createdAt: new Date().toISOString(),
    };
    
    // Add to store immediately for optimistic update
    addRelationshipContact(contact);
    
    // Sync to database
    const success = await saveContact(contact);
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success('Đã thêm liên hệ!');
    }
    
    setNewContact({ name: '', relationship: 'friend', phone: '', email: '', importance: 3, notes: '' });
    setIsAddContactOpen(false);
  };

  const handleAddInteraction = async () => {
    if (!newInteraction.contactId) return;
    
    const interaction: Interaction = {
      id: crypto.randomUUID(),
      contactId: newInteraction.contactId,
      type: newInteraction.type,
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: newInteraction.notes || undefined,
      duration: newInteraction.duration ? parseInt(newInteraction.duration) : undefined,
    };
    
    // Add to store immediately for optimistic update
    addRelationshipInteraction(interaction);
    
    // Update last contact in store
    const contact = contacts.find(c => c.id === newInteraction.contactId);
    if (contact) {
      updateRelationshipContact(newInteraction.contactId, { lastContact: format(new Date(), 'yyyy-MM-dd') });
    }
    
    // Sync to database (saveInteraction will also update last_contact)
    const success = await saveInteraction(interaction);
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success('Đã ghi nhận tương tác!');
    }
    
    setNewInteraction({ contactId: '', type: 'call', notes: '', duration: '' });
    setIsAddInteractionOpen(false);
  };

  const getRelationshipType = (type: string) => RELATIONSHIP_TYPES.find(r => r.id === type);
  const getInteractionType = (type: string) => INTERACTION_TYPES.find(i => i.id === type);

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone || '',
      email: contact.email || '',
      importance: contact.importance,
      notes: contact.notes || '',
    });
    setIsEditContactOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !newContact.name) return;
    
    const updates: Partial<Contact> = {
      name: newContact.name,
      relationship: newContact.relationship,
      phone: newContact.phone || undefined,
      email: newContact.email || undefined,
      importance: newContact.importance,
      notes: newContact.notes || undefined,
    };
    
    // Update store immediately for optimistic update
    updateRelationshipContact(editingContact.id, updates);
    
    // Sync to database
    const success = await syncUpdateContact(editingContact.id, updates);
    if (!success) {
      toast.error('Không thể cập nhật vào database');
    } else {
      toast.success('Đã cập nhật liên hệ!');
    }
    
    setNewContact({ name: '', relationship: 'friend', phone: '', email: '', importance: 3, notes: '' });
    setEditingContact(null);
    setIsEditContactOpen(false);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa liên hệ này?')) return;
    
    // Delete from store immediately for optimistic update
    deleteRelationshipContact(id);
    
    // Sync to database
    const success = await syncDeleteContact(id);
    if (!success) {
      toast.error('Không thể xóa khỏi database');
    } else {
      toast.success('Đã xóa liên hệ!');
    }
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setNewInteraction({
      contactId: interaction.contactId,
      type: interaction.type,
      notes: interaction.notes || '',
      duration: interaction.duration?.toString() || '',
    });
    setIsEditInteractionOpen(true);
  };

  const handleUpdateInteraction = async () => {
    if (!editingInteraction || !newInteraction.contactId) return;
    
    const updates: Partial<Interaction> = {
      type: newInteraction.type,
      notes: newInteraction.notes || undefined,
      duration: newInteraction.duration ? parseInt(newInteraction.duration) : undefined,
    };
    
    // Update store immediately for optimistic update
    updateRelationshipInteraction(editingInteraction.id, updates);
    
    // Sync to database
    const success = await syncUpdateInteraction(editingInteraction.id, updates);
    if (!success) {
      toast.error('Không thể cập nhật vào database');
    } else {
      toast.success('Đã cập nhật tương tác!');
    }
    
    setNewInteraction({ contactId: '', type: 'call', notes: '', duration: '' });
    setEditingInteraction(null);
    setIsEditInteractionOpen(false);
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tương tác này?')) return;
    
    // Delete from store immediately for optimistic update
    deleteRelationshipInteraction(id);
    
    // Sync to database
    const success = await syncDeleteInteraction(id);
    if (!success) {
      toast.error('Không thể xóa khỏi database');
    } else {
      toast.success('Đã xóa tương tác!');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-rose-500" />
            Quan hệ
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý và nuôi dưỡng các mối quan hệ</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isAddInteractionOpen} onOpenChange={setIsAddInteractionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Ghi tương tác</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ghi nhận tương tác</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Người liên hệ</Label>
                  <Select 
                    value={newInteraction.contactId} 
                    onValueChange={(v) => setNewInteraction(prev => ({ ...prev, contactId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn người liên hệ" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loại tương tác</Label>
                  <Select 
                    value={newInteraction.type} 
                    onValueChange={(v: any) => setNewInteraction(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thời lượng (phút)</Label>
                  <Input
                    type="number"
                    placeholder="VD: 30"
                    value={newInteraction.duration}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea
                    placeholder="Nội dung trao đổi..."
                    value={newInteraction.notes}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleAddInteraction}>Lưu</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm liên hệ</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm liên hệ mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tên</Label>
                  <Input
                    placeholder="Tên người liên hệ"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mối quan hệ</Label>
                  <Select 
                    value={newContact.relationship} 
                    onValueChange={(v: any) => setNewContact(prev => ({ ...prev, relationship: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      placeholder="0901234567"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      placeholder="email@example.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mức độ quan trọng</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Button
                        key={i}
                        type="button"
                        variant={newContact.importance >= i ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setNewContact(prev => ({ ...prev, importance: i as any }))}
                      >
                        <Star className={cn("w-4 h-4", newContact.importance >= i && "fill-current")} />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea
                    placeholder="Ghi chú về người này..."
                    value={newContact.notes}
                    onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleAddContact}>Thêm liên hệ</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa liên hệ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tên</Label>
                  <Input
                    placeholder="Tên người liên hệ"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mối quan hệ</Label>
                  <Select 
                    value={newContact.relationship} 
                    onValueChange={(v: any) => setNewContact(prev => ({ ...prev, relationship: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      placeholder="0901234567"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      placeholder="email@example.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mức độ quan trọng</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Button
                        key={i}
                        type="button"
                        variant={newContact.importance >= i ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setNewContact(prev => ({ ...prev, importance: i as any }))}
                      >
                        <Star className={cn("w-4 h-4", newContact.importance >= i && "fill-current")} />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea
                    placeholder="Ghi chú về người này..."
                    value={newContact.notes}
                    onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleUpdateContact}>Cập nhật liên hệ</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditInteractionOpen} onOpenChange={setIsEditInteractionOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa tương tác</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Người liên hệ</Label>
                  <Select 
                    value={newInteraction.contactId} 
                    onValueChange={(v) => setNewInteraction(prev => ({ ...prev, contactId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn người liên hệ" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loại tương tác</Label>
                  <Select 
                    value={newInteraction.type} 
                    onValueChange={(v: any) => setNewInteraction(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thời lượng (phút)</Label>
                  <Input
                    type="number"
                    placeholder="VD: 30"
                    value={newInteraction.duration}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea
                    placeholder="Nội dung trao đổi..."
                    value={newInteraction.notes}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleUpdateInteraction}>Cập nhật</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 px-2 gap-1 hidden xl:flex"
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Relationship Score */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Điểm quan hệ</h3>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {relationshipScore}/10
                </Badge>
              </div>
              <Progress value={relationshipScore * 10} className="h-3" />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Liên hệ</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalContacts}</p>
                <p className="text-xs text-muted-foreground">người</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Cần liên lạc</span>
                </div>
                <p className="text-2xl font-bold">{stats.needsAttention}</p>
                <p className="text-xs text-muted-foreground">người</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Tháng này</span>
                </div>
                <p className="text-2xl font-bold">{stats.thisMonthInteractions}</p>
                <p className="text-xs text-muted-foreground">tương tác</p>
              </CardContent>
            </Card>
          </div>

          {/* Needs Attention Alert */}
          {contactsNeedingAttention.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                  Cần liên lạc sớm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contactsNeedingAttention.slice(0, 5).map(contact => {
                    const relType = getRelationshipType(contact.relationship);
                    const daysAgo = contact.lastContact 
                      ? differenceInDays(new Date(), parseISO(contact.lastContact))
                      : null;
                    
                    return (
                      <Badge key={contact.id} variant="outline" className="gap-1 py-1.5">
                        <span>{relType?.icon}</span>
                        <span>{contact.name}</span>
                        {daysAgo !== null && (
                          <span className="text-muted-foreground">({daysAgo} ngày)</span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contacts">Liên hệ</TabsTrigger>
              <TabsTrigger value="interactions">Tương tác</TabsTrigger>
              <TabsTrigger value="linked">Liên kết</TabsTrigger>
              <TabsTrigger value="goals">Mục tiêu</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Danh bạ ({contacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contacts.map(contact => {
                      const relType = getRelationshipType(contact.relationship);
                      const daysAgo = contact.lastContact 
                        ? differenceInDays(new Date(), parseISO(contact.lastContact))
                        : null;
                      
                      return (
                        <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={relType?.color}>
                                {contact.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {contact.name}
                                <span className="text-sm">{relType?.icon}</span>
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {contact.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {contact.phone}
                                  </span>
                                )}
                                {contact.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {contact.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-0.5 justify-end mb-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <Star 
                                    key={i} 
                                    className={cn(
                                      "w-3 h-3", 
                                      i <= contact.importance ? "text-yellow-500 fill-yellow-500" : "text-muted"
                                    )} 
                                  />
                                ))}
                              </div>
                              {daysAgo !== null && (
                                <p className="text-xs text-muted-foreground">
                                  {daysAgo === 0 ? 'Hôm nay' : `${daysAgo} ngày trước`}
                                </p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteContact(contact.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Lịch sử tương tác
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {interactions.slice().reverse().map(interaction => {
                      const contact = contacts.find(c => c.id === interaction.contactId);
                      const intType = getInteractionType(interaction.type);
                      
                      return (
                        <div key={interaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{intType?.icon}</span>
                            <div>
                              <p className="font-medium">{contact?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {intType?.name} • {format(parseISO(interaction.date), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {interaction.duration && (
                              <Badge variant="secondary">
                                {interaction.duration} phút
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditInteraction(interaction)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteInteraction(interaction.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linked" className="space-y-4">
              <AreaDashboardSection area="relationships" />
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Mục tiêu quan hệ ({relationshipGoals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {relationshipGoals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Chưa có mục tiêu quan hệ nào. Tạo mục tiêu mới trong module Goals!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {relationshipGoals.map(goal => (
                        <div key={goal.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{goal.title}</p>
                            <Badge variant={goal.status === 'active' ? "default" : "secondary"}>
                              {goal.progress}%
                            </Badge>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "hidden lg:block transition-all duration-300",
          isSidebarOpen ? "w-80" : "w-0"
        )}>
          {isSidebarOpen && (
            <div className="space-y-4 sticky top-4">
              {/* Needs Attention */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Cần liên lạc
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contactsNeedingAttention.slice(0, 5).map(contact => {
                    const relType = getRelationshipType(contact.relationship);
                    const daysAgo = contact.lastContact 
                      ? differenceInDays(new Date(), parseISO(contact.lastContact))
                      : null;
                    return (
                      <div key={contact.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs">
                        <span className="flex items-center gap-1">
                          <span>{relType?.icon}</span>
                          {contact.name}
                        </span>
                        {daysAgo !== null && (
                          <span className="text-muted-foreground">{daysAgo} ngày</span>
                        )}
                      </div>
                    );
                  })}
                  {contactsNeedingAttention.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Không có ai cần liên lạc
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* By Relationship Type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Theo loại quan hệ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {RELATIONSHIP_TYPES.map(type => {
                    const count = contacts.filter(c => c.relationship === type.id).length;
                    return (
                      <div key={type.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.name}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Relationship Tips */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Mẹo quan hệ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {RELATIONSHIP_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <span>{tip.icon}</span>
                      <span className="text-muted-foreground">{tip.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Relationship Goals */}
              {relationshipGoals.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Mục tiêu quan hệ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {relationshipGoals.slice(0, 3).map(goal => (
                      <div key={goal.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{goal.title}</span>
                          <span className="text-muted-foreground">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-1" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border shadow-sm"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
