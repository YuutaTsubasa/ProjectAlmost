# Gameplay Movable Actor Jump Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal movable actor jump state foundation and use it to give the player prototype-style jump and one air jump.

**Architecture:** Keep reusable jump state transitions in a pure domain module. Keep player-specific jump tuning and sprite metadata in `playerActor.ts`, and let the Phaser adapter translate keyboard/grounded facts into domain state updates and velocity/animation side effects.

**Tech Stack:** TypeScript, Vitest, Phaser 3, Svelte, Vite.

---

## File Structure

- Create `src/domain/gameplay/movableActorState.ts`: pure generic jump state, ground contact update, jump buffering, and jump decision.
- Create `src/domain/gameplay/movableActorState.test.ts`: domain tests for coyote time, buffering, air-jump consumption, and landing reset.
- Modify `src/domain/gameplay/playerActor.ts`: add jump sprite metadata and jump tuning values.
- Modify `src/domain/gameplay/playerActor.test.ts`: verify prototype jump values and root public jump asset path.
- Copy `__prototype__/public/assets/sprites/player_jump/sheet-transparent.webp` to `public/assets/sprites/player_jump/sheet-transparent.webp`.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: add jump keys, runtime jump state, grounded detection, jump buffering, jump command application, and airborne animation selection.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: verify jump preload/animation registration, Space/ArrowUp/W jump presses, grounded jump, air jump consumption, third jump rejection, landing reset, and airborne/grounded animation selection.

---

### Task 1: Movable Actor Jump State

**Files:**
- Create: `src/domain/gameplay/movableActorState.test.ts`
- Create: `src/domain/gameplay/movableActorState.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/gameplay/movableActorState.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  bufferMovableActorJump,
  createMovableActorJumpState,
  getMovableActorJumpDecision,
  updateMovableActorGroundContact,
  type MovableActorJumpConfig,
} from './movableActorState'

const config: MovableActorJumpConfig = {
  coyoteTimeMs: 120,
  jumpBufferMs: 140,
  maxAirJumps: 1,
}

describe('createMovableActorJumpState', () => {
  it('creates a grounded state with configured air jumps', () => {
    expect(createMovableActorJumpState({ now: 25, grounded: true, config })).toEqual({
      groundState: 'grounded',
      lastGroundedAt: 25,
      jumpBufferedUntil: 0,
      remainingAirJumps: 1,
    })
  })

  it('creates an airborne state without a grounded timestamp', () => {
    expect(createMovableActorJumpState({ now: 25, grounded: false, config })).toEqual({
      groundState: 'airborne',
      lastGroundedAt: 0,
      jumpBufferedUntil: 0,
      remainingAirJumps: 1,
    })
  })
})

describe('updateMovableActorGroundContact', () => {
  it('resets air jumps and last grounded time while grounded', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 50,
      jumpBufferedUntil: 0,
      remainingAirJumps: 0,
    }

    expect(updateMovableActorGroundContact({ state, now: 200, grounded: true, config })).toEqual({
      groundState: 'grounded',
      lastGroundedAt: 200,
      jumpBufferedUntil: 0,
      remainingAirJumps: 1,
    })
  })

  it('does not reset air jumps while airborne', () => {
    const state = {
      groundState: 'grounded' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 0,
      remainingAirJumps: 0,
    }

    expect(updateMovableActorGroundContact({ state, now: 180, grounded: false, config })).toEqual({
      groundState: 'airborne',
      lastGroundedAt: 100,
      jumpBufferedUntil: 0,
      remainingAirJumps: 0,
    })
  })
})

describe('bufferMovableActorJump', () => {
  it('buffers a jump until now plus the configured buffer duration', () => {
    const state = createMovableActorJumpState({ now: 10, grounded: true, config })

    expect(bufferMovableActorJump({ state, now: 300, config })).toEqual({
      ...state,
      jumpBufferedUntil: 440,
    })
  })
})

describe('getMovableActorJumpDecision', () => {
  it('returns none when the jump buffer has expired', () => {
    const state = {
      groundState: 'grounded' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 199,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 200, config })).toEqual({
      type: 'none',
      state,
    })
  })

  it('returns ground-jump while grounded and clears consumed timing state', () => {
    const state = {
      groundState: 'grounded' as const,
      lastGroundedAt: 200,
      jumpBufferedUntil: 320,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 220, config })).toEqual({
      type: 'ground-jump',
      state: {
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: 1,
      },
    })
  })

  it('returns ground-jump on the coyote time boundary', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 220, config })).toEqual({
      type: 'ground-jump',
      state: {
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: 1,
      },
    })
  })

  it('returns air-jump outside coyote time and consumes one air jump', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 221, config })).toEqual({
      type: 'air-jump',
      state: {
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: 0,
      },
    })
  })

  it('returns none outside coyote time when no air jumps remain', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 0,
    }

    expect(getMovableActorJumpDecision({ state, now: 221, config })).toEqual({
      type: 'none',
      state,
    })
  })
})
```

