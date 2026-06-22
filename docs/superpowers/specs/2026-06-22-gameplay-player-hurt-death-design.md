# Gameplay Player Hurt And Death Design

## Goal

Port the first player hurt, death, and respawn slice from `__prototype__/` into the rebuilt gameplay scene.

This slice makes these behaviors true in rebuilt gameplay:

- The player has three hit points.
- Contact with an active enemy hurts the player and removes one hit point.
- When the third hit removes the last hit point, the player dies and respawns.
- When the player moves outside the visible gameplay/world bounds, the player dies and respawns.
- Hurt and death sprites are copied from `__prototype__/public/assets/sprites` into root `public/assets/sprites`.

The "outside bounds" rule must not assume only downward falling. Future stages may invert gravity, so this slice treats leaving the playable world rectangle through any side as a fall defeat.

## Out Of Scope

This slice intentionally does not add:

- HUD hearts, health text, status text, localization strings, or gameplay UI copy.
- Sound effects.
- Checkpoints.
- Boss behavior or boss-pattern restart behavior.
- Enemy respawn/regeneration changes.
- Gravity inversion mechanics.
- Hazards or traps beyond enemy contact.
- Save/load integration.
- Stage clear interactions.

Respawn returns to the current stage's authored player spawn. Enemy defeat state is not reset by respawn in this slice.

## Prototype Reference

The prototype behavior lives mainly in:

- `__prototype__/src/domain/player/hurtRules.ts`
- `__prototype__/src/domain/player/hurtRules.test.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`

Prototype constants and timings to preserve:

- `PLAYER_MAX_HEALTH = 3`
- `PLAYER_HIT_DAMAGE = 1`
- hurt knockback X velocity: `360`
- hurt knockback Y velocity: `-360 * gravitySign`
- damage death Y velocity: `-160 * gravitySign`
- fall death Y velocity: `0`
- hurt animation key: `player-hurt`
- hurt animation frames: `0..3`
- hurt animation frame rate: `10`
- hurt animation repeat: `0`
- death animation key: `player-death`
- death animation frames: `0..3`
- death animation frame rate: `7`
- death animation repeat: `0`
- hurt recovery delay: `420ms`
- invulnerability recovery delay: `900ms`
- death respawn delay: `700ms`
- hurt blink tween values: alpha `0.35`, duration `80ms`, yoyo `true`, repeat `4`

Prototype damage gates:

- Enemy contact damage applies only when the player is not invulnerable, not already hurting, not homing attacking, not dead, and the contacted enemy is not defeated.
- Generic player damage also requires the player not to be crouching. The rebuild does not have crouch yet, so this slice passes `crouching: false`.
- Defeat can only start when the player is not already dead.

## Domain Architecture

Create `src/domain/gameplay/playerLife.ts`.

This module is a pure functional core. It must not import Phaser, Svelte, DOM APIs, timers, storage, random sources, or assets.

It owns:

- damage gating
- health outcome
- hurt entry/recovery state
- invulnerability recovery state
- defeat entry state
- respawn state
- knockback direction and velocity
- defeat outcome by reason
- out-of-bounds decision

Public API:

```ts
export const PLAYER_MAX_HEALTH = 3
export const PLAYER_HIT_DAMAGE = 1

export type PlayerDefeatReason = 'damage' | 'fall'

export function canApplyPlayerEnemyHit(input: {
  invulnerable: boolean
  hurting: boolean
  enemyDefeated: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean

export function canApplyPlayerDamage(input: {
  invulnerable: boolean
  hurting: boolean
  homingAttacking: boolean
  crouching: boolean
  dead: boolean
}): boolean

export function canEnterPlayerDefeat(input: {
  dead: boolean
}): boolean

export function getPlayerDamageOutcome(input: {
  currentHealth: number
  damage?: number
}): { type: 'survived'; nextHealth: number } | { type: 'defeated'; nextHealth: number }

export function getPlayerHurtEntryState(): {
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  attackReady: boolean
}

export function getPlayerHurtRecoveryState(): {
  hurting: boolean
  attackReady: boolean
}

export function getPlayerInvulnerabilityRecoveryState(): {
  invulnerable: boolean
}

export function getPlayerDefeatEntryState(): {
  dead: boolean
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  attackReady: boolean
}

export function getPlayerRespawnState(input?: {
  maxHealth?: number
}): {
  health: number
  hurting: boolean
  invulnerable: boolean
  dead: boolean
  attacking: boolean
  attackReady: boolean
}

export function getPlayerKnockbackDirection(input: {
  playerX: number
  sourceX: number
}): -1 | 1

export function getPlayerHurtVelocity(input: {
  direction: -1 | 1
  gravitySign: number
}): { x: number; y: number }

export function getPlayerDefeatOutcome(input: {
  reason: PlayerDefeatReason
  gravitySign: number
}): { velocityY: number }

export function isPlayerOutsideWorldBounds(input: {
  x: number
  y: number
  worldWidth: number
  worldHeight: number
  margin: number
}): boolean
```

The rebuild currently has only normal gravity, so runtime passes `gravitySign: 1`. The API keeps `gravitySign` explicit so a future gravity inversion slice can reuse the same rules.

## Player Actor Metadata

Extend `src/domain/gameplay/playerActor.ts`:

- `PlayerAnimationKey` gains `'hurt'` and `'death'`.
- `playerActorDefinition.sprites.hurt`:
  - key: `player-hurt`
  - asset: `/assets/sprites/player_hurt/sheet-transparent.webp`
  - frame size: `128x128`
  - frames: `0..3`
  - frame rate: `10`
  - repeat: `0`
  - scale: `0.78`
- `playerActorDefinition.sprites.death`:
  - key: `player-death`
  - asset: `/assets/sprites/player_death/sheet-transparent.webp`
  - frame size: `128x128`
  - frames: `0..3`
  - frame rate: `7`
  - repeat: `0`
  - scale: `0.78`

Copy assets from:

- `__prototype__/public/assets/sprites/player_hurt/sheet-transparent.webp`
- `__prototype__/public/assets/sprites/player_death/sheet-transparent.webp`

to:

- `public/assets/sprites/player_hurt/sheet-transparent.webp`
- `public/assets/sprites/player_death/sheet-transparent.webp`

## Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Runtime state:

- `playerHealth = PLAYER_MAX_HEALTH`
- `isHurting = false`
- `isInvulnerable = false`
- `isDead = false`

Enemy contact:

- During scene creation, add overlap detection between the player and each enemy sprite.
- A defeated enemy must not hurt the player.
- A contact while invulnerable, already hurting, or dead must not hurt the player.
- A contact while attacking still hurts the player unless the enemy was defeated by the attack first. Runtime ordering should process player attack hitboxes before enemy contact damage for the frame.

Survived hit flow:

1. Check `canApplyPlayerEnemyHit`.
2. Check `canApplyPlayerDamage` with `crouching: false` and `homingAttacking: false`.
3. Apply `getPlayerDamageOutcome`.
4. If survived, apply `getPlayerHurtEntryState`.
5. Cancel active attack and make attack not ready.
6. Remove or consume active melee hitboxes so a hurt player does not keep damaging enemies.
7. Set player velocity from `getPlayerHurtVelocity`.
8. Play `player-hurt`.
9. Start prototype hurt blink tween.
10. After `420ms`, apply `getPlayerHurtRecoveryState`.
11. After `900ms`, apply `getPlayerInvulnerabilityRecoveryState`, stop blink, and restore alpha to `1`.

Death flow:

1. If damage outcome is defeated, call `defeatPlayer('damage')`.
2. If `isPlayerOutsideWorldBounds` returns true during update, call `defeatPlayer('fall')`.
3. `defeatPlayer` checks `canEnterPlayerDefeat`.
4. Apply `getPlayerDefeatEntryState`.
5. Cancel active attack and remove active hitboxes.
6. Set horizontal acceleration to `0`.
7. Set velocity to `{ x: 0, y: defeatOutcome.velocityY }`.
8. Disable or ignore player control while dead.
9. Play `player-death`.
10. After `700ms`, respawn.

