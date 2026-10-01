# LifeOS Icon Design Specification v1.0

> Dùng thống nhất cho app, web, mobile, extension và image generation. Mọi icon chung một **DNA**; mỗi icon chỉ thay **symbol + màu module**.
> Nguyên tắc: **mascot tạo cảm xúc, icon tạo nhận biết chức năng.** Icon không bao giờ là mascot thu nhỏ.

Nguồn trong code:
- Hình học: `frontend/scripts/icon-geometry.py` → `frontend/src/components/icons/icon-data.json`
- React: `<LifeIcon name="module/tasks" variant="duotone" size={24} />`, `<MoodIcon value={4} />`, `<PriorityIcon priority="high" />` (`frontend/src/components/icons/LifeIcon.tsx`)
- SVG tĩnh: `node frontend/scripts/build-icons.mjs` → `frontend/src/assets/icons/**` (outline / duotone / filled)
- Action icon thường: `lucide-react` (2px, round) — cùng DNA, không vẽ lại.

## 1. DNA chung

| Thuộc tính | Quy chuẩn | Trong code |
|---|---|---|
| Style | Soft Rounded Duotone | `variant="duotone"` mặc định |
| Cảm giác | thân thiện, premium, calm, hiện đại |  |
| Base size | 24×24px | `size={24}` |
| Larger UI | 32×32px | `size={32}` |
| Illustration icon | 48×48 / 64×64px | `size={48|64}` hoặc soft 3D |
| Grid | 24×24, căn tâm tuyệt đối | `viewBox="0 0 24 24"` |
| Safe area | 2.5px mỗi cạnh | hình nằm trong 2.5–21.5 |
| Stroke | 2px | `strokeWidth={2}` |
| Cap / Join | round / round | `strokeLinecap/Join="round"` |
| Corner nội bộ | 3–5px | rx 3–3.5 cho khối |
| Perspective | front-facing |  |
| Shape | hình học đơn giản, silhouette rõ |  |
| Shadow | rất nhẹ, diffuse | chỉ soft 3D |
| Highlight | top-left rất nhẹ | chỉ soft 3D |
| Detail | tối đa 2–3 chi tiết phụ |  |
| Background | transparent |  |
| Light mode | pastel + outline tối nhẹ | duotone fill 25% |
| Dark mode | tăng sáng 12–18%, không đổi hue | `.dark .lifeos-icon { filter: brightness(1.15) }` |
| State | normal / active / disabled / success / warning | `state` prop + CSS |

### 3 biến thể chuẩn

| Biến thể | Định nghĩa | Dùng ở |
|---|---|---|
| **Outline** | 2px rounded stroke, transparent fill, 1 màu | action, tab không active, icon trên nền màu |
| **Duotone** | màu chính 100% + nền 20–35% (code: 25%), outline tối giản | icon module trong menu, card, quick action |
| **Filled** | khối đặc 100%, chi tiết knockout trắng | trạng thái active, status badge |
| **Soft 3D** | khối clay mềm, highlight/shadow rất nhẹ, **cùng silhouette với filled** | chỉ onboarding, empty state, achievements, promo (`*-soft3d.webp`) |

UI thật ưu tiên **Outline + Duotone**.

## 2. Màu icon theo module

