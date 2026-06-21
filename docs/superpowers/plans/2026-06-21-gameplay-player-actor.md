# Gameplay Player Actor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the player actor in gameplay and support prototype-style left/right acceleration and drag.

**Architecture:** Keep gameplay rules in `src/domain/gameplay/playerActor.ts` as pure data and functions. Keep Phaser input polling, sprite creation, animation playback, collision, and camera follow inside `src/ui/gameplay/createGameplayRenderer.ts`.

**Tech Stack:** TypeScript, Vitest, Svelte, Phaser 3, Vite.

---

## File Structure

- Create `src/domain/gameplay/playerActor.ts`: player actor constants, asset refs, animation metadata, spawn placement, and horizontal movement decisions.
- Create `src/domain/gameplay/playerActor.test.ts`: tests for player actor data and movement decisions.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`: add typed player actor spawn data to `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMaps.ts`: add stage `1-1` player spawn.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`: verify player spawn and root-level player asset refs.
- Copy assets:
  - `__prototype__/public/assets/sprites/player_idle/sheet-transparent.webp` to `public/assets/sprites/player_idle/sheet-transparent.webp`
  - `__prototype__/public/assets/sprites/player_run/sheet-transparent.webp` to `public/assets/sprites/player_run/sheet-transparent.webp`
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: preload player spritesheets, create animations, create/collide player, poll keyboard input, apply movement decisions, and follow player with camera.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: verify gravity configuration and exported scene count.

---

### Task 1: Domain Player Actor

**Files:**
- Create: `src/domain/gameplay/playerActor.test.ts`
- Create: `src/domain/gameplay/playerActor.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/gameplay/playerActor.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  getPlayerCenterY,
  getPlayerHorizontalMovementDecision,
  playerActorDefinition,
} from './playerActor'

describe('playerActorDefinition', () => {
  it('preserves prototype rendering and physics values', () => {
    expect(playerActorDefinition).toMatchObject({
      id: 'player',
      sprites: {
        idle: {
          key: 'player-idle',
          assetRef: '/assets/sprites/player_idle/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 5,
          repeat: -1,
        },
        run: {
          key: 'player-run',
          assetRef: '/assets/sprites/player_run/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 9,
          repeat: -1,
        },
      },
      origin: { x: 0.5, y: 0.5 },
      body: { width: 34, height: 72, offsetX: 47, offsetY: 42 },
      centerAboveSurface: 76,
      scale: 0.78,
      maxVelocity: { x: 500, y: 900 },
      gravityY: 1500,
      movement: {
        groundAcceleration: 950,
        idleDragX: 1500,
      },
    })
  })
})

describe('getPlayerCenterY', () => {
  it('places the player center above the platform surface', () => {
    expect(getPlayerCenterY({ surfaceY: 512 })).toBe(436)
  })
})

describe('getPlayerHorizontalMovementDecision', () => {
  it('accelerates left with idle drag', () => {
    expect(getPlayerHorizontalMovementDecision({ left: true, right: false })).toEqual({
      direction: 'left',
      accelerationX: -950,
      dragX: 1500,
    })
  })

  it('accelerates right with idle drag', () => {
    expect(getPlayerHorizontalMovementDecision({ left: false, right: true })).toEqual({
      direction: 'right',
      accelerationX: 950,
      dragX: 1500,
    })
  })

  it('idles with drag when no horizontal input is active', () => {
    expect(getPlayerHorizontalMovementDecision({ left: false, right: false })).toEqual({
      direction: 'none',
      accelerationX: 0,
      dragX: 1500,
    })
  })

  it('keeps prototype left priority when both directions are held', () => {
    expect(getPlayerHorizontalMovementDecision({ left: true, right: true })).toEqual({
      direction: 'left',
      accelerationX: -950,
      dragX: 1500,
    })
  })
})
```

- [ ] **Step 2: Run the domain test to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts
```

Expected: FAIL because `src/domain/gameplay/playerActor.ts` does not exist.

- [ ] **Step 3: Implement the minimal domain module**

Create `src/domain/gameplay/playerActor.ts`:

```ts
export type PlayerActorId = 'player'
export type PlayerAnimationKey = 'idle' | 'run'
export type PlayerMovementDirection = 'left' | 'right' | 'none'

