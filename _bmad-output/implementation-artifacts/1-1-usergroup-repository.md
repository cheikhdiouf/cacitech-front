# Story 1.1: Repository pour UserGroup

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a développeur,
I want extraire un contrat `UserGroupRepository` (abstrait) + `MockUserGroupRepository` à partir de la logique actuellement en signal dans `UserGroupsService`,
so that `UserGroupsService` ne dépende plus que de l'abstraction, posant le contrat de référence (Component→Service→Repository) que les stories 1.2 à 1.5 répliqueront pour Role/Agent/OrgStructure/NotificationSetting.

## Acceptance Criteria

1. Une classe abstraite `UserGroupRepository` expose exactement les opérations utilisées par le Service : lecture réactive (`items: Signal<UserGroup[]>`), `create`, `update`, `setActive`, `setMembers`. Pas de méthode générique superflue (pas de `IRepository<T>`).
2. `MockUserGroupRepository` implémente ce contrat, `providedIn: 'root'`, et porte les 4 groupes mock actuellement dans `UserGroupsService` (mêmes données, mêmes ids).
3. `UserGroupRepository` est injecté via provider token dans `app.config.ts`, à l'identique du pattern `{ provide: UserRepository, useClass: MockUserRepository }`.
4. `UserGroupsService.groups` expose `this.repository.items` (comme `UsersService.users = this.repository.items`) ; le service ne détient plus de `signal<UserGroup[]>` propre.
5. La validation d'unicité du nom (à la création ET à la modification, insensible à la casse, hors l'entité courante en update) reste dans `UserGroupsService`, lue de façon synchrone via `this.repository.items()` — jamais dans le Repository.
6. Aucun Component ni template n'est modifié. `UserGroupListComponent`, `UserGroupFormDialogComponent`, `UserGroupDetailDialogComponent` continuent de fonctionner sans changement de code, car ils ne consomment que `UserGroupsService` (jamais le Repository ni le signal directement).
7. Comportement observable inchangé pour l'utilisateur final : mêmes messages de succès/erreur, mêmes règles d'activation/désactivation, même gestion des membres via `setMembers`.
8. `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` passent sans erreur ni avertissement d'import/variable inutilisé.

## Tasks / Subtasks

