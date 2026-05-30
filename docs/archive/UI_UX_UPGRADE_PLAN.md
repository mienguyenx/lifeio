# LifeOS UI/UX Complete Overhaul Plan

> **Mục tiêu**: Nâng cấp toàn diện UI/UX cho cả web và mobile, đặc biệt tối ưu trải nghiệm mobile-first.
> **Phương châm**: Mobile-first → Responsive Desktop. Mỗi thao tác trên mobile tối đa 2 tap.

---

## 1. PHÂN TÍCH HIỆN TRẠNG

### Vấn đề Mobile hiện tại:
| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Bottom nav chỉ hiện 4 item, còn lại ẩn trong "More" drawer → quá nhiều tap | **Cao** |
| 2 | Các page desktop-first, mobile chỉ co lại responsive → không tối ưu UX | **Cao** |
| 3 | Không có swipe gesture (swipe hoàn thành habit, xóa task, chuyển tab) | **Cao** |
| 4 | FAB (AI Coach) chồng lên vùng bottom nav, dễ nhấn nhầm | **Trung bình** |
| 5 | Form/Modal không tối ưu cho mobile keyboard | **Trung bình** |
| 6 | Không có pull-to-refresh | **Trung bình** |
| 7 | Không có transition/animation giữa các trang | **Thấp** |
| 8 | PWA đang disabled → không install được lên home screen | **Cao** |
| 9 | Không có haptic feedback | **Thấp** |
| 10 | Page file quá lớn (65KB+) → load chậm, khó maintain | **Trung bình** |

### Vấn đề Desktop:
| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Sidebar quá đơn giản, không có quick actions | **Trung bình** |
| 2 | Header không tận dụng tốt không gian | **Thấp** |
| 3 | Dashboard layout cứng nhắc, không customizable | **Trung bình** |

---

## 2. CHIẾN LƯỢC TỔNG THỂ

### Quyết định kiến trúc:
- **Giữ web app (Vite + React)** làm platform chính cho cả mobile (PWA) và desktop
- **Bỏ Expo mobile app** riêng biệt → tập trung 1 codebase duy nhất
- **PWA** → install trên home screen, hoạt động như native app
- **Mobile-first design** → thiết kế mobile trước, scale lên desktop

### Design System mới:
```
Font:        Inter (giữ nguyên - tốt cho cả 2 nền)
Icon:        Lucide (giữ nguyên)
Color:       Giữ HSL system, thêm semantic tokens
Spacing:     4px grid system
Border:      Rounded-2xl cho mobile, rounded-xl cho desktop
Shadow:      Elevation system (sm/md/lg/xl)
Motion:      Framer Motion cho page transitions + micro-interactions
```

---

## 3. MOBILE UI/UX REDESIGN (Ưu tiên #1)

### Phase 1: Navigation Overhaul (Tuần 1-2)

#### 3.1. Bottom Navigation mới - 5 Tab chính
```
┌─────────────────────────────────────────┐
│  Today  │ Habits │  [+]  │ Tasks │ More │
│   🏠    │  🎯   │  ➕   │  ✅  │  ••• │
└─────────────────────────────────────────┘
```
- **5 tab** thay vì 4 + More (Journal gộp vào More)
- **Tab giữa là FAB "+"** → Quick Add (Task/Habit/Journal/Note)
- **More** → Full-screen menu grid thay vì drawer nhỏ
- Active tab có pill indicator + subtle scale animation
- Badge notification trên tab (giữ hiện tại, optimize)

#### 3.2. Quick Add Modal (thay FAB hiện tại)
```
┌──────────────────────────┐
│     Thêm nhanh           │
│                          │
│  📋 Task    🎯 Habit     │
│  📝 Journal 📒 Note      │
│  ⏱️ Pomodoro             │
│                          │
│     [Hủy]                │
└──────────────────────────┘
```
- Bottom sheet style (Vaul drawer)
- 1 tap để mở, 1 tap để chọn loại, ngay lập tức focus vào input

#### 3.3. AI Coach → Inline thay vì FAB
- Xóa FloatingActionButton overlay
- AI Coach trở thành 1 tab trong "More" menu
- Hoặc: Swipe từ cạnh phải để mở AI panel

