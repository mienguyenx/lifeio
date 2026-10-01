# LifeOS Visual Specification v1.0

> Nguồn chuẩn duy nhất cho mọi module, mascot, icon, ảnh minh họa và UI của LifeOS.
> Code token: `frontend/src/index.css` + `frontend/tailwind.config.ts`. Mọi thay đổi màu/radius/shadow phải sửa ở đây trước.
> Ảnh tham chiếu: [`references/mascot-system.webp`](references/mascot-system.webp) · [`references/visual-system.webp`](references/visual-system.webp) · [`references/icon-system.webp`](references/icon-system.webp)

## 1. Brand direction

**Calm productivity + friendly personal growth.** Không giống dashboard SaaS doanh nghiệp, cũng không trẻ con kiểu game. Nhẹ, sạch, tích cực, có nhân vật đồng hành nhưng đủ trưởng thành để dùng hằng ngày.

| Thành phần | Spec |
|---|---|
| Style | Soft & Friendly / Premium pastel |
| Mood | calm, warm, encouraging, optimistic |
| UI density | medium-low, nhiều khoảng thở |
| Shape language | bo tròn lớn, mềm |
| Illustration | kawaii 3D-soft / vector-clay hybrid |
| Main visual cue | lavender + white + peach |
| Mascot role | emotional guidance, không chiếm UI |
| UI goal | nhìn 3–5 giây là biết nên làm gì tiếp |

## 2. Color system

| Token | Hex | CSS var | Tailwind |
|---|---|---|---|
| Primary Violet | `#6D5DF2` | `--primary` | `bg-primary` `text-primary` |
| Primary Light | `#8B85F6` | `--primary-light` | `bg-primary-light` |
| Lavender Surface | `#F0EEFF` | `--lavender` (= `--accent`) | `bg-lavender` `bg-accent` |
| Background | `#F8F9FD` | `--background` | `bg-background` |
| White Surface | `#FFFFFF` | `--card` | `bg-card` |
| Text Primary | `#182033` | `--foreground` | `text-foreground` |
| Text Secondary | `#7D8495` | `--muted-foreground` | `text-muted-foreground` |
| Border | `#E9EAF0` | `--border` | `border-border` |
| Success | `#27B56F` | `--success` | `text-success` |
| Warning | `#FFB548` | `--warning` | `text-warning` |
| Danger | `#FF6B78` | `--destructive` | `text-destructive` |
| Info | `#5B9CF6` | `--info` | `text-info` |
| Mint | `#57D3AE` | `--mint` | `bg-mint` |
| Peach | `#FFB27A` | `--peach` | `bg-peach` |
| Pink | `#F7A3C6` | `--pink` | `bg-pink` |
| Soft Blue | `#AFCDF7` | `--sky` | `bg-sky` |
| Yellow | `#FFC63D` | `--yellow` | `bg-yellow` |

**Màu module** (icon container, chấm chỉ báo): Home `#6D5DF2` · Tasks `#FFB27A` · Calendar `#5B9CF6` · Habits `#57D3AE` · Goals `#F7A3C6` · Journal `#A78BFA` · AI Coach `#8B85F6` · Insights `#FFC63D` · Life Areas `#4CC9B0` · Health `#FF6B78` · Finance `#3B82F6` · Learning `#9B7BFF` · Relationships `#F472B6` · Settings `#64748B`.
Dùng: `bg-module-tasks`, hoặc `.icon-tile .tone-tasks` (nền 14% + icon đậm hơn tự động).

**Quy tắc:** Màu Life Area / module chỉ là **accent nhỏ** (chấm, icon, viền mảnh) — không làm nền lớn cho cả card. Tối đa 1 màu nhấn chính + 1 màu module trên một màn hình.

> ⚠️ Accessibility: `#7D8495` trên nền trắng ≈ 3.8:1 — chỉ dùng cho chữ phụ ≥ 12px, không dùng cho nội dung quan trọng. Chữ trắng trên `#FF6B78` ≈ 2.7:1 — nút xóa dùng biến thể `outline`/chữ đỏ thay vì nền đỏ chữ trắng khi có thể.

## 3. Typography

Font: **Inter** (UI). Marketing/illustration có thể thêm **Nunito Sans**.

