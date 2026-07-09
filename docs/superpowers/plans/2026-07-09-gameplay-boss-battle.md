# Gameplay Boss Battle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Prototype-matching boss battle phase progression and bullet projectiles in the new gameplay stack.

**Architecture:** Put boss phase, volley, projectile, and HUD display rules in pure domain modules. Preserve boss identity in converted `GameplayStageMap`, then keep Phaser as a data-driven adapter that owns runtime sprites, timers, and tweens. HUD remains reactive Svelte over `GameplayHudState`.

**Tech Stack:** TypeScript, Vitest, Svelte, Phaser, Vite.

---

## File Structure

- Create `src/domain/gameplay/bossBattle.ts`
  - Pure boss stage detection, phase progression, volley shots, cadence, player reset, and eligibility decisions.

- Create `src/domain/gameplay/bossBattle.test.ts`
  - Locks Prototype values and phase rules from `docs/superpowers/specs/2026-07-09-gameplay-boss-battle-design.md`.

- Create `src/domain/gameplay/bossProjectile.ts`
  - Pure projectile lifetime, boundary, hit, lifecycle, and velocity rules.

- Create `src/domain/gameplay/bossProjectile.test.ts`
  - Locks projectile constants and decisions.

- Modify `src/domain/gameplay/gameplayMapTypes.ts`
  - Preserve optional `respawnPolicy` and `countsForScore` metadata on enemy spawns.

- Modify `src/domain/gameplay/gameplayStageMapConverter.ts`
  - Copy enemy metadata from stage source to runtime map.

- Modify `src/domain/gameplay/gameplayStageMapConverter.test.ts`
  - Verify `boss-prototype` metadata survives conversion.

- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Verify all converted boss stages can be detected by domain boss rules.

- Modify `src/domain/gameplay/gameplayHud.ts`
  - Add boss phase state and status message keys.

- Modify `src/domain/gameplay/gameplayHud.test.ts`
  - Verify boss and non-boss initial HUD state.

- Modify `src/domain/data/localize/localize.ts`
  - Add gameplay HUD/objective/status localization keys needed by boss HUD.

- Modify `src/domain/data/localize/localize.test.ts`
  - Verify new keys resolve for all locales.

- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Add generated boss projectile texture, projectile runtime, boss pattern start/tick, projectile lifecycle, projectile/player contact, boss hit routing, phase transitions, respawn restart, and stage-clear cleanup.

- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Add focused renderer coverage for projectile spawning/lifecycle, projectile hits, boss phase transitions, respawn restart, and final defeat.

- Modify `src/ui/gameplay/GameplayHud.svelte`
  - Render boss phase panel while `state.bossPhaseMax > 0 && !state.cleared`.

- Modify `src/ui/gameplay/gameplayHudUi.test.ts`
  - Verify source-level boss panel and localization-key wiring.

---

### Task 1: Pure Boss Domain Rules

**Files:**
- Create: `src/domain/gameplay/bossBattle.ts`
- Create: `src/domain/gameplay/bossBattle.test.ts`
- Create: `src/domain/gameplay/bossProjectile.ts`
- Create: `src/domain/gameplay/bossProjectile.test.ts`

- [ ] **Step 1: Write failing boss battle tests**

