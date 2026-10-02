import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { DataSyncProvider } from "@/providers/DataSyncProvider";
import { externalSupabase, isExternalSupabaseConfigured, EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, ensureValidSession, clearSessionCache } from "@/integrations/supabase/externalClient";
import { syncPerformanceTracker } from "@/utils/syncPerformance";

const queryClient = new QueryClient();
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
// FloatingActionButton removed — AI Coach is now in the More menu
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import AuthPage from "./features/auth/AuthPage";
import AuthPageLegacy from "./pages/AuthPage";
import LegacyTodayPage from "./pages/TodayPage";
import TodayPage from "./features/today/TodayPage";
import InsightsPage from "./features/insights/InsightsPage";
import DashboardPageLegacy from "./pages/DashboardPageLegacy";
import HabitsPage from "./features/habits/HabitsPage";
import HabitsPageLegacy from "./pages/HabitsPageLegacy";
import TasksPage from "./features/tasks/TasksPage";
import TasksPageLegacy from "./pages/TasksPageLegacy";
import GoalsPage from "./features/goals/GoalsPage";
import GoalsPageLegacy from "./pages/GoalsPageLegacy";
import JournalPage from "./features/journal/JournalPage";
import JournalPageLegacy from "./pages/JournalPageLegacy";
import LifeWheelPage from "./features/life-wheel/LifeWheelPage";
import LifeWheelPageLegacy from "./pages/LifeWheelPageLegacy";
import WeeklyReviewPage from "./features/reviews/WeeklyReviewPage";
import WeeklyReviewPageLegacy from "./pages/WeeklyReviewPageLegacy";
import AICoachPage from "./features/ai-coach/AICoachPage";
import AIChatPageLegacy from "./pages/AIChatPageLegacy";
import LegacyNotesPage from "./pages/NotesPage";
import NotesPage from "./features/notes/NotesPage";
import LegacyTrashPage from "./pages/TrashPage";
import TrashPage from "./features/trash/TrashPage";
import LegacyMePage from "./pages/MePage";
import MePage from "./features/me/MePage";
import LegacySettingsPage from "./pages/SettingsPage";
import SettingsPage from "./features/settings/SettingsPage";
import HealthPage from "./features/health/HealthPage";
import HealthPageLegacy from "./pages/HealthPageLegacy";
import FinancePage from "./features/finance/FinancePage";
import FinancePageLegacy from "./pages/FinancePageLegacy";
import LearningPage from "./features/learning/LearningPage";
import LearningPageLegacy from "./pages/LearningPageLegacy";
import RelationshipsPage from "./features/relationships/RelationshipsPage";
import RelationshipsPageLegacy from "./pages/RelationshipsPageLegacy";
import MonthlyReviewPage from "./features/reviews/MonthlyReviewPage";
import MonthlyReviewPageLegacy from "./pages/MonthlyReviewPageLegacy";
import YearlyPlanningPage from "./features/reviews/YearlyPlanningPage";
import YearlyPlanningPageLegacy from "./pages/YearlyPlanningPageLegacy";
import YearlyReviewPage from "./features/reviews/YearlyReviewPage";
import YearlyReviewPageLegacy from "./pages/YearlyReviewPageLegacy";
import CalendarPage from "./features/calendar/CalendarPage";
import CalendarPageLegacy from "./pages/CalendarPageLegacy";
import LegacyPersonalizationPage from "./pages/PersonalizationPage";
import PersonalizationPage from "./features/personalization/PersonalizationPage";
import LegacyAIMemoryPage from "./pages/AIMemoryPage";
import AIMemoryPage from "./features/ai-memory/AIMemoryPage";
import LegacyDecisionLogPage from "./pages/DecisionLogPage";
import DecisionLogPage from "./features/decisions/DecisionLogPage";
import LegacyAreaDashboardPage from "./pages/AreaDashboardPage";
import AreaDashboardPage from "./features/area-dashboard/AreaDashboardPage";
import LegacyGettingStartedPage from "./pages/GettingStartedPage";
import GettingStartedPage from "./features/journey/JourneyPage";
import NotFound from "./features/not-found/NotFoundPage";
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWorkspaces from "./pages/admin/AdminWorkspaces";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminUsersPage from "./features/admin/users/AdminUsersPage";
import AdminWorkspacesPage from "./features/admin/workspaces/AdminWorkspacesPage";
import AdminPlansPage from "./features/admin/plans/AdminPlansPage";
import AdminAIProvidersPage from "./features/admin/ai/AdminAIProvidersPage";
import AdminAIModelsPage from "./features/admin/ai/AdminAIModelsPage";
import AdminAIPromptsPage from "./features/admin/ai/AdminAIPromptsPage";
import AdminTemplatesLibrary from "./features/admin/templates/AdminTemplatesPage";
import AdminAnalyticsPage from "./features/admin/analytics/AdminAnalyticsPage";
import AdminLocalizationPage from "./features/admin/localization/AdminLocalizationPage";
import AdminAPIKeysPage from "./features/admin/apikeys/AdminAPIKeysPage";
import AdminVoicePage from "./features/admin/voice/AdminVoicePage";
import AdminAIFeaturesPage from "./features/admin/ai/AdminAIFeaturesPage";
import AdminSystemSettingsPage from "./features/admin/system/AdminSystemSettingsPage";
import AdminSystemLogsPage from "./features/admin/logs/AdminSystemLogsPage";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminTemplatesPage from "./pages/admin/AdminTemplatesPage";
import AdminThemes from "./pages/admin/AdminThemes";
import AdminLanguages from "./pages/admin/AdminLanguages";
import AdminTranslations from "./pages/admin/AdminTranslations";
import AdminAIModels from "./pages/admin/AdminAIModels";
import AdminAIProviders from "./pages/admin/AdminAIProviders";
import AdminAIMemory from "./pages/admin/AdminAIMemory";
import AdminAIPrompts from "./pages/admin/AdminAIPrompts";
import AdminAPIKeys from "./pages/admin/AdminAPIKeys";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminFlags from "./pages/admin/AdminFlags";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminEmailLogs from "./pages/admin/AdminEmailLogs";
import AdminDataManagement from "./pages/admin/AdminDataManagement";
import AdminGoogleDriveBackup from "./pages/admin/AdminGoogleDriveBackup";


