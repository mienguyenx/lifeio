import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import type { ChatMessage } from '@/types/lifeos';
import type { LifeIconName } from '@/components/icons/LifeIcon';
import type { Tint } from '@/components/lio';

/** Gợi ý nhanh — giữ nguyên 5 câu của trang AI Coach cũ. */
export const QUICK_PROMPTS = [
  { icon: '💪', text: 'Làm sao để duy trì habit tốt hơn?' },
  { icon: '🎯', text: 'Gợi ý cách đặt mục tiêu SMART' },
  { icon: '⏰', text: 'Tips quản lý thời gian hiệu quả' },
  { icon: '😌', text: 'Cách giảm stress và cân bằng cuộc sống' },
  { icon: '🧭', text: 'Tư vấn dựa trên Vision & Values của tôi' },
];

/** Hành động nhanh = câu hỏi soạn sẵn gửi cho AI Coach (không phải tính năng mới, chỉ là lối tắt prompt). */
export const QUICK_ACTIONS: { icon: LifeIconName; tint: Tint; title: string; desc: string; prompt: string }[] = [
  { icon: 'module/tasks', tint: 'violet', title: 'Lập kế hoạch', desc: 'Kế hoạch cho hôm nay', prompt: 'Dựa trên công việc và mục tiêu hiện tại, hãy giúp tôi lập kế hoạch cho hôm nay.' },
  { icon: 'module/insights', tint: 'mint', title: 'Phân tích tiến độ', desc: 'Đánh giá mục tiêu, thói quen', prompt: 'Hãy phân tích tiến độ mục tiêu và thói quen của tôi, chỉ ra điểm cần cải thiện.' },
  { icon: 'module/habits', tint: 'sky', title: 'Tạo thói quen', desc: 'Xây dựng thói quen mới', prompt: 'Gợi ý cho tôi một thói quen mới phù hợp với mục tiêu hiện tại và cách duy trì nó.' },
  { icon: 'module/goals', tint: 'amber', title: 'Định hướng cuộc sống', desc: 'Theo Vision & Values', prompt: QUICK_PROMPTS[4].text },
  { icon: 'mood/happy', tint: 'rose', title: 'Hỗ trợ tinh thần', desc: 'Động lực và mindset', prompt: QUICK_PROMPTS[3].text },
  { icon: 'module/focus', tint: 'orange', title: 'Quản lý thời gian', desc: 'Tập trung hiệu quả', prompt: QUICK_PROMPTS[2].text },
];

/** Đọc luồng SSE (OpenAI-compatible) — logic giữ nguyên từ trang cũ. */
export async function readSSE(body: ReadableStream<Uint8Array>, onDelta: (chunk: string) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = ''; let done = false;
  const handle = (line: string): 'done' | 'retry' | void => {
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) return;
    const json = line.slice(6).trim();
    if (json === '[DONE]') return 'done';
    try { const c = JSON.parse(json).choices?.[0]?.delta?.content as string | undefined; if (c) onDelta(c); } catch { return 'retry'; }
  };
  while (!done) {
    const { done: rDone, value } = await reader.read();
    if (rDone) break;
    buf += decoder.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1);
      const r = handle(line);
      if (r === 'done') { done = true; break; }
      if (r === 'retry') { buf = line + '\n' + buf; break; }
    }
  }
  if (buf.trim()) buf.split('\n').forEach((l) => l && handle(l));
}

/** Xuất PDF — giữ nguyên định dạng của trang cũ. */
export function exportChatPdf(messages: ChatMessage[]) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth(); const ph = doc.internal.pageSize.getHeight();
  const m = 20; const max = pw - m * 2; let y = m;
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text('AI Coach - Cuoc tro chuyen', m, y); y += 10;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(`Xuat ngay: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, m, y); y += 15;
  doc.setFontSize(11);
  messages.forEach((msg) => {
    if (y > ph - 40) { doc.addPage(); y = m; }
    doc.setFont('helvetica', 'bold'); doc.text(msg.role === 'user' ? 'Ban:' : 'AI Coach:', m, y); y += 6;
    doc.setFont('helvetica', 'normal');
    (doc.splitTextToSize(msg.content, max) as string[]).forEach((line) => { if (y > ph - 20) { doc.addPage(); y = m; } doc.text(line, m, y); y += 5; });
    y += 8;
  });
  doc.save(`ai-coach-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
}
