# Báo Cáo Thống Kê Module và Chức Năng - LifeOSS

## Tổng Quan Hệ Thống

**LifeOSS** là một ứng dụng quản lý cuộc sống cá nhân (Life Operating System) toàn diện, được xây dựng với React, TypeScript, Vite và Supabase.

### Công Nghệ Sử Dụng

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn-ui (Radix UI components)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod
- **Routing**: React Router DOM v6
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Drag & Drop**: dnd-kit
- **Markdown**: react-markdown
- **PDF Export**: jsPDF
- **Offline Support**: IndexedDB (idb)

---

## Cấu Trúc Codebase

### Thư Mục Chính

```
src/
├── assets/          # Static assets (images, icons)
├── components/      # React components (142+ files)
├── data/           # Static data và constants
├── hooks/          # Custom React hooks
├── integrations/   # External service integrations
├── lib/            # Utility libraries
├── pages/          # Page components (20+ pages)
├── providers/      # React context providers
├── services/       # Business logic services (4 services)
├── stores/         # Zustand state stores (2 stores)
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

---

## Module Chính và Chức Năng

### 1. 🔐 Authentication & User Management

**Pages**: [`AuthPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/AuthPage.tsx)

**Components**:
- `ProtectedRoute.tsx` - Bảo vệ routes yêu cầu authentication
- `SimpleCaptcha.tsx` - CAPTCHA đơn giản cho đăng ký

**Database Tables**:
- `profiles` - Thông tin profile người dùng
- `user_roles` - Phân quyền người dùng (admin, moderator, user)
- `user_settings` - Cài đặt cá nhân

**Chức năng**:
- ✅ Đăng ký tài khoản mới (với CAPTCHA)
- ✅ Đăng nhập/Đăng xuất
- ✅ Quản lý profile (tên, avatar, bio, phone, birthday, timezone, life purpose)
- ✅ Phân quyền người dùng (Admin, Moderator, User)
- ✅ Protected routes

---

### 2. 🎯 Goals Management (Quản lý Mục tiêu)

**Pages**: [`GoalsPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/GoalsPage.tsx) (40.5KB)

**Components** (17 components):
- `GoalDetailModal.tsx` - Chi tiết mục tiêu
- `GoalFilters.tsx` - Lọc mục tiêu
- `GoalFocusMode.tsx` - Chế độ tập trung vào mục tiêu
- `GoalProgressChart.tsx` - Biểu đồ tiến độ
- `GoalStreaksCard.tsx` - Theo dõi chuỗi ngày đạt mục tiêu
- `GoalAnalyticsCard.tsx` - Phân tích mục tiêu
- `GoalCollaborationCard.tsx` - Cộng tác trên mục tiêu
- `GoalDependencies.tsx` - Quản lý phụ thuộc giữa các mục tiêu
- `GoalHistoryDialog.tsx` - Lịch sử thay đổi
- `GoalLinkedItems.tsx` - Items liên kết
- `GoalNotificationsCard.tsx` - Thông báo
- `GoalPerformanceComparison.tsx` - So sánh hiệu suất
- `GoalSharing.tsx` - Chia sẻ mục tiêu
- `GoalSidebar.tsx` - Sidebar mục tiêu
- `GoalTasksSection.tsx` - Tasks liên quan
- `GoalTemplatesCard.tsx` - Templates mục tiêu
- `VisionBoardCard.tsx` - Bảng tầm nhìn

**Database Tables**:
- `goals` - Mục tiêu chính
- `goal_milestones` - Các mốc quan trọng
- `goal_activities` - Hoạt động của mục tiêu
- `goal_collaborators` - Người cộng tác
- `goal_vision_items` - Items tầm nhìn
- `goal_progress_history` - Lịch sử tiến độ

**Chức năng**:
- ✅ Tạo/Sửa/Xóa mục tiêu
- ✅ Phân loại theo Life Area (10 areas)
- ✅ Theo dõi tiến độ (progress tracking)
- ✅ Đặt mức độ ưu tiên (low, medium, high)
- ✅ Trạng thái (active, paused, archived)
- ✅ Focus Mode - Tập trung vào 1 mục tiêu
- ✅ Milestones - Các mốc quan trọng
- ✅ Streaks - Chuỗi ngày đạt mục tiêu
- ✅ Dependencies - Phụ thuộc giữa các mục tiêu
- ✅ Collaboration - Mời người khác cộng tác (viewer/editor)
- ✅ Sharing - Chia sẻ mục tiêu công khai
- ✅ Vision Board - Bảng tầm nhìn
- ✅ Analytics & Performance comparison
- ✅ Templates - Mẫu mục tiêu có sẵn
- ✅ Push notifications (deadline, weekly reminders)
- ✅ Liên kết với Tasks và Habits

---

### 3. ✅ Tasks Management (Quản lý Công việc)

**Pages**: [`TasksPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/TasksPage.tsx) (68.8KB - page lớn nhất)

