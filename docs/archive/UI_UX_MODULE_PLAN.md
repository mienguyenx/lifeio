# LifeOS - UI/UX Upgrade Plan: Chi Tiết Từng Module

> Mỗi module được phân tích: hiện trạng → vấn đề mobile → giải pháp → thứ tự ưu tiên

---

## Tổng quan Module

| # | Module | File chính | Ưu tiên | Trạng thái |
|---|--------|-----------|---------|------------|
| 1 | Today (Home) | `TodayPage.tsx` | P0 | Chưa |
| 2 | Habits | `HabitsPage.tsx` | P0 | Chưa |
| 3 | Tasks | `TasksPage.tsx` | P0 | Chưa |
| 4 | Goals | `GoalsPage.tsx` | P1 | Chưa |
| 5 | Journal | `JournalPage.tsx` | P1 | Chưa |
| 6 | Dashboard | `DashboardPage.tsx` | P2 | Chưa |
| 7 | Health | `HealthPage.tsx` | P2 | Chưa |
| 8 | Finance | `FinancePage.tsx` | P2 | Chưa |
| 9 | Learning | `LearningPage.tsx` | P2 | Chưa |
| 10 | Notes | `NotesPage.tsx` | P1 | Chưa |
| 11 | Weekly Review | `WeeklyReviewPage.tsx` | P2 | Chưa |
| 12 | Life Wheel | `LifeWheelPage.tsx` | P3 | Chưa |
| 13 | Relationships | `RelationshipsPage.tsx` | P3 | Chưa |
| 14 | AI Chat | `AIChatPage.tsx` | P2 | Chưa |
| 15 | Profile/Me | `MePage.tsx` | P3 | Chưa |
| 16 | Settings | `SettingsPage.tsx` | P3 | Chưa |
| 17 | Auth | `AuthPage.tsx` | P1 | Chưa |
| 18 | Navigation (BottomNav + Sidebar) | Layout components | P0 | Đã làm Sprint 1 |

---

## P0 - Ưu tiên cao nhất (Dùng hàng ngày)

### Module 1: Today Page (Trang chủ)
**File:** `src/pages/TodayPage.tsx` (~615 dòng)  
**Components:** `TodayStatsRow`, `TodayAddTaskModal`, `TodayAddHabitModal`, `TodayAddJournalModal`

**Hiện trạng:**
- Hiển thị quote, daily intention, habits, tasks, journal trong 1 page dài
- Không tối ưu mobile — nhiều Card xếp chồng, scroll dài
- Thêm task/habit/journal qua Dialog (popup giữa màn hình — khó dùng mobile)

**Vấn đề Mobile:**
- [ ] Quá nhiều thông tin trên 1 màn hình → không biết focus vào đâu
- [ ] Dialog thêm task/habit bay giữa màn hình → khó thao tác 1 tay
- [ ] Không có progress tổng quan nhanh (bao nhiêu % hoàn thành hôm nay)
- [ ] Stats row quá nhỏ trên mobile

**Giải pháp:**
1. **Today Summary Card**: Card tròn lớn ở đầu trang hiển thị % hoàn thành ngày + greeting
2. **Horizontal Scroll Sections**: Habits/Tasks dạng horizontal scroll cards thay vì list dọc
3. **Swipe-to-complete**: Dùng `SwipeableListItem` cho habits & tasks
4. **Bottom Sheet Forms**: Thay Dialog → AdaptiveModal cho mọi form thêm mới
5. **Collapse Sections**: Mỗi section (Habits, Tasks, Journal) có thể collapse/expand
6. **Quick Actions Strip**: Dải nút nhanh ở đầu (Add Task, Add Habit, Start Focus)

