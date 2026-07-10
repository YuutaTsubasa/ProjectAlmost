# Gameplay Stage Unlock Progression Design

## Goal

Implement Prototype-compatible stage locking and unlocking in the rebuilt project:

- the first stage in the ordered catalog is playable from a fresh save.
- every later stage unlocks only after the previous stage in catalog order is cleared.
- cleared stages persist best result data.
- Stage Select visually distinguishes locked, unlocked, and cleared stages.
- Gameplay Result enables Next Stage only when the next stage exists and is unlocked by the clear result or by debug unlock.
- a development-only debug unlock mode can unlock every stage for testing.

The rebuild must use the Prototype as a behavior and visual reference only. Runtime code must stay in the new architecture and must not import from `__prototype__`.

## Prototype References

Use these files as references:

- `__prototype__/src/domain/progression/progressionRules.ts`
- `__prototype__/src/game/save/saveData.ts`
- `__prototype__/src/StageSelect.svelte`
- `__prototype__/src/App.svelte`

The rebuilt implementation may reuse names for concepts when they are clearer, but it must be newly implemented with the rebuild's DDD, functional core, and reactive presentation boundaries.

## Current Rebuild Gap

The rebuild currently has no persistent progression state:

- `StageSelectScreen.svelte` treats every stage as selectable and deployable.
- `confirmSelectedStage` opens gameplay for the selected stage without an unlock decision.
- `GameplayScreen.svelte` hard-codes Result HUD next-stage availability to false.
- settings delete confirmation closes the dialog but does not delete progression data.

This feature fills those gaps without changing stage catalog ownership or moving project roots.

## Architecture

### Domain Layer

Create pure progression rules under `src/domain/progression/`.

The domain owns:

- `StageRecord`
- `StageClearResult`
- `StageRecordMap`
- empty record creation
- stage time parsing
- stage clear record merge
- rank comparison via existing rank semantics
- stage unlock decisions by ordered stage ids
- next-stage lookup
- Stage Select option state projection

Domain rules must not access Svelte, Phaser, DOM, localStorage, URL query params, `import.meta.env`, timers, or random values.

Stage order is passed into domain functions by the caller. The domain must not import UI components or storage adapters.

### Application Layer

Create a browser progression store under `src/application/progression/`.

The store owns browser-specific behavior:

- save key: `project-almost:save`
- debug unlock key: `project-almost:debugUnlockAllStages`
- load save with malformed-data fallback
- write save after stage clear
- delete save
- parse development debug unlock query params

Debug unlock behavior:

- enabled only when the rebuild is running in a development environment.
- `?debugUnlock=1` and `?debugUnlock=true` enable the persisted debug flag.
- `?debugUnlockStages=1` and `?debugUnlockStages=true` also enable it.
- `?debugUnlock=0`, `?debugUnlock=false`, `?debugUnlockStages=0`, and `?debugUnlockStages=false` clear it.
- when enabled, every stage is treated as unlocked.
- delete save removes saved clear records but does not clear the debug unlock flag.

The application layer provides explicit dependencies for storage, location search, and dev mode so tests can cover behavior without real browser globals.

### App State And Reactive Flow

`App.svelte` keeps progression as reactive state alongside settings and screen state:

- load progression once on mount.
- pass Stage Select option states to `StageSelectScreen`.
- block deploy for locked stages before opening gameplay.
- record a stage clear when Gameplay produces a final result.
- update progression state immediately after recording, so returning to Stage Select shows the next stage unlocked.
- wire settings delete confirmation to delete progression save and refresh reactive progression state.
- compute Result HUD next-stage availability from current progression, current stage, and debug unlock.
- handle Result HUD `next-stage` by opening the next stage only when the progression rules allow it.

Gameplay clear recording uses the existing HUD/result values:

- time string
- rank
- collected coin count

The recording boundary must emit one clear event per completed run, not repeatedly on every reactive update while the result overlay remains visible.

### Stage Select UI

`StageSelectScreen.svelte` receives per-stage option state from App instead of calculating persistence by itself.

Stage states:

- locked: not deployable, visible as locked, can still be selected for preview.
- unlocked uncleared: deployable, no best record shown.
- cleared: deployable, shows best time, best rank, and max coins.

Prototype parity requirements:

- locked stages use the Prototype locked-node treatment, including the `◆` node marker.
- locked detail preview shows a lock overlay instead of implying the stage is playable.
- locked objective/deploy text uses localized locked copy.
- deploy click and double-click do nothing for locked stages.
- path lines are visually active only when both adjacent stages are unlocked.
- visually active unlocked path lines use white strokes with a subtle cool glow to match the current Prototype parity target.
- cleared stage nodes get a cleared visual state.
- selected locked stages still update the detail panel so the player can inspect the stage position and title.

Visible text must use localization references rather than new hard-coded gameplay UI strings. The rebuild must add `common.locked` to the typed localization catalog and translated text set before Stage Select renders locked labels.