Create `src/domain/gameplay/bossBattle.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  BOSS_PATTERN_BASE_DELAY_MS,
  BOSS_PATTERN_MIN_DELAY_MS,
  BOSS_PATTERN_PHASE_DELAY_STEP_MS,
  BOSS_PHASE_COUNT,
  canFireBossVolley,
  canHitBossPrototype,
  canRunBossPatternTick,
  canStartBossPattern,
  getBossHitOutcome,
  getBossHudPhaseDisplay,
  getBossPatternDelayMs,
  getBossPhasePlayerResetState,
  getBossVolleyShots,
  isBossStageDefinition,
  shouldRestartBossPatternAfterRespawn,
  shouldResetBossRunAfterHomingHit,
  shouldResetBossSupportCore,
} from './bossBattle'

describe('boss battle rules', () => {
  it('uses Prototype boss phase and cadence constants', () => {
    expect(BOSS_PHASE_COUNT).toBe(4)
    expect(BOSS_PATTERN_BASE_DELAY_MS).toBe(980)
    expect(BOSS_PATTERN_PHASE_DELAY_STEP_MS).toBe(90)
    expect(BOSS_PATTERN_MIN_DELAY_MS).toBe(540)
  })

  it('detects boss stages from the stage id and boss prototype enemy', () => {
    expect(isBossStageDefinition({
      stageId: '1-6',
      enemies: [{ id: 'boss-prototype' }],
    })).toBe(true)
    expect(isBossStageDefinition({
      stageId: '1-5',
      enemies: [{ id: 'boss-prototype' }],
    })).toBe(false)
    expect(isBossStageDefinition({
      stageId: '1-6',
      enemies: [{ id: 'approach-core-1' }],
    })).toBe(false)
  })

  it('advances through three phases and defeats on the fourth hit', () => {
    expect(getBossHitOutcome({ currentPhase: 0 })).toEqual({ type: 'advance-phase', nextPhase: 1 })
    expect(getBossHitOutcome({ currentPhase: 1 })).toEqual({ type: 'advance-phase', nextPhase: 2 })
    expect(getBossHitOutcome({ currentPhase: 2 })).toEqual({ type: 'advance-phase', nextPhase: 3 })
    expect(getBossHitOutcome({ currentPhase: 3 })).toEqual({ type: 'defeated', nextPhase: 4 })
  })

  it('calculates Prototype boss pattern delay', () => {
    expect(getBossPatternDelayMs({ phase: 0 })).toBe(980)
    expect(getBossPatternDelayMs({ phase: 1 })).toBe(890)
    expect(getBossPatternDelayMs({ phase: 2 })).toBe(800)
    expect(getBossPatternDelayMs({ phase: 3 })).toBe(710)
    expect(getBossPatternDelayMs({ phase: 5 })).toBe(540)
  })

  it('returns one aimed shot for phase zero', () => {
    expect(getBossVolleyShots({ phase: 0, shotIndex: 7, aimedAngle: 1.25 })).toEqual([
      { angle: 1.25, speed: 330 },
    ])
  })

  it('returns three sweeping leftward shots for phase one', () => {
    const shotIndex = 3
    const sweep = Math.sin(shotIndex * 0.72) * 0.36
    const shots = getBossVolleyShots({ phase: 1, shotIndex, aimedAngle: 0.5 })

    expect(shots).toHaveLength(3)
    expect(shots.map((shot) => shot.speed)).toEqual([350, 350, 350])
    expect(shots[0]?.angle).toBeCloseTo(Math.PI + sweep - 0.2)
    expect(shots[1]?.angle).toBeCloseTo(Math.PI + sweep)
    expect(shots[2]?.angle).toBeCloseTo(Math.PI + sweep + 0.2)
  })

  it('returns alternating biased phase two shots with aimed shots on even indexes', () => {
    expect(getBossVolleyShots({ phase: 2, shotIndex: 4, aimedAngle: 0.75 })).toEqual([
      { angle: Math.PI - 0.5 - 0.16, speed: 390 },
      { angle: Math.PI - 0.5 + 0.16, speed: 390 },
      { angle: 0.75, speed: 360 },
    ])
    expect(getBossVolleyShots({ phase: 2, shotIndex: 5, aimedAngle: 0.75 })).toEqual([
      { angle: Math.PI + 0.5 - 0.16, speed: 390 },
      { angle: Math.PI + 0.5 + 0.16, speed: 390 },
    ])
  })

  it('returns five radial shots for phase three', () => {
    const shotIndex = 6
    const shots = getBossVolleyShots({ phase: 3, shotIndex, aimedAngle: 0.75 })

    expect(shots).toHaveLength(5)
    for (let index = 0; index < 5; index += 1) {
      expect(shots[index]).toMatchObject({ speed: 390 })
      expect(shots[index]?.angle).toBeCloseTo(Math.PI / 2 + (Math.PI * index) / 4 + shotIndex * 0.1)
    }
  })

  it('returns no shots for unknown phases', () => {
    expect(getBossVolleyShots({ phase: 99, shotIndex: 0, aimedAngle: 0.75 })).toEqual([])
  })

  it('formats boss HUD phase display', () => {
    expect(getBossHudPhaseDisplay({ isBossStage: false, bossPhase: 0 })).toEqual({ phase: 0, max: 0 })
    expect(getBossHudPhaseDisplay({ isBossStage: true, bossPhase: 0 })).toEqual({ phase: 1, max: 4 })
    expect(getBossHudPhaseDisplay({ isBossStage: true, bossPhase: 3 })).toEqual({ phase: 4, max: 4 })
    expect(getBossHudPhaseDisplay({ isBossStage: true, bossPhase: 4 })).toEqual({ phase: 4, max: 4 })
  })

  it('returns phase player reset state', () => {
    expect(getBossPhasePlayerResetState({ maxHealth: 3 })).toEqual({
      health: 3,
      attacking: false,
      homingAttacking: false,
      attackReady: true,
    })
  })

  it('gates boss hit, volley, pattern, support reset, homing reset, and respawn restart decisions', () => {
    expect(canHitBossPrototype({ bossExists: true, bossDefeated: false })).toBe(true)
    expect(canHitBossPrototype({ bossExists: false, bossDefeated: false })).toBe(false)
    expect(canFireBossVolley({ bossExists: true, bossVisible: true })).toBe(true)
    expect(canFireBossVolley({ bossExists: true, bossVisible: false })).toBe(false)
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 3,
      stageCleared: false,
    })).toBe(true)
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 4,
      stageCleared: false,
    })).toBe(false)
    expect(canRunBossPatternTick({
      generation: 2,
      currentGeneration: 2,
      stageCleared: false,
      playerDead: false,
    })).toBe(true)
    expect(canRunBossPatternTick({
      generation: 1,
      currentGeneration: 2,
      stageCleared: false,
      playerDead: false,
    })).toBe(false)
    expect(shouldResetBossSupportCore({ sameAsBoss: false, enemyType: 'azure-core' })).toBe(true)
    expect(shouldResetBossSupportCore({ sameAsBoss: true, enemyType: 'azure-core' })).toBe(false)
    expect(shouldResetBossRunAfterHomingHit({ targetIsBoss: true, bossPhase: 2 })).toBe(true)
    expect(shouldResetBossRunAfterHomingHit({ targetIsBoss: true, bossPhase: 3 })).toBe(false)
    expect(shouldRestartBossPatternAfterRespawn({ isBossStage: true, bossPhase: 3 })).toBe(true)
    expect(shouldRestartBossPatternAfterRespawn({ isBossStage: true, bossPhase: 4 })).toBe(false)
  })
})
```

- [ ] **Step 2: Write failing projectile tests**

Create `src/domain/gameplay/bossProjectile.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  BOSS_PROJECTILE_BOUNDS_MARGIN,
  BOSS_PROJECTILE_HIT_DISTANCE,
  BOSS_PROJECTILE_LIFETIME_MS,
  getBossProjectileHitDecision,
  getBossProjectileLifecycleDecision,
  getBossProjectileVelocity,
  isBossProjectileExpired,
  isBossProjectileOutOfBounds,
  shouldUpdateBossProjectiles,
} from './bossProjectile'

describe('boss projectile rules', () => {
  it('uses Prototype projectile constants', () => {
    expect(BOSS_PROJECTILE_LIFETIME_MS).toBe(7200)
    expect(BOSS_PROJECTILE_BOUNDS_MARGIN).toBe(80)
    expect(BOSS_PROJECTILE_HIT_DISTANCE).toBe(42)
  })

  it('expires only after elapsed time exceeds the lifetime', () => {
    expect(isBossProjectileExpired({ now: 7201, spawnedAt: 0 })).toBe(true)
    expect(isBossProjectileExpired({ now: 7200, spawnedAt: 0 })).toBe(false)
    expect(isBossProjectileExpired({ now: 7199, spawnedAt: 0 })).toBe(false)
  })

  it('detects expanded world bounds', () => {
    const world = { worldWidth: 1920, worldHeight: 1080 }

    expect(isBossProjectileOutOfBounds({ ...world, x: -81, y: 540 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: -80, y: 540 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 2001, y: 540 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 2000, y: 540 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: -81 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: -80 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: 1161 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: 1160 })).toBe(false)
  })

  it('decides projectile hits against player state and crouch', () => {
    expect(getBossProjectileHitDecision({
      playerDead: true,
      playerCrouching: false,
      distanceToPlayer: 0,
    })).toBe('ignore')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 42,
    })).toBe('ignore')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: true,
      distanceToPlayer: 41,
    })).toBe('blocked-by-crouch')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 41,
    })).toBe('hit')
  })

  it('decides lifecycle with outside taking priority over expired', () => {
    expect(getBossProjectileLifecycleDecision({ outside: true, expired: false })).toBe('destroy')
    expect(getBossProjectileLifecycleDecision({ outside: true, expired: true })).toBe('destroy')
    expect(getBossProjectileLifecycleDecision({ outside: false, expired: true })).toBe('fade')
    expect(getBossProjectileLifecycleDecision({ outside: false, expired: false })).toBe('keep')
  })

  it('calculates velocity from angle and speed', () => {
    expect(getBossProjectileVelocity({ angle: 0, speed: 390 })).toEqual({ x: 390, y: 0 })
    expect(getBossProjectileVelocity({ angle: Math.PI, speed: 390 }).x).toBeCloseTo(-390)
    expect(getBossProjectileVelocity({ angle: Math.PI / 2, speed: 390 }).y).toBeCloseTo(390)
  })

  it('updates only when there are active projectiles', () => {
    expect(shouldUpdateBossProjectiles({ projectileCount: 0 })).toBe(false)
    expect(shouldUpdateBossProjectiles({ projectileCount: 1 })).toBe(true)
  })
})
```

