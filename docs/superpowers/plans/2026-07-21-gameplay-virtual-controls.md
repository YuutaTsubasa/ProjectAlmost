# Gameplay Virtual Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prototype-compatible virtual joystick and action buttons for gameplay, with pointer/touch/mouse show behavior and keyboard/gamepad hide behavior.

**Architecture:** Keep input decisions in pure `src/domain/input` functions. `GameplayScreen.svelte` owns reactive browser-facing virtual control state and renders a focused `VirtualControls.svelte` component. `createGameplayRenderer.ts` remains the Phaser adapter and consumes a plain gameplay input snapshot instead of listening to global events.

**Tech Stack:** TypeScript, Svelte 5, Phaser 3, Vitest, Vite.

---

## File Structure

- Create `src/domain/input/gameplayInput.ts`
  - Pure gameplay input snapshot, virtual stick, visibility, merge, and gamepad mapping rules.
- Create `src/domain/input/gameplayInput.test.ts`
  - TDD coverage for the pure input rules.
- Create `src/ui/gameplay/VirtualControls.svelte`
  - Svelte presentation component for pause, stick, jump, and attack.
- Create `src/ui/gameplay/virtualControlsUi.test.ts`
  - Source/CSS contract tests for the virtual control component.
- Modify `src/ui/gameplay/GameplayScreen.svelte`
  - Own reactive virtual controls state and pass snapshots into renderer.
- Modify `src/ui/gameplay/gameplayScreenPause.test.ts`
  - Extend existing GameplayScreen source contract tests for virtual-control show/hide integration.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Consume merged keyboard/gamepad/virtual gameplay input snapshots.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Renderer behavior tests for injected virtual and gamepad input.
- Modify `src/domain/data/localize/localize.ts`
  - Add typed `touch.*` localization keys for every locale.
- Modify `src/domain/data/localize/localize.test.ts`
  - Verify `touch.*` localization completeness.

## Task 1: Pure Gameplay Input Domain

**Files:**
- Create: `src/domain/input/gameplayInput.test.ts`
- Create: `src/domain/input/gameplayInput.ts`

- [ ] **Step 1: Write failing tests for virtual stick mapping and reset behavior**

