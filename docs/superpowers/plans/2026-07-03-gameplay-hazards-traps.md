# Gameplay Hazards / Traps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first rebuilt fixed hazard slice by rendering prototype spikes and routing player contact through existing life, invulnerability, death transition, and respawn behavior.

**Architecture:** Keep hazard presentation and hit gates in pure `src/domain/gameplay/` modules. Keep Phaser asset loading, static bodies, overlaps, tweens, delayed calls, and scene state mutation inside `src/ui/gameplay/createGameplayRenderer.ts`. Use a test-only hazard map in renderer tests so this slice proves behavior without migrating the full prototype 2-1 stage.

**Tech Stack:** TypeScript, Vitest, Svelte/Tauri frontend, Phaser Arcade Physics, root `public/` runtime assets.

---

## File Structure

- Create `src/domain/gameplay/hazardActor.ts`
  - Owns pure hazard type names, spike asset metadata, orientation frame selection, grounded placement, and body presentation values.
- Create `src/domain/gameplay/hazardActor.test.ts`
  - Covers the prototype spike constants and pure helpers.
- Modify `src/domain/gameplay/playerLife.ts`
  - Adds the hazard-specific contact gate.
- Modify `src/domain/gameplay/playerLife.test.ts`
  - Covers hazard hit gating for active, invulnerable, hurting, Homing, and dead states.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`
  - Adds `GameplayHazardSpawn` and `hazards` on `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMaps.ts`
  - Adds `hazards: []` to existing rebuilt 1-1.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Verifies hazard data contract and root public hazard asset refs.
- Copy `__prototype__/public/assets/props/emerald_sanctuary_spikes.webp`
  - To `public/assets/props/emerald_sanctuary_spikes.webp`.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Preloads spike spritesheet, creates static hazard sprites, wires player overlaps, and extracts shared contact damage handling.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Extends fake runtime to support static images and injected test stage maps, then tests rendering and contact behavior.

## Task 1: Hazard Actor Domain

**Files:**
- Create: `src/domain/gameplay/hazardActor.test.ts`
- Create: `src/domain/gameplay/hazardActor.ts`

- [ ] **Step 1: Write the failing hazard actor tests**

Create `src/domain/gameplay/hazardActor.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  getGroundedHazardCenterY,
  getHazardBodyPresentation,
  getHazardFrameIndex,
  hazardActorDefinitions,
} from './hazardActor'

describe('hazard actor definitions', () => {
  it('defines prototype spike presentation as rebuild-owned asset metadata', () => {
    expect(hazardActorDefinitions.spikes).toEqual({
      behavior: 'fixed-damage',
      sprite: {
        key: 'emerald-sanctuary-spikes',
        assetRef: '/assets/props/emerald_sanctuary_spikes.webp',
        frameWidth: 256,
        frameHeight: 128,
      },
      origin: { x: 0.5, y: 0.5 },
      visualBottomInset: 14,
    })
  })
})

describe('hazard frame selection', () => {
  it('uses prototype frames for spike orientation', () => {
    expect(getHazardFrameIndex({})).toBe(0)
    expect(getHazardFrameIndex({ orientation: 'floor' })).toBe(0)
    expect(getHazardFrameIndex({ orientation: 'right-wall' })).toBe(2)
    expect(getHazardFrameIndex({ orientation: 'left-wall' })).toBe(3)
    expect(getHazardFrameIndex({ orientation: 'ceiling' })).toBe(4)
  })
})

describe('hazard placement', () => {
  it('places floor spikes on a platform surface with prototype visual inset', () => {
    expect(getGroundedHazardCenterY({
      surfaceY: 640,
      height: 62,
      type: 'spikes',
    })).toBe(640 - 31 + 14)
  })

  it('uses prototype spike body ratios', () => {
    expect(getHazardBodyPresentation({
      width: 180,
      height: 62,
      type: 'spikes',
    })).toEqual({
      width: 154.8,
      height: 34.72,
      offsetX: 12.600000000000001,
      offsetY: 22.32,
    })
  })
})
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/hazardActor.test.ts
```

Expected: FAIL because `src/domain/gameplay/hazardActor.ts` does not exist.

- [ ] **Step 3: Implement the minimal hazard actor domain**

Create `src/domain/gameplay/hazardActor.ts`:

```ts
export type GameplayHazardType = 'spikes'
export type GameplayHazardOrientation = 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
export type HazardBehavior = 'fixed-damage'

