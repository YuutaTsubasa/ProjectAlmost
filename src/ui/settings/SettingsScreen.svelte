<script lang="ts">
  import { onMount } from 'svelte'
  import type { SettingsScreen } from '../../domain/app/appFlow'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizationKey,
    type LocalizeData,
  } from '../../domain/data/localize/localize'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'
  import type { GameSettings } from '../../domain/settings/settings'
  import SettingsPanel from './SettingsPanel.svelte'

  type Props = {
    screen: SettingsScreen
    settings: GameSettings
    localizeData: LocalizeData
    locale: LocaleCode
    onControlIntent: (intent: ControlIntent) => void
    onSelectItem: (index: number) => void
    onAdjustItem: (index: number, direction: -1 | 1) => void
    onActivateItem: (index: number) => void
    onCancelDelete: () => void
    onConfirmDelete: () => void
  }

  let {
    screen,
    settings,
    localizeData,
    locale,
    onControlIntent,
    onSelectItem,
    onAdjustItem,
    onActivateItem,
    onCancelDelete,
    onConfirmDelete,
  }: Props = $props()

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function controlContext() {
    return screen.deleteConfirm ? 'settings-delete-confirm' : 'settings'
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      controlContext(),
    )

    if (intent) {
      event.preventDefault()
      onControlIntent(intent)
    }
  }

  function readGamepadSnapshot(): GamepadControlSnapshot | null {
    const gamepads = navigator.getGamepads?.()
    const gamepad = Array.from(gamepads ?? []).find((candidate): candidate is Gamepad => Boolean(candidate))
    if (!gamepad) return null

    return {
      mapping: gamepad.mapping,
      buttons: gamepad.buttons.map((button) => button.pressed),
      axes: [...gamepad.axes],
    }
  }

  onMount(() => {
    let frameId = 0

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      const intents = mapGamepadControlIntents(previousGamepadSnapshot, currentSnapshot, controlContext())

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

<section class="settings-screen" aria-label={text('settings.aria.screen')}>
  <img src="/assets/title/project-almost-title-background.webp" alt="" />
  <div class="settings-backdrop" aria-hidden="true"></div>

  <SettingsPanel
    {screen}
    {settings}
    {localizeData}
    {locale}
    {onSelectItem}
    {onAdjustItem}
    {onActivateItem}
    {onCancelDelete}
    {onConfirmDelete}
  />
</section>

<style>
  .settings-screen {
    position: relative;
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    overflow: hidden;
    color: var(--hud-ink, #123257);
  }

  .settings-screen > img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .settings-backdrop {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.18), transparent 32%),
      linear-gradient(180deg, rgba(8, 20, 42, 0.34), rgba(8, 20, 42, 0.68));
    backdrop-filter: blur(2px);
  }
</style>
