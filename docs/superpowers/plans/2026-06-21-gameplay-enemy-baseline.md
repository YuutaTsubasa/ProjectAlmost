# Gameplay Enemy Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first gameplay enemy slice: Armor Guard and Azure Core spawn, render, and perform their baseline prototype movement in rebuilt gameplay.

**Architecture:** Enemy definitions and movement decisions live in a pure domain module. Stage map data declares enemy spawn points. The Phaser renderer adapts that data into sprites, generated Azure Core texture, guard animation, terrain collision, floating tween, and patrol velocity.

**Tech Stack:** TypeScript, Vitest, Phaser 3, Svelte, Vite.

---

## File Structure

- Create `src/domain/gameplay/enemyActor.ts`
  - Owns enemy actor metadata and pure placement/patrol decisions.
- Create `src/domain/gameplay/enemyActor.test.ts`
  - Covers prototype values and pure decisions.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`
  - Adds `GameplayEnemySpawn` and `enemies` to `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMaps.ts`
  - Adds Armor Guard and Azure Core spawns to rebuilt `1-1`.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Covers stage enemy data, root asset refs, and guard platform bounds.
- Copy assets:
  - From `__prototype__/public/assets/sprites/enemy_guard_walk/sheet-transparent.webp`
  - To `public/assets/sprites/enemy_guard_walk/sheet-transparent.webp`
  - From `__prototype__/public/assets/sprites/enemy_guard_death/sheet-transparent.webp`
  - To `public/assets/sprites/enemy_guard_death/sheet-transparent.webp`
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Preloads enemy spritesheets, creates Azure Core generated texture, registers guard animations, creates enemy sprites, and updates guard patrol.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Extends the fake Phaser runtime and covers enemy preload/create/update behavior.

---

### Task 1: Pure Enemy Actor Domain

**Files:**
- Create: `src/domain/gameplay/enemyActor.ts`
- Create: `src/domain/gameplay/enemyActor.test.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/gameplay/enemyActor.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  enemyActorDefinitions,
  getEnemySpawnY,
  getNextEnemyPatrolDirection,
  shouldUpdateEnemyPatrol,
} from './enemyActor'

describe('enemyActorDefinitions', () => {
  it('defines the Armor Guard from prototype values', () => {
    expect(enemyActorDefinitions['armor-guard']).toEqual({
      type: 'armor-guard',
      placement: 'grounded',
      behavior: 'patrol',
      origin: { x: 0.5, y: 0.5 },
      body: { width: 46, height: 54, offsetX: 41, offsetY: 54 },
      centerAboveSurface: 70,
      gravity: true,
      depth: 9,
      scale: 0.82,
      sprites: {
        walk: {
          key: 'enemy-guard-walk',
          assetRef: '/assets/sprites/enemy_guard_walk/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 7,
          repeat: -1,
        },
        death: {
          key: 'enemy-guard-death',
          assetRef: '/assets/sprites/enemy_guard_death/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 8,
          repeat: 0,
        },
      },
      patrol: {
        initialDirection: -1,
        speed: 80,
      },
    })
  })

  it('defines the Azure Core from prototype values', () => {
    expect(enemyActorDefinitions['azure-core']).toEqual({
      type: 'azure-core',
      placement: 'airborne',
      behavior: 'homing-target',
      origin: { x: 0.5, y: 0.5 },
      body: { width: 58, height: 58, offsetX: 9, offsetY: 9 },
      gravity: false,
      depth: 9,
      scale: 1,
      generatedTexture: {
        key: 'azure-core',
        width: 76,
        height: 76,
      },
      floating: {
        yOffset: -14,
        angle: 10,
        durationMs: 950,
        ease: 'Sine.easeInOut',
      },
    })
  })
})

