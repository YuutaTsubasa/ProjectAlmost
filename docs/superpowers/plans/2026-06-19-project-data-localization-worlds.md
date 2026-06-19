# Project Data Localization Worlds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first pure `projectData` slice with localization data, six world records, and a single domain data entry point.

**Architecture:** Add pure static data under `src/domain/data/`, split into `localize/` and `worlds/` subdomains. World records store stable catalog metadata and typed localization keys; text resolution stays in a pure helper with deterministic fallback behavior.

**Tech Stack:** TypeScript, Vitest, root rebuild domain layer.

---

## File Structure

- `src/domain/data/localize/localize.ts`: defines locale/key/catalog types, supported locale records, localized strings, grouped references, and `resolveLocalizedText`.
- `src/domain/data/localize/localize.test.ts`: verifies localized lookup, English fallback, missing-key fallback, and reference/catalog alignment.
- `src/domain/data/worlds/worldTypes.ts`: defines world IDs, theme slugs, stage IDs, asset refs, music refs, and `WorldData`.
- `src/domain/data/worlds/world01.ts` through `src/domain/data/worlds/world06.ts`: one immutable world record per module.
- `src/domain/data/worlds/worldCatalog.ts`: imports world modules and exposes `worlds.order` plus `worlds.items`.
- `src/domain/data/worlds/worldCatalog.test.ts`: verifies order, item wiring, stage IDs, refs, asset refs, and music refs.
- `src/domain/data/projectData.ts`: public project data entry point exposing exactly `localize` and `worlds`.
- `src/domain/data/projectData.test.ts`: verifies entry point category shape and imported category identity.

## Task 1: Localization Data And Resolver

**Files:**
- Create: `src/domain/data/localize/localize.test.ts`
- Create: `src/domain/data/localize/localize.ts`

- [ ] **Step 1: Write the failing localization tests**

Create `src/domain/data/localize/localize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  localize,
  resolveLocalizedText,
  type LocalizedTextCatalog,
  type LocalizationKey,
} from './localize'

describe('localize', () => {
  it('declares the supported locales in deterministic order', () => {
    expect(localize.languages.map((language) => language.code)).toEqual(['en', 'ja', 'zhHant', 'ko'])
  })

  it('groups world title and subtitle localization references', () => {
    expect(localize.references.worlds.world01).toEqual({
      title: 'worlds.world01.title',
      subtitle: 'worlds.world01.subtitle',
    })
  })

  it('includes localized title and subtitle values for every supported locale', () => {
    expect(resolveLocalizedText(localize, 'en', 'worlds.world01.title')).toBe('White Palace')
    expect(resolveLocalizedText(localize, 'ja', 'worlds.world01.title')).toBe('白亜の宮殿')
    expect(resolveLocalizedText(localize, 'zhHant', 'worlds.world01.title')).toBe('白色宮殿')
    expect(resolveLocalizedText(localize, 'ko', 'worlds.world01.title')).toBe('하얀 궁전')

    expect(resolveLocalizedText(localize, 'en', 'worlds.world06.subtitle')).toBe(
      'The final descent into the demonic abyss.',
    )
    expect(resolveLocalizedText(localize, 'ja', 'worlds.world06.subtitle')).toBe('魔の深淵へと続く最後の降下。')
    expect(resolveLocalizedText(localize, 'zhHant', 'worlds.world06.subtitle')).toBe('通往惡魔深淵的最終下降。')
    expect(resolveLocalizedText(localize, 'ko', 'worlds.world06.subtitle')).toBe('악마의 심연으로 향하는 마지막 하강.')
  })
})

describe('resolveLocalizedText', () => {
  it('falls back to English when the requested locale is missing a key', () => {
    const catalog: LocalizedTextCatalog = {
      en: { 'worlds.world01.title': 'White Palace' },
      ja: {},
      zhHant: {},
      ko: {},
    }

    expect(resolveLocalizedText({ ...localize, catalog }, 'ja', 'worlds.world01.title')).toBe('White Palace')
  })

  it('returns the key itself when the key is missing from English too', () => {
    const missingKey = 'worlds.world99.title' as LocalizationKey

    expect(resolveLocalizedText(localize, 'zhHant', missingKey)).toBe('worlds.world99.title')
  })
})
```

- [ ] **Step 2: Run the localization tests and verify the expected failure**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts
```

Expected: fail because `src/domain/data/localize/localize.ts` does not exist.

- [ ] **Step 3: Implement the localization model and catalog**

Create `src/domain/data/localize/localize.ts`:

```ts
export type LocaleCode = 'en' | 'ja' | 'zhHant' | 'ko'

