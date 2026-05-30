# Admin AI Provider System - Upgrade Plan

## Mục tiêu
Xây lại module quản trị AI Provider thành hệ thống **Provider-centric**: Provider là entity chính, Models tự động thu thập từ Provider, API Keys gắn liền với Provider.

---

## 1. Kiến trúc mới

```
┌────────────────────────────────────────────────────────┐
│  AdminAIProviders (trang chính mới)                     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  OpenRouter  │  │  Gemini     │  │  Ollama     │    │
│  │  ✅ Active   │  │  ✅ Active   │  │  ⚪ Off     │    │
│  │  3 keys      │  │  1 key      │  │  0 keys     │    │
│  │  142 models  │  │  12 models  │  │  —          │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Claude     │  │  Perplexity │  │  + Custom    │    │
│  │  ✅ Active   │  │  ✅ Active   │  │  Provider   │    │
│  │  1 key      │  │  1 key      │  │             │    │
│  │  7 models   │  │  5 models   │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  Click vào Provider → Drawer chi tiết:                  │
│    • Tab Keys: Quản lý API keys cho provider này        │
│    • Tab Models: Auto-fetch + danh sách models          │
│    • Tab Config: Base URL, headers, fetch endpoint      │
└────────────────────────────────────────────────────────┘
```

## 2. Data Model

### 2.1 Table `admin_ai_providers` (MỚI)

```sql
CREATE TABLE admin_ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,          -- 'openrouter', 'gemini', 'ollama', 'custom-xyz'
  name text NOT NULL,                  -- 'OpenRouter', 'Google Gemini'
  type text NOT NULL DEFAULT 'openai-compatible',
    -- 'openai-compatible' | 'gemini' | 'anthropic' | 'ollama' | 'custom'
  base_url text,                       -- 'https://openrouter.ai/api/v1'
  models_endpoint text,                -- '/models' hoặc '/api/tags' (ollama)
  icon_url text,                       -- URL logo provider (optional)
  color text,                          -- Brand color hex
  
  -- Auth
  auth_type text DEFAULT 'bearer',     -- 'bearer' | 'api-key-header' | 'query-param' | 'none'
  auth_header text DEFAULT 'Authorization', -- Custom header name
  auth_prefix text DEFAULT 'Bearer',   -- 'Bearer', 'Api-Key', etc.
  extra_headers jsonb DEFAULT '{}',    -- { "HTTP-Referer": "...", "X-Title": "..." }
  
  -- Fetch config
  fetch_type text DEFAULT 'api',       -- 'api' | 'static' (hardcoded list)
  model_transform jsonb,               -- JS expression to map API response → model list
  
  -- Status
  is_active boolean DEFAULT true,
  is_builtin boolean DEFAULT false,    -- true cho preset providers
  supports_streaming boolean DEFAULT true,
  supports_tools boolean DEFAULT false,
  
  -- Metadata
  description text,
  docs_url text,                       -- Link documentation
  pricing_url text,                    -- Link pricing
  
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2.2 Modify `api_keys` — thêm foreign key

```sql
ALTER TABLE api_keys ADD COLUMN provider_id uuid REFERENCES admin_ai_providers(id);
-- Giữ lại column `provider` (text) cho backward compatibility
-- Migration: UPDATE api_keys SET provider_id = (SELECT id FROM admin_ai_providers WHERE slug = api_keys.provider);
```

### 2.3 Modify `admin_ai_models` — thêm provider_id

```sql
ALTER TABLE admin_ai_models ADD COLUMN provider_id uuid REFERENCES admin_ai_providers(id);
ALTER TABLE admin_ai_models ADD COLUMN context_length int;
ALTER TABLE admin_ai_models ADD COLUMN pricing jsonb;  -- { input: 0.5, output: 1.5 } per 1M tokens
ALTER TABLE admin_ai_models ADD COLUMN last_fetched_at timestamptz;
-- Migration: UPDATE admin_ai_models SET provider_id = (SELECT id FROM admin_ai_providers WHERE slug = admin_ai_models.provider);
```

### 2.4 Seed data: Builtin providers

```sql
INSERT INTO admin_ai_providers (slug, name, type, base_url, models_endpoint, auth_type, fetch_type, is_builtin, sort_order, description) VALUES
  ('openrouter',          'OpenRouter',          'openai-compatible', 'https://openrouter.ai/api/v1',              '/models', 'bearer',          'api',    true, 1, '700+ models từ nhiều provider'),
  ('openai-compatible',   'OpenAI',              'openai-compatible', 'https://api.openai.com/v1',                 '/models', 'bearer',          'api',    true, 2, 'GPT-4o, GPT-5, o3...'),
  ('gemini',              'Google Gemini',       'gemini',            'https://generativelanguage.googleapis.com',  NULL,      'query-param',     'api',    true, 3, 'Gemini Pro, Flash, Ultra'),
  ('anthropic-compatible','Anthropic Claude',    'anthropic',         'https://api.anthropic.com',                  NULL,      'api-key-header',  'static', true, 4, 'Claude Opus, Sonnet, Haiku'),
  ('perplexity',          'Perplexity',          'openai-compatible', 'https://api.perplexity.ai',                 NULL,      'bearer',          'static', true, 5, 'Sonar search models'),
  ('ollama',              'Ollama (Local)',      'ollama',            'http://localhost:11434',                     '/api/tags','none',            'api',    true, 6, 'Local models qua Ollama'),
  ('groq',                'Groq',                'openai-compatible', 'https://api.groq.com/openai/v1',            '/models', 'bearer',          'api',    true, 7, 'Ultra-fast inference'),
  ('together',            'Together AI',         'openai-compatible', 'https://api.together.xyz/v1',               '/models', 'bearer',          'api',    true, 8, 'Open source models'),
  ('deepseek',            'DeepSeek',            'openai-compatible', 'https://api.deepseek.com/v1',               '/models', 'bearer',          'api',    true, 9, 'DeepSeek V3, R1'),
  ('mistral',             'Mistral AI',          'openai-compatible', 'https://api.mistral.ai/v1',                 '/models', 'bearer',          'api',    true, 10, 'Mistral Large, Medium'),
  ('xai',                 'xAI (Grok)',          'openai-compatible', 'https://api.x.ai/v1',                       '/models', 'bearer',          'api',    true, 11, 'Grok models');
