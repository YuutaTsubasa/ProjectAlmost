# Gameplay Start Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the prototype-parity gameplay start gate so timer, enemies, mechanisms, and player gameplay systems remain idle until the first intentional gameplay input.

**Architecture:** Put start-gate decisions in a pure domain module under `src/domain/gameplay/`. Keep Phaser keyboard reads and sprite mutations inside `src/ui/gameplay/createGameplayRenderer.ts`, where the scene uses the domain gate to decide whether to run simulation systems.

**Tech Stack:** TypeScript, Vitest, Svelte/Vite frontend, Phaser renderer boundary.

---

## File Structure

- Create `src/domain/gameplay/gameplayStartGate.ts`
  - Owns `GameplayStartGateState`, `GameplayStartInputSnapshot`, `createInitialGameplayStartGateState`, `isGameplayStartGateRunning`, and `advanceGameplayStartGate`.
  - Must stay pure: no Phaser, Svelte, DOM, browser APIs, timers, or mutation.

- Create `src/domain/gameplay/gameplayStartGate.test.ts`
  - Verifies unarmed, armed, running, held-input protection, and start inputs.

- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Adds `gameplayStartGateState`.
  - Converts Phaser keyboard state into a `GameplayStartInputSnapshot`.
  - Keeps Armor Guard velocity at `0` during creation.
  - Skips simulation systems until `isGameplayStartGateRunning(state)` is true.
  - Lets the first valid input frame continue through the normal update path.

- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Adds renderer integration tests for waiting timer, waiting enemy velocity, held input arming, first-input movement, and paused-time behavior after the gate starts.
  - Reuses existing `createSceneRuntime`, fake keys, fake sprites, and HUD update capture.

---

### Task 1: Pure Gameplay Start Gate Domain

**Files:**
- Create: `src/domain/gameplay/gameplayStartGate.test.ts`
- Create: `src/domain/gameplay/gameplayStartGate.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/gameplay/gameplayStartGate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  advanceGameplayStartGate,
  createInitialGameplayStartGateState,
  isGameplayStartGateRunning,
  type GameplayStartInputSnapshot,
} from './gameplayStartGate'

const idleInput: GameplayStartInputSnapshot = {
  leftHeld: false,
  rightHeld: false,
  crouchHeld: false,
  jumpPressed: false,
  jumpHeld: false,
  attackPressed: false,
  attackHeld: false,
}

describe('gameplay start gate', () => {
  it('starts unarmed so held entry input cannot start gameplay', () => {
    expect(createInitialGameplayStartGateState()).toEqual({ status: 'waiting-unarmed' })
  })

  it('stays unarmed while gameplay input is held', () => {
    expect(advanceGameplayStartGate(
      { status: 'waiting-unarmed' },
      { ...idleInput, leftHeld: true },
    )).toEqual({ status: 'waiting-unarmed' })
  })

  it('arms after all gameplay input has been released', () => {
    expect(advanceGameplayStartGate({ status: 'waiting-unarmed' }, idleInput)).toEqual({
      status: 'waiting-armed',
    })
  })

  it.each([
    ['left', { leftHeld: true }],
    ['right', { rightHeld: true }],
    ['crouch', { crouchHeld: true }],
    ['jump press', { jumpPressed: true }],
    ['jump hold', { jumpHeld: true }],
    ['attack press', { attackPressed: true }],
    ['attack hold', { attackHeld: true }],
  ])('starts from armed when %s input is active', (_label, input) => {
    expect(advanceGameplayStartGate(
      { status: 'waiting-armed' },
      { ...idleInput, ...input },
    )).toEqual({ status: 'running' })
  })

  it('does not start from armed without gameplay input', () => {
    expect(advanceGameplayStartGate({ status: 'waiting-armed' }, idleInput)).toEqual({
      status: 'waiting-armed',
    })
  })

  it('keeps running once gameplay has started', () => {
    expect(advanceGameplayStartGate({ status: 'running' }, idleInput)).toEqual({
      status: 'running',
    })
    expect(isGameplayStartGateRunning({ status: 'running' })).toBe(true)
    expect(isGameplayStartGateRunning({ status: 'waiting-armed' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run the domain test and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStartGate.test.ts
```

Expected: FAIL because `./gameplayStartGate` does not exist.

- [ ] **Step 3: Add the minimal pure domain implementation**

Create `src/domain/gameplay/gameplayStartGate.ts`:

```ts
export type GameplayStartGateState =
  | { status: 'waiting-unarmed' }
  | { status: 'waiting-armed' }
  | { status: 'running' }

export type GameplayStartInputSnapshot = {
  leftHeld: boolean
  rightHeld: boolean
  crouchHeld: boolean
  jumpPressed: boolean
  jumpHeld: boolean
  attackPressed: boolean
  attackHeld: boolean
}

export function createInitialGameplayStartGateState(): GameplayStartGateState {
  return { status: 'waiting-unarmed' }
}

export function isGameplayStartGateRunning(state: GameplayStartGateState): boolean {
  return state.status === 'running'
}

export function advanceGameplayStartGate(
  state: GameplayStartGateState,
  input: GameplayStartInputSnapshot,
): GameplayStartGateState {
  if (state.status === 'running') {
    return state
  }

  const gameplayInputActive = hasGameplayStartInput(input)

  if (state.status === 'waiting-unarmed') {
    return gameplayInputActive ? state : { status: 'waiting-armed' }
  }

  return gameplayInputActive ? { status: 'running' } : state
}

function hasGameplayStartInput(input: GameplayStartInputSnapshot): boolean {
  return input.leftHeld ||
    input.rightHeld ||
    input.crouchHeld ||
    input.jumpPressed ||
    input.jumpHeld ||
    input.attackPressed ||
    input.attackHeld
}
```

- [ ] **Step 4: Run the domain test and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStartGate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the domain slice**

Run:

```bash
git add src/domain/gameplay/gameplayStartGate.ts src/domain/gameplay/gameplayStartGate.test.ts
git commit -m "feat: add gameplay start gate domain"
```

Expected: commit contains only the new domain module and test.

---

### Task 2: Freeze Simulation Before Start

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer tests for waiting timer and enemy velocity**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, update the import near the existing HUD import:

```ts
import {
  createInitialGameplayHudState,
  formatGameplayHudTime,
  getHudEnemyMarkers,
  getHudPositionProgress,
  type GameplayHudPatch,
} from '../../domain/gameplay/gameplayHud'
```

Keep the import shape unchanged; this step only anchors the location for the tests below.

Add these tests inside `describe('createGameplayRendererConfig', () => {` near the existing HUD timer tests:

```ts
  it('keeps gameplay elapsed time at zero before the first armed gameplay input', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.scene.time.now = 65_432
    runtime.scene.update(65_432, 65_432)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(0),
    })
  })

  it('keeps Armor Guard still before gameplay starts', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    const guard = runtime.enemySprites.find(
      (sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key,
    )
    expect(guard).toBeDefined()
    if (!guard) return

    expect(guard.velocityX).toBe(0)

    runtime.scene.update(16, 16)

    expect(guard.velocityX).toBe(0)
  })
```

- [ ] **Step 2: Run the renderer tests and verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "before gameplay starts|first armed gameplay input"
```

Expected: FAIL because elapsed time advances and Armor Guard receives patrol velocity before the start gate exists.

- [ ] **Step 3: Wire the start gate into the renderer with minimal behavior**

In `src/ui/gameplay/createGameplayRenderer.ts`, add imports near the other domain imports:

```ts
import {
  advanceGameplayStartGate,
  createInitialGameplayStartGateState,
  isGameplayStartGateRunning,
  type GameplayStartGateState,
  type GameplayStartInputSnapshot,
} from '../../domain/gameplay/gameplayStartGate'
```

Add this private field near `private gameplayElapsedMs = 0`:

```ts
  private gameplayStartGateState: GameplayStartGateState = createInitialGameplayStartGateState()
```

In `create()`, reset it next to `this.gameplayElapsedMs = 0`:

```ts
    this.gameplayElapsedMs = 0
    this.gameplayStartGateState = createInitialGameplayStartGateState()
```

Replace the start of `update()` with this structure:

```ts
  update(_time?: number, delta?: number): void {
    this.updatePresentationOnlySystems()

    this.gameplayStartGateState = advanceGameplayStartGate(
      this.gameplayStartGateState,
      this.getGameplayStartInputSnapshot(),
    )

    if (!isGameplayStartGateRunning(this.gameplayStartGateState)) {
      this.emitHudPositionPatch()
      return
    }

    this.advanceGameplayElapsed(delta)

    this.updateEnemyPatrol()
    this.processActiveMeleeHitboxes()
    this.updateHomingAttack()
    this.updateCoins()
    this.updateCheckpoints()
    this.checkPlayerOutOfBounds()
    this.updatePlayerMovement()
    this.emitHudPositionPatch()
  }
