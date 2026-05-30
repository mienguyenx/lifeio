import { Bot, Brain, Zap, Cpu, Sparkles, Cloud, Server, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
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

interface ProviderCardProps {
  provider: AdminAIProvider;
  keyCount: number;
  modelCount: number;
  onSelect: (provider: AdminAIProvider) => void;
  onToggle: (provider: AdminAIProvider) => void;
}

export function ProviderCard({ provider, keyCount, modelCount, onSelect, onToggle }: ProviderCardProps) {
  const Icon = PROVIDER_ICONS[provider.slug] || Cpu;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
        provider.is_active ? 'border-border' : 'opacity-60 border-dashed',
      )}
      onClick={() => onSelect(provider)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: provider.color ? `${provider.color}15` : 'hsl(var(--primary) / 0.1)' }}
          >
            <Icon className="w-5 h-5" style={{ color: provider.color || 'hsl(var(--primary))' }} />
          </div>
          <Switch
            checked={provider.is_active}
            onCheckedChange={() => {
              onToggle(provider);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <h3 className="font-semibold text-sm">{provider.name}</h3>
        {provider.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{provider.description}</p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{provider.type}</Badge>
          {keyCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              🔑 {keyCount} key{keyCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {modelCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              🤖 {modelCount} model{modelCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {provider.supports_streaming && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Stream</Badge>
          )}
          {provider.supports_tools && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Tools</Badge>
          )}
          {provider.is_builtin && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">Built-in</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
