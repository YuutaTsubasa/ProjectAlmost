# Gameplay Stage Record System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first progression slice: persist stage clear records and wire gameplay/settings to record and delete them without changing Stage Select locking UI yet.

**Architecture:** Add a pure domain record module under `src/domain/progression/`, a dependency-injected browser storage adapter under `src/application/progression/`, then wire `App.svelte` and `GameplayScreen.svelte` to record each completed run once. Unlock projection, debug unlock, locked Stage Select UI, and Result HUD next-stage availability remain later slices.

**Tech Stack:** Svelte 5 runes, TypeScript, Vitest, localStorage through an injected storage boundary, existing gameplay HUD result snapshots.

---

## File Structure

- Create `src/domain/progression/stageProgression.ts`
  - Pure functional core for `StageRecord`, `StageClearResult`, empty records, `parseStageTimeMs`, and `mergeStageClearRecord`.
- Create `src/domain/progression/stageProgression.test.ts`
  - Domain TDD coverage for empty records, time parsing, and best record merge rules.
- Create `src/application/progression/browserStageProgressionStore.ts`
  - Browser adapter with injected storage: `createEmptySave`, `loadStageProgressionSave`, `recordStageClear`, and `deleteStageProgressionSave`.
- Create `src/application/progression/browserStageProgressionStore.test.ts`
  - Adapter tests using an in-memory storage fake.
- Modify `src/ui/gameplay/GameplayScreen.svelte`
  - Add `onStageClear` prop and emit exactly once when `hudState.result` first appears for the mounted run.
- Create `src/ui/gameplay/gameplayScreenStageClear.test.ts`
  - Source-level contract test for the one-shot stage-clear callback wiring.
- Modify `src/App.svelte`
  - Load save state on mount, handle gameplay clear records, and delete save from settings delete confirmation.
- Create `src/application/progression/appStageProgressionWiring.test.ts`
  - Source-level contract test for App progression store wiring because the project currently uses source contracts for Svelte integration surfaces instead of a Svelte component mounting harness.

---

## Task 1: Domain Stage Record Rules

**Files:**
- Create: `src/domain/progression/stageProgression.test.ts`
- Create: `src/domain/progression/stageProgression.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/progression/stageProgression.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  createEmptyStageRecords,
  mergeStageClearRecord,
  parseStageTimeMs,
} from './stageProgression'

describe('stage progression record rules', () => {
  it('starts with no stage records', () => {
    expect(createEmptyStageRecords<'1-1'>()).toEqual({})
  })

  it('parses Prototype stage result time strings as milliseconds', () => {
    expect(parseStageTimeMs('00:00.00')).toBe(0)
    expect(parseStageTimeMs('01:23.45')).toBe(83_450)
    expect(parseStageTimeMs('12:03.07')).toBe(723_070)
  })

  it('creates a cleared record from the first result', () => {
    expect(
      mergeStageClearRecord({}, '1-1', {
        time: '01:23.45',
        rank: 'B',
        coins: 7,
      }),
    ).toEqual({
      '1-1': {
        cleared: true,
        bestTimeMs: 83_450,
        bestTime: '01:23.45',
        bestRank: 'B',
        maxCoins: 7,
      },
    })
  })

  it('keeps best time, best rank, and max coins independently', () => {
    const records = mergeStageClearRecord({}, '1-1', {
      time: '01:23.45',
      rank: 'B',
      coins: 7,
    })

    expect(
      mergeStageClearRecord(records, '1-1', {
        time: '01:30.00',
        rank: 'S',
        coins: 5,
      }),
    ).toEqual({
      '1-1': {
        cleared: true,
        bestTimeMs: 83_450,
        bestTime: '01:23.45',
        bestRank: 'S',
        maxCoins: 7,
      },
    })

    expect(
      mergeStageClearRecord(records, '1-1', {
        time: '01:00.00',
        rank: 'C',
        coins: 9,
      }),
    ).toEqual({
      '1-1': {
        cleared: true,
        bestTimeMs: 60_000,
        bestTime: '01:00.00',
        bestRank: 'B',
        maxCoins: 9,
      },
    })
  })

  it('preserves other stage records when merging one stage', () => {
    const records = mergeStageClearRecord({}, '1-1', {
      time: '00:50.00',
      rank: 'A',
      coins: 4,
    })

    expect(
      mergeStageClearRecord(records, '1-2', {
        time: '01:10.00',
        rank: 'B',
        coins: 6,
      }),
    ).toMatchObject({
      '1-1': {
        cleared: true,
        bestTime: '00:50.00',
      },
      '1-2': {
        cleared: true,
        bestTime: '01:10.00',
      },
    })
  })
})
```

