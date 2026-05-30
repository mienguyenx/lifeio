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
import AuthPage from "./pages/AuthPage";
import TodayPage from "./pages/TodayPage";
import DashboardPage from "./pages/DashboardPage";
import HabitsPage from "./pages/HabitsPage";
import TasksPage from "./pages/TasksPage";
import GoalsPage from "./pages/GoalsPage";
import JournalPage from "./pages/JournalPage";
import LifeWheelPage from "./pages/LifeWheelPage";
import WeeklyReviewPage from "./pages/WeeklyReviewPage";
import AIChatPage from "./pages/AIChatPage";
import NotesPage from "./pages/NotesPage";
import TrashPage from "./pages/TrashPage";
import MePage from "./pages/MePage";
import SettingsPage from "./pages/SettingsPage";
import HealthPage from "./pages/HealthPage";
import FinancePage from "./pages/FinancePage";
import LearningPage from "./pages/LearningPage";
import RelationshipsPage from "./pages/RelationshipsPage";
import MonthlyReviewPage from "./pages/MonthlyReviewPage";
import YearlyPlanningPage from "./pages/YearlyPlanningPage";
import YearlyReviewPage from "./pages/YearlyReviewPage";
import CalendarPage from "./pages/CalendarPage";
import PersonalizationPage from "./pages/PersonalizationPage";
import AIMemoryPage from "./pages/AIMemoryPage";
import DecisionLogPage from "./pages/DecisionLogPage";
import AreaDashboardPage from "./pages/AreaDashboardPage";
import GettingStartedPage from "./pages/GettingStartedPage";
import NotFound from "./pages/NotFound";
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWorkspaces from "./pages/admin/AdminWorkspaces";
import AdminPlans from "./pages/admin/AdminPlans";
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/life-wheel" element={<LifeWheelPage />} />
        <Route path="/weekly-review" element={<WeeklyReviewPage />} />
        <Route path="/monthly-review" element={<MonthlyReviewPage />} />
        <Route path="/yearly-planning" element={<YearlyPlanningPage />} />
        <Route path="/yearly-review" element={<YearlyReviewPage />} />
        <Route path="/ai-chat" element={<AIChatPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/relationships" element={<RelationshipsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/personalization" element={<PersonalizationPage />} />
        <Route path="/ai-memory" element={<AIMemoryPage />} />
        <Route path="/decisions" element={<DecisionLogPage />} />
        <Route path="/area-dashboard" element={<AreaDashboardPage />} />
        <Route path="/journey" element={<GettingStartedPage />} />
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
        <Route path="users" element={<AdminUsers />} />
        <Route path="workspaces" element={<AdminWorkspaces />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="features" element={<AdminFeatures />} />
        <Route path="templates/goals" element={<AdminTemplatesPage type="goals" />} />
        <Route path="templates/habits" element={<AdminTemplatesPage type="habits" />} />
        <Route path="templates/tasks" element={<AdminTemplatesPage type="tasks" />} />
        <Route path="templates/journal" element={<AdminTemplatesPage type="journal" />} />
        <Route path="templates/review" element={<AdminTemplatesPage type="review" />} />
        <Route path="themes" element={<AdminThemes />} />
        <Route path="languages" element={<AdminLanguages />} />
        <Route path="translations" element={<AdminTranslations />} />
        <Route path="ai/providers" element={<AdminAIProviders />} />
        <Route path="ai/models" element={<AdminAIModels />} />
        <Route path="ai/memory" element={<AdminAIMemory />} />
        <Route path="ai/prompts" element={<AdminAIPrompts />} />
        <Route path="api-keys" element={<AdminAPIKeys />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="flags" element={<AdminFlags />} />
        <Route path="settings" element={<AdminSettings />} />
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
