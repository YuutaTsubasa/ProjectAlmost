# P2 Slice 98: Homing Line Coin Collection Decision

## Target Behavior

Move the Homing Attack line coin collection decision from `GameplayScene.collectCoinsAlongLine()` into the pure homing domain layer.

The existing behavior must be preserved:

- collected coins are skipped
- uncollected coins within the Homing Attack line collection radius are collected
- uncollected coins on the radius boundary are collected
- uncollected coins outside the radius are skipped

## Domain Shape

Add `getHomingLineCoinCollectionDecision()` to `src/domain/player/homingRules.ts`:

```ts
export type HomingLineCoinCollectionDecision = 'skip' | 'collect'

export function getHomingLineCoinCollectionDecision(input: {
  collected: boolean
  startX: number
  startY: number
  endX: number
  endY: number
  pointX: number
  pointY: number
  radius?: number
}): HomingLineCoinCollectionDecision
```

The function is pure and must not import Phaser, Svelte, DOM, or scene code.

## Adapter Boundary

`GameplayScene.collectCoinsAlongLine()` remains responsible for:

- iterating runtime coin sprites
- reading sprite coordinates
- calling `collectCoin()` and triggering side effects

The scene should delegate only the collect/skip decision.

## Tests

Add focused homing domain tests for:

- collected coins return `skip` even on the Homing line
- uncollected coins within line radius return `collect`
- uncollected coins on the exact radius boundary return `collect`
- uncollected coins outside line radius return `skip`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused homing domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
