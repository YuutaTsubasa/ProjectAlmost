# Select Info Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Chapter Select and Stage Select information update from progression-derived select view models.

**Architecture:** Add a pure application presenter that projects catalog and progression facts into select-screen view models. `App.svelte` derives those view models reactively, while Svelte components render prepared data and emit intents.

**Tech Stack:** TypeScript, Svelte 5 runes, Vitest, existing project data catalogs and progression rules.

---

## File Structure

- Create `src/application/select/selectInfoPresenter.ts`: pure presenter for world and stage select information.
- Create `src/application/select/selectInfoPresenter.test.ts`: TDD coverage for chapter progress and stage option projection.
- Modify `src/App.svelte`: derive select info from progression and pass it to UI components.
- Modify `src/application/progression/appStageProgressionWiring.test.ts`: source contract for App wiring.
- Modify `src/ui/world/WorldSelectScreen.svelte`: render selected world progress from prepared view model.
- Create `src/ui/world/worldSelectInfo.test.ts`: source contract preventing hard-coded Chapter progress.
- Modify `src/ui/stage/StageSelectScreen.svelte`: consume prepared stage select info instead of rebuilding progression lookup.
- Modify `src/ui/stage/stageSelectLocalization.test.ts`: source contract for Stage Select info presenter integration.

---

### Task 1: Select Info Presenter

**Files:**
- Create: `src/application/select/selectInfoPresenter.ts`
- Test: `src/application/select/selectInfoPresenter.test.ts`

- [ ] **Step 1: Write failing presenter tests**

Create `src/application/select/selectInfoPresenter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { stages } from '../../domain/data/stages/stageCatalog'
import { worlds } from '../../domain/data/worlds/worldCatalog'
import type { StageId } from '../../domain/data/worlds/worldTypes'
import type { StageProgressionOptionState, StageRecord } from '../../domain/progression/stageProgression'
import {
  projectStageSelectInfo,
  projectWorldSelectInfo,
} from './selectInfoPresenter'

const record: StageRecord = {
  cleared: true,
  bestTimeMs: 12_340,
  bestTime: '00:12.34',
  bestRank: 'A',
  maxCoins: 5,
}

function option(
  stageId: StageId,
  overrides: Partial<StageProgressionOptionState<StageId>> = {},
): StageProgressionOptionState<StageId> {
  return {
    stageId,
    unlocked: false,
    cleared: false,
    record: undefined,
    ...overrides,
  }
}

describe('world select info presenter', () => {
  it('counts cleared progress per world from that world stage ids only', () => {
    const info = projectWorldSelectInfo(worlds, [
      option('1-1', { unlocked: true, cleared: true, record }),
      option('1-2', { unlocked: true, cleared: true, record }),
      option('2-1', { unlocked: true, cleared: true, record }),
    ])

    expect(info.worlds.find((world) => world.world.id === 'world01')).toMatchObject({
      clearedStageCount: 2,
      stageCount: 6,
      progressPercent: (2 / 6) * 100,
    })
    expect(info.worlds.find((world) => world.world.id === 'world02')).toMatchObject({
      clearedStageCount: 1,
      stageCount: 6,
      progressPercent: (1 / 6) * 100,
    })
  })

  it('treats missing progression as uncleared chapter progress', () => {
    const info = projectWorldSelectInfo(worlds, [
      option('3-1', { unlocked: true, cleared: true, record }),
    ])

    expect(info.worlds.find((world) => world.world.id === 'world01')).toMatchObject({
      clearedStageCount: 0,
      stageCount: 6,
      progressPercent: 0,
    })
    expect(info.worlds.find((world) => world.world.id === 'world03')).toMatchObject({
      clearedStageCount: 1,
      stageCount: 6,
      progressPercent: (1 / 6) * 100,
    })
  })
})

describe('stage select info presenter', () => {
  it('projects selected world stages with progression state and records', () => {
    const info = projectStageSelectInfo(worlds, stages, 'world02', [
      option('2-1', { unlocked: true, cleared: true, record }),
      option('2-2', { unlocked: true }),
    ])

    expect(info.world.id).toBe('world02')
    expect(info.stages.map((stage) => stage.stage.id)).toEqual(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'])
    expect(info.stages[0]).toMatchObject({
      unlocked: true,
      cleared: true,
      record,
    })
    expect(info.stages[1]).toMatchObject({
      unlocked: true,
      cleared: false,
      record: undefined,
    })
  })

  it('treats missing stage progression entries as locked and recordless', () => {
    const info = projectStageSelectInfo(worlds, stages, 'world01', [
      option('1-1', { unlocked: true }),
    ])

    expect(info.stages[0]).toMatchObject({ unlocked: true, cleared: false, record: undefined })
    expect(info.stages[1]).toMatchObject({ unlocked: false, cleared: false, record: undefined })
  })
})
```

