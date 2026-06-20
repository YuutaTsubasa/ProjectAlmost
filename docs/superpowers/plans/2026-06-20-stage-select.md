# Stage Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static selectable Stage Select page after World Select with first-class stage data, localization, input, BGM, and UI SFX wiring.

**Architecture:** Add pure stage catalog data under `src/domain/data/stages/`, extend pure app flow with a `stage-select` screen, and route controls/audio through existing application services. Add a Svelte `StageSelectScreen` that renders prototype-style map nodes and detail panel from localized domain data.

**Tech Stack:** TypeScript, Svelte 5 runes, Vitest, Vite, existing project data/localization/audio/input modules.

---

## File Structure

- Create `src/domain/data/stages/stageTypes.ts`: shared `StageData`, `StageCatalog`, and `StageNodePosition` types.
- Create `src/domain/data/stages/stageCatalog.ts`: deterministic 36-stage catalog with node positions and asset refs.
- Create `src/domain/data/stages/stageCatalog.test.ts`: catalog integrity and localization reference tests.
- Modify `src/domain/data/projectData.ts` and `src/domain/data/projectData.test.ts`: expose `stages`.
- Modify `src/domain/data/localize/localize.ts` and `src/domain/data/localize/localize.test.ts`: add Stage Select UI keys and stage text keys for all supported locales.
- Modify `src/domain/app/appFlow.ts` and `src/domain/app/appFlow.test.ts`: add `stage-select` state and pure transition helpers.
- Modify `src/domain/input/controlIntents.ts` and `src/domain/input/controlIntents.test.ts`: add `stage-select` context mappings.
- Modify `src/application/input/appControls.ts` and `src/application/input/appControls.test.ts`: route Stage Select intents.
- Modify `src/domain/audio/audioPolicy.ts` and `src/domain/audio/audioPolicy.test.ts`: map Stage Select to selected world BGM.
- Modify `src/application/audio/audioEvents.ts` and `src/application/audio/audioEvents.test.ts`: detect Stage Select movement SFX.
- Create `src/ui/stage/StageSelectScreen.svelte`: prototype-style reactive UI.
- Modify `src/App.svelte`: render Stage Select and bridge pointer callbacks to app state, music, and SFX.
- Modify `src/app.css`: add Stage Select styles adapted from `__prototype__/src/app.css`.

## Task 1: Stage Catalog And Project Data

**Files:**
- Create: `src/domain/data/stages/stageTypes.ts`
- Create: `src/domain/data/stages/stageCatalog.ts`
- Create: `src/domain/data/stages/stageCatalog.test.ts`
- Modify: `src/domain/data/projectData.ts`
- Modify: `src/domain/data/projectData.test.ts`
- Modify: `src/domain/data/localize/localize.ts`
- Modify: `src/domain/data/localize/localize.test.ts`

- [ ] **Step 1: Write failing catalog and project data tests**

Add `src/domain/data/stages/stageCatalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { localize, resolveLocalizedText } from '../localize/localize'
import { worlds } from '../worlds/worldCatalog'
import { stages } from './stageCatalog'

describe('stages', () => {
  it('orders all 36 campaign stages by world and stage number', () => {
    expect(stages.order).toHaveLength(36)
    expect(stages.order.slice(0, 6)).toEqual(['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'])
    expect(stages.order.slice(-6)).toEqual(['6-1', '6-2', '6-3', '6-4', '6-5', '6-6'])
  })

  it('indexes every stage by stable id with UI-ready metadata', () => {
    expect(stages.items['1-1']).toEqual({
      id: '1-1',
      worldId: 'world01',
      number: 1,
      titleRef: 'stages.1-1.title',
      subtitleRef: 'stages.1-1.subtitle',
      objectiveRef: 'stageObjectives.reachGoal',
      collectibleCount: 24,
      nodePosition: { x: 34, y: 82 },
      previewAssetRef: '/assets/maps/white_palace_stage_select.webp',
      isBoss: false,
    })
    expect(stages.items['1-6']).toMatchObject({
      id: '1-6',
      worldId: 'world01',
      number: 6,
      objectiveRef: 'stageObjectives.defeatBoss',
      isBoss: true,
    })
    expect(stages.items['6-6']).toMatchObject({
      id: '6-6',
      worldId: 'world06',
      number: 6,
      objectiveRef: 'stageObjectives.defeatBoss',
      isBoss: true,
    })
  })

  it('keeps world stage ids backed by the stage catalog', () => {
    for (const worldId of worlds.order) {
      const world = worlds.items[worldId]
      expect(world.stageIds.map((stageId) => stages.items[stageId]?.worldId)).toEqual(
        world.stageIds.map(() => worldId),
      )
    }
  })

  it('keeps node positions inside the map percentage coordinate space', () => {
    for (const stageId of stages.order) {
      const { nodePosition } = stages.items[stageId]
      expect(nodePosition.x).toBeGreaterThanOrEqual(0)
      expect(nodePosition.x).toBeLessThanOrEqual(100)
      expect(nodePosition.y).toBeGreaterThanOrEqual(0)
      expect(nodePosition.y).toBeLessThanOrEqual(100)
    }
  })

  it('uses localization refs that resolve for every supported locale', () => {
    for (const locale of localize.languages.map((language) => language.code)) {
      expect(resolveLocalizedText(localize, locale, 'stageSelect.title')).toBeTruthy()
      expect(resolveLocalizedText(localize, locale, 'stageSelect.deploy')).toBeTruthy()
      expect(resolveLocalizedText(localize, locale, 'stageObjectives.reachGoal')).toBeTruthy()
      expect(resolveLocalizedText(localize, locale, 'stageObjectives.defeatBoss')).toBeTruthy()

      for (const stageId of stages.order) {
        const stage = stages.items[stageId]
        expect(resolveLocalizedText(localize, locale, stage.titleRef)).toBeTruthy()
        expect(resolveLocalizedText(localize, locale, stage.subtitleRef)).toBeTruthy()
        expect(resolveLocalizedText(localize, locale, stage.objectiveRef)).toBeTruthy()
      }
    }
  })
})
```

Update `src/domain/data/projectData.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { localize } from './localize/localize'
import { projectData } from './projectData'
import { stages } from './stages/stageCatalog'
import { worlds } from './worlds/worldCatalog'

describe('projectData', () => {
  it('exposes exactly the current project data categories', () => {
    expect(Object.keys(projectData).sort()).toEqual(['localize', 'stages', 'worlds'])
  })

  it('uses the localization category as the project localization source', () => {
    expect(projectData.localize).toBe(localize)
  })

  it('uses the world catalog as the project worlds source', () => {
    expect(projectData.worlds).toBe(worlds)
  })

  it('uses the stage catalog as the project stages source', () => {
    expect(projectData.stages).toBe(stages)
  })
})
```

