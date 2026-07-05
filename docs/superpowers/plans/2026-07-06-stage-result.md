# Stage Result Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the rebuilt Stage Result experience shown after gameplay clear, matching the prototype presentation while keeping scoring, renderer output, and UI flow clean-room and test-driven.

**Architecture:** Pure scoring and result data live under `src/domain/gameplay/`. Phaser observes runtime facts and emits typed HUD/result patches; Svelte renders `GameplayHud` and `StageResult` reactively and delegates Retry / Stage Select intents to `App.svelte`. Save records, unlocks, and next-stage progression stay outside this slice.

**Tech Stack:** TypeScript, Vitest, Svelte 5, Phaser Arcade Physics, Vite, root `public/` runtime assets.

---

## File Structure

- Create `src/domain/gameplay/stageResult.ts`
  - Pure score, rank, perfect-row, action, and next-stage availability rules.
- Create `src/domain/gameplay/stageResult.test.ts`
  - Covers prototype-equivalent scoring, rank thresholds, perfect-row flags, and action availability.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`
  - Adds `RankTargets` and `rankTargets` to `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMaps.ts`
  - Adds explicit `1-1` rank targets.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Covers finite ordered rank targets.
- Modify `src/domain/gameplay/gameplayHud.ts`
  - Adds typed `GameplayClearResultSnapshot` and `result` state.
- Modify `src/domain/gameplay/gameplayHud.test.ts`
  - Covers initial null result and immutable result patching.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Calculates and emits a complete clear result snapshot on stage clear.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Covers snapshot emission, rank calculation, and existing post-clear freeze behavior.
- Create `src/ui/gameplay/StageResult.svelte`
  - Prototype-equivalent result overlay component.
- Create `src/ui/gameplay/stageResultUi.test.ts`
  - Source-level UI contract tests for overlay structure, actions, locked next stage, and container sizing.
- Modify `src/ui/gameplay/GameplayScreen.svelte`
  - Renders `StageResult` when `hudState.result` exists and wires result actions.
- Modify `src/ui/gameplay/gameplayScreenResult.test.ts`
  - Source-level contract tests for `StageResult` wiring.
- Modify `src/domain/app/appFlow.ts`
  - Adds pure helpers for retrying current gameplay and returning from gameplay to stage select.
- Modify `src/domain/app/appFlow.test.ts`
  - Covers Retry and Stage Select result actions.
- Modify `src/App.svelte`
  - Passes Retry and Stage Select callbacks into `GameplayScreen`.
- Copy `__prototype__/public/assets/results/yuuta-stage-result-standee.webp`
  - To `public/assets/results/yuuta-stage-result-standee.webp`.

## Task 1: Pure Stage Result Scoring And Actions

**Files:**
- Create: `src/domain/gameplay/stageResult.test.ts`
- Create: `src/domain/gameplay/stageResult.ts`

- [ ] **Step 1: Write the failing scoring and action tests**

Create `src/domain/gameplay/stageResult.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  calculateStageRank,
  getResultActionStates,
  getStageResultRowStates,
  scoreStageResult,
  type RankTargets,
} from './stageResult'

const rankTargets: RankTargets = {
  sTime: 20,
  aTime: 30,
  bTime: 40,
  cTime: 50,
}

describe('stage result scoring', () => {
  it('awards S rank for a perfect target result', () => {
    expect(calculateStageRank({
      elapsedMs: 20_000,
      rankTargets,
      coins: 10,
      coinTarget: 10,
      enemiesDefeated: 4,
      enemyTarget: 4,
      checkpointsReached: 3,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    })).toBe('S')
  })

  it('uses exact score thresholds for A, B, and C ranks', () => {
    const base = {
      rankTargets,
      coins: 0,
      coinTarget: 10,
      enemiesDefeated: 0,
      enemyTarget: 4,
      checkpointsReached: 0,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    }

    expect(calculateStageRank({ ...base, elapsedMs: 20_000, coins: 8 })).toBe('A')
    expect(calculateStageRank({ ...base, elapsedMs: 20_000, coins: 5 })).toBe('B')
    expect(calculateStageRank({ ...base, elapsedMs: 50_000 })).toBe('C')
  })

  it('returns D below the C threshold', () => {
    expect(calculateStageRank({
      elapsedMs: 90_000,
      rankTargets,
      coins: 0,
      coinTarget: 10,
      enemiesDefeated: 0,
      enemyTarget: 4,
      checkpointsReached: 0,
      checkpointTarget: 3,
      damageTaken: 1,
      falls: 1,
    })).toBe('D')
  })

  it('decays time score after the C target', () => {
    expect(scoreStageResult({
      elapsedMs: 51_000,
      rankTargets,
      coins: 0,
      coinTarget: 10,
      enemiesDefeated: 0,
      enemyTarget: 4,
      checkpointsReached: 0,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    }).timeScore).toBe(97)
  })

  it('grants full optional score when optional targets are zero', () => {
    expect(scoreStageResult({
      elapsedMs: 20_000,
      rankTargets,
      coins: 0,
      coinTarget: 0,
      enemiesDefeated: 0,
      enemyTarget: 0,
      checkpointsReached: 0,
      checkpointTarget: 0,
      damageTaken: 0,
      falls: 0,
    }).totalScore).toBe(1000)
  })

  it('applies damage and fall penalties', () => {
    expect(scoreStageResult({
      elapsedMs: 20_000,
      rankTargets,
      coins: 10,
      coinTarget: 10,
      enemiesDefeated: 4,
      enemyTarget: 4,
      checkpointsReached: 3,
      checkpointTarget: 3,
      damageTaken: 1,
      falls: 1,
    }).totalScore).toBe(740)
  })
})

