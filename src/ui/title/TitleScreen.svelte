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
