# Scene Transition System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a centralized scene transition system and world-aware shell backdrop fill that matches the prototype's screen-change feel without copying prototype runtime code.

**Architecture:** Add pure application policies for transition decisions and shell backdrop resolution, then wire them through `App.svelte` as the browser-side coordinator. Render the active transition through a presentation-only Svelte overlay and CSS, keeping screen components free of cross-screen transition logic.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Vite, CSS animations, existing app-flow/application/domain modules.

---

## File Structure

- `src/application/sceneTransition/sceneTransitionPolicy.ts`: pure transition phase/style types, timing constants, style resolution, reentry guard helpers.
- `src/application/sceneTransition/sceneTransitionPolicy.test.ts`: TDD coverage for style mapping, timing, and reentry decisions.
- `src/application/shell/shellBackdrop.ts`: pure shell backdrop resolver for screen/world/stage context.
- `src/application/shell/shellBackdrop.test.ts`: TDD coverage for title, world select, stage select, gameplay, settings fallback, and missing-world fallback.
- `src/ui/transition/SceneTransitionOverlay.svelte`: presentation-only transition overlay.
- `src/ui/transition/sceneTransitionOverlay.test.ts`: source/CSS contract for overlay classes and pointer blocking.
- `src/App.svelte`: app-level transition coordinator, shell backdrop CSS variables, and overlay rendering.
- `src/application/progression/appStageProgressionWiring.test.ts`: source contract for App transition routing and shell backdrop wiring.
- `src/app.css`: shell backdrop fill and transition overlay visual styles.

---

### Task 1: Pure Transition Policy

**Files:**
- Create: `src/application/sceneTransition/sceneTransitionPolicy.ts`
- Create: `src/application/sceneTransition/sceneTransitionPolicy.test.ts`
- Test: `src/application/sceneTransition/sceneTransitionPolicy.test.ts`

- [ ] **Step 1: Write the failing transition policy tests**

Create `src/application/sceneTransition/sceneTransitionPolicy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { AppScreen } from '../../domain/app/appFlow'
import {
  canStartSceneTransition,
  getSceneTransitionTiming,
  resolveSceneTransitionStyle,
  type SceneTransitionState,
} from './sceneTransitionPolicy'

const titleMenu: AppScreen = { type: 'title-menu', selectedItemIndex: 0 }
const worldSelect: AppScreen = { type: 'world-select', selectedWorldIndex: 0 }
const stageSelect: AppScreen = {
  type: 'stage-select',
  selectedWorldIndex: 0,
  selectedStageIndex: 0,
}
const gameplay: AppScreen = { type: 'gameplay', stageId: '1-1', runId: 0 }
const settings: AppScreen = { type: 'settings', selectedItemIndex: 0, deleteConfirm: null }

describe('scene transition policy', () => {
  it('maps world and stage select navigation to directional world-stage styles', () => {
    expect(resolveSceneTransitionStyle(worldSelect, stageSelect)).toBe('world-stage-forward')
    expect(resolveSceneTransitionStyle(stageSelect, worldSelect)).toBe('world-stage-back')
  })

  it('maps navigation into gameplay to the gameplay transition style', () => {
    expect(resolveSceneTransitionStyle(stageSelect, gameplay)).toBe('gameplay')
    expect(resolveSceneTransitionStyle(gameplay, { ...gameplay, runId: 1 })).toBe('gameplay')
  })

  it('uses page transitions for other screen replacements', () => {
    expect(resolveSceneTransitionStyle(titleMenu, worldSelect)).toBe('page')
    expect(resolveSceneTransitionStyle(settings, titleMenu)).toBe('page')
    expect(resolveSceneTransitionStyle(gameplay, stageSelect)).toBe('page')
  })

  it('does not transition same-screen selection changes', () => {
    expect(resolveSceneTransitionStyle(worldSelect, { type: 'world-select', selectedWorldIndex: 1 })).toBeNull()
    expect(resolveSceneTransitionStyle(stageSelect, {
      type: 'stage-select',
      selectedWorldIndex: 0,
      selectedStageIndex: 1,
    })).toBeNull()
  })

  it('exposes prototype-aligned timing values per style', () => {
    expect(getSceneTransitionTiming('page')).toEqual({
      coverMs: 260,
      holdMs: 140,
      revealMs: 620,
    })
    expect(getSceneTransitionTiming('world-stage-forward')).toEqual({
      coverMs: 300,
      holdMs: 140,
      revealMs: 540,
    })
    expect(getSceneTransitionTiming('world-stage-back')).toEqual({
      coverMs: 300,
      holdMs: 140,
      revealMs: 540,
    })
    expect(getSceneTransitionTiming('gameplay')).toEqual({
      coverMs: 260,
      holdMs: 420,
      revealMs: 620,
    })
  })

  it('allows transitions only while idle', () => {
    const idle: SceneTransitionState = { phase: 'idle', style: 'page' }
    const covering: SceneTransitionState = { phase: 'cover', style: 'page' }
    const revealing: SceneTransitionState = { phase: 'reveal', style: 'page' }

    expect(canStartSceneTransition(idle)).toBe(true)
    expect(canStartSceneTransition(covering)).toBe(false)
    expect(canStartSceneTransition(revealing)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the red policy test**

Run:

```bash
npm run test -- src/application/sceneTransition/sceneTransitionPolicy.test.ts
```

Expected: FAIL because `sceneTransitionPolicy.ts` does not exist.

- [ ] **Step 3: Implement the transition policy**

Create `src/application/sceneTransition/sceneTransitionPolicy.ts`:

```ts
import type { AppScreen } from '../../domain/app/appFlow'

