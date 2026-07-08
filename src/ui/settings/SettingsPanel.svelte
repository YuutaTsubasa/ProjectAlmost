<script lang="ts">
  import type { SettingsScreen } from '../../domain/app/appFlow'
  import type { LocalizationKey, LocaleCode, LocalizeData } from '../../domain/data/localize/localize'
  import { resolveLocalizedText } from '../../domain/data/localize/localize'
  import { SETTINGS_ROWS, type GameSettings, type SettingsRowId } from '../../domain/settings/settings'
  import ControlHints from '../controls/ControlHints.svelte'

  type Props = {
    screen: SettingsScreen
    settings: GameSettings
    localizeData: LocalizeData
    locale: LocaleCode
    onSelectItem: (index: number) => void
    onAdjustItem: (index: number, direction: -1 | 1) => void
    onActivateItem: (index: number) => void
    onCancelDelete: () => void
    onConfirmDelete: () => void
    onBackLabel?: LocalizationKey
  }

  let {
    screen,
    settings,
    localizeData,
    locale,
    onSelectItem,
    onAdjustItem,
    onActivateItem,
    onCancelDelete,
    onConfirmDelete,
    onBackLabel = 'common.back',
  }: Props = $props()

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
</script>

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

  <ControlHints
    className="settings-controls"
    hints={[
      { keys: ['↑', '↓'], label: text('common.select') },
      { keys: ['←', '→'], label: text('common.adjust') },
      { keys: ['Esc'], label: text(onBackLabel) },
    ]}
  />
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