#### 3.4. Full-screen "More" Menu
```
┌──────────────────────────────┐
│ ← Menu                      │
│                              │
│ 📊 Dashboard    📝 Journal   │
│ 🧭 Goals        📅 Review    │
│ 🎡 Life Wheel   🤖 AI Coach  │
│                              │
│ ──── Lĩnh vực ────          │
│ ❤️ Sức khỏe    💰 Tài chính  │
│ 📚 Học tập     👥 Quan hệ    │
│                              │
│ ──── Khác ────              │
│ 📒 Notes  🗑️ Trash  ⚙️ Cài đặt│
│                              │
│ 👤 Mien • v1.0              │
└──────────────────────────────┘
```
- Grid layout 2 cột
- Grouped by section
- User profile at bottom
- Full screen overlay with slide-up animation

### Phase 2: Page-level Mobile Redesign (Tuần 2-4)

#### 3.5. Today Page → "Home Screen" concept
```
┌──────────────────────────┐
│ Xin chào, Mien! 👋       │
│ Thứ Hai, 28/04/2025      │
│                          │
│ ┌──────────────────────┐ │
│ │ 💬 "Quote of the day"│ │
│ └──────────────────────┘ │
│                          │
│ ┌─── Quick Stats ──────┐ │
│ │ ✅ 3/7  🎯 5/8  ⏱️ 2 │ │
│ │ Tasks  Habits  Focus │ │
│ └──────────────────────┘ │
│                          │
│ 📋 Tasks hôm nay         │
│ ┌──────────────────────┐ │
│ │ ☐ Design UI mockup   │←→ swipe right = done
│ │ ☐ Review code         │←→ swipe left = postpone
│ └──────────────────────┘ │
│                          │
│ 🎯 Habits hôm nay        │
│ ┌────┐┌────┐┌────┐┌────┐│
│ │ 💧 ││ 📚 ││ 🏃 ││ 🧘 ││
│ │Done││3/7 ││ -- ││ -- ││  ← tap to toggle
│ └────┘└────┘└────┘└────┘│
│                          │
│ 📝 Quick Journal          │
│ ┌──────────────────────┐ │
│ │ Hôm nay tôi cảm thấy│ │
│ │ 😊 😐 😢 😤 🤩       │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

**Key mobile UX patterns:**
- **Swipe-to-complete** trên task items
- **Tap-to-toggle** habits (grid of circles)
- **Quick mood entry** cho journal
- **Horizontal scroll** cho habit grid nếu nhiều
- **Pull-to-refresh** để sync data

#### 3.6. Habits Page → Card-based với swipe
```
┌──────────────────────────┐
│ Habits          [Filter ▼]│
│                          │
│ Hôm nay: 5/8 ██████░░   │
│ Streak: 🔥 12 ngày       │
│                          │
│ ┌──────────────────────┐ │
│ │ 💧 Uống 2L nước      │ │
│ │ ████████████░░ 6/7    │←→ swipe = details
│ │ 🔥 12 ngày streak     │ │
│ │        [✓ Hoàn thành] │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 📚 Đọc sách 15p      │ │
│ │ ██████░░░░░░ 3/7      │ │
│ │         [✓ Hoàn thành]│ │
│ └──────────────────────┘ │
└──────────────────────────┘
```
- Card layout thay vì table/list
- Inline progress bar
- Large touch targets (48px+)
- Swipe right → mark complete
- Swipe left → skip/postpone
- Long press → edit

#### 3.7. Tasks Page → Kanban hoặc List với swipe
```
┌──────────────────────────┐
│ Tasks    [+ Add] [Filter]│
│                          │
│ [Tất cả] [Hôm nay] [Tuần]│  ← horizontal tabs
│                          │
│ Ưu tiên cao (3)         │
│ ┌──────────────────────┐ │
│ │ 🔴 Design mockup      │←→ swipe actions
│ │    Due: Hôm nay        │ │
│ └──────────────────────┘ │
│                          │
│ Đang làm (2)            │
│ ┌──────────────────────┐ │
│ │ 🟡 Review PR #42      │ │
│ │    Due: 29/04          │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

#### 3.8. Tất cả Form/Modal → Bottom Sheet
- Mọi form tạo mới → Bottom sheet (Vaul)
- Auto-focus input khi mở
- Keyboard-aware (tự adjust khi keyboard mở)
- Swipe down to dismiss
- Step-by-step wizard cho form phức tạp (Goals)