export type SceneTransitionPhase = 'idle' | 'cover' | 'reveal'

export type SceneTransitionStyle = 'page' | 'world-stage-forward' | 'world-stage-back' | 'gameplay'

export type SceneTransitionState = {
  phase: SceneTransitionPhase
  style: SceneTransitionStyle
}

export type SceneTransitionTiming = {
  coverMs: number
  holdMs: number
  revealMs: number
}

export const initialSceneTransitionState: SceneTransitionState = {
  phase: 'idle',
  style: 'page',
}

const TIMINGS: Record<SceneTransitionStyle, SceneTransitionTiming> = {
  page: { coverMs: 260, holdMs: 140, revealMs: 620 },
  'world-stage-forward': { coverMs: 300, holdMs: 140, revealMs: 540 },
  'world-stage-back': { coverMs: 300, holdMs: 140, revealMs: 540 },
  gameplay: { coverMs: 260, holdMs: 420, revealMs: 620 },
}

export function getSceneTransitionTiming(style: SceneTransitionStyle): SceneTransitionTiming {
  return TIMINGS[style]
}

export function canStartSceneTransition(state: SceneTransitionState): boolean {
  return state.phase === 'idle'
}

export function resolveSceneTransitionStyle(
  from: AppScreen,
  to: AppScreen,
): SceneTransitionStyle | null {
  if (from.type === to.type && to.type !== 'gameplay') return null
  if (from.type === 'world-select' && to.type === 'stage-select') return 'world-stage-forward'
  if (from.type === 'stage-select' && to.type === 'world-select') return 'world-stage-back'
  if (to.type === 'gameplay') return 'gameplay'
  return 'page'
}
```

- [ ] **Step 4: Run the green policy test**

Run:

```bash
npm run test -- src/application/sceneTransition/sceneTransitionPolicy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/sceneTransition/sceneTransitionPolicy.ts src/application/sceneTransition/sceneTransitionPolicy.test.ts
git commit -m "feat: add scene transition policy"
```

---

### Task 2: Shell Backdrop Resolver

**Files:**
- Create: `src/application/shell/shellBackdrop.ts`
- Create: `src/application/shell/shellBackdrop.test.ts`
- Test: `src/application/shell/shellBackdrop.test.ts`

- [ ] **Step 1: Write the failing backdrop resolver tests**

Create `src/application/shell/shellBackdrop.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { projectData } from '../../domain/data/projectData'
import { resolveShellBackdrop } from './shellBackdrop'

