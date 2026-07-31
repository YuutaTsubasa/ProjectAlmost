# Preloading Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a rebuild-native asset preloading system with a Loading screen so Title and Gameplay do not become interactive before required assets are loaded.

**Architecture:** Keep asset planning pure under `src/domain/assets/`, browser loading and progress state under `src/application/assets/`, and presentation in `src/ui/loading/LoadingScreen.svelte`. `App.svelte` remains the reactive coordinator that gates boot and gameplay entry without moving asset policy into UI components.

**Tech Stack:** TypeScript, Svelte 5 runes, Vitest, browser `Image`/`fetch` APIs, existing project data/domain metadata.

---

## File Structure

- Create `src/domain/assets/preloadManifest.ts`: typed asset records, plan builders, de-duplication, runtime path assertions.
- Create `src/domain/assets/preloadManifest.test.ts`: domain coverage for boot/shared/stage plans.
- Create `src/application/assets/preloadProgress.ts`: pure progress presenter and loading state helpers.
- Create `src/application/assets/preloadProgress.test.ts`: progress and warning-count tests.
- Create `src/application/assets/browserAssetPreloader.ts`: browser adapter with cache, pending reuse, concurrency, timeout, non-fatal errors, and background preload.
- Create `src/application/assets/browserAssetPreloader.test.ts`: fake browser loader tests for success, failure, cache, pending reuse, and progress.
- Create `src/ui/loading/LoadingScreen.svelte`: presentation-only loading UI.
- Create `src/ui/loading/loadingScreenUi.test.ts`: source contract for props and no app-flow mutation.
- Modify `src/domain/data/localize/localize.ts`: add loading localization keys.
- Modify `src/domain/data/localize/localize.test.ts`: verify loading localization keys.
- Modify `src/App.svelte`: boot Loading gate, gameplay-entry preload gate, background preload hooks, and source contract targets.
- Create `src/application/assets/appPreloadWiring.test.ts`: App source contract proving gameplay entry routes through preload gate.
- Modify `src/app.css`: Loading screen visual styles.

## Task 1: Domain Asset Manifest And Plans

**Files:**
- Create: `src/domain/assets/preloadManifest.ts`
- Create: `src/domain/assets/preloadManifest.test.ts`

- [ ] **Step 1: Write failing domain manifest tests**

```ts
import { describe, expect, it } from 'vitest'
import { projectData } from '../data/projectData'
import { getGameplayStageMap } from '../gameplay/gameplayStageMaps'
import {
  buildBootPreloadPlan,
  buildSharedGameplayPreloadPlan,
  buildStagePreloadPlan,
  collectRuntimeAssetSources,
} from './preloadManifest'

describe('preload manifest', () => {
  it('collects only rebuild-owned runtime asset paths', () => {
    const sources = collectRuntimeAssetSources(projectData)

    expect(sources.length).toBeGreaterThan(40)
    expect(sources.every((source) => source.startsWith('/assets/'))).toBe(true)
    expect(sources.every((source) => !source.includes('__prototype__'))).toBe(true)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('builds a boot plan with title, font, ui sfx, title music, and world select assets', () => {
    const plan = buildBootPreloadPlan(projectData)
    const sources = plan.map((asset) => asset.source)

    expect(sources).toContain('/assets/title/project-almost-title-background.webp')
    expect(sources).toContain('/assets/audio/titlescreen.mp3')
    expect(sources).toContain('/assets/audio/sfx/ui-confirm.wav')
    expect(sources).toContain('/assets/fonts/rajdhani-latin-700.woff2')
    expect(sources).toContain('/assets/maps/white_palace_stage_select.webp')
    expect(sources).toContain('/assets/maps/abyssal_hollow_stage_select.webp')
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('builds a shared gameplay plan with common player, prop, hud, tile, sfx, and result assets', () => {
    const plan = buildSharedGameplayPreloadPlan()
    const sources = plan.map((asset) => asset.source)

    expect(sources).toContain('/assets/sprites/player_idle/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/enemy_guard_walk/sheet-transparent.webp')
    expect(sources).toContain('/assets/props/white_palace_checkpoint.webp')
    expect(sources).toContain('/assets/hud/player-portrait.webp')
    expect(sources).toContain('/assets/results/yuuta-stage-result-standee.webp')
    expect(sources).toContain('/assets/tiles/white_palace_platform_tiles.webp')
    expect(sources).toContain('/assets/audio/sfx/hit.wav')
    expect(sources).toContain('/assets/audio/game_result.mp3')
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('builds a stage plan with selected stage visuals and world music', () => {
    const stage = getGameplayStageMap('2-1')

    expect(stage).toBeDefined()
    const plan = buildStagePreloadPlan(projectData, stage!)
    const sources = plan.map((asset) => asset.source)

    expect(sources).toContain('/assets/maps/emerald_sanctuary_sky.webp')
    expect(sources).toContain('/assets/maps/emerald_sanctuary_far_bg.webp')
    expect(sources).toContain('/assets/maps/emerald_sanctuary_mid_bg_loop.webp')
    expect(sources).toContain('/assets/tiles/emerald_sanctuary_platform_tiles_surface_aligned.webp')
    expect(sources).toContain('/assets/audio/world02_bgm.mp3')
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('includes boss assets and boss music for boss stages', () => {
    const stage = getGameplayStageMap('1-6')

    expect(stage).toBeDefined()
    const sources = buildStagePreloadPlan(projectData, stage!).map((asset) => asset.source)

    expect(sources).toContain('/assets/sprites/boss_priestess_cast/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/boss_priestess_hurt/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/boss_priestess_death/sheet-transparent.webp')
    expect(sources).toContain('/assets/audio/world01_boss.mp3')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/domain/assets/preloadManifest.test.ts`

