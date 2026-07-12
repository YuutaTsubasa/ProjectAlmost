# Gameplay Movement SFX Design

## Context

Gameplay stage SFX is routed through typed `GameplaySfxAction` callbacks. The first wiring pass incorrectly emitted the armor step sound from Armor Guard patrol updates, which made a continuous walking loop while enemies moved.

Prototype behavior uses the same armor step audio as a player movement contact sound. It plays on discrete player contact events:

- jump launch
- landing after being airborne
- grounded running footsteps after a cooldown and speed threshold

## Decision

Model movement SFX as a pure domain decision instead of a renderer loop side effect.

- The domain rule receives `now`, `grounded`, `wasGrounded`, `moving`, `velocityX`, and `nextFootstepAt`.
- It returns whether one footstep should play and the next state.
- The renderer owns Phaser state and stores `wasPlayerGroundedForSfx` and `nextPlayerFootstepSfxAt`.
- Jump launch emits the same footstep action once and advances the next footstep cooldown.
- Armor Guard patrol animation must not emit player movement footstep audio.

## Acceptance

- Holding movement on the ground does not produce an unbounded per-frame loop.
- Running footsteps only play while the player is grounded, moving, above the speed threshold, and past cooldown.
- Landing emits one footstep and delays the next running footstep.
- Jump launch emits one footstep and delays the next running footstep.
- No prototype runtime code is imported into the rebuild.
