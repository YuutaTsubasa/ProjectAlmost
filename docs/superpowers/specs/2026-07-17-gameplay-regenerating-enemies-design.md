# Gameplay Regenerating Enemies Design

## Context

This slice ports the prototype's regenerating enemy behavior into the rebuild without importing or copying prototype runtime code. Prototype files are reference material only. The rebuild must keep the behavior in the functional domain layer, then let the Phaser renderer consume those decisions.

## Requirements

- Enemy runtime metadata from stage sources must preserve `respawnPolicy`, `respawnDelayMs`, and `countsForScore` into `GameplayStageMap`.
- Enemies with `respawnPolicy: "regenerate"` schedule a regeneration attempt after defeat. Default policy follows prototype enemy type rules: Armor Guard is `persistent`, Azure Core is `regenerate`. Explicit `persistent` metadata always disables regeneration.
- The regeneration delay uses `respawnDelayMs` when present and otherwise uses the prototype default timing of `1400ms`.
- A regeneration attempt is skipped after stage clear, delayed while the player is dead, and delayed while the player is too close to the enemy spawn point. The safe distance is `140px`; delayed retries use `300ms`.
- Azure Core regeneration visually matches the prototype route: reset to spawn, body disabled, texture restored, floating tween restarted, visible with alpha `0`, scale `0.35`, then tween to alpha `1` and scale `1` over `320ms` with `Back.easeOut`; only after the tween completes does it become active again.
- Armor Guard regeneration restores the guard at its spawn with visible alpha `1`, actor scale, body enabled, velocity reset, direction reset, and walk animation active.
- Defeat scoring uses `countsForScore`. Azure Core support enemies default to not counting; Armor Guard combat enemies default to counting. HUD enemy target and result scoring must use only score-counting enemies.
- HUD enemy markers represent currently active enemies. A defeated regenerating enemy disappears from the marker list during defeat and returns after regeneration.

## Design

Add pure functions to `src/domain/gameplay/enemyActor.ts` for regeneration and score-count decisions:

- `enemyCountsForScore`
- `getScoreEnemyTargetCount`
- `getEnemyDefeatOutcome`
- `getEnemyRespawnDelayMs`
- `getEnemyRegenerationDecision`
- `getEnemyRegenerationPresentation`

The renderer will call these functions from `defeatEnemy` and from a new regeneration helper. The renderer owns Phaser-specific effects only: delayed calls, tween setup, body toggling, sprite texture/animation restoration, and HUD patches.

Stage conversion will keep `respawnDelayMs` alongside the existing metadata. `GameplayStageMap` will expose it in enemy spawn metadata.

## Testing

- Domain tests cover score-count defaults/overrides, delay defaults/overrides, regeneration decisions, and presentation values.
- Stage conversion tests cover `respawnDelayMs` preservation.
- Renderer tests cover Armor Guard regeneration, Azure Core regeneration animation/body gating, non-counting enemy defeat not incrementing HUD score, and HUD marker restoration after regeneration.

## Out of Scope

- New enemy types.
- Changing prototype asset files.
- Importing prototype source modules.