- [ ] **Step 2: Run the domain tests and verify RED**

Run:

```bash
npm run test -- src/domain/progression/stageProgression.test.ts
```

Expected: FAIL because `src/domain/progression/stageProgression.ts` does not exist.

- [ ] **Step 3: Implement the minimal domain module**

Create `src/domain/progression/stageProgression.ts`:

```ts
import { type ClearRank } from '../gameplay/stageResult'

export type StageRecord = {
  cleared: boolean
  bestTimeMs: number
  bestTime: string
  bestRank: ClearRank
  maxCoins: number
}

export type StageClearResult = {
  time: string
  rank: ClearRank
  coins: number
}

export type StageRecordMap<TStageId extends string> = Partial<Record<TStageId, StageRecord>>

const rankValues: Record<ClearRank, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
}

export function createEmptyStageRecords<TStageId extends string>(): StageRecordMap<TStageId> {
  return {}
}

export function parseStageTimeMs(time: string): number {
  const [minutes = '0', rest = '0.0'] = time.split(':')
  const [seconds = '0', hundredths = '0'] = rest.split('.')

  return Number(minutes) * 60_000
    + Number(seconds) * 1_000
    + Number(hundredths.padEnd(2, '0').slice(0, 2)) * 10
}

export function mergeStageClearRecord<TStageId extends string>(
  records: StageRecordMap<TStageId>,
  stageId: TStageId,
  result: StageClearResult,
): StageRecordMap<TStageId> {
  const previous = records[stageId]
  const timeMs = parseStageTimeMs(result.time)
  const bestTimeIsPrevious = previous ? previous.bestTimeMs <= timeMs : false
  const bestRankIsPrevious = previous
    ? rankValues[previous.bestRank] >= rankValues[result.rank]
    : false

  return {
    ...records,
    [stageId]: {
      cleared: true,
      bestTimeMs: bestTimeIsPrevious ? previous.bestTimeMs : timeMs,
      bestTime: bestTimeIsPrevious ? previous.bestTime : result.time,
      bestRank: bestRankIsPrevious ? previous.bestRank : result.rank,
      maxCoins: Math.max(previous?.maxCoins ?? 0, result.coins),
    },
  }
}
```

- [ ] **Step 4: Run the domain tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/progression/stageProgression.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/progression/stageProgression.ts src/domain/progression/stageProgression.test.ts
git commit -m "feat: add stage progression records"
```

---

## Task 2: Browser Progression Store

**Files:**
- Create: `src/application/progression/browserStageProgressionStore.test.ts`
- Create: `src/application/progression/browserStageProgressionStore.ts`
- Modify: `src/domain/progression/stageProgression.ts` if import paths need formatting only.

- [ ] **Step 1: Write the failing store tests**

Create `src/application/progression/browserStageProgressionStore.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  createEmptySave,
  deleteStageProgressionSave,
  loadStageProgressionSave,
  recordStageClear,
  STAGE_PROGRESSION_SAVE_KEY,
  type ProgressionStorage,
} from './browserStageProgressionStore'

function createMemoryStorage(initial: Record<string, string> = {}): ProgressionStorage & {
  snapshot: () => Record<string, string>
} {
  const values = { ...initial }

  return {
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value
    },
    removeItem: (key) => {
      delete values[key]
    },
    snapshot: () => ({ ...values }),
  }
}

