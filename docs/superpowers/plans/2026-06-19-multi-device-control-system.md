# Multi-Device Control System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable keyboard, pointer/touch, and gamepad control-intent system and wire it to the current title intro/menu flow.

**Architecture:** Pure device-to-intent mapping lives in `src/domain/input/controlIntents.ts`. Pure app-state coordination lives in `src/application/input/titleControls.ts` and delegates to existing app-flow functions. Svelte components stay as browser adapters that convert DOM and gamepad APIs into plain descriptors before applying intents.

**Tech Stack:** TypeScript, Svelte 5, Vitest, Vite, Tauri frontend shell.

---

## File Structure

- `src/domain/input/controlIntents.ts`: defines shared control intent types, keyboard descriptors, gamepad snapshots, and pure mapping functions.
- `src/domain/input/controlIntents.test.ts`: focused domain tests for keyboard mapping, gamepad edge detection, dead zones, and missing snapshots.
- `src/application/input/titleControls.ts`: applies shared control intents to `AppState` through existing title flow functions.
- `src/application/input/titleControls.test.ts`: focused application tests for title intro/menu transitions from intents.
- `src/App.svelte`: owns app state and routes title control intents and pointer menu selections through the application input bridge.
- `src/ui/title/TitleScreen.svelte`: browser adapter for keyboard, pointer/touch, and gamepad polling.

---

### Task 1: Domain Keyboard Control Intents

**Files:**
- Create: `src/domain/input/controlIntents.test.ts`
- Create: `src/domain/input/controlIntents.ts`

- [ ] **Step 1: Write the failing keyboard tests**

Create `src/domain/input/controlIntents.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mapKeyboardControlIntent } from './controlIntents'

describe('mapKeyboardControlIntent', () => {
  it('maps any non-repeat key to open while waiting on the title intro', () => {
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'title-intro')).toBe('open')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'title-intro')).toBe('open')
  })

  it('maps supported title menu keys to navigation intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'w', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'W', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 's', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'S', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'title-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'title-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'title-menu')).toBe('back')
  })

  it('ignores unsupported or repeated title menu keys', () => {
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'title-menu')).toBeNull()
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: true }, 'title-menu')).toBeNull()
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: true }, 'title-menu')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the keyboard tests and verify they fail**

Run:

```bash
npm run test -- src/domain/input/controlIntents.test.ts
```

Expected: `FAIL` because `src/domain/input/controlIntents.ts` does not exist.

- [ ] **Step 3: Add the minimal keyboard mapping implementation**

Create `src/domain/input/controlIntents.ts`:

```ts
export type ControlIntent = 'open' | 'move-up' | 'move-down' | 'confirm' | 'back'

export type ControlContext = 'title-intro' | 'title-menu'

export type KeyboardControlDescriptor = {
  key: string
  repeat: boolean
}

export function mapKeyboardControlIntent(
  descriptor: KeyboardControlDescriptor,
  context: ControlContext,
): ControlIntent | null {
  if (descriptor.repeat) return null
  if (context === 'title-intro') return 'open'

  const key = descriptor.key.toLowerCase()

  if (descriptor.key === 'ArrowUp' || key === 'w') return 'move-up'
  if (descriptor.key === 'ArrowDown' || key === 's') return 'move-down'
  if (descriptor.key === 'Enter' || descriptor.key === ' ') return 'confirm'
  if (descriptor.key === 'Escape') return 'back'

  return null
}
```

- [ ] **Step 4: Run the keyboard tests and verify they pass**

Run:

```bash
npm run test -- src/domain/input/controlIntents.test.ts
```

Expected: `PASS` for `mapKeyboardControlIntent`.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/domain/input/controlIntents.test.ts src/domain/input/controlIntents.ts
git commit -m "Add keyboard control intent mapping"
```

---

### Task 2: Domain Gamepad Control Intents

**Files:**
- Modify: `src/domain/input/controlIntents.test.ts`
- Modify: `src/domain/input/controlIntents.ts`

