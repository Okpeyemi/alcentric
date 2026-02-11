---
trigger: always_on
---

# 📘 IDE_RULES.md  
**Règles de développement et d’implémentation**

---

# 🎯 1. Design System & UI

## 1.1 Utilisation obligatoire de shadcn/ui
- Toujours utiliser les composants officiels `shadcn/ui`.
- Ne jamais recréer un composant existant dans la librairie.
- Respecter la structure et les variantes (`variant`, `size`, `asChild`, etc.).
- Les icônes doivent provenir de l’écosystème compatible shadcn (ex: `lucide-react`).
- Les icônes doivent être :
  - Sémantiquement pertinentes
  - Liées à l’action utilisateur (interaction claire)

## 1.2 Cohérence visuelle
- Respect strict des styles définis dans `globals.css`.
- Ne pas ajouter de couleurs inline.
- Utiliser exclusivement les variables CSS et tokens définis.
- Respecter :
  - Les arrondis (ex: `rounded-2xl`)
  - Les ombres définies
  - Les espacements cohérents (padding minimum `p-2`)
  - La hiérarchie typographique (`text-xl`, `text-base`, `text-muted-foreground`, etc.)

## 1.3 UX & Layout
- Toujours privilégier :
  - Layout en `grid` ou `flex`
  - Espacement cohérent
  - Lisibilité maximale
- Ajouter systématiquement :
  - États `hover`
  - États `focus`
  - États `disabled` si applicable
- Penser accessibilité :
  - `aria-label` si nécessaire
  - Boutons explicites
  - Contraste suffisant
  - Navigation clavier fonctionnelle

---

# 🧠 2. Architecture & Code Quality

## 2.1 Structure
- Respecter la séparation :
  - UI (`components`)
  - Logique (`hooks`, `services`)
  - Types (`types` ou fichiers dédiés)
- Aucun composant ne doit dépasser 200 lignes (si possible).
- Extraire la logique complexe dans des hooks personnalisés.

## 2.2 TypeScript
- Interdiction d’utiliser `any`.
- Typage strict obligatoire.
- Créer des types explicites pour :
  - Props
  - API responses
  - State complexes
- Utiliser `zod` ou équivalent pour valider les schémas si nécessaire.

## 2.3 Clean Code
- Nommage clair et explicite.
- Pas de code mort.
- Pas de duplication inutile.
- Commenter uniquement si la logique est complexe.
- Respecter les principes SOLID quand pertinent.

---

# ⚡ 3. Workflow de Modification

## 3.1 Lorsqu’une modification de code est demandée
1. Implémenter la modification.
2. Expliquer brièvement ce qui a été fait.
3. Toujours demander validation avant commit.

## 3.2 Après validation
- Générer automatiquement un message de commit.
- Le message doit :
  - Être en français
  - Être détaillé
  - Expliquer clairement :
    - Ce qui a été modifié
    - Pourquoi
    - Impact éventuel

## 3.3 Format du commit
feat: ajout du composant X avec intégration shadcn

- Création du composant X
- Respect du design system (shadcn + globals.css)
- Ajout des états hover et disabled
- Typage strict TypeScript
- Refactor de Y pour cohérence
Types autorisés :
- `feat`
- `fix`
- `refactor`
- `style`
- `perf`
- `chore`
- `docs`
- `test`

---

# 🔐 4. Performance & Bonnes pratiques

- Pas de re-render inutile.
- Utiliser `useMemo` / `useCallback` si pertinent.
- Utiliser `React.memo` si nécessaire.
- Lazy loading si applicable.
- Optimiser les imports (imports ciblés).
- Pas d’import global inutile.
- Minimiser la complexité algorithmique.

---

# 🧪 5. Robustesse

- Gérer les cas d’erreur.
- Gérer les états loading.
- Gérer les états empty.
- Prévoir fallback UI si données absentes.
- Sécuriser les appels API.
- Toujours prévoir un comportement en cas d’échec réseau.

---

# 🚫 6. Interdictions

- Pas de CSS inline.
- Pas de composants hors design system sans justification.
- Pas de logique métier directement dans les composants UI.
- Pas de commit sans validation préalable.
- Pas de `console.log` en production.
- Pas de `any` en TypeScript.

---

# 🧭 7. Philosophie Générale

Chaque implémentation doit être :

- Cohérente
- Minimaliste
- Typée strictement
- Maintenable
- Scalable
- Production-ready
- Alignée avec le design system
- Optimisée performance
- Pensée long terme

---

# 🧑‍💻 8. Standard de Qualité Final

Avant toute validation finale, vérifier :

- ✅ Respect du design system
- ✅ Typage strict
- ✅ Aucun warning TypeScript
- ✅ Aucun warning ESLint
- ✅ Accessibilité minimale respectée
- ✅ Structure propre et maintenable
- ✅ Message de commit prêt et détaillé

---

**Ces règles sont obligatoires pour toute implémentation.**