Expected: FAIL because `src/domain/assets/preloadManifest.ts` does not exist.

- [ ] **Step 3: Implement minimal pure manifest**

Create `src/domain/assets/preloadManifest.ts` with typed records, helpers that import existing domain metadata, and functions named in the tests. Use `kind` values `'image' | 'spritesheet' | 'audio' | 'font'`, and stable `group` values `'boot' | 'shared-gameplay' | 'stage'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/domain/assets/preloadManifest.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/assets/preloadManifest.ts src/domain/assets/preloadManifest.test.ts
git commit -m "feat: add asset preload manifest"
```

## Task 2: Progress State And Browser Asset Preloader

**Files:**
- Create: `src/application/assets/preloadProgress.ts`
- Create: `src/application/assets/preloadProgress.test.ts`
- Create: `src/application/assets/browserAssetPreloader.ts`
- Create: `src/application/assets/browserAssetPreloader.test.ts`

- [ ] **Step 1: Write failing progress tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  createInitialPreloadProgress,
  presentPreloadProgress,
  recordPreloadFailure,
  recordPreloadSuccess,
} from './preloadProgress'

describe('preload progress presenter', () => {
  it('reports completed, total, percent, and warning count', () => {
    const initial = createInitialPreloadProgress(4, 'boot')
    const afterSuccess = recordPreloadSuccess(initial, '/assets/title/project-almost-title-background.webp')
    const afterFailure = recordPreloadFailure(afterSuccess, {
      source: '/assets/audio/missing.mp3',
      kind: 'audio',
      message: '404 Not Found',
    })

    expect(presentPreloadProgress(afterFailure)).toEqual({
      phase: 'boot',
      completed: 2,
      total: 4,
      percent: 50,
      warningCount: 1,
      status: 'loading',
    })
  })

  it('marks a completed plan with failures as ready-with-errors', () => {
    const state = recordPreloadFailure(createInitialPreloadProgress(1, 'gameplay'), {
      source: '/assets/audio/missing.mp3',
      kind: 'audio',
      message: '404 Not Found',
    })

    expect(presentPreloadProgress(state).status).toBe('ready-with-errors')
  })
})
```

- [ ] **Step 2: Run progress test to verify it fails**

Run: `npm run test -- src/application/assets/preloadProgress.test.ts`

Expected: FAIL because `preloadProgress.ts` does not exist.

- [ ] **Step 3: Implement pure progress helpers**

Create `src/application/assets/preloadProgress.ts` with immutable state updates. Clamp percent to `0..100`, return `ready` when completed equals total and there are no failures, and return `ready-with-errors` when failures exist.

- [ ] **Step 4: Run progress test to verify it passes**

Run: `npm run test -- src/application/assets/preloadProgress.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing browser preloader tests**

```ts
import { describe, expect, it } from 'vitest'
import type { PreloadAsset } from '../../domain/assets/preloadManifest'
import { createBrowserAssetPreloader } from './browserAssetPreloader'

const imageAsset: PreloadAsset = {
  id: 'title-background',
  source: '/assets/title/project-almost-title-background.webp',
  kind: 'image',
  group: 'boot',
}

describe('browser asset preloader', () => {
  it('reports progress and treats failed assets as non-fatal warnings', async () => {
    const progress: number[] = []
    const preloader = createBrowserAssetPreloader({
      loadSource: async (asset) => {
        if (asset.source.includes('missing')) throw new Error('404 Not Found')
      },
    })

    const result = await preloader.preload([
      imageAsset,
      { ...imageAsset, id: 'missing-audio', source: '/assets/audio/missing.mp3', kind: 'audio' },
    ], {
      phase: 'boot',
      onProgress: (snapshot) => progress.push(snapshot.completed),
    })

    expect(result.status).toBe('ready-with-errors')
    expect(result.failures).toEqual([
      { source: '/assets/audio/missing.mp3', kind: 'audio', message: '404 Not Found' },
    ])
    expect(progress).toEqual([1, 2])
  })

  it('reuses completed and pending sources', async () => {
    let calls = 0
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const preloader = createBrowserAssetPreloader({
      loadSource: async () => {
        calls += 1
        await pending
      },
    })

    const first = preloader.preload([imageAsset], { phase: 'boot' })
    const second = preloader.preload([imageAsset], { phase: 'boot' })
    release()
    await Promise.all([first, second])
    await preloader.preload([imageAsset], { phase: 'boot' })

    expect(calls).toBe(1)
  })
})
```

