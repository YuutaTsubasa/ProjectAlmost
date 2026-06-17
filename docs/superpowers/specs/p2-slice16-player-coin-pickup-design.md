# P2 Slice 16: Player Coin Pickup Distance Rule

## Target Behavior

Move the normal player-to-coin pickup distance check out of `GameplayScene` and into a pure player-domain rule.

Current behavior must be preserved:

- A coin is collected when the distance from the player's center to the coin center is strictly less than `52` pixels.
- A coin exactly `52` pixels away is not collected.
- This rule is distinct from Homing Attack line collection, which uses an inclusive `<= 52` segment distance.

## Domain API

Add `src/domain/player/coinPickupRules.ts`:

```ts
export const PLAYER_COIN_PICKUP_RADIUS = 52

export function canPlayerPickUpCoin(input: {
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): boolean
```

## Ownership Boundary

Domain owns:

- The normal pickup radius constant.
- The strict distance comparison.

`GameplayScene` keeps:

- `stageCleared` / `isDead` early exits.
- Reading Phaser player center and coin sprite positions.
- Iterating runtime coins.
- Skipping already collected coins.
- Calling `collectCoin()` and all SFX/HUD/tween side effects.

## Validation Plan

- Add failing tests before implementation.
- Verify tests fail because the new file/API does not exist.
- Implement the pure rule.
- Replace only the `updateCoins()` distance expression with the domain rule.
- Run `npm run test -- src/domain/player/coinPickupRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change Homing Attack coin line collection.
- Do not change coin animation, SFX, HUD, or collected state behavior.
