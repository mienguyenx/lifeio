(() => {
  const iframe = document.getElementById('lifeosSideFrame');
  const loading = document.getElementById('loading');
  const reloadBtn = document.getElementById('reloadBtn');
  const openTabBtn = document.getElementById('openTabBtn');

  // App URL resolved from config.js (loaded before this script).
  let LIFEOOS_URL = (self.LIFEOS_CONFIG && self.LIFEOS_CONFIG.appUrl) || 'http://localhost:3222';

  const hideLoading = () => {
    if (loading) loading.style.display = 'none';
  };

  iframe?.addEventListener('load', hideLoading);

  reloadBtn?.addEventListener('click', () => {
    loading.style.display = 'flex';
    iframe.src = LIFEOOS_URL;
  });

  openTabBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: LIFEOOS_URL });
  });

  // Resolve config override, then ensure iframe src is set.
  const configReady = self.lifeOSConfigReady || Promise.resolve();
  configReady.then((cfg) => {
    if (cfg && cfg.appUrl) LIFEOOS_URL = cfg.appUrl;
    if (iframe && !iframe.src) {
      iframe.src = LIFEOOS_URL;
    }
  });
})();