describe('stage result row states', () => {
  it('marks prototype perfect rows from result counts', () => {
    expect(getStageResultRowStates({
      coins: 5,
      coinTarget: 5,
      damageTaken: 0,
      falls: 0,
      enemiesDefeated: 2,
      enemyTarget: 2,
      checkpointsReached: 3,
      checkpointTarget: 3,
    })).toEqual({
      coinsPerfect: true,
      damagePerfect: true,
      fallsPerfect: true,
      enemiesPerfect: true,
      checkpointsPerfect: true,
    })
  })
})

describe('stage result action states', () => {
  it('keeps next stage locked when no next gameplay map is available', () => {
    expect(getResultActionStates({ nextStageAvailable: false })).toEqual([
      { type: 'retry', disabled: false },
      { type: 'stage-select', disabled: false },
      { type: 'next-stage', disabled: true },
    ])
  })
})
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/stageResult.test.ts
```

Expected: FAIL because `src/domain/gameplay/stageResult.ts` does not exist.

- [ ] **Step 3: Implement the pure scoring and action module**

Create `src/domain/gameplay/stageResult.ts`:

```ts
export type ClearRank = 'S' | 'A' | 'B' | 'C' | 'D'

export type RankTargets = {
  sTime: number
  aTime: number
  bTime: number
  cTime: number
}

export type StageScoreInput = {
  elapsedMs: number
  rankTargets: RankTargets
  coins: number
  coinTarget: number
  enemiesDefeated: number
  enemyTarget: number
  checkpointsReached: number
  checkpointTarget: number
  damageTaken: number
  falls: number
}

export type StageScoreBreakdown = {
  baseScore: number
  timeScore: number
  coinScore: number
  enemyScore: number
  checkpointScore: number
  damagePenalty: number
  fallPenalty: number
  totalScore: number
}

export type StageResultRowsInput = Pick<
  StageScoreInput,
  'coins' | 'coinTarget' | 'damageTaken' | 'falls' | 'enemiesDefeated' | 'enemyTarget' | 'checkpointsReached' | 'checkpointTarget'
>

export type StageResultRowStates = {
  coinsPerfect: boolean
  damagePerfect: boolean
  fallsPerfect: boolean
  enemiesPerfect: boolean
  checkpointsPerfect: boolean
}

export type StageResultActionType = 'retry' | 'stage-select' | 'next-stage'

export type StageResultActionState = {
  type: StageResultActionType
  disabled: boolean
}

const baseScore = 300
const perfectTimeScore = 300
const aTimeScore = 240
const bTimeScore = 170
const cTimeScore = 100
const timeDecayPerSecond = 3
const maxCoinScore = 200
const maxEnemyScore = 150
const maxCheckpointScore = 50
const damagePenaltyValue = 80
const fallPenaltyValue = 180

function scoreRatioScore(value: number, target: number, maxScore: number): number {
  if (target <= 0) return maxScore
  return Math.floor((Math.max(0, value) / target) * maxScore)
}

function getTimeScore(input: Pick<StageScoreInput, 'elapsedMs' | 'rankTargets'>): number {
  const elapsedSeconds = input.elapsedMs / 1000
  if (elapsedSeconds <= input.rankTargets.sTime) return perfectTimeScore
  if (elapsedSeconds <= input.rankTargets.aTime) return aTimeScore
  if (elapsedSeconds <= input.rankTargets.bTime) return bTimeScore
  if (elapsedSeconds <= input.rankTargets.cTime) return cTimeScore

  return Math.max(0, cTimeScore - Math.floor(elapsedSeconds - input.rankTargets.cTime) * timeDecayPerSecond)
}

export function scoreStageResult(input: StageScoreInput): StageScoreBreakdown {
  const timeScore = getTimeScore(input)
  const coinScore = scoreRatioScore(input.coins, input.coinTarget, maxCoinScore)
  const enemyScore = scoreRatioScore(input.enemiesDefeated, input.enemyTarget, maxEnemyScore)
  const checkpointScore = scoreRatioScore(input.checkpointsReached, input.checkpointTarget, maxCheckpointScore)
  const damagePenalty = Math.max(0, input.damageTaken) * damagePenaltyValue
  const fallPenalty = Math.max(0, input.falls) * fallPenaltyValue
  const totalScore = baseScore + timeScore + coinScore + enemyScore + checkpointScore - damagePenalty - fallPenalty

  return {
    baseScore,
    timeScore,
    coinScore,
    enemyScore,
    checkpointScore,
    damagePenalty,
    fallPenalty,
    totalScore,
  }
}

