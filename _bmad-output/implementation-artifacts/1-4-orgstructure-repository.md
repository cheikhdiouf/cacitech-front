# Story 1.4: Repository pour OrgStructure

Status: done

## Story

As a développeur,
I want extraire un contrat `OrgStructureRepository` (abstrait) + `MockOrgStructureRepository` à partir de `OrgStructuresService`,
so that la gestion des structures organisationnelles — y compris ses règles hiérarchiques — suive le même modèle Component→Service→Repository.

## Acceptance Criteria

1. `OrgStructureRepository` expose `items`, `create`, `update`, `setActive`, `assignParent`, sans logique de détection de cycle dans le Repository.
2. `MockOrgStructureRepository` implémente ce contrat et porte les données mock actuelles.
3. `OrgStructureRepository` est injecté par token DI dans `app.config.ts`.
4. Comportement identique : au plus un parent, aucune auto-référence, aucun cycle, aucune structure inactive utilisable comme parent.
5. Cette logique métier reste entièrement dans `OrgStructuresService` (`isDescendantOf` privé), jamais dans le Repository.
6. L'organigramme continue de se recalculer correctement.
7. `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` passent sans erreur.

## Tasks / Subtasks

- [x] Créer `OrgStructureRepository` (AC: #1)
- [x] Créer `MockOrgStructureRepository` (AC: #2)
- [x] Enregistrer le token DI dans `app.config.ts` (AC: #3)
- [x] Refactorer `OrgStructuresService`, `isDescendantOf` conservé côté Service (AC: #4, #5, #6)
- [x] Vérification non-régression (AC: #7)

## Dev Notes

- La story la plus délicate de l'epic : `isDescendantOf` (parcours de la chaîne de parents) et toutes les validations (auto-référence, parent inactif, cycle) restent dans `OrgStructuresService`, lues sur `repository.items()`. Le Repository ne fait que persister `parentId`.

### References

- [Source: src/app/core/services/org-structures.service.ts] (avant refactor)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Debug Log References

- `tsc`/`ng build` : succès, mêmes avertissements pré-existants et sans rapport.

### File List

- NEW `src/app/core/repositories/org-structure.repository.ts`
- NEW `src/app/core/repositories/mock-org-structure.repository.ts`
- UPDATE `src/app/core/services/org-structures.service.ts`
- UPDATE `src/app/app.config.ts`
