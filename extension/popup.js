// Configuration Supabase
const SUPABASE_URL = 'https://mijsxpskfzapjjyajrtm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1panN4cHNrZnphcGpqeWFqcnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDYxMTYsImV4cCI6MjA4MDY4MjExNn0.RZnZ7R1aWj4OhsPsbzD1OPLbsoiNVhbrU3IpP9us_lM';

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
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const extensionToggle = document.getElementById('extension-toggle');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');

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

// Vérifier l'état de connexion
async function checkAuth() {
  showState('loading');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      userEmailEl.textContent = session.user.email;
      showState('logged-in');
      
      // Charger l'état du toggle
      chrome.storage.local.get(['extensionEnabled'], (result) => {
        extensionToggle.checked = result.extensionEnabled !== false;
      });
      
      // Notifier le background script
      chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isLoggedIn: true });
    } else {
      showState('login');
      chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isLoggedIn: false });
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
      
      // Notifier le background et les content scripts
      chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isLoggedIn: true });
      
      // Activer l'extension par défaut
      chrome.storage.local.set({ extensionEnabled: true });
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
  chrome.storage.local.remove(['extensionEnabled']);
  chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isLoggedIn: false });
  showState('login');
});

// Toggle extension
extensionToggle.addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ extensionEnabled: enabled });
  chrome.runtime.sendMessage({ type: 'EXTENSION_TOGGLE', enabled });
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

// Initialisation
checkAuth();
