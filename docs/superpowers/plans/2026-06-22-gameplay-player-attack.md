# Gameplay Player Attack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first playable melee attack slice so the player can attack Armor Guard and Azure Core enemies, with prototype-matched hitbox timing and enemy defeat reactions.

**Architecture:** Keep attack decisions, hitbox geometry, and enemy defeat routing in pure domain modules under `src/domain/gameplay`. Keep Phaser-specific animation, invisible hitbox images, delayed callbacks, and tweens in `src/ui/gameplay/createGameplayRenderer.ts`. Runtime assets are copied from `__prototype__/public/assets` into root `public/assets`; no rebuilt code imports from `__prototype__`.

**Tech Stack:** TypeScript, Vitest, Phaser 3, Svelte, Vite.

---

## Files And Responsibilities

- Create `src/domain/gameplay/playerAttack.ts`: pure attack input, cooldown, hitbox geometry, and hit candidate rules.
- Create `src/domain/gameplay/playerAttack.test.ts`: TDD coverage for attack rules copied from the prototype slice.
- Modify `src/domain/gameplay/playerActor.ts`: add the player attack animation metadata to the actor definition.
- Modify `src/domain/gameplay/playerActor.test.ts`: verify the attack sprite metadata and prototype frame timing.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`: include the copied attack asset in public asset path coverage.
- Copy `__prototype__/public/assets/sprites/player_attack/sheet-transparent.webp` to `public/assets/sprites/player_attack/sheet-transparent.webp`.
- Modify `src/domain/gameplay/enemyActor.ts`: add enemy defeat presentation metadata and skip patrol for defeated enemies.
- Modify `src/domain/gameplay/enemyActor.test.ts`: verify defeat routing and defeated patrol behavior.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: wire J/Z attack input, invisible hitbox, enemy intersection, death presentation, and cooldown timing.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: extend the Phaser fake runtime and test renderer behavior.

## Prototype Facts To Preserve

- Attack keys: `J` and `Z`.
- Attack animation: `player-attack`, frame width/height `128`, frames `0..3`, frame rate `12`, repeat `0`.
- Melee hitbox texture: `56x36`, invisible at runtime.
- Hitbox geometry: `x = playerX + (flipX ? -48 : 48)`, `y = playerY - 4`.
- Hitbox lifetime: `120ms`.
- Attack state ends after `340ms`; attack becomes ready after `360ms`.
- Armor Guard defeat: stop velocity, disable body, play `enemy-guard-death`, hide after `520ms`.
- Azure Core defeat: stop velocity, disable body, kill floating tween, burst tween to `scale: 1.8`, `alpha: 0`, `angle + 90`, `duration: 260`, `ease: 'Quad.easeOut'`, hide after `520ms`.

### Task 1: Player Attack Domain Rules

**Files:**
- Create: `src/domain/gameplay/playerAttack.test.ts`
- Create: `src/domain/gameplay/playerAttack.ts`

- [ ] **Step 1: Write the failing attack rule tests**

Create `src/domain/gameplay/playerAttack.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  getAttackInputDecision,
  canStartMeleeAttack,
  getMeleeAttackEntryState,
  getMeleeAttackEndState,
  getMeleeAttackReadyState,
  getMeleeHitboxGeometry,
  isMeleeHitCandidate,
  meleeAttackTiming,
} from './playerAttack'

describe('getAttackInputDecision', () => {
  it('does not attack without a fresh attack press', () => {
    expect(getAttackInputDecision({ attackPressed: false, crouching: false, grounded: true })).toBe('none')
  })

  it('does not attack while crouching', () => {
    expect(getAttackInputDecision({ attackPressed: true, crouching: true, grounded: true })).toBe('none')
  })

  it('uses melee for grounded and airborne presses until homing attack exists in the rebuild', () => {
    expect(getAttackInputDecision({ attackPressed: true, crouching: false, grounded: true })).toBe('melee')
    expect(getAttackInputDecision({ attackPressed: true, crouching: false, grounded: false })).toBe('melee')
  })
})