- [ ] **Step 1: Add failing gamepad tests**

Replace the import block at the top of `src/domain/input/controlIntents.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { mapGamepadControlIntents, mapKeyboardControlIntent } from './controlIntents'
```

Then append this test block to `src/domain/input/controlIntents.test.ts`:

```ts
describe('mapGamepadControlIntents', () => {
  it('maps gamepad buttons to open, confirm, back, and directional intents', () => {
    const previous = {
      buttons: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      axes: [0, 0],
    }

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'title-intro'),
    ).toEqual(['open'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'title-menu'),
    ).toEqual(['confirm'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [false, true, false, false] }, 'title-menu'),
    ).toEqual(['back'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [...previous.buttons.slice(0, 12), true] }, 'title-menu'),
    ).toEqual(['move-up'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [...previous.buttons.slice(0, 13), true] }, 'title-menu'),
    ).toEqual(['move-down'])
  })

  it('maps left stick threshold crossings to directional intents', () => {
    const previous = { buttons: [], axes: [0, 0] }

    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, -0.7] }, 'title-menu')).toEqual(['move-up'])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, 0.7] }, 'title-menu')).toEqual(['move-down'])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, 0.2] }, 'title-menu')).toEqual([])
  })

  it('emits intents only when buttons or axes move from inactive to active', () => {
    const previous = { buttons: [true, false, false, false], axes: [0, 0.8] }
    const current = { buttons: [true, false, false, false], axes: [0, 0.9] }

    expect(mapGamepadControlIntents(previous, current, 'title-menu')).toEqual([])
  })

  it('returns no intents when current gamepad data is missing', () => {
    expect(mapGamepadControlIntents(null, null, 'title-menu')).toEqual([])
  })
})
```

- [ ] **Step 2: Run the gamepad tests and verify they fail**

Run:

```bash
npm run test -- src/domain/input/controlIntents.test.ts
```

Expected: `FAIL` because `mapGamepadControlIntents` is not exported.

- [ ] **Step 3: Add the minimal gamepad mapping implementation**

Replace `src/domain/input/controlIntents.ts` with:

```ts
export type ControlIntent = 'open' | 'move-up' | 'move-down' | 'confirm' | 'back'

export type ControlContext = 'title-intro' | 'title-menu'

export type KeyboardControlDescriptor = {
  key: string
  repeat: boolean
}

export type GamepadControlSnapshot = {
  buttons: boolean[]
  axes: number[]
}

const AXIS_THRESHOLD = 0.5
const SOUTH_BUTTON_INDEX = 0
const EAST_BUTTON_INDEX = 1
const DPAD_UP_BUTTON_INDEX = 12
const DPAD_DOWN_BUTTON_INDEX = 13
const LEFT_STICK_Y_AXIS_INDEX = 1

export function mapKeyboardControlIntent(
  descriptor: KeyboardControlDescriptor,
  context: ControlContext,
): ControlIntent | null {
  if (descriptor.repeat) return null
  if (context === 'title-intro') return 'open'

  const key = descriptor.key.toLowerCase()

  if (descriptor.key === 'ArrowUp' || key === 'w') return 'move-up'
  if (descriptor.key === 'ArrowDown' || key === 's') return 'move-down'
  if (descriptor.key === 'Enter' || descriptor.key === ' ') return 'confirm'
  if (descriptor.key === 'Escape') return 'back'

  return null
}

export function mapGamepadControlIntents(
  previous: GamepadControlSnapshot | null,
  current: GamepadControlSnapshot | null,
  context: ControlContext,
): ControlIntent[] {
  if (!current) return []

  const intents: ControlIntent[] = []

  if (pressedNow(previous, current, SOUTH_BUTTON_INDEX)) {
    intents.push(context === 'title-intro' ? 'open' : 'confirm')
  }

  if (pressedNow(previous, current, EAST_BUTTON_INDEX)) {
    intents.push('back')
  }

  if (pressedNow(previous, current, DPAD_UP_BUTTON_INDEX) || axisCrossed(previous, current, 'negative')) {
    intents.push('move-up')
  }

  if (pressedNow(previous, current, DPAD_DOWN_BUTTON_INDEX) || axisCrossed(previous, current, 'positive')) {
    intents.push('move-down')
  }

  return intents
}

function pressedNow(
  previous: GamepadControlSnapshot | null,
  current: GamepadControlSnapshot,
  buttonIndex: number,
): boolean {
  return current.buttons[buttonIndex] === true && previous?.buttons[buttonIndex] !== true
}

function axisCrossed(
  previous: GamepadControlSnapshot | null,
  current: GamepadControlSnapshot,
  direction: 'negative' | 'positive',
): boolean {
  const currentValue = current.axes[LEFT_STICK_Y_AXIS_INDEX] ?? 0
  const previousValue = previous?.axes[LEFT_STICK_Y_AXIS_INDEX] ?? 0

  if (direction === 'negative') {
    return currentValue <= -AXIS_THRESHOLD && previousValue > -AXIS_THRESHOLD
  }

  return currentValue >= AXIS_THRESHOLD && previousValue < AXIS_THRESHOLD
}
```