### Phase 3: Gesture & Interaction (Tuần 3-5)

#### 3.9. Gesture System
| Gesture | Action |
|---------|--------|
| Swipe right trên item | Complete/Check |
| Swipe left trên item | Delete/Archive/Postpone |
| Long press | Context menu (Edit/Delete/Move) |
| Pull down | Refresh data + sync |
| Swipe between tabs | Navigate tab views |
| Pinch on Life Wheel | Zoom in/out |
| Double tap habit | Quick complete |

#### 3.10. Micro-interactions & Feedback
- **Haptic**: vibrate nhẹ khi complete task/habit
- **Sound**: subtle "ding" khi complete (optional, toggle in settings)
- **Animation**: 
  - Checkmark animation khi complete
  - Confetti khi đạt streak milestone
  - Number counter animation cho stats
  - Page transition: slide left/right
- **Skeleton loading**: thay vì spinner

### Phase 4: PWA Enhancement (Tuần 4-5)

#### 3.11. Enable & Optimize PWA
- Re-enable Service Worker
- Implement offline-first strategy:
  - Cache shell (HTML/CSS/JS) → stale-while-revalidate
  - Cache API responses → IndexedDB (đã có `idb`)
  - Queue mutations khi offline → sync khi online
- Add install prompt banner
- Splash screen cho PWA
- Push notifications (via Supabase Edge Functions)

#### 3.12. Mobile-specific PWA features
- `standalone` display mode
- Custom splash screen per device
- Status bar theming (dark/light)
- Safe area padding (notch devices)
- Disable pull-to-refresh browser default (use custom)

---

## 4. DESKTOP UI REDESIGN

### Phase 5: Desktop Layout (Tuần 5-6)

#### 4.1. Sidebar Redesign
```
┌─────────────────────────────────────────────────┐
│ [L] LifeOS            [🔍] [🔔] [👤]           │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ 🏠 Today │  [Main Content Area]                 │
│ 📊 Dash  │                                      │
│          │                                      │
│ ── Năng suất ──│                                │
│ ✅ Tasks │                                      │
│ 🎯 Habits│                                      │
│ 🧭 Goals │                                      │
│          │                                      │
│ ── Phản chiếu ──│                               │
│ 📝 Journal│                                     │
│ 📅 Review│                                      │
│          │                                      │
│ ── Tổng quan ──│                                │
│ 🎡 Wheel │                                      │
│ ❤️ Health│                                      │
│ 💰 Finance│                                     │
│ 📚 Learn │                                      │
│ 👥 Social│                                      │
│          │                                      │
│ ─────────│                                      │
│ 📒 Notes │                                      │
│ 🗑️ Trash │                                      │
│          │                                      │
│ ─────────│                                      │
│ ⚙️ Settings│                                    │
│ 🤖 AI Coach (floating panel)                    │
│          │                                      │
│ v1.0 • Synced ✓│                                │
└──────────┴──────────────────────────────────────┘
```

#### 4.2. Command Palette (Cmd+K)
- Tìm kiếm global: tasks, habits, goals, notes, journal
- Quick actions: "Add task", "Start pomodoro", "Log mood"
- Navigate: "Go to Habits", "Go to Goals"
- Dùng `cmdk` library (đã có trong dependencies)

#### 4.3. Split View cho Desktop
- Dashboard: Multi-column grid (đã có, cải tiến)
- Tasks: List + Detail panel
- Goals: Timeline view + Detail
- Journal: Calendar + Editor side by side

---

## 5. DESIGN SYSTEM UPGRADE

### Phase 6: Visual Refresh (Song song với các phase khác)

#### 5.1. Color System Update
```css
/* Thêm semantic color tokens */
--surface-1: /* card background */
--surface-2: /* elevated card */
--surface-3: /* modal/dialog */
--text-primary: /* main text */
--text-secondary: /* muted text */
--text-tertiary: /* placeholder */
--interactive: /* buttons, links */
--interactive-hover:
--success-soft: /* light green bg */
--warning-soft: /* light amber bg */
--danger-soft: /* light red bg */
```