describe('canStartMeleeAttack', () => {
  it('requires attack readiness and blocks hurt or homing states', () => {
    expect(canStartMeleeAttack({ attackReady: true, hurting: false, homingAttacking: false })).toBe(true)
    expect(canStartMeleeAttack({ attackReady: false, hurting: false, homingAttacking: false })).toBe(false)
    expect(canStartMeleeAttack({ attackReady: true, hurting: true, homingAttacking: false })).toBe(false)
    expect(canStartMeleeAttack({ attackReady: true, hurting: false, homingAttacking: true })).toBe(false)
  })
})

describe('melee attack state transitions', () => {
  it('matches prototype attack readiness transitions and timing', () => {
    expect(getMeleeAttackEntryState()).toEqual({ attackReady: false, attacking: true })
    expect(getMeleeAttackEndState()).toEqual({ attacking: false })
    expect(getMeleeAttackReadyState()).toEqual({ attackReady: true })
    expect(meleeAttackTiming).toEqual({
      hitboxLifetimeMs: 120,
      attackEndDelayMs: 340,
      readyDelayMs: 360,
    })
  })
})

describe('getMeleeHitboxGeometry', () => {
  it('places a forward hitbox while facing right', () => {
    expect(getMeleeHitboxGeometry({ playerX: 100, playerY: 200, playerFlipX: false })).toEqual({
      x: 148,
      y: 196,
      width: 56,
      height: 36,
      flipX: false,
    })
  })

  it('places a forward hitbox while facing left', () => {
    expect(getMeleeHitboxGeometry({ playerX: 100, playerY: 200, playerFlipX: true })).toEqual({
      x: 52,
      y: 196,
      width: 56,
      height: 36,
      flipX: true,
    })
  })
})

describe('isMeleeHitCandidate', () => {
  it('only allows active intersecting enemies to be hit', () => {
    expect(isMeleeHitCandidate({ defeated: false, intersectsHitbox: true })).toBe(true)
    expect(isMeleeHitCandidate({ defeated: true, intersectsHitbox: true })).toBe(false)
    expect(isMeleeHitCandidate({ defeated: false, intersectsHitbox: false })).toBe(false)
  })
})
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerAttack.test.ts
```

Expected: FAIL because `src/domain/gameplay/playerAttack.ts` does not exist.

- [ ] **Step 3: Implement the pure attack rules**

Create `src/domain/gameplay/playerAttack.ts`:

```ts
export type AttackInputDecision = 'none' | 'melee'

export type AttackInput = {
  attackPressed: boolean
  crouching: boolean
  grounded: boolean
}

export type MeleeAttackEntryState = {
  attackReady: boolean
  attacking: boolean
}

export type MeleeAttackEndState = {
  attacking: boolean
}

export type MeleeAttackReadyState = {
  attackReady: boolean
}

export type MeleeHitboxGeometry = {
  x: number
  y: number
  width: number
  height: number
  flipX: boolean
}

export const meleeAttackTiming = {
  hitboxLifetimeMs: 120,
  attackEndDelayMs: 340,
  readyDelayMs: 360,
} as const

export const meleeHitboxSize = {
  width: 56,
  height: 36,
} as const

const MELEE_HITBOX_FORWARD_OFFSET_X = 48
const MELEE_HITBOX_OFFSET_Y = -4

export function getAttackInputDecision(input: AttackInput): AttackInputDecision {
  if (!input.attackPressed || input.crouching) return 'none'

  return 'melee'
}

export function canStartMeleeAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking
}

export function getMeleeAttackEntryState(): MeleeAttackEntryState {
  return { attackReady: false, attacking: true }
}

export function getMeleeAttackEndState(): MeleeAttackEndState {
  return { attacking: false }
}

export function getMeleeAttackReadyState(): MeleeAttackReadyState {
  return { attackReady: true }
}

export function getMeleeHitboxGeometry(input: {
  playerX: number
  playerY: number
  playerFlipX: boolean
}): MeleeHitboxGeometry {
  const direction = input.playerFlipX ? -1 : 1

  return {
    x: input.playerX + direction * MELEE_HITBOX_FORWARD_OFFSET_X,
    y: input.playerY + MELEE_HITBOX_OFFSET_Y,
    width: meleeHitboxSize.width,
    height: meleeHitboxSize.height,
    flipX: input.playerFlipX,
  }
}