export type LocalizationKey = `worlds.world0${1 | 2 | 3 | 4 | 5 | 6}.${'title' | 'subtitle'}`

export interface LocaleRecord {
  code: LocaleCode
  label: string
}

export type LocalizedTextCatalog = Record<LocaleCode, Partial<Record<LocalizationKey, string>>>

export interface WorldLocalizationReferences {
  title: LocalizationKey
  subtitle: LocalizationKey
}

export type WorldLocalizationReferenceGroup = Record<
  `world0${1 | 2 | 3 | 4 | 5 | 6}`,
  WorldLocalizationReferences
>

export interface LocalizeData {
  languages: readonly LocaleRecord[]
  references: {
    worlds: WorldLocalizationReferenceGroup
  }
  catalog: LocalizedTextCatalog
}

const worlds: WorldLocalizationReferenceGroup = {
  world01: {
    title: 'worlds.world01.title',
    subtitle: 'worlds.world01.subtitle',
  },
  world02: {
    title: 'worlds.world02.title',
    subtitle: 'worlds.world02.subtitle',
  },
  world03: {
    title: 'worlds.world03.title',
    subtitle: 'worlds.world03.subtitle',
  },
  world04: {
    title: 'worlds.world04.title',
    subtitle: 'worlds.world04.subtitle',
  },
  world05: {
    title: 'worlds.world05.title',
    subtitle: 'worlds.world05.subtitle',
  },
  world06: {
    title: 'worlds.world06.title',
    subtitle: 'worlds.world06.subtitle',
  },
}

const catalog: LocalizedTextCatalog = {
  en: {
    'worlds.world01.title': 'White Palace',
    'worlds.world01.subtitle': 'A radiant kingdom above the clouds.',
    'worlds.world02.title': 'Emerald Sanctuary',
    'worlds.world02.subtitle': 'Ancient ruins reclaimed by the living forest.',
    'worlds.world03.title': 'Cerulean Depths',
    'worlds.world03.subtitle': 'A drowned realm beneath the endless tide.',
    'worlds.world04.title': 'Frostveil Peaks',
    'worlds.world04.subtitle': 'Frozen fortresses beyond the mountain storm.',
    'worlds.world05.title': 'Emberfall Caldera',
    'worlds.world05.subtitle': 'A shattered forge at the heart of the volcano.',
    'worlds.world06.title': 'Abyssal Hollow',
    'worlds.world06.subtitle': 'The final descent into the demonic abyss.',
  },
  ja: {
    'worlds.world01.title': '白亜の宮殿',
    'worlds.world01.subtitle': '雲の上に輝く王国。',
    'worlds.world02.title': '翠緑の聖域',
    'worlds.world02.subtitle': '生きた森に取り戻された古代遺跡。',
    'worlds.world03.title': '蒼き深淵',
    'worlds.world03.subtitle': '果てしない潮の下に沈んだ領域。',
    'worlds.world04.title': '霜覆う峰々',
    'worlds.world04.subtitle': '山嵐の彼方にある凍てついた砦。',
    'worlds.world05.title': '燠火のカルデラ',
    'worlds.world05.subtitle': '火山の中心にある砕けた炉。',
    'worlds.world06.title': '深淵の空洞',
    'worlds.world06.subtitle': '魔の深淵へと続く最後の降下。',
  },
  zhHant: {
    'worlds.world01.title': '白色宮殿',
    'worlds.world01.subtitle': '雲端之上的光輝王國。',
    'worlds.world02.title': '翠綠聖域',
    'worlds.world02.subtitle': '被活生生森林奪回的古代遺跡。',
    'worlds.world03.title': '蔚藍深淵',
    'worlds.world03.subtitle': '沉沒在無盡潮汐之下的領域。',
    'worlds.world04.title': '霜幕群峰',
    'worlds.world04.subtitle': '山嵐彼端的冰封堡壘。',
    'worlds.world05.title': '燼落火山口',
    'worlds.world05.subtitle': '火山核心中破碎的熔爐。',
    'worlds.world06.title': '深淵空洞',
    'worlds.world06.subtitle': '通往惡魔深淵的最終下降。',
  },
  ko: {
    'worlds.world01.title': '하얀 궁전',
    'worlds.world01.subtitle': '구름 위에서 빛나는 왕국.',
    'worlds.world02.title': '에메랄드 성역',
    'worlds.world02.subtitle': '살아 있는 숲이 되찾은 고대 유적.',
    'worlds.world03.title': '푸른 심해',
    'worlds.world03.subtitle': '끝없는 조류 아래 가라앉은 영역.',
    'worlds.world04.title': '서리장막 봉우리',
    'worlds.world04.subtitle': '산 폭풍 너머의 얼어붙은 요새.',
    'worlds.world05.title': '잿불 칼데라',
    'worlds.world05.subtitle': '화산 중심부의 부서진 대장간.',
    'worlds.world06.title': '심연의 공동',
    'worlds.world06.subtitle': '악마의 심연으로 향하는 마지막 하강.',
  },
}

