# Gameplay Virtual Controls Design

## Goal

Implement Prototype-compatible gameplay virtual controls in the rebuild so mouse, touch, and pointer play can use an on-screen joystick and action buttons, while keyboard and physical gamepad gameplay input hide the virtual controls.

This feature must follow the rebuild's TDD, DDD, FP, and Reactive conventions. Prototype code under `__prototype__/` is reference-only and must not be imported or copied into runtime code.

## User-Facing Requirements

- Virtual controls appear only after a mouse, touch, or pointer interaction on active gameplay.
- Virtual controls hide when keyboard gameplay input is used.
- Virtual controls hide when physical gamepad gameplay input is used.
- Hiding virtual controls clears any held virtual movement and crouch state so the player does not keep moving after switching input devices.
- Virtual controls do not appear while gameplay is paused, while pause settings are open, after stage clear/result is visible, or outside gameplay.
- The overlay provides:
  - a pause button
  - a left-side movement stick
  - a jump button
  - an attack button
- The movement stick maps:
  - horizontal drag left/right to left/right movement
  - downward drag beyond the crouch threshold to crouch held
  - release/cancel to neutral movement and crouch released
- Jump and attack virtual buttons emit edge-triggered gameplay presses.
- The presentation should match the Prototype layout closely: translucent left stick near the lower-left safe area, jump and attack buttons near the lower-right safe area, and a circular pause button near the upper-right area.

## Architecture

### Domain Layer

Add pure gameplay input models under `src/domain/input/`.

The domain owns:

- device-independent gameplay action snapshots
- virtual stick interpretation thresholds
- virtual-controls visibility decisions
- reset behavior when switching away from virtual input

Domain code must not import Svelte, Phaser, DOM, browser APIs, timers, or Prototype modules.

Proposed model:

```ts
export type GameplayInputSnapshot = {
  leftHeld: boolean
  rightHeld: boolean
  crouchHeld: boolean
  jumpPressed: boolean
  jumpHeld: boolean
  attackPressed: boolean
  attackHeld: boolean
  pausePressed: boolean
}

export type GameplayInputSource = 'none' | 'virtual-pointer' | 'keyboard' | 'gamepad'

export type VirtualStickVector = {
  x: number
  y: number
  radius: number
}

export type VirtualControlsState = {
  visible: boolean
  moveX: -1 | 0 | 1
  crouchHeld: boolean
}
```

Pure functions:

- `getVirtualStickInput(vector)`: convert pointer delta/radius into `moveX` and `crouchHeld`.
- `clearVirtualControlsState(state)`: hide controls and reset virtual movement/crouch.
- `getVirtualControlsVisibilityDecision(input)`: decide show/hide/keep when an input source is observed.
- `mergeGameplayInputSnapshots(inputs)`: combine keyboard, gamepad, and virtual snapshots without losing edge-triggered jump/attack presses.

Thresholds:

- horizontal movement activates when `abs(x / radius) > 0.28`.
- crouch activates when `y / radius > 0.55`.
- stick knob visual movement clamps to the stick radius.

### Svelte Reactive Boundary

`GameplayScreen.svelte` owns the browser interaction state:

- `virtualControlsVisible`
- current virtual movement/crouch state
- one-frame virtual jump and attack press pulses

Pointer/mouse/touch interaction on the active gameplay surface sets the virtual controls visible when gameplay is playable. Keyboard and gamepad gameplay inputs call the domain hide/reset decision and clear virtual state.

The virtual controls UI should be implemented as a focused Svelte component, for example `src/ui/gameplay/VirtualControls.svelte`. It receives plain props and emits callbacks:

- `onMove(moveX, crouchHeld)`
- `onJump()`
- `onAttack()`
- `onPause()`
- `onInteraction()` for showing/retaining virtual mode

The overlay must use `pointer-events: none` on the root and `pointer-events: auto` only on interactive controls, so it does not block unrelated gameplay rendering.

### Phaser Renderer Boundary

`createGameplayRenderer` remains the Phaser adapter. It should not listen to global custom events.

Extend the renderer input with a callback such as:

```ts
getInputSnapshot?: () => Partial<GameplayInputSnapshot>
```

