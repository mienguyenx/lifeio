import { Database, Cloud, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isExternalSupabaseConfigured } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';

export function DatabaseIndicator() {
  const { usingExternalSupabase, user } = useAuth();
  
  const isExternal = isExternalSupabaseConfigured && usingExternalSupabase;
  const isLoggedIn = !!user;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isExternal ? "default" : "secondary"}
            className="gap-1 text-xs cursor-help"
          >
            {isExternal ? (
              <>
                <Database className="w-3 h-3" />
                External DB
                {isLoggedIn && <Check className="w-3 h-3" />}
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3" />
                Local
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">
              {isExternal 
                ? "Đang sử dụng External Supabase Database" 
                : "Đang sử dụng Local Storage (Zustand)"
              }
            </p>
            {isExternal && (
              <p className="text-muted-foreground">
                {isLoggedIn 
                  ? "✓ Đã đăng nhập - Dữ liệu được sync với Supabase"
                  : "⚠ Chưa đăng nhập - Dữ liệu chỉ lưu local"
                }
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
