import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { ChatMessage } from '@/types/lifeos';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
  userBubble: '#8b5cf6', aiBubble: '#1e1e1e',
};

const QUICK_PROMPTS = [
  { label: '📊 Tóm tắt hôm nay', prompt: 'Hãy tóm tắt tiến độ công việc và thói quen hôm nay của tôi.' },
  { label: '🎯 Gợi ý mục tiêu', prompt: 'Gợi ý cho tôi 3 mục tiêu SMART có thể đặt cho tuần này.' },
  { label: '💡 Lời khuyên', prompt: 'Cho tôi lời khuyên để cải thiện năng suất dựa trên dữ liệu của tôi.' },
  { label: '📝 Viết journal', prompt: 'Gợi ý cho tôi prompt viết nhật ký phản ánh hôm nay.' },
  { label: '🔥 Duy trì streak', prompt: 'Làm thế nào để tôi duy trì streak thói quen tốt hơn?' },
];

// ─── Message Bubble ───
function MessageBubble({ message, onToggleFavorite }: {
  message: ChatMessage;
  onToggleFavorite: (id: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <TouchableOpacity
      onLongPress={() => onToggleFavorite(message.id)}
      delayLongPress={500}
      activeOpacity={0.8}
      style={[styles.bubbleContainer, isUser && styles.bubbleContainerUser]}
    >
      {!isUser && <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>🤖</Text></View>}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
          {message.content}
        </Text>
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>
            {new Date(message.createdAt).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {message.isFavorite && <Text style={styles.favStar}>⭐</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Context Card (shows user stats inline) ───
function ContextCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.contextCard}>
      <Text style={styles.contextIcon}>{icon}</Text>
      <View>
        <Text style={styles.contextValue}>{value}</Text>
        <Text style={styles.contextLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════
export default function AIChatScreen() {
  const chatMessages = useLifeOSStore(s => s.chatMessages);
  const addChatMessage = useLifeOSStore(s => s.addChatMessage);
  const clearChatHistory = useLifeOSStore(s => s.clearChatHistory);
  const toggleMessageFavorite = useLifeOSStore(s => s.toggleMessageFavorite);
  const saveConversation = useLifeOSStore(s => s.saveConversation);
  const tasks = useLifeOSStore(s => s.tasks);
  const habits = useLifeOSStore(s => s.habits);
  const goals = useLifeOSStore(s => s.goals);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatMessages.length]);

  // Build context summary for AI
  const contextSummary = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => !t.deletedAt && t.dueDate === todayStr);
    const doneTasks = todayTasks.filter(t => t.status === 'done').length;
    const activeGoals = goals.filter(g => !g.deletedAt && g.progress < 100);
    const todayHabits = habits.filter(h => !h.archivedAt);
    return {
      tasksDone: doneTasks,
      tasksTotal: todayTasks.length,
      activeGoals: activeGoals.length,
      habitsCount: todayHabits.length,
    };
  }, [tasks, habits, goals]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText) return;

    // Add user message
    addChatMessage({ role: 'user', content: messageText });
    setInput('');
    setIsLoading(true);

    // Simulate AI response (in real app, call your API here)
    setTimeout(() => {
      const response = generateLocalResponse(messageText, contextSummary);
      addChatMessage({ role: 'assistant', content: response });
      setIsLoading(false);
    }, 800 + Math.random() * 1200);
  }, [input, addChatMessage, contextSummary]);

  const handleClear = useCallback(() => {
    if (chatMessages.length === 0) return;
    Alert.alert('Xóa lịch sử', 'Bạn muốn lưu hội thoại trước khi xóa?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Lưu & Xóa', onPress: () => {
        saveConversation(`Chat ${new Date().toLocaleDateString('vi')}`);
        clearChatHistory();
      }},
      { text: 'Xóa luôn', style: 'destructive', onPress: clearChatHistory },
    ]);
  }, [chatMessages.length, saveConversation, clearChatHistory]);

  return (
    <>
      <Stack.Screen options={{ title: 'AI Assistant', headerRight: () => (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: C.muted, fontSize: 14 }}>🗑️</Text>
        </TouchableOpacity>
      )}} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {/* ── Messages ── */}
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} onToggleFavorite={toggleMessageFavorite} />
            )}
            ListHeaderComponent={
              chatMessages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeEmoji}>🤖</Text>
                  <Text style={styles.welcomeTitle}>Xin chào! Tôi là AI Assistant</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Tôi có thể giúp bạn quản lý mục tiêu, thói quen, và đưa ra gợi ý dựa trên dữ liệu của bạn.
                  </Text>

                  {/* Context cards */}
                  <View style={styles.contextRow}>
                    <ContextCard icon="✅" label="tasks hôm nay" value={`${contextSummary.tasksDone}/${contextSummary.tasksTotal}`} />
                    <ContextCard icon="🎯" label="goals đang làm" value={`${contextSummary.activeGoals}`} />
                    <ContextCard icon="🔄" label="habits" value={`${contextSummary.habitsCount}`} />
                  </View>
                </View>
              ) : null
            }
            ListFooterComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>🤖</Text></View>
                  <View style={styles.loadingBubble}>
                    <ActivityIndicator size="small" color={C.primary} />
                    <Text style={styles.loadingText}>Đang suy nghĩ...</Text>
                  </View>
                </View>
              ) : null
            }
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />

          {/* ── Quick Prompts ── */}
          {chatMessages.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll} contentContainerStyle={styles.promptsContent}>
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity key={i} onPress={() => handleSend(p.prompt)} style={styles.promptChip}>
                  <Text style={styles.promptChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Input Bar ── */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Hỏi gì đó..."
              placeholderTextColor="#666"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              disabled={!input.trim() || isLoading}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// Simple local response generator (placeholder for real AI)
function generateLocalResponse(userMessage: string, context: { tasksDone: number; tasksTotal: number; activeGoals: number; habitsCount: number }): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('tóm tắt') || msg.includes('hôm nay')) {
    return `📊 **Tóm tắt hôm nay:**\n\n` +
      `• Tasks: ${context.tasksDone}/${context.tasksTotal} hoàn thành\n` +
      `• Goals đang theo đuổi: ${context.activeGoals}\n` +
      `• Habits theo dõi: ${context.habitsCount}\n\n` +
      `${context.tasksDone === context.tasksTotal && context.tasksTotal > 0 ? '🎉 Tuyệt vời! Bạn đã hoàn thành tất cả tasks!' : 'Cố gắng hoàn thành các tasks còn lại nhé! 💪'}`;
  }

  if (msg.includes('mục tiêu') || msg.includes('goal')) {
    return `🎯 **Gợi ý mục tiêu SMART:**\n\n` +
      `1. **Cụ thể**: Đọc 2 chương sách mỗi ngày trong tuần này\n` +
      `2. **Đo lường**: Hoàn thành 5/7 habits mỗi ngày\n` +
      `3. **Thực tế**: Giảm thời gian social media xuống 30 phút/ngày\n\n` +
      `Bạn hiện có ${context.activeGoals} goals đang active. Hãy tập trung vào 1-2 goals quan trọng nhất!`;
  }

  if (msg.includes('streak') || msg.includes('thói quen') || msg.includes('habit')) {
    return `🔥 **Tips duy trì streak:**\n\n` +
      `1. Bắt đầu nhỏ — 2 phút/ngày\n` +
      `2. Gắn với trigger sẵn có (sau khi đánh răng → ...)\n` +
      `3. Không bỏ 2 ngày liên tiếp\n` +
      `4. Theo dõi bằng streak counter\n` +
      `5. Thưởng bản thân khi đạt milestones (7 ngày, 30 ngày)\n\n` +
      `Bạn đang track ${context.habitsCount} habits. Keep going! 🚀`;
  }

  if (msg.includes('journal') || msg.includes('nhật ký')) {
    return `📝 **Prompt nhật ký cho hôm nay:**\n\n` +
      `• Điều gì khiến bạn cảm thấy biết ơn nhất hôm nay?\n` +
      `• Một thử thách bạn đã vượt qua?\n` +
      `• Nếu được sống lại hôm nay, bạn sẽ làm khác điều gì?\n` +
      `• 3 từ mô tả ngày hôm nay của bạn?\n\n` +
      `Viết ít nhất 3 dòng mỗi ngày sẽ giúp bạn hiểu bản thân hơn! ✨`;
  }

  if (msg.includes('năng suất') || msg.includes('productivity') || msg.includes('lời khuyên')) {
    return `💡 **Gợi ý cải thiện năng suất:**\n\n` +
      `1. **Eat the frog** — Làm task khó nhất đầu tiên\n` +
      `2. **Time blocking** — Chia ngày thành blocks 90 phút\n` +
      `3. **2-minute rule** — Task dưới 2 phút → làm ngay\n` +
      `4. **Weekly review** — Mỗi CN dành 30 phút nhìn lại\n` +
      `5. **Digital sunset** — Tắt màn hình 1h trước khi ngủ\n\n` +
      `Với ${context.tasksTotal} tasks hôm nay, hãy ưu tiên 3 tasks quan trọng nhất! 🎯`;
  }

  return `Cảm ơn câu hỏi! 🤔\n\n` +
    `Tôi có thể giúp bạn với:\n` +
    `• Tóm tắt tiến độ hôm nay\n` +
    `• Gợi ý mục tiêu\n` +
    `• Tips duy trì thói quen\n` +
    `• Prompt viết nhật ký\n` +
    `• Lời khuyên năng suất\n\n` +
    `Hãy thử hỏi cụ thể hơn nhé! 😊`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Messages ──
  messagesList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  bubbleContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  bubbleContainerUser: { flexDirection: 'row-reverse' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  aiAvatarText: { fontSize: 14 },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: C.userBubble, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: C.aiBubble, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  bubbleText: { color: C.fg, fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: 'white' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  bubbleTime: { color: C.muted, fontSize: 10 },
  favStar: { fontSize: 10 },

  // ── Welcome ──
  welcomeContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  welcomeEmoji: { fontSize: 48, marginBottom: 16 },
  welcomeTitle: { color: C.fg, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  welcomeSubtitle: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  contextRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  contextCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: C.border,
  },
  contextIcon: { fontSize: 18 },
  contextValue: { color: C.fg, fontSize: 14, fontWeight: 'bold' },
  contextLabel: { color: C.muted, fontSize: 10 },

  // ── Loading ──
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  loadingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.aiBubble, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border,
  },
  loadingText: { color: C.muted, fontSize: 13 },

  // ── Prompts ──
  promptsScroll: { maxHeight: 44, marginBottom: 4 },
  promptsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  promptChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  promptChipText: { color: C.fg, fontSize: 13 },

  // ── Input Bar ──
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  textInput: {
    flex: 1, backgroundColor: C.card, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: C.fg, fontSize: 15, maxHeight: 100,
    borderWidth: 1, borderColor: C.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});
