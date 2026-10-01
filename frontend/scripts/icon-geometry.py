"""
LifeOS Icon geometry — nguồn hình học duy nhất (docs/design/ICON_SPEC.md).
Chạy: python3 scripts/icon-geometry.py  -> src/components/icons/icon-data.json
Grid 24x24, safe area 2.5px, stroke 2px round cap/join.
Roles:
  base     : khối chính (outline: chỉ viền · duotone: nền 25% · filled: nền 100%)
  line     : nét ngoài khối (luôn màu chính)
  inner    : nét nằm trong khối (filled: đổi sang màu knockout trắng)
  dot      : điểm nhấn ngoài khối (luôn tô màu chính)
  innerDot : điểm nhấn trong khối (filled: knockout trắng)
  over     : nét cắt ngang khối (filled: thêm viền knockout phía dưới)
"""
import json, math, os

def sparkle(cx, cy, r):
    k = r * 0.22
    return (f"M{cx} {cy-r}Q{cx+k:.2f} {cy-k:.2f} {cx+r} {cy}Q{cx+k:.2f} {cy+k:.2f} {cx} {cy+r}"
            f"Q{cx-k:.2f} {cy+k:.2f} {cx-r} {cy}Q{cx-k:.2f} {cy-k:.2f} {cx} {cy-r}Z")

def gear(cx=12, cy=12, ro=8.6, ri=6.4, teeth=6):
    pts = []
    for i in range(teeth):
        a0 = 2*math.pi*i/teeth - math.pi/2
        w = math.pi/teeth
        for a, r in ((a0-w*0.55, ri), (a0-w*0.32, ro), (a0+w*0.32, ro), (a0+w*0.55, ri)):
            pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    return "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z"

def star(cx=12, cy=12.6, ro=8.8, ri=4.2, n=5):
    pts = []
    for i in range(n*2):
        a = math.pi*i/n - math.pi/2
        r = ro if i % 2 == 0 else ri
        pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    return "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z"

P = lambda role, d: {"role": role, "d": d}
C = lambda role, cx, cy, r: {"role": role, "circle": [cx, cy, r]}
R = lambda role, x, y, w, h, rx: {"role": role, "rect": [x, y, w, h, rx]}

face = C("base", 12, 12, 8.5)
person = lambda cx, cy, s=1: [C("base", cx, cy, 2.8*s),
    P("base", f"M{cx-5*s:.2f} {19.5}c0-{3*s:.2f} {2.2*s:.2f}-{5.3*s:.2f} {5*s:.2f}-{5.3*s:.2f}s{5*s:.2f} {2.3*s:.2f} {5*s:.2f} {5.3*s:.2f}Z")]