<style>
  .settings-panel {
    position: relative;
    box-sizing: border-box;
    width: 40cqw;
    max-width: calc(100cqw - 4cqw);
    max-height: 92cqh;
    padding: 1.25cqh 1.25cqw 0.9cqh;
    border: 1.5px solid var(--hud-line, rgba(58, 116, 176, 0.42));
    border-radius: 8px;
    background: color-mix(in srgb, var(--hud-panel, #f8fdff) 94%, white);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 0 0 4px rgba(255, 255, 255, 0.22),
      0 28px 70px rgba(6, 27, 62, 0.48);
    color: var(--hud-ink, #123257);
    text-align: center;
    animation: pause-menu-in 260ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
  }

  .settings-panel::after {
    content: "";
    position: absolute;
    inset: 6px;
    border: 1px solid var(--hud-line-soft, rgba(58, 116, 176, 0.24));
    border-radius: 4px;
    pointer-events: none;
  }

  .pause-kicker {
    display: block;
    color: var(--accent, #3d8fe8);
    font-family: var(--mono);
    font-size: min(1.39cqh, 16px);
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .pause-rule {
    width: 100%;
    height: 1px;
    margin: 1cqh 0;
    background: linear-gradient(90deg, transparent, var(--hud-line, rgba(58, 116, 176, 0.42)), transparent);
  }

  .settings-panel > strong {
    display: block;
    margin-top: 0.15cqh;
    font-size: 2.25cqw;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  .settings-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.22cqh;
  }

  .settings-list > button,
  .settings-row {
    position: relative;
    display: grid;
    grid-template-columns: 1.8cqw minmax(0, 1fr) auto;
    gap: 0.5cqw;
    align-items: center;
    min-height: min(3.75cqh, 42px);
    padding: 0.22cqh 0.65cqw;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.4);
    color: var(--hud-ink, #123257);
    text-align: left;
    cursor: pointer;
  }

  .settings-row {
    grid-template-rows: 3.33cqh 0.35cqh;
    row-gap: 0.35cqh;
    min-height: min(4.72cqh, 48px);
    padding-bottom: 0.35cqh;
  }

  .settings-row > .settings-index,
  .settings-row > b,
  .settings-row > .settings-adjust {
    grid-row: 1;
  }

  .settings-list > button::before,
  .settings-row::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: transparent;
  }

  .settings-list > button.active,
  .settings-row.active {
    border-color: var(--hud-line, rgba(58, 116, 176, 0.42));
    background: linear-gradient(90deg, rgba(110, 195, 255, 0.36), rgba(255, 255, 255, 0.76));
    box-shadow: 0 0 14px rgba(47, 111, 208, 0.14);
  }

  .settings-list > button.active::before,
  .settings-row.active::before {
    background: var(--accent, #3d8fe8);
    box-shadow: 0 0 8px var(--glow, rgba(61, 143, 232, 0.45));
  }

  .settings-list > button.danger {
    color: #9c3040;
  }

  .settings-list > button.danger.active {
    border-color: rgba(184, 49, 68, 0.55);
    background: linear-gradient(90deg, rgba(255, 184, 190, 0.48), rgba(255, 255, 255, 0.78));
  }

  .settings-index {
    color: var(--hud-soft, #5c7796);
    font-size: min(1.39cqh, 16px);
    font-weight: 700;
  }

  .settings-list > button b,
  .settings-row > b {
    overflow: hidden;
    font-size: min(1cqw, 22px);
    letter-spacing: 0.06em;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .settings-meter {
    grid-row: 2;
    grid-column: 2 / -1;
    width: 100%;
    height: 0.35cqh;
    overflow: hidden;
    border-radius: 2px;
    background: rgba(47, 111, 208, 0.14);
  }

  .settings-meter i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--accent, #3d8fe8), #79cfff);
  }

  .settings-value {
    min-width: 2.3cqw;
    color: var(--hud-soft, #5c7796);
    font-size: min(0.88cqw, 19px);
    font-weight: 700;
    text-align: right;
    text-transform: uppercase;
  }

  .settings-adjust {
    display: grid;
    grid-template-columns: 2.1cqw 3.2cqw 2.1cqw;
    gap: 0.28cqw;
    align-items: center;
  }

  .settings-adjust button {
    display: grid;
    width: 100%;
    height: min(3.33cqh, 24px);
    padding: 0;
    place-items: center;
    border: 1px solid var(--hud-line, rgba(58, 116, 176, 0.42));
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.82);
    color: var(--hud-ink, #123257);
    font-size: min(1.94cqh, 22px);
    font-weight: 800;
    cursor: pointer;
  }

  .settings-adjust button:active {
    background: var(--accent-pale, #e6f4ff);
    scale: 0.95;
  }

  .settings-adjust .settings-value {
    min-width: 0;
    text-align: center;
  }

  .settings-action-mark {
    color: var(--accent, #3d8fe8);
    font-size: 1.25cqw;
    line-height: 1;
  }

  :global(.settings-controls) {
    margin: 0.7cqh 0 0;
    font-size: min(1.25cqh, 14px);
  }

  .confirm-dialog {
    position: fixed;
    z-index: 60;
    display: grid;
    inset: 0;
    place-items: center;
    background: rgba(8, 20, 42, 0.62);
    backdrop-filter: blur(5px);
  }

  .confirm-dialog > div {
    width: min(30cqw, 520px);
    padding: 2.4cqh 1.8cqw;
    border: 1px solid rgba(184, 49, 68, 0.55);
    border-radius: 7px;
    background: rgba(248, 253, 255, 0.98);
    box-shadow: 0 28px 70px rgba(6, 27, 62, 0.5);
    color: var(--hud-ink, #123257);
    text-align: center;
  }

  .confirm-dialog strong {
    display: block;
    margin: 0.5cqh 0 1.2cqh;
    color: #922d3c;
    font-size: min(1.7cqw, 34px);
    text-transform: uppercase;
  }

  .confirm-dialog p {
    display: block;
    margin: 0 auto 2cqh;
    color: var(--hud-soft, #5c7796);
    font-size: min(0.75cqw, 15px);
    line-height: 1.55;
    text-transform: none;
  }

  .confirm-dialog nav {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8cqw;
  }

  .confirm-dialog button {
    min-height: 5cqh;
    border: 1px solid var(--hud-line, rgba(58, 116, 176, 0.42));
    border-radius: 5px;
    background: white;
    color: var(--hud-ink, #123257);
    font-weight: 800;
    text-transform: uppercase;
  }

  .confirm-dialog button.active {
    outline: 3px solid rgba(47, 111, 208, 0.22);
    background: var(--accent-pale, #e6f4ff);
  }

  .confirm-dialog button.danger {
    border-color: rgba(184, 49, 68, 0.55);
    color: #922d3c;
  }

  .confirm-dialog button.danger.active {
    outline-color: rgba(184, 49, 68, 0.24);
    background: #ffe8eb;
  }
</style>
