# TDD Domain Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first TDD-ready domain layer for progression, rank, placement, and stage validation without rewriting Svelte or Phaser gameplay.

**Architecture:** Keep Svelte and Phaser as adapters. Extract only pure TypeScript rules into `src/domain/` so they can be tested without DOM, localStorage, or Phaser. Existing files keep their public behavior while delegating to the new domain modules.

**Tech Stack:** Svelte 5, TypeScript, Vite, Phaser, Vitest.

---

## Scope

In scope:

- Add Vitest.
- Add `npm run test`.
- Create pure domain modules under `src/domain/`.
- Extract rank/progression rules from `saveData.ts`.
- Extract placement helpers from `objectDefinitions.ts`.
- Extract stage validation from `stageRegistry.ts`.
- Add unit tests for each extracted behavior.

Out of scope:

- Rewriting `GameplayScene.ts`.
- Reworking Svelte routing.
- Adding component tests.
- Adding browser smoke tests.
- Changing gameplay behavior.
- Committing the large existing dirty worktree.

## Current Worktree Warning

At plan creation time, the repo is on `main` and has many dirty files. Do not start implementation on `main`.

Recommended implementation branch:

```bash
git switch -c codex/tdd-domain-foundation
```

If the branch already exists:

```bash
git switch codex/tdd-domain-foundation
```

## File Structure

Create:

- `src/domain/progression/progressionRules.ts`
  - Pure stage record merge, rank ordering, unlock policy, time parsing.
- `src/domain/progression/progressionRules.test.ts`
  - Unit tests for progression behavior.
- `src/domain/placement/objectDefinitions.ts`
  - Pure object definition data and placement helpers.
- `src/domain/placement/objectDefinitions.test.ts`
  - Unit tests for bottom/center alignment.
- `src/domain/stage/stageValidation.ts`
  - Pure stage validation rules.
- `src/domain/stage/stageValidation.test.ts`
  - Unit tests for supported grounded objects.

Modify:

- `package.json`
  - Add `test` script and Vitest dev dependency.
- `package-lock.json`
  - Updated by `npm install`.
- `src/game/save/saveData.ts`
  - Keep localStorage adapter; delegate pure logic to domain.
- `src/game/objects/objectDefinitions.ts`
  - Re-export domain object definitions and helpers.
- `src/game/stages/stageRegistry.ts`
  - Delegate validation to domain validation.

## Task 1: Add Test Harness

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/domain/progression/progressionRules.test.ts`

- [ ] **Step 1: Create the implementation branch**

Run:

```bash
git switch -c codex/tdd-domain-foundation
```

Expected:

```text
Switched to a new branch 'codex/tdd-domain-foundation'
```

If the branch exists, run:

```bash
git switch codex/tdd-domain-foundation
```

- [ ] **Step 2: Install Vitest**

Run:

```bash
npm install --save-dev vitest
```

Expected:

```text
added ... packages
```

- [ ] **Step 3: Add the test script**

Edit `package.json` so `scripts` includes:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: Write the first failing test**

Create `src/domain/progression/progressionRules.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { parseStageTimeMs } from './progressionRules'