describe('getEnemySpawnY', () => {
  it('places Armor Guards above the authored platform surface', () => {
    expect(getEnemySpawnY({
      type: 'armor-guard',
      surfaceY: 512,
    })).toBe(442)
  })

  it('uses the authored y position for Azure Cores', () => {
    expect(getEnemySpawnY({
      type: 'azure-core',
      y: 360,
    })).toBe(360)
  })
})

describe('getNextEnemyPatrolDirection', () => {
  it('turns right below the patrol minimum', () => {
    expect(getNextEnemyPatrolDirection({
      x: 199,
      patrolMinX: 200,
      patrolMaxX: 400,
      currentDirection: -1,
    })).toBe(1)
  })

  it('turns left above the patrol maximum', () => {
    expect(getNextEnemyPatrolDirection({
      x: 401,
      patrolMinX: 200,
      patrolMaxX: 400,
      currentDirection: 1,
    })).toBe(-1)
  })

  it('keeps the current direction inside patrol bounds', () => {
    expect(getNextEnemyPatrolDirection({
      x: 300,
      patrolMinX: 200,
      patrolMaxX: 400,
      currentDirection: -1,
    })).toBe(-1)
    expect(getNextEnemyPatrolDirection({
      x: 300,
      patrolMinX: 200,
      patrolMaxX: 400,
      currentDirection: 1,
    })).toBe(1)
  })
})