| Vai trò | Size / line-height / weight | Tailwind |
|---|---|---|
| Display | 32–40 / 1.1 / 700 | `text-display` (36) |
| Page title | 28–32 / 1.2 / 700 | `text-page-title` (28) |
| Section title | 18–22 / 1.3 / 700 | `text-section` (20) |
| Card title | 14–16 / 1.4 / 600 | `text-card-title` (15) |
| Body | 14 / 1.5 / 400 | `text-body` |
| Small | 12 / 1.4 / 400 | `text-small` |
| Caption | 10–11 / 1.4 / 500 | `text-caption` (11) |
| Button | 13–14 / 1 / 600 | mặc định trong `<Button>` |

## 4. Radius

| Phần tử | Spec | Tailwind |
|---|---|---|
| App shell | 28–36px | `rounded-2xl` (28) / `rounded-3xl` (32) |
| Hero card | 32–40px | `rounded-hero` (36) |
| Large card | 24–30px | `rounded-xl` (24) — mặc định `<Card>` |
| Small card | 18–22px | `rounded-lg` (20) |
| Input / Button | 14–18px | `rounded-md` (16) |
| Icon container | 12–16px | `rounded-icon` (14) |
| Pill | 999px | `rounded-full` |
| Checkbox, menu item | — | `rounded-sm` (8, giữ cho shadcn) |

## 5. Shadows

Không dùng shadow tối kiểu Material.

| Dùng cho | Giá trị | Tailwind |
|---|---|---|
| Card | `0 14px 40px rgba(63,51,124,.07)` | `shadow-card` |
| Hero | `0 22px 60px rgba(91,77,185,.18)` | `shadow-hero` |
| Floating button | `0 12px 30px rgba(109,93,242,.25)` | `shadow-fab` |
| Chip / tile nhỏ | `0 4px 14px rgba(63,51,124,.06)` | `shadow-soft` |

## 6. Spacing

Hệ 4/8: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`. Card padding: **Mobile 16px · Desktop 20–24px**.

## 7. Buttons

| Biến thể | Spec | Code |
|---|---|---|
| Primary | nền `#6D5DF2`, chữ trắng, radius 16, cao 44–48 | `<Button>` (h-11) / `size="lg"` (h-12) |
| Secondary | trắng, viền `#E9EAF0`, chữ `#182033` | `variant="secondary"` / `"outline"` |
| Soft action | nền `#F0EEFF`, chữ `#6D5DF2` | `variant="soft"` |
| FAB | 48–56px, tròn, violet, icon trắng | `variant="fab" size="fab"` |

Một màn hình chỉ có **một** primary CTA.

## 8. Icon system

- Code UI dùng **lucide-react**: soft rounded, stroke 2px, hình học đơn giản, ít chi tiết. Size mặc định 24 (16–20 trong dòng chữ).
- Icon chức năng đặt trong `.icon-tile` + `tone-<module>` khi cần nhấn màu module.
- Icon minh họa soft 3D (onboarding, marketing) được phép nhưng **không trộn** với icon lucide trong cùng một nhóm điều khiển.
- Chi tiết đầy đủ: [ICON_SPEC.md](ICON_SPEC.md).

## 9. Mascot system

| Mascot | Nhân vật | Vai trò | Màu chính | Module | Component |
|---|---|---|---|---|---|
| **Lumi** | thỏ trắng | động viên, onboarding | lavender/pink | Home, Success, Goals | `<Mascot name="lumi" />` |
| **Mochi** | mèo cam | tập trung, hành động | peach/orange | Tasks, Focus, Calendar | `<Mascot name="mochi" />` |
| **Taro** | rùa xanh | cân bằng, sức khỏe | mint/green | Habits, Health, Rest | `<Mascot name="taro" />` |
| **Ori** | cú tím | insight, suy ngẫm | violet/lilac | AI Coach, Insights, Journal, Review | `<Mascot name="ori" />` |

Pose hiện có (`frontend/src/assets/mascots/`):
`lumi: default | happy` · `mochi: default | focus | rest | celebrate` · `taro: default | relax | care | go` · `ori: default | learn | idea | explore`.

> Trạng thái asset: bản hiện tại được tách từ ảnh tham chiếu (≈300px). Cần render lại bản gốc độ phân giải cao (≥1024px, nền trong suốt) bằng các prompt ở §11 rồi thay file cùng tên — không cần sửa code.

### Lumi — Companion
Visual: white bunny · large soft ears · pink inner ears · round cheeks · small dark navy eyes · tiny mouth · lavender ribbon/scarf · small round body · slightly oversized head · soft matte surface.
Personality: gentle, positive, encouraging, safe, supportive. Use: onboarding, home greeting, empty states, success, AI encouragement.

