# Gameplay Player Hurt And Death Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add player hurt, three-hit death, out-of-bounds death, and respawn behavior to rebuilt gameplay, using prototype values and root public assets.

**Architecture:** Keep all player life rules in a pure domain module under `src/domain/gameplay`, with Phaser runtime only adapting those rules into sprites, overlaps, tweens, timers, and respawn placement. Player hurt/death visual metadata belongs on `playerActorDefinition.sprites`, matching the existing sprite-owned scale design. Runtime assets are copied from `__prototype__/public/assets` into root `public/assets`; no rebuilt code imports from `__prototype__`.

**Tech Stack:** TypeScript, Vitest, Phaser 3, Svelte, Vite.

---

## Files And Responsibilities

- Create `src/domain/gameplay/playerLife.ts`: pure player damage, hurt, death, respawn, velocity, and bounds rules.
- Create `src/domain/gameplay/playerLife.test.ts`: TDD coverage for the new pure player life rules.
- Modify `src/domain/gameplay/playerActor.ts`: add `hurt` and `death` sprite metadata.
- Modify `src/domain/gameplay/playerActor.test.ts`: verify hurt/death sprite metadata.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`: include copied hurt/death root asset refs.
- Copy `__prototype__/public/assets/sprites/player_hurt/sheet-transparent.webp` to `public/assets/sprites/player_hurt/sheet-transparent.webp`.
- Copy `__prototype__/public/assets/sprites/player_death/sheet-transparent.webp` to `public/assets/sprites/player_death/sheet-transparent.webp`.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: wire enemy contact damage, hurt/death state, bounds defeat, and respawn.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: extend fake runtime and verify renderer behavior.

## Prototype Values

- `PLAYER_MAX_HEALTH = 3`
- `PLAYER_HIT_DAMAGE = 1`
- hurt knockback X velocity: `360`
- hurt knockback Y velocity: `-360 * gravitySign`
- damage death Y velocity: `-160 * gravitySign`
- fall death Y velocity: `0`
- hurt recovery delay: `420`
- invulnerability recovery delay: `900`
- death respawn delay: `700`
- hurt blink tween: alpha `0.35`, duration `80`, yoyo `true`, repeat `4`
- world out-of-bounds margin for this slice: `128`
- hurt animation: `player-hurt`, frames `0..3`, frame rate `10`, repeat `0`, scale `0.78`
- death animation: `player-death`, frames `0..3`, frame rate `7`, repeat `0`, scale `0.78`

### Task 1: Player Life Domain Rules

**Files:**
- Create: `src/domain/gameplay/playerLife.test.ts`
- Create: `src/domain/gameplay/playerLife.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/gameplay/playerLife.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  PLAYER_HIT_DAMAGE,
  PLAYER_MAX_HEALTH,
  PLAYER_OUT_OF_BOUNDS_MARGIN,
  canApplyPlayerDamage,
  canApplyPlayerEnemyHit,
  canEnterPlayerDefeat,
  getPlayerDamageOutcome,
  getPlayerDefeatEntryState,
  getPlayerDefeatOutcome,
  getPlayerHurtEntryState,
  getPlayerHurtRecoveryState,
  getPlayerHurtVelocity,
  getPlayerInvulnerabilityRecoveryState,
  getPlayerKnockbackDirection,
  getPlayerRespawnState,
  isPlayerOutsideWorldBounds,
} from './playerLife'

describe('player life constants', () => {
  it('keeps prototype health, damage, and world margin explicit', () => {
    expect(PLAYER_MAX_HEALTH).toBe(3)
    expect(PLAYER_HIT_DAMAGE).toBe(1)
    expect(PLAYER_OUT_OF_BOUNDS_MARGIN).toBe(128)
  })
})

describe('canApplyPlayerEnemyHit', () => {
  it('allows active enemy contact when no blocking state is active', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks enemy contact damage while protected or enemy is defeated', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: true,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: true,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: true,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: true,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: true,
    })).toBe(false)
  })
})