export function calculateStageRank(input: StageScoreInput): ClearRank {
  const total = scoreStageResult(input).totalScore
  if (total >= 850) return 'S'
  if (total >= 700) return 'A'
  if (total >= 550) return 'B'
  if (total >= 400) return 'C'
  return 'D'
}

export function getStageResultRowStates(input: StageResultRowsInput): StageResultRowStates {
  return {
    coinsPerfect: input.coins === input.coinTarget,
    damagePerfect: input.damageTaken === 0,
    fallsPerfect: input.falls === 0,
    enemiesPerfect: input.enemiesDefeated === input.enemyTarget,
    checkpointsPerfect: input.checkpointsReached === input.checkpointTarget,
  }
}

export function getResultActionStates(input: {
  nextStageAvailable: boolean
}): StageResultActionState[] {
  return [
    { type: 'retry', disabled: false },
    { type: 'stage-select', disabled: false },
    { type: 'next-stage', disabled: !input.nextStageAvailable },
  ]
}
```

- [ ] **Step 4: Run the focused test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/stageResult.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/gameplay/stageResult.ts src/domain/gameplay/stageResult.test.ts
git commit -m "feat: add gameplay stage result scoring"
```

## Task 2: Stage Map Rank Targets And HUD Result State

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Modify: `src/domain/gameplay/gameplayHud.ts`
- Modify: `src/domain/gameplay/gameplayHud.test.ts`

- [ ] **Step 1: Write failing tests for rank targets and result state**

Add this import to `src/domain/gameplay/gameplayStageMaps.test.ts`:

```ts
import type { RankTargets } from './stageResult'
```

Add this test to `src/domain/gameplay/gameplayStageMaps.test.ts`:

```ts
it('defines ordered rank targets for the first gameplay stage', () => {
  const stage = getGameplayStageMap('1-1')
  expect(stage).toBeDefined()
  if (!stage) return

  const rankTargets: RankTargets = stage.rankTargets
  expect(rankTargets).toEqual({
    sTime: 80,
    aTime: 100,
    bTime: 125,
    cTime: 150,
  })
  expect(rankTargets.sTime).toBeLessThan(rankTargets.aTime)
  expect(rankTargets.aTime).toBeLessThan(rankTargets.bTime)
  expect(rankTargets.bTime).toBeLessThan(rankTargets.cTime)
})
```

Update the initial HUD state assertion in `src/domain/gameplay/gameplayHud.test.ts`:

```ts
expect(state).toMatchObject({
  hp: PLAYER_MAX_HEALTH,
  hpMax: PLAYER_MAX_HEALTH,
  coins: 0,
  coinTarget: stage.coins.length,
  damageTaken: 0,
  falls: 0,
  enemiesDefeated: 0,
  enemyTarget: stage.enemies.length,
  checkpointsReached: 0,
  checkpointTarget: stage.checkpoints.length,
  activeCheckpointIndex: -1,
  rank: '--',
  statusMessageKey: 'status.initial',
  cleared: false,
  result: null,
  time: '00:00.00',
})
```

Add this test to `src/domain/gameplay/gameplayHud.test.ts`:

```ts
it('applies a clear result snapshot immutably', () => {
  const stage = getGameplayStageMap('1-1')
  expect(stage).toBeDefined()
  if (!stage) return

  const first = createInitialGameplayHudState(stage)
  const second = applyGameplayHudPatch(first, {
    cleared: true,
    rank: 'S',
    result: {
      elapsedMs: 12_340,
      time: '00:12.34',
      coins: 5,
      coinTarget: 5,
      damageTaken: 0,
      falls: 0,
      enemiesDefeated: 2,
      enemyTarget: 2,
      checkpointsReached: 3,
      checkpointTarget: 3,
      rank: 'S',
    },
  })

  expect(second.result).toEqual({
    elapsedMs: 12_340,
    time: '00:12.34',
    coins: 5,
    coinTarget: 5,
    damageTaken: 0,
    falls: 0,
    enemiesDefeated: 2,
    enemyTarget: 2,
    checkpointsReached: 3,
    checkpointTarget: 3,
    rank: 'S',
  })
  expect(first.result).toBeNull()
  expect(second).not.toBe(first)
})
```

- [ ] **Step 2: Run focused tests and confirm expected failures**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts
```

Expected: FAIL because `GameplayStageMap.rankTargets` and `GameplayHudState.result` do not exist.

- [ ] **Step 3: Add rank targets and result state types**

In `src/domain/gameplay/gameplayMapTypes.ts`, add the import and field:

```ts
import type { RankTargets } from './stageResult'
```

```ts
export type GameplayStageMap = {
  id: StageId
  theme: GameplayTheme
  world: {
    width: number
    height: number
    tileSize: number
  }
  rankTargets: RankTargets
  backgroundLayers: readonly BackgroundLayer[]
  player: GameplayPlayerSpawn
  enemies: readonly GameplayEnemySpawn[]
  coins: readonly GameplayCoinPoint[]
  hazards: readonly GameplayHazardSpawn[]
  checkpoints: readonly GameplayCheckpointSpawn[]
  goal: GameplayGoalSpawn
  terrain: TerrainDefinition
}
```

In `src/domain/gameplay/gameplayStageMaps.ts`, add the `1-1` rank targets immediately after `world`:

```ts
  rankTargets: {
    sTime: 80,
    aTime: 100,
    bTime: 125,
    cTime: 150,
  },