describe('shell backdrop resolver', () => {
  it('uses the selected world background on world select', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'world-select', selectedWorldIndex: 1 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/emerald_sanctuary_stage_select.webp',
      theme: 'forest',
    })
  })

  it('uses the selected world background on stage select', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'stage-select', selectedWorldIndex: 4, selectedStageIndex: 0 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/emberfall_caldera_stage_select.webp',
      theme: 'volcano',
    })
  })

  it('uses the gameplay stage world background', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'gameplay', stageId: '6-3', runId: 0 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/abyssal_hollow_stage_select.webp',
      theme: 'abyss',
    })
  })

  it('preserves the previous backdrop while settings are open', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
      worlds: projectData.worlds,
      stages: projectData.stages,
      previous: {
        assetRef: '/assets/maps/frostveil_peaks_stage_select.webp',
        theme: 'snow',
      },
    })).toEqual({
      assetRef: '/assets/maps/frostveil_peaks_stage_select.webp',
      theme: 'snow',
    })
  })

  it('falls back to world 01 for title and missing context', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/white_palace_stage_select.webp',
      theme: 'palace',
    })
  })
})
```

- [ ] **Step 2: Run the red backdrop resolver test**

Run:

```bash
npm run test -- src/application/shell/shellBackdrop.test.ts
```

Expected: FAIL because `shellBackdrop.ts` does not exist.

- [ ] **Step 3: Implement the shell backdrop resolver**

Create `src/application/shell/shellBackdrop.ts`:

```ts
import type { AppScreen } from '../../domain/app/appFlow'
import type { StageCatalog } from '../../domain/data/stages/stageTypes'
import type { WorldCatalog, WorldData, WorldTheme } from '../../domain/data/worlds/worldTypes'

export type ShellBackdrop = {
  assetRef: string
  theme: WorldTheme
}

export type ShellBackdropInput = {
  screen: AppScreen
  worlds: WorldCatalog
  stages: StageCatalog
  previous?: ShellBackdrop
}

function fallbackWorld(worlds: WorldCatalog): WorldData {
  return worlds.items[worlds.order[0]]
}

function backdropForWorld(world: WorldData): ShellBackdrop {
  return {
    assetRef: world.assetRefs.stageSelectBackground,
    theme: world.theme,
  }
}

function worldByIndex(worlds: WorldCatalog, index: number): WorldData {
  return worlds.items[worlds.order[index]] ?? fallbackWorld(worlds)
}

function worldForStage(input: ShellBackdropInput): WorldData {
  const stage = input.stages.items[input.screen.type === 'gameplay' ? input.screen.stageId : '1-1']
  return stage ? input.worlds.items[stage.worldId] ?? fallbackWorld(input.worlds) : fallbackWorld(input.worlds)
}

export function resolveShellBackdrop(input: ShellBackdropInput): ShellBackdrop {
  if (input.screen.type === 'settings' && input.previous) return input.previous
  if (input.screen.type === 'world-select') {
    return backdropForWorld(worldByIndex(input.worlds, input.screen.selectedWorldIndex))
  }
  if (input.screen.type === 'stage-select') {
    return backdropForWorld(worldByIndex(input.worlds, input.screen.selectedWorldIndex))
  }
  if (input.screen.type === 'gameplay') {
    return backdropForWorld(worldForStage(input))
  }
  return backdropForWorld(fallbackWorld(input.worlds))
}
```

- [ ] **Step 4: Run the green backdrop resolver test**

Run:

```bash
npm run test -- src/application/shell/shellBackdrop.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/shell/shellBackdrop.ts src/application/shell/shellBackdrop.test.ts
git commit -m "feat: resolve scene shell backdrops"
```

---

### Task 3: Transition Overlay Presentation

**Files:**
- Create: `src/ui/transition/SceneTransitionOverlay.svelte`
- Create: `src/ui/transition/sceneTransitionOverlay.test.ts`
- Modify: `src/app.css`
- Test: `src/ui/transition/sceneTransitionOverlay.test.ts`

- [ ] **Step 1: Write the failing overlay source/CSS test**

Create `src/ui/transition/sceneTransitionOverlay.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import source from './SceneTransitionOverlay.svelte?raw'

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf8')

