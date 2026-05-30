import type { AdminAIProvider, FetchedModel } from '@/types/admin';
import { STATIC_MODELS } from '@/types/admin';
import { getActiveAPIKey } from './apiKeyService';
import type { AIProvider } from './apiKeyService';

function inferCapabilities(modelId: string): string[] {
  const id = modelId.toLowerCase();
  if (id.includes('embed')) return ['embedding'];
  const caps: string[] = ['chat'];
  if (id.includes('vision') || id.includes('-vl') || id.includes('visual') || id.includes('image')) caps.push('image-understanding');
  if (id.includes('code') || id.includes('coder') || id.includes('starcoder') || id.includes('deepseek-coder')) caps.push('code-generation');
  if (id.includes('reason') || id.includes('-r1') || id.includes('-o1') || id.includes('-o3') || id.includes('thinking')) caps.push('reasoning');
  if (id.includes('search') || id.includes('sonar') || id.includes('online') || id.includes('browse')) caps.push('web-search');
  return caps;
}

/**
 * Fetch models from a provider using its configuration.
 * Returns normalized FetchedModel[] regardless of provider type.
 */
export async function fetchModelsFromProvider(
  provider: AdminAIProvider,
  overrideBaseUrl?: string
): Promise<FetchedModel[]> {
  // Static providers — return hardcoded list
  if (provider.fetch_type === 'static') {
    return STATIC_MODELS[provider.slug] || [];
  }

  const baseUrl = overrideBaseUrl || provider.base_url;
  if (!baseUrl) throw new Error(`No base URL configured for ${provider.name}`);

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...provider.extra_headers,
  };

  // Get API key if needed
  let apiKey: string | null = null;
  if (provider.auth_type !== 'none') {
    const providerSlug = provider.slug as AIProvider;
    const keyInfo = await getActiveAPIKey(providerSlug);
    if (keyInfo) {
      apiKey = keyInfo.api_key;
    }
  }

  // Apply auth
  if (apiKey) {
    switch (provider.auth_type) {
      case 'bearer':
        headers[provider.auth_header || 'Authorization'] = `${provider.auth_prefix || 'Bearer'} ${apiKey}`;
        break;
      case 'api-key-header':
        headers[provider.auth_header || 'x-api-key'] = apiKey;
        break;
      // query-param handled in URL below
    }
  }

  // Determine URL
  let fetchUrl: string;

  switch (provider.type) {
    case 'gemini': {
      if (!apiKey) throw new Error(`API key required for ${provider.name}`);
      fetchUrl = `${baseUrl}/v1beta/models?key=${apiKey}`;
      break;
    }
    case 'ollama': {
      const endpoint = provider.models_endpoint || '/api/tags';
      fetchUrl = `${baseUrl}${endpoint}`;
      break;
    }
    default: {
      // openai-compatible, anthropic, custom
      const endpoint = provider.models_endpoint || '/models';
      fetchUrl = `${baseUrl}${endpoint}`;
      if (provider.auth_type === 'query-param' && apiKey) {
        const sep = fetchUrl.includes('?') ? '&' : '?';
        fetchUrl += `${sep}${provider.auth_header || 'key'}=${apiKey}`;
      }
    }
  }

  const res = await fetch(fetchUrl, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();

  // Parse response based on provider type
  return parseProviderResponse(provider, data);
}

function parseProviderResponse(provider: AdminAIProvider, data: any): FetchedModel[] {
  switch (provider.type) {
    case 'gemini':
      return (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: m.name?.replace('models/', '') || m.name,
          name: m.displayName || m.name,
          provider_slug: provider.slug,
          description: m.description?.slice(0, 150),
          context_length: m.inputTokenLimit,
          capabilities: ['chat', 'completion'],
        }));

    case 'ollama':
      return (data.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        provider_slug: provider.slug,
        description: [m.details?.family, m.details?.parameter_size].filter(Boolean).join(' · '),
        capabilities: inferCapabilities(m.name),
      }));

    default: {
      // OpenAI-compatible format: { data: [{ id, name, ... }] }
      const models = data.data || data.models || data || [];
      return (Array.isArray(models) ? models : []).map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        provider_slug: provider.slug,
        description: m.description?.slice(0, 150),
        context_length: m.context_length,
        capabilities: m.capabilities || inferCapabilities(m.id || ''),
        pricing: m.pricing ? {
          input: parseFloat(m.pricing.prompt || m.pricing.input || 0),
          output: parseFloat(m.pricing.completion || m.pricing.output || 0),
        } : undefined,
      }));
    }
  }
}

/**
 * Test connectivity to a provider by fetching its model list.
 */
export async function testProviderConnection(
  provider: AdminAIProvider,
  overrideBaseUrl?: string
): Promise<{ success: boolean; modelCount: number; error?: string }> {
  try {
    const models = await fetchModelsFromProvider(provider, overrideBaseUrl);
    return { success: true, modelCount: models.length };
  } catch (err: any) {
    return { success: false, modelCount: 0, error: err.message };
  }
}
