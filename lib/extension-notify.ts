export function notifyExtension(isLoggedIn: boolean) {
  // Envoyer un événement personnalisé que le content script peut écouter
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('alcentric-auth-change', { 
        detail: { isLoggedIn } 
      })
    )
  }
}
