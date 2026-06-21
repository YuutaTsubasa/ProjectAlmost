# Gameplay Player Attack Design

## Goal

Port the first player attack slice from `__prototype__/` into the rebuilt gameplay scene.

This slice gives the player a grounded melee attack that can defeat the two existing rebuilt enemy types:

- Armor Guard plays its death animation and then disappears.
- Azure Core plays a burst/fade reaction and then disappears.

This slice intentionally does not add Homing Attack, player hurt, player death, enemy contact damage, Azure Core regeneration, score/HUD updates, sound effects, virtual controls, gamepad controls, attack cooldown UI, localization text, or boss behavior.

## Prototype Facts

The prototype exposes attack behavior in `__prototype__/src/domain/player/attackRules.ts` and `__prototype__/src/game/scenes/GameplayScene.ts`.

Melee attack rules:

- attack keys: `J` and `Z`
- grounded attack input decision: `melee`
- airborne attack input decision: `homing-then-melee`
- this rebuilt slice handles only direct melee, so airborne attack may still run the melee path only if no Homing Attack system exists
- attack cannot start when `attackReady` is false
- attack cannot start while player is hurting
- attack cannot start while player is homing attacking
- melee entry state: `{ attackReady: false, attacking: true }`
- melee end state after `340ms`: `{ attacking: false }`
- melee ready state after `360ms`: `{ attackReady: true }`
- melee hitbox forward offset X: `48`
- melee hitbox offset Y: `-4`
- melee hitbox texture dimensions: `56x36`
- melee hitbox is invisible in gameplay
- hitbox flips horizontally when attacking left
- hit detection uses hitbox rectangle intersecting enemy sprite bounds
- defeated enemies are ignored as melee hit candidates

Player attack animation facts:

- player attack sprite key: `player-attack`
- asset: `/assets/sprites/player_attack/sheet-transparent.webp`
- frame size: `128x128`
- frames: `0..3`
- frame rate: `12`
- repeat: `0`

Enemy defeat facts:

- Armor Guard death sprite key: `enemy-guard-death`
- Armor Guard death frames: `0..3`
- frame rate: `8`
- repeat: `0`
- on defeat, Guard velocity is set to `0,0`
- on defeat, Guard body is disabled
- on defeat, Guard plays `enemy-guard-death`
- after `520ms`, defeated enemy is hidden
- Azure Core defeat route is `azure-core-burst`
- on Azure Core defeat, active tweens are killed
- on Azure Core defeat, body is disabled
- Azure Core burst tween targets:
  - `scale: 1.8`
  - `alpha: 0`
  - `angle: currentAngle + 90`
  - `duration: 260`
  - `ease: 'Quad.easeOut'`
- after `520ms`, defeated enemy is hidden

The rebuilt project must not import runtime code from `__prototype__/`.

## Architecture

### Domain: Player Attack

Add `src/domain/gameplay/playerAttack.ts`.

It owns pure attack state transitions and hitbox geometry:

```ts
export const MELEE_HITBOX_FORWARD_OFFSET_X = 48
export const MELEE_HITBOX_OFFSET_Y = -4
export const MELEE_HITBOX_WIDTH = 56
export const MELEE_HITBOX_HEIGHT = 36
export const MELEE_ATTACK_END_DELAY_MS = 340
export const MELEE_ATTACK_READY_DELAY_MS = 360
export const MELEE_HITBOX_LIFETIME_MS = 120

export type AttackInputDecision = 'none' | 'melee'
export type MeleeHitboxGeometry = {
  x: number
  y: number
  width: number
  height: number
  direction: -1 | 1
  flipX: boolean
}
```

Required pure functions:

- `canStartMeleeAttack(input)`
- `getAttackInputDecision(input)`
- `getMeleeAttackEntryState()`
- `getMeleeAttackEndState()`
- `getMeleeAttackReadyState()`
- `getMeleeHitboxGeometry(input)`
- `isMeleeHitCandidate(input)`

Differences from the prototype:

- `getAttackInputDecision` returns only `'none' | 'melee'` in this slice.
- Because Homing Attack is not rebuilt yet, attack input maps to melee when the player is not crouching and an attack press occurs.
- The module still keeps the prototype lockout checks for `hurting` and `homingAttacking` so later slices can connect those states without changing the public contract.

The domain module must not import Phaser, Svelte, browser APIs, timers, random values, or `__prototype__`.

### Domain: Enemy Defeat Rules

Extend `src/domain/gameplay/enemyActor.ts` with pure defeat metadata and decisions.

New types:

```ts
export type EnemyDefeatPresentation = 'armor-guard-death' | 'azure-core-burst'
```

Required additions:

- Armor Guard definition exposes `defeatHideDelayMs: 520`.
- Azure Core definition exposes:
  - `defeatHideDelayMs: 520`
  - `burst: { scale: 1.8, alpha: 0, angleDelta: 90, durationMs: 260, ease: 'Quad.easeOut' }`
- `shouldProcessEnemyDefeat({ enemyExists, defeated })`
- `getEnemyDefeatPresentation(type)`

Rules:

- defeat processing is allowed only when a runtime enemy exists and is not already defeated.
- Armor Guard defeat presentation is `armor-guard-death`.
- Azure Core defeat presentation is `azure-core-burst`.
- defeated enemies no longer patrol.

