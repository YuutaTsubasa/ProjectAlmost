# Gameplay Homing Attack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first rebuilt Homing Attack slice using prototype domain rules and generated reticle/trail visuals.

**Architecture:** Keep Homing rules in a pure `src/domain/gameplay/playerHomingAttack.ts` module. Keep Phaser input, target lookup, generated textures, reticle, trail sprites, enemy defeat calls, and player sprite mutation in `src/ui/gameplay/createGameplayRenderer.ts`. Update the existing attack decision domain so airborne attack input routes through Homing before falling back to melee.

**Tech Stack:** TypeScript, Vitest, Svelte check, Phaser 3, Vite.

---

## File Structure

- Create `src/domain/gameplay/playerHomingAttack.ts`: pure Homing constants, target selection, entry/recovery, contact point, finish outcome, reticle gate, line helper, and trail sample rules.
- Create `src/domain/gameplay/playerHomingAttack.test.ts`: TDD coverage copied in spirit from `__prototype__/src/domain/player/homingRules.test.ts`.
- Modify `src/domain/gameplay/playerAttack.ts`: extend `AttackInputDecision` to include `homing-then-melee` for airborne attack presses.
- Modify `src/domain/gameplay/playerAttack.test.ts`: update airborne decision expectations.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: generated reticle texture, Homing runtime state, reticle updates, target selection, Homing start/finish/trail, melee fallback, and state cleanup.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: fake runtime support for add.sprite, texture frame, tint/blend mode, setPosition/setTexture, reticle and trail assertions, Homing runtime assertions.

---

### Task 1: Player Homing Domain Rules