export function isMeleeHitCandidate(input: {
  defeated: boolean
  intersectsHitbox: boolean
}): boolean {
  return !input.defeated && input.intersectsHitbox
}
```

- [ ] **Step 4: Run focused domain tests and confirm GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerAttack.test.ts
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/gameplay/playerAttack.ts src/domain/gameplay/playerAttack.test.ts
git commit -m "feat: add gameplay player attack rules"
```

### Task 2: Player Attack Animation Metadata And Asset

**Files:**
- Modify: `src/domain/gameplay/playerActor.ts`
- Modify: `src/domain/gameplay/playerActor.test.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Copy: `__prototype__/public/assets/sprites/player_attack/sheet-transparent.webp` to `public/assets/sprites/player_attack/sheet-transparent.webp`

- [ ] **Step 1: Write failing metadata and asset tests**

Modify `src/domain/gameplay/playerActor.test.ts` so the `sprites` object includes:

```ts
        attack: {
          key: 'player-attack',
          assetRef: '/assets/sprites/player_attack/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 12,
          repeat: 0,
        },
```

Modify `src/domain/gameplay/gameplayStageMaps.test.ts` so `assetRefs` uses all player sprite asset refs:

```ts
    const assetRefs = [
      ...stage.backgroundLayers.map((layer) => layer.assetRef),
      stage.terrain.tilesetAssetRef,
      ...Object.values(playerActorDefinition.sprites).map((sprite) => sprite.assetRef),
      ...enemyAssetRefs,
    ]
```

Update the expected asset list to include:

```ts
      '/assets/sprites/player_attack/sheet-transparent.webp',
```

immediately after `/assets/sprites/player_jump/sheet-transparent.webp`.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `PlayerAnimationKey` and `playerActorDefinition.sprites` do not include `attack`.

- [ ] **Step 3: Add attack metadata**

Modify `src/domain/gameplay/playerActor.ts`:

```ts
export type PlayerAnimationKey = 'idle' | 'run' | 'jump' | 'attack'
```

Add this entry to `playerActorDefinition.sprites` after `jump`:

```ts
    attack: {
      key: 'player-attack',
      assetRef: '/assets/sprites/player_attack/sheet-transparent.webp',
      frameWidth: 128,
      frameHeight: 128,
      frameStart: 0,
      frameEnd: 3,
      frameRate: 12,
      repeat: 0,
    },
```

- [ ] **Step 4: Copy the runtime asset**

Run:

```bash
mkdir -p public/assets/sprites/player_attack
cp __prototype__/public/assets/sprites/player_attack/sheet-transparent.webp public/assets/sprites/player_attack/sheet-transparent.webp
```

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/domain/gameplay/playerActor.ts src/domain/gameplay/playerActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts public/assets/sprites/player_attack/sheet-transparent.webp
git commit -m "feat: add gameplay player attack sprite"
```

### Task 3: Enemy Defeat Domain Rules

**Files:**
- Modify: `src/domain/gameplay/enemyActor.ts`
- Modify: `src/domain/gameplay/enemyActor.test.ts`

- [ ] **Step 1: Write failing enemy defeat tests**

Modify the import in `src/domain/gameplay/enemyActor.test.ts`:

```ts
import {
  enemyActorDefinitions,
  enemyDefeatPresentation,
  getEnemyDefeatPresentation,
  getNextEnemyPatrolDirection,
  getEnemySpawnY,
  shouldProcessEnemyDefeat,
  shouldUpdateEnemyPatrol,
} from './enemyActor'
```

Update the existing patrol test:

```ts
describe('shouldUpdateEnemyPatrol', () => {
  it('updates active Armor Guard patrol and skips defeated enemies or Azure Cores', () => {
    expect(shouldUpdateEnemyPatrol({ type: 'armor-guard', defeated: false })).toBe(true)
    expect(shouldUpdateEnemyPatrol({ type: 'armor-guard', defeated: true })).toBe(false)
    expect(shouldUpdateEnemyPatrol({ type: 'azure-core', defeated: false })).toBe(false)
  })
})
```

Add defeat tests:

```ts
describe('enemy defeat presentation', () => {
  it('defines prototype presentation timings for defeated enemies', () => {
    expect(enemyDefeatPresentation).toEqual({
      hideDelayMs: 520,
      azureCoreBurst: {
        scale: 1.8,
        alpha: 0,
        angleDelta: 90,
        durationMs: 260,
        ease: 'Quad.easeOut',
      },
    })
  })

  it('routes each enemy type to its defeat presentation', () => {
    expect(getEnemyDefeatPresentation('armor-guard')).toBe('armor-guard-death')
    expect(getEnemyDefeatPresentation('azure-core')).toBe('azure-core-burst')
  })
})

describe('shouldProcessEnemyDefeat', () => {
  it('processes only existing active enemies', () => {
    expect(shouldProcessEnemyDefeat({ enemyExists: true, defeated: false })).toBe(true)
    expect(shouldProcessEnemyDefeat({ enemyExists: true, defeated: true })).toBe(false)
    expect(shouldProcessEnemyDefeat({ enemyExists: false, defeated: false })).toBe(false)
  })
})
```

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
```

Expected: FAIL because the defeat exports and new patrol signature do not exist.

- [ ] **Step 3: Implement enemy defeat routing**

Modify `src/domain/gameplay/enemyActor.ts`:

```ts
export type EnemyDefeatPresentation = 'armor-guard-death' | 'azure-core-burst'
```

Add after `enemyActorDefinitions`:

```ts
export const enemyDefeatPresentation = {
  hideDelayMs: 520,
  azureCoreBurst: {
    scale: 1.8,
    alpha: 0,
    angleDelta: 90,
    durationMs: 260,
    ease: 'Quad.easeOut',
  },
} as const
```

Replace `shouldUpdateEnemyPatrol` with:

```ts
export function shouldUpdateEnemyPatrol(input: {
  type: EnemyActorType
  defeated: boolean
}): boolean {
  return input.type === 'armor-guard' && !input.defeated
}
```

Add:

```ts
export function getEnemyDefeatPresentation(type: EnemyActorType): EnemyDefeatPresentation {
  if (type === 'armor-guard') return 'armor-guard-death'

  return 'azure-core-burst'
}

export function shouldProcessEnemyDefeat(input: {
  enemyExists: boolean
  defeated: boolean
}): boolean {
  return input.enemyExists && !input.defeated
}
```

- [ ] **Step 4: Run focused domain tests and confirm GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
npm run test -- src/domain/gameplay
```

Expected: PASS after updating the renderer call site in Task 4; if TypeScript import errors surface during this test command, complete Task 4 before full test verification.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/domain/gameplay/enemyActor.ts src/domain/gameplay/enemyActor.test.ts
git commit -m "feat: add gameplay enemy defeat rules"
```

### Task 4: Phaser Attack Runtime

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Extend the Phaser test fake with failing attack behavior tests**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, extend the Phaser mock `KeyCodes`:

```ts
            J: 74,
            Z: 90,
```

Add `Geom.Intersects.RectangleToRectangle` to the mock:

```ts
      Geom: {
        Intersects: {
          RectangleToRectangle: (
            a: { x: number; y: number; width: number; height: number },
            b: { x: number; y: number; width: number; height: number },
          ) =>
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y,
        },
      },
```

Expand `FakePlayerKeys`:

```ts
  j: { isDown: boolean }
  z: { isDown: boolean }
```

Extend `createFakeArcadeSprite` with attack-observable state:

```ts
    angle: 0,
    alpha: 1,
    visible: true,
    destroyed: false,
    body: {
      enable: true,
      allowGravity: true,
      blocked: { down: true },
      touching: { down: true },
      size: { width: 0, height: 0 },
      offset: { x: 0, y: 0 },
      setSize: (width: number, height: number) => {
        sprite.body.size = { width, height }
      },
      setOffset: (x: number, y: number) => {
        sprite.body.offset = { x, y }
      },
    },
    setVelocity: (x: number, y: number) => {
      sprite.velocityX = x
      sprite.velocityY = y
      return sprite
    },
    setVisible: (value: boolean) => {
      sprite.visible = value
      return sprite
    },
    setAlpha: (value: number) => {
      sprite.alpha = value
      return sprite
    },
    setAngle: (value: number) => {
      sprite.angle = value
      return sprite
    },
    destroy: () => {
      sprite.destroyed = true
    },
    getBounds: () => ({
      x: sprite.x - sprite.body.size.width / 2,
      y: sprite.y - sprite.body.size.height / 2,
      width: sprite.body.size.width,
      height: sprite.body.size.height,
    }),
