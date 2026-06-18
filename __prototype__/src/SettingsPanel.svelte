<script lang="ts">
  import { translator, type Locale, type TranslationKey } from './i18n'

  export type GameSettings = {
    masterVolume: number
    musicVolume: number
    sfxVolume: number
    language: Locale
    fullscreen: boolean
    screenShake: boolean
    vibration: boolean
  }

  let {
    settings,
    selectedItem,
    onSelect,
    onAdjust,
    onActivate,
    confirmDelete,
    confirmSelection,
    onCancelDelete,
    onConfirmDelete,
  }: {
    settings: GameSettings
    selectedItem: number
    onSelect: (index: number) => void
    onAdjust: (index: number, direction: number) => void
    onActivate: (index: number) => void
    confirmDelete: boolean
    confirmSelection: number
    onCancelDelete: () => void
    onConfirmDelete: () => void
  } = $props()

  const items: Array<{ label: TranslationKey; kind: 'volume' | 'choice' | 'toggle' | 'action' | 'danger' }> = [
    { label: 'settings.masterVolume', kind: 'volume' },
    { label: 'settings.musicVolume', kind: 'volume' },
    { label: 'settings.sfxVolume', kind: 'volume' },
    { label: 'settings.language', kind: 'choice' },
    { label: 'settings.fullscreen', kind: 'toggle' },
    { label: 'settings.screenShake', kind: 'toggle' },
    { label: 'settings.vibration', kind: 'toggle' },
    { label: 'settings.reset', kind: 'action' },
    { label: 'settings.deleteSave', kind: 'danger' },
    { label: 'common.back', kind: 'action' },
  ] as const

  function valueFor(index: number) {
    if (index === 0) return `${settings.masterVolume}%`
    if (index === 1) return `${settings.musicVolume}%`
    if (index === 2) return `${settings.sfxVolume}%`
    if (index === 3) return $translator(`language.${settings.language}` as TranslationKey)
    if (index === 4) return $translator(settings.fullscreen ? 'common.on' : 'common.off')
    if (index === 5) return $translator(settings.screenShake ? 'common.on' : 'common.off')
    if (index === 6) return $translator(settings.vibration ? 'common.on' : 'common.off')
    return ''
  }
</script>

<div class="settings-panel">
  <span class="pause-kicker">{$translator('settings.systemMenu')}</span>
  <strong>{$translator('settings.title')}</strong>
  <div class="pause-rule"></div>

  <div class="settings-list" role="menu" aria-label="Settings">
    {#each items as item, index}
      {#if item.kind === 'volume'}
        <div
          class:active={selectedItem === index}
          class="settings-row"
          role="menuitem"
          tabindex="0"
          onclick={() => onSelect(index)}
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.code === 'Space') onSelect(index)
          }}
        >
          <span class="settings-index">{String(index + 1).padStart(2, '0')}</span>
          <b>{$translator(item.label)}</b>
          <span class="settings-adjust">
            <button
              aria-label={$translator('settings.decrease', { item: $translator(item.label) })}
              onclick={(event) => {
                event.stopPropagation()
                onSelect(index)
                onAdjust(index, -1)
              }}
            >−</button>
            <span class="settings-value">{valueFor(index)}</span>
            <button
              aria-label={$translator('settings.increase', { item: $translator(item.label) })}
              onclick={(event) => {
                event.stopPropagation()
                onSelect(index)
                onAdjust(index, 1)
              }}
            >+</button>
          </span>
          <span class="settings-meter" aria-hidden="true">
            <i style={`width:${index === 0 ? settings.masterVolume : index === 1 ? settings.musicVolume : settings.sfxVolume}%`}></i>
          </span>
        </div>
      {:else}
        <button
          class:active={selectedItem === index}
          class:action={item.kind === 'action'}
          class:danger={item.kind === 'danger'}
          role="menuitem"
          onclick={() => {
            onSelect(index)
            onActivate(index)
          }}
        >
          <span class="settings-index">{String(index + 1).padStart(2, '0')}</span>
          <b>{$translator(item.label)}</b>
          {#if valueFor(index)}
            <span class="settings-value">{valueFor(index)}</span>
          {:else}
            <span class="settings-action-mark">›</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  <p><kbd>↑</kbd><kbd>↓</kbd> {$translator('common.select')} <kbd>←</kbd><kbd>→</kbd> {$translator('common.adjust')} <kbd>Esc</kbd> {$translator('common.back')}</p>
</div>

{#if confirmDelete}
  <div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-label="Delete save data confirmation">
    <div>
      <span class="pause-kicker">{$translator('common.warning')}</span>
      <strong>{$translator('settings.deleteTitle')}</strong>
      <p>{$translator('settings.deleteBody')}</p>
      <nav>
        <button class:active={confirmSelection === 0} onclick={onCancelDelete}>{$translator('common.cancel')}</button>
        <button class:active={confirmSelection === 1} class="danger" onclick={onConfirmDelete}>{$translator('common.delete')}</button>
      </nav>
    </div>
  </div>
{/if}