describe('parseStageTimeMs', () => {
  test('parses minute, second, and hundredth display time into milliseconds', () => {
    expect(parseStageTimeMs('01:23.45')).toBe(83_450)
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/progression/progressionRules.test.ts
```

Expected:

```text
FAIL src/domain/progression/progressionRules.test.ts
Cannot find module './progressionRules'
```

If it fails for a different reason, fix the test setup before implementation.

- [ ] **Step 6: Write minimal implementation**

Create `src/domain/progression/progressionRules.ts`:

```ts
export function parseStageTimeMs(time: string): number {
  const [minutes, rest] = time.split(':')
  const [seconds, hundredths] = rest.split('.')
  return Number(minutes) * 60_000 + Number(seconds) * 1_000 + Number(hundredths) * 10
}
```

- [ ] **Step 7: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/progression/progressionRules.test.ts
```

Expected:

```text
PASS src/domain/progression/progressionRules.test.ts
```

## Task 2: Extract Pure Progression Rules

**Files:**

- Modify: `src/domain/progression/progressionRules.ts`
- Modify: `src/domain/progression/progressionRules.test.ts`
- Modify: `src/game/save/saveData.ts`

- [ ] **Step 1: Add failing tests for record merge and unlock policy**

Replace `src/domain/progression/progressionRules.test.ts` with:

```ts
import { describe, expect, test } from 'vitest'
import {
  createEmptyStageRecords,
  isStageUnlockedByRecords,
  mergeStageClearRecord,
  parseStageTimeMs,
  rankValue,
  type StageRecordMap,
} from './progressionRules'

describe('parseStageTimeMs', () => {
  test('parses minute, second, and hundredth display time into milliseconds', () => {
    expect(parseStageTimeMs('01:23.45')).toBe(83_450)
  })
})

describe('rankValue', () => {
  test('orders ranks from uncleared through S', () => {
    expect(rankValue('--')).toBeLessThan(rankValue('D'))
    expect(rankValue('A')).toBeLessThan(rankValue('S'))
  })
})

describe('mergeStageClearRecord', () => {
  test('keeps best time, best rank, and max coins independently', () => {
    const records = createEmptyStageRecords()
    const first = mergeStageClearRecord(records, '1-1', { time: '00:30.00', rank: 'B', coins: 10 })
    const second = mergeStageClearRecord(first, '1-1', { time: '00:35.00', rank: 'A', coins: 8 })

    expect(second['1-1']).toEqual({
      cleared: true,
      bestTimeMs: 30_000,
      bestTime: '00:30.00',
      bestRank: 'A',
      maxCoins: 10,
    })
  })
})

describe('isStageUnlockedByRecords', () => {
  const stageOrder = ['1-1', '1-2', '1-3'] as const

  test('unlocks the first stage by default', () => {
    expect(isStageUnlockedByRecords({}, stageOrder, '1-1')).toBe(true)
  })

  test('unlocks a later stage when the previous stage is cleared', () => {
    const records: StageRecordMap<string> = { '1-1': { cleared: true, bestTimeMs: 20_000, bestTime: '00:20.00', bestRank: 'B', maxCoins: 5 } }
    expect(isStageUnlockedByRecords(records, stageOrder, '1-2')).toBe(true)
  })

  test('keeps a later stage locked when the previous stage is not cleared', () => {
    expect(isStageUnlockedByRecords({}, stageOrder, '1-2')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/progression/progressionRules.test.ts
```

Expected:

```text
FAIL src/domain/progression/progressionRules.test.ts
createEmptyStageRecords is not exported
```

- [ ] **Step 3: Implement pure progression rules**

Replace `src/domain/progression/progressionRules.ts` with:

```ts
export type StageRecord = {
  cleared: boolean
  bestTimeMs: number
  bestTime: string
  bestRank: string
  maxCoins: number
}

export type StageClearResult = {
  time: string
  rank: string
  coins: number
}

export type StageRecordMap<TStageId extends string> = Partial<Record<TStageId, StageRecord>>

const RANK_ORDER = ['--', 'D', 'C', 'B', 'A', 'S']

export function createEmptyStageRecords<TStageId extends string>(): StageRecordMap<TStageId> {
  return {}
}

export function parseStageTimeMs(time: string): number {
  const [minutes, rest] = time.split(':')
  const [seconds, hundredths] = rest.split('.')
  return Number(minutes) * 60_000 + Number(seconds) * 1_000 + Number(hundredths) * 10
}

export function rankValue(rank: string): number {
  return RANK_ORDER.indexOf(rank)
}

export function mergeStageClearRecord<TStageId extends string>(
  records: StageRecordMap<TStageId>,
  stageId: TStageId,
  result: StageClearResult,
): StageRecordMap<TStageId> {
  const previous = records[stageId]
  const timeMs = parseStageTimeMs(result.time)
  const nextRecord: StageRecord = {
    cleared: true,
    bestTimeMs: previous ? Math.min(previous.bestTimeMs, timeMs) : timeMs,
    bestTime: previous && previous.bestTimeMs <= timeMs ? previous.bestTime : result.time,
    bestRank: previous && rankValue(previous.bestRank) >= rankValue(result.rank) ? previous.bestRank : result.rank,
    maxCoins: Math.max(previous?.maxCoins ?? 0, result.coins),
  }
  return { ...records, [stageId]: nextRecord }
}

export function isStageUnlockedByRecords<TStageId extends string>(
  records: StageRecordMap<TStageId>,
  stageOrder: readonly TStageId[],
  stageId: TStageId,
): boolean {
  const index = stageOrder.indexOf(stageId)
  return index === 0 || Boolean(records[stageOrder[index - 1]]?.cleared)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm run test -- src/domain/progression/progressionRules.test.ts
```

Expected:

```text
PASS src/domain/progression/progressionRules.test.ts
```

- [ ] **Step 5: Wire `saveData.ts` to domain rules**

Modify `src/game/save/saveData.ts`:

```ts
import {
  createEmptyStageRecords,
  isStageUnlockedByRecords,
  mergeStageClearRecord,
  type StageClearResult,
  type StageRecord,
} from '../../domain/progression/progressionRules'
import { stages, type StageId } from '../stages/stageRegistry'

export type { StageClearResult, StageRecord }

export type SaveData = {
  version: 1
  stageRecords: Partial<Record<StageId, StageRecord>>
}

const SAVE_KEY = 'project-almost:save'
const DEBUG_UNLOCK_KEY = 'project-almost:debugUnlockAllStages'

export function createEmptySave(): SaveData {
  return { version: 1, stageRecords: createEmptyStageRecords<StageId>() }
}

export function loadSave(): SaveData {
  try {
    const stored = localStorage.getItem(SAVE_KEY)
    if (!stored) return createEmptySave()
    const parsed = JSON.parse(stored) as SaveData
    return parsed.version === 1 ? parsed : createEmptySave()
  } catch {
    return createEmptySave()
  }
}

export function recordStageClear(save: SaveData, stageId: StageId, result: StageClearResult): SaveData {
  const next = { ...save, stageRecords: mergeStageClearRecord(save.stageRecords, stageId, result) }
  localStorage.setItem(SAVE_KEY, JSON.stringify(next))
  return next
}

export function deleteSave(): SaveData {
  localStorage.removeItem(SAVE_KEY)
  return createEmptySave()
}

export function isStageUnlocked(save: SaveData, stageId: StageId): boolean {
  if (isDebugUnlockAllStagesEnabled()) return true

  const ids = Object.keys(stages) as StageId[]
  return isStageUnlockedByRecords(save.stageRecords, ids, stageId)
}

export function isDebugUnlockAllStagesEnabled(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false

  try {
    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get('debugUnlock') ?? params.get('debugUnlockStages')

    if (debugParam === '1' || debugParam === 'true') {
      localStorage.setItem(DEBUG_UNLOCK_KEY, '1')
    } else if (debugParam === '0' || debugParam === 'false') {
      localStorage.removeItem(DEBUG_UNLOCK_KEY)
    }

    return localStorage.getItem(DEBUG_UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}
```

- [ ] **Step 6: Run progression tests and typecheck**

Run:

```bash
npm run test -- src/domain/progression/progressionRules.test.ts
npm run check
```

Expected:

```text
PASS src/domain/progression/progressionRules.test.ts
```

and `npm run check` exits 0.

## Task 3: Extract Placement Rules

**Files:**

- Create: `src/domain/placement/objectDefinitions.ts`
- Create: `src/domain/placement/objectDefinitions.test.ts`
- Modify: `src/game/objects/objectDefinitions.ts`

- [ ] **Step 1: Write failing placement tests**

Create `src/domain/placement/objectDefinitions.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { groundedBottomY, groundedCenterY, groundedHazardCenterY, objectDefinitions } from './objectDefinitions'

describe('groundedCenterY', () => {
  test('places the player center above the surface using the player definition', () => {
    expect(groundedCenterY(704, 'player')).toBe(704 - objectDefinitions.player.centerAboveSurface)
  })

  test('places guards using the guard definition', () => {
    expect(groundedCenterY(640, 'guard')).toBe(640 - objectDefinitions.guard.centerAboveSurface)
  })
})

describe('groundedBottomY', () => {
  test('aligns the goal bottom using its visual bottom inset', () => {
    expect(groundedBottomY(704, 'goal')).toBe(704 + objectDefinitions.goal.visualBottomInset)
  })
})

describe('groundedHazardCenterY', () => {
  test('places floor spikes on a platform surface with visual inset', () => {
    expect(groundedHazardCenterY(704, 32, 'spikes')).toBe(704 - 16 + objectDefinitions.spikes.visualBottomInset)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/placement/objectDefinitions.test.ts
```

Expected:

```text
FAIL src/domain/placement/objectDefinitions.test.ts
Cannot find module './objectDefinitions'
```

- [ ] **Step 3: Move object definitions into domain**

Create `src/domain/placement/objectDefinitions.ts` by moving the current contents of `src/game/objects/objectDefinitions.ts` into the new file unchanged.

- [ ] **Step 4: Re-export from game adapter path**

Replace `src/game/objects/objectDefinitions.ts` with:

```ts
export {
  groundedBottomY,
  groundedCenterY,
  groundedHazardCenterY,
  objectDefinitions,
  type BodyDefinition,
  type GameObjectDefinition,
  type ObjectDefinitionId,
} from '../../domain/placement/objectDefinitions'
```

- [ ] **Step 5: Run placement tests and typecheck**

Run:

```bash
npm run test -- src/domain/placement/objectDefinitions.test.ts
npm run check
```

Expected:

```text
PASS src/domain/placement/objectDefinitions.test.ts
```

and `npm run check` exits 0.

## Task 4: Extract Stage Validation

**Files:**

- Create: `src/domain/stage/stageValidation.ts`
- Create: `src/domain/stage/stageValidation.test.ts`
- Modify: `src/game/stages/stageRegistry.ts`

- [ ] **Step 1: Write failing stage validation tests**

Create `src/domain/stage/stageValidation.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { StageData } from '../../game/stages/stageTypes'
import { validateStage } from './stageValidation'

const baseStage: StageData = {
  id: 'test-1',
  subtitle: 'Test',
  objective: 'Reach the Goal',
  rankTargets: { sTime: 20_000, aTime: 30_000, bTime: 40_000, cTime: 50_000 },
  world: { width: 1024, height: 768, tileSize: 64 },
  playerSpawn: { x: 96, surfaceY: 640 },
  platforms: [{ col: 1, row: 10, width: 5, height: 1 }],
  coins: [],
  enemies: [],
  checkpoints: [],
  sections: [],
  goal: { x: 256, surfaceY: 640 },
}

describe('validateStage', () => {
  test('accepts grounded objects that align with a platform surface', () => {
    expect(() => validateStage(baseStage)).not.toThrow()
  })

  test('rejects a goal that is not on a platform surface', () => {
    expect(() => validateStage({ ...baseStage, goal: { x: 900, surfaceY: 640 } })).toThrow(
      'grounded goal',
    )
  })

  test('rejects a grounded enemy that does not match the platform surfaceY', () => {
    expect(() =>
      validateStage({
        ...baseStage,
        enemies: [{ id: 'guard-1', x: 128, surfaceY: 650, patrolMinX: 80, patrolMaxX: 260 }],
      }),
    ).toThrow('enemy "guard-1"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/stage/stageValidation.test.ts
```

Expected:

```text
FAIL src/domain/stage/stageValidation.test.ts
Cannot find module './stageValidation'
```

- [ ] **Step 3: Implement pure stage validation**

Create `src/domain/stage/stageValidation.ts`:

```ts
import type { GuardEnemyPoint, StageData } from '../../game/stages/stageTypes'

type GroundedObject = {
  label: string
  x: number
  surfaceY: number
}

function isSupportedByPlatform(stage: StageData, object: GroundedObject): boolean {
  return stage.platforms.some((platform) => {
    const left = platform.col * stage.world.tileSize
    const right = left + platform.width * stage.world.tileSize
    const surfaceY = platform.row * stage.world.tileSize
    return object.x >= left && object.x < right && object.surfaceY === surfaceY
  })
}

export function validateStage(stage: StageData): void {
  const groundedObjects: GroundedObject[] = [
    { label: 'player spawn', x: stage.playerSpawn.x, surfaceY: stage.playerSpawn.surfaceY },
    ...stage.enemies
      .filter((enemy): enemy is GuardEnemyPoint => enemy.type !== 'azure-core')
      .map((enemy) => ({ label: `enemy "${enemy.id}"`, x: enemy.x, surfaceY: enemy.surfaceY })),
    ...stage.checkpoints.map((checkpoint) => ({
      label: `checkpoint "${checkpoint.id}"`,
      x: checkpoint.x,
      surfaceY: checkpoint.surfaceY,
    })),
    ...stage.checkpoints.map((checkpoint) => ({
      label: `checkpoint "${checkpoint.id}" respawn`,
      x: checkpoint.spawnX,
      surfaceY: checkpoint.spawnSurfaceY,
    })),
    { label: 'goal', x: stage.goal.x, surfaceY: stage.goal.surfaceY },
  ]

  for (const object of groundedObjects) {
    if (!isSupportedByPlatform(stage, object)) {
      throw new Error(
        `Stage ${stage.id}: grounded ${object.label} at (${object.x}, ${object.surfaceY}) does not align with a platform surface.`,
      )
    }
  }
}
```

- [ ] **Step 4: Run validation tests**

Run:

```bash
npm run test -- src/domain/stage/stageValidation.test.ts
```

Expected:

```text
PASS src/domain/stage/stageValidation.test.ts
```

- [ ] **Step 5: Wire stage registry to domain validation**

Modify `src/game/stages/stageRegistry.ts`:

1. Remove `GuardEnemyPoint` from the type import.
2. Add:

```ts
import { validateStage } from '../../domain/stage/stageValidation'
```

3. Remove the local `validateStage()` function body from this file.
4. Keep this export:

```ts
export { validateStage }
```

The bottom of the file should still run:

```ts
for (const stage of Object.values(stages)) validateStage(stage)
```

- [ ] **Step 6: Run all domain tests and typecheck**

Run:

```bash
npm run test
npm run check
```

Expected:

```text
PASS src/domain/progression/progressionRules.test.ts
PASS src/domain/placement/objectDefinitions.test.ts
PASS src/domain/stage/stageValidation.test.ts
```

and `npm run check` exits 0.

## Task 5: Update Workflow Documentation

**Files:**

- Modify: `docs/ARCHITECTURE_REVIEW_TDD_DDD.md`
- Modify: `docs/ARCHITECTURE_MAP.md`

- [ ] **Step 1: Document completed foundation**

In `docs/ARCHITECTURE_REVIEW_TDD_DDD.md`, add a short note under "Refactor Sequence" after Phase 1:

```md
Status note: The first domain test harness lives in `src/domain/`. Keep future pure rules under this folder before wiring them into Svelte or Phaser adapters.
```

- [ ] **Step 2: Document new domain layer**

In `docs/ARCHITECTURE_MAP.md`, add a section before "Svelte Ownership":

```md
## Domain Ownership

Pure domain code lives under `src/domain/`.

It owns tested rules for progression, placement, validation, ranking, and future player intent state machines. Domain files must not import Svelte, Phaser, DOM APIs, or `localStorage`.
```

- [ ] **Step 3: Run documentation and code checks**

Run:

```bash
git diff --check
npm run test
npm run check
```

Expected:

```text
PASS
```

for all tests and no whitespace errors.

## Final Verification

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected:

- Vitest exits 0.
- Svelte/TypeScript check exits 0.
- Vite build exits 0.
- `git diff --check` exits 0.

## Commit Guidance

Because the worktree already has many unrelated changes, stage only the files from this plan:

```bash
git add package.json package-lock.json \
  src/domain/progression/progressionRules.ts \
  src/domain/progression/progressionRules.test.ts \
  src/domain/placement/objectDefinitions.ts \
  src/domain/placement/objectDefinitions.test.ts \
  src/domain/stage/stageValidation.ts \
  src/domain/stage/stageValidation.test.ts \
  src/game/save/saveData.ts \
  src/game/objects/objectDefinitions.ts \
  src/game/stages/stageRegistry.ts \
  docs/ARCHITECTURE_REVIEW_TDD_DDD.md \
  docs/ARCHITECTURE_MAP.md \
  docs/superpowers/plans/2026-06-16-tdd-domain-foundation.md
```

Commit:

```bash
git commit -m "test: add domain foundation tests"
```
