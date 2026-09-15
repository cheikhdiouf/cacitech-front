---
name: 'Cacitech'
description: 'Identité visuelle de l’application d’administration Cacitech (marque Sen’eau) — outil professionnel interne, thème clair unique, densité de données élevée.'
status: final
created: '2026-08-26'
updated: '2026-08-26'
sources: []
companions: []
colors:
  brand-500: '#95C122'
  brand-600: '#7EA01C'
  brand-700: '#628016'
  brand-tint: 'rgba(149,193,34,0.12)'
  sidebar-bg: '#1D4ED8'
  sidebar-bg-elevated: '#1839A8'
  sidebar-accent: '#95C122'
  background: '#F5F5F5'
  surface: '#FFFFFF'
  surface-muted: '#F5F5F5'
  border: '#D9D9D9'
  text-primary: '#0A1937'
  text-secondary: '#5A5A5A'
  text-muted: '#828282'
  success-solid: '#2E7D32'
  success-bg: '#EAF6EC'
  error-solid: '#DC2626'
  error-bg: '#FDECEA'
  action-info: '#1D4ED8'
  action-edit: '#7C3AED'
  action-success: '#2E7D32'
  action-danger: '#DC2626'
  action-warning: '#EA580C'
  stat-blue: '#95C122'
  stat-blue-dark: '#7EA01C'
  stat-amber: '#C2410C'
  stat-rose: '#B91C1C'
typography:
  fontFamily:
    base: 'Roboto, "Helvetica Neue", sans-serif'
  page-title:
    fontSize: '1.4rem'
    fontWeight: 700
    letterSpacing: '-0.01em'
  list-title:
    fontSize: '1.15rem'
    fontWeight: 700
  dialog-title:
    fontSize: '1.1rem'
    fontWeight: 700
  section-title:
    fontSize: '0.95rem'
    fontWeight: 700
  table-header:
    fontSize: '0.85rem'
    fontWeight: 700
    letterSpacing: '0.04em'
  table-body:
    fontSize: '0.94rem'
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontSize: '0.8rem'
    fontWeight: 500
  input:
    fontSize: '0.85rem'
    fontWeight: 400
  caption:
    fontSize: '0.76rem'
    fontWeight: 400
  sidebar-brand:
    fontSize: '1rem'
    fontWeight: 700
    letterSpacing: '0.03em'
  sidebar-item:
    fontSize: '0.82rem'
    fontWeight: 600
  stat-value:
    fontSize: '1.85rem'
    fontWeight: 700
    letterSpacing: '-0.01em'
rounded:
  sm: '5px'
  action: '7px'
  md: '8px'
  lg: '12px'
  xl: '16px'
  full: '999px'
  circle: '50%'
spacing:
  '1': '0.3rem'
  '2': '0.6rem'
  '3': '0.75rem'
  '4': '1rem'
  '5': '1.25rem'
  '6': '1.5rem'
  card-padding: '1.25rem'
  dialog-padding: '0.6rem 1.5rem 0.9rem'
components:
  row-action-btn:
    size: '32px'
    rounded: '{rounded.action}'
    icon-size: '18px'
    shadow: '{elevation not modeled — see Elevation & Depth}'
  stat-card:
    rounded: '{rounded.xl}'
    padding: '1.15rem 1.3rem'
  entity-form-dialog:
    rounded: '{rounded.sm}'
    header-bg: '{colors.surface-muted}'
  entity-detail:
    rounded: '{rounded.sm}'
    header-bg: '{colors.surface-muted}'
  dense-table:
    header-bg: '{colors.sidebar-bg}'
    wrapper-rounded: '{rounded.lg}'
  status-badge-pill:
    rounded: '{rounded.full}'
---

# DESIGN — Cacitech

## Brand & Style

Cacitech est un outil d'administration métier (patrimoine immobilier, RH, CRM, facturation) pour l'opérateur Sen'eau. Le ton visuel est **fonctionnel et sobre** : aucune ambition éditoriale, l'objectif est la lisibilité de données denses sur de longues sessions de travail. La marque n'apparaît franchement qu'à deux endroits — l'écran de connexion (bloc de marque plein écran) et les accents ponctuels (bouton principal, barre de survol des lignes de tableau, sparklines) — le reste de l'interface reste neutre pour ne jamais concurrencer les données. Un seul thème clair existe ; il n'y a pas de mode sombre.

## Colors

- **`{colors.brand-500}` #95C122** — vert de marque Sen'eau. Réservé aux moments d'intention forte : bloc de marque de l'écran de connexion, accent de survol sur les lignes de tableau, icône de la marque en sidebar, séries de graphiques primaires. Jamais utilisé comme fond de grande surface hors écran d'authentification.
- **`{colors.brand-700}` #628016** — déclinaison foncée du vert, utilisée comme fond du panneau de marque (contraste texte blanc) et comme couleur de l'icône dans l'en-tête des dialogues de détail.
- **`{colors.sidebar-bg}` #1D4ED8** (bleu) — couleur structurelle de la navigation : fond de la sidebar **et** fond des en-têtes de tableau dense. C'est la couleur "cadre applicatif", distincte du vert "marque/action".
- **Neutres** — `{colors.background}` #F5F5F5 (fond de page), `{colors.surface}` blanc (cartes, dialogues), `{colors.text-primary}` #0A1937 (bleu-marine très sombre, pas un gris pur — porte la même famille chromatique que la sidebar).
- **Sémantique succès/erreur** — vert `{colors.success-solid}` / rouge `{colors.error-solid}`, utilisés pour : badges de statut actif/inactif, toasts de confirmation, bouton "Activer"/"Désactiver" des tableaux. **Ne jamais** réutiliser ces teintes pour autre chose que succès/échec réels — c'est une règle déjà respectée dans le code existant.
- **Couleurs d'action de ligne** — 4 teintes distinctes par intention : `{colors.action-info}` bleu (Détail), `{colors.action-edit}` violet #7C3AED (Modifier), `{colors.action-success}` vert (Activer), `{colors.action-danger}` rouge (Désactiver). Le violet est délibérément une 5ᵉ teinte pour ne jamais confondre "Modifier" avec "Activer".

