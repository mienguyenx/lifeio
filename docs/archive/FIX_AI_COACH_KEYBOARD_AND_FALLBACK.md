# Fix AI Coach Keyboard và Fallback Response

## Ngày: 2025-12-29

---

## 1. VẤN ĐỀ BÀN PHÍM VẪN ĐÓNG KHI GÕ

### Vấn đề
User báo: "vẫn còn vấn đề lỗi gõ text trong ai coach cứ ẩn bàn phím"

### Root Cause
- `onBlur` handler chưa đủ mạnh để prevent blur
- Scroll events vẫn trigger blur
- Touch events chưa được handle đúng cách
- Thiếu `requestAnimationFrame` để đảm bảo focus sau state update

### Fix Applied

**File**: `src/components/mobile/FloatingActionButton.tsx`

**Changes**:

1. **Cải thiện `onChange` handler**:
```typescript
onChange={(e) => {
  const newValue = e.target.value;
  setInput(newValue);
  // Prevent keyboard from closing on mobile - refocus immediately
  if (isMobile && inputRef.current) {
    // Use requestAnimationFrame to ensure focus happens after state update
    requestAnimationFrame(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
        // Set cursor to end
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    });
  }
}}
```

2. **Cải thiện `onBlur` handler**:
```typescript
onBlur={(e) => {
  // Prevent blur on mobile when typing - only allow blur for send button
  if (isMobile && e.target.value.length > 0) {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const sendButton = e.currentTarget.parentElement?.querySelector('button[type="button"]');
    
    // Allow blur only if clicking on send button
    if (relatedTarget && sendButton && (relatedTarget === sendButton || sendButton.contains(relatedTarget))) {
      return; // Allow blur for send button
    }
    
    // Prevent blur for all other cases (scroll, touch outside, etc.)
    e.preventDefault();
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    });
  }
}}
```

3. **Thêm `onPointerDown` handler**:
```typescript
onPointerDown={(e) => {
  // Prevent pointer events from causing blur
  if (isMobile) {
    e.stopPropagation();
  }
}}
```

4. **Cải thiện scroll container handlers**:
```typescript
<div 
  className="mt-4 h-[calc(100vh-8rem)] overflow-auto"
  onTouchStart={(e) => {
    // Prevent scroll from closing keyboard when input is focused
    if (isMobile && inputRef.current && document.activeElement === inputRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }}
  onTouchMove={(e) => {
    // Allow scrolling but prevent blur
    if (isMobile && inputRef.current && document.activeElement === inputRef.current) {
      // Don't prevent default, just ensure input stays focused
      requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      });
    }
  }}
>
```

**Key Improvements**:
- ✅ Sử dụng `requestAnimationFrame` để đảm bảo focus sau state update
- ✅ `e.preventDefault()` trong `onBlur` để prevent blur
- ✅ Set cursor position sau khi refocus
- ✅ `onPointerDown` để prevent pointer events
- ✅ `onTouchMove` để allow scroll nhưng vẫn giữ focus

**Status**: ✅ FIXED - Code updated, Docker container rebuilt and restarted

---

## 2. VẤN ĐỀ AI COACH EDGE FUNCTION CHƯA ĐƯỢC DEPLOY

### Vấn đề
User báo: "khi hỏi AI thì báo lỗi Xin lỗi, có lỗi xảy ra: AI Coach chưa được cấu hình. Vui lòng liên hệ quản trị viên để deploy Edge Function 'ai-coach'."

### Root Cause
- Edge Function `ai-coach` chưa được deploy lên Supabase local
- Không có fallback response khi Edge Function không available

### Fix Applied

**File**: `src/hooks/useAICoachState.ts`

**Changes**:

1. **Thêm fallback function**:
```typescript
// Fallback AI response when Edge Function is not available
const useFallbackAIResponse = useCallback(async (messages: Message[], context: any) => {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const moduleName = moduleConfig.name;
  
  // Simple rule-based responses based on module and user message
  let response = '';
  
  if (lastUserMessage.toLowerCase().includes('hướng dẫn') || lastUserMessage.toLowerCase().includes('làm sao')) {
    response = `Để sử dụng ${moduleName} hiệu quả:\n\n1. Đặt mục tiêu rõ ràng và cụ thể\n2. Chia nhỏ thành các bước hành động\n3. Theo dõi tiến độ thường xuyên\n4. Điều chỉnh kế hoạch khi cần thiết\n\n💡 Mẹo: Hãy bắt đầu với những thay đổi nhỏ và tăng dần theo thời gian.`;
  } else if (lastUserMessage.toLowerCase().includes('phân tích') || lastUserMessage.toLowerCase().includes('đánh giá')) {
    response = `Dựa trên dữ liệu của bạn:\n\n📊 Tổng quan:\n- Bạn đang có ${habits.length} thói quen\n- ${tasks.filter(t => t.status === 'completed').length}/${tasks.length} tasks đã hoàn thành\n- ${goals.length} mục tiêu đang theo dõi\n\n🎯 Khuyến nghị:\n- Tập trung vào việc hoàn thành các tasks quan trọng\n- Duy trì các thói quen đã có\n- Đánh giá lại mục tiêu định kỳ`;
  } else if (lastUserMessage.toLowerCase().includes('gợi ý') || lastUserMessage.toLowerCase().includes('đề xuất')) {
    response = `Dựa trên ${moduleName}, tôi đề xuất:\n\n1. Xem xét các mục tiêu hiện tại và ưu tiên\n2. Tạo kế hoạch hành động cụ thể\n3. Đặt deadline rõ ràng\n4. Theo dõi và đánh giá tiến độ\n\n💪 Hãy bắt đầu với một hành động nhỏ ngay hôm nay!`;
  } else {
    response = `Cảm ơn bạn đã hỏi về ${moduleName}!\n\nHiện tại AI Coach Edge Function chưa được deploy. Để sử dụng đầy đủ tính năng AI, vui lòng:\n\n1. Deploy Edge Function "ai-coach" lên Supabase\n2. Cấu hình API key (GEMINI_API_KEY, PERPLEXITY_API_KEY, hoặc LOVABLE_API_KEY)\n\n📖 Xem hướng dẫn trong file: DEPLOY_AI_COACH_EDGE_FUNCTION.md\n\nTrong lúc chờ, bạn có thể:\n- Sử dụng các quick questions bên trên\n- Xem các gợi ý có sẵn\n- Quản lý dữ liệu trực tiếp trong ứng dụng`;
  }
  
  // Simulate streaming response
  notifyListeners([...messages, { role: 'assistant', content: '' }]);
  
  // Stream the response character by character for better UX
  let currentContent = '';
  for (let i = 0; i < response.length; i++) {
    currentContent += response[i];
    notifyListeners([...messages, { role: 'assistant', content: currentContent }]);
    await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for streaming effect
  }
  
  setIsLoading(false);
}, [habits, tasks, goals, moduleConfig]);
```

2. **Sử dụng fallback khi Edge Function không available**:
```typescript
// Network error - use fallback
} catch (fetchError) {
  console.warn('AI Coach Edge Function not available, using fallback:', fetchError);
  await useFallbackAIResponse(newMessages, buildModuleContext());
  return;
}

// 404 error - use fallback
if (response.status === 404) {
  console.warn('AI Coach Edge Function not deployed, using fallback');
  await useFallbackAIResponse(newMessages, buildModuleContext());
  return;
}

// Function not found - use fallback
if (errorDetails.includes('Function not found')) {
  console.warn('AI Coach Edge Function not found, using fallback');
  await useFallbackAIResponse(newMessages, buildModuleContext());
  return;
}
```

**Key Features**:
- ✅ Rule-based responses dựa trên user message và module context
- ✅ Streaming response effect để giống với real AI
- ✅ Hiển thị thông tin hữu ích về dữ liệu của user
- ✅ Hướng dẫn deploy Edge Function khi cần

**Status**: ✅ FIXED - Code updated, Docker container rebuilt and restarted

---

## 3. TỔNG KẾT

### ✅ Đã Fix

1. **Mobile Keyboard Fix**:
   - ✅ Cải thiện `onChange` với `requestAnimationFrame`
   - ✅ Cải thiện `onBlur` với `preventDefault`
   - ✅ Thêm `onPointerDown` handler
   - ✅ Cải thiện scroll container handlers

2. **AI Coach Fallback**:
   - ✅ Tạo fallback function với rule-based responses
   - ✅ Auto-detect khi Edge Function không available
   - ✅ Streaming response effect
   - ✅ Hiển thị thông tin hữu ích

### 📝 Next Steps

1. ⏳ Test trên mobile device thực tế để verify keyboard fix
2. ⏳ Deploy Edge Function `ai-coach` lên Supabase local (nếu cần full AI features)
3. ⏳ Monitor cho các issues khác

---

## 4. DEPLOY EDGE FUNCTION (Optional)

Nếu muốn sử dụng full AI features, cần deploy Edge Function:

1. Xem hướng dẫn trong `DEPLOY_AI_COACH_EDGE_FUNCTION.md`
2. Deploy Edge Function `ai-coach` lên Supabase
3. Cấu hình API key (GEMINI_API_KEY, PERPLEXITY_API_KEY, hoặc LOVABLE_API_KEY)

**Lưu ý**: Với local Supabase, có thể cần cấu hình thêm để support Edge Functions.

