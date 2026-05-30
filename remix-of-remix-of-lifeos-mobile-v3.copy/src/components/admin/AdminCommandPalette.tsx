import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard, Users, Building2, CreditCard, Sparkles, Target, BookOpen,
  CheckSquare, FileText, CalendarCheck, Palette, Languages, Bot, MessageSquare,
  BarChart3, ScrollText, Flag, Settings, Mail, History, Database, Cloud, Key,
  ArrowLeft, Shield, Search, Globe,
} from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, group: 'Navigate', keywords: 'home overview' },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3, group: 'Navigate', keywords: 'stats charts' },
  { title: 'Users', href: '/admin/users', icon: Users, group: 'Navigate', keywords: 'profiles accounts' },
  { title: 'Workspaces', href: '/admin/workspaces', icon: Building2, group: 'Navigate', keywords: 'organizations' },
  { title: 'Plans', href: '/admin/plans', icon: CreditCard, group: 'Navigate', keywords: 'subscription pricing' },
  { title: 'Features / Plugins', href: '/admin/features', icon: Sparkles, group: 'Navigate', keywords: 'plugins modules' },
  { title: 'Goal Templates', href: '/admin/templates/goals', icon: Target, group: 'Templates', keywords: '' },
  { title: 'Habit Templates', href: '/admin/templates/habits', icon: BookOpen, group: 'Templates', keywords: '' },
  { title: 'Task Templates', href: '/admin/templates/tasks', icon: CheckSquare, group: 'Templates', keywords: '' },
  { title: 'Journal Templates', href: '/admin/templates/journal', icon: FileText, group: 'Templates', keywords: '' },
  { title: 'Review Templates', href: '/admin/templates/review', icon: CalendarCheck, group: 'Templates', keywords: '' },
  { title: 'Themes', href: '/admin/themes', icon: Palette, group: 'Customization', keywords: 'colors appearance' },
  { title: 'Languages', href: '/admin/languages', icon: Languages, group: 'Customization', keywords: 'locale i18n' },
  { title: 'AI Providers', href: '/admin/ai/providers', icon: Globe, group: 'AI', keywords: 'provider openai gemini claude anthropic ollama groq' },
  { title: 'AI Models', href: '/admin/ai/models', icon: Bot, group: 'AI', keywords: 'llm gpt gemini' },
  { title: 'AI Prompts', href: '/admin/ai/prompts', icon: MessageSquare, group: 'AI', keywords: 'system prompt template' },
  { title: 'API Keys', href: '/admin/api-keys', icon: Key, group: 'AI', keywords: 'tokens secrets' },
  { title: 'System Logs', href: '/admin/logs', icon: ScrollText, group: 'System', keywords: 'errors warnings' },
  { title: 'Runtime Flags', href: '/admin/flags', icon: Flag, group: 'System', keywords: 'feature toggle' },
  { title: 'Email Templates', href: '/admin/email-templates', icon: Mail, group: 'System', keywords: '' },
  { title: 'Email Logs', href: '/admin/email-logs', icon: History, group: 'System', keywords: '' },
  { title: 'Data Management', href: '/admin/data', icon: Database, group: 'System', keywords: 'export import backup' },
  { title: 'Google Drive Backup', href: '/admin/backup', icon: Cloud, group: 'System', keywords: '' },
  { title: 'Settings', href: '/admin/settings', icon: Settings, group: 'System', keywords: 'config configuration' },
];

const QUICK_ACTIONS = [
  { title: 'Back to App', action: 'navigate', href: '/', icon: ArrowLeft },
  { title: 'Go to Settings → General', action: 'navigate', href: '/admin/settings', icon: Settings },
  { title: 'Go to Settings → Telegram', action: 'navigate', href: '/admin/settings', icon: MessageSquare },
];

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const navigate = useNavigate();

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  // Group items
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Tìm trang, cài đặt, hành động..." />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {QUICK_ACTIONS.map((action) => (
            <CommandItem
              key={action.title}
              onSelect={() => handleSelect(action.href)}
              className="gap-3"
            >
              <action.icon className="w-4 h-4 text-muted-foreground" />
              <span>{action.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {Object.entries(groups).map(([groupName, items]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.title} ${item.keywords}`}
                onSelect={() => handleSelect(item.href)}
                className="gap-3"
              >
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
