# Gameplay Collectibles / Coins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gameplay-only collectible coins: stage-authored coin placement, player proximity pickup, and Homing-line pickup.

**Architecture:** Keep coin pickup decisions in a pure `src/domain/gameplay/playerCoinPickup.ts` module. Stage maps own rebuild coin coordinates. `src/ui/gameplay/createGameplayRenderer.ts` remains the Phaser adapter: it generates the coin texture, creates sprites from stage data, tracks runtime collected state, and delegates pickup decisions to domain helpers.

**Tech Stack:** TypeScript, Vitest, Phaser 3, Svelte check, Vite.

---

## File Structure

- Create `src/domain/gameplay/playerCoinPickup.ts`: pure pickup radius, scan gate, pickup decision, and coin target count.
- Create `src/domain/gameplay/playerCoinPickup.test.ts`: TDD coverage copied in spirit from `__prototype__/src/domain/player/coinPickupRules.test.ts` and `__prototype__/src/domain/stage/coinRules.test.ts`.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`: add `GameplayCoinPoint` and `coins` to `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMaps.ts`: add rebuild-owned coin coordinates to stage `1-1`.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`: assert coin data exists, IDs are unique, coordinates are valid, and asset/runtime references do not point to `__prototype__`.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: add coin texture generation, coin runtime state, coin creation, proximity pickup scanning, Homing-line pickup, and collection tween.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: extend fake runtime graphics/image support and add renderer tests for generated texture, coin spawn, proximity collection, dead scan block, repeat collection guard, and Homing-line collection.

---

### Task 1: Pure Player Coin Pickup Domain

**Files:**
- Create: `src/domain/gameplay/playerCoinPickup.test.ts`
- Create: `src/domain/gameplay/playerCoinPickup.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/gameplay/playerCoinPickup.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  PLAYER_COIN_PICKUP_RADIUS,
  canPlayerPickUpCoin,
  getCoinTargetCount,
  getPlayerCoinPickupDecision,
  shouldScanPlayerCoins,
} from './playerCoinPickup'

describe('player coin pickup constants', () => {
  it('keeps prototype pickup radius explicit', () => {
    expect(PLAYER_COIN_PICKUP_RADIUS).toBe(52)
  })
})

describe('canPlayerPickUpCoin', () => {
  it('allows pickup when the coin center is inside the pickup radius', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: 30,
      coinY: 40,
    })).toBe(true)
  })

  it('rejects pickup on the exact pickup radius boundary', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS,
      coinY: 0,
    })).toBe(false)
  })

  it('rejects pickup outside the pickup radius', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS + 1,
      coinY: 0,
    })).toBe(false)
  })

  it('supports explicit radius overrides', () => {
    expect(canPlayerPickUpCoin({
      playerX: 10,
      playerY: 10,
      coinX: 13,
      coinY: 14,
      radius: 5.1,
    })).toBe(true)
    expect(canPlayerPickUpCoin({
      playerX: 10,
      playerY: 10,
      coinX: 13,
      coinY: 14,
      radius: 5,
    })).toBe(false)
  })
})

describe('shouldScanPlayerCoins', () => {
  it('allows scanning while gameplay is active', () => {
    expect(shouldScanPlayerCoins({ stageCleared: false, dead: false })).toBe(true)
  })

  it('blocks scanning after stage clear', () => {
    expect(shouldScanPlayerCoins({ stageCleared: true, dead: false })).toBe(false)
  })

  it('blocks scanning while dead', () => {
    expect(shouldScanPlayerCoins({ stageCleared: false, dead: true })).toBe(false)
  })
})

describe('getPlayerCoinPickupDecision', () => {
  it('skips collected coins even inside pickup radius', () => {
    expect(getPlayerCoinPickupDecision({
      collected: true,
      playerX: 0,
      playerY: 0,
      coinX: 0,
      coinY: 0,
    })).toBe('skip')
  })

  it('collects uncollected coins inside pickup radius', () => {
    expect(getPlayerCoinPickupDecision({
      collected: false,
      playerX: 0,
      playerY: 0,
      coinX: 30,
      coinY: 40,
    })).toBe('collect')
  })

  it('skips uncollected coins on the exact pickup radius boundary', () => {
    expect(getPlayerCoinPickupDecision({
      collected: false,
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS,
      coinY: 0,
    })).toBe('skip')
  })
})

describe('getCoinTargetCount', () => {
  it('returns zero when a stage has no coins', () => {
    expect(getCoinTargetCount({ coins: [] })).toBe(0)
  })

  it('returns the number of stage coin entries', () => {
    expect(getCoinTargetCount({
      coins: [
        { id: 'coin-a' },
        { id: 'coin-b' },
        { id: 'coin-c' },
      ],
    })).toBe(3)
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/playerCoinPickup.test.ts
```

