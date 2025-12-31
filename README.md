# Alcentric

**Assistant IA contextuel pour navigateur** - Une extension Chrome avec application web qui permet d'interagir avec l'IA en comprenant le contexte de la page visitée.

![Alcentric](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green?style=flat-square&logo=supabase)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-orange?style=flat-square&logo=google)

## Fonctionnalités

### Chat Texte
- **Contexte de page complet** : métadonnées, contenu, formulaires, images, vidéos
- **Support PDF** : extraction et analyse du contenu des PDF
- **Actions sur la page** : remplissage de formulaires, clics, scroll
- **Historique de conversation** : synchronisé entre texte et vocal

### Chat Vocal
- **Reconnaissance vocale** : Web Speech API avec détection de fin de parole
- **Synthèse vocale** : ElevenLabs TTS (modèle turbo pour la rapidité)
- **Mode appel téléphone** : interface compacte et déplaçable
- **Synchronisation** : historique partagé avec le chat texte

### Extension Chrome
- **Bouton flottant** : accès rapide sur toutes les pages
- **Side panel** : interface de chat intégrée au navigateur
- **Contexte intelligent** : analyse automatique de la page visitée

## Architecture

```
alcentric/
├── app/                    # Application Next.js
│   ├── api/
│   │   ├── chat/          # API chat texte (Vertex AI)
│   │   ├── voice-chat-simple/  # API chat vocal (Google AI + ElevenLabs)
│   │   └── auth/          # Authentification Supabase
│   ├── login/             # Page de connexion
│   ├── register/          # Page d'inscription
│   └── page.tsx           # Page d'accueil
├── extension/             # Extension Chrome
│   ├── manifest.json      # Configuration de l'extension
│   ├── content.js         # Script injecté dans les pages
│   ├── sidepanel.js       # Interface du side panel
│   ├── background.js      # Service worker
│   └── *.css              # Styles
├── lib/                   # Utilitaires partagés
│   └── supabase/          # Client et middleware Supabase
└── config/                # Fichiers de configuration
```

## Prérequis

- **Node.js** 18+
- **pnpm** (ou npm/yarn)
- Compte **Google AI Studio** (gratuit) - pour l'IA
- Compte **ElevenLabs** (pour le chat vocal)
- ~~Compte **Supabase**~~ (optionnel - auth désactivée actuellement)

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/alcentric.git
cd alcentric
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplissez les valeurs **requises** dans `.env.local` :

| Variable | Requis | Description | Où l'obtenir |
|----------|--------|-------------|--------------|
| `GOOGLE_AI_API_KEY` | ✅ | Clé API Google AI Studio | [Google AI Studio](https://aistudio.google.com/apikey) |
| `ELEVENLABS_API_KEY` | ✅ | Clé API ElevenLabs | [ElevenLabs](https://elevenlabs.io) → Profile → API Keys |
| `ELEVENLABS_VOICE_ID` | ❌ | ID de la voix (défaut: Rachel) | ElevenLabs → Voices → Voice ID |
| `GOOGLE_CLOUD_PROJECT` | ❌ | ID du projet GCP (chat texte avancé) | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLOUD_LOCATION` | ❌ | Région GCP | Ex: `europe-central2` |
| `NEXT_PUBLIC_SUPABASE_*` | ❌ | Config Supabase (auth désactivée) | [Supabase Dashboard](https://supabase.com/dashboard) |

> **Note** : L'authentification Supabase est actuellement **désactivée**. Le chat fonctionne directement sans connexion.

### 4. Lancer le serveur de développement

```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Installation de l'Extension Chrome

1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez le **Mode développeur** (en haut à droite)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `extension/`
5. L'icône Alcentric apparaît dans votre barre d'extensions

## Utilisation

### Chat Texte (Side Panel)
1. Cliquez sur le bouton flottant Alcentric ou l'icône dans la barre d'extensions
2. Sélectionnez "Chat" dans le menu
3. Le side panel s'ouvre avec le contexte de la page chargé
4. Posez vos questions sur le contenu de la page

### Chat Vocal
1. Cliquez sur le bouton flottant Alcentric
2. Sélectionnez "Conversation vocale"
3. Le widget d'appel apparaît
4. Cliquez sur le bouton blanc pour parler
5. Attendez 1.5s de silence pour que l'IA réponde
6. Déplacez le widget où vous voulez sur la page

## Scripts disponibles

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm start        # Lancer le build de production
pnpm lint         # Vérification ESLint
```

## Technologies

- **Frontend** : Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend** : Next.js API Routes
- **IA** : Google Gemini 2.0 Flash (via Google AI Studio)
- **TTS** : ElevenLabs (modèle eleven_turbo_v2_5)
- **STT** : Web Speech API (navigateur)
- **Auth** : Supabase Auth (désactivée actuellement)
- **Extension** : Chrome Manifest V3

## Sécurité

- Les clés API sont stockées dans `.env.local` (jamais commité)
- L'extension utilise des permissions minimales
- ~~L'authentification Supabase~~ (désactivée pour le moment)

## Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -am 'Ajout de fonctionnalité'`)
4. Push sur la branche (`git push origin feature/amelioration`)
5. Ouvrez une Pull Request

## Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

Développé avec ❤️ par Okpeyemi