Append this focused test to `src/domain/data/localize/localize.test.ts`:

```ts
it('includes localized stage select labels and objective values for every supported locale', () => {
  const expectedByLocale = {
    en: {
      title: 'Stage Select',
      objective: 'Objective',
      collectibles: 'Collectibles',
      bestTime: 'Best Time',
      rank: 'Rank',
      activeCharacter: 'Active Character',
      deploy: 'Deploy',
      recordUnavailable: '--',
      reachGoal: 'Reach the goal',
      defeatBoss: 'Defeat the boss',
    },
    ja: {
      title: 'ステージ選択',
      objective: '目標',
      collectibles: '収集',
      bestTime: 'ベストタイム',
      rank: 'ランク',
      activeCharacter: '出撃キャラクター',
      deploy: '出撃',
      recordUnavailable: '--',
      reachGoal: 'ゴールに到達',
      defeatBoss: 'ボスを倒す',
    },
    zhHant: {
      title: '關卡選擇',
      objective: '目標',
      collectibles: '收集品',
      bestTime: '最佳時間',
      rank: '評級',
      activeCharacter: '出擊角色',
      deploy: '出擊',
      recordUnavailable: '--',
      reachGoal: '抵達終點',
      defeatBoss: '擊敗首領',
    },
    ko: {
      title: '스테이지 선택',
      objective: '목표',
      collectibles: '수집품',
      bestTime: '최고 기록',
      rank: '랭크',
      activeCharacter: '출격 캐릭터',
      deploy: '출격',
      recordUnavailable: '--',
      reachGoal: '목표 지점에 도달',
      defeatBoss: '보스 처치',
    },
  } as const

  for (const locale of localize.languages.map((language) => language.code)) {
    expect(resolveLocalizedText(localize, locale, 'stageSelect.title')).toBe(expectedByLocale[locale].title)
    expect(resolveLocalizedText(localize, locale, 'stageSelect.objective')).toBe(expectedByLocale[locale].objective)
    expect(resolveLocalizedText(localize, locale, 'stageSelect.collectibles')).toBe(expectedByLocale[locale].collectibles)
    expect(resolveLocalizedText(localize, locale, 'stageSelect.bestTime')).toBe(expectedByLocale[locale].bestTime)
    expect(resolveLocalizedText(localize, locale, 'stageSelect.rank')).toBe(expectedByLocale[locale].rank)
    expect(resolveLocalizedText(localize, locale, 'stageSelect.activeCharacter')).toBe(expectedByLocale[locale].activeCharacter)
    expect(resolveLocalizedText(localize, locale, 'stageSelect.deploy')).toBe(expectedByLocale[locale].deploy)
    expect(resolveLocalizedText(localize, locale, 'stageSelect.recordUnavailable')).toBe(expectedByLocale[locale].recordUnavailable)
    expect(resolveLocalizedText(localize, locale, 'stageObjectives.reachGoal')).toBe(expectedByLocale[locale].reachGoal)
    expect(resolveLocalizedText(localize, locale, 'stageObjectives.defeatBoss')).toBe(expectedByLocale[locale].defeatBoss)
  }
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/data/stages/stageCatalog.test.ts src/domain/data/projectData.test.ts src/domain/data/localize/localize.test.ts
```

Expected: FAIL because `./stageCatalog` does not exist, `projectData.stages` does not exist, and Stage Select localization keys are not defined.

- [ ] **Step 3: Implement stage catalog types and data**

Create `src/domain/data/stages/stageTypes.ts`:

```ts
import type { LocalizationKey } from '../localize/localize'
import type { StageId, WorldId } from '../worlds/worldTypes'

export type StageNodePosition = {
  x: number
  y: number
}

export interface StageData {
  id: StageId
  worldId: WorldId
  number: 1 | 2 | 3 | 4 | 5 | 6
  titleRef: LocalizationKey
  subtitleRef: LocalizationKey
  objectiveRef: LocalizationKey
  collectibleCount: number
  nodePosition: StageNodePosition
  previewAssetRef: string
  isBoss: boolean
}

export interface StageCatalog {
  order: readonly StageId[]
  items: Record<StageId, StageData>
}
```

Create `src/domain/data/stages/stageCatalog.ts`:

```ts
import type { StageCatalog, StageData, StageNodePosition } from './stageTypes'
import type { StageId, WorldId } from '../worlds/worldTypes'

type StageSeed = {
  worldId: WorldId
  background: string
  positions: readonly StageNodePosition[]
  coins: readonly [number, number, number, number, number, number]
}

const seeds: Record<WorldId, StageSeed> = {
  world01: {
    worldId: 'world01',
    background: '/assets/maps/white_palace_stage_select.webp',
    positions: [
      { x: 34, y: 82 },
      { x: 81, y: 86 },
      { x: 74, y: 50 },
      { x: 55, y: 39 },
      { x: 70, y: 27 },
      { x: 73, y: 6 },
    ],
    coins: [24, 28, 30, 32, 34, 12],
  },
  world02: {
    worldId: 'world02',
    background: '/assets/maps/emerald_sanctuary_stage_select.webp',
    positions: [
      { x: 31, y: 67 },
      { x: 45, y: 58 },
      { x: 58, y: 42 },
      { x: 70, y: 50 },
      { x: 82, y: 32 },
      { x: 91, y: 18 },
    ],
    coins: [26, 30, 32, 34, 36, 14],
  },
  world03: {
    worldId: 'world03',
    background: '/assets/maps/cerulean_depths_stage_select.webp',
    positions: [
      { x: 30, y: 72 },
      { x: 44, y: 56 },
      { x: 58, y: 66 },
      { x: 70, y: 42 },
      { x: 82, y: 28 },
      { x: 91, y: 16 },
    ],
    coins: [26, 28, 34, 36, 38, 14],
  },
  world04: {
    worldId: 'world04',
    background: '/assets/maps/frostveil_peaks_stage_select.webp',
    positions: [
      { x: 29, y: 70 },
      { x: 42, y: 58 },
      { x: 56, y: 44 },
      { x: 70, y: 55 },
      { x: 83, y: 34 },
      { x: 91, y: 18 },
    ],
    coins: [28, 30, 34, 36, 40, 16],
  },
  world05: {
    worldId: 'world05',
    background: '/assets/maps/emberfall_caldera_stage_select.webp',
    positions: [
      { x: 28, y: 72 },
      { x: 43, y: 57 },
      { x: 58, y: 67 },
      { x: 71, y: 45 },
      { x: 82, y: 30 },
      { x: 91, y: 16 },
    ],
    coins: [30, 32, 36, 38, 42, 16],
  },
  world06: {
    worldId: 'world06',
    background: '/assets/maps/abyssal_hollow_stage_select.webp',
    positions: [
      { x: 30, y: 74 },
      { x: 45, y: 60 },
      { x: 58, y: 43 },
      { x: 72, y: 56 },
      { x: 83, y: 32 },
      { x: 91, y: 15 },
    ],
    coins: [32, 34, 38, 40, 44, 18],
  },
}

const worldIds = ['world01', 'world02', 'world03', 'world04', 'world05', 'world06'] as const

function createStage(worldId: WorldId, worldNumber: 1 | 2 | 3 | 4 | 5 | 6, stageNumber: 1 | 2 | 3 | 4 | 5 | 6): StageData {
  const seed = seeds[worldId]
  const id = `${worldNumber}-${stageNumber}` as StageId
  const isBoss = stageNumber === 6

  return {
    id,
    worldId,
    number: stageNumber,
    titleRef: `stages.${id}.title`,
    subtitleRef: `stages.${id}.subtitle`,
    objectiveRef: isBoss ? 'stageObjectives.defeatBoss' : 'stageObjectives.reachGoal',
    collectibleCount: seed.coins[stageNumber - 1],
    nodePosition: seed.positions[stageNumber - 1],
    previewAssetRef: seed.background,
    isBoss,
  }
}

const orderedStages = worldIds.flatMap((worldId, worldIndex) =>
  ([1, 2, 3, 4, 5, 6] as const).map((stageNumber) =>
    createStage(worldId, (worldIndex + 1) as 1 | 2 | 3 | 4 | 5 | 6, stageNumber),
  ),
)

export const stages: StageCatalog = {
  order: orderedStages.map((stage) => stage.id),
  items: Object.fromEntries(orderedStages.map((stage) => [stage.id, stage])) as Record<StageId, StageData>,
}
```

