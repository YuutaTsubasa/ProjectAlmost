# Chapter And Stage Select Info Update Design

## Goal

Fix Chapter Select and Stage Select information so both screens update from the rebuilt progression source of truth after AVG and gameplay clears.

The rebuild must keep Prototype visual parity without copying Prototype code. The implementation should use TDD, DDD boundaries, pure functional projections, and Svelte reactive rendering.

## Root Cause

`WorldSelectScreen.svelte` currently renders Chapter progress as hard-coded `0 / stageCount` and `0%`. It does not receive or derive progression data, so Chapter Select cannot update when save records change.

`StageSelectScreen.svelte` receives progression option states, but it builds its own progression lookup and fallback state inside the component. That keeps important information rules in presentation code and makes the screen easier to desynchronize when AVG, stage records, unlock rules, or new chapters change.

## Scope

This slice updates information projection and UI wiring only.

In scope:

- Chapter progress for each world counts only that world's own six stage ids.
- Stage Select selected-stage details continue to show locked, unlocked, cleared, and record information from progression state.
- Svelte components render prepared view models instead of owning progression rules.
- Existing visual layout, Prototype-style labels, and localization behavior are preserved.

Out of scope:

- New stage mechanics.
- New unlock rules.
- New save schema.
- AVG story flow changes.
- Stage Select map layout or visual redesign.
- Importing runtime code from `__prototype__/`.

## Architecture

### Domain Layer

`src/domain/progression/stageProgression.ts` remains the source for pure progression facts:

- stage records
- clear record merging
- stage unlocked decisions
- stage progression option projection

This slice does not move world grouping into the domain progression rules because Chapter Select progress is a UI-facing campaign summary built from catalogs plus projected progression facts.

### Application Layer

Add a pure presenter under `src/application/select/selectInfoPresenter.ts`.

The presenter accepts:

- `WorldCatalog`
- `StageCatalog`
- `StageProgressionOptionState<StageId>[]`

It returns immutable view models for the select screens.

`projectWorldSelectInfo` returns:

- ordered world infos
- each world's `clearedStageCount`
- each world's `stageCount`
- each world's `progressPercent`

The progress rule is:

```text
clearedStageCount = count(world.stageIds where progression[stageId].cleared)
progressPercent = clearedStageCount / world.stageIds.length * 100
```

Unknown progression entries do not count. Missing progression entries are treated as uncleared.

`projectStageSelectInfo` returns:

- ordered stages for the selected world
- each stage's `unlocked`
- each stage's `cleared`
- each stage's `record`

Missing progression entries are treated as locked and uncleared, matching the current defensive fallback while keeping the fallback outside the Svelte component.

### UI Layer

`App.svelte` derives select info view models from:

- `projectData.worlds`
- `projectData.stages`
- `gameplayStageMaps`
- `stageProgressionOptions`

`WorldSelectScreen.svelte` receives world select info and renders the selected world's progress count and track width. It must not render hard-coded progress values.

`StageSelectScreen.svelte` receives stage select info and uses it for:

- selected-stage lock state
- selected-stage record fields
- selected-stage collectible target count derived from gameplay map coins
- node locked and cleared classes
- deploy button availability

Stage Select keeps localized labels and current Prototype-style density. The component should remain reactive presentation: render props, emit intents, and avoid rebuilding progression state internally.

## Testing Strategy

Follow TDD.

Presenter tests:

- Chapter 1 progress counts only cleared records from `1-1` through `1-6`.
- Chapter 2 progress counts only cleared records from `2-1` through `2-6`.
- Unknown or missing progression entries do not affect chapter progress.
- Stage Select info for a selected world preserves unlocked, cleared, and record values.
- Missing stage progression entries become locked, uncleared, and recordless in the projected view model.

UI source contract tests:

- `WorldSelectScreen.svelte` receives select info and no longer contains hard-coded `0%` or `0 / {selectedWorld.stageCount}` progress rendering.
- `App.svelte` derives world and stage select info from `stageProgressionOptions`.
- `StageSelectScreen.svelte` receives prepared stage select info and does not rebuild `progressionByStageId`.

Verification commands:

- `npm run test -- src/application/select/selectInfoPresenter.test.ts`
- `npm run test -- src/ui/world/worldSelectInfo.test.ts src/ui/stage/stageSelectLocalization.test.ts src/application/progression/appStageProgressionWiring.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Acceptance Criteria

- Clearing `1-1` updates Chapter 1 progress to `1 / 6` and `16.666...%` rounded or clamped only at the UI formatting boundary.
- Clearing `2-1` updates Chapter 2 progress to `1 / 6` without changing Chapter 1 progress.
- Stage Select record fields update from the selected stage progression view model.
- Components no longer own progression lookup rules that belong in the application presenter.
- The implementation does not copy Prototype source code.
