import { useState } from 'react';
import { Palette, Star, Plus, Trash2, Eye, Edit, Sparkles, Wand2, Sun, Moon, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAdminThemes, useUpdateTheme, useCreateTheme, useDeleteTheme, AdminTheme } from '@/hooks/useAdminData';
import type { Json } from '@/integrations/supabase/types';

// Full color structure matching index.css
interface ThemeModeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Life Areas
  areaHealth: string;
  areaRelationships: string;
  areaCareer: string;
  areaFinance: string;
  areaPersonal: string;
  areaFun: string;
  areaEnvironment: string;
  areaSpirituality: string;
  areaLearning: string;
  areaContribution: string;
  // Status
  success: string;
  warning: string;
  info: string;
  streak: string;
}

interface ThemeColors {
  light: ThemeModeColors;
  dark: ThemeModeColors;
  fonts?: {
    heading?: string;
    body?: string;
  };
  radius?: string;
}

const DEFAULT_LIGHT: ThemeModeColors = {
  background: '220 20% 97%',
  foreground: '220 30% 10%',
  card: '0 0% 100%',
  cardForeground: '220 30% 10%',
  popover: '0 0% 100%',
  popoverForeground: '220 30% 10%',
  primary: '250 95% 60%',
  primaryForeground: '0 0% 100%',
  secondary: '220 15% 92%',
  secondaryForeground: '220 30% 20%',
  muted: '220 15% 92%',
  mutedForeground: '220 10% 50%',
  accent: '170 80% 45%',
  accentForeground: '0 0% 100%',
  destructive: '0 55% 50%',
  destructiveForeground: '0 0% 100%',
  border: '220 20% 88%',
  input: '220 20% 88%',
  ring: '250 95% 60%',
  areaHealth: '0 85% 60%',
  areaRelationships: '330 85% 60%',
  areaCareer: '250 85% 60%',
  areaFinance: '45 95% 55%',
  areaPersonal: '280 75% 60%',
  areaFun: '20 95% 60%',
  areaEnvironment: '170 80% 45%',
  areaSpirituality: '200 90% 55%',
  areaLearning: '145 70% 45%',
  areaContribution: '350 85% 55%',
  success: '145 50% 40%',
  warning: '45 95% 55%',
  info: '200 90% 55%',
  streak: '25 100% 55%',
};

const DEFAULT_DARK: ThemeModeColors = {
  background: '220 25% 8%',
  foreground: '220 15% 95%',
  card: '220 25% 12%',
  cardForeground: '220 15% 95%',
  popover: '220 25% 12%',
  popoverForeground: '220 15% 95%',
  primary: '250 90% 65%',
  primaryForeground: '0 0% 100%',
  secondary: '220 20% 18%',
  secondaryForeground: '220 15% 90%',
  muted: '220 20% 18%',
  mutedForeground: '220 10% 60%',
  accent: '170 75% 50%',
  accentForeground: '0 0% 100%',
  destructive: '0 50% 45%',
  destructiveForeground: '0 0% 100%',
  border: '220 20% 20%',
  input: '220 20% 20%',
  ring: '250 90% 65%',
  areaHealth: '0 80% 55%',
  areaRelationships: '330 80% 55%',
  areaCareer: '250 80% 60%',
  areaFinance: '45 90% 50%',
  areaPersonal: '280 70% 55%',
  areaFun: '20 90% 55%',
  areaEnvironment: '170 75% 45%',
  areaSpirituality: '200 85% 55%',
  areaLearning: '145 65% 45%',
  areaContribution: '350 80% 50%',
  success: '145 45% 38%',
  warning: '45 90% 50%',
  info: '200 85% 55%',
  streak: '25 95% 55%',
};

const COLOR_GROUPS = {
  'Base Colors': ['background', 'foreground', 'card', 'cardForeground', 'popover', 'popoverForeground'],
  'Brand Colors': ['primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground'],
  'UI Colors': ['muted', 'mutedForeground', 'destructive', 'destructiveForeground', 'border', 'input', 'ring'],
  'Life Areas': ['areaHealth', 'areaRelationships', 'areaCareer', 'areaFinance', 'areaPersonal', 'areaFun', 'areaEnvironment', 'areaSpirituality', 'areaLearning', 'areaContribution'],
  'Status Colors': ['success', 'warning', 'info', 'streak'],
};