**Files:**
- Create: `src/domain/gameplay/playerHomingAttack.test.ts`
- Create: `src/domain/gameplay/playerHomingAttack.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/gameplay/playerHomingAttack.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  HOMING_ATTACK_BOUNCE_Y,
  HOMING_ATTACK_CONTACT_DISTANCE,
  HOMING_ATTACK_RANGE,
  HOMING_LINE_COIN_COLLECTION_RADIUS,
  HOMING_TARGET_REVERSE_TOLERANCE_X,
  HOMING_TRAIL_SPACING,
  canShowHomingReticle,
  canStartHomingAttack,
  getHomingAttackEntryState,
  getHomingContactPoint,
  getHomingFinishOutcome,
  getHomingLineCoinCollectionDecision,
  getHomingRecoveryState,
  getHomingTargetAcquisitionDecision,
  getHomingTrailSamples,
  homingAttackPresentation,
  homingAttackTiming,
  isHomingTargetAvailable,
  isHomingTargetEligible,
  isHomingTargetLost,
  isPointCollectableByHomingLine,
  selectNearestHomingTarget,
  shouldUpdateHomingAttack,
} from './playerHomingAttack'

describe('player Homing Attack constants', () => {
  it('keeps prototype Homing values explicit', () => {
    expect(HOMING_ATTACK_RANGE).toBe(360)
    expect(HOMING_TARGET_REVERSE_TOLERANCE_X).toBe(48)
    expect(HOMING_ATTACK_CONTACT_DISTANCE).toBe(34)
    expect(HOMING_ATTACK_BOUNCE_Y).toBe(-420)
    expect(HOMING_LINE_COIN_COLLECTION_RADIUS).toBe(52)
    expect(HOMING_TRAIL_SPACING).toBe(28)
    expect(homingAttackTiming).toEqual({
      recoveryDelayMs: 220,
      trailHoldMs: 70,
      trailFadeMs: 260,
    })
    expect(homingAttackPresentation).toEqual({
      reticleTextureKey: 'homing-reticle',
      reticleSize: 48,
      reticleYOffset: -8,
      attackFrame: 2,
      trailTint: 0x4be8ff,
      trailAlphaBase: 0.42,
      trailAlphaProgressReduction: 0.35,
    })
  })
})

describe('canStartHomingAttack', () => {
  it('allows only ready active players to start Homing', () => {
    expect(canStartHomingAttack({ attackReady: true, hurting: false, homingAttacking: false, dead: false })).toBe(true)
    expect(canStartHomingAttack({ attackReady: false, hurting: false, homingAttacking: false, dead: false })).toBe(false)
    expect(canStartHomingAttack({ attackReady: true, hurting: true, homingAttacking: false, dead: false })).toBe(false)
    expect(canStartHomingAttack({ attackReady: true, hurting: false, homingAttacking: true, dead: false })).toBe(false)
    expect(canStartHomingAttack({ attackReady: true, hurting: false, homingAttacking: false, dead: true })).toBe(false)
  })
})

describe('Homing state transitions', () => {
  it('enters, updates, acquires, finishes, and recovers like the prototype', () => {
    expect(getHomingAttackEntryState()).toEqual({ attackReady: false, attacking: true, homingAttacking: true })
    expect(shouldUpdateHomingAttack({ homingAttacking: true, hasTarget: true })).toBe(true)
    expect(shouldUpdateHomingAttack({ homingAttacking: false, hasTarget: true })).toBe(false)
    expect(shouldUpdateHomingAttack({ homingAttacking: true, hasTarget: false })).toBe(false)
    expect(getHomingTargetAcquisitionDecision({ hasTarget: true })).toBe('start')
    expect(getHomingTargetAcquisitionDecision({ hasTarget: false })).toBe('fail')
    expect(getHomingFinishOutcome({ hit: true, gravitySign: 1 })).toEqual({
      remainingAirJumps: 1,
      velocityY: -420,
      statusKey: 'status.homingHit',
    })
    expect(getHomingFinishOutcome({ hit: true, gravitySign: -1 })).toEqual({
      remainingAirJumps: 1,
      velocityY: 420,
      statusKey: 'status.homingHit',
    })
    expect(getHomingFinishOutcome({ hit: false, gravitySign: 1 })).toEqual({
      velocityY: 0,
      statusKey: 'status.homingMiss',
    })
    expect(getHomingRecoveryState({ hurting: false })).toEqual({ attacking: false, attackReady: true })
    expect(getHomingRecoveryState({ hurting: true })).toEqual({ attacking: false })
  })
})

describe('canShowHomingReticle', () => {
  it('shows only while airborne and unblocked', () => {
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: false, hurting: false, homingAttacking: false })).toBe(true)
    expect(canShowHomingReticle({ grounded: true, dead: false, attacking: false, hurting: false, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: true, attacking: false, hurting: false, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: true, hurting: false, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: false, hurting: true, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: false, hurting: false, homingAttacking: true })).toBe(false)
  })
})

describe('Homing target selection', () => {
  it('filters availability and target loss', () => {
    expect(isHomingTargetAvailable({ defeated: false, active: true, visible: true })).toBe(true)
    expect(isHomingTargetAvailable({ defeated: true, active: true, visible: true })).toBe(false)
    expect(isHomingTargetAvailable({ defeated: false, active: false, visible: true })).toBe(false)
    expect(isHomingTargetAvailable({ defeated: false, active: true, visible: false })).toBe(false)
    expect(isHomingTargetLost({ defeated: true, active: true, visible: true })).toBe(true)
    expect(isHomingTargetLost({ defeated: false, active: true, visible: true })).toBe(false)
  })

  it('honors range, facing direction, and reverse tolerance', () => {
    expect(isHomingTargetEligible({ playerX: 100, targetX: 200, facing: 1, distance: 360 })).toBe(true)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 200, facing: 1, distance: 361 })).toBe(false)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 51, facing: 1, distance: 80 })).toBe(false)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 52, facing: 1, distance: 80 })).toBe(true)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 100, facing: -1, distance: 80 })).toBe(true)
  })

  it('selects the nearest eligible target and keeps first tie', () => {
    expect(selectNearestHomingTarget({ playerX: 100, facing: 1, candidates: [] })).toBeUndefined()
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'behind-too-far', targetX: 40, distance: 40 },
        { target: 'eligible', targetX: 200, distance: 160 },
        { target: 'closer', targetX: 180, distance: 90 },
      ],
    })).toBe('closer')
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'first', targetX: 180, distance: 120 },
        { target: 'second', targetX: 190, distance: 120 },
      ],
    })).toBe('first')
  })
})

describe('Homing geometry and trail', () => {
  it('calculates contact points around targets', () => {
    expect(getHomingContactPoint({ startX: 0, startY: 0, targetX: 100, targetY: 0 })).toEqual({ x: 66, y: 0 })
    expect(getHomingContactPoint({ startX: 0, startY: 0, targetX: 100, targetY: 0, contactDistance: 10 })).toEqual({ x: 90, y: 0 })
    const diagonal = getHomingContactPoint({ startX: 0, startY: 0, targetX: 100, targetY: 100, contactDistance: 10 })
    expect(diagonal.x).toBeCloseTo(100 - Math.SQRT1_2 * 10)
    expect(diagonal.y).toBeCloseTo(100 - Math.SQRT1_2 * 10)
  })

  it('collects points along a Homing line as a pure helper', () => {
    expect(isPointCollectableByHomingLine({ startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 52 })).toBe(true)
    expect(isPointCollectableByHomingLine({ startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 53 })).toBe(false)
    expect(getHomingLineCoinCollectionDecision({ collected: true, startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 0 })).toBe('skip')
    expect(getHomingLineCoinCollectionDecision({ collected: false, startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 0 })).toBe('collect')
  })

  it('creates trail samples with prototype spacing and alpha falloff', () => {
    const samples = getHomingTrailSamples({ startX: 0, startY: 0, endX: 100, endY: 0, spacing: 28 })

    expect(samples).toHaveLength(4)
    expect(samples.map((sample) => sample.progress)).toEqual([0, 0.25, 0.5, 0.75])
    expect(samples.map((sample) => sample.x)).toEqual([0, 25, 50, 75])
    expect(samples[0]?.alpha).toBeCloseTo(0.42)
    expect(samples[3]?.alpha).toBeCloseTo(0.42 * (1 - 0.75 * 0.35))
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerHomingAttack.test.ts
```

Expected: FAIL because `./playerHomingAttack` does not exist.

- [ ] **Step 3: Implement the pure Homing domain module**

Create `src/domain/gameplay/playerHomingAttack.ts`:

```ts
export const HOMING_ATTACK_RANGE = 360
export const HOMING_TARGET_REVERSE_TOLERANCE_X = 48
export const HOMING_ATTACK_CONTACT_DISTANCE = 34
export const HOMING_ATTACK_BOUNCE_Y = -420
export const HOMING_LINE_COIN_COLLECTION_RADIUS = 52
export const HOMING_TRAIL_SPACING = 28

export const homingAttackTiming = {
  recoveryDelayMs: 220,
  trailHoldMs: 70,
  trailFadeMs: 260,
} as const

export const homingAttackPresentation = {
  reticleTextureKey: 'homing-reticle',
  reticleSize: 48,
  reticleYOffset: -8,
  attackFrame: 2,
  trailTint: 0x4be8ff,
  trailAlphaBase: 0.42,
  trailAlphaProgressReduction: 0.35,
} as const

export type HomingTargetCandidate<T> = {
  target: T
  targetX: number
  distance: number
}

export type HomingTrailSample = {
  x: number
  y: number
  progress: number
  alpha: number
}

export type HomingRecoveryState = {
  attacking: boolean
  attackReady?: boolean
}

export type HomingLineCoinCollectionDecision = 'skip' | 'collect'
export type HomingTargetAcquisitionDecision = 'fail' | 'start'
export type HomingFinishStatusKey = 'status.homingHit' | 'status.homingMiss'

export type HomingAttackEntryState = {
  attackReady: boolean
  attacking: boolean
  homingAttacking: boolean
}

export function canStartHomingAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking && !input.dead
}

export function getHomingAttackEntryState(): HomingAttackEntryState {
  return { attackReady: false, attacking: true, homingAttacking: true }
}

export function shouldUpdateHomingAttack(input: {
  homingAttacking: boolean
  hasTarget: boolean
}): boolean {
  return input.homingAttacking && input.hasTarget
}

export function getHomingTargetAcquisitionDecision(input: {
  hasTarget: boolean
}): HomingTargetAcquisitionDecision {
  return input.hasTarget ? 'start' : 'fail'
}

export function canShowHomingReticle(input: {
  grounded: boolean
  dead: boolean
  attacking: boolean
  hurting: boolean
  homingAttacking: boolean
}): boolean {
  return !input.grounded
    && !input.dead
    && !input.attacking
    && !input.hurting
    && !input.homingAttacking
}

export function isHomingTargetEligible(input: {
  playerX: number
  targetX: number
  facing: -1 | 1
  distance: number
  range?: number
  reverseToleranceX?: number
}): boolean {
  const range = input.range ?? HOMING_ATTACK_RANGE
  const reverseToleranceX = input.reverseToleranceX ?? HOMING_TARGET_REVERSE_TOLERANCE_X
  if (input.distance > range) return false

  const targetDirection = Math.sign(input.targetX - input.playerX) || input.facing
  return targetDirection === input.facing || Math.abs(input.targetX - input.playerX) <= reverseToleranceX
}

export function selectNearestHomingTarget<T>(input: {
  playerX: number
  facing: -1 | 1
  candidates: HomingTargetCandidate<T>[]
}): T | undefined {
  let selected: HomingTargetCandidate<T> | undefined
  for (const candidate of input.candidates) {
    if (!isHomingTargetEligible({
      playerX: input.playerX,
      targetX: candidate.targetX,
      facing: input.facing,
      distance: candidate.distance,
    })) {
      continue
    }
    if (!selected || candidate.distance < selected.distance) selected = candidate
  }
  return selected?.target
}

export function getHomingContactPoint(input: {
  startX: number
  startY: number
  targetX: number
  targetY: number
  contactDistance?: number
}): { x: number; y: number } {
  const contactDistance = input.contactDistance ?? HOMING_ATTACK_CONTACT_DISTANCE
  const angle = Math.atan2(input.targetY - input.startY, input.targetX - input.startX)
  return {
    x: input.targetX - Math.cos(angle) * contactDistance,
    y: input.targetY - Math.sin(angle) * contactDistance,
  }
}

export function getHomingFinishOutcome(input: {
  hit: boolean
  gravitySign: number
}): {
  remainingAirJumps?: number
  velocityY: number
  statusKey: HomingFinishStatusKey
} {
  if (input.hit) {
    return {
      remainingAirJumps: 1,
      velocityY: HOMING_ATTACK_BOUNCE_Y * input.gravitySign,
      statusKey: 'status.homingHit',
    }
  }
  return { velocityY: 0, statusKey: 'status.homingMiss' }
}

export function getHomingRecoveryState(input: { hurting: boolean }): HomingRecoveryState {
  return input.hurting ? { attacking: false } : { attacking: false, attackReady: true }
}

export function isHomingTargetLost(input: {
  defeated: boolean
  active: boolean
  visible: boolean
}): boolean {
  return input.defeated || !input.active || !input.visible
}

export function isHomingTargetAvailable(input: {
  defeated: boolean
  active: boolean
  visible: boolean
}): boolean {
  return !isHomingTargetLost(input)
}

export function isPointCollectableByHomingLine(input: {
  startX: number
  startY: number
  endX: number
  endY: number
  pointX: number
  pointY: number
  radius?: number
}): boolean {
  const radius = input.radius ?? HOMING_LINE_COIN_COLLECTION_RADIUS
  const dx = input.endX - input.startX
  const dy = input.endY - input.startY
  const lengthSquared = dx * dx + dy * dy
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(
      1,
      ((input.pointX - input.startX) * dx + (input.pointY - input.startY) * dy) / lengthSquared,
    ))
  const closestX = input.startX + dx * projection
  const closestY = input.startY + dy * projection
  return Math.hypot(closestX - input.pointX, closestY - input.pointY) <= radius
}

export function getHomingLineCoinCollectionDecision(input: {
  collected: boolean
  startX: number
  startY: number
  endX: number
  endY: number
  pointX: number
  pointY: number
  radius?: number
}): HomingLineCoinCollectionDecision {
  if (input.collected) return 'skip'
  return isPointCollectableByHomingLine(input) ? 'collect' : 'skip'
}

export function getHomingTrailSamples(input: {
  startX: number
  startY: number
  endX: number
  endY: number
  spacing?: number
}): HomingTrailSample[] {
  const spacing = input.spacing ?? HOMING_TRAIL_SPACING
  const distance = Math.hypot(input.endX - input.startX, input.endY - input.startY)
  const trailCount = Math.max(2, Math.ceil(distance / spacing))
  return Array.from({ length: trailCount }, (_, index) => {
    const progress = index / trailCount
    return {
      x: input.startX + (input.endX - input.startX) * progress,
      y: input.startY + (input.endY - input.startY) * progress,
      progress,
      alpha: homingAttackPresentation.trailAlphaBase *
        (1 - progress * homingAttackPresentation.trailAlphaProgressReduction),
    }
  })
}
```

