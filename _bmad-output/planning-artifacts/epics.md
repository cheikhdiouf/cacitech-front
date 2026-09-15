---
stepsCompleted: [1]
inputDocuments: ['_bmad-output/specs/spec-cicatech-front/SPEC.md', '_bmad-output/planning-artifacts/architecture/architecture-cicatech-front-2026-08-26/ARCHITECTURE-SPINE.md']
---

# cicatech-front - Epic Breakdown

## Overview

Ce document découpe en epics/stories le chantier identifié comme ouvert dans SPEC.md (CAP-9, Assumptions, Open Questions) : généraliser le pattern Repository — aujourd'hui complet uniquement pour Users — aux entités Groups, Roles, Agents, Structures, Notifications, afin que la bascule mock→API (AD-3) et le respect SOLID (AD-5) s'appliquent à tout le domaine, pas seulement à Users.

## Requirements Inventory

### Functional Requirements

FR1: Chaque entité (UserGroup, Role, Agent, OrgStructure, NotificationSetting) dispose d'un contrat Repository abstrait dédié, distinct des autres, exposant uniquement les opérations CRUD et méthodes métier réellement utilisées par son Service (ex. `assignParent`, `assignToStructure`, `setMembers`, `setActive`).
FR2: Chaque entité dispose d'une implémentation `MockXRepository` du contrat, portant les données actuellement stockées en signal dans le Service, sans changement de comportement observable pour les composants.
FR3: Chaque Service (UserGroupsService, RolesService, AgentsService, OrgStructuresService, NotificationSettingsService) est refactoré pour ne dépendre que de l'abstraction Repository de son entité (injectée par token DI dans `app.config.ts`), et ne plus accéder aux données mockées directement.
FR4: La logique métier (validations d'unicité, règles croisées, contrôle de cycle hiérarchique) reste intégralement dans le Service ; le Repository ne porte que du CRUD et des opérations de persistance simples.
FR5: Après refactor, tous les parcours fonctionnels existants (listes, formulaires, activation/désactivation, affectations RH, organigramme) continuent de fonctionner à l'identique sans modification des Components.

### NonFunctional Requirements

NFR1: Chaque contrat Repository doit rester substituable Mock ↔ Http sans changement de signature, de type de retour (`Observable<T>`) ni de convention d'erreur (Liskov Substitution — AD-5).
NFR2: Aucun contrat Repository générique unique (`IRepository<T>`) ne doit être introduit ; chaque entité garde un contrat minimal et spécifique (Interface Segregation — AD-5).
NFR3: Le refactor ne doit introduire aucune régression : `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` doivent passer après chaque entité migrée.

### Additional Requirements

- Le point de bascule mock→API reste au niveau Repository + registration DI dans `app.config.ts` uniquement (AD-3) — ce chantier ne crée pas encore de `HttpXRepository` réel, il prépare seulement le contrat.
- Aucune logique de refetch/synchronisation/cache n'est ajoutée à cette occasion (AD-1, hors scope).
- Le modèle d'état reste signal-backed dans le Service, mis à jour via `tap()` sur la réponse du Repository (AD-1, AD-2).

### UX Design Requirements

Aucun — ce chantier est un refactor d'architecture interne, sans impact visible sur l'UI ni les parcours utilisateurs (FR5).

### FR Coverage Map

| Requirement | Covered by |
| --- | --- |
| FR1: contrat Repository dédié par entité | Epic 1, chaque story |
| FR2: implémentation MockXRepository par entité | Epic 1, chaque story |
| FR3: Service dépendant uniquement de l'abstraction | Epic 1, chaque story |
| FR4: logique métier conservée dans le Service | Epic 1, chaque story |
| FR5: non-régression fonctionnelle | Epic 1, chaque story (critère de fin de story) |
| NFR1: substituabilité Mock/Http (Liskov) | Epic 1, story 1.1 (contrat de référence UserGroup) |
| NFR2: pas de Repository générique (Interface Segregation) | Epic 1, story 1.1 (contrat de référence UserGroup) |
| NFR3: tsc/ng build sans régression | Epic 1, chaque story |

## Epic 1: Généraliser le pattern Repository à toutes les entités du domaine

Chaque entité (UserGroup, Role, Agent, OrgStructure, NotificationSetting) suit la même chaîne Component→Service→Repository déjà exemplaire sur Users, la rendant indépendamment prête pour la bascule mock→API sans toucher aux composants.

### Story 1.1: Repository pour UserGroup

As a développeur,
I want extraire un contrat `UserGroupRepository` (abstrait) + `MockUserGroupRepository` à partir de la logique actuellement en signal dans `UserGroupsService`,
So that `UserGroupsService` ne dépende plus que de l'abstraction, posant le contrat de référence pour les entités suivantes.

**Acceptance Criteria:**

**Given** `UserGroupsService` gère aujourd'hui les groupes directement en signal
**When** le refactor est appliqué
**Then** une classe abstraite `UserGroupRepository` expose exactement les opérations utilisées par le Service (`getAll`, `create`, `update`, `setActive`, `setMembers`), sans méthode générique superflue
**And** `MockUserGroupRepository` implémente ce contrat et porte les données mock actuellement dans le Service
**And** `UserGroupRepository` est injecté par token DI dans `app.config.ts` (comme `UserRepository`/`MockUserRepository`)

**Given** le refactor est en place
**When** un composant appelle `UserGroupsService` (liste, création, modification, activation, gestion des membres)
**Then** le comportement observable est strictement identique à avant (mêmes messages succès/erreur, mêmes validations d'unicité à la création et à la modification)
**And** aucun Component ni template n'est modifié

**Given** le refactor est terminé
**When** `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` sont exécutés
**Then** les deux passent sans erreur ni avertissement d'import/variable inutilisé

### Story 1.2: Repository pour Role

As a développeur,
I want extraire un contrat `RoleRepository` (abstrait) + `MockRoleRepository` à partir de `RolesService`, en suivant le contrat de référence posé en Story 1.1,
So that les habilitations suivent le même modèle Component→Service→Repository.

**Acceptance Criteria:**

**Given** `RolesService` gère aujourd'hui les rôles et leurs associations utilisateur/groupe directement en signal
**When** le refactor est appliqué
**Then** `RoleRepository` expose les opérations utilisées par le Service (`getAll`, `create`, `update`, `setActive`, gestion des associations utilisateur/groupe)
**And** `MockRoleRepository` implémente ce contrat et porte les données mock
**And** `RoleRepository` est injecté par token DI dans `app.config.ts`

**Given** le refactor est en place
**When** un composant utilise `RolesService` (liste, création, modification, activation, association/retrait sur utilisateur ou groupe, `hasPermission`)
**Then** le comportement est strictement identique à avant, y compris la lecture synchrone utilisée par `permissionGuard`
**And** l'unicité du nom de rôle reste vérifiée à la création ET à la modification

**Given** le refactor est terminé
**When** `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` sont exécutés
**Then** les deux passent sans erreur

### Story 1.3: Repository pour Agent

As a développeur,
I want extraire un contrat `AgentRepository` (abstrait) + `MockAgentRepository` à partir de `AgentsService`, en suivant le contrat de référence posé en Story 1.1,
So that la gestion des agents RH suive le même modèle Component→Service→Repository.

**Acceptance Criteria:**

**Given** `AgentsService` gère aujourd'hui les agents et leur affectation à une structure directement en signal
**When** le refactor est appliqué
**Then** `AgentRepository` expose les opérations utilisées par le Service (`getAll`, `create`, `update`, `setActive`, `assignToStructure`)
**And** `MockAgentRepository` implémente ce contrat et porte les données mock
**And** `AgentRepository` est injecté par token DI dans `app.config.ts`

**Given** le refactor est en place
**When** un composant utilise `AgentsService` (liste, création, modification, activation, affectation à une structure via l'écran Affectations & rattachements)
**Then** le comportement est strictement identique à avant, y compris le refus d'affecter un agent à une structure inactive
**And** l'organigramme (`OrgChartService`, dérivé par `computed`) continue de refléter les agents sans modification

**Given** le refactor est terminé
**When** `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` sont exécutés
**Then** les deux passent sans erreur

### Story 1.4: Repository pour OrgStructure

As a développeur,
I want extraire un contrat `OrgStructureRepository` (abstrait) + `MockOrgStructureRepository` à partir de `OrgStructuresService`, en suivant le contrat de référence posé en Story 1.1,
So that la gestion des structures organisationnelles — y compris ses règles hiérarchiques — suive le même modèle Component→Service→Repository.

**Acceptance Criteria:**

**Given** `OrgStructuresService` gère aujourd'hui les structures et leur rattachement parent directement en signal
**When** le refactor est appliqué
**Then** `OrgStructureRepository` expose les opérations utilisées par le Service (`getAll`, `create`, `update`, `setActive`, `assignParent`), sans logique de détection de cycle ni de validation métier dans le Repository
**And** `MockOrgStructureRepository` implémente ce contrat et porte les données mock
**And** `OrgStructureRepository` est injecté par token DI dans `app.config.ts`

**Given** le refactor est en place
**When** un composant utilise `OrgStructuresService` (liste, création, modification, activation, rattachement à un parent)
**Then** le comportement est strictement identique à avant : au plus un parent, aucune auto-référence, aucun cycle, aucune structure inactive utilisable comme parent ou pour une nouvelle affectation
**And** cette logique métier (cycle, parent inactif) reste entièrement dans `OrgStructuresService`, jamais dans le Repository
**And** l'organigramme continue de se recalculer correctement (`computed` sur structures + agents)

**Given** le refactor est terminé
**When** `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` sont exécutés
**Then** les deux passent sans erreur

### Story 1.5: Repository pour NotificationSetting

As a développeur,
I want extraire un contrat `NotificationSettingRepository` (abstrait) + `MockNotificationSettingRepository` à partir de `NotificationSettingsService`, en suivant le contrat de référence posé en Story 1.1,
So that la gestion des notifications e-mail suive le même modèle Component→Service→Repository, complétant la généralisation à toutes les entités du domaine.

**Acceptance Criteria:**

**Given** `NotificationSettingsService` gère aujourd'hui l'activation/désactivation des notifications par type d'événement directement en signal
**When** le refactor est appliqué
**Then** `NotificationSettingRepository` expose les opérations utilisées par le Service (`getAll`, `setEnabled` ou équivalent)
**And** `MockNotificationSettingRepository` implémente ce contrat et porte les données mock
**And** `NotificationSettingRepository` est injecté par token DI dans `app.config.ts`

**Given** le refactor est en place
**When** un composant utilise `NotificationSettingsService` (lecture de `isEnabled`, activation/désactivation par type)
**Then** le comportement est strictement identique à avant, y compris l'usage de `isEnabled` par `UsersService`/`UserListComponent` pour décider si un e-mail de notification est envoyé
**And** `NotificationLogService` continue de journaliser les envois sans modification

**Given** toutes les stories de l'Epic 1 sont terminées
**When** on relit l'ensemble des Services du domaine (Users, Groups, Roles, Agents, Structures, Notifications)
**Then** chacun suit exclusivement le modèle Component→Service→Repository, aucun n'accède aux données mock directement
**And** `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` passent sans erreur sur l'ensemble du projet

## Epic List

### Epic 1: Généraliser le pattern Repository à toutes les entités du domaine
Chaque entité (UserGroup, Role, Agent, OrgStructure, NotificationSetting) suit la même chaîne Component→Service→Repository déjà exemplaire sur Users, la rendant indépendamment prête pour la bascule mock→API sans toucher aux composants.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, NFR1, NFR2, NFR3
