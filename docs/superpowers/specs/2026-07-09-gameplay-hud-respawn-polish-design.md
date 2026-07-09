# Gameplay HUD And Respawn Polish Design

## Goal

Close three gameplay presentation gaps found after the boss battle slice:

- Gameplay HUD stage banner must show the current world name, stage id, and stage subtitle for every rebuilt stage.
- Regenerated enemies must restore their visible sprite state after respawn/reset.
- Boss phase HUD must sit on the left side of the gameplay frame.

## Requirements

### Stage Banner Display

`getGameplayHudStageDisplay(stageId)` must not fall back to `Unknown World` or `Unknown Stage` for valid rebuilt stage ids.

The display data must stay derived from the existing localization catalog instead of duplicating all 36 stage/world names in the Svelte component. The gameplay HUD may continue using the current English fallback display until the broader gameplay HUD localization pass.

### Enemy Respawn Presentation

When an enemy is reset for boss support regeneration, the renderer must restore all presentation state that a prior defeat tween may have changed:

- `defeated: false`
- sprite visible
- sprite alpha `1`
- sprite scale from `enemyActorDefinitions[enemy.spawn.type].scale`
- sprite angle `0`
- physics body enabled

The fix should be centralized in a renderer helper so future respawn paths do not need to remember every visual property.

### Boss Phase HUD Position

`.boss-phase-hud` must be positioned on the left side of the resolution container using existing `cqw`/`cqh` sizing. It must not use viewport units and must not remain anchored with `right:`.

## Testing

- Add `gameplayHudDisplay` tests covering at least a non-`1-1` normal stage and a boss stage.
- Add a renderer test that defeats/regenerates an Azure Core support enemy and verifies visible, alpha, scale, angle, and body state after reset.
- Add a HUD source test that locks boss phase HUD to left-side positioning and rejects right-side anchoring.

## Non-Goals

- Do not broadly localize all existing gameplay HUD labels.
- Do not change boss phase rules or projectile behavior.
- Do not import runtime code or assets from `__prototype__/`.
