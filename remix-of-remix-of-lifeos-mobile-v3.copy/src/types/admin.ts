// AI Provider types

export type ProviderType = 'openai-compatible' | 'gemini' | 'anthropic' | 'ollama' | 'custom';
export type AuthType = 'bearer' | 'api-key-header' | 'query-param' | 'none';
export type FetchType = 'api' | 'static';

export interface AdminAIProvider {
  id: string;
  slug: string;
  name: string;
  type: ProviderType;
  base_url: string | null;
  models_endpoint: string | null;
  icon_url: string | null;
  color: string | null;

  // Auth
  auth_type: AuthType;
  auth_header: string;
  auth_prefix: string;
  extra_headers: Record<string, string>;

  // Fetch
  fetch_type: FetchType;
  model_transform: Record<string, any> | null;

  // Status
  is_active: boolean;
  is_builtin: boolean;
  supports_streaming: boolean;
  supports_tools: boolean;

  // Meta
  description: string | null;
  docs_url: string | null;
  pricing_url: string | null;

  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FetchedModel {
  id: string;
  name: string;
  provider_slug: string;
  description?: string;
  context_length?: number;
  capabilities?: string[];
  pricing?: { input?: number; output?: number };
}

// Builtin provider seeds — used when no DB table yet, or as fallback
export const BUILTIN_PROVIDERS: Omit<AdminAIProvider, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    slug: 'openrouter', name: 'OpenRouter', type: 'openai-compatible',
    base_url: 'https://openrouter.ai/api/v1', models_endpoint: '/models',
    icon_url: null, color: '#6366f1',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: { 'HTTP-Referer': 'https://life.hoanong.com' },
    fetch_type: 'api', model_transform: null,
    is_active: true, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: '700+ models từ nhiều provider, routing thông minh',
    docs_url: 'https://openrouter.ai/docs', pricing_url: 'https://openrouter.ai/models',
    sort_order: 1,
  },
  {
    slug: 'openai-compatible', name: 'OpenAI', type: 'openai-compatible',
    base_url: 'https://api.openai.com/v1', models_endpoint: '/models',
    icon_url: null, color: '#10a37f',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: true, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: 'GPT-4o, GPT-5, o3, DALL-E',
    docs_url: 'https://platform.openai.com/docs', pricing_url: 'https://openai.com/pricing',
    sort_order: 2,
  },
  {
    slug: 'gemini', name: 'Google Gemini', type: 'gemini',
    base_url: 'https://generativelanguage.googleapis.com', models_endpoint: null,
    icon_url: null, color: '#4285f4',
    auth_type: 'query-param', auth_header: 'key', auth_prefix: '',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: true, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: 'Gemini Pro, Flash, Ultra',
    docs_url: 'https://ai.google.dev/docs', pricing_url: 'https://ai.google.dev/pricing',
    sort_order: 3,
  },
  {
    slug: 'anthropic-compatible', name: 'Anthropic Claude', type: 'anthropic',
    base_url: 'https://api.anthropic.com', models_endpoint: null,
    icon_url: null, color: '#d97706',
    auth_type: 'api-key-header', auth_header: 'x-api-key', auth_prefix: '',
    extra_headers: { 'anthropic-version': '2023-06-01' },
    fetch_type: 'static', model_transform: null,
    is_active: true, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: 'Claude Opus, Sonnet, Haiku',
    docs_url: 'https://docs.anthropic.com', pricing_url: 'https://www.anthropic.com/pricing',
    sort_order: 4,
  },
  {
    slug: 'perplexity', name: 'Perplexity', type: 'openai-compatible',
    base_url: 'https://api.perplexity.ai', models_endpoint: null,
    icon_url: null, color: '#22d3ee',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: {},
    fetch_type: 'static', model_transform: null,
    is_active: true, is_builtin: true, supports_streaming: true, supports_tools: false,
    description: 'Sonar search-augmented models',
    docs_url: 'https://docs.perplexity.ai', pricing_url: 'https://www.perplexity.ai/pricing',
    sort_order: 5,
  },
  {
    slug: 'ollama', name: 'Ollama (Local)', type: 'ollama',
    base_url: 'http://localhost:11434', models_endpoint: '/api/tags',
    icon_url: null, color: '#f97316',
    auth_type: 'none', auth_header: '', auth_prefix: '',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: false, is_builtin: true, supports_streaming: true, supports_tools: false,
    description: 'Chạy models local qua Ollama',
    docs_url: 'https://ollama.ai', pricing_url: null,
    sort_order: 6,
  },
  {
    slug: 'groq', name: 'Groq', type: 'openai-compatible',
    base_url: 'https://api.groq.com/openai/v1', models_endpoint: '/models',
    icon_url: null, color: '#f97316',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: false, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: 'Ultra-fast LPU inference',
    docs_url: 'https://console.groq.com/docs', pricing_url: 'https://groq.com',
    sort_order: 7,
  },
  {
    slug: 'together', name: 'Together AI', type: 'openai-compatible',
    base_url: 'https://api.together.xyz/v1', models_endpoint: '/models',
    icon_url: null, color: '#6366f1',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: false, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: 'Open source models (Llama, Mistral, etc.)',
    docs_url: 'https://docs.together.ai', pricing_url: 'https://www.together.ai/pricing',
    sort_order: 8,
  },
  {
    slug: 'deepseek', name: 'DeepSeek', type: 'openai-compatible',
    base_url: 'https://api.deepseek.com/v1', models_endpoint: '/models',
    icon_url: null, color: '#3b82f6',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: false, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: 'DeepSeek V3, R1 — cost-effective',
    docs_url: 'https://platform.deepseek.com/docs', pricing_url: 'https://platform.deepseek.com/pricing',
    sort_order: 9,
  },
  {
    slug: 'mistral', name: 'Mistral AI', type: 'openai-compatible',
    base_url: 'https://api.mistral.ai/v1', models_endpoint: '/models',
    icon_url: null, color: '#ff7000',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: false, is_builtin: true, supports_streaming: true, supports_tools: true,
    description: 'Mistral Large, Medium, Codestral',
    docs_url: 'https://docs.mistral.ai', pricing_url: 'https://mistral.ai/pricing',
    sort_order: 10,
  },
  {
    slug: 'xai', name: 'xAI (Grok)', type: 'openai-compatible',
    base_url: 'https://api.x.ai/v1', models_endpoint: '/models',
    icon_url: null, color: '#000000',
    auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer',
    extra_headers: {},
    fetch_type: 'api', model_transform: null,
    is_active: false, is_builtin: true, supports_streaming: true, supports_tools: false,
    description: 'Grok models by xAI',
    docs_url: 'https://docs.x.ai', pricing_url: null,
    sort_order: 11,
  },
];

