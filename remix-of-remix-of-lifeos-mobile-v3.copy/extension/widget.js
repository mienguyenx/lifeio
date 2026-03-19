// LifeOS Widget Logic
(function() {
  'use strict';

  const LIFEOOS_URL = 'https://life.hoanong.com';

  const widget = document.getElementById('lifeos-widget');
  const widgetHeader = document.getElementById('widgetHeader');
  const widgetContent = document.getElementById('widgetContent');
  const widgetMobileView = document.getElementById('widgetMobileView');
  const widgetCompactView = document.getElementById('widgetCompactView');
  const lifeosAppIframe = document.getElementById('lifeos-app-iframe');
  
  const toggleBtn = document.getElementById('toggleBtn');
  const toggleIcon = document.getElementById('toggleIcon');
  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');
  const refreshBtn = document.getElementById('refreshBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const retryBtn = document.getElementById('retryBtn');
  const loginBtn = document.getElementById('loginBtn');
  const openLifeOSBtn = document.getElementById('openLifeOSBtn');
  
  // Pomodoro elements
  const pomodoroTime = document.getElementById('pomodoroTime');
  const pomodoroPhase = document.getElementById('pomodoroPhase');
  const pomodoroPlayPause = document.getElementById('pomodoroPlayPause');
  const pomodoroReset = document.getElementById('pomodoroReset');
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const compactTasksList = document.getElementById('compactTasksList');
  const compactTasksCount = document.getElementById('compactTasksCount');
  
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  let isCollapsed = false;
  let pomodoroInterval = null;
  let pomodoroState = {
    isRunning: false,
    phase: 'work',
    timeRemaining: 25 * 60, // 25 minutes in seconds
    sessionsCompleted: 0,
    workTime: 25, // minutes
    shortBreakTime: 5, // minutes
    longBreakTime: 15, // minutes
    soundEnabled: true,
    soundBeforeEnd: 30, // seconds before end to play sound
  };
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentX = 0;
  let currentY = 0;
  let refreshInterval = null;
  let notificationInterval = null;
  let currentData = null;
  let widgetSettings = {
    showQuickStats: true,
    showTodayHabits: true,
    showTodayTasks: true,
    showActiveGoals: true,
    position: 'bottom-right',
    refreshInterval: 5,
    widgetSize: 'medium',
    darkMode: false,
    enableNotifications: true,
    enableQuickActions: true,
    widgetOpacity: 1.0,
    compactViewMode: 'full', // 'full' or 'pomodoro-only'
  };
  
  // Ensure widget is not collapsed by default (Mobile View - Full App)
  if (widget) {
    widget.classList.remove('collapsed');
    isCollapsed = false;
    if (widgetMobileView) {
      widgetMobileView.style.display = 'flex';
    }
    if (widgetCompactView) {
      widgetCompactView.style.display = 'none';
    }
  }

  // Load settings
  try {
    chrome.storage.local.get(['widgetSettings', 'pomodoroState'], (result) => {
      if (chrome.runtime.lastError) {
        console.warn('Storage error:', chrome.runtime.lastError.message);
        applySettings(); // Use defaults
        return;
      }
      
      if (result.widgetSettings) {
        widgetSettings = { ...widgetSettings, ...result.widgetSettings };
      }
      
      // Load Pomodoro settings
      if (result.pomodoroState) {
        pomodoroState = { ...pomodoroState, ...result.pomodoroState };
        updatePomodoroDisplay();
      }
      
      applySettings();
    });
    
    // Listen for storage changes (sync from other tabs/widgets)
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        if (changes.widgetSettings) {
          widgetSettings = { ...widgetSettings, ...changes.widgetSettings.newValue };
          applySettings();
          console.log('[Widget] Settings synced from storage');
        }
        if (changes.pomodoroState) {
          pomodoroState = { ...pomodoroState, ...changes.pomodoroState.newValue };
          updatePomodoroDisplay();
          console.log('[Widget] Pomodoro state synced from storage');
        }
      }
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    applySettings(); // Use defaults
  }

  // Apply settings
  function applySettings() {
    // Position - Note: position is handled by iframe in content.js
    // Only apply size class when not collapsed (mobile view)
    if (!isCollapsed) {
      widget.className = `lifeos-widget size-${widgetSettings.widgetSize}`;
    } else {
      widget.className = 'lifeos-widget collapsed';
    }
    
    // Dark mode
    if (widgetSettings.darkMode) {
      widget.classList.add('dark');
      themeIcon.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
    } else {
      widget.classList.remove('dark');
      themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z');
    }

    // Refresh interval (only for compact view)
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    if (widgetSettings.refreshInterval > 0 && isCollapsed) {
      refreshInterval = setInterval(loadData, widgetSettings.refreshInterval * 60 * 1000);
    }

    // Notifications
    if (notificationInterval) {
      clearInterval(notificationInterval);
    }
    if (widgetSettings.enableNotifications && isCollapsed) {
      notificationInterval = setInterval(checkNotifications, 60000); // Check every minute
    }

    // Settings form
    const showQuickStatsEl = document.getElementById('showQuickStats');
    const showTodayHabitsEl = document.getElementById('showTodayHabits');
    const showTodayTasksEl = document.getElementById('showTodayTasks');
    const showActiveGoalsEl = document.getElementById('showActiveGoals');
    
    if (showQuickStatsEl) showQuickStatsEl.checked = widgetSettings.showQuickStats;
    if (showTodayHabitsEl) showTodayHabitsEl.checked = widgetSettings.showTodayHabits;
    if (showTodayTasksEl) showTodayTasksEl.checked = widgetSettings.showTodayTasks;
    if (showActiveGoalsEl) showActiveGoalsEl.checked = widgetSettings.showActiveGoals;
    
    const widgetPositionEl = document.getElementById('widgetPosition');
    const refreshIntervalEl = document.getElementById('refreshInterval');
    const widgetSizeEl = document.getElementById('widgetSize');
    const enableNotificationsEl = document.getElementById('enableNotifications');
    const enableQuickActionsEl = document.getElementById('enableQuickActions');
    
    if (widgetPositionEl) widgetPositionEl.value = widgetSettings.position;
    if (refreshIntervalEl) refreshIntervalEl.value = widgetSettings.refreshInterval;
    if (widgetSizeEl) widgetSizeEl.value = widgetSettings.widgetSize;
    if (enableNotificationsEl) enableNotificationsEl.checked = widgetSettings.enableNotifications;
    if (enableQuickActionsEl) enableQuickActionsEl.checked = widgetSettings.enableQuickActions;
    
    const widgetOpacityEl = document.getElementById('widgetOpacity');
    const widgetOpacityValueEl = document.getElementById('widgetOpacityValue');
    if (widgetOpacityEl) {
      widgetOpacityEl.value = widgetSettings.widgetOpacity;
      if (widgetOpacityValueEl) {
        widgetOpacityValueEl.textContent = Math.round(widgetSettings.widgetOpacity * 100) + '%';
      }
    }
    
    const compactViewModeEl = document.getElementById('compactViewMode');
    if (compactViewModeEl) {
      compactViewModeEl.value = widgetSettings.compactViewMode || 'full';
    }
    
    // Apply opacity
    applyOpacity();
    
    // Update compact view if collapsed
    if (isCollapsed) {
      updateCompactView();
    }
  }
  
  // Apply opacity to widget
  function applyOpacity() {
    const opacity = widgetSettings.widgetOpacity || 1.0;
    const isTransparent = opacity < 0.9;
    
    // Apply to widget container
    if (widget) {
      widget.style.opacity = opacity;
      
      // Adjust background based on opacity
      if (isTransparent) {
        // More transparent - use stronger backdrop filter and text shadows
        widget.style.background = `rgba(255, 255, 255, ${Math.max(0.7, opacity)})`;
        widget.style.backdropFilter = 'blur(20px)';
        widget.style.webkitBackdropFilter = 'blur(20px)';
        
        // Add text shadows for better readability
        const style = document.createElement('style');
        style.id = 'lifeos-opacity-styles';
        style.textContent = `
          #lifeos-widget.transparent * {
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 4px rgba(255, 255, 255, 0.8);
          }
          #lifeos-widget.transparent .widget-header {
            background: linear-gradient(135deg, rgba(102, 126, 234, ${Math.max(0.85, opacity)}) 0%, rgba(118, 75, 162, ${Math.max(0.85, opacity)}) 100%);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
          }
          #lifeos-widget.transparent .compact-section {
            background: rgba(249, 250, 251, ${Math.max(0.8, opacity)}) !important;
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
          }
          #lifeos-widget.transparent .quote-text,
          #lifeos-widget.transparent .compact-task-name {
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15), 0 0 6px rgba(255, 255, 255, 0.9);
            font-weight: 600;
          }
        `;
        
        // Remove old style if exists
        const oldStyle = document.getElementById('lifeos-opacity-styles');
        if (oldStyle) oldStyle.remove();
        
        document.head.appendChild(style);
        widget.classList.add('transparent');
      } else {
        // Less transparent - normal styling
        widget.style.background = `rgba(255, 255, 255, ${opacity})`;
        widget.style.backdropFilter = 'blur(10px)';
        widget.style.webkitBackdropFilter = 'blur(10px)';
        
        const oldStyle = document.getElementById('lifeos-opacity-styles');
        if (oldStyle) oldStyle.remove();
        
        widget.classList.remove('transparent');
      }
    }
  }

  // Toggle dark mode
  function toggleDarkMode() {
    widgetSettings.darkMode = !widgetSettings.darkMode;
    chrome.storage.local.set({ widgetSettings }, () => {
      applySettings();
      showToast(widgetSettings.darkMode ? 'Đã bật chế độ tối' : 'Đã tắt chế độ tối', 'success');
    });
  }

  // Toggle collapse
  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    widget.classList.toggle('collapsed', isCollapsed);
    
    // Update icon - khi collapsed thì hiển thị icon expand (mũi tên lên), khi expanded thì hiển thị icon collapse (X)
    if (isCollapsed) {
      // Collapsed -> Show expand icon (mũi tên lên)
      toggleIcon.setAttribute('d', 'M12 5v14m7-7H5');
      toggleBtn.setAttribute('title', 'Phóng to (C)');
      // Show compact view, hide mobile view
      if (widgetCompactView) {
        widgetCompactView.style.display = 'flex';
      }
      if (widgetMobileView) {
        widgetMobileView.style.display = 'none';
      }
      // Load data for compact view
      loadData();
      updateCompactView();
      showToast('Đã chuyển sang chế độ compact', 'info');
    } else {
      // Expanded -> Show collapse icon (X)
      toggleIcon.setAttribute('d', 'M18 6L6 18M6 6l12 12');
      toggleBtn.setAttribute('title', 'Thu gọn (C)');
      showToast('Đã chuyển sang chế độ mobile', 'info');
      // Show mobile view, hide compact view
      if (widgetMobileView) {
        widgetMobileView.style.display = 'flex';
      }
      if (widgetCompactView) {
        widgetCompactView.style.display = 'none';
      }
    }
    
    // Notify parent to resize iframe
    if (window.parent && window.parent !== window) {
      const height = isCollapsed ? 350 : 667;
      window.parent.postMessage({
        action: 'resizeWidget',
        height: height,
        isCompact: isCollapsed
      }, '*');
    }
  }
  
  // Update compact view
  function updateCompactView() {
    if (!isCollapsed) return;
    
    const viewMode = widgetSettings.compactViewMode || 'full';
    
    const compactPomodoro = document.getElementById('compactPomodoro');
    
    if (viewMode === 'pomodoro-only') {
      // Pomodoro-only mode: hide quote and tasks
      const compactQuote = document.getElementById('compactQuote');
      const compactTasks = document.getElementById('compactTasks');
      if (compactQuote) compactQuote.style.display = 'none';
      if (compactTasks) compactTasks.style.display = 'none';
      if (compactPomodoro) compactPomodoro.classList.add('pomodoro-only-mode');
      
      // Update pomodoro
      updatePomodoroDisplay();
    } else {
      // Full mode: show all sections
      const compactQuote = document.getElementById('compactQuote');
      const compactTasks = document.getElementById('compactTasks');
      if (compactQuote) compactQuote.style.display = 'flex';
      if (compactTasks) compactTasks.style.display = 'flex';
      if (compactPomodoro) compactPomodoro.classList.remove('pomodoro-only-mode');
      
      // Update quote
      updateQuote();
      
      // Update pomodoro
      updatePomodoroDisplay();
      
      // Update tasks - show loading if data not available yet
      if (currentData && currentData.tasks) {
        updateCompactTasks(currentData.tasks, false);
      } else {
        // Show loading state while fetching data
        updateCompactTasks(null, true);
        // Try to load data if not available
        loadData();
      }
    }
  }
  
  // Inspirational quotes
  const inspirationalQuotes = [
    { text: "Hôm nay là ngày tốt nhất để bắt đầu!", author: "LifeOS" },
    { text: "Mỗi bước nhỏ đều dẫn đến thành công lớn.", author: "LifeOS" },
    { text: "Bạn mạnh hơn bạn nghĩ. Hãy tin vào chính mình!", author: "LifeOS" },
    { text: "Thành công là tổng của những nỗ lực nhỏ lặp lại mỗi ngày.", author: "LifeOS" },
    { text: "Đừng chờ đợi thời điểm hoàn hảo, hãy bắt đầu ngay bây giờ!", author: "LifeOS" },
    { text: "Mỗi ngày là cơ hội mới để trở thành phiên bản tốt hơn của chính bạn.", author: "LifeOS" },
    { text: "Hãy làm việc chăm chỉ trong im lặng, để thành công lên tiếng.", author: "LifeOS" },
    { text: "Thất bại chỉ là bước đệm để thành công.", author: "LifeOS" },
    { text: "Bạn không thể thay đổi hôm qua, nhưng có thể bắt đầu từ hôm nay.", author: "LifeOS" },
    { text: "Hãy tập trung vào tiến trình, kết quả sẽ tự đến.", author: "LifeOS" }
  ];

  // Update inspirational quote
  function updateQuote() {
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    
    if (quoteText && quoteAuthor) {
      const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
      quoteText.textContent = `"${randomQuote.text}"`;
      quoteAuthor.textContent = `- ${randomQuote.author}`;
    }
  }

  // Update pomodoro display (24h format)
  function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroState.timeRemaining / 60);
    const seconds = pomodoroState.timeRemaining % 60;
    if (pomodoroTime) {
      // Format 24h: MM:SS
      pomodoroTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update play/pause button (compact version)
    if (pomodoroPlayPause) {
      if (pomodoroState.isRunning) {
        pomodoroPlayPause.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        `;
        pomodoroPlayPause.classList.add('paused');
      } else {
        pomodoroPlayPause.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        `;
        pomodoroPlayPause.classList.remove('paused');
      }
    }
  }
  
  // Pomodoro controls
  function togglePomodoro() {
    pomodoroState.isRunning = !pomodoroState.isRunning;
    updatePomodoroDisplay();
    
    if (pomodoroState.isRunning) {
      startPomodoroTimer();
    } else {
      stopPomodoroTimer();
    }
  }
  
  function resetPomodoro() {
    pomodoroState.isRunning = false;
    pomodoroState.timeRemaining = pomodoroState.phase === 'work' 
      ? pomodoroState.workTime * 60 
      : pomodoroState.shortBreakTime * 60;
    stopPomodoroTimer();
    updatePomodoroDisplay();
    savePomodoroState();
  }
  
  // Play Pomodoro sound
  function playPomodoroSound(type = 'end') {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'end') {
        // End sound: 3 beeps
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Second beep
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 800;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          osc2.start();
          osc2.stop(audioContext.currentTime + 0.3);
        }, 300);
        
        // Third beep
        setTimeout(() => {
          const osc3 = audioContext.createOscillator();
          const gain3 = audioContext.createGain();
          osc3.connect(gain3);
          gain3.connect(audioContext.destination);
          osc3.frequency.value = 800;
          osc3.type = 'sine';
          gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          osc3.start();
          osc3.stop(audioContext.currentTime + 0.3);
        }, 600);
      } else if (type === 'warning') {
        // Warning sound: single beep
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }
  
  function startPomodoroTimer() {
    if (pomodoroInterval) return;
    
    pomodoroInterval = setInterval(() => {
      if (pomodoroState.timeRemaining <= 1) {
        // Timer finished
        pomodoroState.isRunning = false;
        stopPomodoroTimer();
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Pomodoro', {
            body: pomodoroState.phase === 'work' ? 'Nghỉ ngơi thôi! 🎉' : 'Quay lại làm việc! 💪',
            icon: '/favicon.ico',
          });
        }
        
        // Play sound
        if (pomodoroState.soundEnabled) {
          playPomodoroSound('end');
        }
        
        // Auto switch phase
        if (pomodoroState.phase === 'work') {
          pomodoroState.phase = 'break';
          // Use long break every 4 sessions
          if (pomodoroState.sessionsCompleted > 0 && pomodoroState.sessionsCompleted % 4 === 0) {
            pomodoroState.timeRemaining = pomodoroState.longBreakTime * 60;
          } else {
            pomodoroState.timeRemaining = pomodoroState.shortBreakTime * 60;
          }
          pomodoroState.sessionsCompleted++;
        } else {
          pomodoroState.phase = 'work';
          pomodoroState.timeRemaining = pomodoroState.workTime * 60;
        }
        
        updatePomodoroDisplay();
        savePomodoroState();
      } else {
        pomodoroState.timeRemaining--;
        
        // Play sound before end
        if (pomodoroState.soundEnabled && pomodoroState.timeRemaining === pomodoroState.soundBeforeEnd) {
          playPomodoroSound('warning');
        }
        
        updatePomodoroDisplay();
      }
    }, 1000);
  }
  
  function stopPomodoroTimer() {
    if (pomodoroInterval) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
    }
  }
  
  // Update compact tasks
  function updateCompactTasks(tasks, isLoading = false) {
    if (!compactTasksList) {
      console.warn('[Widget] compactTasksList not found');
      return;
    }
    
    // Show loading state
    if (isLoading) {
      compactTasksList.innerHTML = '<div class="compact-empty">Đang tải...</div>';
      if (compactTasksCount) compactTasksCount.textContent = '...';
      return;
    }
    
    compactTasksList.innerHTML = '';
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      compactTasksList.innerHTML = '<div class="compact-empty">Chưa có công việc hôm nay</div>';
      if (compactTasksCount) compactTasksCount.textContent = '0';
      return;
    }
    
    // Use timezone-aware date utility
    const todayStr = typeof getTodayDateString !== 'undefined' ? getTodayDateString() : new Date().toISOString().split('T')[0];
    const today = typeof parseDateInTimezone !== 'undefined' ? parseDateInTimezone(todayStr) : new Date();
    if (today) today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(t => {
      // Skip deleted or completed tasks
      if (t.deleted_at || t.status === 'done' || t.completed_at) return false;
      
      // If no due_date, include it (tasks without due date)
      if (!t.due_date) return true;
      
      // Check if due_date is today or past using timezone-aware comparison
      try {
        if (typeof isToday !== 'undefined' && typeof isBeforeToday !== 'undefined') {
          // Use timezone-aware utilities
          return isToday(t.due_date) || isBeforeToday(t.due_date);
        } else {
          // Fallback to old method
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate <= today;
        }
      } catch (e) {
        console.warn('[Widget] Invalid due_date:', t.due_date);
        return true; // Include if date parsing fails
      }
    }).slice(0, 5); // Limit to 5 tasks
    
    if (compactTasksCount) {
      compactTasksCount.textContent = todayTasks.length;
    }
    
    if (todayTasks.length === 0) {
      compactTasksList.innerHTML = '<div class="compact-empty">Chưa có công việc hôm nay</div>';
      return;
    }
    
    todayTasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = 'compact-task-item';
      taskItem.setAttribute('data-task-id', task.id);
      
      const isCompleted = task.status === 'done' || task.completed_at;
      taskItem.innerHTML = `
        <div class="compact-task-checkbox ${isCompleted ? 'checked' : ''}"></div>
        <div class="compact-task-name ${isCompleted ? 'completed' : ''}">${task.title || 'Unnamed Task'}</div>
      `;
      
      // Add click handler
      if (widgetSettings.enableQuickActions) {
        const checkbox = taskItem.querySelector('.compact-task-checkbox');
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          completeTask(task.id);
        });
        
        taskItem.addEventListener('click', () => {
          completeTask(task.id);
        });
      }
      
      compactTasksList.appendChild(taskItem);
    });
  }
  
  // Notify parent of initial size (mobile view)
  setTimeout(() => {
    if (window.parent && window.parent !== window) {
      const height = isCollapsed ? 350 : 667;
      window.parent.postMessage({
        action: 'resizeWidget',
        height: height,
        isCompact: isCollapsed
      }, '*');
    }
  }, 1000);

  // Drag functionality - Send message to parent to move iframe
  function startDrag(e) {
    // Prevent drag if clicking on buttons
    if (e.target.closest('button') || e.target.closest('.widget-btn')) {
      return;
    }
    
    isDragging = true;
    widgetHeader.style.cursor = 'grabbing';
    
    // Add visual feedback during drag
    if (widget) {
      widget.style.transition = 'none'; // Disable transition during drag for smooth movement
      widget.style.opacity = '0.9'; // Slightly transparent while dragging
    }
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStartX = clientX;
    dragStartY = clientY;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('touchend', stopDrag);
    
    e.preventDefault();
    e.stopPropagation();
  }

  function onDrag(e) {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartX;
    const deltaY = clientY - dragStartY;
    
    // Send message to parent to move iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        action: 'moveWidget',
        deltaX: deltaX,
        deltaY: deltaY
      }, '*');
    }
    
    dragStartX = clientX;
    dragStartY = clientY;
    
    e.preventDefault();
    e.stopPropagation();
  }

  function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    widgetHeader.style.cursor = 'move';
    
    // Reset drag start positions
    dragStartX = 0;
    dragStartY = 0;
    
    // Remove all event listeners
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
    
    // Restore visual feedback
    if (widget) {
      widget.style.transition = ''; // Restore default transition
      // Restore opacity from settings
      applyOpacity();
    }
  }

  // Load data for compact view only
  async function loadData() {
    // Only load data if in compact view
    if (!isCollapsed) return;

    try {
      // Show loading state
      updateCompactTasks(null, true);
      
      const data = await lifeOSAPI.getAllData();
      
      if (!data) {
        // Not logged in - but still show compact view
        console.warn('No data loaded - user may not be logged in');
        updateCompactTasks([], false);
        return;
      }

      // Update UI for compact view
      currentData = data;
      
      // Ensure tasks are available
      if (data.tasks && Array.isArray(data.tasks)) {
        updateCompactTasks(data.tasks, false);
      } else {
        console.warn('Tasks not available in data:', data);
        updateCompactTasks([], false);
      }
      
      // Update pomodoro
      updatePomodoroDisplay();
      
      // Check notifications after loading
      if (widgetSettings.enableNotifications) {
        setTimeout(() => checkNotifications(), 1000);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Show error state but don't break UI
      updateCompactTasks([], false);
    }
  }

  // Update widget UI - Only for compact view
  function updateWidget(data) {
    // This function is now only used for compact view
    // Mobile view shows full app in iframe, no need to update
    if (isCollapsed) {
      updateCompactView();
    }
  }

  // Open LifeOS
  function openLifeOS() {
    try {
      chrome.tabs.create({ url: LIFEOOS_URL }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error opening LifeOS:', chrome.runtime.lastError.message);
          // Fallback: open in same window
          window.open(LIFEOOS_URL, '_blank');
        }
      });
    } catch (error) {
      console.error('Error opening LifeOS:', error);
      window.open(LIFEOOS_URL, '_blank');
    }
  }

  // Open settings
  function openSettings() {
    if (settingsModal) {
      settingsModal.style.display = 'flex';
      
      // Set current values
      const widgetPositionEl = document.getElementById('widgetPosition');
      const refreshIntervalEl = document.getElementById('refreshInterval');
      const widgetSizeEl = document.getElementById('widgetSize');
      const widgetOpacityEl = document.getElementById('widgetOpacity');
      const widgetOpacityValueEl = document.getElementById('widgetOpacityValue');
      const enableNotificationsEl = document.getElementById('enableNotifications');
      const enableQuickActionsEl = document.getElementById('enableQuickActions');
      
      if (widgetPositionEl) widgetPositionEl.value = widgetSettings.position || 'bottom-right';
      if (refreshIntervalEl) refreshIntervalEl.value = widgetSettings.refreshInterval || 5;
      if (widgetSizeEl) widgetSizeEl.value = widgetSettings.size || 'medium';
      if (widgetOpacityEl) {
        widgetOpacityEl.value = widgetSettings.widgetOpacity || 1.0;
        if (widgetOpacityValueEl) {
          widgetOpacityValueEl.textContent = Math.round((widgetSettings.widgetOpacity || 1.0) * 100) + '%';
        }
      }
      if (enableNotificationsEl) enableNotificationsEl.checked = widgetSettings.enableNotifications !== false;
      if (enableQuickActionsEl) enableQuickActionsEl.checked = widgetSettings.enableQuickActions !== false;
      
      // Pomodoro settings
      const pomodoroWorkTimeEl = document.getElementById('pomodoroWorkTime');
      const pomodoroShortBreakEl = document.getElementById('pomodoroShortBreak');
      const pomodoroLongBreakEl = document.getElementById('pomodoroLongBreak');
      const pomodoroSoundEnabledEl = document.getElementById('pomodoroSoundEnabled');
      const pomodoroSoundBeforeEndEl = document.getElementById('pomodoroSoundBeforeEnd');
      
      if (pomodoroWorkTimeEl) pomodoroWorkTimeEl.value = pomodoroState.workTime || 25;
      if (pomodoroShortBreakEl) pomodoroShortBreakEl.value = pomodoroState.shortBreakTime || 5;
      if (pomodoroLongBreakEl) pomodoroLongBreakEl.value = pomodoroState.longBreakTime || 15;
      if (pomodoroSoundEnabledEl) pomodoroSoundEnabledEl.checked = pomodoroState.soundEnabled !== false;
      if (pomodoroSoundBeforeEndEl) pomodoroSoundBeforeEndEl.value = pomodoroState.soundBeforeEnd || 30;
    }
  }

  // Close settings
  function closeSettings() {
    settingsModal.style.display = 'none';
  }

  // Save settings
  function saveSettings() {
    widgetSettings.position = document.getElementById('widgetPosition').value;
    widgetSettings.refreshInterval = parseInt(document.getElementById('refreshInterval').value) || 5;
    widgetSettings.size = document.getElementById('widgetSize').value;
    widgetSettings.widgetOpacity = parseFloat(document.getElementById('widgetOpacity').value) || 1.0;
    widgetSettings.enableNotifications = document.getElementById('enableNotifications').checked;
    widgetSettings.enableQuickActions = document.getElementById('enableQuickActions').checked;
    widgetSettings.compactViewMode = document.getElementById('compactViewMode').value || 'full';
    
    // Pomodoro settings
    pomodoroState.workTime = parseInt(document.getElementById('pomodoroWorkTime').value) || 25;
    pomodoroState.shortBreakTime = parseInt(document.getElementById('pomodoroShortBreak').value) || 5;
    pomodoroState.longBreakTime = parseInt(document.getElementById('pomodoroLongBreak').value) || 15;
    pomodoroState.soundEnabled = document.getElementById('pomodoroSoundEnabled').checked;
    pomodoroState.soundBeforeEnd = parseInt(document.getElementById('pomodoroSoundBeforeEnd').value) || 30;
    
    // Reset timer if running with new times
    if (pomodoroState.isRunning) {
      const wasRunning = pomodoroState.isRunning;
      stopPomodoroTimer();
      pomodoroState.timeRemaining = pomodoroState.phase === 'work' 
        ? pomodoroState.workTime * 60 
        : pomodoroState.shortBreakTime * 60;
      if (wasRunning) {
        startPomodoroTimer();
      }
    } else {
      pomodoroState.timeRemaining = pomodoroState.phase === 'work' 
        ? pomodoroState.workTime * 60 
        : pomodoroState.shortBreakTime * 60;
    }
    updatePomodoroDisplay();
    savePomodoroState();

    chrome.storage.local.set({ widgetSettings, pomodoroState }, () => {
      applySettings();
      updateCompactView(); // Update view mode if collapsed
      closeSettings();
      showToast('Đã lưu cài đặt', 'success');
    });
  }

  // Quick Actions
  async function toggleHabitComplete(habitId, isComplete) {
    try {
      if (isComplete) {
        // Complete habit - use timezone-aware date
        const today = typeof getTodayDateString !== 'undefined' ? getTodayDateString() : new Date().toISOString().split('T')[0];
        await lifeOSAPI.completeHabit(habitId, today);
        showToast('Đã hoàn thành thói quen!', 'success');
      } else {
        // Uncomplete habit
        await lifeOSAPI.uncompleteHabit(habitId);
        showToast('Đã hủy hoàn thành', 'info');
      }
      // Reload data
      setTimeout(() => loadData(), 500);
    } catch (error) {
      console.error('Error toggling habit:', error);
      showToast('Lỗi khi cập nhật thói quen', 'error');
    }
  }

  async function completeTask(taskId) {
    try {
      await lifeOSAPI.completeTask(taskId);
      showToast('Đã hoàn thành công việc!', 'success');
      setTimeout(() => loadData(), 500);
    } catch (error) {
      console.error('Error completing task:', error);
      showToast('Lỗi khi hoàn thành công việc', 'error');
    }
  }

  // Notifications - handled by notifications.js module
  function checkNotifications() {
    // Use NotificationManager if available
    if (typeof NotificationManager !== 'undefined' && NotificationManager.checkNotifications) {
      const newNotifications = NotificationManager.checkNotifications(currentData, widgetSettings);
      
      // Show toast for new notifications
      if (newNotifications && newNotifications.length > 0) {
        newNotifications.forEach(notif => {
          showToast(notif.message, notif.urgent ? 'error' : 'info');
        });
      }
    } else {
      // Fallback to old method with timezone-aware dates
      if (!currentData || !widgetSettings.enableNotifications) return;

      const notifications = [];
      
      // Use timezone-aware date utilities if available
      const isTodayCheck = typeof isToday !== 'undefined' ? isToday : null;
      const isBeforeTodayCheck = typeof isBeforeToday !== 'undefined' ? isBeforeToday : null;

      // Check tasks due today or overdue
      currentData.tasks.forEach(task => {
        if (task.status === 'done' || task.deleted_at) return;
        if (task.due_date) {
          let isDueToday = false;
          let isOverdue = false;
          
          if (isTodayCheck && isBeforeTodayCheck) {
            isDueToday = isTodayCheck(task.due_date);
            isOverdue = isBeforeTodayCheck(task.due_date);
          } else {
            // Fallback
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            isDueToday = dueDate.getTime() === today.getTime();
            isOverdue = dueDate < today;
          }
          
          if (isDueToday) {
            notifications.push({
              type: 'task',
              message: `Công việc "${task.title}" đến hạn hôm nay`,
              urgent: task.priority === 'high'
            });
          } else if (isOverdue) {
            notifications.push({
              type: 'task',
              message: `Công việc "${task.title}" đã quá hạn`,
              urgent: true
            });
          }
        }
      });

      // Show notifications
      if (notifications.length > 0) {
        notifications.forEach(notif => {
          showToast(notif.message, notif.urgent ? 'error' : 'info');
        });
      }
    }
  }

  // Toast notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `widget-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Only when widget is focused or visible
    if (isCollapsed) return;
    
    // Don't trigger in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key.toLowerCase()) {
      case 'r':
        if (e.ctrlKey || e.metaKey) return; // Don't override browser refresh
        e.preventDefault();
        loadData();
        showToast('Đang làm mới...', 'info');
        break;
      case 's':
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        openSettings();
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        toggleCollapse();
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        toggleDarkMode();
        break;
      case 'escape':
        if (settingsModal.style.display === 'flex') {
          closeSettings();
        }
        break;
    }
  });

  // Load pomodoro state from storage
  try {
    chrome.storage.local.get(['pomodoroState'], (result) => {
      if (chrome.runtime.lastError) {
        console.warn('Storage error:', chrome.runtime.lastError.message);
        return;
      }
      
      if (result.pomodoroState) {
        pomodoroState = { ...pomodoroState, ...result.pomodoroState };
        updatePomodoroDisplay();
        
        // Resume timer if it was running
        if (pomodoroState.isRunning) {
          startPomodoroTimer();
        }
      }
    });
  } catch (error) {
    console.error('Error loading pomodoro state:', error);
  }
  
  // Save pomodoro state
  function savePomodoroState() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ pomodoroState }, () => {
          if (chrome.runtime.lastError) {
            console.warn('Storage error:', chrome.runtime.lastError.message);
          }
        });
      }
    } catch (error) {
      console.error('Error saving pomodoro state:', error);
    }
  }
  
  // Event listeners
  toggleBtn.addEventListener('click', toggleCollapse);
  themeBtn.addEventListener('click', toggleDarkMode);
  refreshBtn.addEventListener('click', () => {
    if (isCollapsed) {
      showToast('Đang làm mới dữ liệu...', 'info');
      loadData();
      setTimeout(() => {
        showToast('Đã làm mới thành công', 'success');
      }, 1000);
    } else {
      // Reload iframe
      if (lifeosAppIframe) {
        showToast('Đang tải lại ứng dụng...', 'info');
        lifeosAppIframe.src = lifeosAppIframe.src;
        setTimeout(() => {
          showToast('Đã tải lại thành công', 'success');
        }, 2000);
      }
    }
  });
  settingsBtn.addEventListener('click', () => {
    openSettings();
    showToast('Đã mở cài đặt', 'info');
  });
  
  // Remove retryBtn and loginBtn listeners as they don't exist in new HTML
  // retryBtn and loginBtn are removed from HTML
  
  openLifeOSBtn.addEventListener('click', openLifeOS);
  closeSettingsBtn.addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Pomodoro controls
  if (pomodoroPlayPause) {
    pomodoroPlayPause.addEventListener('click', () => {
      const wasRunning = pomodoroState.isRunning;
      togglePomodoro();
      savePomodoroState();
      if (wasRunning) {
        showToast('Đã tạm dừng Pomodoro', 'info');
      } else {
        showToast('Đã bắt đầu Pomodoro', 'success');
      }
    });
  }
  
  if (pomodoroReset) {
    pomodoroReset.addEventListener('click', () => {
      resetPomodoro();
      savePomodoroState();
      showToast('Đã reset Pomodoro', 'info');
    });
  }
  
  // Close widget button
  if (closeWidgetBtn) {
    closeWidgetBtn.addEventListener('click', () => {
      showToast('Đang ẩn widget cho trang này...', 'info');
      // Send message to parent to hide widget
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          action: 'hideWidget',
        }, '*');
        setTimeout(() => {
          showToast('Widget đã được ẩn. Làm mới trang để hiển thị lại.', 'success');
        }, 500);
      }
    });
  }
  
  // Request notification permission for pomodoro
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Opacity slider handler
  const widgetOpacityEl = document.getElementById('widgetOpacity');
  const widgetOpacityValueEl = document.getElementById('widgetOpacityValue');
  if (widgetOpacityEl && widgetOpacityValueEl) {
    widgetOpacityEl.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      widgetOpacityValueEl.textContent = Math.round(value * 100) + '%';
      widgetSettings.widgetOpacity = value;
      applyOpacity();
    });
  }

  // Drag
  widgetHeader.addEventListener('mousedown', startDrag);
  widgetHeader.addEventListener('touchstart', startDrag);

  // Close modal on outside click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings();
    }
  });

  // Listen for session updates from parent
  window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'session') {
      // Session updated, reload data if in compact view
      if (isCollapsed) {
        setTimeout(() => loadData(), 500);
      }
    }
  });

  // Initial load
  applySettings();
  updatePomodoroDisplay();
  updateQuote();
  
  // Load data only if collapsed (compact view)
  if (isCollapsed) {
    loadData();
  }
  
  // Update quote every 30 seconds
  setInterval(() => {
    if (isCollapsed) {
      updateQuote();
    }
  }, 30000);
  
  // Handle iframe load
  if (lifeosAppIframe) {
    lifeosAppIframe.addEventListener('load', () => {
      console.log('LifeOS app loaded in widget');
    });
    
    lifeosAppIframe.addEventListener('error', () => {
      console.error('Error loading LifeOS app');
    });
  }
  
  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    stopPomodoroTimer();
    savePomodoroState();
  });
})();