- [ ] **Step 2: Run presenter tests to verify RED**

Run:

```bash
npm run test -- src/application/select/selectInfoPresenter.test.ts
```

Expected: FAIL because `src/application/select/selectInfoPresenter.ts` does not exist.

- [ ] **Step 3: Implement the presenter**

Create `src/application/select/selectInfoPresenter.ts`:

```ts
import type { StageCatalog, StageData } from '../../domain/data/stages/stageTypes'
import type { StageId, WorldCatalog, WorldData, WorldId } from '../../domain/data/worlds/worldTypes'
import type { StageProgressionOptionState, StageRecord } from '../../domain/progression/stageProgression'

export type WorldSelectInfo = {
  world: WorldData
  clearedStageCount: number
  stageCount: number
  progressPercent: number
}

export type WorldSelectInfoViewModel = {
  worlds: readonly WorldSelectInfo[]
}

export type StageSelectStageInfo = {
  stage: StageData
  unlocked: boolean
  cleared: boolean
  record: StageRecord | undefined
}

export type StageSelectInfoViewModel = {
  world: WorldData
  stages: readonly StageSelectStageInfo[]
}

function createProgressionLookup(
  progressionOptions: readonly StageProgressionOptionState<StageId>[],
): ReadonlyMap<StageId, StageProgressionOptionState<StageId>> {
  return new Map(progressionOptions.map((option) => [option.stageId, option]))
}

function getStageInfo(
  stage: StageData,
  progressionByStageId: ReadonlyMap<StageId, StageProgressionOptionState<StageId>>,
): StageSelectStageInfo {
  const progression = progressionByStageId.get(stage.id)

  return {
    stage,
    unlocked: progression?.unlocked === true,
    cleared: progression?.cleared === true,
    record: progression?.record,
  }
}

export function projectWorldSelectInfo(
  worlds: WorldCatalog,
  progressionOptions: readonly StageProgressionOptionState<StageId>[],
): WorldSelectInfoViewModel {
  const progressionByStageId = createProgressionLookup(progressionOptions)

  return {
    worlds: worlds.order.map((worldId) => {
      const world = worlds.items[worldId]
      const stageCount = world.stageIds.length
      const clearedStageCount = world.stageIds.filter(
        (stageId) => progressionByStageId.get(stageId)?.cleared === true,
      ).length

      return {
        world,
        clearedStageCount,
        stageCount,
        progressPercent: stageCount > 0 ? (clearedStageCount / stageCount) * 100 : 0,
      }
    }),
  }
}

export function projectStageSelectInfo(
  worlds: WorldCatalog,
  stages: StageCatalog,
  worldId: WorldId,
  progressionOptions: readonly StageProgressionOptionState<StageId>[],
): StageSelectInfoViewModel {
  const world = worlds.items[worldId] ?? worlds.items[worlds.order[0]]
  const progressionByStageId = createProgressionLookup(progressionOptions)

  return {
    world,
    stages: world.stageIds.map((stageId) => getStageInfo(stages.items[stageId], progressionByStageId)),
  }
}
```

- [ ] **Step 4: Run presenter tests to verify GREEN**

Run:

```bash
npm run test -- src/application/select/selectInfoPresenter.test.ts
```

Expected: PASS.

---