describe('browser stage progression store', () => {
  it('creates an empty versioned save', () => {
    expect(createEmptySave()).toEqual({ version: 1, stageRecords: {} })
  })

  it('loads an empty save when storage has no save', () => {
    expect(loadStageProgressionSave(createMemoryStorage())).toEqual(createEmptySave())
  })

  it('loads an empty save when storage JSON is malformed', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_SAVE_KEY]: '{not-json' })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when storage version is unsupported', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({ version: 99, stageRecords: { '1-1': { cleared: true } } }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('records a stage clear by merging records and writing storage', () => {
    const storage = createMemoryStorage()
    const first = recordStageClear(storage, createEmptySave(), '1-1', {
      time: '01:23.45',
      rank: 'B',
      coins: 7,
    })
    const second = recordStageClear(storage, first, '1-1', {
      time: '01:30.00',
      rank: 'S',
      coins: 5,
    })

    expect(second.stageRecords['1-1']).toEqual({
      cleared: true,
      bestTimeMs: 83_450,
      bestTime: '01:23.45',
      bestRank: 'S',
      maxCoins: 7,
    })
    expect(JSON.parse(storage.snapshot()[STAGE_PROGRESSION_SAVE_KEY] ?? '')).toEqual(second)
  })

  it('deletes the save key and returns an empty save', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: { '1-1': { cleared: true, bestTimeMs: 1, bestTime: '00:00.01', bestRank: 'S', maxCoins: 1 } },
      }),
    })

    expect(deleteStageProgressionSave(storage)).toEqual(createEmptySave())
    expect(storage.snapshot()).toEqual({})
  })
})
```

- [ ] **Step 2: Run the store tests and verify RED**

Run:

```bash
npm run test -- src/application/progression/browserStageProgressionStore.test.ts
```

Expected: FAIL because `browserStageProgressionStore.ts` does not exist.

- [ ] **Step 3: Implement the store adapter**

Create `src/application/progression/browserStageProgressionStore.ts`:

```ts
import {
  createEmptyStageRecords,
  mergeStageClearRecord,
  type StageClearResult,
  type StageRecord,
} from '../../domain/progression/stageProgression'
import type { StageId } from '../../domain/data/worlds/worldTypes'

export const STAGE_PROGRESSION_SAVE_KEY = 'project-almost:save'

export type StageProgressionSave = {
  version: 1
  stageRecords: Partial<Record<StageId, StageRecord>>
}

export type ProgressionStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function createEmptySave(): StageProgressionSave {
  return {
    version: 1,
    stageRecords: createEmptyStageRecords<StageId>(),
  }
}

function isStageProgressionSave(value: unknown): value is StageProgressionSave {
  if (!value || typeof value !== 'object') return false

  const candidate = value as { version?: unknown; stageRecords?: unknown }
  return candidate.version === 1
    && Boolean(candidate.stageRecords)
    && typeof candidate.stageRecords === 'object'
}

export function loadStageProgressionSave(storage: ProgressionStorage): StageProgressionSave {
  try {
    const stored = storage.getItem(STAGE_PROGRESSION_SAVE_KEY)
    if (!stored) return createEmptySave()

    const parsed = JSON.parse(stored) as unknown
    return isStageProgressionSave(parsed) ? parsed : createEmptySave()
  } catch {
    return createEmptySave()
  }
}

export function writeStageProgressionSave(
  storage: ProgressionStorage,
  save: StageProgressionSave,
): StageProgressionSave {
  storage.setItem(STAGE_PROGRESSION_SAVE_KEY, JSON.stringify(save))
  return save
}

export function recordStageClear(
  storage: ProgressionStorage,
  save: StageProgressionSave,
  stageId: StageId,
  result: StageClearResult,
): StageProgressionSave {
  return writeStageProgressionSave(storage, {
    ...save,
    stageRecords: mergeStageClearRecord(save.stageRecords, stageId, result),
  })
}

