# LifeOS — Kế hoạch nâng cấp giao diện V2

> Phân tích toàn diện từng module & chức năng trên cả **Web** (Vite + React + Tailwind + shadcn/ui) và **Mobile** (Expo + React Native).
> Trạng thái: ✅ Đã xong | 🔧 Cần nâng cấp | ❌ Chưa làm

---

## Tổng quan hệ thống

| Platform | Stack | Thư mục |
|----------|-------|---------|
| Web | Vite + React + Tailwind + shadcn/ui + react-router | `remix-of-remix-of-lifeos-mobile-v3.copy/src/` |
| Mobile | Expo Router + React Native + Zustand | `mobile/app/` |

---

## Phase 1 — Core Screens (Dùng hàng ngày) — 2 tuần

### 1.1 Today Page (Trang chủ)
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Summary card (progress ring + greeting) | 🔧 Có nhưng basic | ✅ Sprint 2 |
| Quick actions strip | 🔧 Chưa tối ưu mobile | ✅ Sprint 2 |
| Swipe-to-complete tasks/habits | ❌ Dùng click | ✅ Sprint 2 |
| Collapsible sections | 🔧 Basic | ✅ Sprint 2 |
| Daily intention | ✅ | ✅ |
| Bottom sheet forms (thay Dialog) | ❌ Dùng Dialog | ✅ |
| **Skeleton loading** | ❌ | ❌ |
| **Animated transitions** | ❌ | ❌ |
| **Pull-to-refresh** | N/A | ✅ |

**Web cần làm:**
- [ ] Responsive card layout (1 col mobile, 2 col tablet, 3 col desktop)
- [ ] Sheet form thay Dialog trên mobile viewport
- [ ] Progress ring animation (CSS/framer-motion)
- [ ] Skeleton loading states
- [ ] Drag-to-reorder tasks/habits (DnD)

---

### 1.2 Habits Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Ultra-compact row | 🔧 Có compact/standard | ✅ Sprint 3 |
| Swipe actions (complete/skip/delete) | 🔧 SwipeableCard basic | ✅ Sprint 3 |
| Streak dashboard | 🔧 Sidebar analytics | ✅ Sprint 3 |
| Bottom sheet filter/sort | ❌ Inline filters | ✅ Sprint 3 |
| Quick add bottom sheet | ❌ Dialog | ✅ Sprint 3 |
| FAB + long-press | N/A | ✅ Sprint 3 |
| **Habit heatmap (GitHub-style)** | ❌ | ❌ |
| **Group by time (Sáng/Chiều/Tối)** | ❌ | ❌ |
| **Bulk actions (multi-select)** | ❌ | ❌ |
| **Habit templates** | ❌ | ❌ |

**Web cần làm:**
- [ ] Mobile-responsive: list view thay cards trên viewport nhỏ
- [ ] Sheet filter trên mobile viewport
- [ ] Habit heatmap component (7x52 grid)
- [ ] Smooth check animation (Lottie/CSS)

---

### 1.3 Tasks Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Grouped SectionList (Overdue/Today/Upcoming) | 🔧 Có tabs | ✅ Sprint 3 |
| Swipe actions | 🔧 SwipeableCard | ✅ Sprint 3 |
| Quick add bottom sheet | ❌ Dialog | ✅ Sprint 3 |
| Quick stats badges | 🔧 ProductivityStats sidebar | ✅ Sprint 3 |
| Kanban view | ✅ Desktop DnD | ❌ Không cần |
| Calendar view | ✅ | ❌ |
| **Subtask progress bar** | 🔧 | 🔧 |
| **Priority color coding** | ✅ | ✅ |
| **Due date relative display** | ✅ | ✅ |
| **Recurring tasks** | ❌ | ❌ |

**Web cần làm:**
- [ ] Inline edit (click-to-edit title/date)
- [ ] Batch actions toolbar (multi-select)
- [ ] Better Kanban columns on mobile (horizontal scroll)

---

## Phase 2 — Tracking & Journaling — 2 tuần

