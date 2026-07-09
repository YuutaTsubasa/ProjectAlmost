# Gameplay Player Crouch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prototype-parity player crouch gameplay to the rebuilt Phaser gameplay scene without importing Prototype source code.

**Architecture:** Crouch decisions live in the pure `playerActor` domain model. The Phaser renderer reads keyboard and grounded facts, applies domain decisions to Arcade body, velocity, animation, attack, life, and boss projectile flows. Runtime assets are copied from Prototype into rebuild-owned `public/assets/`.

**Tech Stack:** TypeScript, Vitest, Svelte check, Vite, Phaser Arcade Physics, root `public/` runtime assets.

---

## File Structure

- Modify `src/domain/gameplay/playerActor.ts`
  - Add crouch sprite metadata, body-pose types, crouch body definition, crouch decision helpers, and `stopVelocityX` in horizontal movement decisions.
- Modify `src/domain/gameplay/playerActor.test.ts`
  - Add RED tests for crouch manifest, body alignment, crouch eligibility, body selection, and crouch movement.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Add `isCrouching` state, body pose application, crouch animation priority, true crouch values for attack/life/boss projectile decisions, and reset on jump/hurt/death/respawn/stage clear.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Add RED tests for preload/animation, crouch entry/exit, body swaps, attack blocking, boss projectile blocking, jump exit, and reset flows.
- Add `public/assets/sprites/player_crouch/sheet-transparent.webp`
  - Copy from `__prototype__/public/assets/sprites/player_crouch/sheet-transparent.webp`.

## Task 1: Domain Crouch Model

**Files:**
- Modify: `src/domain/gameplay/playerActor.test.ts`
- Modify: `src/domain/gameplay/playerActor.ts`

- [ ] **Step 1: Write failing domain tests**

Add imports in `src/domain/gameplay/playerActor.test.ts`:

```ts
import {
  canPlayerCrouch,
  getPlayerBodyDefinition,
  getPlayerCenterY,
  getPlayerCrouchState,
  getPlayerHorizontalMovementDecision,
  playerActorDefinition,
} from './playerActor'
```

Extend the `playerActorDefinition` test to include:

```ts
crouch: {
  key: 'player-crouch',
  assetRef: '/assets/sprites/player_crouch/sheet-transparent.webp',
  frameWidth: 128,
  frameHeight: 128,
  frameStart: 0,
  frameEnd: 3,
  frameRate: 5,
  repeat: -1,
  scale: 0.78,
},
```

Add these tests:

```ts
describe('player crouch body', () => {
  it('keeps crouch body feet aligned with standing body', () => {
    const standing = playerActorDefinition.body
    const crouching = playerActorDefinition.crouch.body

    expect(crouching.height).toBeLessThan(standing.height)
    expect(crouching.offsetY + crouching.height).toBe(standing.offsetY + standing.height)
  })

  it('selects standing or crouching body definitions by pose', () => {
    expect(getPlayerBodyDefinition({ pose: 'standing' })).toEqual(playerActorDefinition.body)
    expect(getPlayerBodyDefinition({ pose: 'crouching' })).toEqual(playerActorDefinition.crouch.body)
  })
})

describe('canPlayerCrouch', () => {
  it('allows crouch only while held, grounded, and not blocked by higher-priority states', () => {
    const base = {
      crouchHeld: true,
      grounded: true,
      attacking: false,
      hurting: false,
      dead: false,
      stageCleared: false,
    }

    expect(canPlayerCrouch(base)).toBe(true)
    expect(canPlayerCrouch({ ...base, crouchHeld: false })).toBe(false)
    expect(canPlayerCrouch({ ...base, grounded: false })).toBe(false)
    expect(canPlayerCrouch({ ...base, attacking: true })).toBe(false)
    expect(canPlayerCrouch({ ...base, hurting: true })).toBe(false)
    expect(canPlayerCrouch({ ...base, dead: true })).toBe(false)
    expect(canPlayerCrouch({ ...base, stageCleared: true })).toBe(false)
  })
})

describe('getPlayerCrouchState', () => {
  it('returns true only while crouch is currently allowed', () => {
    expect(getPlayerCrouchState({
      crouchHeld: true,
      grounded: true,
      attacking: false,
      hurting: false,
      dead: false,
      stageCleared: false,
    })).toEqual({ crouching: true, pose: 'crouching' })

    expect(getPlayerCrouchState({
      crouchHeld: true,
      grounded: false,
      attacking: false,
      hurting: false,
      dead: false,
      stageCleared: false,
    })).toEqual({ crouching: false, pose: 'standing' })
  })
})
```