describe('SceneTransitionOverlay', () => {
  it('renders prototype-style transition classes without app-flow logic', () => {
    expect(source).toContain("import type { SceneTransitionPhase, SceneTransitionStyle }")
    expect(source).toContain('phase: SceneTransitionPhase')
    expect(source).toContain('style: SceneTransitionStyle')
    expect(source).toContain('scene-transition')
    expect(source).toContain('class:reveal={phase === \\'reveal\\'}')
    expect(source).toContain("class:world-shift={style === 'world-stage-forward' || style === 'world-stage-back'}")
    expect(source).toContain("class:reverse={style === 'world-stage-back'}")
    expect(source).toContain('transition-emblem')
    expect(source).not.toContain('appState')
    expect(source).not.toContain('setTimeout')
  })

  it('defines blocking page and world-shift transition CSS', () => {
    expect(appCss).toContain('.scene-transition')
    expect(appCss).toContain('pointer-events: all')
    expect(appCss).toContain('animation: scene-page-cover 280ms ease-out forwards')
    expect(appCss).toContain('.scene-transition.reveal')
    expect(appCss).toContain('scene-page-reveal')
    expect(appCss).toContain('.scene-transition.world-shift')
    expect(appCss).toContain('scene-world-shift-cover')
    expect(appCss).toContain('.scene-transition.world-shift.reverse::before')
    expect(appCss).toContain('scene-world-shift-light-reverse')
    expect(appCss).toContain('.transition-emblem')
  })
})
```

- [ ] **Step 2: Run the red overlay test**

Run:

```bash
npm run test -- src/ui/transition/sceneTransitionOverlay.test.ts
```

Expected: FAIL because the overlay file and CSS do not exist.

- [ ] **Step 3: Create the overlay component**

Create `src/ui/transition/SceneTransitionOverlay.svelte`:

```svelte
<script lang="ts">
  import type {
    SceneTransitionPhase,
    SceneTransitionStyle,
  } from '../../application/sceneTransition/sceneTransitionPolicy'

  type Props = {
    phase: SceneTransitionPhase
    style: SceneTransitionStyle
  }

  let { phase, style }: Props = $props()
</script>

{#if phase !== 'idle'}
  <div
    class:reveal={phase === 'reveal'}
    class:world-shift={style === 'world-stage-forward' || style === 'world-stage-back'}
    class:reverse={style === 'world-stage-back'}
    class:gameplay={style === 'gameplay'}
    class="scene-transition"
    aria-hidden="true"
  >
    <div class="transition-emblem">✦</div>
  </div>
{/if}
```

- [ ] **Step 4: Add transition CSS**

Append to `src/app.css` after `.resolution-frame`:

```css
.scene-transition {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.98) 0 8%, rgba(220, 244, 255, 0.96) 35%, rgba(72, 150, 222, 0.94) 100%);
  opacity: 0;
  pointer-events: all;
  animation: scene-page-cover 280ms ease-out forwards;
}

.scene-transition.reveal {
  opacity: 1;
  animation: scene-page-reveal 620ms cubic-bezier(0.35, 0, 0.2, 1) forwards;
}

.scene-transition.gameplay {
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.99) 0 8%, rgba(230, 248, 255, 0.97) 34%, rgba(55, 132, 204, 0.95) 100%);
}

.scene-transition.world-shift {
  background:
    linear-gradient(90deg, rgba(12, 42, 77, 0.12), rgba(118, 199, 255, 0.08), rgba(12, 42, 77, 0.12));
  opacity: 1;
  backdrop-filter: brightness(0.9) saturate(0.9) blur(1px);
  animation: scene-world-shift-cover 300ms ease-out forwards;
}