export type HazardSpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
}

export type HazardActorDefinition = {
  behavior: HazardBehavior
  sprite: HazardSpriteDefinition
  origin: { x: number; y: number }
  visualBottomInset: number
}

export const hazardActorDefinitions = {
  spikes: {
    behavior: 'fixed-damage',
    sprite: {
      key: 'emerald-sanctuary-spikes',
      assetRef: '/assets/props/emerald_sanctuary_spikes.webp',
      frameWidth: 256,
      frameHeight: 128,
    },
    origin: { x: 0.5, y: 0.5 },
    visualBottomInset: 14,
  },
} as const satisfies Record<GameplayHazardType, HazardActorDefinition>

export function getHazardFrameIndex(input: {
  orientation?: GameplayHazardOrientation
}): number {
  if (input.orientation === 'ceiling') return 4
  if (input.orientation === 'left-wall') return 3
  if (input.orientation === 'right-wall') return 2
  return 0
}

export function getGroundedHazardCenterY(input: {
  surfaceY: number
  height: number
  type: GameplayHazardType
}): number {
  return input.surfaceY - input.height / 2 + hazardActorDefinitions[input.type].visualBottomInset
}

export function getHazardBodyPresentation(input: {
  width: number
  height: number
  type: GameplayHazardType
}): {
  width: number
  height: number
  offsetX: number
  offsetY: number
} {
  return {
    width: input.width * 0.86,
    height: input.height * 0.56,
    offsetX: input.width * 0.07,
    offsetY: input.height * 0.36,
  }
}
```

- [ ] **Step 4: Run the focused test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/hazardActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/gameplay/hazardActor.ts src/domain/gameplay/hazardActor.test.ts
git commit -m "feat: add gameplay hazard actor rules"
```

## Task 2: Player Hazard Hit Gate

**Files:**
- Modify: `src/domain/gameplay/playerLife.test.ts`
- Modify: `src/domain/gameplay/playerLife.ts`

- [ ] **Step 1: Write the failing player life tests**

In `src/domain/gameplay/playerLife.test.ts`, add `canApplyPlayerHazardHit` to the import list:

```ts
  canApplyPlayerHazardHit,
```

After the `canApplyPlayerEnemyHit` describe block, add:

```ts
describe('canApplyPlayerHazardHit', () => {
  it('allows hazard contact when no blocking state is active', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks hazard contact while protected or dead', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: true,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: true,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: true,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: true,
    })).toBe(false)
  })
})
```

