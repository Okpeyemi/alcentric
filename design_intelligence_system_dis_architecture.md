# Design Intelligence System (DIS)

> Objectif : concevoir une architecture d’agents capable de produire des **designs web premium**, indiscernables de ceux réalisés par des studios haut de gamme (Zendesk, Notion, Linear, Antigravity), en éliminant l’« IA-look ».

---

## 1. Problème fondamental

Les outils actuels (v0.dev, bolt.new, MCP Gemini Design, etc.) échouent car ils confondent **génération** et **design**.

### Pipeline actuel (défaillant)
```
Idée produit → Génération UI directe → Design générique
```

### Pipeline réel du design humain
```
Références → Contraintes → Décisions → Système → Exécution
```

👉 Le design est une **discipline décisionnelle**, pas une discipline générative.

---

## 2. Principe clé du DIS

> ❌ Ne jamais demander à une IA : « génère un design »
>
> ✅ Toujours demander : « explique et applique des décisions de design »

Le système sépare strictement :
- **Perception visuelle**
- **Compréhension (pourquoi ça marche)**
- **Mémoire du goût**
- **Direction artistique**
- **Exécution (Figma MCP)**

---

## 3. Vue d’ensemble de l’architecture

```
[ Screenshots / Références ]
            ↓
[ Agent 1 : Design Perception ]
            ↓
[ Agent 2 : Design Deconstruction ]
            ↓
[ Agent 3 : Design Memory ]
            ↓
[ Agent 4 : Design Director ]
            ↓
[ Agent 5 : MCP Figma Executor ]
            ↓
[ Figma File – Pixel Perfect ]
```

---

## 4. Agent 1 — Design Perception Agent (Vision-first)

### Rôle
Analyser **visuellement** des interfaces réelles sans jugement esthétique ni génération.

### Entrées
- Screenshots (sections ciblées : hero, dashboard, settings, pricing, etc.)

### Sorties
**Design Facts** (faits observables, non interprétés)

### Dimensions analysées
- Grille implicite (8px, 12px, custom)
- Densité verticale / horizontale
- Ratio texte / whitespace
- Hiérarchie visuelle réelle
- Poids typographique effectif
- Placement des CTA
- Tension visuelle

### Exemple de sortie
```json
{
  "layout_density": "high",
  "vertical_rhythm": "compressed",
  "visual_tension": "low",
  "typography_strategy": "editorial + utilitarian",
  "cta_visibility": "contextual_not_primary"
}
```

---

## 5. Agent 2 — Design Deconstruction Agent

### Rôle
Transformer les **Design Facts** en **règles et principes explicites**.

### Question centrale
> Pourquoi ce design fonctionne-t-il ?

### Types de sorties
- Règles de hiérarchie
- Contraintes de contraste
- Lois de spacing
- Anti-patterns implicites

### Exemple
```yaml
rules:
  - max_strong_contrasts_per_view: 2
  - cta_never_centered_without_context: true
  - headings_do_not_dominate_content: true
```

👉 Cet agent produit le **goût explicité**.

---

## 6. Agent 3 — Design Memory (Goût Persistant)

### Rôle
Stocker et structurer une **bibliothèque de goût** indépendante des produits.

### Différence clé
❌ Pas une librairie de composants
✅ Une librairie de **patterns décisionnels**

### Structure
```json
{
  "pattern_name": "Quiet Authority",
  "used_by": ["Zendesk", "Stripe Dashboard"],
  "rules": [
    "low color saturation",
    "high spacing consistency",
    "no decorative elements"
  ],
  "density": "medium-high",
  "emotional_signal": "confidence"
}
```

### Fonctionnement
- Les patterns sont **abstraits**
- Combinables entre eux
- Sélectionnés selon le contexte produit

---

## 7. Agent 4 — Design Director Agent

### Rôle
Jouer le rôle d’un **Lead Designer / Art Director**.

### Entrées
- Idée produit
- Cible utilisateur
- Contraintes business
- Patterns sélectionnés depuis la Design Memory

### Responsabilités
- Choisir le ton visuel
- Définir la densité
- Arbitrer les compromis
- Décider quoi NE PAS faire

### Sortie : Design Brief Exécutable
```yaml
tone: calm_confident
density: medium_high
color_usage: minimal
spacing: strict
components_visibility: invisible
risk_level: conservative
```

👉 Ce brief est **plus important que le Figma final**.

---

## 8. Agent 5 — MCP Figma Executor

### Rôle
Exécuter le Design Brief **sans interprétation créative**.

### Capacités
- Création de frames
- Auto-layout précis
- Composants et variants
- Tokens (spacing, couleurs, radius)
- Respect strict des règles

### Principe clé
> Le MCP n’est pas un designer.
> C’est un **outil d’exécution pixel-perfect**.

---

## 9. Règles anti « IA-look »

1. Toujours partir de **références visuelles réelles**
2. Ne jamais générer sans contraintes explicites
3. Séparer analyse et génération
4. Forcer la justification des décisions
5. Favoriser la cohérence sur la créativité

---

## 10. Avantage compétitif du DIS

- Reproduit le raisonnement d’un designer senior
- Capitalise le goût (mémoire persistante)
- Scalable et industrialisable
- Compatible avec MCP Figma et Design-to-Code

👉 Le DIS ne génère pas des UI.
👉 Il génère des **décisions de design**.

---

## 11. Prochaines extensions possibles

- Scoring de qualité visuelle
- Comparaison de styles multi-références
- Adaptation automatique par marché (B2B, devtools, consumer)
- Export Design System → Code (React / Tailwind)

---

**Ce document est la base d’un produit de Design Intelligence différenciant.**