// Main app content with AppLayout
function MainApp() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/today/classic" element={<LegacyTodayPage />} />
        <Route path="/dashboard" element={<InsightsPage />} />
        <Route path="/dashboard/classic" element={<DashboardPageLegacy />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/habits/classic" element={<HabitsPageLegacy />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/classic" element={<TasksPageLegacy />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/classic" element={<GoalsPageLegacy />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/journal/classic" element={<JournalPageLegacy />} />
        <Route path="/life-wheel" element={<LifeWheelPage />} />
        <Route path="/life-wheel/classic" element={<LifeWheelPageLegacy />} />
        <Route path="/weekly-review" element={<WeeklyReviewPage />} />
        <Route path="/weekly-review/classic" element={<WeeklyReviewPageLegacy />} />
        <Route path="/monthly-review" element={<MonthlyReviewPage />} />
        <Route path="/monthly-review/classic" element={<MonthlyReviewPageLegacy />} />
        <Route path="/yearly-planning" element={<YearlyPlanningPage />} />
        <Route path="/yearly-planning/classic" element={<YearlyPlanningPageLegacy />} />
        <Route path="/yearly-review" element={<YearlyReviewPage />} />
        <Route path="/yearly-review/classic" element={<YearlyReviewPageLegacy />} />
        <Route path="/ai-chat" element={<AICoachPage />} />
        <Route path="/ai-chat/classic" element={<AIChatPageLegacy />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/classic" element={<LegacyNotesPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/health/classic" element={<HealthPageLegacy />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/finance/classic" element={<FinancePageLegacy />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/learning/classic" element={<LearningPageLegacy />} />
        <Route path="/relationships" element={<RelationshipsPage />} />
        <Route path="/relationships/classic" element={<RelationshipsPageLegacy />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/calendar/classic" element={<CalendarPageLegacy />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/trash/classic" element={<LegacyTrashPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/me/classic" element={<LegacyMePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/classic" element={<LegacySettingsPage />} />
        <Route path="/personalization" element={<PersonalizationPage />} />
        <Route path="/personalization/classic" element={<LegacyPersonalizationPage />} />
        <Route path="/ai-memory" element={<AIMemoryPage />} />
        <Route path="/ai-memory/classic" element={<LegacyAIMemoryPage />} />
        <Route path="/decisions" element={<DecisionLogPage />} />
        <Route path="/decisions/classic" element={<LegacyDecisionLogPage />} />
        <Route path="/area-dashboard" element={<AreaDashboardPage />} />
        <Route path="/area-dashboard/classic" element={<LegacyAreaDashboardPage />} />
        <Route path="/journey" element={<GettingStartedPage />} />
        <Route path="/journey/classic" element={<LegacyGettingStartedPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

// Admin panel content
function AdminApp() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/classic" element={<AdminUsers />} />
        <Route path="workspaces" element={<AdminWorkspacesPage />} />
        <Route path="workspaces/classic" element={<AdminWorkspaces />} />
        <Route path="plans" element={<AdminPlansPage />} />
        <Route path="plans/classic" element={<AdminPlans />} />
        <Route path="features" element={<AdminFeatures />} />
        <Route path="templates/goals" element={<AdminTemplatesLibrary type="goals" />} />
        <Route path="templates/goals/classic" element={<AdminTemplatesPage type="goals" />} />
        <Route path="templates/habits" element={<AdminTemplatesLibrary type="habits" />} />
        <Route path="templates/habits/classic" element={<AdminTemplatesPage type="habits" />} />
        <Route path="templates/tasks" element={<AdminTemplatesLibrary type="tasks" />} />
        <Route path="templates/tasks/classic" element={<AdminTemplatesPage type="tasks" />} />
        <Route path="templates/journal" element={<AdminTemplatesLibrary type="journal" />} />
        <Route path="templates/journal/classic" element={<AdminTemplatesPage type="journal" />} />
        <Route path="templates/review" element={<AdminTemplatesLibrary type="review" />} />
        <Route path="templates/review/classic" element={<AdminTemplatesPage type="review" />} />
        <Route path="themes" element={<AdminThemes />} />
        <Route path="languages" element={<AdminLocalizationPage initialView="languages" />} />
        <Route path="languages/classic" element={<AdminLanguages />} />
        <Route path="translations" element={<AdminLocalizationPage initialView="translations" />} />
        <Route path="translations/classic" element={<AdminTranslations />} />
        <Route path="ai/providers" element={<AdminAIProvidersPage />} />
        <Route path="ai/providers/classic" element={<AdminAIProviders />} />
        <Route path="ai/models" element={<AdminAIModelsPage />} />
        <Route path="ai/models/classic" element={<AdminAIModels />} />
        <Route path="ai/memory" element={<AdminAIMemory />} />
        <Route path="ai/prompts" element={<AdminAIPromptsPage />} />
        <Route path="ai/prompts/classic" element={<AdminAIPrompts />} />
        <Route path="api-keys" element={<AdminAPIKeysPage />} />
        <Route path="ai/voice" element={<AdminVoicePage />} />
        <Route path="ai/features" element={<AdminAIFeaturesPage />} />
        <Route path="api-keys/classic" element={<AdminAPIKeys />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="analytics/classic" element={<AdminAnalytics />} />
        <Route path="logs" element={<AdminSystemLogsPage />} />
        <Route path="logs/classic" element={<AdminLogs />} />
        <Route path="flags" element={<AdminFlags />} />
        <Route path="settings" element={<AdminSystemSettingsPage />} />
        <Route path="settings/classic" element={<AdminSettings />} />
        <Route path="email-templates" element={<AdminEmailTemplates />} />
        <Route path="email-logs" element={<AdminEmailLogs />} />
        <Route path="data" element={<AdminDataManagement />} />
        <Route path="backup" element={<AdminGoogleDriveBackup />} />
      </Route>
    </Routes>
  );
}

// Debug utilities for browser console
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__LIFEOS_DEBUG__ = {
    supabaseUrl: EXTERNAL_SUPABASE_URL,
    isConfigured: isExternalSupabaseConfigured,
    isLocal: EXTERNAL_SUPABASE_URL?.includes('localhost') || EXTERNAL_SUPABASE_URL?.includes('127.0.0.1'),
    async checkConnection() {
      try {
        if (!externalSupabase) {
          return { success: false, error: 'External Supabase not configured' };
        }
        const { data, error } = await externalSupabase.from('profiles').select('id').limit(1);
        if (error) {
          return { success: false, error: error.message, code: error.code };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    async checkSession() {
      try {
        if (!externalSupabase) {
          return { hasSession: false, error: 'External Supabase not configured' };
        }
        const { data: { session }, error } = await externalSupabase.auth.getSession();
        if (error) {
          return { hasSession: false, error: error.message };
        }
        return {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at,
        };
      } catch (err: any) {
        return { hasSession: false, error: err.message };
      }
    },
    getActiveSupabase() {
      return externalSupabase;
    },
    ensureValidSession,
    clearSessionCache,
    getPerformanceStats() {
      return syncPerformanceTracker.getStats();
    },
    logPerformanceSummary() {
      syncPerformanceTracker.logSummary();
    },
  };
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/classic" element={<AuthPageLegacy />} />
              <Route path="/admin/*" element={<AdminProtectedRoute><AdminApp /></AdminProtectedRoute>} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DataSyncProvider>
                      <MainApp />
                      <OfflineIndicator />
                    </DataSyncProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
