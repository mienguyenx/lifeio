import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { cn } from '@/lib/utils';
import { ACCOUNT_ITEMS, NAV_GROUPS, QUICK_ACTIONS, type NavItem } from './navigationConfig';

/**
 * Module 18 — Bảng lệnh (Ctrl/⌘ + K): đi tới mọi trang và Thêm nhanh.
 * Chỉ điều hướng & mở form sẵn có (`?add`), không tìm kiếm nội dung dữ liệu.
 */
export function CommandPalette({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const startPomodoro = usePomodoroStore((s) => s.start);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => { setOpen(false); navigate(path); };
  const altKey = (path: string) => SHORTCUTS.find((s) => s.path === path)?.key;
  const NavRow = ({ item }: { item: NavItem }) => (
    <CommandItem value={`${item.label} ${item.keywords ?? ''} ${item.path}`} onSelect={() => go(item.path)} className="gap-3 rounded-xl">
      <LifeIcon name={item.icon} size={20} variant="duotone" />
      <span>{item.label}</span>
      {altKey(item.path) && <CommandShortcut>Alt+{altKey(item.path)}</CommandShortcut>}
    </CommandItem>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn('h-10 w-full max-w-[360px] rounded-full bg-secondary/60 hover:bg-secondary border border-border/60 px-3.5 flex items-center gap-2 text-[13px] text-muted-foreground transition-colors', className)}>
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left truncate">Tìm trang, thêm nhanh…</span>
        <kbd className="hidden lg:inline-flex h-6 items-center rounded-md border border-border bg-card px-1.5 font-mono text-[11px]">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Tìm trang hoặc hành động…" />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
          <CommandGroup heading="Thêm nhanh">
            {QUICK_ACTIONS.map((a) => (
              <CommandItem key={a.id} value={`thêm tạo ${a.label} add`} className="gap-3 rounded-xl"
                onSelect={() => { if (a.pomodoro) { setOpen(false); startPomodoro(); toast.success('Đã bắt đầu phiên Pomodoro'); } else if (a.path) go(a.path); }}>
                <LifeIcon name={a.icon} size={20} variant="duotone" />
                <span>{a.pomodoro ? 'Bắt đầu Pomodoro' : `Tạo ${a.label.toLowerCase()}`}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          {NAV_GROUPS.map((g) => (
            <CommandGroup key={g.id} heading={g.label}>{g.items.map((i) => <NavRow key={i.path} item={i} />)}</CommandGroup>
          ))}
          <CommandGroup heading="Tài khoản">{ACCOUNT_ITEMS.map((i) => <NavRow key={i.path} item={i} />)}</CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