- [ ] **Step 4: Implement project data export**

Update `src/domain/data/projectData.ts`:

```ts
import { localize } from './localize/localize'
import { stages } from './stages/stageCatalog'
import { worlds } from './worlds/worldCatalog'

export const projectData = {
  localize,
  stages,
  worlds,
}
```

- [ ] **Step 5: Implement localization types and catalog values**

In `src/domain/data/localize/localize.ts`, add these key types:

```ts
export type StageSelectLocalizationKey =
  | 'stageSelect.title'
  | 'stageSelect.objective'
  | 'stageSelect.collectibles'
  | 'stageSelect.bestTime'
  | 'stageSelect.rank'
  | 'stageSelect.activeCharacter'
  | 'stageSelect.deploy'
  | 'stageSelect.recordUnavailable'
  | 'stageSelect.aria.screen'
  | 'stageSelect.aria.map'

export type StageObjectiveLocalizationKey = 'stageObjectives.reachGoal' | 'stageObjectives.defeatBoss'

export type StageLocalizationKey =
  `stages.${1 | 2 | 3 | 4 | 5 | 6}-${1 | 2 | 3 | 4 | 5 | 6}.${'title' | 'subtitle'}`
```

Include those in `LocalizationKey`:

```ts
export type LocalizationKey =
  | WorldLocalizationKey
  | StageSelectLocalizationKey
  | StageObjectiveLocalizationKey
  | StageLocalizationKey
  | TitleLocalizationKey
  | CommonLocalizationKey
  | LanguageLocalizationKey
  | SettingsLocalizationKey
```

Add `stageSelect` references to `LocalizeData.references`:

```ts
export interface StageSelectLocalizationReferences {
  title: StageSelectLocalizationKey
  objective: StageSelectLocalizationKey
  collectibles: StageSelectLocalizationKey
  bestTime: StageSelectLocalizationKey
  rank: StageSelectLocalizationKey
  activeCharacter: StageSelectLocalizationKey
  deploy: StageSelectLocalizationKey
  recordUnavailable: StageSelectLocalizationKey
  ariaScreen: StageSelectLocalizationKey
  ariaMap: StageSelectLocalizationKey
}
```

Add this constant near `title`:

```ts
const stageSelect: StageSelectLocalizationReferences = {
  title: 'stageSelect.title',
  objective: 'stageSelect.objective',
  collectibles: 'stageSelect.collectibles',
  bestTime: 'stageSelect.bestTime',
  rank: 'stageSelect.rank',
  activeCharacter: 'stageSelect.activeCharacter',
  deploy: 'stageSelect.deploy',
  recordUnavailable: 'stageSelect.recordUnavailable',
  ariaScreen: 'stageSelect.aria.screen',
  ariaMap: 'stageSelect.aria.map',
}
```

Add `stageSelect` to `references`:

```ts
references: {
  title: TitleLocalizationReferences
  stageSelect: StageSelectLocalizationReferences
  worlds: WorldLocalizationReferenceGroup
}
```

Add the catalog entries for each locale. For stage text, use these English values and translate them concisely for `ja`, `zhHant`, and `ko`:

```ts
'stageSelect.title': 'Stage Select',
'stageSelect.objective': 'Objective',
'stageSelect.collectibles': 'Collectibles',
'stageSelect.bestTime': 'Best Time',
'stageSelect.rank': 'Rank',
'stageSelect.activeCharacter': 'Active Character',
'stageSelect.deploy': 'Deploy',
'stageSelect.recordUnavailable': '--',
'stageSelect.aria.screen': 'Stage Select screen',
'stageSelect.aria.map': 'Stage route map',
'stageObjectives.reachGoal': 'Reach the goal',
'stageObjectives.defeatBoss': 'Defeat the boss',
'stages.1-1.title': 'White Palace 1-1',
'stages.1-1.subtitle': 'Cloud Gate Approach',
'stages.1-2.title': 'White Palace 1-2',
'stages.1-2.subtitle': 'Sunlit Arcade',
'stages.1-3.title': 'White Palace 1-3',
'stages.1-3.subtitle': 'Mirror Terrace',
'stages.1-4.title': 'White Palace 1-4',
'stages.1-4.subtitle': 'Ivory Liftworks',
'stages.1-5.title': 'White Palace 1-5',
'stages.1-5.subtitle': 'Crown Spire',
'stages.1-6.title': 'White Palace 1-6',
'stages.1-6.subtitle': 'Priestess Arena',
'stages.2-1.title': 'Emerald Sanctuary 2-1',
'stages.2-1.subtitle': 'Root Gate',
'stages.2-2.title': 'Emerald Sanctuary 2-2',
'stages.2-2.subtitle': 'Moss Reliquary',
'stages.2-3.title': 'Emerald Sanctuary 2-3',
'stages.2-3.subtitle': 'Canopy Crossing',
'stages.2-4.title': 'Emerald Sanctuary 2-4',
'stages.2-4.subtitle': 'Ancient Greenhouse',
'stages.2-5.title': 'Emerald Sanctuary 2-5',
'stages.2-5.subtitle': 'Vine Observatory',
'stages.2-6.title': 'Emerald Sanctuary 2-6',
'stages.2-6.subtitle': 'Forest Core',
'stages.3-1.title': 'Cerulean Depths 3-1',
'stages.3-1.subtitle': 'Tidefall Entry',
'stages.3-2.title': 'Cerulean Depths 3-2',
'stages.3-2.subtitle': 'Coral Causeway',
'stages.3-3.title': 'Cerulean Depths 3-3',
'stages.3-3.subtitle': 'Sunken Gallery',
'stages.3-4.title': 'Cerulean Depths 3-4',
'stages.3-4.subtitle': 'Pressure Locks',
'stages.3-5.title': 'Cerulean Depths 3-5',
'stages.3-5.subtitle': 'Abyss Window',
'stages.3-6.title': 'Cerulean Depths 3-6',
'stages.3-6.subtitle': 'Leviathan Chamber',
'stages.4-1.title': 'Frostveil Peaks 4-1',
'stages.4-1.subtitle': 'Snowline Gate',
'stages.4-2.title': 'Frostveil Peaks 4-2',
'stages.4-2.subtitle': 'Glacier Steps',
'stages.4-3.title': 'Frostveil Peaks 4-3',
'stages.4-3.subtitle': 'Crystal Rampart',
'stages.4-4.title': 'Frostveil Peaks 4-4',
'stages.4-4.subtitle': 'Storm Bridge',
'stages.4-5.title': 'Frostveil Peaks 4-5',
'stages.4-5.subtitle': 'Frozen Keep',
'stages.4-6.title': 'Frostveil Peaks 4-6',
'stages.4-6.subtitle': 'Whiteout Throne',
'stages.5-1.title': 'Emberfall Caldera 5-1',
'stages.5-1.subtitle': 'Ashen Gate',
'stages.5-2.title': 'Emberfall Caldera 5-2',
'stages.5-2.subtitle': 'Magma Conduit',
'stages.5-3.title': 'Emberfall Caldera 5-3',
'stages.5-3.subtitle': 'Forge Ruins',
'stages.5-4.title': 'Emberfall Caldera 5-4',
'stages.5-4.subtitle': 'Cinder Elevator',
'stages.5-5.title': 'Emberfall Caldera 5-5',
'stages.5-5.subtitle': 'Core Crucible',
'stages.5-6.title': 'Emberfall Caldera 5-6',
'stages.5-6.subtitle': 'Inferno Heart',
'stages.6-1.title': 'Abyssal Hollow 6-1',
'stages.6-1.subtitle': 'Hollow Descent',
'stages.6-2.title': 'Abyssal Hollow 6-2',
'stages.6-2.subtitle': 'Silent Maw',
'stages.6-3.title': 'Abyssal Hollow 6-3',
'stages.6-3.subtitle': 'Umbral Stair',
'stages.6-4.title': 'Abyssal Hollow 6-4',
'stages.6-4.subtitle': 'Demon Archives',
'stages.6-5.title': 'Abyssal Hollow 6-5',
'stages.6-5.subtitle': 'Last Seal',
'stages.6-6.title': 'Abyssal Hollow 6-6',
'stages.6-6.subtitle': 'Abyss Throne',
```

- [ ] **Step 6: Run tests to verify catalog slice passes**

Run:

```bash
npm run test -- src/domain/data/stages/stageCatalog.test.ts src/domain/data/projectData.test.ts src/domain/data/localize/localize.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/domain/data/stages src/domain/data/projectData.ts src/domain/data/projectData.test.ts src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts
git commit -m "feat: add stage catalog data"
```

## Task 2: App Flow State And Transitions

**Files:**
- Modify: `src/domain/app/appFlow.ts`
- Modify: `src/domain/app/appFlow.test.ts`

- [ ] **Step 1: Write failing app-flow tests**

Update imports in `src/domain/app/appFlow.test.ts`:

```ts
import {
  activateTitleMenuItem,
  backFromSettings,
  backFromStageSelect,
  backFromWorldSelect,
  cancelDeleteConfirm,
  confirmSelectedStage,
  confirmSelectedWorld,
  createInitialAppState,
  moveSettingsDeleteConfirmSelection,
  moveSettingsScreenSelection,
  moveStageSelection,
  moveTitleMenuSelection,
  moveWorldSelection,
  openSettingsDeleteConfirm,
  openTitleMenu,
  selectStage,
  selectTitleMenuItem,
  selectWorld,
} from './appFlow'
```

Replace the existing `confirmSelectedWorld` describe block with:

```ts
describe('confirmSelectedWorld', () => {
  it('opens stage select for the selected world with the first stage selected', () => {
    const state = { screen: { type: 'world-select', selectedWorldIndex: 2 } } as const

    expect(confirmSelectedWorld(state)).toEqual({
      screen: {
        type: 'stage-select',
        selectedWorldIndex: 2,
        worldId: 'world03',
        selectedStageIndex: 0,
      },
    })
  })

  it('does not change state outside world select', () => {
    const state = createInitialAppState()

    expect(confirmSelectedWorld(state)).toBe(state)
  })
})
```

Append:

```ts
describe('moveStageSelection', () => {
  it('wraps selection forward through stages in the selected world', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 5 },
    } as const

    expect(moveStageSelection(state, 1)).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 0 },
    })
  })

  it('wraps selection backward through stages in the selected world', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 0 },
    } as const

    expect(moveStageSelection(state, -1)).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 5 },
    })
  })

  it('does not move stage selection outside stage select', () => {
    const state = createInitialAppState()

    expect(moveStageSelection(state, 1)).toBe(state)
  })
})

describe('selectStage', () => {
  it('selects a stage directly while preserving the selected world', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 4, worldId: 'world05', selectedStageIndex: 0 },
    } as const

    expect(selectStage(state, 3)).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 4, worldId: 'world05', selectedStageIndex: 3 },
    })
  })

  it('does not select a stage outside stage select', () => {
    const state = createInitialAppState()

    expect(selectStage(state, 3)).toBe(state)
  })
})

describe('confirmSelectedStage', () => {
  it('preserves selected stage until gameplay entry exists', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 1, worldId: 'world02', selectedStageIndex: 4 },
    } as const

    expect(confirmSelectedStage(state)).toBe(state)
  })
})

describe('backFromStageSelect', () => {
  it('returns to world select with the originating world selected', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 3, worldId: 'world04', selectedStageIndex: 2 },
    } as const

    expect(backFromStageSelect(state)).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 3 },
    })
  })

  it('does not change state outside stage select', () => {
    const state = createInitialAppState()

    expect(backFromStageSelect(state)).toBe(state)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts
```

Expected: FAIL because Stage Select transition helpers do not exist and `confirmSelectedWorld` is still a no-op.

- [ ] **Step 3: Implement app-flow transitions**

In `src/domain/app/appFlow.ts`, import `WorldId`:

```ts
import type { WorldId } from '../data/worlds/worldTypes'
```

Add:

```ts
export type StageSelectScreen = {
  type: 'stage-select'
  selectedWorldIndex: number
  worldId: WorldId
  selectedStageIndex: number
}
```

Update `AppScreen`:

```ts
export type AppScreen =
  | { type: 'title-intro' }
  | TitleMenuScreen
  | WorldSelectScreen
  | StageSelectScreen
  | SettingsScreen
```

Add constants:

```ts
const WORLD_IDS = ['world01', 'world02', 'world03', 'world04', 'world05', 'world06'] as const
const STAGES_PER_WORLD = 6
```

Replace `confirmSelectedWorld`:

```ts
export function confirmSelectedWorld(state: AppState): AppState {
  if (state.screen.type !== 'world-select') return state

  return {
    screen: {
      type: 'stage-select',
      selectedWorldIndex: state.screen.selectedWorldIndex,
      worldId: WORLD_IDS[state.screen.selectedWorldIndex] ?? 'world01',
      selectedStageIndex: 0,
    },
  }
}
```

Add:

```ts
export function moveStageSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'stage-select') return state

  const selectedStageIndex = (state.screen.selectedStageIndex + direction + STAGES_PER_WORLD) % STAGES_PER_WORLD

  return {
    screen: { ...state.screen, selectedStageIndex },
  }
}

export function selectStage(state: AppState, selectedStageIndex: number): AppState {
  if (state.screen.type !== 'stage-select') return state

  return {
    screen: { ...state.screen, selectedStageIndex },
  }
}

export function confirmSelectedStage(state: AppState): AppState {
  if (state.screen.type !== 'stage-select') return state

  return state
}

export function backFromStageSelect(state: AppState): AppState {
  if (state.screen.type !== 'stage-select') return state

  return {
    screen: { type: 'world-select', selectedWorldIndex: state.screen.selectedWorldIndex },
  }
}
```

