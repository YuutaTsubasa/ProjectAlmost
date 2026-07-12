# Gameplay Stage SFX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire gameplay stage events to the existing audio command pipeline with typed SFX actions and Settings-controlled volume.

**Architecture:** `createGameplayRenderer` emits `GameplaySfxAction` through an injected callback. `GameplayScreen.svelte` passes the callback through. `App.svelte` receives gameplay SFX actions and executes `createSfxCommand(action, settings)` through the existing browser audio controller.

**Tech Stack:** Svelte 5, TypeScript, Phaser, Vitest, existing audio command/controller stack.

---

## File Structure

- Modify `src/ui/gameplay/createGameplayRenderer.ts`: add `onSfx` callback, helper emitter, and stage event calls.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: source-contract coverage for renderer SFX emission.
- Modify `src/ui/gameplay/GameplayScreen.svelte`: accept and pass `onGameplaySfx`.
- Modify `src/ui/gameplay/gameplayScreenStageClear.test.ts`: source-contract coverage for screen SFX callback.
- Modify `src/App.svelte`: add gameplay SFX handler and pass it into `GameplayScreen`.
- Modify `src/application/progression/appStageProgressionWiring.test.ts`: source-contract coverage for App wiring.

## Task 1: Renderer Gameplay SFX Callback

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Test: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer source tests**

Add assertions that `createGameplayRenderer.ts`:

```ts
expect(rendererSource).toContain("import type { GameplaySfxAction } from '../../domain/audio/audioPolicy'")
expect(rendererSource).toContain('onSfx?: (action: GameplaySfxAction) => void')
expect(rendererSource).toContain('private emitGameplaySfx(action: GameplaySfxAction): void')
expect(rendererSource).toContain('this.options.onSfx?.(action)')
expect(rendererSource).toContain("this.emitGameplaySfx('coin-collected')")
expect(rendererSource).toContain("this.emitGameplaySfx('checkpoint-activated')")
expect(rendererSource).toContain("this.emitGameplaySfx('goal-opened')")
expect(rendererSource).toContain("this.emitGameplaySfx('player-hit')")
expect(rendererSource).toContain("this.emitGameplaySfx('player-death')")
expect(rendererSource).toContain("this.emitGameplaySfx('player-footstep')")
expect(rendererSource).not.toContain("projectrun:sfx")
```

- [ ] **Step 2: Run red test**

Run: `npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts`

Expected: FAIL because the renderer has no `onSfx` callback or SFX emission calls.

- [ ] **Step 3: Implement renderer callback and event calls**

In `createGameplayRenderer.ts`:

- import `GameplaySfxAction`.
- extend renderer config/options with `onSfx?: (action: GameplaySfxAction) => void`.
- add `private emitGameplaySfx(action: GameplaySfxAction): void`.
- call the helper in accepted event methods:
  - `collectCoin` after `coin.collected = true`.
  - `activateCheckpoint` after checkpoint is accepted.
  - `completeStage` after stage clear is accepted.
  - player damage path when damage is accepted.
  - player death transition path when death starts.
  - enemy/boss hit path when hit/defeat is accepted.
  - armor guard step cadence path.

- [ ] **Step 4: Run green test**

Run: `npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts`

Expected: PASS.

## Task 2: Svelte And App Wiring

**Files:**
- Modify: `src/ui/gameplay/GameplayScreen.svelte`
- Modify: `src/ui/gameplay/gameplayScreenStageClear.test.ts`
- Modify: `src/App.svelte`
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`

- [ ] **Step 1: Write failing source tests**

In `gameplayScreenStageClear.test.ts`, assert:

```ts
expect(source).toContain("import type { GameplaySfxAction } from '../../domain/audio/audioPolicy'")
expect(source).toContain('onGameplaySfx: (action: GameplaySfxAction) => void')
expect(source).toContain('onGameplaySfx,')
expect(source).toContain('onSfx: onGameplaySfx')
```

In `appStageProgressionWiring.test.ts`, assert:

```ts
expect(source).toContain("type GameplaySfxAction")
expect(source).toContain('function playGameplaySfx(action: GameplaySfxAction)')
expect(source).toContain('audio?.execute(createSfxCommand(action, settings))')
expect(source).toContain('onGameplaySfx={playGameplaySfx}')
```

- [ ] **Step 2: Run red tests**

Run: `npm run test -- src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/progression/appStageProgressionWiring.test.ts`

Expected: FAIL because callback wiring does not exist.

- [ ] **Step 3: Implement Svelte/App wiring**

In `GameplayScreen.svelte`:

- import `GameplaySfxAction`.
- add `onGameplaySfx` to props.
- pass `onSfx: onGameplaySfx` into renderer config.

In `App.svelte`:

- import `GameplaySfxAction`.
- add `playGameplaySfx(action)`.
- pass `onGameplaySfx={playGameplaySfx}` to `GameplayScreen`.

- [ ] **Step 4: Run green tests**

Run: `npm run test -- src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/progression/appStageProgressionWiring.test.ts`

Expected: PASS.

## Task 3: Final Verification

**Files:**
- All files from Tasks 1-2.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/progression/appStageProgressionWiring.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full checks**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected: all pass. `npm run build` may keep the existing chunk-size warning.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-13-gameplay-stage-sfx-design.md docs/superpowers/plans/2026-07-13-gameplay-stage-sfx.md src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayScreenStageClear.test.ts src/App.svelte src/application/progression/appStageProgressionWiring.test.ts
git commit -m "feat: wire gameplay stage sfx"
```
