// Quy đổi mốc thời gian tiếng Việt ("mai", "thứ 6 tuần sau", "6 giờ chiều",
// "30 phút nữa", "15/8"…) thành ngày/giờ cụ thể một cách xác định. Kết quả được
// (1) gợi ý cho LLM trong system prompt và (2) dùng để sửa ngày/giờ LLM trả về
// khi câu chỉ có đúng một mốc rõ ràng — model rẻ hay tính sai thứ/ngày.

export interface TemporalHit {
  phrase: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  /** Giờ không kèm buổi (sáng/chiều…) và có thể hiểu theo hai cách. */
  ambiguous?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dowOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();
/** Thứ hai của tuần chứa `iso` (tuần Việt Nam bắt đầu từ thứ hai). */
const mondayOf = (iso: string) => addDays(iso, -((dowOf(iso) + 6) % 7));
const lastDayOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m: 1-12

/** Bỏ dấu, giữ nguyên độ dài chuỗi để vị trí khớp được ánh xạ về câu gốc. */
export function foldKeepLength(s: string): string {
  let out = '';
  for (const ch of s) {
    const base = ch === 'đ' || ch === 'Đ' ? 'd' : ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    out += (base.length === ch.length ? base : ch).toLowerCase();
  }
  return out;
}

const NUM: Record<string, number> = {
  mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, sau: 6, bay: 7, tam: 8, chin: 9, muoi: 10,
  'muoi mot': 11, 'muoi hai': 12, 'muoi lam': 15, nua: 0.5,
};
const NUM_RE = '(\\d{1,3}|muoi mot|muoi hai|muoi lam|muoi|mot|hai|ba|bon|nam|sau|bay|tam|chin)';
const toNum = (s: string) => (/^\d+$/.test(s) ? Number(s) : NUM[s] ?? NaN);

const WEEKDAY: Record<string, number> = { '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, hai: 1, ba: 2, tu: 3, nam: 4, sau: 5, bay: 6 };

/** Trích các mốc thời gian trong câu (theo thứ tự xuất hiện). */
export function extractVnTemporal(text: string, today: string, now = '09:00'): TemporalHit[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return [];
  const src = text.slice(0, 2000);
  const plain = foldKeepLength(src);
  const hits: (TemporalHit & { at: number; end: number })[] = [];
  // Ngày và giờ được theo dõi riêng: "6 giờ chiều mai" → giờ «6 giờ chiều» + ngày «chiều mai».
  const used: Record<'d' | 't', [number, number][]> = { d: [], t: [] };
  const add = (m: RegExpExecArray, h: Omit<TemporalHit, 'phrase'>, group = 0) => {
    const at = m.index + m[0].indexOf(m[group]);
    const end = at + m[group].length;
    const k = h.time ? 't' : 'd';
    if (used[k].some(([x, y]) => at < y && end > x)) return;
    used[k].push([at, end]);
    hits.push({ phrase: src.slice(at, end).trim(), ...h, at, end });
  };
  const scan = (re: RegExp, fn: (m: RegExpExecArray) => void) => {
    re.lastIndex = 0;
    for (let m = re.exec(plain); m; m = re.exec(plain)) fn(m);
  };
  const [ty, tm, td] = today.split('-').map(Number);

  // --- Ngày tuyệt đối: 15/8, 15-8-2025, ngày 15 tháng 8, mùng 5 ---
  const absDate = (d: number, mo?: number, y?: number) => {
    if (!(d >= 1 && d <= 31)) return undefined;
    let year = y ? (y < 100 ? 2000 + y : y) : ty;
    let month = mo ?? tm;
    if (!(month >= 1 && month <= 12)) return undefined;
    if (!mo && d < td) { month += 1; if (month > 12) { month = 1; year += 1; } }
    if (d > lastDayOfMonth(year, month)) return undefined;
    let iso = `${year}-${pad(month)}-${pad(d)}`;
    // "15/1" nói vào tháng 12 → năm sau (nếu đã qua hơn ~6 tháng).
    if (!y && mo && (Date.parse(today) - Date.parse(iso)) / 864e5 > 180) iso = `${year + 1}-${pad(month)}-${pad(d)}`;
    return iso;
  };
  scan(/\b(?:ngay|mung|hom)\s+(\d{1,2})\s*(?:thang\s+(\d{1,2})|[/-]\s*(\d{1,2}))(?:\s*(?:nam\s+|[/-]\s*)(\d{2,4}))?\b/g, (m) => {
    const iso = absDate(Number(m[1]), Number(m[2] ?? m[3]), m[4] ? Number(m[4]) : undefined);
    if (iso) add(m, { date: iso });
  });
  scan(/\b(\d{1,2})\s*(?:[/-]\s*(\d{1,2})|\s+thang\s+(\d{1,2}))(?:\s*(?:[/-]|nam)\s*(\d{2,4}))?\b/g, (m) => {
    const iso = absDate(Number(m[1]), Number(m[2] ?? m[3]), m[4] ? Number(m[4]) : undefined);
    if (iso) add(m, { date: iso });
  });
  scan(/\b(?:ngay|mung)\s+(\d{1,2})\b(?!\s*(?:gio|h\b|phut|tieng|lan|ly|ngay|tuan))/g, (m) => {
    const iso = absDate(Number(m[1]));
    if (iso) add(m, { date: iso });
  });

  // --- Thứ trong tuần (+ tuần này / sau / tới / trước) ---
  scan(/\b(?:(thu)\s*(2|3|4|5|6|7|hai|ba|tu|nam|sau|bay)\b|(chu nhat|cn)\b)(?:\s*(?:,\s*)?(tuan\s+(?:nay|sau|toi|nua|truoc)|nay|toi))?/g, (m) => {
    const target = m[3] ? 0 : WEEKDAY[m[2]];
    if (target === undefined) return;
    // "lần thứ ba" là số thứ tự, không phải ngày.
    if (/\b(lan|nguoi|cai|buoi|hang|dung)\s*$/.test(plain.slice(Math.max(0, m.index - 8), m.index))) return;
    const offset = (target + 6) % 7; // thứ hai = 0 … chủ nhật = 6
    const q = m[4] ?? '';
    let iso: string;
    if (/sau|toi|nua/.test(q) && q.startsWith('tuan')) iso = addDays(mondayOf(today), 7 + offset);
    else if (q.includes('truoc')) iso = addDays(mondayOf(today), -7 + offset);
    else if (q.includes('nay')) iso = addDays(mondayOf(today), offset);
    else iso = addDays(today, (target - dowOf(today) + 7) % 7);
    add(m, { date: iso });
  });

  // --- Cụm ngày tương đối ---
  scan(/\b(cuoi tuan|dau tuan)(?:\s+(nay|sau|toi|truoc))?\b/g, (m) => {
    const q = m[2] ?? '';
    const base = mondayOf(today);
    const week = q === 'sau' || q === 'toi' ? 7 : q === 'truoc' ? -7 : 0;
    if (m[1] === 'cuoi tuan') add(m, { date: addDays(base, week + 5) });
    else add(m, { date: addDays(base, q ? week : 7) });
  });
  scan(/\b(tuan\s+(?:sau|toi))\b/g, (m) => add(m, { date: addDays(mondayOf(today), 7) }));
  scan(/\b(cuoi|dau|giua)\s+thang(?:\s+(nay|sau|toi))?\b/g, (m) => {
    let y = ty; let mo = tm;
    const next = m[2] === 'sau' || m[2] === 'toi' || (m[1] === 'dau' && m[2] !== 'nay');
    if (next) { mo += 1; if (mo > 12) { mo = 1; y += 1; } }
    const d = m[1] === 'cuoi' ? lastDayOfMonth(y, mo) : m[1] === 'giua' ? 15 : 1;
    add(m, { date: `${y}-${pad(mo)}-${pad(d)}` });
  });
  scan(new RegExp(`\\b${NUM_RE}\\s+(ngay|hom|tuan|thang)\\s+(nua|toi|sau)\\b`, 'g'), (m) => {
    const n = toNum(m[1]);
    if (!(n > 0 && n < 400)) return;
    if (m[2] === 'thang') {
      const d = new Date(`${today}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n);
      add(m, { date: d.toISOString().slice(0, 10) });
    } else add(m, { date: addDays(today, m[2] === 'tuan' ? n * 7 : n) });
  });
  scan(/\b(hom nay|bua nay|ngay nay|toi nay|sang nay|trua nay|chieu nay|dem nay)\b/g, (m) => add(m, { date: today }));
  scan(/\b(hom qua|toi qua|dem qua|sang qua|trua qua|chieu qua)\b/g, (m) => add(m, { date: addDays(today, -1) }));
  scan(/\b(hom kia)\b/g, (m) => add(m, { date: addDays(today, -2) }));
  scan(/\b(ngay kia|ngay mot)\b/g, (m) => add(m, { date: addDays(today, 2) }));
  scan(/\b(mot)\b/g, (m) => { if (src.slice(m.index, m.index + 3).toLowerCase() === 'mốt') add(m, { date: addDays(today, 2) }); });
  scan(/\b(ngay mai|sang mai|trua mai|chieu mai|toi mai|dem mai|mai)\b/g, (m) => {
    if (m[1] === 'mai') {
      const orig = src.slice(m.index, m.index + 3);
      if (orig !== 'mai' && orig !== 'Mai') return; // "mãi", "mái"…
      // "chị Mai", "bạn Mai" → tên người.
      if (orig === 'Mai' && m.index > 0 && !/[.!?]\s*$/.test(src.slice(0, m.index))) return;
      if (/\b(chi|anh|em|ban|co|ba|ong|be|thay|cho)\s*$/.test(plain.slice(Math.max(0, m.index - 6), m.index))) return;
    }
    add(m, { date: addDays(today, 1) });
  });

  // --- Giờ ---
  const [nh, nm] = now.split(':').map(Number);
  scan(new RegExp(`\\b(nua|${NUM_RE.slice(1, -1)})\\s*(phut|tieng|gio)\\s+(nua|sau)\\b`, 'g'), (m) => {
    const n = toNum(m[1]);
    if (!(n > 0 && n <= 24 * 60)) return;
    const mins = m[2] === 'phut' ? n : n * 60;
    const total = nh * 60 + nm + Math.round(mins);
    const dayShift = Math.floor(total / 1440);
    const t = total % 1440;
    add(m, { time: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`, ...(dayShift ? { date: addDays(today, dayShift) } : {}) });
  });
  const PERIOD = '(sang|trua|chieu|toi|dem|khuya)';
  const timeRe = new RegExp(
    `(?:\\b${PERIOD}\\s+(?:nay\\s+|mai\\s+|qua\\s+)?(?:luc\\s+)?)?\\b${NUM_RE}\\s*(?:(?:gio|h)(?![a-z])\\s*(?:(\\d{1,2})\\s*(?:phut\\b)?|(ruoi)\\b|kem\\s*(\\d{1,2}))?|:(\\d{2})\\b)(?:\\s*(?:\\d+\\s*)?${PERIOD}\\b)?`,
    'g',
  );
  scan(timeRe, (m) => {
    let h = toNum(m[2]);
    if (!Number.isInteger(h) || h > 24) return;
    let min = m[3] ? Number(m[3]) : m[4] ? 30 : m[6] ? Number(m[6]) : 0;
    if (m[5]) { h -= 1; min = 60 - Number(m[5]); }
    if (min > 59 || min < 0) return;
    const period = m[7] ?? m[1];
    // "ngủ 7 giờ", "trong 2 giờ" là khoảng thời gian, không phải giờ.
    const before = plain.slice(Math.max(0, m.index - 14), m.index);
    if (!period && /\b(ngu|tap|chay|hoc|doc|trong|mat|khoang|di bo|thien|lam viec|het|tong)\s*(duoc\s*)?$/.test(before)) return;
    let ambiguous = false;
    if (period === 'chieu' || period === 'toi') { if (h < 12) h += 12; }
    else if (period === 'trua') { if (h <= 5) h += 12; }
    else if (period === 'dem' || period === 'khuya') { if (h >= 6 && h < 12) h += 12; else if (h === 12) h = 0; }
    else if (!period && !m[6] && h >= 1 && h <= 6) ambiguous = true;
    if (h === 24) h = 0;
    add(m, { time: `${pad(h)}:${pad(min)}`, ...(ambiguous ? { ambiguous } : {}) });
  });

  return hits.sort((a, b) => a.at - b.at).map(({ at: _a, end: _e, ...h }) => h);
}

/** Dòng gợi ý chèn vào system prompt. */
export function describeTemporal(hits: TemporalHit[]): string {
  if (!hits.length) return '';
  const fmt = (h: TemporalHit) => `«${h.phrase}» → ${[h.date, h.time].filter(Boolean).join(' ')}${h.ambiguous ? ' (không rõ sáng/chiều — chọn theo ngữ cảnh, giờ làm việc thường là chiều)' : ''}`;
  return `Mốc thời gian trong câu đã được quy đổi sẵn (dùng đúng các giá trị này):\n${hits.map(fmt).join('\n')}`;
}
