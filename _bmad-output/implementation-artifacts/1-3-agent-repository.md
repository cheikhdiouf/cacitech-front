# Story 1.3: Repository pour Agent

Status: done

## Story

As a développeur,
I want extraire un contrat `AgentRepository` (abstrait) + `MockAgentRepository` à partir de `AgentsService`,
so that la gestion des agents RH suive le même modèle Component→Service→Repository.

## Acceptance Criteria

1. `AgentRepository` expose `items`, `create`, `update`, `setActive`, `assignToStructure`.
2. `MockAgentRepository` implémente ce contrat et porte les données mock actuelles.
3. `AgentRepository` est injecté par token DI dans `app.config.ts`.
4. `AgentsService` ne dépend que de l'abstraction pour la persistance ; la règle métier (structure inactive interdite) reste dans le Service, croisée avec `OrgStructuresService`.
5. Comportement identique, y compris le refus d'affecter un agent à une structure inactive.
6. Aucun composant modifié ; l'organigramme (`OrgChartService`) continue de fonctionner sans changement.
7. `tsc --noEmit --noUnusedLocals --noUnusedParameters` et `ng build` passent sans erreur.

## Tasks / Subtasks

- [x] Créer `AgentRepository` (AC: #1)
- [x] Créer `MockAgentRepository` (AC: #2)
- [x] Enregistrer le token DI dans `app.config.ts` (AC: #3)
- [x] Refactorer `AgentsService` (AC: #4, #5, #6)
- [x] Vérification non-régression (AC: #7)

## Dev Notes

- Le Repository ne connaît pas `OrgStructuresService` : la validation croisée (structure existante/active) reste entièrement dans `AgentsService`, comme avant.
- `OrgChartService` dérive par `computed` sur `AgentsService.agents`/`OrgStructuresService.structures` — aucun changement nécessaire car ces signaux exposés restent identiques en forme.

### References

- [Source: src/app/core/services/agents.service.ts] (avant refactor)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]

## Dev Agent Record

### Debug Log References

- `tsc`/`ng build` : succès, mêmes avertissements pré-existants et sans rapport.

### File List

- NEW `src/app/core/repositories/agent.repository.ts`
- NEW `src/app/core/repositories/mock-agent.repository.ts`
- UPDATE `src/app/core/services/agents.service.ts`
- UPDATE `src/app/app.config.ts`
