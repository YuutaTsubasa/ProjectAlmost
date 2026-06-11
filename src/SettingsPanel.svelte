<script lang="ts">
  export type GameSettings = {
    masterVolume: number
    musicVolume: number
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
  }: {
    settings: GameSettings
    selectedItem: number
    onSelect: (index: number) => void
    onAdjust: (index: number, direction: number) => void
    onActivate: (index: number) => void
  } = $props()

  const items = [
    { label: 'Master Volume', kind: 'volume' },
    { label: 'Music Volume', kind: 'volume' },
    { label: 'Fullscreen', kind: 'toggle' },
    { label: 'Screen Shake', kind: 'toggle' },
    { label: 'Controller Vibration', kind: 'toggle' },
    { label: 'Reset to Default', kind: 'action' },
    { label: 'Back', kind: 'action' },
  ] as const

  function valueFor(index: number) {
    if (index === 0) return `${settings.masterVolume}%`
    if (index === 1) return `${settings.musicVolume}%`
    if (index === 2) return settings.fullscreen ? 'On' : 'Off'
    if (index === 3) return settings.screenShake ? 'On' : 'Off'
    if (index === 4) return settings.vibration ? 'On' : 'Off'
    return ''
  }
</script>

<div class="settings-panel">
  <span class="pause-kicker">System Menu</span>
  <strong>Settings</strong>
  <div class="pause-rule"></div>

  <div class="settings-list" role="menu" aria-label="Settings">
    {#each items as item, index}
      <button
        class:active={selectedItem === index}
        class:action={item.kind === 'action'}
        role="menuitem"
        onclick={() => {
          onSelect(index)
          onActivate(index)
        }}
      >
        <span class="settings-index">{String(index + 1).padStart(2, '0')}</span>
        <b>{item.label}</b>
        {#if item.kind === 'volume'}
          <span class="settings-meter" aria-hidden="true">
            <i style={`width:${index === 0 ? settings.masterVolume : settings.musicVolume}%`}></i>
          </span>
        {/if}
        {#if valueFor(index)}
          <span class:enabled={valueFor(index) === 'On'} class="settings-value">{valueFor(index)}</span>
        {:else}
          <span class="settings-action-mark">›</span>
        {/if}
      </button>
    {/each}
  </div>

  <p><kbd>↑</kbd><kbd>↓</kbd> Select <kbd>←</kbd><kbd>→</kbd> Adjust <kbd>Esc</kbd> Back</p>
</div>