Create `src/domain/input/gameplayInput.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  clearVirtualControlsState,
  getVirtualStickInput,
  getVirtualControlsVisibilityDecision,
  mergeGameplayInputSnapshots,
  mapGamepadGameplayInputSnapshot,
  emptyGameplayInputSnapshot,
} from './gameplayInput'

describe('getVirtualStickInput', () => {
  it('maps horizontal drag beyond threshold to left and right movement', () => {
    expect(getVirtualStickInput({ x: -30, y: 0, radius: 100 }).moveX).toBe(-1)
    expect(getVirtualStickInput({ x: 30, y: 0, radius: 100 }).moveX).toBe(1)
  })

  it('ignores horizontal drift inside threshold', () => {
    expect(getVirtualStickInput({ x: 20, y: 0, radius: 100 })).toMatchObject({
      moveX: 0,
      crouchHeld: false,
    })
  })

  it('maps downward drag beyond threshold to crouch held', () => {
    expect(getVirtualStickInput({ x: 0, y: 60, radius: 100 })).toMatchObject({
      moveX: 0,
      crouchHeld: true,
    })
  })

  it('clamps knob movement to the stick radius', () => {
    expect(getVirtualStickInput({ x: 300, y: 0, radius: 100 }).knob).toEqual({ x: 100, y: 0 })
  })
})

describe('virtual controls state', () => {
  it('hides and clears movement/crouch state when reset', () => {
    expect(clearVirtualControlsState({ visible: true, moveX: 1, crouchHeld: true })).toEqual({
      visible: false,
      moveX: 0,
      crouchHeld: false,
    })
  })

  it('shows for pointer gameplay input and hides for keyboard or gamepad gameplay input', () => {
    expect(getVirtualControlsVisibilityDecision({ visible: false, source: 'virtual-pointer', playable: true })).toEqual({
      visible: true,
      resetVirtualState: false,
    })
    expect(getVirtualControlsVisibilityDecision({ visible: true, source: 'keyboard', playable: true })).toEqual({
      visible: false,
      resetVirtualState: true,
    })
    expect(getVirtualControlsVisibilityDecision({ visible: true, source: 'gamepad', playable: true })).toEqual({
      visible: false,
      resetVirtualState: true,
    })
  })

  it('does not show virtual controls when gameplay is not playable', () => {
    expect(getVirtualControlsVisibilityDecision({ visible: false, source: 'virtual-pointer', playable: false })).toEqual({
      visible: false,
      resetVirtualState: true,
    })
  })
})

describe('mergeGameplayInputSnapshots', () => {
  it('combines held movement with edge-triggered jump and attack presses', () => {
    expect(mergeGameplayInputSnapshots([
      { ...emptyGameplayInputSnapshot, leftHeld: true },
      { ...emptyGameplayInputSnapshot, jumpPressed: true, jumpHeld: true },
      { ...emptyGameplayInputSnapshot, attackPressed: true, attackHeld: true },
    ])).toEqual({
      leftHeld: true,
      rightHeld: false,
      crouchHeld: false,
      jumpPressed: true,
      jumpHeld: true,
      attackPressed: true,
      attackHeld: true,
      pausePressed: false,
    })
  })
})

describe('mapGamepadGameplayInputSnapshot', () => {
  const idle = {
    mapping: 'standard',
    buttons: Array.from({ length: 16 }, () => false),
    axes: [0, 0],
  }

  it('maps standard gamepad movement, crouch, jump, attack, and pause', () => {
    const current = {
      mapping: 'standard',
      buttons: idle.buttons.map((pressed, index) => index === 0 || index === 1 || index === 2 || index === 15 || pressed),
      axes: [0.7, 0.7],
    }

    expect(mapGamepadGameplayInputSnapshot(idle, current)).toEqual({
      leftHeld: false,
      rightHeld: true,
      crouchHeld: true,
      jumpPressed: true,
      jumpHeld: true,
      attackPressed: true,
      attackHeld: true,
      pausePressed: true,
    })
  })

  it('does not repeat jump and attack presses while held', () => {
    const held = {
      mapping: 'standard',
      buttons: idle.buttons.map((pressed, index) => index === 0 || index === 2 || pressed),
      axes: [0, 0],
    }

    expect(mapGamepadGameplayInputSnapshot(held, held)).toMatchObject({
      jumpPressed: false,
      jumpHeld: true,
      attackPressed: false,
      attackHeld: true,
    })
  })

  it('returns an empty snapshot for missing or unsupported gamepad data', () => {
    expect(mapGamepadGameplayInputSnapshot(null, null)).toEqual(emptyGameplayInputSnapshot)
    expect(mapGamepadGameplayInputSnapshot(idle, { ...idle, mapping: 'x-input' })).toEqual(emptyGameplayInputSnapshot)
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test -- src/domain/input/gameplayInput.test.ts`

Expected: FAIL because `src/domain/input/gameplayInput.ts` does not exist.

- [ ] **Step 3: Implement pure gameplay input rules**

Create `src/domain/input/gameplayInput.ts`:

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

export type VirtualControlsState = {
  visible: boolean
  moveX: -1 | 0 | 1
  crouchHeld: boolean
}

export type VirtualStickInput = {
  moveX: -1 | 0 | 1
  crouchHeld: boolean
  knob: { x: number; y: number }
}

export type GameplayInputSource = 'none' | 'virtual-pointer' | 'keyboard' | 'gamepad'

export type GamepadGameplaySnapshot = {
  mapping: string
  buttons: boolean[]
  axes: number[]
}

export const emptyGameplayInputSnapshot: GameplayInputSnapshot = {
  leftHeld: false,
  rightHeld: false,
  crouchHeld: false,
  jumpPressed: false,
  jumpHeld: false,
  attackPressed: false,
  attackHeld: false,
  pausePressed: false,
}

const STICK_MOVE_THRESHOLD = 0.28
const STICK_CROUCH_THRESHOLD = 0.55
const GAMEPAD_AXIS_THRESHOLD = 0.35
const SOUTH_BUTTON_INDEX = 0
const EAST_BUTTON_INDEX = 1
const WEST_BUTTON_INDEX = 2
const DPAD_DOWN_BUTTON_INDEX = 13
const DPAD_LEFT_BUTTON_INDEX = 14
const DPAD_RIGHT_BUTTON_INDEX = 15
const LEFT_STICK_X_AXIS_INDEX = 0
const LEFT_STICK_Y_AXIS_INDEX = 1