export type PlayerAnimationDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
  frameStart: number
  frameEnd: number
  frameRate: number
  repeat: number
}

export type PlayerActorDefinition = {
  id: PlayerActorId
  sprites: Record<PlayerAnimationKey, PlayerAnimationDefinition>
  origin: { x: number; y: number }
  body: { width: number; height: number; offsetX: number; offsetY: number }
  centerAboveSurface: number
  scale: number
  maxVelocity: { x: number; y: number }
  gravityY: number
  movement: {
    groundAcceleration: number
    idleDragX: number
  }
}

export type PlayerMovementInput = {
  left: boolean
  right: boolean
}

export type PlayerHorizontalMovementDecision = {
  direction: PlayerMovementDirection
  accelerationX: number
  dragX: number
}

export const playerActorDefinition: PlayerActorDefinition = {
  id: 'player',
  sprites: {
    idle: {
      key: 'player-idle',
      assetRef: '/assets/sprites/player_idle/sheet-transparent.webp',
      frameWidth: 128,
      frameHeight: 128,
      frameStart: 0,
      frameEnd: 3,
      frameRate: 5,
      repeat: -1,
    },
    run: {
      key: 'player-run',
      assetRef: '/assets/sprites/player_run/sheet-transparent.webp',
      frameWidth: 128,
      frameHeight: 128,
      frameStart: 0,
      frameEnd: 3,
      frameRate: 9,
      repeat: -1,
    },
  },
  origin: { x: 0.5, y: 0.5 },
  body: { width: 34, height: 72, offsetX: 47, offsetY: 42 },
  centerAboveSurface: 76,
  scale: 0.78,
  maxVelocity: { x: 500, y: 900 },
  gravityY: 1500,
  movement: {
    groundAcceleration: 950,
    idleDragX: 1500,
  },
}

export function getPlayerCenterY(input: { surfaceY: number }): number {
  return input.surfaceY - playerActorDefinition.centerAboveSurface
}

export function getPlayerHorizontalMovementDecision(
  input: PlayerMovementInput,
): PlayerHorizontalMovementDecision {
  if (input.left) {
    return {
      direction: 'left',
      accelerationX: -playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
    }
  }

  if (input.right) {
    return {
      direction: 'right',
      accelerationX: playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
    }
  }

  return {
    direction: 'none',
    accelerationX: 0,
    dragX: playerActorDefinition.movement.idleDragX,
  }
}
```

- [ ] **Step 4: Run the domain test to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/domain/gameplay/playerActor.ts src/domain/gameplay/playerActor.test.ts
git commit -m "feat: define gameplay player actor"
```

---

### Task 2: Stage Player Spawn Data

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`

- [ ] **Step 1: Write the failing stage tests**

In `src/domain/gameplay/gameplayStageMaps.test.ts`, add this import:

```ts
import { playerActorDefinition } from './playerActor'
```

Update the asset refs test so it includes player sprites:

```ts
const assetRefs = [
  ...stage.backgroundLayers.map((layer) => layer.assetRef),
  stage.terrain.tilesetAssetRef,
  playerActorDefinition.sprites.idle.assetRef,
  playerActorDefinition.sprites.run.assetRef,
]

expect(assetRefs).toEqual([
  '/assets/maps/white_palace_sky.webp',
  '/assets/maps/white_palace_far_bg.webp',
  '/assets/maps/white_palace_mid_bg_loop.webp',
  '/assets/tiles/white_palace_platform_tiles.webp',
  '/assets/sprites/player_idle/sheet-transparent.webp',
  '/assets/sprites/player_run/sheet-transparent.webp',
])
```

Add this test:

```ts
it('defines the player spawn on the first platform surface', () => {
  const stage = getGameplayStageMap('1-1')
  expect(stage).toBeDefined()
  if (!stage) return

  expect(stage.player).toEqual({
    actorId: 'player',
    spawn: {
      x: 256,
      surfaceY: 512,
    },
  })
})
```

- [ ] **Step 2: Run the stage tests to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `GameplayStageMap` does not yet have `player`.

- [ ] **Step 3: Add the player spawn type**

In `src/domain/gameplay/gameplayMapTypes.ts`, add:

```ts
export type GameplayPlayerSpawn = {
  actorId: 'player'
  spawn: {
    x: number
    surfaceY: number
  }
}
```

Then add this property to `GameplayStageMap`:

```ts
player: GameplayPlayerSpawn
```

- [ ] **Step 4: Add stage `1-1` player data**

In `src/domain/gameplay/gameplayStageMaps.ts`, add this sibling property after `backgroundLayers` and before `terrain`:

```ts
player: {
  actorId: 'player',
  spawn: {
    x: 256,
    surfaceY: 512,
  },
},
```

- [ ] **Step 5: Run the stage tests to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts
git commit -m "feat: add gameplay player spawn data"
```

