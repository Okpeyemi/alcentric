// Configuration
const SUPABASE_URL = 'https://mijsxpskfzapjjyajrtm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1panN4cHNrZnphcGpqeWFqcnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDYxMTYsImV4cCI6MjA4MDY4MjExNn0.RZnZ7R1aWj4OhsPsbzD1OPLbsoiNVhbrU3IpP9us_lM';
const API_BASE_URL = 'http://localhost:3000';

// État du chat
let chatMessages = [];
let isStreaming = false;

// Initialiser Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            resolve(result[key] || null);
          });
        });
      },
      setItem: (key, value) => {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => {
            resolve();
          });
        });
      },
      removeItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove([key], () => {
            resolve();
          });
        });
      }
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Éléments DOM
const loadingEl = document.getElementById('loading');
const loginFormEl = document.getElementById('login-form');
const registerFormEl = document.getElementById('register-form');
const loggedInEl = document.getElementById('logged-in');
const authForm = document.getElementById('auth-form');
const registerAuthForm = document.getElementById('register-auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerConfirmInput = document.getElementById('register-confirm');
const submitBtn = document.getElementById('submit-btn');
const registerSubmitBtn = document.getElementById('register-submit-btn');
const errorMessage = document.getElementById('error-message');
const registerErrorMessage = document.getElementById('register-error-message');
const registerSuccessMessage = document.getElementById('register-success-message');
const logoutBtn = document.getElementById('logout-btn');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
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
  loginFormEl.classList.add('hidden');
  registerFormEl.classList.add('hidden');
  loggedInEl.classList.add('hidden');
  
  if (state === 'loading') loadingEl.classList.remove('hidden');
  else if (state === 'login') loginFormEl.classList.remove('hidden');
  else if (state === 'register') registerFormEl.classList.remove('hidden');
  else if (state === 'logged-in') loggedInEl.classList.remove('hidden');
}

function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

function hideError(element) {
  element.classList.add('hidden');
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

// Vérifier l'état de connexion
async function checkAuth() {
  showState('loading');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      userEmailEl.textContent = session.user.email;
      showState('logged-in');
    } else {
      showState('login');
    }
  } catch (error) {
    console.error('Erreur auth:', error);
    showState('login');
  }
}

// Connexion
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(errorMessage);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Connexion...';
  
  const email = emailInput.value;
  const password = passwordInput.value;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      showError(errorMessage, error.message);
    } else {
      userEmailEl.textContent = data.user.email;
      showState('logged-in');
    }
  } catch (error) {
    showError(errorMessage, 'Une erreur est survenue');
  }
  
  submitBtn.disabled = false;
  submitBtn.textContent = 'Se connecter';
});

// Inscription
registerAuthForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(registerErrorMessage);
  registerSuccessMessage.classList.add('hidden');
  registerSubmitBtn.disabled = true;
  registerSubmitBtn.textContent = 'Inscription...';
  
  const email = registerEmailInput.value;
  const password = registerPasswordInput.value;
  const confirm = registerConfirmInput.value;
  
  if (password !== confirm) {
    showError(registerErrorMessage, 'Les mots de passe ne correspondent pas');
    registerSubmitBtn.disabled = false;
    registerSubmitBtn.textContent = "S'inscrire";
    return;
  }
  
  if (password.length < 6) {
    showError(registerErrorMessage, 'Le mot de passe doit contenir au moins 6 caractères');
    registerSubmitBtn.disabled = false;
    registerSubmitBtn.textContent = "S'inscrire";
    return;
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      showError(registerErrorMessage, error.message);
    } else {
      registerSuccessMessage.textContent = 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.';
      registerSuccessMessage.classList.remove('hidden');
      registerAuthForm.reset();
    }
  } catch (error) {
    showError(registerErrorMessage, 'Une erreur est survenue');
  }
  
  registerSubmitBtn.disabled = false;
  registerSubmitBtn.textContent = "S'inscrire";
});

// Déconnexion
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  resetChat();
  showState('login');
});

// Switch entre login et register
switchToRegister.addEventListener('click', (e) => {
  e.preventDefault();
  showState('register');
});

switchToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showState('login');
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

// Initialisation
checkAuth();
