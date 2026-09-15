---
name: 'Cacitech'
status: final
created: '2026-08-26'
updated: '2026-08-26'
sources: []
companions: ['DESIGN.md']
---

# EXPERIENCE — Cacitech

## Foundation

**Form-factor** : application web desktop, usage professionnel assis-bureau en session longue. Une bascule mobile existe (sidebar hors-canevas ≤900px, navbar et formulaires réempilés ≤640/480px) mais c'est un filet de sécurité pour consultation ponctuelle, pas le terrain d'usage principal — aucun parcours n'est pensé mobile-first.

**Système UI** : Angular Material 18 (M3, `mat.define-theme`, `theme-type: light` uniquement) pour les primitives interactives (boutons, champs, dialogues, menus, snackbars, spinners), habillé d'une couche de composants maison (`shared/components/*`) et de classes CSS globales partagées (`.entity-form-dialog`, `.entity-detail`, `.dense-table`, `.list-card`...) qui portent la véritable identité visuelle. Voir DESIGN.md pour les tokens.

**Sessions & rôles** : accès protégé par authentification (`authGuard`) + permissions granulaires par route (`permissionGuard`, une clé de permission par écran ou groupe d'écrans). Les habilitations sont chargées une seule fois au démarrage de session et lues de façon synchrone — aucun écran ne doit dépendre d'une vérification de permission asynchrone.

## Information Architecture

Quatre modules métier + un tableau de bord global, exposés par une sidebar à deux niveaux (section → écran) :

```
Tableau de bord (global)
Paramétrage & Sécurités
├─ Gestion des utilisateurs
├─ Groupes d'utilisateurs
├─ Habilitations
└─ Notifications e-mail
Ressources humaines
├─ Gestion des agents
├─ Structures organisationnelles
├─ Affectations & rattachements
└─ Organigramme
Clients & Prospects
├─ Prospects
├─ Clients
├─ Suivi clients & prospects
└─ Tableaux de bord
Facturation
├─ Types de sites
├─ Spécifications
├─ Sites à louer
├─ Contrats de location
├─ Factures
├─ Contrats de cession
├─ Encaissements
├─ Recouvrement
├─ Loyers impayés
├─ Notifications
└─ Tableaux de bord
```

**Décidé (AD-1)** : la sidebar de Facturation sous-groupe désormais ses 11 écrans sous 5 intitulés de famille non cliquables (Patrimoine · Locations · Facturation · Ventes & cessions · Encaissements & recouvrement), alignés sur les métadonnées de fil d'Ariane déjà portées par les routes — sans ajouter de 3ᵉ niveau d'accordéon (`NavChild.groupLabel`, `sidebar.component.ts/html/css`).

**Sections non implémentées** : "Comptabilité & Gestion" et "Logistique" existent dans la sidebar comme groupes avec des enfants non cliquables (placeholders sans route ni icône). Traiter ces libellés comme une feuille de route affichée, pas comme des écrans à documenter ici.

## Voice and Tone

Français professionnel, direct, jamais familier. Les libellés nomment l'action au participe/infinitif court ("Nouveau contrat", "Générer les factures", "Rattacher") plutôt que la mécanique système. Les messages de confirmation nomment l'entité par son nom réel ("SN Logistique SARL a été activé.") plutôt qu'un pronom générique. Les erreurs de validation sont courtes et disent la règle, pas le code d'erreur ("Nom requis (2 caractères min.)", "Le montant dépasse le solde disponible de l'encaissement."). Aucune touche d'humour ou d'emoji — cohérent avec la posture "outil professionnel sobre" de DESIGN.md.

## Component Patterns

*(Spécifications visuelles dans DESIGN.md → Components ; ici, le comportement.)*

- **Triade de liste** (`table-toolbar` → tableau dense → `table-pagination`) : c'est le patron canonique de tout écran de liste. Le filtre rapide et le tri sont côté client sur les données déjà chargées (pas de requête serveur par frappe). Le changement de taille de page réinitialise toujours l'index de page à 0.
- **catalog-list** : seul composant de liste réellement générique (piloté par une config `CatalogConfig<T>`, sans couplage à un service) — utilisé pour les référentiels simples (types de site, spécifications). Les 24 autres écrans de liste répètent la même anatomie visuelle à la main ; ne pas supposer qu'ils partagent du code, seulement des classes CSS.
- **entity-picker-dialog** : avant de valider une désélection, ouvre un `confirm-dialog` imbriqué (tone danger) avec un message de retrait personnalisé — jamais de suppression silencieuse d'une association existante.
- **confirm-dialog** : tone `default` (icône aide, action bleue) vs `danger` (icône avertissement, action rouge). **Décidé (AD-2)** : le bouton "Annuler" est désormais neutre en tone `default` ; le rouge plein reste réservé au tone `danger`, cohérent avec le bouton de confirmation.
- **Rattachement/affectation** (Structure→Structure, Agent→Structure) : la cible doit toujours être active ; toute règle de cycle ou de statut est vérifiée côté service et remontée comme message d'erreur inline, jamais bloquée silencieusement dans le sélecteur.

## State Patterns

- **Chargement** : un seul indicateur global (barre fine en haut de viewport, compteur de requêtes concurrentes) — pas de squelettes ni de spinners locaux par écran. Toute action asynchrone doit passer par ce compteur partagé pour éviter qu'une requête rapide ne masque prématurément l'indicateur d'une requête encore en cours.
- **Succès/Erreur** : uniquement deux tons de toast (vert succès 4s, rouge erreur 5s, centrés en haut). Pas de variante "info" ou "avertissement" — un message qui n'est ni un succès ni un échec franc doit être reformulé pour rentrer dans ce binaire, pas provoquer un 3ᵉ ton ad hoc.
- **Vide** : chaque liste a un état vide dédié (icône + phrase "Aucun·e [entité] ne correspond à votre recherche.") plutôt qu'un tableau simplement vide.
- **Désactivé plutôt que supprimé** : aucune entité du domaine n'a de suppression définitive exposée à l'utilisateur — le cycle de vie standard est Créer → Modifier → Activer/Désactiver. Une entité désactivée reste consultable et réactivable.
- **États dérivés, jamais éditables** : statut de Site (disponible/loué/cédé), statut et montant recouvré d'une Facture, montant alloué d'un Encaissement, statut "Converti" d'un Prospect — tous recalculés par une action métier (générer, rattacher, convertir), jamais par un champ de formulaire modifiable directement. Tout nouvel écran doit respecter cette règle : si un champ peut se déduire d'une relation, il ne devient pas un input.

## Interaction Primitives

- **Confirmation avant impact** : toute action qui change un état visible (activer/désactiver, convertir un prospect, rattacher un encaissement, retirer un membre) passe par un `confirm-dialog` nommant explicitement la conséquence en une phrase, jamais un "Êtes-vous sûr ?" générique.
- **Validation au blur/touch, jamais au keystroke** : les erreurs de champ n'apparaissent qu'après que le champ ait été touché (`touched`) — c'est déjà respecté partout, y compris dans le correctif historique du bouton "Suivant" du stepper utilisateur (qui doit forcer `markAllAsTouched()` pour révéler les erreurs bloquantes).
- **Tri par clic d'en-tête** : icône `unfold_more` → `arrow_upward`/`arrow_downward`, un seul critère de tri actif à la fois (pas de tri multi-colonnes).
- **Export** : Copier/Excel/PDF agissent toujours sur les lignes **filtrées et triées actuellement visibles**, jamais sur l'intégralité non filtrée de la table.

## Accessibility Floor

- Focus clavier visible partout (`:focus-visible`, anneau vert de marque) — à préserver sur tout nouveau contrôle interactif, y compris les boutons d'action de ligne et les items de menu.
- Tout bouton icône-seul porte un `aria-label` explicite (déjà systématique : sidebar, navbar, pagination, actions de ligne, fermeture de dialogue) — nouveau composant icône-seul = `aria-label` obligatoire dès la première version, pas un ajout après coup.
- Icônes strictement décoratives marquées `aria-hidden="true"` (marque, logo auth) — ne pas l'omettre sur une icône qui duplique déjà un texte adjacent.
- **Décidé (AD-3)** : `prefers-reduced-motion` est désormais géré sur les 5 animations de l'application (barre de chargement, transition du sous-menu sidebar, fondu de l'app-shell, tiroir de détail, lift au survol des cartes KPI). Toute nouvelle animation introduite doit inclure sa désactivation `prefers-reduced-motion` dès sa première version — ce n'est plus un ajout après coup toléré.
- Contraste : les cartes KPI bleu/bleu-foncé forcent un texte sombre, ambre/rose gardent le texte blanc — cette règle par variante doit être reconduite pour toute nouvelle couleur de carte, jamais un texte blanc par défaut appliqué sans vérification de contraste.