**Thay đổi cụ thể:**
```
TodayPage.tsx
├── TodaySummaryCard (MỚI) — vòng tròn progress + greeting + quote
├── QuickActionsStrip (MỚI) — 3-4 nút hành động nhanh
├── TodayHabitsSection (REFACTOR) — horizontal scroll + swipe
├── TodayTasksSection (REFACTOR) — swipe-to-complete + priority colors
├── TodayJournalSection (REFACTOR) — compact, 1-tap write
└── All modals → AdaptiveModal
```

---

### Module 2: Habits Page
**File:** `src/pages/HabitsPage.tsx` (~1458 dòng)  
**Components:** `HabitCardCompact`, `HabitCardStandard`, `HabitViewModeSelector`, `HabitAreaGroup`, `HabitDetailModal`, `HabitFilters`, etc.

**Hiện trạng:**
- Hỗ trợ nhiều view mode (compact/standard/area group)
- Có SwipeableCard, filter, sort
- Sidebar cho analytics (desktop)
- Đã có `useIsMobile` responsive

**Vấn đề Mobile:**
- [ ] Card quá dày, mỗi habit chiếm nhiều không gian
- [ ] Filter nằm trên header — chiếm space, khó tap
- [ ] Add habit dialog phức tạp — nhiều field
- [ ] Không thấy streak overview nhanh
- [ ] Toggle completion cần tap vào icon nhỏ

**Giải pháp:**
1. **Ultra-compact mode**: Mỗi habit = 1 dòng: icon + name + streak flame + check button lớn
2. **Swipe actions**: Vuốt trái = skip, vuốt phải = complete (dùng SwipeableListItem)
3. **Bottom Sheet Filter**: Filter/Sort mở bottom sheet thay vì inline
4. **Streak Dashboard**: Mini card hiện tổng streak ở đầu page
5. **Quick Add**: Bấm + → bottom sheet nhỏ (chỉ name + area) thay vì dialog phức tạp
6. **Group by time**: Sáng/Chiều/Tối grouping cho daily habits

**Thay đổi cụ thể:**
```
HabitsPage.tsx (Mobile)
├── HabitStreakSummary (MỚI) — tổng habits done/total + longest streak
├── HabitTimeGroups (MỚI) — Morning/Afternoon/Evening sections
├── HabitListItem (REFACTOR) — ultra-compact, big tap target, swipe actions
├── HabitFilterSheet (MỚI) — bottom sheet cho filter/sort
├── HabitQuickAdd (MỚI) — minimal bottom sheet form
└── HabitDetailModal → AdaptiveModal
```

---

### Module 3: Tasks Page
**File:** `src/pages/TasksPage.tsx` (~1494 dòng)  
**Components:** `TaskDetailModal`, `TaskFilters`, `TaskFilterSheet`, `ProductivityStats`, `DndKanbanBoard`, `SwipeableCard`, etc.

**Hiện trạng:**
- Hỗ trợ List + Kanban view
- Có filter, sort, search, archive
- Đã có `SwipeableCard` và `TaskFilterSheet`
- Sidebar thống kê (desktop)
- Calendar view tích hợp

**Vấn đề Mobile:**
- [ ] Kanban board scroll ngang không mượt trên mobile
- [ ] Quá nhiều action buttons trên mỗi task card
- [ ] Add task form phức tạp (priority, due date, area, subtasks)
- [ ] Tab bar (All/Today/Upcoming/Calendar/Kanban) quá nhỏ

**Giải pháp:**
1. **Mobile-first List**: Default = list view, kanban chỉ cho desktop
2. **Grouped by Status**: Overdue (red) → Today → Upcoming → Completed
3. **Swipe Actions**: Vuốt phải = complete, vuốt trái = menu (postpone/delete/edit)
4. **Sticky Tab Bar**: Tabs lớn hơn, sticky khi scroll
5. **Smart Quick Add**: Bottom sheet — chỉ cần nhập tên, AI suggest priority + due date
6. **Batch Actions**: Long press → select multiple → batch complete/delete

