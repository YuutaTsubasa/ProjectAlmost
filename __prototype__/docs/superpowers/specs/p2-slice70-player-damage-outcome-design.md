# P2 Slice 70: Player Damage Outcome Rule

## Target Behavior

When the player takes a valid hit, the gameplay should keep the existing health rule:

- subtract `1` HP
- if resulting HP is `<= 0`, the player is defeated by damage
- otherwise the player enters the hurt/invulnerable recovery flow

The Phaser scene must still own hit sound, damage counters, HUD updates, death side effects, knockback, animations, tweens, timers, and status messages.

## Boundary

Domain:

- `src/domain/player/hurtRules.ts`
- pure health transition and defeat decision
- no Phaser, Svelte, DOM, timers, sprites, or runtime mutation

Adapter:

- `src/game/scenes/GameplayScene.ts`
- applies the next HP value
- triggers `defeatPlayer('damage')` when the domain outcome is defeated
- otherwise continues the existing hurt recovery side effects

## Proposed API

```ts
export const PLAYER_HIT_DAMAGE = 1

export type PlayerDamageOutcome =
  | { type: 'survived'; nextHealth: number }
  | { type: 'defeated'; nextHealth: number }

export function getPlayerDamageOutcome(input: {
  currentHealth: number
  damage?: number
}): PlayerDamageOutcome
```

Default damage is `PLAYER_HIT_DAMAGE`. The function should not clamp HP; it should preserve the current arithmetic behavior.

## TDD Cases

- `currentHealth: 3` -> survived with `nextHealth: 2`
- `currentHealth: 1` -> defeated with `nextHealth: 0`
- `currentHealth: 0` -> defeated with `nextHealth: -1` to preserve unclamped arithmetic
- explicit `damage` can defeat from higher HP
- `PLAYER_HIT_DAMAGE === 1`

## Validation

- `npm run test -- src/domain/player/hurtRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
