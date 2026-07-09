# Gameplay Boss Battle Design

## Goal

Rebuild the Prototype boss battle behavior in the new gameplay architecture:

- boss stages are playable `*-6` stages that contain the `boss-prototype` Azure Core enemy.
- the boss uses Prototype-matching multi-phase bullet patterns.
- boss projectiles damage the player unless the player blocks them by crouching.
- hitting the boss advances the phase until the final hit defeats the boss.
- each phase transition clears active projectiles, resets the player to the stage entrance state, and restarts the boss pattern after a short delay.
- the implementation must be TDD-first and must not import or copy Prototype runtime code.

The rebuilt result should look and feel like the Prototype behavior while fitting the current DDD + functional core + reactive presentation split.

## Prototype References

Use these Prototype files as behavioral references only:

- `__prototype__/src/domain/boss/bossRules.ts`
- `__prototype__/src/domain/boss/projectileRules.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`
- `__prototype__/src/App.svelte`
- `__prototype__/src/i18n.ts`

Do not import from `__prototype__`, paste Prototype implementation blocks, or add new source files inside `__prototype__`.

## Architecture

### Domain Layer

Create pure domain modules under `src/domain/gameplay/`:

- `bossBattle.ts`
- `bossProjectile.ts`

These modules must contain no Svelte, Phaser, DOM, timers, random values, asset loading, or mutable runtime objects. They expose deterministic functions and typed values that the renderer can consume.

`bossBattle.ts` owns:

- boss stage detection.
- phase count and phase progression.
- boss volley cadence.
- phase-specific volley shot definitions.
- boss HUD phase display values.
- player reset state after a non-final boss hit.
- eligibility decisions for pattern start, pattern tick, boss hit, support-core reset, homing run reset, and respawn pattern restart.

`bossProjectile.ts` owns:

- projectile lifetime.
- expanded world-boundary checks.
- projectile hit decisions.
- lifecycle decisions.
- velocity projection from angle and speed.

### Stage Data Boundary

The existing stage source data already preserves boss metadata:

- `id: "boss-prototype"`
- `type: "azure-core"`
- `respawnPolicy: "persistent"`
- `countsForScore: true`

The converter must keep enough runtime metadata in `GameplayStageMap` to let the renderer distinguish the boss prototype from ordinary Azure Core enemies without consulting `__prototype__`. The stage map may add optional enemy fields when they are needed by the renderer, but the pure domain rules remain the source of decisions.

Boss stage definition:

- `stage.id` ends with `-6`
- `stage.enemies` includes an enemy with `id === "boss-prototype"`

Non-boss `*-6` stages or non-`*-6` stages with a coincidental boss id must not start boss behavior.

### Renderer Boundary

`src/ui/gameplay/createGameplayRenderer.ts` remains the Phaser adapter. It may own Phaser runtime handles:

- boss prototype runtime reference.
- active boss projectiles.
- boss pattern timer event.
- current boss phase.
- boss shot index.
- boss pattern generation id.

Renderer responsibilities:

- create a generated `boss-projectile` texture matching the Prototype glowing orb presentation.
- start the boss pattern after the scene is ready on boss stages.
- spawn projectiles at the boss sprite center using domain-authored shots.
- update projectile lifecycle every frame.
- apply projectile hits through the existing player damage flow.
- route melee and homing hits against `boss-prototype` to boss phase progression, not ordinary enemy defeat.
- clear projectiles during phase transitions, player defeat, respawn, and stage clear.
- stop stale timer callbacks through generation checks.

The renderer must not hard-code phase shot math beyond calling the domain functions.

## Prototype-Matching Rules

### Phase Count

Default boss phase count is `4`.

Visible HUD display is one-based:

- phase state `0` displays `1 / 4`
- phase state `1` displays `2 / 4`
- phase state `2` displays `3 / 4`
- phase state `3` displays `4 / 4`
- phase state `4` remains displayed as `4 / 4` if queried after defeat

Non-boss stages display `0 / 0` in state and do not render the boss phase panel.

### Pattern Cadence

