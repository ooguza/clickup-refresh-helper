// ClickUp Refresh Helper - Background Script

chrome.runtime.onInstalled.addListener(() => {
  // Varsayılan ayarları kaydet
  chrome.storage.sync.set({
    enabled: true,
    refreshInterval: 300000, // 5 dakika
    smartRefresh: true,
    lastActivity: Date.now()
  });
});

// Tab güncellemelerini dinle
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && isClickUpUrl(tab.url)) {
    // ClickUp sayfası yüklendiğinde content script'i başlat
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});

// Mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'userActivity') {
    // Kullanıcı aktivitesini kaydet
    chrome.storage.sync.set({ lastActivity: Date.now() });
  } else if (request.action === 'forceRefresh') {
    // Manuel refresh
    chrome.tabs.reload(sender.tab.id, { bypassCache: true });
  }
});

function isClickUpUrl(url) {
  return url.includes('clickup.com') || url.includes('app.clickup.com');
}

// Periyodik kontrol
setInterval(async () => {
  const settings = await chrome.storage.sync.get(['enabled', 'refreshInterval', 'smartRefresh', 'lastActivity']);
  
  if (!settings.enabled) return;
  
  // Aktif ClickUp tablarını bul
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  
  for (const tab of tabs) {
    if (isClickUpUrl(tab.url)) {
      const timeSinceActivity = Date.now() - (settings.lastActivity || 0);
      
      // Smart refresh: Kullanıcı 2 dakikadan fazla aktif değilse refresh yap
      if (settings.smartRefresh && timeSinceActivity > 120000) {
        chrome.tabs.sendMessage(tab.id, { action: 'checkForRefresh' });
      }
    }
  }
}, 60000); // Her dakika kontrol et
