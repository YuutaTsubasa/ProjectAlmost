<script lang="ts">
  import { onMount } from 'svelte'
  import { TITLE_MENU_ITEMS, type AppScreen } from '../../domain/app/appFlow'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizeData,
    type TitleLocalizationKey,
  } from '../../domain/data/localize/localize'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'

  type TitleScreenState = Extract<AppScreen, { type: 'title-intro' | 'title-menu' }>

  type Props = {
    screen: TitleScreenState
    productName: string
    localizeData: LocalizeData
    locale: LocaleCode
    onControlIntent: (intent: ControlIntent) => void
    onSelectItem: (index: number) => void
  }

  let { screen, productName, localizeData, locale, onControlIntent, onSelectItem }: Props = $props()

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null

  const menuLabelRefs: Record<(typeof TITLE_MENU_ITEMS)[number], TitleLocalizationKey> = {
    start: 'title.menu.start',
    settings: 'title.menu.settings',
    back: 'title.menu.back',
  }

  function text(key: TitleLocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      screen.type,
    )

    if (intent) {
      event.preventDefault()
      onControlIntent(intent)
    }
  }

  function handleMenuClick(index: number) {
    onSelectItem(index)
    onControlIntent('confirm')
  }

  function readGamepadSnapshot(): GamepadControlSnapshot | null {
    const gamepads = navigator.getGamepads?.()
    const gamepad = Array.from(gamepads ?? []).find((candidate): candidate is Gamepad => Boolean(candidate))
    if (!gamepad) return null

    return {
      buttons: gamepad.buttons.map((button) => button.pressed),
      axes: [...gamepad.axes],
    }
  }

  onMount(() => {
    let frameId = 0

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      const intents = mapGamepadControlIntents(previousGamepadSnapshot, currentSnapshot, screen.type)

      for (const intent of intents) {
        onControlIntent(intent)
      }

      previousGamepadSnapshot = currentSnapshot
      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)

    return () => cancelAnimationFrame(frameId)
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<section
  class:menu-open={screen.type === 'title-menu'}
  class="title-screen"
  aria-label={text('title.aria.screen')}
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
      aria-label={text('title.aria.openMenu')}
      onclick={() => onControlIntent('open')}
    ></button>
    <div class="title-prompt" aria-hidden="true">
      <span></span>
      <b>{text('title.prompt.pressAnyButton')}</b>
      <span></span>
    </div>
  {:else}
    <nav aria-label={text('title.aria.menu')}>
      {#each TITLE_MENU_ITEMS as item, index}
        <button
          class:active={screen.selectedItemIndex === index}
          type="button"
          onclick={(event) => {
            event.stopPropagation()
            handleMenuClick(index)
          }}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{text(menuLabelRefs[item])}</b>
          <i>›</i>
        </button>
      {/each}
    </nav>
    <p class="title-controls">
      <kbd>↑</kbd><kbd>↓</kbd> {text('title.controls.select')} <kbd>Enter</kbd>
      {text('title.controls.confirm')} <kbd>Esc</kbd> {text('title.controls.back')}
    </p>
  {/if}

  <small class="title-copyright">© 2026 Yuuta Tsubasa Studio</small>
</section>
