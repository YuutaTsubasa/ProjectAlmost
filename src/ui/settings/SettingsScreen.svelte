<script lang="ts">
  import { onMount } from 'svelte'
  import type { SettingsScreen as SettingsScreenState } from '../../domain/app/appFlow'
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
  import { SETTINGS_ROWS, type GameSettings, type SettingsRowId } from '../../domain/settings/settings'

  type Props = {
    screen: SettingsScreenState
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

  const rowLabelRefs: Record<SettingsRowId, LocalizationKey> = {
    'master-volume': 'settings.masterVolume',
    'music-volume': 'settings.musicVolume',
    'sfx-volume': 'settings.sfxVolume',
    language: 'settings.language',
    fullscreen: 'settings.fullscreen',
    'screen-shake': 'settings.screenShake',
    vibration: 'settings.vibration',
    reset: 'settings.reset',
    'delete-save': 'settings.deleteSave',
    back: 'common.back',
  }

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function settingValue(index: number): string {
    if (index === 0) return `${settings.masterVolume}%`
    if (index === 1) return `${settings.musicVolume}%`
    if (index === 2) return `${settings.sfxVolume}%`
    if (index === 3) return text(`language.${settings.language}` as LocalizationKey)
    if (index === 4) return text(settings.fullscreen ? 'common.on' : 'common.off')
    if (index === 5) return text(settings.screenShake ? 'common.on' : 'common.off')
    if (index === 6) return text(settings.vibration ? 'common.on' : 'common.off')
    return ''
  }

  function meterValue(index: number): number {
    if (index === 0) return settings.masterVolume
    if (index === 1) return settings.musicVolume
    if (index === 2) return settings.sfxVolume
    return 0
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

  <div class="settings-panel">
    <span class="pause-kicker">{text('settings.systemMenu')}</span>
    <strong>{text('settings.title')}</strong>
    <div class="pause-rule"></div>

    <div class="settings-list" role="menu" aria-label={text('settings.aria.menu')}>
      {#each SETTINGS_ROWS as item, index}
        {#if item.kind === 'volume'}
          <div
            class:active={screen.selectedItemIndex === index}
            class="settings-row"
            role="menuitem"
            tabindex="0"
            onclick={() => onSelectItem(index)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.code === 'Space') onSelectItem(index)
            }}
          >
            <span class="settings-index">{String(index + 1).padStart(2, '0')}</span>
            <b>{text(rowLabelRefs[item.id])}</b>
            <span class="settings-adjust">
              <button
                type="button"
                aria-label={text('settings.decrease').replace('{item}', text(rowLabelRefs[item.id]))}
                onclick={(event) => {
                  event.stopPropagation()
                  onSelectItem(index)
                  onAdjustItem(index, -1)
                }}
              >-</button>
              <span class="settings-value">{settingValue(index)}</span>
              <button
                type="button"
                aria-label={text('settings.increase').replace('{item}', text(rowLabelRefs[item.id]))}
                onclick={(event) => {
                  event.stopPropagation()
                  onSelectItem(index)
                  onAdjustItem(index, 1)
                }}
              >+</button>
            </span>
            <span class="settings-meter" aria-hidden="true">
              <i style={`width:${meterValue(index)}%`}></i>
            </span>
          </div>
        {:else}
          <button
            class:active={screen.selectedItemIndex === index}
            class:action={item.kind === 'action'}
            class:danger={item.kind === 'danger'}
            type="button"
            role="menuitem"
            onclick={() => {
              onSelectItem(index)
              onActivateItem(index)
            }}
          >
            <span class="settings-index">{String(index + 1).padStart(2, '0')}</span>
            <b>{text(rowLabelRefs[item.id])}</b>
            {#if settingValue(index)}
              <span class="settings-value">{settingValue(index)}</span>
            {:else}
              <span class="settings-action-mark">›</span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>

    <p>
      <kbd>↑</kbd><kbd>↓</kbd> {text('common.select')} <kbd>←</kbd><kbd>→</kbd>
      {text('common.adjust')} <kbd>Esc</kbd> {text('common.back')}
    </p>
  </div>

  {#if screen.deleteConfirm}
    <div
      class="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-label={text('settings.aria.deleteConfirm')}
    >
      <div>
        <span class="pause-kicker">{text('common.warning')}</span>
        <strong>{text('settings.deleteTitle')}</strong>
        <p>{text('settings.deleteBody')}</p>
        <nav>
          <button
            class:active={screen.deleteConfirm.selectedActionIndex === 0}
            type="button"
            onclick={onCancelDelete}
          >{text('common.cancel')}</button>
          <button
            class:active={screen.deleteConfirm.selectedActionIndex === 1}
            class="danger"
            type="button"
            onclick={onConfirmDelete}
          >{text('common.delete')}</button>
        </nav>
      </div>
    </div>
  {/if}
</section>
