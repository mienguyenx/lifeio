import { useState } from 'react';
import { Download, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { IconButton, Page, PageHeader, SegmentedTabs, Surface } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCoach } from './hooks/useCoach';
import { ChatHistory } from './components/ChatHistory';
import { ChatThread } from './components/ChatThread';
import { Composer } from './components/Composer';
import { CoachHome } from './components/CoachHome';
import { ContextPanel } from './components/ContextPanel';

type MobileTab = 'chat' | 'history' | 'context';
const FOLLOW_UPS = ['Tạo kế hoạch cho tôi', 'Cho tôi ví dụ cụ thể', 'Tóm tắt ngắn gọn hơn'];

export default function AICoachPage() {
  const isMobile = useIsMobile();
  const api = useCoach();
  const { messages, loading } = api;
  const [tab, setTab] = useState<MobileTab>('chat');
  const [saveOpen, setSaveOpen] = useState<null | 'save' | 'save-new'>(null);
  const [title, setTitle] = useState('');
  const [askNew, setAskNew] = useState(false);
  const [askClear, setAskClear] = useState(false);
  const initials = (api.user.name || 'B').trim().split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase();
  const firstQ = messages.find((m) => m.role === 'user')?.content.slice(0, 60) ?? '';

  const send = (t: string) => { setTab('chat'); api.send(t); };
  const openSave = (mode: 'save' | 'save-new') => { setTitle(firstQ); setSaveOpen(mode); };
  const doSave = () => { if (!title.trim()) return; api.save(title.trim()); if (saveOpen === 'save-new') api.clear(); setSaveOpen(null); };
  const newChat = () => { if (messages.length) setAskNew(true); setTab('chat'); };

  const chat = (
    <Surface className="flex flex-col min-h-0 h-full overflow-hidden">
      {messages.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
          <p className="text-[14px] font-bold truncate">{firstQ || 'Cuộc trò chuyện'}</p>
          <div className="flex gap-1.5 shrink-0">
            <IconButton label="Lưu cuộc trò chuyện" onClick={() => openSave('save')} className="h-9 w-9"><Save className="h-4 w-4" /></IconButton>
            <IconButton label="Xuất PDF" onClick={api.exportPdf} className="h-9 w-9"><Download className="h-4 w-4" /></IconButton>
            <IconButton label="Xóa lịch sử chat" onClick={() => setAskClear(true)} className="h-9 w-9"><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {messages.length === 0
          ? <CoachHome name={api.user.name} hasProfile={api.hasProfile} onPrompt={send} compact={isMobile} />
          : <ChatThread messages={messages} loading={loading} initials={initials} onFavorite={api.toggleFavorite} onNote={api.toNote} />}
      </div>
      <Composer className="p-3 pt-1" onSend={send} disabled={loading} chips={messages.length && !loading ? FOLLOW_UPS : undefined} />
    </Surface>
  );
  const history = <ChatHistory saved={api.saved} onNew={newChat} onLoad={(id) => { api.load(id); setTab('chat'); }} onDelete={api.removeSaved} className="h-full" />;

  return (
    <Page className={isMobile ? 'pb-24' : undefined}>
      <PageHeader title="AI Coach" subtitle="Người bạn đồng hành AI cho cuộc sống tốt đẹp hơn"
        actions={!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={newChat}><Plus className="h-4 w-4 mr-1.5" />Trò chuyện mới</Button>} />
      {isMobile ? (
        <>
          <SegmentedTabs full className="mb-3" value={tab} onChange={setTab} items={[{ id: 'chat', label: 'Trò chuyện' }, { id: 'history', label: 'Lịch sử', count: api.saved.length }, { id: 'context', label: 'Bối cảnh' }]} />
          <div className="h-[calc(100dvh-245px)] min-h-[420px]">
            {tab === 'chat' && chat}
            {tab === 'history' && <Surface className="p-3 h-full">{history}</Surface>}
            {tab === 'context' && <div className="h-full overflow-y-auto"><ContextPanel api={api} onPrompt={send} /></div>}
          </div>
        </>
      ) : (
        <div className="grid gap-4 grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)_310px] h-[calc(100vh-150px)] min-h-[560px]">
          <Surface className="p-3.5 min-h-0">{history}</Surface>
          {chat}
          <aside className="hidden xl:block overflow-y-auto min-h-0"><ContextPanel api={api} onPrompt={send} /></aside>
        </div>
      )}

      <AdaptiveModal open={!!saveOpen} onOpenChange={(o) => !o && setSaveOpen(null)} title="Lưu cuộc trò chuyện">
        <div className="space-y-3 min-w-0">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSave()} placeholder="Tên cuộc trò chuyện..."
            className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[14px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
          <Button className="w-full h-11 rounded-full" disabled={!title.trim()} onClick={doSave}><Save className="h-4 w-4 mr-2" />Lưu</Button>
        </div>
      </AdaptiveModal>
      <AlertDialog open={askNew} onOpenChange={setAskNew}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bắt đầu cuộc trò chuyện mới?</AlertDialogTitle>
            <AlertDialogDescription>Bạn có muốn lưu cuộc trò chuyện hiện tại vào lịch sử trước không?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => api.clear()}>Không lưu</AlertDialogCancel>
            <AlertDialogAction onClick={() => openSave('save-new')}>Lưu & tạo mới</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={askClear} onOpenChange={setAskClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa lịch sử chat hiện tại?</AlertDialogTitle>
            <AlertDialogDescription>Các tin nhắn chưa lưu sẽ bị xóa. Cuộc trò chuyện đã lưu không bị ảnh hưởng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => api.clear()}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
