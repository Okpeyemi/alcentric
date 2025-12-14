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

// Extraire les images avec plus de détails
function extractImages() {
  const images = [];
  
  // Images standards
  document.querySelectorAll('img').forEach((img, index) => {
    if (index < 20) {
      const imageInfo = {
        type: 'image',
        alt: img.alt || '',
        src: img.src?.substring(0, 300) || '',
        title: img.title || '',
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0
      };
      
      // Essayer de deviner le contenu de l'image par son nom
      const filename = img.src?.split('/').pop()?.split('?')[0] || '';
      if (filename) {
        imageInfo.filename = filename;
      }
      
      images.push(imageInfo);
    }
  });
  
  // Images en background CSS (principales)
  document.querySelectorAll('[style*="background-image"]').forEach((el, index) => {
    if (index < 5) {
      const style = el.getAttribute('style') || '';
      const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match) {
        images.push({
          type: 'background-image',
          src: match[1].substring(0, 300),
          alt: el.getAttribute('aria-label') || ''
        });
      }
    }
  });
  
  // SVGs
  document.querySelectorAll('svg[aria-label], svg title').forEach((svg, index) => {
    if (index < 5) {
      const label = svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || '';
      if (label) {
        images.push({
          type: 'svg',
          alt: label
        });
      }
    }
  });
  
  return images;
}

// Extraire les vidéos de la page
function extractVideos() {
  const videos = [];
  
  // Vidéos HTML5
  document.querySelectorAll('video').forEach((video, index) => {
    if (index < 10) {
      videos.push({
        type: 'video',
        src: video.src || video.querySelector('source')?.src || '',
        poster: video.poster || '',
        duration: video.duration || 0,
        title: video.title || video.getAttribute('aria-label') || ''
      });
    }
  });
  
  // Vidéos YouTube intégrées
  document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach((iframe, index) => {
    if (index < 10) {
      const src = iframe.src || '';
      const videoId = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^?&]+)/)?.[1] || '';
      videos.push({
        type: 'youtube',
        videoId: videoId,
        src: src,
        title: iframe.title || ''
      });
    }
  });
  
  // Vidéos Vimeo
  document.querySelectorAll('iframe[src*="vimeo"]').forEach((iframe, index) => {
    if (index < 5) {
      videos.push({
        type: 'vimeo',
        src: iframe.src || '',
        title: iframe.title || ''
      });
    }
  });
  
  return videos;
}

// Détecter si la page est un PDF
function detectPDF() {
  const url = window.location.href;
  const isPDFUrl = url.toLowerCase().endsWith('.pdf') || url.includes('pdf');
  
  // Vérifier si c'est un viewer PDF de Chrome
  const isPDFViewer = document.querySelector('embed[type="application/pdf"]') !== null ||
                      document.body?.classList.contains('pdf-viewer') ||
                      document.querySelector('pdf-viewer') !== null;
  
  // Essayer d'extraire le texte du PDF si possible
  let pdfContent = '';
  if (isPDFUrl || isPDFViewer) {
    // Le texte du PDF peut être dans le DOM pour certains viewers
    const textLayers = document.querySelectorAll('.textLayer span, .pdf-text, [data-text]');
    textLayers.forEach(span => {
      pdfContent += span.textContent + ' ';
    });
  }
  
  return {
    isPDF: isPDFUrl || isPDFViewer,
    url: url,
    extractedText: pdfContent.trim().substring(0, 10000)
  };
}

// Extraire les liens vers des fichiers/médias
function extractMediaLinks() {
  const mediaLinks = [];
  
  document.querySelectorAll('a[href]').forEach((link, index) => {
    if (index < 30) {
      const href = link.href.toLowerCase();
      const text = link.textContent?.trim() || '';
      
      // Détecter les types de fichiers
      if (href.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)(\?|$)/i)) {
        mediaLinks.push({
          type: 'document',
          href: link.href,
          text: text,
          fileType: href.match(/\.(\w+)(\?|$)/)?.[1] || ''
        });
      } else if (href.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i)) {
        mediaLinks.push({
          type: 'image-link',
          href: link.href,
          text: text
        });
      } else if (href.match(/\.(mp4|webm|avi|mov|mp3|wav|ogg)(\?|$)/i)) {
        mediaLinks.push({
          type: 'media-link',
          href: link.href,
          text: text
        });
      }
    }
  });
  
  return mediaLinks;
}

// ===== FONCTIONS D'INTERACTION AVEC LA PAGE =====

