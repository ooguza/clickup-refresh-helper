// ClickUp Refresh Helper - Content Script

let refreshTimer = null;
let userActivityTimer = null;
let isUserActive = false;
let lastRefreshTime = 0;

// Ayarları yükle
let settings = {
  enabled: true,
  refreshInterval: 300000, // 5 dakika
  smartRefresh: true
};

chrome.storage.sync.get(['enabled', 'refreshInterval', 'smartRefresh'], (result) => {
  settings = { ...settings, ...result };
  if (settings.enabled) {
    initializeRefreshHelper();
  }
});

function initializeRefreshHelper() {
  console.log('ClickUp Refresh Helper başlatıldı');
  
  // Kullanıcı aktivitesini izle
  trackUserActivity();
  
  // Sayfa değişikliklerini izle
  observePageChanges();
  
  // Refresh timer'ı başlat
  startRefreshTimer();
  
  // Refresh indicator'ı ekle
  addRefreshIndicator();
}

function trackUserActivity() {
  const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  
  activities.forEach(activity => {
    document.addEventListener(activity, () => {
      isUserActive = true;
      chrome.runtime.sendMessage({ action: 'userActivity' });
      
      // 30 saniye sonra inactive olarak işaretle
      clearTimeout(userActivityTimer);
      userActivityTimer = setTimeout(() => {
        isUserActive = false;
      }, 30000);
    }, { passive: true });
  });
}

function observePageChanges() {
  // ClickUp'ın dinamik içerik değişikliklerini izle
  const observer = new MutationObserver((mutations) => {
    let hasSignificantChange = false;
    
    mutations.forEach((mutation) => {
      // Task listelerindeki değişiklikleri kontrol et
      if (mutation.target.classList.contains('cu-task-row') ||
          mutation.target.classList.contains('cu-list-view') ||
          mutation.target.closest('.cu-dashboard-view')) {
        hasSignificantChange = true;
      }
    });
    
    if (hasSignificantChange && !isUserActive) {
      // Sayfa değişti ama kullanıcı aktif değil, refresh gerekebilir
      scheduleSmartRefresh();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-status']
  });
}

function startRefreshTimer() {
  if (refreshTimer) clearInterval(refreshTimer);
  
  refreshTimer = setInterval(() => {
    if (settings.enabled && shouldRefresh()) {
      performRefresh();
    }
  }, settings.refreshInterval);
}

function shouldRefresh() {
  const now = Date.now();
  const timeSinceLastRefresh = now - lastRefreshTime;
  
  // En az 2 dakika geçmiş olmalı
  if (timeSinceLastRefresh < 120000) return false;
  
  // Smart refresh açıksa kullanıcı aktivitesini kontrol et
  if (settings.smartRefresh && isUserActive) return false;
  
  // Stale data kontrolü
  return detectStaleData();
}

function detectStaleData() {
  // ClickUp'ın loading indicator'larını kontrol et
  const loadingElements = document.querySelectorAll('.cu-loading, .loading, [data-loading="true"]');
  if (loadingElements.length > 0) return false;
  
  // Error state kontrolü
  const errorElements = document.querySelectorAll('.error, .cu-error, [data-error="true"]');
  if (errorElements.length > 0) return true;
  
  // Boş liste kontrolü (cache problemi olabilir)
  const taskLists = document.querySelectorAll('.cu-task-row');
  const emptyStates = document.querySelectorAll('.empty-state, .no-tasks');
  
  if (taskLists.length === 0 && emptyStates.length === 0) {
    // Listeler yok ama empty state de yok, cache problemi olabilir
    return true;
  }
  
  return false;
}

function scheduleSmartRefresh() {
  // 10 saniye bekle, hala problem varsa refresh yap
  setTimeout(() => {
    if (detectStaleData() && !isUserActive) {
      performRefresh();
    }
  }, 10000);
}

function performRefresh() {
  console.log('ClickUp sayfası yenileniyor...');
  lastRefreshTime = Date.now();
  
  // Soft refresh dene
  if (window.location.hash) {
    const currentHash = window.location.hash;
    window.location.hash = '';
    setTimeout(() => {
      window.location.hash = currentHash;
    }, 100);
  } else {
    // Hard refresh
    window.location.reload(true);
  }
  
  updateRefreshIndicator('Sayfa yenilendi');
}

function addRefreshIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'clickup-refresh-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff8c00;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
    cursor: pointer;
  `;
  indicator.textContent = 'Refresh Helper Aktif';
  
  // Manuel refresh için tıklama
  indicator.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'forceRefresh' });
  });
  
  document.body.appendChild(indicator);
  
  // 3 saniye göster
  setTimeout(() => {
    indicator.style.opacity = '0.7';
  }, 100);
  
  setTimeout(() => {
    indicator.style.opacity = '0';
  }, 3000);
}

function updateRefreshIndicator(message) {
  const indicator = document.getElementById('clickup-refresh-indicator');
  if (indicator) {
    indicator.textContent = message;
    indicator.style.opacity = '0.9';
    indicator.style.background = '#28a745';
    
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }
}

// Background script'ten mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkForRefresh') {
    if (shouldRefresh()) {
      performRefresh();
    }
  }
});

// Sayfa yüklendiğinde başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRefreshHelper);
} else {
  initializeRefreshHelper();
}