### Mochi — Focus Companion
Visual: orange/cream cat · short ears · small tail · white muzzle · peach body · tablet/laptop props.
Personality: energetic, focused, productive, playful, decisive. Use: Tasks, Pomodoro, Focus Mode, Quick Add, project completion.

### Taro — Balance Companion
Visual: small turtle · mint green skin · rounded shell · large leaf used like umbrella · calm smile.
Personality: slow, steady, mindful, healthy, balanced. Use: Habits, Health, Sleep, Water, Wellness, Rest.

### Ori — Insight Companion
Visual: small purple owl · round body · lavender wings · cream face · tiny yellow beak · optional glasses · notebook / light bulb.
Personality: wise, curious, reflective, analytical, gentle. Use: Insights, Analytics, Journal, Review, AI Coach, Learning.

## 10. Quy tắc dùng mascot trong app

- **1 mascot hero / màn hình**, hoặc **1 mascot cho trạng thái cảm xúc / màn hình**. Không đặt mascot ở mọi card.
- Lumi → Home / Success / Onboarding · Mochi → Tasks / Focus / Pomodoro · Taro → Habits / Health / Rest · Ori → AI / Insights / Journal / Review.
- Không để 4 mascot cùng xuất hiện trong UI chức năng. Bộ 4 chỉ dùng ở brand page, onboarding giới thiệu hệ thống, marketing.
- Mascot là **companion** — hành động luôn dùng icon thật; mascot không thay icon chức năng.
- Trạng thái trống dùng `<EmptyState mascot=… title=… description=… action=… />` (1 câu + tối đa 1 hành động).
- Mascot luôn `aria-hidden` (trang trí); animation nổi tự tắt khi `prefers-reduced-motion`.

## 11. Prompt library

### 11.1 Lumi
```
Create an original mascot character for a personal productivity and self-improvement app called LifeOS.
Character: Lumi, a cute white bunny companion.
Visual style: premium kawaii 3D-soft illustration, soft clay + polished vector hybrid, rounded proportions, large head, compact body, clean silhouette, soft matte material, subtle ambient occlusion, gentle studio lighting, premium mobile app mascot aesthetic.
Character design: pure white fur, long rounded bunny ears, soft pink inner ears, small navy-black eyes, tiny smiling mouth, subtle blush on cheeks, lavender scarf or bow around the neck, small paws, friendly seated pose.
Personality: warm, supportive, encouraging, calm, optimistic.
Color palette: white, lavender #8B85F6, soft pink #F7A3C6, very light blue highlights.
Pose: sitting slightly turned 3/4 toward camera, one paw raised in a small encouraging gesture, happy but calm expression.
Composition: single isolated character, centered, full body, transparent background, large clean margins.
Do not include: text, logo, UI, background scene, watermark, extra characters, props unless specified, realistic fur, anime human features.
The character must feel original, friendly, modern, premium, and suitable for a health and productivity app.
```

### 11.2 Mochi
```
Create an original LifeOS mascot named Mochi.
Mochi is a small peach-orange cat representing focus, productivity and action.
Style: premium kawaii 3D-soft mascot, soft clay and vector hybrid, rounded geometry, large expressive head, compact body, clean silhouette, soft pastel lighting, subtle shadow.
Character: warm peach-orange fur, cream muzzle and belly, tiny darker orange stripes on forehead, small rounded triangular ears, soft pink inner ears, dark navy eyes, small happy mouth, blush cheeks, curved fluffy tail.
Accessory: a small lavender tablet or laptop with a minimal bunny-shaped icon.
Pose: sitting and working attentively, paws holding tablet, slightly excited focused expression.
Personality: productive, energetic, clever, friendly, motivating.
Palette: peach #FFB27A, soft orange, cream, lavender #8B85F6.
Transparent background. No text. No watermark. No environment. No other characters. No realistic cat anatomy. No photorealistic fur.
Designed as a reusable premium mobile app mascot.
```

