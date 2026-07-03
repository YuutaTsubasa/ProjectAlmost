# Gameplay Collectibles / Coins Design

## Goal

Port the first rebuilt Collectibles / Coins gameplay slice from `__prototype__/` into the rebuilt gameplay scene.

This slice makes these behaviors true in rebuilt gameplay:

- Stage data can place coins on the map.
- The player can collect coins by moving within the prototype pickup radius.
- A Homing Attack line can collect coins crossed between the player start point and Homing contact point.
- Coin rules remain in pure domain code.
- Phaser only renders coin sprites, owns runtime sprite state, and synchronizes collected state with domain decisions.

## Scope

This slice is gameplay-only.

It includes:

- Pure player coin pickup rules.
- Coin target counting for stage data.
- Rebuild-owned coin coordinates in gameplay stage data.
- Runtime-generated coin texture matching the prototype graphics approach.
- Coin floating presentation.
- Coin collection presentation: stop floating tween, tween upward, scale up, fade out, then hide.
- Player proximity collection.
- Homing line collection during Homing Attack resolution.

It intentionally does not include:

- HUD coin counter.
- Coin sound effects.
- Stage result, rank, score, save data, or progression.
- Localization copy for coins.
- New external coin image files.
- Coin respawn, persistence, or checkpoint restore.

## Prototype Reference

Prototype behavior lives mainly in:

- `__prototype__/src/domain/player/coinPickupRules.ts`
- `__prototype__/src/domain/player/coinPickupRules.test.ts`
- `__prototype__/src/domain/stage/coinRules.ts`
- `__prototype__/src/domain/stage/coinRules.test.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`
- `__prototype__/src/game/stages/*.json`

Prototype values to preserve:

- Player pickup radius: `52`.
- Pickup uses strict distance comparison: distance must be less than radius, not equal.
- Coin texture key: `coin`.
- Coin texture size: `44x44`.
- Coin float tween: `y = point.y - 8`, duration `900 + index * 35`, ease `Sine.easeInOut`, yoyo `true`, repeat `-1`.
- Collection tween: `y = coin.sprite.y - 34`, scale `1.8`, alpha `0`, duration `260`, ease `Quad.easeOut`, then hide sprite.

Prototype generated coin texture:

- Gold filled circle centered at `22,22` radius `18`.
- Pale outline circle.
- White highlight ellipse.
- Dark gold rounded rectangle inset.
- Generated at runtime with Phaser graphics.

Homing line collection was already ported as pure Homing domain behavior:

- `HOMING_LINE_COIN_COLLECTION_RADIUS = 52`
- `getHomingLineCoinCollectionDecision(...)`
- `isPointCollectableByHomingLine(...)`

This slice connects those pure helpers to runtime coins.

## Architecture

### Domain: Player Coin Pickup

Create `src/domain/gameplay/playerCoinPickup.ts`.

This module is pure Functional core. It must not import Phaser, Svelte, DOM APIs, timers, random sources, assets, or `__prototype__`.

It owns:

- Normal player coin pickup radius.
- Player-to-coin proximity rule.
- Coin scanning gate while gameplay is active.
- Per-coin pickup decision.
- Stage coin target counting.

Public API:

```ts
export const PLAYER_COIN_PICKUP_RADIUS = 52

export type PlayerCoinPickupDecision = 'skip' | 'collect'

export function canPlayerPickUpCoin(input: {
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): boolean

export function shouldScanPlayerCoins(input: {
  stageCleared: boolean
  dead: boolean
}): boolean

export function getPlayerCoinPickupDecision(input: {
  collected: boolean
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): PlayerCoinPickupDecision

export function getCoinTargetCount(input: {
  coins: readonly unknown[]
}): number
```

Rules:

- `canPlayerPickUpCoin` returns `true` only when Euclidean distance is strictly less than radius.
- Radius defaults to `PLAYER_COIN_PICKUP_RADIUS`.
- `shouldScanPlayerCoins` returns `false` while the player is dead. This slice has no stage-clear runtime state yet, so renderer passes `stageCleared: false`.
- `getPlayerCoinPickupDecision` skips already collected coins.
- `getCoinTargetCount` returns `coins.length`.

### Stage Data

Extend `src/domain/gameplay/gameplayStageMaps.ts`.

Add a stage coin point type:

```ts
export type GameplayCoinPoint = {
  id: string
  x: number
  y: number
}
```

