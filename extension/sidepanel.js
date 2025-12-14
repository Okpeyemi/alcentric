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

// Parser le Markdown en HTML sécurisé
function parseMarkdown(text) {
  if (typeof marked !== 'undefined') {
    // Configurer marked pour la sécurité
    marked.setOptions({
      breaks: true, // Convertir les retours à la ligne en <br>
      gfm: true,    // GitHub Flavored Markdown
    });
    return marked.parse(text);
  }
  // Fallback si marked n'est pas chargé
  return escapeHtml(text);
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
  
  // Utiliser Markdown pour les messages assistant, escapeHtml pour les messages utilisateur
  const formattedContent = role === 'assistant' ? parseMarkdown(content) : `<p>${escapeHtml(content)}</p>`;
  
  messageDiv.innerHTML = `<div class="message-avatar">${avatarSvg}</div><div class="message-content">${formattedContent}</div>`;
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

// Vérifier si la page actuelle est un PDF
async function checkIfPdf() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url || '';
        const title = tabs[0].title || '';
        const isPdf = url.toLowerCase().endsWith('.pdf') || 
                      url.includes('blob:') && title.toLowerCase().includes('.pdf') ||
                      document.contentType === 'application/pdf';
        resolve({ isPdf, url, title });
      } else {
        resolve({ isPdf: false, url: '', title: '' });
      }
    });
  });
}

// Extraire le contenu d'un PDF via l'API serveur
async function extractPdfContent(pdfUrl) {
  console.log('[Alcentric] Extracting PDF content via API:', pdfUrl);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: pdfUrl })
    });
    
    const result = await response.json();
    console.log('[Alcentric] PDF extraction response:', result);
    return result;
  } catch (error) {
    console.error('[Alcentric] PDF extraction error:', error);
    return { success: false, error: error.message };
  }
}

// Récupérer le contexte complet (page normale ou PDF)
async function getFullContext() {
  // Vérifier si c'est un PDF
  const pdfCheck = await checkIfPdf();
  
  if (pdfCheck.isPdf) {
    console.log('[Alcentric] PDF detected, extracting content from:', pdfCheck.url);
    
    // Extraire le contenu du PDF via l'API serveur
    const pdfResult = await extractPdfContent(pdfCheck.url);
    
    if (pdfResult?.success) {
      // Construire un contexte de page à partir du PDF
      return {
        pageContext: {
          metadata: {
            url: pdfResult.url,
            title: pdfResult.metadata?.title || pdfCheck.title || 'Document PDF',
            description: `PDF de ${pdfResult.numPages} pages`,
            keywords: '',
            language: '',
            domain: new URL(pdfResult.url).hostname
          },
          content: pdfResult.fullText,
          pdfInfo: {
            isPdfPage: true,
            numPages: pdfResult.numPages,
            extractedPages: pdfResult.extractedPages,
            metadata: pdfResult.metadata,
            textLength: pdfResult.textLength
          },
          interactiveElements: [],
          formFields: [],
          images: [],
          videos: [],
          timestamp: new Date().toISOString()
        },
        selectedText: ''
      };
    } else {
      console.log('[Alcentric] PDF extraction failed:', pdfResult?.error);
      // Retourner un contexte minimal avec l'erreur
      return {
        pageContext: {
          metadata: {
            url: pdfCheck.url,
            title: pdfCheck.title || 'Document PDF',
            description: 'PDF - extraction impossible',
            keywords: '',
            language: '',
            domain: pdfCheck.url ? new URL(pdfCheck.url).hostname : ''
          },
          content: `[Ce document est un PDF. L'extraction du texte a échoué: ${pdfResult?.error || 'erreur inconnue'}]`,
          pdfInfo: {
            isPdfPage: true,
            extractionFailed: true,
            error: pdfResult?.error
          },
          timestamp: new Date().toISOString()
        },
        selectedText: ''
      };
    }
  }
  
  // Page normale - utiliser la méthode standard
  const pageContext = await getPageContext();
  const selectedText = await getSelectedText();
  
  return {
    pageContext,
    selectedText
  };
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

// Exécuter une action sur la page via le background script
async function executePageAction(action) {
  console.log('[Alcentric] Sending action to background:', action);
  
  return new Promise((resolve) => {
    const message = {
      type: action.actionType,
      ...action.params
    };
    
    console.log('[Alcentric] Message to send:', message);
    
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Alcentric] Chrome runtime error:', chrome.runtime.lastError);
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      console.log('[Alcentric] Action response:', response);
      resolve(response || { success: false, error: 'Pas de réponse du content script' });
    });
  });
}

// Fonction de test pour vérifier que les actions fonctionnent
async function testFillInput(selector, value) {
  console.log('[Alcentric] Test fill input:', selector, value);
  const result = await executePageAction({
    actionType: 'FILL_INPUT',
    params: { selector, value }
  });
  console.log('[Alcentric] Test result:', result);
  return result;
}

// Exposer pour debug dans la console
window.alcentricTest = {
  fillInput: testFillInput,
  executeAction: executePageAction
};

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
  const executedActions = []; // Pour suivre les actions exécutées
  
  try {
    // Récupérer le contexte complet (page normale ou PDF)
    const context = await getFullContext();
    console.log('[Alcentric] Context retrieved:', context.pageContext?.pdfInfo ? 'PDF' : 'Normal page');
    
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
    
    // Créer l'élément de message assistant pour le streaming
    assistantMessageEl = document.createElement('div');
    assistantMessageEl.className = 'message assistant';
    assistantMessageEl.innerHTML = `<div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div><div class="message-content"></div>`;
    contentEl = assistantMessageEl.querySelector('.message-content');
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
                  contentEl.innerHTML = parseMarkdown(assistantContent);
                  scrollToBottom();
                }
              } else if (data.type === 'action' && data.action) {
                // Exécuter l'action sur la page
                console.log('Executing action:', data.action);
                const actionResult = await executePageAction(data.action);
                executedActions.push({
                  action: data.action,
                  result: actionResult
                });
                console.log('Action result:', actionResult);
              } else if (data.type === 'error') {
                console.error('API Error:', data.content);
                if (!responseReceived) {
                  assistantContent = data.content || 'Une erreur est survenue.';
                  if (contentEl) {
                    contentEl.innerHTML = parseMarkdown(assistantContent);
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
            contentEl.innerHTML = parseMarkdown(assistantContent);
          }
        }
      } catch (e) {}
    }
    
    // Ajouter la réponse de l'assistant à l'historique seulement si on a reçu du contenu
    if (assistantContent.trim()) {
      chatMessages.push({ role: 'assistant', content: assistantContent });
      // Re-render avec Markdown complet à la fin
      if (contentEl) {
        contentEl.innerHTML = parseMarkdown(assistantContent);
      }
    } else {
      // Si pas de contenu, afficher un message par défaut et l'ajouter à l'historique
      assistantContent = "Je n'ai pas pu générer de réponse. Pouvez-vous reformuler votre question ?";
      if (contentEl) {
        contentEl.innerHTML = parseMarkdown(assistantContent);
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
