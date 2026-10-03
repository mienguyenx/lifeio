-- LifeOS demo seed: nạp dữ liệu mẫu đầy đủ (≈60 ngày lịch sử) cho MỘT tài khoản đã tồn tại.
-- Chạy lại bao nhiêu lần cũng được: xoá sạch dữ liệu cũ của tài khoản đó rồi nạp lại, ngày tháng tính theo hôm nay.
-- Dùng: sed 's/__EMAIL__/demo@example.com/' demo-seed.sql | psql -U lifeos -d lifeos
DO $$
DECLARE
  u uuid;
  t uuid; g1 uuid; g2 uuid; g3 uuid; h uuid; c uuid; ms uuid;
  d date;
  today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  i int;
  hb record;
BEGIN
  SELECT id INTO u FROM users WHERE email = '__EMAIL__';
  IF u IS NULL THEN RAISE EXCEPTION 'Không tìm thấy user __EMAIL__'; END IF;
  PERFORM setseed(0.42);

  -- ── Dọn dữ liệu cũ ──
  DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE user_id = u);
  DELETE FROM pomodoro_sessions WHERE user_id = u;
  DELETE FROM tasks WHERE user_id = u;
  DELETE FROM habit_completions WHERE habit_id IN (SELECT id FROM habits WHERE user_id = u);
  DELETE FROM habits WHERE user_id = u;
  DELETE FROM goal_milestones WHERE goal_id IN (SELECT id FROM goals WHERE user_id = u);
  DELETE FROM goals WHERE user_id = u;
  DELETE FROM health_logs WHERE user_id = u;
  DELETE FROM journal_entries WHERE user_id = u;
  DELETE FROM notes WHERE user_id = u;
  DELETE FROM finance_transactions WHERE user_id = u;
  DELETE FROM relationships_interactions WHERE user_id = u;
  DELETE FROM relationships_contacts WHERE user_id = u;
  DELETE FROM learning_books WHERE user_id = u;
  DELETE FROM learning_courses WHERE user_id = u;
  DELETE FROM life_wheel_scores WHERE user_id = u;
  DELETE FROM daily_intentions WHERE user_id = u;
  DELETE FROM weekly_reviews WHERE user_id = u;
  DELETE FROM monthly_reviews WHERE user_id = u;
  DELETE FROM life_visions WHERE user_id = u;
  DELETE FROM personal_values WHERE user_id = u;
  DELETE FROM life_roles WHERE user_id = u;
  DELETE FROM ai_memories WHERE user_id = u;
  DELETE FROM user_notifications WHERE user_id = u;
  DELETE FROM task_tags WHERE user_id = u;
  DELETE FROM note_tags WHERE user_id = u;
  DELETE FROM journal_tags WHERE user_id = u;

  -- ── Nhãn (tags là uuid[] trỏ tới bảng *_tags) ──
  INSERT INTO task_tags(user_id, name, color) VALUES (u, 'báo cáo', '#6C5CE7'), (u, 'khách hàng', '#FF7A45'), (u, 'gia đình', '#F2557A');
  INSERT INTO note_tags(user_id, name, color) VALUES (u, 'sản phẩm', '#6C5CE7'), (u, 'ý tưởng', '#E8961C'), (u, 'chạy bộ', '#22B07D'),
    (u, 'sách', '#3D8BFD'), (u, 'gia đình', '#F2557A'), (u, 'họp', '#8E86F7'), (u, 'du lịch', '#57D3AE');
  INSERT INTO journal_tags(user_id, name, color) VALUES (u, 'công việc', '#6C5CE7'), (u, 'chạy bộ', '#22B07D'), (u, 'sức khoẻ', '#FF6B78'),
    (u, 'gia đình', '#F2557A'), (u, 'bạn bè', '#3D8BFD'), (u, 'năng suất', '#E8961C');

  -- ── Hồ sơ & cài đặt ──
  UPDATE profiles SET name = 'Minh Demo', timezone = 'Asia/Ho_Chi_Minh', birthday = '1994-08-15',
    bio = 'Product manager, đang tập chạy bộ và đọc 24 cuốn sách/năm.',
    life_purpose = 'Sống khoẻ, làm việc có ý nghĩa và dành thời gian cho gia đình.' WHERE id = u;
  DELETE FROM user_settings WHERE user_id = u;
  INSERT INTO user_settings(user_id, onboarding_completed) VALUES (u, true);

  -- ── Định hướng: tầm nhìn, giá trị, vai trò ──
  INSERT INTO life_visions(user_id, statement, timeframe) VALUES
    (u, 'Đến 2030: sức khoẻ tốt, tự do tài chính cơ bản, dẫn dắt một đội sản phẩm 20 người.', '5 năm');
  INSERT INTO personal_values(user_id, name, description, icon, priority) VALUES
    (u, 'Sức khoẻ', 'Năng lượng là nền tảng', '💪', 1), (u, 'Gia đình', 'Có mặt cho người thân', '❤️', 2),
    (u, 'Học hỏi', 'Mỗi ngày tốt hơn 1%', '📚', 3), (u, 'Chính trực', 'Nói được làm được', '🤝', 4);
  INSERT INTO life_roles(user_id, name, description, icon, is_active) VALUES
    (u, 'Product Manager', 'Dẫn dắt sản phẩm', '💼', true), (u, 'Con trai', 'Quan tâm bố mẹ', '👨‍👩‍👦', true),
    (u, 'Runner', 'Chuẩn bị half-marathon', '🏃', true);

  -- ── Mục tiêu + cột mốc ──
  INSERT INTO goals(user_id, title, description, area, target_date, progress, priority, status, is_focused, current_streak, best_streak, last_activity_date, created_at)
    VALUES (u, 'Chạy half-marathon 21km', 'Hoàn thành giải chạy tháng 12 dưới 2h15', 'health', today + 75, 45, 'high', 'active', true, 6, 14, today - 1, now() - interval '50 days')
    RETURNING id INTO g1;
  INSERT INTO goals(user_id, title, description, area, target_date, progress, priority, status, created_at)
    VALUES (u, 'Tiết kiệm 100 triệu quỹ khẩn cấp', 'Mỗi tháng để dành 8 triệu', 'finance', today + 200, 38, 'medium', 'active', now() - interval '90 days')
    RETURNING id INTO g2;
  INSERT INTO goals(user_id, title, description, area, target_date, progress, priority, status, created_at)
    VALUES (u, 'Ra mắt tính năng thanh toán Q4', 'Launch cho 100% user, tỉ lệ lỗi < 0.5%', 'career', today + 40, 60, 'high', 'active', now() - interval '35 days')
    RETURNING id INTO g3;
  INSERT INTO goals(user_id, title, area, target_date, progress, priority, status, completed_at, created_at)
    VALUES (u, 'Đọc xong 12 cuốn sách', 'learning', today - 10, 100, 'medium', 'active', now() - interval '10 days', now() - interval '200 days');
  INSERT INTO goals(user_id, title, area, progress, priority, status, created_at)
    VALUES (u, 'Học guitar cơ bản', 'fun', 15, 'low', 'paused', now() - interval '120 days');
  INSERT INTO goal_milestones(goal_id, title, completed, completed_at) VALUES
    (g1, 'Chạy liền 5km', true, now() - interval '40 days'), (g1, 'Chạy liền 10km', true, now() - interval '12 days'),
    (g1, 'Chạy 15km', false, null), (g1, 'Đăng ký giải', false, null),
    (g2, 'Mở tài khoản tiết kiệm riêng', true, now() - interval '80 days'), (g2, 'Đạt 50 triệu', false, null),
    (g3, 'Chốt spec', true, now() - interval '30 days'), (g3, 'Beta 10% user', true, now() - interval '5 days'), (g3, 'Launch 100%', false, null);

  -- ── Công việc (đủ trạng thái: quá hạn, hôm nay, sắp tới, chưa hạn, đã xong, lặp lại, việc con, checklist) ──
  INSERT INTO tasks(user_id, title, description, area, priority, status, due_date, goal_id, estimated_pomodoros, completed_pomodoros, tags, created_at)
    VALUES (u, 'Hoàn thiện slide báo cáo Q4', 'Slide cho buổi họp ban giám đốc thứ 2', 'career', 'high', 'in_progress', today, g3, 4, 2, (SELECT array_agg(id) FROM task_tags WHERE user_id = u AND name = 'báo cáo'), now() - interval '3 days')
    RETURNING id INTO t;
  INSERT INTO subtasks(task_id, title, completed, position) VALUES
    (t, 'Thu thập số liệu doanh thu', true, 0), (t, 'Vẽ biểu đồ tăng trưởng', true, 1), (t, 'Viết phần kết luận', false, 2), (t, 'Gửi anh Hùng review', false, 3);
  INSERT INTO tasks(user_id, title, area, priority, status, due_date, parent_id, completed_at) VALUES
    (u, 'Chuẩn bị dữ liệu tài chính', 'career', 'high', 'done', today, t, now() - interval '2 hours'),
    (u, 'Thiết kế template slide', 'career', 'medium', 'todo', today + 1, t, null),
    (u, 'Tập dượt thuyết trình', 'career', 'medium', 'todo', null, t, null);
  INSERT INTO tasks(user_id, title, area, priority, status, due_date, goal_id, reminder_time) VALUES
    (u, 'Review PR thanh toán', 'career', 'medium', 'todo', today, g3, '10:00') RETURNING id INTO t;
  INSERT INTO subtasks(task_id, title, completed, position) VALUES (t, 'Đọc mô tả PR', false, 0), (t, 'Chạy test local', false, 1);
  INSERT INTO tasks(user_id, title, area, priority, status, due_date, reminder_time) VALUES
    (u, 'Gọi điện hỏi thăm bà ngoại', 'relationships', 'medium', 'todo', today, '19:30'),
    (u, 'Đặt lịch khám răng', 'health', 'low', 'todo', today, null),
    (u, 'Gửi báo giá cho khách hàng A', 'career', 'high', 'todo', today - 1, null),
    (u, 'Đóng tiền điện tháng này', 'finance', 'medium', 'todo', today - 3, null),
    (u, 'Gia hạn bảo hiểm xe', 'finance', 'high', 'todo', today - 6, null),
    (u, 'Lên kế hoạch tuần tới', 'personal', 'medium', 'todo', today + 1, '20:00'),
    (u, 'Mua quà sinh nhật Lan', 'relationships', 'high', 'todo', today + 3, null),
    (u, '1:1 với team design', 'career', 'medium', 'todo', today + 2, '14:00'),
    (u, 'Chạy dài 12km', 'health', 'medium', 'todo', today + 4, '06:00'),
    (u, 'Viết blog: bài học từ dự án thanh toán', 'learning', 'low', 'todo', today + 9, null),
    (u, 'Dọn tủ quần áo', 'environment', 'low', 'todo', null, null),
    (u, 'Tìm hiểu quỹ ETF', 'finance', 'low', 'deferred', null, null),
    (u, 'Ý tưởng: app nhắc uống nước cho bố', 'fun', 'low', 'todo', null, null);
  INSERT INTO tasks(user_id, title, area, priority, status, due_date, recurring_frequency, recurring_interval, recurring_week_days) VALUES
    (u, 'Tổng kết chi tiêu tuần', 'finance', 'medium', 'todo', today + ((7 - extract(isodow from today)::int) % 7), 'weekly', 1, ARRAY[0]),
    (u, 'Tưới cây', 'environment', 'low', 'todo', today, 'daily', 2, null);
  -- đã xong (rải trong 3 tuần để thống kê có dữ liệu)
  FOR i IN 0..24 LOOP
    INSERT INTO tasks(user_id, title, area, priority, status, due_date, completed_at, created_at)
    VALUES (u, (ARRAY['Trả lời email khách','Họp sprint planning','Cập nhật roadmap','Đi siêu thị','Sửa bug đăng nhập','Đọc tài liệu API','Gặp mentor','Nộp báo cáo tuần','Dọn bàn làm việc','Thanh toán thẻ tín dụng'])[1 + i % 10],
      (ARRAY['career','career','career','personal','career','learning','career','career','environment','finance'])[1 + i % 10]::life_area,
      (ARRAY['low','medium','high'])[1 + i % 3]::task_priority, 'done', today - (i % 21),
      (today - (i % 21))::timestamp + time '16:00' - interval '7 hours', now() - ((i % 21) + 2) * interval '1 day');
  END LOOP;

  -- ── Pomodoro (2 tuần) ──
  FOR i IN 0..13 LOOP
    FOR c IN SELECT gen_random_uuid() FROM generate_series(1, 1 + (random() * 4)::int) LOOP
      INSERT INTO pomodoro_sessions(user_id, phase, duration, completed_at)
      VALUES (u, 'work', 25, (today - i)::timestamp + time '09:00' + random() * interval '9 hours' - interval '7 hours');
    END LOOP;
  END LOOP;

  -- ── Thói quen + lịch sử 60 ngày ──
  FOR hb IN SELECT * FROM (VALUES
      ('Uống nước sau khi thức dậy', '💧', 'health',  'daily',  NULL::int[], 1, NULL, '06:30'::time, 0.92, NULL::uuid),
      ('Thiền 10 phút',              '🧘', 'spirituality', 'daily', NULL, 1, NULL, '07:00'::time, 0.75, NULL),
      ('Uống 8 ly nước',             '💧', 'health',  'daily',  NULL, 8, 'ly', NULL::time, 0.6, NULL),
      ('Chạy bộ',                    '🏃', 'health',  'custom', ARRAY[1,3,5,6], 1, NULL, '18:00'::time, 0.8, g1),
      ('Đọc sách 20 trang',          '📚', 'learning','daily',  NULL, 20, 'trang', '21:00'::time, 0.65, NULL),
      ('Viết nhật ký',               '✍️', 'personal','daily',  NULL, 1, NULL, '22:00'::time, 0.7, NULL),
      ('Không lướt mạng sau 23h',     '📵', 'health',  'daily',  NULL, 1, NULL, NULL::time, 0.5, NULL),
      ('Gọi cho bố mẹ',               '❤️', 'relationships', 'weekly', ARRAY[0], 1, NULL, '19:00'::time, 0.85, NULL),
      ('Ghi chép chi tiêu',           '💰', 'finance', 'daily',  NULL, 1, NULL, '21:30'::time, 0.55, g2)
    ) AS x(name, icon, area, freq, days, target, unit, rt, p, goal)
  LOOP
    INSERT INTO habits(user_id, name, icon, area, frequency, custom_days, target_per_day, target_unit, reminder_time, reminder_enabled, goal_id, completed_dates, created_at)
    VALUES (u, hb.name, hb.icon, hb.area::life_area, hb.freq::habit_frequency, hb.days, hb.target, hb.unit, hb.rt, hb.rt IS NOT NULL, hb.goal, '{}', now() - interval '60 days')
    RETURNING id INTO h;
    FOR i IN 1..60 LOOP
      d := today - i;
      IF (hb.days IS NULL OR extract(dow from d)::int = ANY(hb.days)) AND (random() < hb.p OR i <= 3) THEN
        INSERT INTO habit_completions(habit_id, date, count) VALUES (h, d, hb.target);
      ELSIF hb.target > 1 AND random() < 0.5 THEN
        INSERT INTO habit_completions(habit_id, date, count) VALUES (h, d, greatest(1, (hb.target * random())::int));
      END IF;
    END LOOP;
    -- hôm nay: vài cái xong, một cái làm dở
    IF hb.name IN ('Uống nước sau khi thức dậy', 'Thiền 10 phút') THEN INSERT INTO habit_completions(habit_id, date, count) VALUES (h, today, 1); END IF;
    IF hb.name = 'Uống 8 ly nước' THEN INSERT INTO habit_completions(habit_id, date, count) VALUES (h, today, 3); END IF;
    IF hb.name = 'Đọc sách 20 trang' THEN INSERT INTO habit_completions(habit_id, date, count) VALUES (h, today, 8); END IF;
    -- streak / completed_dates (chỉ ngày đạt mục tiêu)
    UPDATE habits SET completed_dates = (SELECT coalesce(array_agg(hc.date::text ORDER BY hc.date), '{}') FROM habit_completions hc WHERE hc.habit_id = h AND hc.count >= hb.target)
      WHERE id = h;
    UPDATE habits SET streak = (
        SELECT count(*) FROM generate_series(1, 60) s
        WHERE NOT EXISTS (SELECT 1 FROM generate_series(1, s) k WHERE NOT ((today - k)::text = ANY(completed_dates)))),
      best_streak = 5 + (random() * 20)::int
      WHERE id = h;
    UPDATE habits SET best_streak = greatest(best_streak, streak) WHERE id = h;
  END LOOP;
  INSERT INTO habits(user_id, name, icon, area, frequency, streak, best_streak, completed_dates, archived_at, created_at)
    VALUES (u, 'Học tiếng Nhật', '🧠', 'learning', 'daily', 0, 9, '{}', now() - interval '20 days', now() - interval '100 days');

  -- ── Sức khoẻ (30 ngày) ──
  FOR i IN 0..29 LOOP
    d := today - i;
    INSERT INTO health_logs(user_id, date, type, value, unit) VALUES
      (u, d, 'sleep', round((5.5 + random() * 3)::numeric, 1), 'giờ'),
      (u, d, 'steps', (3000 + random() * 9000)::int, 'bước'),
      (u, d, 'water', CASE WHEN i = 0 THEN 3 ELSE 4 + (random() * 5)::int END, 'ly'),
      (u, d, 'mood', 2 + (random() * 3)::int, '/5');
    IF random() < 0.6 THEN INSERT INTO health_logs(user_id, date, type, value, unit) VALUES (u, d, 'exercise', (15 + random() * 50)::int, 'phút'); END IF;
    IF i % 3 = 0 THEN INSERT INTO health_logs(user_id, date, type, value, unit) VALUES (u, d, 'weight', round((70.5 - (30 - i) * 0.05 + random() * 0.6)::numeric, 1), 'kg'); END IF;
  END LOOP;

  -- ── Nhật ký (khoảng 20 bài) ──
  FOR i IN 0..27 LOOP
    IF i % 4 <> 3 THEN
      INSERT INTO journal_entries(user_id, date, content, mood, energy, areas, gratitude, tags, created_at)
      VALUES (u, today - i - 1,
        (ARRAY[
          'Hôm nay họp sprint khá căng nhưng chốt được scope. Mình cần học cách nói "không" sớm hơn.',
          'Chạy được 8km, chân hơi mỏi nhưng tinh thần rất tốt. Tối đọc thêm 30 trang Atomic Habits.',
          'Ngày hơi mệt, ngủ ít. Làm việc kém tập trung buổi chiều. Mai sẽ đi ngủ trước 23h.',
          'Gọi video cho bố mẹ, mẹ kể chuyện vườn rau. Thấy biết ơn vì gia đình vẫn khoẻ.',
          'Demo beta thanh toán cho sếp, phản hồi tích cực. Còn 2 bug cần sửa trước khi mở rộng.',
          'Cuối tuần đi cà phê với Lan và Tuấn, bàn kế hoạch du lịch Đà Lạt.',
          'Cảm thấy hơi quá tải vì nhiều việc dồn lại. Đã dùng Pomodoro, làm xong 5 phiên.'])[1 + i % 7],
        2 + ((i * 7) % 4), 2 + ((i * 3) % 4),
        ARRAY[(ARRAY['career','health','personal','relationships','career','fun','career'])[1 + i % 7]]::life_area[],
        ARRAY[(ARRAY['Cà phê sáng ngon','Được đồng nghiệp giúp','Trời mát','Mẹ khoẻ','Sếp ghi nhận','Bạn bè','Ngủ đủ giấc'])[1 + i % 7]],
        (SELECT array_agg(id) FROM journal_tags WHERE user_id = u AND name = (ARRAY['công việc','chạy bộ','sức khoẻ','gia đình','công việc','bạn bè','năng suất'])[1 + i % 7]),
        (today - i - 1)::timestamp + time '22:15' - interval '7 hours');
    END IF;
  END LOOP;

  -- ── Ý định hằng ngày ──
  FOR i IN 0..6 LOOP
    INSERT INTO daily_intentions(user_id, date, intention, completed, reflection)
    VALUES (u, today - i, (ARRAY['Tập trung hoàn thành slide Q4','Không check điện thoại trong giờ làm sâu','Chạy 6km thư thả','Lắng nghe nhiều hơn trong cuộc họp','Ăn uống lành mạnh','Ngủ trước 23h','Dành thời gian cho gia đình'])[1 + i], i > 0 AND i % 3 <> 1, CASE WHEN i > 0 THEN 'Làm được khoảng 70%.' END);
  END LOOP;

  -- ── Ghi chú ──
  INSERT INTO notes(user_id, title, content, tags, area, is_pinned, is_favorite, color, created_at, updated_at) VALUES
    (u, 'Ý tưởng cải thiện onboarding', E'- Giảm từ 5 bước xuống 3\n- Cho phép bỏ qua\n- Thêm video 30s', (SELECT array_agg(id) FROM note_tags WHERE user_id = u AND name = ANY(ARRAY['sản phẩm','ý tưởng'])), 'career', true, true, NULL, now() - interval '6 days', now() - interval '1 day'),
    (u, 'Giáo án chạy half-marathon', E'Tuần 1-4: 3 buổi/tuần, chạy dài 8-10km\nTuần 5-8: thêm interval\nTuần 9-12: chạy dài 15-18km', (SELECT array_agg(id) FROM note_tags WHERE user_id = u AND name = ANY(ARRAY['chạy bộ'])), 'health', true, false, NULL, now() - interval '30 days', now() - interval '3 days'),
    (u, 'Trích dẫn hay — Atomic Habits', '“Bạn không vươn tới mục tiêu, bạn rơi xuống mức hệ thống của mình.”', (SELECT array_agg(id) FROM note_tags WHERE user_id = u AND name = ANY(ARRAY['sách'])), 'learning', false, true, NULL, now() - interval '12 days', now() - interval '12 days'),
    (u, 'Danh sách quà tặng', E'Lan: tai nghe\nBố: áo len\nMẹ: máy massage', (SELECT array_agg(id) FROM note_tags WHERE user_id = u AND name = ANY(ARRAY['gia đình'])), 'relationships', false, false, NULL, now() - interval '9 days', now() - interval '2 days'),
    (u, 'Biên bản họp sprint 42', E'Mục tiêu: hoàn thiện checkout\nRủi ro: cổng thanh toán chậm phản hồi\nAction: Minh follow-up với đối tác', (SELECT array_agg(id) FROM note_tags WHERE user_id = u AND name = ANY(ARRAY['họp'])), 'career', false, false, NULL, now() - interval '4 days', now() - interval '4 days'),
    (u, 'Kế hoạch du lịch Đà Lạt', E'Thời gian: cuối tháng\nNgân sách: 5 triệu/người\nĐi cùng: Lan, Tuấn', (SELECT array_agg(id) FROM note_tags WHERE user_id = u AND name = ANY(ARRAY['du lịch'])), 'fun', false, false, NULL, now() - interval '2 days', now() - interval '2 days');

  -- ── Tài chính (2 tháng) ──
  FOR i IN 0..59 LOOP
    d := today - i;
    INSERT INTO finance_transactions(user_id, date, type, category, amount, description)
    VALUES (u, d, 'expense', 'food', (40 + random() * 160)::int * 1000, (ARRAY['Ăn trưa văn phòng','Cà phê','Bún chả','Đi chợ','Trà sữa'])[1 + i % 5]);
    IF i % 3 = 0 THEN INSERT INTO finance_transactions(user_id, date, type, category, amount, description) VALUES (u, d, 'expense', 'transport', (30 + random() * 90)::int * 1000, 'Grab / xăng xe'); END IF;
    IF i % 9 = 4 THEN INSERT INTO finance_transactions(user_id, date, type, category, amount, description) VALUES (u, d, 'expense', 'shopping', (200 + random() * 1300)::int * 1000, (ARRAY['Mua giày chạy','Quần áo','Đồ gia dụng'])[1 + (i / 9) % 3]); END IF;
    IF i % 11 = 6 THEN INSERT INTO finance_transactions(user_id, date, type, category, amount, description) VALUES (u, d, 'expense', 'entertainment', (150 + random() * 400)::int * 1000, 'Xem phim / cà phê bạn bè'); END IF;
    IF extract(day from d) = 1 THEN
      INSERT INTO finance_transactions(user_id, date, type, category, amount, description) VALUES
        (u, d, 'income', 'salary', 32000000, 'Lương tháng'),
        (u, d, 'expense', 'bills', 1850000, 'Điện, nước, internet'),
        (u, d, 'expense', 'bills', 6500000, 'Tiền nhà');
    END IF;
    IF extract(day from d) = 20 THEN
      INSERT INTO finance_transactions(user_id, date, type, category, amount, description) VALUES
        (u, d, 'income', 'freelance', 4500000, 'Dự án tư vấn UX'), (u, d, 'expense', 'education', 990000, 'Khoá học Udemy');
    END IF;
  END LOOP;
  INSERT INTO finance_transactions(user_id, date, type, category, amount, description) VALUES
    (u, today - 15, 'income', 'investment', 1200000, 'Lãi tiết kiệm'), (u, today - 8, 'expense', 'health', 450000, 'Khám sức khoẻ');

  -- ── Quan hệ ──
  FOR hb IN SELECT * FROM (VALUES
      ('Mẹ', 'family', '1968-03-12'::date, 5, 2), ('Bố', 'family', '1965-11-02'::date, 5, 9),
      ('Nguyễn Thị Lan', 'friend', (today + 3 - interval '29 years')::date, 4, 4), ('Trần Văn Tuấn', 'friend', '1993-06-21'::date, 3, 25),
      ('Anh Hùng (sếp)', 'colleague', NULL::date, 4, 1), ('Chị Mai (mentor)', 'mentor', NULL::date, 4, 40)
    ) AS x(name, rel, bday, imp, last)
  LOOP
    INSERT INTO relationships_contacts(user_id, name, relationship, birthday, importance, last_contact, notes)
    VALUES (u, hb.name, hb.rel, hb.bday, hb.imp, today - hb.last, NULL) RETURNING id INTO c;
    INSERT INTO relationships_interactions(user_id, contact_id, type, date, duration, notes) VALUES
      (u, c, (ARRAY['call','message','meeting','video_call'])[1 + hb.imp % 4], today - hb.last, 20, 'Hỏi thăm, cập nhật tình hình'),
      (u, c, 'message', today - hb.last - 10, NULL, NULL);
  END LOOP;

  -- ── Học tập ──
  INSERT INTO learning_books(user_id, title, author, total_pages, current_page, status, rating, started_at, completed_at) VALUES
    (u, 'Atomic Habits', 'James Clear', 320, 210, 'reading', NULL, today - 20, NULL),
    (u, 'Deep Work', 'Cal Newport', 296, 296, 'completed', 5, today - 70, today - 40),
    (u, 'Inspired', 'Marty Cagan', 368, 368, 'completed', 4, today - 120, today - 80),
    (u, 'Sapiens', 'Yuval Noah Harari', 512, 0, 'want_to_read', NULL, NULL, NULL);
  INSERT INTO learning_courses(user_id, title, description, category, total_lessons, completed_lessons, status, started_at) VALUES
    (u, 'SQL cho Product Manager', 'Tự truy vấn dữ liệu sản phẩm', 'Data', 24, 15, 'in_progress', today - 25),
    (u, 'Tiếng Anh thuyết trình', 'Business presentation', 'Ngôn ngữ', 12, 12, 'completed', today - 90),
    (u, 'Guitar cho người mới', NULL, 'Âm nhạc', 30, 4, 'not_started', today - 120);

  -- ── Bánh xe cuộc sống (3 lần) ──
  INSERT INTO life_wheel_scores(user_id, date, scores) VALUES
    (u, today - 60, '{"health":5,"relationships":7,"career":6,"finance":5,"personal":6,"fun":4,"environment":6,"spirituality":5,"learning":6,"contribution":4}'),
    (u, today - 30, '{"health":6,"relationships":7,"career":7,"finance":5,"personal":6,"fun":5,"environment":6,"spirituality":6,"learning":7,"contribution":4}'),
    (u, today - 2,  '{"health":7,"relationships":8,"career":7,"finance":6,"personal":7,"fun":5,"environment":7,"spirituality":6,"learning":7,"contribution":5}');

  -- ── Review tuần / tháng ──
  FOR i IN 1..4 LOOP
    INSERT INTO weekly_reviews(user_id, week_start, overall_rating, highlight, lowlight, wins, challenges, lessons_learned, next_week_focus, gratitude)
    VALUES (u, date_trunc('week', today)::date - 7 * i, 3 + i % 3, 'Hoàn thành mục tiêu chạy tuần', 'Ngủ muộn 3 đêm',
      ARRAY['Ship beta thanh toán','Chạy 20km/tuần'], ARRAY['Họp quá nhiều'], ARRAY['Chặn lịch làm sâu buổi sáng'],
      ARRAY['Slide Q4','Ngủ trước 23h'], ARRAY['Gia đình khoẻ']);
  END LOOP;
  INSERT INTO monthly_reviews(user_id, month, wins, challenges, lessons_learned, next_month_focus, overall_rating, highlight, lowlight, gratitude)
  VALUES (u, to_char(today - interval '1 month', 'YYYY-MM'), ARRAY['Chạy được 10km','Tiết kiệm 8 triệu'], ARRAY['Chi tiêu ăn uống vượt'],
    ARRAY['Lên kế hoạch tuần vào Chủ nhật'], ARRAY['Launch thanh toán','Half-marathon'], 4, 'Beta thanh toán', 'Ốm 3 ngày', ARRAY['Đồng đội tốt']);

  -- ── AI memory & thông báo ──
  INSERT INTO ai_memories(user_id, type, content, importance, source, tags) VALUES
    (u, 'preference', 'Thích làm việc sâu vào buổi sáng 8h–11h', 'high', 'chat', ARRAY['năng suất']),
    (u, 'fact', 'Đang chuẩn bị half-marathon tháng 12', 'high', 'goal', ARRAY['sức khoẻ']),
    (u, 'fact', 'Có bạn thân tên Lan, sinh nhật sắp tới', 'medium', 'chat', ARRAY['quan hệ']);
  INSERT INTO user_notifications(user_id, type, title, body, url, created_at, read_at) VALUES
    (u, 'task', '3 việc quá hạn', 'Gia hạn bảo hiểm xe, Đóng tiền điện, Gửi báo giá', '/tasks', now() - interval '1 hour', NULL),
    (u, 'habit', 'Đến giờ Thiền 10 phút', 'Giữ chuỗi nhé!', '/habits', now() - interval '5 hours', now() - interval '4 hours'),
    (u, 'relationship', 'Sinh nhật Nguyễn Thị Lan trong 3 ngày', 'Chuẩn bị quà chưa?', '/relationships', now() - interval '1 day', NULL);

  RAISE NOTICE 'Demo seed xong cho %', '__EMAIL__';
END $$;
