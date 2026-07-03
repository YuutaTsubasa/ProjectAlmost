# Gameplay Hazards / Traps Design

## Goal

Port the first rebuilt Hazards / Traps gameplay slice from `__prototype__/` into the rebuilt gameplay scene.

This slice makes these behaviors true in rebuilt gameplay:

- Stage data can place fixed hazards on a gameplay map.
- The first implemented hazard is the prototype `spikes` trap.
- Spike visuals are copied from prototype assets into rebuild-owned runtime assets.
- Player contact with a hazard routes through the existing player life state rules.
- Hazard contact respects hurt state, invulnerability, Homing Attack, and death.
- Fatal hazard contact uses the existing death transition and respawn flow.
- Hazard rules remain in pure domain code; Phaser owns rendering, physics overlaps, and runtime sprite state.

## Scope

This slice is gameplay-only.

It includes:

- Fixed hazard stage data for gameplay maps.
- The `spikes` hazard type and its floor, ceiling, left-wall, and right-wall orientations.
- Rebuild-owned copy of `emerald_sanctuary_spikes.webp`.
- Pure player hazard hit gate.
- Pure hazard presentation helpers for frame selection, placement, and body dimensions.
- Phaser static hazard sprites and Arcade overlap wiring.
- Hazard contact damage using the existing player life state, hurt recovery, invulnerability recovery, knockback, and death transition.
- Renderer tests using a test-only gameplay map with hazards.

It intentionally does not include:

- Full 2-1 stage migration.
- Moving platforms, checkpoints, goals, score, rank, save data, or stage progression.
- Lava hazard rendering or behavior.
- Laser behavior.
- Falling hazard behavior.
- Trap timing, activation/deactivation cycles, projectiles, or moving damaging bodies.
- HUD or localization copy for hazard damage.
- Sound effects for hazard contact.

Laser and falling hazards remain future extensions of the hazard object system. They should not be implemented in this slice because the prototype runtime currently provides concrete behavior for fixed `spikes` and `lava` hazards, not laser or falling hazard rules.

## Prototype Reference

Prototype behavior lives mainly in:

- `__prototype__/src/game/stages/stageTypes.ts`
- `__prototype__/src/game/stages/2-1.json`
- `__prototype__/src/domain/placement/objectDefinitions.ts`
- `__prototype__/src/domain/placement/objectDefinitions.test.ts`
- `__prototype__/src/domain/player/hurtRules.ts`
- `__prototype__/src/domain/player/hurtRules.test.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`
- `__prototype__/public/assets/props/emerald_sanctuary_spikes.webp`

Prototype values and behavior to preserve:

- Hazard stage shape:

```ts
type HazardRect = {
  id: string
  type: 'spikes' | 'lava'
  x: number
  surfaceY: number
  width: number
  height: number
  orientation?: 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
}
```

- Spikes are fixed hazards with no gravity.
- Spikes use origin `{ x: 0.5, y: 0.5 }`.
- Spikes use `visualBottomInset = 14`.
- Spike center Y for floor placement is `surfaceY - height / 2 + visualBottomInset`.
- Spike frame by orientation:
  - floor or missing orientation: frame `0`
  - right-wall: frame `2`
  - left-wall: frame `3`
  - ceiling: frame `4`
- Spike display size comes from stage data `width` and `height`.
- Spike Arcade body size is `width * 0.86` by `height * 0.56`.
- Spike Arcade body offset is `width * 0.07` by `height * 0.36`.
- Player overlap with a hazard passes the hazard sprite X as the damage source.

Prototype 2-1 hazard data confirms 2-1 is the first trap-heavy reference stage. It includes five floor spike beds:

- `first-thorn-bed`
- `lift-thorns`
- `ferry-thorn-bed`
- `canopy-thorn-bed`
- `final-thorn-bed`

The rebuilt project should not import prototype JSON at runtime. Hazard data used in rebuild maps must live in rebuild-owned domain files.

## Architecture

### Domain: Hazard Actor

Create `src/domain/gameplay/hazardActor.ts`.

This module is pure Functional core. It must not import Phaser, Svelte, DOM APIs, timers, random sources, assets, or `__prototype__`.

It owns:

- Hazard type names.
- Hazard orientation names.
- Spike asset metadata.
- Spike placement helpers.
- Spike frame selection.
- Spike physics body presentation values.

Public API:

```ts
export type GameplayHazardType = 'spikes'
export type GameplayHazardOrientation = 'floor' | 'ceiling' | 'left-wall' | 'right-wall'

export type HazardSpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
}

export const hazardActorDefinitions: Record<GameplayHazardType, {
  behavior: 'fixed-damage'
  sprite: HazardSpriteDefinition
  origin: { x: number; y: number }
  visualBottomInset: number
}>

export function getHazardFrameIndex(input: {
  orientation?: GameplayHazardOrientation
}): number

export function getGroundedHazardCenterY(input: {
  surfaceY: number
  height: number
  type: GameplayHazardType
}): number

export function getHazardBodyPresentation(input: {
  width: number
  height: number
  type: GameplayHazardType
}): {
  width: number
  height: number
  offsetX: number
  offsetY: number
}
```

Rules:

- `hazardActorDefinitions.spikes.sprite.assetRef` points to `/assets/props/emerald_sanctuary_spikes.webp`.
- `getHazardFrameIndex` returns the prototype frame mapping.
- `getGroundedHazardCenterY` uses the prototype visual bottom inset.
- `getHazardBodyPresentation` returns the prototype spike body dimensions and offsets.
- The API is deliberately small so future `lava`, `laser`, or `falling` hazards can add behavior without changing stage map consumers.

### Domain: Player Life

Extend `src/domain/gameplay/playerLife.ts`.

Add a hazard-specific gate:

```ts
export function canApplyPlayerHazardHit(input: {
  invulnerable: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean
```

Rules:

- Returns `true` only when the player is not invulnerable, not already hurting, not Homing attacking, and not dead.
- Unlike the generic `canApplyPlayerDamage`, this gate must not consider crouching. Prototype hazard contact checks a hazard-specific gate first, then applies normal hit state.
- Stage-clear blocking is not included yet because the rebuilt gameplay scene does not have stage clear state. A future goal/checkpoint/stage-clear slice can add that state explicitly.
- The existing `getPlayerDamageOutcome`, `getPlayerHurtEntryState`, `getPlayerHurtVelocity`, `getPlayerDefeatEntryState`, `getPlayerDefeatOutcome`, and respawn helpers remain the source of truth for consequences after a hazard hit is allowed.

### Stage Data

Extend `src/domain/gameplay/gameplayMapTypes.ts`.

Add:

```ts
export type GameplayHazardSpawn = {
  id: string
  type: 'spikes'
  x: number
  surfaceY: number
  width: number
  height: number
  orientation?: 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
}
```

Add `hazards: readonly GameplayHazardSpawn[]` to `GameplayStageMap`.

For the existing rebuilt `1-1` map, use `hazards: []`. This keeps the playable 1-1 route unchanged while making the data contract explicit.

Do not add a full `2-1` gameplay map in this slice. The prototype 2-1 data depends on other systems that are outside this scope, including moving platforms, more stage layout, and stage progression objects. Renderer tests should use a test-only map derived from 1-1 with hazards added.

### Assets

Copy this prototype asset:

- From: `__prototype__/public/assets/props/emerald_sanctuary_spikes.webp`
- To: `public/assets/props/emerald_sanctuary_spikes.webp`

The rebuild runtime must load the root-level `public/` asset and must not reference `__prototype__`.

The prompt sidecar file is not required at runtime. It can remain in `__prototype__` unless an asset documentation slice later decides to copy prompt metadata.

### Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Runtime state additions:

```ts
type HazardRuntime = {
  sprite: Phaser.Physics.Arcade.StaticImage
  spawn: GameplayHazardSpawn
}
```

Scene fields:

- `hazards: HazardRuntime[] = []`

Startup:

- Preload the spike spritesheet using the hazard actor definition.
- Create hazard sprites after terrain is ready and before overlap wiring.
- Use static physics images.
- Set origin from the hazard actor definition.
- Set frame from `getHazardFrameIndex`.
- Set display size from stage data.
- Set depth `8`, matching prototype hazards.
- Refresh the body after display sizing.
- Set body size and offset from `getHazardBodyPresentation`.

Physics wiring:

- Add player overlap for every hazard.
- On overlap, call `handlePlayerHazardContact(hazard)`.
- The overlap callback should pass hazard sprite X as the source X for knockback.

Contact flow:

```ts
private handlePlayerHazardContact(hazard: HazardRuntime): void
```

The flow should:

- Return when no player exists.
- Return when `canApplyPlayerHazardHit(...)` blocks contact.
- Call `getPlayerDamageOutcome({ currentHealth: this.playerHealth })`.
- Write `this.playerHealth = damageOutcome.nextHealth`.
- If defeated, call `defeatPlayer('damage')`.
- Otherwise enter the same hurt, invulnerability, knockback, animation, blink tween, and recovery flow currently used by enemy contact.