export const localize: LocalizeData = {
  languages: [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zhHant', label: '繁體中文' },
    { code: 'ko', label: '한국어' },
  ],
  references: {
    worlds,
  },
  catalog,
}

export function resolveLocalizedText(localizeData: LocalizeData, locale: LocaleCode, key: LocalizationKey): string {
  return localizeData.catalog[locale][key] ?? localizeData.catalog.en[key] ?? key
}
```

- [ ] **Step 4: Run the localization tests and verify they pass**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit localization data**

Run:

```bash
git add src/domain/data/localize/localize.test.ts src/domain/data/localize/localize.ts
git commit -m "Add project localization data"
```

## Task 2: World Types And Six World Modules

**Files:**
- Create: `src/domain/data/worlds/worldCatalog.test.ts`
- Create: `src/domain/data/worlds/worldTypes.ts`
- Create: `src/domain/data/worlds/world01.ts`
- Create: `src/domain/data/worlds/world02.ts`
- Create: `src/domain/data/worlds/world03.ts`
- Create: `src/domain/data/worlds/world04.ts`
- Create: `src/domain/data/worlds/world05.ts`
- Create: `src/domain/data/worlds/world06.ts`
- Create: `src/domain/data/worlds/worldCatalog.ts`

- [ ] **Step 1: Write the failing world catalog tests**

Create `src/domain/data/worlds/worldCatalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { worlds } from './worldCatalog'

describe('worlds', () => {
  it('orders the six campaign worlds by world number', () => {
    expect(worlds.order).toEqual(['world01', 'world02', 'world03', 'world04', 'world05', 'world06'])
  })

  it('indexes every world item by its stable id', () => {
    for (const worldId of worlds.order) {
      expect(worlds.items[worldId].id).toBe(worldId)
    }
  })

  it('keeps each world to six stage ids matching its world number', () => {
    for (const worldId of worlds.order) {
      const world = worlds.items[worldId]
      const prefix = `${world.number}-`

      expect(world.stageCount).toBe(6)
      expect(world.stageIds).toHaveLength(6)
      expect(world.stageIds).toEqual([
        `${prefix}1`,
        `${prefix}2`,
        `${prefix}3`,
        `${prefix}4`,
        `${prefix}5`,
        `${prefix}6`,
      ])
    }
  })

  it('stores localization refs instead of embedded display strings', () => {
    expect(worlds.items.world01.titleRef).toBe('worlds.world01.title')
    expect(worlds.items.world01.subtitleRef).toBe('worlds.world01.subtitle')
    expect(worlds.items.world06.titleRef).toBe('worlds.world06.title')
    expect(worlds.items.world06.subtitleRef).toBe('worlds.world06.subtitle')
  })

  it('stores stable theme, symbol, asset, and music references', () => {
    expect(worlds.items.world01).toMatchObject({
      number: 1,
      theme: 'palace',
      symbol: '♜',
      assetRefs: {
        stageSelectBackground: '/assets/maps/white_palace_stage_select.webp',
      },
      musicRefs: {
        map: '/assets/audio/world01_map.mp3',
        bgm: '/assets/audio/world01_bgm.mp3',
        boss: '/assets/audio/world01_boss.mp3',
      },
    })

    expect(worlds.items.world06).toMatchObject({
      number: 6,
      theme: 'abyss',
      symbol: '✦',
      assetRefs: {
        stageSelectBackground: '/assets/maps/abyssal_hollow_stage_select.webp',
      },
      musicRefs: {
        map: '/assets/audio/world06_map.mp3',
        bgm: '/assets/audio/world06_bgm.mp3',
        boss: '/assets/audio/world06_boss.mp3',
      },
    })
  })
})
```

- [ ] **Step 2: Run the world catalog tests and verify the expected failure**

Run:

```bash
npm run test -- src/domain/data/worlds/worldCatalog.test.ts
```

Expected: fail because `src/domain/data/worlds/worldCatalog.ts` does not exist.

- [ ] **Step 3: Add world type definitions**

Create `src/domain/data/worlds/worldTypes.ts`:

```ts
import type { LocalizationKey } from '../localize/localize'

