import { latestWheel } from '@/lib/lifeWheel';
import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';
import { LIFE_AREAS } from '@/types/lifeos';
import { exportChatPdf, readSSE } from '../utils/coach.utils';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { askAssistant, looksLikeCommand, useExecuteAction, type AssistantAction, type ActionStatus } from '../voice/assistant';

export interface SendResult { reply: string; actions?: AssistantAction[] }

const AI_COACH_URL = functionUrl('ai-coach');

export function useCoach() {
  const s = useLifeOSStore;
  const messages = s((x) => x.chatMessages);
  const saved = s((x) => x.savedConversations);
  const user = s((x) => x.user);
  const goals = s((x) => x.goals);
  const habits = s((x) => x.habits);
  const tasks = s((x) => x.tasks);
  const journal = s((x) => x.journalEntries);
  const wheel = s((x) => x.lifeWheelScores);
  const [loading, setLoading] = useState(false);
  const synced = useSyncedStore();
  const applyAction = useExecuteAction();

  /** Số liệu hôm nay — cùng công thức với AICoachButton (useAICoachState), gửi kèm dailyStats mà backend đã hỗ trợ. */
  const today = useMemo(() => {
    const d = format(new Date(), 'yyyy-MM-dd');
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const todayHabits = activeHabits.filter((h) => h.frequency === 'daily' || h.customDays?.includes(new Date().getDay()));
    const live = tasks.filter((t) => !t.deletedAt);
    const pending = live.filter((t) => t.status !== 'done');
    const activeGoals = goals.filter((g) => !g.deletedAt && !g.completedAt && g.progress < 100);
    const recentJ = journal.filter((j) => j.date >= format(new Date(Date.now() - 6 * 864e5), 'yyyy-MM-dd'));
    const latestJ = [...journal].sort((a, b) => b.date.localeCompare(a.date))[0];
    const scores = latestWheel(wheel)?.scores;
    const lowArea = scores ? LIFE_AREAS.map((a) => ({ a, v: (scores as Record<string, number>)[a.id] ?? 5 })).sort((x, y) => x.v - y.v)[0] : undefined;
    return {
      habitsDone: todayHabits.filter((h) => h.completedDates.includes(d)).length, habitsTotal: todayHabits.length,
      tasksDoneToday: live.filter((t) => t.completedAt?.startsWith(d)).length, tasksPending: pending.length,
      overdue: pending.filter((t) => t.dueDate && t.dueDate < d).length,
      topTask: pending.filter((t) => t.priority === 'high').sort((a, b) => (a.dueDate || '9').localeCompare(b.dueDate || '9'))[0] ?? pending[0],
      nextHabit: todayHabits.find((h) => !h.completedDates.includes(d)),
      activeGoals, avgGoal: activeGoals.length ? Math.round(activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length) : 0,
      avgMood: recentJ.length ? recentJ.reduce((a, j) => a + j.mood, 0) / recentJ.length : 0,
      wroteToday: journal.some((j) => j.date === d), latestJ, scores, lowArea,
    };
  }, [habits, tasks, goals, journal, wheel]);

  const hasProfile = !!(user.lifePurpose || user.visions?.length || user.personalValues?.length);

  /** Gợi ý hôm nay — tạo từ dữ liệu thật; bấm vào sẽ gửi câu hỏi tương ứng. */
  const suggestions = useMemo(() => {
    const out: { emoji: string; title: string; desc: string; prompt: string }[] = [];
    if (today.topTask) out.push({ emoji: '✅', title: `Hoàn thành “${today.topTask.title}”`, desc: today.overdue ? `${today.overdue} việc quá hạn` : `${today.tasksPending} việc chưa xong`, prompt: `Giúp tôi lên kế hoạch để hoàn thành việc "${today.topTask.title}" hôm nay.` });
    if (today.nextHabit) out.push({ emoji: '🌱', title: `Duy trì “${today.nextHabit.name}”`, desc: `${today.habitsDone}/${today.habitsTotal} thói quen hôm nay`, prompt: `Làm sao để tôi duy trì thói quen "${today.nextHabit.name}" đều đặn hơn?` });
    if (!today.wroteToday) out.push({ emoji: '✍️', title: 'Viết nhật ký cuối ngày', desc: 'Duy trì thói quen suy ngẫm', prompt: 'Gợi ý cho tôi vài câu hỏi để viết nhật ký suy ngẫm cuối ngày.' });
    const g = today.activeGoals.slice().sort((a, b) => a.progress - b.progress)[0];
    if (g) out.push({ emoji: '🎯', title: `Tiến gần “${g.title}”`, desc: `Đang ở ${g.progress}%`, prompt: `Mục tiêu "${g.title}" của tôi đang ở ${g.progress}%. Bước tiếp theo nên là gì?` });
    if (today.lowArea) out.push({ emoji: '🧭', title: `Cải thiện ${today.lowArea.a.name}`, desc: `Điểm Life Wheel: ${today.lowArea.v}/10`, prompt: `Lĩnh vực ${today.lowArea.a.name} của tôi đang thấp nhất (${today.lowArea.v}/10). Tôi nên làm gì để cải thiện?` });
    return out.slice(0, 4);
  }, [today]);

  /**
   * Gửi tin nhắn. Câu có dạng lệnh ("tạo task…", "nhắc tôi…", "đã uống nước") được
   * trợ lý hành động phân tích trước → thẻ xác nhận; còn lại trò chuyện như cũ.
   * Trả về nội dung phản hồi để chế độ giọng nói đọc lại.
   */
  const send = useCallback(async (text: string, opts: { voice?: boolean; command?: boolean } = {}): Promise<SendResult> => {
    const content = text.trim();
    if (!content || loading) return { reply: '' };
    const st = s.getState();
    const history = st.chatMessages.map((m) => ({ role: m.role, content: m.content }));
    st.addChatMessage({ role: 'user', content, ...(opts.voice ? { voice: true } : {}) });
    setLoading(true);
    if (opts.command || looksLikeCommand(content)) {
      try {
        const r = await askAssistant(content);
        if (r.mode === 'actions' && r.actions.length) {
          const reply = r.message || (r.actions.length > 1 ? `Mình đã chuẩn bị ${r.actions.length} mục cho bạn, xác nhận để lưu nhé:` : 'Mình đã chuẩn bị xong, bạn xác nhận để lưu nhé:');
          s.getState().addChatMessage({ role: 'assistant', content: reply, actions: r.actions });
          setLoading(false);
          return { reply, actions: r.actions };
        }
        if (r.mode === 'unresolved') {
          const reply = `${r.message}. Bạn nói lại tên giúp mình nhé.`;
          s.getState().addChatMessage({ role: 'assistant', content: reply });
          setLoading(false);
          return { reply };
        }
      } catch (e) {
        if ((e as { status?: number }).status === 503) {
          const reply = '⚙️ AI chưa được cấu hình. Quản trị viên cần thêm provider + API key trong **Admin → AI Providers**, rồi chọn model ở **Admin → Model theo tính năng**.';
          s.getState().addChatMessage({ role: 'assistant', content: reply });
          setLoading(false);
          return { reply };
        }
        console.warn('AI assistant failed, falling back to chat', e);
      }
    }
    let acc = '';
    try {
      const userContext = {
        lifePurpose: user.lifePurpose, visions: user.visions, personalValues: user.personalValues, lifeRoles: user.lifeRoles, traits: user.traits,
        goals: goals.slice(0, 5).map((g) => ({ title: g.title, progress: g.progress })),
        dailyStats: { habitsCompleted: today.habitsDone, habitsTotal: today.habitsTotal, tasksCompleted: today.tasksDoneToday, tasksPending: today.tasksPending, overdueTasks: today.overdue, activeGoals: today.activeGoals.length, avgGoalProgress: today.avgGoal, mood: today.latestJ?.mood || 3, energy: today.latestJ?.energy || 3 },
        ...(today.scores ? { lifeWheelScores: Object.fromEntries(LIFE_AREAS.map((a) => [a.name, (today.scores as Record<string, number>)[a.id] ?? 5])) } : {}),
      };
      const token = await getAccessToken();
      const resp = await fetch(AI_COACH_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: [...history, { role: 'user', content }], userContext }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error('Vượt quá giới hạn request. Vui lòng thử lại sau.');
        else if (resp.status === 402) toast.error('Cần nạp thêm credit cho AI.');
        else if (resp.status === 503) {
          acc = '⚙️ AI chưa được cấu hình. Quản trị viên cần thêm provider + API key trong **Admin → AI Providers**, rồi chọn model ở **Admin → Model theo tính năng**.';
          s.getState().addChatMessage({ role: 'assistant', content: acc });
          return { reply: acc };
        }
        const detail = await resp.json().then((j: { error?: string; message?: string }) => j.error || j.message).catch(() => null);
        throw new Error(detail || 'Failed to get AI response');
      }
      s.getState().addChatMessage({ role: 'assistant', content: '' });
      await readSSE(resp.body, (chunk) => {
        acc += chunk;
        s.setState((state) => {
          const msgs = [...state.chatMessages]; const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') msgs[msgs.length - 1] = { ...last, content: acc };
          return { chatMessages: msgs };
        });
      });
    } catch (e) {
      console.error('AI Coach error:', e);
      const msg = (e as Error)?.message;
      acc = `❌ Có lỗi xảy ra${msg && msg !== 'Failed to get AI response' ? `: ${msg}` : ''}. Vui lòng thử lại sau.`;
      s.getState().addChatMessage({ role: 'assistant', content: acc });
    } finally { setLoading(false); }
    return { reply: acc };
  }, [loading, user, goals, today, s]);

  /** Cập nhật trạng thái một hành động trong tin nhắn chat. */
  const setActionStatus = useCallback((actionId: string, status: ActionStatus) => {
    s.setState((state) => ({
      chatMessages: state.chatMessages.map((m) => (m.actions?.some((a) => a.id === actionId)
        ? { ...m, actions: m.actions.map((a) => (a.id === actionId ? { ...a, status } : a)) } : m)),
    }));
  }, [s]);

  const findAction = (id: string) => s.getState().chatMessages.flatMap((m) => (m.actions ?? []) as AssistantAction[]).find((a) => a.id === id);

  /** Xác nhận một hành động → lưu dữ liệu qua store đồng bộ. Trả về câu tóm tắt. */
  const confirmAction = useCallback(async (actionId: string, { silent = false } = {}) => {
    const a = findAction(actionId);
    if (!a || a.status !== 'pending') return '';
    try {
      const { message: msg, undo } = await applyAction(a);
      setActionStatus(actionId, 'done');
      if (!silent) toast.success(msg, undo ? { action: { label: 'Hoàn tác', onClick: () => { void undo().then(() => setActionStatus(actionId, 'undone')); } } } : undefined);
      return msg;
    } catch (e) {
      console.error('Apply action failed', e);
      toast.error('Không lưu được, thử lại nhé.');
      return '';
    }
  }, [applyAction, setActionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingActions = useCallback(() => s.getState().chatMessages.flatMap((m) => (m.actions ?? []) as AssistantAction[]).filter((a) => a.status === 'pending'), [s]);

  const confirmAll = useCallback(async (ids?: string[]) => {
    const list = ids ?? pendingActions().map((a) => a.id);
    const done: string[] = [];
    for (const id of list) { const m = await confirmAction(id, { silent: true }); if (m) done.push(m); }
    if (done.length) toast.success(done.length > 1 ? `Đã lưu ${done.length} mục` : done[0]);
    return done;
  }, [confirmAction, pendingActions]);

  const dismissAll = useCallback(() => pendingActions().forEach((a) => setActionStatus(a.id, 'dismissed')), [pendingActions, setActionStatus]);

  const st = s.getState();
  return {
    messages, saved, user, today, hasProfile, suggestions, loading, send,
    confirmAction, confirmAll, dismissAll, pendingActions,
    dismissAction: (id: string) => setActionStatus(id, 'dismissed'),
    clear: st.clearChatHistory,
    toggleFavorite: st.toggleMessageFavorite,
    save: (title: string) => { st.saveConversation(title); toast.success('Đã lưu cuộc trò chuyện!'); },
    load: (id: string) => { st.loadSavedConversation(id); toast.success('Đã tải cuộc trò chuyện!'); },
    removeSaved: (id: string) => { st.deleteSavedConversation(id); toast.success('Đã xóa!'); },
    toNote: (content: string) => { void synced.addNote({ title: 'Ghi chú từ AI Coach', content, isPinned: false, isFavorite: false, tags: [] }); toast.success('Đã tạo ghi chú từ tin nhắn!'); },
    exportPdf: () => { if (!messages.length) return toast.error('Không có tin nhắn để xuất'); exportChatPdf(messages); toast.success('Đã xuất PDF thành công!'); },
  };
}
export type CoachApi = ReturnType<typeof useCoach>;