To avoid duplicating enemy and hazard damage consequences, the renderer should extract a small private helper:

```ts
private applyPlayerContactDamage(sourceX: number): void
```

Enemy contact keeps enemy-specific gating in `handlePlayerEnemyContact`, then calls the shared damage helper. Hazard contact uses hazard-specific gating, then calls the same helper.

This helper remains a Phaser adapter detail, not domain code, because it mutates scene state, plays animations, starts tweens, and schedules delayed recovery.

## Testing

Use TDD for each behavior slice.

### Domain Tests

Add `src/domain/gameplay/hazardActor.test.ts`.

Cover:

- Spike definition points at `/assets/props/emerald_sanctuary_spikes.webp`.
- Spike behavior is `fixed-damage`.
- Spike visual bottom inset is `14`.
- Floor or missing orientation maps to frame `0`.
- Right wall maps to frame `2`.
- Left wall maps to frame `3`.
- Ceiling maps to frame `4`.
- Floor center Y uses `surfaceY - height / 2 + 14`.
- Spike body size and offset use prototype ratios.

Extend `src/domain/gameplay/playerLife.test.ts`.

Cover:

- `canApplyPlayerHazardHit` allows an active player.
- It blocks while invulnerable.
- It blocks while already hurting.
- It blocks during Homing Attack.
- It blocks after death.

Extend `src/domain/gameplay/gameplayStageMaps.test.ts`.

Cover:

- Every gameplay stage map exposes `hazards`.
- `1-1` starts with an empty hazard list.
- No gameplay map asset refs point into `__prototype__`, including hazard assets.

### Renderer Tests

Extend `src/ui/gameplay/createGameplayRenderer.test.ts`.

Use a test-only gameplay stage map derived from the existing 1-1 map with one or more spike hazards. This proves the runtime behavior without requiring a full 2-1 migration.

Cover:

- The renderer preloads the spike spritesheet from the rebuild asset path.
- It creates static hazard sprites from stage data.
- It sets hazard frame, display size, body size, body offset, and depth from domain helpers.
- It wires player overlap with hazards.
- Hazard overlap reduces player health and enters hurt/invulnerable state.
- A second hazard overlap during invulnerability does not reduce health again.
- Hazard overlap during Homing Attack is blocked.
- Hazard overlap while dead is blocked.
- Fatal hazard overlap starts the existing death transition and respawn path.

Renderer tests should not assert prototype file paths. They should assert rebuild asset refs and observable scene behavior.

## Data Flow

1. `GameplayStageMap.hazards` defines fixed hazard spawn data.
2. The renderer loads hazard sprite assets from `hazardActorDefinitions`.
3. The renderer creates one static physics object per hazard spawn.
4. Arcade overlap detects player contact.
5. `canApplyPlayerHazardHit` decides whether the hit can apply.
6. The renderer applies shared player contact damage consequences.
7. Existing player life helpers determine hurt, invulnerability, death, and respawn behavior.

## Error Handling And Boundaries

- Missing hazards use an empty array at the data boundary.
- Runtime code must not read prototype JSON or load prototype assets.
- Domain code must not import Phaser or mutable runtime objects.
- The renderer owns all Phaser object mutation, delayed calls, tweens, and physics body setup.
- Hazard contact must be idempotent under invulnerability and death gates.
- The existing out-of-bounds fall defeat remains separate from contact damage.

## Future Extensions

This slice should make future hazards easier without implementing them now:

- `lava` can reuse fixed-damage behavior with different sprite/body presentation.
- `laser` should likely add active/inactive timing and beam geometry.
- `falling` hazards should likely be modeled as movable actors with state-machine integration, not static hazards.
- A full 2-1 migration can later copy prototype spike coordinates into rebuild-owned stage data after moving platform and stage progression dependencies are ready.
- Stage clear gating can extend `canApplyPlayerHazardHit` once rebuilt stage clear state exists.

## Acceptance Criteria

- The hazards/traps spec is committed before implementation planning begins.
- The spike asset is copied into root `public/assets/props/`.
- Rebuild stage map types support fixed hazards.
- Existing 1-1 map remains playable without hazards.
- Pure domain tests cover hazard actor presentation and hazard hit gating.
- Renderer tests prove spike rendering and player contact behavior.
- Hazard contact integrates with existing hurt, invulnerability, death transition, and respawn behavior.
- No runtime code imports from or references `__prototype__`.