**Components** (10 components):
- `TasksFilters.tsx` - Bộ lọc tasks
- `TasksList.tsx` - Danh sách tasks
- `TaskDetail.tsx` - Chi tiết task
- `TaskForm.tsx` - Form tạo/sửa task
- `Subtasks.tsx` - Công việc con
- `RecurringTaskSettings.tsx` - Cài đặt task lặp lại
- `TaskTemplates.tsx` - Templates
- `TaskStats.tsx` - Thống kê
- `QuickAdd.tsx` - Thêm nhanh
- `DragDropList.tsx` - Kéo thả sắp xếp

**Database Tables**:
- `tasks` - Tasks chính
- `subtasks` - Subtasks
- `task_tags` - Tags cho tasks

**Chức năng**:
- ✅ Tạo/Sửa/Xóa tasks
- ✅ Subtasks - Công việc con
- ✅ Priority (low, medium, high)
- ✅ Status (todo, in_progress, deferred, done)
- ✅ Due date - Ngày đến hạn
- ✅ Life Areas (10 areas)
- ✅ Tags với màu sắc tùy chỉnh
- ✅ Recurring tasks (daily, weekly, monthly)
- ✅ Liên kết với Goals & Milestones
- ✅ Pomodoro integration (ước tính & hoàn thành)
- ✅ Reminders (thời gian cụ thể hoặc trước deadline)
- ✅ Drag & drop để sắp xếp
- ✅ Archive tasks
- ✅ Templates - Mẫu task có sẵn
- ✅ Quick add - Thêm nhanh
- ✅ Filters & Search

---

### 4. 🔄 Habits Tracking (Theo dõi Thói quen)

**Pages**: [`HabitsPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/HabitsPage.tsx) (65.6KB)

**Components** (12 components):
- `HabitCardCompact.tsx` - Card hiển thị compact
- `HabitCardStandard.tsx` - Card hiển thị standard
- `HabitDetailModal.tsx` - Chi tiết habit
- `HabitFilters.tsx` - Bộ lọc
- `HabitViewModeSelector.tsx` - Chọn chế độ hiển thị
- `HabitAreaGroup.tsx` - Nhóm theo area
- `HabitChallengesCard.tsx` - Thử thách
- `HabitCompetitionCard.tsx` - Thi đua
- `HabitHistoryManager.tsx` - Quản lý lịch sử
- `HabitHistoryModal.tsx` - Xem lịch sử
- `HabitPredictionCard.tsx` - Dự đoán dựa trên AI
- `ArchivedHabitsSection.tsx` - Habits đã lưu trữ

**Database Tables**:
- `habits` - Habits chính
- `habit_completions` - Lịch sử hoàn thành
- `habit_challenges` - Thử thách (21, 30, 66 ngày)
- `habit_competitions` - Thi đua với người khác

**Chức năng**:
- ✅ Tạo/Sửa/Xóa habits
- ✅ Frequency: Daily, Weekly, Custom days
- ✅ Target tracking (số lần/ngày, đơn vị đo)
- ✅ Streak tracking (current & best streak)
- ✅ Icon & Color customization
- ✅ Life Areas (10 areas)
- ✅ Liên kết với Goals
- ✅ Challenges: 21-day, 30-day, 66-day
- ✅ Competitions - Thi đua với người khác
- ✅ Completion history với notes
- ✅ Reminders (thời gian cụ thể)
- ✅ AI Predictions - Dự đoán khả năng duy trì
- ✅ Archive habits
- ✅ View modes: Compact, Standard, Grouped by Area
- ✅ Calendar view

---

### 5. 📝 Journal (Nhật ký)

**Pages**: [`JournalPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/JournalPage.tsx) (39.1KB)

