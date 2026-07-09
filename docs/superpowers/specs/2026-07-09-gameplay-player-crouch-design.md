# Gameplay Player Crouch Design

Date: 2026-07-09

## Scope

This slice ports the player crouch behavior from `__prototype__/` into the rebuilt gameplay scene.

It makes these behaviors true in rebuilt gameplay:

- holding ArrowDown or `S` while grounded enters crouch.
- crouch uses the Prototype `player-crouch` animation and rebuild-owned runtime asset path.
- crouch is blocked while airborne, attacking, hurting, dead, or stage-cleared.
- crouching stops normal horizontal movement.
- crouching prevents melee and Homing attack starts.
- crouching lets crouch-blockable boss projectiles pass through without damage and blocks player contact damage paths that already accept crouch state.
- jumping or leaving an eligible crouch state exits crouch and restores the normal player body.

This slice does not add gamepad controls, virtual controls, ice-specific movement, new audio, new HUD copy, new level content, or ceiling/stand-up clearance checks. The rebuild currently has no low-ceiling traversal requirement, so standing up immediately when input is released is acceptable.

## Current Context

The rebuild already has:

- `src/domain/gameplay/playerActor.ts` for player sprite, body, movement, and jump metadata.
- `src/domain/gameplay/playerAttack.ts` with a `crouching` gate in `getAttackInputDecision`.
- `src/domain/gameplay/playerLife.ts` with `crouching` inputs for contact damage decisions.
- `src/domain/gameplay/bossProjectile.ts` with crouch pass-through support.
- `src/domain/gameplay/gameplayStartGate.ts` that treats crouch input as gameplay input.
- `src/ui/gameplay/createGameplayRenderer.ts` polling ArrowDown and `S`, but only for start-gate input.

The renderer does not yet keep a real crouch state. It currently passes `crouching: false` to attack and life decisions, and boss projectile handling cannot observe a real crouch posture.

## Prototype Reference

Use these Prototype files as behavior and visual references only:

- `__prototype__/src/domain/player/crouchRules.ts`
- `__prototype__/src/domain/player/animationRules.ts`
- `__prototype__/src/domain/player/movementRules.ts`
- `__prototype__/src/domain/player/attackRules.ts`
- `__prototype__/src/domain/player/hurtRules.ts`
- `__prototype__/src/domain/boss/projectileRules.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`
- `__prototype__/public/assets/sprites/player_crouch/sheet-transparent.webp`

Do not import Prototype source, paste Prototype implementation blocks, or add new files under `__prototype__/`.

Prototype crouch rules to preserve:

- crouch requires held crouch input.
- crouch requires grounded state.
- crouch is rejected while attacking.
- crouch is rejected while hurting.
- crouch animation key is `player-crouch`.
- crouch animation frames are `0..3`, frame rate `5`, repeat `-1`.
- crouching takes animation priority over grounded idle/run, but airborne jump takes priority over crouch.
- attack input is ignored while crouching.
- boss projectiles inside hit distance pass through without damage when the player is crouching.

## Architecture

Keep crouch as a small player-state slice rather than folding it into a large controller rewrite.

The boundary remains:

1. Phaser adapter reads input and grounded/body facts.
2. Domain pure functions decide whether crouch is active and which body/animation/movement result applies.
3. Phaser adapter applies the resulting commands to sprites, Arcade body, and existing attack/life/boss-projectile calls.

This keeps the Functional core deterministic while preserving Phaser as the side-effect adapter.

## Domain Model

Extend `src/domain/gameplay/playerActor.ts`.

Add `crouch` to `PlayerAnimationKey` and `playerActorDefinition.sprites`.

The crouch sprite definition:

- key: `player-crouch`
- asset ref: `/assets/sprites/player_crouch/sheet-transparent.webp`
- frame width: `128`
- frame height: `128`
- frame start: `0`
- frame end: `3`
- frame rate: `5`
- repeat: `-1`
- scale: `0.78`

Add a player body-pose model:

```ts
export type PlayerBodyPose = 'standing' | 'crouching'

export type PlayerBodyDefinition = {
  width: number
  height: number
  offsetX: number
  offsetY: number
}
```

`playerActorDefinition.body` remains the standing body:

- width `34`
- height `72`
- offset X `47`
- offset Y `42`

Add `playerActorDefinition.crouch.body` for the crouch pose. The crouch body must be shorter than the standing body and keep the physics feet grounded by increasing `offsetY` by the removed height. The crouch spritesheet must also keep its visible foot baseline aligned with the standing visible foot baseline so the sprite does not appear to float while the physics body remains stable. The exact dimensions and visible foot baseline are owned by the rebuild domain manifest and verified by tests.

Add pure functions:

- `canPlayerCrouch(input)`
- `getPlayerCrouchState(input)`
- `getPlayerBodyDefinition(input)`
- `getPlayerHorizontalMovementDecision(input)` extended with `crouching`

`canPlayerCrouch` input:

```ts
{
  crouchHeld: boolean
  grounded: boolean
  attacking: boolean
  hurting: boolean
  dead: boolean
  stageCleared: boolean
}
```

Rules:

- returns true only when `crouchHeld && grounded`.
- returns false when attacking, hurting, dead, or stage-cleared.

`getPlayerCrouchState` returns a boolean `crouching` value from current facts. The renderer can store it as `isCrouching`, but the decision remains pure and replayable.

`getPlayerBodyDefinition({ pose })` returns the standing or crouching body definition.

`getPlayerHorizontalMovementDecision` gains `crouching: boolean`. While crouching, it returns:

- direction `none`
- acceleration X `0`
- drag X `playerActorDefinition.movement.idleDragX`
- stop velocity X `true`

When not crouching, existing left/right/idle behavior remains unchanged, including left priority when both directions are held.

## Assets

Copy the Prototype crouch spritesheet into the rebuild runtime assets:

- from `__prototype__/public/assets/sprites/player_crouch/sheet-transparent.webp`
- to `public/assets/sprites/player_crouch/sheet-transparent.webp`

Runtime code and domain asset refs must use `/assets/sprites/player_crouch/sheet-transparent.webp`, not a Prototype path.

## Phaser Adapter

Update `src/ui/gameplay/createGameplayRenderer.ts`.

Scene state additions:

- `isCrouching: boolean`

Preload and animation registration:

- load `playerActorDefinition.sprites.crouch.assetRef`.
- create `player-crouch` animation from frames `0..3`, frame rate `5`, repeat `-1`.

Per-frame flow:

1. Read crouch input from ArrowDown or `S`.
2. Read grounded from `player.body.blocked.down || player.body.touching.down`.
3. Use domain crouch decision with current `isAttacking`, `isPlayerHurting`, `isPlayerDead`, and `stageCleared`.
4. Store `isCrouching`.
5. Apply the selected body definition when the body pose changes.
6. Pass real `isCrouching` into `getPlayerHorizontalMovementDecision`.
7. If horizontal decision says `stopVelocityX`, call `player.setVelocityX(0)`.
8. Pass real `isCrouching` into `getAttackInputDecision`.
9. Pass real `isCrouching` into player life and boss projectile damage decisions.
10. Play `player-crouch` while grounded and crouching unless an attack, hurt, death, Homing, or airborne jump presentation has priority.

Jump handling:

- A successful jump exits crouch immediately.
- The jump frame plays `player-jump`, not crouch.
- Restoring the body before jump velocity is applied is acceptable because jump leaves the crouch state.

Stage clear and death:

- entering stage clear restores standing body and clears `isCrouching`.
- entering player death restores standing body and clears `isCrouching`.
- player respawn starts standing.

## Animation Priority

Animation priority for this slice:

1. death/hurt/attack/Homing presentation preserves existing behavior.
2. airborne or jump-this-frame uses `player-jump`.
3. grounded crouch uses `player-crouch`.
4. grounded movement uses `player-run`.
5. grounded idle uses `player-idle`.

This keeps crouch integrated without replacing the whole animation model.

## Reactive Boundary

The Svelte screen remains the lifecycle owner for Phaser mount/unmount only.

Per-frame crouch state lives inside the Phaser scene because it depends on keyboard state, Arcade body grounded state, and animation/body side effects. Domain functions stay pure and do not import Phaser, Svelte, DOM, timers, random values, or Prototype modules.

## Testing Requirements

Use TDD for every implementation step.

Domain tests:

- `playerActorDefinition` includes the crouch sprite with rebuild asset path and Prototype animation metadata.
- crouch body is shorter than standing body and keeps feet aligned by increasing offset Y by the height delta.
- `canPlayerCrouch` allows crouch only when input is held, grounded, and not attacking, hurting, dead, or stage-cleared.
- `getPlayerCrouchState` exits crouch when input is released, when airborne, or when blocked by higher-priority states.
- `getPlayerBodyDefinition` returns standing and crouching body definitions by pose.
- `getPlayerHorizontalMovementDecision` stops horizontal movement while crouching and preserves existing left/right behavior while standing.

Renderer tests:

- preload includes `player-crouch` spritesheet.
- animation registration creates `player-crouch` frames `0..3`, frame rate `5`, repeat `-1`.
- holding ArrowDown or `S` while grounded plays crouch animation.
- crouch applies the crouch body and releasing input restores standing body.
- airborne crouch input does not play crouch animation.
- attack input while crouching does not create melee hitboxes or start Homing.
- crouching passes true into boss projectile handling and lets eligible projectile hits pass through without destroying the projectile or damaging the player.
- jumping exits crouch, restores standing body, and plays jump animation.
- hurt, death, respawn, and stage-clear paths clear crouch and restore standing body.

Verification before completion:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
- `rg -n "__prototype__" src public package.json` to confirm runtime code and assets do not reference Prototype paths, allowing tests that assert absence of Prototype paths.

## Risks

Changing the Arcade body while standing on terrain can shift collisions if the offset does not preserve the feet. The domain manifest and renderer tests must verify the crouch body keeps the bottom aligned with the standing body.

Crouch touches multiple existing systems: movement, animation, attack, life, and boss projectiles. Focused tests must cover those integration points so the implementation does not become a visual-only crouch that leaves gameplay decisions unaware of the crouch state.
