---
id: SPEC-cicatech-front
companions: ['../../planning-artifacts/architecture/architecture-cicatech-front-2026-08-26/ARCHITECTURE-SPINE.md']
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# cicatech-front — Paramétrage & Sécurités + Ressources Humaines

## Why

Cacitech est une app d'administration Angular actuellement bâtie sur des données mockées, couvrant deux modules métier : Paramétrage & Sécurités (comptes, groupes, habilitations, notifications e-mail) et Ressources Humaines (agents, structures organisationnelles, hiérarchie, organigramme). L'API backend réelle n'est pas encore disponible : le travail en cours consiste à finaliser interfaces, parcours utilisateurs et règles métier sur mock, tout en préparant l'architecture pour que le branchement de la vraie API se fasse sans réécrire composants ni parcours (mandat explicite de l'équipe projet).

## Capabilities

- **CAP-1**
  - **intent:** Un administrateur peut gérer le cycle de vie complet d'un compte utilisateur : créer, lister, consulter le détail, modifier, activer/désactiver, réinitialiser le mot de passe ; l'utilisateur peut changer son propre mot de passe.
  - **success:** Chaque action est réalisable depuis l'écran Gestion des utilisateurs, avec validations de formulaire et messages de succès/erreur visibles.

- **CAP-2**
  - **intent:** Un administrateur peut gérer les groupes d'utilisateurs : créer, lister, détail, modifier, activer/désactiver, gérer les membres.
  - **success:** Un groupe est créé/modifié avec unicité du nom vérifiée à la création ET à la modification ; les membres peuvent être ajoutés ou retirés.

- **CAP-3**
  - **intent:** Un administrateur peut gérer les habilitations : associer/retirer des rôles à des utilisateurs ou des groupes.
  - **success:** Un rôle porte une liste de permissions ; `permissionGuard` bloque l'accès à une route pour un utilisateur qui n'a pas la permission requise.

- **CAP-4**
  - **intent:** Un administrateur peut gérer les notifications e-mail liées aux comptes (activation/désactivation par type d'événement).
  - **success:** Chaque envoi simulé est journalisé et consultable dans le journal de notifications.

- **CAP-5**
  - **intent:** Un administrateur RH peut gérer les agents : créer, lister, détail, modifier, activer/désactiver.
  - **success:** Un agent est géré indépendamment de son affectation, avec les mêmes garanties d'unicité/validation que les autres entités du système.

- **CAP-6**
  - **intent:** Un administrateur RH peut gérer les structures organisationnelles et leur hiérarchie : créer, lister, détail, modifier, activer/désactiver, rattacher à un parent.
  - **success:** Une structure a au plus un parent, aucune auto-référence ni cycle n'est possible, et une structure inactive ne peut plus recevoir de nouveau rattachement.

- **CAP-7**
  - **intent:** Un administrateur RH peut affecter un agent à une structure active, et rattacher une structure à une structure parente active.
  - **success:** L'écran Affectations & rattachements applique les règles de CAP-6 et affiche les erreurs métier renvoyées par le service en cas de violation.

- **CAP-8**
  - **intent:** Le système génère automatiquement l'organigramme à partir des agents et structures existants.
  - **success:** L'organigramme n'est jamais saisi manuellement et reflète en temps réel l'état courant des structures/agents (recalcul réactif).

- **CAP-9**
  - **intent:** L'architecture permet de brancher la vraie API backend à la place du mock sans réécrire composants ni parcours fonctionnels.
  - **success:** Pour une entité donnée, remplacer `MockXRepository` par `HttpXRepository` + sa registration DI dans `app.config.ts` suffit à basculer sur le backend réel (gouverné par le companion architecture, AD-1 à AD-5). Vérifié pour toutes les entités du domaine (Users, Groups, Roles, Agents, Structures, Notifications).

## Constraints

- Le sidebar "Paramétrage & Sécurités" est limité à exactement 4 entrées (Gestion des utilisateurs, Groupes d'utilisateurs, Habilitations, Notifications e-mail) ; les opérations CRUD/activation/détail restent dans les écrans, jamais en sous-menus.
- Les composants ne doivent jamais accéder aux données mockées directement — uniquement via le Service, lui-même via le Repository injecté (AD-2).
- Aucune structure inactive ne peut être choisie comme parent ou comme affectation pour une nouvelle association (agent ou structure).
- Le remplacement du backend mock par la vraie API se fait uniquement au niveau Repository + configuration DI (`app.config.ts`), sans réécrire Services, Components ni Models (AD-3).
- Chaque entité garde un contrat Repository/Service spécifique et minimal (pas de `IRepository<T>` générique forcé), pour respecter Interface Segregation et permettre la substitution Mock/Http sans changement côté Service (Liskov) (AD-5).

## Non-goals

- Aucune logique de refetch, de synchronisation ou de cache HTTP n'est développée pendant la phase mock — différée à l'intégration API réelle (AD-1).
- Le contrat d'erreur backend (mapping code HTTP → message utilisateur) et l'unification du suivi de chargement (manuel vs interceptor HTTP) ne sont pas tranchés dans cette phase — différés à l'intégration réelle.

## Success signal

Les deux modules (Paramétrage & Sécurités, Ressources Humaines) sont utilisables de bout en bout sur données mockées, sans incohérence fonctionnelle ni règle métier non couverte ; et pour au moins une entité autre que Users, l'équipe peut swapper son Repository Mock par un Repository Http sans modifier le Service ni les Components concernés.