Expected: FAIL because `./playerCoinPickup` does not exist.

- [ ] **Step 3: Implement the pure domain module**

Create `src/domain/gameplay/playerCoinPickup.ts`:

```ts
export const PLAYER_COIN_PICKUP_RADIUS = 52

export type PlayerCoinPickupDecision = 'skip' | 'collect'

export function canPlayerPickUpCoin(input: {
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): boolean {
  const radius = input.radius ?? PLAYER_COIN_PICKUP_RADIUS
  return Math.hypot(input.coinX - input.playerX, input.coinY - input.playerY) < radius
}

export function shouldScanPlayerCoins(input: {
  stageCleared: boolean
  dead: boolean
}): boolean {
  return !input.stageCleared && !input.dead
}

export function getPlayerCoinPickupDecision(input: {
  collected: boolean
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): PlayerCoinPickupDecision {
  if (input.collected) return 'skip'
  return canPlayerPickUpCoin(input) ? 'collect' : 'skip'
}

export function getCoinTargetCount(input: {
  coins: readonly unknown[]
}): number {
  return input.coins.length
}
```

- [ ] **Step 4: Run focused tests to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/playerCoinPickup.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run domain gameplay tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 6: Commit domain coin rules**

Run:

```bash
git add src/domain/gameplay/playerCoinPickup.ts src/domain/gameplay/playerCoinPickup.test.ts
git commit -m "feat: add player coin pickup rules"
```

---

### Task 2: Stage Coin Data

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`

- [ ] **Step 1: Write failing stage map tests**

Append these tests inside `describe('gameplayStageMaps', ...)` in `src/domain/gameplay/gameplayStageMaps.test.ts`:

```ts
  it('defines collectible coins for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.coins).toEqual([
      { id: 'coin-start-1', x: 320, y: 430 },
      { id: 'coin-start-2', x: 384, y: 430 },
      { id: 'coin-homing-line-1', x: 1680, y: 320 },
      { id: 'coin-homing-line-2', x: 1720, y: 320 },
      { id: 'coin-route-1', x: 1504, y: 430 },
    ])
  })

  it('keeps gameplay coin ids unique within the first stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const ids = stage.coins.map((coin) => coin.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places gameplay coins inside the first stage world bounds', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.coins.every((coin) =>
      Number.isFinite(coin.x)
      && Number.isFinite(coin.y)
      && coin.x >= 0
      && coin.x <= stage.world.width
      && coin.y >= 0
      && coin.y <= stage.world.height,
    )).toBe(true)
  })
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `stage.coins` is missing.

- [ ] **Step 3: Add coin types**

Modify `src/domain/gameplay/gameplayMapTypes.ts` so `GameplayStageMap` includes `coins` and export the coin point type:

```ts
export type GameplayStageMap = {
  id: StageId
  theme: GameplayTheme
  world: {
    width: number
    height: number
    tileSize: number
  }
  backgroundLayers: readonly BackgroundLayer[]
  player: GameplayPlayerSpawn
  enemies: readonly GameplayEnemySpawn[]
  coins: readonly GameplayCoinPoint[]
  terrain: TerrainDefinition
}

export type GameplayCoinPoint = {
  id: string
  x: number
  y: number
}
```

- [ ] **Step 4: Add first-stage coin data**