## Typography

Une seule famille, Roboto, chargée en 5 graisses (300–700). Pas de face display séparée — la hiérarchie se fait par **taille + graisse + letter-spacing**, jamais par changement de police :
- Titres (`{typography.page-title}`, `{typography.list-title}`, `{typography.dialog-title}`) : graisse 700, souvent un `letter-spacing` légèrement négatif sur les plus grands titres.
- Étiquettes en capitales (en-têtes de tableau, libellé de section sidebar, variante texte de status-badge) : `letter-spacing` positif (0.02–0.06em) — c'est le signal visuel "ceci est un label", pas un titre.
- Corps de texte et données de tableau restent volontairement sous 1rem (0.8–0.95rem) : priorité à la densité d'information sur le confort de lecture éditorial.

## Layout & Spacing

Rythme resserré, cohérent avec un outil de gestion : le rembourrage des cartes (`{spacing.card-padding}`) et des dialogues (`{spacing.dialog-padding}`) reste sous 1.5rem, les écarts entre champs de formulaire sous 1rem. Deux largeurs de conteneur reviennent : 900px (écrans de type liste de réglages) et 1400px (tableaux de bord). Points de rupture : 900px (bascule sidebar/nav mobile), 640px et 480px (réempilement fin du contenu, formulaires en colonne unique).

## Elevation & Depth

Trois niveaux seulement — `--shadow-sm/md/lg` — avec une règle claire : **sm = repos** (cartes, boutons de ligne, barre de navigation), **md = élevé par défaut** (contrôles flottants comme le bouton de repli de la sidebar, cartes KPI), **lg = accentué au survol** des éléments interactifs flottants. Les dialogues n'ont **pas** d'ombre propre — ils s'appuient sur l'overlay CDK. Ne pas introduire un 4ᵉ niveau : la restriction à trois paliers est ce qui garde la hiérarchie de profondeur lisible.

## Shapes

Logique de rayon par **rôle**, pas par taille : `{rounded.sm}` 5px pour tout ce qui est "cadre système" (dialogues, boutons rectangulaires), `{rounded.action}` 7px pour les boutons d'action de ligne, `{rounded.md}`/`{rounded.lg}`/`{rounded.xl}` (8/12/16px) en proportion de la taille du conteneur (champ < tableau < carte), `{rounded.full}` réservé aux éléments "pilule" qui signalent une action finale ou un statut (boutons de bas de dialogue, badges).

## Components

- **stat-card** — 4 couleurs sémantiques (`{colors.stat-blue}`, `stat-blue-dark`, `stat-amber`, `stat-rose}`), icône + valeur clé + jusqu'à 3 lignes de détail + sparkline optionnelle. Lift au survol (-3px + ombre sm→lg).
- **row-action-btn** — carré 32px, `{rounded.action}`, icône blanche 18px, couleur = intention (voir Colors). Survol : `brightness(0.92)` + lift, jamais un changement de teinte vers la variante `-dark`.
- **status-badge** — variante `pill` (fond + texte coloré, coins `{rounded.full}`) ou `text` (texte coloré capitales, sans fond). Purement présentationnel.
- **entity-form-dialog / entity-detail** — anatomie commune : bouton de fermeture circulaire à cheval sur le coin supérieur droit, bandeau d'en-tête à fond `{colors.surface-muted}` qui déborde jusqu'aux bords du dialogue, coins supérieurs `{rounded.sm}`. Le dialogue de détail centre son en-tête (icône ronde + titre + statut) ; le dialogue de formulaire l'aligne à gauche.
- **dense-table** — en-tête à fond `{colors.sidebar-bg}` (même bleu que la sidebar — signal que c'est un composant "cadre", pas une donnée), texte capitales, ligne au survol avec accent vert `{colors.brand-500}` sur la première cellule.

## Do's and Don'ts

- **Do** garder le bleu (`{colors.sidebar-bg}`) réservé aux éléments de structure/navigation (sidebar, en-tête de tableau) et le vert de marque réservé aux moments d'intention/action.
- **Do** garder les trois paliers d'ombre stricts — ne pas en ajouter un quatrième pour un besoin ponctuel.
- **Don't** réutiliser les teintes succès/erreur (`{colors.success-solid}` / `{colors.error-solid}`) pour un usage décoratif — elles doivent rester lisibles comme signal d'état réel.
- **Décidé (AD-4)** : le thème M3 (`custom-theme.scss`) conserve `mat.$green-palette` comme structure de palette, mais tout composant Material utilisant `color="primary"` (boutons, cases à cocher, interrupteurs) est désormais réaligné sur le hex de marque exact via des overrides de variables MDC globaux (`.mat-primary` dans `styles.css`) — `{colors.brand-500}` en repos, `{colors.brand-600}` au survol, `{colors.brand-700}` pour les états sélectionnés de case à cocher/interrupteur. Il n'existe plus qu'un seul vert perçu dans toute l'application.