### 2.1 Goals Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Visual progress rings | 🔧 Progress bar | ✅ Sprint 4 |
| Quick update slider | ❌ | ✅ Sprint 4 |
| Swipe actions | 🔧 | ✅ Sprint 4 |
| Milestone tracking | ✅ | 🔧 Basic |
| **Linked habits/tasks** | 🔧 | ❌ |
| **Goal timeline visualization** | ❌ | ❌ |
| **OKR-style Key Results** | ❌ | ❌ |

**Web cần làm:**
- [ ] Progress ring component (SVG animated)
- [ ] Goal detail page with linked items
- [ ] Timeline/Gantt view for milestones

**Mobile cần làm:**
- [ ] Milestone list inside goal detail
- [ ] Linked habits/tasks display

---

### 2.2 Journal Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Mood trend visualization | 🔧 Basic | ✅ Sprint 4 |
| Swipe-to-delete | ❌ | ✅ Sprint 4 |
| 3-column stats | 🔧 | ✅ Sprint 4 |
| Mood pills with colors | 🔧 | ✅ Sprint 4 |
| **Full-screen write mode** | ❌ | ❌ |
| **Prompt/template picker** | ❌ | ❌ |
| **Rich text editor** | ❌ | ❌ |
| **Photo attachments** | ❌ | ❌ |
| **Mood analytics chart** | ❌ | ❌ |

**Cần làm cả 2:**
- [ ] Full-screen write mode (distraction-free)
- [ ] Journal prompts carousel
- [ ] Mood chart (line chart 30 ngày)
- [ ] Photo/image attachments

---

### 2.3 Notes Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| SwipeableRow (pin/fav/delete) | ❌ Click | ✅ Sprint 4 |
| Filter tabs | 🔧 | ✅ Sprint 4 |
| Search | ✅ | ✅ |
| FAB | N/A | ✅ |
| **Markdown preview** | ❌ | ❌ |
| **Note folders/tags** | ❌ | ❌ |
| **Full-screen editor** | 🔧 | ❌ |

**Cần làm:**
- [ ] Web: Responsive 2-panel (list + editor) on desktop, full screen on mobile
- [ ] Mobile: Full-screen rich editor
- [ ] Markdown support with live preview
- [ ] Note tagging system

---

## Phase 3 — Analytics & Review — 1.5 tuần

### 3.1 Dashboard Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Period toggle (today/week/month) | 🔧 Basic | ✅ Sprint 5 |
| Widget grid cards | 🔧 | ✅ Sprint 5 |
| Deep links to modules | 🔧 | ✅ Sprint 5 |
| Overall score ring | ❌ | ✅ Sprint 5 |
| **Interactive charts** | ❌ | ❌ |
| **Customizable widget order** | ❌ | ❌ |
| **Streak overview** | ❌ | ❌ |

**Web cần làm:**
- [ ] Dashboard widget grid (drag-to-reorder)
- [ ] Recharts/Chart.js interactive charts
- [ ] Period comparison (this week vs last week)
- [ ] Export dashboard as PDF/image

---

### 3.2 Health Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Daily summary card | 🔧 | ✅ Sprint 5 |
| Trend arrows | ❌ | ✅ Sprint 5 |
| SwipeableRow history | ❌ | ✅ Sprint 5 |
| Quick log grid | ✅ | ✅ |
| **Charts (weight, sleep, water)** | 🔧 | ❌ |
| **Health score algorithm** | ❌ | ❌ |
| **Apple Health/Google Fit sync** | ❌ | ❌ |

**Cần làm:**
- [ ] Web: Line charts for each metric (30-day trend)
- [ ] Mobile: Mini sparkline charts inline
- [ ] Health score calculation
- [ ] BMI calculator widget

---

### 3.3 Finance Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Monthly balance card | 🔧 | ✅ Sprint 5 |
| Category breakdown | 🔧 | ✅ Sprint 5 |
| SwipeableRow transactions | ❌ | ✅ Sprint 5 |
| **Pie/Donut chart** | ❌ | ❌ |
| **Budget limits per category** | ❌ | ❌ |
| **Recurring transactions** | ❌ | ❌ |
| **Monthly comparison** | ❌ | ❌ |

**Cần làm:**
- [ ] Donut chart cho category breakdown
- [ ] Budget bar per category (spent vs limit)
- [ ] Monthly trend line chart
- [ ] Export CSV

---