```

Add a fake image object for hitboxes:

```ts
function createFakeImage(input: { x: number; y: number; texture: string }) {
  const image = {
    ...input,
    width: 56,
    height: 36,
    visible: true,
    flipX: false,
    destroyed: false,
    setVisible: (value: boolean) => {
      image.visible = value
      return image
    },
    setFlipX: (value: boolean) => {
      image.flipX = value
      return image
    },
    destroy: () => {
      image.destroyed = true
    },
    getBounds: () => ({
      x: image.x - image.width / 2,
      y: image.y - image.height / 2,
      width: image.width,
      height: image.height,
    }),
  }

  return image
}
```

Extend runtime state with:

```ts
  const images: Array<ReturnType<typeof createFakeImage>> = []
  const delayedCalls: Array<{ delay: number; callback: () => void }> = []
  const killedTweenTargets: unknown[] = []
```

Extend fake `scene.add`:

```ts
    image: (x: number, y: number, texture: string) => {
      const image = createFakeImage({ x, y, texture })
      images.push(image)
      return image
    },
```

Extend fake `scene.time`:

```ts
    now: 0,
    delayedCall: (delay: number, callback: () => void) => {
      delayedCalls.push({ delay, callback })
    },
```

Extend fake `scene.tweens`:

```ts
    add: (config) => {
      tweenCalls.push(config)
    },
    killTweensOf: (target) => {
      killedTweenTargets.push(target)
    },
```

Return these observability helpers from `createSceneRuntime`:

```ts
    images,
    delayedCalls,
    killedTweenTargets,
    runDelayedCalls: (delay: number) => {
      for (const call of delayedCalls.filter((candidate) => candidate.delay === delay)) {
        call.callback()
      }
    },
```

Add tests:

```ts
  it('preloads and registers the player attack animation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()
    runtime.scene.create()

    expect(runtime.spritesheetCalls).toContainEqual({
      key: 'player-attack',
      assetRef: '/assets/sprites/player_attack/sheet-transparent.webp',
      frameWidth: 128,
      frameHeight: 128,
    })
    expect(runtime.animationCreateCalls).toContainEqual({
      key: 'player-attack',
      frames: [
        { key: 'player-attack', frame: 0 },
        { key: 'player-attack', frame: 1 },
        { key: 'player-attack', frame: 2 },
        { key: 'player-attack', frame: 3 },
      ],
      frameRate: 12,
      repeat: 0,
    })
  })

  it('creates an invisible melee hitbox and keeps attack animation priority on J press', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.images[0]).toMatchObject({
      x: 304,
      y: 432,
      texture: 'attack-hitbox',
      visible: false,
      flipX: false,
    })
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({ key: 'player-attack', ignoreIfPlaying: true })
  })

  it('destroys the hitbox, ends attack, and restores readiness on prototype delays', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    const hitbox = runtime.images[0]

    runtime.runDelayedCalls(120)
    expect(hitbox.destroyed).toBe(true)

    runtime.runDelayedCalls(340)
    runtime.playerKeys.j.isDown = false
    runtime.scene.update()
    expect(runtime.playerSprite?.playCalls.at(-1)?.key).toBe('player-idle')

    runtime.runDelayedCalls(360)
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    expect(runtime.images).toHaveLength(2)
  })

  it('defeats Armor Guard with the guard death presentation and stops patrol updates', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard) return

    runtime.playerSprite!.x = 672
    runtime.playerSprite!.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(guard.body.enable).toBe(false)
    expect(guard.velocityX).toBe(0)
    expect(guard.playCalls.at(-1)).toEqual({ key: 'enemy-guard-death', ignoreIfPlaying: true })

    guard.x = 999
    runtime.scene.update()
    expect(guard.velocityX).toBe(0)

    runtime.runDelayedCalls(520)
    expect(guard.visible).toBe(false)
  })

  it('defeats Azure Core with a burst tween and ignores defeated enemies on later attacks', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core) return

    runtime.playerSprite!.x = 1712
    runtime.playerSprite!.y = core.y
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()

    expect(core.body.enable).toBe(false)
    expect(runtime.killedTweenTargets).toContain(core)
    expect(runtime.tweenCalls.at(-1)).toMatchObject({
      targets: core,
      scale: 1.8,
      alpha: 0,
      angle: 90,
      duration: 260,
      ease: 'Quad.easeOut',
    })

    runtime.runDelayedCalls(360)
    runtime.playerKeys.z.isDown = false
    runtime.scene.update()
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()
    expect(runtime.tweenCalls.filter((call) => call.targets === core)).toHaveLength(2)
  })