describe('canApplyPlayerDamage', () => {
  it('allows generic damage when no blocking state is active', () => {
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks generic damage for protected states', () => {
    expect(canApplyPlayerDamage({
      invulnerable: true,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: true,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: true,
      crouching: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: true,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: true,
    })).toBe(false)
  })
})

describe('player damage outcome', () => {
  it('survives normal damage while health remains above zero', () => {
    expect(getPlayerDamageOutcome({ currentHealth: 3 })).toEqual({
      type: 'survived',
      nextHealth: 2,
    })
  })

  it('defeats when damage reaches zero health', () => {
    expect(getPlayerDamageOutcome({ currentHealth: 1 })).toEqual({
      type: 'defeated',
      nextHealth: 0,
    })
  })

  it('supports explicit damage for bounds-style checks', () => {
    expect(getPlayerDamageOutcome({ currentHealth: 3, damage: 3 })).toEqual({
      type: 'defeated',
      nextHealth: 0,
    })
  })
})

describe('hurt and recovery states', () => {
  it('enters hurt state by canceling attack and enabling invulnerability', () => {
    expect(getPlayerHurtEntryState()).toEqual({
      hurting: true,
      invulnerable: true,
      attacking: false,
      attackReady: false,
    })
  })

  it('recovers hurting before invulnerability', () => {
    expect(getPlayerHurtRecoveryState()).toEqual({
      hurting: false,
      attackReady: true,
    })
    expect(getPlayerInvulnerabilityRecoveryState()).toEqual({
      invulnerable: false,
    })
  })
})

describe('defeat and respawn states', () => {
  it('enters defeat once and clears player action states', () => {
    expect(canEnterPlayerDefeat({ dead: false })).toBe(true)
    expect(canEnterPlayerDefeat({ dead: true })).toBe(false)
    expect(getPlayerDefeatEntryState()).toEqual({
      dead: true,
      hurting: false,
      invulnerable: true,
      attacking: false,
      attackReady: false,
    })
  })

  it('respawns with full health and action readiness', () => {
    expect(getPlayerRespawnState()).toEqual({
      health: 3,
      hurting: false,
      invulnerable: false,
      dead: false,
      attacking: false,
      attackReady: true,
    })
    expect(getPlayerRespawnState({ maxHealth: 5 }).health).toBe(5)
  })
})

describe('player velocities', () => {
  it('knocks away from damage source', () => {
    expect(getPlayerKnockbackDirection({ playerX: 100, sourceX: 120 })).toBe(-1)
    expect(getPlayerKnockbackDirection({ playerX: 120, sourceX: 120 })).toBe(1)
    expect(getPlayerKnockbackDirection({ playerX: 140, sourceX: 120 })).toBe(1)
  })

  it('uses prototype hurt and defeat velocities', () => {
    expect(getPlayerHurtVelocity({ direction: -1, gravitySign: 1 })).toEqual({ x: -360, y: -360 })
    expect(getPlayerHurtVelocity({ direction: 1, gravitySign: -1 })).toEqual({ x: 360, y: 360 })
    expect(getPlayerDefeatOutcome({ reason: 'damage', gravitySign: 1 })).toEqual({ velocityY: -160 })
    expect(getPlayerDefeatOutcome({ reason: 'damage', gravitySign: -1 })).toEqual({ velocityY: 160 })
    expect(getPlayerDefeatOutcome({ reason: 'fall', gravitySign: 1 })).toEqual({ velocityY: 0 })
  })
})