- [ ] **Step 2: Run focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/playerLife.test.ts
```

Expected: FAIL because `canApplyPlayerHazardHit` is not exported.

- [ ] **Step 3: Implement the hazard hit gate**

In `src/domain/gameplay/playerLife.ts`, add after `canApplyPlayerEnemyHit`:

```ts
export function canApplyPlayerHazardHit(input: {
  invulnerable: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean {
  return !input.invulnerable
    && !input.hurting
    && !input.homingAttacking
    && !input.dead
}
```

- [ ] **Step 4: Run focused test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/playerLife.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/domain/gameplay/playerLife.ts src/domain/gameplay/playerLife.test.ts
git commit -m "feat: gate player hazard hits"
```

## Task 3: Stage Hazard Data And Asset Boundary

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Copy: `__prototype__/public/assets/props/emerald_sanctuary_spikes.webp` to `public/assets/props/emerald_sanctuary_spikes.webp`

- [ ] **Step 1: Write failing stage map tests**

In `src/domain/gameplay/gameplayStageMaps.test.ts`, add:

```ts
import { hazardActorDefinitions } from './hazardActor'
```

In the asset refs test, append hazard asset refs:

```ts
    const hazardAssetRefs = Object.values(hazardActorDefinitions)
      .map((definition) => definition.sprite.assetRef)

    const assetRefs = [
      ...stage.backgroundLayers.map((layer) => layer.assetRef),
      stage.terrain.tilesetAssetRef,
      ...Object.values(playerActorDefinition.sprites).map((sprite) => sprite.assetRef),
      ...enemyAssetRefs,
      ...hazardAssetRefs,
    ]
```

Update the expected array to include:

```ts
      '/assets/props/emerald_sanctuary_spikes.webp',
```

Add these tests near the coin stage map tests:

```ts
  it('defines fixed hazard data for every gameplay stage map', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.hazards).toEqual([])
  })

  it('keeps gameplay hazard ids unique within each stage', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      const ids = stage.hazards.map((hazard) => hazard.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('places gameplay hazards inside their stage world bounds', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      expect(
        stage.hazards.every((hazard) =>
          Number.isFinite(hazard.x)
          && Number.isFinite(hazard.surfaceY)
          && hazard.x >= 0
          && hazard.x <= stage.world.width
          && hazard.surfaceY >= 0
          && hazard.surfaceY <= stage.world.height
          && hazard.width > 0
          && hazard.height > 0,
        ),
      ).toBe(true)
    }
  })
```

- [ ] **Step 2: Run focused tests and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `GameplayStageMap` has no `hazards` property and the stage map does not define hazards.

- [ ] **Step 3: Add hazard type to gameplay map types**

In `src/domain/gameplay/gameplayMapTypes.ts`, add:

```ts
export type GameplayHazardSpawn = {
  id: string
  type: 'spikes'
  x: number
  surfaceY: number
  width: number
  height: number
  orientation?: 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
}
```

Add this property to `GameplayStageMap` after `coins`:

```ts
  hazards: readonly GameplayHazardSpawn[]
```

- [ ] **Step 4: Add empty hazards to 1-1**

In `src/domain/gameplay/gameplayStageMaps.ts`, add after `coins`:

```ts
  hazards: [],
```

- [ ] **Step 5: Copy the spike asset into rebuild public assets**

Run:

```bash
mkdir -p public/assets/props
cp __prototype__/public/assets/props/emerald_sanctuary_spikes.webp public/assets/props/emerald_sanctuary_spikes.webp
```

Then verify:

```bash
test -s public/assets/props/emerald_sanctuary_spikes.webp
```

Expected: exit code `0`.

- [ ] **Step 6: Run focused tests and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 7: Check prototype references are not introduced in runtime files**

Run:

```bash
rg -n "__prototype__" src public
```

Expected: no matches in runtime source/assets. Matches in docs or tests outside this command are acceptable only when documenting prototype references.

- [ ] **Step 8: Commit Task 3**

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts public/assets/props/emerald_sanctuary_spikes.webp
git commit -m "feat: add gameplay hazard stage data"
```

## Task 4: Renderer Hazard Creation

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Extend fake runtime for test stage injection and static images**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, import:

```ts
import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
import {
  getGroundedHazardCenterY,
  getHazardBodyPresentation,
  getHazardFrameIndex,
  hazardActorDefinitions,
} from '../../domain/gameplay/hazardActor'
```

Change `createSceneRuntime` signature:

```ts
function createSceneRuntime(input: { stage?: GameplayStageMap } = {}) {
  const stage = input.stage ?? getGameplayStageMap('1-1')
```

Extend the scene type under `physics.add`:

```ts
        staticImage: (
          x: number,
          y: number,
          texture: string,
          frame?: number,
        ) => ReturnType<typeof createFakeArcadeSprite>
```

Add arrays near `spriteCalls`:

```ts
  const staticImageCalls: Array<ReturnType<typeof createFakeArcadeSprite>> = []
```

Add `staticImage` to `scene.physics.add`:

```ts
      staticImage: (x, y, texture, frame) => {
        const sprite = createFakeArcadeSprite({ x, y, texture })
        sprite.frame = frame
        staticImageCalls.push(sprite)
        return sprite
      },
```

Return `staticImageCalls` and this helper:

```ts
    staticImageCalls,
    triggerHazardOverlap: (hazard: ReturnType<typeof createFakeArcadeSprite>) => {
      const overlap = overlapCalls.find((candidate) => candidate.a === playerSprite && candidate.b === hazard)
      if (!overlap) {
        throw new Error(`Missing player overlap for hazard texture ${hazard.texture}.`)
      }
      overlap.callback()
    },
```

- [ ] **Step 2: Write failing renderer tests for preload and creation**

Add a helper near `recoverFromSurvivedHurt`:

```ts
function createHazardStage(): GameplayStageMap {
  const stage = getGameplayStageMap('1-1')
  expect(stage).toBeDefined()
  if (!stage) {
    throw new Error('Missing gameplay stage map 1-1.')
  }

  return {
    ...stage,
    hazards: [
      {
        id: 'test-spike-bed',
        type: 'spikes',
        x: 760,
        surfaceY: 512,
        width: 180,
        height: 62,
        orientation: 'floor',
      },
    ],
  }
}
```

Add tests in `describe('createGameplayRendererConfig', ...)`:

```ts
  it('preloads spike hazard spritesheets from the domain hazard definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    const sprite = hazardActorDefinitions.spikes.sprite
    expect(runtime.spritesheetCalls).toContainEqual({
      key: sprite.key,
      assetRef: sprite.assetRef,
      frameWidth: sprite.frameWidth,
      frameHeight: sprite.frameHeight,
    })
  })

  it('creates static spike hazards from stage data', () => {
    const stage = createHazardStage()
    const runtime = createSceneRuntime({ stage })

    runtime.scene.create()

    const hazardSpawn = stage.hazards[0]
    const spike = runtime.staticImageCalls.find((sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key)
    expect(spike).toBeDefined()
    if (!spike || !hazardSpawn) return

    expect(spike).toMatchObject({
      x: hazardSpawn.x,
      y: getGroundedHazardCenterY({
        surfaceY: hazardSpawn.surfaceY,
        height: hazardSpawn.height,
        type: hazardSpawn.type,
      }),
      frame: getHazardFrameIndex({ orientation: hazardSpawn.orientation }),
      depth: 8,
      origin: hazardActorDefinitions.spikes.origin,
    })
    const body = getHazardBodyPresentation({
      width: hazardSpawn.width,
      height: hazardSpawn.height,
      type: hazardSpawn.type,
    })
    expect(spike.body.size).toEqual({
      width: body.width,
      height: body.height,
    })
    expect(spike.body.offset).toEqual({
      x: body.offsetX,
      y: body.offsetY,
    })
    expect(runtime.overlapCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          a: runtime.playerSprite,
          b: spike,
        }),
      ]),
    )
  })
