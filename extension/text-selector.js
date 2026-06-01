// LifeOS Text Selector
// Cho phép tạo note và dịch khi bôi đen văn bản

(function () {
  'use strict';

  let selectedText = '';
  let selectionRange = null;
  let selectorPopup = null;
  let translationPopup = null;
  let notePopup = null;

  // Base URL of the LifeOS REST API (…/api/v1). Resolved from config.js
  // (injected before this script), with a safe local-dev fallback.
  function getApiBase() {
    const cfg = (typeof self !== 'undefined' && self.LIFEOS_CONFIG) || null;
    return (cfg && cfg.apiUrl) || 'http://localhost:4000/api/v1';
  }

  // Khởi tạo
  function init() {
    createPopups();
    setupTextSelection();
  }

  // Tạo popups
  function createPopups() {
    // Text selector popup
    selectorPopup = document.createElement('div');
    selectorPopup.id = 'lifeos-text-selector';
    selectorPopup.innerHTML = `
      <button class="lifeos-selector-btn create-note" id="lifeos-create-note-btn" title="Tạo note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>Tạo Note</span>
      </button>
      <button class="lifeos-selector-btn translate" id="lifeos-translate-btn" title="Dịch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Dịch</span>
      </button>
    `;
    document.body.appendChild(selectorPopup);

    // Translation popup
    translationPopup = document.createElement('div');
    translationPopup.id = 'lifeos-translation-popup';
    translationPopup.innerHTML = `
      <div class="lifeos-translation-header">
        <div class="lifeos-translation-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>Dịch văn bản</span>
        </div>
        <button class="lifeos-translation-close" id="lifeos-translation-close">×</button>
      </div>
      <div class="lifeos-translation-original" id="lifeos-translation-original"></div>
      <div class="lifeos-translation-result" id="lifeos-translation-result"></div>
    `;
    document.body.appendChild(translationPopup);

    // Note popup
    notePopup = document.createElement('div');
    notePopup.id = 'lifeos-note-popup';
    notePopup.innerHTML = `
      <div class="lifeos-note-header">
        <div class="lifeos-note-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Tạo Note</span>
        </div>
        <button class="lifeos-note-close" id="lifeos-note-close">×</button>
      </div>
      <textarea class="lifeos-note-input" id="lifeos-note-content" placeholder="Nhập nội dung note..."></textarea>
      <div class="lifeos-note-actions">
        <button class="lifeos-note-btn cancel" id="lifeos-note-cancel">Hủy</button>
        <button class="lifeos-note-btn create" id="lifeos-note-create">Tạo Note</button>
      </div>
    `;
    document.body.appendChild(notePopup);

    // Event listeners
    document.getElementById('lifeos-create-note-btn').addEventListener('click', handleCreateNote);
    document.getElementById('lifeos-translate-btn').addEventListener('click', handleTranslate);
    document.getElementById('lifeos-translation-close').addEventListener('click', () => hideTranslationPopup());
    document.getElementById('lifeos-note-close').addEventListener('click', () => hideNotePopup());
    document.getElementById('lifeos-note-cancel').addEventListener('click', () => hideNotePopup());
    document.getElementById('lifeos-note-create').addEventListener('click', handleNoteCreate);
  }

  // Setup text selection - Ẩn popup tự động, chỉ dùng context menu
  function setupTextSelection() {
    // Không cần popup tự động nữa, chỉ dùng context menu
    // document.addEventListener('mouseup', handleTextSelection);
    // document.addEventListener('touchend', handleTextSelection);
    document.addEventListener('click', handleClickOutside);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'createNote') {
      selectedText = message.selectedText || '';
      handleCreateNote();
      sendResponse({ success: true });
    } else if (message.action === 'translate') {
      selectedText = message.selectedText || '';
      handleTranslate();
      sendResponse({ success: true });
    }
    return true; // Keep channel open for async response
  });

  // Listen for window.postMessage from content.js
  window.addEventListener('message', (event) => {
    // Accept messages from same window (content script)
    // Note: event.source === window means message from same window
    console.log('[TextSelector] Received message:', event.data);

    if (event.data && event.data.action === 'showNotePopup') {
      selectedText = event.data.selectedText || window.getSelection().toString().trim();
      console.log('[TextSelector] showNotePopup, selectedText:', selectedText);
      if (selectedText) {
        handleCreateNote();
      } else {
        console.warn('[TextSelector] No text to create note');
      }
    } else if (event.data && event.data.action === 'showTranslationPopup') {
      selectedText = event.data.selectedText || window.getSelection().toString().trim();
      console.log('[TextSelector] showTranslationPopup, selectedText:', selectedText);
      if (selectedText) {
        handleTranslate();
      } else {
        console.warn('[TextSelector] No text to translate');
      }
    }
  });

  // Handle text selection
  function handleTextSelection(e) {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Kiểm tra xem có click vào popup không
    if (e.target.closest('#lifeos-text-selector') ||
      e.target.closest('#lifeos-translation-popup') ||
      e.target.closest('#lifeos-note-popup')) {
      return;
    }

    if (text && text.length > 0) {
      selectedText = text;
      selectionRange = selection.getRangeAt(0);
      showSelectorPopup(e);
    } else {
      hideSelectorPopup();
    }
  }

  // Show selector popup
  function showSelectorPopup(e) {
    if (!selectorPopup) return;

    const range = selectionRange;
    const rect = range.getBoundingClientRect();

    // Position popup above selection
    const popupTop = rect.top + window.scrollY - 50;
    const popupLeft = rect.left + window.scrollX + (rect.width / 2) - 100;

    selectorPopup.style.top = `${popupTop}px`;
    selectorPopup.style.left = `${popupLeft}px`;
    selectorPopup.classList.add('show');
  }

  // Hide selector popup
  function hideSelectorPopup() {
    if (selectorPopup) {
      selectorPopup.classList.remove('show');
    }
  }

  // Handle click outside
  function handleClickOutside(e) {
    if (!e.target.closest('#lifeos-text-selector') &&
      !e.target.closest('#lifeos-translation-popup') &&
      !e.target.closest('#lifeos-note-popup')) {
      hideSelectorPopup();
      hideTranslationPopup();
      hideNotePopup();
    }
  }

  // Handle create note
  function handleCreateNote() {
    if (!selectedText) {
      selectedText = window.getSelection().toString().trim();
    }

    if (!selectedText) {
      return;
    }

    hideSelectorPopup();

    // Set selected text as default content
    const noteContent = document.getElementById('lifeos-note-content');
    if (noteContent) {
      noteContent.value = selectedText;
      noteContent.focus();
      noteContent.setSelectionRange(0, noteContent.value.length);
    }

    // Show note popup - center if no selection range
    if (selectionRange) {
      const rect = selectionRange.getBoundingClientRect();
      const popupTop = rect.top + window.scrollY + 30;
      const popupLeft = rect.left + window.scrollX;
      notePopup.style.top = `${popupTop}px`;
      notePopup.style.left = `${popupLeft}px`;
      notePopup.style.transform = 'none';
    } else {
      // Center of screen
      notePopup.style.top = '50%';
      notePopup.style.left = '50%';
      notePopup.style.transform = 'translate(-50%, -50%)';
    }

    notePopup.classList.add('show');
  }

  // Handle translate
  async function handleTranslate() {
    if (!selectedText) {
      selectedText = window.getSelection().toString().trim();
    }

    if (!selectedText) {
      return;
    }

    hideSelectorPopup();

    // Show translation popup - center if no selection range
    if (selectionRange) {
      const rect = selectionRange.getBoundingClientRect();
      const popupTop = rect.top + window.scrollY + 30;
      const popupLeft = rect.left + window.scrollX;
      translationPopup.style.top = `${popupTop}px`;
      translationPopup.style.left = `${popupLeft}px`;
      translationPopup.style.transform = 'none';
    } else {
      // Center of screen
      translationPopup.style.top = '50%';
      translationPopup.style.left = '50%';
      translationPopup.style.transform = 'translate(-50%, -50%)';
    }

    translationPopup.classList.add('show');

    // Show original text
    document.getElementById('lifeos-translation-original').textContent = selectedText;
    document.getElementById('lifeos-translation-result').innerHTML = '<div class="lifeos-translation-loading">Đang dịch...</div>';

    // Translate
    try {
      const translated = await translateText(selectedText);

      // Check if translation failed (starts with error marker)
      if (translated && translated.startsWith('[Không thể dịch]')) {
        document.getElementById('lifeos-translation-result').innerHTML =
          '<div class="lifeos-translation-error">Không thể dịch văn bản. Vui lòng kiểm tra kết nối mạng và thử lại.</div>';
      } else {
        document.getElementById('lifeos-translation-result').textContent = translated;
      }
    } catch (error) {
      console.error('Translation error:', error);
      const errorMessage = error.message || 'Không thể dịch văn bản';
      document.getElementById('lifeos-translation-result').innerHTML =
        `<div class="lifeos-translation-error">${errorMessage}. Vui lòng thử lại.</div>`;
    }
  }

  // Translate text using LifeOS AI service (Gemini/Perplexity with API key rotation)
  async function translateText(text, retries = 2) {
    const sourceLang = 'auto';
    const targetLang = 'vi'; // Dịch sang tiếng Việt

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Văn bản cần dịch không hợp lệ');
    }

    // Helper function to create timeout promise
    const fetchWithTimeout = (url, options, timeout = 10000) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
    };

    // Try LifeOS AI translate endpoint first with retry (requires auth)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const session = await getSession();
        if (!session || !session.access_token) {
          throw new Error('Not authenticated');
        }

        const response = await fetchWithTimeout(
          `${getApiBase()}/functions/ai-translate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              type: 'translate',
              content: text,
              sourceLanguage: sourceLang === 'auto' ? 'auto-detect' : sourceLang,
              targetLanguage: 'Vietnamese',
            }),
          },
          10000 // 10 second timeout
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Translation API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data && typeof data.result === 'string' && data.result.trim()) {
          return data.result;
        }

        throw new Error('Invalid translation response format');
      } catch (error) {
        console.warn(`Translation attempt ${attempt + 1} failed:`, error.message);

        // If this was the last attempt, try fallback
        if (attempt === retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }

    // Fallback: Use Google Translate directly
    try {
      console.log('Using Google Translate fallback...');
      const fallbackResponse = await fetchWithTimeout(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        },
        8000 // 8 second timeout for fallback
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && Array.isArray(fallbackData[0])) {
          const translatedParts = fallbackData[0]
            .filter(item => item && item[0])
            .map(item => item[0]);

          if (translatedParts.length > 0) {
            return translatedParts.join('');
          }
        }
      }

      throw new Error('Google Translate fallback failed');
    } catch (fallbackError) {
      console.error('Fallback translation error:', fallbackError);

      // Final fallback: Return helpful error message
      return `[Không thể dịch] ${text}`;
    }
  }

  // Handle note create
  async function handleNoteCreate() {
    const noteContent = document.getElementById('lifeos-note-content');
    const content = noteContent.value.trim();

    if (!content) {
      alert('Vui lòng nhập nội dung note');
      return;
    }

    const createBtn = document.getElementById('lifeos-note-create');
    createBtn.disabled = true;
    createBtn.textContent = 'Đang tạo...';

    try {
      // Get session
      const session = await getSession();
      if (!session || !session.user) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập vào LifeOS.');
      }

      // Create note via Supabase
      const note = await createNote({
        title: content.substring(0, 100),
        content: content
      });

      // Show success
      notePopup.innerHTML = `
        <div class="lifeos-note-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Đã tạo note thành công!</span>
        </div>
      `;

      setTimeout(() => {
        hideNotePopup();
        // Reset popup
        notePopup.innerHTML = `
          <div class="lifeos-note-header">
            <div class="lifeos-note-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Tạo Note</span>
            </div>
            <button class="lifeos-note-close" id="lifeos-note-close">×</button>
          </div>
          <textarea class="lifeos-note-input" id="lifeos-note-content" placeholder="Nhập nội dung note..."></textarea>
          <div class="lifeos-note-actions">
            <button class="lifeos-note-btn cancel" id="lifeos-note-cancel">Hủy</button>
            <button class="lifeos-note-btn create" id="lifeos-note-create">Tạo Note</button>
          </div>
        `;
        setupNotePopupListeners();
      }, 2000);
    } catch (error) {
      console.error('Create note error:', error);
      notePopup.innerHTML = `
        <div class="lifeos-note-error">
          ${error.message || 'Không thể tạo note. Vui lòng thử lại.'}
        </div>
        <div class="lifeos-note-actions">
          <button class="lifeos-note-btn cancel" id="lifeos-note-close">Đóng</button>
        </div>
      `;
      document.getElementById('lifeos-note-close').addEventListener('click', () => hideNotePopup());
    }
  }

  // Setup note popup listeners
  function setupNotePopupListeners() {
    const closeBtn = document.getElementById('lifeos-note-close');
    const cancelBtn = document.getElementById('lifeos-note-cancel');
    const createBtn = document.getElementById('lifeos-note-create');

    if (closeBtn) {
      closeBtn.removeEventListener('click', hideNotePopup);
      closeBtn.addEventListener('click', () => hideNotePopup());
    }
    if (cancelBtn) {
      cancelBtn.removeEventListener('click', hideNotePopup);
      cancelBtn.addEventListener('click', () => hideNotePopup());
    }
    if (createBtn) {
      createBtn.removeEventListener('click', handleNoteCreate);
      createBtn.addEventListener('click', handleNoteCreate);
    }
  }

  // Hide translation popup
  function hideTranslationPopup() {
    if (translationPopup) {
      translationPopup.classList.remove('show');
    }
  }

  // Hide note popup
  function hideNotePopup() {
    if (notePopup) {
      notePopup.classList.remove('show');
    }
  }

  // Get session from multiple sources
  async function getSession() {
    return new Promise((resolve) => {
      try {
        // 1. Try chrome.storage first (shared between tabs)
        chrome.storage.local.get(['lifeOSSession'], (result) => {
          if (result.lifeOSSession && result.lifeOSSession.access_token) {
            console.log('Session found in chrome.storage');
            resolve(result.lifeOSSession);
            return;
          }

          // 2. Try localStorage
          const sessionKeys = [
            'lifeos.session',
            'sb-supabase-auth-token',
            'sb-pxgdmyszzwamwygvifvj-auth-token',
            'external-supabase-auth-token'
          ];

          for (const key of sessionKeys) {
            const session = localStorage.getItem(key);
            if (session) {
              try {
                const parsed = JSON.parse(session);
                if (parsed && parsed.user && parsed.access_token) {
                  console.log('Session found in localStorage:', key);
                  // Save to chrome.storage for sharing
                  chrome.storage.local.set({ lifeOSSession: parsed });
                  resolve(parsed);
                  return;
                }
              } catch (e) {
                // Continue
              }
            }
          }

          // 3. Try to get from widget iframe
          const widgetIframe = document.getElementById('lifeos-widget-iframe');
          if (widgetIframe && widgetIframe.contentWindow) {
            try {
              widgetIframe.contentWindow.postMessage({ action: 'getSession' }, '*');
              const messageHandler = (event) => {
                if (event.data.action === 'session' && event.data.session) {
                  window.removeEventListener('message', messageHandler);
                  // Save to chrome.storage
                  chrome.storage.local.set({ lifeOSSession: event.data.session });
                  resolve(event.data.session);
                }
              };
              window.addEventListener('message', messageHandler);
              setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                // 4. Try background script
                chrome.runtime.sendMessage({ action: 'getSession' }, (response) => {
                  if (response && response.session && response.session.access_token) {
                    console.log('Session found from background script');
                    chrome.storage.local.set({ lifeOSSession: response.session });
                    resolve(response.session);
                  } else {
                    console.warn('No session found');
                    resolve(null);
                  }
                });
              }, 2000);
            } catch (e) {
              // Try background script
              chrome.runtime.sendMessage({ action: 'getSession' }, (response) => {
                if (response && response.session && response.session.access_token) {
                  chrome.storage.local.set({ lifeOSSession: response.session });
                  resolve(response.session);
                } else {
                  resolve(null);
                }
              });
            }
          } else {
            // Try background script
            chrome.runtime.sendMessage({ action: 'getSession' }, (response) => {
              if (response && response.session && response.session.access_token) {
                chrome.storage.local.set({ lifeOSSession: response.session });
                resolve(response.session);
              } else {
                resolve(null);
              }
            });
          }
        });
      } catch (error) {
        console.error('Get session error:', error);
        resolve(null);
      }
    });
  }

  // Create note via the LifeOS data gateway (auto-scoped to the user server-side)
  async function createNote(noteData) {
    const session = await getSession();
    if (!session || !session.access_token) {
      throw new Error('Chưa đăng nhập');
    }

    const response = await fetch(`${getApiBase()}/db/insert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        table: 'notes',
        rows: [{
          title: noteData.title,
          content: noteData.content || null,
          is_pinned: false,
          is_favorite: false,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[CreateNote] API Error:', response.status, error);
      throw new Error(error || 'Không thể tạo note');
    }

    const json = await response.json();
    if (json && json.error) {
      throw new Error(json.error.message || 'Không thể tạo note');
    }
    return json ? json.data : null;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

