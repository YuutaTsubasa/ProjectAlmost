# P2 Slice 96: Next Checkpoint Index

## Target Behavior

Move the next-checkpoint selection rule from `GameplayScene.updateCheckpoint()` into the pure checkpoint domain layer.

The current behavior must be preserved:

- only checkpoints after the current active checkpoint can be selected
- a checkpoint is reached when `playerX >= checkpoint.x`
- the first reached checkpoint after the active index is selected
- if no checkpoint qualifies, return `-1`

## Domain Shape

Add `findNextCheckpointIndex()` to `src/domain/stage/checkpointRules.ts`:

```ts
export function findNextCheckpointIndex(input: {
  checkpoints: readonly { x: number }[]
  activeCheckpointIndex: number
  playerX: number
}): number
```

The function is pure and must not import Phaser, Svelte, DOM, or scene code.

## Adapter Boundary

`GameplayScene.updateCheckpoint()` remains responsible for:

- reading `this.stage.checkpoints`
- mutating `activeCheckpointIndex`
- updating respawn state
- dispatching sounds and visual effects
- updating checkpoint sprites, glows, rings, tweens, and status message

The scene should delegate only the next checkpoint index selection.

## Tests

Add focused checkpoint domain tests for:

- no checkpoints returns `-1`
- checkpoints at or before the active index are ignored
- `playerX === checkpoint.x` counts as reached
- the first reachable checkpoint after the active index is returned
- no reachable checkpoint after active index returns `-1`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused checkpoint domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