**Components** (8 components):
- `JournalEntryForm.tsx` - Form viết nhật ký
- `JournalEntryCard.tsx` - Hiển thị entry
- `JournalCalendarView.tsx` - Xem theo lịch
- `JournalAnalyticsChart.tsx` - Biểu đồ phân tích
- `JournalTagsManager.tsx` - Quản lý tags
- `MoodTracker.tsx` - Theo dõi tâm trạng
- `GratitudeSection.tsx` - Ghi nhận biết ơn
- `JournalTemplates.tsx` - Templates

**Database Tables**:
- `journal_entries` - Các entry nhật ký
- `journal_tags` - Tags cho journal

**Chức năng**:
- ✅ Viết nhật ký hàng ngày
- ✅ Mood tracking (1-10 scale)
- ✅ Energy tracking (1-10 scale)
- ✅ Gratitude list - Danh sách biết ơn
- ✅ Tags với màu sắc
- ✅ Life Areas tagging
- ✅ Image attachments
- ✅ Calendar view
- ✅ Analytics - Phân tích tâm trạng theo thời gian
- ✅ Search & Filter
- ✅ Templates

---

### 6. 📄 Notes (Ghi chú)

**Pages**: [`NotesPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/NotesPage.tsx) (30.9KB)

**Components**:
- `NoteEditor.tsx` - Markdown editor

**Database Tables**:
- `notes` - Ghi chú
- `note_tags` - Tags cho notes

**Chức năng**:
- ✅ Tạo/Sửa/Xóa notes
- ✅ Markdown support
- ✅ Color coding
- ✅ Tags
- ✅ Life Areas
- ✅ Pin notes
- ✅ Favorite notes
- ✅ Archive notes
- ✅ Search & Filter

---

### 7. 🤖 AI Coach (Trợ lý AI)

**Pages**: [`AIChatPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/AIChatPage.tsx) (21.6KB)

**Components** (4 components):
- `AICoachButton.tsx` - Nút gọi AI Coach
- `ContextAwareAICoach.tsx` - AI có context awareness
- `AIImprovementSuggestions.tsx` - Đề xuất cải thiện
- `AISuggestionsCard.tsx` - Card hiển thị đề xuất
- `DashboardAICoach.tsx` - AI Coach trên dashboard

**Database Tables**:
- `saved_conversations` - Cuộc hội thoại đã lưu
- `chat_messages` - Tin nhắn chat
- `admin_ai_models` - Cấu hình AI models
- `admin_ai_prompts` - System prompts

**Services**:
- [`aiService.ts`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/services/aiService.ts) - AI service logic

**Chức năng**:
- ✅ Chat với AI Coach
- ✅ Context-aware suggestions (dựa trên goals, tasks, habits)
- ✅ Multi-model support
- ✅ Save conversations
- ✅ Favorite messages
- ✅ Weekly Review AI assistance
- ✅ Goal suggestions
- ✅ Habit improvement recommendations
- ✅ Customizable prompts (admin)

---

### 8. 🎡 Life Wheel (Bánh xe Cuộc sống)

**Pages**: [`LifeWheelPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/LifeWheelPage.tsx) (21.5KB)

**Components** (4 components):
- `LifeWheelChart.tsx` - Biểu đồ bánh xe
- `AreaScoreInput.tsx` - Nhập điểm cho từng area
- `LifeWheelHistory.tsx` - Lịch sử thay đổi
- `LifeWheelInsights.tsx` - Insights và phân tích

**Database Tables**:
- `life_wheel_scores` - Điểm số của 10 areas

**Life Areas (10 영역)**:
1. 🏃 Health - Sức khỏe
2. ❤️ Relationships - Mối quan hệ
3. 💼 Career - Sự nghiệp
4. 💰 Finance - Tài chính
5. 🎨 Personal - Phát triển bản thân
6. 🎉 Fun - Giải trí
7. 🏡 Environment - Môi trường sống
8. 🙏 Spirituality - Tâm linh
9. 📚 Learning - Học tập
10. 🤝 Contribution - Đóng góp

**Chức năng**:
- ✅ Đánh giá 10 lĩnh vực cuộc sống (1-10 điểm)
- ✅ Biểu đồ radar visualization
- ✅ Theo dõi thay đổi theo thời gian
- ✅ Insights tự động
- ✅ Xác định areas cần cải thiện

---

### 9. 📊 Weekly Review (Đánh giá Tuần)

**Pages**: [`WeeklyReviewPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/WeeklyReviewPage.tsx) (39.8KB)