export function getVirtualStickInput(input: { x: number; y: number; radius: number }): VirtualStickInput {
  const radius = Math.max(1, input.radius)
  const length = Math.hypot(input.x, input.y)
  const scale = length > radius ? radius / length : 1
  const normalizedX = input.x / radius
  const normalizedY = input.y / radius
  const moveX = Math.abs(normalizedX) > STICK_MOVE_THRESHOLD
    ? (Math.sign(normalizedX) as -1 | 1)
    : 0

  return {
    moveX,
    crouchHeld: normalizedY > STICK_CROUCH_THRESHOLD,
    knob: {
      x: input.x * scale,
      y: input.y * scale,
    },
  }
}

export function clearVirtualControlsState(_state: VirtualControlsState): VirtualControlsState {
  return {
    visible: false,
    moveX: 0,
    crouchHeld: false,
  }
}

export function getVirtualControlsVisibilityDecision(input: {
  visible: boolean
  source: GameplayInputSource
  playable: boolean
}): { visible: boolean; resetVirtualState: boolean } {
  if (!input.playable) return { visible: false, resetVirtualState: true }
  if (input.source === 'virtual-pointer') return { visible: true, resetVirtualState: false }
  if (input.source === 'keyboard' || input.source === 'gamepad') {
    return { visible: false, resetVirtualState: input.visible }
  }
  return { visible: input.visible, resetVirtualState: false }
}

export function mergeGameplayInputSnapshots(inputs: readonly Partial<GameplayInputSnapshot>[]): GameplayInputSnapshot {
  return inputs.reduce<GameplayInputSnapshot>(
    (merged, input) => ({
      leftHeld: merged.leftHeld || input.leftHeld === true,
      rightHeld: merged.rightHeld || input.rightHeld === true,
      crouchHeld: merged.crouchHeld || input.crouchHeld === true,
      jumpPressed: merged.jumpPressed || input.jumpPressed === true,
      jumpHeld: merged.jumpHeld || input.jumpHeld === true,
      attackPressed: merged.attackPressed || input.attackPressed === true,
      attackHeld: merged.attackHeld || input.attackHeld === true,
      pausePressed: merged.pausePressed || input.pausePressed === true,
    }),
    { ...emptyGameplayInputSnapshot },
  )
}