**Thay đổi cụ thể:**
```
TasksPage.tsx (Mobile)
├── TaskQuickStats (MỚI) — overdue count + today count + completion rate
├── TaskTabs (REFACTOR) — sticky, larger touch targets, icon + text
├── TaskListView (REFACTOR)
│   ├── OverdueSection — red accent, swipe actions
│   ├── TodaySection — primary accent
│   ├── UpcomingSection — muted
│   └── CompletedSection — collapsed by default
├── TaskQuickAdd (MỚI) — minimal bottom sheet
└── TaskDetailModal → AdaptiveModal
```

---

## P1 - Ưu tiên cao (Dùng thường xuyên)

### Module 4: Goals Page
**File:** `src/pages/GoalsPage.tsx` (~883 dòng)

**Giải pháp Mobile:**
1. **Goal Cards**: Visual progress ring thay vì progress bar
2. **Goal Timeline**: Vertical timeline view trên mobile
3. **Quick Update**: Tap vào progress ring → slider bottom sheet để update %
4. **Linked Items**: Hiện linked habits/tasks inline dưới goal
5. **Focus Mode**: Full-screen focus cho 1 goal, swipe left/right chuyển goal

---

### Module 5: Journal Page
**File:** `src/pages/JournalPage.tsx` (~898 dòng)

**Giải pháp Mobile:**
1. **Quick Write**: Tap → full screen editor ngay lập tức (không qua dialog)
2. **Mood Selector**: Emoji mood ở đầu, 1 tap chọn
3. **Card Stack**: Entries dạng card stack, swipe để xem entries cũ
4. **Voice Note**: Nút microphone để ghi âm → transcribe (future)
5. **Template Quick Pick**: Swipe horizontal qua templates

---

### Module 6: Notes Page
**File:** `src/pages/NotesPage.tsx` (~688 dòng)

**Giải pháp Mobile:**
1. **Grid → List**: Mobile hiện list, desktop hiện grid
2. **Quick Note**: FAB → bottom sheet cho ghi chú nhanh
3. **Full Screen Edit**: Tap note → full screen editor
4. **Pin & Star**: Swipe actions
5. **Search**: Sticky search bar ở đầu

---

### Module 7: Auth Page
**File:** `src/pages/AuthPage.tsx`

**Giải pháp Mobile:**
1. **Full Screen**: Auth chiếm toàn bộ màn hình
2. **Large Input Fields**: Input fields lớn hơn, dễ tap
3. **Biometric Login**: Fingerprint/Face ID integration (PWA future)
4. **Remember Me**: Auto-login nếu session còn valid

---

## P2 - Ưu tiên trung bình

### Module 8: Dashboard Page
**File:** `src/pages/DashboardPage.tsx` (~136 dòng)

**Giải pháp Mobile:**
1. **Widget Cards**: Mỗi metric = 1 card nhỏ, 2-column grid
2. **Swipe Between Periods**: Swipe để chuyển Today/Week/Month
3. **Chart Optimization**: Charts responsive, touch-friendly tooltips
4. **Quick Links**: Deep link vào từng module từ dashboard card

---

### Module 9: Health Page
**File:** `src/pages/HealthPage.tsx` (~684 dòng)

**Giải pháp Mobile:**
1. **Metric Cards**: Mỗi health metric = card với giá trị lớn, trend arrow
2. **Quick Log**: 1-tap log weight/sleep/water/exercise
3. **Charts**: Horizontal scroll cho charts, pinch-to-zoom
4. **Daily Summary**: Card ở đầu hiện health score hôm nay

---

### Module 10: Finance Page
**File:** `src/pages/FinancePage.tsx` (~797 dòng)

**Giải pháp Mobile:**
1. **Balance Card**: Card lớn hiện số dư/chi tiêu tháng
2. **Quick Add Expense**: Bottom sheet — amount + category (2 taps)
3. **Category Breakdown**: Pie chart touch-friendly
4. **Transaction List**: Swipe to delete/edit

---

### Module 11: AI Chat Page
**File:** `src/pages/AIChatPage.tsx`

