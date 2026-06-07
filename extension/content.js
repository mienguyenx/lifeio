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

  // Widget overlay disabled in favor of Chrome side panel. Still inject text selector for context menus.
  chrome.storage.local.get(['widgetEnabled'], (result) => {
    const enabled = result.widgetEnabled !== false; // Default true
    if (!enabled) return;
    // No widget injection here.
  });

  // Listen for toggle messages and context menu actions
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === 'toggleWidget') {
        // Side panel mode: nothing to inject. Just acknowledge.
        sendResponse({ success: true, mode: 'sidePanel' });
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
    // Widget overlay disabled in side panel mode.
    return;
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

    // Inject config.js first (provides LIFEOS_CONFIG for api.js + text-selector.js)
    const configScript = document.createElement('script');
    configScript.src = chrome.runtime.getURL('config.js');
    configScript.onload = () => {
      // Then API.js (required by text-selector.js)
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
    };
    configScript.onerror = (error) => {
      console.error('[Content] Error loading config.js:', error);
    };
    (document.head || document.documentElement).appendChild(configScript);
  }
})();