Respawn flow:

1. Apply `getPlayerRespawnState`.
2. Restore health to `3`.
3. Move player to `stageMap.player.spawn`.
4. Set player velocity to `0, 0`.
5. Re-enable body if disabled.
6. Play `player-idle`.
7. Reset jump state using the existing movable actor jump state factory.
8. Keep existing enemy defeat state as-is.

This slice uses a direct delayed respawn after `700ms`; camera fade is not included.

## Bounds Rule

The fall/death rule is based on the world rectangle, not only `y > worldHeight`.

The domain function should return `true` when:

- `x < -margin`
- `x > worldWidth + margin`
- `y < -margin`
- `y > worldHeight + margin`

Use a margin so the player can be partly outside the camera/world edge without immediate death. This design uses `PLAYER_OUT_OF_BOUNDS_MARGIN = 128`.

## Interaction With Existing Attack Slice

This slice must preserve the existing attack behavior, with these additions:

- `canStartMeleeAttack` receives the actual `isHurting` state instead of hard-coded `false`.
- Dead players cannot start attacks.
- Hurt and death cancel current attack state.
- Hurt and death clear active hitboxes.
- Attack animation priority remains, but hurt/death have higher priority than attack.

## Tests

Domain tests:

- enemy contact hit is allowed only when not invulnerable, not hurting, enemy not defeated, not homing attacking, and not dead.
- player damage is blocked by invulnerable, hurting, homing attacking, crouching, or dead.
- max health is `3`.
- hit damage is `1`.
- health `3` becomes survived health `2`.
- health `1` becomes defeated health `0`.
- hurt entry sets hurting and invulnerable, cancels attacking, and disables attack readiness.
- hurt recovery clears hurting and restores attack readiness.
- invulnerability recovery clears invulnerable.
- damage death velocity is `-160` for normal gravity.
- fall death velocity is `0`.
- knockback direction is left when player is left of source, right when aligned or right of source.
- hurt velocity uses `360` horizontal and `-360 * gravitySign` vertical.
- respawn state restores health to `3`, clears hurt/death/invulnerability, and restores attack readiness.
- world bounds detects all four sides using `PLAYER_OUT_OF_BOUNDS_MARGIN`.

Actor metadata tests:

- `playerActorDefinition.sprites.hurt` matches prototype values.
- `playerActorDefinition.sprites.death` matches prototype values.
- stage asset refs include root public hurt/death assets.

Renderer tests:

- preloads and registers `player-hurt` and `player-death`.
- copies/uses root public asset paths, never `__prototype__`.
- enemy contact reduces health from 3 to 2 and plays hurt animation.
- hurt contact applies knockback away from enemy.
- while hurting, repeated enemy overlap does not reduce health again.
- after `420ms`, hurting clears and attack readiness returns.
- after `900ms`, invulnerability clears and alpha returns to `1`.
- third enemy hit plays death animation and schedules respawn.
- damage death respawns at stage spawn with full health.
- moving outside each world edge by more than margin causes fall death and respawn.
- defeated enemies do not hurt the player.
- hurt/death cancels active attack and clears active hitboxes.
- dead players do not move, attack, or take further contact damage before respawn.

## Acceptance Criteria

- Pressing movement controls still works as before when the player is not hurt or dead.
- Contacting Armor Guard or Azure Core while it is active hurts the player.
- The player can take exactly three normal hits before death.
- After death, the player respawns at the stage spawn with full health.
- Moving outside any side of the world bounds causes death and respawn.
- `player_hurt` and `player_death` assets exist under root `public/assets`.
- No rebuilt runtime code imports from `__prototype__`.
- The required checks pass:
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `git diff --check`