// Trouver un élément par différents critères
function findElement(selector) {
  // Essayer d'abord le sélecteur CSS direct
  let element = document.querySelector(selector);
  if (element) return element;
  
  // Essayer par ID
  element = document.getElementById(selector);
  if (element) return element;
  
  // Essayer par name
  element = document.querySelector(`[name="${selector}"]`);
  if (element) return element;
  
  // Essayer par placeholder
  element = document.querySelector(`[placeholder*="${selector}" i]`);
  if (element) return element;
  
  // Essayer par label
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    if (label.textContent.toLowerCase().includes(selector.toLowerCase())) {
      const forId = label.getAttribute('for');
      if (forId) {
        element = document.getElementById(forId);
        if (element) return element;
      }
      // Chercher un input enfant du label
      element = label.querySelector('input, textarea, select');
      if (element) return element;
    }
  }
  
  // Essayer par aria-label
  element = document.querySelector(`[aria-label*="${selector}" i]`);
  if (element) return element;
  
  // Essayer par texte du bouton
  const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
  for (const btn of buttons) {
    if (btn.textContent?.toLowerCase().includes(selector.toLowerCase()) ||
        btn.value?.toLowerCase().includes(selector.toLowerCase())) {
      return btn;
    }
  }
  
  // Essayer par texte du lien
  const links = document.querySelectorAll('a');
  for (const link of links) {
    if (link.textContent?.toLowerCase().includes(selector.toLowerCase())) {
      return link;
    }
  }
  
  return null;
}

// Remplir un champ de formulaire
function fillInput(selector, value) {
  console.log('[Alcentric CS] fillInput called:', selector, value);
  
  const element = findElement(selector);
  if (!element) {
    console.error('[Alcentric CS] Element not found:', selector);
    return { success: false, error: `Élément "${selector}" non trouvé` };
  }
  
  console.log('[Alcentric CS] Element found:', element.tagName, element);
  
  // Vérifier si c'est un élément éditable
  const tagName = element.tagName.toLowerCase();
  const type = element.type?.toLowerCase();
  
  if (tagName === 'input' || tagName === 'textarea') {
    // Scroll vers l'élément
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Focus sur l'élément
    element.focus();
    
    // Effacer la valeur existante
    element.value = '';
    
    // Simuler une saisie caractère par caractère pour les frameworks réactifs
    // Utiliser le setter natif pour contourner les problèmes avec React/Vue
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }
    
    // Déclencher TOUS les événements possibles pour les frameworks JS
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
    element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // Aussi déclencher un InputEvent pour les frameworks modernes
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: value
    }));
    
    console.log('[Alcentric CS] Field filled successfully:', element.value);
    return { success: true, message: `Champ "${selector}" rempli avec "${value}"` };
  }
  
  if (tagName === 'select') {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
    
    // Pour les select, chercher l'option correspondante
    const options = element.querySelectorAll('option');
    let found = false;
    
    for (const option of options) {
      if (option.value.toLowerCase() === value.toLowerCase() ||
          option.textContent?.toLowerCase().includes(value.toLowerCase())) {
        element.value = option.value;
        found = true;
        break;
      }
    }
    
    if (found) {
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[Alcentric CS] Select option set:', element.value);
      return { success: true, message: `Option "${value}" sélectionnée dans "${selector}"` };
    } else {
      return { success: false, error: `Option "${value}" non trouvée dans le select "${selector}"` };
    }
  }
  
  // Pour les éléments contenteditable
  if (element.contentEditable === 'true') {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('[Alcentric CS] ContentEditable filled');
    return { success: true, message: `Contenu "${selector}" modifié` };
  }
  
  return { success: false, error: `L'élément "${selector}" n'est pas éditable` };
}

// Cliquer sur un élément
function clickElement(selector) {
  console.log('[Alcentric CS] clickElement called:', selector);
  
  const element = findElement(selector);
  if (!element) {
    console.error('[Alcentric CS] Element not found for click:', selector);
    return { success: false, error: `Élément "${selector}" non trouvé` };
  }
  
  console.log('[Alcentric CS] Element found for click:', element.tagName, element);
  
  // Scroll vers l'élément
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Simuler un vrai clic avec tous les événements
  element.focus();
  
  // Créer et dispatcher les événements de souris
  const mouseEvents = ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click'];
  mouseEvents.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      buttons: 1
    });
    element.dispatchEvent(event);
  });
  
  // Pour les liens, forcer la navigation si nécessaire
  if (element.tagName.toLowerCase() === 'a' && element.href) {
    console.log('[Alcentric CS] Link clicked, href:', element.href);
  }
  
  // Pour les boutons de type submit
  if (element.type === 'submit') {
    const form = element.closest('form');
    if (form) {
      console.log('[Alcentric CS] Submit button clicked, submitting form');
      form.requestSubmit ? form.requestSubmit(element) : form.submit();
    }
  }
  
  console.log('[Alcentric CS] Click completed on:', selector);
  return { success: true, message: `Clic effectué sur "${selector}"` };
}

// Remplir plusieurs champs à la fois
function fillMultipleInputs(fields) {
  const results = [];
  
  for (const field of fields) {
    const result = fillInput(field.selector, field.value);
    results.push({
      selector: field.selector,
      ...result
    });
  }
  
  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount > 0,
    message: `${successCount}/${results.length} champs remplis`,
    details: results
  };
}