export function mapGamepadGameplayInputSnapshot(
  previous: GamepadGameplaySnapshot | null,
  current: GamepadGameplaySnapshot | null,
): GameplayInputSnapshot {
  if (!current || current.mapping !== 'standard') return emptyGameplayInputSnapshot
  if (previous && previous.mapping !== 'standard') return emptyGameplayInputSnapshot

  const axisX = current.axes[LEFT_STICK_X_AXIS_INDEX] ?? 0
  const axisY = current.axes[LEFT_STICK_Y_AXIS_INDEX] ?? 0
  const jumpHeld = current.buttons[SOUTH_BUTTON_INDEX] === true
  const pauseHeld = current.buttons[EAST_BUTTON_INDEX] === true
  const attackHeld = current.buttons[WEST_BUTTON_INDEX] === true

  return {
    leftHeld: axisX < -GAMEPAD_AXIS_THRESHOLD || current.buttons[DPAD_LEFT_BUTTON_INDEX] === true,
    rightHeld: axisX > GAMEPAD_AXIS_THRESHOLD || current.buttons[DPAD_RIGHT_BUTTON_INDEX] === true,
    crouchHeld: axisY > GAMEPAD_AXIS_THRESHOLD || current.buttons[DPAD_DOWN_BUTTON_INDEX] === true,
    jumpPressed: jumpHeld && previous?.buttons[SOUTH_BUTTON_INDEX] !== true,
    jumpHeld,
    attackPressed: attackHeld && previous?.buttons[WEST_BUTTON_INDEX] !== true,
    attackHeld,
    pausePressed: pauseHeld && previous?.buttons[EAST_BUTTON_INDEX] !== true,
  }
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm run test -- src/domain/input/gameplayInput.test.ts`

Expected: PASS.

## Task 2: Localization And VirtualControls Component

**Files:**
- Modify: `src/domain/data/localize/localize.ts`
- Modify: `src/domain/data/localize/localize.test.ts`
- Create: `src/ui/gameplay/VirtualControls.svelte`
- Create: `src/ui/gameplay/virtualControlsUi.test.ts`

- [ ] **Step 1: Write failing localization and UI contract tests**

Add a test to `src/domain/data/localize/localize.test.ts`:

```ts
it('includes localized touch control values for every supported locale', () => {
  const expectedByLocale = {
    en: { pause: 'Pause', move: 'Move', jump: 'Jump', attack: 'Attack' },
    ja: { pause: 'ポーズ', move: '移動', jump: 'ジャンプ', attack: '攻撃' },
    zhHant: { pause: '暫停', move: '移動', jump: '跳躍', attack: '攻擊' },
    ko: { pause: '일시 정지', move: '이동', jump: '점프', attack: '공격' },
  }

  for (const locale of ['en', 'ja', 'zhHant', 'ko'] as const) {
    expect(resolveLocalizedText(localize, locale, 'touch.pause')).toBe(expectedByLocale[locale].pause)
    expect(resolveLocalizedText(localize, locale, 'touch.move')).toBe(expectedByLocale[locale].move)
    expect(resolveLocalizedText(localize, locale, 'touch.jump')).toBe(expectedByLocale[locale].jump)
    expect(resolveLocalizedText(localize, locale, 'touch.attack')).toBe(expectedByLocale[locale].attack)
  }
})
```

Create `src/ui/gameplay/virtualControlsUi.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import virtualControlsSource from './VirtualControls.svelte?raw'

describe('VirtualControls UI contract', () => {
  it('renders localized pause, move, jump, and attack controls', () => {
    expect(virtualControlsSource).toContain('class="virtual-controls"')
    expect(virtualControlsSource).toContain("text('touch.pause')")
    expect(virtualControlsSource).toContain("text('touch.move')")
    expect(virtualControlsSource).toContain("text('touch.jump')")
    expect(virtualControlsSource).toContain("text('touch.attack')")
  })

  it('uses pointer capture for the stick and emits move, jump, attack, and pause callbacks', () => {
    expect(virtualControlsSource).toContain('setPointerCapture')
    expect(virtualControlsSource).toContain('onMove(stick.moveX, stick.crouchHeld)')
    expect(virtualControlsSource).toContain('onJump()')
    expect(virtualControlsSource).toContain('onAttack()')
    expect(virtualControlsSource).toContain('onPause()')
  })

  it('keeps overlay root passive and only controls interactive', () => {
    expect(virtualControlsSource).toContain('pointer-events: none')
    expect(virtualControlsSource).toContain('pointer-events: auto')
    expect(virtualControlsSource).toContain('touch-action: none')
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/ui/gameplay/virtualControlsUi.test.ts
```

Expected: FAIL because `touch.*` keys and `VirtualControls.svelte` do not exist yet.

- [ ] **Step 3: Add localization keys**

In `src/domain/data/localize/localize.ts`:

- Add `export type TouchLocalizationKey = 'touch.pause' | 'touch.move' | 'touch.jump' | 'touch.attack'`.
- Add `TouchLocalizationKey` to `LocalizationKey`.
- Add `touch.*` catalog entries for `en`, `ja`, `zhHant`, and `ko` with values from the failing test.

- [ ] **Step 4: Create VirtualControls component**

Create `src/ui/gameplay/VirtualControls.svelte`:

```svelte
<script lang="ts">
  import {
    getVirtualStickInput,
    type VirtualStickInput,
  } from '../../domain/input/gameplayInput'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizationKey,
    type LocalizeData,
  } from '../../domain/data/localize/localize'

  type Props = {
    localizeData: LocalizeData
    locale: LocaleCode
    onMove: (moveX: -1 | 0 | 1, crouchHeld: boolean) => void
    onJump: () => void
    onAttack: () => void
    onPause: () => void
    onInteraction: () => void
  }

  let {
    localizeData,
    locale,
    onMove,
    onJump,
    onAttack,
    onPause,
    onInteraction,
  }: Props = $props()

  let stickPointerId = $state<number | null>(null)
  let stick = $state<VirtualStickInput>({
    moveX: 0,
    crouchHeld: false,
    knob: { x: 0, y: 0 },
  })

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function updateStick(event: PointerEvent): void {
    const element = event.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    const radius = rect.width * 0.34
    stick = getVirtualStickInput({
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
      radius,
    })
    onMove(stick.moveX, stick.crouchHeld)
  }

  function startStick(event: PointerEvent): void {
    event.preventDefault()
    onInteraction()
    stickPointerId = event.pointerId
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    updateStick(event)
  }

  function moveStick(event: PointerEvent): void {
    event.preventDefault()
    if (event.pointerId === stickPointerId) updateStick(event)
  }

  function releaseStick(event: PointerEvent): void {
    event.preventDefault()
    if (event.pointerId !== stickPointerId) return
    stickPointerId = null
    stick = { moveX: 0, crouchHeld: false, knob: { x: 0, y: 0 } }
    onMove(0, false)
  }

  function pressAction(action: 'jump' | 'attack'): void {
    onInteraction()
    if (action === 'jump') onJump()
    if (action === 'attack') onAttack()
  }
</script>

<div class="virtual-controls" aria-label={text('hud.controls')}>
  <button
    class="virtual-pause"
    type="button"
    aria-label={text('touch.pause')}
    onpointerdown={(event) => {
      event.preventDefault()
      onInteraction()
      onPause()
    }}
  >Ⅱ</button>

  <div
    class="virtual-stick"
    role="slider"
    aria-label={text('touch.move')}
    aria-valuemin="-1"
    aria-valuemax="1"
    aria-valuenow={stick.moveX}
    tabindex="0"
    onpointerdown={startStick}
    onpointermove={moveStick}
    onpointerup={releaseStick}
    onpointercancel={releaseStick}
  >
    <i style={`transform:translate(${stick.knob.x}px, ${stick.knob.y}px)`}></i>
  </div>

  <div class="virtual-actions">
    <button
      class="virtual-action jump"
      type="button"
      aria-label={text('touch.jump')}
      onpointerdown={(event) => {
        event.preventDefault()
        pressAction('jump')
      }}
    ><b>↑</b><span>{text('touch.jump')}</span></button>
    <button
      class="virtual-action attack"
      type="button"
      aria-label={text('touch.attack')}
      onpointerdown={(event) => {
        event.preventDefault()
        pressAction('attack')
      }}
    ><b>✦</b><span>{text('touch.attack')}</span></button>
  </div>
</div>

<style>
  .virtual-controls {
    --touch-edge-inset: clamp(18px, 3cqh, 42px);
    --touch-bottom-inset: max(19.5cqh, calc(env(safe-area-inset-bottom) + 17.5cqh));
    position: absolute;
    inset: 0;
    z-index: 52;
    pointer-events: none;
    animation: virtual-controls-in 180ms ease-out both;
  }

  .virtual-controls button,
  .virtual-stick {
    pointer-events: auto;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .virtual-stick {
    position: absolute;
    bottom: var(--touch-bottom-inset);
    left: calc(env(safe-area-inset-left) + var(--touch-edge-inset));
    width: clamp(104px, 11cqw, 176px);
    aspect-ratio: 1;
    border: 2px solid rgba(255, 255, 255, 0.72);
    border-radius: 50%;
    background: rgba(25, 87, 148, 0.24);
    box-shadow:
      0 0 0 5px rgba(47, 111, 180, 0.2),
      0 10px 30px rgba(7, 36, 73, 0.28),
      inset 0 0 24px rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(4px);
  }

  .virtual-stick::before,
  .virtual-stick::after {
    content: "";
    position: absolute;
    background: rgba(255, 255, 255, 0.32);
  }

  .virtual-stick::before {
    top: 50%;
    right: 12%;
    left: 12%;
    height: 1px;
  }

  .virtual-stick::after {
    top: 12%;
    bottom: 12%;
    left: 50%;
    width: 1px;
  }

  .virtual-stick i {
    position: absolute;
    top: 29%;
    left: 29%;
    width: 42%;
    aspect-ratio: 1;
    border: 2px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    background: linear-gradient(145deg, rgba(248, 253, 255, 0.94), rgba(78, 156, 222, 0.86));
    box-shadow: 0 6px 18px rgba(7, 36, 73, 0.35);
    pointer-events: none;
  }

  .virtual-actions {
    position: absolute;
    right: calc(env(safe-area-inset-right) + var(--touch-edge-inset));
    bottom: var(--touch-bottom-inset);
    display: flex;
    gap: clamp(12px, 1.2cqw, 22px);
    align-items: end;
    pointer-events: none;
  }

  .virtual-action,
  .virtual-pause {
    display: grid;
    place-items: center;
    border: 2px solid rgba(255, 255, 255, 0.76);
    border-radius: 50%;
    background: rgba(38, 112, 181, 0.62);
    box-shadow: 0 8px 24px rgba(7, 36, 73, 0.3);
    color: white;
    backdrop-filter: blur(5px);
  }

  .virtual-action {
    width: clamp(76px, 7cqw, 116px);
    aspect-ratio: 1;
  }

  .virtual-action.attack {
    translate: 0 -3cqh;
    background: rgba(38, 112, 181, 0.76);
  }

  .virtual-action b {
    font-size: min(1.7cqw, 34px);
    line-height: 1;
  }

  .virtual-action span {
    font-size: min(0.55cqw, 11px);
    font-weight: 800;
    text-transform: uppercase;
  }

  .virtual-pause {
    position: absolute;
    top: max(3cqh, env(safe-area-inset-top));
    right: max(21cqw, calc(env(safe-area-inset-right) + 20cqw));
    width: clamp(48px, 4.2cqw, 72px);
    aspect-ratio: 1;
    font-weight: 900;
  }

  .virtual-controls button:active,
  .virtual-stick:active {
    filter: brightness(1.18);
    scale: 0.96;
  }

  @keyframes virtual-controls-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
```

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/ui/gameplay/virtualControlsUi.test.ts
```

Expected: PASS.

## Task 3: Renderer Gameplay Input Bridge

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer tests for injected virtual input**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, extend `createSceneRuntime` input with:

```ts
getInputSnapshot?: () => Partial<GameplayInputSnapshot>
onPauseRequested?: () => void
```

Pass those into `createGameplayRendererConfig`.

Add tests:

```ts
it('uses injected virtual movement to drive player acceleration', () => {
  let virtualInput: Partial<GameplayInputSnapshot> = { rightHeld: true }
  const runtime = createSceneRuntime({ getInputSnapshot: () => virtualInput })
  runtime.scene.create()
  startGameplay(runtime)

  runtime.scene.update(100, 16)

  expect(runtime.playerSprite?.accelerationX).toBe(playerActorDefinition.movement.groundAcceleration)
})

it('uses injected virtual crouch while grounded', () => {
  const runtime = createSceneRuntime({ getInputSnapshot: () => ({ crouchHeld: true }) })
  runtime.scene.create()
  startGameplay(runtime)

  runtime.scene.update(100, 16)

  expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
    key: playerActorDefinition.sprites.crouch.key,
    ignoreIfPlaying: true,
  })
})

it('uses injected virtual jump as a gameplay start and jump press', () => {
  let virtualInput: Partial<GameplayInputSnapshot> = { jumpPressed: true, jumpHeld: true }
  const runtime = createSceneRuntime({ getInputSnapshot: () => virtualInput })
  runtime.scene.create()

  runtime.scene.update(100, 16)
  virtualInput = { jumpHeld: true }
  runtime.scene.update(116, 16)

  expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
})

it('uses injected virtual attack to start player attack', () => {
  let virtualInput: Partial<GameplayInputSnapshot> = { attackPressed: true, attackHeld: true }
  const runtime = createSceneRuntime({ getInputSnapshot: () => virtualInput })
  runtime.scene.create()
  startGameplay(runtime)

  runtime.scene.update(100, 16)

  expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
    key: playerActorDefinition.sprites.attack.key,
    ignoreIfPlaying: true,
  })
})

it('emits pause request from injected pause input', () => {
  const pauseRequests: number[] = []
  const runtime = createSceneRuntime({
    getInputSnapshot: () => ({ pausePressed: true }),
    onPauseRequested: () => pauseRequests.push(1),
  })
  runtime.scene.create()

  runtime.scene.update(100, 16)

  expect(pauseRequests).toHaveLength(1)
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts`

Expected: FAIL because renderer input does not accept `getInputSnapshot` or `onPauseRequested`, and movement still reads only keyboard.

- [ ] **Step 3: Implement renderer input snapshot bridge**

In `src/ui/gameplay/createGameplayRenderer.ts`:

- Import `GameplayInputSnapshot`, `emptyGameplayInputSnapshot`, and `mergeGameplayInputSnapshots`.
- Extend `GameplayRendererInput` with:

```ts
getInputSnapshot?: () => Partial<GameplayInputSnapshot>
onPauseRequested?: () => void
```

- Add `private previousMergedInputSnapshot = emptyGameplayInputSnapshot`.
- Add helper:

```ts
private getKeyboardGameplayInputSnapshot(): GameplayInputSnapshot {
  const keys = this.playerKeys
  if (!keys) return emptyGameplayInputSnapshot
  const jumpHeld = keys.space.isDown || keys.up.isDown || keys.w.isDown
  const attackHeld = keys.j.isDown || keys.z.isDown
  return {
    leftHeld: keys.left.isDown || keys.a.isDown,
    rightHeld: keys.right.isDown || keys.d.isDown,
    crouchHeld: keys.down.isDown || keys.s.isDown,
    jumpPressed: jumpHeld && !this.wasJumpDown,
    jumpHeld,
    attackPressed: attackHeld && !this.wasAttackDown,
    attackHeld,
    pausePressed: false,
  }
}

private getGameplayInputSnapshot(): GameplayInputSnapshot {
  return mergeGameplayInputSnapshots([
    this.getKeyboardGameplayInputSnapshot(),
    this.options.getInputSnapshot?.() ?? emptyGameplayInputSnapshot,
  ])
}
```

- Replace direct keyboard reads in start-gate and player movement with the merged snapshot.
- Ensure jump and attack edge-trigger flags are updated from the merged snapshot once per frame.
- Call `this.options.onPauseRequested?.()` when `input.pausePressed` is true.

- [ ] **Step 4: Run renderer tests to verify GREEN**

Run: `npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts`

Expected: PASS.

## Task 4: GameplayScreen Reactive Virtual Controls Integration

**Files:**
- Modify: `src/ui/gameplay/GameplayScreen.svelte`
- Modify: `src/ui/gameplay/gameplayScreenPause.test.ts`

- [ ] **Step 1: Write failing GameplayScreen source contract tests**

Add tests to `src/ui/gameplay/gameplayScreenPause.test.ts`:

```ts
it('wires VirtualControls into playable gameplay only', () => {
  expect(gameplayScreenSource).toContain("import VirtualControls from './VirtualControls.svelte'")
  expect(gameplayScreenSource).toContain('{#if virtualControls.visible && isGameplayPlayable()}')
  expect(gameplayScreenSource).toContain('<VirtualControls')
  expect(gameplayScreenSource).toContain('onMove={(moveX, crouchHeld) =>')
  expect(gameplayScreenSource).toContain('onJump={pressVirtualJump}')
  expect(gameplayScreenSource).toContain('onAttack={pressVirtualAttack}')
  expect(gameplayScreenSource).toContain('onPause={pauseGameplay}')
})

it('shows virtual controls from pointer gameplay interaction and hides them on keyboard or gamepad input', () => {
  expect(gameplayScreenSource).toContain('function showVirtualControlsFromPointer(): void')
  expect(gameplayScreenSource).toContain('function hideVirtualControlsFromPhysicalInput(source: GameplayInputSource): void')
  expect(gameplayScreenSource).toContain("hideVirtualControlsFromPhysicalInput('keyboard')")
  expect(gameplayScreenSource).toContain("hideVirtualControlsFromPhysicalInput('gamepad')")
  expect(gameplayScreenSource).toContain('clearVirtualControlsState(virtualControls)')
})

it('passes virtual gameplay input snapshot into the renderer', () => {
  expect(gameplayScreenSource).toContain('getInputSnapshot: getVirtualGameplayInputSnapshot')
  expect(gameplayScreenSource).toContain('onPauseRequested: pauseGameplay')
  expect(gameplayScreenSource).toContain('jumpPressed: virtualJumpPressed')
  expect(gameplayScreenSource).toContain('attackPressed: virtualAttackPressed')
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test -- src/ui/gameplay/gameplayScreenPause.test.ts`

Expected: FAIL because `GameplayScreen.svelte` does not import/render `VirtualControls` yet.

- [ ] **Step 3: Implement GameplayScreen virtual controls state**

In `src/ui/gameplay/GameplayScreen.svelte`:

- Import `VirtualControls`.
- Import `GameplayInputSource`, `clearVirtualControlsState`, `emptyGameplayInputSnapshot`, and `getVirtualControlsVisibilityDecision`.
- Add state:

```ts
let virtualControls = $state({ visible: false, moveX: 0 as -1 | 0 | 1, crouchHeld: false })
let virtualJumpPressed = $state(false)
let virtualAttackPressed = $state(false)
```

- Add helpers:

```ts
function isGameplayPlayable(): boolean {
  return Boolean(hudState) && !hudState.result && pauseState.mode === 'playing'
}

function showVirtualControlsFromPointer(): void {
  const decision = getVirtualControlsVisibilityDecision({
    visible: virtualControls.visible,
    source: 'virtual-pointer',
    playable: isGameplayPlayable(),
  })
  virtualControls = decision.resetVirtualState
    ? clearVirtualControlsState(virtualControls)
    : { ...virtualControls, visible: decision.visible }
}

function hideVirtualControlsFromPhysicalInput(source: GameplayInputSource): void {
  const decision = getVirtualControlsVisibilityDecision({
    visible: virtualControls.visible,
    source,
    playable: isGameplayPlayable(),
  })
  virtualControls = decision.resetVirtualState
    ? clearVirtualControlsState(virtualControls)
    : { ...virtualControls, visible: decision.visible }
}

function pressVirtualJump(): void {
  virtualJumpPressed = true
}

function pressVirtualAttack(): void {
  virtualAttackPressed = true
}

function getVirtualGameplayInputSnapshot(): Partial<GameplayInputSnapshot> {
  const snapshot = {
    leftHeld: virtualControls.moveX < 0,
    rightHeld: virtualControls.moveX > 0,
    crouchHeld: virtualControls.crouchHeld,
    jumpPressed: virtualJumpPressed,
    jumpHeld: virtualJumpPressed,
    attackPressed: virtualAttackPressed,
    attackHeld: virtualAttackPressed,
  }
  virtualJumpPressed = false
  virtualAttackPressed = false
  return snapshot
}
```

- On `handleKeydown`, call `hideVirtualControlsFromPhysicalInput('keyboard')` when a gameplay-relevant keyboard key is observed.
- In `pollGamepad`, call `hideVirtualControlsFromPhysicalInput('gamepad')` when any gameplay gamepad action is observed.
- Pass `getInputSnapshot: getVirtualGameplayInputSnapshot` and `onPauseRequested: pauseGameplay` into `createGameplayRenderer`.
- Add `onpointerdown={showVirtualControlsFromPointer}` to `.gameplay-screen`.
- Render `<VirtualControls ... />` only when `virtualControls.visible && isGameplayPlayable()`.

- [ ] **Step 4: Run GameplayScreen tests to verify GREEN**

Run: `npm run test -- src/ui/gameplay/gameplayScreenPause.test.ts src/ui/gameplay/virtualControlsUi.test.ts`

Expected: PASS.

## Task 5: Full Verification And Browser Pass

**Files:**
- No new implementation files unless verification finds a defect.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- src/domain/input/gameplayInput.test.ts src/domain/data/localize/localize.test.ts src/ui/gameplay/virtualControlsUi.test.ts src/ui/gameplay/gameplayScreenPause.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected:

- `npm run test`: all tests pass.
- `npm run check`: 0 errors and 0 warnings.
- `npm run build`: exits 0. Existing large chunk warning is acceptable.
- `git diff --check`: no output.

- [ ] **Step 3: Browser verification**

Use the active Vite dev server or run `npm run dev` if no server is active. Verify:

- `http://127.0.0.1:<port>/?debugUnlock=1` opens.
- Enter gameplay.
- Pointer click/tap on gameplay surface shows virtual controls.
- Stick drag right moves the player right.
- Stick drag down enters crouch.
- Jump button launches jump.
- Attack button starts attack.
- Pause button opens pause.
- Keyboard gameplay input hides virtual controls.
- If a physical gamepad is available, gamepad gameplay input hides virtual controls and can drive movement/jump/attack/pause.

- [ ] **Step 4: Commit**

Stage only files related to this feature, excluding unrelated `pnpm-lock.yaml` if it remains untracked:

```bash
git add docs/superpowers/specs/2026-07-21-gameplay-virtual-controls-design.md \
  docs/superpowers/plans/2026-07-21-gameplay-virtual-controls.md \
  src/domain/input/gameplayInput.ts \
  src/domain/input/gameplayInput.test.ts \
  src/domain/data/localize/localize.ts \
  src/domain/data/localize/localize.test.ts \
  src/ui/gameplay/VirtualControls.svelte \
  src/ui/gameplay/virtualControlsUi.test.ts \
  src/ui/gameplay/GameplayScreen.svelte \
  src/ui/gameplay/gameplayScreenPause.test.ts \
  src/ui/gameplay/createGameplayRenderer.ts \
  src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "Add gameplay virtual controls"
```

Expected: commit succeeds with a scoped virtual controls change.