.scene-transition.world-shift::before,
.scene-transition.world-shift::after {
  position: absolute;
  top: -15%;
  bottom: -15%;
  left: -32%;
  width: 24%;
  content: "";
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.34), rgba(118, 199, 255, 0.14), transparent);
  filter: blur(5px);
  transform: skewX(-12deg);
  animation: scene-world-shift-light 580ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}

.scene-transition.world-shift::after {
  left: -42%;
  width: 12%;
  opacity: 0.65;
  animation-delay: 70ms;
}

.scene-transition.world-shift.reverse::before,
.scene-transition.world-shift.reverse::after {
  right: -32%;
  left: auto;
  animation-name: scene-world-shift-light-reverse;
}

.scene-transition.world-shift.reverse::after {
  right: -42%;
}

.scene-transition.world-shift.reveal {
  animation: scene-world-shift-reveal 540ms ease-out forwards;
}

.scene-transition.world-shift .transition-emblem {
  display: none;
}

.transition-emblem {
  color: #fff;
  font-size: min(3vw, 58px);
  filter: drop-shadow(0 0 18px rgba(255, 255, 255, 0.9));
  animation: scene-transition-emblem-pulse 700ms ease-in-out infinite alternate;
}

@keyframes scene-page-cover {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scene-page-reveal {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes scene-world-shift-cover {
  from { opacity: 0; backdrop-filter: brightness(1) saturate(1) blur(0); }
  to { opacity: 1; backdrop-filter: brightness(0.9) saturate(0.9) blur(1px); }
}

@keyframes scene-world-shift-reveal {
  from { opacity: 1; backdrop-filter: brightness(0.9) saturate(0.9) blur(1px); }
  to { opacity: 0; backdrop-filter: brightness(1) saturate(1) blur(0); }
}

@keyframes scene-world-shift-light {
  from { left: -32%; }
  to { left: 112%; }
}

@keyframes scene-world-shift-light-reverse {
  from { right: -32%; }
  to { right: 112%; }
}

@keyframes scene-transition-emblem-pulse {
  from { scale: 0.86; opacity: 0.6; }
  to { scale: 1.08; opacity: 1; }
}
```

- [ ] **Step 5: Run the green overlay test**

Run:

```bash
npm run test -- src/ui/transition/sceneTransitionOverlay.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run Svelte check**

Run:

```bash
npm run check
```

Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 7: Commit**

```bash
git add src/ui/transition/SceneTransitionOverlay.svelte src/ui/transition/sceneTransitionOverlay.test.ts src/app.css
git commit -m "feat: add scene transition overlay"
```

---

### Task 4: Shell Backdrop Wiring

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/app.css`
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`
- Test: `src/application/progression/appStageProgressionWiring.test.ts`
- Test: `src/application/shell/shellBackdrop.test.ts`

- [ ] **Step 1: Write the failing App shell backdrop contract test**

Append this test to `src/application/progression/appStageProgressionWiring.test.ts`:

```ts
it('routes shell backdrop through the pure backdrop resolver', () => {
  expect(source).toContain("import { resolveShellBackdrop, type ShellBackdrop } from './application/shell/shellBackdrop'")
  expect(source).toContain('let shellBackdrop = $state<ShellBackdrop>')
  expect(source).toContain('function syncShellBackdrop()')
  expect(source).toContain('resolveShellBackdrop({')
  expect(source).toContain('previous: shellBackdrop,')
  expect(source).toContain('style:--shell-backdrop={`url(\"${shellBackdrop.assetRef}\")`}')
  expect(source).toContain('class={`shell theme-${shellBackdrop.theme}`}')
})
```

- [ ] **Step 2: Run the red App shell backdrop contract test**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: FAIL because `App.svelte` does not import or use `resolveShellBackdrop`.

- [ ] **Step 3: Wire shell backdrop into `App.svelte`**

Update imports in `src/App.svelte`:

```ts
import { resolveShellBackdrop, type ShellBackdrop } from './application/shell/shellBackdrop'
```

Add state near other `$state` declarations:

```ts
let shellBackdrop = $state<ShellBackdrop>(
  resolveShellBackdrop({
    screen: appState.screen,
    worlds: projectData.worlds,
    stages: projectData.stages,
  }),
)
```

Add helper near `syncMusicForCurrentState`:

```ts
function syncShellBackdrop() {
  shellBackdrop = resolveShellBackdrop({
    screen: appState.screen,
    worlds: projectData.worlds,
    stages: projectData.stages,
    previous: shellBackdrop,
  })
}
```

Call `syncShellBackdrop()` after every existing `appState = ...` assignment that can change screen or selected world/stage:

- `handleControlIntent`
- `handleSelectWorld`
- `handleConfirmWorld`
- `handleSelectStage`
- `handleConfirmStage`
- `handleNextGameplayStage`
- `handleRetryGameplayStage`
- `handleReturnFromGameplayToStageSelect`
- `handleBackFromStageSelect`
- `handleBackFromWorldSelect`
- `handleActivateSettingsItem` when it returns to title
- `handleCancelDelete`
- `handleConfirmDelete`

Update the root markup:

```svelte
<main
  class={`shell theme-${shellBackdrop.theme}`}
  style:--shell-backdrop={`url("${shellBackdrop.assetRef}")`}
>
```

- [ ] **Step 4: Add shell backdrop CSS**

Modify `.shell` in `src/app.css` so it uses `--shell-backdrop`:

```css
.shell {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 100%;
  place-items: center;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(8, 20, 38, 0.28), rgba(7, 13, 26, 0.5)),
    var(--shell-backdrop, linear-gradient(180deg, rgba(233, 247, 255, 0.82), rgba(187, 219, 242, 0.82)));
  background-position: center;
  background-size: cover;
}

