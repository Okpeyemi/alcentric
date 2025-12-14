// Background service worker pour l'extension Alcentric

// Ouvrir le Side Panel quand on clique sur l'icône de l'extension
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Écouter les messages des content scripts et du sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }
  
  // Récupérer le contenu de la page active
  if (message.type === 'GET_ACTIVE_TAB_CONTENT') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        try {
          const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTENT' });
          sendResponse(response);
        } catch (error) {
          sendResponse({ success: false, error: 'Impossible de communiquer avec la page' });
        }
      } else {
        sendResponse({ success: false, error: 'Aucun onglet actif trouvé' });
      }
    });
    return true; // Indique une réponse asynchrone
  }
  
  // Récupérer le texte sélectionné de la page active
  if (message.type === 'GET_SELECTED_TEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        try {
          const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SELECTED_TEXT' });
          sendResponse(response);
        } catch (error) {
          sendResponse({ success: false, error: 'Impossible de communiquer avec la page' });
        }
      } else {
        sendResponse({ success: false, error: 'Aucun onglet actif trouvé' });
      }
    });
    return true; // Indique une réponse asynchrone
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
