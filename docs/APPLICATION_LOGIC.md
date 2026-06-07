# 🧠 LifeOS - Chi Tiết Logic Ứng Dụng

Tài liệu này mô tả chi tiết logic và flow xử lý của ứng dụng LifeOS, bao gồm kiến trúc, data flow, business logic và các patterns được sử dụng.

---

## 📋 Mục Lục

0. [Linh Hồn Của Ứng Dụng](#0-linh-hồn-của-ứng-dụng)
1. [Kiến Trúc Tổng Thể](#1-kiến-trúc-tổng-thể)
2. [Application Flow & Initialization](#2-application-flow--initialization)
3. [State Management & Data Flow](#3-state-management--data-flow)
4. [API Layer & Service Layer](#4-api-layer--service-layer)
5. [Business Logic Modules](#5-business-logic-modules)
6. [Caching & Performance](#6-caching--performance)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Workspace & Multi-User](#8-workspace--multi-user)
9. [Plugin System](#9-plugin-system)
10. [AI Integration](#10-ai-integration)
11. [Logic Liên Kết Giữa Các Module](#11-logic-liên-kết-giữa-các-module)

---

## 0. Linh Hồn Của Ứng Dụng

### 0.1. Triết Lý Cốt Lõi

**LifeOS** không chỉ là một ứng dụng quản lý công việc hay theo dõi thói quen. Đây là một **hệ điều hành cho cuộc sống** (Life Operating System), được thiết kế dựa trên triết lý:

> **"Cuộc sống cân bằng là cuộc sống hạnh phúc"**

Ứng dụng được xây dựng trên mô hình **Bánh Xe Cuộc Đời (Wheel of Life)** với 10 mảng cuộc sống, giúp người dùng:
- **Nhận thức** được sự cân bằng trong cuộc sống
- **Theo dõi** tiến trình hàng ngày, hàng tuần
- **Điều chỉnh** để đạt được sự cân bằng mong muốn
- **Phát triển** bản thân một cách toàn diện

### 0.2. Nguyên Tắc Thiết Kế

#### 1. **Daily Operations → Weekly Review → Long-term Vision**

Ứng dụng hoạt động theo chu kỳ 3 tầng:

```
┌─────────────────────────────────────────┐
│     Long-term Vision & Goals           │  ← Định hướng dài hạn
│     (Months/Years)                      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Weekly Review & Reflection          │  ← Đánh giá và điều chỉnh
│     (Every Week)                         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Daily Operations                     │  ← Hành động hàng ngày
│     (Habits, Tasks, Journal)             │
└─────────────────────────────────────────┘
```

**Luồng hoạt động:**
- **Hàng ngày**: Người dùng thực hiện habits, hoàn thành tasks, ghi journal
- **Cuối tuần**: Đánh giá tuần qua, chấm điểm các mảng cuộc sống (1-10)
- **Hàng tuần**: Xem Wheel of Life, nhận diện mất cân bằng, điều chỉnh goals/habits
- **Dài hạn**: Liên kết daily actions với Vision, Values, Roles

#### 2. **Life Area là Trung Tâm**

Mọi thứ trong ứng dụng đều được gắn với một **Life Area** (mảng cuộc sống):

- **Habits** → Gắn với area (health, finance, learning, etc.)
- **Tasks** → Gắn với area
- **Goals** → Gắn với area
- **Journal** → Có thể tag với area
- **Weekly Review** → Chấm điểm từng area

**Tại sao quan trọng?**
- Giúp người dùng nhận thức được mình đang tập trung vào đâu
- Wheel of Life visualization cho thấy sự cân bằng
- AI Coach có thể đưa ra gợi ý dựa trên area cụ thể

#### 3. **AI như một Người Đồng Hành Thông Minh**

AI không chỉ là công cụ, mà là **coach** giúp:
- **Hôm nay**: Gợi ý focus vào đâu dựa trên context hiện tại
- **Cuối tuần**: Phân tích tuần qua, đề xuất điều chỉnh
- **Theo area**: Chẩn đoán và đưa ra giải pháp cho từng mảng cuộc sống

AI luôn đưa ra gợi ý **có thể hành động** (actionable), có thể convert thành Habits/Tasks/Goals.

#### 4. **Workspace như Ngữ Cảnh**

Mọi data đều được filter theo **Workspace** (Personal hoặc Group):
- **Personal**: Dữ liệu cá nhân của bạn
- **Group/Family**: Dữ liệu chia sẻ với nhóm/gia đình

Điều này cho phép:
- Quản lý cuộc sống cá nhân
- Quản lý cuộc sống gia đình/nhóm
- Chuyển đổi giữa các workspace dễ dàng

### 0.3. Các Khái Niệm Cốt Lõi

#### **Life Area (Mảng Cuộc Sống)**

10 mảng cuộc sống trong Wheel of Life:
1. **Health** - Sức khoẻ
2. **Emotional** - Cảm xúc - Tinh thần
3. **Career** - Công việc - Sự nghiệp
4. **Finance** - Tài chính
5. **Relationships** - Mối quan hệ
6. **Learning** - Học tập - Phát triển
7. **Personal Goals** - Mục tiêu cá nhân
8. **Habits** - Thói quen
9. **Fun** - Niềm vui - Giải trí
10. **Environment** - Môi trường sống

#### **Week Concept (Khái Niệm Tuần)**

- Tuần bắt đầu từ **Thứ 2** (ISO 8601)
- Weekly Review được tạo cho mỗi tuần
- Wheel of Life hiển thị điểm số theo tuần
- So sánh tuần này với tuần trước để thấy xu hướng

#### **Goal → Habit/Task → Journal → Review**

Luồng logic:
```
Goal (Mục tiêu dài hạn)
  ↓
Habit/Task (Hành động cụ thể)
  ↓
Journal (Ghi lại cảm nhận)
  ↓
Weekly Review (Đánh giá và điều chỉnh)
```

### 0.4. Điểm Đặc Biệt Của LifeOS

1. **Holistic Approach**: Không chỉ quản lý công việc, mà quản lý toàn bộ cuộc sống
2. **Visual Feedback**: Wheel of Life cho thấy sự cân bằng một cách trực quan
3. **AI-Powered**: AI không chỉ trả lời câu hỏi, mà đưa ra gợi ý hành động cụ thể
4. **Flexible Workspace**: Có thể dùng cho cá nhân hoặc nhóm/gia đình
5. **Plugin System**: Mở rộng được thông qua plugins (như WordPress)
6. **Multi-language**: Hỗ trợ đa ngôn ngữ từ đầu

### 0.5. Tầm Nhìn

LifeOS không chỉ là một ứng dụng, mà là một **nền tảng** giúp mọi người:
- Sống có ý thức hơn
- Cân bằng cuộc sống tốt hơn
- Đạt được mục tiêu một cách bền vững
- Phát triển bản thân toàn diện

---

---

## 1. Kiến Trúc Tổng Thể

### 1.1. Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (Build tool)
- TanStack Query (React Query) - Data fetching & caching
- Tailwind CSS - Styling
- React Context - State management
- Lucide React - Icons

**Backend:**
- Express.js API server (`server/api.mjs`)
- Prisma ORM - Database access
- PostgreSQL (Supabase) - Production database
- SQLite - Local development database

**Infrastructure:**
- Supabase Auth - Authentication
- Supabase PostgreSQL - Database
- Vercel - Hosting (Frontend)
- Node.js Server - API server

### 1.2. Kiến Trúc Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components, UI, Layout)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         State Management Layer          │
│  (React Context, React Query)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (API Clients, Business Logic)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         API Layer                       │
│  (Express Routes, Middleware)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  (Prisma ORM, Database)                 │
└─────────────────────────────────────────┘
```

### 1.3. Cấu Trúc Thư Mục

```
src/
├── components/          # UI Components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   ├── Dashboard/      # Dashboard module
│   ├── Habits/         # Habits module
│   ├── Tasks/          # Tasks module
│   └── ...
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── WorkspaceContext.tsx
│   ├── ThemeContext.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── queries/        # React Query hooks
│   ├── mutations/       # Mutation hooks
│   └── ...
├── services/           # Service layer
│   ├── api/            # API client functions
│   ├── cache.ts        # Caching utilities
│   ├── prefetch.ts     # Prefetching logic
│   └── ...
├── lib/                # Core libraries
│   ├── apiClient.ts    # API client with auth
│   ├── queryClient.ts  # React Query config
│   └── ...
└── types/              # TypeScript types

server/
├── api.mjs            # Express API routes
├── lib/               # Backend services
│   ├── habits.mjs     # Habits business logic
│   ├── tasks.mjs      # Tasks business logic
│   ├── goals.mjs      # Goals business logic
│   └── ...
└── seed.mjs           # Database seeding
```

---

## 2. Application Flow & Initialization

### 2.1. Application Bootstrap

**File:** `src/main.tsx`

```typescript
// Provider hierarchy (outermost to innermost)
QueryClientProvider      // React Query for data fetching
  └─ ThemeProvider      // Theme management
      └─ I18nProvider   // Internationalization
          └─ LanguageProvider
              └─ AuthProvider      // Authentication state
                  └─ RuntimeFlagsProvider  // Feature flags
                      └─ WorkspaceProvider  // Workspace/Group context
                          └─ AppThemeProvider  // App theme
                              └─ App          // Main app component
```

**Flow:**
1. **Mount React App** → `createRoot()` renders App
2. **Initialize Providers** → Setup contexts in order
3. **Check Authentication** → AuthProvider checks Supabase session
4. **Load Workspace** → WorkspaceProvider loads user's workspace
5. **Render App** → App component renders based on auth state

### 2.2. App Component Logic

**File:** `src/App.tsx`

**Key States:**
- `activeView` - Current view/page (dashboard, habits, tasks, etc.)
- `isAICoachOpen` - AI Coach sidebar visibility
- `isSidebarOpen` - Mobile sidebar visibility
- `showQuickAdd` - Quick Add modal visibility

**Navigation Flow:**
1. User clicks sidebar item → `handleViewChange(view)`
2. `activeView` state updates → Persisted to localStorage
3. `renderView()` switches component based on `activeView`
4. Navigation history recorded → Used for prefetching

**Route Resolution:**
```typescript
// Priority order:
1. Plugin routes (if matched)
2. Core routes (switch statement)
3. Default fallback (Dashboard)
```

### 2.3. Authentication Flow

**File:** `src/contexts/AuthContext.tsx`

**Flow:**
1. **Check Session** → `supabase.auth.getSession()`
2. **If No Session** → Show SignIn/SignUp page
3. **If Session Exists** → Load user profile
4. **Set User State** → Update `user` object in context
5. **RequireAuth Wrapper** → Protects routes

**Session Management:**
- Session stored in Supabase Auth
- Access token in Authorization header
- Auto-refresh handled by Supabase client
- Sign out clears session

---

## 3. State Management & Data Flow

### 3.1. React Query (TanStack Query)

**Configuration:** `src/lib/queryClient.ts`

```typescript
{
  staleTime: 60 * 1000,        // 1 minute - data fresh
  gcTime: 10 * 60 * 1000,     // 10 minutes - cache duration
  refetchOnWindowFocus: false, // No refetch on focus
  refetchOnMount: false,       // Only refetch if stale
  retry: 1,                    // Retry once on error
}
```

**Data Flow Pattern:**
```
Component → useQuery hook → API Service → API Endpoint → Database
                ↓
         React Query Cache
                ↓
         Component Re-render
```

### 3.2. Custom Hooks Pattern

**useModuleData Hook:** `src/hooks/useModuleData.ts`

**Features:**
- Cache-first loading (shows cached data immediately)
- Background refresh (updates cache in background)
- Status management (idle, loading, success, empty, error)
- Never shows loading if cache exists

**Flow:**
1. Check cache → If exists and fresh, return immediately
2. Show cached data → User sees instant data
3. Background fetch → Fetch fresh data silently
4. Update cache → Replace with fresh data
5. Update UI → Component re-renders with fresh data

**useCachedData Hook:** `src/hooks/useCachedData.ts`

**Features:**
- Synchronous cache check
- Background refresh option
- Error handling with fallback to cache

### 3.3. Cache System

**File:** `src/services/cache.ts`

**Cache Strategy:**
- **In-memory cache** → Fast access, lost on refresh
- **Stale times** → Different for different data types
- **Cache keys** → Based on module + params

**Cache Types:**
```typescript
{
  habits: 2 * 60 * 1000,      // 2 minutes
  tasks: 2 * 60 * 1000,       // 2 minutes
  goals: 5 * 60 * 1000,       // 5 minutes
  journal: 5 * 60 * 1000,     // 5 minutes
  stats: 1 * 60 * 1000,       // 1 minute
}
```

**Cache Functions:**
- `getCachedSync()` - Synchronous cache read
- `setCached()` - Set cache value
- `fetchWithCache()` - Fetch with cache check
- `clearCache()` - Clear specific cache

### 3.4. Request Deduplication

**File:** `src/services/requestDeduplication.ts`

**Purpose:** Prevent duplicate API calls

**Flow:**
1. Request comes in → Check if pending request exists
2. If exists → Return existing promise
3. If not → Create new request, store promise
4. On completion → Remove from pending requests

**Benefits:**
- Prevents duplicate API calls
- Reduces server load
- Faster response for concurrent requests

---

## 4. API Layer & Service Layer

### 4.1. API Client

**File:** `src/lib/apiClient.ts`

**Features:**
- Automatic authentication (Bearer token)
- Error handling
- URL building
- Group ID injection

**Flow:**
```typescript
apiFetch(path, options, params)
  → fetchWithAuth(url, options)
    → Get Supabase session
    → Add Authorization header
    → Make fetch request
    → Parse JSON response
    → Handle errors
```

### 4.2. Service Layer Structure

**Location:** `src/services/api/*.ts`

**Pattern:**
- One file per module (habits.ts, tasks.ts, goals.ts)
- Type-safe functions
- Consistent error handling
- Group ID support

**Example:** `src/services/api/habits.ts`
```typescript
export async function getHabits(params, groupId)
export async function createHabit(data, groupId)
export async function updateHabit(id, data, groupId)
export async function deleteHabit(id, groupId)
```

### 4.3. Backend API Structure

**File:** `server/api.mjs`

**Route Pattern:**
```javascript
app.get("/api/habits", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const groupId = getGroupId(req);
  // Business logic
  // Return response
});
```

**Middleware Chain:**
1. `cors()` - CORS handling
2. `express.json()` - JSON parsing
3. `authMiddleware` - Optional auth check
4. `requireAuth` - Required auth check
5. Route handler - Business logic

**Error Handling:**
- Try-catch blocks
- Consistent error format
- Status codes (200, 400, 401, 404, 500)
- Error logging

### 4.4. Business Logic Layer

**Location:** `server/lib/*.mjs`

**Pattern:**
- One file per domain (habits.mjs, tasks.mjs, goals.mjs)
- Prisma queries
- Business rules
- Data validation

**Example Flow (Create Habit):**
```javascript
createHabit(data, userId, groupId)
  1. Validate input data
  2. Check permissions (userId, groupId)
  3. Create habit record (Prisma)
  4. Create initial habit log (if needed)
  5. Return created habit
```

---

## 5. Business Logic Modules

### 5.1. Habits Module

**Logic Flow:**

**Create Habit:**
1. Validate name, frequency, area
2. Create Habit record
3. Initialize HabitLog for today (if daily)
4. Return created habit

**Toggle Habit:**
1. Get habit by ID
2. Check if log exists for date
3. If exists → Update status (done/pending/skipped)
4. If not → Create new log
5. Update streak calculation
6. Return updated log

**Streak Calculation:**
- Consecutive days with status = "done"
- Reset on skip or miss
- Tracked in HabitLog records

**Stats Calculation:**
- Completion rate = (done logs / total logs) * 100
- Current streak = consecutive done logs
- Longest streak = max consecutive done logs

### 5.2. Tasks Module

**Logic Flow:**

**Create Task:**
1. Validate title, priority, due date
2. Create Task record
3. If recurring → Create recurrence pattern
4. If has dependencies → Validate dependencies exist
5. Return created task

**Update Task Status:**
1. Get task by ID
2. Update status (todo → in_progress → done)
3. If done → Check dependencies completion
4. If recurring → Create next instance
5. Return updated task

**Recurring Tasks:**
- Pattern stored in `recurrencePattern` field
- Next instance created when current completed
- Can stop recurrence anytime

**Task Dependencies:**
- Tasks can depend on other tasks
- Cannot start task until dependencies done
- Circular dependencies prevented

**Subtasks:**
- Tasks can have subtasks
- Subtasks tracked separately
- Parent task completion based on subtasks

### 5.3. Goals Module

**Logic Flow:**

**Create Goal:**
1. Validate title, area, target date
2. Link to habits/tasks (optional)
3. Create Goal record
4. Return created goal

**Goal Progress:**
- Calculated from linked habits/tasks
- Progress = (completed items / total items) * 100
- Updated automatically when habits/tasks change

**Goal Status:**
- `planning` → Goal created but not started
- `active` → Goal in progress
- `completed` → Goal achieved
- `archived` → Goal archived

### 5.4. Journal Module

**Logic Flow:**

**Create Journal Entry:**
1. Validate content, date
2. Parse tags from content
3. Create JournalEntry record
4. If pinned → Mark for weekly review
5. Return created entry

**Journal Filtering:**
- By date range
- By area
- By tags
- By visibility (private/pinned)

### 5.5. Weekly Review Module

**Logic Flow:**

**Create Weekly Review:**
1. Get or create review for week
2. Save life area ratings (1-10)
3. Save highlight, lowlight, lesson, gratitude
4. Link pinned journal entries
5. Calculate weekly stats
6. Return review

**Life Area Ratings:**
- One rating per area per week
- Stored in LifeAreaRating table
- Used for Wheel of Life visualization

**Weekly Stats:**
- Tasks created/completed
- Habits done/skipped
- Goals progress
- Journal entries count

### 5.6. Wheel of Life Module

**Logic Flow:**

**Get Wheel Data:**
1. Get current week's ratings
2. Get previous week's ratings (for comparison)
3. Calculate trends (up/down/same)
4. Return formatted data for chart

**Visualization:**
- 8 life areas (health, finance, learning, etc.)
- Score 1-10 per area
- Radar chart visualization
- Trend indicators

---

## 6. Caching & Performance

### 6.1. Multi-Level Caching

**Level 1: React Query Cache**
- In-memory cache
- Automatic invalidation
- Stale time management

**Level 2: Custom Cache Service**
- Module-specific cache
- Synchronous access
- Background refresh

**Level 3: Request Deduplication**
- Prevent duplicate requests
- Share promises across components

### 6.2. Prefetching Strategy

**File:** `src/services/prefetch.ts`

**Strategy:**
1. **High Priority** → Prefetch stats immediately
2. **Medium Priority** → Prefetch likely next modules
3. **Low Priority** → Prefetch on idle

**Network Awareness:**
- Detect network speed (fast/slow/offline)
- Disable prefetch on slow networks
- Use requestIdleCallback for low priority

**Navigation-Based Prefetching:**
- Track navigation history
- Predict likely next modules
- Prefetch based on patterns

### 6.3. Code Splitting

**Lazy Loading:**
```typescript
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Habits = lazy(() => import('./components/Habits/Habits'));
```

**Benefits:**
- Smaller initial bundle
- Faster initial load
- Load components on demand

### 6.4. Performance Optimizations

**React Query Optimizations:**
- `refetchOnWindowFocus: false` → No refetch on tab focus
- `refetchOnMount: false` → Only refetch if stale
- `staleTime` → Reduce unnecessary refetches

**Cache Optimizations:**
- Cache-first loading → Instant UI updates
- Background refresh → Fresh data without blocking
- Request deduplication → Prevent duplicate calls

**Component Optimizations:**
- Lazy loading → Code splitting
- Memoization → Prevent unnecessary re-renders
- Suspense boundaries → Better loading states

---

## 7. Authentication & Authorization

### 7.1. Authentication Flow

**Supabase Auth:**
- Email/password authentication
- Session management
- Token refresh

**Flow:**
1. User signs in → Supabase Auth
2. Session created → Stored in Supabase
3. Access token → Used for API calls
4. Token refresh → Automatic by Supabase client

### 7.2. Authorization Middleware

**File:** `server/lib/auth.mjs`

**Middleware:**
- `authMiddleware` → Optional auth check
- `requireAuth` → Required auth check
- Extract userId and groupId from token

**Flow:**
```javascript
requireAuth middleware
  → Verify JWT token
  → Extract userId
  → Extract groupId (if available)
  → Attach to req.user, req.groupId
  → Continue to route handler
```

### 7.3. Permission System

**File:** `src/services/permissionService.ts`

**Checks:**
- User owns resource (userId match)
- User in workspace (groupId match)
- Feature access (plan-based)
- Limits (plan-based)

**Pattern:**
```typescript
checkPermission(userId, resource, action)
  → Check ownership
  → Check workspace membership
  → Check feature access
  → Return true/false
```

---

## 8. Workspace & Multi-User

### 8.1. Workspace Concept

**Structure:**
- User → Member of Workspace (Group)
- Workspace → Contains shared data
- Personal workspace → Default for single user

**Workspace Context:**
- `WorkspaceProvider` → Provides workspace state
- `groupId` → Current workspace ID
- `workspace` → Workspace object

### 8.2. Data Isolation

**Pattern:**
- All queries filtered by `groupId`
- User can only access their workspace data
- Workspace switching → Change groupId

**Example:**
```typescript
// All queries include groupId
getHabits({ groupId })
getTasks({ groupId })
getGoals({ groupId })
```

### 8.3. Group Management

**Features:**
- Create groups
- Add/remove members
- Switch between groups
- Personal vs shared workspaces

**API:**
- `GET /api/groups` → List user's groups
- `POST /api/groups` → Create group
- `PUT /api/groups/:id` → Update group
- `POST /api/groups/:id/members` → Add member
- `DELETE /api/groups/:id/members/:userId` → Remove member

---

## 9. Plugin System

### 9.1. Plugin Architecture

**File:** `src/plugins/PluginSDK.ts`

**Features:**
- Plugin registration
- Sandboxed API access
- UI integration
- Settings panels

**Plugin Lifecycle:**
1. **Load** → Plugin code loaded
2. **Initialize** → Plugin SDK initialized
3. **Register** → Routes, sidebar items registered
4. **Render** → Plugin components rendered
5. **Unload** → Cleanup on uninstall

### 9.2. Plugin SDK

**API Access:**
- `api.get()` → GET requests
- `api.post()` → POST requests
- `api.put()` → PUT requests
- `api.delete()` → DELETE requests

**UI Integration:**
- `registerRoute()` → Add route
- `registerSidebarItem()` → Add sidebar item
- `registerSettingsPanel()` → Add settings panel
- `showToast()` → Show notifications

**Permissions:**
- Plugin declares required permissions
- Sandboxed API access
- Limited to declared endpoints

### 9.3. Plugin Loading

**Flow:**
1. Fetch plugins from API
2. Filter installed plugins
3. Load plugin code dynamically
4. Initialize PluginSDK
5. Register routes/sidebar items
6. Render plugin components

---

## 10. AI Integration

### 10.1. AI Coach System

**Endpoints:**
- `/api/ai/today` → Daily suggestions
- `/api/ai/weekly` → Weekly review suggestions
- `/api/ai/area` → Area-specific suggestions
- `/api/ai/chat` → Free-form chat

### 10.2. AI Context Building

**File:** `server/lib/ai.mjs`

**Context Includes:**
- User profile
- Current habits/tasks/goals
- Weekly review data
- Journal entries
- Life area scores

**Flow:**
```javascript
buildAiContext(userId, groupId)
  → Fetch user data
  → Fetch habits/tasks/goals
  → Fetch weekly review
  → Format context
  → Return context object
```

### 10.3. AI Response Processing

**Flow:**
1. Build context → Gather user data
2. Send to Gemini API → With context
3. Parse response → Extract JSON
4. Format suggestions → Convert to UI format
5. Return to client → Display in UI

**Response Format:**
- Structured JSON
- Suggestions as actionable items
- Can convert to habits/tasks/goals

### 10.4. AI Caching

**Strategy:**
- Cache AI responses
- Cache key based on context hash
- Invalidate on data changes
- Prevent duplicate requests

---

## 11. Data Flow Examples

### 11.1. Create Habit Flow

```
User clicks "Create Habit"
  ↓
Component calls createHabit()
  ↓
API Service: POST /api/habits
  ↓
Backend: createHabit() in habits.mjs
  ↓
Prisma: Create Habit record
  ↓
Return created habit
  ↓
React Query: Update cache
  ↓
Component re-renders with new habit
```

### 11.2. Load Habits Flow

```
Component mounts
  ↓
useModuleData hook called
  ↓
Check cache → If exists, return immediately
  ↓
If no cache → Show loading state
  ↓
API Service: GET /api/habits
  ↓
Backend: getHabits() in habits.mjs
  ↓
Prisma: Query habits with filters
  ↓
Return habits array
  ↓
Update cache
  ↓
Component re-renders with data
  ↓
Background refresh (if cache was used)
```

### 11.3. Toggle Habit Flow

```
User clicks habit checkbox
  ↓
Component calls toggleHabit()
  ↓
Optimistic update → Update UI immediately
  ↓
API Service: POST /api/habits/:id/toggle
  ↓
Backend: toggleHabitForDate() in habits.mjs
  ↓
Prisma: Update/create HabitLog
  ↓
Calculate streak
  ↓
Return updated log
  ↓
React Query: Invalidate habits cache
  ↓
Component refetches → Shows updated state
```

---

## 11. Logic Liên Kết Giữa Các Module

### 11.1. Kiến Trúc Liên Kết Tổng Thể

LifeOS được thiết kế như một **hệ sinh thái** các module kết nối với nhau thông qua các khái niệm chung:

```
                    ┌─────────────────┐
                    │   Dashboard     │  ← Tổng quan
                    └────────┬────────┘
                             │
        ┌───────────────────┼───────────────────┐
        │                     │                   │
        ↓                     ↓                   ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│     Today     │   │  Life Areas   │   │ Weekly Review │
│  (Daily Ops)  │   │  (Filtering)  │   │  (Reflection)  │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────┬───────┴───────┬───────────┘
                    │               │
        ┌───────────┼───────────────┼───────────┐
        │           │               │           │
        ↓           ↓               ↓           ↓
┌──────────┐ ┌──────────┐   ┌──────────┐ ┌──────────┐
│ Habits   │ │  Tasks   │   │  Goals   │ │ Journal  │
└──────────┘ └──────────┘   └──────────┘ └──────────┘
        │           │               │           │
        └───────────┴───────────────┴───────────┘
                    │
                    ↓
            ┌───────────────┐
            │ Wheel of Life │  ← Visualization
            └───────────────┘
```

### 11.2. Các Khái Niệm Kết Nối

#### **1. Life Area (Mảng Cuộc Sống)**

**Vai trò**: Trung tâm kết nối tất cả modules

**Kết nối:**
- **Habits** → `habit.area` → Filter theo area
- **Tasks** → `task.area` → Filter theo area
- **Goals** → `goal.area` → Filter theo area
- **Journal** → `journal.area` → Tag với area
- **Weekly Review** → `LifeAreaRating.area` → Chấm điểm từng area
- **Wheel of Life** → Hiển thị điểm số theo area

**Flow:**
```
User creates Habit/Task/Goal
  → Selects Life Area
  → Data stored with area field
  → Can filter by area in Dashboard/Area Dashboard
  → Weekly Review rates this area
  → Wheel of Life shows area score
```

#### **2. Week Concept (Khái Niệm Tuần)**

**Vai trò**: Kết nối daily operations với weekly reflection

**Kết nối:**
- **Habits** → `HabitLog.date` → Logs theo ngày, tổng hợp theo tuần
- **Tasks** → `task.dueDate` → Tasks trong tuần
- **Goals** → `goal.targetDate` → Goals trong tuần
- **Journal** → `journal.date` → Entries trong tuần
- **Weekly Review** → `review.periodLabel` → Review cho tuần cụ thể
- **Wheel of Life** → Hiển thị điểm số theo tuần

**Flow:**
```
Monday → Sunday (Week)
  → User performs Habits, completes Tasks, writes Journal
  → End of week: Create Weekly Review
  → Rate each Life Area (1-10)
  → View Wheel of Life for this week
  → Compare with previous week
  → Adjust Goals/Habits for next week
```

#### **3. Goal → Habit/Task Relationship**

**Vai trò**: Kết nối mục tiêu dài hạn với hành động cụ thể

**Kết nối:**
- **Goals** → `goal.id` → Linked to Habits/Tasks
- **Habits** → `habit.goalId` → Belongs to a Goal
- **Tasks** → `task.goalId` → Belongs to a Goal

**Flow:**
```
User creates Goal
  → Goal has target date, area, description
  → User creates Habits/Tasks linked to this Goal
  → Goal progress calculated from Habits/Tasks completion
  → When Habit/Task completed → Update Goal progress
  → When Goal completed → Celebrate achievement
```

**Logic tính toán:**
```typescript
Goal Progress = (Completed Habits + Completed Tasks) / (Total Habits + Total Tasks) * 100
```

#### **4. Journal → Weekly Review Connection**

**Vai trò**: Kết nối daily reflection với weekly reflection

**Kết nối:**
- **Journal** → `journal.pinned` → Pinned entries for Weekly Review
- **Weekly Review** → References pinned journal entries
- **AI Coach** → Uses journal entries for context

**Flow:**
```
User writes Journal entries during week
  → Some entries marked as "pinned"
  → End of week: Weekly Review page
  → Shows pinned journal entries
  → User writes Highlight, Lowlight, Lesson, Gratitude
  → Can reference journal entries
  → AI Coach analyzes journal entries for suggestions
```

### 11.3. Data Flow Giữa Các Module

#### **Flow 1: Dashboard → Today → Modules**

```
Dashboard (Overview)
  ↓ User clicks "Go to Today"
Today Page
  ↓ User interacts with Habits/Tasks/Journal
Habits/Tasks/Journal Modules
  ↓ Data updated
React Query Cache updated
  ↓ Cache invalidated
Dashboard automatically refreshes
```

#### **Flow 2: Weekly Review → Wheel of Life → Area Dashboard**

```
End of Week
  ↓ User navigates to Weekly Review
Weekly Review Page
  ↓ User rates Life Areas (1-10)
LifeAreaRating records created
  ↓ User navigates to Wheel of Life
Wheel of Life Page
  ↓ Shows radar chart with area scores
User clicks on an Area
  ↓ Navigates to Area Dashboard
Area Dashboard
  ↓ Shows Habits/Tasks/Goals/Journal filtered by area
```

#### **Flow 3: AI Coach Integration**

```
User opens AI Coach Sidebar
  ↓ AI Coach requests context
Backend: buildAiContext()
  ↓ Fetches:
    - Current Habits/Tasks/Goals
    - Weekly Review data
    - Journal entries
    - Life Area scores
  ↓ Sends to Gemini API
AI returns suggestions
  ↓ Suggestions displayed
User can convert to Habits/Tasks/Goals
  ↓ Creates new records
Modules updated
```

### 11.4. Cache & State Sharing

#### **React Query Cache**

Tất cả modules chia sẻ cùng một **React Query cache**:

```typescript
// Habits cache
useHabitsQuery({ active: true, groupId })

// Tasks cache  
useTasksQuery('today', groupId)

// Goals cache
useGoalsQuery({ active: true, groupId })

// Journal cache
useJournalQuery({ startDate, endDate }, groupId)

// Wheel of Life cache
useWheelOfLifeQuery(weeks, groupId)
```

**Khi một module update data:**
- Cache được invalidate
- Các modules khác tự động refetch
- UI cập nhật đồng bộ

#### **Workspace Context**

Tất cả modules chia sẻ **Workspace Context**:

```typescript
const { workspace } = useWorkspace();
// workspace.groupId → Used in all queries
// workspace.mode → 'personal' | 'group'
```

**Khi workspace thay đổi:**
- Tất cả queries tự động refetch với groupId mới
- UI hiển thị data của workspace mới

### 11.5. Module Dependencies

#### **Dashboard Dependencies**

Dashboard phụ thuộc vào:
- Habits (for today's habits count)
- Tasks (for today's tasks count)
- Journal (for today's journal entries)
- Wheel of Life (for visualization)

**Khi load Dashboard:**
```typescript
// Parallel queries
const habits = useHabitsQuery({ active: true, groupId });
const tasks = useTasksQuery('today', groupId);
const journals = useJournalQuery({ startDate: today, endDate: today }, groupId);
const wheel = useWheelOfLifeQuery(8, groupId);
```

#### **Today Page Dependencies**

Today page phụ thuộc vào:
- Habits (for today's habits)
- Tasks (for today's tasks)
- Weekly Review (for weekly context)
- AI Coach (for today's suggestions)

#### **Area Dashboard Dependencies**

Area Dashboard phụ thuộc vào:
- Habits (filtered by area)
- Tasks (filtered by area)
- Goals (filtered by area)
- Journal (filtered by area)
- Weekly Review (for area score)

### 11.6. Event-Driven Updates

#### **Khi Habit được toggle:**

```
User toggles Habit
  ↓
POST /api/habits/:id/toggle
  ↓
Backend updates HabitLog
  ↓
React Query invalidates 'habits' cache
  ↓
All components using useHabitsQuery() refetch
  ↓
Dashboard, Today, Area Dashboard update
```

#### **Khi Task được complete:**

```
User completes Task
  ↓
PATCH /api/tasks/:id
  ↓
Backend updates Task status
  ↓
If Task linked to Goal → Update Goal progress
  ↓
React Query invalidates 'tasks' and 'goals' cache
  ↓
All components refetch
```

#### **Khi Weekly Review được submit:**

```
User submits Weekly Review
  ↓
POST /api/weekly-review
  ↓
Backend creates WeeklyReview + LifeAreaRating records
  ↓
React Query invalidates 'weekly-review' and 'wheel-of-life' cache
  ↓
Wheel of Life page updates
  ↓
AI Coach context updated
```

### 11.7. Cross-Module Features

#### **Quick Add**

Quick Add component có thể tạo:
- Habit → Creates Habit record
- Task → Creates Task record
- Goal → Creates Goal record
- Journal → Creates JournalEntry record

**Shared logic:**
- Same form validation
- Same API client
- Same error handling
- Same success feedback

#### **Search & Filter**

Tất cả modules hỗ trợ:
- Filter by Life Area
- Filter by date range
- Search by name/title
- Sort by various fields

**Shared components:**
- `FilterBar` component
- `SearchInput` component
- `DateRangePicker` component

#### **History Pages**

Tất cả modules có History page:
- Habits History → Shows all habits (including archived)
- Tasks History → Shows all tasks (including completed)
- Goals History → Shows all goals (including completed)
- Journal History → Shows all journal entries

**Shared pattern:**
- Same layout
- Same filtering logic
- Same pagination
- Same date navigation

### 11.8. Plugin System Integration

Plugins có thể:
- Register routes → Appears in navigation
- Register sidebar items → Appears in sidebar
- Access API → Through PluginSDK
- Access data → Through PluginSDK hooks

**Integration points:**
- Plugin routes rendered in App.tsx
- Plugin sidebar items rendered in Sidebar.tsx
- Plugin API calls go through same API client
- Plugin data cached in same React Query cache

### 11.9. Tóm Tắt Logic Liên Kết

**Các điểm kết nối chính:**

1. **Life Area** → Kết nối tất cả modules qua filtering
2. **Week Concept** → Kết nối daily operations với weekly reflection
3. **Goal → Habit/Task** → Kết nối mục tiêu với hành động
4. **Journal → Weekly Review** → Kết nối daily reflection với weekly reflection
5. **React Query Cache** → Chia sẻ state giữa các modules
6. **Workspace Context** → Chia sẻ workspace context
7. **Event-Driven Updates** → Tự động sync khi data thay đổi

**Nguyên tắc thiết kế:**

- **Separation of Concerns**: Mỗi module độc lập, nhưng kết nối qua shared concepts
- **Single Source of Truth**: React Query cache là nguồn dữ liệu duy nhất
- **Reactive Updates**: Khi data thay đổi, UI tự động cập nhật
- **Consistent Patterns**: Tất cả modules follow cùng patterns
- **Shared Components**: UI components được reuse giữa modules

---

## 12. Error Handling

### 12.1. Frontend Error Handling

**Pattern:**
- Try-catch blocks
- Error boundaries
- User-friendly error messages
- Fallback to cache on error

**Error States:**
- `error` → Error object
- `status: 'error'` → Error status
- Display error message to user

### 12.2. Backend Error Handling

**Pattern:**
- Try-catch in route handlers
- Consistent error format
- Status codes
- Error logging

**Error Format:**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### 12.3. Network Error Handling

**Strategy:**
- Retry logic (exponential backoff)
- Offline detection
- Fallback to cache
- User notification

---

## 13. Testing & Debugging

### 13.1. Debugging Tools

**Console Logging:**
- `[App]` → App-level logs
- `[API]` → API request logs
- `[Cache]` → Cache operation logs
- `[Plugin]` → Plugin logs

**React DevTools:**
- Inspect component state
- View React Query cache
- Monitor re-renders

### 13.2. Common Issues

**Cache Issues:**
- Stale data → Clear cache
- Missing data → Check cache keys
- Duplicate requests → Check deduplication

**Auth Issues:**
- 401 errors → Check session
- Missing userId → Check auth middleware
- Missing groupId → Check workspace context

**Performance Issues:**
- Too many requests → Check prefetching
- Slow loading → Check code splitting
- Memory leaks → Check cache cleanup

---

## 14. Best Practices

### 14.1. Code Organization

- **Separation of concerns** → UI, logic, data separate
- **Reusable components** → Shared components
- **Type safety** → TypeScript types
- **Consistent patterns** → Follow established patterns

### 14.2. Performance

- **Cache-first** → Show cached data immediately
- **Lazy loading** → Code splitting
- **Request deduplication** → Prevent duplicates
- **Prefetching** → Load likely next data

### 14.3. Error Handling

- **Graceful degradation** → Fallback to cache
- **User-friendly messages** → Clear error messages
- **Error boundaries** → Prevent crashes
- **Logging** → Debug information

---

## 15. Future Improvements

### 15.1. Planned Features

- **Offline support** → IndexedDB sync
- **Real-time updates** → WebSocket/SSE
- **Advanced analytics** → More insights
- **Mobile app** → React Native

### 15.2. Performance Improvements

- **Service Worker** → Offline caching
- **Virtual scrolling** → Large lists
- **Image optimization** → Lazy loading
- **Bundle optimization** → Tree shaking

---

## 📝 Notes

- This document is maintained alongside code changes
- Update when adding new features or changing logic
- Refer to specific files for implementation details
- Check git history for change tracking

---

**Last Updated:** 2025-01-XX  
**Version:** 1.1.0

**Changelog:**
- Added section "Linh Hồn Của Ứng Dụng" - Core philosophy and design principles
- Added section "Logic Liên Kết Giữa Các Module" - Detailed explanation of how modules connect

