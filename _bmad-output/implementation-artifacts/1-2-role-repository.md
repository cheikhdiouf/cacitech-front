# Story 1.2: Repository pour Role

Status: done

## Story

As a développeur,
I want extraire un contrat `RoleRepository` (abstrait) + `MockRoleRepository` à partir de `RolesService`, en suivant le contrat de référence posé en Story 1.1,
so that les habilitations suivent le même modèle Component→Service→Repository.

## Acceptance Criteria

1. `RoleRepository` expose `items`, `create`, `update`, `setPermissions`, `setUsers`, `setGroups`.
2. `MockRoleRepository` implémente ce contrat et porte les données mock actuelles.
3. `RoleRepository` est injecté par token DI dans `app.config.ts`.
4. `RolesService` ne dépend que de l'abstraction ; `hasPermission` reste une lecture synchrone (`repository.items()`), critique pour `permissionGuard` (AD-4).
5. L'unicité du nom de rôle reste vérifiée à la création ET à la modification, dans le Service.
6. Aucun composant modifié.
7. `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` passent sans erreur.

## Tasks / Subtasks

- [x] Créer `RoleRepository` (AC: #1)
- [x] Créer `MockRoleRepository` (AC: #2)
- [x] Enregistrer le token DI dans `app.config.ts` (AC: #3)
- [x] Refactorer `RolesService` (AC: #4, #5, #6)
- [x] Vérification non-régression (AC: #7)

## Dev Notes

- Suit exactement le pattern posé en Story 1.1 (UserGroup) et l'exemplaire Users.
- Alignement volontaire sur `UsersService` : erreurs de validation renvoyées immédiatement (sans delay), au lieu du delay de 500ms sur le cas d'erreur dans l'ancien code — comportement fonctionnel identique.
- `hasPermission` conservé en lecture synchrone sur le signal du Repository — ne jamais le rendre asynchrone (AD-4).

### References

- [Source: src/app/core/services/roles.service.ts] (avant refactor)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-cicatech-front-2026-08-26/ARCHITECTURE-SPINE.md#AD-2, AD-4, AD-5]

## Dev Agent Record

### Debug Log References

- `tsc --noEmit --noUnusedLocals --noUnusedParameters` : 1 erreur pré-existante sans rapport (`app.component.spec.ts`).
- `ng build` : succès, seul avertissement de budget bundle pré-existant.

### Completion Notes List

- `RoleRepository`/`MockRoleRepository` créés ; `RolesService` refactoré, ne dépend plus que de l'abstraction.
- Aucun composant modifié.

### File List

- NEW `src/app/core/repositories/role.repository.ts`
- NEW `src/app/core/repositories/mock-role.repository.ts`
- UPDATE `src/app/core/services/roles.service.ts`
- UPDATE `src/app/app.config.ts`
