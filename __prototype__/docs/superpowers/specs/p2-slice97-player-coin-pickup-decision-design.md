# P2 Slice 97: Player Coin Pickup Decision

## Target Behavior

Move the normal player coin pickup decision from `GameplayScene.updateCoins()` into the pure player coin domain layer.

The existing behavior must be preserved:

- collected coins are skipped
- uncollected coins inside the pickup radius are collected
- uncollected coins on or outside the pickup radius are skipped

## Domain Shape

Add `getPlayerCoinPickupDecision()` to `src/domain/player/coinPickupRules.ts`:

```ts
export type PlayerCoinPickupDecision = 'skip' | 'collect'

export function getPlayerCoinPickupDecision(input: {
  collected: boolean
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): PlayerCoinPickupDecision
```

The function is pure and must not import Phaser, Svelte, DOM, or scene code.

## Adapter Boundary

`GameplayScene.updateCoins()` remains responsible for:

- reading the player center from Phaser
- iterating runtime coin sprites
- calling `collectCoin()` and triggering its side effects

The scene should delegate only the collect/skip decision.

## Tests

Add focused player coin domain tests for:

- collected coins return `skip` even inside pickup radius
- uncollected coins inside radius return `collect`
- uncollected coins on the exact radius boundary return `skip`
- uncollected coins outside radius return `skip`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused coin pickup domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