## Responsive & Platform

- **≥900px** : sidebar fixe (272px déployée / 76px repliée, préférence persistée en `localStorage`), navigation principale.
- **≤900px** : sidebar devient un panneau hors-canevas (toujours 272px, coulissant), révélé par un bouton hamburger, avec un voile d'arrière-plan qui la referme au clic ; se referme aussi automatiquement à la navigation.
- **≤640px** : navbar perd la recherche et les informations utilisateur textuelles (conserve l'avatar).
- **≤480px** : formulaires en dialogue repassent en colonne unique (`.entity-form__row` empile ses champs), les dialogues perdent leur largeur minimale.
- Aucune adaptation tactile spécifique au-delà du réempilement — les boutons d'action de ligne (32px) ne sont pas agrandis pour le tactile ; à revoir si un usage tablette/mobile réel émerge au-delà de la consultation de secours.

## Key Flows

### 1. Cheikh crée un compte et l'habilite

Cheikh, administrateur système, doit donner accès à l'application à une nouvelle comptable.

1. Depuis **Gestion des utilisateurs**, il clique "Nouvel utilisateur" — un formulaire en plusieurs étapes s'ouvre (identité, contact, informations professionnelles).
2. À l'étape 2, il oublie de renseigner le téléphone et clique "Suivant" : les erreurs de l'étape apparaissent immédiatement (le clic force `markAllAsTouched()`), il corrige et avance.
3. Il valide la création : toast de succès, et si la notification "Création de compte" est activée dans **Notifications e-mail**, une entrée apparaît dans le journal des envois simulés.
4. Il ouvre **Habilitations**, sélectionne le rôle "Comptable", et utilise le sélecteur de membres pour y ajouter la nouvelle utilisatrice.
5. **Climax** : il referme la fenêtre sans sauvegarder les habilitations par erreur — en rouvrant l'écran, le rôle "Comptable" liste bien la nouvelle utilisatrice : la permission `billing.manage` est immédiatement active à sa prochaine connexion, sans redéploiement ni configuration supplémentaire.

### 2. Awa structure une nouvelle direction et y rattache un agent

Awa, RH, doit intégrer une nouvelle Direction Commerciale et y affecter un agent existant.

1. Dans **Structures organisationnelles**, elle crée "Direction Commerciale", type "Direction", sans se soucier du rattachement (le formulaire de création ne gère jamais la hiérarchie).
2. Elle bascule sur **Affectations & rattachements**, choisit la nouvelle direction et lui assigne "Direction Générale" comme parent — le service refuse tout parent inactif ou toute boucle, sans qu'Awa ait besoin de le savoir à l'avance.
3. Elle affecte ensuite l'agent Moussa Ba à cette nouvelle direction depuis le même écran.
4. **Climax** : elle ouvre **Organigramme** — sans aucune action de sa part sur cet écran, la nouvelle direction et Moussa y apparaissent déjà, l'organigramme s'étant recalculé automatiquement à partir des données qu'elle vient de saisir ailleurs.

### 3. Ibrahima qualifie un prospect jusqu'à la conversion

Ibrahima, commercial, suit Teranga Import SARL depuis sa création comme prospect.

1. Il ouvre la fiche du prospect depuis **Prospects**, fait passer son statut de "En cours" à "Qualifié" via le formulaire de modification.
2. Depuis **Suivi clients & prospects**, il retrouve Teranga Import dans la liste des prospects en cours de suivi, avec son statut à jour.
3. Le besoin se confirme : il clique l'action "Convertir en client" sur la ligne du prospect. Un dialogue de confirmation nomme explicitement la conséquence ("Teranga Import SARL deviendra un client ; le prospect restera consultable avec le statut Converti.").
4. **Climax** : il confirme — un `Client` est créé instantanément avec une référence auto-générée, le prospect passe en statut "Converti" et devient définitivement non modifiable (le bouton Modifier se désactive sur cette ligne), et l'onglet "Conversions" du Suivi affiche désormais le lien entre l'ancien prospect et le nouveau client.

### 4. Fatou facture le mois, encaisse, et relance les impayés

Fatou, agent de facturation, clôt le cycle mensuel.

1. Depuis **Factures**, elle clique "Générer les factures", saisit la période (mois), et le système crée une facture pour chaque contrat de location actif n'en ayant pas déjà pour ce mois — un toast annonce le nombre généré.
2. Un client règle par virement : elle enregistre l'encaissement dans **Encaissements**.
3. Dans **Recouvrement**, elle repère la facture correspondante encore "Impayée", clique "Rattacher", choisit l'encaissement dans la liste (qui n'affiche que ceux au solde disponible positif) et confirme un montant — la facture passe en "Recouvrée" ou "Partiellement recouvrée" selon le montant couvert.
4. En fin de mois, elle ouvre **Loyers impayés**, filtre les factures encore en souffrance, et clique "Générer les alertes" : chaque facture échue produit une entrée de relance dans le journal, visible depuis **Notifications**.
5. **Climax** : sur le **Tableau de bord** Facturation, le taux de recouvrement et le montant à recouvrer se mettent à jour immédiatement — aucun des quatre écrans qu'elle vient de traverser n'a de bouton "rafraîchir les KPIs" : c'est la même donnée, vue sous quatre angles.