| Module | Màu chính | Màu phụ | File |
|---|---|---|---|
| Today | `#6D5DF2` | `#EDEAFF` | `module-today` |
| Tasks | `#FF9B63` | `#FFF0E6` | `module-tasks` |
| Calendar | `#5B9CF6` | `#EAF3FF` | `module-calendar` |
| Habits | `#57D3AE` | `#E6FAF4` | `module-habits` |
| Goals | `#F7A3C6` | `#FDEBF3` | `module-goals` |
| Journal | `#A78BFA` | `#F2ECFF` | `module-journal` |
| Notes | `#8B85F6` | `#EEECFF` | `module-notes` |
| AI Coach | `#8B85F6` | `#EEECFF` | `module-ai-coach` |
| Insights | `#FFC63D` | `#FFF6D9` | `module-insights` |
| Life Areas | `#4CC9B0` | `#E6F8F4` | `module-life-areas` |
| Health | `#FF6B78` | `#FFE9EC` | `module-health` |
| Finance | `#3B82F6` | `#E8F1FF` | `module-finance` |
| Learning | `#987BFF` | `#F0EBFF` | `module-learning` |
| Relationships | `#F472B6` | `#FDE8F4` | `module-relationships` |
| Focus / Pomodoro | `#FF9F43` | `#FFF0DD` | `module-focus` |
| Reviews | `#9A86F7` | `#F0ECFF` | `module-reviews` |
| Profile | `#8B85F6` | `#EEECFF` | `module-profile` |
| Settings | `#64748B` | `#EEF1F5` | `module-settings` |
| Notifications | `#FF6B78` | `#FFE9EC` | `module-notifications` |
| Search | `#64748B` | `—` | `module-search` |
| Sync / Backup | `#5B9CF6` | `#EAF3FF` | `module-sync` |
| Archive | `#64748B` | `#EEF1F5` | `module-archive` |
| Trash | `#FF6B78` | `#FFE9EC` | `module-trash` |

Life Area màu riêng (§8). Màu module chỉ là accent nhỏ — không làm nền lớn.

## 3. Master prompt (gắn trước mọi prompt icon)

```
Create a single original UI icon for the LifeOS personal productivity application.

Visual language:
soft rounded duotone icon, premium pastel mobile app aesthetic, simple geometric silhouette,
friendly and modern, minimal detail, 2px-equivalent rounded stroke, rounded line caps and joins,
clean front-facing view, balanced visual weight, consistent with iOS-quality productivity app icons.

Rendering:
flat-duotone with subtle dimensional softness, very gentle top-left highlight,
extremely soft ambient shadow, no hard gradients, no excessive depth, no glossy plastic.

Canvas:
square 1024x1024, icon centered, large clean margin, transparent background.

The icon must remain clearly recognizable when reduced to 24x24px.

Do not include:
text, letters, numbers, UI container, button background, watermark, logo,
realistic texture, photorealism, complex illustration, thin fragile details.

Use the exact requested symbol and requested LifeOS module colors.
```

## 4. Prompt icon module

Cấu trúc: **Master prompt** + khối dưới đây.

### 4.1 Today — `module-today`
```
Create a LifeOS Today icon.

Symbol:
a small rounded home with a soft curved roof, one simple doorway, one tiny four-point sparkle at the upper-right corner.

Primary color:
#6D5DF2.

Secondary color:
#EDEAFF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
The house should feel calm and welcoming, not architectural or realistic. No pointed roof.

Transparent background.
No text.
```

### 4.2 Tasks — `module-tasks`
```
Create a LifeOS Tasks icon.

Symbol:
a compact rounded clipboard, one large clean checkmark centered inside, small rounded clip at the top.

Primary color:
#FF9B63.

Secondary color:
#FFF0E6.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Do not include multiple checklist lines. Clear at 24px.

Transparent background.
No text.
```

### 4.3 Calendar — `module-calendar`
```
Create a LifeOS Calendar icon.

Symbol:
a rounded calendar page, two small rounded binding tabs, three tiny date cells arranged simply inside.

Primary color:
#5B9CF6.

Secondary color:
#EAF3FF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Keep the calendar highly simplified. No readable date numbers.

Transparent background.
No text.
```

### 4.4 Habits — `module-habits`
```
Create a LifeOS Habits icon.

Symbol:
two soft curved arrows forming an incomplete circular loop, with one small healthy leaf integrated into the lower curve.

Primary color:
#57D3AE.

Secondary color:
#E6FAF4.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Communicate repetition, consistency and healthy growth. Avoid using a checklist or calendar.

Transparent background.
No text.
```

