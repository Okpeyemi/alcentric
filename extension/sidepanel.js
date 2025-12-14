// Configuration
const API_BASE_URL = 'http://localhost:3000';
const SESSION_CHECK_INTERVAL = 30000; // Vérifier la session toutes les 30 secondes

// État
let chatMessages = [];
let isStreaming = false;
let currentUser = null;
let sessionCheckTimer = null;
let currentPageContext = null; // Contexte de la page actuelle

// Éléments DOM
const loadingEl = document.getElementById('loading');
const loginPromptEl = document.getElementById('login-prompt');
const loggedInEl = document.getElementById('logged-in');
const openLoginBtn = document.getElementById('open-login-btn');
const openRegisterLink = document.getElementById('open-register-link');
const logoutBtn = document.getElementById('logout-btn');
const chatMessagesEl = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.getElementById('profile-menu');
const userEmailEl = document.getElementById('user-email');

// Fonctions utilitaires
function showState(state) {
  loadingEl.classList.add('hidden');
  loginPromptEl.classList.add('hidden');
  loggedInEl.classList.add('hidden');
  
  if (state === 'loading') loadingEl.classList.remove('hidden');
  else if (state === 'login') loginPromptEl.classList.remove('hidden');
  else if (state === 'logged-in') loggedInEl.classList.remove('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function createMessageElement(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  const avatarSvg = role === 'assistant' 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`;
  messageDiv.innerHTML = `<div class="message-avatar">${avatarSvg}</div><div class="message-content"><p>${escapeHtml(content)}</p></div>`;
  return messageDiv;
}

function createTypingIndicator() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  messageDiv.id = 'typing-indicator';
  messageDiv.innerHTML = `<div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  return messageDiv;
}

// Récupérer le contexte de la page active via le background script
async function getPageContext() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_CONTENT' }, (response) => {
      if (response?.success) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    });
  });
}

// Récupérer le texte sélectionné
async function getSelectedText() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' }, (response) => {
      if (response?.success && response.data) {
        resolve(response.data);
      } else {
        resolve('');
      }
    });
  });
}

async function sendMessage(content) {
  if (isStreaming || !content.trim()) return;
  isStreaming = true;
  sendBtn.disabled = true;
  chatInput.disabled = true;
  
  // Ajouter le message utilisateur à l'historique AVANT d'envoyer
  const userMessage = { role: 'user', content: content.trim() };
  chatMessages.push(userMessage);
  chatMessagesEl.appendChild(createMessageElement('user', content));
  scrollToBottom();
  
  const typingEl = createTypingIndicator();
  chatMessagesEl.appendChild(typingEl);
  scrollToBottom();
  
  // Préparer le message assistant pour la réponse
  let assistantContent = '';
  let assistantMessageEl = null;
  let contentEl = null;
  let responseReceived = false;
  
  try {
    // Récupérer le contexte de la page actuelle
    const pageContext = await getPageContext();
    const selectedText = await getSelectedText();
    
    // Préparer le contexte à envoyer à l'API
    const context = {
      pageContext: pageContext,
      selectedText: selectedText
    };
    
    // Créer une copie des messages pour l'API (éviter les modifications pendant l'envoi)
    const messagesToSend = [...chatMessages];
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messagesToSend, context }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status}`);
    }
    
    typingEl.remove();
    
    // Créer l'élément de message assistant
    assistantMessageEl = createMessageElement('assistant', '');
    contentEl = assistantMessageEl.querySelector('.message-content p');
    chatMessagesEl.appendChild(assistantMessageEl);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // Buffer pour gérer les chunks fragmentés
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Ajouter au buffer et traiter
      buffer += decoder.decode(value, { stream: true });
      
      // Traiter les lignes complètes
      const lines = buffer.split('\n');
      // Garder la dernière ligne potentiellement incomplète dans le buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            if (jsonStr) {
              const data = JSON.parse(jsonStr);
              
              if (data.type === 'text' && data.content) {
                assistantContent += data.content;
                responseReceived = true;
                if (contentEl) {
                  contentEl.innerHTML = escapeHtml(assistantContent);
                  scrollToBottom();
                }
              } else if (data.type === 'error') {
                console.error('API Error:', data.content);
                if (!responseReceived) {
                  assistantContent = data.content || 'Une erreur est survenue.';
                  if (contentEl) {
                    contentEl.innerHTML = escapeHtml(assistantContent);
                  }
                }
              }
              // 'done' est géré par la fin du stream
            }
          } catch (parseError) {
            // Ignorer les erreurs de parsing silencieusement
            console.debug('Parse error:', parseError);
          }
        }
      }
    }
    
    // Traiter le reste du buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        if (data.type === 'text' && data.content) {
          assistantContent += data.content;
          responseReceived = true;
          if (contentEl) {
            contentEl.innerHTML = escapeHtml(assistantContent);
          }
        }
      } catch (e) {}
    }
    
    // Ajouter la réponse de l'assistant à l'historique seulement si on a reçu du contenu
    if (assistantContent.trim()) {
      chatMessages.push({ role: 'assistant', content: assistantContent });
    } else {
      // Si pas de contenu, afficher un message par défaut et l'ajouter à l'historique
      assistantContent = "Je n'ai pas pu générer de réponse. Pouvez-vous reformuler votre question ?";
      if (contentEl) {
        contentEl.innerHTML = escapeHtml(assistantContent);
      }
      chatMessages.push({ role: 'assistant', content: assistantContent });
    }
    
  } catch (error) {
    console.error('Send message error:', error);
    
    // Retirer l'indicateur de frappe s'il est encore présent
    if (typingEl.parentNode) {
      typingEl.remove();
    }
    
    // Si on avait commencé à afficher une réponse, la garder
    if (assistantContent.trim()) {
      chatMessages.push({ role: 'assistant', content: assistantContent });
    } else {
      // Sinon afficher une erreur
      const errorMessage = 'Erreur de connexion. Vérifiez que le serveur est lancé.';
      
      if (assistantMessageEl && contentEl) {
        contentEl.innerHTML = escapeHtml(errorMessage);
        assistantMessageEl.classList.add('error');
      } else {
        const errorEl = createMessageElement('assistant', errorMessage);
        errorEl.classList.add('error');
        chatMessagesEl.appendChild(errorEl);
      }
      
      // Retirer le dernier message utilisateur de l'historique en cas d'échec total
      // pour éviter un historique incohérent
      if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'user') {
        chatMessages.pop();
      }
    }
    
    scrollToBottom();
  }
  
  isStreaming = false;
  sendBtn.disabled = false;
  chatInput.disabled = false;
  chatInput.focus();
  updateSendButton();
}