```

- [ ] **Step 3: Run focused renderer tests and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because the renderer does not preload or create hazards yet.

- [ ] **Step 4: Implement renderer hazard preload and creation**

In `src/ui/gameplay/createGameplayRenderer.ts`, add imports:

```ts
import {
  getGroundedHazardCenterY,
  getHazardBodyPresentation,
  getHazardFrameIndex,
  hazardActorDefinitions,
} from '../../domain/gameplay/hazardActor'
```

Extend the map type import:

```ts
import type { GameplayCoinPoint, GameplayEnemySpawn, GameplayHazardSpawn } from '../../domain/gameplay/gameplayMapTypes'
```

Add runtime type after `CoinRuntime`:

```ts
type HazardRuntime = {
  sprite: Phaser.Physics.Arcade.StaticImage
  spawn: GameplayHazardSpawn
}
```

Add scene field:

```ts
  private hazards: HazardRuntime[] = []
```

In `preload()`, after enemy spritesheets are loaded:

```ts
    for (const definition of Object.values(hazardActorDefinitions)) {
      this.load.spritesheet(definition.sprite.key, definition.sprite.assetRef, {
        frameWidth: definition.sprite.frameWidth,
        frameHeight: definition.sprite.frameHeight,
      })
    }
```

In `create()`, call `this.createHazards()` after terrain and before `this.createPhysics()`:

```ts
    this.createHazards()
```

Add a private method near `createCoins()`:

```ts
  private createHazards(): void {
    this.hazards = this.stageMap.hazards.map((spawn) => {
      const definition = hazardActorDefinitions[spawn.type]
      const sprite = this.physics.add.staticImage(
        spawn.x,
        getGroundedHazardCenterY({
          surfaceY: spawn.surfaceY,
          height: spawn.height,
          type: spawn.type,
        }),
        definition.sprite.key,
        getHazardFrameIndex({ orientation: spawn.orientation }),
      )
      sprite.setOrigin(definition.origin.x, definition.origin.y)
      sprite.setDisplaySize(spawn.width, spawn.height)
      sprite.setDepth(8)
      sprite.refreshBody()

      const body = getHazardBodyPresentation({
        width: spawn.width,
        height: spawn.height,
        type: spawn.type,
      })
      sprite.body.setSize(body.width, body.height)
      sprite.body.setOffset(body.offsetX, body.offsetY)

      return { sprite, spawn }
    })
  }
```

In the physics wiring method, add:

```ts
    for (const hazard of this.hazards) {
      this.physics.add.overlap(this.player, hazard.sprite, () => this.handlePlayerHazardContact(hazard))
    }