- [ ] Task 1 — Créer le contrat `UserGroupRepository` (AC: #1)
  - [ ] Créer `src/app/core/repositories/user-group.repository.ts`, classe abstraite calquée sur `UserRepository` (voir Dev Notes — Exemplaire)
  - [ ] Signature : `abstract readonly items: Signal<UserGroup[]>`, `abstract create(group: UserGroup): Observable<UserGroup>`, `abstract update(id: string, group: UserGroup): Observable<UserGroup>`, `abstract setActive(id: string, active: boolean): Observable<void>`, `abstract setMembers(id: string, memberIds: string[]): Observable<void>`
- [ ] Task 2 — Créer `MockUserGroupRepository` (AC: #2, #7)
  - [ ] Créer `src/app/core/repositories/mock-user-group.repository.ts`, `@Injectable({ providedIn: 'root' })`, `implements UserGroupRepository`
  - [ ] Déplacer telles quelles les 4 données mock de `UserGroupsService.groupsSignal` dans un `signal<UserGroup[]>` privé du Repository ; exposer `readonly items = computed(() => this.itemsSignal())`
  - [ ] Déplacer la mécanique `create`/`update`/`setActive`/`setMembers` (delay 500ms via `MOCK_NETWORK_DELAY_MS`, `tap()` sur `itemsSignal.update(...)`, `withLoading(this.loadingService, ...)`) du Service vers le Repository — le Repository ne fait QUE la persistance, aucune validation d'unicité ici
- [ ] Task 3 — Enregistrer le token DI (AC: #3)
  - [ ] Dans `app.config.ts`, importer `UserGroupRepository`/`MockUserGroupRepository` et ajouter `{ provide: UserGroupRepository, useClass: MockUserGroupRepository }` au tableau `providers`, à côté de l'entrée `UserRepository` existante
- [ ] Task 4 — Refactorer `UserGroupsService` (AC: #4, #5, #6, #7)
  - [ ] Injecter `private readonly repository = inject(UserGroupRepository)`, supprimer `loadingService`, `groupsSignal`, `withLoading` (déplacés au Repository)
  - [ ] `readonly groups = this.repository.items;`
  - [ ] `create(value)` : garder la validation d'unicité (`this.repository.items().some(...)`) avec `throwError(() => new Error('Un groupe existe déjà avec ce nom.'))` retourné immédiatement (sans delay, cf. pattern `UsersService.create` — voir Dev Notes sur la nuance de timing), puis construire l'entité `UserGroup` et appeler `this.repository.create(group)`
  - [ ] `update(id, value)` : même schéma que `UsersService.update` — vérifier l'existence (`Groupe introuvable.`), vérifier l'unicité en excluant `id`, puis `this.repository.update(id, updated)`
  - [ ] `setActive(id, active)` → `this.repository.setActive(id, active)`
  - [ ] `setMembers(id, memberIds)` → `this.repository.setMembers(id, memberIds)`
- [ ] Task 5 — Vérification non-régression (AC: #8)
  - [ ] Lancer `tsc --noEmit --noUnusedLocals --noUnusedParameters`
  - [ ] Lancer `ng build`
  - [ ] Vérifier manuellement (ou via le composant existant) : liste des groupes, création avec nom dupliqué → erreur, modification avec nom dupliqué (hors soi-même) → erreur, activation/désactivation, gestion des membres — tous identiques à avant

## Dev Notes

- **Pattern à répliquer à l'identique** — `src/app/core/repositories/user.repository.ts` + `mock-user.repository.ts` + `src/app/core/services/users.service.ts` sont l'exemplaire validé (spine architecture AD-2, AD-5). Ne pas improviser une autre forme de contrat.
- **Répartition des responsabilités (AD-2, AD-5)** : le Repository ne fait QUE du CRUD/persistance (delay simulé, mise à jour du signal interne, `withLoading`). Toute règle métier (unicité du nom, existence de l'entité) reste dans le Service, lue de façon synchrone sur `repository.items()`. Ne jamais mettre de validation métier dans `MockUserGroupRepository`.
- **Nuance de timing à assumer** : le code actuel de `UserGroupsService.create/update` enveloppe même le cas d'erreur (nom dupliqué) dans `track(...).pipe(delay(500ms))`, alors que l'exemplaire `UsersService.create/update` retourne l'erreur immédiatement via `throwError(...)` sans delay ni `track`. Aligner `UserGroupsService` sur le pattern `UsersService` (erreur immédiate, seul le chemin succès passe par le Repository/delay) — c'est un léger changement de timing sur le cas d'erreur, pas de comportement fonctionnel (mêmes messages, même résultat). Documenté ici pour que ce ne soit pas perçu comme un oubli en revue.
- **Ne pas toucher** : `UserGroup`/`UserGroupFormValue` (`src/app/core/models/user-group.model.ts`), `UserGroupListComponent`, `UserGroupFormDialogComponent`, `UserGroupDetailDialogComponent`, `UserGroupDetailDialogComponent` — aucun de ces fichiers n'a besoin de changer (ils appellent uniquement les méthodes publiques de `UserGroupsService`, dont les signatures restent identiques).
- **Fichiers réellement modifiés/créés** :
  - NEW `src/app/core/repositories/user-group.repository.ts`
  - NEW `src/app/core/repositories/mock-user-group.repository.ts`
  - UPDATE `src/app/core/services/user-groups.service.ts` (lu intégralement — voir contenu actuel ci-dessous, section References)
  - UPDATE `src/app/app.config.ts` (ajout d'une ligne provider)
- **withLoading / LoadingService** : réutiliser `src/app/shared/utils/with-loading.ts` et `src/app/core/services/loading.service.ts` sans modification, exactement comme `MockUserRepository` le fait.
- **Portée de cette story** : uniquement UserGroup. Ne pas commencer Role/Agent/Structure/Notification (stories 1.2 à 1.5, hors scope ici) — chacune reproduira ce même schéma séparément.

### Project Structure Notes

- Nouveaux fichiers dans `src/app/core/repositories/`, aux côtés de `user.repository.ts`/`mock-user.repository.ts` — aucune nouvelle convention de dossier.
- Nommage : `XRepository` (abstrait) / `MockXRepository` (impl.), conforme à AD-2/AD-5 du companion architecture.
- Aucune variance détectée avec la structure unifiée du projet.

### References

- [Source: src/app/core/repositories/user.repository.ts] — forme exacte du contrat abstrait à répliquer
- [Source: src/app/core/repositories/mock-user.repository.ts] — forme exacte de l'implémentation mock (signal interne, `withLoading`, delay, `tap`)
- [Source: src/app/core/services/users.service.ts] — forme exacte du Service post-refactor (validation métier synchrone, `throwError` immédiat, délégation au repository)
- [Source: src/app/core/services/user-groups.service.ts] — code actuel à refactorer (données mock, `create`/`update`/`setActive`/`setMembers`)
- [Source: src/app/core/models/user-group.model.ts] — `UserGroup`, `UserGroupFormValue`, inchangés
- [Source: src/app/app.config.ts#providers] — emplacement d'ajout du token DI, ligne 21 actuelle `{ provide: UserRepository, useClass: MockUserRepository }`
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — story d'origine et acceptance criteria de niveau epic
- [Source: _bmad-output/planning-artifacts/architecture/architecture-cicatech-front-2026-08-26/ARCHITECTURE-SPINE.md#AD-2, AD-5] — règles d'architecture contraignantes (Repository généralisé, contrats spécifiques par entité, Dependency Inversion)
- [Source: _bmad-output/specs/spec-cicatech-front/SPEC.md#CAP-2, CAP-9] — capacité fonctionnelle (groupes) et objectif de bascule mock→API que ce refactor sert

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` : 1 erreur pré-existante et sans rapport (`app.component.spec.ts`, `Property 'title' does not exist`), non introduite par cette story.
- `npx ng build` : succès. Seul avertissement : budget de bundle initial dépassé de 20.32 kB, pré-existant et sans rapport avec ce refactor.

### Completion Notes List

- Contrat `UserGroupRepository` + `MockUserGroupRepository` créés à l'identique du pattern `UserRepository`/`MockUserRepository`.
- `UserGroupsService` refactoré : ne dépend plus que de `UserGroupRepository` (aucun accès direct aux données mock) ; validation d'unicité (création/modification) conservée dans le Service, sur lecture synchrone de `repository.items()`.
- Alignement volontaire de `create`/`update` sur le pattern `UsersService` : l'erreur de validation est renvoyée immédiatement (sans délai simulé), alors que l'ancien code enveloppait même l'erreur dans un delay de 500ms — comportement fonctionnel identique (mêmes messages, même résultat), seule la latence du cas d'erreur change.
- Aucun composant modifié (`UserGroupListComponent`, `UserGroupFormDialogComponent`, `UserGroupDetailDialogComponent` inchangés).
- Token DI enregistré dans `app.config.ts` aux côtés de `UserRepository`.

### File List

- NEW `src/app/core/repositories/user-group.repository.ts`
- NEW `src/app/core/repositories/mock-user-group.repository.ts`
- UPDATE `src/app/core/services/user-groups.service.ts`
- UPDATE `src/app/app.config.ts`