**Giải pháp Mobile:**
1. **Full Screen Chat**: Chat interface chiếm toàn bộ, input sticky ở dưới
2. **Quick Prompts**: Horizontal scroll suggestions
3. **Context Cards**: AI hiện data cards inline (habit stats, task summary)

---

### Module 12: Weekly Review
**File:** `src/pages/WeeklyReviewPage.tsx` (~872 dòng)

**Giải pháp Mobile:**
1. **Step-by-step Wizard**: Thay vì 1 form dài → multi-step (reflect → rate → plan)
2. **Slider Ratings**: Large sliders cho life area ratings
3. **Photo Memory**: Attach ảnh cho weekly highlights

---

## P3 - Ưu tiên thấp

### Module 13-16: Life Wheel, Relationships, Profile, Settings
- **Life Wheel**: Touch-interactive radar chart
- **Relationships**: Contact cards, birthday reminders
- **Profile**: Avatar upload, stats summary
- **Settings**: Toggle switches, clear sections

---

## Thứ tự triển khai (Sprints)

### Sprint 2: Today Page Redesign (P0)
- [ ] TodaySummaryCard — progress ring, greeting
- [ ] QuickActionsStrip — 3 action buttons
- [ ] Refactor habits section — horizontal scroll
- [ ] Refactor tasks section — swipe-to-complete
- [ ] Replace all Dialog → AdaptiveModal
- [ ] Test trên mobile thực tế

### Sprint 3: Habits & Tasks Mobile (P0)
- [ ] HabitListItem ultra-compact
- [ ] HabitFilterSheet bottom sheet
- [ ] Habit swipe actions (complete/skip)
- [ ] Task grouped list view
- [ ] Task swipe actions
- [ ] TaskQuickAdd bottom sheet
- [ ] Sticky tab bars

### Sprint 4: Goals, Journal, Notes (P1)
- [ ] Goal progress rings
- [ ] Goal quick update slider
- [ ] Journal quick write full screen
- [ ] Journal mood selector
- [ ] Notes list view for mobile
- [ ] Notes full screen editor

### Sprint 5: Dashboard, Health, Finance (P2)
- [ ] Dashboard widget grid
- [ ] Health metric cards + quick log
- [ ] Finance quick add expense
- [ ] Chart touch optimization

### Sprint 6: AI Chat, Weekly Review, Life Wheel (P2-P3)
- [ ] Full screen chat interface
- [ ] Weekly review wizard
- [ ] Life wheel touch interaction

### Sprint 7: Auth, Profile, Settings, Polish (P3)
- [ ] Auth page mobile optimization
- [ ] Profile redesign
- [ ] Settings cleanup
- [ ] Performance audit
- [ ] Accessibility audit

---

## Nguyên tắc thiết kế chung

### Mobile-First Rules:
1. **Touch targets ≥ 44px** — mọi nút bấm tối thiểu 44x44px
2. **1-hand operation** — actions quan trọng nằm trong tầm ngón cái
3. **3-tap rule** — mọi action hoàn thành trong ≤ 3 taps
4. **Bottom > Top** — forms, menus mở từ dưới lên (bottom sheet)
5. **Swipe > Tap** — dùng swipe cho frequent actions (complete/delete)
6. **Visual hierarchy** — thông tin quan trọng nhất lớn nhất, ở trên cùng
7. **Reduce cognitive load** — ẩn thông tin phụ, chỉ hiện khi cần

### Component Pattern:
- **Forms**: Luôn dùng `AdaptiveModal` (sheet mobile / dialog desktop)
- **Lists**: Dùng `SwipeableListItem` cho mọi list item có actions
- **Filters**: Bottom sheet trên mobile, inline trên desktop
- **Navigation**: Bottom nav + QuickAdd FAB (đã implement)
- **Loading**: Skeleton screens thay vì spinner
- **Feedback**: Haptic + toast cho mọi action thành công