- [ ] **Step 2: Run the domain test to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/movableActorState.test.ts
```

Expected: FAIL because `src/domain/gameplay/movableActorState.ts` does not exist.

- [ ] **Step 3: Implement the minimal movable actor jump module**

Create `src/domain/gameplay/movableActorState.ts`:

```ts
export type MovableActorGroundState = 'grounded' | 'airborne'

export type MovableActorJumpState = {
  groundState: MovableActorGroundState
  lastGroundedAt: number
  jumpBufferedUntil: number
  remainingAirJumps: number
}

export type MovableActorJumpConfig = {
  coyoteTimeMs: number
  jumpBufferMs: number
  maxAirJumps: number
}

export type MovableActorJumpDecision =
  | { type: 'none'; state: MovableActorJumpState }
  | { type: 'ground-jump'; state: MovableActorJumpState }
  | { type: 'air-jump'; state: MovableActorJumpState }

export function createMovableActorJumpState(input: {
  now: number
  grounded: boolean
  config: MovableActorJumpConfig
}): MovableActorJumpState {
  return {
    groundState: input.grounded ? 'grounded' : 'airborne',
    lastGroundedAt: input.grounded ? input.now : 0,
    jumpBufferedUntil: 0,
    remainingAirJumps: input.config.maxAirJumps,
  }
}

export function updateMovableActorGroundContact(input: {
  state: MovableActorJumpState
  now: number
  grounded: boolean
  config: MovableActorJumpConfig
}): MovableActorJumpState {
  if (input.grounded) {
    return {
      ...input.state,
      groundState: 'grounded',
      lastGroundedAt: input.now,
      remainingAirJumps: input.config.maxAirJumps,
    }
  }

  return {
    ...input.state,
    groundState: 'airborne',
  }
}

export function bufferMovableActorJump(input: {
  state: MovableActorJumpState
  now: number
  config: MovableActorJumpConfig
}): MovableActorJumpState {
  return {
    ...input.state,
    jumpBufferedUntil: input.now + input.config.jumpBufferMs,
  }
}

export function getMovableActorJumpDecision(input: {
  state: MovableActorJumpState
  now: number
  config: MovableActorJumpConfig
}): MovableActorJumpDecision {
  if (input.state.jumpBufferedUntil < input.now) {
    return { type: 'none', state: input.state }
  }

  if (
    input.state.groundState === 'grounded'
    || input.now - input.state.lastGroundedAt <= input.config.coyoteTimeMs
  ) {
    return {
      type: 'ground-jump',
      state: {
        ...input.state,
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
      },
    }
  }

  if (input.state.remainingAirJumps > 0) {
    return {
      type: 'air-jump',
      state: {
        ...input.state,
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: input.state.remainingAirJumps - 1,
      },
    }
  }

  return { type: 'none', state: input.state }
}
```

- [ ] **Step 4: Run the domain test to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/movableActorState.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/domain/gameplay/movableActorState.ts src/domain/gameplay/movableActorState.test.ts
git commit -m "feat: add movable actor jump state"
```