### 4.5 Goals — `module-goals`
```
Create a LifeOS Goals icon.

Symbol:
a rounded bullseye target made of two simple circular rings, with one small arrow touching the center.

Primary color:
#F7A3C6.

Secondary color:
#FDEBF3.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Friendly and motivational rather than competitive.

Transparent background.
No text.
```

### 4.6 Journal — `module-journal`
```
Create a LifeOS Journal icon.

Symbol:
a small rounded closed notebook, one subtle center spine, a minimal bookmark tab.

Primary color:
#A78BFA.

Secondary color:
#F2ECFF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Personal, reflective and calm. No readable text or many page lines.

Transparent background.
No text.
```

### 4.7 Notes — `module-notes`
```
Create a LifeOS Notes icon.

Symbol:
one rounded note sheet, slightly folded upper-right corner, two very short abstract horizontal content marks.

Primary color:
#8B85F6.

Secondary color:
#EEECFF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Minimal. No readable text.

Transparent background.
No text.
```

### 4.8 AI Coach — `module-ai-coach`
```
Create a LifeOS AI Coach icon.

Symbol:
one rounded chat bubble, a small four-point sparkle inside the bubble, one tiny secondary sparkle outside.

Primary color:
#8B85F6.

Secondary color:
#EEECFF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Supportive AI guidance, not robotics. Avoid robot heads, circuit patterns and brain icons.

Transparent background.
No text.
```

### 4.9 Insights — `module-insights`
```
Create a LifeOS Insights icon.

Symbol:
three rounded vertical analytics bars ascending gently from left to right, with one small sparkle above the tallest bar.

Primary color:
#FFC63D.

Secondary color:
#FFF6D9.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Insight and improvement, not financial trading.

Transparent background.
No text.
```

### 4.10 Life Areas — `module-life-areas`
```
Create a LifeOS Life Areas icon.

Symbol:
four soft rounded overlapping layers arranged like a balanced flower or four-leaf structure, each layer simple and symmetrical.

Primary color:
#4CC9B0.

Secondary color:
#E6F8F4.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Different dimensions of life working together. Avoid a pie chart appearance.

Transparent background.
No text.
```

### 4.11 Health — `module-health`
```
Create a LifeOS Health icon.

Symbol:
a soft rounded heart, with one short minimal pulse line subtly cut through the center.

Primary color:
#FF6B78.

Secondary color:
#FFE9EC.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Warm wellness aesthetic, not hospital or emergency imagery.

Transparent background.
No text.
```

### 4.12 Finance — `module-finance`
```
Create a LifeOS Finance icon.

Symbol:
a rounded compact wallet, one small circular coin partially visible at the upper-right side.

Primary color:
#3B82F6.

Secondary color:
#E8F1FF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
No dollar symbols, currency text, bank buildings or charts.

Transparent background.
No text.
```

### 4.13 Learning — `module-learning`
```
Create a LifeOS Learning icon.

Symbol:
a simplified rounded graduation cap, with a tiny four-point sparkle above one corner.

Primary color:
#987BFF.

Secondary color:
#F0EBFF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Simple educational symbol, soft and personal, not institutional.

Transparent background.
No text.
```

### 4.14 Relationships — `module-relationships`
```
Create a LifeOS Relationships icon.

Symbol:
two simplified rounded human silhouettes side by side, with a tiny heart floating between their heads.

Primary color:
#F472B6.

Secondary color:
#FDE8F4.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Connection and care. Avoid gender-specific details.

Transparent background.
No text.
```

### 4.15 Focus / Pomodoro — `module-focus`
```
Create a LifeOS Focus / Pomodoro icon.

Symbol:
a minimal rounded timer circle, small top timer button, small focus dot at the exact center.

Primary color:
#FF9F43.

Secondary color:
#FFF0DD.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Deep focus and intentional time. Do not use tomato imagery.

Transparent background.
No text.
```

### 4.16 Reviews — `module-reviews`
```
Create a LifeOS Reviews icon.

Symbol:
a small rounded notebook page, surrounded by one incomplete circular arrow.

Primary color:
#9A86F7.

Secondary color:
#F0ECFF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Reflection, review and continuous improvement.

Transparent background.
No text.
```

