// Background service worker pour l'extension Alcentric

// Ouvrir le Side Panel quand on clique sur l'icône de l'extension
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Helper pour envoyer un message à l'onglet actif
async function sendToActiveTab(message) {
  console.log('[Alcentric BG] Sending to active tab:', message);
  
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      console.log('[Alcentric BG] Active tabs found:', tabs.length);
      
      if (!tabs[0]?.id) {
        console.error('[Alcentric BG] No active tab found');
        resolve({ success: false, error: 'Aucun onglet actif trouvé' });
        return;
      }
      
      const tabId = tabs[0].id;
      const tabUrl = tabs[0].url || '';
      
      // Vérifier si on peut injecter dans cette page
      if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('chrome-extension://') || tabUrl.startsWith('about:')) {
        console.error('[Alcentric BG] Cannot interact with system page:', tabUrl);
        resolve({ success: false, error: 'Impossible d\'interagir avec cette page (page système)' });
        return;
      }
      
      try {
        const response = await chrome.tabs.sendMessage(tabId, message);
        console.log('[Alcentric BG] Response received:', response);
        resolve(response);
      } catch (error) {
        console.error('[Alcentric BG] Error sending message:', error.message);
        
        // Le content script n'est peut-être pas chargé, essayer de l'injecter
        console.log('[Alcentric BG] Trying to inject content script...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          });
          
          // Attendre un peu puis réessayer
          await new Promise(r => setTimeout(r, 200));
          const retryResponse = await chrome.tabs.sendMessage(tabId, message);
          console.log('[Alcentric BG] Retry response:', retryResponse);
          resolve(retryResponse);
        } catch (injectError) {
          console.error('[Alcentric BG] Injection failed:', injectError.message);
          resolve({ success: false, error: 'Rechargez la page puis réessayez.' });
        }
      }
    });
  });
}

// Écouter les messages des content scripts et du sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    return;
  }
  
  // Récupérer le contenu de la page active
  if (message.type === 'GET_ACTIVE_TAB_CONTENT') {
    sendToActiveTab({ type: 'GET_PAGE_CONTENT' }).then(sendResponse);
    return true;
  }
  
  // Récupérer le texte sélectionné
  if (message.type === 'GET_SELECTED_TEXT') {
    sendToActiveTab({ type: 'GET_SELECTED_TEXT' }).then(sendResponse);
    return true;
  }
  
  // ===== ACTIONS SUR LA PAGE =====
  
  // Remplir un champ
  if (message.type === 'FILL_INPUT') {
    sendToActiveTab({ 
      type: 'FILL_INPUT', 
      selector: message.selector, 
      value: message.value 
    }).then(sendResponse);
    return true;
  }
  
  // Remplir plusieurs champs
  if (message.type === 'FILL_MULTIPLE_INPUTS') {
    sendToActiveTab({ 
      type: 'FILL_MULTIPLE_INPUTS', 
      fields: message.fields 
    }).then(sendResponse);
    return true;
  }
  
  // Cliquer sur un élément
  if (message.type === 'CLICK_ELEMENT') {
    sendToActiveTab({ 
      type: 'CLICK_ELEMENT', 
      selector: message.selector 
    }).then(sendResponse);
    return true;
  }
  
  // Soumettre un formulaire
  if (message.type === 'SUBMIT_FORM') {
    sendToActiveTab({ 
      type: 'SUBMIT_FORM', 
      formSelector: message.formSelector 
    }).then(sendResponse);
    return true;
  }
  
  // Cocher/décocher une checkbox
  if (message.type === 'TOGGLE_CHECKBOX') {
    sendToActiveTab({ 
      type: 'TOGGLE_CHECKBOX', 
      selector: message.selector, 
      checked: message.checked 
    }).then(sendResponse);
    return true;
  }
  
  // Faire défiler la page
  if (message.type === 'SCROLL_PAGE') {
    sendToActiveTab({ 
      type: 'SCROLL_PAGE', 
      direction: message.direction, 
      amount: message.amount 
    }).then(sendResponse);
    return true;
  }
  
  // Obtenir les champs de formulaire
  if (message.type === 'GET_FORM_FIELDS') {
    sendToActiveTab({ type: 'GET_FORM_FIELDS' }).then(sendResponse);
    return true;
  }
});

// Écouter les messages externes (depuis le site web)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
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
