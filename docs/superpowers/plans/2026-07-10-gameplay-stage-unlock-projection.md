# Gameplay Stage Unlock Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the pure stage unlock projection, development debug unlock flag, and app-flow guards needed before Stage Select and Result HUD presentation consume locked/unlocked state.

**Architecture:** Keep unlock rules in `src/domain/progression/stageProgression.ts` as pure functions that receive ordered stage ids and stage records. Keep browser-only debug unlock persistence in `src/application/progression/browserStageProgressionStore.ts` with explicit storage/search/dev dependencies. Keep screen transitions deterministic in `src/domain/app/appFlow.ts`; Svelte only wires reactive state and dependencies.

**Tech Stack:** TypeScript, Svelte 5 runes, Vitest, existing DDD layers under `src/domain`, `src/application`, and `src/ui`.

---

## File Structure

- Modify: `src/domain/progression/stageProgression.ts`
  - Add `StageProgressionOptionState`, `getNextStageId`, `isStageUnlocked`, and `projectStageProgressionOptions`.
  - Keep all functions pure and generic over stage id strings.
- Modify: `src/domain/progression/stageProgression.test.ts`
  - Add focused tests for first-stage unlock, previous-clear unlock, locked later stages, next-stage lookup, cleared projection, and debug unlock.
- Modify: `src/application/progression/browserStageProgressionStore.ts`
  - Add `STAGE_PROGRESSION_DEBUG_UNLOCK_KEY`, query parsing, storage read/write helpers, and dev-mode guard.
  - Keep delete-save behavior limited to stage records; debug flag remains untouched.
- Modify: `src/application/progression/browserStageProgressionStore.test.ts`
  - Add application tests for debug query enable/disable, persisted flag loading, non-dev ignore, and delete-save preserving debug flag.
- Modify: `src/domain/app/appFlow.ts`
  - Add optional unlock guard to `confirmSelectedStage`.
  - Add `openNextGameplayStage` for Result HUD next-stage command, guarded by caller-provided stage permission.
- Modify: `src/domain/app/appFlow.test.ts`
  - Add tests that locked selected stages stay on Stage Select, unlocked selected stages enter Gameplay, next-stage navigation opens only when permitted, and end-of-order/no-next-stage stays put.
- Modify: `src/application/input/appControls.ts`
  - Allow a stage unlock guard to flow into keyboard/controller confirm.
- Modify: `src/application/input/appControls.test.ts`
  - Prove `confirm` on Stage Select respects the guard.
- Modify: `src/App.svelte`
  - Load debug unlock state on mount.
  - Compute the active stage unlock predicate from `projectData.stages.order`, `stageProgressionSave.stageRecords`, and debug flag.
  - Use the predicate for Stage Select confirm and control intents.
  - Add a next-stage handler for future Result HUD wiring.
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`
  - Source-level contract tests for the Svelte wiring until component integration is covered in Slice 3.

---

## Task 1: Pure Domain Unlock Projection

**Files:**
- Modify: `src/domain/progression/stageProgression.test.ts`
- Modify: `src/domain/progression/stageProgression.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests to `src/domain/progression/stageProgression.test.ts`:

```ts
describe('stage unlock projection', () => {
  const order: readonly string[] = ['1-1', '1-2', '1-3']
  const clearRecord = {
    cleared: true,
    bestTimeMs: 10_000,
    bestTime: '00:10.00',
    bestRank: 'A',
    maxCoins: 3,
  } as const

  it('unlocks the first ordered stage for empty records', () => {
    expect(isStageUnlocked(order, {}, '1-1', false)).toBe(true)
  })

  it('locks later stages until the previous ordered stage is cleared', () => {
    expect(isStageUnlocked(order, {}, '1-2', false)).toBe(false)
    expect(isStageUnlocked(order, { '1-1': clearRecord }, '1-2', false)).toBe(true)
    expect(isStageUnlocked(order, { '1-2': clearRecord }, '1-3', false)).toBe(true)
  })

  it('does not unlock unknown stages unless debug unlock is enabled', () => {
    expect(isStageUnlocked(order, { '1-1': clearRecord }, '9-9', false)).toBe(false)
    expect(isStageUnlocked(order, {}, '9-9', true)).toBe(true)
  })

  it('looks up the next stage from catalog order', () => {
    expect(getNextStageId(order, '1-1')).toBe('1-2')
    expect(getNextStageId(order, '1-3')).toBeNull()
    expect(getNextStageId(order, '9-9')).toBeNull()
  })

  it('projects locked, unlocked, and cleared option states', () => {
    expect(projectStageProgressionOptions(order, { '1-1': clearRecord }, false)).toEqual([
      { stageId: '1-1', unlocked: true, cleared: true, record: clearRecord },
      { stageId: '1-2', unlocked: true, cleared: false, record: undefined },
      { stageId: '1-3', unlocked: false, cleared: false, record: undefined },
    ])
  })

  it('projects every ordered stage as unlocked when debug unlock is enabled', () => {
    expect(projectStageProgressionOptions(order, {}, true).map((state) => state.unlocked)).toEqual([
      true,
      true,
      true,
    ])
  })
})
```

