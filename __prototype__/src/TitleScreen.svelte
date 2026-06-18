<script lang="ts">
  import { IMAGE_ASSETS } from './game/assets/assetManifest'
  import { translator } from './i18n'

  let {
    menuOpen,
    selectedItem,
    onOpenMenu,
    onSelect,
    onActivate,
  }: {
    menuOpen: boolean
    selectedItem: number
    onOpenMenu: () => void
    onSelect: (index: number) => void
    onActivate: (index: number) => void
  } = $props()

  const menuItems = ['title.start', 'title.settings', 'common.back'] as const
</script>

<section class:menu-open={menuOpen} class="title-screen" aria-label="Project Almost title screen">
  <img src={IMAGE_ASSETS.titleBackground} alt="" />
  <div class="title-light" aria-hidden="true"></div>
  <header class="title-logo">
    <i aria-hidden="true">✦</i>
    <h1>Project Almost</h1>
  </header>

  {#if !menuOpen}
    <button class="title-enter-catcher" aria-label="Open title menu" onclick={onOpenMenu}></button>
    <div class="title-prompt" aria-hidden="true">
      <span></span>
      <b>{$translator('title.pressAny')}</b>
      <span></span>
    </div>
  {:else}
    <nav aria-label="Title menu">
      {#each menuItems as item, index}
        <button
          class:active={selectedItem === index}
          onclick={(event) => {
            event.stopPropagation()
            onSelect(index)
            onActivate(index)
          }}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{$translator(item)}</b>
          <i>›</i>
        </button>
      {/each}
    </nav>
    <p class="title-controls"><kbd>↑</kbd><kbd>↓</kbd> {$translator('common.select')} <kbd>Enter</kbd> {$translator('common.confirm')}</p>
  {/if}
  <small class="title-copyright">© 2026 Yuuta Tsubasa Studio</small>
</section>