- [ ] **Step 4: Run the domain tests and verify they pass**

Run:

```bash
npm run test -- src/domain/input/controlIntents.test.ts
```

Expected: `PASS` for keyboard and gamepad control intent tests.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add src/domain/input/controlIntents.test.ts src/domain/input/controlIntents.ts
git commit -m "Add gamepad control intent mapping"
```

---

### Task 3: Application Title Control Bridge

**Files:**
- Create: `src/application/input/titleControls.test.ts`
- Create: `src/application/input/titleControls.ts`

- [ ] **Step 1: Write the failing application bridge tests**

Create `src/application/input/titleControls.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createInitialAppState } from '../../domain/app/appFlow'
import { applyTitleControlIntent, selectTitleMenuItemFromPointer } from './titleControls'

describe('applyTitleControlIntent', () => {
  it('opens the title menu from the intro', () => {
    expect(applyTitleControlIntent(createInitialAppState(), 'open')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })

  it('moves title menu selection up and down', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(applyTitleControlIntent(state, 'move-down')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
    })

    expect(applyTitleControlIntent(state, 'move-up')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 2 },
    })
  })

  it('confirms the selected title menu item', () => {
    const backSelected = { screen: { type: 'title-menu', selectedItemIndex: 2 } } as const

    expect(applyTitleControlIntent(backSelected, 'confirm')).toEqual({
      screen: { type: 'title-intro' },
    })
  })

  it('backs out of the title menu by activating the Back item', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(applyTitleControlIntent(state, 'back')).toEqual({
      screen: { type: 'title-intro' },
    })
  })

  it('ignores navigation intents while the intro is visible', () => {
    const state = createInitialAppState()

    expect(applyTitleControlIntent(state, 'move-down')).toBe(state)
    expect(applyTitleControlIntent(state, 'confirm')).toBe(state)
    expect(applyTitleControlIntent(state, 'back')).toBe(state)
  })

  it('selects title menu items from pointer input', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(selectTitleMenuItemFromPointer(state, 1)).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
    })
  })

  it('activates Back immediately when pointer input selects it', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(selectTitleMenuItemFromPointer(state, 2)).toEqual({
      screen: { type: 'title-intro' },
    })
  })
})
```

- [ ] **Step 2: Run the application bridge tests and verify they fail**

Run:

```bash
npm run test -- src/application/input/titleControls.test.ts
```

Expected: `FAIL` because `src/application/input/titleControls.ts` does not exist.

- [ ] **Step 3: Add the minimal application bridge implementation**

Create `src/application/input/titleControls.ts`:

```ts
import {
  activateTitleMenuItem,
  moveTitleMenuSelection,
  openTitleMenu,
  selectTitleMenuItem,
  type AppState,
} from '../../domain/app/appFlow'
import type { ControlIntent } from '../../domain/input/controlIntents'

const BACK_ITEM_INDEX = 2