- [ ] **Step 3: Run domain tests and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/bossBattle.test.ts src/domain/gameplay/bossProjectile.test.ts
```

Expected: FAIL because `./bossBattle` and `./bossProjectile` do not exist.

- [ ] **Step 4: Implement boss battle domain rules**

Create `src/domain/gameplay/bossBattle.ts`:

```ts
export const BOSS_PHASE_COUNT = 4
export const BOSS_PATTERN_BASE_DELAY_MS = 980
export const BOSS_PATTERN_PHASE_DELAY_STEP_MS = 90
export const BOSS_PATTERN_MIN_DELAY_MS = 540
export const BOSS_STAGE_ID_SUFFIX = '-6'
export const BOSS_PROTOTYPE_ENEMY_ID = 'boss-prototype'
export const BOSS_PATTERN_ENEMY_TYPE = 'azure-core'

export type BossHitOutcome =
  | { type: 'advance-phase'; nextPhase: number }
  | { type: 'defeated'; nextPhase: number }

export type BossPhasePlayerResetState = {
  health: number
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export type BossVolleyShot = {
  angle: number
  speed: number
}

export function isBossStageDefinition(input: {
  stageId: string
  enemies: readonly { id?: string }[]
}): boolean {
  return input.stageId.endsWith(BOSS_STAGE_ID_SUFFIX)
    && input.enemies.some((enemy) => enemy.id === BOSS_PROTOTYPE_ENEMY_ID)
}

export function getBossHitOutcome(input: {
  currentPhase: number
  phaseCount?: number
}): BossHitOutcome {
  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  const nextPhase = input.currentPhase + 1
  return nextPhase >= phaseCount
    ? { type: 'defeated', nextPhase }
    : { type: 'advance-phase', nextPhase }
}

export function getBossPatternDelayMs(input: { phase: number }): number {
  return Math.max(
    BOSS_PATTERN_MIN_DELAY_MS,
    BOSS_PATTERN_BASE_DELAY_MS - input.phase * BOSS_PATTERN_PHASE_DELAY_STEP_MS,
  )
}

export function getBossPhasePlayerResetState(input: {
  maxHealth: number
}): BossPhasePlayerResetState {
  return {
    health: input.maxHealth,
    attacking: false,
    homingAttacking: false,
    attackReady: true,
  }
}

export function canHitBossPrototype(input: {
  bossExists: boolean
  bossDefeated: boolean
}): boolean {
  return input.bossExists && !input.bossDefeated
}

export function canFireBossVolley(input: {
  bossExists: boolean
  bossVisible: boolean
}): boolean {
  return input.bossExists && input.bossVisible
}

export function getBossVolleyShots(input: {
  phase: number
  shotIndex: number
  aimedAngle: number
}): BossVolleyShot[] {
  if (input.phase === 0) {
    return [{ angle: input.aimedAngle, speed: 330 }]
  }

  if (input.phase === 1) {
    const sweep = Math.sin(input.shotIndex * 0.72) * 0.36
    return [-0.2, 0, 0.2].map((offset) => ({
      angle: Math.PI + sweep + offset,
      speed: 350,
    }))
  }

  if (input.phase === 2) {
    const verticalBias = input.shotIndex % 2 === 0 ? -0.5 : 0.5
    const shots: BossVolleyShot[] = [-0.16, 0.16].map((offset) => ({
      angle: Math.PI + verticalBias + offset,
      speed: 390,
    }))
    if (input.shotIndex % 2 === 0) {
      shots.push({ angle: input.aimedAngle, speed: 360 })
    }
    return shots
  }

  if (input.phase === 3) {
    return Array.from({ length: 5 }, (_, index) => ({
      angle: Math.PI / 2 + (Math.PI * index) / 4 + input.shotIndex * 0.1,
      speed: 390,
    }))
  }

  return []
}

export function getBossHudPhaseDisplay(input: {
  isBossStage: boolean
  bossPhase: number
  phaseCount?: number
}): {
  phase: number
  max: number
} {
  if (!input.isBossStage) return { phase: 0, max: 0 }

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return {
    phase: Math.min(input.bossPhase + 1, phaseCount),
    max: phaseCount,
  }
}

export function shouldResetBossRunAfterHomingHit(input: {
  targetIsBoss: boolean
  bossPhase: number
  phaseCount?: number
}): boolean {
  if (!input.targetIsBoss) return false

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return input.bossPhase < phaseCount - 1
}

export function shouldRestartBossPatternAfterRespawn(input: {
  isBossStage: boolean
  bossPhase: number
  phaseCount?: number
}): boolean {
  if (!input.isBossStage) return false

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return input.bossPhase < phaseCount
}

export function canStartBossPattern(input: {
  bossExists: boolean
  bossType?: string
  bossPhase: number
  stageCleared: boolean
  phaseCount?: number
}): boolean {
  if (!input.bossExists) return false
  if (input.bossType !== BOSS_PATTERN_ENEMY_TYPE) return false
  if (input.stageCleared) return false

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return input.bossPhase < phaseCount
}

export function shouldResetBossSupportCore(input: {
  sameAsBoss: boolean
  enemyType?: string
}): boolean {
  return !input.sameAsBoss && input.enemyType === BOSS_PATTERN_ENEMY_TYPE
}

export function canRunBossPatternTick(input: {
  generation: number
  currentGeneration: number
  stageCleared: boolean
  playerDead: boolean
}): boolean {
  return input.generation === input.currentGeneration
    && !input.stageCleared
    && !input.playerDead
}
```

- [ ] **Step 5: Implement boss projectile domain rules**

Create `src/domain/gameplay/bossProjectile.ts`:

```ts
export const BOSS_PROJECTILE_LIFETIME_MS = 7200
export const BOSS_PROJECTILE_BOUNDS_MARGIN = 80
export const BOSS_PROJECTILE_HIT_DISTANCE = 42

export type BossProjectileHitDecision = 'ignore' | 'blocked-by-crouch' | 'hit'
export type BossProjectileLifecycleDecision = 'destroy' | 'fade' | 'keep'

export type BossProjectileVelocity = {
  x: number
  y: number
}

export function isBossProjectileExpired(input: {
  now: number
  spawnedAt: number
  lifetimeMs?: number
}): boolean {
  return input.now - input.spawnedAt > (input.lifetimeMs ?? BOSS_PROJECTILE_LIFETIME_MS)
}

export function isBossProjectileOutOfBounds(input: {
  x: number
  y: number
  worldWidth: number
  worldHeight: number
  margin?: number
}): boolean {
  const margin = input.margin ?? BOSS_PROJECTILE_BOUNDS_MARGIN
  return input.x < -margin
    || input.x > input.worldWidth + margin
    || input.y < -margin
    || input.y > input.worldHeight + margin
}

export function getBossProjectileHitDecision(input: {
  playerDead: boolean
  playerCrouching: boolean
  distanceToPlayer: number
  hitDistance?: number
}): BossProjectileHitDecision {
  if (input.playerDead) return 'ignore'
  if (input.distanceToPlayer >= (input.hitDistance ?? BOSS_PROJECTILE_HIT_DISTANCE)) return 'ignore'
  if (input.playerCrouching) return 'blocked-by-crouch'
  return 'hit'
}

export function getBossProjectileLifecycleDecision(input: {
  outside: boolean
  expired: boolean
}): BossProjectileLifecycleDecision {
  if (input.outside) return 'destroy'
  if (input.expired) return 'fade'
  return 'keep'
}

export function shouldUpdateBossProjectiles(input: {
  projectileCount: number
}): boolean {
  return input.projectileCount > 0
}

export function getBossProjectileVelocity(input: {
  angle: number
  speed: number
}): BossProjectileVelocity {
  return {
    x: Math.cos(input.angle) * input.speed,
    y: Math.sin(input.angle) * input.speed,
  }
}
```

- [ ] **Step 6: Run domain tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/bossBattle.test.ts src/domain/gameplay/bossProjectile.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run related full domain tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 8: Commit Task 1**

```bash
git add src/domain/gameplay/bossBattle.ts src/domain/gameplay/bossBattle.test.ts src/domain/gameplay/bossProjectile.ts src/domain/gameplay/bossProjectile.test.ts
git commit -m "feat: add boss battle domain rules"
```

---

### Task 2: Boss Metadata And HUD State

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.test.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Modify: `src/domain/gameplay/gameplayHud.ts`
- Modify: `src/domain/gameplay/gameplayHud.test.ts`

- [ ] **Step 1: Write failing converter metadata test**

In `src/domain/gameplay/gameplayStageMapConverter.test.ts`, add:

```ts
import { isBossStageDefinition } from './bossBattle'
```

Add this test near existing enemy conversion tests:

```ts
  it('preserves boss prototype metadata for runtime boss detection', () => {
    const source = {
      ...createStageSourceFixture(),
      id: '1-6',
      enemies: [
        {
          id: 'boss-prototype',
          type: 'azure-core',
          x: 5880,
          y: 384,
          patrolMinX: 5880,
          patrolMaxX: 5880,
          respawnPolicy: 'persistent',
          countsForScore: true,
        },
      ],
    } satisfies GameplayStageSource

    const result = convertGameplayStageSource(source, gameplayStageVisualProfiles)

    expect(result.map.enemies[0]).toMatchObject({
      id: 'boss-prototype',
      type: 'azure-core',
      respawnPolicy: 'persistent',
      countsForScore: true,
    })
    expect(isBossStageDefinition({
      stageId: result.map.id,
      enemies: result.map.enemies,
    })).toBe(true)
  })
```

- [ ] **Step 2: Write failing catalog boss detection test**

In `src/domain/gameplay/gameplayStageMaps.test.ts`, import `isBossStageDefinition` from `./bossBattle` and add:

```ts
  it('detects converted boss stages from boss prototype metadata', () => {
    for (const stageId of ['1-6', '2-6', '3-6', '4-6', '5-6', '6-6'] as const) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) return

      expect(isBossStageDefinition({
        stageId: stage.id,
        enemies: stage.enemies,
      })).toBe(true)
      expect(stage.enemies.find((enemy) => enemy.id === 'boss-prototype')).toMatchObject({
        type: 'azure-core',
        respawnPolicy: 'persistent',
        countsForScore: true,
      })
    }
  })