**Components** (5 components):
- `WeeklyReviewForm.tsx` - Form đánh giá
- `WeeklyReviewHistory.tsx` - Lịch sử
- `WeeklyReviewStats.tsx` - Thống kê
- `WeeklyReviewAI.tsx` - AI assistance
- `WeeklyReviewTemplates.tsx` - Templates

**Database Tables**:
- `weekly_reviews` - Đánh giá tuần

**Chức năng**:
- ✅ Overall rating (1-10)
- ✅ Highlights - Điểm nổi bật
- ✅ Lowlights - Điểm yếu
- ✅ Wins - Thành công trong tuần
- ✅ Challenges - Thử thách gặp phải
- ✅ Lessons learned - Bài học
- ✅ Next week focus - Tập trung tuần sau
- ✅ Gratitude - Biết ơn
- ✅ Area ratings - Đánh giá từng area
- ✅ AI suggestions
- ✅ History & trends

---

### 10. 📅 Today View (Trang Hôm nay)

**Pages**: [`TodayPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/TodayPage.tsx) (45.1KB)

**Components**:
- `TodayTasks.tsx` - Tasks hôm nay
- `TodayHabits.tsx` - Habits hôm nay
- `DailyIntention.tsx` - Ý định hàng ngày
- `TodayStats.tsx` - Thống kê

**Database Tables**:
- `daily_intentions` - Ý định hàng ngày

**Chức năng**:
- ✅ Daily intention setting
- ✅ Tasks due today
- ✅ Habits to complete today
- ✅ Quick completion tracking
- ✅ Daily stats overview
- ✅ Focus mode

---

### 11. 📈 Dashboard

**Pages**: [`DashboardPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/DashboardPage.tsx) (11.5KB)

**Components** (6 components):
- `DashboardStatsGrid.tsx` - Tổng quan thống kê
- `DashboardGoalsProgress.tsx` - Tiến độ goals
- `DashboardAreaSummary.tsx` - Tóm tắt theo area
- `DashboardUpcoming.tsx` - Sắp tới
- `DashboardRecentActivity.tsx` - Hoạt động gần đây
- `DashboardAICoach.tsx` - AI Coach widget

**Chức năng**:
- ✅ Overall statistics (goals, tasks, habits)
- ✅ Progress visualization
- ✅ Upcoming deadlines
- ✅ Recent activities
- ✅ Area summary
- ✅ AI Coach integration

---

### 12. 👤 Profile & Me Page

**Pages**: [`MePage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/MePage.tsx) (11.8KB)

**Components** (3 components):
- `ProfileEditor.tsx` - Chỉnh sửa profile
- `PersonalValues.tsx` - Giá trị cá nhân
- `PersonalTraits.tsx` - Đặc điểm cá nhân

**Database Tables**:
- `personal_values` - Giá trị
- `personal_traits` - Đặc điểm (strengths/weaknesses)
- `life_visions` - Tầm nhìn cuộc sống
- `life_roles` - Vai trò trong đời
- `life_milestones` - Mốc quan trọng
- `life_role_goals` - Liên kết vai trò với goals

**Chức năng**:
- ✅ Edit profile (avatar, bio, phone, birthday, timezone)
- ✅ Life purpose statement
- ✅ Personal values với icon & priority
- ✅ Strengths & weaknesses
- ✅ Life visions (1-year, 5-year, 10-year, lifetime)
- ✅ Life roles definition
- ✅ Life milestones tracking

---

### 13. ⚙️ Settings

**Pages**: [`SettingsPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/SettingsPage.tsx) (26.2KB)

**Chức năng**:
- ✅ Pomodoro settings (work/break/long break duration)
- ✅ Trash settings (enable/disable, auto cleanup)
- ✅ Theme settings
- ✅ Language preferences
- ✅ Notification settings
- ✅ Data export/import
- ✅ Account management

---

### 14. 🗑️ Trash (Thùng rác)

