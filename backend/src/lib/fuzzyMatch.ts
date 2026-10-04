// Khớp tên gần đúng (không phân biệt dấu/hoa thường) để lệnh giọng nói như
// "xong việc goi dien cho me" tìm đúng công việc "Gọi điện cho mẹ".

export const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const STOP = new Set([
  'toi', 'minh', 'em', 'anh', 'chi', 'da', 'roi', 'xong', 'cai', 'viec', 'cong', 'thoi', 'quen', 'hom', 'nay',
  'lam', 'nhe', 'a', 'la', 'cho', 'va', 'cua', 'duoc', 'muc', 'tieu', 'danh', 'dau', 'hoan', 'thanh', 'check',
  'in', 'the', 'nhiem', 'vu', 'task', 'habit', 'goal', 'luc', 'vao', 'sang', 'mot', 'nhung', 'de', 've',
]);
const toks = (s: string) => fold(s).split(' ').filter((t) => t && !STOP.has(t));

const lev1 = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0; let j = 0; let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};
const tokEq = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && lev1(a, b)) || ((a.startsWith(b) || b.startsWith(a)) && Math.min(a.length, b.length) >= 4);

/** Điểm 0–1: tên ứng viên khớp với câu truy vấn tới đâu. */
export function matchScore(query: string, candidate: string): number {
  const fq = fold(query); const fc = fold(candidate);
  if (!fq || !fc) return 0;
  if (fq === fc) return 1;
  if (fc.length >= 4 && ` ${fq} `.includes(` ${fc} `)) return 0.95;
  // Câu nói nằm trọn trong tên dài hơn: càng phủ nhiều tên càng chắc.
  if (fq.length >= 4 && ` ${fc} `.includes(` ${fq} `)) return Math.round((0.7 + 0.25 * (fq.length / fc.length)) * 100) / 100;
  const q = toks(query); const c = toks(candidate);
  if (!q.length || !c.length) return 0;
  const hitC = c.filter((t) => q.some((u) => tokEq(t, u))).length;
  const hitQ = q.filter((t) => c.some((u) => tokEq(t, u))).length;
  return Math.round((0.7 * (hitC / c.length) + 0.3 * (hitQ / q.length)) * 100) / 100;
}