#### 5.2. Typography Scale
```
Heading 1: 24px/32px bold   (page titles)
Heading 2: 20px/28px semi   (section titles)
Heading 3: 16px/24px semi   (card titles)
Body:      14px/20px regular (content)
Caption:   12px/16px medium  (labels, badges)
Micro:     10px/14px medium  (timestamps)
```

#### 5.3. Component Upgrades
| Component | Hiện tại | Mới |
|-----------|----------|-----|
| Cards | Flat, basic shadow | Glass morphism option, elevation levels |
| Buttons | Standard shadcn | + Loading states, + icon-only variants tối ưu touch |
| Inputs | Standard | + Floating labels, + clear button, + character count |
| Lists | Basic | + Swipeable, + drag-to-reorder, + skeleton |
| Modals | Dialog center | Bottom sheet (mobile) / Dialog (desktop) |
| Tabs | Standard | + Animated indicator, + swipeable panels |
| Charts | Recharts basic | + Animated entries, + touch-friendly tooltips |
| Toast | Sonner basic | + Action buttons, + undo support |

#### 5.4. New Components cần build
- `SwipeableListItem` - swipe actions for list items
- `BottomSheet` - adaptive modal (sheet on mobile, dialog on desktop)
- `PullToRefresh` - custom pull-to-refresh
- `AnimatedCounter` - number animations
- `SkeletonPage` - page-level skeleton loading
- `AdaptiveModal` - auto bottom-sheet on mobile, center dialog on desktop
- `GestureHandler` - wrapper for swipe/long-press
- `QuickAddFAB` - center FAB with radial menu
- `CommandPalette` - Cmd+K search (leverage existing cmdk)
- `PageTransition` - animated route transitions

---

## 6. TECHNICAL IMPLEMENTATION

### 6.1. Thêm Dependencies
```json
{
  "framer-motion": "^11.x",       // Page transitions + animations
  "@use-gesture/react": "^10.x",  // Gesture handling (swipe, pinch, drag)
  "react-spring": "^9.x",         // Physics-based animations (optional, framer-motion may suffice)
  "workbox-webpack-plugin": "^7.x" // PWA service worker
}
```
> Đã có: vaul (bottom sheet), cmdk (command palette), embla-carousel, dnd-kit, react-day-picker

### 6.2. Cấu trúc code mới
```
src/
├── components/
│   ├── ui/              # shadcn/ui (giữ nguyên)
│   ├── layout/
│   │   ├── AppLayout.tsx         # Adaptive layout wrapper
│   │   ├── MobileLayout.tsx      # Mobile-specific layout
│   │   ├── DesktopLayout.tsx     # Desktop-specific layout  
│   │   ├── BottomNav.tsx         # Redesigned 5-tab nav
│   │   ├── QuickAddSheet.tsx     # Center FAB quick add
│   │   ├── FullScreenMenu.tsx    # Mobile "More" menu
│   │   ├── AppSidebar.tsx        # Desktop sidebar (improved)
│   │   ├── CommandPalette.tsx    # Cmd+K search
│   │   └── PageTransition.tsx    # Route animation wrapper
│   ├── mobile/
│   │   ├── SwipeableListItem.tsx
│   │   ├── PullToRefresh.tsx
│   │   ├── AdaptiveModal.tsx     # Bottom sheet on mobile
│   │   ├── HabitGrid.tsx         # Tap-to-toggle habit circles
│   │   └── MobileHeader.tsx      # Compact mobile header
│   ├── shared/
│   │   ├── AnimatedCounter.tsx
│   │   ├── SkeletonPage.tsx
│   │   └── EmptyState.tsx
│   └── [module]/         # habits/, tasks/, etc. (giữ structure)
├── hooks/
│   ├── useSwipeAction.ts
│   ├── usePullToRefresh.ts
│   ├── useHaptic.ts
│   ├── useAdaptiveLayout.ts      # Replace useIsMobile
│   └── usePageTransition.ts
└── styles/
    └── design-tokens.css          # CSS custom properties
```

### 6.3. Performance Optimizations
- **Code splitting**: React.lazy() cho mỗi page
- **Virtual lists**: cho Tasks, Habits list dài (react-window hoặc @tanstack/virtual)
- **Image lazy loading**: IntersectionObserver
- **Prefetch**: prefetch data cho page tiếp theo khi hover nav
- **Memoization**: React.memo cho list items, useMemo cho computed data