### 4.17 Profile — `module-profile`
```
Create a LifeOS Profile icon.

Symbol:
one rounded head circle, simple curved shoulders underneath, balanced symmetrical silhouette.

Primary color:
#8B85F6.

Secondary color:
#EEECFF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Neutral, friendly and inclusive.

Transparent background.
No text.
```

### 4.18 Settings — `module-settings`
```
Create a LifeOS Settings icon.

Symbol:
a simplified rounded gear with six soft teeth, clean circular center.

Primary color:
#64748B.

Secondary color:
#EEF1F5.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Avoid mechanical realism. Simple enough for 20px.

Transparent background.
No text.
```

### 4.19 Notifications — `module-notifications`
```
Create a LifeOS Notifications icon.

Symbol:
a rounded notification bell, small circular clapper, one tiny unread indicator dot positioned upper-right.

Primary color:
#FF6B78.

Secondary color:
#FFE9EC.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Simple and friendly.

Transparent background.
No text.
```

### 4.20 Search — `module-search`
```
Create a LifeOS Search icon.

Symbol:
one clean rounded magnifying glass, perfect circular lens, short rounded handle.

Primary color:
#64748B.

Minimal outline style.
Minimal outline style.

Transparent background.
No text.
```

### 4.21 Sync / Backup — `module-sync`
```
Create a LifeOS Sync / Backup icon.

Symbol:
a small soft cloud, two minimal curved arrows forming a sync loop underneath.

Primary color:
#5B9CF6.

Secondary color:
#EAF3FF.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Safe synchronization and backup. Avoid server imagery.

Transparent background.
No text.
```

### 4.22 Archive — `module-archive`
```
Create a LifeOS Archive icon.

Symbol:
a rounded storage box, simple lid, one tiny downward arrow on the center face.

Primary color:
#64748B.

Secondary color:
#EEF1F5.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Minimal soft rounded duotone.

Transparent background.
No text.
```

### 4.23 Trash — `module-trash`
```
Create a LifeOS Trash icon.

Symbol:
a compact rounded trash bin, simple lid, two subtle vertical inner marks.

Primary color:
#FF6B78.

Secondary color:
#FFE9EC.

Soft rounded duotone style, minimal geometry, strong recognizable silhouette, clear at 24px.
Friendly and simple, not harsh or industrial.

Transparent background.
No text.
```

## 5. Action icons (outline, không màu module)

Trong code dùng `lucide-react` tương ứng (stroke 2, round) — đúng DNA nên không cần file riêng.

| Action | Symbol | Màu | lucide |
|---|---|---|---|
| Add | plus | `#6D5DF2` | `Plus` |
| Edit | pencil | `#64748B` | `Pencil` |
| Delete | trash | `#FF6B78` | `Trash2` |
| Save | save mark | `#64748B` | `Save` |
| Search | magnifier | `#64748B` | `Search` |
| Filter | funnel | `#64748B` | `Filter` |
| Sort | two vertical arrows | `#64748B` | `ArrowUpDown` |
| View | eye | `#64748B` | `Eye` |
| Hide | crossed eye | `#64748B` | `EyeOff` |
| Duplicate | overlapping squares | `#64748B` | `Copy` |
| Share | three connected nodes | `#64748B` | `Share2` |
| Download | arrow down into tray | `#64748B` | `Download` |
| Upload | arrow up from tray | `#64748B` | `Upload` |
| Favorite | rounded star | `#FFC63D / #94A3B8` | `Star` |
| Bookmark | bookmark ribbon | `#64748B` | `Bookmark` |
| More | horizontal ellipsis | `#64748B` | `MoreHorizontal` |
| Link | chain | `#64748B` | `Link` |
| Attach | paperclip | `#64748B` | `Paperclip` |
| Close | rounded X | `#64748B` | `X` |
| Back | left chevron | `#64748B` | `ChevronLeft` |
| Forward | right chevron | `#64748B` | `ChevronRight` |

