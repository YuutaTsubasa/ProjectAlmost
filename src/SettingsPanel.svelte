<script lang="ts">
  export type GameSettings = {
    masterVolume: number
    musicVolume: number
    sfxVolume: number
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

  const items = [
    { label: 'Master Volume', kind: 'volume' },
    { label: 'Music Volume', kind: 'volume' },
    { label: 'SFX Volume', kind: 'volume' },
    { label: 'Fullscreen', kind: 'toggle' },
    { label: 'Screen Shake', kind: 'toggle' },
    { label: 'Controller Vibration', kind: 'toggle' },
    { label: 'Reset to Default', kind: 'action' },
    { label: 'Delete Save Data', kind: 'danger' },
    { label: 'Back', kind: 'action' },
  ] as const

  function valueFor(index: number) {
    if (index === 0) return `${settings.masterVolume}%`
    if (index === 1) return `${settings.musicVolume}%`
    if (index === 2) return `${settings.sfxVolume}%`
    if (index === 3) return settings.fullscreen ? 'On' : 'Off'
    if (index === 4) return settings.screenShake ? 'On' : 'Off'
    if (index === 5) return settings.vibration ? 'On' : 'Off'
    return ''
  }
</script>

<div class="settings-panel">
  <span class="pause-kicker">System Menu</span>
  <strong>Settings</strong>
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
          <b>{item.label}</b>
          <span class="settings-adjust">
            <button
              aria-label={`Decrease ${item.label}`}
              onclick={(event) => {
                event.stopPropagation()
                onSelect(index)
                onAdjust(index, -1)
              }}
            >−</button>
            <span class="settings-value">{valueFor(index)}</span>
            <button
              aria-label={`Increase ${item.label}`}
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
          <b>{item.label}</b>
          {#if valueFor(index)}
            <span class:enabled={valueFor(index) === 'On'} class="settings-value">{valueFor(index)}</span>
          {:else}
            <span class="settings-action-mark">›</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  <p><kbd>↑</kbd><kbd>↓</kbd> Select <kbd>←</kbd><kbd>→</kbd> Adjust <kbd>Esc</kbd> Back</p>
</div>

{#if confirmDelete}
  <div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-label="Delete save data confirmation">
    <div>
      <span class="pause-kicker">Warning</span>
      <strong>Delete Save Data?</strong>
      <p>All stage clears, unlocks, records, and best ranks will be permanently deleted.</p>
      <nav>
        <button class:active={confirmSelection === 0} onclick={onCancelDelete}>Cancel</button>
        <button class:active={confirmSelection === 1} class="danger" onclick={onConfirmDelete}>Delete</button>
      </nav>
    </div>
  </div>
{/if}