describe('isPlayerOutsideWorldBounds', () => {
  const world = { worldWidth: 9600, worldHeight: 1080, margin: 128 }

  it('keeps players inside the expanded world bounds alive', () => {
    expect(isPlayerOutsideWorldBounds({ x: -128, y: 0, ...world })).toBe(false)
    expect(isPlayerOutsideWorldBounds({ x: 9600 + 128, y: 1080, ...world })).toBe(false)
  })

  it('detects leaving any side of the world bounds', () => {
    expect(isPlayerOutsideWorldBounds({ x: -129, y: 500, ...world })).toBe(true)
    expect(isPlayerOutsideWorldBounds({ x: 9600 + 129, y: 500, ...world })).toBe(true)
    expect(isPlayerOutsideWorldBounds({ x: 500, y: -129, ...world })).toBe(true)
    expect(isPlayerOutsideWorldBounds({ x: 500, y: 1080 + 129, ...world })).toBe(true)
  })
})
```

- [ ] **Step 2: Run focused domain test and confirm RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerLife.test.ts
```

Expected: FAIL because `src/domain/gameplay/playerLife.ts` does not exist.

- [ ] **Step 3: Implement pure player life rules**

Create `src/domain/gameplay/playerLife.ts`:

```ts
export const PLAYER_HIT_DAMAGE = 1
export const PLAYER_MAX_HEALTH = 3
export const PLAYER_OUT_OF_BOUNDS_MARGIN = 128

export const playerLifeTiming = {
  hurtRecoveryDelayMs: 420,
  invulnerabilityRecoveryDelayMs: 900,
  deathRespawnDelayMs: 700,
} as const

export const playerHurtPresentation = {
  blinkAlpha: 0.35,
  blinkDurationMs: 80,
  blinkYoyo: true,
  blinkRepeat: 4,
} as const

export type PlayerDefeatReason = 'damage' | 'fall'
export type PlayerDamageOutcome =
  | { type: 'survived'; nextHealth: number }
  | { type: 'defeated'; nextHealth: number }
export type PlayerKnockbackDirection = -1 | 1

export function canApplyPlayerEnemyHit(input: {
  invulnerable: boolean
  hurting: boolean
  enemyDefeated: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean {
  return !input.invulnerable
    && !input.hurting
    && !input.enemyDefeated
    && !input.homingAttacking
    && !input.dead
}

export function canApplyPlayerDamage(input: {
  invulnerable: boolean
  hurting: boolean
  homingAttacking: boolean
  crouching: boolean
  dead: boolean
}): boolean {
  return !input.invulnerable
    && !input.hurting
    && !input.homingAttacking
    && !input.crouching
    && !input.dead
}

export function canEnterPlayerDefeat(input: { dead: boolean }): boolean {
  return !input.dead
}

export function getPlayerDamageOutcome(input: {
  currentHealth: number
  damage?: number
}): PlayerDamageOutcome {
  const nextHealth = input.currentHealth - (input.damage ?? PLAYER_HIT_DAMAGE)

  return nextHealth <= 0
    ? { type: 'defeated', nextHealth }
    : { type: 'survived', nextHealth }
}

export function getPlayerHurtEntryState(): {
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  attackReady: boolean
} {
  return {
    hurting: true,
    invulnerable: true,
    attacking: false,
    attackReady: false,
  }
}

export function getPlayerHurtRecoveryState(): {
  hurting: boolean
  attackReady: boolean
} {
  return {
    hurting: false,
    attackReady: true,
  }
}

export function getPlayerInvulnerabilityRecoveryState(): {
  invulnerable: boolean
} {
  return {
    invulnerable: false,
  }
}

export function getPlayerDefeatEntryState(): {
  dead: boolean
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  attackReady: boolean
} {
  return {
    dead: true,
    hurting: false,
    invulnerable: true,
    attacking: false,
    attackReady: false,
  }
}

export function getPlayerRespawnState(input: {
  maxHealth?: number
} = {}): {
  health: number
  hurting: boolean
  invulnerable: boolean
  dead: boolean
  attacking: boolean
  attackReady: boolean
} {
  return {
    health: input.maxHealth ?? PLAYER_MAX_HEALTH,
    hurting: false,
    invulnerable: false,
    dead: false,
    attacking: false,
    attackReady: true,
  }
}

export function getPlayerKnockbackDirection(input: {
  playerX: number
  sourceX: number
}): PlayerKnockbackDirection {
  return input.playerX < input.sourceX ? -1 : 1
}

export function getPlayerHurtVelocity(input: {
  direction: PlayerKnockbackDirection
  gravitySign: number
}): { x: number; y: number } {
  return {
    x: input.direction * 360,
    y: -360 * input.gravitySign,
  }
}

export function getPlayerDefeatOutcome(input: {
  reason: PlayerDefeatReason
  gravitySign: number
}): { velocityY: number } {
  if (input.reason === 'fall') {
    return { velocityY: 0 }
  }

  return { velocityY: -160 * input.gravitySign }
}

export function isPlayerOutsideWorldBounds(input: {
  x: number
  y: number
  worldWidth: number
  worldHeight: number
  margin: number
}): boolean {
  return input.x < -input.margin
    || input.x > input.worldWidth + input.margin
    || input.y < -input.margin
    || input.y > input.worldHeight + input.margin
}
```

