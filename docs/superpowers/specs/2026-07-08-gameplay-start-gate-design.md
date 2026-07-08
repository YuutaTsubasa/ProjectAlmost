# Gameplay Start Gate Design

## Context

The rebuilt gameplay scene currently starts simulation as soon as the Phaser scene updates. The HUD timer advances immediately, Armor Guard patrol velocity is applied during enemy creation, and gameplay systems run before the player has intentionally acted.

The prototype delays stage action until the intro lock has cleared and the player performs a gameplay input. It also protects against held input during scene entry: if movement, crouch, jump, or attack is already held when the stage becomes controllable, the stage does not start until the player releases all gameplay input and presses again.

This design rebuilds that behavior without importing prototype code.

## Goals

- Keep gameplay visually present before the first intentional input.
- Do not advance gameplay elapsed time before the gate starts.
- Do not move enemies or future mechanisms before the gate starts.
- Preserve the prototype arming behavior so held input at stage entry does not start gameplay.
- Keep the rules in pure domain code and keep Phaser as the renderer/runtime adapter.
- Make the implementation testable with TDD before production changes.

## Non-Goals

- Rebuilding the prototype AVG intro system in this step.
- Adding new moving mechanisms or boss behavior in this step.
- Changing pause menu behavior beyond preserving the existing paused-time exclusion.
- Copying or runtime-importing code from `__prototype__/`.

## Domain Model

Add a gameplay start gate domain module under `src/domain/gameplay/`.

The gate state is a discriminated union:

- `waiting-unarmed`: initial state. Gameplay input is not yet eligible to start the stage.
- `waiting-armed`: all gameplay input has been released at least once, so the next gameplay input may start the stage.
- `running`: gameplay simulation is active.

The domain input snapshot represents only gameplay-start-relevant input:

- `leftHeld`
- `rightHeld`
- `crouchHeld`
- `jumpPressed`
- `jumpHeld`
- `attackPressed`
- `attackHeld`

The rules are:

- `waiting-unarmed` stays unarmed while any gameplay input is held or pressed.
- `waiting-unarmed` becomes `waiting-armed` once no gameplay input is active.
- `waiting-armed` stays armed while no gameplay input is active.
- `waiting-armed` becomes `running` when movement, crouch, jump, or attack input is active.
- `running` stays running.
- Pause, back, menu navigation, and other system inputs are not represented in this snapshot and cannot start gameplay.

This keeps the feature independent from Phaser, Svelte, browser APIs, timers, and the pause menu.

## Renderer Integration

`createGameplayRenderer.ts` owns the runtime gate state and feeds it from Phaser keyboard/gamepad/virtual input.

On scene creation:

- Initialize the gate to `waiting-unarmed`.
- Initialize gameplay elapsed time to `0`.
- Create enemies without active patrol velocity. Armor Guard direction can be stored, but the sprite velocity remains `0` until gameplay is running.
- Emit the initial HUD with `00:00.00`.

On each scene update:

- Read the current gameplay input snapshot first.
- Advance the gate through the pure domain function.
- If the gate is not `running`, do not advance gameplay elapsed time, enemy patrol, player movement, attacks, homing attack, collectibles, checkpoints, hazards, out-of-bounds checks, or future mechanisms.
- While waiting, keep non-simulation presentation safe to update, such as background parallax and HUD marker/progress patches that do not mutate gameplay state.
- On the frame that transitions to `running`, continue through the normal gameplay update so the first starting input is honored immediately.
- Once running, all existing gameplay systems continue through the same paths they use today.

This gives future mechanisms a single question to answer: whether they should update only when the start gate is running.

## Reactive And Application Boundaries

No new Svelte-visible state is required for this step. The current HUD stays reactive through existing renderer HUD patches.

If a future UI needs to display "ready" or "press any action" copy, it should consume a localized application-level view model rather than reading Phaser state directly. This step deliberately avoids adding visible text.

## Prototype Parity Notes

The target behavior is:

- Loading into gameplay does not start the timer.
- Holding a gameplay key before the stage is controllable does not start the timer or enemies.
- Releasing all gameplay keys arms the stage.
- Pressing movement, crouch, jump, or attack starts gameplay.
- The first valid input both starts the stage and takes effect in that same update.
- Armor Guard and future mechanisms remain still while waiting.
- Pause/back input does not start gameplay.

The rebuild may keep the player sprite visible before start because the current rebuilt scene already presents the player immediately. The important parity point for this step is simulation start timing, not adding the prototype AVG sequence.

## Testing Strategy

Use TDD in two layers.

Domain tests:

- Initial gate starts as `waiting-unarmed`.
- Held input keeps the gate unarmed.
- No active input arms the gate.
- Armed gate starts on left, right, crouch, jump, or attack.
- Running gate stays running.
- Empty/system-free input never starts from unarmed or armed.

Renderer tests:

- Scene creation emits the initial HUD timer as `00:00.00`.
- Updating before the gate is running does not advance gameplay elapsed time.
- Armor Guard velocity stays `0` before the gate is running.
- Held input during the first update does not start gameplay until all gameplay input is released and pressed again.
- The frame that starts the gate advances through gameplay so the starting movement input is applied.
- Existing paused-time exclusion still works after the gate has started.

Full verification after implementation should include:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Implementation Constraints

- Do not import or copy runtime code from `__prototype__/`.
- Keep all start-gate decisions pure in `src/domain/gameplay/`.
- Keep Phaser reads and sprite mutation inside `src/ui/gameplay/createGameplayRenderer.ts`.
- Keep the scope limited to starting simulation; do not introduce new UI copy, AVG, enemies, mechanisms, or result behavior.