function resetChat() {
  chatMessages = [];
  chatMessagesEl.innerHTML = `<div class="message assistant"><div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div><div class="message-content"><p>Bonjour ! Je suis Alcentric, votre assistant IA. Comment puis-je vous aider ?</p></div></div>`;
}

function updateSendButton() {
  sendBtn.disabled = !chatInput.value.trim() || isStreaming;
}

function autoResize() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
}

// Récupérer les cookies du site
async function getSiteCookies() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ url: API_BASE_URL }, (cookies) => {
      resolve(cookies);
    });
  });
}

// Vérifier la session via l'API du site
async function checkSession() {
  try {
    // Récupérer les cookies et les formater
    const cookies = await getSiteCookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': cookieHeader
      }
    });
    
    if (!response.ok) {
      throw new Error('Session check failed');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
}

// Vérifier l'état de connexion
async function checkAuth() {
  showState('loading');
  
  const user = await checkSession();
  
  if (user) {
    currentUser = user;
    userEmailEl.textContent = user.email;
    showState('logged-in');
    startSessionCheck();
  } else {
    currentUser = null;
    showState('login');
    stopSessionCheck();
  }
}

// Vérification périodique de la session
function startSessionCheck() {
  stopSessionCheck();
  sessionCheckTimer = setInterval(async () => {
    const user = await checkSession();
    if (!user && currentUser) {
      // L'utilisateur s'est déconnecté du site
      currentUser = null;
      resetChat();
      showState('login');
      stopSessionCheck();
    }
  }, SESSION_CHECK_INTERVAL);
}

function stopSessionCheck() {
  if (sessionCheckTimer) {
    clearInterval(sessionCheckTimer);
    sessionCheckTimer = null;
  }
}

// Ouvrir le site pour se connecter
openLoginBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE_URL}/login` });
});

openRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_BASE_URL}/register` });
});

// Déconnexion - ouvre le site pour se déconnecter
logoutBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE_URL}` });
  // La vérification périodique détectera la déconnexion
});

// Chat events
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const content = chatInput.value.trim();
  if (content) {
    chatInput.value = '';
    autoResize();
    sendMessage(content);
  }
});

chatInput.addEventListener('input', () => {
  updateSendButton();
  autoResize();
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

newChatBtn.addEventListener('click', resetChat);

// Profile dropdown
profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileMenu.classList.toggle('hidden');
});

// Fermer le dropdown en cliquant ailleurs
document.addEventListener('click', (e) => {
  if (!profileMenu.contains(e.target) && e.target !== profileBtn) {
    profileMenu.classList.add('hidden');
  }
});

// Écouter les messages du background (changement d'auth depuis le site)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    // Revérifier l'authentification immédiatement
    checkAuth();
  }
});

// Initialisation
checkAuth();