### Task 2: App Select Info Wiring

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`

- [ ] **Step 1: Write failing App wiring tests**

Append to the `App stage select progression UI wiring` describe block in `src/application/progression/appStageProgressionWiring.test.ts`:

```ts
  it('derives select info view models from projected stage progression', () => {
    expect(source).toContain("import { projectStageSelectInfo, projectWorldSelectInfo } from '../select/selectInfoPresenter'")
    expect(source).toContain('const worldSelectInfo = $derived(')
    expect(source).toContain('projectWorldSelectInfo(')
    expect(source).toContain('const stageSelectInfo = $derived(')
    expect(source).toContain('projectStageSelectInfo(')
    expect(source).toContain('stageProgressionOptions')
  })

  it('passes select info view models into select screens', () => {
    expect(source).toContain('selectInfo={worldSelectInfo}')
    expect(source).toContain('selectInfo={stageSelectInfo}')
  })
```

- [ ] **Step 2: Run App wiring tests to verify RED**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: FAIL because the imports, derived values, and props are not wired yet.

- [ ] **Step 3: Wire App select info**

Modify `src/App.svelte` imports:

```ts
  import { projectStageSelectInfo, projectWorldSelectInfo } from './application/select/selectInfoPresenter'
```

Add derived state after `stageProgressionOptions`:

```ts
  const worldSelectInfo = $derived(
    projectWorldSelectInfo(projectData.worlds, stageProgressionOptions),
  )
  const stageSelectInfo = $derived(
    appState.screen.type === 'stage-select'
      ? projectStageSelectInfo(
          projectData.worlds,
          projectData.stages,
          appState.screen.worldId,
          stageProgressionOptions,
        )
      : undefined,
  )
```

Pass props:

```svelte
      <WorldSelectScreen
        catalog={projectData.worlds}
        localizeData={projectData.localize}
        locale={locale}
        selectedWorldIndex={appState.screen.selectedWorldIndex}
        selectInfo={worldSelectInfo}
        onControlIntent={handleControlIntent}
        onSelectWorld={handleSelectWorld}
        onConfirmWorld={handleConfirmWorld}
        onBack={handleBackFromWorldSelect}
      />
```

```svelte
      <StageSelectScreen
        worlds={projectData.worlds}
        stages={projectData.stages}
        localizeData={projectData.localize}
        locale={locale}
        selectedWorldIndex={appState.screen.selectedWorldIndex}
        selectedStageIndex={appState.screen.selectedStageIndex}
        {characterInfo}
        selectInfo={stageSelectInfo}
        stageProgressionOptions={stageProgressionOptions}
        onControlIntent={handleControlIntent}
        onSelectStage={handleSelectStage}
        onConfirmStage={handleConfirmStage}
        onBack={handleBackFromStageSelect}
      />
```

Keep `stageProgressionOptions` temporarily for Task 4, then remove it from `StageSelectScreen` after Stage Select consumes `selectInfo`.

- [ ] **Step 4: Run App wiring tests to verify GREEN**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: PASS.

---

### Task 3: World Select Progress Rendering

**Files:**
- Modify: `src/ui/world/WorldSelectScreen.svelte`
- Create: `src/ui/world/worldSelectInfo.test.ts`

- [ ] **Step 1: Write failing World Select UI tests**

Create `src/ui/world/worldSelectInfo.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import source from './WorldSelectScreen.svelte?raw'

describe('World Select info rendering', () => {
  it('receives projected world select info', () => {
    expect(source).toContain("import type { WorldSelectInfoViewModel } from '../../application/select/selectInfoPresenter'")
    expect(source).toContain('selectInfo: WorldSelectInfoViewModel')
    expect(source).toContain('const selectedWorldInfo = $derived(')
  })

  it('renders chapter progress from select info instead of hard-coded zeroes', () => {
    expect(source).toContain('selectedWorldInfo.clearedStageCount')
    expect(source).toContain('selectedWorldInfo.stageCount')
    expect(source).toContain('selectedWorldInfo.progressPercent')
    expect(source).not.toContain('<b>0<small> / {selectedWorld.stageCount}</small></b>')
    expect(source).not.toContain('style="width: 0%"')
  })
})
```

- [ ] **Step 2: Run World Select UI tests to verify RED**

Run:

```bash
npm run test -- src/ui/world/worldSelectInfo.test.ts
```

Expected: FAIL because `WorldSelectScreen.svelte` does not receive `selectInfo`.

- [ ] **Step 3: Render projected progress in World Select**

Modify `src/ui/world/WorldSelectScreen.svelte`:

```ts
  import type { WorldSelectInfoViewModel } from '../../application/select/selectInfoPresenter'