---

### Task 2: Player Jump Metadata And Asset

**Files:**
- Modify: `src/domain/gameplay/playerActor.ts`
- Modify: `src/domain/gameplay/playerActor.test.ts`
- Create: `public/assets/sprites/player_jump/sheet-transparent.webp`

- [ ] **Step 1: Write the failing player actor tests**

In `src/domain/gameplay/playerActor.test.ts`, update the expected `sprites` object to include:

```ts
jump: {
  key: 'player-jump',
  assetRef: '/assets/sprites/player_jump/sheet-transparent.webp',
  frameWidth: 128,
  frameHeight: 128,
  frameStart: 1,
  frameEnd: 1,
  frameRate: 1,
  repeat: 0,
},
```

Add this expected `jump` object beside `movement`:

```ts
jump: {
  coyoteTimeMs: 120,
  jumpBufferMs: 140,
  maxAirJumps: 1,
  velocityY: -640,
},
```

- [ ] **Step 2: Run the player actor test to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts
```

Expected: FAIL because `playerActorDefinition.sprites.jump` and `playerActorDefinition.jump` do not exist.

- [ ] **Step 3: Add player jump metadata**

In `src/domain/gameplay/playerActor.ts`, change:

```ts
export type PlayerAnimationKey = 'idle' | 'run'
```

to:

```ts
export type PlayerAnimationKey = 'idle' | 'run' | 'jump'
```

Add this to `PlayerActorDefinition`:

```ts
jump: {
  coyoteTimeMs: number
  jumpBufferMs: number
  maxAirJumps: number
  velocityY: number
}
```

Add this to `playerActorDefinition.sprites`:

```ts
jump: {
  key: 'player-jump',
  assetRef: '/assets/sprites/player_jump/sheet-transparent.webp',
  frameWidth: 128,
  frameHeight: 128,
  frameStart: 1,
  frameEnd: 1,
  frameRate: 1,
  repeat: 0,
},
```

Add this to `playerActorDefinition`:

```ts
jump: {
  coyoteTimeMs: 120,
  jumpBufferMs: 140,
  maxAirJumps: 1,
  velocityY: -640,
},
```

- [ ] **Step 4: Run the player actor test to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Verify source asset exists**

Run:

```bash
test -f __prototype__/public/assets/sprites/player_jump/sheet-transparent.webp
```

Expected: exit 0.

- [ ] **Step 6: Copy and verify the jump spritesheet**

Run:

```bash
mkdir -p public/assets/sprites/player_jump
cp __prototype__/public/assets/sprites/player_jump/sheet-transparent.webp public/assets/sprites/player_jump/sheet-transparent.webp
cmp __prototype__/public/assets/sprites/player_jump/sheet-transparent.webp public/assets/sprites/player_jump/sheet-transparent.webp
```

Expected: `cmp` exits 0 with no output.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add src/domain/gameplay/playerActor.ts src/domain/gameplay/playerActor.test.ts public/assets/sprites/player_jump/sheet-transparent.webp
git commit -m "feat: add player jump metadata and sprite"
```

---

### Task 3: Phaser Jump Runtime

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer tests**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, extend the Phaser mock key codes:

```ts
SPACE: 32,
UP: 38,
W: 87,
```

Extend `FakePlayerKeys`:

```ts
space: { isDown: boolean }
up: { isDown: boolean }
w: { isDown: boolean }
```

Extend `createFakePlayerSprite` with vertical velocity and grounded flags:

```ts
velocityY: 0,
body: {
  blocked: { down: true },
  touching: { down: true },
  // existing size/offset helpers stay
},
setVelocityY: (value: number) => {
  sprite.velocityY = value
  return sprite
},
```

Add tests:

```ts
it('preloads and registers the player jump animation from the domain actor definition', () => {
  const runtime = createSceneRuntime()

  runtime.scene.preload()
  runtime.scene.create()

  expect(runtime.spritesheetCalls).toContainEqual({
    key: playerActorDefinition.sprites.jump.key,
    assetRef: playerActorDefinition.sprites.jump.assetRef,
    frameWidth: playerActorDefinition.sprites.jump.frameWidth,
    frameHeight: playerActorDefinition.sprites.jump.frameHeight,
  })
  expect(runtime.animationCreateCalls).toContainEqual({
    key: playerActorDefinition.sprites.jump.key,
    frames: [{ key: playerActorDefinition.sprites.jump.key, frame: 1 }],
    frameRate: playerActorDefinition.sprites.jump.frameRate,
    repeat: playerActorDefinition.sprites.jump.repeat,
  })
})

it('applies jump velocity for a grounded Space press', () => {
  const runtime = createSceneRuntime()

  runtime.scene.create()
  runtime.playerKeys.space.isDown = true

  runtime.scene.update()

  expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
})

it('maps ArrowUp and W to jump press rising edges', () => {
  const upRuntime = createSceneRuntime()
  upRuntime.scene.create()
  upRuntime.playerKeys.up.isDown = true
  upRuntime.scene.update()

  const wRuntime = createSceneRuntime()
  wRuntime.scene.create()
  wRuntime.playerKeys.w.isDown = true
  wRuntime.scene.update()

  expect(upRuntime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
  expect(wRuntime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
})

it('allows one air jump and rejects a third jump until landing', () => {
  const runtime = createSceneRuntime()

  runtime.scene.create()
  runtime.playerKeys.space.isDown = true
  runtime.scene.update()
  expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)

  runtime.playerSprite!.velocityY = 0
  runtime.playerSprite!.body.blocked.down = false
  runtime.playerSprite!.body.touching.down = false
  runtime.playerKeys.space.isDown = false
  runtime.scene.update()

  runtime.playerKeys.space.isDown = true
  runtime.scene.time.now += playerActorDefinition.jump.coyoteTimeMs + 1
  runtime.scene.update()
  expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)

  runtime.playerSprite!.velocityY = 0
  runtime.playerKeys.space.isDown = false
  runtime.scene.update()
  runtime.playerKeys.space.isDown = true
  runtime.scene.update()
  expect(runtime.playerSprite?.velocityY).toBe(0)

  runtime.playerSprite!.body.blocked.down = true
  runtime.playerSprite!.body.touching.down = true
  runtime.playerKeys.space.isDown = false
  runtime.scene.update()
  runtime.playerKeys.space.isDown = true
  runtime.scene.update()
  expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
})

it('uses jump animation while airborne and idle animation when grounded without movement', () => {
  const runtime = createSceneRuntime()

  runtime.scene.create()
  runtime.playerSprite!.body.blocked.down = false
  runtime.playerSprite!.body.touching.down = false
  runtime.scene.update()
  expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
    key: playerActorDefinition.sprites.jump.key,
    ignoreIfPlaying: true,
  })

  runtime.playerSprite!.body.blocked.down = true
  runtime.playerSprite!.body.touching.down = true
  runtime.scene.update()
  expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
    key: playerActorDefinition.sprites.idle.key,
    ignoreIfPlaying: true,
  })
})
```

- [ ] **Step 2: Run renderer tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because jump keys, jump state, jump velocity, and airborne animation are not implemented.

- [ ] **Step 3: Add imports and runtime fields**

In `src/ui/gameplay/createGameplayRenderer.ts`, import:

```ts
import {
  bufferMovableActorJump,
  createMovableActorJumpState,
  getMovableActorJumpDecision,
  updateMovableActorGroundContact,
  type MovableActorJumpState,
} from '../../domain/gameplay/movableActorState'
```

Extend `playerKeys` with:

```ts
space: Phaser.Input.Keyboard.Key
up: Phaser.Input.Keyboard.Key
w: Phaser.Input.Keyboard.Key
```

Add fields:

```ts
private playerJumpState: MovableActorJumpState | null = null
private wasJumpDown = false
```

- [ ] **Step 4: Initialize player jump state and keys**