```

Add these private helpers after `update()`:

```ts
  private updatePresentationOnlySystems(): void {
    for (const layer of this.backgroundLayers) {
      layer.sprite.setTilePosition(this.cameras.main.scrollX * layer.parallaxFactor, 0)
    }
  }

  private getGameplayStartInputSnapshot(): GameplayStartInputSnapshot {
    const keys = this.playerKeys

    if (!keys) {
      return {
        leftHeld: false,
        rightHeld: false,
        crouchHeld: false,
        jumpPressed: false,
        jumpHeld: false,
        attackPressed: false,
        attackHeld: false,
      }
    }

    const jumpHeld = keys.space.isDown || keys.up.isDown || keys.w.isDown
    const attackHeld = keys.j.isDown || keys.z.isDown

    return {
      leftHeld: keys.left.isDown || keys.a.isDown,
      rightHeld: keys.right.isDown || keys.d.isDown,
      crouchHeld: false,
      jumpPressed: jumpHeld && !this.wasJumpDown,
      jumpHeld,
      attackPressed: attackHeld && !this.wasAttackDown,
      attackHeld,
    }
  }
```

In `createEnemies()`, replace the Armor Guard initial velocity call:

```ts
        sprite.setVelocityX(direction * definition.patrol.speed)
```

with:

```ts
        sprite.setVelocityX(0)
```

- [ ] **Step 4: Run the focused renderer tests and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "before gameplay starts|first armed gameplay input"
```

Expected: PASS.

- [ ] **Step 5: Run the full renderer test file to catch integration fallout**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: existing tests that assume immediate gameplay may fail. Do not rewrite expectations yet unless the failure is directly caused by the new start gate and belongs in Task 3.

- [ ] **Step 6: Commit the waiting-state renderer slice**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: gate gameplay simulation start"
```

Expected: commit contains renderer gate wiring and the two waiting-state tests.

---

### Task 3: Preserve Prototype Arming And First Input Behavior

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Add failing tests for held-input arming and first-frame movement**

Add these tests inside `describe('createGameplayRendererConfig', () => {` near the Task 2 start-gate tests:

```ts
  it('does not start from held entry input until gameplay input is released and pressed again', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerKeys.right.isDown = true
    runtime.scene.update(1_000, 1_000)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(0),
    })
    expect(runtime.playerSprite.accelerationX).toBe(0)

    runtime.playerKeys.right.isDown = false
    runtime.scene.update(1_016, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(0),
    })

    runtime.playerKeys.right.isDown = true
    runtime.scene.update(1_032, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(16),
    })
    expect(runtime.playerSprite.accelerationX).toBeGreaterThan(0)
  })

  it('honors the first valid start input in the same update frame', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.scene.update(0, 0)
    runtime.playerKeys.left.isDown = true
    runtime.scene.update(16, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(16),
    })
    expect(runtime.playerSprite.accelerationX).toBeLessThan(0)
  })

  it('starts Armor Guard patrol after the start gate is running', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    const guard = runtime.enemySprites.find(
      (sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key,
    )
    expect(guard).toBeDefined()
    if (!guard) return

    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true
    runtime.scene.update(16, 16)

    expect(guard.velocityX).toBe(-enemyActorDefinitions['armor-guard'].patrol.speed)
  })
```

- [ ] **Step 2: Run the new tests and verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "held entry input|first valid start input|starts Armor Guard patrol"
```

Expected: at least one test fails if Task 2 did not fully preserve arming or same-frame movement. If all pass, continue because the tests still lock the required behavior.

- [ ] **Step 3: Add explicit crouch key support to start snapshots if needed**

The current rebuilt player has no crouch key in `FakePlayerKeys` or `createPlayerKeys()`. Because the spec includes crouch as a start input for prototype parity, add `down` and `s` to the renderer key set only if the current renderer already maps those keys elsewhere. If no crouch movement exists in the rebuilt player, keep the domain support from Task 1 and leave renderer crouch false in this slice.

If the renderer does have crouch keys by the time this plan is executed, update `getGameplayStartInputSnapshot()` to:

```ts
    return {
      leftHeld: keys.left.isDown || keys.a.isDown,
      rightHeld: keys.right.isDown || keys.d.isDown,
      crouchHeld: keys.down.isDown || keys.s.isDown,
      jumpPressed: jumpHeld && !this.wasJumpDown,
      jumpHeld,
      attackPressed: attackHeld && !this.wasAttackDown,
      attackHeld,
    }
```

If the renderer still has no crouch keys, keep:

```ts
      crouchHeld: false,
```