```

In `src/domain/gameplay/gameplayHud.ts`, import `ClearRank`:

```ts
import type { ClearRank } from './stageResult'
```

Add the snapshot type:

```ts
export type GameplayClearResultSnapshot = {
  elapsedMs: number
  time: string
  coins: number
  coinTarget: number
  damageTaken: number
  falls: number
  enemiesDefeated: number
  enemyTarget: number
  checkpointsReached: number
  checkpointTarget: number
  rank: ClearRank
}
```

Change HUD rank/result fields:

```ts
  rank: ClearRank | '--'
  result: GameplayClearResultSnapshot | null
```

Add `result: null` in `createInitialGameplayHudState`.

- [ ] **Step 4: Run focused tests and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.ts src/domain/gameplay/gameplayHud.test.ts
git commit -m "feat: add gameplay result state contract"
```

## Task 3: Renderer Clear Result Snapshot

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write the failing renderer snapshot test**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, add `calculateStageRank` to imports:

```ts
import { calculateStageRank } from '../../domain/gameplay/stageResult'
```

Add this test near the existing stage clear tests:

```ts
it('emits a complete result snapshot when the stage is cleared', () => {
  const stage = getGameplayStageMap('1-1')
  expect(stage).toBeDefined()
  if (!stage) return

  const runtime = createSceneRuntime({ stage })
  runtime.scene.create()
  runtime.scene.time.now = 12_340
  runtime.scene.update()

  const goal = getGoalSprite(runtime)
  runtime.triggerGoalOverlap(goal)

  const resultPatch = runtime.hudUpdates.find((patch) => patch.result)
  expect(resultPatch).toBeDefined()
  expect(resultPatch).toMatchObject({
    cleared: true,
    rank: calculateStageRank({
      elapsedMs: runtime.scene.time.now,
      rankTargets: stage.rankTargets,
      coins: 0,
      coinTarget: stage.coins.length,
      enemiesDefeated: 0,
      enemyTarget: stage.enemies.length,
      checkpointsReached: 0,
      checkpointTarget: stage.checkpoints.length,
      damageTaken: 0,
      falls: 0,
    }),
    result: {
      elapsedMs: runtime.scene.time.now,
      time: formatGameplayHudTime(runtime.scene.time.now),
      coins: 0,
      coinTarget: stage.coins.length,
      damageTaken: 0,
      falls: 0,
      enemiesDefeated: 0,
      enemyTarget: stage.enemies.length,
      checkpointsReached: 0,
      checkpointTarget: stage.checkpoints.length,
    },
  })
})
```

- [ ] **Step 2: Run focused renderer test and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because clear patches do not include `result`.

- [ ] **Step 3: Implement renderer result snapshot emission**

In `src/ui/gameplay/createGameplayRenderer.ts`, import scoring:

```ts
import { calculateStageRank } from '../../domain/gameplay/stageResult'
```

Add a private snapshot builder to `GameplayMapScene`:

```ts
  private getReachedCheckpointCount(): number {
    return this.activeCheckpointIndex + 1
  }

  private createClearResultSnapshot() {
    const elapsedMs = this.time.now
    const rank = calculateStageRank({
      elapsedMs,
      rankTargets: this.stageMap.rankTargets,
      coins: this.collectedCoins,
      coinTarget: this.stageMap.coins.length,
      enemiesDefeated: this.enemiesDefeated,
      enemyTarget: this.stageMap.enemies.length,
      checkpointsReached: this.getReachedCheckpointCount(),
      checkpointTarget: this.stageMap.checkpoints.length,
      damageTaken: this.damageTaken,
      falls: this.falls,
    })

    return {
      elapsedMs,
      time: formatGameplayHudTime(elapsedMs),
      coins: this.collectedCoins,
      coinTarget: this.stageMap.coins.length,
      damageTaken: this.damageTaken,
      falls: this.falls,
      enemiesDefeated: this.enemiesDefeated,
      enemyTarget: this.stageMap.enemies.length,
      checkpointsReached: this.getReachedCheckpointCount(),
      checkpointTarget: this.stageMap.checkpoints.length,
      rank,
    }
  }
```

Replace the clear patch in `completeStage()`:

```ts
    const result = this.createClearResultSnapshot()
    this.emitHudPatch({ cleared: true, rank: result.rank, result })
```

If a checkpoint count helper already exists in the renderer by the time this task runs, use that helper instead of adding a duplicate method.

