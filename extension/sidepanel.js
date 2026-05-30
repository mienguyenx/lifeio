(() => {
  const iframe = document.getElementById('lifeosSideFrame');
  const loading = document.getElementById('loading');
  const reloadBtn = document.getElementById('reloadBtn');
  const openTabBtn = document.getElementById('openTabBtn');

  const LIFEOOS_URL = 'https://life.hoanong.com';

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

  // Ensure src is set (in case CSP strips)
  if (iframe && !iframe.src) {
    iframe.src = LIFEOOS_URL;
  }
})();