Add `coins: GameplayCoinPoint[]` to `GameplayStageMap`.

The first rebuilt stage should include a small route-readable set of coins copied in spirit from prototype stage JSON. Coordinates are rebuild-owned data under `src/domain/gameplay/`; runtime code must not read prototype JSON.

The exact first-stage coin layout should satisfy these runtime needs:

- At least one coin close enough to collect by normal player proximity in tests.
- At least one coin positioned on the Homing path between player start and enemy contact in tests.
- Coin IDs are stable strings for test assertions and future save/progression work.

### Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Runtime state additions:

```ts
type CoinRuntime = {
  sprite: Phaser.GameObjects.Image
  point: GameplayCoinPoint
  collected: boolean
}
```

Scene fields:

- `coins: CoinRuntime[] = []`
- `collectedCoins = 0`

Startup:

- Generate the `coin` texture in `createGeneratedTextures`.
- Create coin sprites after terrain/player setup and before normal update scanning can run.
- Coin sprites use depth `12`, store baseY, and float with prototype timing.

Update flow:

- During `update`, after Homing/attack processing and before out-of-bounds checks, call `updateCoins()`.
- `updateCoins()` returns early when `shouldScanPlayerCoins({ stageCleared: false, dead: this.isPlayerDead })` is false.
- Otherwise it uses player center coordinates and checks each uncollected coin with `getPlayerCoinPickupDecision`.
- Collected coins call `collectCoin`.

Homing flow:

- In `resolveHomingAttack`, after computing the Homing contact point and before or after trail emission, call `collectCoinsAlongLine(startX, startY, contact.x, contact.y)`.
- `collectCoinsAlongLine` iterates runtime coins and uses `getHomingLineCoinCollectionDecision` from the Homing domain module.
- Coins already collected by proximity are skipped by the domain decision.

Collection presentation:

- `collectCoin` returns early if the coin is already collected.
- It sets `coin.collected = true`.
- It increments `collectedCoins`.
- It kills existing tweens of the coin sprite.
- It starts the prototype collection tween.
- On complete, it hides the sprite.

This slice does not expose `collectedCoins` to HUD. The counter exists only as runtime state and for tests/future result/HUD slices.

## Assets

No new external coin files are required.

Prototype coin visuals are generated at runtime:

- texture key: `coin`
- texture size: `44x44`
- Phaser graphics drawing commands matching the prototype shape and colors closely.

No rebuilt runtime code may reference `__prototype__`.

## Tests

Use TDD for each behavior slice.

Domain tests:

- `PLAYER_COIN_PICKUP_RADIUS` is `52`.
- Player can pick up a coin inside the radius.
- Player cannot pick up a coin exactly on the radius boundary.
- Player cannot pick up a coin outside the radius.
- Radius override works.
- Scanning is allowed while active.
- Scanning is blocked while dead.
- Scanning is blocked after stage clear.
- Already collected coins are skipped.
- Uncollected coins inside radius are collected.
- `getCoinTargetCount` returns zero for empty coins.
- `getCoinTargetCount` returns the number of stage coin entries.

Stage map tests:

- Gameplay stage `1-1` exposes `coins`.
- Coin IDs are unique.
- Coin coordinates are finite numbers inside the stage world bounds.
- The map does not reference `__prototype__` for coin data or assets.

Renderer tests:

- Generated `coin` texture is created with `44x44` dimensions.
- Coin sprites are created from stage data with texture `coin`, depth `12`, and floating tweens.
- Player proximity collects an uncollected coin and hides it through the collection tween.
- Already collected coins are not collected twice.
- Dead player state blocks normal coin scanning.
- Homing Attack line collects coins crossed by the line from player start to contact point.
- Homing line collection skips coins outside the line collection radius.

## Acceptance Criteria

- The rebuilt gameplay map renders coins from rebuild-owned stage data.
- The player can collect a coin by moving within the prototype pickup radius.
- Coins on the exact pickup radius boundary are not collected.
- A Homing Attack line collects coins crossed between the player start point and Homing contact point.
- Collected coins cannot be collected twice.
- Collected coins run the prototype-style collection tween and then hide.
- Coin visuals are generated at runtime; no external coin image file is added.
- Domain rules are pure and tested.
- Renderer owns Phaser sprite state and delegates decisions to domain helpers.
- No runtime code imports from or reads `__prototype__`.
- The required checks pass:
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `git diff --check`