### 3.4 Weekly Review Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Multi-step wizard | 🔧 Long form | ✅ Sprint 6 |
| Emoji rating selector | ❌ | ✅ Sprint 6 |
| Step progress bar | ❌ | ✅ Sprint 6 |
| Past reviews with rating | ✅ | ✅ Sprint 6 |
| **Auto-populated stats** | 🔧 | 🔧 |
| **Week-over-week comparison** | ❌ | ❌ |

**Web cần làm:**
- [ ] Multi-step wizard layout (matching mobile)
- [ ] Animated step transitions
- [ ] Auto-populated stats from other modules
- [ ] Review history with filters

---

### 3.5 Life Wheel Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Radar/spider chart | 🔧 Basic | ✅ Sprint 6 |
| Low-area warnings | ❌ | ✅ Sprint 6 |
| Score badges (colored) | ❌ | ✅ Sprint 6 |
| Touch score buttons | N/A | ✅ Sprint 6 |
| **SVG radar chart (animated)** | ❌ | ❌ |
| **Historical comparison** | ❌ | ❌ |

**Cần làm:**
- [ ] Web: SVG radar chart (Recharts/D3)
- [ ] Score history graph (month over month)
- [ ] Goal suggestions for low areas

---

## Phase 4 — Secondary Modules — 1.5 tuần

### 4.1 AI Chat Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Full chat interface | ✅ | ✅ Sprint 6 |
| Quick prompts | 🔧 | ✅ Sprint 6 |
| Context cards | 🔧 | ✅ Sprint 6 |
| **Streaming responses** | ❌ | ❌ |
| **Chat history sidebar** | 🔧 | ❌ |
| **Voice input** | ❌ | ❌ |
| **Export conversation** | ❌ | ❌ |

---

### 4.2 Learning Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Course/Book tabs | ✅ | ✅ Basic |
| Progress tracking | ✅ | 🔧 |
| Add/Edit forms | ✅ Dialog | 🔧 BottomSheet |
| **Reading stats** | ❌ | ❌ |
| **Spaced repetition reminders** | ❌ | ❌ |
| **Notes per chapter** | ❌ | ❌ |

**Mobile cần làm:**
- [ ] SwipeableRow cho courses/books
- [ ] Progress bar on each card
- [ ] Better course detail view
- [ ] Reading streak tracker

---

### 4.3 Relationships Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Contact list | ✅ | ❌ Chưa có screen |
| Interaction logging | ✅ | ❌ |
| Relationship types | ✅ | ❌ |
| Birthday reminders | 🔧 | ❌ |
| **Contact detail page** | 🔧 | ❌ |
| **Interaction timeline** | ❌ | ❌ |

**Mobile cần làm (MỚI):**
- [ ] Tạo `relationships.tsx` screen
- [ ] Contact cards with avatar, type badge
- [ ] Interaction log bottom sheet
- [ ] SwipeableRow (call/message/delete)
- [ ] Birthday countdown badges

---

## Phase 5 — Settings & Auth — 1 tuần

### 5.1 Auth Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Login/Register | ✅ | ✅ Basic |
| Forgot password | ✅ | ✅ |
| **Biometric login** | N/A | ❌ |
| **Remember me** | ✅ | ✅ |
| **Social login (Google)** | ❌ | ❌ |
| **Onboarding tutorial** | ❌ | ❌ |

---

### 5.2 Profile Page (MePage)
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| User info display | ✅ | ✅ Basic |
| Edit name | ✅ | ✅ |
| Lifetime stats | 🔧 | ✅ |
| **Avatar upload** | ❌ | ❌ |
| **Achievement badges** | ❌ | ❌ |
| **Activity heatmap** | ❌ | ❌ |

---

### 5.3 Settings Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Notification settings | ✅ | ✅ Basic |
| Theme toggle | ✅ | ❌ (Dark only) |
| Pomodoro settings | ✅ | ✅ |
| Data management | ✅ | ✅ |
| **Language selector** | ✅ | ❌ |
| **Export/Import data** | 🔧 | ❌ |
| **Backup to cloud** | 🔧 | ❌ |

---

### 5.4 Trash Page
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Deleted items list | ✅ | ❌ Chưa có screen |
| Restore/Permanent delete | ✅ | ❌ |