```

- [ ] **Step 3: Write failing HUD boss state tests**

In `src/domain/gameplay/gameplayHud.test.ts`, add this import:

```ts
import { getGameplayStageMap } from './gameplayStageMaps'
```

Then add:

```ts
  it('initializes non-boss stages with hidden boss phase state', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(createInitialGameplayHudState(stage)).toMatchObject({
      bossPhase: 0,
      bossPhaseMax: 0,
    })
  })

  it('initializes boss stages with Prototype one-based boss phase display', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(createInitialGameplayHudState(stage)).toMatchObject({
      bossPhase: 1,
      bossPhaseMax: 4,
    })
  })
```

- [ ] **Step 4: Run focused tests and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts
```

Expected: FAIL because map enemy metadata and HUD boss fields are not implemented.

- [ ] **Step 5: Extend gameplay enemy map types**

In `src/domain/gameplay/gameplayMapTypes.ts`, add shared optional fields:

```ts
export type GameplayEnemyRuntimeMetadata = {
  respawnPolicy?: 'persistent' | 'regenerate'
  countsForScore?: boolean
}
```

Update both enemy spawn types:

```ts
export type ArmorGuardSpawn = GameplayEnemyRuntimeMetadata & {
  id: string
  type: 'armor-guard'
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type AzureCoreSpawn = GameplayEnemyRuntimeMetadata & {
  id: string
  type: 'azure-core'
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}
```

- [ ] **Step 6: Preserve metadata in converter**

In `src/domain/gameplay/gameplayStageMapConverter.ts`, add helper:

```ts
function getEnemyRuntimeMetadata(enemy: GameplayStageSource['enemies'][number]) {
  return {
    ...(enemy.respawnPolicy === undefined ? {} : { respawnPolicy: enemy.respawnPolicy }),
    ...(enemy.countsForScore === undefined ? {} : { countsForScore: enemy.countsForScore }),
  }
}
```

In `convertEnemy`, spread this helper into both returned enemy shapes:

```ts
return {
  id: enemy.id,
  type: 'azure-core',
  x: enemy.x,
  y: enemy.y,
  patrolMinX: enemy.patrolMinX,
  patrolMaxX: enemy.patrolMaxX,
  ...getEnemyRuntimeMetadata(enemy),
}
```

and:

```ts
return {
  id: enemy.id,
  type: 'armor-guard',
  x: enemy.x,
  surfaceY: enemy.surfaceY,
  patrolMinX: enemy.patrolMinX,
  patrolMaxX: enemy.patrolMaxX,
  ...getEnemyRuntimeMetadata(enemy),
}
```

- [ ] **Step 7: Add HUD boss phase fields**

In `src/domain/gameplay/gameplayHud.ts`, import:

```ts
import { getBossHudPhaseDisplay, isBossStageDefinition } from './bossBattle'
```

