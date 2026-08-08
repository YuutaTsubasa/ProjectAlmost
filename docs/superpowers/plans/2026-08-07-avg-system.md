# AVG System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the prototype AVG dialogue system and implement the stage `1-6` first chapter boss intro AVG, played every time `1-6` is entered.

**Architecture:** AVG content and playback rules live in pure `src/domain/avg/` modules. `GameplayScreen.svelte` owns local reactive overlay state and coordinates the existing gameplay renderer pause/resume/resetTiming methods. `AvgOverlay.svelte` is presentation-only and receives sequence/playback/localization data plus advance/skip callbacks.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Phaser renderer adapter, static runtime assets under `public/assets/`.

---

## File Structure

- Create `src/domain/avg/avgTypes.ts`
  - Immutable AVG sequence and playback state types.
- Create `src/domain/avg/avgRegistry.ts`
  - Rebuild-native `1-6-intro` sequence and `getStageIntroSequence(stageId)`.
- Create `src/domain/avg/avgPlayback.ts`
  - Pure playback transitions and active-line projection.
- Create `src/domain/avg/avgRegistry.test.ts`
  - Stage lookup/content/asset path tests.
- Create `src/domain/avg/avgPlayback.test.ts`
  - Playback state transition tests.
- Modify `src/domain/data/localize/localize.ts`
  - Add AVG localization key type and text catalog entries.
- Modify `src/domain/data/localize/localize.test.ts`
  - Add four-locale AVG text coverage.
- Copy assets:
  - `__prototype__/public/assets/avg/yuuta-dialogue.webp` -> `public/assets/avg/yuuta-dialogue.webp`
  - `__prototype__/public/assets/avg/white-priestess-dialogue.webp` -> `public/assets/avg/white-priestess-dialogue.webp`
- Modify `src/domain/assets/preloadManifest.ts`
  - Include AVG portraits in gameplay entry preload plans when a stage has an intro sequence.
- Modify `src/domain/assets/preloadManifest.test.ts`
  - Assert runtime collection and `1-6` gameplay entry plan include AVG portraits.
- Create `src/ui/avg/AvgOverlay.svelte`
  - Presentation-only overlay.
- Create `src/ui/avg/avgOverlayUi.test.ts`
  - Source-contract UI boundary and visual structure tests.
- Modify `src/ui/gameplay/GameplayScreen.svelte`
  - Reactive AVG playback state, input routing, renderer pause/resume/resetTiming, virtual control gate.
- Create `src/ui/gameplay/gameplayAvgWiring.test.ts`
  - Source-contract tests for GameplayScreen integration.

## Task 1: Domain AVG Registry

**Files:**
- Modify: `src/domain/data/localize/localize.ts`
- Create: `src/domain/avg/avgTypes.ts`
- Create: `src/domain/avg/avgRegistry.ts`
- Create: `src/domain/avg/avgRegistry.test.ts`

- [ ] **Step 1: Write the failing registry test**

Create `src/domain/avg/avgRegistry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getStageIntroSequence } from './avgRegistry'

describe('AVG registry', () => {
  it('returns the first chapter boss intro sequence for stage 1-6', () => {
    const sequence = getStageIntroSequence('1-6')

    expect(sequence).toMatchObject({
      id: '1-6-intro',
      characters: [
        {
          id: 'yuuta',
          nameKey: 'avg.speaker.yuuta',
          portraitAssetRef: '/assets/avg/yuuta-dialogue.webp',
          side: 'left',
        },
        {
          id: 'white-priestess',
          nameKey: 'avg.speaker.whitePriestess',
          portraitAssetRef: '/assets/avg/white-priestess-dialogue.webp',
          side: 'right',
        },
      ],
      lines: [
        { speakerId: 'white-priestess', textKey: 'avg.1-6.line1' },
        { speakerId: 'yuuta', textKey: 'avg.1-6.line2' },
        { speakerId: 'white-priestess', textKey: 'avg.1-6.line3' },
        { speakerId: 'yuuta', textKey: 'avg.1-6.line4' },
        { speakerId: 'white-priestess', textKey: 'avg.1-6.line5' },
        { speakerId: 'yuuta', textKey: 'avg.1-6.line6' },
      ],
    })
  })

  it('returns null for stages without intro AVG', () => {
    expect(getStageIntroSequence('1-1')).toBeNull()
    expect(getStageIntroSequence('2-1')).toBeNull()
  })

  it('keeps AVG portrait paths under rebuild runtime assets', () => {
    const sequence = getStageIntroSequence('1-6')

    expect(sequence).not.toBeNull()
    expect(sequence!.characters.map((character) => character.portraitAssetRef)).toEqual([
      '/assets/avg/yuuta-dialogue.webp',
      '/assets/avg/white-priestess-dialogue.webp',
    ])
    expect(sequence!.characters.every((character) =>
      character.portraitAssetRef.startsWith('/assets/')
      && !character.portraitAssetRef.includes('__prototype__'),
    )).toBe(true)
  })
})
```

- [ ] **Step 2: Run the registry test to verify RED**

Run:

```bash
npm run test -- src/domain/avg/avgRegistry.test.ts
```

Expected: FAIL because `src/domain/avg/avgRegistry.ts` does not exist.

- [ ] **Step 3: Add AVG localization key types**