**Mobile cần làm (MỚI):**
- [ ] Tạo `trash.tsx` screen
- [ ] Grouped by type (tasks, habits, notes...)
- [ ] Swipe to restore/permanent delete

---

## Phase 6 — Cross-cutting Improvements — Ongoing

### 6.1 Design System
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Consistent color tokens | ✅ Tailwind | ✅ C object |
| Typography scale | ✅ | 🔧 |
| Spacing system | ✅ | 🔧 |
| **Dark/Light theme** | ✅ | ❌ Dark only |
| **Design tokens shared** | ❌ | ❌ |
| **Shared icon set** | ❌ Lucide | ❌ Emoji |

**Cần làm:**
- [ ] Shared design token file (colors, spacing, typography)
- [ ] Mobile: Add light theme support
- [ ] Mobile: Replace emoji icons with proper icon library (e.g. Lucide RN)

---

### 6.2 Performance
| Hạng mục | Web | Mobile |
|----------|-----|--------|
| Code splitting | ✅ Vite | ✅ Expo |
| Lazy loading | 🔧 | 🔧 |
| List virtualization | ❌ | ❌ FlatList partial |
| **Skeleton loading** | ❌ | ❌ |
| **Optimistic updates** | ❌ | ❌ |
| **Image optimization** | ❌ | ❌ |

---

### 6.3 Accessibility
- [ ] ARIA labels on all interactive elements (Web)
- [ ] AccessibilityLabel on all touchables (Mobile)
- [ ] Keyboard navigation support (Web)
- [ ] Screen reader testing
- [ ] Color contrast audit (WCAG AA)
- [ ] Font scaling support (Mobile)

---

### 6.4 Animations & Micro-interactions
- [ ] Page transitions (framer-motion Web, Reanimated Mobile)
- [ ] List item enter/exit animations
- [ ] Progress ring animations
- [ ] Haptic feedback on actions (Mobile)
- [ ] Toast notifications with undo
- [ ] Confetti on goal completion

---

## Thứ tự triển khai đề xuất

| Sprint | Thời gian | Nội dung | Ưu tiên |
|--------|-----------|----------|---------|
| **S1** | Tuần 1 | Web responsive: Today, Habits, Tasks (Sheet forms, swipe, skeleton) | P0 |
| **S2** | Tuần 2 | Web: Goals rings, Journal fullscreen, Notes 2-panel | P1 |
| **S3** | Tuần 3 | Web: Dashboard charts, Health charts, Finance donut | P2 |
| **S4** | Tuần 3-4 | Web: Weekly Review wizard, Life Wheel SVG radar | P2 |
| **S5** | Tuần 4 | Mobile: Relationships screen, Trash screen, Learning upgrade | P2 |
| **S6** | Tuần 5 | Mobile: Light theme, icon library, skeleton loading | P2 |
| **S7** | Tuần 5 | AI Chat: streaming, voice, export | P3 |
| **S8** | Tuần 6 | Auth: onboarding, social login, biometric | P3 |
| **S9** | Tuần 6 | Performance: virtualization, lazy load, optimistic updates | P3 |
| **S10** | Tuần 7 | Accessibility audit + animations polish | P3 |

---

## Metrics đo lường

- **Lighthouse Score**: Target ≥ 90 (Performance, Accessibility, Best Practices)
- **Bundle Size**: Target < 500KB gzip (Web)
- **TTI (Time to Interactive)**: Target < 3s
- **Mobile UX Audit**: 3-tap rule, 44px touch targets
- **Crash Rate**: Target < 0.1%
- **User Engagement**: Screen time per session, completion rate

---

## Nguyên tắc thiết kế

1. **Mobile-first**: Design cho mobile trước, scale up cho desktop
2. **Touch targets ≥ 44px**: Mọi nút bấm tối thiểu 44x44px
3. **Bottom > Top**: Forms mở từ dưới lên (bottom sheet / drawer)
4. **Swipe > Tap**: Dùng swipe cho frequent actions
5. **Progressive disclosure**: Ẩn thông tin phụ, hiện khi cần
6. **Consistent patterns**: Cùng action = cùng UI pattern trên mọi screen
7. **Offline-first**: Mọi thao tác hoạt động offline, sync khi online
8. **Feedback always**: Haptic + toast + animation cho mọi action