- [ ] **Step 6: Run browser preloader test to verify it fails**

Run: `npm run test -- src/application/assets/browserAssetPreloader.test.ts`

Expected: FAIL because `browserAssetPreloader.ts` does not exist.

- [ ] **Step 7: Implement browser preloader adapter**

Create `src/application/assets/browserAssetPreloader.ts`. Export `createBrowserAssetPreloader(options?)` with `preload(assets, options)` and `preloadInBackground(assets)`. Keep `loadSource` injectable for tests; default implementation should use `Image.decode()` for images/spritesheets and `fetch(source, { cache: 'force-cache' })` for audio/font files.

- [ ] **Step 8: Run focused asset application tests**

Run: `npm run test -- src/application/assets/preloadProgress.test.ts src/application/assets/browserAssetPreloader.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/application/assets/preloadProgress.ts src/application/assets/preloadProgress.test.ts src/application/assets/browserAssetPreloader.ts src/application/assets/browserAssetPreloader.test.ts
git commit -m "feat: add browser asset preloader"
```

## Task 3: Loading Localization And Presentation

**Files:**
- Modify: `src/domain/data/localize/localize.ts`
- Modify: `src/domain/data/localize/localize.test.ts`
- Create: `src/ui/loading/LoadingScreen.svelte`
- Create: `src/ui/loading/loadingScreenUi.test.ts`
- Modify: `src/app.css`

- [ ] **Step 1: Write failing localization tests**

Add expectations for:

```ts
expect(resolveLocalizedText(localize, 'en', 'loading.title')).toBe('Loading')
expect(resolveLocalizedText(localize, 'en', 'loading.phase.boot')).toBe('Preparing system assets')
expect(resolveLocalizedText(localize, 'en', 'loading.phase.gameplay')).toBe('Preparing stage assets')
expect(resolveLocalizedText(localize, 'en', 'loading.warning')).toBe('Some assets could not be prepared')
```

Run: `npm run test -- src/domain/data/localize/localize.test.ts`

Expected: FAIL because loading keys do not exist.

- [ ] **Step 2: Implement loading localization keys**

Add `LoadingLocalizationKey` or extend the existing union consistently with local patterns. Add English, Japanese, Traditional Chinese, and Korean values, keeping visible text localizable.

- [ ] **Step 3: Run localization tests**

Run: `npm run test -- src/domain/data/localize/localize.test.ts`

Expected: PASS.

- [ ] **Step 4: Write failing LoadingScreen source contract**

```ts
import { describe, expect, it } from 'vitest'
import source from './LoadingScreen.svelte?raw'

describe('LoadingScreen UI', () => {
  it('is presentation-only and renders progress inputs', () => {
    expect(source).toContain('progress:')
    expect(source).toContain('phaseLabel:')
    expect(source).toContain('productName:')
    expect(source).toContain('warningLabel:')
    expect(source).toContain('aria-valuenow={progress.percent}')
    expect(source).not.toContain('appState')
    expect(source).not.toContain('onControlIntent')
    expect(source).not.toContain('createBrowserAssetPreloader')
  })
})
```

Run: `npm run test -- src/ui/loading/loadingScreenUi.test.ts`

Expected: FAIL because LoadingScreen does not exist.

- [ ] **Step 5: Implement LoadingScreen and CSS**

Create `src/ui/loading/LoadingScreen.svelte` with typed props:

```ts
type LoadingProgressView = {
  completed: number
  total: number
  percent: number
  warningCount: number
  status: 'idle' | 'loading' | 'ready' | 'ready-with-errors'
}
```

Render product name, localized title/phase, a progress bar, numeric percent, and warning label only when `warningCount > 0`. Add `.loading-screen` rules to `src/app.css` with restrained prototype-adjacent visual treatment.

- [ ] **Step 6: Run Loading UI tests**

Run: `npm run test -- src/ui/loading/loadingScreenUi.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts src/ui/loading/LoadingScreen.svelte src/ui/loading/loadingScreenUi.test.ts src/app.css
git commit -m "feat: add loading screen presentation"
```

## Task 4: App Boot And Gameplay Preload Gates

