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

// Initialisation - afficher le bouton directement
function init() {
  createButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
