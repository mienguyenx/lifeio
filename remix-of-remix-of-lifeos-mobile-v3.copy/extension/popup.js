// LifeOS Extension Popup Logic
(function() {
  'use strict';

  const LIFEOOS_URL = 'https://life.hoanong.com';

  const widgetStatus = document.getElementById('widgetStatus');
  const widgetToggle = document.getElementById('widgetToggle');
  const openLifeOSBtn = document.getElementById('openLifeOSBtn');
  const openNewTabBtn = document.getElementById('openNewTabBtn');

  // Load settings
  chrome.storage.local.get(['widgetEnabled'], (result) => {
    const enabled = result.widgetEnabled !== false; // Default true
    widgetToggle.classList.toggle('active', enabled);
    updateStatus(enabled);
  });

  // Toggle widget
  widgetToggle.addEventListener('click', () => {
    const isActive = widgetToggle.classList.contains('active');
    const newState = !isActive;
    
    widgetToggle.classList.toggle('active', newState);
    chrome.storage.local.set({ widgetEnabled: newState }, () => {
      updateStatus(newState);
      
      // Notify all tabs to show/hide widget
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'toggleWidget',
              enabled: newState
            }, (response) => {
              // Check for runtime errors
              if (chrome.runtime.lastError) {
                // Ignore errors (tab might not have content script)
                return;
              }
            });
          }
        });
      });
    });
  });

  // Update status
  function updateStatus(enabled) {
    if (enabled) {
      widgetStatus.textContent = '✅ Widget đang bật';
      widgetStatus.className = 'status active';
    } else {
      widgetStatus.textContent = '❌ Widget đang tắt';
      widgetStatus.className = 'status inactive';
    }
  }

  // Open LifeOS
  openLifeOSBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: LIFEOOS_URL });
    window.close();
  });

  // Open new tab
  openNewTabBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://newtab/' });
    window.close();
  });
})();