export function applyTitleControlIntent(state: AppState, intent: ControlIntent): AppState {
  if (intent === 'open') {
    return openTitleMenu(state)
  }

  if (state.screen.type !== 'title-menu') {
    return state
  }

  if (intent === 'move-up') {
    return moveTitleMenuSelection(state, -1)
  }

  if (intent === 'move-down') {
    return moveTitleMenuSelection(state, 1)
  }

  if (intent === 'confirm') {
    return activateTitleMenuItem(state)
  }

  if (intent === 'back') {
    return activateTitleMenuItem(selectTitleMenuItem(state, BACK_ITEM_INDEX))
  }

  return state
}

export function selectTitleMenuItemFromPointer(state: AppState, selectedItemIndex: number): AppState {
  const selectedState = selectTitleMenuItem(state, selectedItemIndex)
  if (selectedState.screen.type !== 'title-menu') {
    return selectedState
  }

  if (selectedItemIndex !== BACK_ITEM_INDEX) {
    return selectedState
  }

  return activateTitleMenuItem(selectedState)
}
```

- [ ] **Step 4: Run the application bridge tests and verify they pass**

Run:

```bash
npm run test -- src/application/input/titleControls.test.ts
```

Expected: `PASS` for all application bridge tests.

- [ ] **Step 5: Run the focused domain and application tests together**

Run:

```bash
npm run test -- src/domain/input/controlIntents.test.ts src/application/input/titleControls.test.ts
```

Expected: `PASS` for both test files.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add src/application/input/titleControls.test.ts src/application/input/titleControls.ts
git commit -m "Add title control intent bridge"
```

---

### Task 4: Svelte Keyboard And Pointer Adapter

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/ui/title/TitleScreen.svelte`

- [ ] **Step 1: Run the existing checks before UI edits**

Run:

```bash
npm run check
```

Expected: `PASS` before changing Svelte files.

- [ ] **Step 2: Replace direct title callbacks with a control-intent callback in `App.svelte`**

Replace `src/App.svelte` with:

```svelte
<script lang="ts">
  import { applyTitleControlIntent, selectTitleMenuItemFromPointer } from './application/input/titleControls'
  import { createInitialAppState } from './domain/app/appFlow'
  import { createProjectIdentity } from './domain/app/projectIdentity'
  import type { ControlIntent } from './domain/input/controlIntents'
  import ResolutionFrame from './ui/layout/ResolutionFrame.svelte'
  import TitleScreen from './ui/title/TitleScreen.svelte'

  let appState = $state(createInitialAppState())
  const identity = createProjectIdentity()

  function handleControlIntent(intent: ControlIntent) {
    appState = applyTitleControlIntent(appState, intent)
  }

  function handlePointerMenuSelection(selectedItemIndex: number) {
    appState = selectTitleMenuItemFromPointer(appState, selectedItemIndex)
  }
</script>