```

## 3. Component Architecture

### 3.1 Trang mới: `AdminAIProviders.tsx`

Thay thế hoàn toàn `AdminAIModels.tsx` + tích hợp phần key từ `AdminAPIKeys.tsx`.

```
AdminAIProviders
├── ProviderGrid          — Card grid tất cả providers
│   ├── BuiltinProviders  — Preset (OpenRouter, Gemini, Claude...)
│   └── CustomProviders   — User-added providers
├── AddProviderDialog     — Form thêm custom provider
└── ProviderDetailDrawer  — Drawer slide-in khi click provider
    ├── Tab: Overview     — Status, stats, description
    ├── Tab: API Keys     — CRUD keys cho provider này (từ AdminAPIKeys)
    ├── Tab: Models       — Auto-fetch + import + manage models
    └── Tab: Config       — Base URL, auth, headers, fetch settings
```

### 3.2 File structure

```
src/
├── pages/admin/
│   ├── AdminAIProviders.tsx        — TRANG MỚI (thay AdminAIModels)
│   └── AdminAPIKeys.tsx            — GIỮ LẠI nhưng bỏ provider hardcode
├── hooks/
│   ├── useAdminData.ts             — Thêm CRUD hooks cho providers
│   └── useProviderModelFetch.ts    — Hook auto-fetch models (tách từ AdminAIModels)
├── services/
│   ├── apiKeyService.ts            — Update để dùng provider_id
│   └── providerService.ts          — MỚI: fetch models, test connection
├── components/admin/
│   ├── ProviderCard.tsx            — Card hiển thị 1 provider
│   ├── ProviderDetailDrawer.tsx    — Drawer chi tiết provider
│   ├── ProviderModelsList.tsx      — Fetch + import models trong drawer
│   ├── ProviderKeysTable.tsx       — Quản lý keys trong drawer  
│   └── ProviderConfigForm.tsx      — Config form trong drawer
└── types/
    └── admin.ts                    — MỚI: AdminProvider, etc.
```

### 3.3 Model selector cải tiến

Ở AdminSettings và bất kỳ đâu chọn model:

```tsx
<ModelSelector
  value={selectedModelId}
  onChange={setSelectedModelId}
  groupBy="provider"           // Group models theo provider
  showOnlyActive={true}        // Chỉ show providers có key active
  filterCapabilities={['chat']}// Filter theo capability