export function deleteStageProgressionSave(storage: ProgressionStorage): StageProgressionSave {
  storage.removeItem(STAGE_PROGRESSION_SAVE_KEY)
  return createEmptySave()
}
```

- [ ] **Step 4: Run the store tests and verify GREEN**

Run:

```bash
npm run test -- src/application/progression/browserStageProgressionStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/application/progression/browserStageProgressionStore.ts src/application/progression/browserStageProgressionStore.test.ts
git commit -m "feat: persist stage progression records"
```

---

## Task 3: Gameplay Clear Callback Contract

**Files:**
- Create: `src/ui/gameplay/gameplayScreenStageClear.test.ts`
- Modify: `src/ui/gameplay/GameplayScreen.svelte`

- [ ] **Step 1: Write the failing GameplayScreen source contract test**

Create `src/ui/gameplay/gameplayScreenStageClear.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/ui/gameplay/GameplayScreen.svelte', 'utf8')

describe('GameplayScreen stage clear callback wiring', () => {
  it('declares a stage clear callback prop', () => {
    expect(source).toContain('onStageClear: (result: StageClearResult) => void')
    expect(source).toContain('onStageClear,')
  })

  it('emits the clear result once per mounted gameplay run', () => {
    expect(source).toContain('let stageClearRecorded = $state(false)')
    expect(source).toContain('if (!hudState?.result || stageClearRecorded) return')
    expect(source).toContain('stageClearRecorded = true')
    expect(source).toContain('onStageClear({')
    expect(source).toContain('time: hudState.result.time')
    expect(source).toContain('rank: hudState.result.rank')
    expect(source).toContain('coins: hudState.result.coins')
  })
})
```

- [ ] **Step 2: Run the GameplayScreen source contract test and verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayScreenStageClear.test.ts
```

Expected: FAIL because `onStageClear` and `stageClearRecorded` are not present.

- [ ] **Step 3: Add one-shot stage clear callback wiring**

Modify `src/ui/gameplay/GameplayScreen.svelte`:

1. Add the import:

```ts
import type { StageClearResult } from '../../domain/progression/stageProgression'
```

2. Add the prop:

```ts
onStageClear: (result: StageClearResult) => void
```

3. Destructure the prop:

```ts
onStageClear,
```

4. Add state near `selectedResultAction`:

```ts
let stageClearRecorded = $state(false)
```

5. Add this effect after `handleResultAction`:

```ts
$effect(() => {
  if (!hudState?.result || stageClearRecorded) return

  stageClearRecorded = true
  onStageClear({
    time: hudState.result.time,
    rank: hudState.result.rank,
    coins: hudState.result.coins,
  })
})
```

- [ ] **Step 4: Run the GameplayScreen source contract test and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayScreenStageClear.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run TypeScript/Svelte check for the new required prop**

Run:

```bash
npm run check
```

Expected: FAIL because `App.svelte` has not passed `onStageClear` to `GameplayScreen` yet.

- [ ] **Step 6: Keep Task 3 changes uncommitted until App is wired**

Do not commit this task by itself. The source test is green, but `npm run check` is expected to fail until `App.svelte` passes the required prop in Task 4. Keep these files modified and continue directly to Task 4:

```bash
git status --short
```

Expected: `src/ui/gameplay/GameplayScreen.svelte` and `src/ui/gameplay/gameplayScreenStageClear.test.ts` are modified or untracked.

---

## Task 4: App Save Wiring And Delete Save

**Files:**
- Create: `src/application/progression/appStageProgressionWiring.test.ts`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write the failing App source contract test**

Create `src/application/progression/appStageProgressionWiring.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/App.svelte', 'utf8')

describe('App stage progression record wiring', () => {
  it('loads stage progression save state on mount', () => {
    expect(source).toContain('loadStageProgressionSave')
    expect(source).toContain('let stageProgressionSave = $state(createEmptySave())')
    expect(source).toContain('stageProgressionSave = loadStageProgressionSave(localStorage)')
  })

  it('records stage clear results for the active gameplay stage', () => {
    expect(source).toContain('function handleStageClear(result: StageClearResult)')
    expect(source).toContain("if (appState.screen.type !== 'gameplay') return")
    expect(source).toContain('recordStageClear(')
    expect(source).toContain('appState.screen.stageId')
    expect(source).toContain('onStageClear={handleStageClear}')
  })

  it('deletes progression save when settings delete is confirmed', () => {
    expect(source).toContain('deleteStageProgressionSave(localStorage)')
    expect(source).toContain('stageProgressionSave = deleteStageProgressionSave(localStorage)')
  })
})
```

