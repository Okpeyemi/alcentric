// Configuration
const API_BASE_URL = 'http://localhost:3000';
const SESSION_CHECK_INTERVAL = 30000; // Vérifier la session toutes les 30 secondes

// État
let chatMessages = [];
let isStreaming = false;
let currentUser = null;
let sessionCheckTimer = null;

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

async function sendMessage(content) {
  if (isStreaming || !content.trim()) return;
  isStreaming = true;
  sendBtn.disabled = true;
  chatInput.disabled = true;
  
  chatMessages.push({ role: 'user', content });
  chatMessagesEl.appendChild(createMessageElement('user', content));
  scrollToBottom();
  
  const typingEl = createTypingIndicator();
  chatMessagesEl.appendChild(typingEl);
  scrollToBottom();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatMessages }),
    });
    
    if (!response.ok) throw new Error('Erreur serveur');
    typingEl.remove();
    
    const assistantMessageEl = createMessageElement('assistant', '');
    const contentEl = assistantMessageEl.querySelector('.message-content p');
    chatMessagesEl.appendChild(assistantMessageEl);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              assistantContent += data.content;
              contentEl.innerHTML = escapeHtml(assistantContent);
              scrollToBottom();
            }
          } catch (e) {}
        }
      }
    }
    chatMessages.push({ role: 'assistant', content: assistantContent });
  } catch (error) {
    typingEl.remove();
    const errorEl = createMessageElement('assistant', 'Erreur de connexion. Vérifiez que le serveur est lancé.');
    errorEl.classList.add('error');
    chatMessagesEl.appendChild(errorEl);
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