/>
```

Component này tự động:
- Lấy danh sách providers đang active (có ít nhất 1 key active)
- Group models theo provider
- Hiển thị provider icon + tên ở group header
- Show context_length, pricing info
- Highlight default model

## 4. Luồng hoạt động

### 4.1 Thêm Provider mới (Custom)
```
Admin click "+ Custom Provider"
→ Nhập: name, type (openai-compatible/custom), base_url, auth config
→ Hệ thống lưu vào admin_ai_providers
→ Admin thêm API key cho provider
→ Click "Fetch Models" → hệ thống gọi {base_url}{models_endpoint}
→ Hiển thị danh sách models → Import selected → Lưu vào admin_ai_models
```

### 4.2 Auto-refresh Models
```
Khi mở Provider Detail Drawer → Tab Models:
  - Nếu fetch_type = 'api' → Show "Fetch Models" button
  - Nếu fetch_type = 'static' → Show hardcoded list (Anthropic, Perplexity)
  - Auto-detect models mới chưa import
  - Mark models đã bị remove bởi provider
```

### 4.3 Model Selection Flow
```
User/Admin chọn model ở bất kỳ đâu:
→ ModelSelector query: providers (active + có key) → models per provider
→ Hiển thị grouped dropdown
→ Khi chọn model → lưu model_id + provider_id
→ Khi gọi AI → apiKeyService lấy key theo provider_id
```

## 5. Phases

### Phase 1: Foundation (Ưu tiên cao)
- [ ] Tạo table `admin_ai_providers` + seed builtin data
- [ ] Migration: thêm `provider_id` vào `api_keys` & `admin_ai_models`
- [ ] Tạo CRUD hooks trong `useAdminData.ts` cho providers
- [ ] Tạo `providerService.ts` — generic model fetcher

### Phase 2: UI chính (Ưu tiên cao)
- [ ] Tạo `AdminAIProviders.tsx` — provider grid
- [ ] Tạo `ProviderCard.tsx` — card component
- [ ] Tạo `ProviderDetailDrawer.tsx` với 4 tabs
- [ ] Tạo `ProviderModelsList.tsx` — fetch + import UI
- [ ] Tạo `ProviderKeysTable.tsx` — inline key management
- [ ] Tạo `ProviderConfigForm.tsx` — settings form

### Phase 3: Integration (Ưu tiên trung bình)
- [ ] Tạo `ModelSelector` component (grouped by provider)
- [ ] Update `AdminSettings.tsx` AI tab → dùng ModelSelector
- [ ] Update `apiKeyService.ts` → support provider_id
- [ ] Update AI Coach / edge functions → resolve provider + key correctly
- [ ] Update route: `/admin/ai/providers` thay `/admin/ai/models`

### Phase 4: Polish (Ưu tiên thấp)
- [ ] Add Provider health check / connectivity test
- [ ] Add Model benchmarking (latency, quality score)
- [ ] Add Cost tracking per provider/model
- [ ] Auto-refresh models schedule (daily/weekly)
- [ ] Provider recommendation engine

## 6. Migration Strategy

1. **Backward compatible**: Giữ column `provider` (text) trong `api_keys` và `admin_ai_models`
2. **New column**: Thêm `provider_id` (nullable initially)
3. **Seed**: Insert builtin providers, update existing records
4. **Soft switch**: AdminAIProviders page mới, giữ AdminAIModels route redirect
5. **Cleanup**: Sau khi stable, deprecate old columns

## 7. Custom Provider Example

```
Tên: LM Studio (Local)
Type: openai-compatible
Base URL: http://192.168.1.100:1234/v1
Models Endpoint: /models
Auth: none
Fetch: api

→ Fetch models → Tìm thấy: llama-3.1-8b, codestral-22b, phi-3
→ Import → Sẵn sàng sử dụng
```

```
Tên: Company Internal API
Type: custom
Base URL: https://ai.company.com/api
Models Endpoint: /available-models
Auth: bearer (API key)
Extra Headers: { "X-Team": "engineering" }
Fetch: api

→ Fetch models → Tìm thấy: company-gpt, company-code
→ Import → Sẵn sàng sử dụng
```