- [ ] **Step 4: Run domain tests to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerHomingAttack.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run gameplay domain tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add src/domain/gameplay/playerHomingAttack.ts src/domain/gameplay/playerHomingAttack.test.ts
git commit -m "feat: add gameplay homing attack rules"
```

---

### Task 2: Attack Input Decision Supports Homing First

**Files:**
- Modify: `src/domain/gameplay/playerAttack.test.ts`
- Modify: `src/domain/gameplay/playerAttack.ts`

- [ ] **Step 1: Write the failing attack decision test**

In `src/domain/gameplay/playerAttack.test.ts`, replace the test named `uses melee for grounded and airborne presses until homing attack exists in the rebuild` with:

```ts
it('uses melee on the ground and Homing-first while airborne', () => {
  expect(getAttackInputDecision({ attackPressed: true, crouching: false, grounded: true })).toBe('melee')
  expect(getAttackInputDecision({ attackPressed: true, crouching: false, grounded: false })).toBe('homing-then-melee')
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerAttack.test.ts
```

Expected: FAIL because airborne attack still returns `melee`.

- [ ] **Step 3: Implement Homing-first attack decision**

In `src/domain/gameplay/playerAttack.ts`, change the decision type and function:

```ts
export type AttackInputDecision = 'none' | 'melee' | 'homing-then-melee'
```

```ts
export function getAttackInputDecision(input: AttackInput): AttackInputDecision {
  if (!input.attackPressed || input.crouching) return 'none'

  return input.grounded ? 'melee' : 'homing-then-melee'
}
```

- [ ] **Step 4: Run attack tests to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerAttack.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run gameplay domain tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/domain/gameplay/playerAttack.ts src/domain/gameplay/playerAttack.test.ts
git commit -m "feat: route airborne attack through homing"
```

---

### Task 3: Renderer Test Runtime Supports Homing Visuals

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer texture test**

Add imports from the new Homing domain module:

```ts
import {
  homingAttackPresentation,
  homingAttackTiming,
} from '../../domain/gameplay/playerHomingAttack'
```

In the Phaser mock, add:

```ts
Math: {
  Distance: {
    Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
  },
},
BlendModes: {
  ADD: 'ADD',
},
```

Extend `createSceneRuntime` scene type:

```ts
add: {
  tileSprite: (
    x: number,
    y: number,
    width: number,
    height: number,
    key: string,
  ) => ReturnType<typeof createFakeTileSprite>
  image: (x: number, y: number, texture: string) => ReturnType<typeof createFakeImage>
  sprite: (x: number, y: number, texture: string, frame?: number) => ReturnType<typeof createFakeArcadeSprite>
}
```

Add this test near the existing texture generation tests:

```ts
it('creates the generated Homing reticle texture from prototype dimensions', () => {
  const runtime = createSceneRuntime()

  runtime.scene.create()

  expect(runtime.generateTextureCalls).toContainEqual({
    key: homingAttackPresentation.reticleTextureKey,
    width: homingAttackPresentation.reticleSize,
    height: homingAttackPresentation.reticleSize,
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because `homing-reticle` is not generated.

- [ ] **Step 3: Expand fake sprite/image capabilities needed by Homing tests**

In `createFakeArcadeSprite`, add properties:

```ts
frame: undefined as number | undefined,
tint: undefined as number | undefined,
blendMode: undefined as string | undefined,
scaleX: 1,
scaleY: 1,
active: true,
```

Change `setScale` to keep scale axes:

```ts
setScale: (value: number) => {
  sprite.scale = value
  sprite.scaleX = value
  sprite.scaleY = value
  return sprite
},
```

Add methods:

```ts
setPosition: (x: number, y: number) => {
  sprite.x = x
  sprite.y = y
  return sprite
},
setTexture: (texture: string, frame?: number) => {
  sprite.texture = texture
  sprite.frame = frame
  return sprite
},
setTint: (value: number) => {
  sprite.tint = value
  return sprite
},
setBlendMode: (value: string) => {
  sprite.blendMode = value
  return sprite
},
```

In `createFakeImage`, add `depth`, `angle`, `blendMode`, `setDepth`, `setBlendMode`, `setPosition`, `setAngle`.

Add `spriteCalls` collection:

```ts
const spriteCalls: Array<ReturnType<typeof createFakeArcadeSprite>> = []
```

Implement `scene.add.sprite`:

```ts
sprite: (x, y, texture, frame) => {
  const sprite = createFakeArcadeSprite({ x, y, texture })
  sprite.frame = frame
  spriteCalls.push(sprite)
  return sprite
},
```

Return `spriteCalls` from `createSceneRuntime`.

- [ ] **Step 4: Do not implement renderer behavior yet**

Only test helper support should be added in this task. The new texture test should still fail until production code is updated in Task 4.

- [ ] **Step 5: Commit test runtime support if isolated by the executor**

If this task only changes test infrastructure and keeps a deliberate failing test for the next task, do not commit yet. If the executor adds helper support without a failing test, commit it with:

```bash
git add src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "test: support homing renderer fakes"
```

---

### Task 4: Renderer Reticle Targeting

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing reticle behavior tests**

Add tests:

```ts
it('shows the Homing reticle over the nearest eligible airborne target', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
  const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
  expect(guard).toBeDefined()
  expect(core).toBeDefined()
  if (!guard || !core || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1600
  runtime.playerSprite.y = 320
  runtime.playerSprite.setFlipX(false)
  guard.x = 1800
  guard.y = 432
  core.x = 1760
  core.y = 320

  runtime.scene.update()

  const reticle = runtime.images.find((image) => image.texture === homingAttackPresentation.reticleTextureKey)
  expect(reticle).toMatchObject({
    x: 1760,
    y: 320 + homingAttackPresentation.reticleYOffset,
    visible: true,
    depth: 20,
    blendMode: 'ADD',
  })
  expect(reticle?.angle).toBe(3)
})

it('hides the Homing reticle while grounded or when the target is defeated', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
  expect(core).toBeDefined()
  if (!core || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1600
  runtime.playerSprite.y = 320
  core.x = 1760
  core.y = 320
  runtime.scene.update()
  const reticle = runtime.images.find((image) => image.texture === homingAttackPresentation.reticleTextureKey)
  expect(reticle?.visible).toBe(true)

  runtime.playerSprite.body.blocked.down = true
  runtime.playerSprite.body.touching.down = true
  runtime.scene.update()
  expect(reticle?.visible).toBe(false)

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1712
  runtime.playerSprite.y = core.y
  runtime.playerKeys.z.isDown = true
  runtime.scene.update()
  expect(core.body.enable).toBe(false)
  runtime.playerKeys.z.isDown = false
  runtime.scene.update()
  expect(reticle?.visible).toBe(false)
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because reticle texture/update code does not exist.

- [ ] **Step 3: Implement generated Homing reticle texture**

In `create()`, call a new method after `createAttackHitboxTexture()`:

```ts
this.createHomingReticleTexture()
```

Add imports:

```ts
import {
  canShowHomingReticle,
  homingAttackPresentation,
  isHomingTargetAvailable,
  selectNearestHomingTarget,
} from '../../domain/gameplay/playerHomingAttack'
```

Add method:

```ts
private createHomingReticleTexture(): void {
  const graphics = this.make.graphics()
  const size = homingAttackPresentation.reticleSize
  const center = size / 2
  graphics.lineStyle(3, homingAttackPresentation.trailTint, 1)
  graphics.strokeCircle(center, center, 14)
  graphics.lineBetween(center, 3, center, 13)
  graphics.lineBetween(center, 35, center, 45)
  graphics.lineBetween(3, center, 13, center)
  graphics.lineBetween(35, center, 45, center)
  graphics.lineStyle(1, 0xffffff, 0.9)
  graphics.strokeCircle(center, center, 8)
  graphics.generateTexture(homingAttackPresentation.reticleTextureKey, size, size)
  graphics.destroy()
}
```

- [ ] **Step 4: Implement target lookup and reticle update**

Add state:

```ts
private isHomingAttacking = false
private homingTarget: Phaser.Physics.Arcade.Sprite | null = null
private homingReticle: Phaser.GameObjects.Image | null = null
```

Add helper:

```ts
private getPlayerFacingSign(): -1 | 1 {
  return this.player?.flipX ? -1 : 1
}

private findHomingTarget(): Phaser.Physics.Arcade.Sprite | undefined {
  if (!this.player) return undefined

  const candidates = this.enemies
    .filter((enemy) => isHomingTargetAvailable({
      defeated: enemy.defeated,
      active: enemy.sprite.active,
      visible: enemy.sprite.visible,
    }))
    .map((enemy) => ({
      target: enemy.sprite,
      targetX: enemy.sprite.x,
      distance: Phaser.Math.Distance.Between(this.player!.x, this.player!.y, enemy.sprite.x, enemy.sprite.y),
    }))

  return selectNearestHomingTarget({
    playerX: this.player.x,
    facing: this.getPlayerFacingSign(),
    candidates,
  })
}

private updateHomingReticle(grounded: boolean): void {
  if (!this.player || !canShowHomingReticle({
    grounded,
    dead: this.isPlayerDead,
    attacking: this.isAttacking,
    hurting: this.isPlayerHurting,
    homingAttacking: this.isHomingAttacking,
  })) {
    this.homingReticle?.setVisible(false)
    return
  }

  const target = this.findHomingTarget()
  if (!target) {
    this.homingReticle?.setVisible(false)
    return
  }

  if (!this.homingReticle) {
    this.homingReticle = this.add
      .image(target.x, target.y + homingAttackPresentation.reticleYOffset, homingAttackPresentation.reticleTextureKey)
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.ADD)
  }

  this.homingReticle
    .setPosition(target.x, target.y + homingAttackPresentation.reticleYOffset)
    .setVisible(true)
    .setAngle(this.homingReticle.angle + 3)
}
```

Call in `updatePlayerMovement` after `grounded` is computed and before attack handling:

```ts
this.updateHomingReticle(grounded)
```

- [ ] **Step 5: Run renderer tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS for reticle tests and existing renderer tests.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: show gameplay homing reticle"
```

---

### Task 5: Renderer Homing Attack Execution

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing Homing execution tests**

Add tests:

```ts
it('starts Homing Attack while airborne instead of spawning a melee hitbox', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
  expect(core).toBeDefined()
  if (!core || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1600
  runtime.playerSprite.y = 320
  core.x = 1760
  core.y = 320
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()

  expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(0)
  expect(core.body.enable).toBe(false)
  expect(runtime.playerSprite.texture).toBe(playerActorDefinition.sprites.attack.key)
  expect(runtime.playerSprite.frame).toBe(homingAttackPresentation.attackFrame)
  expect(runtime.playerSprite.x).toBe(1726)
  expect(runtime.playerSprite.y).toBe(320)
  expect(runtime.playerSprite.velocityX).toBe(0)
  expect(runtime.playerSprite.velocityY).toBe(-420)
})

it('falls back to airborne melee when no Homing target can be acquired', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  expect(runtime.playerSprite).toBeDefined()
  if (!runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 3000
  runtime.playerSprite.y = 320
  runtime.playerKeys.z.isDown = true
  runtime.scene.update()

  expect(runtime.images[0]).toMatchObject({
    texture: 'attack-hitbox',
    visible: false,
  })
})

it('recovers Homing attack readiness after prototype delay', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
  expect(core).toBeDefined()
  if (!core || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1600
  runtime.playerSprite.y = 320
  core.x = 1760
  core.y = 320
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()
  runtime.playerKeys.j.isDown = false
  runtime.scene.update()
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()
  expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(0)

  runtime.runDelayedCalls(homingAttackTiming.recoveryDelayMs)
  runtime.playerKeys.j.isDown = false
  runtime.scene.update()
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()
  expect(runtime.images.some((image) => image.texture === 'attack-hitbox')).toBe(true)
})
```

- [ ] **Step 2: Write failing Homing trail test**

Add test:

```ts
it('emits Homing trail sprites using attack frame and fades them out', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
  expect(core).toBeDefined()
  if (!core || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1600
  runtime.playerSprite.y = 320
  core.x = 1760
  core.y = 320
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()

  const trailSprites = runtime.spriteCalls.filter((sprite) => sprite.texture === playerActorDefinition.sprites.attack.key)
  expect(trailSprites.length).toBeGreaterThan(2)
  expect(trailSprites[0]).toMatchObject({
    frame: homingAttackPresentation.attackFrame,
    tint: homingAttackPresentation.trailTint,
    blendMode: 'ADD',
    flipX: false,
  })
  expect(runtime.tweenCalls).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        targets: trailSprites[0],
        alpha: 0,
        duration: homingAttackTiming.trailFadeMs,
        delay: homingAttackTiming.trailHoldMs,
      }),
    ]),
  )

  const trailTween = runtime.tweenCalls.find((call) => call.targets === trailSprites[0])
  expect(trailSprites[0]?.destroyed).toBe(false)
  trailTween?.onComplete?.()
  expect(trailSprites[0]?.destroyed).toBe(true)
})
```

Update `TweenCall` type in test file to include:

```ts
delay?: number
onComplete?: () => void
```

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because Homing startup, movement, trail, and recovery are not implemented.

- [ ] **Step 4: Implement Homing imports and state reset**

Add imports:

```ts
import {
  canStartHomingAttack,
  getHomingAttackEntryState,
  getHomingContactPoint,
  getHomingFinishOutcome,
  getHomingRecoveryState,
  getHomingTargetAcquisitionDecision,
  getHomingTrailSamples,
  homingAttackTiming,
  shouldUpdateHomingAttack,
  isHomingTargetLost,
} from '../../domain/gameplay/playerHomingAttack'
```

Reset Homing state in `createPlayer` and `respawnPlayer`:

```ts
this.isHomingAttacking = false
this.homingTarget = null
this.homingReticle?.setVisible(false)
```

- [ ] **Step 5: Implement Homing attack startup and melee fallback**

In `tryStartPlayerAttack`, change the decision handling:

```ts
if (decision === 'none') return

