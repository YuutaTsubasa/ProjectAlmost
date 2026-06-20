# World Select Background Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the World Select selected-background crossfade so changing worlds no longer swaps images instantly.

**Architecture:** Keep this as presentation behavior in `WorldSelectScreen.svelte` and `src/app.css`. The Svelte component retains the previous selected world's background URL for one animation window, while CSS crossfades previous and current backdrop layers.

**Tech Stack:** Svelte 5, CSS animations, Vitest raw-file contract tests.

---

### Task 1: Add The Failing UI Contract Test

**Files:**
- Create: `src/ui/world/worldSelectBackgroundTransition.test.ts`
- Read: `src/ui/world/WorldSelectScreen.svelte`
- Read: `src/app.css`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import appCss from '../../app.css?raw'
import worldSelectSource from './WorldSelectScreen.svelte?raw'

describe('World Select background transition', () => {
  it('keeps previous and current backdrop layers for a crossfade', () => {
    expect(worldSelectSource).toContain('world-backdrop-stack')
    expect(worldSelectSource).toContain('world-backdrop-layer previous')
    expect(worldSelectSource).toContain('world-backdrop-layer current')
    expect(worldSelectSource).toContain('assetRefs.stageSelectBackground')
    expect(worldSelectSource).toContain('{#key previousBackdropImage}')

    expect(appCss).toContain('.world-backdrop-stack')
    expect(appCss).toContain('.world-backdrop-layer')
    expect(appCss).toContain('transition:')
    expect(appCss).toContain('opacity 420ms ease')
    expect(appCss).toContain('@keyframes world-backdrop-previous-out')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/ui/world/worldSelectBackgroundTransition.test.ts`

Expected: FAIL because the component still renders a single `.world-backdrop` and the CSS does not define backdrop crossfade layers.

### Task 2: Implement The Crossfade

**Files:**
- Modify: `src/ui/world/WorldSelectScreen.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Update the component**

Add previous/current background tracking in `WorldSelectScreen.svelte`:

```svelte
  let currentBackdropImage = $state('')
  let previousBackdropImage = $state<string | null>(null)
  let previousBackdropTimer: ReturnType<typeof setTimeout> | null = null

  const selectedBackdropImage = $derived(selectedWorld.assetRefs.stageSelectBackground)

  $effect(() => {
    if (!selectedBackdropImage) return

    if (!currentBackdropImage) {
      currentBackdropImage = selectedBackdropImage
      return
    }

    if (selectedBackdropImage === currentBackdropImage) return

    previousBackdropImage = currentBackdropImage
    currentBackdropImage = selectedBackdropImage

    if (previousBackdropTimer) clearTimeout(previousBackdropTimer)
    previousBackdropTimer = setTimeout(() => {
      previousBackdropImage = null
      previousBackdropTimer = null
    }, 460)
  })

  onMount(() => {
    return () => {
      if (previousBackdropTimer) clearTimeout(previousBackdropTimer)
    }
  })
```

Replace the single backdrop node with:

```svelte
  <div class="world-backdrop-stack" aria-hidden="true">
    {#if previousBackdropImage}
      {#key previousBackdropImage}
        <div
          class="world-backdrop-layer previous"
          style={`--world-backdrop-image: url("${previousBackdropImage}")`}
        ></div>
      {/key}
    {/if}
    <div
      class="world-backdrop-layer current"
      style={`--world-backdrop-image: url("${currentBackdropImage || selectedBackdropImage}")`}
    ></div>
  </div>
```

- [ ] **Step 2: Update CSS**

Replace the `.world-backdrop` block with stack/layer CSS that fills the screen, applies cover backgrounds, crossfades opacity, and keeps the existing overlay gradients on `.world-backdrop-stack::before`.

- [ ] **Step 3: Run the focused test**

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