### 11.3 Taro
```
Create an original LifeOS mascot named Taro.
Taro is a small friendly turtle representing balance, health, consistency and mindful progress.
Style: premium kawaii 3D-soft illustration, rounded clay-like form, clean vector-inspired edges, soft matte surface, minimal detail, gentle studio light.
Character: mint green skin, rounded light green shell, small rounded limbs, large friendly dark eyes, soft blush cheeks, tiny peaceful smile.
Signature element: Taro holds a large fresh green leaf above the head like a small umbrella.
Optional detail: tiny sprout near the shell.
Personality: calm, patient, steady, healthy, comforting.
Palette: mint #57D3AE, leaf green, pale lime, light cream, soft sky blue accents.
Pose: sitting peacefully, slightly leaning forward, holding leaf umbrella.
Transparent background. No text. No UI. No watermark. No other characters. No realistic turtle texture. No sharp edges.
The mascot should feel peaceful, adorable and suitable for habit tracking, wellness and health screens.
```

### 11.4 Ori
```
Create an original LifeOS mascot named Ori.
Ori is a small lavender owl representing insight, reflection, intelligence and personal learning.
Style: premium kawaii 3D-soft mascot, soft clay and vector hybrid, rounded shape language, minimal details, matte pastel material, soft studio lighting.
Character: lavender-purple body, lighter cream face, small rounded wings, tiny golden-yellow beak, large dark navy eyes, soft blush cheeks.
Optional accessories: small round glasses, tiny notebook, small glowing star or light bulb.
Pose: standing or sitting while holding a notebook, curious thoughtful expression, slight head tilt.
Personality: wise, curious, gentle, thoughtful, supportive.
Palette: violet #8B85F6, lavender, cream, soft yellow, pastel pink accent.
Transparent background. No text. No logo. No other characters. No watermark. No realistic feathers.
Designed as a friendly mobile app analytics and AI companion.
```

### 11.5 Expression pack (sau khi có model chuẩn)
```
Using exactly the same mascot character design, proportions, colors, face design and accessories, create a consistent mascot expression and action sheet.
Show 9 separate poses in a clean 3x3 grid: 1. happy 2. encouraging 3. celebrating 4. thinking 5. focused 6. sleepy 7. surprised 8. gently worried 9. waving hello
Maintain identical: character proportions, face, colors, material, lighting, render style, accessories.
Each pose must be isolated with clear space between characters.
White or transparent background. No captions. No text. No UI. No watermark. No duplicate poses.
Premium kawaii 3D-soft mobile app mascot style.
```

### 11.6 UI-state pack
```
Create a set of LifeOS app mascot illustrations for UI states using the exact same established character design.
States: onboarding, empty state, success, streak celebration, gentle reminder, focus mode, rest reminder, error reassurance, AI coaching, goal completion.
Illustrations must be: compact, simple silhouette, mobile UI friendly, easy to place inside rounded cards, transparent background, minimal props, emotion readable at small size.
Do not add text. Do not add UI containers. Do not redesign the mascot. Maintain exact model consistency.
```

### 11.7 UI master prompt (nền cho mọi module)
```
Design a premium mobile-first personal productivity and self-improvement application called LifeOS.
Overall visual direction: soft and friendly, calm productivity, premium pastel interface, modern iOS-inspired mobile UI, large rounded cards, clean whitespace, low visual noise, subtle soft shadows, gentle gradients, emotionally supportive but not childish.
Primary colors: violet #6D5DF2, light violet #8B85F6, lavender surface #F0EEFF, background #F8F9FD, white #FFFFFF.
Accent colors: mint #57D3AE, peach #FFB27A, pink #F7A3C6, blue #5B9CF6, yellow #FFC63D.
Typography: modern clean sans-serif, Inter-like, strong hierarchy, high readability, large page titles, compact captions.
Cards: 20–30px corner radius, soft white surface, thin subtle border, very soft lavender-gray shadow.
Buttons: large rounded primary violet CTA, white secondary buttons, small pastel action chips.
Icons: soft rounded outline icons, consistent 2px stroke, minimal visual complexity.
Mascot: small original LifeOS mascot illustration used selectively for emotional moments, never dominating functional UI.
UX principles: one primary action per screen, clear information hierarchy, progress always visually understandable, minimum cognitive load, friendly empty states, visible but subtle encouragement.
Responsive: mobile first, desktop expands into columns, tablet uses adaptive cards, do not simply stretch mobile screens.
Do not use: dark heavy shadows, glassmorphism everywhere, neon colors, dense enterprise dashboards, sharp rectangular cards, excessive gradients, too many accent colors on one screen, cartoon decorations everywhere.
The final interface must feel like one coherent design system across every LifeOS module.
```