if (decision === 'homing-then-melee' && this.tryHomingAttack()) {
  return
}

if (decision !== 'melee' && decision !== 'homing-then-melee') return
```

Pass actual Homing state to melee gate:

```ts
homingAttacking: this.isHomingAttacking,
```

Add method:

```ts
private tryHomingAttack(): boolean {
  if (!this.player || !canStartHomingAttack({
    attackReady: this.attackReady,
    hurting: this.isPlayerHurting,
    homingAttacking: this.isHomingAttacking,
    dead: this.isPlayerDead,
  })) {
    return false
  }

  const target = this.findHomingTarget()
  if (getHomingTargetAcquisitionDecision({ hasTarget: target !== undefined }) === 'fail' || !target) {
    return false
  }

  const entry = getHomingAttackEntryState()
  this.attackReady = entry.attackReady
  this.isAttacking = entry.attacking
  this.isHomingAttacking = entry.homingAttacking
  this.homingTarget = target
  this.homingReticle?.setVisible(false)
  this.resolveHomingAttack(target)

  return true
}
```

- [ ] **Step 6: Implement Homing resolve, finish, and trail**

Add methods:

```ts
private resolveHomingAttack(target: Phaser.Physics.Arcade.Sprite): void {
  if (!this.player) return

  const startX = this.player.x
  const startY = this.player.y
  const contact = getHomingContactPoint({
    startX,
    startY,
    targetX: target.x,
    targetY: target.y,
  })

  this.player.setFlipX(target.x < startX)
  this.player.setTexture(playerActorDefinition.sprites.attack.key, homingAttackPresentation.attackFrame)
  this.emitHomingTrail(startX, startY, contact.x, contact.y)
  this.player.setPosition(contact.x, contact.y)
  this.player.setVelocity(0, 0)

  const enemy = this.enemies.find((candidate) => candidate.sprite === target)
  if (enemy && shouldProcessEnemyDefeat({ enemyExists: true, defeated: enemy.defeated })) {
    this.defeatEnemy(enemy)
  }

  this.finishHomingAttack(true)
}