- [ ] **Step 4: Run focused domain tests and confirm GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerLife.test.ts
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/gameplay/playerLife.ts src/domain/gameplay/playerLife.test.ts
git commit -m "feat: add gameplay player life rules"
```

### Task 2: Hurt And Death Sprite Metadata And Assets

**Files:**
- Modify: `src/domain/gameplay/playerActor.ts`
- Modify: `src/domain/gameplay/playerActor.test.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Copy: `__prototype__/public/assets/sprites/player_hurt/sheet-transparent.webp` to `public/assets/sprites/player_hurt/sheet-transparent.webp`
- Copy: `__prototype__/public/assets/sprites/player_death/sheet-transparent.webp` to `public/assets/sprites/player_death/sheet-transparent.webp`

- [ ] **Step 1: Write failing actor metadata and asset tests**

Modify `src/domain/gameplay/playerActor.test.ts` so the `sprites` object includes:

```ts
        hurt: {
          key: 'player-hurt',
          assetRef: '/assets/sprites/player_hurt/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 10,
          repeat: 0,
          scale: 0.78,
        },
        death: {
          key: 'player-death',
          assetRef: '/assets/sprites/player_death/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 7,
          repeat: 0,
          scale: 0.78,
        },
```

Modify `src/domain/gameplay/gameplayStageMaps.test.ts` expected `assetRefs` list to include:

```ts
      '/assets/sprites/player_hurt/sheet-transparent.webp',
      '/assets/sprites/player_death/sheet-transparent.webp',
```

immediately after `/assets/sprites/player_attack/sheet-transparent.webp`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `PlayerAnimationKey` and `playerActorDefinition.sprites` do not include `hurt` or `death`.

- [ ] **Step 3: Add hurt/death actor metadata**

Modify `src/domain/gameplay/playerActor.ts`:

```ts
export type PlayerAnimationKey = 'idle' | 'run' | 'jump' | 'attack' | 'hurt' | 'death'
```

Add to `playerActorDefinition.sprites` after `attack`:

```ts
    hurt: {
      key: 'player-hurt',
      assetRef: '/assets/sprites/player_hurt/sheet-transparent.webp',
      frameWidth: 128,
      frameHeight: 128,
      frameStart: 0,
      frameEnd: 3,
      frameRate: 10,
      repeat: 0,
      scale: 0.78,
    },
    death: {
      key: 'player-death',
      assetRef: '/assets/sprites/player_death/sheet-transparent.webp',
      frameWidth: 128,
      frameHeight: 128,
      frameStart: 0,
      frameEnd: 3,
      frameRate: 7,
      repeat: 0,
      scale: 0.78,
    },
```

- [ ] **Step 4: Copy runtime assets**

Run:

```bash
mkdir -p public/assets/sprites/player_hurt public/assets/sprites/player_death
cp __prototype__/public/assets/sprites/player_hurt/sheet-transparent.webp public/assets/sprites/player_hurt/sheet-transparent.webp
cp __prototype__/public/assets/sprites/player_death/sheet-transparent.webp public/assets/sprites/player_death/sheet-transparent.webp
```

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/domain/gameplay/playerActor.ts src/domain/gameplay/playerActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts public/assets/sprites/player_hurt/sheet-transparent.webp public/assets/sprites/player_death/sheet-transparent.webp
git commit -m "feat: add gameplay player hurt and death sprites"
```

### Task 3: Renderer Hurt Contact Runtime

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Extend renderer tests for survived contact damage**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, extend fakes:

```ts
type OverlapCall = {
  a: unknown
  b: unknown
  callback: () => void
}
```

Add runtime collections:

```ts
  const overlapCalls: OverlapCall[] = []
```

Add `overlap` to fake `physics.add`:

```ts
      overlap: (a, b, callback) => {
        overlapCalls.push({ a, b, callback: callback as () => void })
      },
```

Return helpers:

```ts
    overlapCalls,
    triggerOverlap: (sprite: unknown) => {
      const overlap = overlapCalls.find((call) => call.b === sprite || call.a === sprite)
      if (!overlap) throw new Error('Missing overlap for sprite.')
      overlap.callback()
    },
```

Add tests:

```ts
  it('registers player overlaps with gameplay enemies', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    expect(runtime.overlapCalls).toHaveLength(runtime.enemySprites.length)
    for (const enemy of runtime.enemySprites) {
      expect(runtime.overlapCalls).toContainEqual({
        a: runtime.playerSprite,
        b: enemy,
        callback: expect.any(Function),
      })
    }
  })

  it('hurts the player on active enemy contact and starts invulnerability', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 680
    guard.x = 720
    runtime.triggerOverlap(guard)

    expect(runtime.playerSprite.velocityX).toBe(-360)
    expect(runtime.playerSprite.velocityY).toBe(-360)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: 'player-hurt',
      ignoreIfPlaying: true,
    })
    expect(runtime.tweenCalls.at(-1)).toMatchObject({
      targets: runtime.playerSprite,
      alpha: 0.35,
      duration: 80,
      yoyo: true,
      repeat: 4,
    })
  })

  it('does not apply repeated contact damage while hurting or invulnerable', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.triggerOverlap(guard)
    runtime.playerSprite.velocityX = 0
    runtime.triggerOverlap(guard)

    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.playCalls.filter((call) => call.key === 'player-hurt')).toHaveLength(1)
  })

  it('recovers hurt and invulnerability on prototype delays', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.triggerOverlap(guard)
    runtime.runDelayedCalls(420)
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    expect(runtime.playerSprite.playCalls.at(-1)?.key).toBe('player-attack')

    runtime.runDelayedCalls(900)
    expect(runtime.playerSprite.alpha).toBe(1)
  })

  it('does not hurt from defeated enemies', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 672
    runtime.playerSprite.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    runtime.playerKeys.j.isDown = false

    runtime.triggerOverlap(guard)

    expect(runtime.playerSprite.playCalls.at(-1)?.key).toBe('player-attack')
  })
```

- [ ] **Step 2: Run renderer test and confirm RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because overlap registration, player life state, hurt animation, and recovery are not implemented.

- [ ] **Step 3: Implement survived contact damage runtime**

Modify `src/ui/gameplay/createGameplayRenderer.ts` imports:

```ts
import {
  PLAYER_MAX_HEALTH,
  canApplyPlayerDamage,
  canApplyPlayerEnemyHit,
  getPlayerDamageOutcome,
  getPlayerHurtEntryState,
  getPlayerHurtRecoveryState,
  getPlayerHurtVelocity,
  getPlayerInvulnerabilityRecoveryState,
  getPlayerKnockbackDirection,
  playerHurtPresentation,
  playerLifeTiming,
} from '../../domain/gameplay/playerLife'
```

Add scene state:

```ts
  private playerHealth = PLAYER_MAX_HEALTH
  private isHurting = false
  private isInvulnerable = false
  private isDead = false
