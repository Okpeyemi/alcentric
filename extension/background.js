// Background service worker pour l'extension Alcentric

// Écouter les messages du popup et des content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    // Notifier tous les onglets du changement d'état d'authentification
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'AUTH_STATE_CHANGED',
            isLoggedIn: message.isLoggedIn
          }).catch(() => {
            // Ignorer les erreurs pour les onglets qui n'ont pas le content script
          });
        }
      });
    });
  }
  
  if (message.type === 'EXTENSION_TOGGLE') {
    // Notifier tous les onglets du changement d'état de l'extension
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'EXTENSION_TOGGLE',
            enabled: message.enabled
          }).catch(() => {
            // Ignorer les erreurs
          });
        }
      });
    });
  }
  
  if (message.type === 'GET_AUTH_STATE') {
    // Récupérer l'état d'authentification depuis le storage
    chrome.storage.local.get(['sb-mijsxpskfzapjjyajrtm-auth-token', 'extensionEnabled'], (result) => {
      const session = result['sb-mijsxpskfzapjjyajrtm-auth-token'];
      const isLoggedIn = !!session;
      const extensionEnabled = result.extensionEnabled !== false;
      sendResponse({ isLoggedIn, extensionEnabled });
    });
    return true; // Indique qu'on va répondre de manière asynchrone
  }
});

// Quand l'extension est installée ou mise à jour
chrome.runtime.onInstalled.addListener(() => {
  console.log('Alcentric extension installed');
  // Activer l'extension par défaut
  chrome.storage.local.get(['extensionEnabled'], (result) => {
    if (result.extensionEnabled === undefined) {
      chrome.storage.local.set({ extensionEnabled: true });
    }
  });
});