.shell::before {
  position: absolute;
  inset: -18px;
  z-index: 0;
  content: "";
  background: inherit;
  filter: blur(16px) saturate(0.9) brightness(0.82);
  transform: scale(1.04);
}

.shell::after {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: "";
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.18), transparent 36%),
    linear-gradient(180deg, rgba(5, 10, 20, 0.08), rgba(5, 10, 20, 0.28));
  pointer-events: none;
}

.resolution-frame {
  z-index: 1;
}
```

- [ ] **Step 5: Run green App shell backdrop tests**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts src/application/shell/shellBackdrop.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run Svelte check**

Run:

```bash
npm run check
```

Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte src/app.css src/application/progression/appStageProgressionWiring.test.ts
git commit -m "feat: fill shell backdrop by scene"
```

---

### Task 5: App Transition Coordinator Wiring

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`
- Test: `src/application/progression/appStageProgressionWiring.test.ts`
- Test: `src/application/sceneTransition/sceneTransitionPolicy.test.ts`
- Test: `src/ui/transition/sceneTransitionOverlay.test.ts`

- [ ] **Step 1: Write the failing App transition coordinator contract test**

Append this test to `src/application/progression/appStageProgressionWiring.test.ts`:

```ts
it('routes screen replacements through the scene transition coordinator', () => {
  expect(source).toContain("import SceneTransitionOverlay from './ui/transition/SceneTransitionOverlay.svelte'")
  expect(source).toContain('initialSceneTransitionState')
  expect(source).toContain('resolveSceneTransitionStyle(previousScreen, nextScreen)')
  expect(source).toContain('async function transitionToScreen(')
  expect(source).toContain('sceneTransition = { phase: \\'cover\\', style }')
  expect(source).toContain('await waitForSceneTransition(timing.coverMs)')
  expect(source).toContain('applyScreenChange()')
  expect(source).toContain('sceneTransition = { phase: \\'reveal\\', style }')
  expect(source).toContain('<SceneTransitionOverlay phase={sceneTransition.phase} style={sceneTransition.style} />')
})
```

- [ ] **Step 2: Run the red App transition coordinator test**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: FAIL because `App.svelte` does not have transition coordinator wiring.

- [ ] **Step 3: Add imports and transition state to `App.svelte`**

Update imports:

```ts
import {
  canStartSceneTransition,
  getSceneTransitionTiming,
  initialSceneTransitionState,
  resolveSceneTransitionStyle,
  type SceneTransitionState,
} from './application/sceneTransition/sceneTransitionPolicy'
import SceneTransitionOverlay from './ui/transition/SceneTransitionOverlay.svelte'
```

Add state:

```ts
let sceneTransition = $state<SceneTransitionState>(initialSceneTransitionState)
```

Add timer helper:

```ts
function waitForSceneTransition(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs))
}
```

Add coordinator:

```ts
async function transitionToScreen(
  nextScreen: typeof appState.screen,
  applyScreenChange: () => void,
) {
  const previousScreen = appState.screen
  const style = resolveSceneTransitionStyle(previousScreen, nextScreen)

  if (!style || !canStartSceneTransition(sceneTransition)) {
    applyScreenChange()
    syncShellBackdrop()
    syncMusicForCurrentState()
    return
  }

  const timing = getSceneTransitionTiming(style)
  sceneTransition = { phase: 'cover', style }
  await waitForSceneTransition(timing.coverMs)
  applyScreenChange()
  syncShellBackdrop()
  syncMusicForCurrentState()
  await waitForSceneTransition(timing.holdMs)
  sceneTransition = { phase: 'reveal', style }
  await waitForSceneTransition(timing.revealMs)
  sceneTransition = initialSceneTransitionState
}
```

Render the overlay inside `ResolutionFrame`, after the screen branch:

```svelte
<SceneTransitionOverlay phase={sceneTransition.phase} style={sceneTransition.style} />
```

- [ ] **Step 4: Route screen-changing handlers through `transitionToScreen`**

Update screen replacement handlers to calculate the next screen, then pass the mutation and existing side effects into `transitionToScreen`.

For `handleConfirmWorld`:

```ts
function handleConfirmWorld() {
  playUiSfx('confirm')
  const nextState = confirmSelectedWorld(appState)
  void transitionToScreen(nextState.screen, () => {
    appState = nextState
  })
}
```

For `handleConfirmStage`:

```ts
function handleConfirmStage() {
  playUiSfx('confirm')
  const nextState = confirmSelectedStage(appState, { isStageUnlocked: isGameplayStageUnlocked })
  void transitionToScreen(nextState.screen, () => {
    appState = nextState
    gameplayMusicState = initialGameplayMusicState
  })
}
```

For `handleNextGameplayStage`:

```ts
function handleNextGameplayStage() {
  if (appState.screen.type !== 'gameplay') return

  const nextStageId = getNextStageId(stageOrder, appState.screen.stageId)
  const previousScreen = appState.screen
  const nextState = openNextGameplayStage(appState, nextStageId, { isStageUnlocked: isGameplayStageUnlocked })
  if (nextState.screen === previousScreen) return

  playUiSfx('confirm')
  void transitionToScreen(nextState.screen, () => {
    appState = nextState
    gameplayMusicState = initialGameplayMusicState
  })
}
```

For `handleRetryGameplayStage`:

```ts
function handleRetryGameplayStage() {
  playUiSfx('confirm')
  const nextState = retryGameplayStage(appState)
  void transitionToScreen(nextState.screen, () => {
    appState = nextState
    gameplayMusicState = initialGameplayMusicState
  })
}
```

For back handlers:

```ts
function handleReturnFromGameplayToStageSelect() {
  playUiSfx('back')
  const nextState = returnFromGameplayToStageSelect(appState)
  void transitionToScreen(nextState.screen, () => {
    appState = nextState
  })
}

