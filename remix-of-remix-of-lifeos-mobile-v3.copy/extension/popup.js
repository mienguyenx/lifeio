// LifeOS Extension Popup Logic
(function() {
  'use strict';

  const LIFEOOS_URL = 'https://life.hoanong.com';

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