**Pages**: [`TrashPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/TrashPage.tsx) (19.5KB)

**Chức năng**:
- ✅ Soft delete cho Goals, Tasks, Habits, Notes
- ✅ Restore items
- ✅ Permanent delete
- ✅ Auto cleanup sau N ngày
- ✅ Bulk operations

---

### 15. ⏲️ Pomodoro Timer

**Components** (3 components):
- `PomodoroTimer.tsx` - Timer chính
- `PomodoroStats.tsx` - Thống kê
- `PomodoroSettings.tsx` - Cài đặt

**Database Tables**:
- `pomodoro_sessions` - Phiên làm việc
- `user_settings` - Cài đặt pomodoro

**Store**: `usePomodoroStore.ts`

**Chức năng**:
- ✅ Pomodoro timer với phases (work, break, long_break)
- ✅ Customizable durations
- ✅ Link với Tasks
- ✅ Session tracking
- ✅ Statistics

---

### 16. 💰 Finance Tracking

**Pages**: [`FinancePage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/FinancePage.tsx) (35.9KB)

**Chức năng**:
- ✅ Income/Expense tracking
- ✅ Category management
- ✅ Budget planning
- ✅ Financial goals
- ✅ Reports & charts

---

### 17. 🏥 Health Tracking

**Pages**: [`HealthPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/HealthPage.tsx) (29.9KB)

**Chức năng**:
- ✅ Health metrics tracking
- ✅ Exercise logging
- ✅ Sleep tracking
- ✅ Water intake
- ✅ Health goals

---

### 18. 💑 Relationships Management

**Pages**: [`RelationshipsPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/RelationshipsPage.tsx) (45.9KB)

**Chức năng**:
- ✅ Contact management
- ✅ Relationship tracking
- ✅ Important dates
- ✅ Interaction history
- ✅ Relationship goals

---

### 19. 📚 Learning Management