// Obtenir la liste détaillée des champs de formulaire
function getFormFields() {
  const fields = [];
  
  document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach((el, index) => {
    const label = el.labels?.[0]?.textContent?.trim() || 
                  el.placeholder || 
                  el.name || 
                  el.id ||
                  el.getAttribute('aria-label') ||
                  `Champ ${index + 1}`;
    
    const field = {
      index: index,
      type: el.type || el.tagName.toLowerCase(),
      label: label,
      id: el.id || null,
      name: el.name || null,
      placeholder: el.placeholder || null,
      value: el.value || '',
      required: el.required || false,
      disabled: el.disabled || false
    };
    
    // Pour les selects, ajouter les options
    if (el.tagName.toLowerCase() === 'select') {
      field.options = Array.from(el.options).map(opt => ({
        value: opt.value,
        text: opt.textContent?.trim()
      }));
    }
    
    fields.push(field);
  });
  
  return fields;
}

// Soumettre un formulaire
function submitForm(formSelector) {
  let form = null;
  
  if (formSelector) {
    form = findElement(formSelector);
  } else {
    // Trouver le premier formulaire de la page
    form = document.querySelector('form');
  }
  
  if (!form) {
    // Essayer de trouver et cliquer sur un bouton submit
    const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button:contains("Submit"), button:contains("Envoyer")');
    if (submitBtn) {
      submitBtn.click();
      return { success: true, message: 'Bouton de soumission cliqué' };
    }
    return { success: false, error: 'Aucun formulaire trouvé' };
  }
  
  if (form.tagName.toLowerCase() === 'form') {
    form.submit();
    return { success: true, message: 'Formulaire soumis' };
  } else {
    // Si c'est un bouton, cliquer dessus
    form.click();
    return { success: true, message: 'Élément cliqué' };
  }
}

// Cocher/décocher une checkbox ou radio
function toggleCheckbox(selector, checked) {
  const element = findElement(selector);
  if (!element) {
    return { success: false, error: `Élément "${selector}" non trouvé` };
  }
  
  if (element.type === 'checkbox' || element.type === 'radio') {
    element.checked = checked;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return { success: true, message: `${element.type} "${selector}" ${checked ? 'coché' : 'décoché'}` };
  }
  
  return { success: false, error: `L'élément "${selector}" n'est pas une checkbox ou radio` };
}

// Faire défiler la page
function scrollPage(direction, amount) {
  const scrollAmount = amount || 500;
  
  if (direction === 'up') {
    window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
  } else if (direction === 'down') {
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  } else if (direction === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (direction === 'bottom') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
  
  return { success: true, message: `Page scrollée ${direction}` };
}

// Fonction principale pour obtenir toutes les informations de la page
function getFullPageContext() {
  return {
    metadata: extractPageMetadata(),
    content: extractPageContent(),
    interactiveElements: extractInteractiveElements(),
    formFields: getFormFields(), // Ajout des champs de formulaire détaillés
    images: extractImages(),
    videos: extractVideos(), // Vidéos HTML5, YouTube, Vimeo
    pdfInfo: detectPDF(), // Détection de PDF
    mediaLinks: extractMediaLinks(), // Liens vers documents et médias
    timestamp: new Date().toISOString()
  };
}

// Écouter les demandes du sidepanel ou background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Alcentric CS] Message received:', message.type, message);
  
  if (message.type === 'GET_PAGE_CONTENT') {
    try {
      const pageContext = getFullPageContext();
      sendResponse({ success: true, data: pageContext });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  if (message.type === 'GET_SELECTED_TEXT') {
    const selectedText = window.getSelection()?.toString() || '';
    sendResponse({ success: true, data: selectedText });
    return true;
  }
  
  // ===== ACTIONS SUR LA PAGE =====
  
  if (message.type === 'FILL_INPUT') {
    const result = fillInput(message.selector, message.value);
    sendResponse(result);
    return true;
  }
  
  if (message.type === 'FILL_MULTIPLE_INPUTS') {
    const result = fillMultipleInputs(message.fields);
    sendResponse(result);
    return true;
  }
  
  if (message.type === 'CLICK_ELEMENT') {
    const result = clickElement(message.selector);
    sendResponse(result);
    return true;
  }
  
  if (message.type === 'SUBMIT_FORM') {
    const result = submitForm(message.formSelector);
    sendResponse(result);
    return true;
  }
  
  if (message.type === 'TOGGLE_CHECKBOX') {
    const result = toggleCheckbox(message.selector, message.checked);
    sendResponse(result);
    return true;
  }
  
  if (message.type === 'SCROLL_PAGE') {
    const result = scrollPage(message.direction, message.amount);
    sendResponse(result);
    return true;
  }
  
  if (message.type === 'GET_FORM_FIELDS') {
    const fields = getFormFields();
    sendResponse({ success: true, data: fields });
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