---

### Task 3: Player Runtime Assets

**Files:**
- Create: `public/assets/sprites/player_idle/sheet-transparent.webp`
- Create: `public/assets/sprites/player_run/sheet-transparent.webp`

- [ ] **Step 1: Verify source assets exist**

Run:

```bash
test -f __prototype__/public/assets/sprites/player_idle/sheet-transparent.webp
test -f __prototype__/public/assets/sprites/player_run/sheet-transparent.webp
```

Expected: both commands exit 0.

- [ ] **Step 2: Copy the runtime assets**

Run:

```bash
mkdir -p public/assets/sprites/player_idle public/assets/sprites/player_run
cp __prototype__/public/assets/sprites/player_idle/sheet-transparent.webp public/assets/sprites/player_idle/sheet-transparent.webp
cp __prototype__/public/assets/sprites/player_run/sheet-transparent.webp public/assets/sprites/player_run/sheet-transparent.webp
```

- [ ] **Step 3: Verify copied assets exist and are byte-identical**

Run:

```bash
cmp __prototype__/public/assets/sprites/player_idle/sheet-transparent.webp public/assets/sprites/player_idle/sheet-transparent.webp
cmp __prototype__/public/assets/sprites/player_run/sheet-transparent.webp public/assets/sprites/player_run/sheet-transparent.webp
```