- [ ] **Step 2: Run the App wiring test and verify RED**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: FAIL because `App.svelte` does not load or record progression yet.

- [ ] **Step 3: Wire progression save state in App**

Modify `src/App.svelte`:

1. Add imports:

```ts
import {
  createEmptySave,
  deleteStageProgressionSave,
  loadStageProgressionSave,
  recordStageClear,
  type StageProgressionSave,
} from './application/progression/browserStageProgressionStore'
import type { StageClearResult } from './domain/progression/stageProgression'
```

2. Add reactive state near `appState`:

```ts
let stageProgressionSave: StageProgressionSave = $state(createEmptySave())
```

3. Add a handler near gameplay result handlers:

```ts
function handleStageClear(result: StageClearResult) {
  if (appState.screen.type !== 'gameplay') return

  stageProgressionSave = recordStageClear(
    localStorage,
    stageProgressionSave,
    appState.screen.stageId,
    result,
  )
}
```

4. Update delete confirmation:

```ts
function handleConfirmDelete() {
  playUiSfx('confirm')
  stageProgressionSave = deleteStageProgressionSave(localStorage)
  appState = cancelDeleteConfirm(appState)
}
```

5. Load progression on mount before audio setup:

```ts
stageProgressionSave = loadStageProgressionSave(localStorage)
```

6. Pass the prop to `GameplayScreen`:

```svelte
onStageClear={handleStageClear}
```

- [ ] **Step 4: Run App wiring test and verify GREEN**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run the focused progression tests together**

Run:

```bash
npm run test -- src/domain/progression/stageProgression.test.ts src/application/progression/browserStageProgressionStore.test.ts src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/progression/appStageProgressionWiring.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 7: Commit Tasks 3 and 4 together as a buildable slice**

```bash
git add src/App.svelte src/application/progression/appStageProgressionWiring.test.ts src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayScreenStageClear.test.ts
git commit -m "feat: record gameplay clears in save data"
```

---

## Task 5: Full Verification For Record System Slice

**Files:**
- Verify all files changed by Tasks 1-4.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm run test
```

Expected: PASS with all test files green.

- [ ] **Step 2: Run Svelte/TypeScript checks**

Run:

```bash
npm run check
```

Expected: `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds. The existing Vite chunk-size warning is acceptable if no new errors appear.

- [ ] **Step 4: Run whitespace/path sanity**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git diff --stat HEAD
git diff -- src/domain/progression src/application/progression src/ui/gameplay/GameplayScreen.svelte src/App.svelte
```

Expected: only Record System slice files changed; no Stage Select locked UI or unlock projection logic yet.

- [ ] **Step 6: Confirm no uncommitted implementation changes remain**

Run:

```bash
git status --short
```

Expected: clean working tree. If verification required edits, repeat the focused tests for the edited files, then commit those specific edits with a message that describes the verification fix.

---

## Self-Review Notes

Spec coverage for Slice 1:

- Domain stage records and clear results: Task 1.
- Merge rules: Task 1.
- Browser save load, save, record clear, delete save: Task 2.
- Gameplay clear recording once per run: Task 3.
- App wiring to active gameplay stage: Task 4.
- Settings Delete Save clears stored records: Task 4.

Deferred by spec slicing:

- Unlock projection and debug unlock: Slice 2 plan.
- Stage Select locked/cleared visuals: Slice 3 plan.
- Result HUD next-stage availability: Slice 3 plan after unlock projection exists.

No task imports from `__prototype__`, writes inside `__prototype__`, moves root folders, or changes Stage Select lock behavior in this slice.