### Gameplay Result UI

Result action state remains domain-driven through the existing result action model.

Next Stage is available when:

- there is a next stage in catalog order, and
- the next stage is unlocked after applying the current clear result, or debug unlock is enabled.

When unavailable, the Result HUD keeps the Prototype-style locked treatment.

When available and selected, `next-stage` starts the next stage with a new gameplay run id and refreshed music.

### Stage Catalog Boundary

The ordered stage ids come from the rebuild stage catalog, not from Prototype registries.

Unlock progression is global catalog order:

```text
1-1 -> 1-2 -> ... -> 1-6 -> 2-1 -> ...
```

This matches the Prototype progression rule of using the ordered stage registry and avoids per-world reset behavior unless a future spec changes progression.

## Implementation Slicing

Build this feature in three ordered slices. Each slice must be test-first and independently reviewable.

### Slice 1: Record System

The first slice records stage clear facts and persists them without changing Stage Select locking yet.

Scope:

- domain stage records and clear results.
- stage result merge rules.
- browser save load, save, record clear, and delete save.
- App wiring that records a completed gameplay run once.
- Settings Delete Save wiring that clears stored records.

This slice establishes the source of truth. It does not need to render locked Stage Select nodes yet.

### Slice 2: Unlock Projection

The second slice derives unlock state from recorded facts.

Scope:

- ordered stage id projection from the rebuild stage catalog.
- first-stage unlocked rule.
- previous-cleared unlock rule.
- next-stage lookup.
- debug unlock all stages.
- app-flow guards that prevent locked-stage deploy and allow next-stage navigation only when rules permit it.

This slice treats unlock state as a pure projection of records plus debug state. It must not duplicate record facts in UI state.

### Slice 3: UI Integration

The third slice applies the projection to Prototype-matching presentation.

Scope:

- Stage Select locked, unlocked, and cleared visual states.
- locked preview overlay and localized locked labels.
- path live state based on adjacent unlock states.
- cleared record display.
- Result HUD next-stage locked/available state.

This slice must not add new persistence logic. It consumes the record and unlock view model created by earlier slices.

## Data Model

Save data version:

```ts
type SaveData = {
  version: 1
  stageRecords: Partial<Record<StageId, StageRecord>>
}
```

Stage record:

```ts
type StageRecord = {
  cleared: boolean
  bestTimeMs: number
  bestTime: string
  bestRank: Rank
  maxCoins: number
}
```

Stage clear result:

```ts
type StageClearResult = {
  time: string
  rank: Rank
  coins: number
}
```

Merge rules:

- set `cleared` to true.
- keep the lower `bestTimeMs`.
- keep the corresponding `bestTime` for the lower time.
- keep the better rank.
- keep the highest coin count.
- preserve records for all other stages.

Malformed or incompatible save data loads as an empty save.

## Testing Strategy

Use TDD for every behavior slice.

Record System tests:

- empty records are empty.
- time parsing matches Prototype `MM:SS.hh`.
- merge keeps best time, best rank, and max coins independently.
- load empty save when storage is empty.
- load empty save when JSON is malformed or version is unsupported.
- record clear writes merged records.
- delete save removes save key and returns empty save.
- Gameplay clear recording writes one record per completed run.
- Settings Delete Save clears persisted stage records.

Unlock Projection tests:

- first stage is unlocked by empty records.
- later stage is locked until the previous stage is cleared.
- next stage lookup follows catalog order and returns none at the end.
- option state projection marks locked, unlocked, and cleared stages.
- debug query enables and disables the dev-only unlock key.
- debug unlock is ignored outside dev mode.
- locked selected stage confirm leaves the app on Stage Select.
- unlocked selected stage confirm opens gameplay.
- next-stage action opens the next stage only when allowed.

UI Integration tests:

- Stage Select source or component-level tests prove locked and cleared classes/labels are rendered.
- deploy is disabled or inert for locked stages.
- path active state depends on adjacent unlock states.
- Result HUD receives a true next-stage action state after a clear unlocks the next stage.

Verification before completion:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Non-Goals

- Cloud save.
- multiple save slots.
- route selection or branching unlock paths.
- changing the stage catalog order.
- changing gameplay scoring formulas.
- changing Prototype assets.
- moving runtime assets or project root folders.

## Acceptance Criteria

- Fresh save allows `1-1` and locks later stages.
- Clearing `1-1` unlocks `1-2` after the result is recorded.
- Stage Select cannot deploy a locked stage by click, double-click, keyboard, or controller confirm.
- Locked, unlocked, and cleared Stage Select visuals match the Prototype treatment.
- Result HUD Next Stage is locked before the current stage clear is recorded and available after the clear unlocks the next stage.
- DEV debug unlock can unlock all stages through Prototype-compatible query params.
- Delete save clears stored clear records and returns progression to the fresh-save unlock state.
- The implementation has focused tests for domain, application storage, app flow, and UI contract behavior.
