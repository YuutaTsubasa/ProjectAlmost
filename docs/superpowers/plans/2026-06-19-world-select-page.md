# World Select Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a rebuild-native world selection page that opens from the title screen, follows the prototype's cinematic world select style, and uses copied prototype map assets.

**Architecture:** Keep behavior in `src/domain/app/appFlow.ts` and rendering in Svelte. `src/App.svelte` coordinates state transitions, while `src/ui/world/WorldSelectScreen.svelte` presents `projectData.worlds` without importing prototype runtime code.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Vite static assets under `public/`.

---

## File Structure

- Modify `src/domain/app/appFlow.test.ts`: add red tests for title-to-world-select and world-select navigation.
- Modify `src/domain/app/appFlow.ts`: add `world-select` state and pure transition helpers.
- Modify `src/App.svelte`: render `WorldSelectScreen` and wire app-flow callbacks.
- Create `src/ui/world/WorldSelectScreen.svelte`: render the cinematic world select UI.
- Modify `src/app.css`: add world-select styles based on the prototype's cinematic variant.
- Copy files into `public/assets/maps/`: stage-select backgrounds referenced by world data.

## Task 1: App Flow Behavior

**Files:**
- Modify: `src/domain/app/appFlow.test.ts`
- Modify: `src/domain/app/appFlow.ts`

- [ ] **Step 1: Write failing tests**

Add tests that import `backFromWorldSelect`, `confirmSelectedWorld`, `moveWorldSelection`, and `selectWorld`. Add expectations that Start Game opens `{ screen: { type: 'world-select', selectedWorldIndex: 0 } }`, settings remains inactive, world selection wraps in both directions, direct selection works, back returns to `{ screen: { type: 'title-menu', selectedItemIndex: 0 } }`, and confirm preserves the selected world-select state.

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/domain/app/appFlow.test.ts`

Expected: fail because the new imports and `world-select` behavior do not exist yet.

- [ ] **Step 3: Implement minimal app-flow code**

Extend `AppScreen` with `{ type: 'world-select'; selectedWorldIndex: number }`. Add `WORLD_COUNT = 6`. Update `activateTitleMenuItem` so selected Start Game opens world select. Add pure helpers:

```ts
export function moveWorldSelection(state: AppState, direction: -1 | 1): AppState
export function selectWorld(state: AppState, selectedWorldIndex: number): AppState
export function confirmSelectedWorld(state: AppState): AppState
export function backFromWorldSelect(state: AppState): AppState
```

Use modulo wrapping for movement. Ignore world-select helpers when not on `world-select`.

- [ ] **Step 4: Run test to verify pass**

Run: `npm run test -- src/domain/app/appFlow.test.ts`

Expected: pass.

## Task 2: World Select UI And Assets

**Files:**
- Create: `src/ui/world/WorldSelectScreen.svelte`
- Modify: `src/App.svelte`
- Modify: `src/app.css`
- Copy: `public/assets/maps/white_palace_stage_select.webp`
- Copy: `public/assets/maps/emerald_sanctuary_stage_select.webp`
- Copy: `public/assets/maps/cerulean_depths_stage_select.webp`
- Copy: `public/assets/maps/frostveil_peaks_stage_select.webp`
- Copy: `public/assets/maps/emberfall_caldera_stage_select.webp`
- Copy: `public/assets/maps/abyssal_hollow_stage_select.webp`

- [ ] **Step 1: Copy required prototype assets**

Create `public/assets/maps/` and copy the six `*_stage_select.webp` files from `__prototype__/public/assets/maps/`.

- [ ] **Step 2: Create the Svelte presentation component**

Create `WorldSelectScreen.svelte` with props for `catalog`, `selectedWorldIndex`, `onMoveSelection`, `onSelectWorld`, `onConfirmWorld`, and `onBack`. Derive ordered worlds from `catalog.order`, render the prototype-compatible `world-backdrop`, left-side `world-cinematic-copy`, bottom horizontal `world-rail`, `menu-back-button dark` Back button, and `select-controls world-controls` hints.

- [ ] **Step 3: Wire the app shell**

Import `projectData`, `WorldSelectScreen`, and the new app-flow helpers in `App.svelte`. Render `WorldSelectScreen` when `appState.screen.type === 'world-select'` and pass callbacks that update `appState`.

- [ ] **Step 4: Add CSS**

Add `.world-select` styles to `src/app.css`, following the final prototype cinematic layout with full-frame background, dark overlays, left cinematic copy, bottom horizontal rail, and responsive frame-relative sizing.

- [ ] **Step 5: Run Svelte/TypeScript check**

Run: `npm run check`

Expected: pass.

## Task 3: Full Verification

**Files:**
- Verify current worktree.

- [ ] **Step 1: Run domain tests**

Run: `npm run test`

Expected: pass.

- [ ] **Step 2: Run Svelte/TypeScript check**

Run: `npm run check`

Expected: pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: pass.

- [ ] **Step 4: Run whitespace sanity check**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 5: Inspect final diff**

Run: `git diff --stat`

Expected: changes are limited to app flow, app shell, world UI, styles, docs, and copied map assets.

## Self-Review

- Spec coverage: the tasks cover title navigation, prototype-inspired world-select UI, copied assets, pure app-flow state, and verification commands.
- Placeholder scan: no implementation placeholders remain; stage confirmation intentionally preserves state because stage select is out of scope.
- Type consistency: all planned app-flow helpers operate on `AppState` and match the Svelte callbacks.