Modify `src/domain/gameplay/gameplayStageMaps.ts` and add `coins` between `enemies` and `terrain`:

```ts
  coins: [
    { id: 'coin-start-1', x: 320, y: 430 },
    { id: 'coin-start-2', x: 384, y: 430 },
    { id: 'coin-homing-line-1', x: 1680, y: 320 },
    { id: 'coin-homing-line-2', x: 1720, y: 320 },
    { id: 'coin-route-1', x: 1504, y: 430 },
  ],
```

- [ ] **Step 5: Run focused tests to verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run domain gameplay tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS.

- [ ] **Step 7: Commit stage coin data**

Run:

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts
git commit -m "feat: add gameplay coin stage data"
```

---

### Task 3: Coin Texture And Spawn Rendering

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Extend fake image and graphics support in tests**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, update `createFakeImage` so image objects support scale and alpha:

```ts
function createFakeImage(input: { x: number; y: number; texture: string }) {
  const image = {
    ...input,
    width: 56,
    height: 36,
    visible: true,
    flipX: false,
    depth: 0,
    angle: 0,
    scale: 1,
    alpha: 1,
    blendMode: undefined as string | undefined,
    destroyed: false,
    setDepth: (value: number) => {
      image.depth = value
      return image
    },
    setScale: (value: number) => {
      image.scale = value
      return image
    },
    setAlpha: (value: number) => {
      image.alpha = value
      return image
    },
    setBlendMode: (value: string) => {
      image.blendMode = value
      return image
    },
    setPosition: (x: number, y: number) => {
      image.x = x
      image.y = y
      return image
    },
    setAngle: (value: number) => {
      image.angle = value
      return image
    },
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

Also extend the fake graphics type in `createSceneRuntime` to include:

```ts
fillEllipse: () => void
fillRoundedRect: () => void
```

and return no-op implementations in `scene.make.graphics`.

- [ ] **Step 2: Write failing renderer tests for coin texture and spawn**

Add these tests near the existing generated texture and enemy spawn tests:

```ts
  it('creates the generated coin texture from prototype dimensions', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.generateTextureCalls).toContainEqual({
      key: 'coin',
      width: 44,
      height: 44,
    })
  })

  it('creates coin sprites from stage data with floating presentation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const coinImages = runtime.images.filter((image) => image.texture === 'coin')
    expect(coinImages).toHaveLength(runtime.stage.coins.length)
    expect(coinImages[0]).toMatchObject({
      x: runtime.stage.coins[0]?.x,
      y: runtime.stage.coins[0]?.y,
      depth: 12,
    })
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: coinImages[0],
          y: (runtime.stage.coins[0]?.y ?? 0) - 8,
          duration: 900,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        }),
      ]),
    )
  })
```

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because the `coin` texture and sprites are not created.

- [ ] **Step 4: Add renderer coin runtime structures**

Modify imports in `src/ui/gameplay/createGameplayRenderer.ts`:

```ts
import type {
  GameplayCoinPoint,
  GameplayEnemySpawn,
  GameplayStageMap,
} from '../../domain/gameplay/gameplayMapTypes'
```

Add runtime type:

```ts
type CoinRuntime = {
  sprite: Phaser.GameObjects.Image
  point: GameplayCoinPoint
  collected: boolean
}
```

Add scene fields:

```ts
  private coins: CoinRuntime[] = []
  private collectedCoins = 0
```

- [ ] **Step 5: Generate coin texture and create coin sprites**

In `create()`, after `this.createHomingReticleTexture()` add:

```ts
    this.createCoinTexture()
```

After `this.createEnemies()` add:

```ts
    this.createCoins()
```

Add methods:

```ts
  private createCoinTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0xf4c542)
    graphics.fillCircle(22, 22, 18)
    graphics.lineStyle(3, 0xfff3cf, 1)
    graphics.strokeCircle(22, 22, 18)
    graphics.lineStyle(2, 0xf4c542, 0.85)
    graphics.fillStyle(0xffffff, 0.34)
    graphics.fillEllipse(17, 15, 12, 8)
    graphics.fillStyle(0xc5891f, 0.9)
    graphics.fillRoundedRect(18, 11, 8, 22, 3)
    graphics.generateTexture('coin', 44, 44)
    graphics.destroy()
  }

  private createCoins(): void {
    this.coins = this.stageMap.coins.map((point, index) => {
      const sprite = this.add.image(point.x, point.y, 'coin')
      sprite.setDepth(12)

      this.tweens.add({
        targets: sprite,
        y: point.y - 8,
        duration: 900 + index * 35,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })

      return { sprite, point, collected: false }
    })
  }
```

- [ ] **Step 6: Run focused tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 8: Commit coin texture and spawn rendering**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: render gameplay coins"
```

---

### Task 4: Player Proximity Coin Collection

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer tests for player pickup**

Add these tests after the coin spawn tests:

```ts
  it('collects a coin when the player moves inside the pickup radius', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin || !runtime.playerSprite) return

    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()

    expect(runtime.killedTweenTargets).toContain(coin)
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: coin,
          y: coin.y - 34,
          scale: 1.8,
          alpha: 0,
          duration: 260,
          ease: 'Quad.easeOut',
        }),
      ]),
    )
    const collectionTween = runtime.tweenCalls.find((call) => call.targets === coin && call.duration === 260)
    expect(coin.visible).toBe(true)
    collectionTween?.onComplete?.()
    expect(coin.visible).toBe(false)
  })

  it('does not collect the same coin twice', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin || !runtime.playerSprite) return

    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()
    runtime.scene.update()

    const collectionTweens = runtime.tweenCalls.filter((call) => call.targets === coin && call.duration === 260)
    expect(collectionTweens).toHaveLength(1)
  })

  it('does not scan coins while the player is dead', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin || !runtime.playerSprite) return

    const scene = runtime.scene as typeof runtime.scene & { isPlayerDead: boolean }
    scene.isPlayerDead = true
    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()

    const collectionTweens = runtime.tweenCalls.filter((call) => call.targets === coin && call.duration === 260)
    expect(collectionTweens).toHaveLength(0)
  })
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because proximity collection is not implemented.

