# Architecture Review: TDD-Driven Reactive Functional Domain Modeling With DDD

This review checks whether the current architecture can support a future workflow based on:

- TDD-driven implementation
- Reactive Functional Domain Modeling
- Domain-Driven Design boundaries
- Svelte as the reactive UI shell
- Phaser as an imperative rendering/physics adapter
- Superpowers-style step-by-step implementation skills

## Current Verdict

The project can evolve toward this workflow, but it is not there yet.

The strongest foundations are:

- Stage layouts are already data-driven JSON.
- `selectStage()` clones selected stage data before giving it to gameplay.
- `objectDefinitions.ts` has started centralizing placement and collision contracts.
- Runtime assets are moving toward a catalog/preload model.
- Save-data functions are mostly pure except persistence calls.

The main blockers are:

- `GameplayScene.ts` mixes domain rules, physics adapter code, rendering, audio events, HUD events, timers, boss patterns, and object lifecycle in one imperative class.
- `App.svelte` owns too many app-level responsibilities: routing, settings, save updates, music policy, gamepad routing, transitions, result state, and Phaser lifecycle.
- There is no test runner or test boundary yet.
- Important behavior is currently only verifiable by manually playing the game.
- Some UI data and stage presentation are still hard-coded in components instead of being modeled as domain/application data.

## Target Architecture

The goal is not to remove Phaser or Svelte. The goal is to isolate decision-making from side effects.

```text
Domain Model
  Pure types, rules, reducers, invariants
  No Svelte, no Phaser, no DOM, no localStorage

Application Services
  Use cases that coordinate domain rules
  Stage selection, save progression, result calculation, unlock policy
  Mostly pure or dependency-injected

Adapters
  Phaser adapter: physics, sprites, collision callbacks, camera, scene lifecycle
  Svelte adapter: reactive UI state, routing, controls, settings panels
  Browser adapter: localStorage, audio elements, preload, fullscreen

Presentation
  Svelte components render derived state and send user intents
```

Phaser should answer "what happened in the simulation?" Svelte should answer "what screen should be shown?" The domain layer should answer "what does this event mean for the game state?"

## Suggested Bounded Contexts

### Stage Catalog

Owns:

- stage ids
- stage metadata
- world ids
- unlock order
- stage map positions
- validation of stage JSON shape and references

Potential files:

- `src/domain/stage/stageTypes.ts`
- `src/domain/stage/stageCatalog.ts`
- `src/domain/stage/stageValidation.ts`

Move toward this from:

- `src/game/stages/stageTypes.ts`
- `src/game/stages/stageRegistry.ts`
- hard-coded stage positions in `src/StageSelect.svelte`

### Object Placement

Owns:

- object definitions
- grounded/airborne placement
- visual bottom inset
- collision contract
- support-surface validation

Potential files:

- `src/domain/placement/objectDefinitions.ts`
- `src/domain/placement/placementRules.ts`
- `src/domain/placement/placementValidation.ts`

This should remain pure and heavily tested.

### Progression and Save

Owns:

- stage clear records
- best time/rank/coins
- next-stage unlock policy
- debug unlock policy as a separate adapter concern

Potential files:

- `src/domain/progression/progressionRules.ts`
- `src/app/save/saveRepository.ts`

Move browser-specific `localStorage` out of pure progression rules.

### Result and Rank

Owns:

- elapsed time parsing/formatting
- rank calculation
- scoring dimensions
- stage-specific target interpretation

Potential files:

- `src/domain/result/rankRules.ts`
- `src/domain/result/stageResult.ts`

This is one of the safest first TDD targets.

### Gameplay Intent

Owns:

- input intent normalization
- jump buffering/coyote time decisions
- homing availability decisions
- crouch/hurt invulnerability rules

Potential files:

- `src/domain/gameplay/playerIntent.ts`
- `src/domain/gameplay/playerStateMachine.ts`

This should be introduced gradually. Do not try to rewrite all of `GameplayScene.ts` at once.

### Assets

Owns:

- logical asset ids
- runtime asset paths
- preload groups
- stage/world asset requirements

Potential files:

- `src/domain/assets/assetIds.ts`
- `src/game/assets/assetManifest.ts`
- `src/game/assets/preloadPlan.ts`

Keep runtime file discovery separate from gameplay decisions.

## Reactive Functional Modeling In Svelte

Svelte should model app state as values plus derived values, not as a large set of unrelated mutable variables.

Recommended direction:

- Represent app navigation with a discriminated union.
- Represent user actions as typed commands/intents.
- Use derived values for selected world music, selected backdrop, result availability, and menu state.
- Move persistence and audio effects behind small services.

Example target shape:

```ts
type AppRoute =
  | { name: 'title'; menuOpen: boolean }
  | { name: 'world-select'; selectedWorld: WorldId }
  | { name: 'stage-select'; worldId: WorldId; selectedStage: StageId }
  | { name: 'gameplay'; stageId: StageId; paused: boolean }
  | { name: 'settings'; origin: 'title' | 'pause' }
```