Import the new functions at the top of the test file:

```ts
import {
  getNextStageId,
  isStageUnlocked,
  projectStageProgressionOptions,
} from './stageProgression'
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/progression/stageProgression.test.ts
```

Expected: FAIL because `isStageUnlocked`, `getNextStageId`, and `projectStageProgressionOptions` are not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `src/domain/progression/stageProgression.ts`:

```ts
export type StageProgressionOptionState<TStageId extends string> = {
  stageId: TStageId
  unlocked: boolean
  cleared: boolean
  record: StageRecord | undefined
}

function hasClearedRecord(record: StageRecord | undefined): boolean {
  return record?.cleared === true
}

export function getNextStageId<TStageId extends string>(
  stageOrder: readonly TStageId[],
  stageId: string,
): TStageId | null {
  const stageIndex = stageOrder.indexOf(stageId)
  if (stageIndex < 0) return null

  return stageOrder[stageIndex + 1] ?? null
}

export function isStageUnlocked<TStageId extends string>(
  stageOrder: readonly TStageId[],
  records: StageRecordMap<TStageId>,
  stageId: string,
  debugUnlockAllStages: boolean,
): boolean {
  if (debugUnlockAllStages) return true

  const stageIndex = stageOrder.indexOf(stageId)
  if (stageIndex < 0) return false
  if (stageIndex === 0) return true

  return hasClearedRecord(records[stageOrder[stageIndex - 1]])
}

export function projectStageProgressionOptions<TStageId extends string>(
  stageOrder: readonly TStageId[],
  records: StageRecordMap<TStageId>,
  debugUnlockAllStages: boolean,
): StageProgressionOptionState<TStageId>[] {
  return stageOrder.map((stageId) => {
    const record = records[stageId]

    return {
      stageId,
      unlocked: isStageUnlocked(stageOrder, records, stageId, debugUnlockAllStages),
      cleared: hasClearedRecord(record),
      record,
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/progression/stageProgression.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/progression/stageProgression.ts src/domain/progression/stageProgression.test.ts
git commit -m "feat: add stage unlock projection rules"
```

---

## Task 2: Browser Debug Unlock Store

**Files:**
- Modify: `src/application/progression/browserStageProgressionStore.test.ts`
- Modify: `src/application/progression/browserStageProgressionStore.ts`

- [ ] **Step 1: Write the failing tests**

Add these imports in `src/application/progression/browserStageProgressionStore.test.ts`:

```ts
import {
  getDebugUnlockAllStages,
  resolveDebugUnlockAllStages,
  STAGE_PROGRESSION_DEBUG_UNLOCK_KEY,
} from './browserStageProgressionStore'
```

Append these tests:

```ts
describe('browser stage progression debug unlock', () => {
  it('enables debug unlock from development query params and persists the flag', () => {
    const storage = createMemoryStorage()

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=1',
      dev: true,
    })).toBe(true)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('also supports the debugUnlockStages query param', () => {
    const storage = createMemoryStorage()

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlockStages=true',
      dev: true,
    })).toBe(true)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('clears debug unlock from development falsey query params', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=false',
      dev: true,
    })).toBe(false)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBeUndefined()
  })

  it('loads the persisted debug unlock flag when no query override is present', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })

    expect(getDebugUnlockAllStages(storage, true)).toBe(true)
    expect(resolveDebugUnlockAllStages({ storage, search: '', dev: true })).toBe(true)
  })

  it('ignores debug unlock outside development mode', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })

    expect(getDebugUnlockAllStages(storage, false)).toBe(false)
    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=1',
      dev: false,
    })).toBe(false)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('delete save preserves the debug unlock flag', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify(createEmptySave()),
      [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true',
    })

    deleteStageProgressionSave(storage)

    expect(storage.snapshot()).toEqual({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/application/progression/browserStageProgressionStore.test.ts
```

