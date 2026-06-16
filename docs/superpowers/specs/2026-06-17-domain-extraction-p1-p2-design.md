# Domain Extraction P1/P2 Design Spec

## Purpose

This spec records the first completed domain-extraction slices from `GameplayScene.ts` and establishes the expected pattern for future slices.

The goal is to move gameplay domain rules out of the Phaser scene into pure, tested modules under `src/domain/`, while keeping Phaser responsible for rendering, physics objects, animation, and side effects.

## Context

`src/game/scenes/GameplayScene.ts` is still a large scene class that mixes:

- domain decisions
- Phaser rendering
- Arcade physics callbacks
- input handling
- audio/HUD events
- boss/enemy runtime state

This creates high regression risk. The project is moving toward TDD-driven domain extraction: write a failing pure-domain test, implement the pure function, then wire the scene as a thin adapter.

## Completed Slice P1: Scoring And Rank Rules

### Problem

Rank/scoring had two sources of truth:

- `GameplayScene.getRank()` owned the real S/A/B/C/D scoring formula.
- `src/domain/progression/progressionRules.ts` owned independent rank ordering through `rankValue()`.

This made rank behavior easy to split accidentally.

### Design

Create a scoring domain module:

- `src/domain/scoring/rank.ts`
  - owns `Rank`
  - owns `ClearRank`
  - owns `RANK_ORDER`
  - owns `rankValue()`
- `src/domain/scoring/scoringRules.ts`
  - owns `RankTargets`
  - owns `StageScoreInput`
  - owns `scoreStageResult()`
  - owns `calculateStageRank()`

`GameplayScene` now only gathers runtime facts:

- elapsed time
- coins and coin target
- enemies defeated and enemy target
- checkpoints reached and checkpoint target
- damage taken
- falls
- stage rank targets

Then it calls `calculateStageRank()`.

`progressionRules.ts` imports the shared `Rank` and `rankValue()` from the scoring domain. It no longer defines a separate rank order.

`StageData.rankTargets` imports the `RankTargets` type from the scoring domain. This keeps the rank-target shape owned by the domain instead of duplicating it in game-stage types.

### Tests

`src/domain/scoring/scoringRules.test.ts` covers:

- S rank for a perfect result.
- exact A/B/C rank thresholds.
- D below C threshold.
- full optional-target scores when a stage has no coins/enemies/checkpoints.
- damage and fall penalties.
- time decay after `cTime`, including `cTime + 1 second => timeScore = 97`.

### DoD Result

- `GameplayScene` no longer contains rank threshold constants `850/700/550/400`.
- `GameplayScene` no longer contains scoring formula details.
- rank type is shared across scoring, progression, and HUD state.
- scoring rules are pure and tested.

## Completed Slice P2.1: World Bounds / Fall Death Rule

### Problem

Out-of-bounds death was already nearly pure, but still lived in `GameplayScene`:

```ts
private isPlayerOutOfBounds(): boolean {
  return this.playerGravityDirection === 'down'
    ? this.player.y > this.worldHeight + 80
    : this.player.y < -80
}
```

The side effect was already separate:

```ts
if (this.isPlayerOutOfBounds()) {
  this.defeatPlayer('fall')
}
```

This made it a safe first P2 slice.

### Design

Create:

- `src/domain/world/bounds.ts`
  - owns `OUT_OF_BOUNDS_MARGIN`
  - owns `OutOfBoundsInput`
  - owns `isOutOfBounds()`

The pure function intentionally accepts `isDownGravity: boolean` instead of importing a gravity enum from game-stage types. This avoids pulling game/Phaser/stage concepts into the domain layer and preserves current behavior exactly.

`GameplayScene.isPlayerOutOfBounds()` is now a thin adapter:

```ts
private isPlayerOutOfBounds(): boolean {
  return isOutOfBounds({
    playerY: this.player.y,
    worldHeight: this.worldHeight,
    isDownGravity: this.playerGravityDirection === 'down',
  })
}
```

The death side effect remains in `GameplayScene`.

### Tests

`src/domain/world/bounds.test.ts` covers:

- down gravity: `playerY > worldHeight + 80` is out of bounds.
- down gravity: `playerY === worldHeight + 80` remains in bounds.
- non-down gravity: `playerY < -80` is out of bounds.
- non-down gravity: `playerY === -80` remains in bounds.

### DoD Result

- bounds rule is pure and tested.
- bounds domain imports no Svelte, Phaser, DOM, or game-stage types.
- `GameplayScene` imports `src/domain/world/bounds`.
- `defeatPlayer('fall')` remains unchanged.
- current non-down behavior is preserved exactly.

## Important Non-Goal

This work intentionally does not fix the questionable behavior where future left/right gravity would also use the upward `playerY < -80` check.

That is a behavior change and should be a separate future slice if horizontal gravity becomes real gameplay.

## Future Slice Pattern

Every future `GameplayScene` domain extraction should follow this sequence:

1. Identify a pure decision already embedded in the scene.
2. Write a co-located domain test first.
3. Verify the test fails for the expected reason.
4. Implement the smallest pure domain function.
5. Verify the domain test passes.
6. Replace scene logic with a thin adapter call.
7. Keep Phaser object reads/writes and side effects in the scene.
8. Run `npm run test`, `npm run check`, `npm run build`, and `git diff --check`.
9. Commit the slice independently.

## Candidate Next Slice

The recommended next slice is enemy scoring/respawn policy because it is high value but still small enough to isolate:

- `countsForScore`
- `respawnPolicy`
- default regenerate delay
- safe-distance rule for regenerated enemies

This should be designed separately before implementation.