- [ ] **Step 4: Keep jump and attack edge state coherent**

Confirm `getGameplayStartInputSnapshot()` runs before `updatePlayerMovement()` changes `this.wasJumpDown` and `this.wasAttackDown`. The update order should remain:

```ts
    this.gameplayStartGateState = advanceGameplayStartGate(
      this.gameplayStartGateState,
      this.getGameplayStartInputSnapshot(),
    )

    if (!isGameplayStartGateRunning(this.gameplayStartGateState)) {
      this.emitHudPositionPatch()
      return
    }

    this.advanceGameplayElapsed(delta)
```

This preserves same-frame jump and attack start detection.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "held entry input|first valid start input|starts Armor Guard patrol"
```

Expected: PASS.

- [ ] **Step 6: Run the full renderer test file and update stale immediate-start expectations**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS after updating tests whose old setup assumed gameplay had started immediately.

For any existing renderer test that needs gameplay running before exercising old behavior, use this setup after `runtime.scene.create()`:

```ts
runtime.scene.update(0, 0)
runtime.playerKeys.right.isDown = true
runtime.scene.update(16, 16)
runtime.playerKeys.right.isDown = false
```

Use that setup only for tests whose subject is not the waiting gate. Keep waiting-gate tests explicit.

- [ ] **Step 7: Commit the arming and same-frame behavior slice**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "fix: preserve gameplay start arming behavior"
```

Expected: commit contains arming behavior tests and any necessary renderer/test setup adjustments.

---

### Task 4: Preserve Paused-Time Exclusion After Gate Start

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Update the existing paused-time test to explicitly start gameplay**

Find the existing test named:

```ts
it('tracks gameplay HUD elapsed time from update delta so paused wall-clock gaps are excluded', () => {
```

Change its setup to start the gate before checking elapsed deltas:

```ts
  it('tracks gameplay HUD elapsed time from update delta so paused wall-clock gaps are excluded', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true
    runtime.scene.time.now = 1_000
    runtime.scene.update(1_000, 1_000)
    runtime.playerKeys.right.isDown = false
    runtime.scene.time.now = 18_000
    runtime.scene.update(18_000, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(1_016),
    })
  })
```

- [ ] **Step 2: Run the paused-time test and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "paused wall-clock gaps"
```

Expected: PASS.

- [ ] **Step 3: Update result elapsed tests that require gameplay start**

Find the existing test named:

```ts
it('uses gameplay elapsed time for clear result instead of paused wall-clock time', () => {
```

Before triggering the goal clear, start the gate with:

```ts
runtime.scene.update(0, 0)
runtime.playerKeys.right.isDown = true
runtime.scene.time.now = 1_000
runtime.scene.update(1_000, 1_000)
runtime.playerKeys.right.isDown = false
```

Keep the assertion expecting result time based on gameplay elapsed rather than wall-clock time.

- [ ] **Step 4: Run the result elapsed test and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "clear result instead of paused wall-clock time"
```

Expected: PASS.

- [ ] **Step 5: Commit the elapsed-time regression coverage**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "test: cover gameplay elapsed after start gate"
```

Expected: commit contains only test setup changes for elapsed-time behavior.

---

### Task 5: Full Verification And Completion Review

**Files:**
- Verify current working tree only.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm run test
```

Expected: all Vitest files pass.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run:

```bash
npm run check
```

Expected: no TypeScript or Svelte diagnostics.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds. Existing Vite chunk-size warning is acceptable if unchanged.

- [ ] **Step 4: Run whitespace sanity check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Confirm prototype boundary**

Run:

```bash
rg -n "__prototype__" src public package.json
```

Expected: no runtime imports from `__prototype__`. Existing test assertions or comments that intentionally mention the prototype boundary are acceptable after inspection.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git status --short
git diff --stat
git diff -- src/domain/gameplay/gameplayStartGate.ts src/domain/gameplay/gameplayStartGate.test.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: changes match the spec:

- Domain start gate is pure.
- Renderer owns Phaser input conversion and sprite mutation.
- Timer, Armor Guard, and gameplay systems wait for `running`.
- Held entry input does not start gameplay.
- First valid input starts and acts in the same frame.

- [ ] **Step 7: Commit final verification adjustments if any were needed**

If Step 6 shows uncommitted verification-only fixes, run:

```bash
git add src/domain/gameplay/gameplayStartGate.ts src/domain/gameplay/gameplayStartGate.test.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "chore: finalize gameplay start gate verification"
```

Expected: no commit is created if the working tree is already clean.
