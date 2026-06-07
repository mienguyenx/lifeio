import { useMemo } from 'react';
import { Bot, Brain, Zap, Sparkles, Cloud, Server, Globe, Cpu } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAIModels, useAIProviders } from '@/hooks/useAdminData';
import type { AIModel } from '@/hooks/useAdminData';
import type { AdminAIProvider } from '@/types/admin';

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  'openrouter': Globe,
  'openai-compatible': Brain,
  'gemini': Zap,
  'anthropic-compatible': Sparkles,
  'perplexity': Cloud,
  'ollama': Server,
  'groq': Zap,
  'together': Globe,
  'deepseek': Bot,
  'mistral': Bot,
  'xai': Bot,
};

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showOnlyActive?: boolean;
  filterCapabilities?: string[];
  className?: string;
  description?: string;
}

export function ModelSelector({
  value,
  onChange,
  placeholder = 'Chọn model...',
  showOnlyActive = true,
  filterCapabilities,
  className,
  description,
}: ModelSelectorProps) {
  const { data: models } = useAIModels();
  const { data: providers } = useAIProviders();

  // Group models by provider
  const groupedModels = useMemo(() => {
    if (!models) return {};

    let filtered = showOnlyActive ? models.filter((m) => m.is_active) : models;

    if (filterCapabilities && filterCapabilities.length > 0) {
      filtered = filtered.filter((m) =>
        filterCapabilities.some((cap) => m.capabilities?.includes(cap))
      );
    }

    const groups: Record<string, { provider: AdminAIProvider | null; models: AIModel[] }> = {};

    filtered.forEach((model) => {
      const slug = model.provider;
      if (!groups[slug]) {
        const providerData = providers?.find((p) => p.slug === slug) || null;
        groups[slug] = { provider: providerData, models: [] };
      }
      groups[slug].models.push(model);
    });

    // Sort: providers with default model first, then by sort_order
    return Object.entries(groups).sort(([, a], [, b]) => {
      const aHasDefault = a.models.some((m) => m.is_default);
      const bHasDefault = b.models.some((m) => m.is_default);
      if (aHasDefault && !bHasDefault) return -1;
      if (!aHasDefault && bHasDefault) return 1;
      const aOrder = a.provider?.sort_order ?? 99;
      const bOrder = b.provider?.sort_order ?? 99;
      return aOrder - bOrder;
    });
  }, [models, providers, showOnlyActive, filterCapabilities]);

  const totalCount = groupedModels.reduce((acc, [, g]) => acc + g.models.length, 0);

  if (!models || totalCount === 0) {
    return (
      <div className={className}>
        <Select disabled value="">
          <SelectTrigger>
            <SelectValue placeholder="Chưa có model — vào AI Providers để thêm" />
          </SelectTrigger>
        </Select>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {groupedModels.map(([slug, { provider, models: groupModels }]) => {
            const Icon = PROVIDER_ICONS[slug] || Cpu;
            const providerName = provider?.name || slug;
            const color = provider?.color;

            return (
              <SelectGroup key={slug}>
                <SelectLabel className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <Icon className="w-3 h-3" style={{ color: color || undefined }} />
                  {providerName}
                  <Badge variant="outline" className="text-[9px] py-0 px-1 ml-auto">{groupModels.length}</Badge>
                </SelectLabel>
                {groupModels.map((model) => (
                  <SelectItem key={model.id} value={model.model_id} className="pl-6">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{model.name}</span>
                      {model.is_default && (
                        <Badge variant="default" className="text-[9px] py-0 px-1 shrink-0">Default</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
