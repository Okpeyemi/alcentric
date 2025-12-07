// Background service worker pour l'extension Alcentric

// Ouvrir le Side Panel quand on clique sur l'icône de l'extension
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Écouter les messages des content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    // Ouvrir le side panel pour l'onglet qui a envoyé le message
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }
});

// Configurer le Side Panel pour qu'il soit disponible sur toutes les pages
chrome.runtime.onInstalled.addListener(() => {
  console.log('Alcentric extension installed');
  
  // Activer le side panel sur toutes les pages
  chrome.sidePanel.setOptions({
    enabled: true
  });
});