- [ ] **Step 3: Import coin pickup domain helpers**

Modify `src/ui/gameplay/createGameplayRenderer.ts` imports:

```ts
import {
  getPlayerCoinPickupDecision,
  shouldScanPlayerCoins,
} from '../../domain/gameplay/playerCoinPickup'
```

- [ ] **Step 4: Call coin scanning during update**

In `update()`, after `this.updateHomingAttack()` add:

```ts
    this.updateCoins()
```

- [ ] **Step 5: Add pickup and collection methods**

Add methods:

```ts
  private updateCoins(): void {
    if (!this.player) return

    if (!shouldScanPlayerCoins({
      stageCleared: false,
      dead: this.isPlayerDead,
    })) {
      return
    }

    const playerCenter = this.player.getCenter()
    for (const coin of this.coins) {
      const pickupDecision = getPlayerCoinPickupDecision({
        collected: coin.collected,
        playerX: playerCenter.x,
        playerY: playerCenter.y,
        coinX: coin.sprite.x,
        coinY: coin.sprite.y,
      })
      if (pickupDecision === 'collect') {
        this.collectCoin(coin)
      }
    }
  }

  private collectCoin(coin: CoinRuntime): void {
    if (coin.collected) return

    coin.collected = true
    this.collectedCoins += 1
    this.tweens.killTweensOf(coin.sprite)
    this.tweens.add({
      targets: coin.sprite,
      y: coin.sprite.y - 34,
      scale: 1.8,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => {
        coin.sprite.setVisible(false)
      },
    })
  }
```

Ensure `createPlayer()` resets runtime counters:

```ts
    this.collectedCoins = 0
```

- [ ] **Step 6: Add fake sprite center support if needed**

If `createFakeArcadeSprite` does not expose `getCenter`, add:

```ts
    getCenter: () => ({
      x: sprite.x,
      y: sprite.y,
    }),
```