The boss volley delay is:

```text
max(540, 980 - phase * 90)
```

During the four playable phases this produces:

- phase `0`: `980ms`
- phase `1`: `890ms`
- phase `2`: `800ms`
- phase `3`: `710ms`

The renderer fires one volley immediately when a pattern starts, then schedules repeating volleys with this delay.

### Volley Patterns

Each shot has `{ angle, speed }`.

Phase `0`:

- one aimed shot toward the player.
- speed `330`.

Phase `1`:

- three sweeping leftward shots.
- sweep is `sin(shotIndex * 0.72) * 0.36`.
- angles are `PI + sweep - 0.2`, `PI + sweep`, `PI + sweep + 0.2`.
- speed `350`.

Phase `2`:

- alternating biased shots.
- vertical bias is `-0.5` on even `shotIndex`, `0.5` on odd `shotIndex`.
- two shots use angles `PI + verticalBias - 0.16` and `PI + verticalBias + 0.16`.
- speed `390`.
- even `shotIndex` additionally fires one aimed shot at speed `360`.

Phase `3`:

- five radial shots.
- angles are `PI / 2 + (PI * index) / 4 + shotIndex * 0.1`, for index `0..4`.
- speed `390`.

Unknown phases produce no shots.

### Projectiles

Projectile constants:

- lifetime: `7200ms`
- bounds margin: `80`
- hit distance: `42`

Projectile lifecycle:

- outside expanded world bounds: destroy immediately.
- expired but still inside bounds: fade out.
- neither outside nor expired: keep.
- outside wins over expired.

Projectile hit:

- dead player: ignore.
- distance greater than or equal to hit distance: ignore.
- crouching player inside hit distance: block and destroy the projectile.
- alive, non-crouching player inside hit distance: destroy projectile and apply player damage from projectile x position.

Projectile velocity is:

```text
x = cos(angle) * speed
y = sin(angle) * speed
```

### Boss Hits And Phases

The boss can be hit only when the boss exists and is not defeated.

On a non-final hit:

- increment `bossPhase`.
- stop the active pattern event.
- clear all active projectiles with a short fade.
- play the boss hurt presentation.
- reset player state to:
  - health: max player health.
  - attacking: false.
  - homingAttacking: false.
  - attackReady: true.
- return the player to the stage entrance/respawn start used by the Prototype behavior.
- restart the next phase pattern after `620ms`.
- update HUD phase display and status message.

On final hit:

- increment `bossPhase` to the phase count.
- stop the active pattern event.
- clear all active projectiles.
- mark the boss as defeated.
- disable the boss body.
- play the boss defeat presentation.
- reveal and enable the stage goal if it was locked by the boss battle.
- update HUD/status.
- allow the stage to be cleared.

### Goal Locking

Boss-stage goals are not visible or interactable before the boss is defeated.

- On boss stages, the renderer creates the goal from the same rebuild-owned goal actor definition, then hides it and disables its body while `boss-prototype` is undefeated.
- Player overlap with the locked goal must not clear the stage.
- The final boss hit reveals the goal, reenables the goal body, and clears any pre-clear tint so the player can finish the stage through the normal goal overlap path.
- Non-boss stages keep the goal visible and enabled from scene creation.

### Homing Attack Interaction

If a homing hit targets the boss before the final playable phase, it resets the boss run flow:

- phase progresses through the boss-hit outcome.
- active projectile state is cleared.
- player state is reset as described above.

If the homing hit targets the boss in the final playable phase, it should complete the boss defeat path.

Homing hits on non-boss Azure Cores continue to use existing ordinary enemy defeat behavior.

### Respawn And Stage Clear

On player defeat in a boss stage:

- stop the active boss pattern.
- clear active boss projectiles.
- keep the current boss phase.

After player respawn:

- restart the boss pattern if the stage is a boss stage and `bossPhase < phaseCount`.
- do not restart if the boss has already been defeated.

On stage clear:

- stop boss patterns.
- clear projectiles.
- do not emit further boss volleys.

## HUD And Localization

`GameplayHudState` gains:

- `bossPhase: number`
- `bossPhaseMax: number`

Initial non-boss state is `0 / 0`.

Boss stages render a boss phase panel while not cleared. The panel matches the Prototype structure:

- label: `hud.bossPhase`
- value: current one-based phase and max phase.
- hint: `hud.bossPhaseHint`

Objective copy is localization-key based:

- non-boss: `stage.objective.reachGoal`
- boss: `stage.objective.defeatBoss`

Boss status messages are localization-key based:

- `status.bossPattern`
- `status.bossVulnerable`
- `status.bossDefeated`

Do not hard-code visible gameplay UI copy directly in Svelte or Phaser code.

## Visual Presentation

Boss projectiles are generated Phaser textures rather than imported bitmap assets. They should visually match the Prototype glowing orb:

- texture key: `boss-projectile`
- size: `28 x 28`
- additive blend mode.
- depth above player/enemies, matching Prototype depth `16`.
- no gravity.
- velocity from the domain projectile velocity function.

Boss sprite uses the current Azure Core presentation for `boss-prototype` unless a later boss art slice replaces it. The White Palace boss Priestess cast, hurt, and death spritesheets are copied into root `public/assets/sprites/` and represented through a domain asset manifest so a later rendering slice can switch from generated Azure Core presentation to bitmap boss art without consulting `__prototype__`.

## Testing Requirements

Use TDD for every behavior change.

Domain tests:

- boss phase count and phase progression.
- pattern delay constants and clamping.
- all four volley patterns.
- boss stage detection.
- boss HUD phase display.
- boss hit eligibility.
- boss pattern start/tick eligibility.
- support-core reset decision.
- homing reset decision.
- respawn pattern restart decision.
- projectile lifetime and bounds.
- projectile hit decision, including crouch block.
- projectile lifecycle decision.
- projectile velocity.

Converter/catalog tests:

- converted boss stages preserve `boss-prototype` identity and runtime metadata.
- converted non-boss stages do not start boss behavior.
- no runtime asset or source path references `__prototype__`.

Renderer tests:

- boss stage scene starts a boss pattern.
- first pattern volley spawns projectiles immediately.
- phase-specific volleys produce the expected projectile count and velocities.
- projectiles are generated with no gravity, depth `16`, and additive blend.
- projectile hit damages the player through existing player damage flow.
- crouching blocks and destroys a projectile without damage.
- expired and out-of-bounds projectiles fade/destroy correctly.
- melee hit on boss advances phase instead of ordinary enemy defeat.
- homing hit on boss advances phase or defeats the boss.
- phase transition clears projectiles and resets the player.
- final hit defeats the boss and allows stage clear.
- boss-stage goal starts hidden with its body disabled, then becomes visible and enabled after final boss hit.
- player defeat stops the pattern and clears projectiles.
- respawn restarts the pattern only before the phase count.
- stale timer generations do not fire volleys.
- HUD patches include boss phase values.

UI/source tests:

- Gameplay HUD renders boss phase panel only on boss stages while uncleared.
- boss objective/status localization keys exist.
- White Palace boss Priestess cast, hurt, and death spritesheets exist under rebuild `public/assets/sprites/` and are referenced by rebuild asset paths.

## Verification

Before completion, run:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
- `rg -n "__prototype__" src public package.json`

The `rg` result may include tests that assert paths do not contain `__prototype__`, but runtime source must not reference Prototype paths.

## Out Of Scope

- Wiring the imported boss Priestess bitmap art into live boss rendering.
- Boss music routing.
- Dedicated one-off `1-6-boss-arena` stage registry.
- Moving platform and gravity-zone mechanics not already supported by the rebuilt renderer.
- Save/progression changes beyond clearing the existing stage result flow.

## Approved Direction

The selected approach is the complete Boss Runtime slice:

- implement pure domain boss rules first.
- wire converted boss metadata into runtime maps.
- wire Phaser projectile/pattern behavior as a data-driven adapter.
- add HUD phase state and localization-key rendering.
- verify through focused and full test suites before claiming completion.