```

In `createPlayer()`, initialize:

```ts
    this.playerHealth = PLAYER_MAX_HEALTH
    this.isHurting = false
    this.isInvulnerable = false
    this.isDead = false
```

After both enemies and player exist in `create()`, wire overlaps by adding:

```ts
    this.createPlayerEnemyOverlaps()
```

after `this.createPlayer()`.

Add methods:

```ts
  private createPlayerEnemyOverlaps(): void {
    if (!this.player) return

    for (const enemy of this.enemies) {
      this.physics.add.overlap(this.player, enemy.sprite, () => {
        this.hurtPlayer(enemy)
      })
    }
  }

  private hurtPlayer(enemy: EnemyRuntime): void {
    if (!this.player) return

    if (!canApplyPlayerEnemyHit({
      invulnerable: this.isInvulnerable,
      hurting: this.isHurting,
      enemyDefeated: enemy.defeated,
      homingAttacking: false,
      dead: this.isDead,
    })) {
      return
    }

    this.applyPlayerHit(enemy.sprite.x)
  }

  private applyPlayerHit(sourceX: number): void {
    if (!this.player) return

    if (!canApplyPlayerDamage({
      invulnerable: this.isInvulnerable,
      hurting: this.isHurting,
      homingAttacking: false,
      crouching: false,
      dead: this.isDead,
    })) {
      return
    }

    const damageOutcome = getPlayerDamageOutcome({ currentHealth: this.playerHealth })
    this.playerHealth = damageOutcome.nextHealth

    if (damageOutcome.type === 'defeated') {
      this.defeatPlayer('damage')
      return
    }

    const hurtEntry = getPlayerHurtEntryState()
    this.isHurting = hurtEntry.hurting
    this.isInvulnerable = hurtEntry.invulnerable
    this.isAttacking = hurtEntry.attacking
    this.attackReady = hurtEntry.attackReady
    this.clearActiveMeleeHitboxes()

    const direction = getPlayerKnockbackDirection({
      playerX: this.player.x,
      sourceX,
    })
    const velocity = getPlayerHurtVelocity({ direction, gravitySign: 1 })
    this.player.setVelocity(velocity.x, velocity.y)
    this.playPlayerAnimation(this.player, 'hurt')
    this.tweens.add({
      targets: this.player,
      alpha: playerHurtPresentation.blinkAlpha,
      duration: playerHurtPresentation.blinkDurationMs,
      yoyo: playerHurtPresentation.blinkYoyo,
      repeat: playerHurtPresentation.blinkRepeat,
    })

    this.time.delayedCall(playerLifeTiming.hurtRecoveryDelayMs, () => {
      const recovery = getPlayerHurtRecoveryState()
      this.isHurting = recovery.hurting
      this.attackReady = recovery.attackReady
    })
    this.time.delayedCall(playerLifeTiming.invulnerabilityRecoveryDelayMs, () => {
      const recovery = getPlayerInvulnerabilityRecoveryState()
      this.isInvulnerable = recovery.invulnerable
      this.player?.setAlpha(1)
    })
  }

  private clearActiveMeleeHitboxes(): void {
    for (const hitbox of this.activeMeleeHitboxes) {
      hitbox.consumed = true
      hitbox.image.destroy()
    }
    this.activeMeleeHitboxes = []
  }
```

Update `tryStartPlayerAttack()`:

```ts
        hurting: this.isHurting,