Extend `GameplayHudStatusMessageKey`:

```ts
  | 'status.bossPattern'
  | 'status.bossVulnerable'
  | 'status.bossDefeated'
```

Extend `GameplayHudState`:

```ts
  bossPhase: number
  bossPhaseMax: number
```

Inside `createInitialGameplayHudState`, compute:

```ts
  const bossHudPhase = getBossHudPhaseDisplay({
    isBossStage: isBossStageDefinition({
      stageId: stage.id,
      enemies: stage.enemies,
    }),
    bossPhase: 0,
  })
```

Add to returned object:

```ts
    bossPhase: bossHudPhase.phase,
    bossPhaseMax: bossHudPhase.max,
```

- [ ] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run TypeScript check for metadata shape**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 10: Commit Task 2**

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.ts src/domain/gameplay/gameplayHud.test.ts
git commit -m "feat: preserve boss metadata in gameplay state"
```

---

### Task 3: Renderer Boss Projectile Runtime

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer projectile texture and first volley tests**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, add tests near existing renderer create/preload tests:

```ts
  it('creates a boss projectile texture for boss stages', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    expect(runtime.generatedTextures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'boss-projectile', width: 28, height: 28 }),
      ]),
    )
  })

  it('starts boss pattern with an immediate phase zero aimed projectile', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    const projectile = runtime.sprites.find((sprite) => sprite.texture === 'boss-projectile')
    expect(projectile).toBeDefined()
    expect(projectile?.depth).toBe(16)
    expect(projectile?.blendMode).toBe(runtime.Phaser.BlendModes.ADD)
    expect(projectile?.body.allowGravity).toBe(false)
    expect(projectile?.velocity.x).not.toBe(0)
  })
```

If `FakeSceneRuntime` does not expose `generatedTextures`, add it to the fake graphics `generateTexture` implementation as part of this RED step and keep the production code unchanged.

- [ ] **Step 2: Run focused renderer tests and verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "boss projectile|boss pattern"
```

Expected: FAIL because no boss projectile texture or pattern exists.

- [ ] **Step 3: Add renderer imports and runtime types**

In `src/ui/gameplay/createGameplayRenderer.ts`, import:

```ts
import {
  canFireBossVolley,
  canRunBossPatternTick,
  canStartBossPattern,
  getBossPatternDelayMs,
  getBossVolleyShots,
  isBossStageDefinition,
  shouldResetBossSupportCore,
} from '../../domain/gameplay/bossBattle'
import {
  getBossProjectileHitDecision,
  getBossProjectileLifecycleDecision,
  getBossProjectileVelocity,
  isBossProjectileExpired,
  isBossProjectileOutOfBounds,
  shouldUpdateBossProjectiles,
} from '../../domain/gameplay/bossProjectile'
```

Add runtime type near `EnemyRuntime`:

```ts
type BossProjectileRuntime = Phaser.Physics.Arcade.Sprite
```

Add class fields:

```ts
  private bossPrototype: EnemyRuntime | null = null
  private bossProjectiles: BossProjectileRuntime[] = []
  private bossPhase = 0
  private bossShotIndex = 0
  private bossPatternGeneration = 0
  private bossPatternEvent?: Phaser.Time.TimerEvent
```

Add getter:

```ts
  private get isBossStage(): boolean {
    return isBossStageDefinition({
      stageId: this.stageMap.id,
      enemies: this.stageMap.enemies,
    })
  }
```

- [ ] **Step 4: Create boss projectile texture**

Call `this.createBossProjectileTexture()` in scene `create()` immediately after other generated texture creation.

Add method:

```ts
  private createBossProjectileTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0xffffff, 0.95)
    graphics.fillCircle(14, 14, 8)
    graphics.lineStyle(4, 0x8be7ff, 0.9)
    graphics.strokeCircle(14, 14, 10)
    graphics.lineStyle(2, 0x4be8ff, 0.8)
    graphics.strokeCircle(14, 14, 13)
    graphics.generateTexture('boss-projectile', 28, 28)
    graphics.destroy()
  }
```

- [ ] **Step 5: Initialize boss prototype and start pattern**

After `createEnemies()` completes in `create()`, call:

```ts
    this.initializeBossPrototype()
```

Add method:

```ts
  private initializeBossPrototype(): void {
    if (!this.isBossStage) return

    this.bossPrototype = this.enemies.find((enemy) => enemy.spawn.id === 'boss-prototype') ?? null
    if (this.bossPrototype) {
      this.startBossPattern()
    }
  }
```

This requires `EnemyRuntime` to store the spawn:

```ts
type EnemyRuntime = {
  sprite: Phaser.Physics.Arcade.Sprite
  spawn: GameplayEnemySpawn
  type: GameplayEnemySpawn['type']
  defeated: boolean
  patrolDirection: EnemyPatrolDirection
  floatingTween?: Phaser.Tweens.Tween
}
```

Use existing enemy spawn creation to set `spawn`.

- [ ] **Step 6: Implement boss pattern start and projectile spawn**

Add:

```ts
  private startBossPattern(): void {
    const boss = this.bossPrototype
    if (!canStartBossPattern({
      bossExists: boss !== null,
      bossType: boss?.type,
      bossPhase: this.bossPhase,
      stageCleared: this.stageCleared,
    }) || !boss) {
      return
    }

    const generation = ++this.bossPatternGeneration
    this.clearBossProjectiles()
    this.bossPatternEvent?.remove(false)
    this.bossPatternEvent = undefined
    this.bossShotIndex = 0
    for (const enemy of this.enemies) {
      if (shouldResetBossSupportCore({ sameAsBoss: enemy === boss, enemyType: enemy.type })) {
        enemy.defeated = false
        enemy.sprite.setVisible(true)
        const body = enemy.sprite.body as Phaser.Physics.Arcade.Body | null
        if (body) body.enable = true
      }
    }
    this.emitBossHudPatch()
    this.fireBossVolley(this.bossPhase, this.bossShotIndex++)
    this.bossPatternEvent = this.time.addEvent({
      delay: getBossPatternDelayMs({ phase: this.bossPhase }),
      loop: true,
      callback: () => {
        if (!canRunBossPatternTick({
          generation,
          currentGeneration: this.bossPatternGeneration,
          stageCleared: this.stageCleared,
          playerDead: this.isPlayerDead,
        })) return
        this.fireBossVolley(this.bossPhase, this.bossShotIndex++)
      },
    })
  }

  private fireBossVolley(phase: number, shotIndex: number): void {
    const boss = this.bossPrototype
    if (!canFireBossVolley({
      bossExists: boss !== null,
      bossVisible: boss?.sprite.visible ?? false,
    }) || !boss || !this.player) {
      return
    }

    const aimedAngle = Phaser.Math.Angle.Between(boss.sprite.x, boss.sprite.y, this.player.x, this.player.y)
    for (const shot of getBossVolleyShots({ phase, shotIndex, aimedAngle })) {
      this.spawnBossProjectile(boss.sprite.x, boss.sprite.y, shot.angle, shot.speed)
    }
  }

  private spawnBossProjectile(x: number, y: number, angle: number, speed: number): void {
    const projectile = this.physics.add.sprite(x, y, 'boss-projectile')
    projectile.body.allowGravity = false
    const velocity = getBossProjectileVelocity({ angle, speed })
    projectile.setVelocity(velocity.x, velocity.y)
    projectile.setDepth(16)
    projectile.setBlendMode(Phaser.BlendModes.ADD)
    projectile.setData('spawnedAt', this.time.now)
    this.bossProjectiles.push(projectile)
  }
```

