# P2 Slice 91: Boss Pattern Tick Eligibility

## Target Behavior

Move the recurring boss-pattern timer callback eligibility rule from `GameplayScene` into the pure boss domain layer.

The timer tick may fire another boss volley only when:

- the callback generation still matches the current boss pattern generation
- the stage has not been cleared
- the player is not dead

If any of those conditions fail, the timer callback must do nothing.

## Domain Shape

Add `canRunBossPatternTick()` to `src/domain/boss/bossRules.ts`:

```ts
export function canRunBossPatternTick(input: {
  generation: number
  currentGeneration: number
  stageCleared: boolean
  playerDead: boolean
}): boolean
```

The function is pure and must not import Phaser, Svelte, DOM, or game scene code.

## Adapter Boundary

`GameplayScene.startBossPattern()` remains responsible for:

- creating and removing Phaser timer events
- tracking `bossPatternGeneration`
- firing the initial volley
- incrementing `bossShotIndex`
- calling `fireBossVolley()`

The timer callback should only delegate the existing guard to `canRunBossPatternTick()`.

## Tests

Add focused boss domain tests for:

- generation mismatch returns `false`
- stage cleared returns `false`
- player dead returns `false`
- matching generation with active gameplay returns `true`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused boss domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