```

The last Azure Core expectation may need to subtract the initial floating tween. If `createAzureCoreFloat` pushes one tween before defeat, assert the burst-specific tween count instead:

```ts
    expect(
      runtime.tweenCalls.filter(
        (call) => call.targets === core && 'scale' in call && call.scale === 1.8,
      ),
    ).toHaveLength(1)
```

- [ ] **Step 2: Run renderer test and confirm RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because attack keys, hitbox texture, delayed callbacks, and defeat handling are not implemented.

- [ ] **Step 3: Implement renderer attack state and imports**

In `src/ui/gameplay/createGameplayRenderer.ts`, extend imports from `enemyActor`:

```ts
  enemyDefeatPresentation,
  getEnemyDefeatPresentation,
  shouldProcessEnemyDefeat,
```

Import player attack rules:

```ts
import {
  canStartMeleeAttack,
  getAttackInputDecision,
  getMeleeAttackEndState,
  getMeleeAttackEntryState,
  getMeleeAttackReadyState,
  getMeleeHitboxGeometry,
  isMeleeHitCandidate,
  meleeAttackTiming,
  meleeHitboxSize,
} from '../../domain/gameplay/playerAttack'
```

Extend `EnemyRuntime`:

```ts
type EnemyRuntime = {
  sprite: Phaser.Physics.Arcade.Sprite
  spawn: GameplayEnemySpawn
  direction: EnemyPatrolDirection
  defeated: boolean
}
```

Extend `playerKeys`:

```ts
    j: Phaser.Input.Keyboard.Key
    z: Phaser.Input.Keyboard.Key
```

Add scene state:

```ts
  private attackReady = true
  private isAttacking = false
  private wasAttackDown = false
```

- [ ] **Step 4: Add attack key and hitbox texture creation**

In `create()`, after `this.createEnemyTextures()` call:

```ts
    this.createAttackHitboxTexture()
```

Add:

```ts
  private createAttackHitboxTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0x4be8ff, 0.2)
    graphics.lineStyle(2, 0x4f7dff, 0.8)
    graphics.generateTexture('attack-hitbox', meleeHitboxSize.width, meleeHitboxSize.height)
    graphics.destroy()
  }
```

Add key mappings in `createPlayerKeys()`:

```ts
      j: Phaser.Input.Keyboard.KeyCodes.J,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
```

After player creation, reset attack state:

```ts
    this.attackReady = true
    this.isAttacking = false
    this.wasAttackDown = false