Modify `src/domain/data/localize/localize.ts` after `LoadingLocalizationKey`:

```ts
export type AvgLocalizationKey =
  | 'avg.skip'
  | 'avg.speaker.yuuta'
  | 'avg.speaker.whitePriestess'
  | `avg.1-6.line${1 | 2 | 3 | 4 | 5 | 6}`
```

Add `| AvgLocalizationKey` to `LocalizationKey`:

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
  | PauseLocalizationKey
  | GameplayHudLocalizationKey
  | TouchLocalizationKey
  | GameplayStatusLocalizationKey
  | LoadingLocalizationKey
  | AvgLocalizationKey
```

- [ ] **Step 4: Implement AVG types**

Create `src/domain/avg/avgTypes.ts`:

```ts
import type { LocalizationKey } from '../data/localize/localize'

export type AvgSpeakerId = 'yuuta' | 'white-priestess'
export type AvgCharacterSide = 'left' | 'right'

export type AvgCharacter = {
  id: AvgSpeakerId
  nameKey: LocalizationKey
  portraitAssetRef: string
  side: AvgCharacterSide
}

export type AvgLine = {
  speakerId: AvgSpeakerId
  textKey: LocalizationKey
}

export type AvgSequence = {
  id: string
  characters: readonly AvgCharacter[]
  lines: readonly AvgLine[]
}

export type AvgPlaybackState =
  | { status: 'active'; sequence: AvgSequence; lineIndex: number }
  | { status: 'completed'; sequence: AvgSequence }
```

- [ ] **Step 5: Implement AVG registry**

Create `src/domain/avg/avgRegistry.ts`:

```ts
import type { StageId } from '../data/worlds/worldTypes'
import type { AvgSequence } from './avgTypes'

const firstChapterBossIntro: AvgSequence = {
  id: '1-6-intro',
  characters: [
    {
      id: 'yuuta',
      nameKey: 'avg.speaker.yuuta',
      portraitAssetRef: '/assets/avg/yuuta-dialogue.webp',
      side: 'left',
    },
    {
      id: 'white-priestess',
      nameKey: 'avg.speaker.whitePriestess',
      portraitAssetRef: '/assets/avg/white-priestess-dialogue.webp',
      side: 'right',
    },
  ],
  lines: [
    { speakerId: 'white-priestess', textKey: 'avg.1-6.line1' },
    { speakerId: 'yuuta', textKey: 'avg.1-6.line2' },
    { speakerId: 'white-priestess', textKey: 'avg.1-6.line3' },
    { speakerId: 'yuuta', textKey: 'avg.1-6.line4' },
    { speakerId: 'white-priestess', textKey: 'avg.1-6.line5' },
    { speakerId: 'yuuta', textKey: 'avg.1-6.line6' },
  ],
} as const

const stageIntroSequences = {
  '1-6': firstChapterBossIntro,
} as const satisfies Partial<Record<StageId, AvgSequence>>

export function getStageIntroSequence(stageId: StageId): AvgSequence | null {
  return stageIntroSequences[stageId] ?? null
}
```

- [ ] **Step 6: Run the registry test to verify GREEN**

Run:

```bash
npm run test -- src/domain/avg/avgRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/domain/data/localize/localize.ts src/domain/avg/avgTypes.ts src/domain/avg/avgRegistry.ts src/domain/avg/avgRegistry.test.ts
git commit -m "feat: add avg registry"
```

## Task 2: Domain AVG Playback

**Files:**
- Create: `src/domain/avg/avgPlayback.ts`
- Create: `src/domain/avg/avgPlayback.test.ts`

- [ ] **Step 1: Write the failing playback test**

Create `src/domain/avg/avgPlayback.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getStageIntroSequence } from './avgRegistry'
import {
  advanceAvgPlayback,
  createAvgPlayback,
  getActiveAvgLineView,
  isAvgPlaybackActive,
  skipAvgPlayback,
} from './avgPlayback'

const sequence = getStageIntroSequence('1-6')!