function handleBackFromStageSelect() {
  playUiSfx('back')
  const nextState = backFromStageSelect(appState)
  void transitionToScreen(nextState.screen, () => {
    appState = nextState
  })
}

function handleBackFromWorldSelect() {
  playUiSfx('back')
  const nextState = backFromWorldSelect(appState)
  void transitionToScreen(nextState.screen, () => {
    appState = nextState
  })
}
```

For `handleActivateSettingsItem` title return:

```ts
if (index === 9) {
  const nextScreen = { type: 'title-menu', selectedItemIndex: 1 } as const
  playUiSfx('back')
  void transitionToScreen(nextScreen, () => {
    appState = { screen: nextScreen }
  })
}
```

For `handleControlIntent`, keep selection-only changes immediate, but route screen type changes through `transitionToScreen`:

```ts
function handleControlIntent(intent: ControlIntent) {
  const previousScreen = appState.screen
  const previousFullscreen = settings.fullscreen
  const nextState = applyControlIntent({ ...appState, settings, isStageUnlocked: isGameplayStageUnlocked }, intent)
  const sfxAction = getControlIntentSfxAction(previousScreen, nextState.screen, intent)

  const applyNextState = () => {
    appState = { screen: nextState.screen }
    const enteredGameplay = previousScreen.type !== 'gameplay' && appState.screen.type === 'gameplay'

    if (enteredGameplay) {
      gameplayMusicState = initialGameplayMusicState
    }

    if (nextState.settings) {
      syncSettings(nextState.settings)
      if (nextState.settings.fullscreen !== previousFullscreen) {
        void setFullscreen(nextState.settings.fullscreen)
      }
    }
  }

  if (sfxAction) playUiSfx(sfxAction)

  if (previousScreen.type === nextState.screen.type && nextState.screen.type !== 'gameplay') {
    applyNextState()
    syncShellBackdrop()
    syncMusicForCurrentState()
    return
  }

  void transitionToScreen(nextState.screen, applyNextState)
}
```

- [ ] **Step 5: Run green App transition coordinator tests**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts src/application/sceneTransition/sceneTransitionPolicy.test.ts src/ui/transition/sceneTransitionOverlay.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run Svelte check**

Run:

```bash
npm run check
```

Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte src/application/progression/appStageProgressionWiring.test.ts
git commit -m "feat: coordinate scene transitions"
```