<main class="shell">
  <ResolutionFrame>
    {#if appState.screen.type === 'title-intro' || appState.screen.type === 'title-menu'}
      <TitleScreen
        screen={appState.screen}
        productName={identity.productName}
        onControlIntent={handleControlIntent}
        onPointerMenuSelection={handlePointerMenuSelection}
      />
    {/if}
  </ResolutionFrame>
</main>
```

- [ ] **Step 3: Replace title keyboard and pointer handling with mapped control intents**

Replace `src/ui/title/TitleScreen.svelte` with:

```svelte
<script lang="ts">
  import { TITLE_MENU_ITEMS, type AppScreen } from '../../domain/app/appFlow'
  import {
    mapKeyboardControlIntent,
    type ControlContext,
    type ControlIntent,
  } from '../../domain/input/controlIntents'

  type Props = {
    screen: AppScreen
    productName: string
    onControlIntent: (intent: ControlIntent) => void
    onPointerMenuSelection: (selectedItemIndex: number) => void
  }

  let { screen, productName, onControlIntent, onPointerMenuSelection }: Props = $props()

  const menuLabels: Record<(typeof TITLE_MENU_ITEMS)[number], string> = {
    start: 'Start Game',
    settings: 'Settings',
    back: 'Back',
  }

  function getControlContext(): ControlContext {
    return screen.type === 'title-intro' ? 'title-intro' : 'title-menu'
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      {
        key: event.key,
        repeat: event.repeat,
      },
      getControlContext(),
    )

    if (!intent) return

    event.preventDefault()
    onControlIntent(intent)
  }

  function handleIntroPointer(event: PointerEvent) {
    event.preventDefault()
    onControlIntent('open')
  }

  function handleMenuPointer(event: PointerEvent, index: number) {
    event.stopPropagation()
    onPointerMenuSelection(index)
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<section
  class:menu-open={screen.type === 'title-menu'}
  class="title-screen"
  aria-label="Project Almost title screen"
>
  <img src="/assets/title/project-almost-title-background.webp" alt="" />
  <div class="title-light" aria-hidden="true"></div>
  <header class="title-logo">
    <i aria-hidden="true">✦</i>
    <h1>{productName}</h1>
  </header>

  {#if screen.type === 'title-intro'}
    <button
      class="title-enter-catcher"
      type="button"
      aria-label="Open title menu"
      onpointerdown={handleIntroPointer}
    ></button>
    <div class="title-prompt" aria-hidden="true">
      <span></span>
      <b>Press Any Button</b>
      <span></span>
    </div>
  {:else}
    <nav aria-label="Title menu">
      {#each TITLE_MENU_ITEMS as item, index}
        <button
          class:active={screen.selectedItemIndex === index}
          type="button"
          onpointerdown={(event) => handleMenuPointer(event, index)}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{menuLabels[item]}</b>
          <i>›</i>
        </button>
      {/each}
    </nav>
    <p class="title-controls">
      <kbd>↑</kbd><kbd>↓</kbd> Select <kbd>Enter</kbd> Confirm <kbd>Esc</kbd> Back
    </p>
  {/if}

  <small class="title-copyright">© 2026 Yuuta Tsubasa Studio</small>
</section>
```

- [ ] **Step 4: Run Svelte and focused behavior checks**

Run:

```bash
npm run check
npm run test -- src/domain/input/controlIntents.test.ts src/application/input/titleControls.test.ts
```

Expected: both commands `PASS`.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add src/App.svelte src/ui/title/TitleScreen.svelte
git commit -m "Wire title controls through control intents"
```

---

### Task 5: Svelte Gamepad Adapter

**Files:**
- Modify: `src/ui/title/TitleScreen.svelte`

- [ ] **Step 1: Run the focused checks before gamepad adapter edits**

Run:

```bash
npm run check
npm run test -- src/domain/input/controlIntents.test.ts src/application/input/titleControls.test.ts
```

Expected: both commands `PASS`.

- [ ] **Step 2: Add gamepad polling to the title Svelte adapter**

Replace `src/ui/title/TitleScreen.svelte` with:

```svelte
<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { TITLE_MENU_ITEMS, type AppScreen } from '../../domain/app/appFlow'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlContext,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'

  type Props = {
    screen: AppScreen
    productName: string
    onControlIntent: (intent: ControlIntent) => void
    onPointerMenuSelection: (selectedItemIndex: number) => void
  }

  let { screen, productName, onControlIntent, onPointerMenuSelection }: Props = $props()

  const menuLabels: Record<(typeof TITLE_MENU_ITEMS)[number], string> = {
    start: 'Start Game',
    settings: 'Settings',
    back: 'Back',
  }

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null
  let gamepadAnimationFrame = 0

  function getControlContext(): ControlContext {
    return screen.type === 'title-intro' ? 'title-intro' : 'title-menu'
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      {
        key: event.key,
        repeat: event.repeat,
      },
      getControlContext(),
    )

    if (!intent) return

    event.preventDefault()
    onControlIntent(intent)
  }

  function handleIntroPointer(event: PointerEvent) {
    event.preventDefault()
    onControlIntent('open')
  }

  function handleMenuPointer(event: PointerEvent, index: number) {
    event.stopPropagation()
    onPointerMenuSelection(index)
  }

  function pollGamepad() {
    const currentSnapshot = readFirstGamepadSnapshot()
    const intents = mapGamepadControlIntents(previousGamepadSnapshot, currentSnapshot, getControlContext())

    for (const intent of intents) {
      onControlIntent(intent)
    }

    previousGamepadSnapshot = currentSnapshot
    gamepadAnimationFrame = requestAnimationFrame(pollGamepad)
  }

  function readFirstGamepadSnapshot(): GamepadControlSnapshot | null {
    const gamepads = navigator.getGamepads?.()
    const gamepad = gamepads?.find((candidate) => candidate?.connected)
    if (!gamepad) return null

    return {
      buttons: gamepad.buttons.map((button) => button.pressed),
      axes: [...gamepad.axes],
    }
  }

  onMount(() => {
    gamepadAnimationFrame = requestAnimationFrame(pollGamepad)
  })

  onDestroy(() => {
    cancelAnimationFrame(gamepadAnimationFrame)
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<section
  class:menu-open={screen.type === 'title-menu'}
  class="title-screen"
  aria-label="Project Almost title screen"
>
  <img src="/assets/title/project-almost-title-background.webp" alt="" />
  <div class="title-light" aria-hidden="true"></div>
  <header class="title-logo">
    <i aria-hidden="true">✦</i>
    <h1>{productName}</h1>
  </header>

  {#if screen.type === 'title-intro'}
    <button
      class="title-enter-catcher"
      type="button"
      aria-label="Open title menu"
      onpointerdown={handleIntroPointer}
    ></button>
    <div class="title-prompt" aria-hidden="true">
      <span></span>
      <b>Press Any Button</b>
      <span></span>
    </div>
  {:else}
    <nav aria-label="Title menu">
      {#each TITLE_MENU_ITEMS as item, index}
        <button
          class:active={screen.selectedItemIndex === index}
          type="button"
          onpointerdown={(event) => handleMenuPointer(event, index)}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{menuLabels[item]}</b>
          <i>›</i>
        </button>
      {/each}
    </nav>
    <p class="title-controls">
      <kbd>↑</kbd><kbd>↓</kbd> Select <kbd>Enter</kbd> Confirm <kbd>Esc</kbd> Back
    </p>
  {/if}

  <small class="title-copyright">© 2026 Yuuta Tsubasa Studio</small>
</section>
```

- [ ] **Step 3: Run Svelte, focused tests, and build checks**

Run:

```bash
npm run check
npm run test -- src/domain/input/controlIntents.test.ts src/application/input/titleControls.test.ts
npm run build
```

Expected: all commands `PASS`.

- [ ] **Step 4: Commit Task 5**

Run:

```bash
git add src/ui/title/TitleScreen.svelte
git commit -m "Add title gamepad control adapter"
```

---

### Task 6: Final Verification

**Files:**
- Verify: all files changed by Tasks 1-5

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected: all commands `PASS`.

- [ ] **Step 2: Review final git status**

Run:

```bash
git status --short
```

Expected: no output after the final task commits.

- [ ] **Step 3: Manual browser verification**

Run:

```bash
npm run dev
```

Expected: Vite serves the app at `http://127.0.0.1:1420/`.

Manual checks:

- Keyboard: press any key from the intro, use `ArrowUp`, `ArrowDown`, `w`, `s`, `Enter`, Space, and `Escape` in the menu.
- Pointer: click the intro overlay and click the menu buttons; `Back` returns to the intro.
- Touch: tap the intro overlay and tap `Back` on a touch-capable browser or simulator.
- Gamepad: press south face button to open/confirm, east face button to back out, D-pad up/down and left stick up/down to move once per press or threshold crossing.

- [ ] **Step 4: Stop the dev server**

Stop the `npm run dev` process with `Ctrl-C`.

Expected: no development server remains running.