Update the existing movement tests to pass `crouching: false`, and add:

```ts
it('stops horizontal movement while crouching', () => {
  expect(getPlayerHorizontalMovementDecision({
    left: true,
    right: false,
    crouching: true,
  })).toEqual({
    direction: 'none',
    accelerationX: 0,
    dragX: 1500,
    stopVelocityX: true,
  })
})
```

- [ ] **Step 2: Run RED domain tests**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts
```

Expected: FAIL because `canPlayerCrouch`, `getPlayerCrouchState`, `getPlayerBodyDefinition`, `sprites.crouch`, `crouch.body`, and `stopVelocityX` do not exist yet.

- [ ] **Step 3: Implement minimal domain crouch model**

In `src/domain/gameplay/playerActor.ts`, update the types:

```ts
export type PlayerAnimationKey = 'idle' | 'run' | 'jump' | 'attack' | 'hurt' | 'death' | 'crouch'
export type PlayerBodyPose = 'standing' | 'crouching'

export type PlayerBodyDefinition = {
  width: number
  height: number
  offsetX: number
  offsetY: number
}
```

Update `PlayerActorDefinition`:

```ts
body: PlayerBodyDefinition
crouch: {
  body: PlayerBodyDefinition
}
```

Update `PlayerMovementInput` and `PlayerHorizontalMovementDecision`:

```ts
export type PlayerMovementInput = {
  left: boolean
  right: boolean
  crouching: boolean
}

export type PlayerHorizontalMovementDecision = {
  direction: PlayerMovementDirection
  accelerationX: number
  dragX: number
  stopVelocityX: boolean
}
```

Add `sprites.crouch`:

```ts
crouch: {
  key: 'player-crouch',
  assetRef: '/assets/sprites/player_crouch/sheet-transparent.webp',
  frameWidth: 128,
  frameHeight: 128,
  frameStart: 0,
  frameEnd: 3,
  frameRate: 5,
  repeat: -1,
  scale: 0.78,
},
```

Add crouch body next to `body`:

```ts
crouch: {
  body: { width: 34, height: 44, offsetX: 47, offsetY: 70 },
},
```

Add helpers:

```ts
export function canPlayerCrouch(input: {
  crouchHeld: boolean
  grounded: boolean
  attacking: boolean
  hurting: boolean
  dead: boolean
  stageCleared: boolean
}): boolean {
  return input.crouchHeld
    && input.grounded
    && !input.attacking
    && !input.hurting
    && !input.dead
    && !input.stageCleared
}

export function getPlayerCrouchState(input: {
  crouchHeld: boolean
  grounded: boolean
  attacking: boolean
  hurting: boolean
  dead: boolean
  stageCleared: boolean
}): { crouching: boolean; pose: PlayerBodyPose } {
  const crouching = canPlayerCrouch(input)

  return {
    crouching,
    pose: crouching ? 'crouching' : 'standing',
  }
}

export function getPlayerBodyDefinition(input: {
  pose: PlayerBodyPose
}): PlayerBodyDefinition {
  return input.pose === 'crouching'
    ? playerActorDefinition.crouch.body
    : playerActorDefinition.body
}
```

Update `getPlayerHorizontalMovementDecision`:

```ts
export function getPlayerHorizontalMovementDecision(
  input: PlayerMovementInput,
): PlayerHorizontalMovementDecision {
  if (input.crouching) {
    return {
      direction: 'none',
      accelerationX: 0,
      dragX: playerActorDefinition.movement.idleDragX,
      stopVelocityX: true,
    }
  }

  if (input.left) {
    return {
      direction: 'left',
      accelerationX: -playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
      stopVelocityX: false,
    }
  }

  if (input.right) {
    return {
      direction: 'right',
      accelerationX: playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
      stopVelocityX: false,
    }
  }

  return {
    direction: 'none',
    accelerationX: 0,
    dragX: playerActorDefinition.movement.idleDragX,
    stopVelocityX: false,
  }
}
```

- [ ] **Step 4: Run GREEN domain tests**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit domain model**

Run:

```bash
git add src/domain/gameplay/playerActor.ts src/domain/gameplay/playerActor.test.ts
git commit -m "feat: add player crouch domain model"
```

## Task 2: Crouch Asset, Preload, And Animation

**Files:**
- Add: `public/assets/sprites/player_crouch/sheet-transparent.webp`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer asset and animation tests**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, add tests near the player animation preload tests:

```ts
it('preloads and registers the player crouch animation from the domain actor definition', () => {
  const runtime = createSceneRuntime()
  const crouchSprite = playerActorDefinition.sprites.crouch

  runtime.scene.preload()
  runtime.scene.create()

  expect(runtime.spritesheetCalls).toContainEqual({
    key: crouchSprite.key,
    assetRef: crouchSprite.assetRef,
    frameWidth: crouchSprite.frameWidth,
    frameHeight: crouchSprite.frameHeight,
  })
  expect(runtime.animationCreateCalls).toContainEqual({
    key: crouchSprite.key,
    frames: [
      { key: crouchSprite.key, frame: 0 },
      { key: crouchSprite.key, frame: 1 },
      { key: crouchSprite.key, frame: 2 },
      { key: crouchSprite.key, frame: 3 },
    ],
    frameRate: crouchSprite.frameRate,
    repeat: crouchSprite.repeat,
  })
})
```

- [ ] **Step 2: Run RED renderer asset test**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "player crouch animation"
```

