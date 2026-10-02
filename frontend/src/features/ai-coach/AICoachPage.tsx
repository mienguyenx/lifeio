import { useState } from 'react';
import { AudioLines, Download, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { HeroBanner, IconButton, Page, PageHeader, SegmentedTabs, Surface, TINTS } from '@/components/lio';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { cn } from '@/lib/utils';
import { QUICK_ACTIONS } from './utils/coach.utils';
import { CoachInsights } from './components/CoachInsights';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCoach } from './hooks/useCoach';
import { ChatHistory } from './components/ChatHistory';
import { ChatThread } from './components/ChatThread';
import { Composer } from './components/Composer';
import { CoachHome } from './components/CoachHome';
import { ContextPanel } from './components/ContextPanel';
import { openVoiceChat } from './components/GlobalVoiceChat';
import { PromptLibrarySheet } from './prompts/PromptLibrarySheet';

type Tab = 'chat' | 'history' | 'insights';
const FOLLOW_UPS = ['Tạo kế hoạch cho tôi', 'Cho tôi ví dụ cụ thể', 'Tóm tắt ngắn gọn hơn'];

export default function AICoachPage() {
  const isMobile = useIsMobile();
  const api = useCoach();
  const { messages, loading } = api;
  const [tab, setTab] = useState<Tab>('chat');
  const [saveOpen, setSaveOpen] = useState<null | 'save' | 'save-new'>(null);
  const [title, setTitle] = useState('');
  const [askNew, setAskNew] = useState(false);
  const [askClear, setAskClear] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [insert, setInsert] = useState<{ text: string; n: number } | null>(null);
  const initials = (api.user.name || 'B').trim().split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase();
  const firstQ = messages.find((m) => m.role === 'user')?.content.slice(0, 60) ?? '';

  const send = (t: string, opts?: { voice?: boolean }) => { setTab('chat'); void api.send(t, opts); };
  const actionHandlers = { onConfirm: (id: string) => void api.confirmAction(id), onDismiss: api.dismissAction, onConfirmAll: (ids: string[]) => void api.confirmAll(ids) };
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
          ? <CoachHome name={api.user.name} hasProfile={api.hasProfile} onPrompt={send} onLibrary={() => setLibOpen(true)} compact={isMobile} hero={isMobile} />
          : <ChatThread messages={messages} loading={loading} initials={initials} onFavorite={api.toggleFavorite} onNote={api.toNote} actions={actionHandlers} />}
      </div>
      <Composer className="p-3 pt-1" onSend={send} onVoiceChat={() => openVoiceChat()} onLibrary={() => setLibOpen(true)} insert={insert} disabled={loading} chips={messages.length && !loading ? FOLLOW_UPS : undefined} />
    </Surface>
  );
  const history = <ChatHistory saved={api.saved} onNew={newChat} onLoad={(id) => { api.load(id); setTab('chat'); }} onDelete={api.removeSaved} className="h-full" />;

  return (
    <Page className={isMobile ? 'pb-24' : undefined}>
      <PageHeader title="AI Coach" subtitle="Người bạn đồng hành AI cho cuộc sống tốt đẹp hơn"
        actions={isMobile
          ? <Button size="icon" className="h-10 w-10 rounded-full shadow-soft" aria-label="Voice Chat" onClick={() => openVoiceChat()}><AudioLines className="h-[18px] w-[18px]" /></Button>
          : undefined} />
      <SegmentedTabs full={isMobile} className="mb-5" value={tab} onChange={setTab} items={[{ id: 'chat', label: 'Trò chuyện' }, { id: 'history', label: 'Lịch sử', count: api.saved.length }, { id: 'insights', label: 'Phân tích' }]} />
      {tab === 'chat' && (isMobile ? (
        <div className="h-[calc(100dvh-245px)] min-h-[420px]">{chat}</div>
      ) : (
        <div className="space-y-4">
          <HeroBanner mascot="ori" pose="idea" title={<>Xin chào{api.user.name ? `, ${api.user.name}` : ''}! 👋</>}
            subtitle={api.hasProfile ? 'Hôm nay bạn muốn tập trung vào điều gì? Hãy trò chuyện — hoặc nói “nhắc tôi…”, “tạo thói quen…” để mình làm giúp!' : 'Thiết lập Vision & Values trong trang “Me” để nhận tư vấn cá nhân hóa hơn.'}
            action={<div className="flex flex-wrap gap-2">
              <Button className="h-10 rounded-full px-5 shadow-soft" onClick={newChat}><Plus className="h-4 w-4 mr-1.5" />Trò chuyện mới</Button>
              <Button variant="outline" className="h-10 rounded-full px-5 bg-card/80" onClick={() => openVoiceChat()}><AudioLines className="h-4 w-4 mr-1.5" />Voice Chat</Button>
            </div>}
            aside={<div className="hidden 2xl:block max-w-[220px] rounded-[20px] bg-card/80 px-4 py-3 text-[13px] italic text-muted-foreground shadow-soft">“Những thay đổi nhỏ hôm nay sẽ tạo nên cuộc sống tuyệt vời hơn ngày mai!” 💜</div>} />
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.title} onClick={() => send(a.prompt)} disabled={loading} className="flex-1 min-w-[170px] flex items-center gap-2.5 rounded-[18px] bg-card border border-border/60 shadow-soft px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-card disabled:opacity-60">
                <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', TINTS[a.tint].bg)}><LifeIcon name={a.icon} size={20} variant="duotone" /></span>
                <span className="text-[13px] font-semibold truncate">{a.title}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)_310px] h-[620px]">
            <Surface className="p-3.5 min-h-0">{history}</Surface>
            {chat}
            <aside className="hidden xl:block overflow-y-auto min-h-0"><ContextPanel api={api} onPrompt={send} /></aside>
          </div>
        </div>
      ))}
      {tab === 'history' && <Surface className={cn('p-3.5', isMobile ? 'h-[calc(100dvh-245px)] min-h-[420px]' : 'h-[620px] max-w-[760px]')}>{history}</Surface>}
      {tab === 'insights' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className="space-y-4 min-w-0">
            <CoachInsights api={api} onPrompt={send} />
            {isMobile && <ContextPanel api={api} onPrompt={send} suggestions={false} />}
          </div>
          {!isMobile && <aside className="hidden xl:block sticky top-4"><ContextPanel api={api} onPrompt={send} suggestions={false} /></aside>}
        </div>
      )}

      <PromptLibrarySheet open={libOpen} onOpenChange={setLibOpen} onSend={(t) => send(t)} onInsert={(t) => { setTab('chat'); setInsert((s) => ({ text: t, n: (s?.n ?? 0) + 1 })); }} />
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
