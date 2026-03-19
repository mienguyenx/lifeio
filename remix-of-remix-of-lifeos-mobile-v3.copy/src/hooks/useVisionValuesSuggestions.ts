import { useState } from 'react';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { toast } from 'sonner';

type SuggestionType = 'purpose' | 'vision' | 'values' | 'roles' | 'traits' | 'milestone';

interface PurposeSuggestion {
  suggestions: string[];
}

interface VisionSuggestion {
  suggestions: Array<{ statement: string; timeframe: string }>;
}

interface ValueSuggestion {
  suggestions: Array<{ name: string; description: string; icon: string }>;
}

interface RoleSuggestion {
  suggestions: Array<{ name: string; description: string; icon: string }>;
}

interface TraitSuggestion {
  strengths: Array<{ name: string; description: string }>;
  weaknesses: Array<{ name: string; description: string }>;
}

interface MilestoneSuggestion {
  suggestions: Array<{ title: string; description: string; area: string }>;
}

export function useVisionValuesSuggestions() {
  const [loading, setLoading] = useState<SuggestionType | null>(null);

  const getSuggestions = async <T>(
    type: SuggestionType,
    context?: Record<string, string>
  ): Promise<T | null> => {
    setLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke('vision-values-suggest', {
        body: { type, context }
      });

      if (error) {
        console.error('Suggestion error:', error);
        toast.error('Không thể lấy gợi ý. Vui lòng thử lại.');
        return null;
      }

      return data as T;
    } catch (err) {
      console.error('Suggestion error:', err);
      toast.error('Đã xảy ra lỗi khi lấy gợi ý.');
      return null;
    } finally {
      setLoading(null);
    }
  };

  const getPurposeSuggestions = (context?: { bio?: string }) =>
    getSuggestions<PurposeSuggestion>('purpose', context);

  const getVisionSuggestions = (context?: { purpose?: string }) =>
    getSuggestions<VisionSuggestion>('vision', context);

  const getValueSuggestions = (context?: { purpose?: string }) =>
    getSuggestions<ValueSuggestion>('values', context);

  const getRoleSuggestions = (context?: { bio?: string }) =>
    getSuggestions<RoleSuggestion>('roles', context);

  const getTraitSuggestions = () =>
    getSuggestions<TraitSuggestion>('traits');

  const getMilestoneSuggestions = () =>
    getSuggestions<MilestoneSuggestion>('milestone');

  return {
    loading,
    getPurposeSuggestions,
    getVisionSuggestions,
    getValueSuggestions,
    getRoleSuggestions,
    getTraitSuggestions,
    getMilestoneSuggestions,
  };
}