---

### Task 6: Full Verification and Browser QA

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm run test
```

Expected: all test files pass.

- [ ] **Step 2: Run Svelte/TypeScript check**

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

Expected: Vite build succeeds. Existing chunk size warnings are acceptable.

- [ ] **Step 4: Run diff sanity**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Run prototype boundary scan**

Run:

```bash
rg -n "__prototype__" src public package.json docs/superpowers/specs/2026-07-14-scene-transition-system-design.md docs/superpowers/plans/2026-07-14-scene-transition-system.md
```

Expected: only docs/spec/plan references and existing tests that assert no prototype asset refs. No runtime source import from `__prototype__`.

- [ ] **Step 6: Browser QA**

Start or reuse the local dev server, then verify in the in-app browser:

```bash
npm run dev
```

Manual checks:

- title menu to world select: page cover and reveal are visible.
- world select to stage select: horizontal light sweep moves forward.
- stage select back to world select: horizontal light sweep reverses.
- stage select to gameplay: cover hides gameplay mount and reveal is smooth.
- result retry and next stage: transition hides canvas remount.
- frame outside area shows the selected world background image.
- changing selected world changes the out-of-frame background.
- no blank or white frame appears during transition.

- [ ] **Step 7: Commit any verification-only fixes**

If browser QA or full checks require changes, use TDD for behavior fixes when possible, then commit:

```bash
git add <changed-files>
git commit -m "fix: polish scene transition verification"
```

## Self-Review

- Spec coverage: Task 1 covers pure transition policy and timings; Task 2 covers shell backdrop resolution; Task 3 covers overlay presentation; Task 4 wires shell backdrop; Task 5 wires centralized App transition coordination; Task 6 covers full verification and browser QA.
- Prototype boundary: the plan uses prototype behavior as reference only and copies no prototype runtime code.
- TDD order: each implementation task starts with a failing test and expected red command.
- Type consistency: `SceneTransitionPhase`, `SceneTransitionStyle`, `SceneTransitionState`, `ShellBackdrop`, `resolveShellBackdrop`, and `transitionToScreen` are introduced before later use.
- Scope: the plan does not rewrite app-flow domain or per-screen UI beyond the needed App shell/overlay boundary.