- [ ] **Step 4: Run app-flow tests**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/app/appFlow.ts src/domain/app/appFlow.test.ts
git commit -m "feat: add stage select app flow"
```

## Task 3: Input And Application Control Routing

**Files:**
- Modify: `src/domain/input/controlIntents.ts`
- Modify: `src/domain/input/controlIntents.test.ts`
- Modify: `src/application/input/appControls.ts`
- Modify: `src/application/input/appControls.test.ts`

- [ ] **Step 1: Write failing control intent tests**

Append to `src/domain/input/controlIntents.test.ts`:

```ts
describe('stage select controls', () => {
  it('maps keyboard controls to stage select intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowLeft', repeat: false }, 'stage-select')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'stage-select')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'ArrowRight', repeat: false }, 'stage-select')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'd', repeat: false }, 'stage-select')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'stage-select')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'stage-select')).toBe('back')
  })

  it('maps standard gamepad controls to stage select intents', () => {
    const previous = {
      mapping: 'standard',
      buttons: Array(16).fill(false),
      axes: [0, 0],
    }
    const current = {
      mapping: 'standard',
      buttons: Array(16).fill(false),
      axes: [0.75, 0],
    }

    expect(mapGamepadControlIntents(previous, current, 'stage-select')).toEqual(['move-right'])
  })
})
```

Update `src/application/input/appControls.test.ts` world-select expectation:

```ts
expect(applyControlIntent(worldState, 'confirm')).toEqual({
  screen: { type: 'stage-select', selectedWorldIndex: 3, worldId: 'world04', selectedStageIndex: 0 },
})
```

Append:

```ts
it('moves, confirms, and backs out of stage select', () => {
  const state = {
    screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 0 },
  } as const

  expect(applyControlIntent(state, 'move-right')).toEqual({
    screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 1 },
  })
  expect(applyControlIntent(state, 'move-down')).toEqual({
    screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 1 },
  })
  expect(applyControlIntent(state, 'move-left')).toEqual({
    screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 5 },
  })
  expect(applyControlIntent(state, 'move-up')).toEqual({
    screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 5 },
  })
  expect(applyControlIntent(state, 'confirm')).toBe(state)
  expect(applyControlIntent(state, 'back')).toEqual({
    screen: { type: 'world-select', selectedWorldIndex: 2 },
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/input/controlIntents.test.ts src/application/input/appControls.test.ts
```

Expected: FAIL because `ControlContext` does not include `stage-select` and `applyControlIntent` still routes non-settings screens as World Select.

- [ ] **Step 3: Implement input context and application routing**

In `src/domain/input/controlIntents.ts`, add `'stage-select'` to `ControlContext`:

```ts
export type ControlContext =
  | 'title-intro'
  | 'title-menu'
  | 'world-select'
  | 'stage-select'
  | 'settings'
  | 'settings-delete-confirm'
```

No new keyboard branch is required because Stage Select uses the same fallback mapping as World Select.

In `src/application/input/appControls.ts`, import Stage Select helpers:

```ts
  backFromStageSelect,
  confirmSelectedStage,
  moveStageSelection,
```

Add this branch before the final World Select routing branch:

```ts
  if (state.screen.type === 'stage-select') {
    if (intent === 'move-right' || intent === 'move-down') return moveStageSelection(state, 1)
    if (intent === 'move-left' || intent === 'move-up') return moveStageSelection(state, -1)
    if (intent === 'confirm') return confirmSelectedStage(state)
    if (intent === 'back') return backFromStageSelect(state)

    return state
  }
```

- [ ] **Step 4: Run focused input tests**

Run:

```bash
npm run test -- src/domain/input/controlIntents.test.ts src/application/input/appControls.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/input/controlIntents.ts src/domain/input/controlIntents.test.ts src/application/input/appControls.ts src/application/input/appControls.test.ts
git commit -m "feat: route stage select controls"
```

## Task 4: Audio Policy And SFX Events

**Files:**
- Modify: `src/domain/audio/audioPolicy.ts`
- Modify: `src/domain/audio/audioPolicy.test.ts`
- Modify: `src/application/audio/audioEvents.ts`
- Modify: `src/application/audio/audioEvents.test.ts`

- [ ] **Step 1: Write failing audio tests**

In `src/domain/audio/audioPolicy.test.ts`, extend the screen music test:

```ts
expect(
  getMusicForScreen(
    { type: 'stage-select', selectedWorldIndex: 4, worldId: 'world05', selectedStageIndex: 0 },
    DEFAULT_SETTINGS,
  ),
).toEqual({
  track: 'world05Bgm',
  volume: 0.336,
})
```

Extend fallback test:

```ts
expect(
  getMusicForScreen(
    { type: 'stage-select', selectedWorldIndex: 99, worldId: 'world01', selectedStageIndex: 0 },
    DEFAULT_SETTINGS,
  ).track,
).toBe('world01Bgm')
```

In `src/application/audio/audioEvents.test.ts`, add to `maps selection changes to move sfx`:

```ts
expect(
  getControlIntentSfxAction(
    { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 0 },
    { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 1 },
    'move-right',
  ),
).toBe('move')
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/audio/audioPolicy.test.ts src/application/audio/audioEvents.test.ts
```

Expected: FAIL because `stage-select` is not handled in audio policy or selected-position SFX detection.

- [ ] **Step 3: Implement Stage Select audio policy**

In `src/domain/audio/audioPolicy.ts`, change:

```ts
if (screen.type === 'world-select') {
```

to:

```ts
if (screen.type === 'world-select' || screen.type === 'stage-select') {
```

Keep the selected world index track lookup unchanged.

In `src/application/audio/audioEvents.ts`, add:

```ts
  if (previousScreen.type === 'stage-select' && nextScreen.type === 'stage-select') {
    return previousScreen.selectedStageIndex !== nextScreen.selectedStageIndex
  }
```

- [ ] **Step 4: Run focused audio tests**

Run:

```bash
npm run test -- src/domain/audio/audioPolicy.test.ts src/application/audio/audioEvents.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/audio/audioPolicy.ts src/domain/audio/audioPolicy.test.ts src/application/audio/audioEvents.ts src/application/audio/audioEvents.test.ts
git commit -m "feat: connect stage select audio"
```

## Task 5: Stage Select UI And App Wiring

**Files:**
- Create: `src/ui/stage/StageSelectScreen.svelte`
- Modify: `src/App.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Add the Stage Select Svelte component**

Create `src/ui/stage/StageSelectScreen.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizeData,
  } from '../../domain/data/localize/localize'
  import type { StageCatalog, StageData } from '../../domain/data/stages/stageTypes'
  import type { WorldCatalog, WorldData } from '../../domain/data/worlds/worldTypes'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'

  type Props = {
    worlds: WorldCatalog
    stages: StageCatalog
    localizeData: LocalizeData
    locale?: LocaleCode
    selectedWorldIndex: number
    selectedStageIndex: number
    onControlIntent: (intent: ControlIntent) => void
    onSelectStage: (index: number) => void
    onConfirmStage: () => void
    onBack: () => void
  }

  let {
    worlds,
    stages,
    localizeData,
    locale = 'en',
    selectedWorldIndex,
    selectedStageIndex,
    onControlIntent,
    onSelectStage,
    onConfirmStage,
    onBack,
  }: Props = $props()

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null
  let confirming = $state(false)

  const orderedWorlds = $derived(worlds.order.map((worldId) => worlds.items[worldId]))
  const selectedWorld = $derived(orderedWorlds[selectedWorldIndex] ?? orderedWorlds[0])
  const stageOptions = $derived(selectedWorld.stageIds.map((stageId) => stages.items[stageId]))
  const selectedStage = $derived(stageOptions[selectedStageIndex] ?? stageOptions[0])

  function localize(key: Parameters<typeof resolveLocalizedText>[2]): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function worldTitle(world: WorldData): string {
    return localize(world.titleRef)
  }

  function stageTitle(stage: StageData): string {
    return localize(stage.titleRef)
  }

  function stageSubtitle(stage: StageData): string {
    return localize(stage.subtitleRef)
  }

  function stageObjective(stage: StageData): string {
    return localize(stage.objectiveRef)
  }

  function handleConfirmStage() {
    confirming = true
    onConfirmStage()
    window.setTimeout(() => {
      confirming = false
    }, 220)
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      'stage-select',
    )

    if (intent) {
      event.preventDefault()
      onControlIntent(intent)
    }
  }

  function readGamepadSnapshot(): GamepadControlSnapshot | null {
    const gamepads = navigator.getGamepads?.()
    const gamepad = Array.from(gamepads ?? []).find((candidate): candidate is Gamepad => Boolean(candidate))
    if (!gamepad) return null

    return {
      mapping: gamepad.mapping,
      buttons: gamepad.buttons.map((button) => button.pressed),
      axes: [...gamepad.axes],
    }
  }

  onMount(() => {
    let frameId = 0

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      const intents = mapGamepadControlIntents(previousGamepadSnapshot, currentSnapshot, 'stage-select')

      for (const intent of intents) {
        onControlIntent(intent)
      }

      previousGamepadSnapshot = currentSnapshot
      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)

    return () => cancelAnimationFrame(frameId)
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<section class:confirming class={`stage-select theme-${selectedWorld.theme}`} aria-label={localize('stageSelect.aria.screen')}>
  <div class="stage-world" style={`background-image: url("${selectedWorld.assetRefs.stageSelectBackground}")`} aria-hidden="true"></div>

  <header class="stage-banner">
    <span aria-hidden="true">✦</span>
    <strong>{localize('stageSelect.title')}</strong>
    <span aria-hidden="true">✦</span>
  </header>

  <button class="menu-back-button stage-back-button" type="button" onclick={onBack} aria-label={localize('common.back')}>
    <span aria-hidden="true">‹</span>
    <b>{localize('common.back')}</b>
  </button>

  <aside class="stage-detail" aria-live="polite">
    <div class="stage-preview" style={`background-image: url("${selectedStage.previewAssetRef}")`} aria-hidden="true"></div>
    <strong class="stage-title">{stageTitle(selectedStage)}</strong>
    <span class="stage-subtitle">{stageSubtitle(selectedStage)}</span>

    <div class="stage-rule"></div>

    <span class="stage-label">{localize('stageSelect.objective')}</span>
    <p class="stage-objective">{stageObjective(selectedStage)}</p>

    <span class="stage-label">{localize('stageSelect.collectibles')}</span>
    <div class="stage-collectible">
      <span class="coin-mark">I</span>
      <b>0 <small>/ {selectedStage.collectibleCount}</small></b>
    </div>

    <div class="stage-stats">
      <div>
        <span class="stage-label">{localize('stageSelect.bestTime')}</span>
        <b>--:--.--</b>
      </div>
      <div>
        <span class="stage-label">{localize('stageSelect.rank')}</span>
        <b>{localize('stageSelect.recordUnavailable')}</b>
      </div>
    </div>

    <div class="stage-roster">
      <div class="stage-roster-portrait" aria-hidden="true"></div>
      <div>
        <span>{localize('stageSelect.activeCharacter')}</span>
        <strong>Yuuta Tsubasa</strong>
      </div>
    </div>

    <button class="stage-deploy" type="button" onclick={handleConfirmStage}>
      <span>{localize('stageSelect.deploy')}</span>
      <b aria-hidden="true">›</b>
    </button>
  </aside>

  <div class="stage-map" aria-label={localize('stageSelect.aria.map')}>
    <svg class="stage-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {#each stageOptions.slice(0, -1) as stage, index}
        <line
          x1={stage.nodePosition.x}
          y1={stage.nodePosition.y}
          x2={stageOptions[index + 1].nodePosition.x}
          y2={stageOptions[index + 1].nodePosition.y}
        ></line>
      {/each}
    </svg>

    {#each stageOptions as stage, index}
      <button
        class:active={index === selectedStageIndex}
        class:boss={stage.isBoss}
        class="stage-node"
        style={`left:${stage.nodePosition.x}%;top:${stage.nodePosition.y}%;--node-index:${index}`}
        type="button"
        aria-label={`${stageTitle(stage)}, ${stageSubtitle(stage)}`}
        onclick={() => onSelectStage(index)}
        ondblclick={() => {
          onSelectStage(index)
          handleConfirmStage()
        }}
      >
        <i aria-hidden="true"></i>
        <b>{stage.id}</b>
        <span><strong>{stage.id}</strong>{stageSubtitle(stage)}</span>
      </button>
    {/each}
  </div>

  <div class="select-controls stage-controls">
    <span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> {localize('common.select')}</span>
    <span><kbd>Space</kbd> {localize('common.confirm')}</span>
    <span><kbd>Esc</kbd> {localize('common.back')}</span>
  </div>
</section>
```

- [ ] **Step 2: Wire App.svelte**

In `src/App.svelte`, import helpers:

```ts
    backFromStageSelect,
    confirmSelectedStage,
    selectStage,
```

Import component:

```ts
  import StageSelectScreen from './ui/stage/StageSelectScreen.svelte'
```

Add handlers:

```ts
  function handleSelectStage(index: number) {
    const previousIndex = appState.screen.type === 'stage-select' ? appState.screen.selectedStageIndex : null
    appState = selectStage(appState, index)
    if (
      previousIndex !== null &&
      appState.screen.type === 'stage-select' &&
      previousIndex !== appState.screen.selectedStageIndex
    ) {
      playUiSfx('move')
    }
    syncMusicForCurrentState()
  }

  function handleConfirmStage() {
    playUiSfx('confirm')
    appState = confirmSelectedStage(appState)
    syncMusicForCurrentState()
  }

  function handleBackFromStageSelect() {
    playUiSfx('back')
    appState = backFromStageSelect(appState)
    syncMusicForCurrentState()
  }
```

Add render branch after World Select:

```svelte
    {:else if appState.screen.type === 'stage-select'}
      <StageSelectScreen
        worlds={projectData.worlds}
        stages={projectData.stages}
        localizeData={projectData.localize}
        locale={locale}
        selectedWorldIndex={appState.screen.selectedWorldIndex}
        selectedStageIndex={appState.screen.selectedStageIndex}
        onControlIntent={handleControlIntent}
        onSelectStage={handleSelectStage}
        onConfirmStage={handleConfirmStage}
        onBack={handleBackFromStageSelect}
      />
```

- [ ] **Step 3: Add Stage Select CSS**

Append to `src/app.css` after the World Select section and reuse existing `.menu-back-button`, `.select-controls`, and `.coin-mark` conventions:

```css
.stage-select {
  --stage-ink: #17345d;
  --stage-soft: #58769a;
  --stage-blue: #2f6fd0;
  --stage-blue-deep: #123b83;
  --stage-line: rgba(47, 111, 208, 0.48);
  --stage-panel: rgba(240, 249, 255, 0.82);
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  container-type: size;
  color: var(--stage-ink);
  font-weight: 600;
  background: #ccecff;
}

.stage-world,
.stage-map,
.stage-paths {
  position: absolute;
  inset: 0;
}

.stage-world {
  background-position: center;
  background-size: cover;
  filter: saturate(0.98) contrast(1.02);
  animation: select-world-enter 760ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.stage-world::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(17, 61, 120, 0.22), transparent 39%),
    radial-gradient(circle at 68% 48%, transparent 30%, rgba(31, 86, 144, 0.14) 100%);
}

.stage-banner {
  position: absolute;
  top: 2.1cqh;
  left: 50%;
  z-index: 10;
  display: flex;
  width: 37.5cqw;
  height: 7.4cqh;
  gap: 1.4cqw;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
  clip-path: polygon(22px 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0 50%);
  background: linear-gradient(180deg, #8ec9ff, var(--stage-blue) 48%, var(--stage-blue-deep));
  color: #fff;
  filter: drop-shadow(0 14px 22px rgba(20, 49, 95, 0.4));
  animation: select-banner-enter 500ms 100ms cubic-bezier(0.2, 0.85, 0.2, 1.1) both;
}

.stage-banner strong {
  font-size: min(2.1cqw, 40px);
  letter-spacing: 0.18em;
  line-height: 1;
  text-transform: uppercase;
}

.stage-banner span {
  color: #ffe6a0;
  font-size: min(1.4cqw, 27px);
}

.stage-back-button {
  top: 3cqh;
  left: 1.6cqw;
  z-index: 20;
}

.stage-detail {
  position: absolute;
  top: 9cqh;
  bottom: 3cqh;
  left: 1.6cqw;
  z-index: 12;
  width: 22.4cqw;
  padding: 1.4cqh 1.15cqw;
  border: 1.5px solid var(--stage-line);
  border-radius: 8px;
  background: var(--stage-panel);
  box-shadow: 0 1px 0 #fff inset, 0 20px 46px -24px rgba(18, 59, 131, 0.7);
  backdrop-filter: blur(8px) saturate(120%);
  animation: select-detail-enter 520ms 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.stage-detail::after {
  content: "";
  position: absolute;
  inset: 5px;
  border: 1px solid rgba(47, 111, 208, 0.22);
  border-radius: 5px;
  pointer-events: none;
}

.stage-preview {
  position: relative;
  height: 18cqh;
  overflow: hidden;
  border: 2px solid var(--stage-line);
  border-radius: 6px;
  background-position: center;
  background-size: cover;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.55);
}

.stage-title,
.stage-subtitle {
  display: block;
  text-transform: uppercase;
}

.stage-title {
  margin-top: 1.55cqh;
  font-size: min(1.45cqw, 28px);
  line-height: 1;
}

.stage-subtitle {
  margin-top: 0.45cqh;
  color: var(--stage-soft);
  font-size: min(0.72cqw, 14px);
  font-weight: 700;
  letter-spacing: 0.18em;
}

.stage-rule {
  height: 1px;
  margin: 1.4cqh 0;
  background: linear-gradient(90deg, transparent, var(--stage-line), transparent);
}

.stage-label {
  display: block;
  margin-top: 1.05cqh;
  color: var(--stage-soft);
  font-size: min(0.68cqw, 13px);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.stage-objective {
  margin: 0.35cqh 0 0;
  font-size: min(1.02cqw, 19px);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.stage-collectible {
  display: flex;
  gap: 0.75cqw;
  align-items: center;
  margin-top: 0.5cqh;
}

.stage-collectible b,
.stage-stats b {
  font: 700 min(1.35cqw, 26px)/1 Rajdhani, sans-serif;
  font-variant-numeric: tabular-nums;
}

.stage-collectible small {
  color: var(--stage-soft);
  font-size: 0.55em;
}

.stage-stats {
  display: grid;
  grid-template-columns: 1.5fr 0.7fr;
  gap: 0.8cqw;
  margin-top: 0.75cqh;
}

.stage-stats b {
  display: block;
  margin-top: 0.35cqh;
}

.stage-roster {
  display: flex;
  gap: 0.7cqw;
  align-items: center;
  margin-top: 1.4cqh;
  padding-top: 1.1cqh;
  border-top: 1px solid rgba(47, 111, 208, 0.22);
}

.stage-roster-portrait {
  width: 3.6cqw;
  aspect-ratio: 1;
  border: 2px solid var(--stage-line);
  border-radius: 5px;
  background: linear-gradient(145deg, #f4fbff, #8ec9ff);
}

.stage-roster span,
.stage-roster strong {
  display: block;
}

.stage-roster span {
  color: var(--stage-soft);
  font-size: min(0.57cqw, 11px);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.stage-roster strong {
  font-size: min(0.95cqw, 18px);
}

.stage-deploy {
  display: flex;
  width: 100%;
  min-height: 5.4cqh;
  margin-top: 1.2cqh;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.9cqw;
  border: 1px solid var(--stage-line);
  border-radius: 5px;
  background: linear-gradient(100deg, rgba(47, 111, 180, 0.94), rgba(37, 148, 218, 0.9));
  box-shadow: 0 10px 22px rgba(28, 85, 145, 0.22);
  color: white;
  cursor: pointer;
  text-transform: uppercase;
}

.stage-deploy span {
  font-size: min(0.8cqw, 16px);
  font-weight: 800;
  letter-spacing: 0.12em;
}

.stage-deploy b {
  font-size: min(1.5cqw, 30px);
}

.stage-map {
  z-index: 5;
  left: 24%;
}

.stage-paths {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.stage-paths line {
  stroke: rgba(255, 255, 255, 0.82);
  stroke-width: 0.6;
  stroke-dasharray: 0.8 1.4;
  filter: drop-shadow(0 0 3px rgba(47, 111, 208, 0.8));
}

.stage-node {
  position: absolute;
  z-index: 7;
  display: grid;
  width: 4.1cqw;
  aspect-ratio: 1;
  padding: 0;
  place-items: center;
  transform: translate(-50%, -50%);
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  filter: drop-shadow(0 8px 12px rgba(20, 49, 95, 0.42));
  animation: select-node-enter 360ms calc(480ms + var(--node-index) * 75ms) cubic-bezier(0.2, 0.9, 0.25, 1.2) both;
}

.stage-node i {
  position: absolute;
  inset: 8%;
  rotate: 45deg;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  background: linear-gradient(145deg, #9ed3ff, var(--stage-blue) 48%, var(--stage-blue-deep));
}

.stage-node.boss i {
  background: linear-gradient(145deg, #ffe6a0, #d5762f 52%, #833112);
}

.stage-node b {
  position: relative;
  z-index: 1;
  font-size: min(0.78cqw, 15px);
}

.stage-node.active {
  scale: 1.14;
}

.stage-node.active::before,
.stage-node.active::after {
  content: "";
  position: absolute;
  inset: -13%;
  border: 2px solid #ffe6a0;
  rotate: 45deg;
  animation: select-reticle 6s linear infinite;
}

.stage-node.active::after {
  inset: -23%;
  border-color: rgba(255, 255, 255, 0.72);
  animation-direction: reverse;
}

.stage-node span {
  position: absolute;
  bottom: calc(100% + 0.7cqh);
  left: 50%;
  display: none;
  min-width: 8cqw;
  padding: 0.45cqh 0.65cqw;
  transform: translateX(-50%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 5px;
  background: linear-gradient(180deg, #7fbfff, #2f6fd0);
  color: #fff;
  font-size: min(0.57cqw, 11px);
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.15;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
}

.stage-node.active span {
  display: block;
}

.stage-node span strong {
  display: block;
  color: #ffe6a0;
  font-size: 1.35em;
}

.stage-select.confirming .stage-detail,
.stage-select.confirming .stage-banner,
.stage-select.confirming .stage-controls,
.stage-select.confirming .stage-back-button {
  opacity: 0.84;
  transition: opacity 180ms ease-out;
}

@keyframes select-banner-enter {
  from { opacity: 0; transform: translate(-50%, -24px) scale(0.96); }
  to { opacity: 1; transform: translate(-50%, 0) scale(1); }
}

@keyframes select-node-enter {
  from { opacity: 0; translate: 0 12px; }
  to { opacity: 1; translate: 0 0; }
}

@keyframes select-reticle {
  to { rotate: 405deg; }
}
```

- [ ] **Step 4: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS. If it fails because `Parameters<typeof resolveLocalizedText>[2]` is too broad for local usage, import and use `type LocalizationKey` explicitly.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/ui/stage/StageSelectScreen.svelte src/App.svelte src/app.css
git commit -m "feat: add stage select screen"
```

## Task 6: Verification And Visual QA

**Files:**
- No planned source edits unless verification finds a defect.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run whitespace sanity**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Start dev server for manual browser verification**

Run:

```bash
npm run dev
```

Expected: Vite serves the app on `http://127.0.0.1:1420/` or reports the next available port.

- [ ] **Step 6: Browser-check the flow**

Open the served app and verify:

- Title screen opens title menu.
- Start Game opens World Select.
- Confirm on World Select opens Stage Select for the selected world.
- Stage Select shows the selected world map background and six positioned nodes.
- Arrow keys move selected stage and play movement SFX when audio is unlocked.
- Escape returns to World Select with the original world selected.
- Stage Select visible text changes when Settings language is changed.

- [ ] **Step 7: Handle verification defects with a new TDD task**

If any verification step fails, do not make an unplanned broad fix. Add a focused failing test for the defect when the defect is domain or application behavior, implement the smallest fix, rerun the failing verification command, and then rerun the full verification commands in this task. If the defect is Svelte/CSS-only, make the smallest UI edit, rerun `npm run check`, `npm run build`, and `git diff --check`, then commit only the files changed by that focused fix.

Use commit message `fix: polish stage select verification` for a verification-only fix commit.

## Self-Review Notes

- Spec coverage: Task 1 covers stage data and localization. Task 2 covers app-flow transition from World Select. Task 3 covers keyboard/gamepad routing. Task 4 covers music and SFX policy. Task 5 covers prototype-style Svelte UI. Task 6 covers required verification.
- Placeholder scan: The plan intentionally avoids unresolved markers and vague implementation steps.
- Type consistency: `StageData`, `StageCatalog`, `StageSelectScreen`, `stage-select`, `selectedStageIndex`, and `worldId` names match across tasks.