### 11.8 Negative prompt chung
```
Avoid: dark SaaS dashboard, cyberpunk, neon, glassmorphism overload, strong drop shadows, tiny unreadable text, dense analytics, random colors, sharp rectangles, inconsistent icons, too many gradients, cartoon decorations everywhere, generic stock illustration, photorealistic people, copied commercial mascots, watermarks, brand logos from other products.
```

## 12. Module blueprints

Mỗi module dùng chung token ở trên. Cột "Mascot" là mascot duy nhất được phép trên màn hình đó.

| Module | Mục tiêu / bố cục chính | Mascot |
|---|---|---|
| **Today / Home** | Hiểu tiến độ hôm nay + việc tiếp theo trong 5s. Hero lavender (lời chào, ngày, tiến độ, thói quen xong, việc còn lại) → 3 thẻ sức khỏe (Nước, Ngủ, Vận động) → Quick actions (Công việc, Thói quen, Nhật ký, Tập trung) → Danh sách thói quen hôm nay (multi-target). Desktop rail phải: chuỗi ngày, AI Coach, việc tập trung tiếp. Không đặt analytics/review nặng. | Lumi |
| **Tasks** | Header (tiêu đề, phụ đề, tìm, lọc, Thêm). Stats: Tổng, Hôm nay, Quá hạn, Xong, Thời gian tập trung. View: List (mặc định mobile) / Board / Calendar. Nhóm: Quá hạn, Hôm nay, Sắp tới, Đã xong. Row: checkbox, tiêu đề, chip ưu tiên, Life Area, hạn, subtask, nút Focus, menu. | Mochi (empty, khích lệ focus, hoàn thành) |
| **Habits** | Metrics: Đang hoạt động, Xong hôm nay, Chuỗi tốt nhất, Tỉ lệ 30 ngày. Tabs: Hôm nay / Tất cả / Insights. Multi-target: `3 / 8 ly` + progress + nút tăng. Insights: heatmap 30 ngày, top streak, xu hướng, AI insight. | Taro (đều đặn) · Lumi (thành công) |
| **Calendar** | Month / Week / Day / Agenda. Pill sự kiện pastel; Life Area chỉ là chấm nhỏ. Kéo task vào khung giờ. | Mochi (empty lập kế hoạch) |
| **Goals** | Active / Completed / All. Card: tiêu đề, Life Area, %, milestones, liên kết task/habit, ngày đích. Detail: lý do, milestones, check-in, gợi ý AI. Progress ring lớn. | Lumi (động lực) · Ori (review) |
| **AI Coach** | Header + chỉ báo ngữ cảnh + memory. Tin AI: card trắng; tin người dùng: bubble violet. Gợi ý: Lên kế hoạch ngày, Review tuần, Thói quen, Chia nhỏ mục tiêu, Suy ngẫm nhật ký, Bắt đầu tập trung. Bình tĩnh, thông minh — không "chatbot vui nhộn". | Ori |
| **Insights** | Summary: Hoàn thành task, Đều đặn thói quen, Thời gian tập trung, Năng lượng, Giấc ngủ. Chart đơn giản: momentum tuần, xu hướng 30 ngày, phân bổ focus, cân bằng lĩnh vực. Life Wheel radar lavender. 1 quan sát AI + 1 hành động. | Ori |

## 13. Trạng thái triển khai (frontend)

| Hạng mục | Trạng thái |
|---|---|
| Token màu, radius, shadow, type scale | ✅ `index.css`, `tailwind.config.ts` |
| Button (primary/secondary/soft/fab), Card, Input | ✅ `components/ui` |
| `Mascot`, `EmptyState`, `MODULE_MASCOT` | ✅ `components/brand` |
| Today: hero lavender + Lumi, quick actions lucide + icon-tile | ✅ |
| Empty states: Tasks (Mochi), Habits (Taro), Goals (Lumi), Journal (Ori) | ✅ |
| AI Coach avatar → Ori | ✅ |
| Icon system (49 icon × 3 biến thể, LifeIcon/MoodIcon/PriorityIcon) — xem ICON_SPEC.md | ✅ |
| Sidebar 14 mục tiếng Việt | ✅ |
| Today: 3 thẻ sức khỏe, bỏ widget review khỏi Today | ⏳ |
| Tasks stats + nhóm, Habits metrics/insights, Calendar, Insights | ⏳ |
| Mascot hi-res từ prompt §11 | ⏳ |
| Mobile Expo dùng cùng token | ⏳ |
