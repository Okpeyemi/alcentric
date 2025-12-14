// Content script pour injecter le bouton Alcentric sur toutes les pages

let alcentricButton = null;

// Créer le bouton flottant
function createButton() {
  if (alcentricButton) return;
  
  alcentricButton = document.createElement('div');
  alcentricButton.id = 'alcentric-floating-button';
  alcentricButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  `;
  
  alcentricButton.addEventListener('click', handleButtonClick);
  document.body.appendChild(alcentricButton);
}

// Supprimer le bouton
function removeButton() {
  if (alcentricButton) {
    alcentricButton.remove();
    alcentricButton = null;
  }
}

// Gérer le clic sur le bouton - ouvre le Side Panel
function handleButtonClick() {
  chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
}

// Extraire le contenu textuel de la page de manière intelligente
function extractPageContent() {
  // Supprimer les éléments non pertinents pour l'extraction
  const elementsToIgnore = ['script', 'style', 'noscript', 'svg', 'path', 'iframe', 'nav', 'footer', 'header'];
  
  // Cloner le body pour ne pas modifier la page
  const bodyClone = document.body.cloneNode(true);
  
  // Supprimer les éléments non pertinents
  elementsToIgnore.forEach(tag => {
    bodyClone.querySelectorAll(tag).forEach(el => el.remove());
  });
  
  // Supprimer aussi les éléments cachés et notre propre bouton
  bodyClone.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], [hidden], #alcentric-floating-button').forEach(el => el.remove());
  
  // Extraire le texte
  let text = bodyClone.innerText || bodyClone.textContent || '';
  
  // Nettoyer le texte (supprimer les espaces multiples, lignes vides excessives)
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Limiter la taille du contenu (environ 15000 caractères pour rester dans les limites)
  const maxLength = 15000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '... [contenu tronqué]';
  }
  
  return text;
}

// Extraire les métadonnées de la page
function extractPageMetadata() {
  const metadata = {
    url: window.location.href,
    title: document.title,
    description: '',
    keywords: '',
    language: document.documentElement.lang || 'unknown',
    domain: window.location.hostname
  };
  
  // Récupérer la meta description
  const descMeta = document.querySelector('meta[name="description"]') || 
                   document.querySelector('meta[property="og:description"]');
  if (descMeta) {
    metadata.description = descMeta.getAttribute('content') || '';
  }
  
  // Récupérer les keywords
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta) {
    metadata.keywords = keywordsMeta.getAttribute('content') || '';
  }
  
  return metadata;
}

// Extraire les éléments interactifs de la page
function extractInteractiveElements() {
  const elements = [];
  
  // Boutons
  document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]').forEach((el, index) => {
    if (index < 20) { // Limiter à 20 boutons
      elements.push({
        type: 'button',
        text: el.textContent?.trim().substring(0, 50) || el.value || 'Bouton sans texte',
        id: el.id || null,
        class: el.className || null
      });
    }
  });
  
  // Liens principaux
  document.querySelectorAll('a[href]').forEach((el, index) => {
    if (index < 30) { // Limiter à 30 liens
      const text = el.textContent?.trim().substring(0, 50);
      if (text && text.length > 2) {
        elements.push({
          type: 'link',
          text: text,
          href: el.href
        });
      }
    }
  });
  
  // Champs de formulaire
  document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach((el, index) => {
    if (index < 15) { // Limiter à 15 champs
      elements.push({
        type: 'input',
        inputType: el.type || el.tagName.toLowerCase(),
        placeholder: el.placeholder || null,
        label: el.labels?.[0]?.textContent?.trim() || el.name || el.id || null
      });
    }
  });
  
  return elements;
}

// Extraire les images avec texte alternatif
function extractImages() {
  const images = [];
  document.querySelectorAll('img[alt]').forEach((img, index) => {
    if (index < 10 && img.alt) { // Limiter à 10 images
      images.push({
        alt: img.alt.substring(0, 100),
        src: img.src?.substring(0, 200)
      });
    }
  });
  return images;
}

// Fonction principale pour obtenir toutes les informations de la page
function getFullPageContext() {
  return {
    metadata: extractPageMetadata(),
    content: extractPageContent(),
    interactiveElements: extractInteractiveElements(),
    images: extractImages(),
    timestamp: new Date().toISOString()
  };
}

// Écouter les demandes du sidepanel ou background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_CONTENT') {
    try {
      const pageContext = getFullPageContext();
      sendResponse({ success: true, data: pageContext });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true; // Indique une réponse asynchrone
  }
  
  if (message.type === 'GET_SELECTED_TEXT') {
    const selectedText = window.getSelection()?.toString() || '';
    sendResponse({ success: true, data: selectedText });
    return true;
  }
});

// Écouter les événements d'authentification depuis le site
window.addEventListener('alcentric-auth-change', (event) => {
  const { isLoggedIn } = event.detail;
  // Notifier le background script qui relayera au side panel
  chrome.runtime.sendMessage({ 
    type: 'AUTH_STATE_CHANGED', 
    isLoggedIn 
  });
});

// Initialisation - afficher le bouton directement
function init() {
  createButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
