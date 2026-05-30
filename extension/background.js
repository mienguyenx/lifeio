// LifeOS Background Script
// Xử lý context menu và các tác vụ nền

chrome.runtime.onInstalled.addListener(() => {
  // Enable side panel to open when clicking the action button
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    try {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (e) {
      console.warn('[Background] sidePanel behavior not set:', e);
    }
  }

  // Tạo context menu items
  // Note: Manifest V3 không hỗ trợ property 'icons' trong contextMenus.create
  chrome.contextMenus.create({
    id: 'lifeos-create-note',
    title: 'LifeOS: Tạo Note',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'lifeos-translate',
    title: 'LifeOS: Dịch',
    contexts: ['selection']
  });

  // Sync session từ LifeOS tab
  syncSessionFromLifeOSTab();

  // Định kỳ sync session
  setInterval(syncSessionFromLifeOSTab, 30000); // Mỗi 30 giây

  // Lắng nghe thay đổi storage để sync real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.lifeOSSession || changes['external-supabase-auth-token'])) {
      console.log('[Background] Session changed in chrome.storage, syncing to tabs...');
      syncSessionFromLifeOSTab();
    }
  });
});

// Sync when browser starts (not just when extension installs/updates)
chrome.runtime.onStartup.addListener(() => {
  console.log('[Background] Browser startup, syncing session...');
  syncSessionFromLifeOSTab();

  // Ensure side panel behavior on startup
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    try {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (e) {
      console.warn('[Background] sidePanel behavior not set on startup:', e);
    }
  }

  // Định kỳ sync session sau khi browser start
  setInterval(syncSessionFromLifeOSTab, 30000);
});

// Enable side panel for all tabs (except chrome://)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!chrome.sidePanel || !chrome.sidePanel.setOptions) return;
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) return;
  chrome.sidePanel.setOptions({
    tabId,
    path: 'sidepanel.html',
    enabled: true,
  }).catch?.((e) => console.warn('[Background] setOptions sidePanel failed', e));
});

// Sync session từ LifeOS tab
async function syncSessionFromLifeOSTab() {
  try {
    console.log('[Background] Syncing session from LifeOS tab...');

    // Tìm tab LifeOS
    const tabs = await chrome.tabs.query({ url: 'https://life.hoanong.com/*' });

    if (tabs.length === 0) {
      // Không có tab LifeOS → Check stored session
      const stored = await chrome.storage.local.get(['lifeOSSession']);
      if (stored.lifeOSSession?.access_token) {
        console.log('[Background] No LifeOS tab, but have stored session');
        return; // Dùng session cũ
      }
      console.log('[Background] No LifeOS tab and no stored session');
      return;
    }

    const lifeOSTab = tabs[0];

    // Lấy session từ tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: lifeOSTab.id },
      func: () => {
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
                return { session: parsed, key: key, raw: session };
              }
            } catch (e) {
              continue;
            }
          }
        }
        return null;
      }
    });

    if (results && results[0] && results[0].result) {
      const { session, key, raw } = results[0].result;
      // Lưu vào chrome.storage để chia sẻ giữa các tab và widget
      await chrome.storage.local.set({
        lifeOSSession: session,
        [key]: raw // Lưu cả raw string để restore vào localStorage
      });
      console.log('[Background] ✅ Session synced successfully:', key);

      // Broadcast session update đến tất cả tabs và widgets
      chrome.tabs.query({}, (allTabs) => {
        allTabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'sessionUpdated',
              session: session
            }).catch(() => {
              // Ignore errors (tab might not have content script)
            });
          }
        });
      });
    }
  } catch (error) {
    console.error('[Background] Error syncing session:', error);
  }
}

// Xử lý click vào context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('[Background] Context menu clicked:', info.menuItemId, 'Selected text:', info.selectionText);

  if (info.menuItemId === 'lifeos-create-note') {
    // Gửi message đến content script để tạo note
    chrome.tabs.sendMessage(tab.id, {
      action: 'createNote',
      selectedText: info.selectionText
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error sending createNote message:', chrome.runtime.lastError.message);
      } else {
        console.log('[Background] createNote message sent, response:', response);
      }
    });
  } else if (info.menuItemId === 'lifeos-translate') {
    // Gửi message đến content script để dịch
    chrome.tabs.sendMessage(tab.id, {
      action: 'translate',
      selectedText: info.selectionText
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error sending translate message:', chrome.runtime.lastError.message);
      } else {
        console.log('[Background] translate message sent, response:', response);
      }
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSession') {
    // Lấy từ storage HOẶC sync mới nếu cần
    chrome.storage.local.get(['lifeOSSession'], async (result) => {
      if (result.lifeOSSession?.access_token) {
        // Có session trong storage
        console.log('[Background] Returning stored session');
        sendResponse({ session: result.lifeOSSession });
      } else {
        // Không có session → Sync ngay
        console.log('[Background] No stored session, syncing now...');
        await syncSessionFromLifeOSTab();

        // Get session after sync
        chrome.storage.local.get(['lifeOSSession'], (newResult) => {
          sendResponse({ session: newResult.lifeOSSession || null });
        });
      }
    });
    return true; // Keep channel open for async response
  } else if (message.action === 'syncSession') {
    // Sync session ngay lập tức
    syncSessionFromLifeOSTab().then(() => {
      chrome.storage.local.get(['lifeOSSession'], (result) => {
        sendResponse({ success: true, session: result.lifeOSSession });
      });
    });
    return true;
  } else if (message.action === 'openSidePanel') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.windows.getCurrent((win) => {
        chrome.sidePanel.open({ windowId: win.id }).catch?.((e) => console.warn('[Background] open sidePanel failed', e));
      });
    }
    sendResponse({ success: true });
    return true;
  }
});

