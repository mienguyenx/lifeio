import { useEffect, useState } from 'react';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';

export interface BrandingConfig {
  app_name: string;
  app_tagline: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  show_notification_badge_on_logo: boolean;
  sidebar_logo_style: 'icon' | 'full' | 'text-only';
  welcome_message: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  app_name: 'LifeOS',
  app_tagline: 'Quản lý cuộc sống thông minh',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  show_notification_badge_on_logo: true,
  sidebar_logo_style: 'full',
  welcome_message: 'Chào mừng bạn đến với LifeOS!',
};

let cachedBranding: BrandingConfig | null = null;
let listeners: Set<(b: BrandingConfig) => void> = new Set();

function notifyAll(b: BrandingConfig) {
  cachedBranding = b;
  listeners.forEach(fn => fn(b));
}

export async function loadBrandingConfig(): Promise<BrandingConfig> {
  if (cachedBranding) return cachedBranding;

  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'branding_config')
      .single();

    if (!error && data?.value) {
      cachedBranding = { ...DEFAULT_BRANDING, ...(data.value as any) };
    } else {
      cachedBranding = DEFAULT_BRANDING;
    }
  } catch {
    cachedBranding = DEFAULT_BRANDING;
  }
  return cachedBranding;
}

export async function saveBrandingConfig(config: BrandingConfig): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'branding_config',
        value: config as any,
        category: 'appearance',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.error('[Branding] Error saving config:', error);
      return false;
    }

    notifyAll(config);

    // Update document title dynamically
    if (config.app_name) {
      document.title = `${config.app_name} - ${config.app_tagline || 'Quản lý cuộc sống thông minh'}`;
    }

    // Update favicon dynamically
    if (config.favicon_url) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) link.href = config.favicon_url;
    }

    return true;
  } catch (error) {
    console.error('[Branding] Error saving config:', error);
    return false;
  }
}

export function useBranding(): BrandingConfig {
  const [branding, setBranding] = useState<BrandingConfig>(cachedBranding || DEFAULT_BRANDING);

  useEffect(() => {
    loadBrandingConfig().then(setBranding);

    const listener = (b: BrandingConfig) => setBranding(b);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return branding;
}

export { DEFAULT_BRANDING };
