// Background service worker pour l'extension Alcentric

// Ouvrir le Side Panel quand on clique sur l'icône de l'extension
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Écouter les messages des content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }
});

// Écouter les messages externes (depuis le site web)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    // Notifier le side panel du changement d'état d'authentification
    chrome.runtime.sendMessage({ 
      type: 'AUTH_STATE_CHANGED', 
      isLoggedIn: message.isLoggedIn 
    });
    sendResponse({ success: true });
  }
  return true;
});

// Configurer le Side Panel pour qu'il soit disponible sur toutes les pages
chrome.runtime.onInstalled.addListener(() => {
  console.log('Alcentric extension installed');
  
  chrome.sidePanel.setOptions({
    enabled: true
  });
});