```

Add prop:

```ts
    selectInfo: WorldSelectInfoViewModel
```

Destructure prop:

```ts
    selectInfo,
```

Add derived selected info:

```ts
  const selectedWorldInfo = $derived(selectInfo.worlds[selectedWorldIndex] ?? selectInfo.worlds[0])
```

Replace progress markup:

```svelte
        <b>{selectedWorldInfo.clearedStageCount}<small> / {selectedWorldInfo.stageCount}</small></b>
```

```svelte
        <span style={`width: ${selectedWorldInfo.progressPercent}%`}></span>
```

- [ ] **Step 4: Run World Select UI tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/world/worldSelectInfo.test.ts
```

Expected: PASS.

---

### Task 4: Stage Select Info Rendering

**Files:**
- Modify: `src/ui/stage/StageSelectScreen.svelte`
- Modify: `src/ui/stage/stageSelectLocalization.test.ts`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write failing Stage Select UI tests**

Modify the `receives stage progression option states from App` test in `src/ui/stage/stageSelectLocalization.test.ts` to:

```ts
  it('receives prepared stage select info from App', () => {
    expect(stageSelectSource).toContain("import type { StageSelectInfoViewModel } from '../../application/select/selectInfoPresenter'")
    expect(stageSelectSource).toContain('selectInfo?: StageSelectInfoViewModel')
    expect(stageSelectSource).toContain('const selectedStageInfo = $derived(')
    expect(stageSelectSource).not.toContain('stageProgressionOptions')
    expect(stageSelectSource).not.toContain('progressionByStageId')
    expect(stageSelectSource).not.toContain('function stageProgression')
  })
```

Update later Stage Select tests to expect info-based reads:

```ts
    expect(stageSelectSource).toContain('{#if !selectedStageInfo.unlocked}')
```

```ts
    expect(stageSelectSource).toContain('class:locked={!stageInfo.unlocked}')
    expect(stageSelectSource).toContain('class:cleared={stageInfo.cleared}')
```

```ts
    expect(stageSelectSource).toContain('if (!stageInfo.unlocked) return')
    expect(stageSelectSource).toContain('disabled={!selectedStageInfo.unlocked || confirming}')
    expect(stageSelectSource).toContain('handleConfirmStage(selectedStageInfo)')
    expect(stageSelectSource).toContain('handleConfirmStage(stageInfo)')
```

```ts
    expect(stageSelectSource).toContain('selectedStageInfo.record?.maxCoins ?? 0')
    expect(stageSelectSource).toContain(
      'selectedStageInfo.record?.bestTime ?? text(stageSelectRefs.recordUnavailable)',
    )
    expect(stageSelectSource).toContain(
      'selectedStageInfo.record?.bestRank ?? text(stageSelectRefs.recordUnavailable)',
    )
```

- [ ] **Step 2: Run Stage Select UI tests to verify RED**

Run:

```bash
npm run test -- src/ui/stage/stageSelectLocalization.test.ts
```

Expected: FAIL because Stage Select still rebuilds progression lookup internally.

- [ ] **Step 3: Refactor Stage Select to consume prepared info**

Modify `src/ui/stage/StageSelectScreen.svelte`:

```ts
  import type { StageSelectInfoViewModel, StageSelectStageInfo } from '../../application/select/selectInfoPresenter'
```

Remove:

```ts
  import type { StageProgressionOptionState } from '../../domain/progression/stageProgression'
```

Change props:

```ts
    selectInfo?: StageSelectInfoViewModel
```

Remove:

```ts
    stageProgressionOptions: receivedStageProgressionOptions = [],
```

Replace derived stage data:

```ts
  const fallbackStageInfos = $derived(
    selectedWorld.stageIds.map((stageId) => ({
      stage: stages.items[stageId],
      unlocked: false,
      cleared: false,
      record: undefined,
    }) satisfies StageSelectStageInfo),
  )
  const stageInfos = $derived(selectInfo?.stages ?? fallbackStageInfos)
  const stageOptions = $derived(stageInfos.map((stageInfo) => stageInfo.stage))
  const selectedStageInfo = $derived(stageInfos[selectedStageIndex] ?? stageInfos[0])
  const selectedStage = $derived(selectedStageInfo.stage)
```

Remove `progressionByStageId`, `selectedStageProgression`, and `stageProgression`.

Change `handleConfirmStage`:

```ts
  function handleConfirmStage(stageInfo: StageSelectStageInfo) {
    if (!stageInfo.unlocked) return
    confirming = true
    onConfirmStage()
    if (confirmResetTimer) window.clearTimeout(confirmResetTimer)
    confirmResetTimer = window.setTimeout(() => {
      confirming = false
      confirmResetTimer = undefined
    }, 220)
  }
```

Update markup references:

```svelte
        {#if !selectedStageInfo.unlocked}
```

```svelte
      {selectedStageInfo.unlocked ? stageObjective(selectedStage) : text('common.locked')}
```

```svelte
      <b>{selectedStageInfo.record?.maxCoins ?? 0} <small>/ {selectedStage.collectibleCount}</small></b>
```

```svelte
        <b>{selectedStageInfo.record?.bestTime ?? text(stageSelectRefs.recordUnavailable)}</b>
```

```svelte
        <b>{selectedStageInfo.record?.bestRank ?? text(stageSelectRefs.recordUnavailable)}</b>
```

```svelte
      disabled={!selectedStageInfo.unlocked || confirming}
      onclick={() => handleConfirmStage(selectedStageInfo)}
```

Change stage map loop:

```svelte
      {#each stageInfos.slice(0, -1) as stageInfo, index}
        {@const stage = stageInfo.stage}
```

Change node loop:

```svelte
    {#each stageInfos as stageInfo, index}
      {@const stage = stageInfo.stage}
```

Use `stageInfo` for locked, cleared, label, and double-click:

```svelte
        class:locked={!stageInfo.unlocked}
        class:cleared={stageInfo.cleared}
```

```svelte
        <b>{stageInfo.unlocked ? stage.id : '◆'}</b>
```

```svelte
          handleConfirmStage(stageInfo)
```

Modify `src/App.svelte` Stage Select props to remove `stageProgressionOptions={stageProgressionOptions}` after Stage Select no longer accepts it.

- [ ] **Step 4: Run Stage Select and App wiring tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/stage/stageSelectLocalization.test.ts src/application/progression/appStageProgressionWiring.test.ts
```

Expected: PASS.

---

### Task 5: Focused And Full Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- src/application/select/selectInfoPresenter.test.ts src/ui/world/worldSelectInfo.test.ts src/ui/stage/stageSelectLocalization.test.ts src/application/progression/appStageProgressionWiring.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run whitespace sanity**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 6: Review git diff**

Run:

```bash
git diff --stat
git diff -- docs/superpowers/specs/2026-08-13-select-info-update-design.md docs/superpowers/plans/2026-08-13-select-info-update.md src/application/select/selectInfoPresenter.ts src/application/select/selectInfoPresenter.test.ts src/App.svelte src/application/progression/appStageProgressionWiring.test.ts src/ui/world/WorldSelectScreen.svelte src/ui/world/worldSelectInfo.test.ts src/ui/stage/StageSelectScreen.svelte src/ui/stage/stageSelectLocalization.test.ts
```

Expected: changes match this plan; untracked `pnpm-lock.yaml` remains unrelated and unstaged.

- [ ] **Step 7: Commit implementation**

Run:

```bash
git add docs/superpowers/plans/2026-08-13-select-info-update.md src/application/select/selectInfoPresenter.ts src/application/select/selectInfoPresenter.test.ts src/App.svelte src/application/progression/appStageProgressionWiring.test.ts src/ui/world/WorldSelectScreen.svelte src/ui/world/worldSelectInfo.test.ts src/ui/stage/StageSelectScreen.svelte src/ui/stage/stageSelectLocalization.test.ts
git commit -m "fix: update select info from progression"
```

Expected: commit succeeds. Do not stage `pnpm-lock.yaml`.