private finishHomingAttack(hit: boolean): void {
  if (!this.player) return

  this.isHomingAttacking = false
  this.homingTarget = null
  const outcome = getHomingFinishOutcome({ hit, gravitySign: 1 })

  if (outcome.remainingAirJumps !== undefined && this.playerJumpState) {
    this.playerJumpState = {
      ...this.playerJumpState,
      remainingAirJumps: outcome.remainingAirJumps,
    }
  }

  this.player.setVelocity(0, outcome.velocityY)

  this.time.delayedCall(homingAttackTiming.recoveryDelayMs, () => {
    const recovery = getHomingRecoveryState({ hurting: this.isPlayerHurting })
    this.isAttacking = recovery.attacking
    if (recovery.attackReady !== undefined) {
      this.attackReady = recovery.attackReady
    }
  })
}

private emitHomingTrail(startX: number, startY: number, endX: number, endY: number): void {
  if (!this.player) return

  for (const sample of getHomingTrailSamples({ startX, startY, endX, endY })) {
    const trail = this.add
      .sprite(sample.x, sample.y, playerActorDefinition.sprites.attack.key, homingAttackPresentation.attackFrame)
      .setDepth(this.player.depth - 1)
      .setScale(this.player.scale)
      .setFlipX(this.player.flipX)
      .setTint(homingAttackPresentation.trailTint)
      .setAlpha(sample.alpha)
      .setBlendMode(Phaser.BlendModes.ADD)

    this.tweens.add({
      targets: trail,
      alpha: 0,
      duration: homingAttackTiming.trailFadeMs,
      delay: homingAttackTiming.trailHoldMs,
      onComplete: () => trail.destroy(),
    })
  }
}
```

Add Homing target loss check for future-proofing:

```ts
private updateHomingAttack(): void {
  const target = this.homingTarget
  if (!shouldUpdateHomingAttack({ homingAttacking: this.isHomingAttacking, hasTarget: target !== null })) {
    return
  }
  if (!target) return

  const enemy = this.enemies.find((candidate) => candidate.sprite === target)
  if (!enemy || isHomingTargetLost({ defeated: enemy.defeated, active: target.active, visible: target.visible })) {
    this.finishHomingAttack(false)
  }
}
```

Call `this.updateHomingAttack()` in `update()` after `processActiveMeleeHitboxes()`.

- [ ] **Step 7: Run renderer tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run check for TypeScript API correctness**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 9: Commit Task 5**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: execute gameplay homing attack"
```