describe('shouldUpdateEnemyPatrol', () => {
  it('updates Armor Guard patrol and skips Azure Core patrol', () => {
    expect(shouldUpdateEnemyPatrol('armor-guard')).toBe(true)
    expect(shouldUpdateEnemyPatrol('azure-core')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
```

Expected: FAIL because `./enemyActor` does not exist.

- [ ] **Step 3: Implement the pure domain module**

Create `src/domain/gameplay/enemyActor.ts`:

```ts
export type EnemyActorType = 'armor-guard' | 'azure-core'
export type EnemyPlacement = 'grounded' | 'airborne'
export type EnemyBehavior = 'patrol' | 'homing-target'
export type EnemyPatrolDirection = -1 | 1

export type EnemySpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
  frameStart: number
  frameEnd: number
  frameRate: number
  repeat: number
}

export type EnemyActorDefinition = {
  type: EnemyActorType
  placement: EnemyPlacement
  behavior: EnemyBehavior
  origin: { x: number; y: number }
  body: { width: number; height: number; offsetX: number; offsetY: number }
  gravity: boolean
  depth: number
  scale: number
  centerAboveSurface?: number
  sprites?: {
    walk?: EnemySpriteDefinition
    death?: EnemySpriteDefinition
  }
  generatedTexture?: {
    key: string
    width: number
    height: number
  }
  patrol?: {
    initialDirection: EnemyPatrolDirection
    speed: number
  }
  floating?: {
    yOffset: number
    angle: number
    durationMs: number
    ease: string
  }
}

export type ArmorGuardSpawnInput = {
  type: 'armor-guard'
  surfaceY: number
}

export type AzureCoreSpawnInput = {
  type: 'azure-core'
  y: number
}

export type EnemySpawnYInput = ArmorGuardSpawnInput | AzureCoreSpawnInput

export const enemyActorDefinitions = {
  'armor-guard': {
    type: 'armor-guard',
    placement: 'grounded',
    behavior: 'patrol',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 46, height: 54, offsetX: 41, offsetY: 54 },
    centerAboveSurface: 70,
    gravity: true,
    depth: 9,
    scale: 0.82,
    sprites: {
      walk: {
        key: 'enemy-guard-walk',
        assetRef: '/assets/sprites/enemy_guard_walk/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 7,
        repeat: -1,
      },
      death: {
        key: 'enemy-guard-death',
        assetRef: '/assets/sprites/enemy_guard_death/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 8,
        repeat: 0,
      },
    },
    patrol: {
      initialDirection: -1,
      speed: 80,
    },
  },
  'azure-core': {
    type: 'azure-core',
    placement: 'airborne',
    behavior: 'homing-target',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 58, height: 58, offsetX: 9, offsetY: 9 },
    gravity: false,
    depth: 9,
    scale: 1,
    generatedTexture: {
      key: 'azure-core',
      width: 76,
      height: 76,
    },
    floating: {
      yOffset: -14,
      angle: 10,
      durationMs: 950,
      ease: 'Sine.easeInOut',
    },
  },
} as const satisfies Record<EnemyActorType, EnemyActorDefinition>

export function getEnemySpawnY(input: EnemySpawnYInput): number {
  if (input.type === 'azure-core') {
    return input.y
  }

  return input.surfaceY - enemyActorDefinitions['armor-guard'].centerAboveSurface
}

export function getNextEnemyPatrolDirection(input: {
  x: number
  patrolMinX: number
  patrolMaxX: number
  currentDirection: EnemyPatrolDirection
}): EnemyPatrolDirection {
  if (input.x < input.patrolMinX) return 1
  if (input.x > input.patrolMaxX) return -1
  return input.currentDirection
}

export function shouldUpdateEnemyPatrol(type: EnemyActorType): boolean {
  return type === 'armor-guard'
}
```

- [ ] **Step 4: Run the focused test to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run domain gameplay tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/domain/gameplay/enemyActor.ts src/domain/gameplay/enemyActor.test.ts
git commit -m "feat: add gameplay enemy actor definitions"
```

---

### Task 2: Stage Enemy Spawns And Guard Assets

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Copy: `public/assets/sprites/enemy_guard_walk/sheet-transparent.webp`
- Copy: `public/assets/sprites/enemy_guard_death/sheet-transparent.webp`

- [ ] **Step 1: Write failing stage map tests**

Modify `src/domain/gameplay/gameplayStageMaps.test.ts`.

Update imports:

```ts
import { enemyActorDefinitions } from './enemyActor'
```

Update the asset reference test so it includes enemy sprite assets:

```ts
  it('references only root public asset paths', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const enemyAssetRefs = Object.values(enemyActorDefinitions)
      .flatMap((definition) => Object.values(definition.sprites ?? {}))
      .map((sprite) => sprite.assetRef)

    const assetRefs = [
      ...stage.backgroundLayers.map((layer) => layer.assetRef),
      stage.terrain.tilesetAssetRef,
      playerActorDefinition.sprites.idle.assetRef,
      playerActorDefinition.sprites.run.assetRef,
      playerActorDefinition.sprites.jump.assetRef,
      ...enemyAssetRefs,
    ]

    expect(assetRefs).toEqual([
      '/assets/maps/white_palace_sky.webp',
      '/assets/maps/white_palace_far_bg.webp',
      '/assets/maps/white_palace_mid_bg_loop.webp',
      '/assets/tiles/white_palace_platform_tiles.webp',
      '/assets/sprites/player_idle/sheet-transparent.webp',
      '/assets/sprites/player_run/sheet-transparent.webp',
      '/assets/sprites/player_jump/sheet-transparent.webp',
      '/assets/sprites/enemy_guard_walk/sheet-transparent.webp',
      '/assets/sprites/enemy_guard_death/sheet-transparent.webp',
    ])
    expect(assetRefs.every((assetRef) => assetRef.startsWith('/assets/'))).toBe(true)
    expect(assetRefs.every((assetRef) => !assetRef.includes('__prototype__'))).toBe(true)
  })
```

Add tests for enemy stage data:

```ts
  it('defines both baseline enemy types for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.enemies).toEqual([
      {
        id: 'first-armor-guard',
        type: 'armor-guard',
        x: 720,
        surfaceY: 512,
        patrolMinX: 608,
        patrolMaxX: 832,
      },
      {
        id: 'first-azure-core',
        type: 'azure-core',
        x: 1760,
        y: 320,
        patrolMinX: 1760,
        patrolMaxX: 1760,
      },
    ])
  })

  it('keeps gameplay enemy ids unique within the first stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const ids = stage.enemies.map((enemy) => enemy.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places Armor Guard patrol bounds on the authored platform surface', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const guard = stage.enemies.find((enemy) => enemy.type === 'armor-guard')
    expect(guard).toBeDefined()
    if (!guard || guard.type !== 'armor-guard') return

    const platform = stage.terrain.platforms.find((candidate) => (
      candidate.row * stage.world.tileSize === guard.surfaceY
      && guard.patrolMinX >= candidate.col * stage.world.tileSize
      && guard.patrolMaxX <= (candidate.col + candidate.width) * stage.world.tileSize
    ))

    expect(platform).toBeDefined()
  })
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `stage.enemies` does not exist or does not include the expected enemies.

- [ ] **Step 3: Extend gameplay map types**

Modify `src/domain/gameplay/gameplayMapTypes.ts`.

Add to `GameplayStageMap`:

```ts
  enemies: readonly GameplayEnemySpawn[]
```

Add these types after `GameplayPlayerSpawn`:

```ts
export type GameplayEnemySpawn = ArmorGuardSpawn | AzureCoreSpawn

export type ArmorGuardSpawn = {
  id: string
  type: 'armor-guard'
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type AzureCoreSpawn = {
  id: string
  type: 'azure-core'
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}
```

- [ ] **Step 4: Add enemies to rebuilt 1-1**

Modify `src/domain/gameplay/gameplayStageMaps.ts`.

Insert this property after `player` and before `terrain`:

```ts
  enemies: [
    {
      id: 'first-armor-guard',
      type: 'armor-guard',
      x: 720,
      surfaceY: 512,
      patrolMinX: 608,
      patrolMaxX: 832,
    },
    {
      id: 'first-azure-core',
      type: 'azure-core',
      x: 1760,
      y: 320,
      patrolMinX: 1760,
      patrolMaxX: 1760,
    },
  ],
```

These positions are intentionally inside the current rebuilt `1-1` terrain:

- `first-armor-guard` patrols on the first platform `{ col: 2, row: 8, width: 12, height: 1 }`, whose top surface is `512` and x span is `128..896`.
- `first-azure-core` floats near the early route after the second platform.

- [ ] **Step 5: Copy prototype guard assets into root public**

Run:

```bash
mkdir -p public/assets/sprites/enemy_guard_walk public/assets/sprites/enemy_guard_death
cp __prototype__/public/assets/sprites/enemy_guard_walk/sheet-transparent.webp public/assets/sprites/enemy_guard_walk/sheet-transparent.webp
cp __prototype__/public/assets/sprites/enemy_guard_death/sheet-transparent.webp public/assets/sprites/enemy_guard_death/sheet-transparent.webp
```

Expected: both files exist under `public/assets/sprites`.

- [ ] **Step 6: Run the focused test to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run domain gameplay tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts public/assets/sprites/enemy_guard_walk/sheet-transparent.webp public/assets/sprites/enemy_guard_death/sheet-transparent.webp
git commit -m "feat: add gameplay enemy spawns and assets"
```

---

### Task 3: Phaser Enemy Rendering And Baseline Movement

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer tests**

Modify `src/ui/gameplay/createGameplayRenderer.test.ts`.

Add imports:

```ts
import { enemyActorDefinitions } from '../../domain/gameplay/enemyActor'
```

Extend `createFakePlayerSprite` into a general sprite helper. Rename it to `createFakeArcadeSprite` and add fields/methods needed by enemies:

```ts
function createFakeArcadeSprite(input: { x: number; y: number; texture: string }) {
  const sprite = {
    ...input,
    origin: { x: 0, y: 0 },
    scale: 1,
    collideWorldBounds: false,
    dragX: 0,
    velocityX: 0,
    velocityY: 0,
    maxVelocity: { x: 0, y: 0 },
    depth: 0,
    accelerationX: 0,
    flipX: false,
    immovable: false,
    playCalls: [] as Array<{ key: string; ignoreIfPlaying?: boolean }>,
    body: {
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
    setOrigin: (x: number, y: number) => {
      sprite.origin = { x, y }
      return sprite
    },
    setScale: (value: number) => {
      sprite.scale = value
      return sprite
    },
    setCollideWorldBounds: (value: boolean) => {
      sprite.collideWorldBounds = value
      return sprite
    },
    setDragX: (value: number) => {
      sprite.dragX = value
      return sprite
    },
    setVelocityX: (value: number) => {
      sprite.velocityX = value
      return sprite
    },
    setVelocityY: (value: number) => {
      sprite.velocityY = value
      return sprite
    },
    setMaxVelocity: (x: number, y: number) => {
      sprite.maxVelocity = { x, y }
      return sprite
    },
    setDepth: (value: number) => {
      sprite.depth = value
      return sprite
    },
    setAccelerationX: (value: number) => {
      sprite.accelerationX = value
      return sprite
    },
    setFlipX: (value: boolean) => {
      sprite.flipX = value
      return sprite
    },
    setImmovable: (value: boolean) => {
      sprite.immovable = value
      return sprite
    },
    play: (key: string, ignoreIfPlaying?: boolean) => {
      sprite.playCalls.push({ key, ignoreIfPlaying })
      return sprite
    },
  }

  return sprite
}
```

Update test types and runtime internals to use `createFakeArcadeSprite`.

Add fake graphics and tween tracking:

```ts
type GenerateTextureCall = {
  key: string
  width: number
  height: number
}

type TweenCall = {
  targets: unknown
  y: number
  angle: number
  duration: number
  ease: string
  yoyo: boolean
  repeat: number
}
```

Inside `createSceneRuntime`, add arrays:

```ts
  const generateTextureCalls: GenerateTextureCall[] = []
  const tweenCalls: TweenCall[] = []
  const sprites: Array<ReturnType<typeof createFakeArcadeSprite>> = []
```

Replace `physics.add.sprite` with:

```ts
      sprite: (x, y, texture) => {
        const sprite = createFakeArcadeSprite({ x, y, texture })
        sprites.push(sprite)
        if (texture === playerActorDefinition.sprites.idle.key) {
          playerSprite = sprite
        }
        return sprite
      },
```

Add `scene.make.graphics`:

```ts
      graphics: () => ({
        fillStyle: () => {},
        fillCircle: () => {},
        lineStyle: () => {},
        strokeCircle: () => {},
        lineBetween: () => {},
        generateTexture: (key: string, width: number, height: number) => {
          generateTextureCalls.push({ key, width, height })
        },
        destroy: () => {},
      }),
```

Add `scene.tweens` to the scene test type and runtime:

```ts
    tweens: {
      add: (config: TweenCall) => void
    }
```

```ts
  scene.tweens = {
    add: (config) => {
      tweenCalls.push(config)
    },
  }
```

Return:

```ts
    sprites,
    generateTextureCalls,
    tweenCalls,
    get enemySprites() {
      return sprites.filter((sprite) => sprite !== playerSprite)
    },
```

Add renderer tests:

```ts
  it('preloads Armor Guard spritesheets from the domain enemy definitions', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    const guardSprites = Object.values(enemyActorDefinitions['armor-guard'].sprites ?? {})
    for (const sprite of guardSprites) {
      expect(runtime.spritesheetCalls).toContainEqual({
        key: sprite.key,
        assetRef: sprite.assetRef,
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight,
      })
    }
  })

  it('registers Armor Guard animations from the domain enemy definitions', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const guardSprites = Object.values(enemyActorDefinitions['armor-guard'].sprites ?? {})
    for (const sprite of guardSprites) {
      expect(runtime.animationCreateCalls).toContainEqual({
        key: sprite.key,
        frames: Array.from({ length: sprite.frameEnd - sprite.frameStart + 1 }, (_, index) => ({
          key: sprite.key,
          frame: sprite.frameStart + index,
        })),
        frameRate: sprite.frameRate,
        repeat: sprite.repeat,
      })
    }
  })

  it('generates the Azure Core texture from the domain enemy definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.generateTextureCalls).toContainEqual({
      key: enemyActorDefinitions['azure-core'].generatedTexture?.key,
      width: enemyActorDefinitions['azure-core'].generatedTexture?.width,
      height: enemyActorDefinitions['azure-core'].generatedTexture?.height,
    })
  })

  it('creates Armor Guard with grounded spawn, body setup, animation, velocity, and terrain collider', () => {
    const runtime = createSceneRuntime()
    const guardDefinition = enemyActorDefinitions['armor-guard']

    runtime.scene.create()

    const guard = runtime.enemySprites.find((sprite) => sprite.texture === guardDefinition.sprites?.walk?.key)
    expect(guard).toBeDefined()
    if (!guard) return

    expect(guard.x).toBe(720)
    expect(guard.y).toBe(442)
    expect(guard.origin).toEqual(guardDefinition.origin)
    expect(guard.scale).toBe(guardDefinition.scale)
    expect(guard.depth).toBe(guardDefinition.depth)
    expect(guard.collideWorldBounds).toBe(true)
    expect(guard.body.size).toEqual({
      width: guardDefinition.body.width,
      height: guardDefinition.body.height,
    })
    expect(guard.body.offset).toEqual({
      x: guardDefinition.body.offsetX,
      y: guardDefinition.body.offsetY,
    })
    expect(guard.velocityX).toBe(-80)
    expect(guard.playCalls).toContainEqual({
      key: guardDefinition.sprites?.walk?.key,
      ignoreIfPlaying: undefined,
    })
    expect(runtime.colliderCalls).toContainEqual({ a: guard, b: runtime.terrainLayer })
  })

  it('creates Azure Core with authored position, no gravity, immovable body, no terrain collider, and floating tween', () => {
    const runtime = createSceneRuntime()
    const coreDefinition = enemyActorDefinitions['azure-core']

    runtime.scene.create()

    const core = runtime.enemySprites.find((sprite) => sprite.texture === coreDefinition.generatedTexture?.key)
    expect(core).toBeDefined()
    if (!core) return

    expect(core.x).toBe(1760)
    expect(core.y).toBe(320)
    expect(core.origin).toEqual(coreDefinition.origin)
    expect(core.scale).toBe(coreDefinition.scale)
    expect(core.depth).toBe(coreDefinition.depth)
    expect(core.collideWorldBounds).toBe(true)
    expect(core.body.allowGravity).toBe(false)
    expect(core.immovable).toBe(true)
    expect(core.body.size).toEqual({
      width: coreDefinition.body.width,
      height: coreDefinition.body.height,
    })
    expect(core.body.offset).toEqual({
      x: coreDefinition.body.offsetX,
      y: coreDefinition.body.offsetY,
    })
    expect(runtime.colliderCalls).not.toContainEqual({ a: core, b: runtime.terrainLayer })
    expect(runtime.tweenCalls).toContainEqual({
      targets: core,
      y: 306,
      angle: 10,
      duration: 950,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  })

  it('updates Armor Guard patrol direction, velocity, and flip', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    const guard = runtime.enemySprites.find((sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key)
    expect(guard).toBeDefined()
    if (!guard) return

    guard.x = 607
    runtime.scene.update()
    expect(guard.velocityX).toBe(80)
    expect(guard.flipX).toBe(true)

    guard.x = 833
    runtime.scene.update()
    expect(guard.velocityX).toBe(-80)
    expect(guard.flipX).toBe(false)
  })

  it('does not apply patrol velocity updates to Azure Core', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    const core = runtime.enemySprites.find((sprite) => sprite.texture === enemyActorDefinitions['azure-core'].generatedTexture?.key)
    expect(core).toBeDefined()
    if (!core) return

    core.velocityX = 12
    runtime.scene.update()

    expect(core.velocityX).toBe(12)
  })
```

- [ ] **Step 2: Run renderer test to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because renderer does not preload/register/create/update enemies yet.

- [ ] **Step 3: Add renderer imports and runtime type**

Modify `src/ui/gameplay/createGameplayRenderer.ts`.

Add imports:

```ts
import {
  enemyActorDefinitions,
  getEnemySpawnY,
  getNextEnemyPatrolDirection,
  shouldUpdateEnemyPatrol,
  type EnemyPatrolDirection,
} from '../../domain/gameplay/enemyActor'
import type { GameplayEnemySpawn } from '../../domain/gameplay/gameplayMapTypes'
```

Add runtime type after `BackgroundRuntimeLayer`:

```ts
type EnemyRuntime = {
  sprite: Phaser.Physics.Arcade.Sprite
  spawn: GameplayEnemySpawn
  direction: EnemyPatrolDirection
}
```

Add scene field:

```ts
  private enemies: EnemyRuntime[] = []
```

- [ ] **Step 4: Preload enemy spritesheets**

In `preload()`, after player spritesheets:

```ts
    for (const definition of Object.values(enemyActorDefinitions)) {
      for (const sprite of Object.values(definition.sprites ?? {})) {
        this.load.spritesheet(sprite.key, sprite.assetRef, {
          frameWidth: sprite.frameWidth,
          frameHeight: sprite.frameHeight,
        })
      }
    }
```

- [ ] **Step 5: Create enemy texture and animations**

In `create()`, after `this.createPlayerAnimations()`:

```ts
    this.createEnemyTextures()
    this.createEnemyAnimations()
```

Add private methods:

```ts
  private createEnemyTextures(): void {
    this.createAzureCoreTexture()
  }

  private createEnemyAnimations(): void {
    const guardSprites = enemyActorDefinitions['armor-guard'].sprites
    if (!guardSprites) return

    for (const sprite of Object.values(guardSprites)) {
      this.anims.create({
        key: sprite.key,
        frames: this.anims.generateFrameNumbers(sprite.key, {
          start: sprite.frameStart,
          end: sprite.frameEnd,
        }),
        frameRate: sprite.frameRate,
        repeat: sprite.repeat,
      })
    }
  }

  private createAzureCoreTexture(): void {
    const texture = enemyActorDefinitions['azure-core'].generatedTexture
    if (!texture) return

    const graphics = this.make.graphics()
    graphics.fillStyle(0xffffff, 0.88)
    graphics.fillCircle(38, 38, 28)
    graphics.lineStyle(6, 0xb7dfff, 0.95)
    graphics.strokeCircle(38, 38, 29)
    graphics.lineStyle(3, 0x4f7dff, 0.9)
    graphics.strokeCircle(38, 38, 20)
    graphics.fillStyle(0x4be8ff, 0.95)
    graphics.fillCircle(38, 38, 13)
    graphics.fillStyle(0xffffff, 0.9)
    graphics.fillCircle(34, 34, 5)
    graphics.lineStyle(4, 0x4be8ff, 0.7)
    graphics.lineBetween(4, 38, 16, 38)
    graphics.lineBetween(60, 38, 72, 38)
    graphics.generateTexture(texture.key, texture.width, texture.height)
    graphics.destroy()
  }
```

- [ ] **Step 6: Create enemies and wire terrain colliders**

In `create()`, after terrain and before `this.playerKeys = this.createPlayerKeys()`:

```ts
    this.createEnemies()
```

Add private methods:

```ts
  private createEnemies(): void {
    if (!this.terrainLayer) {
      throw new Error(`Unable to create enemy colliders before terrain for stage ${this.stageMap.id}.`)
    }

    this.enemies = this.stageMap.enemies.map((spawn) => {
      const definition = enemyActorDefinitions[spawn.type]
      const textureKey = definition.generatedTexture?.key
        ?? definition.sprites?.walk?.key

      if (!textureKey) {
        throw new Error(`Enemy ${spawn.id} has no renderable texture.`)
      }

      const sprite = this.physics.add.sprite(
        spawn.x,
        getEnemySpawnY(spawn),
        textureKey,
      )

      sprite
        .setOrigin(definition.origin.x, definition.origin.y)
        .setScale(definition.scale)
        .setCollideWorldBounds(true)
        .setDepth(definition.depth)

      sprite.body.setSize(definition.body.width, definition.body.height)
      sprite.body.setOffset(definition.body.offsetX, definition.body.offsetY)

      const direction = definition.patrol?.initialDirection ?? -1

      if (spawn.type === 'armor-guard') {
        const walk = definition.sprites?.walk
        if (walk) {
          sprite.play(walk.key)
        }
        sprite.setVelocityX(direction * (definition.patrol?.speed ?? 0))
        this.physics.add.collider(sprite, this.terrainLayer)
      } else {
        sprite.body.allowGravity = false
        sprite.setImmovable(true)
        this.createAzureCoreFloat(sprite, spawn.y)
      }

      return {
        sprite,
        spawn,
        direction,
      }
    })
  }

  private createAzureCoreFloat(sprite: Phaser.Physics.Arcade.Sprite, spawnY: number): void {
    const floating = enemyActorDefinitions['azure-core'].floating
    if (!floating) return

    this.tweens.add({
      targets: sprite,
      y: spawnY + floating.yOffset,
      angle: floating.angle,
      duration: floating.durationMs,
      ease: floating.ease,
      yoyo: true,
      repeat: -1,
    })
  }
```

- [ ] **Step 7: Update enemy patrol every frame**

In `update()`, after parallax and before `this.updatePlayerMovement()`:

```ts
    this.updateEnemyPatrol()
```

Add method:

```ts
  private updateEnemyPatrol(): void {
    for (const enemy of this.enemies) {
      if (!shouldUpdateEnemyPatrol(enemy.spawn.type)) {
        continue
      }

      const definition = enemyActorDefinitions[enemy.spawn.type]
      const speed = definition.patrol?.speed ?? 0
      enemy.direction = getNextEnemyPatrolDirection({
        x: enemy.sprite.x,
        patrolMinX: enemy.spawn.patrolMinX,
        patrolMaxX: enemy.spawn.patrolMaxX,
        currentDirection: enemy.direction,
      })

      enemy.sprite.setVelocityX(enemy.direction * speed)
      enemy.sprite.setFlipX(enemy.direction > 0)
    }
  }
```

- [ ] **Step 8: Run focused renderer tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run focused gameplay tests**

Run:

```bash
npm run test -- src/domain/gameplay src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 10: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 11: Commit**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: render gameplay baseline enemies"
```

---

### Task 4: Full Verification

**Files:**
- No code files.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. The existing Vite large chunk warning may still appear and is not introduced by this slice.

- [ ] **Step 4: Run whitespace/path sanity**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Inspect status**

Run:

```bash
git status --short --branch
```

Expected: clean worktree, branch ahead only by intentional commits.

---

## Self-Review Checklist

- Spec coverage:
  - Domain definitions and pure patrol/placement decisions: Task 1.
  - Stage enemy spawns and root public guard assets: Task 2.
  - Renderer preload, animation, generated Azure Core texture, enemy creation, guard terrain collider, Azure Core floating tween, patrol update: Task 3.
  - Full verification: Task 4.
- Scope check:
  - No player hurt, enemy defeat, Azure Core regeneration, score, HUD, homing attack, sound, or localization behavior is included.
- Type consistency:
  - `EnemyActorType` is `'armor-guard' | 'azure-core'`.
  - Stage spawn `type` values match `enemyActorDefinitions`.
  - Renderer imports `GameplayEnemySpawn` from `gameplayMapTypes` and pure decisions from `enemyActor`.
- Asset boundary:
  - Runtime asset refs are `/assets/...`.
  - `__prototype__/` is used only as copy source for Task 2.