- [ ] **Step 4: Run focused renderer test and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS, including existing clear freeze tests.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: emit gameplay clear result snapshot"
```

## Task 4: Stage Result Component And Asset

**Files:**
- Create: `src/ui/gameplay/StageResult.svelte`
- Create: `src/ui/gameplay/stageResultUi.test.ts`
- Copy: `public/assets/results/yuuta-stage-result-standee.webp`

- [ ] **Step 1: Copy the result standee asset**

Run:

```bash
mkdir -p public/assets/results
cp __prototype__/public/assets/results/yuuta-stage-result-standee.webp public/assets/results/yuuta-stage-result-standee.webp
```

- [ ] **Step 2: Write failing UI source tests**

Create `src/ui/gameplay/stageResultUi.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import stageResultSource from './StageResult.svelte?raw'

describe('StageResult UI contract', () => {
  it('renders the prototype-equivalent result overlay structure', () => {
    expect(stageResultSource).toContain('class="stage-result"')
    expect(stageResultSource).toContain('class="result-veil"')
    expect(stageResultSource).toContain('class="result-hero"')
    expect(stageResultSource).toContain('/assets/results/yuuta-stage-result-standee.webp')
    expect(stageResultSource).toContain('class="result-banner"')
    expect(stageResultSource).toContain('class="result-board"')
    expect(stageResultSource).toContain('class="result-rank"')
    expect(stageResultSource).toContain('class="result-actions"')
  })

  it('renders all result stats and perfect markers from state', () => {
    expect(stageResultSource).toContain('Clear Time')
    expect(stageResultSource).toContain('Coins')
    expect(stageResultSource).toContain('Damage Taken')
    expect(stageResultSource).toContain('Falls')
    expect(stageResultSource).toContain('Enemies Defeated')
    expect(stageResultSource).toContain('Checkpoints')
    expect(stageResultSource).toContain('Perfect')
    expect(stageResultSource).toContain('getStageResultRowStates')
  })

  it('renders retry, stage select, and locked next stage actions', () => {
    expect(stageResultSource).toContain('Retry')
    expect(stageResultSource).toContain('Stage Select')
    expect(stageResultSource).toContain('Next Stage')
    expect(stageResultSource).toContain('getResultActionStates')
    expect(stageResultSource).toContain('disabled={action.disabled}')
  })

  it('sizes the result overlay against the resolution frame container', () => {
    expect(stageResultSource).toContain('cqw')
    expect(stageResultSource).toContain('cqh')
    expect(stageResultSource).not.toContain('100vw')
    expect(stageResultSource).not.toContain('100vh')
  })
})
```

- [ ] **Step 3: Run the focused UI test and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/stageResultUi.test.ts
```

Expected: FAIL because `StageResult.svelte` does not exist.

- [ ] **Step 4: Implement `StageResult.svelte`**

Create `src/ui/gameplay/StageResult.svelte`:

```svelte
<script lang="ts">
  import type { GameplayClearResultSnapshot } from '../../domain/gameplay/gameplayHud'
  import {
    getResultActionStates,
    getStageResultRowStates,
    type StageResultActionType,
  } from '../../domain/gameplay/stageResult'
  import type { GameplayHudStageDisplay } from './gameplayHudDisplay'

  type Props = {
    result: GameplayClearResultSnapshot
    stageDisplay: GameplayHudStageDisplay
    selectedAction: number
    nextStageAvailable: boolean
    onSelectAction: (index: number) => void
    onAction: (action: StageResultActionType) => void
  }

  let {
    result,
    stageDisplay,
    selectedAction,
    nextStageAvailable,
    onSelectAction,
    onAction,
  }: Props = $props()

  const rowStates = $derived(getStageResultRowStates(result))
  const actions = $derived(getResultActionStates({ nextStageAvailable }))

  function actionLabel(type: StageResultActionType): string {
    if (type === 'retry') return 'Retry'
    if (type === 'stage-select') return 'Stage Select'
    return 'Next Stage'
  }

  function activateAction(type: StageResultActionType, disabled: boolean): void {
    if (disabled) return
    onAction(type)
  }
</script>

<section class="stage-result" aria-label="Stage Result">
  <div class="result-veil"></div>
  <aside class="result-hero" aria-hidden="true">
    <img src="/assets/results/yuuta-stage-result-standee.webp" alt="" />
    <div>
      <strong>Yuuta Tsubasa</strong>
      <span>Paladin Candidate</span>
    </div>
  </aside>

  <div class="result-content">
    <div class="result-banner">Stage Result</div>
    <div class="result-stage-name">
      <strong>{stageDisplay.worldLabel} {stageDisplay.stageId}</strong>
      <span>{stageDisplay.stageSubtitle}</span>
    </div>

    <div class="result-board">
      <div class="result-stats">
        <div class="result-row">
          <span>Clear Time</span>
          <b>{result.time}</b>
          <em>New Record</em>
        </div>
        <div class:perfect={rowStates.coinsPerfect} class="result-row">
          <span>Coins</span>
          <b>{result.coins} / {result.coinTarget}</b>
          {#if rowStates.coinsPerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.damagePerfect} class="result-row">
          <span>Damage Taken</span>
          <b>{result.damageTaken}</b>
          {#if rowStates.damagePerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.fallsPerfect} class="result-row">
          <span>Falls</span>
          <b>{result.falls}</b>
          {#if rowStates.fallsPerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.enemiesPerfect} class="result-row">
          <span>Enemies Defeated</span>
          <b>{result.enemiesDefeated} / {result.enemyTarget}</b>
          {#if rowStates.enemiesPerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.checkpointsPerfect} class="result-row">
          <span>Checkpoints</span>
          <b>{result.checkpointsReached} / {result.checkpointTarget}</b>
          {#if rowStates.checkpointsPerfect}<em>Perfect</em>{/if}
        </div>
      </div>

      <div class={`result-rank rank-${result.rank.toLowerCase()}`}>
        <span>Final Evaluation</span>
        <strong>{result.rank}</strong>
      </div>
    </div>

    <div class="result-actions">
      {#each actions as action, index}
        <button
          type="button"
          class:active={selectedAction === index}
          class:locked={action.disabled}
          disabled={action.disabled}
          onclick={() => activateAction(action.type, action.disabled)}
          onmouseenter={() => onSelectAction(index)}
        >
          {actionLabel(action.type)}
        </button>
      {/each}
    </div>
  </div>
</section>

<style>
  .stage-result {
    position: absolute;
    inset: 0;
    z-index: 25;
    overflow: hidden;
    pointer-events: auto;
    color: #f5fbff;
    font-family: system-ui, sans-serif;
  }

  .result-veil {
    position: absolute;
    inset: 0;
    background: rgba(3, 8, 18, 0.68);
    backdrop-filter: blur(0.42cqw);
    animation: result-veil-in 500ms ease both;
  }

  .result-hero {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 27cqw;
    height: 100cqh;
    animation: result-hero-in 650ms 160ms ease both;
  }

  .result-hero img {
    position: absolute;
    left: 1.2cqw;
    bottom: 0;
    width: 25cqw;
    height: 86cqh;
    object-fit: contain;
    object-position: bottom center;
    mask-image: linear-gradient(90deg, #000 78%, transparent);
  }

  .result-hero div {
    position: absolute;
    left: 3cqw;
    bottom: 7cqh;
    display: grid;
    gap: 0.4cqh;
    text-transform: uppercase;
  }

  .result-hero strong {
    font-size: 1.45cqw;
  }

  .result-hero span {
    color: #ffd978;
    font-size: 0.8cqw;
  }

  .result-content {
    position: absolute;
    inset: 0 2.2cqw 0 27cqw;
  }

  .result-banner {
    position: absolute;
    top: 4.2cqh;
    left: 50%;
    width: 48cqw;
    height: 10.8cqh;
    display: grid;
    place-items: center;
    clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%);
    background: linear-gradient(180deg, rgba(58, 198, 255, 0.94), rgba(23, 83, 170, 0.94));
    border: 0.12cqw solid rgba(212, 240, 255, 0.8);
    box-shadow: 0 1.2cqh 3cqh rgba(0, 18, 54, 0.42);
    font-size: 2.2cqw;
    font-weight: 900;
    text-transform: uppercase;
    transform: translateX(-50%);
    animation: result-banner-in 520ms 260ms ease both;
  }

  .result-stage-name {
    position: absolute;
    top: 16.7cqh;
    left: 50%;
    display: grid;
    justify-items: center;
    gap: 0.4cqh;
    transform: translateX(-50%);
    text-transform: uppercase;
  }

  .result-stage-name strong {
    font-size: 1.45cqw;
  }

  .result-stage-name span {
    color: #ffd978;
    font-size: 0.92cqw;
  }

  .result-board {
    position: absolute;
    top: 23cqh;
    left: 0;
    right: 0;
    height: 43cqh;
    display: grid;
    grid-template-columns: 1fr 20cqw;
    gap: 1.2cqw;
    padding: 2cqh 1.4cqw;
    background: rgba(8, 20, 46, 0.78);
    border: 0.12cqw solid rgba(157, 217, 255, 0.5);
    box-shadow: inset 0 0 0 0.08cqw rgba(255, 255, 255, 0.16);
    animation: result-board-in 520ms 360ms ease both;
  }

  .result-stats {
    display: grid;
    gap: 0.82cqh;
  }

  .result-row {
    display: grid;
    grid-template-columns: 1fr auto 6.8cqw;
    align-items: center;
    min-height: 5.4cqh;
    padding: 0 1cqw;
    background: rgba(255, 255, 255, 0.075);
    border-left: 0.22cqw solid rgba(76, 218, 255, 0.7);
    font-size: 0.95cqw;
    animation: result-row-in 420ms ease both;
  }

  .result-row b {
    font-size: 1.15cqw;
  }

  .result-row em {
    color: #ffd978;
    font-size: 0.72cqw;
    font-style: normal;
    text-align: right;
    text-transform: uppercase;
  }

  .result-row.perfect {
    border-left-color: #ffd978;
  }

  .result-rank {
    align-self: center;
    justify-self: center;
    width: 16cqw;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18), rgba(24, 80, 150, 0.9));
    border: 0.18cqw solid rgba(255, 255, 255, 0.65);
    text-transform: uppercase;
  }

  .result-rank span {
    font-size: 0.78cqw;
  }

  .result-rank strong {
    font-size: 6cqw;
    line-height: 1;
  }

  .rank-s {
    color: #fff3a8;
    box-shadow: 0 0 3cqh rgba(255, 217, 92, 0.55);
  }

  .rank-a {
    color: #c8f7ff;
  }

  .rank-b,
  .rank-c,
  .rank-d {
    color: #f5fbff;
  }

  .result-actions {
    position: absolute;
    top: 70cqh;
    left: 50%;
    width: 52cqw;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1cqw;
    transform: translateX(-50%);
  }

  .result-actions button {
    height: 7.2cqh;
    border: 0.12cqw solid rgba(185, 232, 255, 0.7);
    background: rgba(15, 44, 92, 0.86);
    color: inherit;
    font-size: 1cqw;
    font-weight: 800;
    text-transform: uppercase;
  }

  .result-actions button.active,
  .result-actions button:hover:not(:disabled) {
    border-color: #ffd978;
    color: #ffd978;
  }

  .result-actions button.locked {
    opacity: 0.42;
  }

  @keyframes result-veil-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes result-hero-in {
    from { opacity: 0; transform: translateX(-4cqw); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes result-banner-in {
    from { opacity: 0; transform: translate(-50%, -3cqh); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  @keyframes result-board-in {
    from { opacity: 0; transform: translateY(3cqh); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes result-row-in {
    from { opacity: 0; transform: translateX(2cqw); }
    to { opacity: 1; transform: translateX(0); }
  }
</style>
```