Add helper:

```ts
  private emitBossHudPatch(): void {
    const phase = getBossHudPhaseDisplay({
      isBossStage: this.isBossStage,
      bossPhase: this.bossPhase,
    })
    this.emitHudPatch({
      bossPhase: phase.phase,
      bossPhaseMax: phase.max,
      statusMessageKey: 'status.bossPattern',
    })
  }
```

Merge `getBossHudPhaseDisplay` into the existing `bossBattle` import:

- [ ] **Step 7: Implement projectile update lifecycle and hit handling**

Call `this.updateBossProjectiles()` in `update()` after enemy updates and before stage clear logic.

Add:

```ts
  private updateBossProjectiles(): void {
    if (!shouldUpdateBossProjectiles({ projectileCount: this.bossProjectiles.length })) return
    if (!this.player) return

    for (const projectile of [...this.bossProjectiles]) {
      const expired = isBossProjectileExpired({
        now: this.time.now,
        spawnedAt: Number(projectile.getData('spawnedAt')),
      })
      const outside = isBossProjectileOutOfBounds({
        x: projectile.x,
        y: projectile.y,
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      })
      const lifecycle = getBossProjectileLifecycleDecision({ outside, expired })
      if (lifecycle === 'destroy') {
        this.destroyBossProjectile(projectile)
        continue
      }
      if (lifecycle === 'fade') {
        this.fadeBossProjectile(projectile)
        continue
      }

      const hit = getBossProjectileHitDecision({
        playerDead: this.isPlayerDead,
        playerCrouching: this.isPlayerCrouching(),
        distanceToPlayer: Phaser.Math.Distance.Between(this.player.x, this.player.y, projectile.x, projectile.y),
      })
      if (hit === 'blocked-by-crouch') {
        this.destroyBossProjectile(projectile)
      } else if (hit === 'hit') {
        this.destroyBossProjectile(projectile)
        this.applyPlayerContactDamage(projectile.x)
      }
    }
  }

  private destroyBossProjectile(projectile: BossProjectileRuntime): void {
    this.bossProjectiles = this.bossProjectiles.filter((candidate) => candidate !== projectile)
    projectile.destroy()
  }

  private fadeBossProjectile(projectile: BossProjectileRuntime, durationMs = 220): void {
    this.bossProjectiles = this.bossProjectiles.filter((candidate) => candidate !== projectile)
    const body = projectile.body as Phaser.Physics.Arcade.Body | null
    if (body) body.enable = false
    this.tweens.add({
      targets: projectile,
      alpha: 0,
      scale: projectile.scale * 0.72,
      duration: durationMs,
      onComplete: () => projectile.destroy(),
    })
  }

  private clearBossProjectiles(): void {
    for (const projectile of [...this.bossProjectiles]) {
      this.fadeBossProjectile(projectile, 160)
    }
  }
```

Add this private crouch helper before `tryStartPlayerAttack`:

```ts
  private isPlayerCrouching(): boolean {
    if (!this.playerKeys) return false

    return this.isPlayerGrounded() && (this.playerKeys.down.isDown || this.playerKeys.s.isDown)
  }
```

If `playerKeys` does not yet include `down` and `s`, extend the `playerKeys` type and `createPlayerKeys()` mapping with `Phaser.Input.Keyboard.KeyCodes.DOWN` and `Phaser.Input.Keyboard.KeyCodes.S`.

- [ ] **Step 8: Run focused renderer tests and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "boss projectile|boss pattern"
```

Expected: PASS.

- [ ] **Step 9: Run full renderer test file**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 3**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: add boss projectile runtime"
```

---

### Task 4: Boss Hit Phase Transitions

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing melee boss phase transition test**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, add:

```ts
  it('advances boss phase on melee hit instead of defeating the boss as an ordinary enemy', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    const boss = runtime.sprites.find((sprite) => sprite.spawnId === 'boss-prototype')
    expect(boss).toBeDefined()
    if (!boss) return

    runtime.placePlayerNear(boss.x - 48, boss.y)
    runtime.pressAttack()
    runtime.scene.update(16, 16)

    expect(boss.visible).toBe(true)
    expect(boss.body.enable).toBe(true)
    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bossPhase: 2, bossPhaseMax: 4 }),
      ]),
    )
  })
```

Add these fake runtime helpers to `createGameplayRenderer.test.ts` if they are not already present:

```ts
  placePlayerNear: (x: number, y: number) => {
    if (!scene.player) return
    scene.player.x = x
    scene.player.y = y
  },
  pressAttack: () => {
    keyState.j.isDown = true
  },
  hitBossWithMelee: () => {
    const boss = sprites.find((sprite) => sprite.spawnId === 'boss-prototype')
    if (!boss || !scene.player) return
    scene.player.x = boss.x - 48
    scene.player.y = boss.y
    keyState.j.isDown = true
    scene.update(16, 16)
    keyState.j.isDown = false
    scene.update(32, 16)
  },
  killPlayerWithDamage: () => {
    const sourceX = scene.player ? scene.player.x + 16 : 16
    scene.applyPlayerContactDamage(sourceX)
    scene.applyPlayerContactDamage(sourceX)
    scene.applyPlayerContactDamage(sourceX)
  },
```

Expose private scene methods only through the existing fake-runtime pattern already used elsewhere in this test file; do not add production-only public APIs for tests.

- [ ] **Step 2: Write failing final boss hit test**

Add:

```ts
  it('defeats the boss on the final boss phase hit', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()

    const boss = runtime.sprites.find((sprite) => sprite.spawnId === 'boss-prototype')
    expect(boss?.visible).toBe(false)
    expect(boss?.body.enable).toBe(false)
    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bossPhase: 4, bossPhaseMax: 4, statusMessageKey: 'status.bossDefeated' }),
      ]),
    )
  })
```

- [ ] **Step 3: Write failing respawn restart cleanup test**

Add:

```ts
  it('clears boss projectiles on player defeat and restarts the current phase after respawn', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    expect(runtime.sprites.some((sprite) => sprite.texture === 'boss-projectile')).toBe(true)

    runtime.killPlayerWithDamage()
    expect(runtime.sprites.filter((sprite) => sprite.texture === 'boss-projectile' && !sprite.destroyed)).toHaveLength(0)

    runtime.runDelayedCalls(700)
    runtime.runDelayedCalls(500)
    expect(runtime.sprites.some((sprite) => sprite.texture === 'boss-projectile' && !sprite.destroyed)).toBe(true)
  })
```

- [ ] **Step 4: Run focused tests and verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "boss phase|final boss|restarts the current phase"
```

Expected: FAIL because boss hits still use ordinary enemy defeat or phase transition is incomplete.

- [ ] **Step 5: Import remaining boss functions**

In `createGameplayRenderer.ts`, import:

```ts
import {
  canHitBossPrototype,
  getBossHitOutcome,
  getBossPhasePlayerResetState,
  shouldRestartBossPatternAfterRespawn,
  shouldResetBossRunAfterHomingHit,
} from '../../domain/gameplay/bossBattle'
```

Merge this into the existing bossBattle import if Task 3 already added one.

- [ ] **Step 6: Route enemy hits through boss transition**

In `defeatEnemy(enemy)`, before ordinary defeat handling, add:

```ts
    if (enemy === this.bossPrototype && this.handleBossPrototypeHit()) {
      return
    }
```

Add method:

```ts
  private handleBossPrototypeHit(): boolean {
    const boss = this.bossPrototype
    if (!canHitBossPrototype({
      bossExists: boss !== null,
      bossDefeated: boss?.defeated ?? true,
    }) || !boss) {
      return false
    }

    this.bossPatternGeneration += 1
    this.bossPatternEvent?.remove(false)
    this.bossPatternEvent = undefined
    this.clearBossProjectiles()

    const outcome = getBossHitOutcome({ currentPhase: this.bossPhase })
    this.bossPhase = outcome.nextPhase

    if (outcome.type === 'defeated') {
      this.defeatBossPrototype(boss)
      return true
    }

    this.advanceBossPhase(boss)
    return true
  }
```

- [ ] **Step 7: Implement phase advance and final defeat**

Add:

```ts
  private advanceBossPhase(boss: EnemyRuntime): void {
    boss.sprite.setVelocity(0, 0)
    this.tweens.add({
      targets: boss.sprite,
      scale: boss.sprite.scale * 1.18,
      alpha: 0.5,
      duration: 160,
      yoyo: true,
    })

    const reset = getBossPhasePlayerResetState({ maxHealth: PLAYER_MAX_HEALTH })
    this.playerHealth = reset.health
    this.isAttacking = reset.attacking
    this.isHomingAttacking = reset.homingAttacking
    this.attackReady = reset.attackReady
    this.isPlayerHurting = false
    this.isPlayerInvulnerable = false
    this.clearActiveMeleeHitboxes()
    this.clearHomingState()
    this.respawnPlayerAtCurrentPoint()
    this.emitBossHudPatch()
    this.emitHudPatch({
      hp: this.playerHealth,
      statusMessageKey: 'status.bossPattern',
    })
    this.time.delayedCall(620, () => this.startBossPattern())
  }

  private defeatBossPrototype(boss: EnemyRuntime): void {
    boss.defeated = true
    this.enemiesDefeated += 1
    boss.sprite.setVelocity(0, 0)
    const body = boss.sprite.body as Phaser.Physics.Arcade.Body | null
    if (body) body.enable = false
    this.tweens.add({
      targets: boss.sprite,
      scale: boss.sprite.scale * 1.8,
      alpha: 0,
      angle: boss.sprite.angle + 90,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => boss.sprite.setVisible(false),
    })
    this.emitHudPatch({
      enemiesDefeated: this.enemiesDefeated,
      enemyMarkers: getHudEnemyMarkers({
        enemies: this.enemies.map((candidate) => ({
          x: candidate.sprite.x,
          y: candidate.sprite.y,
          defeated: candidate.defeated,
        })),
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      }),
      bossPhase: BOSS_PHASE_COUNT,
      bossPhaseMax: BOSS_PHASE_COUNT,
      statusMessageKey: 'status.bossDefeated',
    })
  }