```

Set `defeated: false` in both enemy runtime object returns.

- [ ] **Step 5: Add melee execution and defeat presentation**

Add these methods to `GameplayMapScene`:

```ts
  private isAttackDown(): boolean {
    if (!this.playerKeys) return false

    return this.playerKeys.j.isDown || this.playerKeys.z.isDown
  }

  private tryStartPlayerAttack(grounded: boolean): void {
    if (!this.player || !this.playerKeys) return

    const attackDown = this.isAttackDown()
    const attackPressed = attackDown && !this.wasAttackDown
    this.wasAttackDown = attackDown

    const decision = getAttackInputDecision({
      attackPressed,
      crouching: false,
      grounded,
    })

    if (decision !== 'melee') return

    if (
      !canStartMeleeAttack({
        attackReady: this.attackReady,
        hurting: false,
        homingAttacking: false,
      })
    ) {
      return
    }

    const entry = getMeleeAttackEntryState()
    this.attackReady = entry.attackReady
    this.isAttacking = entry.attacking
    this.player.play(playerActorDefinition.sprites.attack.key, true)

    this.spawnMeleeHitbox()

    this.time.delayedCall(meleeAttackTiming.attackEndDelayMs, () => {
      const end = getMeleeAttackEndState()
      this.isAttacking = end.attacking
    })
    this.time.delayedCall(meleeAttackTiming.readyDelayMs, () => {
      const ready = getMeleeAttackReadyState()
      this.attackReady = ready.attackReady
    })
  }

  private spawnMeleeHitbox(): void {
    if (!this.player) return

    const geometry = getMeleeHitboxGeometry({
      playerX: this.player.x,
      playerY: this.player.y,
      playerFlipX: this.player.flipX,
    })
    const hitbox = this.add
      .image(geometry.x, geometry.y, 'attack-hitbox')
      .setFlipX(geometry.flipX)
      .setVisible(false)

    const enemy = this.enemies.find((candidate) =>
      isMeleeHitCandidate({
        defeated: candidate.defeated,
        intersectsHitbox: Phaser.Geom.Intersects.RectangleToRectangle(
          hitbox.getBounds(),
          candidate.sprite.getBounds(),
        ),
      }),
    )

    if (enemy && shouldProcessEnemyDefeat({ enemyExists: true, defeated: enemy.defeated })) {
      this.defeatEnemy(enemy)
    }

    this.time.delayedCall(meleeAttackTiming.hitboxLifetimeMs, () => {
      hitbox.destroy()
    })
  }

  private defeatEnemy(enemy: EnemyRuntime): void {
    enemy.defeated = true
    enemy.sprite.setVelocity(0, 0)
    enemy.sprite.body.enable = false

    const presentation = getEnemyDefeatPresentation(enemy.spawn.type)
    if (presentation === 'armor-guard-death') {
      const death = enemyActorDefinitions['armor-guard'].sprites?.death
      if (death) {
        enemy.sprite.play(death.key, true)
      }
    } else {
      const burst = enemyDefeatPresentation.azureCoreBurst
      this.tweens.killTweensOf(enemy.sprite)
      this.tweens.add({
        targets: enemy.sprite,
        scale: burst.scale,
        alpha: burst.alpha,
        angle: enemy.sprite.angle + burst.angleDelta,
        duration: burst.durationMs,
        ease: burst.ease,
      })
    }

    this.time.delayedCall(enemyDefeatPresentation.hideDelayMs, () => {
      enemy.sprite.setVisible(false)
    })
  }
```

- [ ] **Step 6: Call attack before movement animation and preserve attack priority**

In `updatePlayerMovement()`, after `const grounded = this.isPlayerGrounded()` and ground contact update, call:

```ts
    this.tryStartPlayerAttack(grounded)
```

Replace the final animation branch with:

```ts
    if (this.isAttacking) {
      this.player.play(playerActorDefinition.sprites.attack.key, true)
    } else if (!grounded || jumpingThisFrame) {
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

Update patrol call:

```ts
      if (
        !shouldUpdateEnemyPatrol({ type: enemy.spawn.type, defeated: enemy.defeated }) ||
        enemy.spawn.type !== 'armor-guard'
      ) {
        continue
      }
```

- [ ] **Step 7: Run renderer tests and confirm GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS. If TypeScript complains about tween call test types, widen the test-only `TweenCall` type to include optional `scale?: number` and `alpha?: number`.

- [ ] **Step 8: Run focused game tests and confirm GREEN**

Run:

```bash
npm run test -- src/domain/gameplay src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 4**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: add gameplay player melee attack"
```

### Task 5: Full Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run project test suite**

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

- [ ] **Step 3: Run frontend build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run diff whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
git log --oneline -5
```

Expected: clean working tree if every task was committed; latest commits should be the three or four attack-slice commits.

## Self-Review

- Spec coverage: Task 1 covers attack decision, hitbox geometry, cooldown, and candidate rules. Task 2 covers `player_attack` asset migration and animation metadata. Task 3 covers Armor Guard and Azure Core defeat routing. Task 4 covers J/Z input, invisible hitbox, enemy defeat reactions, no repeat while cooling down, and patrol skip after defeat. Task 5 covers required repository verification.
- Placeholder scan: The plan contains no unresolved placeholder phrases or unbounded test-writing steps. The Azure Core test includes an explicit alternative assertion only for the known existing floating tween, not an open placeholder.
- Type consistency: `AttackInputDecision`, `EnemyRuntime.defeated`, `shouldUpdateEnemyPatrol({ type, defeated })`, and `meleeAttackTiming` names are defined before later tasks use them. Runtime methods reference imports introduced in the same task.