Expected: FAIL until `sprites.crouch` exists in domain and the asset is copied.

- [ ] **Step 3: Copy the crouch asset**

Run:

```bash
mkdir -p public/assets/sprites/player_crouch
cp __prototype__/public/assets/sprites/player_crouch/sheet-transparent.webp public/assets/sprites/player_crouch/sheet-transparent.webp
```

- [ ] **Step 4: Verify asset path is rebuild-owned**

Run:

```bash
test -s public/assets/sprites/player_crouch/sheet-transparent.webp
```

Expected: exit code 0.

- [ ] **Step 5: Run GREEN renderer asset test**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "player crouch animation"
```

Expected: PASS because the renderer loops over `playerActorDefinition.sprites`.

- [ ] **Step 6: Commit asset and animation coverage**

Run:

```bash
git add public/assets/sprites/player_crouch/sheet-transparent.webp src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: add player crouch sprite asset"
```

## Task 3: Renderer Crouch State, Body, Movement, And Animation

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing crouch entry and exit tests**

Add tests near the movement tests:

```ts
it.each(['down', 's'] as const)(
  'enters crouch from grounded %s input and restores standing body on release',
  (key) => {
    const runtime = createSceneRuntime()
    startGameplay(runtime)

    runtime.playerKeys[key].isDown = true
    runtime.scene.update()

    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.crouch.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite?.body.size).toEqual({
      width: playerActorDefinition.crouch.body.width,
      height: playerActorDefinition.crouch.body.height,
    })
    expect(runtime.playerSprite?.body.offset).toEqual({
      x: playerActorDefinition.crouch.body.offsetX,
      y: playerActorDefinition.crouch.body.offsetY,
    })
    expect(runtime.playerSprite?.accelerationX).toBe(0)
    expect(runtime.playerSprite?.velocityX).toBe(0)

    runtime.playerKeys[key].isDown = false
    runtime.scene.update()

    expect(runtime.playerSprite?.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })
    expect(runtime.playerSprite?.body.offset).toEqual({
      x: playerActorDefinition.body.offsetX,
      y: playerActorDefinition.body.offsetY,
    })
  },
)

it('does not crouch while airborne', () => {
  const runtime = createSceneRuntime()
  startGameplay(runtime)

  runtime.playerSprite!.body.blocked.down = false
  runtime.playerSprite!.body.touching.down = false
  runtime.playerKeys.down.isDown = true
  runtime.scene.update()

  expect(runtime.playerSprite?.playCalls.at(-1)).not.toEqual({
    key: playerActorDefinition.sprites.crouch.key,
    ignoreIfPlaying: true,
  })
  expect(runtime.playerSprite?.body.size).toEqual({
    width: playerActorDefinition.body.width,
    height: playerActorDefinition.body.height,
  })
})
```

- [ ] **Step 2: Run RED crouch renderer tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "crouch"
```

Expected: FAIL because renderer has no persistent `isCrouching`, body application, or crouch animation path.

- [ ] **Step 3: Implement renderer crouch state and body helpers**

Update imports from `playerActor`:

```ts
import {
  getPlayerBodyDefinition,
  getPlayerCenterY,
  getPlayerCrouchState,
  getPlayerHorizontalMovementDecision,
  playerActorDefinition,
  type PlayerAnimationKey,
  type PlayerBodyPose,
} from '../../domain/gameplay/playerActor'
```

