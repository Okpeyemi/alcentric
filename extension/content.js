// Content script pour injecter le bouton Alcentric sur toutes les pages

let alcentricButton = null;
let alcentricPanel = null;
let isPanelOpen = false;
let isLoggedIn = false;
let extensionEnabled = true;
const PANEL_WIDTH = 380;

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

// Supprimer le bouton et le panel
function removeButton() {
  if (alcentricButton) {
    alcentricButton.remove();
    alcentricButton = null;
  }
  if (alcentricPanel) {
    alcentricPanel.remove();
    alcentricPanel = null;
    document.body.style.width = '';
    document.body.style.overflow = '';
  }
  isPanelOpen = false;
}

// Créer le panel (style DevTools)
function createPanel() {
  if (alcentricPanel) return;
  
  alcentricPanel = document.createElement('div');
  alcentricPanel.id = 'alcentric-panel';
  alcentricPanel.innerHTML = `
    <div class="alcentric-panel-header">
      <div class="alcentric-panel-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
          <path d="M2 12h20"/>
        </svg>
        <span>Alcentric</span>
      </div>
      <button id="alcentric-close-btn" class="alcentric-panel-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="alcentric-panel-content">
      <p class="alcentric-panel-welcome">Bienvenue sur Alcentric !</p>
      <p class="alcentric-panel-description">Le contenu de ce panel sera personnalisé selon vos besoins.</p>
      
      <div class="alcentric-panel-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
        <span>Zone de contenu</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(alcentricPanel);
  
  // Event listener pour le bouton fermer
  document.getElementById('alcentric-close-btn').addEventListener('click', closePanel);
}

// Ouvrir le panel (pousse le contenu)
function openPanel() {
  if (!alcentricPanel) createPanel();
  
  isPanelOpen = true;
  
  // Pousser le contenu de la page vers la gauche
  document.body.style.width = `calc(100% - ${PANEL_WIDTH}px)`;
  document.body.style.overflow = 'auto';
  
  alcentricPanel.classList.add('open');
  alcentricButton.classList.add('shifted');
}

// Fermer le panel
function closePanel() {
  if (!alcentricPanel) return;
  
  isPanelOpen = false;
  
  // Remettre le contenu à sa place
  document.body.style.width = '';
  document.body.style.overflow = '';
  
  alcentricPanel.classList.remove('open');
  alcentricButton.classList.remove('shifted');
}

// Gérer le clic sur le bouton
function handleButtonClick() {
  if (isPanelOpen) {
    closePanel();
  } else {
    openPanel();
  }
}

// Afficher une notification temporaire
function showNotification(message) {
  const notification = document.createElement('div');
  notification.id = 'alcentric-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Animation d'entrée
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Supprimer après 3 secondes
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Mettre à jour l'affichage du bouton
function updateButtonVisibility() {
  if (isLoggedIn && extensionEnabled) {
    createButton();
  } else {
    removeButton();
  }
}

// Vérifier l'état initial
function checkInitialState() {
  chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, (response) => {
    if (response) {
      isLoggedIn = response.isLoggedIn;
      extensionEnabled = response.extensionEnabled;
      updateButtonVisibility();
    }
  });
}

// Écouter les messages du background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    isLoggedIn = message.isLoggedIn;
    updateButtonVisibility();
  }
  
  if (message.type === 'EXTENSION_TOGGLE') {
    extensionEnabled = message.enabled;
    updateButtonVisibility();
  }
});

// Initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkInitialState);
} else {
  checkInitialState();
}