export type WorldId = `world0${1 | 2 | 3 | 4 | 5 | 6}`
export type WorldNumber = 1 | 2 | 3 | 4 | 5 | 6
export type WorldTheme = 'palace' | 'forest' | 'ocean' | 'snow' | 'volcano' | 'abyss'
export type StageId = `${WorldNumber}-${1 | 2 | 3 | 4 | 5 | 6}`

export interface WorldAssetRefs {
  stageSelectBackground: string
}

export interface WorldMusicRefs {
  map: string
  bgm: string
  boss: string
}

export interface WorldData {
  id: WorldId
  number: WorldNumber
  titleRef: LocalizationKey
  subtitleRef: LocalizationKey
  theme: WorldTheme
  symbol: string
  stageCount: 6
  stageIds: readonly StageId[]
  assetRefs: WorldAssetRefs
  musicRefs: WorldMusicRefs
}

export interface WorldCatalog {
  order: readonly WorldId[]
  items: Record<WorldId, WorldData>
}
```

- [ ] **Step 4: Add the six world modules**

Create `src/domain/data/worlds/world01.ts`:

```ts
import type { WorldData } from './worldTypes'

export const world01: WorldData = {
  id: 'world01',
  number: 1,
  titleRef: 'worlds.world01.title',
  subtitleRef: 'worlds.world01.subtitle',
  theme: 'palace',
  symbol: '♜',
  stageCount: 6,
  stageIds: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/white_palace_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world01_map.mp3',
    bgm: '/assets/audio/world01_bgm.mp3',
    boss: '/assets/audio/world01_boss.mp3',
  },
}
```

Create `src/domain/data/worlds/world02.ts`:

```ts
import type { WorldData } from './worldTypes'

export const world02: WorldData = {
  id: 'world02',
  number: 2,
  titleRef: 'worlds.world02.title',
  subtitleRef: 'worlds.world02.subtitle',
  theme: 'forest',
  symbol: '♧',
  stageCount: 6,
  stageIds: ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/emerald_sanctuary_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world02_map.mp3',
    bgm: '/assets/audio/world02_bgm.mp3',
    boss: '/assets/audio/world02_boss.mp3',
  },
}
```

Create `src/domain/data/worlds/world03.ts`:

```ts
import type { WorldData } from './worldTypes'

export const world03: WorldData = {
  id: 'world03',
  number: 3,
  titleRef: 'worlds.world03.title',
  subtitleRef: 'worlds.world03.subtitle',
  theme: 'ocean',
  symbol: '≈',
  stageCount: 6,
  stageIds: ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/cerulean_depths_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world03_map.mp3',
    bgm: '/assets/audio/world03_bgm.mp3',
    boss: '/assets/audio/world03_boss.mp3',
  },
}
```

Create `src/domain/data/worlds/world04.ts`:

```ts
import type { WorldData } from './worldTypes'

export const world04: WorldData = {
  id: 'world04',
  number: 4,
  titleRef: 'worlds.world04.title',
  subtitleRef: 'worlds.world04.subtitle',
  theme: 'snow',
  symbol: '△',
  stageCount: 6,
  stageIds: ['4-1', '4-2', '4-3', '4-4', '4-5', '4-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/frostveil_peaks_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world04_map.mp3',
    bgm: '/assets/audio/world04_bgm.mp3',
    boss: '/assets/audio/world04_boss.mp3',
  },
}
```

Create `src/domain/data/worlds/world05.ts`:

```ts
import type { WorldData } from './worldTypes'

export const world05: WorldData = {
  id: 'world05',
  number: 5,
  titleRef: 'worlds.world05.title',
  subtitleRef: 'worlds.world05.subtitle',
  theme: 'volcano',
  symbol: '◇',
  stageCount: 6,
  stageIds: ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/emberfall_caldera_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world05_map.mp3',
    bgm: '/assets/audio/world05_bgm.mp3',
    boss: '/assets/audio/world05_boss.mp3',
  },
}
```

Create `src/domain/data/worlds/world06.ts`:

```ts
import type { WorldData } from './worldTypes'

