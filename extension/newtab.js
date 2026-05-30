// LifeOS New Tab Extension
// Hiển thị LifeOS trong tab mới với tính năng thu nhỏ thành mobile view

(function() {
  'use strict';

  const LIFEOOS_URL = 'https://life.hoanong.com';
  const LOADING_TIMEOUT = 10000;
  const MOBILE_WIDTH = 375;
  const MOBILE_HEIGHT = 667;

  const iframe = document.getElementById('lifeos-iframe');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const errorMessage = document.getElementById('errorMessage');
  const lifeosWrapper = document.getElementById('lifeosWrapper');
  const lifeosContainer = document.getElementById('lifeosContainer');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const maximizeBtn = document.getElementById('maximizeBtn');
  const closeBtn = document.getElementById('closeBtn');
  const controls = document.getElementById('controls');

  let loadingTimeout;
  let isLoaded = false;
  let isMinimized = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentX = 0;
  let currentY = 0;

  // Load saved state
  chrome.storage?.local?.get(['isMinimized', 'lastVisit'], (result) => {
    if (result.isMinimized) {
      setTimeout(() => {
        toggleMinimize();
      }, 500);
    }
  });

  // Hide loading after iframe loads
  function hideLoading() {
    if (isLoaded) return;
    isLoaded = true;
    
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    setTimeout(() => {
      loading.classList.add('hidden');
      setTimeout(() => {
        loading.style.display = 'none';
        controls.classList.add('visible');
      }, 300);
    }, 500);
  }

  // Show error
  function showError(message) {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    loading.classList.add('hidden');
    errorMessage.textContent = message || 'Không thể tải LifeOS. Vui lòng kiểm tra kết nối internet.';
    error.classList.add('show');
  }

  // Toggle minimize/maximize
  function toggleMinimize() {
    isMinimized = !isMinimized;
    
    if (isMinimized) {
      lifeosWrapper.classList.add('minimized');
      minimizeBtn.style.display = 'none';
      maximizeBtn.style.display = 'flex';
      
      // Reset position when minimizing
      lifeosContainer.style.transform = 'translate(0, 0)';
      currentX = 0;
      currentY = 0;
    } else {
      lifeosWrapper.classList.remove('minimized');
      minimizeBtn.style.display = 'flex';
      maximizeBtn.style.display = 'none';
    }

    // Save state
    chrome.storage?.local?.set({ isMinimized });
  }

  // Drag functionality for minimized view
  function startDrag(e) {
    if (!isMinimized) return;
    
    isDragging = true;
    lifeosContainer.classList.add('dragging');
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStartX = clientX - currentX;
    dragStartY = clientY - currentY;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('touchend', stopDrag);
    
    e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    currentX = clientX - dragStartX;
    currentY = clientY - dragStartY;
    
    // Constrain to viewport
    const containerRect = lifeosContainer.getBoundingClientRect();
    const maxX = window.innerWidth - containerRect.width;
    const maxY = window.innerHeight - containerRect.height;
    
    currentX = Math.max(-maxX, Math.min(0, currentX));
    currentY = Math.max(-maxY, Math.min(maxY, currentY));
    
    lifeosContainer.style.transform = `translate(${currentX}px, ${currentY}px)`;
    
    e.preventDefault();
  }

  function stopDrag() {
    isDragging = false;
    lifeosContainer.classList.remove('dragging');
    
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
  }

  // Close LifeOS (redirect to about:newtab)
  function closeLifeOS() {
    if (confirm('Bạn có muốn đóng LifeOS và quay về tab mới mặc định?')) {
      window.location.href = 'chrome://newtab/';
    }
  }

  // Event Listeners
  minimizeBtn.addEventListener('click', toggleMinimize);
  maximizeBtn.addEventListener('click', toggleMinimize);
  closeBtn.addEventListener('click', closeLifeOS);

  // Drag handlers
  lifeosContainer.addEventListener('mousedown', startDrag);
  lifeosContainer.addEventListener('touchstart', startDrag);

  // Prevent default drag behavior on images
  lifeosContainer.addEventListener('dragstart', (e) => {
    if (isMinimized) {
      e.preventDefault();
    }
  });

  // Check if iframe loaded successfully
  iframe.addEventListener('load', () => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        hideLoading();
      } else {
        hideLoading();
      }
    } catch (e) {
      hideLoading();
    }
  });

  // Handle iframe errors
  iframe.addEventListener('error', () => {
    showError('Lỗi khi tải LifeOS. Vui lòng kiểm tra kết nối internet.');
  });

  // Timeout fallback
  loadingTimeout = setTimeout(() => {
    if (!isLoaded) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc && iframeDoc.readyState === 'complete') {
          hideLoading();
        } else {
          showError('Tải LifeOS mất quá nhiều thời gian. Vui lòng kiểm tra kết nối.');
        }
      } catch (e) {
        hideLoading();
      }
    }
  }, LOADING_TIMEOUT);

  // Handle messages from iframe
  window.addEventListener('message', (event) => {
    if (event.origin !== LIFEOOS_URL) return;

    if (event.data && event.data.type === 'lifeos-loaded') {
      hideLoading();
    }
  });

  // Fallback: Hide loading after 2 seconds
  setTimeout(() => {
    if (!isLoaded) {
      hideLoading();
    }
  }, 2000);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && error.classList.contains('show')) {
      error.classList.remove('show');
      location.reload();
    }
    
    // Toggle minimize with 'M' key
    if (e.key === 'm' || e.key === 'M') {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        toggleMinimize();
      }
    }
  });

  // Store last visit time
  chrome.storage?.local?.set({
    lastVisit: Date.now()
  });

  // Show controls on mouse move
  let controlsTimeout;
  document.addEventListener('mousemove', () => {
    controls.classList.add('visible');
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (!isMinimized) {
        controls.classList.remove('visible');
      }
    }, 3000);
  });

  console.log('LifeOS New Tab Extension loaded');
})();