```

Extract the current player repositioning block from `respawnPlayer()` into this helper and call it from both `respawnPlayer()` and `advanceBossPhase()`:

```ts
  private respawnPlayerAtCurrentPoint(): void {
    if (!this.player) return

    this.player.x = this.currentRespawnPoint.x
    this.player.y = getPlayerCenterY({ surfaceY: this.currentRespawnPoint.surfaceY })
    this.player.setVelocity(0, 0)
    this.player.setAccelerationX(0)
    this.player.setAlpha(1)
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

- [ ] **Step 8: Wire homing reset and final boss defeat**

In `resolveHomingAttack`, before ordinary enemy defeat, calculate:

```ts
    const resetsBossRun = shouldResetBossRunAfterHomingHit({
      targetIsBoss: target === this.bossPrototype?.sprite,
      bossPhase: this.bossPhase,
    })
```

Then if the enemy is the boss:

```ts
    if (enemy === this.bossPrototype) {
      this.handleBossPrototypeHit()
      if (!resetsBossRun) {
        this.finishHomingAttack(true)
      }
      return
    }
```

Keep ordinary enemy homing behavior unchanged for non-boss enemies.

- [ ] **Step 9: Stop/restart patterns around defeat, respawn, and clear**

When player defeat starts on boss stage, add:

```ts
    if (this.isBossStage) {
      this.bossPatternGeneration += 1
      this.bossPatternEvent?.remove(false)
      this.bossPatternEvent = undefined
      this.clearBossProjectiles()
    }
```

After the existing player respawn completes, add:

```ts
    if (shouldRestartBossPatternAfterRespawn({
      isBossStage: this.isBossStage,
      bossPhase: this.bossPhase,
    })) {
      this.time.delayedCall(500, () => this.startBossPattern())
    }
```

When stage clear starts, add the same stop/clear block and do not restart.

- [ ] **Step 10: Run focused tests and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "boss phase|final boss|restarts the current phase"
```

Expected: PASS.

- [ ] **Step 11: Run full renderer tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 12: Commit Task 4**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: add boss phase transitions"
```

---

### Task 5: Boss HUD And Localization

**Files:**
- Modify: `src/domain/data/localize/localize.ts`
- Modify: `src/domain/data/localize/localize.test.ts`
- Modify: `src/ui/gameplay/GameplayHud.svelte`
- Modify: `src/ui/gameplay/gameplayHudUi.test.ts`

- [ ] **Step 1: Write failing localization tests**

In `src/domain/data/localize/localize.test.ts`, add:

```ts
  it('includes localized gameplay boss HUD values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        bossPhase: 'Boss Phase',
        bossPhaseHint: 'Each hit starts the next pattern from the entrance.',
        bossPattern: 'Boss phase {phase}/{max}. Evade the barrage.',
        bossVulnerable: 'Attack window open. Strike the Boss now.',
        bossDefeated: 'Boss signal defeated. The exit is open.',
      },
      ja: {
        bossPhase: 'ボスフェーズ',
        bossPhaseHint: '攻撃が当たるたび入口から次のパターンが始まります。',
        bossPattern: 'ボスフェーズ {phase}/{max}。弾幕を回避してください。',
        bossVulnerable: '攻撃チャンス。今すぐボスを攻撃してください。',
        bossDefeated: 'ボス信号を撃破。出口が開きました。',
      },
      zhHant: {
        bossPhase: 'Boss 階段',
        bossPhaseHint: '每次命中後會回到入口，並進入下一段彈幕。',
        bossPattern: 'Boss 階段 {phase}/{max}，閃避彈幕。',
        bossVulnerable: '攻擊窗口開啟，現在攻擊 Boss。',
        bossDefeated: 'Boss 已擊敗，出口已開啟。',
      },
      ko: {
        bossPhase: '보스 페이즈',
        bossPhaseHint: '한 번 맞힐 때마다 입구에서 다음 패턴이 시작됩니다.',
        bossPattern: '보스 페이즈 {phase}/{max}. 탄막을 피하세요.',
        bossVulnerable: '공격 기회가 열렸습니다. 지금 보스를 공격하세요.',
        bossDefeated: '보스 신호를 격파했습니다. 출구가 열렸습니다.',
      },
    } as const

    for (const locale of localize.languages.map((language) => language.code)) {
      expect(resolveLocalizedText(localize, locale, 'gameplayHud.bossPhase')).toBe(
        expectedByLocale[locale].bossPhase,
      )
      expect(resolveLocalizedText(localize, locale, 'gameplayHud.bossPhaseHint')).toBe(
        expectedByLocale[locale].bossPhaseHint,
      )
      expect(resolveLocalizedText(localize, locale, 'status.bossPattern')).toBe(
        expectedByLocale[locale].bossPattern,
      )
      expect(resolveLocalizedText(localize, locale, 'status.bossVulnerable')).toBe(
        expectedByLocale[locale].bossVulnerable,
      )
      expect(resolveLocalizedText(localize, locale, 'status.bossDefeated')).toBe(
        expectedByLocale[locale].bossDefeated,
      )
    }
  })
```

- [ ] **Step 2: Write failing HUD source tests**

In `src/ui/gameplay/gameplayHudUi.test.ts`, add:

```ts
  it('renders boss phase HUD only when boss phase state is present and uncleared', () => {
    expect(hudSource).toContain('{#if state.bossPhaseMax > 0 && !state.cleared}')
    expect(hudSource).toContain('class="hud-panel boss-phase-hud"')
    expect(hudSource).toContain('gameplayHud.bossPhase')
    expect(hudSource).toContain('{state.bossPhase}')
    expect(hudSource).toContain('{state.bossPhaseMax}')
    expect(hudSource).toContain('gameplayHud.bossPhaseHint')
  })
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/ui/gameplay/gameplayHudUi.test.ts
```

Expected: FAIL because the keys and panel are missing.

- [ ] **Step 4: Add localization key types**

In `src/domain/data/localize/localize.ts`, add:

```ts
export type GameplayHudLocalizationKey =
  | 'gameplayHud.bossPhase'
  | 'gameplayHud.bossPhaseHint'

export type GameplayStatusLocalizationKey =
  | 'status.bossPattern'
  | 'status.bossVulnerable'
  | 'status.bossDefeated'
```

Add both to `LocalizationKey`:

```ts
  | GameplayHudLocalizationKey
  | GameplayStatusLocalizationKey
```

Add the catalog entries from Step 1 to all four locales.

- [ ] **Step 5: Render boss phase HUD panel**

In `src/ui/gameplay/GameplayHud.svelte`, follow the current source-tested HUD pattern and render localization key placeholders for this slice. A later gameplay localization pass can replace all existing hard-coded HUD labels at once:

```svelte
  {#if state.bossPhaseMax > 0 && !state.cleared}
    <section class="hud-panel boss-phase-hud" aria-label="Boss phase">
      <span class="corner tr"></span>
      <span class="corner bl"></span>
      <div class="hud-label"><span></span>gameplayHud.bossPhase</div>
      <strong>{state.bossPhase} <small>/ {state.bossPhaseMax}</small></strong>
      <p>gameplayHud.bossPhaseHint</p>
    </section>
  {/if}
```

Add CSS near `.objective-hud`:

```css
  .boss-phase-hud {
    top: 32.2cqh;
    right: 1.25cqw;
    width: 24cqw;
    padding: 1.67cqh 1.1cqw;
  }

  .boss-phase-hud strong {
    display: block;
    margin-top: 1.1cqh;
    color: var(--hud-ink);
    font-size: 2.1cqw;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 0.9;
  }

  .boss-phase-hud small {
    color: var(--hud-soft);
    font-size: 0.55em;
  }

  .boss-phase-hud p {
    margin: 0.85cqh 0 0;
    color: var(--hud-soft);
    font-size: 0.75cqw;
    font-weight: 700;
    line-height: 1.15;
  }
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/ui/gameplay/gameplayHudUi.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts src/ui/gameplay/GameplayHud.svelte src/ui/gameplay/gameplayHudUi.test.ts
git commit -m "feat: add boss phase hud"
```

---

### Task 6: Full Verification And Review

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full test suite**

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

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. A Vite chunk-size warning is acceptable if no new build errors appear.

- [ ] **Step 4: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit 0.

- [ ] **Step 5: Run Prototype boundary search**

Run:

```bash
rg -n "__prototype__" src public package.json
```

Expected: no runtime imports or asset references. Tests that assert `__prototype__` is absent are acceptable.

- [ ] **Step 6: Request final code review**

Use `superpowers:requesting-code-review` on the full boss battle slice. The review prompt must include:

- this plan path.
- the spec path.
- the branch diff from the commit before Task 1 through `HEAD`.
- focus on TDD evidence, domain purity, Prototype boundary, renderer adapter scope, HUD behavior, and parity constants.

- [ ] **Step 7: Fix Critical or Important review findings**

If the reviewer reports Critical or Important findings, fix them with TDD and re-run the relevant focused tests plus:

```bash
npm run test
npm run check
git diff --check
```

- [ ] **Step 8: Commit any review fixes**

If fixes were needed:

```bash
git add <fixed files>
git commit -m "fix: address boss battle review findings"
```

- [ ] **Step 9: Final status**

Do not merge to `main`; this branch is intentionally accumulating Prototype gameplay migration work. Report the verification commands, review status, and current branch.