const COLOR_LABELS: Record<string, string> = {
  background: 'Background',
  foreground: 'Foreground',
  card: 'Card',
  cardForeground: 'Card Text',
  popover: 'Popover',
  popoverForeground: 'Popover Text',
  primary: 'Primary',
  primaryForeground: 'Primary Text',
  secondary: 'Secondary',
  secondaryForeground: 'Secondary Text',
  muted: 'Muted',
  mutedForeground: 'Muted Text',
  accent: 'Accent',
  accentForeground: 'Accent Text',
  destructive: 'Destructive',
  destructiveForeground: 'Destructive Text',
  border: 'Border',
  input: 'Input',
  ring: 'Ring',
  areaHealth: 'Health',
  areaRelationships: 'Relationships',
  areaCareer: 'Career',
  areaFinance: 'Finance',
  areaPersonal: 'Personal',
  areaFun: 'Fun',
  areaEnvironment: 'Environment',
  areaSpirituality: 'Spirituality',
  areaLearning: 'Learning',
  areaContribution: 'Contribution',
  success: 'Success',
  warning: 'Warning',
  info: 'Info',
  streak: 'Streak',
};

function hslToHex(hsl: string): string {
  try {
    const parts = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
    if (parts.length < 3) return '#808080';
    const [h, s, l] = parts;
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return '#808080';
  }
}

function hexToHsl(hex: string): string {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 50%';
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return '0 0% 50%';
  }
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hexValue = hslToHex(value);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-28 text-xs font-medium truncate" title={label}>{label}</div>
      <input
        type="color"
        value={hexValue}
        onChange={(e) => onChange(hexToHsl(e.target.value))}
        className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-xs h-8"
        placeholder="H S% L%"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </Button>
    </div>
  );
}

function ThemePreview({ colors, mode }: { colors: ThemeModeColors; mode: 'light' | 'dark' }) {
  const bg = `hsl(${colors.background})`;
  const fg = `hsl(${colors.foreground})`;
  const cardBg = `hsl(${colors.card})`;
  const primary = `hsl(${colors.primary})`;
  const secondary = `hsl(${colors.secondary})`;
  const accent = `hsl(${colors.accent})`;
  const destructive = `hsl(${colors.destructive})`;
  const muted = `hsl(${colors.muted})`;
  const border = `hsl(${colors.border})`;

  return (
    <div className="rounded-lg p-4 space-y-4" style={{ backgroundColor: bg, color: fg }}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {mode === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <div className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: primary, color: `hsl(${colors.primaryForeground})` }}>Primary</div>
        <div className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: secondary, color: `hsl(${colors.secondaryForeground})` }}>Secondary</div>
        <div className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: accent, color: `hsl(${colors.accentForeground})` }}>Accent</div>
        <div className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: destructive, color: `hsl(${colors.destructiveForeground})` }}>Destructive</div>
      </div>

      {/* Card */}
      <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
        <div className="text-sm font-medium">Card Title</div>
        <div className="text-xs" style={{ color: `hsl(${colors.mutedForeground})` }}>This is muted text inside a card component.</div>
        <div className="flex gap-2 pt-1">
          <div className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: muted }}>Tag</div>
        </div>
      </div>

      {/* Life Areas */}
      <div className="grid grid-cols-5 gap-1">
        {['areaHealth', 'areaRelationships', 'areaCareer', 'areaFinance', 'areaPersonal', 'areaFun', 'areaEnvironment', 'areaSpirituality', 'areaLearning', 'areaContribution'].map((key) => (
          <div
            key={key}
            className="h-6 rounded"
            style={{ backgroundColor: `hsl(${colors[key as keyof ThemeModeColors]})` }}
            title={COLOR_LABELS[key]}
          />
        ))}
      </div>

      {/* Status */}
      <div className="flex gap-2">
        <div className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: `hsl(${colors.success})` }}>Success</div>
        <div className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: `hsl(${colors.warning})` }}>Warning</div>
        <div className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: `hsl(${colors.info})` }}>Info</div>
      </div>
    </div>
  );
}

