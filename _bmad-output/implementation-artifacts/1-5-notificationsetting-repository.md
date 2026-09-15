# Story 1.5: Repository pour NotificationSetting

Status: done

## Story

As a développeur,
I want extraire un contrat `NotificationSettingRepository` (abstrait) + `MockNotificationSettingRepository` à partir de `NotificationSettingsService`,
so that la gestion des notifications e-mail suive le même modèle Component→Service→Repository, complétant la généralisation à toutes les entités du domaine.

## Acceptance Criteria

1. `NotificationSettingRepository` expose `items`, `setEnabled`.
2. `MockNotificationSettingRepository` implémente ce contrat et porte les données mock actuelles.
3. `NotificationSettingRepository` est injecté par token DI dans `app.config.ts`.
4. Comportement identique, y compris l'usage de `isEnabled` par `UsersService`/`UserListComponent`.
5. `NotificationLogService` continue de journaliser sans modification.
6. Toutes les stories de l'Epic 1 terminées : chaque Service du domaine suit exclusivement Component→Service→Repository ; `tsc`/`ng build` passent sur l'ensemble du projet.

## Tasks / Subtasks

- [x] Créer `NotificationSettingRepository` (AC: #1)
- [x] Créer `MockNotificationSettingRepository` (AC: #2)
- [x] Enregistrer le token DI dans `app.config.ts` (AC: #3)
- [x] Refactorer `NotificationSettingsService` (AC: #4, #5)
- [x] Vérification non-régression finale sur l'ensemble du projet (AC: #6)

## Dev Notes

- Entité clé par `key` (string) plutôt que `id` — contrat adapté en conséquence (`setEnabled(key, emailEnabled)`), pas de `create`/`update` (liste de settings fixe).
- Clôture l'Epic 1 : Users, UserGroup (1.1), Role (1.2), Agent (1.3), OrgStructure (1.4), NotificationSetting (1.5) suivent tous désormais Component→Service→Repository avec DI dans `app.config.ts` (AD-2, AD-3, AD-5 du spine appliqués).

### References

- [Source: src/app/core/services/notification-settings.service.ts] (avant refactor)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-cicatech-front-2026-08-26/ARCHITECTURE-SPINE.md]

## Dev Agent Record

### Debug Log References

- `tsc --noEmit --noUnusedLocals --noUnusedParameters` : 1 erreur pré-existante sans rapport (`app.component.spec.ts`), inchangée depuis avant l'Epic 1.
- `ng build` : succès sur l'ensemble du projet après les 5 stories. Seul avertissement : budget bundle initial dépassé de 24.23 kB, pré-existant.

### Completion Notes List

- Epic 1 terminé : généralisation du pattern Repository à UserGroup, Role, Agent, OrgStructure, NotificationSetting, en plus de l'exemplaire Users déjà en place.
- Aucun composant modifié sur l'ensemble de l'epic.
- CAP-9 de SPEC.md est désormais vérifiable pour toutes les entités du domaine : basculer vers une API réelle ne nécessite plus que de remplacer chaque `MockXRepository` par un `HttpXRepository` + sa registration DI dans `app.config.ts`.

### File List

- NEW `src/app/core/repositories/notification-setting.repository.ts`
- NEW `src/app/core/repositories/mock-notification-setting.repository.ts`
- UPDATE `src/app/core/services/notification-settings.service.ts`
- UPDATE `src/app/app.config.ts`