export const world06: WorldData = {
  id: 'world06',
  number: 6,
  titleRef: 'worlds.world06.title',
  subtitleRef: 'worlds.world06.subtitle',
  theme: 'abyss',
  symbol: '✦',
  stageCount: 6,
  stageIds: ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/abyssal_hollow_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world06_map.mp3',
    bgm: '/assets/audio/world06_bgm.mp3',
    boss: '/assets/audio/world06_boss.mp3',
  },
}
```

- [ ] **Step 5: Add the world catalog**

Create `src/domain/data/worlds/worldCatalog.ts`:

```ts
import { world01 } from './world01'
import { world02 } from './world02'
import { world03 } from './world03'
import { world04 } from './world04'
import { world05 } from './world05'
import { world06 } from './world06'
import type { WorldCatalog } from './worldTypes'

export const worlds: WorldCatalog = {
  order: ['world01', 'world02', 'world03', 'world04', 'world05', 'world06'],
  items: {
    world01,
    world02,
    world03,
    world04,
    world05,
    world06,
  },
}
```

- [ ] **Step 6: Run the world catalog tests and verify they pass**

Run:

```bash
npm run test -- src/domain/data/worlds/worldCatalog.test.ts
```

Expected: pass.

- [ ] **Step 7: Run localization tests again to verify shared types still pass**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit world catalog data**

Run:

```bash
git add src/domain/data/worlds/worldCatalog.test.ts src/domain/data/worlds/worldTypes.ts src/domain/data/worlds/world01.ts src/domain/data/worlds/world02.ts src/domain/data/worlds/world03.ts src/domain/data/worlds/world04.ts src/domain/data/worlds/world05.ts src/domain/data/worlds/world06.ts src/domain/data/worlds/worldCatalog.ts
git commit -m "Add world catalog data"
```

## Task 3: Project Data Entry Point

**Files:**
- Create: `src/domain/data/projectData.test.ts`
- Create: `src/domain/data/projectData.ts`

- [ ] **Step 1: Write the failing project data entry tests**

Create `src/domain/data/projectData.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { localize } from './localize/localize'
import { projectData } from './projectData'
import { worlds } from './worlds/worldCatalog'

describe('projectData', () => {
  it('exposes exactly the current project data categories', () => {
    expect(Object.keys(projectData).sort()).toEqual(['localize', 'worlds'])
  })

  it('uses the localization category as the project localization source', () => {
    expect(projectData.localize).toBe(localize)
  })

  it('uses the world catalog as the project worlds source', () => {
    expect(projectData.worlds).toBe(worlds)
  })
})
```

- [ ] **Step 2: Run the project data tests and verify the expected failure**

Run:

```bash
npm run test -- src/domain/data/projectData.test.ts
```

Expected: fail because `src/domain/data/projectData.ts` does not exist.

- [ ] **Step 3: Implement the project data entry point**

Create `src/domain/data/projectData.ts`:

```ts
import { localize } from './localize/localize'
import { worlds } from './worlds/worldCatalog'

export const projectData = {
  localize,
  worlds,
}
```

- [ ] **Step 4: Run project data tests and verify they pass**

Run:

```bash
npm run test -- src/domain/data/projectData.test.ts
```

Expected: pass.

- [ ] **Step 5: Run all focused domain data tests**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/domain/data/worlds/worldCatalog.test.ts src/domain/data/projectData.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit project data entry point**

Run:

```bash
git add src/domain/data/projectData.test.ts src/domain/data/projectData.ts
git commit -m "Add project data entry point"
```

## Task 4: Full Verification

**Files:**
- Inspect: all files changed by Tasks 1-3

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm run test
```

Expected: pass all Vitest test files.

- [ ] **Step 2: Run TypeScript and Svelte checks**

Run:

```bash
npm run check
```

Expected: `svelte-check` and `tsc` pass with zero errors.

- [ ] **Step 3: Run whitespace/path sanity check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Decide whether build verification is required**

Run:

```bash
git diff --name-only HEAD~3..HEAD
```

Expected changed source paths are only under `src/domain/data/`. If the implementation changed build configuration, Svelte UI imports, asset bundling behavior, or any runtime import path consumed by the app shell, also run:

```bash
npm run build
```

Expected: Vite build passes.

- [ ] **Step 5: Confirm final branch state**

Run:

```bash
git status --short
```

Expected: no output.