```

At this task, implement a temporary `handlePlayerHazardContact` that returns immediately. Task 5 will replace it with damage behavior:

```ts
  private handlePlayerHazardContact(_hazard: HazardRuntime): void {
    return
  }
```

- [ ] **Step 5: Add missing fake sprite methods if tests require them**

If TypeScript or tests fail because the fake sprite lacks methods used by static hazards, add these methods to `createFakeArcadeSprite`:

```ts
    displaySize: { width: 0, height: 0 },
    refreshedBody: false,
    setDisplaySize: (width: number, height: number) => {
      sprite.displaySize = { width, height }
      return sprite
    },
    refreshBody: () => {
      sprite.refreshedBody = true
      return sprite
    },
```

Expected: static hazard creation tests can inspect body and display state without a real Phaser runtime.

- [ ] **Step 6: Run focused renderer tests and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS for renderer tests.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: render gameplay spike hazards"
```

## Task 5: Player Hazard Contact Damage

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer tests for hazard contact**

Add these tests to `src/ui/gameplay/createGameplayRenderer.test.ts`:

```ts
  it('damages and hurts the player on spike hazard overlap', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find((sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key)
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.playerSprite.x = spike.x - 20
    runtime.triggerHazardOverlap(spike)

    expect(runtime.playerSprite.velocityX).toBe(-360)
    expect(runtime.playerSprite.velocityY).toBe(-360)
    expect(runtime.playerSprite.playCalls).toContainEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: runtime.playerSprite,
          alpha: playerHurtPresentation.blinkAlpha,
          duration: playerHurtPresentation.blinkDurationMs,
          yoyo: playerHurtPresentation.blinkYoyo,
          repeat: playerHurtPresentation.blinkRepeat,
        }),
      ]),
    )
  })

  it('does not apply repeated spike hazard damage while invulnerable', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find((sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key)
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.triggerHazardOverlap(spike)
    runtime.triggerHazardOverlap(spike)

    const hurtTweens = runtime.tweenCalls.filter((call) => call.targets === runtime.playerSprite)
    expect(hurtTweens).toHaveLength(1)
  })

  it('blocks spike hazard damage during Homing Attack', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find((sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key)
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    const scene = runtime.scene as typeof runtime.scene & { isHomingAttacking: boolean }
    scene.isHomingAttacking = true
    runtime.triggerHazardOverlap(spike)

    const hurtTweens = runtime.tweenCalls.filter((call) => call.targets === runtime.playerSprite)
    expect(hurtTweens).toHaveLength(0)
  })

  it('blocks spike hazard damage after player death', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find((sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key)
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    const scene = runtime.scene as typeof runtime.scene & { isPlayerDead: boolean }
    scene.isPlayerDead = true
    runtime.triggerHazardOverlap(spike)

    const hurtTweens = runtime.tweenCalls.filter((call) => call.targets === runtime.playerSprite)
    expect(hurtTweens).toHaveLength(0)
  })
```

- [ ] **Step 2: Run focused renderer tests and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because `handlePlayerHazardContact` does not apply damage.

- [ ] **Step 3: Extract shared contact damage helper and implement hazard gate**

In `src/ui/gameplay/createGameplayRenderer.ts`, add `canApplyPlayerHazardHit` to the player life imports:

```ts
  canApplyPlayerHazardHit,
```

Replace the damage consequence body inside `handlePlayerEnemyContact` with:

```ts
    this.applyPlayerContactDamage(enemy.sprite.x)
```

Add this helper by moving the existing enemy damage consequence code into it:

```ts
  private applyPlayerContactDamage(sourceX: number): void {
    if (!this.player) return

    const damageOutcome = getPlayerDamageOutcome({ currentHealth: this.playerHealth })
    this.playerHealth = damageOutcome.nextHealth
    if (damageOutcome.type === 'defeated') {
      this.defeatPlayer('damage')
      return
    }

    const entry = getPlayerHurtEntryState()
    this.clearHomingState()
    this.isPlayerHurting = entry.hurting
    this.isPlayerInvulnerable = entry.invulnerable
    this.isAttacking = entry.attacking
    this.attackReady = entry.attackReady
    this.clearActiveMeleeHitboxes()

    const direction = getPlayerKnockbackDirection({
      playerX: this.player.x,
      sourceX,
    })
    const velocity = getPlayerHurtVelocity({
      direction,
      gravitySign: 1,
    })

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
      this.isPlayerHurting = recovery.hurting
      this.attackReady = recovery.attackReady
    })
    this.time.delayedCall(playerLifeTiming.invulnerabilityRecoveryDelayMs, () => {
      const recovery = getPlayerInvulnerabilityRecoveryState()
      this.isPlayerInvulnerable = recovery.invulnerable
      this.player?.setAlpha(1)
    })
  }
```