`App.svelte` can still own the route, but route transitions should become pure functions that tests can cover.

## TDD Entry Points

Start with pure rules before adding component or Phaser tests.

Recommended first tests:

1. Stage validation
   - grounded player/enemy/checkpoint/goal must sit on platform surface
   - hazards must sit on supported surfaces
   - moving platforms must have valid axis/distance/duration
   - stage ids and world ids must match

2. Placement rules
   - player center from `surfaceY`
   - guard center from `surfaceY`
   - goal bottom alignment
   - spike center from `surfaceY`, height, and bottom inset

3. Progression rules
   - first stage unlocked
   - next stage unlocks after prior clear
   - best time/rank/coin merge rules
   - debug unlock is not part of pure progression logic

4. Rank rules
   - stage-specific S/A/B/C thresholds
   - time parsing and comparisons
   - result display formatting

5. Stage select view model
   - stage options for a world
   - selected stage detail
   - positions are data-driven
   - locked/c cleared state

After these are stable, add Svelte component tests and a browser smoke test.

## Testing Tool Recommendation

Add Vitest first.

Minimal package direction:

- `vitest` for pure TypeScript unit tests
- `@testing-library/svelte` later for component tests
- Playwright later for browser smoke tests

Do not start with Playwright as the primary TDD tool. Browser tests are slower and will not force domain separation.

## Refactor Sequence

### Phase 1: Add Test Harness

Add Vitest and one tiny pure test. Do not refactor gameplay yet.

Acceptance:

- `npm run test` works.
- `npm run check` still works.
- First tests cover existing pure functions.

Status note: The first domain test harness lives in `src/domain/`. Keep future pure rules under this folder before wiring them into Svelte or Phaser adapters.

### Phase 2: Extract Pure Progression and Rank Rules

Move parsing, rank comparison, stage unlock, and record merge logic into pure functions.

Acceptance:

- `saveData.ts` becomes mostly a storage adapter.
- record merge behavior has tests.
- debug unlock remains browser/dev-only adapter logic.

### Phase 3: Extract Stage Validation and Placement Rules

Move validation out of `stageRegistry.ts` into pure domain files.

Acceptance:

- stage validation tests can run without importing Phaser or Svelte.
- object placement tests cover the grounded alignment bugs that have recurred.

### Phase 4: Create Stage Select View Model

Move stage option construction and stage positions out of `StageSelect.svelte`.

Acceptance:

- component receives a view model.
- positions become catalog data.
- world-specific stage maps are testable without rendering Svelte.

### Phase 5: Start Gameplay Domain Extraction

Extract only small decision rules from `GameplayScene.ts`, such as:

- can jump now
- consume jump buffer
- homing target eligibility
- enemy respawn policy
- coin collection along homing trail

Acceptance:

- Phaser still performs physics and rendering.
- Pure tests cover decisions.
- No attempt is made to rewrite the whole scene.

### Phase 6: App Route Modeling

Replace scattered route/menu booleans with a discriminated union and tested transition functions.

Acceptance:

- route transitions are testable.
- music policy becomes derived from route + selected stage/world + result state.
- settings and pause origins are explicit.

## Superpowers-Style Implementation Steps

The actual Superpowers skill is not currently installed in this session, so this project should keep the workflow in repo documents until the skill is available.

Use this local equivalent:

1. `AGENTS.md`
   - mandatory session entry point
   - tells agents what to read first

2. `docs/PROJECT_WORKFLOW.md`
   - implementation cycle
   - feature brief rule
   - verification matrix

3. `docs/templates/FEATURE_BRIEF.md`
   - required planning format for cross-boundary changes

4. This document
   - architecture target and migration sequence

For every future feature:

1. Read `AGENTS.md`.
2. Create a feature brief if more than one boundary is touched.
3. Write or update a failing test for pure domain behavior first.
4. Implement the smallest domain change.
5. Connect the adapter layer.
6. Verify with tests and a browser smoke check.
7. Update docs if the architecture rule changed.

## Architecture Fit Score

| Area | Current fit | Notes |
| --- | --- | --- |
| DDD bounded contexts | Medium-low | Contexts are emerging but still file-based, not domain-based. |
| Functional domain modeling | Low-medium | Some pure functions exist, but key behavior lives in classes/components. |
| Reactive Svelte modeling | Medium-low | Svelte is reactive, but state shape is scattered across many variables. |
| TDD readiness | Low | No local test harness and few extracted domain rules. |
| Phaser adapter isolation | Low | `GameplayScene.ts` is still the main behavior owner. |
| Asset/preload discipline | Medium | Auto asset catalog helps, but domain asset requirements need modeling. |
| Stage data discipline | Medium-high | JSON stages and validation are good; validation should move to tested domain. |

## Recommended Next Commit Scope

The next implementation commit should be small:

1. Add Vitest.
2. Add pure tests for progression/rank or placement rules.
3. Extract only the functions needed to make those tests pass.

Do not begin by refactoring `GameplayScene.ts`. That would be too risky without tests.