```

and add `if (this.isDead) return` before attack input decision.

Update animation priority:

```ts
    if (this.isDead) {
      this.playPlayerAnimation(this.player, 'death')
    } else if (this.isHurting) {
      this.playPlayerAnimation(this.player, 'hurt')
    } else if (this.isAttacking) {
      this.playPlayerAnimation(this.player, 'attack')
```

- [ ] **Step 4: Run focused renderer tests and confirm GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
npm run test -- src/domain/gameplay src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: add gameplay player hurt contact"
```

### Task 4: Renderer Death, Bounds, And Respawn Runtime

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing death and respawn renderer tests**

Add tests to `src/ui/gameplay/createGameplayRenderer.test.ts`:

```ts
  it('kills and respawns the player after the third enemy hit', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.triggerOverlap(guard)
    runtime.runDelayedCalls(420)
    runtime.runDelayedCalls(900)
    runtime.triggerOverlap(guard)
    runtime.runDelayedCalls(420)
    runtime.runDelayedCalls(900)
    runtime.triggerOverlap(guard)

    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: 'player-death',
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite.accelerationX).toBe(0)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(-160)

    runtime.runDelayedCalls(700)
    expect(runtime.playerSprite.x).toBe(256)
    expect(runtime.playerSprite.y).toBe(436)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.playCalls.at(-1)?.key).toBe('player-idle')
  })

  it('does not move or attack while dead before respawn', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.triggerOverlap(guard)
    runtime.runDelayedCalls(420)
    runtime.runDelayedCalls(900)
    runtime.triggerOverlap(guard)
    runtime.runDelayedCalls(420)
    runtime.runDelayedCalls(900)
    runtime.triggerOverlap(guard)

    runtime.playerKeys.right.isDown = true
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.playerSprite.accelerationX).toBe(0)
    expect(runtime.images).toHaveLength(0)
    expect(runtime.playerSprite.playCalls.at(-1)?.key).toBe('player-death')
  })

  it('dies and respawns after leaving any world edge beyond the margin', () => {
    const positions = [
      { x: -129, y: 512 },
      { x: 9600 + 129, y: 512 },
      { x: 512, y: -129 },
      { x: 512, y: 1080 + 129 },
    ]

    for (const position of positions) {
      const runtime = createSceneRuntime()
      runtime.scene.create()
      expect(runtime.playerSprite).not.toBeNull()
      if (!runtime.playerSprite) continue

      runtime.playerSprite.x = position.x
      runtime.playerSprite.y = position.y
      runtime.scene.update()

      expect(runtime.playerSprite.playCalls.at(-1)?.key).toBe('player-death')
      expect(runtime.playerSprite.velocityY).toBe(0)

      runtime.runDelayedCalls(700)
      expect(runtime.playerSprite.x).toBe(256)
      expect(runtime.playerSprite.y).toBe(436)
      expect(runtime.playerSprite.playCalls.at(-1)?.key).toBe('player-idle')
    }
  })

  it('hurt death clears active melee hitboxes', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    const hitbox = runtime.images[0]
    runtime.playerKeys.j.isDown = false

    runtime.triggerOverlap(guard)

    expect(hitbox.destroyed).toBe(true)
  })
```

- [ ] **Step 2: Run focused renderer tests and confirm RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because death, bounds checks, and respawn are not implemented.

- [ ] **Step 3: Implement death, bounds, and respawn**

Modify imports:

```ts
  PLAYER_OUT_OF_BOUNDS_MARGIN,
  canEnterPlayerDefeat,
  getPlayerDefeatEntryState,
  getPlayerDefeatOutcome,
  getPlayerRespawnState,
  isPlayerOutsideWorldBounds,
  type PlayerDefeatReason,
```

Add to `update()` after `this.updatePlayerMovement()`:

```ts
    this.updatePlayerBoundsDefeat()
```

Add methods:

```ts
  private updatePlayerBoundsDefeat(): void {
    if (!this.player) return

    if (isPlayerOutsideWorldBounds({
      x: this.player.x,
      y: this.player.y,
      worldWidth: this.stageMap.world.width,
      worldHeight: this.stageMap.world.height,
      margin: PLAYER_OUT_OF_BOUNDS_MARGIN,
    })) {
      this.defeatPlayer('fall')
    }
  }

  private defeatPlayer(reason: PlayerDefeatReason): void {
    if (!this.player) return

    if (!canEnterPlayerDefeat({ dead: this.isDead })) {
      return
    }

    const entry = getPlayerDefeatEntryState()
    this.isDead = entry.dead
    this.isHurting = entry.hurting
    this.isInvulnerable = entry.invulnerable
    this.isAttacking = entry.attacking
    this.attackReady = entry.attackReady
    this.clearActiveMeleeHitboxes()

    const outcome = getPlayerDefeatOutcome({ reason, gravitySign: 1 })
    this.player.setAccelerationX(0)
    this.player.setVelocity(0, outcome.velocityY)
    this.playPlayerAnimation(this.player, 'death')

    this.time.delayedCall(playerLifeTiming.deathRespawnDelayMs, () => {
      this.respawnPlayer()
    })
  }

  private respawnPlayer(): void {
    if (!this.player) return

    const state = getPlayerRespawnState()
    this.playerHealth = state.health
    this.isHurting = state.hurting
    this.isInvulnerable = state.invulnerable
    this.isDead = state.dead
    this.isAttacking = state.attacking
    this.attackReady = state.attackReady
    this.wasAttackDown = false
    this.clearActiveMeleeHitboxes()
    this.player.setAlpha(1)
    this.player.setPosition(
      this.stageMap.player.spawn.x,
      getPlayerCenterY({ surfaceY: this.stageMap.player.spawn.surfaceY }),
    )
    this.player.setVelocity(0, 0)
    this.player.setAccelerationX(0)
    if (this.player.body) {
      this.player.body.enable = true
    }
    this.playerJumpState = createMovableActorJumpState({
      now: this.time.now,
      grounded: true,
      config: playerActorDefinition.jump,
    })
    this.playPlayerAnimation(this.player, 'idle')
  }
```

Update `applyPlayerHit()` defeated branch:

```ts
    if (damageOutcome.type === 'defeated') {
      this.defeatPlayer('damage')
      return
    }
```

Update `updatePlayerMovement()` early return:

```ts
    if (!this.player || !this.playerKeys || !this.playerJumpState) return
    if (this.isDead) {
      this.player.setAccelerationX(0)
      this.playPlayerAnimation(this.player, 'death')
      return
    }
```

- [ ] **Step 4: Run focused renderer tests and confirm GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
npm run test -- src/domain/gameplay src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: add gameplay player death and respawn"
```

### Task 5: Full Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run type and Svelte checks**

Run:

```bash
npm run check
```

Expected: PASS with `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. A Vite chunk-size warning is acceptable if the build exits `0`.

- [ ] **Step 4: Run diff whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Inspect final state**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: clean working tree if every task was committed.

## Self-Review

- Spec coverage: Task 1 covers pure life rules, 3HP, damage gates, knockback, death outcomes, respawn state, and four-sided out-of-bounds detection. Task 2 covers hurt/death sprite metadata and asset migration. Task 3 covers enemy contact hurt, invulnerability, hurt recovery, blink, defeated enemy gating, and attack cancellation. Task 4 covers three-hit death, fall death from all world sides, dead-state input blocking, and respawn. Task 5 covers required verification.
- Placeholder scan: The plan contains no unresolved placeholder phrases, no unbounded "write tests" steps, and no task that points to an undefined function without defining it in an earlier step.
- Type consistency: `PlayerDefeatReason`, `playerLifeTiming`, `playerHurtPresentation`, `PLAYER_OUT_OF_BOUNDS_MARGIN`, `PlayerAnimationKey`, `EnemyRuntime.defeated`, and `ActiveMeleeHitbox` names are introduced before later tasks use them.