---

### Task 6: Homing State Interactions With Hurt, Death, and Contact Damage

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing interaction tests**

Add tests:

```ts
it('does not apply enemy contact damage during Homing Attack', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
  const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
  expect(core).toBeDefined()
  expect(guard).toBeDefined()
  if (!core || !guard || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1600
  runtime.playerSprite.y = 320
  core.x = 1760
  core.y = 320
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()
  runtime.playerSprite.velocityX = 0
  runtime.playerSprite.velocityY = 0

  runtime.triggerEnemyOverlap(guard)

  expect(runtime.playerSprite.playCalls.at(-1)).not.toEqual({
    key: playerActorDefinition.sprites.hurt.key,
    ignoreIfPlaying: true,
  })
  expect(runtime.playerSprite.velocityY).toBe(0)
})

it('clears Homing reticle and target when hurt, dead, and respawned', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
  const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
  expect(guard).toBeDefined()
  expect(core).toBeDefined()
  if (!guard || !core || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 1600
  runtime.playerSprite.y = 320
  core.x = 1760
  core.y = 320
  runtime.scene.update()
  const reticle = runtime.images.find((image) => image.texture === homingAttackPresentation.reticleTextureKey)
  expect(reticle?.visible).toBe(true)

  runtime.triggerEnemyOverlap(guard)
  expect(reticle?.visible).toBe(false)

  runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
  runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)
  runtime.triggerEnemyOverlap(guard)
  runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
  runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)
  runtime.triggerEnemyOverlap(guard)
  runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
  runtime.triggerFadeOutComplete()

  expect(reticle?.visible).toBe(false)
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL if enemy contact still passes `homingAttacking: false` or cleanup does not hide the reticle.

- [ ] **Step 3: Implement Homing cleanup helper**

Add helper:

```ts
private clearHomingState(): void {
  this.isHomingAttacking = false
  this.homingTarget = null
  this.homingReticle?.setVisible(false)
}
```

Use it in:

- `handlePlayerEnemyContact` after hurt entry state is applied.
- `defeatPlayer` after defeat entry state is applied.
- `respawnPlayer`.
- `createPlayer`.

Change enemy contact gate:

```ts
homingAttacking: this.isHomingAttacking,
```

- [ ] **Step 4: Run renderer tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full verification commands**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected:

- `npm run test`: all tests pass.
- `npm run check`: no errors and no warnings.
- `npm run build`: exit code `0`; existing Vite chunk-size warning is acceptable if unchanged.
- `git diff --check`: no output.

- [ ] **Step 6: Commit Task 6**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "fix: integrate homing with player life states"
```