- [ ] **Step 5: Run focused UI test and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/stageResultUi.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add public/assets/results/yuuta-stage-result-standee.webp src/ui/gameplay/StageResult.svelte src/ui/gameplay/stageResultUi.test.ts
git commit -m "feat: add gameplay stage result overlay"
```

## Task 5: Gameplay Screen And App Flow Wiring

**Files:**
- Modify: `src/domain/app/appFlow.ts`
- Modify: `src/domain/app/appFlow.test.ts`
- Modify: `src/ui/gameplay/GameplayScreen.svelte`
- Create: `src/ui/gameplay/gameplayScreenResult.test.ts`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write failing app-flow tests**

In `src/domain/app/appFlow.test.ts`, add imports:

```ts
  retryGameplayStage,
  returnFromGameplayToStageSelect,
```

Add tests:

```ts
describe('gameplay result flow', () => {
  it('retries the current gameplay stage with a remount token', () => {
    expect(retryGameplayStage({ screen: { type: 'gameplay', stageId: '1-1', runId: 0 } })).toEqual({
      screen: { type: 'gameplay', stageId: '1-1', runId: 1 },
    })
  })

  it('returns from gameplay to the matching stage select entry', () => {
    expect(returnFromGameplayToStageSelect({ screen: { type: 'gameplay', stageId: '1-1', runId: 2 } })).toEqual({
      screen: {
        type: 'stage-select',
        selectedWorldIndex: 0,
        worldId: 'world01',
        selectedStageIndex: 0,
      },
    })
  })
})
```

- [ ] **Step 2: Write failing GameplayScreen source test**

Create `src/ui/gameplay/gameplayScreenResult.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import gameplayScreenSource from './GameplayScreen.svelte?raw'

describe('GameplayScreen result wiring', () => {
  it('renders StageResult from the HUD result snapshot', () => {
    expect(gameplayScreenSource).toContain("import StageResult from './StageResult.svelte'")
    expect(gameplayScreenSource).toContain('{#if hudState.result}')
    expect(gameplayScreenSource).toContain('<StageResult')
    expect(gameplayScreenSource).toContain('result={hudState.result}')
  })

  it('wires result actions to parent callbacks', () => {
    expect(gameplayScreenSource).toContain('onRetry')
    expect(gameplayScreenSource).toContain('onStageSelect')
    expect(gameplayScreenSource).toContain('handleResultAction')
    expect(gameplayScreenSource).toContain("action === 'retry'")
    expect(gameplayScreenSource).toContain("action === 'stage-select'")
  })
})
```

- [ ] **Step 3: Run focused tests and confirm expected failures**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts src/ui/gameplay/gameplayScreenResult.test.ts
```

Expected: FAIL because result flow helpers and `StageResult` wiring do not exist.

- [ ] **Step 4: Implement pure app-flow helpers**

In `src/domain/app/appFlow.ts`, change `GameplayScreen`:

```ts
export type GameplayScreen = {
  type: 'gameplay'
  stageId: StageId
  runId: number
}
```

Update `confirmSelectedStage`:

```ts
  return {
    screen: { type: 'gameplay', stageId: getStageIdForSelection(state.screen), runId: 0 },
  }
```

Add helpers:

```ts
function getStageSelectionForStageId(stageId: StageId): StageSelectScreen {
  const [world, stage] = stageId.split('-').map(Number)
  const selectedWorldIndex = Math.max(0, world - 1)
  const selectedStageIndex = Math.max(0, stage - 1)

  return {
    type: 'stage-select',
    selectedWorldIndex,
    worldId: WORLD_IDS[selectedWorldIndex] ?? 'world01',
    selectedStageIndex,
  }
}

export function retryGameplayStage(state: AppState): AppState {
  if (state.screen.type !== 'gameplay') return state

  return {
    screen: {
      ...state.screen,
      runId: state.screen.runId + 1,
    },
  }
}

export function returnFromGameplayToStageSelect(state: AppState): AppState {
  if (state.screen.type !== 'gameplay') return state

  return {
    screen: getStageSelectionForStageId(state.screen.stageId),
  }
}
```

Update any existing app-flow test expectations for gameplay screens from:

```ts
screen: { type: 'gameplay', stageId: '2-5' },
```

to:

```ts
screen: { type: 'gameplay', stageId: '2-5', runId: 0 },
```

- [ ] **Step 5: Implement GameplayScreen result wiring**

In `src/ui/gameplay/GameplayScreen.svelte`, add imports and props:

```svelte
  import type { StageResultActionType } from '../../domain/gameplay/stageResult'
  import StageResult from './StageResult.svelte'
```

```svelte
  type Props = {
    stage: GameplayStageMap
    onRetry: () => void
    onStageSelect: () => void
  }

  let { stage, onRetry, onStageSelect }: Props = $props()
  let selectedResultAction = $state(0)
```

Add action handling:

```svelte
  function handleResultAction(action: StageResultActionType): void {
    if (action === 'retry') onRetry()
    if (action === 'stage-select') onStageSelect()
  }
```

Render after `GameplayHud`:

```svelte
    {#if hudState.result}
      <StageResult
        result={hudState.result}
        {stageDisplay}
        selectedAction={selectedResultAction}
        nextStageAvailable={false}
        onSelectAction={(index) => selectedResultAction = index}
        onAction={handleResultAction}
      />
    {/if}
```

- [ ] **Step 6: Implement App callback wiring**

In `src/App.svelte`, import helpers:

```ts
    retryGameplayStage,
    returnFromGameplayToStageSelect,
```

Add handlers:

```ts
  function handleRetryGameplayStage() {
    playUiSfx('confirm')
    appState = retryGameplayStage(appState)
    syncMusicForCurrentState()
  }

  function handleReturnFromGameplayToStageSelect() {
    playUiSfx('back')
    appState = returnFromGameplayToStageSelect(appState)
    syncMusicForCurrentState()
  }
```

Update gameplay screen rendering:

```svelte
    {:else if appState.screen.type === 'gameplay' && gameplayStageMap}
      {#key `${gameplayStageMap.id}:${appState.screen.runId}`}
        <GameplayScreen
          stage={gameplayStageMap}
          onRetry={handleRetryGameplayStage}
          onStageSelect={handleReturnFromGameplayToStageSelect}
        />
      {/key}
```

- [ ] **Step 7: Run focused tests and confirm pass**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts src/ui/gameplay/gameplayScreenResult.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add src/domain/app/appFlow.ts src/domain/app/appFlow.test.ts src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayScreenResult.test.ts src/App.svelte
git commit -m "feat: wire gameplay stage result actions"
```

## Task 6: Full Verification And Browser Parity Check

**Files:**
- Modify only if verification exposes a defect in files touched by Tasks 1-5.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
rg "__prototype__" src public --glob '!public/assets/**'
```

Expected:

- `npm run test`: PASS.
- `npm run check`: PASS.
- `npm run build`: PASS.
- `git diff --check`: no output.
- `rg "__prototype__" src public --glob '!public/assets/**'`: no output.

- [ ] **Step 2: Start the local dev server**

Run:

```bash
npm run dev
```

Expected: Vite serves the app at `http://127.0.0.1:1420/`. Leave the server running for browser verification.

- [ ] **Step 3: Verify Stage Result in browser**

Use the in-app browser at `http://127.0.0.1:1420/`:

1. Navigate Title -> World Select -> Stage Select -> `1-1`.
2. Play to the goal or use a temporary local testing route only if manual play is impractical; remove any temporary route before commit.
3. Confirm the result overlay covers the gameplay frame after clear.
4. Confirm the Yuuta standee, result banner, stage title/subtitle, stats board, rank circle, and three actions are visible.
5. Confirm `Next Stage` is visible but disabled.
6. Confirm `Retry` remounts `1-1`.
7. Confirm `Stage Select` returns to stage select with `1-1` selected.
8. Resize the browser to a smaller 16:9 frame and confirm result content does not overlap.

- [ ] **Step 4: Fix any verification failures with focused TDD**

For each failure, add the smallest failing test that reproduces the issue, run it to confirm failure, implement the smallest fix, then rerun:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected: all checks PASS.

- [ ] **Step 5: Final commit**

If Task 6 required fixes, commit them:

```bash
git add src public
git commit -m "fix: verify gameplay stage result parity"
```

If Task 6 required no fixes, do not create an empty commit.
