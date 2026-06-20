# World Select Background Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the World Select selected-background behavior using the prototype's stable single-backdrop approach.

**Architecture:** Keep World Select backdrop rendering in `WorldSelectScreen.svelte` as a single `.world-backdrop` element, matching `__prototype__/src/WorldSelect.svelte`. The themed `.world-select.theme-*` class updates CSS variables in `src/app.css`; `.world-backdrop` reads `--world-background` directly and draws the cinematic overlay with `::before`. Do not use previous/current layers, `CrossFadeImage`, timers, or requestAnimationFrame opacity state for World Select.

**Tech Stack:** Svelte 5, CSS theme variables, Vitest raw-file contract tests.

---

### Task 1: Update The World Select Contract Test

**Files:**
- Modify: `src/ui/world/worldSelectBackgroundTransition.test.ts`
- Read: `src/ui/world/WorldSelectScreen.svelte`
- Read: `src/app.css`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import worldSelectSource from './WorldSelectScreen.svelte?raw'

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf8')

describe('World Select background transition', () => {
  it('matches the prototype single backdrop layer driven by world theme variables', () => {
    expect(worldSelectSource).not.toContain("import CrossFadeImage from '../shared/CrossFadeImage.svelte'")
    expect(worldSelectSource).toContain('world-backdrop')
    expect(worldSelectSource).not.toContain('assetRefs.stageSelectBackground')
    expect(worldSelectSource).not.toContain('<CrossFadeImage')
    expect(worldSelectSource).not.toContain('previousBackdropTimer')

    expect(appCss).toContain('.world-backdrop')
    expect(appCss).toContain('background: var(--world-background) center / cover no-repeat')
    expect(worldBackdropCss).toContain('transition:')
    expect(worldBackdropCss).toContain('background-image 300ms ease')
    expect(worldBackdropCss).toContain('filter 300ms ease')
    expect(appCss).toContain('.world-backdrop::before')
    expect(appCss).toContain('.world-select.theme-palace')
    expect(appCss).not.toContain('.world-backdrop-stack')
    expect(appCss).not.toContain('.crossfade-image')
    expect(appCss).not.toContain('.crossfade-image-layer')
    expect(appCss).not.toContain('@keyframes crossfade-image-previous-out')
    expect(appCss).not.toContain('@keyframes crossfade-image-current-in')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/ui/world/worldSelectBackgroundTransition.test.ts`

Expected: FAIL because World Select still imports and renders `CrossFadeImage`.

### Task 2: Restore Prototype Backdrop Structure

**Files:**
- Modify: `src/ui/world/WorldSelectScreen.svelte`
- Modify: `src/app.css`
- Delete: `src/ui/shared/CrossFadeImage.svelte`
- Delete: `src/ui/shared/crossFadeImage.test.ts`

- [ ] **Step 1: Wire World Select Like The Prototype**

Remove `CrossFadeImage`, remove `selectedBackdropImage`, and render `<div class="world-backdrop" aria-hidden="true"></div>` inside `.world-select`.

- [ ] **Step 2: Update CSS**

Replace `.world-backdrop-stack` and `.crossfade-image*` rules with `.world-backdrop` and `.world-backdrop::before`, using `--world-background`, and keep the prototype `background-image 300ms ease, filter 300ms ease` transition.

- [ ] **Step 3: Remove The Unused CrossFade Component**

Delete `src/ui/shared/CrossFadeImage.svelte` and its test because World Select no longer uses that architecture.

- [ ] **Step 4: Run focused tests**

Run: `npm run test -- src/ui/world/worldSelectBackgroundTransition.test.ts`

Expected: PASS.

### Task 3: Verify The Slice

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