---

### Task 7: Final Review And Completion Audit

**Files:**
- Inspect: `docs/superpowers/specs/2026-07-02-gameplay-homing-attack-design.md`
- Inspect: `src/domain/gameplay/playerHomingAttack.ts`
- Inspect: `src/domain/gameplay/playerAttack.ts`
- Inspect: `src/ui/gameplay/createGameplayRenderer.ts`
- Inspect: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Run final verification**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected:

- `npm run test`: all tests pass.
- `npm run check`: no errors and no warnings.
- `npm run build`: exit code `0`; existing Vite chunk-size warning is acceptable if unchanged.
- `git diff --check`: no output.

- [ ] **Step 2: Audit spec acceptance criteria**

Confirm evidence for every acceptance criterion:

- Player can Homing Attack an eligible enemy while airborne: renderer Homing execution test.
- Nearest eligible target uses prototype range/facing/reverse tolerance: domain selection tests and reticle test.
- Visible reticle tracks target while airborne: renderer reticle test.
- Homing uses player attack frame `2` and generated trail: renderer execution/trail tests.
- Homing defeats Armor Guard and Azure Core through existing defeat behavior: add or confirm renderer tests include one target of each enemy type.
- Homing hit bounces and recovers after `220ms`: renderer execution/recovery tests.
- Airborne no-target fallback melee: renderer fallback test.
- Hurt/death/respawn lockouts: renderer interaction tests.
- No runtime asset path points to `__prototype__`: `rg -n "__prototype__" src public` should not show runtime references.

- [ ] **Step 3: Add any missing final coverage**

If Task 7 audit finds that Armor Guard or Azure Core coverage is missing, add the smallest renderer test before completing:

```ts
it('can Homing Attack Armor Guard through the existing defeat presentation', () => {
  const runtime = createSceneRuntime()
  runtime.scene.create()
  const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
  expect(guard).toBeDefined()
  if (!guard || !runtime.playerSprite) return

  runtime.playerSprite.body.blocked.down = false
  runtime.playerSprite.body.touching.down = false
  runtime.playerSprite.x = 560
  runtime.playerSprite.y = guard.y
  runtime.playerSprite.setFlipX(false)
  guard.x = 720
  runtime.playerKeys.j.isDown = true
  runtime.scene.update()

  expect(guard.body.enable).toBe(false)
  expect(guard.playCalls.at(-1)).toEqual({ key: 'enemy-guard-death', ignoreIfPlaying: true })
})
```

Run RED/GREEN if this test is added, then run the full final verification again.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected: clean or only intentional final test coverage changes staged for commit.

- [ ] **Step 5: Commit final coverage if needed**

If Task 7 added test coverage:

```bash
git add src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "test: cover homing attack enemy variants"
```

If Task 7 made no changes, do not create an empty commit.