In `createPlayerKeys()`, include:

```ts
space: Phaser.Input.Keyboard.KeyCodes.SPACE,
up: Phaser.Input.Keyboard.KeyCodes.UP,
w: Phaser.Input.Keyboard.KeyCodes.W,
```

In `createPlayer()`, after creating the player and before assigning `this.player`, add:

```ts
this.playerJumpState = createMovableActorJumpState({
  now: this.time.now,
  grounded: true,
  config: playerActorDefinition.jump,
})
```

- [ ] **Step 5: Add grounded and jump input helpers**

Add:

```ts
private isPlayerGrounded(): boolean {
  if (!this.player) return false
  return this.player.body.blocked.down || this.player.body.touching.down
}

private isJumpDown(): boolean {
  if (!this.playerKeys) return false
  return this.playerKeys.space.isDown || this.playerKeys.up.isDown || this.playerKeys.w.isDown
}
```

- [ ] **Step 6: Apply jump state before movement animation selection**

At the start of `updatePlayerMovement()`, after the null guard, update jump state:

```ts
const grounded = this.isPlayerGrounded()
this.playerJumpState = updateMovableActorGroundContact({
  state: this.playerJumpState,
  now: this.time.now,
  grounded,
  config: playerActorDefinition.jump,
})

const jumpDown = this.isJumpDown()
if (jumpDown && !this.wasJumpDown) {
  this.playerJumpState = bufferMovableActorJump({
    state: this.playerJumpState,
    now: this.time.now,
    config: playerActorDefinition.jump,
  })
}
this.wasJumpDown = jumpDown

const jumpDecision = getMovableActorJumpDecision({
  state: this.playerJumpState,
  now: this.time.now,
  config: playerActorDefinition.jump,
})
this.playerJumpState = jumpDecision.state
if (jumpDecision.type !== 'none') {
  this.player.setVelocityY(playerActorDefinition.jump.velocityY)
}
```

Keep existing horizontal drag/acceleration logic.

Change animation selection so airborne wins:

```ts
if (!grounded) {
  this.player.play(playerActorDefinition.sprites.jump.key, true)
} else if (decision.direction === 'left') {
  this.player.setFlipX(true)
  this.player.play(playerActorDefinition.sprites.run.key, true)
} else if (decision.direction === 'right') {
  this.player.setFlipX(false)
  this.player.play(playerActorDefinition.sprites.run.key, true)
} else {
  this.player.play(playerActorDefinition.sprites.idle.key, true)
}
```

- [ ] **Step 7: Run renderer tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run focused gameplay tests**

Run:

```bash
npm run test -- src/domain/gameplay src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: add gameplay player double jump"
```

---

### Task 4: Full Verification

**Files:**
- No code changes expected unless verification finds a defect.

- [ ] **Step 1: Run full tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS. Report the known non-failing Vite chunk-size warning if it appears.

- [ ] **Step 4: Run whitespace/path sanity check**

Run:

```bash
git diff --check
```

Expected: no output and exit 0.

- [ ] **Step 5: Inspect final status**

Run:

```bash
git status --short --branch
```

Expected: clean working tree on the active branch after task commits.

---

## Self-Review

Spec coverage:

- Minimal movable actor state foundation: Task 1.
- Player jump tuning and jump animation metadata: Task 2.
- Player jump spritesheet asset migration: Task 2.
- Space, ArrowUp, and W jump input: Task 3.
- Ground jump, one air jump, third jump rejection, and landing reset: Tasks 1 and 3.
- Airborne jump animation and grounded idle/run preservation: Task 3.
- Required verification: Task 4.

Placeholder scan:

- No TBD, TODO, placeholder, or "implement later" steps.
- Each code-changing step includes exact paths, snippets, commands, and expected outcomes.

Type consistency:

- The plan consistently uses `MovableActorJumpState`, `MovableActorJumpConfig`, `playerActorDefinition.jump`, `playerActorDefinition.sprites.jump`, and the existing `GameplayMapScene` adapter boundary.
