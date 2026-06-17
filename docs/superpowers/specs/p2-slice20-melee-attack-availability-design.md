# P2 Slice 20: Melee Attack Availability Rule

## Target Behavior

Move the melee attack availability guard out of `GameplayScene.tryAttack()` and into a pure player-domain rule.

Current behavior must be preserved:

- Melee attack can start only when:
  - attack is ready,
  - player is not hurting,
  - player is not currently Homing Attacking.
- This rule intentionally does not include `dead`; it must not reuse the Homing Attack availability rule, which has different conditions.

## Domain API

Add `src/domain/player/attackRules.ts`:

```ts
export function canStartMeleeAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
}): boolean
```

## Ownership Boundary

Domain owns:

- The melee attack availability decision.

`GameplayScene` keeps:

- Setting `attackReady`, `isAttacking`, and visual state.
- Dispatching SFX.
- Creating and destroying the hitbox.
- Phaser rectangle intersection.
- Defeating enemies.
- Delayed calls and animation timing.

## Validation Plan

- Add failing tests before implementation.
- Verify tests fail because `attackRules.ts` does not exist.
- Implement the pure rule.
- Replace only the guard in `tryAttack()`.
- Run `npm run test -- src/domain/player/attackRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change Homing Attack availability.
- Do not add a `dead` condition to melee attack.
- Do not change hitbox position, attack timing, SFX, animation, or enemy collision behavior.