**Files:**
- Modify: `src/App.svelte`
- Create: `src/application/assets/appPreloadWiring.test.ts`

- [ ] **Step 1: Write failing App source contract test**

```ts
import { describe, expect, it } from 'vitest'
import appSource from '../../App.svelte?raw'

describe('App preload wiring', () => {
  it('renders LoadingScreen before boot is ready', () => {
    expect(appSource).toContain("import LoadingScreen from './ui/loading/LoadingScreen.svelte'")
    expect(appSource).toContain('bootPreloadView')
    expect(appSource).toContain('LoadingScreen')
  })

  it('routes gameplay entry through preload gate before mutating to gameplay', () => {
    expect(appSource).toContain('async function preloadGameplayEntry')
    expect(appSource).toContain('buildStagePreloadPlan(projectData, stage)')
    expect(appSource).toContain('buildSharedGameplayPreloadPlan()')
    expect(appSource).toContain('await preloadGameplayEntry(nextState.screen)')
    expect(appSource).toContain('handleConfirmStage')
    expect(appSource).toContain('handleRetryGameplayStage')
    expect(appSource).toContain('handleNextGameplayStage')
  })
})
```

Run: `npm run test -- src/application/assets/appPreloadWiring.test.ts`

Expected: FAIL because App does not import LoadingScreen or preload gate functions.

- [ ] **Step 2: Implement boot Loading state in App**

In `App.svelte`, instantiate a preloader, `bootPreloadView`, and `activeLoadingPhase`. On mount, start `preloader.preload(buildBootPreloadPlan(projectData), { phase: 'boot', onProgress })`. Render `LoadingScreen` while boot is not ready; after ready, render existing Title/World/Gameplay routes.

- [ ] **Step 3: Implement gameplay preload gate in App**

Add `async function preloadGameplayEntry(nextScreen: typeof appState.screen)` that no-ops unless `nextScreen.type === 'gameplay'`, resolves the stage map, builds `buildSharedGameplayPreloadPlan() + buildStagePreloadPlan(projectData, stage)`, updates Loading state, awaits preloader, then returns. Call it before screen mutation in stage confirm, retry, and next-stage flows.

- [ ] **Step 4: Add background preloading hooks**

When World Select or Stage Select selection changes, call `preloader.preloadInBackground(buildStagePreloadPlan(...))` for the highlighted selected stage/world representative where available. Do not block selection movement.

- [ ] **Step 5: Run App wiring test**

Run: `npm run test -- src/application/assets/appPreloadWiring.test.ts`

Expected: PASS.

- [ ] **Step 6: Run focused integration-adjacent tests**

Run: `npm run test -- src/application/assets src/domain/assets src/ui/loading`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte src/application/assets/appPreloadWiring.test.ts
git commit -m "feat: gate app screens on asset preloading"
```

## Task 5: Verification And Browser Check

**Files:**
- No planned source edits unless verification exposes a defect.

- [ ] **Step 1: Run full tests**

Run: `npm run test`

Expected: all tests pass.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run: `npm run check`

Expected: `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: build succeeds. Existing Vite chunk-size warning is acceptable if unchanged.

- [ ] **Step 4: Run whitespace check**

Run: `git diff --check`

Expected: no output.

- [ ] **Step 5: Browser verification**

Start the dev server if needed:

```bash
npm run dev -- --host 127.0.0.1 --port 62262
```

Verify:

- first render shows Loading before Title
- Title appears after boot preload
- confirming a stage shows Loading before Gameplay
- returning/retrying an already loaded stage does not show missing textures

- [ ] **Step 6: Commit any verification fixes**

If verification requires edits, commit them with:

```bash
git add docs/superpowers/plans/2026-07-31-preloading-assets.md src/domain/assets/preloadManifest.ts src/domain/assets/preloadManifest.test.ts src/application/assets/preloadProgress.ts src/application/assets/preloadProgress.test.ts src/application/assets/browserAssetPreloader.ts src/application/assets/browserAssetPreloader.test.ts src/ui/loading/LoadingScreen.svelte src/ui/loading/loadingScreenUi.test.ts src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts src/App.svelte src/application/assets/appPreloadWiring.test.ts src/app.css
git commit -m "fix: polish preloading verification issues"
```

## Self-Review

- Spec coverage: Tasks 1-4 cover manifest/plans, browser adapter, Loading UI, boot gate, gameplay gate, background preload, non-fatal errors, localization, and App source contracts. Task 5 covers required verification.
- Placeholder scan: no TODO/TBD placeholders; every task names files, tests, commands, and expected results.
- Type consistency: `PreloadAsset`, `buildBootPreloadPlan`, `buildSharedGameplayPreloadPlan`, `buildStagePreloadPlan`, `createBrowserAssetPreloader`, `presentPreloadProgress`, and `LoadingScreen` names are used consistently across tasks.
