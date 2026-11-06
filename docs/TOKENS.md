# Référence des tokens (générée)

> Fichier généré par `npm run docs:tokens` depuis `projects/theme/src/styles/tokens.css` — ne pas éditer à la main.

Tous les composants @artis/* consomment **uniquement** ces variables. Pour personnaliser, redéfinissez-les dans le fichier de thème du projet (voir [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)).

## 1. COULEURS — PALETTES PRIMITIVES

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-white` | `#ffffff` | Blanc pur. Sert de base aux surfaces et au texte sur fond coloré. |
| `--art-black` | `#000000` | Noir pur. Sert de base à la couleur des ombres et des voiles. |
| `--art-neutral-50` | `#fafaf9` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-100` | `#f5f4f2` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-150` | `#edecea` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-200` | `#e7e5e4` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-300` | `#d6d3d1` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-400` | `#a8a29e` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-500` | `#78716c` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-600` | `#57534e` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-700` | `#44403c` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-800` | `#292524` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-neutral-900` | `#1c1917` | Neutres (nuances chaudes) : fonds, bordures, textes. 50 = le plus clair, 900 = le plus foncé. |
| `--art-primary-50` | `#fff7ed` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-100` | `#ffedd5` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-200` | `#fed7aa` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-300` | `#fdba74` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-400` | `#fb923c` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-500` | `#f97316` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-600` | `#ea580c` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-700` | `#c2410c` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-800` | `#9a3412` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-primary-900` | `#7c2d12` | Couleur primaire de la marque (échelle 50–900). Pilote boutons principaux, liens, focus, états actifs. |
| `--art-secondary-50` | `var(--art-neutral-50)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-100` | `var(--art-neutral-100)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-200` | `var(--art-neutral-200)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-300` | `var(--art-neutral-300)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-400` | `var(--art-neutral-400)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-500` | `var(--art-neutral-500)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-600` | `var(--art-neutral-600)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-700` | `var(--art-neutral-700)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-800` | `var(--art-neutral-800)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-secondary-900` | `var(--art-neutral-900)` | Couleur secondaire : actions secondaires, éléments de structure sobres. |
| `--art-accent-50` | `#f5f3ff` | Couleur d'accent : mise en avant ponctuelle, distincte de la primaire (badges, nouveautés). |
| `--art-accent-100` | `#ede9fe` | Couleur d'accent : mise en avant ponctuelle, distincte de la primaire (badges, nouveautés). |
| `--art-accent-200` | `#ddd6fe` | Couleur d'accent : mise en avant ponctuelle, distincte de la primaire (badges, nouveautés). |
| `--art-accent-500` | `#8b5cf6` | Couleur d'accent : mise en avant ponctuelle, distincte de la primaire (badges, nouveautés). |
| `--art-accent-600` | `#7c3aed` | Couleur d'accent : mise en avant ponctuelle, distincte de la primaire (badges, nouveautés). |
| `--art-accent-700` | `#6d28d9` | Couleur d'accent : mise en avant ponctuelle, distincte de la primaire (badges, nouveautés). |
| `--art-success-50` | `#f0fdf4` | Succès (vert). |
| `--art-success-100` | `#dcfce7` | Succès (vert). |
| `--art-success-200` | `#bbf7d0` | Succès (vert). |
| `--art-success-500` | `#22c55e` | Succès (vert). |
| `--art-success-600` | `#16a34a` | Succès (vert). |
| `--art-success-700` | `#15803d` | Succès (vert). |
| `--art-danger-50` | `#fef2f2` | Danger / erreur (rouge). |
| `--art-danger-100` | `#fee2e2` | Danger / erreur (rouge). |
| `--art-danger-200` | `#fecaca` | Danger / erreur (rouge). |
| `--art-danger-500` | `#ef4444` | Danger / erreur (rouge). |
| `--art-danger-600` | `#dc2626` | Danger / erreur (rouge). |
| `--art-danger-700` | `#b91c1c` | Danger / erreur (rouge). |
| `--art-warning-50` | `#fffbeb` | Avertissement (ambre). |
| `--art-warning-100` | `#fef3c7` | Avertissement (ambre). |
| `--art-warning-200` | `#fde68a` | Avertissement (ambre). |
| `--art-warning-400` | `#fbbf24` | Avertissement (ambre). |
| `--art-warning-600` | `#d97706` | Avertissement (ambre). |
| `--art-warning-700` | `#b45309` | Avertissement (ambre). |
| `--art-info-50` | `#eff6ff` | Information (bleu). |
| `--art-info-100` | `#dbeafe` | Information (bleu). |
| `--art-info-200` | `#bfdbfe` | Information (bleu). |
| `--art-info-600` | `#1a73e8` | Information (bleu). |
| `--art-info-700` | `#1d4ed8` | Information (bleu). |

## 2. COULEURS — SÉMANTIQUES (celles que les composants utilisent)

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-bg` | `var(--art-neutral-50)` | Fond de page / zones de fond (footer, fond d'application). |
| `--art-surface` | `var(--art-white)` | Fond des cartes, champs, panneaux, modales. |
| `--art-surface-subtle` | `var(--art-neutral-100)` | Fond de surface légèrement teinté (en-têtes de tableau, zones secondaires). |
| `--art-surface-muted` | `var(--art-neutral-150)` | Fond de surface plus marqué (survols neutres, pistes de barre de progression). |
| `--art-inverse-surface` | `var(--art-neutral-900)` | Surface inversée (bulle d'info sombre, tooltips, boutons noirs). |
| `--art-overlay` | `color-mix(in srgb, var(--art-neutral-900) 45%, transparent)` | Voile derrière les modales et menus mobiles. |
| `--art-border` | `var(--art-neutral-200)` | Bordure standard (séparateurs, contour des champs). |
| `--art-border-strong` | `var(--art-neutral-300)` | Bordure renforcée (champ survolé, séparation marquée). |
| `--art-text` | `var(--art-neutral-900)` | Texte principal. |
| `--art-text-secondary` | `var(--art-neutral-700)` | Texte secondaire (sous-titres, valeurs de second plan). |
| `--art-text-muted` | `var(--art-neutral-500)` | Texte atténué (labels, légendes, aides). |
| `--art-text-subtle` | `var(--art-neutral-400)` | Texte très discret (placeholders, icônes inactives). |
| `--art-text-inverse` | `var(--art-white)` | Texte sur fond inversé ou fond coloré plein. |
| `--art-primary` | `var(--art-primary-600)` | Couleur d'action principale (boutons pleins, liens, éléments actifs). |
| `--art-primary-hover` | `var(--art-primary-700)` | Variante survol/pression de la couleur principale. |
| `--art-primary-strong` | `var(--art-primary-700)` | Couleur principale pour du texte sur fond teinté (contraste renforcé). |
| `--art-primary-light` | `var(--art-primary-500)` | Variante claire de la couleur principale (accents, dégradés). |
| `--art-primary-soft` | `var(--art-primary-50)` | Teinte très claire de la principale (survol de ligne/menu). |
| `--art-primary-softer` | `var(--art-primary-100)` | Teinte claire de la principale (élément sélectionné, puce active). |
| `--art-primary-border` | `var(--art-primary-200)` | Bordure teintée de la principale. |
| `--art-on-primary` | `var(--art-white)` | Texte sur fond de couleur principale. |
| `--art-accent` | `var(--art-accent-600)` | Couleur d'accent sémantique. |
| `--art-success` | `var(--art-success-600)` | Succès sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-success-strong` | `var(--art-success-700)` | Succès sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-success-soft` | `var(--art-success-50)` | Succès sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-success-softer` | `var(--art-success-100)` | Succès sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-success-border` | `var(--art-success-200)` | Succès sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-danger` | `var(--art-danger-600)` | Danger sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-danger-strong` | `var(--art-danger-700)` | Danger sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-danger-soft` | `var(--art-danger-50)` | Danger sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-danger-softer` | `var(--art-danger-100)` | Danger sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-danger-border` | `var(--art-danger-200)` | Danger sémantique : couleur d’action/texte, variante forte, fond doux (-soft/-softer) et bordure. |
| `--art-warning` | `var(--art-warning-600)` | Avertissement sémantique : couleur, variante forte, variante claire, fond doux et bordure. |
| `--art-warning-strong` | `var(--art-warning-700)` | Avertissement sémantique : couleur, variante forte, variante claire, fond doux et bordure. |
| `--art-warning-light` | `var(--art-warning-400)` | Avertissement sémantique : couleur, variante forte, variante claire, fond doux et bordure. |
| `--art-warning-soft` | `var(--art-warning-50)` | Avertissement sémantique : couleur, variante forte, variante claire, fond doux et bordure. |
| `--art-warning-softer` | `var(--art-warning-100)` | Avertissement sémantique : couleur, variante forte, variante claire, fond doux et bordure. |
| `--art-warning-border` | `var(--art-warning-200)` | Avertissement sémantique : couleur, variante forte, variante claire, fond doux et bordure. |
| `--art-info` | `var(--art-info-600)` | Information sémantique : couleur, variante forte, fond doux et bordure. |
| `--art-info-strong` | `var(--art-info-700)` | Information sémantique : couleur, variante forte, fond doux et bordure. |
| `--art-info-soft` | `var(--art-info-50)` | Information sémantique : couleur, variante forte, fond doux et bordure. |
| `--art-info-softer` | `var(--art-info-100)` | Information sémantique : couleur, variante forte, fond doux et bordure. |
| `--art-info-border` | `var(--art-info-200)` | Information sémantique : couleur, variante forte, fond doux et bordure. |
| `--art-focus-color` | `var(--art-primary-500)` | Couleur de l'anneau de focus clavier (WCAG 2.4.7 / 2.4.11). |
| `--art-shadow-color` | `var(--art-black)` | Couleur de base des ombres (mélangée avec de la transparence). |

## 3. TYPOGRAPHIE

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-font-sans` | `'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif` | Famille de police principale de l'interface. |
| `--art-font-mono` | `ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace` | Famille monospace (code, valeurs secrètes, identifiants). |
| `--art-text-2xs` | `10px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-xs` | `11px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-sm` | `12px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-base` | `13px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-md` | `14px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-lg` | `16px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-xl` | `18px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-2xl` | `20px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-3xl` | `24px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-text-4xl` | `32px` | Échelle de tailles : 2xs 10px · xs 11px · sm 12px · base 13px · md 14px · lg 16px · xl 18px · 2xl 20px · 3xl 24px · 4xl 32px. |
| `--art-weight-regular` | `400` | Graisses de police. |
| `--art-weight-medium` | `500` | Graisses de police. |
| `--art-weight-semibold` | `600` | Graisses de police. |
| `--art-weight-bold` | `700` | Graisses de police. |
| `--art-weight-extrabold` | `800` | Graisses de police. |
| `--art-leading-none` | `1` | Hauteurs de ligne : none=1, tight=1.2, snug=1.35, normal=1.5, relaxed=1.65. |
| `--art-leading-tight` | `1.2` | Hauteurs de ligne : none=1, tight=1.2, snug=1.35, normal=1.5, relaxed=1.65. |
| `--art-leading-snug` | `1.35` | Hauteurs de ligne : none=1, tight=1.2, snug=1.35, normal=1.5, relaxed=1.65. |
| `--art-leading-normal` | `1.5` | Hauteurs de ligne : none=1, tight=1.2, snug=1.35, normal=1.5, relaxed=1.65. |
| `--art-leading-relaxed` | `1.65` | Hauteurs de ligne : none=1, tight=1.2, snug=1.35, normal=1.5, relaxed=1.65. |
| `--art-tracking-tight` | `-0.01em` | Espacement des lettres. |
| `--art-tracking-normal` | `0` | Espacement des lettres. |
| `--art-tracking-wide` | `0.02em` | Espacement des lettres. |

## 4. ESPACEMENTS (1 pas = 4px ; demi-pas = 2px)

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-space-0-5` | `2px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-1` | `4px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-1-5` | `6px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-2` | `8px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-2-5` | `10px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-3` | `12px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-3-5` | `14px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-4` | `16px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-4-5` | `18px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-5` | `20px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-6` | `24px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-7` | `28px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-8` | `32px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-10` | `40px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-12` | `48px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-16` | `64px` | Échelle fine : pas numérique (0-5 = 2px, 1 = 4px, 1-5 = 6px, 2 = 8px …). |
| `--art-space-xs` | `var(--art-space-1)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |
| `--art-space-sm` | `var(--art-space-2)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |
| `--art-space-md` | `var(--art-space-3)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |
| `--art-space-lg` | `var(--art-space-4)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |
| `--art-space-xl` | `var(--art-space-6)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |
| `--art-space-2xl` | `var(--art-space-8)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |
| `--art-space-3xl` | `var(--art-space-12)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |
| `--art-space-4xl` | `var(--art-space-16)` | Alias lisibles : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · 4xl 64. |

## 5. BORDURES

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-radius-xs` | `4px` | Rayons : xs 4 · sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · full (pilule/cercle). |
| `--art-radius-sm` | `6px` | Rayons : xs 4 · sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · full (pilule/cercle). |
| `--art-radius-md` | `8px` | Rayons : xs 4 · sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · full (pilule/cercle). |
| `--art-radius-lg` | `10px` | Rayons : xs 4 · sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · full (pilule/cercle). |
| `--art-radius-xl` | `14px` | Rayons : xs 4 · sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · full (pilule/cercle). |
| `--art-radius-2xl` | `20px` | Rayons : xs 4 · sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · full (pilule/cercle). |
| `--art-radius-full` | `999px` | Rayons : xs 4 · sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · full (pilule/cercle). |
| `--art-border-width` | `1px` | Épaisseurs de bordure. |
| `--art-border-width-thick` | `2px` | Épaisseurs de bordure. |
| `--art-border-style` | `solid` | Style de bordure par défaut. |

## 6. OMBRES

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-shadow-xs` | `0 1px 2px color-mix(in srgb, var(--art-shadow-color) 5%, transparent)` | Ombre extra-légère (champs, puces). |
| `--art-shadow-sm` | `0 1px 4px color-mix(in srgb, var(--art-shadow-color) 7%, transparent), 0 1px 2px color-mix(in srgb, var(--art-shadow-color) 5%, transparent)` | Ombre légère (cartes au repos). |
| `--art-shadow-md` | `0 4px 14px color-mix(in srgb, var(--art-shadow-color) 9%, transparent), 0 2px 4px color-mix(in srgb, var(--art-shadow-color) 5%, transparent)` | Ombre moyenne (cartes survolées, menus). |
| `--art-shadow-lg` | `0 12px 32px color-mix(in srgb, var(--art-shadow-color) 13%, transparent), 0 4px 8px color-mix(in srgb, var(--art-shadow-color) 6%, transparent)` | Ombre forte (panneaux flottants). |
| `--art-shadow-popup` | `0 8px 28px color-mix(in srgb, var(--art-shadow-color) 13%, transparent), 0 2px 6px color-mix(in srgb, var(--art-shadow-color) 6%, transparent)` | Ombre des éléments qui flottent au-dessus de tout (popups, dropdowns, toasts, modales). |
| `--art-shadow-focus` | `0 0 0 3px color-mix(in srgb, var(--art-focus-color) 35%, transparent)` | Anneau de focus (clavier). |

## 7. TRANSITIONS

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-duration-fast` | `150ms` | Durées : fast 150ms · base 200ms · slow 300ms. Mises à 0 si l'utilisateur préfère moins d'animations. |
| `--art-duration-base` | `200ms` | Durées : fast 150ms · base 200ms · slow 300ms. Mises à 0 si l'utilisateur préfère moins d'animations. |
| `--art-duration-slow` | `300ms` | Durées : fast 150ms · base 200ms · slow 300ms. Mises à 0 si l'utilisateur préfère moins d'animations. |
| `--art-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Courbes d'accélération. |
| `--art-easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Courbes d'accélération. |
| `--art-easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Courbes d'accélération. |
| `--art-easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Courbes d'accélération. |

## 8. Z-INDEX (échelle centralisée)

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-z-base` | `1` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-raised` | `10` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-sticky` | `20` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-header` | `190` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-sidebar-backdrop` | `198` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-sidebar` | `199` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-sidebar-raised` | `200` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-sidebar-flyout` | `250` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-sidebar-tooltip` | `300` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-dropdown` | `400` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-popover` | `500` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-overlay` | `600` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-drawer` | `800` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-modal` | `900` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-toast` | `1100` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |
| `--art-z-tooltip` | `1200` | Empilement : base 1 · raised 10 · sticky 20 · header 190 · sidebar 199 · dropdown 400 · popover 500 · overlay 600 · drawer 800 · modal 900 · toast 1100 · tooltip 1200. |

## 9. LAYOUT

| Token | Valeur par défaut | Rôle |
|---|---|---|
| `--art-container-max` | `1200px` | Largeur maximale du contenu. |
| `--art-sidebar-width` | `240px` | Largeur de la sidebar dépliée / repliée. |
| `--art-sidebar-width-collapsed` | `64px` | Largeur de la sidebar dépliée / repliée. |
| `--art-header-height` | `56px` | Hauteur de l'en-tête applicatif. |