```
Create a LifeOS {Action} action icon.

Symbol:
{symbol mô tả ở bảng trên — ví dụ Share: three small rounded nodes connected by two simple lines (avoid box-with-arrow)}.

Outline style.
2px rounded stroke.
Color {màu}.

Transparent background.
```

Ghi chú riêng: **Sort** = hai mũi tên dọc song song (1 lên, 1 xuống) · **Favorite** active `#FFC63D`, inactive outline `#94A3B8` · **Link** = hai mắt xích bo tròn chéo · **Attachment** = kẹp giấy một nét liền.

## 6. Status icons

| Trạng thái | File | Symbol | Màu |
|---|---|---|---|
| Complete | `status-success` | circular filled badge, one clean centered rounded checkmark | #27B56F, check white |
| Incomplete | `status-incomplete` | empty rounded circle, 2px soft gray border, no fill | #CBD0DA |
| Syncing | `status-syncing` | two curved arrows forming a nearly complete circular loop | #5B9CF6 |
| Offline | `status-offline` | simplified Wi-Fi signal crossed by one short diagonal line | #94A3B8 |
| Warning | `status-warning` | rounded triangular warning shape, small centered exclamation mark; avoid harsh hazard styling | #FFB548 / #FFF3D6 |
| Error | `status-error` | rounded filled circle, small clean X at center | #FF6B78, X white |
| Info | `status-info` | rounded circle, small lowercase-style information mark inside | #5B9CF6 / #EAF3FF |

```
Create a LifeOS {status} status icon.

Symbol:
{symbol}.

Primary:
{màu}.

Soft duotone style (hoặc minimal rounded outline cho incomplete / syncing / offline).
Transparent background.
```

## 7. Priority & Mood

Priority **không dùng màu giống status** về ý nghĩa — cờ, không phải badge.

| Mức | File | Symbol | Màu |
|---|---|---|---|
| Low | `priority-low` | one small soft rounded flag | `#57D3AE` |
| Medium | `priority-medium` | one rounded flag with slightly stronger visual weight | `#FFB548` |
| High | `priority-high` | one rounded flag, small subtle sparkle beside the flag tip | `#FF6B78` |

```
Create a LifeOS {low|medium|high}-priority icon.

Symbol:
{symbol}.

Color:
{màu}.

Minimal filled-duotone style.
Transparent background.
```

Mood **không dùng emoji hệ thống**. Giá trị mood 1–5 ↔ icon qua `MOOD_ICON`.

| Mood | File | Giá trị | Symbol | Màu |
|---|---|---|---|---|
| Very Happy | `mood-very-happy` | 5 | round pastel face, closed upward smiling eyes, wide gentle smile, tiny blush cheeks | `#F7A3C6` |
| Happy | `mood-happy` | 4 | round friendly face, small upward eyes, gentle smile | `#FFC63D` |
| Neutral | `mood-neutral` | 3 | round face, simple dot eyes, short relaxed horizontal mouth | `#FFB27A` |
| Sad | `mood-sad` | 2 | round friendly face, soft downward mouth, slightly lowered eyes; gentle rather than distressed | `#5B9CF6` |
| Very Sad | `mood-very-sad` | 1 | round pastel face, soft downward mouth, one tiny tear shape; gentle and supportive | `#8B85F6` |

```
Create a LifeOS {mood} mood icon.

Symbol:
{symbol}.

Color:
{màu}.

Soft duotone.
Transparent background.
```

## 8. Life Area icons

Cùng family, mỗi area một symbol. `*` = bổ sung để đủ 10 lĩnh vực đang có trong app.