### Domain: Player Actor Metadata

Extend `src/domain/gameplay/playerActor.ts`:

- `PlayerAnimationKey` gains `'attack'`.
- `playerActorDefinition.sprites.attack` uses the prototype attack sprite metadata:
  - key: `player-attack`
  - asset: `/assets/sprites/player_attack/sheet-transparent.webp`
  - frame size: `128x128`
  - frames: `0..3`
  - frame rate: `12`
  - repeat: `0`

Copy the attack sprite from:

- `__prototype__/public/assets/sprites/player_attack/sheet-transparent.webp`

to:

- `public/assets/sprites/player_attack/sheet-transparent.webp`

### Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Input:

- Add attack keys `J` and `Z`.
- Use rising-edge behavior. Holding attack must not repeatedly restart attack.

Runtime player attack state:

- `attackReady = true`
- `isAttacking = false`
- `wasAttackDown = false`

Preload / animation:

- Existing player sprite preload loop should automatically include `player-attack` once metadata exists.
- Existing player animation registration should automatically include attack animation.
- Create a generated attack hitbox texture named `attack-hitbox` with size `56x36`.

Attack flow:

1. During update, read attack key rising edge.
2. Ask `getAttackInputDecision`.
3. If decision is `melee`, call `tryPlayerMeleeAttack`.
4. `tryPlayerMeleeAttack` checks `canStartMeleeAttack`.
5. Entry state sets `attackReady = false`, `isAttacking = true`.
6. Player plays `player-attack`.
7. Create invisible hitbox at `getMeleeHitboxGeometry`.
8. Find the first non-defeated enemy whose bounds intersect the hitbox bounds.
9. Defeat that enemy if found.
10. Destroy hitbox after `120ms`.
11. End attack after `340ms`.
12. Restore attack readiness after `360ms`.

Animation priority:

- While `isAttacking`, player movement update preserves attack animation and must not replace it with idle/run/jump.
- Attack does not disable horizontal movement in this slice.
- Attack does not change jump behavior in this slice.

Enemy runtime:

Extend enemy runtime:

```ts
type EnemyRuntime = {
  sprite: Phaser.Physics.Arcade.Sprite
  spawn: GameplayEnemySpawn
  direction: EnemyPatrolDirection
  defeated: boolean
}
```

Defeat flow:

- Skip already defeated enemies.
- Mark enemy defeated.
- Set enemy velocity to `0,0`.
- Disable enemy body.
- Armor Guard:
  - play `enemy-guard-death`
  - hide after `520ms`
- Azure Core:
  - kill active tweens for the sprite
  - tween `scale`, `alpha`, `angle`, `duration`, and `ease` with prototype values
  - hide after `520ms`
- Defeated Armor Guards no longer update patrol.
- Defeated enemies are ignored by melee hit detection.

### Assets

Copy:

- `__prototype__/public/assets/sprites/player_attack/sheet-transparent.webp`

Destination:

- `public/assets/sprites/player_attack/sheet-transparent.webp`

This slice reuses the already-copied `enemy_guard_death` asset.

No runtime asset may reference `__prototype__`.

## Tests

Use TDD for each behavior slice.

Domain tests:

- attack constants match prototype values.
- `canStartMeleeAttack` requires attack ready and rejects hurting/homing lockout.
- `getAttackInputDecision` returns `none` without a press and while crouching.
- `getAttackInputDecision` returns `melee` for grounded and airborne attack presses in this slice.
- melee entry/end/ready states match prototype values.
- melee hitbox geometry places hitbox to the right or left based on player flip.
- melee hit candidate rejects defeated enemies and non-intersections.
- player actor metadata includes attack sprite with prototype values.
- Armor Guard and Azure Core defeat metadata match prototype values.
- `shouldProcessEnemyDefeat` skips missing or already defeated enemies.
- `getEnemyDefeatPresentation` returns Guard death and Azure Core burst routes.

Stage / asset tests:

- root public asset refs include `player_attack`.
- asset refs do not include `__prototype__`.

Renderer tests:

- preload/register player attack sprite and animation.
- create generated attack hitbox texture.
- J and Z rising edges trigger attack.
- holding attack does not repeat while the key stays down.
- attack animation is not immediately overwritten by idle/run/jump.
- attack hitbox is created at the prototype offset and hidden.
- attack hitbox is destroyed after `120ms`.
- attack ends after `340ms`.
- attackReady returns after `360ms`.
- attack defeats Armor Guard on intersecting hitbox.
- defeated Guard stops, disables body, plays death animation, hides after `520ms`, and no longer patrols.
- attack defeats Azure Core on intersecting hitbox.
- defeated Azure Core kills tweens, disables body, starts burst tween, hides after `520ms`, and is ignored by later attacks.
- non-intersecting enemies are not defeated.
- existing movement/jump/enemy baseline tests keep passing.

## Completion Criteria

- Pressing `J` or `Z` in rebuilt gameplay plays the player attack animation.
- Attack can defeat Armor Guard.
- Attack can defeat Azure Core.
- Armor Guard has a death reaction.
- Azure Core has a burst/fade reaction.
- `player_attack` asset exists under root `public/assets`.
- Runtime code does not import from `__prototype__`.
- Domain code remains pure.
- `npm run test` passes.
- `npm run check` passes.
- `npm run build` passes.
- `git diff --check` passes.