---

## 7. MIGRATION PLAN (Roadmap)

### Sprint 1 (Tuần 1-2): Foundation
- [ ] Thêm framer-motion, @use-gesture/react
- [ ] Tạo design tokens CSS mới
- [ ] Build `PageTransition` wrapper
- [ ] Build `AdaptiveModal` component (bottom sheet mobile / dialog desktop)
- [ ] Build `SwipeableListItem` component
- [ ] Redesign `BottomNav` → 5 tabs + center FAB
- [ ] Build `QuickAddSheet` (Quick Add bottom sheet)
- [ ] Build `FullScreenMenu` (thay More drawer)
- [ ] Remove `FloatingActionButton` (AI Coach → trong menu)

### Sprint 2 (Tuần 2-3): Core Pages Mobile
- [ ] Redesign `TodayPage` mobile layout (Home Screen concept)
- [ ] Redesign `HabitsPage` mobile (card-based, tap-to-toggle grid)
- [ ] Redesign `TasksPage` mobile (swipeable list, filter tabs)
- [ ] Redesign `JournalPage` mobile (quick mood entry, compact cards)
- [ ] Add pull-to-refresh to all pages

### Sprint 3 (Tuần 3-4): Remaining Pages + Desktop
- [ ] Redesign `GoalsPage` mobile (timeline cards)
- [ ] Redesign `DashboardPage` (compact stats, scrollable)
- [ ] Redesign remaining pages mobile (Health, Finance, Learning, etc.)
- [ ] Desktop: Build `CommandPalette` (Cmd+K)
- [ ] Desktop: Improve sidebar with quick actions
- [ ] Desktop: Split view for Tasks, Journal

### Sprint 4 (Tuần 4-5): PWA + Polish
- [ ] Re-enable Service Worker with Workbox
- [ ] Implement offline queue for mutations
- [ ] Add install prompt banner
- [ ] Add haptic feedback (navigator.vibrate)
- [ ] Add micro-animations (checkmark, confetti, counters)
- [ ] Skeleton loading for all pages
- [ ] Performance audit + code splitting

### Sprint 5 (Tuần 5-6): Testing & Refinement
- [ ] Cross-browser testing (Chrome, Safari, Firefox mobile)
- [ ] PWA testing on iOS Safari + Android Chrome
- [ ] Performance benchmarking (Lighthouse)
- [ ] Accessibility audit (screen reader, contrast)
- [ ] User testing & iteration
- [ ] Deploy to production

---

## 8. KPI / METRICS ĐO LƯỜNG

| Metric | Hiện tại (ước tính) | Mục tiêu |
|--------|---------------------|----------|
| Lighthouse Performance (Mobile) | ~60 | >90 |
| Lighthouse PWA | 0 (disabled) | >95 |
| Time to Interactive (Mobile) | ~4s | <2s |
| Số tap để hoàn thành habit | 3-4 | 1 (tap toggle) |
| Số tap để thêm task | 3-4 | 2 (FAB → input) |
| First Contentful Paint | ~2s | <1s |
| Bundle size | Unknown | <500KB gzipped |

---

## 9. RISK & MITIGATION

| Risk | Mitigation |
|------|-----------|
| Breaking existing features | Incremental migration, feature flags |
| Performance regression | Lighthouse CI checks, bundle analyzer |
| PWA caching issues | Versioned cache, skip-waiting strategy |
| iOS Safari quirks | Dedicated testing, polyfills |
| Large refactor scope | Sprint-based delivery, each sprint deployable |

---

## TÓM TẮT QUYẾT ĐỊNH QUAN TRỌNG

1. **Bỏ Expo mobile app** → Focus 100% vào PWA web app
2. **Mobile-first redesign** → Thiết kế mobile trước, responsive lên desktop
3. **Bottom nav 5 tab** với center Quick Add FAB
4. **Swipe gestures** cho tất cả list items
5. **Bottom sheet** thay dialog cho mọi form trên mobile
6. **Re-enable PWA** với offline-first strategy
7. **Framer Motion** cho page transitions + micro-interactions
8. **Command Palette** (Cmd+K) cho desktop power users
9. **Incremental migration** → không rewrite toàn bộ cùng lúc
