# World 02 Enemy Capabilities Design

## Context

World 02 currently reuses the first-world enemy presentation for its small enemies. Emerald Sanctuary stages use Armor Guard-like grounded patrol enemies and Azure Core-like airborne Homing targets, but their visuals do not match the forest setting. The next slice should introduce world-specific small enemies while also improving the enemy model so future worlds can add enemy identities without forcing renderer branches by type name.

This design follows the rebuild boundary: the prototype remains reference-only, runtime code is not copied from `__prototype__`, and gameplay behavior remains expressed through pure domain data and functions before the Phaser renderer consumes it.

## Scope

This slice introduces two World 02 small enemy types:

- `thorn-beetle`: a grounded patrol enemy for Emerald Sanctuary. It uses a forest creature silhouette and replaces World 02's current Armor Guard-like stage enemies.
- `seed-lantern`: an airborne Homing target and regenerating support enemy for Emerald Sanctuary. It replaces World 02's current Azure Core support enemies.

The selected visual direction is Thorn Beetle plus Seed Lantern. The enemy pair should feel organic and specific to a forest/ruins world rather than a recolor of the first-world enemies.

This slice also establishes an enemy capability model:

- identity: the concrete enemy type.
- placement: grounded or airborne.
- behavior: patrol or Homing target.
- physics: origin, body, scale, gravity, surface alignment, and floating presentation.
- visuals: sprite assets, generated texture fallback if needed, animation keys, defeat presentation, and regeneration presentation.
- rules: score default, respawn default, and respawn timing.

World 02 stages `2-1` through `2-5` should use the new small enemy types. Stage `2-6` keeps its current `boss-prototype` placeholder for the later World 02 boss slice, so boss work does not mix into this change.

## Architecture

Enemy identity and behavior capability should be separate concepts. `EnemyActorDefinition` remains a data definition, but it should describe the enemy through explicit capabilities instead of requiring renderer checks such as "if Armor Guard, otherwise Azure Core".

The domain model should keep invalid spawn states difficult to represent:

- grounded enemies require `surfaceY`.
- airborne enemies require `y`.
- patrol-capable enemies require patrol bounds and speed.
- Homing target enemies can be targeted by Homing logic and may use floating presentation.

The renderer should consume capabilities:

- `placement === 'grounded'` controls spawn Y, terrain collision, and gravity.
- `placement === 'airborne'` controls direct Y spawn, gravity disablement, and optional floating.
- `behavior === 'patrol'` controls horizontal patrol updates.
- `behavior === 'homing-target'` controls Homing target eligibility.
- visual definitions control texture creation, animation playback, defeat effects, and regeneration effects.

This keeps enemy behavior deterministic in the domain layer and leaves Phaser-specific work in the renderer.

## Stage Data

`gameplayStageSource.ts` should accept `thorn-beetle` and `seed-lantern` as valid source enemy types.

`gameplayStageMapConverter.ts` should convert enemy source data based on placement semantics:

- `thorn-beetle` source entries use `surfaceY`.
- `seed-lantern` source entries use `y`.
- existing metadata such as `respawnPolicy`, `respawnDelayMs`, and `countsForScore` stays preserved.

`gameplayStageSources.ts` should update World 02 small enemies:

- existing World 02 grounded guard entries become `thorn-beetle`.
- existing World 02 Azure Core support entries become `seed-lantern`.
- `2-6` `boss-prototype` remains as-is for the later boss slice.

## Assets

New runtime assets live under `public/assets/sprites/`.

The initial asset set should cover enough presentation to replace current gameplay use:

- Thorn Beetle walk animation.
- Thorn Beetle defeat animation or defeat presentation.
- Seed Lantern idle or floating presentation.
- Seed Lantern materialize/regeneration presentation, either through sprite animation or a parameterized tween using its idle texture.

Generated assets should match the Emerald Sanctuary palette and read clearly against the existing forest backgrounds and platform tiles. The exact sprite output will be produced during implementation after the implementation plan is approved.

## Visual Follow-Up Adjustments

PR review playtesting found two presentation issues in the initial generated enemy pass:

- Thorn Beetle must sit on top of the authored platform surface and must face the same direction it walks. Because generated sprites may have different default facing directions, facing is part of the enemy definition instead of being inferred globally in the renderer.
- Seed Lantern must stay readable when a coin overlaps its position. It renders above coins and uses a single idle frame with floating motion from the renderer tween, avoiding the generated sheet's uneven frame-to-frame scale changes.

These adjustments remain definition-driven: the renderer consumes enemy `facing`, `depth`, sprite frame range, and floating presentation instead of adding type-specific branches.

## Testing

Domain tests should be written first and should cover:

- `thorn-beetle` and `seed-lantern` definitions exist.
- Thorn Beetle is grounded, patrol-capable, scoring by default, and persistent by default.
- Seed Lantern is airborne, Homing-target-capable, non-scoring by default, and regenerating by default.
- spawn Y calculation depends on placement instead of concrete type names.
- patrol updates depend on behavior capability instead of concrete type names.
- defeat and regeneration presentation are resolved through enemy definitions.
- enemy facing and visual depth are explicit enough for renderer presentation to avoid per-type branching.

Converter tests should cover:

- grounded enemy sources require and preserve `surfaceY`.
- airborne enemy sources require and preserve `y`.
- `2-1` through `2-5` no longer convert World 02 small enemies to first-world enemy types.
- `2-6` keeps `boss-prototype` unchanged in this slice.

Preload tests should cover:

- new World 02 enemy sprite assets are included in the preload manifest.
- World 02 stage preload includes the relevant enemy assets.

Renderer tests should cover:

- capability-based creation of grounded patrol enemies.
- capability-based creation of airborne Homing target enemies.
- regeneration restores each enemy's own visual presentation.
- adding a non-Azure airborne enemy does not get treated as Azure Core by default.

## Out Of Scope

- World 02 boss identity, visuals, arena behavior, and projectile patterns.
- Full World 02 difficulty rebalance.
- Copying prototype runtime code.
- Replacing the domain model with a class hierarchy.
- A complete rewrite of the renderer. The implementation may refactor the local enemy creation/update paths needed for capability-based enemies, but unrelated renderer restructuring should wait.