Expected: both commands exit 0 with no output.

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add public/assets/sprites/player_idle/sheet-transparent.webp public/assets/sprites/player_run/sheet-transparent.webp
git commit -m "feat: add gameplay player sprites"
```

---

### Task 4: Phaser Player Rendering And Movement

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write the failing renderer config test**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, add this assertion to the existing config test:

```ts
expect(config.physics).toEqual({
  default: 'arcade',
  arcade: {
    gravity: { x: 0, y: 1500 },
    debug: false,
  },
})
```

- [ ] **Step 2: Run the renderer test to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because gravity y is still `0`.

- [ ] **Step 3: Update Phaser imports and scene fields**

In `src/ui/gameplay/createGameplayRenderer.ts`, add this import:

```ts
import {
  getPlayerCenterY,
  getPlayerHorizontalMovementDecision,
  playerActorDefinition,
} from '../../domain/gameplay/playerActor'
```

Add these fields inside `GameplayMapScene`:

```ts
private terrainLayer: Phaser.Tilemaps.TilemapLayer | null = null
private player: Phaser.Physics.Arcade.Sprite | null = null
private playerKeys: {
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  a: Phaser.Input.Keyboard.Key
  d: Phaser.Input.Keyboard.Key
} | null = null
```

- [ ] **Step 4: Preload player spritesheets**

In `preload()`, after terrain preload, add:

```ts
for (const sprite of Object.values(playerActorDefinition.sprites)) {
  this.load.spritesheet(sprite.key, sprite.assetRef, {
    frameWidth: sprite.frameWidth,
    frameHeight: sprite.frameHeight,
  })
}
```

- [ ] **Step 5: Store terrain layer for collision**

Change `createTerrainLayer(columns, rows)` to return `Phaser.Tilemaps.TilemapLayer`, assign it in `create()`, and return `layer` after setting collision/depth:

```ts
this.terrainLayer = this.createTerrainLayer(columns, rows)
```

```ts
private createTerrainLayer(columns: number, rows: number): Phaser.Tilemaps.TilemapLayer {
  // existing tilemap creation stays the same
  layer.setCollision([...this.stageMap.terrain.solidTileIndexes])
  layer.setDepth(5)
  return layer
}
```

- [ ] **Step 6: Create animations, keyboard input, and player**

After terrain creation in `create()`, add:

```ts
this.createPlayerAnimations()
this.playerKeys = this.createPlayerKeys()
this.createPlayer()
```

Add these methods:

```ts
private createPlayerAnimations(): void {
  for (const sprite of Object.values(playerActorDefinition.sprites)) {
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

private createPlayerKeys(): NonNullable<GameplayMapScene['playerKeys']> {
  if (!this.input.keyboard) {
    throw new Error(`Unable to create player keyboard controls for stage ${this.stageMap.id}.`)
  }

  const keys = this.input.keyboard.addKeys({
    left: Phaser.Input.Keyboard.KeyCodes.LEFT,
    right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    a: Phaser.Input.Keyboard.KeyCodes.A,
    d: Phaser.Input.Keyboard.KeyCodes.D,
  }) as NonNullable<GameplayMapScene['playerKeys']>

  return keys
}

private createPlayer(): void {
  if (!this.terrainLayer) {
    throw new Error(`Unable to create player collider before terrain for stage ${this.stageMap.id}.`)
  }

  const player = this.physics.add.sprite(
    this.stageMap.player.spawn.x,
    getPlayerCenterY({ surfaceY: this.stageMap.player.spawn.surfaceY }),
    playerActorDefinition.sprites.idle.key,
  )

  player
    .setOrigin(playerActorDefinition.origin.x, playerActorDefinition.origin.y)
    .setScale(playerActorDefinition.scale)
    .setCollideWorldBounds(true)
    .setDragX(playerActorDefinition.movement.idleDragX)
    .setMaxVelocity(playerActorDefinition.maxVelocity.x, playerActorDefinition.maxVelocity.y)
    .setDepth(10)

  player.body.setSize(playerActorDefinition.body.width, playerActorDefinition.body.height)
  player.body.setOffset(playerActorDefinition.body.offsetX, playerActorDefinition.body.offsetY)
  player.play(playerActorDefinition.sprites.idle.key)

  this.physics.add.collider(player, this.terrainLayer)
  this.cameras.main.startFollow(player, true, 0.12, 0.12)
  this.player = player
}
```

- [ ] **Step 7: Apply horizontal movement in `update()`**

At the end of `update()`, add:

```ts
this.updatePlayerMovement()
```

Add this method:

```ts
private updatePlayerMovement(): void {
  if (!this.player || !this.playerKeys) return

  const decision = getPlayerHorizontalMovementDecision({
    left: this.playerKeys.left.isDown || this.playerKeys.a.isDown,
    right: this.playerKeys.right.isDown || this.playerKeys.d.isDown,
  })

  this.player.setDragX(decision.dragX)
  this.player.setAccelerationX(decision.accelerationX)

  if (decision.direction === 'left') {
    this.player.setFlipX(true)
    this.player.play(playerActorDefinition.sprites.run.key, true)
  } else if (decision.direction === 'right') {
    this.player.setFlipX(false)
    this.player.play(playerActorDefinition.sprites.run.key, true)
  } else {
    this.player.play(playerActorDefinition.sprites.idle.key, true)
  }
}
```

- [ ] **Step 8: Set arcade gravity from domain actor data**

In `createGameplayRendererConfig`, change arcade gravity to:

```ts
gravity: { x: 0, y: playerActorDefinition.gravityY },
```

- [ ] **Step 9: Run the renderer test to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 10: Run focused gameplay tests**

Run:

```bash
npm run test -- src/domain/gameplay src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit Task 4**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: render movable gameplay player"
```

---

### Task 5: Full Verification

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

Expected: PASS. Report any existing non-failing Vite chunk-size warning if it appears.

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

- Player actor object structure: Task 1.
- Idle/run spritesheet asset migration: Task 3.
- Stage `1-1` typed player spawn: Task 2.
- Player rendering in Phaser: Task 4.
- Left/right movement with acceleration, drag, max speed, and left priority: Tasks 1 and 4.
- Reactive boundary stays in Svelte lifecycle: Task 4 does not move per-frame gameplay state into Svelte.
- Required checks: Task 5.

Placeholder scan:

- No TBD/TODO/placeholder steps.
- Each code-changing step includes exact file paths, snippets, commands, and expected outcomes.

Type consistency:

- The plan consistently uses `playerActorDefinition`, `getPlayerCenterY`, `getPlayerHorizontalMovementDecision`, `GameplayStageMap.player`, and `player.spawn`.