**Pages**: [`LearningPage.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/LearningPage.tsx) (43.4KB)

**Chức năng**:
- ✅ Course tracking
- ✅ Learning resources
- ✅ Progress tracking
- ✅ Learning goals
- ✅ Notes & summaries

---

### 20. 🔔 Notifications

**Components**:
- `NotificationCenter.tsx` - Trung tâm thông báo

**Service**: [`notificationService.ts`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/services/notificationService.ts)

**Chức năng**:
- ✅ Push notifications
- ✅ In-app notifications
- ✅ Email notifications (qua email_logs table)
- ✅ Reminder system
- ✅ Notification preferences

---

### 21. 💾 Data Management

**Components**:
- `DataExportImport.tsx` - Export/Import dữ liệu
- `OfflineSync.tsx` - Đồng bộ offline

**Chức năng**:
- ✅ Export data (JSON, PDF)
- ✅ Import data
- ✅ Offline support với IndexedDB
- ✅ Auto sync when online
- ✅ Conflict resolution

---

### 22. ☁️ Google Drive Backup

**Pages**: Admin [`AdminGoogleDriveBackup.tsx`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminGoogleDriveBackup.tsx) (29KB)

**Service**: [`googleDriveService.ts`](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/services/googleDriveService.ts) (18.2KB)

**Chức năng**:
- ✅ Auto backup to Google Drive
- ✅ Manual backup
- ✅ Restore from backup
- ✅ Backup scheduling
- ✅ Backup history

---

## Admin Panel (Trang Quản Trị)

### Admin Pages (20 pages)

1. **[AdminDashboard.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminDashboard.tsx)** - Dashboard tổng quan
2. **[AdminUsers.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminUsers.tsx)** (44.8KB) - Quản lý users
3. **[AdminPlans.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminPlans.tsx)** (45KB) - Quản lý subscription plans
4. **[AdminWorkspaces.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminWorkspaces.tsx)** (54.9KB) - Quản lý workspaces
5. **[AdminAIModels.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminAIModels.tsx)** (21.9KB) - Cấu hình AI models
6. **[AdminAIPrompts.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminAIPrompts.tsx)** (15.4KB) - Quản lý AI prompts
7. **[AdminAPIKeys.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminAPIKeys.tsx)** (21.8KB) - Quản lý API keys
8. **[AdminTemplatesPage.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminTemplatesPage.tsx)** - Quản lý templates
9. **[AdminThemes.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminThemes.tsx)** (35KB) - Quản lý themes
10. **[AdminLanguages.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminLanguages.tsx)** (32.6KB) - Quản lý ngôn ngữ
11. **[AdminTranslations.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminTranslations.tsx)** - Quản lý bản dịch
12. **[AdminEmailTemplates.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminEmailTemplates.tsx)** - Email templates
13. **[AdminEmailLogs.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminEmailLogs.tsx)** - Email logs
14. **[AdminLogs.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminLogs.tsx)** - System logs
15. **[AdminSettings.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminSettings.tsx)** (37.6KB) - Cài đặt hệ thống
16. **[AdminFlags.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminFlags.tsx)** - Feature flags
17. **[AdminFeatures.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminFeatures.tsx)** - Quản lý features
18. **[AdminAnalytics.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminAnalytics.tsx)** - Analytics
19. **[AdminDataManagement.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminDataManagement.tsx)** (25.7KB) - Quản lý data
20. **[AdminGoogleDriveBackup.tsx](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/pages/admin/AdminGoogleDriveBackup.tsx)** - Google Drive backup

### Admin Database Tables

- `subscription_plans` - Gói đăng ký
- `user_subscriptions` - Subscription của users
- `workspaces` - Workspaces
- `workspace_members` - Thành viên workspace
- `workspace_invitations` - Lời mời workspace
- `admin_settings` - Cài đặt admin
- `system_logs` - Logs hệ thống
- `email_logs` - Email logs
- `feature_flags` - Feature flags
- `admin_ai_models` - AI models
- `admin_ai_prompts` - AI prompts
- `admin_templates` - Templates
- `admin_themes` - Themes
- `admin_languages` - Ngôn ngữ
- `admin_translations` - Bản dịch
- `admin_plugins` - Plugins hệ thống
- `plugin_hooks` - Plugin hooks
- `user_plugin_settings` - Cài đặt plugin của user

---

## Tổng Hợp Database Schema

### Tổng Số Tables: 50+ tables

**Nhóm Tables**:

#### 1. User & Auth (3 tables)
- profiles
- user_roles
- user_settings

#### 2. Goals (6 tables)
- goals
- goal_milestones
- goal_activities
- goal_collaborators
- goal_vision_items
- goal_progress_history

#### 3. Tasks (3 tables)
- tasks
- subtasks
- task_tags

#### 4. Habits (4 tables)
- habits
- habit_completions
- habit_challenges
- habit_competitions

#### 5. Journal & Notes (4 tables)
- journal_entries
- journal_tags
- notes
- note_tags

#### 6. Life Management (7 tables)
- daily_intentions
- life_wheel_scores
- weekly_reviews
- personal_values
- personal_traits
- life_visions
- life_roles
- life_role_goals
- life_milestones

#### 7. Pomodoro & Chat (3 tables)
- pomodoro_sessions
- saved_conversations
- chat_messages

#### 8. Subscription & Workspace (6 tables)
- subscription_plans
- user_subscriptions
- workspaces
- workspace_members
- workspace_invitations

#### 9. Admin & System (7 tables)
- admin_settings
- system_logs
- email_logs
- feature_flags
- admin_ai_models
- admin_ai_prompts

#### 10. Templates & Themes (4 tables)
- admin_templates
- admin_themes
- admin_languages
- admin_translations

#### 11. Plugins (3 tables)
- admin_plugins
- plugin_hooks
- user_plugin_settings

### Enums (12 types)
1. `app_role` - admin, moderator, user
2. `life_area` - 10 areas
3. `task_priority` - low, medium, high
4. `task_status` - todo, in_progress, deferred, done
5. `goal_status` - active, paused, archived
6. `habit_frequency` - daily, weekly, custom
7. `challenge_status` - active, completed, failed
8. `challenge_type` - 21-day, 30-day, 66-day
9. `collaborator_role` - viewer, editor
10. `pomodoro_phase` - work, break, long_break
11. `recurring_frequency` - daily, weekly, monthly
12. `trait_type` - strength, weakness
13. `vision_timeframe` - 1-year, 5-year, 10-year, lifetime

---

## Services & Business Logic

### Services (4 files)

1. **[aiService.ts](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/services/aiService.ts)** (11.6KB)
   - AI chat functionality
   - Model management
   - Context-aware suggestions

2. **[apiKeyService.ts](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/services/apiKeyService.ts)** (5.7KB)
   - API key management
   - Encryption/Decryption

3. **[googleDriveService.ts](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/services/googleDriveService.ts)** (18.2KB)
   - Google Drive integration
   - Backup/Restore
   - File management

4. **[notificationService.ts](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/services/notificationService.ts)** (9.6KB)
   - Push notifications
   - Reminder scheduling
   - Notification dispatch

---

## State Management

### Zustand Stores (2 stores)

1. **[useLifeOSStore.ts](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/stores/useLifeOSStore.ts)** - Main app state
2. **[usePomodoroStore.ts](file:///d:/LifeOSS/remix-of-remix-of-lifeos-mobile-v3.copy/src/stores/usePomodoroStore.ts)** - Pomodoro timer state

---

## UI Components Library

### shadcn-ui Components (51 components in ui folder)
- Accordion, Alert Dialog, Avatar, Badge, Button
- Calendar, Card, Carousel, Checkbox, Collapsible
- Command, Context Menu, Dialog, Drawer, Dropdown Menu
- Form, Hover Card, Input, Label, Menubar
- Navigation Menu, Popover, Progress, Radio Group
- Scroll Area, Select, Separator, Sheet, Slider
- Switch, Table, Tabs, Textarea, Toast
- Toggle, Toggle Group, Tooltip
- ...và nhiều hơn nữa

---

## Deployment & Infrastructure

### Deployment Options
1. **Local Development** - Vite dev server
2. **Docker** - Docker Compose setup
3. **Cloudflare** - Cloudflare Tunnel
4. **Traefik** - Reverse proxy
5. **Vercel** - Production deployment

### Database
- **Supabase** (PostgreSQL)
- Local Supabase với Docker
- Supabase Cloud

### Files hỗ trợ deployment
- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- `vercel.json`
- Nhiều scripts PowerShell & Shell

---

## Plugin System

### Plugin Architecture
- Plugin table với metadata
- Hook system
- User-specific plugin settings
- Sidebar integration
- Dashboard widgets
- Admin pages

---

## Internationalization (i18n)

### Supported Features
- Multiple languages support
- Translation management
- Admin translation editor
- Language progress tracking
- Flag icons

---

## Tính Năng Nổi Bật

### 🌟 Unique Features

1. **Life Operating System Concept** - Quản lý toàn diện 10 lĩnh vực cuộc sống
2. **AI Coach Integration** - Trợ lý AI context-aware
3. **Life Wheel Visualization** - Bánh xe cuộc sống
4. **Weekly Review System** - Đánh giá và phản tư hàng tuần
5. **Goals-Tasks-Habits Trinity** - Liên kết chặt chẽ 3 module chính
6. **Challenges & Competitions** - Game hóa việc xây dựng thói quen
7. **Offline-First Architecture** - IndexedDB caching
8. **Google Drive Backup** - Tự động backup
9. **Plugin System** - Mở rộng chức năng
10. **Multi-language Support** - Đa ngôn ngữ
11. **Workspace Collaboration** - Làm việc nhóm
12. **Subscription Management** - Quản lý gói đăng ký
13. **Advanced Admin Panel** - 20+ admin pages
14. **Pomodoro Integration** - Kỹ thuật Pomodoro
15. **Comprehensive Analytics** - Phân tích chi tiết

---

## Thống Kê Số Liệu

```
📁 Cấu trúc Code:
├── 20+ Pages
├── 142+ Components
├── 4 Services
├── 2 State Stores
├── 51 UI Components (shadcn-ui)
└── 12 Thư mục src chính

🗄️ Database:
├── 50+ Tables
├── 12 Enums
├── Triggers & Functions
└── RLS Policies

📦 Dependencies:
├── 58 Production packages
└── 13 Dev packages

📄 Documentation:
└── 90+ .md files (guides, setup, troubleshooting)
```

---

## Kết Luận

**LifeOSS** là một hệ thống quản lý cuộc sống cá nhân **cực kỳ toàn diện** với:

✅ **22+ modules chức năng**  
✅ **50+ database tables**  
✅ **142+ React components**  
✅ **AI-powered features**  
✅ **Enterprise-grade admin panel**  
✅ **Plugin architecture**  
✅ **Multi-language support**  
✅ **Offline-first design**  
✅ **Comprehensive backup system**  
✅ **Advanced analytics & insights**

Đây là một ứng dụng **production-ready** với kiến trúc **scalable**, **maintainable**, và **feature-rich**, phù hợp để phát triển thành một sản phẩm thương mại hoặc sử dụng cá nhân ở mức độ chuyên nghiệp.
