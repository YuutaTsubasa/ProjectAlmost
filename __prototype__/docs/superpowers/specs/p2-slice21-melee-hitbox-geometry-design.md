# P2 Slice 21: Melee Hitbox Geometry

## Target Behavior

Move melee attack hitbox geometry out of `GameplayScene.tryAttack()` and into a pure player-domain rule.

Current behavior must be preserved:

- Facing left means `playerFlipX === true`, producing direction `-1`.
- Facing right means `playerFlipX === false`, producing direction `1`.
- Hitbox X is `playerX + direction * 48`.
- Hitbox Y is `playerY - 4`.
- Hitbox is flipped when direction is left.

## Domain API

Extend `src/domain/player/attackRules.ts`:

```ts
export const MELEE_HITBOX_FORWARD_OFFSET_X = 48
export const MELEE_HITBOX_OFFSET_Y = -4

export type MeleeHitboxGeometry = {
  x: number
  y: number
  direction: -1 | 1
  flipX: boolean
}

export function getMeleeHitboxGeometry(input: {
  playerX: number
  playerY: number
  playerFlipX: boolean
}): MeleeHitboxGeometry
```

## Ownership Boundary

Domain owns:

- Facing direction from player flip.
- Hitbox position.
- Hitbox flip flag.

`GameplayScene` keeps:

- Creating the Phaser image.
- Visibility and sprite key.
- Rectangle intersection.
- Enemy lookup and defeat side effects.
- Delayed hitbox destruction.

## Validation Plan

- Add failing tests before implementation.
- Verify tests fail because the new constants/function do not exist.
- Implement the pure geometry rule.
- Replace only hitbox geometry calculation in `tryAttack()`.
- Run `npm run test -- src/domain/player/attackRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change melee availability.
- Do not change hitbox sprite, visibility, lifetime, collision detection, or enemy defeat behavior.