Expected: FAIL because debug unlock exports do not exist.

- [ ] **Step 3: Write minimal implementation**

Add to `src/application/progression/browserStageProgressionStore.ts`:

```ts
export const STAGE_PROGRESSION_DEBUG_UNLOCK_KEY = 'project-almost:debugUnlockAllStages'

export type DebugUnlockResolutionInput = {
  storage: ProgressionStorage
  search: string
  dev: boolean
}

function parseDebugUnlockQuery(search: string): boolean | null {
  const params = new URLSearchParams(search)
  const rawValue = params.get('debugUnlock') ?? params.get('debugUnlockStages')
  if (rawValue === '1' || rawValue === 'true') return true
  if (rawValue === '0' || rawValue === 'false') return false

  return null
}

export function getDebugUnlockAllStages(storage: ProgressionStorage, dev: boolean): boolean {
  return dev && storage.getItem(STAGE_PROGRESSION_DEBUG_UNLOCK_KEY) === 'true'
}

export function resolveDebugUnlockAllStages(input: DebugUnlockResolutionInput): boolean {
  if (!input.dev) return false

  const queryValue = parseDebugUnlockQuery(input.search)
  if (queryValue === true) {
    input.storage.setItem(STAGE_PROGRESSION_DEBUG_UNLOCK_KEY, 'true')
    return true
  }
  if (queryValue === false) {
    input.storage.removeItem(STAGE_PROGRESSION_DEBUG_UNLOCK_KEY)
    return false
  }

  return getDebugUnlockAllStages(input.storage, true)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/application/progression/browserStageProgressionStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/progression/browserStageProgressionStore.ts src/application/progression/browserStageProgressionStore.test.ts
git commit -m "feat: add debug stage unlock flag"
```

---

## Task 3: App Flow Guards

**Files:**
- Modify: `src/domain/app/appFlow.test.ts`
- Modify: `src/domain/app/appFlow.ts`

- [ ] **Step 1: Write the failing tests**

Add `openNextGameplayStage` to the import list in `src/domain/app/appFlow.test.ts`, then append:

```ts
describe('stage unlock guarded app flow', () => {
  it('does not open gameplay when the selected stage is locked', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 1, worldId: 'world02', selectedStageIndex: 4 },
    } as const

    expect(confirmSelectedStage(state, { isStageUnlocked: () => false })).toBe(state)
  })

  it('opens gameplay when the selected stage is unlocked', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 1, worldId: 'world02', selectedStageIndex: 4 },
    } as const

    expect(confirmSelectedStage(state, { isStageUnlocked: (stageId) => stageId === '2-5' })).toEqual({
      screen: { type: 'gameplay', stageId: '2-5', runId: 0 },
    })
  })

  it('opens the next gameplay stage when it exists and is unlocked', () => {
    const state = { screen: { type: 'gameplay', stageId: '1-1', runId: 3 } } as const

    expect(openNextGameplayStage(state, '1-2', { isStageUnlocked: (stageId) => stageId === '1-2' })).toEqual({
      screen: { type: 'gameplay', stageId: '1-2', runId: 4 },
    })
  })

  it('does not open the next gameplay stage when it is locked or missing', () => {
    const state = { screen: { type: 'gameplay', stageId: '1-1', runId: 3 } } as const

    expect(openNextGameplayStage(state, '1-2', { isStageUnlocked: () => false })).toBe(state)
    expect(openNextGameplayStage(state, null, { isStageUnlocked: () => true })).toBe(state)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts
```

Expected: FAIL because `confirmSelectedStage` does not accept guard options and `openNextGameplayStage` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add types and update functions in `src/domain/app/appFlow.ts`:

```ts
export type StageUnlockGuard = {
  isStageUnlocked?: (stageId: StageId) => boolean
}

function canOpenStage(stageId: StageId, guard: StageUnlockGuard | undefined): boolean {
  return guard?.isStageUnlocked ? guard.isStageUnlocked(stageId) : true
}

export function confirmSelectedStage(state: AppState, guard?: StageUnlockGuard): AppState {
  if (state.screen.type !== 'stage-select') return state

  const stageId = getStageIdForSelection(state.screen)
  if (!canOpenStage(stageId, guard)) return state

  return {
    screen: { type: 'gameplay', stageId, runId: 0 },
  }
}

export function openNextGameplayStage(
  state: AppState,
  nextStageId: StageId | null,
  guard?: StageUnlockGuard,
): AppState {
  if (state.screen.type !== 'gameplay' || !nextStageId) return state
  if (!canOpenStage(nextStageId, guard)) return state

  return {
    screen: { type: 'gameplay', stageId: nextStageId, runId: state.screen.runId + 1 },
  }
}
```

Keep the existing `confirmSelectedStage(state)` call shape valid by making `guard` optional.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/app/appFlow.ts src/domain/app/appFlow.test.ts
git commit -m "feat: guard locked stage transitions"
```

---

## Task 4: Control Intent Guard Wiring

**Files:**
- Modify: `src/application/input/appControls.test.ts`
- Modify: `src/application/input/appControls.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/application/input/appControls.test.ts`:

```ts
it('respects the stage unlock guard when confirming stage select through controls', () => {
  const lockedState = {
    screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 0 },
    isStageUnlocked: () => false,
  } as const

  expect(applyControlIntent(lockedState, 'confirm')).toBe(lockedState)

  expect(
    applyControlIntent({
      ...lockedState,
      isStageUnlocked: (stageId) => stageId === '3-1',
    }, 'confirm'),
  ).toEqual({
    screen: { type: 'gameplay', stageId: '3-1', runId: 0 },
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/application/input/appControls.test.ts
```

Expected: FAIL because `applyControlIntent` ignores `isStageUnlocked`.

- [ ] **Step 3: Write minimal implementation**

Update `src/application/input/appControls.ts`:

```ts
import type { StageId } from '../../domain/data/worlds/worldTypes'
```

Extend `SettingsStateCarrier`:

```ts
export type SettingsStateCarrier = AppState & {
  settings?: GameSettings
  isStageUnlocked?: (stageId: StageId) => boolean
}
```

Update the Stage Select confirm branch:

```ts
if (intent === 'confirm') {
  return confirmSelectedStage(state, { isStageUnlocked: state.isStageUnlocked })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/application/input/appControls.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/input/appControls.ts src/application/input/appControls.test.ts
git commit -m "feat: route stage unlock guard through controls"
```

---

## Task 5: App Unlock Projection Wiring

**Files:**
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write the failing contract tests**

Append to `src/application/progression/appStageProgressionWiring.test.ts`:

```ts
describe('App stage unlock projection wiring', () => {
  it('loads development debug unlock state on mount', () => {
    expect(source).toContain('resolveDebugUnlockAllStages')
    expect(source).toContain('window.location.search')
    expect(source).toContain('import.meta.env.DEV')
  })

  it('derives stage unlock state from catalog order, records, and debug unlock', () => {
    expect(source).toContain('const stageOrder = $derived(projectData.stages.order)')
    expect(source).toContain('isStageUnlocked(')
    expect(source).toContain('stageProgressionSave.stageRecords')
    expect(source).toContain('debugUnlockAllStages')
  })

  it('guards direct stage confirm and control-intent confirm with unlock state', () => {
    expect(source).toContain('function isGameplayStageUnlocked')
    expect(source).toContain('confirmSelectedStage(appState, { isStageUnlocked: isGameplayStageUnlocked })')
    expect(source).toContain('applyControlIntent({ ...appState, settings, isStageUnlocked: isGameplayStageUnlocked }, intent)')
  })

  it('prepares guarded next-stage navigation for Result HUD integration', () => {
    expect(source).toContain('getNextStageId(stageOrder, appState.screen.stageId)')
    expect(source).toContain('openNextGameplayStage(appState, nextStageId, { isStageUnlocked: isGameplayStageUnlocked })')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: FAIL because App has not wired debug unlock or guarded transitions.

- [ ] **Step 3: Write minimal implementation**

Update imports in `src/App.svelte`:

```ts
import {
  getNextStageId,
  isStageUnlocked,
  type StageClearResult,
} from './domain/progression/stageProgression'
import type { StageId } from './domain/data/worlds/worldTypes'
import {
  createEmptySave,
  deleteStageProgressionSave,
  loadStageProgressionSave,
  recordStageClear,
  resolveDebugUnlockAllStages,
} from './application/progression/browserStageProgressionStore'
import {
  openNextGameplayStage,
  // keep existing appFlow imports
} from './domain/app/appFlow'
```

Add state and helpers near the current progression save state:

```ts
let debugUnlockAllStages = $state(false)
const stageOrder = $derived(projectData.stages.order)

function isGameplayStageUnlocked(stageId: StageId): boolean {
  return isStageUnlocked(
    stageOrder,
    stageProgressionSave.stageRecords,
    stageId,
    debugUnlockAllStages,
  )
}
```

Update `handleControlIntent`:

```ts
const nextState = applyControlIntent(
  { ...appState, settings, isStageUnlocked: isGameplayStageUnlocked },
  intent,
)
```

Update `handleConfirmStage`:

```ts
appState = confirmSelectedStage(appState, { isStageUnlocked: isGameplayStageUnlocked })
```

Add a guarded next-stage handler for Slice 3 to pass into `GameplayScreen`:

```ts
function handleNextGameplayStage() {
  if (appState.screen.type !== 'gameplay') return

  const nextStageId = getNextStageId(stageOrder, appState.screen.stageId)
  const previousScreen = appState.screen
  appState = openNextGameplayStage(appState, nextStageId, { isStageUnlocked: isGameplayStageUnlocked })
  if (appState.screen !== previousScreen) {
    playUiSfx('confirm')
    syncMusicForCurrentState()
  }
}
```

Update `onMount` before audio setup:

```ts
debugUnlockAllStages = resolveDebugUnlockAllStages({
  storage: localStorage,
  search: window.location.search,
  dev: import.meta.env.DEV,
})
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts src/domain/app/appFlow.test.ts src/application/input/appControls.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.svelte src/application/progression/appStageProgressionWiring.test.ts
git commit -m "feat: wire stage unlock guards into app"
```

---

## Task 6: Verification And Slice Review

**Files:**
- Inspect current git diff only; no intended source edits unless verification exposes a defect.

- [ ] **Step 1: Run focused progression and flow tests**

Run:

```bash
npm run test -- src/domain/progression/stageProgression.test.ts src/application/progression/browserStageProgressionStore.test.ts src/domain/app/appFlow.test.ts src/application/input/appControls.test.ts src/application/progression/appStageProgressionWiring.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full required checks**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected:
- `npm run test`: all tests pass.
- `npm run check`: 0 errors.
- `npm run build`: success; existing chunk-size warning is acceptable if unchanged.
- `git diff --check`: no whitespace errors.

- [ ] **Step 3: Review against Slice 2 acceptance**

Confirm:

- Fresh records unlock only the first catalog stage.
- Clearing `1-1` unlocks `1-2` through projection.
- Debug query unlocks every stage in dev mode only.
- Locked Stage Select confirm remains on Stage Select through direct confirm and input controls.
- `openNextGameplayStage` cannot open missing or locked next stages.
- No UI visual locked-state work has been added in this slice; that remains Slice 3.

- [ ] **Step 4: Commit any verification fixes**

If verification required fixes, commit them:

```bash
git add <fixed-files>
git commit -m "fix: complete stage unlock projection slice"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Ordered stage id projection: Task 1 uses `projectData.stages.order` through App wiring and keeps the domain generic.
- First-stage unlocked rule: Task 1.
- Previous-cleared unlock rule: Task 1.
- Next-stage lookup: Task 1 and Task 3.
- Debug unlock all stages: Task 2 and Task 5.
- App-flow guards for locked deploy and next-stage navigation: Task 3, Task 4, and Task 5.

Deferred to Slice 3 by spec:

- Stage Select visual locked/cleared states.
- Locked preview overlay and localized locked labels.
- Path active state.
- Result HUD button visual availability and action prop wiring.

Placeholder scan: no planned step relies on unspecified placeholder behavior.

Type consistency:

- `StageId` remains imported from `src/domain/data/worlds/worldTypes`.
- `StageRecordMap<TStageId>` remains the shared record map for projection rules.
- `isStageUnlocked` accepts `(stageOrder, records, stageId, debugUnlockAllStages)` everywhere.
- `StageUnlockGuard` uses an optional `(stageId: StageId) => boolean` predicate so existing call sites remain valid until they are wired.