export default function AdminThemes() {
  const { data: themes, isLoading } = useAdminThemes();
  const updateTheme = useUpdateTheme();
  const createTheme = useCreateTheme();
  const deleteTheme = useDeleteTheme();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<AdminTheme | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [newTheme, setNewTheme] = useState({
    name: '',
    description: '',
    colors: { light: { ...DEFAULT_LIGHT }, dark: { ...DEFAULT_DARK }, radius: '1rem' } as ThemeColors,
  });

  const [editColors, setEditColors] = useState<ThemeColors>({ light: { ...DEFAULT_LIGHT }, dark: { ...DEFAULT_DARK } });
  const [editMode, setEditMode] = useState<'light' | 'dark'>('light');

  const handleToggle = (id: string, isActive: boolean) => {
    updateTheme.mutate({ id, is_active: !isActive });
  };

  const handleSetDefault = async (id: string) => {
    for (const t of themes || []) {
      if (t.is_default) {
        await updateTheme.mutateAsync({ id: t.id, is_default: false });
      }
    }
    updateTheme.mutate({ id, is_default: true, is_active: true });
  };

  const handleCreate = () => {
    createTheme.mutate({
      name: newTheme.name,
      description: newTheme.description,
      colors: newTheme.colors as unknown as Json,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        setNewTheme({ name: '', description: '', colors: { light: { ...DEFAULT_LIGHT }, dark: { ...DEFAULT_DARK }, radius: '1rem' } });
      }
    });
  };

  const handleUpdate = () => {
    if (!editingTheme) return;
    updateTheme.mutate({
      id: editingTheme.id,
      name: editingTheme.name,
      description: editingTheme.description || undefined,
      colors: editColors as unknown as Json,
    }, {
      onSuccess: () => setEditingTheme(null)
    });
  };

  const openEdit = (theme: AdminTheme) => {
    setEditingTheme(theme);
    const colors = theme.colors as any;
    setEditColors({
      light: { ...DEFAULT_LIGHT, ...colors?.light },
      dark: { ...DEFAULT_DARK, ...colors?.dark },
      fonts: colors?.fonts,
      radius: colors?.radius,
    });
    setEditMode('light');
  };

  const handleAIGenerate = async (type: 'palette' | 'ideas') => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-theme-suggest', {
        body: { prompt: aiPrompt, type }
      });
      if (error) throw error;
      setAiResult({ type, data });
      toast.success('AI generated suggestions');
    } catch (err: any) {
      if (err?.message?.includes('429')) {
        toast.error('Rate limit exceeded, try again later');
      } else if (err?.message?.includes('402')) {
        toast.error('AI credits required');
      } else {
        toast.error('Failed to generate');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIPalette = (palette: any) => {
    const mapColors = (src: any): ThemeModeColors => ({
      ...DEFAULT_LIGHT,
      background: src?.background || DEFAULT_LIGHT.background,
      foreground: src?.foreground || DEFAULT_LIGHT.foreground,
      card: src?.card || src?.background || DEFAULT_LIGHT.card,
      cardForeground: src?.cardForeground || src?.foreground || DEFAULT_LIGHT.cardForeground,
      popover: src?.popover || src?.card || DEFAULT_LIGHT.popover,
      popoverForeground: src?.popoverForeground || src?.cardForeground || DEFAULT_LIGHT.popoverForeground,
      primary: src?.primary || DEFAULT_LIGHT.primary,
      primaryForeground: src?.primaryForeground || DEFAULT_LIGHT.primaryForeground,
      secondary: src?.secondary || DEFAULT_LIGHT.secondary,
      secondaryForeground: src?.secondaryForeground || DEFAULT_LIGHT.secondaryForeground,
      muted: src?.muted || src?.secondary || DEFAULT_LIGHT.muted,
      mutedForeground: src?.mutedForeground || DEFAULT_LIGHT.mutedForeground,
      accent: src?.accent || DEFAULT_LIGHT.accent,
      accentForeground: src?.accentForeground || DEFAULT_LIGHT.accentForeground,
      destructive: src?.destructive || DEFAULT_LIGHT.destructive,
      destructiveForeground: src?.destructiveForeground || DEFAULT_LIGHT.destructiveForeground,
      border: src?.border || DEFAULT_LIGHT.border,
      input: src?.input || src?.border || DEFAULT_LIGHT.input,
      ring: src?.ring || src?.primary || DEFAULT_LIGHT.ring,
    });

    setNewTheme({
      name: palette.name || 'AI Generated Theme',
      description: palette.description || '',
      colors: {
        light: mapColors(palette.light),
        dark: mapColors(palette.dark),
        fonts: palette.fonts,
        radius: '1rem',
      },
    });
    setAiOpen(false);
    setCreateOpen(true);
    toast.success('Applied AI palette to new theme');
  };

  const updateModeColor = (mode: 'light' | 'dark', key: string, value: string, isEdit: boolean) => {
    if (isEdit) {
      setEditColors(prev => ({
        ...prev,
        [mode]: { ...prev[mode], [key]: value }
      }));
    } else {
      setNewTheme(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          [mode]: { ...prev.colors[mode], [key]: value }
        }
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  const renderColorEditor = (colors: ThemeColors, mode: 'light' | 'dark', isEdit: boolean) => (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {Object.entries(COLOR_GROUPS).map(([group, keys]) => (
          <div key={group}>
            <h4 className="text-sm font-semibold mb-2">{group}</h4>
            <div className="space-y-2">
              {keys.map((key) => (
                <ColorPicker
                  key={key}
                  label={COLOR_LABELS[key] || key}
                  value={colors[mode][key as keyof ThemeModeColors] || '0 0% 50%'}
                  onChange={(v) => updateModeColor(mode, key, v, isEdit)}
                />
              ))}
            </div>
            <Separator className="mt-3" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Themes</h1>
          <p className="text-muted-foreground">Manage app color themes with light/dark modes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Sparkles className="w-4 h-4 mr-2" />AI Suggest</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Theme Generator</DialogTitle>
                <DialogDescription>Describe your desired theme style and let AI generate a complete palette</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., Modern minimalist with ocean blue as primary, warm accents, professional feel..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleAIGenerate('palette')} disabled={aiLoading}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {aiLoading ? 'Generating...' : 'Generate Palette'}
                  </Button>
                  <Button variant="outline" onClick={() => handleAIGenerate('ideas')} disabled={aiLoading}>
                    Get Ideas
                  </Button>
                </div>

                {aiResult?.type === 'palette' && aiResult.data && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{aiResult.data.name}</h4>
                        <p className="text-sm text-muted-foreground">{aiResult.data.description}</p>
                      </div>
                      <Button onClick={() => applyAIPalette(aiResult.data)}>Use This</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {aiResult.data.light && (
                        <div className="space-y-2">
                          <span className="text-xs font-medium">Light Mode</span>
                          <div className="flex gap-1">
                            {['primary', 'secondary', 'accent', 'background'].map(k => (
                              <div key={k} className="w-8 h-8 rounded" style={{ backgroundColor: `hsl(${aiResult.data.light[k] || '0 0% 50%'})` }} title={k} />
                            ))}
                          </div>
                        </div>
                      )}
                      {aiResult.data.dark && (
                        <div className="space-y-2">
                          <span className="text-xs font-medium">Dark Mode</span>
                          <div className="flex gap-1">
                            {['primary', 'secondary', 'accent', 'background'].map(k => (
                              <div key={k} className="w-8 h-8 rounded" style={{ backgroundColor: `hsl(${aiResult.data.dark[k] || '0 0% 50%'})` }} title={k} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {aiResult.data.fonts && (
                      <p className="text-xs text-muted-foreground">
                        Fonts: {aiResult.data.fonts.heading} / {aiResult.data.fonts.body}
                      </p>
                    )}
                  </div>
                )}

                {aiResult?.type === 'ideas' && aiResult.data?.ideas && (
                  <div className="space-y-2">
                    {aiResult.data.ideas.map((idea: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: `hsl(${idea.primaryColor})` }} />
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: `hsl(${idea.accentColor})` }} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{idea.name}</div>
                          <div className="text-xs text-muted-foreground">{idea.description}</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setAiPrompt(idea.description)}>Use</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Theme</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Create Theme</DialogTitle>
                <DialogDescription>Define a new color theme with light and dark modes</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
                <TabsList>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="light"><Sun className="w-3 h-3 mr-1" />Light</TabsTrigger>
                  <TabsTrigger value="dark"><Moon className="w-3 h-3 mr-1" />Dark</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newTheme.name} onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })} placeholder="Theme name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newTheme.description} onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })} placeholder="Theme description" />
                  </div>
                  <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <Input value={newTheme.colors.radius || '1rem'} onChange={(e) => setNewTheme({ ...newTheme, colors: { ...newTheme.colors, radius: e.target.value } })} placeholder="1rem" />
                  </div>
                </TabsContent>
                <TabsContent value="light" className="flex-1 overflow-hidden mt-4">
                  {renderColorEditor(newTheme.colors, 'light', false)}
                </TabsContent>
                <TabsContent value="dark" className="flex-1 overflow-hidden mt-4">
                  {renderColorEditor(newTheme.colors, 'dark', false)}
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ThemePreview colors={newTheme.colors.light} mode="light" />
                    <ThemePreview colors={newTheme.colors.dark} mode="dark" />
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newTheme.name || createTheme.isPending}>
                  {createTheme.isPending ? 'Creating...' : 'Create Theme'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes?.map((theme) => {
          const colors = theme.colors as any;
          const lightColors = colors?.light || DEFAULT_LIGHT;
          return (
            <Card key={theme.id} className={theme.is_default ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="h-16 rounded-lg p-2 flex items-end" style={{ backgroundColor: `hsl(${lightColors.background || DEFAULT_LIGHT.background})` }}>
                    <div className="flex gap-1">
                      {['primary', 'secondary', 'accent'].map((c) => (
                        <div key={c} className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${lightColors[c] || DEFAULT_LIGHT[c as keyof ThemeModeColors]})` }} />
                      ))}
                    </div>
                  </div>
                  <div className="h-16 rounded-lg p-2 flex items-end" style={{ backgroundColor: `hsl(${colors?.dark?.background || DEFAULT_DARK.background})` }}>
                    <div className="flex gap-1">
                      {['primary', 'secondary', 'accent'].map((c) => (
                        <div key={c} className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${colors?.dark?.[c] || DEFAULT_DARK[c as keyof ThemeModeColors]})` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{theme.name}</h3>
                    <div className="flex items-center gap-2">
                      {theme.is_default && <Badge><Star className="w-3 h-3 mr-1" />Default</Badge>}
                      {theme.is_active && !theme.is_default && <Badge variant="outline">Active</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{theme.description || 'No description'}</p>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Preview: {theme.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <ThemePreview colors={{ ...DEFAULT_LIGHT, ...colors?.light }} mode="light" />
                          <ThemePreview colors={{ ...DEFAULT_DARK, ...colors?.dark }} mode="dark" />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="icon" onClick={() => openEdit(theme)}>
                      <Edit className="w-4 h-4" />
                    </Button>

                    {!theme.is_default && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Theme</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{theme.name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTheme.mutate(theme.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <div className="flex-1" />
                    <Switch checked={theme.is_active} onCheckedChange={() => handleToggle(theme.id, theme.is_active)} disabled={theme.is_default || updateTheme.isPending} />
                  </div>

                  {!theme.is_default && (
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleSetDefault(theme.id)} disabled={updateTheme.isPending}>
                      Set as default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTheme} onOpenChange={(open) => !open && setEditingTheme(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Theme</DialogTitle>
            <DialogDescription>Modify theme settings and colors</DialogDescription>
          </DialogHeader>
          {editingTheme && (
            <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'light' | 'dark')} className="flex-1 overflow-hidden flex flex-col">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="light"><Sun className="w-3 h-3 mr-1" />Light</TabsTrigger>
                <TabsTrigger value="dark"><Moon className="w-3 h-3 mr-1" />Dark</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editingTheme.name} onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={editingTheme.description || ''} onChange={(e) => setEditingTheme({ ...editingTheme, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Input value={editColors.radius || '1rem'} onChange={(e) => setEditColors({ ...editColors, radius: e.target.value })} />
                </div>
              </TabsContent>
              <TabsContent value="light" className="flex-1 overflow-hidden mt-4">
                {renderColorEditor(editColors, 'light', true)}
              </TabsContent>
              <TabsContent value="dark" className="flex-1 overflow-hidden mt-4">
                {renderColorEditor(editColors, 'dark', true)}
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <ThemePreview colors={editColors.light} mode="light" />
                  <ThemePreview colors={editColors.dark} mode="dark" />
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingTheme(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateTheme.isPending}>
              {updateTheme.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