// Static model lists for providers that don't have a /models endpoint
export const STATIC_MODELS: Record<string, FetchedModel[]> = {
  'anthropic-compatible': [
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', provider_slug: 'anthropic-compatible', context_length: 200000, capabilities: ['chat', 'reasoning', 'analysis', 'code-generation'] },
    { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider_slug: 'anthropic-compatible', context_length: 200000, capabilities: ['chat', 'completion', 'analysis', 'code-generation'] },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider_slug: 'anthropic-compatible', context_length: 200000, capabilities: ['chat', 'completion'] },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider_slug: 'anthropic-compatible', context_length: 200000, capabilities: ['chat', 'completion', 'code-generation'] },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider_slug: 'anthropic-compatible', context_length: 200000, capabilities: ['chat', 'completion'] },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider_slug: 'anthropic-compatible', context_length: 200000, capabilities: ['chat', 'completion'] },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider_slug: 'anthropic-compatible', context_length: 200000, capabilities: ['chat', 'reasoning'] },
  ],
  'perplexity': [
    { id: 'sonar-pro', name: 'Sonar Pro', provider_slug: 'perplexity', context_length: 200000, capabilities: ['chat', 'web-search'] },
    { id: 'sonar', name: 'Sonar', provider_slug: 'perplexity', context_length: 128000, capabilities: ['chat', 'web-search'] },
    { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', provider_slug: 'perplexity', context_length: 128000, capabilities: ['chat', 'reasoning', 'web-search'] },
    { id: 'sonar-reasoning', name: 'Sonar Reasoning', provider_slug: 'perplexity', context_length: 128000, capabilities: ['chat', 'reasoning', 'web-search'] },
    { id: 'r1-1776', name: 'R1-1776 (offline)', provider_slug: 'perplexity', context_length: 128000, capabilities: ['chat', 'reasoning'] },
  ],
};