- [ ] **Step 7: Run focused tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 9: Commit proximity collection**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: collect gameplay coins by proximity"
```

---

### Task 5: Homing-Line Coin Collection And Final Audit

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Inspect: `docs/superpowers/specs/2026-07-03-gameplay-collectibles-coins-design.md`

- [ ] **Step 1: Write failing renderer tests for Homing-line collection**

Add these tests near the Homing Attack renderer tests:

```ts
  it('collects coins crossed by the Homing Attack line', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    const lineCoin = runtime.images.find((image) => image.texture === 'coin' && image.x === 1680)
    expect(core).toBeDefined()
    expect(lineCoin).toBeDefined()
    if (!core || !lineCoin || !runtime.playerSprite) return

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.killedTweenTargets).toContain(lineCoin)
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: lineCoin,
          duration: 260,
          ease: 'Quad.easeOut',
        }),
      ]),
    )
  })

  it('does not collect coins outside the Homing Attack line radius', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    const offLineCoin = runtime.images.find((image) => image.texture === 'coin' && image.x === 1504)
    expect(core).toBeDefined()
    expect(offLineCoin).toBeDefined()
    if (!core || !offLineCoin || !runtime.playerSprite) return

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const collectionTweens = runtime.tweenCalls.filter((call) => call.targets === offLineCoin && call.duration === 260)
    expect(collectionTweens).toHaveLength(0)
  })
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because Homing-line coin collection is not connected to runtime coins.

- [ ] **Step 3: Import Homing-line collection decision**

Modify the existing Homing import in `src/ui/gameplay/createGameplayRenderer.ts` to include:

```ts
  getHomingLineCoinCollectionDecision,
```

- [ ] **Step 4: Collect coins along Homing line**

In `resolveHomingAttack`, after `this.player.setTexture(...)` and before `this.emitHomingTrail(...)`, add:

```ts
    this.collectCoinsAlongLine(startX, startY, contact.x, contact.y)
```

Add method:

```ts
  private collectCoinsAlongLine(startX: number, startY: number, endX: number, endY: number): void {
    for (const coin of this.coins) {
      const collectionDecision = getHomingLineCoinCollectionDecision({
        collected: coin.collected,
        startX,
        startY,
        endX,
        endY,
        pointX: coin.sprite.x,
        pointY: coin.sprite.y,
      })
      if (collectionDecision === 'collect') {
        this.collectCoin(coin)
      }
    }
  }
```

- [ ] **Step 5: Run focused tests to verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run required verification**

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
- `npm run check`: PASS, 0 errors and 0 warnings.
- `npm run build`: PASS. Existing Vite chunk-size warning is acceptable.
- `git diff --check`: no output.
- `rg -n "__prototype__" src public`: no runtime references. Existing tests that assert paths do not include `__prototype__` are acceptable.

- [ ] **Step 7: Audit acceptance criteria**

Confirm each item from `docs/superpowers/specs/2026-07-03-gameplay-collectibles-coins-design.md`:

- Coins render from `GameplayStageMap.coins`.
- Player proximity collection uses radius `52` through domain rules.
- Boundary behavior is domain-tested.
- Homing line collection uses `getHomingLineCoinCollectionDecision`.
- Collected coins cannot be collected twice.
- Collection tween hides the coin on completion.
- Coin texture is generated at runtime.
- No external coin image file is added.
- No runtime `__prototype__` reference exists.

- [ ] **Step 8: Commit Homing-line collection**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: collect coins along homing attack line"
```

- [ ] **Step 9: Request final code review**

Generate a review package from the branch base to HEAD and dispatch a reviewer using `superpowers:requesting-code-review`.

Review scope:

- Spec compliance for collectibles/coins.
- Domain purity.
- Renderer as Phaser adapter only.
- No HUD/SFX/result scope creep.
- Runtime coin collection correctness.
- Test quality and TDD evidence.

- [ ] **Step 10: Fix review findings if needed**

If the reviewer reports Critical or Important findings, fix them with tests, rerun the required verification, and request re-review.

If only Minor findings remain, record them in the final response.