The renderer combines its existing keyboard state, physical gamepad gameplay state, and the injected virtual snapshot into one per-frame gameplay input snapshot.

The renderer should use the combined snapshot for:

- start-gate arming and starting
- horizontal movement
- crouch
- jump buffering
- attack/Homing attack start
- pause request callback when the virtual pause button or gamepad pause mapping fires

Keyboard controls remain supported exactly as today.

Physical gamepad gameplay controls should follow Prototype-compatible semantics:

- left stick X or D-pad left/right maps to movement
- left stick Y down or D-pad down maps to crouch
- south face button maps to jump
- west face button maps to attack
- east face button maps to pause/back in active gameplay

Gamepad jump and attack must be edge-triggered from inactive to active.

## Localization

Visible labels must use the localization catalog. Add keys matching the Prototype touch labels:

- `touch.pause`
- `touch.move`
- `touch.jump`
- `touch.attack`

These should exist for every supported locale.

## Visual Treatment

The rebuild should reproduce the Prototype-facing layout while staying inside the rebuild CSS system:

- root overlay absolute inside `.gameplay-screen`
- safe-area-aware lower-left joystick
- safe-area-aware lower-right jump/attack buttons
- circular pause button near the upper-right area
- translucent blue/white controls with blur and active press feedback
- short fade-in animation when controls become visible

The overlay should be sized using the fixed 16:9 gameplay frame units/container-aware sizing, not raw viewport units that would drift against the resolution frame.

## Testing Strategy

Use TDD for every behavior change.

Domain tests:

- virtual stick maps left/right movement beyond the horizontal threshold.
- virtual stick ignores horizontal drift inside the threshold.
- virtual stick maps downward drag beyond the crouch threshold to crouch.
- virtual state reset hides controls and clears movement/crouch.
- pointer input requests visible controls during playable gameplay.
- keyboard/gamepad gameplay input hides controls and resets virtual movement/crouch.
- merge input snapshots preserves edge-triggered virtual jump/attack presses while combining held movement/crouch.
- gamepad gameplay mapping produces movement, crouch, jump, attack, and pause facts.
- unsupported/missing gamepad data produces no gameplay action facts.

Svelte/UI contract tests:

- `GameplayScreen.svelte` renders `VirtualControls` only when virtual controls are visible and gameplay is playable.
- active gameplay pointer interaction shows virtual controls.
- keyboard gameplay input hides virtual controls and clears virtual movement.
- gamepad gameplay input hides virtual controls and clears virtual movement.
- pause/result/settings states do not render virtual controls.
- `VirtualControls.svelte` exposes localized labels and emits move/crouch/jump/attack/pause callbacks.

Renderer tests:

- injected virtual movement drives player acceleration.
- injected virtual crouch enters crouch when grounded.
- injected virtual jump starts gameplay and buffers jump.
- injected virtual attack starts attack.
- keyboard input still works after virtual controls are hidden.
- gamepad input can drive gameplay movement/jump/attack and pause.

Browser checks:

- open gameplay, click/tap the game surface, verify virtual controls appear.
- drag the stick left/right/down and verify player movement/crouch.
- tap jump and attack buttons and verify gameplay actions.
- press keyboard movement/attack and verify the controls disappear.
- use gamepad input when available and verify the controls disappear.

## Out Of Scope

- Configurable touch layout.
- Multi-touch gesture shortcuts beyond simultaneous stick and action button use.
- Haptics.
- Control rebinding.
- Multiplayer input ownership.
- New gameplay mechanics.
- Copying Prototype runtime code.

## Acceptance Criteria

- Runtime code contains no `__prototype__` imports or runtime references.
- Virtual controls are visible only after mouse/touch/pointer gameplay interaction.
- Keyboard gameplay input hides virtual controls and clears virtual movement/crouch state.
- Gamepad gameplay input hides virtual controls and clears virtual movement/crouch state.
- Virtual joystick and buttons can play active gameplay: move, crouch, jump, attack, and pause.
- Keyboard and gamepad gameplay controls continue to work.
- The implementation has focused domain, Svelte/UI, and renderer tests.
- Verification passes:
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `git diff --check`
