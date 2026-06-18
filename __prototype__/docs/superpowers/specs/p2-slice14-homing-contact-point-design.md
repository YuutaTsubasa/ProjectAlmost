# P2 Slice 14: Homing Contact Point Geometry

## Target Behavior

Move the Homing Attack contact point calculation out of `GameplayScene` and into a pure player-domain rule.

Current behavior must be preserved:

- The contact point sits `34` pixels back from the target along the line from player start to target.
- The angle is equivalent to `atan2(targetY - startY, targetX - startX)`.
- Horizontal, vertical, diagonal, and same-position cases keep JavaScript math behavior.

## Domain API

Add to `src/domain/player/homingRules.ts`:

```ts
export const HOMING_ATTACK_CONTACT_DISTANCE = 34

export function getHomingContactPoint(input: {
  startX: number
  startY: number
  targetX: number
  targetY: number
  contactDistance?: number
}): { x: number; y: number }
```

## Ownership Boundary

Domain owns:

- Contact point geometry.
- The default contact distance constant.

`GameplayScene` keeps:

- Reading Phaser sprite positions.
- Player flip direction.
- Homing trail emission.
- Coin collection along the line.
- `setPosition`, velocity, SFX, enemy defeat, boss reset, and homing finish side effects.

## Validation Plan

- Add tests before implementation.
- Verify the test fails because `getHomingContactPoint` and `HOMING_ATTACK_CONTACT_DISTANCE` do not exist yet.
- Implement the pure rule.
- Replace the duplicated `GameplayScene` formula with the domain rule.
- Run `npm run test -- src/domain/player/homingRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change Homing Attack speed, trail, coin collection, boss reset, hit resolution, or target selection.
- Do not change boss projectile aiming, which also uses angle math in Phaser.
