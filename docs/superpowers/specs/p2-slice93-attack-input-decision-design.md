# P2 Slice 93: Attack Input Decision

## Target Behavior

Move the player attack input intent decision out of `GameplayScene.update()` and into the pure player attack domain layer.

The current behavior must be preserved:

- no attack button press means no attack handling
- crouching blocks attack handling
- grounded attack input goes directly to melee attack
- airborne attack input tries Homing Attack first, then falls back to melee if Homing Attack does not start

## Domain Shape

Add `getAttackInputDecision()` to `src/domain/player/attackRules.ts`:

```ts
export type AttackInputDecision = 'none' | 'melee' | 'homing-then-melee'

export function getAttackInputDecision(input: {
  attackPressed: boolean
  crouching: boolean
  grounded: boolean
}): AttackInputDecision
```

The function is pure and must not import Phaser, Svelte, DOM, or scene code.

## Adapter Boundary

`GameplayScene.update()` remains responsible for:

- starting the timer when an attack intent is accepted
- attempting Homing Attack
- invoking melee attack
- returning early when Homing Attack starts

The scene should only delegate the input intent decision.

## Tests

Add focused player attack domain tests for:

- no attack press returns `none`
- crouching with attack press returns `none`
- grounded attack press returns `melee`
- airborne attack press returns `homing-then-melee`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused player attack domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