Add scene fields:

```ts
private isCrouching = false
private playerBodyPose: PlayerBodyPose = 'standing'
```

Add helper methods:

```ts
private getCrouchHeld(): boolean {
  if (!this.playerKeys) return false

  return this.playerKeys.down.isDown || this.playerKeys.s.isDown
}

private applyPlayerBodyPose(pose: PlayerBodyPose): void {
  if (!this.player || this.playerBodyPose === pose) return

  const bodyDefinition = getPlayerBodyDefinition({ pose })
  this.player.body.setSize(bodyDefinition.width, bodyDefinition.height)
  this.player.body.setOffset(bodyDefinition.offsetX, bodyDefinition.offsetY)
  this.playerBodyPose = pose
}

private clearPlayerCrouch(): void {
  this.isCrouching = false
  this.applyPlayerBodyPose('standing')
}
```

In `createPlayer`, after setting standing body, set:

```ts
this.playerBodyPose = 'standing'
this.isCrouching = false
```

- [ ] **Step 4: Integrate crouch into `updatePlayerMovement`**

In `updatePlayerMovement`, before jump decision:

```ts
const crouch = getPlayerCrouchState({
  crouchHeld: this.getCrouchHeld(),
  grounded,
  attacking: this.isAttacking || this.isHomingAttacking,
  hurting: this.isPlayerHurting,
  dead: this.isPlayerDead,
  stageCleared: this.stageCleared,
})
this.isCrouching = crouch.crouching
this.applyPlayerBodyPose(crouch.pose)
```

When a jump succeeds:

```ts
if (jumpDecision.type !== 'none') {
  this.clearPlayerCrouch()
  this.player.setVelocityY(playerActorDefinition.jump.velocityY)
}
```

Update the movement decision:

```ts
const decision = getPlayerHorizontalMovementDecision({
  left: this.playerKeys.left.isDown || this.playerKeys.a.isDown,
  right: this.playerKeys.right.isDown || this.playerKeys.d.isDown,
  crouching: this.isCrouching,
})
```

After applying acceleration:

```ts
if (decision.stopVelocityX) {
  this.player.setVelocityX(0)
}
```

Add animation priority before run/idle:

```ts
} else if (this.isCrouching) {
  this.playPlayerAnimation(this.player, 'crouch')
```

- [ ] **Step 5: Run GREEN crouch renderer tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "crouch"
```

Expected: PASS for entry/exit/airborne crouch tests.

- [ ] **Step 6: Commit renderer crouch state**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: wire player crouch movement and animation"
```

## Task 4: Crouch Integration With Attack, Damage, Boss Projectiles, And Resets

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing attack-blocking test**

Add:

```ts
it('does not start melee or Homing attack while crouching', () => {
  const runtime = createSceneRuntime()
  startGameplay(runtime)

  runtime.playerKeys.down.isDown = true
  runtime.scene.update()
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()

  expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(0)
  expect(runtime.playerSprite?.texture).toBe(playerActorDefinition.sprites.crouch.key)
})
```

- [ ] **Step 2: Write failing jump-exit test**

Add:

```ts
it('exits crouch and restores standing body when jump starts', () => {
  const runtime = createSceneRuntime()
  startGameplay(runtime)

  runtime.playerKeys.down.isDown = true
  runtime.scene.update()
  runtime.playerKeys.space.isDown = true
  runtime.scene.update()

  expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
  expect(runtime.playerSprite?.body.size).toEqual({
    width: playerActorDefinition.body.width,
    height: playerActorDefinition.body.height,
  })
  expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
    key: playerActorDefinition.sprites.jump.key,
    ignoreIfPlaying: true,
  })
})
```

- [ ] **Step 3: Write failing boss-projectile block test**

Add a boss stage test:

```ts
it('blocks boss projectile hits while crouching', () => {
  const stage = getGameplayStageMap('1-6')
  expect(stage).toBeDefined()
  if (!stage) return
  const runtime = createSceneRuntime({ stage })

  runtime.scene.preload()
  runtime.scene.create()
  startGameplay(runtime)
  runtime.playerKeys.down.isDown = true
  runtime.scene.update()

  const projectile = runtime.sprites.find((sprite) => sprite.texture === 'boss-projectile')
  expect(projectile).toBeDefined()
  if (!projectile) return
  projectile.x = runtime.playerSprite!.x
  projectile.y = runtime.playerSprite!.y

  runtime.scene.update()

  expect(projectile.destroyed).toBe(true)
  expect(runtime.playerHealth()).toBe(PLAYER_MAX_HEALTH)
})
```