| Area | File | Key trong app | Symbol | Màu |
|---|---|---|---|---|
| Self / Bản thân | `area-personal` | `personal` | small centered spark inside a rounded personal aura ring | `#8B85F6` |
| Career | `area-career` | `career` | compact rounded briefcase, one subtle upward spark | `#5B9CF6` |
| Health | `area-health` | `health` | rounded heart with minimal pulse | `#FF6B78` |
| Finance | `area-finance` | `finance` | small rounded wallet with one coin | `#57D3AE` |
| Learning | `area-learning` | `learning` | open rounded book with tiny sparkle | `#987BFF` |
| Relationships | `area-relationships` | `relationships` | two rounded person silhouettes connected by a tiny heart | `#F472B6` |
| Recreation | `area-fun` | `fun` | small playful star combined with a soft curved smile arc | `#FFC63D` |
| Family | `area-family` | `—` | three simplified rounded human silhouettes, one larger central figure and two smaller side figures | `#FFB27A` |
| Spiritual / Mindfulness | `area-spirituality` | `spirituality` | simple symmetrical lotus with five rounded petals | `#A78BFA` |
| Environment * | `area-environment` | `environment` | small sprout with two rounded leaves on a short ground line | `#4CC9B0` |
| Contribution * | `area-contribution` | `contribution` | rounded gift box with simple bow | `#F7A3C6` |

```
Create a LifeOS {Area} Life Area icon.

Symbol:
{symbol}.

Color:
{màu}.

Transparent background.
```

## 9. Prompt contact sheet (sau khi đã chốt silhouette)

```
Create a complete LifeOS application icon family.

All icons must share exactly the same:
visual weight, 2px rounded stroke language, corner radius, duotone rendering, lighting,
shadow softness, perspective, canvas size, padding, and pastel material.

Create a clean icon-system sheet containing:
Today, Tasks, Calendar, Habits, Goals, Journal, Notes, AI Coach, Insights, Life Areas, Health,
Finance, Learning, Relationships, Focus, Reviews, Profile, Settings, Notifications, Sync, Archive.

Use the predefined LifeOS color for each module.

Every icon must:
have a unique clear silhouette, remain readable at 24px, be centered inside the same invisible 24x24 grid,
use simple rounded geometry, contain no text.

Presentation:
clean white background, icons arranged in a precise grid, one icon per equal cell, consistent scale,
professional product-design asset sheet.

Do not redesign icons into unrelated visual styles. Do not use emoji. Do not use stock icons.
Do not use realistic materials. Do not include watermarks.
```

> Mẹo: dùng SVG trong `frontend/src/assets/icons/modules/*-filled.svg` làm ảnh tham chiếu silhouette khi sinh bản soft 3D, để 3D giữ đúng hình.

## 10. File & naming

```
frontend/src/assets/icons/
  modules/     module-tasks-outline.svg · module-tasks-duotone.svg · module-tasks-filled.svg · (module-tasks-soft3d.webp)
  statuses/    status-success-*.svg
  priority/    priority-high-*.svg
  moods/       mood-happy-*.svg
  life-areas/  area-health-*.svg
```

- Mỗi icon export tối thiểu `outline`, `filled`, `duotone`. Icon module quan trọng thêm `-soft3d.webp`.
- State `default / hover / active / disabled` xử lý bằng prop `state` + CSS, **không** sinh file riêng.
- Icon chỉ có nét (search, incomplete, syncing, offline) chỉ có bản `outline`.
- **Thêm icon mới:** khai báo trong `icon-geometry.py` → `python3 scripts/icon-geometry.py` → `node scripts/build-icons.mjs`.

## 11. Quy tắc dùng trong UI

- Menu/sidebar: icon module `duotone`, mục đang chọn `filled`.
- Bottom nav: `outline` màu chữ phụ; tab đang chọn `duotone` màu primary.
- Quick action / card title: `duotone` 22–28px, không đặt thêm nền màu (tránh 2 lớp tint).
- Action trong toolbar, menu, nút: lucide outline 2px, màu `#64748B` hoặc theo màu chữ.
- Icon trang trí: `aria-hidden`; icon đứng một mình mang nghĩa: truyền `title`.
- Không trộn soft 3D với outline/duotone trong cùng một nhóm điều khiển.
