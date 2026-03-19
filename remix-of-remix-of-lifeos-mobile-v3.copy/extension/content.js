// LifeOS Widget Content Script
// Inject widget vào mọi trang web

(function() {
  'use strict';

  // Kiểm tra xem widget đã được inject chưa
  if (document.getElementById('lifeos-widget')) {
    return;
  }

  // Always inject text selector (needed for context menu even if widget is disabled)
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectTextSelector();
    });
  } else {
    injectTextSelector();
  }

  // Kiểm tra widget có được bật không
  chrome.storage.local.get(['widgetEnabled'], (result) => {
    const enabled = result.widgetEnabled !== false; // Default true
    if (!enabled) return;

    injectWidget();
  });

  // Listen for toggle messages and context menu actions
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === 'toggleWidget') {
        if (message.enabled) {
          if (!document.getElementById('lifeos-widget-iframe')) {
            injectWidget();
          }
        } else {
          const widget = document.getElementById('lifeos-widget-iframe');
          if (widget) {
            widget.remove();
          }
        }
        sendResponse({ success: true });
      } else if (message.action === 'createNote') {
        // Forward to text-selector.js
        const selectedText = message.selectedText || window.getSelection().toString().trim();
        console.log('[Content] Received createNote action, selectedText:', selectedText);
        if (selectedText) {
          window.postMessage({ action: 'showNotePopup', selectedText: selectedText }, '*');
          console.log('[Content] Sent showNotePopup message to window');
          sendResponse({ success: true });
        } else {
          console.warn('[Content] No text selected for createNote');
          sendResponse({ success: false, error: 'No text selected' });
        }
      } else if (message.action === 'translate') {
        // Forward to text-selector.js
        const selectedText = message.selectedText || window.getSelection().toString().trim();
        console.log('[Content] Received translate action, selectedText:', selectedText);
        if (selectedText) {
          window.postMessage({ action: 'showTranslationPopup', selectedText: selectedText }, '*');
          console.log('[Content] Sent showTranslationPopup message to window');
          sendResponse({ success: true });
        } else {
          console.warn('[Content] No text selected for translate');
          sendResponse({ success: false, error: 'No text selected' });
        }
      }
      return true; // Keep channel open for async response
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
      return true;
    }
  });

  function injectWidget() {
    // Kiểm tra lại xem đã có widget chưa
    if (document.getElementById('lifeos-widget-iframe')) {
      return;
    }

    // Đợi body sẵn sàng
    if (!document.body) {
      setTimeout(injectWidget, 100);
      return;
    }

    // Inject text selector
    injectTextSelector();

    // Tạo iframe để load widget (isolated context)
    const widgetIframe = document.createElement('iframe');
    widgetIframe.id = 'lifeos-widget-iframe';
    widgetIframe.src = chrome.runtime.getURL('widget.html');
    widgetIframe.setAttribute('allowtransparency', 'true');
    widgetIframe.setAttribute('scrolling', 'no');
    // Default: Mobile view (full screen like phone)
    widgetIframe.style.cssText = `
      border: none !important;
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      left: auto !important;
      width: 375px !important;
      height: 667px !important;
      max-height: 90vh !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
      border-radius: 20px !important;
      overflow: hidden !important;
      background: transparent !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    `;
    
    // Set iframe height based on content after load
    widgetIframe.onload = () => {
      // Default mobile view height
      widgetIframe.style.height = '667px';
      
      // Listen for resize messages from widget
      window.addEventListener('message', (event) => {
        if (event.source === widgetIframe.contentWindow && event.data.action === 'resizeWidget') {
          const { height, isCompact } = event.data;
          if (isCompact) {
            // Compact view: smaller height
            widgetIframe.style.width = '280px';
            widgetIframe.style.height = `${height || 350}px`;
          } else {
            // Mobile view: full phone size
            widgetIframe.style.width = '375px';
            widgetIframe.style.height = `${height || 667}px`;
          }
        }
      });
    };

    // Thêm vào body
    document.body.appendChild(widgetIframe);

    // Đảm bảo iframe luôn ở trên cùng
    const ensureZIndex = () => {
      const maxZ = Math.max(...Array.from(document.querySelectorAll('*')).map(el => {
        const z = window.getComputedStyle(el).zIndex;
        return z && z !== 'auto' ? parseInt(z) : 0;
      }).filter(z => !isNaN(z) && z < 2147483647));
      
      if (maxZ >= parseInt(window.getComputedStyle(widgetIframe).zIndex)) {
        widgetIframe.style.zIndex = '2147483647';
      }
    };

    // Kiểm tra z-index định kỳ
    setInterval(ensureZIndex, 1000);

    // Track iframe position
    let iframeX = 20;
    let iframeY = 20;
    
    // Load saved position and settings
    try {
      chrome.storage.local.get(['widgetPosition', 'widgetHidden', 'widgetHiddenUrl'], (result) => {
        if (result.widgetPosition) {
          if (result.widgetPosition.right !== undefined) {
            widgetIframe.style.right = `${result.widgetPosition.right}px`;
            widgetIframe.style.bottom = `${result.widgetPosition.bottom}px`;
            widgetIframe.style.left = 'auto';
            widgetIframe.style.top = 'auto';
          }
        }
        
        // Check if widget should be hidden for this URL
        if (result.widgetHidden && result.widgetHiddenUrl === window.location.href) {
          widgetIframe.style.display = 'none';
        }
      });
      
      // Listen for widget settings changes (sync from other tabs)
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.widgetSettings) {
          // Notify widget iframe about settings change
          if (widgetIframe && widgetIframe.contentWindow) {
            widgetIframe.contentWindow.postMessage({
              action: 'settingsUpdated',
              settings: changes.widgetSettings.newValue
            }, '*');
          }
        }
      });
    } catch (e) {
      console.warn('Could not load widget settings:', e);
    }

    // Listen for messages from widget
    window.addEventListener('message', (event) => {
      // Only accept messages from our extension
      if (event.source !== widgetIframe.contentWindow) return;

      if (event.data.action === 'getSession') {
        // Try to get session from localStorage and chrome.storage
        try {
          // 1. Try chrome.storage first (most reliable for cross-tab sync)
          chrome.storage.local.get(['lifeOSSession', 'external-supabase-auth-token'], (result) => {
            // Check lifeOSSession first
            if (result.lifeOSSession && result.lifeOSSession.access_token) {
              widgetIframe.contentWindow.postMessage({
                action: 'session',
                session: result.lifeOSSession,
              }, '*');
              return;
            }
            
            // Check external-supabase-auth-token
            if (result['external-supabase-auth-token']) {
              try {
                const parsed = JSON.parse(result['external-supabase-auth-token']);
                if (parsed && parsed.access_token) {
                  // Save to lifeOSSession for consistency
                  chrome.storage.local.set({ lifeOSSession: parsed });
                  widgetIframe.contentWindow.postMessage({
                    action: 'session',
                    session: parsed,
                  }, '*');
                  return;
                }
              } catch (e) {
                console.warn('Could not parse session from chrome.storage:', e);
              }
            }
            
            // 2. Try localStorage (fallback)
            const sessionKeys = [
              'external-supabase-auth-token',
              'sb-supabase-auth-token',
              'sb-pxgdmyszzwamwygvifvj-auth-token'
            ];

            for (const key of sessionKeys) {
              const session = localStorage.getItem(key);
              if (session) {
                try {
                  const parsed = JSON.parse(session);
                  if (parsed && parsed.access_token) {
                    // Save to chrome.storage for cross-tab sync
                    chrome.storage.local.set({ 
                      lifeOSSession: parsed,
                      [key]: session 
                    });
                    widgetIframe.contentWindow.postMessage({
                      action: 'session',
                      session: parsed,
                    }, '*');
                    return;
                  }
                } catch (e) {
                  // Try next key
                }
              }
            }
            
            // No session found
            widgetIframe.contentWindow.postMessage({
              action: 'session',
              session: null,
            }, '*');
          });
        } catch (error) {
          console.error('Error getting session:', error);
          widgetIframe.contentWindow.postMessage({
            action: 'session',
            session: null,
          }, '*');
        }
      } else if (event.data.action === 'getWidgetPosition') {
        // Return current widget position
        const rect = widgetIframe.getBoundingClientRect();
        widgetIframe.contentWindow.postMessage({
          action: 'widgetPosition',
          x: rect.left,
          y: rect.top,
          right: window.innerWidth - rect.right,
          bottom: window.innerHeight - rect.bottom,
        }, '*');
      } else if (event.data.action === 'moveWidget') {
        // Move iframe - improved drag handling with proper boundary checking
        const rect = widgetIframe.getBoundingClientRect();
        const iframeWidth = rect.width;
        const iframeHeight = rect.height;
        
        // Get current position (prefer right/bottom for consistency)
        // If right/bottom not set, calculate from current position
        let currentRight = parseFloat(widgetIframe.style.right);
        let currentBottom = parseFloat(widgetIframe.style.bottom);
        
        if (isNaN(currentRight)) {
          currentRight = window.innerWidth - rect.right;
        }
        if (isNaN(currentBottom)) {
          currentBottom = window.innerHeight - rect.bottom;
        }
        
        // Calculate new position
        // deltaX > 0 means mouse moved right, so widget should move right (right value decreases)
        // deltaY > 0 means mouse moved down, so widget should move down (bottom value decreases)
        const newRight = currentRight - event.data.deltaX;
        const newBottom = currentBottom - event.data.deltaY;
        
        // Constrain to viewport with proper boundaries
        const minRight = 0;
        const maxRight = window.innerWidth - iframeWidth;
        const minBottom = 0;
        const maxBottom = window.innerHeight - iframeHeight;
        
        const constrainedRight = Math.max(minRight, Math.min(maxRight, newRight));
        const constrainedBottom = Math.max(minBottom, Math.min(maxBottom, newBottom));
        
        // Apply new position
        widgetIframe.style.right = `${constrainedRight}px`;
        widgetIframe.style.bottom = `${constrainedBottom}px`;
        widgetIframe.style.left = 'auto';
        widgetIframe.style.top = 'auto';
        
        // Save position to storage (debounced to avoid too many writes)
        if (!widgetIframe._positionSaveTimeout) {
          widgetIframe._positionSaveTimeout = setTimeout(() => {
            try {
              chrome.storage.local.set({ 
                widgetPosition: { 
                  right: constrainedRight, 
                  bottom: constrainedBottom 
                } 
              });
            } catch (e) {
              console.warn('Could not save widget position:', e);
            }
            widgetIframe._positionSaveTimeout = null;
          }, 100); // Debounce saves to every 100ms
        }
      } else if (event.data.action === 'resizeWidget') {
        // Resize iframe
        const height = event.data.height || 500;
        const maxHeight = window.innerHeight * 0.8;
        widgetIframe.style.height = `${Math.min(height, maxHeight)}px`;
      } else if (event.data.action === 'hideWidget') {
        // Hide widget for current page
        widgetIframe.style.display = 'none';
        // Save hidden state
        try {
          chrome.storage.local.set({ 
            widgetHidden: true,
            widgetHiddenUrl: window.location.href 
          });
        } catch (e) {
          console.warn('Could not save widget hidden state:', e);
        }
      }
    });

    console.log('LifeOS Widget injected');
  }

  // Inject text selector
  function injectTextSelector() {
    // Kiểm tra xem đã inject chưa
    if (document.getElementById('lifeos-text-selector-script') || document.getElementById('lifeos-text-selector')) {
      console.log('[Content] Text selector already injected');
      return;
    }

    // Đợi document.head sẵn sàng
    if (!document.head) {
      setTimeout(injectTextSelector, 100);
      return;
    }

    console.log('[Content] Injecting text selector...');

    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('text-selector.css');
    document.head.appendChild(link);

    // Inject API.js first (required by text-selector.js)
    const apiScript = document.createElement('script');
    apiScript.src = chrome.runtime.getURL('api.js');
    apiScript.onload = () => {
      console.log('[Content] API.js loaded');
      
      // Then inject text-selector.js
      const script = document.createElement('script');
      script.id = 'lifeos-text-selector-script';
      script.src = chrome.runtime.getURL('text-selector.js');
      script.onload = () => {
        console.log('[Content] LifeOS Text Selector loaded successfully');
      };
      script.onerror = (error) => {
        console.error('[Content] Error loading text selector:', error);
      };
      (document.head || document.documentElement).appendChild(script);
    };
    apiScript.onerror = (error) => {
      console.error('[Content] Error loading API.js:', error);
    };
    (document.head || document.documentElement).appendChild(apiScript);
  }
})();