describe('AVG playback', () => {
  it('starts active at the first line', () => {
    const state = createAvgPlayback(sequence)

    expect(state).toMatchObject({ status: 'active', sequence, lineIndex: 0 })
    expect(isAvgPlaybackActive(state)).toBe(true)
    expect(getActiveAvgLineView(state)).toMatchObject({
      line: { speakerId: 'white-priestess', textKey: 'avg.1-6.line1' },
      speaker: { id: 'white-priestess' },
      lineIndex: 0,
      lineCount: 6,
    })
  })

  it('advances line by line and completes after the final line', () => {
    const line2 = advanceAvgPlayback(createAvgPlayback(sequence))
    expect(line2).toMatchObject({ status: 'active', lineIndex: 1 })
    expect(getActiveAvgLineView(line2)).toMatchObject({
      line: { speakerId: 'yuuta', textKey: 'avg.1-6.line2' },
      speaker: { id: 'yuuta' },
    })

    const completed = sequence.lines.reduce(
      (state) => advanceAvgPlayback(state),
      createAvgPlayback(sequence),
    )

    expect(completed).toEqual({ status: 'completed', sequence })
    expect(isAvgPlaybackActive(completed)).toBe(false)
    expect(getActiveAvgLineView(completed)).toBeNull()
  })

  it('skips directly to completed state', () => {
    const skipped = skipAvgPlayback(createAvgPlayback(sequence))

    expect(skipped).toEqual({ status: 'completed', sequence })
    expect(isAvgPlaybackActive(skipped)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the playback test to verify RED**

Run:

```bash
npm run test -- src/domain/avg/avgPlayback.test.ts
```

Expected: FAIL because `avgPlayback.ts` does not exist.

- [ ] **Step 3: Implement playback transitions**

Create `src/domain/avg/avgPlayback.ts`:

```ts
import type { AvgCharacter, AvgLine, AvgPlaybackState, AvgSequence } from './avgTypes'

export type ActiveAvgLineView = {
  line: AvgLine
  speaker: AvgCharacter
  lineIndex: number
  lineCount: number
}

export function createAvgPlayback(sequence: AvgSequence): AvgPlaybackState {
  return { status: 'active', sequence, lineIndex: 0 }
}

export function advanceAvgPlayback(state: AvgPlaybackState): AvgPlaybackState {
  if (state.status === 'completed') return state

  const nextLineIndex = state.lineIndex + 1
  if (nextLineIndex >= state.sequence.lines.length) {
    return { status: 'completed', sequence: state.sequence }
  }

  return { ...state, lineIndex: nextLineIndex }
}

export function skipAvgPlayback(state: AvgPlaybackState): AvgPlaybackState {
  return { status: 'completed', sequence: state.sequence }
}

export function isAvgPlaybackActive(state: AvgPlaybackState | null): boolean {
  return state?.status === 'active'
}

export function getActiveAvgLineView(state: AvgPlaybackState | null): ActiveAvgLineView | null {
  if (!state || state.status === 'completed') return null

  const line = state.sequence.lines[state.lineIndex]
  const speaker = state.sequence.characters.find((character) => character.id === line?.speakerId)
  if (!line || !speaker) return null

  return {
    line,
    speaker,
    lineIndex: state.lineIndex,
    lineCount: state.sequence.lines.length,
  }
}
```

- [ ] **Step 4: Run the playback test to verify GREEN**

Run:

```bash
npm run test -- src/domain/avg/avgPlayback.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all AVG domain tests**

Run:

```bash
npm run test -- src/domain/avg/avgRegistry.test.ts src/domain/avg/avgPlayback.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/domain/avg/avgPlayback.ts src/domain/avg/avgPlayback.test.ts
git commit -m "feat: add avg playback rules"
```

## Task 3: AVG Localization

**Files:**
- Modify: `src/domain/data/localize/localize.ts`
- Modify: `src/domain/data/localize/localize.test.ts`

- [ ] **Step 1: Write the failing localization test**

Modify `src/domain/data/localize/localize.test.ts` near the existing loading localization test:

```ts
  it('includes localized AVG values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        skip: 'Skip',
        yuuta: 'Yuuta Tsubasa',
        whitePriestess: 'White Priestess',
        lines: [
          'So, you are the one who reached the High Spire.',
          'If you are this palace’s guardian, please stand aside.',
          'I cannot. The palace light no longer recognizes those who return.',
          'Then I will prove I can pass through, in my own way.',
          'Very well. Cross my celestial rings, and show me your resolve.',
          'I will reach the exit behind you.',
        ],
      },
      ja: {
        skip: 'スキップ',
        yuuta: 'ユウタ・ツバサ',
        whitePriestess: '白の祭司',
        lines: [
          '高き尖塔へ辿り着いたのは、あなたなのですね。',
          'この宮殿の守護者なら、道を開けてください。',
          'できません。宮殿の光は、帰還者を見分けられなくなりました。',
          'ならば、自分のやり方で通れることを証明します。',
          'よいでしょう。私の星環を越え、その決意を示してください。',
          'あなたの背後にある出口へ、必ず辿り着きます。',
        ],
      },
      zhHant: {
        skip: '跳過',
        yuuta: 'Yuuta Tsubasa',
        whitePriestess: '白之祭司',
        lines: [
          '所以，抵達高塔的人是你。',
          '如果你是守護這座宮殿的人，請讓開。',
          '我不能。宮殿的光，早已不再辨認誰是歸來者。',
          '那我就用自己的方式，證明我能通過。',
          '很好。穿過我的星環，讓我看看你的決意。',
          '我會抵達你身後的出口。',
        ],
      },
      ko: {
        skip: '건너뛰기',
        yuuta: '유우타 츠바사',
        whitePriestess: '백의 사제',
        lines: [
          '높은 첨탑에 도달한 자가 바로 당신이군요.',
          '이 궁전의 수호자라면 길을 비켜 주세요.',
          '그럴 수 없습니다. 궁전의 빛은 이제 귀환자를 구별하지 못합니다.',
          '그렇다면 제 방식으로 통과할 수 있음을 증명하겠습니다.',
          '좋습니다. 제 성환을 넘어 당신의 결의를 보여 주세요.',
          '당신 뒤의 출구까지 반드시 도달하겠습니다.',
        ],
      },
    } as const

    for (const locale of localize.languages.map((language) => language.code)) {
      const expected = expectedByLocale[locale]
      expect(resolveLocalizedText(localize, locale, 'avg.skip')).toBe(expected.skip)
      expect(resolveLocalizedText(localize, locale, 'avg.speaker.yuuta')).toBe(expected.yuuta)
      expect(resolveLocalizedText(localize, locale, 'avg.speaker.whitePriestess')).toBe(expected.whitePriestess)

      expected.lines.forEach((line, index) => {
        expect(resolveLocalizedText(localize, locale, `avg.1-6.line${index + 1}` as LocalizationKey)).toBe(line)
      })
    }
  })
```

- [ ] **Step 2: Run the localization test to verify RED**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts -t "includes localized AVG values"
```

Expected: FAIL because AVG catalog data is not present yet.

- [ ] **Step 3: Add catalog values**

Modify `catalog` in `src/domain/data/localize/localize.ts`. Add these entries to each locale object near existing loading keys:

```ts
// en
'avg.skip': 'Skip',
'avg.speaker.yuuta': 'Yuuta Tsubasa',
'avg.speaker.whitePriestess': 'White Priestess',
'avg.1-6.line1': 'So, you are the one who reached the High Spire.',
'avg.1-6.line2': 'If you are this palace’s guardian, please stand aside.',
'avg.1-6.line3': 'I cannot. The palace light no longer recognizes those who return.',
'avg.1-6.line4': 'Then I will prove I can pass through, in my own way.',
'avg.1-6.line5': 'Very well. Cross my celestial rings, and show me your resolve.',
'avg.1-6.line6': 'I will reach the exit behind you.',

// ja
'avg.skip': 'スキップ',
'avg.speaker.yuuta': 'ユウタ・ツバサ',
'avg.speaker.whitePriestess': '白の祭司',
'avg.1-6.line1': '高き尖塔へ辿り着いたのは、あなたなのですね。',
'avg.1-6.line2': 'この宮殿の守護者なら、道を開けてください。',
'avg.1-6.line3': 'できません。宮殿の光は、帰還者を見分けられなくなりました。',
'avg.1-6.line4': 'ならば、自分のやり方で通れることを証明します。',
'avg.1-6.line5': 'よいでしょう。私の星環を越え、その決意を示してください。',
'avg.1-6.line6': 'あなたの背後にある出口へ、必ず辿り着きます。',

// zhHant
'avg.skip': '跳過',
'avg.speaker.yuuta': 'Yuuta Tsubasa',
'avg.speaker.whitePriestess': '白之祭司',
'avg.1-6.line1': '所以，抵達高塔的人是你。',
'avg.1-6.line2': '如果你是守護這座宮殿的人，請讓開。',
'avg.1-6.line3': '我不能。宮殿的光，早已不再辨認誰是歸來者。',
'avg.1-6.line4': '那我就用自己的方式，證明我能通過。',
'avg.1-6.line5': '很好。穿過我的星環，讓我看看你的決意。',
'avg.1-6.line6': '我會抵達你身後的出口。',

// ko
'avg.skip': '건너뛰기',
'avg.speaker.yuuta': '유우타 츠바사',
'avg.speaker.whitePriestess': '백의 사제',
'avg.1-6.line1': '높은 첨탑에 도달한 자가 바로 당신이군요.',
'avg.1-6.line2': '이 궁전의 수호자라면 길을 비켜 주세요.',
'avg.1-6.line3': '그럴 수 없습니다. 궁전의 빛은 이제 귀환자를 구별하지 못합니다.',
'avg.1-6.line4': '그렇다면 제 방식으로 통과할 수 있음을 증명하겠습니다.',
'avg.1-6.line5': '좋습니다. 제 성환을 넘어 당신의 결의를 보여 주세요.',
'avg.1-6.line6': '당신 뒤의 출구까지 반드시 도달하겠습니다.',
```

- [ ] **Step 4: Run localization test to verify GREEN**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts -t "includes localized AVG values"
```

Expected: PASS.

- [ ] **Step 5: Run AVG registry test against typed localization keys**

Run:

```bash
npm run test -- src/domain/avg/avgRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts
git commit -m "feat: add avg localization"
```

## Task 4: AVG Assets And Preload Manifest

**Files:**
- Copy: `public/assets/avg/yuuta-dialogue.webp`
- Copy: `public/assets/avg/white-priestess-dialogue.webp`
- Modify: `src/domain/assets/preloadManifest.ts`
- Modify: `src/domain/assets/preloadManifest.test.ts`

- [ ] **Step 1: Write the failing preload tests**

Modify `src/domain/assets/preloadManifest.test.ts` imports:

```ts
import { readFileSync } from 'node:fs'
```

Add tests near the boss asset test:

```ts
  it('has imported AVG portrait assets under rebuild public assets', () => {
    const avgPortraitSources = [
      '/assets/avg/yuuta-dialogue.webp',
      '/assets/avg/white-priestess-dialogue.webp',
    ]

    for (const source of avgPortraitSources) {
      expect(readFileSync(`public${source}`).length).toBeGreaterThan(0)
    }
  })

  it('includes AVG portraits in runtime sources and 1-6 gameplay entry preload plan', () => {
    const stage = getGameplayStageMap('1-6')

    expect(stage).toBeDefined()
    const runtimeSources = collectRuntimeAssetSources(projectData)
    const entrySources = buildGameplayEntryPreloadPlan(projectData, stage!).map((asset) => asset.source)

    expect(runtimeSources).toContain('/assets/avg/yuuta-dialogue.webp')
    expect(runtimeSources).toContain('/assets/avg/white-priestess-dialogue.webp')
    expect(entrySources).toContain('/assets/avg/yuuta-dialogue.webp')
    expect(entrySources).toContain('/assets/avg/white-priestess-dialogue.webp')
    expect(runtimeSources.every((source) => !source.includes('__prototype__'))).toBe(true)
  })
```

- [ ] **Step 2: Run preload tests to verify RED**

Run:

```bash
npm run test -- src/domain/assets/preloadManifest.test.ts -t "AVG"
```

Expected: FAIL because `public/assets/avg/*.webp` do not exist and manifest does not include AVG assets.

- [ ] **Step 3: Copy runtime AVG assets**

Run:

```bash
mkdir -p public/assets/avg
cp __prototype__/public/assets/avg/yuuta-dialogue.webp public/assets/avg/yuuta-dialogue.webp
cp __prototype__/public/assets/avg/white-priestess-dialogue.webp public/assets/avg/white-priestess-dialogue.webp
```

- [ ] **Step 4: Include AVG portraits in gameplay entry preload plan**

Modify `src/domain/assets/preloadManifest.ts` imports:

```ts
import { getStageIntroSequence } from '../avg/avgRegistry'
```

Add helper near `stageSources`:

```ts
function avgIntroSources(stage: GameplayStageMap): string[] {
  const sequence = getStageIntroSequence(stage.id)
  return sequence ? sequence.characters.map((character) => character.portraitAssetRef) : []
}
```

Modify `buildGameplayEntryPreloadPlan`:

```ts
export function buildGameplayEntryPreloadPlan(project: ProjectDataLike, stage: GameplayStageMap): PreloadAsset[] {
  return combinePreloadPlans(
    buildSharedGameplayPreloadPlan(),
    buildStagePreloadPlan(project, stage),
    toAssets(avgIntroSources(stage), 'stage'),
  )
}
```

Modify `collectRuntimeAssetSources` only if the test shows the runtime source collection still misses AVG portraits. Use `buildGameplayEntryPreloadPlan(project, stage)` for stage plans so stage-specific entry assets are collected:

```ts
const stagePlans = gameplayStageMaps.order.flatMap((stageId) => {
  const stage = gameplayStageMaps.items[stageId]
  return stage ? buildGameplayEntryPreloadPlan(project, stage).map((asset) => asset.source) : []
})
```

- [ ] **Step 5: Run preload tests to verify GREEN**

Run:

```bash
npm run test -- src/domain/assets/preloadManifest.test.ts -t "AVG"
```

Expected: PASS.

- [ ] **Step 6: Run all manifest tests**

Run:

```bash
npm run test -- src/domain/assets/preloadManifest.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add public/assets/avg/yuuta-dialogue.webp public/assets/avg/white-priestess-dialogue.webp src/domain/assets/preloadManifest.ts src/domain/assets/preloadManifest.test.ts
git commit -m "feat: preload avg portraits"
```

## Task 5: AVG Overlay UI

**Files:**
- Create: `src/ui/avg/AvgOverlay.svelte`
- Create: `src/ui/avg/avgOverlayUi.test.ts`

- [ ] **Step 1: Write the failing UI source-contract test**

Create `src/ui/avg/avgOverlayUi.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import source from './AvgOverlay.svelte?raw'

describe('AvgOverlay UI', () => {
  it('is presentation-only and receives AVG data through props', () => {
    expect(source).toContain('sequence:')
    expect(source).toContain('playback:')
    expect(source).toContain('localizeData:')
    expect(source).toContain('locale:')
    expect(source).toContain('onAdvance:')
    expect(source).toContain('onSkip:')
    expect(source).toContain('getActiveAvgLineView')
    expect(source).not.toContain('createGameplayRenderer')
    expect(source).not.toContain('createBrowserAssetPreloader')
    expect(source).not.toContain('localStorage')
    expect(source).not.toContain('appState')
    expect(source).not.toContain('window.dispatchEvent')
  })

  it('renders the approved AVG overlay visual structure', () => {
    expect(source).toContain('avg-overlay')
    expect(source).toContain('avg-veil')
    expect(source).toContain('avg-advance')
    expect(source).toContain('avg-character')
    expect(source).toContain('avg-skip')
    expect(source).toContain('avg-name')
    expect(source).toContain('avg-dialogue')
    expect(source).toContain('avg-progress')
    expect(source).toContain('avg-next')
  })
})
```

- [ ] **Step 2: Run UI test to verify RED**

Run:

```bash
npm run test -- src/ui/avg/avgOverlayUi.test.ts
```

Expected: FAIL because `AvgOverlay.svelte` does not exist.

- [ ] **Step 3: Implement `AvgOverlay.svelte`**

Create `src/ui/avg/AvgOverlay.svelte`:

```svelte
<script lang="ts">
  import {
    getActiveAvgLineView,
  } from '../../domain/avg/avgPlayback'
  import type { AvgPlaybackState, AvgSequence } from '../../domain/avg/avgTypes'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizeData,
  } from '../../domain/data/localize/localize'

  type Props = {
    sequence: AvgSequence
    playback: AvgPlaybackState
    localizeData: LocalizeData
    locale: LocaleCode
    onAdvance: () => void
    onSkip: () => void
  }

  let { sequence, playback, localizeData, locale, onAdvance, onSkip }: Props = $props()

  const activeLine = $derived(getActiveAvgLineView(playback))

  function text(key: Parameters<typeof resolveLocalizedText>[2]): string {
    return resolveLocalizedText(localizeData, locale, key)
  }
</script>

{#if activeLine}
  <section class="avg-overlay" aria-label={text('avg.speaker.whitePriestess')}>
    <div class="avg-veil" aria-hidden="true"></div>
    <button class="avg-advance" type="button" aria-label={text('common.confirm')} onclick={onAdvance}></button>

    {#each sequence.characters as character}
      <img
        class:active={character.id === activeLine.speaker.id}
        class:left={character.side === 'left'}
        class:right={character.side === 'right'}
        class="avg-character"
        src={character.portraitAssetRef}
        alt={text(character.nameKey)}
      />
    {/each}

    <button
      class="avg-skip"
      type="button"
      aria-label={text('avg.skip')}
      onclick={(event) => {
        event.stopPropagation()
        onSkip()
      }}
    >
      {text('avg.skip')}
    </button>

    <div class="avg-name">{text(activeLine.speaker.nameKey)}</div>
    <div class="avg-dialogue">
      <p>{text(activeLine.line.textKey)}</p>
      <div class="avg-progress" aria-hidden="true">
        {#each sequence.lines as _, index}
          <i class:active={index <= activeLine.lineIndex}></i>
        {/each}
      </div>
      <span class="avg-next" aria-hidden="true">▼</span>
    </div>
  </section>
{/if}
```

- [ ] **Step 4: Add component styles**

Append to `AvgOverlay.svelte`:

```svelte
<style>
  .avg-overlay {
    position: absolute;
    inset: 0;
    z-index: 70;
    overflow: hidden;
    color: #17324f;
    cursor: pointer;
    pointer-events: auto;
    animation: avg-overlay-in 360ms ease-out both;
  }

  .avg-veil {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(7, 22, 46, 0.16), transparent 48%),
      linear-gradient(0deg, rgba(4, 13, 29, 0.72), transparent 52%);
    backdrop-filter: saturate(0.72) brightness(0.82);
  }

  .avg-advance {
    position: absolute;
    inset: 0;
    z-index: 1;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .avg-character {
    position: absolute;
    bottom: 12cqh;
    z-index: 2;
    width: 35cqw;
    height: 82cqh;
    object-fit: contain;
    object-position: bottom;
    opacity: 0.44;
    filter: brightness(0.68) saturate(0.62);
    transform: translateY(1.8cqh) scale(0.96);
    transition: opacity 240ms ease, filter 240ms ease, transform 240ms ease;
    pointer-events: none;
  }

  .avg-character.left {
    left: 3cqw;
  }

  .avg-character.right {
    right: 1.5cqw;
  }

  .avg-character.active {
    opacity: 1;
    filter: brightness(1) saturate(1);
    transform: translateY(0) scale(1);
  }

  .avg-dialogue {
    position: absolute;
    right: 4cqw;
    bottom: 4.5cqh;
    left: 4cqw;
    z-index: 2;
    min-height: 18cqh;
    padding: 5.2cqh 5cqw 3.3cqh;
    border: 1px solid rgba(141, 205, 245, 0.9);
    background:
      linear-gradient(105deg, rgba(247, 253, 255, 0.97), rgba(218, 241, 255, 0.94) 68%, rgba(244, 251, 255, 0.96));
    box-shadow:
      inset 0 0 0 0.35cqw rgba(255, 255, 255, 0.48),
      0 1.2cqh 4cqh rgba(3, 18, 42, 0.48);
    clip-path: polygon(1.6% 0, 98.4% 0, 100% 14%, 100% 86%, 98.4% 100%, 1.6% 100%, 0 86%, 0 14%);
    animation: avg-dialogue-in 320ms 100ms ease-out both;
    pointer-events: none;
  }

  .avg-dialogue::before,
  .avg-dialogue::after {
    position: absolute;
    right: 1cqw;
    left: 1cqw;
    height: 1px;
    content: "";
    background: linear-gradient(90deg, transparent, #5caee3 12%, #d6a94e 50%, #5caee3 88%, transparent);
  }

  .avg-dialogue::before {
    top: 1.25cqh;
  }

  .avg-dialogue::after {
    bottom: 1.25cqh;
  }

  .avg-name {
    position: absolute;
    bottom: 23.3cqh;
    left: 7.2cqw;
    z-index: 3;
    min-width: 18cqw;
    padding: 0.7cqh 2cqw;
    color: white;
    background: linear-gradient(180deg, #4a9ce0, #235b9d);
    box-shadow: 0 0.5cqh 1.6cqh rgba(18, 66, 116, 0.35);
    clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%);
    font-size: min(1.15cqw, 22px);
    font-weight: 700;
    text-align: center;
  }

  .avg-dialogue p {
    max-width: 75cqw;
    margin: 0;
    color: #193a5e;
    font-size: min(1.25cqw, 24px);
    font-weight: 600;
    line-height: 1.5;
  }

  .avg-progress {
    position: absolute;
    bottom: 2cqh;
    left: 5cqw;
    display: flex;
    gap: 0.35cqw;
  }

  .avg-progress i {
    width: 1.4cqw;
    height: 0.25cqh;
    background: rgba(55, 111, 166, 0.22);
  }

  .avg-progress i.active {
    background: #d6a94e;
  }

  .avg-next {
    position: absolute;
    right: 3cqw;
    bottom: 2.1cqh;
    color: #2c73b3;
    font-size: min(1cqw, 20px);
    animation: avg-next-pulse 700ms ease-in-out infinite alternate;
  }

  .avg-skip {
    position: absolute;
    top: 3cqh;
    right: 2cqw;
    z-index: 3;
    padding: 0.45cqh 1.1cqw;
    border: 1px solid rgba(199, 227, 247, 0.72);
    background: rgba(15, 49, 86, 0.62);
    color: rgba(255, 255, 255, 0.82);
    font-size: min(0.7cqw, 14px);
    font-weight: 700;
    cursor: pointer;
  }

  .avg-skip:hover,
  .avg-skip:focus-visible {
    background: rgba(247, 253, 255, 0.95);
    color: #17324f;
  }

  @keyframes avg-overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes avg-dialogue-in {
    from { opacity: 0; transform: translateY(3cqh); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes avg-next-pulse {
    from { opacity: 0.42; transform: translateY(-0.25cqh); }
    to { opacity: 1; transform: translateY(0.25cqh); }
  }
</style>
```

- [ ] **Step 5: Run UI source-contract test to verify GREEN**

Run:

```bash
npm run test -- src/ui/avg/avgOverlayUi.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run Svelte check for component typing**

Run:

```bash
npm run check
```

Expected: PASS with `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/ui/avg/AvgOverlay.svelte src/ui/avg/avgOverlayUi.test.ts
git commit -m "feat: add avg overlay"
```

## Task 6: GameplayScreen AVG Integration

**Files:**
- Modify: `src/ui/gameplay/GameplayScreen.svelte`
- Create: `src/ui/gameplay/gameplayAvgWiring.test.ts`

- [ ] **Step 1: Write failing GameplayScreen source-contract tests**

Create `src/ui/gameplay/gameplayAvgWiring.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import source from './GameplayScreen.svelte?raw'

describe('GameplayScreen AVG wiring', () => {
  it('creates stage intro AVG state from the domain registry', () => {
    expect(source).toContain("import AvgOverlay from '../avg/AvgOverlay.svelte'")
    expect(source).toContain("import { getStageIntroSequence } from '../../domain/avg/avgRegistry'")
    expect(source).toContain('createAvgPlayback(stageIntroSequence)')
    expect(source).toContain('let avgPlayback = $state')
  })

  it('routes AVG control intents before pause or gameplay controls', () => {
    const keydownAvgIndex = source.indexOf('handleAvgControlIntent(intent)')
    const pauseIntentIndex = source.indexOf('handlePauseControlIntent(intent)')
    const resultIntentIndex = source.indexOf('handleResultControlIntent(intent)')

    expect(source).toContain('function handleAvgControlIntent(intent: ControlIntent): boolean')
    expect(keydownAvgIndex).toBeGreaterThan(-1)
    expect(pauseIntentIndex).toBeGreaterThan(keydownAvgIndex)
    expect(resultIntentIndex).toBeGreaterThan(-1)
  })

  it('pauses and resumes the renderer through local reactive AVG state', () => {
    expect(source).toContain('if (isAvgPlaybackActive(avgPlayback))')
    expect(source).toContain('renderer.pause()')
    expect(source).toContain('renderer.resume()')
    expect(source).toContain('renderer.resetTiming()')
    expect(source).not.toContain('projectrun:avg-state')
    expect(source).not.toContain('window.dispatchEvent')
  })

  it('renders AVG overlay and hides virtual controls while AVG is active', () => {
    const overlayIndex = source.indexOf('<AvgOverlay')
    const virtualControlsIndex = source.indexOf('<VirtualControls')

    expect(overlayIndex).toBeGreaterThan(-1)
    expect(virtualControlsIndex).toBeGreaterThan(overlayIndex)
    expect(source).toContain('!isAvgPlaybackActive(avgPlayback)')
    expect(source).toMatch(/virtualControlsState\.visible && isGameplayPlayable\(\) && !isAvgPlaybackActive\(avgPlayback\)/)
  })
})
```

- [ ] **Step 2: Run GameplayScreen source-contract tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayAvgWiring.test.ts
```

Expected: FAIL because GameplayScreen has no AVG imports or state.

- [ ] **Step 3: Import AVG modules and component**

Modify `src/ui/gameplay/GameplayScreen.svelte` imports:

```ts
  import {
    advanceAvgPlayback,
    createAvgPlayback,
    isAvgPlaybackActive,
    skipAvgPlayback,
  } from '../../domain/avg/avgPlayback'
  import { getStageIntroSequence } from '../../domain/avg/avgRegistry'
  import type { AvgPlaybackState } from '../../domain/avg/avgTypes'
  import AvgOverlay from '../avg/AvgOverlay.svelte'
```

- [ ] **Step 4: Add AVG reactive state and helper functions**

Add near existing state declarations:

```ts
  const stageIntroSequence = getStageIntroSequence(stage.id)
  let avgPlayback = $state<AvgPlaybackState | null>(
    stageIntroSequence ? createAvgPlayback(stageIntroSequence) : null,
  )
  let rendererPausedForAvg = false
```

Add helper functions near `isGameplayPlayable`:

```ts
  function finishAvgPlayback(nextPlayback: AvgPlaybackState): void {
    avgPlayback = nextPlayback
  }

  function advanceAvg(): void {
    if (!avgPlayback) return
    finishAvgPlayback(advanceAvgPlayback(avgPlayback))
  }

  function skipAvg(): void {
    if (!avgPlayback) return
    finishAvgPlayback(skipAvgPlayback(avgPlayback))
  }

  function handleAvgControlIntent(intent: ControlIntent): boolean {
    if (!isAvgPlaybackActive(avgPlayback)) return false
    if (intent === 'confirm') {
      advanceAvg()
      return true
    }
    if (intent === 'back') {
      skipAvg()
      return true
    }
    return true
  }
```

Modify `isGameplayPlayable`:

```ts
  function isGameplayPlayable(): boolean {
    return pauseState.mode === 'playing' && !hudState?.result && !isAvgPlaybackActive(avgPlayback)
  }
```

- [ ] **Step 5: Add renderer pause/resume effect**

Add after existing music `$effect`:

```ts
  $effect(() => {
    if (!renderer) return

    if (isAvgPlaybackActive(avgPlayback)) {
      if (!rendererPausedForAvg) {
        renderer.pause()
        rendererPausedForAvg = true
      }
      return
    }

    if (rendererPausedForAvg) {
      renderer.resume()
      renderer.resetTiming()
      rendererPausedForAvg = false
    }
  })
```

- [ ] **Step 6: Route keyboard controls through AVG first**

In `handleKeydown`, after result/settings branches and before pause menu context, insert:

```ts
    const avgIntent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      'stage-select',
    )
    if (avgIntent && handleAvgControlIntent(avgIntent)) {
      event.preventDefault()
      return
    }
```

This uses `stage-select` context so confirm/back are both recognized while the overlay is active.

- [ ] **Step 7: Route gamepad controls through AVG first**

In `pollGamepad`, update context derivation so AVG active uses `stage-select`:

```ts
      const context = isAvgPlaybackActive(avgPlayback)
        ? 'stage-select'
        : hudState?.result
          ? 'stage-select'
          : pauseState.mode === 'paused'
            ? 'gameplay-pause-menu'
            : pauseState.mode === 'settings'
              ? pauseSettingsControlContext()
              : 'gameplay-active'
```

Update intent loop:

```ts
      for (const intent of intents) {
        if (handleAvgControlIntent(intent)) {
          continue
        }
        if (hudState?.result) {
          handleResultControlIntent(intent)
        } else if (pauseState.mode === 'settings') {
          handlePauseSettingsControlIntent(intent)
        } else {
          handlePauseControlIntent(intent)
        }
      }
```

- [ ] **Step 8: Render AVG overlay and gate virtual controls**

In the markup after pause/settings/result overlays and before virtual controls, add:

```svelte
    {#if stageIntroSequence && avgPlayback && isAvgPlaybackActive(avgPlayback)}
      <AvgOverlay
        sequence={stageIntroSequence}
        playback={avgPlayback}
        {localizeData}
        {locale}
        onAdvance={advanceAvg}
        onSkip={skipAvg}
      />
    {/if}
```

Modify the virtual controls condition:

```svelte
    {#if virtualControlsState.visible && isGameplayPlayable() && !isAvgPlaybackActive(avgPlayback)}
```

- [ ] **Step 9: Run GameplayScreen source-contract tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayAvgWiring.test.ts
```

Expected: PASS.

- [ ] **Step 10: Run Svelte check**

Run:

```bash
npm run check
```

Expected: PASS with `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 11: Commit Task 6**

```bash
git add src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayAvgWiring.test.ts
git commit -m "feat: wire avg into gameplay"
```

## Task 7: Full Verification And Review Prep

**Files:**
- No new production files.
- Run verification and inspect final diff.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS with all test files and tests passing.

- [ ] **Step 2: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS with `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Existing Vite chunk size warnings are acceptable if no new build errors appear.

- [ ] **Step 4: Run whitespace sanity check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Inspect final status and diff**

Run:

```bash
git status --short --branch
git log --oneline --max-count=8
```

Expected: branch `codex/avg-system`; only expected tracked changes are committed. Existing untracked `pnpm-lock.yaml` may remain untracked and must not be staged.

- [ ] **Step 6: Prepare review summary**

Summarize:

- Domain AVG registry and playback state.
- Localization and assets imported under rebuild paths.
- Preload manifest inclusion for `1-6`.
- Presentation-only AVG overlay.
- GameplayScreen pause/resume/resetTiming integration.
- Verification command outputs.

Do not mark the goal complete until the implemented branch proves every spec requirement and the user has reviewed the running behavior or explicitly accepts test evidence.

## Self-Review Notes

- Spec coverage: all included scope items map to Tasks 1-7.
- No persistent seen-state, post-boss-clear AVG, choices, auto-advance, typewriter, backlog, voice, or Phaser-owned AVG state is planned.
- Type names are consistent across tasks: `AvgSpeakerId`, `AvgCharacter`, `AvgLine`, `AvgSequence`, `AvgPlaybackState`, `getStageIntroSequence`, `createAvgPlayback`, `advanceAvgPlayback`, `skipAvgPlayback`, `getActiveAvgLineView`, and `isAvgPlaybackActive`.
- The plan keeps prototype references read-only and copies only runtime `.webp` assets into `public/assets/avg/`.