Implement `handlePlayerHazardContact`:

```ts
  private handlePlayerHazardContact(hazard: HazardRuntime): void {
    if (!this.player) return

    if (
      !canApplyPlayerHazardHit({
        invulnerable: this.isPlayerInvulnerable,
        hurting: this.isPlayerHurting,
        homingAttacking: this.isHomingAttacking,
        dead: this.isPlayerDead,
      })
    ) {
      return
    }

    this.applyPlayerContactDamage(hazard.sprite.x)
  }
```

- [ ] **Step 4: Run focused renderer tests and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: damage player from gameplay hazards"
```

## Task 6: Fatal Hazard Contact And Verification

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts` only if the fatal behavior test exposes a gap.

- [ ] **Step 1: Write the fatal hazard overlap test**

Add this test to `src/ui/gameplay/createGameplayRenderer.test.ts`:

```ts
  it('starts the death transition when spike hazard damage defeats the player', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find((sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key)
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)

    expect(runtime.playerSprite.playCalls).toContainEqual({
      key: playerActorDefinition.sprites.death.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.delayedCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          delay: playerLifeTiming.deathRespawnDelayMs,
        }),
      ]),
    )

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    expect(runtime.cameraFadeOutCalls).toContainEqual({
      duration: playerDeathTransitionPresentation.fadeOutDurationMs,
      red: playerDeathTransitionPresentation.color.red,
      green: playerDeathTransitionPresentation.color.green,
      blue: playerDeathTransitionPresentation.color.blue,
    })

    runtime.triggerFadeOutComplete()
    expect(runtime.cameraFadeInCalls).toContainEqual({
      duration: playerDeathTransitionPresentation.fadeInDurationMs,
      red: playerDeathTransitionPresentation.color.red,
      green: playerDeathTransitionPresentation.color.green,
      blue: playerDeathTransitionPresentation.color.blue,
    })
  })
```

- [ ] **Step 2: Run focused renderer tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS if shared contact damage correctly uses existing defeat flow. If it fails, fix only the minimal renderer gap exposed by the test.

- [ ] **Step 3: Run domain and renderer focused tests**

Run:

```bash
npm run test -- src/domain/gameplay/hazardActor.test.ts src/domain/gameplay/playerLife.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run required full verification**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
rg -n "__prototype__" src public
```

Expected:

- `npm run test`: PASS.
- `npm run check`: PASS.
- `npm run build`: PASS, allowing the existing Vite chunk-size warning if still present.
- `git diff --check`: no output.
- `rg -n "__prototype__" src public`: no runtime source or public asset references to `__prototype__`.

- [ ] **Step 5: Commit Task 6 if it changed tests or code**

If Step 1 added the fatal test after Task 5, commit it:

```bash
git add src/ui/gameplay/createGameplayRenderer.test.ts src/ui/gameplay/createGameplayRenderer.ts
git commit -m "test: cover fatal gameplay hazard contact"
```

If Step 1 was included in Task 5 during execution and there are no changes, skip this commit.

## Final Review Checklist

- [ ] `docs/superpowers/specs/2026-07-03-gameplay-hazards-traps-design.md` acceptance criteria are all covered by code, asset, and tests.
- [ ] `public/assets/props/emerald_sanctuary_spikes.webp` exists and is non-empty.
- [ ] `src/domain/gameplay/hazardActor.ts` has no Phaser, DOM, Svelte, timer, random, or prototype imports.
- [ ] `src/domain/gameplay/playerLife.ts` owns hazard gating and keeps damage outcomes shared.
- [ ] `src/domain/gameplay/gameplayStageMaps.ts` uses `hazards: []` for 1-1, preserving the current route.
- [ ] `src/ui/gameplay/createGameplayRenderer.ts` owns only adapter-side mutation for hazard sprites and contact effects.
- [ ] No runtime code imports from or references `__prototype__`.
- [ ] All required verification commands pass or any failure is documented with exact output and cause.
