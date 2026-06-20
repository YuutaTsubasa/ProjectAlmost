# World Select Background Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the World Select selected-background crossfade with a reusable shared image crossfade component.

**Architecture:** Keep crossfade mechanics in `src/ui/shared/CrossFadeImage.svelte`. `WorldSelectScreen.svelte` derives the selected world's background URL from catalog data and delegates the transition to the shared component, while `src/app.css` keeps the current image visible and fades the previous image out above it.

**Tech Stack:** Svelte 5, CSS animations, Vitest raw-file contract tests.

---

### Task 1: Add The Failing Shared Component Contract Test

**Files:**
- Create: `src/ui/shared/crossFadeImage.test.ts`
- Create: `src/ui/shared/CrossFadeImage.svelte`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import crossFadeSource from './CrossFadeImage.svelte?raw'

describe('CrossFadeImage', () => {
  it('keeps outgoing and keyed incoming image layers for a visible crossfade', () => {
    expect(crossFadeSource).toContain('src')
    expect(crossFadeSource).toContain('durationMs')
    expect(crossFadeSource).toContain('previousSrc')
    expect(crossFadeSource).toContain('currentSrc')
    expect(crossFadeSource).toContain('{#key currentSrc}')
    expect(crossFadeSource).toContain('crossfade-image-layer previous')
    expect(crossFadeSource).toContain('crossfade-image-layer current')
    expect(crossFadeSource).toContain('setTimeout')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/ui/shared/crossFadeImage.test.ts`

Expected: FAIL because `CrossFadeImage.svelte` does not exist.

### Task 2: Update The World Select Contract Test

**Files:**
- Modify: `src/ui/world/worldSelectBackgroundTransition.test.ts`
- Read: `src/ui/world/WorldSelectScreen.svelte`
- Read: `src/app.css`

- [ ] **Step 1: Update the existing test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import worldSelectSource from './WorldSelectScreen.svelte?raw'

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf8')

describe('World Select background transition', () => {
  it('delegates selected background transitions to CrossFadeImage', () => {
    expect(worldSelectSource).toContain("import CrossFadeImage from '../shared/CrossFadeImage.svelte'")
    expect(worldSelectSource).toContain('world-backdrop-stack')
    expect(worldSelectSource).toContain('assetRefs.stageSelectBackground')
    expect(worldSelectSource).toContain('<CrossFadeImage')
    expect(worldSelectSource).not.toContain('previousBackdropTimer')

    expect(appCss).toContain('.world-backdrop-stack')
    expect(appCss).toContain('.crossfade-image-layer')
    expect(appCss).toContain('transition:')
    expect(appCss).toContain('opacity 420ms ease')
    expect(appCss).toContain('@keyframes crossfade-image-previous-out')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/ui/world/worldSelectBackgroundTransition.test.ts`

Expected: FAIL because World Select still owns backdrop timer state and has not imported `CrossFadeImage`.

### Task 3: Implement The Shared Crossfade

**Files:**
- Create: `src/ui/shared/CrossFadeImage.svelte`
- Modify: `src/ui/world/WorldSelectScreen.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Create `CrossFadeImage.svelte`**

Implement the component with `src`, `durationMs`, and optional `class` props. Track `currentSrc` and `previousSrc`, clear previous after `durationMs`, and key the current layer by `currentSrc`.

- [ ] **Step 2: Wire World Select**

Import `CrossFadeImage`, remove backdrop timer state from `WorldSelectScreen.svelte`, keep `selectedBackdropImage`, and render the shared component inside `.world-backdrop-stack`.

- [ ] **Step 3: Update CSS**

Move generic layer rules to `.crossfade-image` and `.crossfade-image-layer`. Keep World Select overlay rules on `.world-backdrop-stack::before`. Keep the current layer visible and fade the previous layer out above it.

- [ ] **Step 4: Run focused tests**

Run: `npm run test -- src/ui/shared/crossFadeImage.test.ts src/ui/world/worldSelectBackgroundTransition.test.ts`

Expected: PASS.

### Task 4: Verify The Slice

**Files:**
- Verify: all changed files

- [ ] **Step 1: Run full tests**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run: `npm run check`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Run whitespace sanity**

Run: `git diff --check`

Expected: no output and exit code 0.
