// LifeOS Extension Popup Logic
(function() {
  'use strict';

  // App URL resolved from config.js (loaded before this script), with a
  // local-dev fallback. Updated when the async config override resolves.
  let LIFEOOS_URL = (self.LIFEOS_CONFIG && self.LIFEOS_CONFIG.appUrl) || 'http://localhost:3222';
  if (self.lifeOSConfigReady) {
    self.lifeOSConfigReady.then((cfg) => { if (cfg && cfg.appUrl) LIFEOOS_URL = cfg.appUrl; });
  }

  const widgetStatus = document.getElementById('widgetStatus');
  const openSidePanelBtn = document.getElementById('openSidePanelBtn');
  const openLifeOSBtn = document.getElementById('openLifeOSBtn');
  const openNewTabBtn = document.getElementById('openNewTabBtn');

  // Open side panel
  openSidePanelBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
    widgetStatus.textContent = '🔓 Đã mở side panel';
    widgetStatus.className = 'status active';
  });

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