If `FakeRuntime` does not expose `playerHealth()`, add:

```ts
playerHealth: () => internalScene.playerHealth,
```

to the runtime helper return object.

- [ ] **Step 4: Run RED integration tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "crouch|boss projectile"
```

Expected: FAIL because attack still receives `crouching: false`, jump does not clear crouch, and boss projectile uses a non-persistent helper.

- [ ] **Step 5: Pass true crouch state into attack and projectile decisions**

Update `tryStartPlayerAttack`:

```ts
const decision = getAttackInputDecision({
  attackPressed,
  crouching: this.isCrouching,
  grounded,
})
```

Update boss projectile hit decision:

```ts
const hit = getBossProjectileHitDecision({
  playerDead: this.isPlayerDead,
  playerCrouching: this.isCrouching,
  distanceToPlayer: Phaser.Math.Distance.Between(
    this.player.x,
    this.player.y,
    projectile.x,
    projectile.y,
  ),
})
```

- [ ] **Step 6: Pass crouch into enemy and hazard damage gates**

Replace direct calls to `canApplyPlayerEnemyHit` and `canApplyPlayerHazardHit` in enemy/hazard contact paths with `canApplyPlayerDamage` after keeping enemy-specific defeated checks explicit:

```ts
if (enemy.defeated) return

if (
  !canApplyPlayerDamage({
    invulnerable: this.isPlayerInvulnerable,
    hurting: this.isPlayerHurting,
    homingAttacking: this.isHomingAttacking,
    crouching: this.isCrouching,
    dead: this.isPlayerDead,
  })
) {
  return
}
```

For hazards use the same `canApplyPlayerDamage` shape without the enemy defeated guard.

- [ ] **Step 7: Clear crouch on hurt, death, respawn, and stage clear**

Call `this.clearPlayerCrouch()` in:

- `applyPlayerContactDamage` before playing hurt/death presentation.
- `defeatPlayer` before death animation and body changes.
- `respawnPlayer` before `respawnPlayerAtCurrentPoint()`.
- `clearStage` or the existing stage-clear transition path before freezing movement.
- boss phase reset path before `respawnPlayerAtCurrentPoint()`.

Expected concrete update near boss phase reset:

```ts
this.clearPlayerCrouch()
this.respawnPlayerAtCurrentPoint()
```

- [ ] **Step 8: Run GREEN integration tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "crouch|boss projectile"
```

Expected: PASS.

- [ ] **Step 9: Run full renderer tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit integration work**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: integrate crouch with player combat damage"
```

## Task 5: Final Verification And Goal Audit

**Files:**
- Inspect: `docs/superpowers/specs/2026-07-09-gameplay-player-crouch-design.md`
- Inspect: `src/domain/gameplay/playerActor.ts`
- Inspect: `src/ui/gameplay/createGameplayRenderer.ts`
- Inspect: `public/assets/sprites/player_crouch/sheet-transparent.webp`

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

Expected: `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: Vite build exits 0.

- [ ] **Step 4: Run whitespace/path sanity**

Run:

```bash
git diff --check
```

Expected: no output and exit 0.

- [ ] **Step 5: Run Prototype boundary scan**

Run:

```bash
rg -n "__prototype__" src public package.json
```

Expected: no runtime imports or asset refs to Prototype paths. Test assertions that verify absence of Prototype paths are acceptable.

- [ ] **Step 6: Audit spec coverage**

Check that current evidence proves every item in `docs/superpowers/specs/2026-07-09-gameplay-player-crouch-design.md`:

- crouch enters from ArrowDown and `S` while grounded.
- crouch uses `player-crouch` animation and rebuild-owned asset path.
- crouch is blocked while airborne, attacking, hurting, dead, or stage-cleared.
- crouch stops horizontal movement.
- crouch prevents melee and Homing starts.
- crouch blocks boss projectile hit decisions and damage paths wired to crouching.
- jump, hurt, death, respawn, and stage clear restore standing body.

- [ ] **Step 7: Commit any final fixes**

If verification required fixes, run:

```bash
git add src/domain/gameplay/playerActor.ts src/domain/gameplay/playerActor.test.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts public/assets/sprites/player_crouch/sheet-transparent.webp
git commit -m "fix: complete player crouch verification"
```

Expected: only needed if Step 1-6 exposed a gap.
