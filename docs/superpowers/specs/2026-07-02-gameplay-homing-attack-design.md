# Gameplay Homing Attack Design

## Goal

Port the first Homing Attack slice from `__prototype__/` into the rebuilt gameplay scene.

This slice makes these behaviors true in rebuilt gameplay:

- Pressing `J` or `Z` while airborne first attempts a Homing Attack.
- If an eligible target exists, the player homes to that target, defeats it, bounces upward, and then recovers attack readiness.
- If no eligible target exists, airborne attack falls back to the existing melee attack path.
- A reticle appears over the current eligible target while airborne and not otherwise blocked.
- Homing trail visuals are generated from the existing player attack sprite.

This slice references prototype Homing Attack behavior and generated visual assets. It does not add new external image files.

## Out Of Scope

This slice intentionally does not add:

- Coin collection along the Homing line in runtime.
- Boss pattern reset hooks.
- Stage status messages, score, HUD, localization text, or result counters.
- Sound effects.
- Gamepad, virtual controls, or input remapping.
- Azure Core regeneration.
- New stage content or extra Homing-only target object types.

The pure line-collection helper may still be ported because it is part of prototype Homing domain behavior and has no dependency on coins runtime.

## Prototype Reference

Prototype behavior lives mainly in:

- `__prototype__/src/domain/player/homingRules.ts`
- `__prototype__/src/domain/player/homingRules.test.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`

Prototype constants to preserve:

- Homing range: `360`
- Reverse target tolerance X: `48`
- Contact distance from target: `34`
- Hit bounce velocity Y: `-420 * gravitySign`
- Reticle Y offset: `-8`
- Homing attack recovery delay: `220ms`
- Trail spacing: `28`
- Trail hold delay: `70ms`
- Trail fade duration: `260ms`
- Player attack frame used for Homing pose/trail: `2`
- Homing line collection radius: `52`

Prototype generated reticle texture:

- texture key: `homing-reticle`
- texture size: `48x48`
- cyan outer crosshair, white inner circle
- generated at runtime with Phaser graphics

Prototype target selection:

- Target must be undefeated, active, and visible.
- Target must be within `360px` distance.
- Target must be in the player's facing direction.
- A target behind the player can still be selected when its X distance is within `48px`.
- If multiple eligible targets exist, the nearest target wins.
- Equal distances keep the first eligible target.

## Architecture

### Domain: Player Homing Attack

Create `src/domain/gameplay/playerHomingAttack.ts`.

This module is pure Functional core. It must not import Phaser, Svelte, DOM APIs, timers, random sources, assets, or `__prototype__`.

It owns:

- Homing constants and timing metadata.
- Homing target availability and eligibility.
- Nearest target selection.
- Homing entry and recovery states.
- Homing contact point calculation.
- Homing finish outcome.
- Homing reticle visibility gate.
- Homing trail sample generation.
- Homing line point collection decision as a pure helper.

Public API:

```ts
export const HOMING_ATTACK_RANGE = 360
export const HOMING_TARGET_REVERSE_TOLERANCE_X = 48
export const HOMING_ATTACK_CONTACT_DISTANCE = 34
export const HOMING_ATTACK_BOUNCE_Y = -420
export const HOMING_LINE_COIN_COLLECTION_RADIUS = 52
export const HOMING_TRAIL_SPACING = 28

export const homingAttackTiming = {
  recoveryDelayMs: 220,
  trailHoldMs: 70,
  trailFadeMs: 260,
} as const

export const homingAttackPresentation = {
  reticleTextureKey: 'homing-reticle',
  reticleSize: 48,
  reticleYOffset: -8,
  attackFrame: 2,
  trailTint: 0x4be8ff,
  trailAlphaBase: 0.42,
  trailAlphaProgressReduction: 0.35,
} as const
```

Required pure functions:

- `canStartHomingAttack(input)`
- `getHomingAttackEntryState()`
- `shouldUpdateHomingAttack(input)`
- `getHomingTargetAcquisitionDecision(input)`
- `canShowHomingReticle(input)`
- `isHomingTargetEligible(input)`
- `selectNearestHomingTarget(input)`
- `getHomingContactPoint(input)`
- `getHomingFinishOutcome(input)`
- `getHomingRecoveryState(input)`
- `isHomingTargetLost(input)`
- `isHomingTargetAvailable(input)`
- `isPointCollectableByHomingLine(input)`
- `getHomingLineCoinCollectionDecision(input)`
- `getHomingTrailSamples(input)`

The rebuild currently has only normal gravity, so runtime passes `gravitySign: 1`. The API keeps `gravitySign` explicit for future gravity inversion slices.

### Domain: Player Attack Decision

Extend `src/domain/gameplay/playerAttack.ts`.

Current attack decision only returns `'none' | 'melee'`. Homing needs the prototype decision shape:

```ts
export type AttackInputDecision = 'none' | 'melee' | 'homing-then-melee'
```

Rules:

- No fresh attack press: `none`.
- Crouching: `none`.
- Grounded attack press: `melee`.
- Airborne attack press: `homing-then-melee`.

Runtime interprets `homing-then-melee` by trying Homing first and falling back to melee only if Homing cannot acquire a target.

### Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Runtime state additions:

- `isHomingAttacking = false`
- `homingTarget: Phaser.Physics.Arcade.Sprite | null = null`
- `homingReticle: Phaser.GameObjects.Image | null = null`

Startup:

- Create generated texture `homing-reticle` with the prototype crosshair drawing.
- No external Homing image files are copied because prototype Homing reticle/trail are generated at runtime.

Reticle flow:

1. During update, after grounded state is known, call `updateHomingReticle(grounded)`.
2. `canShowHomingReticle` must reject grounded, dead, attacking, hurting, and homing states.
3. Find the current nearest eligible target.
4. If none exists, hide the reticle.
5. If a target exists, create or update the reticle at `target.x`, `target.y - 8`.
6. Reticle depth is above player/enemies.
7. Reticle rotates each update.

Target candidates:

- Use runtime enemies.
- A candidate is available only when the enemy runtime is not defeated and its sprite is active and visible.
- Candidate distance is Euclidean distance between player and enemy sprite.
- This slice allows both Armor Guard and Azure Core as Homing targets, matching the prototype's use of the enemy list.

Homing attack flow:

1. On attack rising edge, call `getAttackInputDecision`.
2. If decision is `homing-then-melee`, call `tryHomingAttack`.
3. `tryHomingAttack` checks `canStartHomingAttack`.
4. It finds the nearest eligible target.
5. If no target exists, return `false` so the existing melee path can run.
6. If target exists, apply `getHomingAttackEntryState`.
7. Hide reticle.
8. Set player facing toward target.
9. Show Homing pose using player attack frame `2`.
10. Generate trail samples from player start point to contact point.
11. Move player to `getHomingContactPoint`.
12. Set player velocity to `0, 0`.
13. Defeat the target using the existing `defeatEnemy` runtime path.
14. Finish Homing as a hit.
15. Apply hit finish outcome: set vertical velocity to `-420`, reset one air jump through existing jump state if needed, and keep horizontal velocity `0`.
16. After `220ms`, apply Homing recovery: `isAttacking = false`, and restore `attackReady = true` if the player is not hurting.

Homing trail flow:

- Use `getHomingTrailSamples`.
- Each sample creates a temporary sprite using player attack texture frame `2`.
- Trail is behind the player depth.
- Trail uses player scale, player flip, cyan tint, additive blend, sample alpha.
- Trail fades to alpha `0` after a `70ms` hold over `260ms`, then destroys itself.

State interactions:

- Homing attack blocks melee startup through existing `canStartMeleeAttack`.
- Enemy contact damage treats `homingAttacking: true` as protected, matching the player life domain gate.
- Hurt cancels Homing state, clears target, and hides reticle.
- Death cancels Homing state, clears target, and hides reticle.
- Respawn resets Homing state and hides reticle.
- A defeated target is ignored by later Homing target selection.
- If the current Homing target is lost before resolution, finish Homing as a miss. In this first runtime adapter, Homing resolves immediately on startup, so this mainly preserves the domain API for future asynchronous variants.

### Assets

No new external files are required.

Prototype Homing visuals are generated:

- `homing-reticle`: runtime Phaser graphics texture.
- Homing trail: temporary sprites using the existing `player-attack` texture frame `2`.

The existing copied player attack asset remains the source for Homing pose and trail sprites:

- `public/assets/sprites/player_attack/sheet-transparent.webp`

No rebuilt runtime code may reference `__prototype__`.

## Tests

Use TDD for each behavior slice.

Domain tests:

- Homing constants match prototype values.
- `canStartHomingAttack` requires attack readiness and rejects hurting, homing, and dead states.
- `getHomingAttackEntryState` sets `attackReady: false`, `attacking: true`, and `homingAttacking: true`.
- `shouldUpdateHomingAttack` requires active Homing and a target.
- target acquisition returns `start` only when a target exists.
- reticle visibility is blocked while grounded, dead, attacking, hurting, or homing.
- target availability rejects defeated, inactive, or invisible targets.
- target eligibility honors range, facing direction, and reverse tolerance.
- nearest target selection ignores ineligible candidates and keeps the closest eligible target.
- contact point uses contact distance for horizontal, vertical, and diagonal targets.
- finish hit outcome returns one remaining air jump and velocity `-420 * gravitySign`.
- finish miss outcome returns velocity `0` and does not reset air jumps.
- recovery restores attack readiness only when not hurting.
- point-line collection helper uses radius `52`.
- trail samples use spacing `28`, interpolate positions, and derive alpha from progress.

Attack domain tests:

- Grounded attack press returns `melee`.
- Airborne attack press returns `homing-then-melee`.
- No press and crouch still return `none`.

Renderer tests:

- Creates the generated `homing-reticle` texture.
- Shows reticle over the nearest eligible airborne target and hides it when grounded.
- Reticle ignores defeated enemies.
- Airborne `J/Z` with a target starts Homing instead of spawning a melee hitbox.
- Homing moves player to the prototype contact point and flips toward the target.
- Homing defeats the target through existing defeat presentation.
- Homing gives the player bounce velocity `-420`.
- Homing recovers attack readiness after `220ms`.
- Airborne `J/Z` without a target falls back to existing melee behavior.
- Homing trail sprites are emitted with player attack frame `2` and fade/destroy timing.
- Enemy contact during Homing does not hurt the player.
- Hurt, death, and respawn clear Homing state and hide reticle.

## Acceptance Criteria

- The player can Homing Attack an eligible enemy while airborne.
- The nearest eligible target is selected using prototype range, facing, and reverse-tolerance rules.
- A visible reticle tracks the current eligible target while airborne.
- Homing uses the existing player attack sprite frame `2` and generated trail visuals.
- Homing defeats Armor Guard and Azure Core through existing enemy defeat behavior.
- After a Homing hit, the player bounces upward and regains attack readiness after prototype recovery timing.
- Airborne attacks still fall back to melee when no Homing target exists.
- Homing state integrates with existing hurt/death/respawn lockouts.
- No new runtime asset path points to `__prototype__`.
- The required checks pass:
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `git diff --check`