ICONS = {
  # ---------- modules ----------
  "module/today": {"color": "#6D5DF2", "label": "Hôm nay", "els": [
    P("base", "M4 11.2Q4 10.3 4.7 9.7L10.7 4.6Q12 3.5 13.3 4.6L19.3 9.7Q20 10.3 20 11.2V18.5Q20 20.5 18 20.5H6Q4 20.5 4 18.5Z"),
    P("inner", "M10 20.5V16.5Q10 14.6 12 14.6Q14 14.6 14 16.5V20.5"),
    P("dot", sparkle(19.6, 4.2, 2.1))]},
  "module/tasks": {"color": "#FF9B63", "label": "Công việc", "els": [
    R("base", 5, 4.5, 14, 16.5, 3.5), R("base", 9, 2.5, 6, 4, 1.5),
    P("inner", "M8.6 13.2L11 15.6L15.6 10.6")]},
  "module/calendar": {"color": "#5B9CF6", "label": "Lịch", "els": [
    R("base", 3.5, 5, 17, 15.5, 3.5), P("inner", "M3.5 9.8H20.5"),
    P("line", "M8 3V6.5"), P("line", "M16 3V6.5"),
    R("innerDot", 7, 13, 2.4, 2.4, 0.7), R("innerDot", 10.8, 13, 2.4, 2.4, 0.7), R("innerDot", 14.6, 13, 2.4, 2.4, 0.7)]},
  "module/habits": {"color": "#57D3AE", "label": "Thói quen", "els": [
    P("line", "M3.5 12A8.5 8.5 0 0 1 12 3.5A9.2 9.2 0 0 1 18.4 6.1L20.5 8.2"), P("line", "M20.5 3.7V8.2H16"),
    P("line", "M20.5 12A8.5 8.5 0 0 1 12 20.5A9.2 9.2 0 0 1 5.6 17.9L3.5 15.8"), P("line", "M8 15.8H3.5V20.3"),
    P("base", "M11.8 16.4C8.8 15.1 8.7 10.9 12.8 8.8C15.6 11.1 15.2 15.2 11.8 16.4Z"), P("inner", "M11.8 16.4L12.9 12.4")]},
  "module/goals": {"color": "#F7A3C6", "label": "Mục tiêu", "els": [
    C("base", 11, 13, 8), C("inner", 11, 13, 4.2), C("innerDot", 11, 13, 1.5),
    P("over", "M11.4 12.6L19 5"), P("line", "M18.2 3.2V5.8H20.8")]},
  "module/journal": {"color": "#A78BFA", "label": "Nhật ký", "els": [
    R("base", 5, 3, 14, 18, 3), P("inner", "M9 3V21"), P("innerDot", "M13.2 3V9.4L15.1 8.1L17 9.4V3Z")]},
  "module/notes": {"color": "#8B85F6", "label": "Ghi chú", "els": [
    P("base", "M8 3H14.5L19 7.5V18A3 3 0 0 1 16 21H8A3 3 0 0 1 5 18V6A3 3 0 0 1 8 3Z"),
    P("inner", "M14.5 3V6.5A1 1 0 0 0 15.5 7.5H19"), P("inner", "M8.6 12.5H12.6"), P("inner", "M8.6 16H15.2")]},
  "module/ai-coach": {"color": "#8B85F6", "label": "AI Coach", "els": [
    P("base", "M11.5 4.2C16.2 4.2 20 7.3 20 11.2S16.2 18.2 11.5 18.2C10.6 18.2 9.6 18.1 8.8 17.8L4.6 19.6L5.8 15.9C4.1 14.6 3 13 3 11.2C3 7.3 6.8 4.2 11.5 4.2Z"),
    P("innerDot", sparkle(11.5, 11.2, 3.2)), P("dot", sparkle(20.4, 3.4, 1.6))]},
  "module/insights": {"color": "#FFC63D", "label": "Thống kê", "els": [
    R("base", 3.8, 13.5, 4.2, 7, 1.6), R("base", 9.9, 10, 4.2, 10.5, 1.6), R("base", 16, 7.2, 4.2, 13.3, 1.6),
    P("dot", sparkle(18.1, 3.2, 1.9))]},
  "module/life-areas": {"color": "#4CC9B0", "label": "Lĩnh vực", "els": [
    C("base", 12, 7.6, 4.1), C("base", 16.4, 12, 4.1), C("base", 12, 16.4, 4.1), C("base", 7.6, 12, 4.1),
    C("innerDot", 12, 12, 1.7)]},
  "module/health": {"color": "#FF6B78", "label": "Sức khỏe", "els": [
    P("base", "M12 20.2S3.8 15.4 3.8 9.4A4.4 4.4 0 0 1 12 7.1A4.4 4.4 0 0 1 20.2 9.4C20.2 15.4 12 20.2 12 20.2Z"),
    P("inner", "M7 12.6H9.3L10.8 10.2L12.8 14.6L14.2 12.6H17")]},
  "module/finance": {"color": "#3B82F6", "label": "Tài chính", "els": [
    C("base", 16.2, 4.7, 2.3), R("base", 3.5, 7.5, 17, 13, 3.5),
    P("inner", "M20.5 12.5H16.5A2 2 0 0 0 16.5 16.5H20.5"), C("innerDot", 16.6, 14.5, 0.9)]},
  "module/learning": {"color": "#987BFF", "label": "Học tập", "els": [
    P("base", "M7 11.6V15.4C7 16.9 9.2 18.4 12 18.4S17 16.9 17 15.4V11.6"),
    P("base", "M12 5L20.8 9.3L12 13.6L3.2 9.3Z"), P("line", "M20.8 9.3V14.2"), P("dot", sparkle(19.4, 3.6, 1.8))]},
  "module/relationships": {"color": "#F472B6", "label": "Quan hệ", "els":
    person(8, 9.6) + person(16, 9.6) + [P("dot", "M12 6.6S9.9 5.4 9.9 3.9A1.05 1.05 0 0 1 12 3.6A1.05 1.05 0 0 1 14.1 3.9C14.1 5.4 12 6.6 12 6.6Z")]},
  "module/focus": {"color": "#FF9F43", "label": "Tập trung", "els": [
    C("base", 12, 13.4, 7.6), P("line", "M9.8 2.8H14.2"), P("line", "M12 2.8V5.8"), P("line", "M18.4 6.4L19.6 5.2"),
    P("inner", "M12 13.4V9.6"), C("innerDot", 12, 13.4, 1.7)]},
  "module/reviews": {"color": "#9A86F7", "label": "Review", "els": [
    P("line", "M20.5 12A8.5 8.5 0 1 1 12 3.5C14.4 3.5 16.6 4.4 18.3 6.1L20.5 8.2"), P("line", "M20.5 3.7V8.2H16"),
    R("base", 8.4, 7.8, 7.2, 8.6, 2), P("inner", "M10.4 10.9H13.6"), P("inner", "M10.4 13.4H12.6")]},
  "module/profile": {"color": "#8B85F6", "label": "Hồ sơ", "els": [
    C("base", 12, 8, 3.9), P("base", "M4.5 20.5C4.5 16.5 7.9 14 12 14S19.5 16.5 19.5 20.5Z")]},
  "module/settings": {"color": "#64748B", "label": "Cài đặt", "els": [
    P("base", gear()), C("inner", 12, 12, 2.9)]},
  "module/notifications": {"color": "#FF6B78", "label": "Thông báo", "els": [
    P("base", "M6 16.6V11.2A6 6 0 0 1 18 11.2V16.6L19.6 18.6H4.4Z"), P("line", "M10 21A2.1 2.1 0 0 0 14 21"),
    {"role": "over", "circle": [18.6, 5.2, 2.2], "fillDot": True}]},
  "module/search": {"color": "#64748B", "label": "Tìm kiếm", "outlineOnly": True, "els": [
    C("base", 10.6, 10.6, 6.6), P("line", "M15.6 15.6L20.4 20.4")]},
  "module/sync": {"color": "#5B9CF6", "label": "Đồng bộ", "els": [
    P("base", "M7.2 17.8A4.4 4.4 0 0 1 6.4 9.1A6 6 0 0 1 17.9 10.4A3.7 3.7 0 0 1 17.4 17.8Z"),
    P("inner", "M9.6 13A2.8 2.8 0 0 1 14.6 11.6"), P("inner", "M14.8 9.9V11.9H12.8"),
    P("inner", "M15 14.4A2.8 2.8 0 0 1 10 15.8"), P("inner", "M9.8 17.5V15.5H11.8")]},
  "module/archive": {"color": "#64748B", "label": "Lưu trữ", "els": [
    P("base", "M5 9H19V17.5A3 3 0 0 1 16 20.5H8A3 3 0 0 1 5 17.5Z"), R("base", 3.5, 4, 17, 5, 1.6),
    P("inner", "M12 11.6V16.4"), P("inner", "M9.9 14.4L12 16.5L14.1 14.4")]},
  "module/trash": {"color": "#FF6B78", "label": "Thùng rác", "els": [
    P("base", "M6 7H18L17.2 18.6A2.3 2.3 0 0 1 14.9 20.6H9.1A2.3 2.3 0 0 1 6.8 18.6Z"),
    P("line", "M4 7H20"), P("line", "M9.5 7V5A1.4 1.4 0 0 1 10.9 3.6H13.1A1.4 1.4 0 0 1 14.5 5V7"),
    P("inner", "M10 10.8V16.6"), P("inner", "M14 10.8V16.6")]},
  # ---------- statuses ----------
  "status/success": {"color": "#27B56F", "label": "Hoàn thành", "default": "filled", "els": [
    C("base", 12, 12, 8.6), P("inner", "M8.4 12.3L10.9 14.8L15.7 9.7")]},
  "status/incomplete": {"color": "#CBD0DA", "label": "Chưa xong", "outlineOnly": True, "els": [C("base", 12, 12, 8.6)]},
  "status/syncing": {"color": "#5B9CF6", "label": "Đang đồng bộ", "outlineOnly": True, "els": [
    P("line", "M19.5 12A7.5 7.5 0 0 1 6.2 16.8"), P("line", "M6 13.6L6 17.2L9.6 17.2"),
    P("line", "M4.5 12A7.5 7.5 0 0 1 17.8 7.2"), P("line", "M18 10.4L18 6.8L14.4 6.8")]},
  "status/offline": {"color": "#94A3B8", "label": "Ngoại tuyến", "outlineOnly": True, "els": [
    P("line", "M3.6 9.6A12 12 0 0 1 20.4 9.6"), P("line", "M6.6 12.8A7.6 7.6 0 0 1 17.4 12.8"),
    P("line", "M9.6 16A3.4 3.4 0 0 1 14.4 16"), C("dot", 12, 19.2, 1.2), P("line", "M4.5 4.5L19.5 19.5")]},
  "status/warning": {"color": "#FFB548", "label": "Cảnh báo", "els": [
    P("base", "M10.3 4.7A2 2 0 0 1 13.7 4.7L20.6 16.6A2 2 0 0 1 18.9 19.6H5.1A2 2 0 0 1 3.4 16.6Z"),
    P("inner", "M12 9.4V13.2"), C("innerDot", 12, 16.3, 1.15)]},
  "status/error": {"color": "#FF6B78", "label": "Lỗi", "default": "filled", "els": [
    C("base", 12, 12, 8.6), P("inner", "M9.3 9.3L14.7 14.7"), P("inner", "M14.7 9.3L9.3 14.7")]},
  "status/info": {"color": "#5B9CF6", "label": "Thông tin", "els": [
    C("base", 12, 12, 8.6), P("inner", "M12 11V16.2"), C("innerDot", 12, 7.9, 1.15)]},
  # ---------- priority ----------
  "priority/low": {"color": "#57D3AE", "label": "Thấp", "els": [
    P("line", "M6 20.5V4.2"), P("base", "M6 4.6H15.4L13.4 8.2L15.4 11.8H6Z")]},
  "priority/medium": {"color": "#FFB548", "label": "Trung bình", "els": [
    P("line", "M6 20.5V4.2"), P("base", "M6 4.4H17.6L15.2 8.8L17.6 13.2H6Z")]},
  "priority/high": {"color": "#FF6B78", "label": "Cao", "els": [
    P("line", "M6 20.5V4.2"), P("base", "M6 4.4H16.6L14.2 8.8L16.6 13.2H6Z"), P("dot", sparkle(20, 4.2, 1.9))]},
  # ---------- moods ----------
  "mood/very-happy": {"color": "#F7A3C6", "label": "Rất vui", "els": [face,
    P("inner", "M7.9 10.4Q9.1 8.9 10.3 10.4"), P("inner", "M13.7 10.4Q14.9 8.9 16.1 10.4"),
    P("inner", "M8.2 13.4Q12 18 15.8 13.4Z"), C("innerDot", 6.9, 13.2, 0.9), C("innerDot", 17.1, 13.2, 0.9)]},
  "mood/happy": {"color": "#FFC63D", "label": "Vui", "els": [face,
    P("inner", "M8 10.6Q9.1 9.4 10.2 10.6"), P("inner", "M13.8 10.6Q14.9 9.4 16 10.6"), P("inner", "M8.8 14Q12 16.9 15.2 14")]},
  "mood/neutral": {"color": "#FFB27A", "label": "Bình thường", "els": [face,
    C("innerDot", 9.1, 10.2, 1.15), C("innerDot", 14.9, 10.2, 1.15), P("inner", "M9.4 14.8H14.6")]},
  "mood/sad": {"color": "#5B9CF6", "label": "Buồn", "els": [face,
    C("innerDot", 9.1, 10.8, 1.15), C("innerDot", 14.9, 10.8, 1.15), P("inner", "M9 16.2Q12 13.6 15 16.2")]},
  "mood/very-sad": {"color": "#8B85F6", "label": "Rất buồn", "els": [face,
    C("innerDot", 9.1, 10.9, 1.15), C("innerDot", 14.9, 10.9, 1.15), P("inner", "M9 16.4Q12 13.8 15 16.4"),
    P("innerDot", "M7.6 12.2Q6.4 13.9 7.2 14.6Q8.2 15.1 8.5 14Q8.6 13.3 7.6 12.2Z")]},
  # ---------- life areas ----------
  "area/personal": {"color": "#8B85F6", "label": "Bản thân", "els": [C("base", 12, 12, 8.4), C("inner", 12, 12, 5.2), P("innerDot", sparkle(12, 12, 2.6))]},
  "area/career": {"color": "#5B9CF6", "label": "Sự nghiệp", "els": [
    R("base", 3.5, 7.5, 17, 12.5, 3), P("line", "M9 7.5V6A2 2 0 0 1 11 4H13A2 2 0 0 1 15 6V7.5"),
    P("inner", "M3.5 12.6H20.5"), R("innerDot", 10.8, 11.4, 2.4, 2.4, 0.7)]},
  "area/health": {"color": "#FF6B78", "label": "Sức khỏe", "ref": "module/health"},
  "area/finance": {"color": "#57D3AE", "label": "Tài chính", "ref": "module/finance"},
  "area/learning": {"color": "#987BFF", "label": "Học tập", "els": [
    P("base", "M12 7.4C10 5.9 7 5.6 3.5 6.1V18.2C7 17.7 10 18 12 19.5C14 18 17 17.7 20.5 18.2V6.1C17 5.6 14 5.9 12 7.4Z"),
    P("inner", "M12 7.4V19.5"), P("dot", sparkle(19.4, 2.9, 1.7))]},
  "area/relationships": {"color": "#F472B6", "label": "Quan hệ", "ref": "module/relationships"},
  "area/fun": {"color": "#FFC63D", "label": "Giải trí", "els": [P("base", star()), P("inner", "M9.7 13.4Q12 15.4 14.3 13.4")]},
  "area/family": {"color": "#FFB27A", "label": "Gia đình", "els":
    person(5.6, 11.2, 0.72) + person(18.4, 11.2, 0.72) + person(12, 8.6, 1.05)},
  "area/spirituality": {"color": "#A78BFA", "label": "Tâm linh", "els": [
    P("base", "M12 17.8C8.2 17.8 4.6 15.9 3.4 12.6C6.6 12 10.2 13.6 12 17.8Z"),
    P("base", "M12 17.8C15.8 17.8 19.4 15.9 20.6 12.6C17.4 12 13.8 13.6 12 17.8Z"),
    P("base", "M12 17.8C8.6 15.4 7.4 11.4 8.4 7.6C10.8 9.4 12.4 13.4 12 17.8Z"),
    P("base", "M12 17.8C15.4 15.4 16.6 11.4 15.6 7.6C13.2 9.4 11.6 13.4 12 17.8Z"),
    P("base", "M12 17.8C9.8 14.4 9.8 9.4 12 5.4C14.2 9.4 14.2 14.4 12 17.8Z"), P("line", "M7 20.4H17")]},
  "area/environment": {"color": "#4CC9B0", "label": "Môi trường", "els": [
    P("line", "M12 20.4V12.4"), P("base", "M12 13.2C7.4 13.2 5.4 10.4 5.4 6.6C9.4 6.6 12 9 12 13.2Z"),
    P("base", "M12 11C12 7 14.6 4.4 18.6 4.4C18.6 8.2 16.6 11 12 11Z"), P("line", "M7.6 20.4H16.4")]},
  "area/contribution": {"color": "#F7A3C6", "label": "Cống hiến", "els": [
    R("base", 4.2, 10.2, 15.6, 10.3, 2.6), R("base", 3.2, 7, 17.6, 3.8, 1.6), P("inner", "M12 7V20.5"),
    P("line", "M12 7C10.6 4.2 7.6 4 7.6 5.6C7.6 6.6 9.6 7 12 7ZM12 7C13.4 4.2 16.4 4 16.4 5.6C16.4 6.6 14.4 7 12 7Z")]},
}

# resolve refs
for k, v in list(ICONS.items()):
    if "ref" in v:
        base = ICONS[v["ref"]]
        ICONS[k] = {**{kk: vv for kk, vv in base.items() if kk != "label"}, "color": v["color"], "label": v["label"]}

out = os.path.join(os.path.dirname(__file__), "..", "src", "components", "icons", "icon-data.json")
json.dump(ICONS, open(out, "w"), ensure_ascii=False, indent=1)
print(len(ICONS), "icons ->", os.path.normpath(out))
