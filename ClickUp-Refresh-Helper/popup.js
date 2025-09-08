// ClickUp Refresh Helper - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Ayarları yükle
  const settings = await chrome.storage.sync.get([
    'enabled', 
    'refreshInterval', 
    'smartRefresh', 
    'lastRefresh'
  ]);
  
  // UI'yi güncelle
  updateUI(settings);
  
  // Event listener'ları ekle
  setupEventListeners();
  
  // Durum kontrolü
  checkClickUpTab();
});

function updateUI(settings) {
  // Toggle'ları ayarla
  document.getElementById('enabled').checked = settings.enabled !== false;
  document.getElementById('smartRefresh').checked = settings.smartRefresh !== false;
  
  // Interval seçimini ayarla
  const intervalSelect = document.getElementById('refreshInterval');
  intervalSelect.value = settings.refreshInterval || 300000;
  
  // Interval display'i güncelle
  updateIntervalDisplay(settings.refreshInterval || 300000);
  
  // Son yenileme zamanını göster
  if (settings.lastRefresh) {
    const lastRefreshTime = new Date(settings.lastRefresh).toLocaleTimeString('tr-TR');
    document.getElementById('lastRefresh').textContent = lastRefreshTime;
  }
  
  // Durum göstergesini güncelle
  updateStatus(settings.enabled !== false);
}

function updateIntervalDisplay(interval) {
  const minutes = interval / 60000;
  const display = document.getElementById('intervalDisplay');
  display.textContent = `Her ${minutes} dakikada bir kontrol edilir`;
}

function updateStatus(enabled) {
  const statusEl = document.getElementById('status');
  if (enabled) {
    statusEl.className = 'status active';
    statusEl.textContent = 'Aktif - ClickUp sayfaları izleniyor';
  } else {
    statusEl.className = 'status inactive';
    statusEl.textContent = 'Pasif - Otomatik yenileme kapalı';
  }
}

function setupEventListeners() {
  // Enabled toggle
  document.getElementById('enabled').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ enabled });
    updateStatus(enabled);
    
    // Content script'lere bildir
    notifyContentScripts({ action: 'settingsChanged', enabled });
  });
  
  // Smart refresh toggle
  document.getElementById('smartRefresh').addEventListener('change', async (e) => {
    const smartRefresh = e.target.checked;
    await chrome.storage.sync.set({ smartRefresh });
    
    notifyContentScripts({ action: 'settingsChanged', smartRefresh });
  });
  
  // Refresh interval
  document.getElementById('refreshInterval').addEventListener('change', async (e) => {
    const refreshInterval = parseInt(e.target.value);
    await chrome.storage.sync.set({ refreshInterval });
    updateIntervalDisplay(refreshInterval);
    
    notifyContentScripts({ action: 'settingsChanged', refreshInterval });
  });
  
  // Manuel refresh butonu
  document.getElementById('manualRefresh').addEventListener('click', async () => {
    const button = document.getElementById('manualRefresh');
    button.textContent = 'Yenileniyor...';
    button.disabled = true;
    
    try {
      // Aktif ClickUp tabını bul ve yenile
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (activeTab && isClickUpUrl(activeTab.url)) {
        await chrome.tabs.reload(activeTab.id, { bypassCache: true });
        await chrome.storage.sync.set({ lastRefresh: Date.now() });
        
        // UI'yi güncelle
        const lastRefreshTime = new Date().toLocaleTimeString('tr-TR');
        document.getElementById('lastRefresh').textContent = lastRefreshTime;
        
        button.textContent = 'Yenilendi';
        setTimeout(() => {
          button.textContent = 'Şimdi Yenile';
          button.disabled = false;
        }, 2000);
      } else {
        button.textContent = 'ClickUp sayfası değil';
        setTimeout(() => {
          button.textContent = 'Şimdi Yenile';
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Manuel refresh hatası:', error);
      button.textContent = 'Hata oluştu';
      setTimeout(() => {
        button.textContent = 'Şimdi Yenile';
        button.disabled = false;
      }, 2000);
    }
  });
  
  // Cache temizle butonu
  document.getElementById('clearCache').addEventListener('click', async () => {
    const button = document.getElementById('clearCache');
    button.textContent = 'Temizleniyor...';
    button.disabled = true;
    
    try {
      // Sadece cache temizle, cookies'lere dokunma (login bilgileri korunur)
      if (chrome.browsingData) {
        // ClickUp domain'leri için sadece cache temizle
        await chrome.browsingData.removeCache({
          origins: ['https://app.clickup.com', 'https://clickup.com'],
          since: Date.now() - (24 * 60 * 60 * 1000) // Son 24 saat
        });
        
        // Sadece session storage temizle (local storage'a dokunma)
        await chrome.browsingData.removeWebSQL({
          origins: ['https://app.clickup.com', 'https://clickup.com']
        });
      }
      
      button.textContent = 'Temizlendi';
      setTimeout(() => {
        button.textContent = 'Cache Temizle';
        button.disabled = false;
      }, 2000);
      
      // Aktif ClickUp tabını yenile
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (activeTab && isClickUpUrl(activeTab.url)) {
        setTimeout(() => {
          chrome.tabs.reload(activeTab.id, { bypassCache: true });
        }, 1000);
      }
    } catch (error) {
      console.error('Cache temizleme hatası:', error);
      
      // Fallback: Sadece hard refresh yap
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        if (activeTab && isClickUpUrl(activeTab.url)) {
          await chrome.tabs.reload(activeTab.id, { bypassCache: true });
          button.textContent = 'Sayfa yenilendi';
        } else {
          button.textContent = 'Kısmi temizlik';
        }
      } catch (fallbackError) {
        button.textContent = 'Hata oluştu';
      }
      
      setTimeout(() => {
        button.textContent = 'Cache Temizle';
        button.disabled = false;
      }, 2000);
    }
  });
}

async function checkClickUpTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (activeTab && isClickUpUrl(activeTab.url)) {
      // ClickUp sayfasındayız, ek bilgi göster
      const statusEl = document.getElementById('status');
      if (statusEl.classList.contains('active')) {
        statusEl.textContent = 'Aktif - Bu ClickUp sayfası izleniyor';
      }
    }
  } catch (error) {
    console.error('Tab kontrolü hatası:', error);
  }
}

async function notifyContentScripts(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (isClickUpUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Content script yüklü değilse hata verir, normal
        });
      }
    }
  } catch (error) {
    console.error('Content script bildirim hatası:', error);
  }
}

function isClickUpUrl(url) {
  return url && (url.includes('clickup.com') || url.includes('app.clickup.com'));
}
