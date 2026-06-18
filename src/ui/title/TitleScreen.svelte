<script lang="ts">
  import { TITLE_MENU_ITEMS, type AppScreen } from '../../domain/app/appFlow'

  type Props = {
    screen: AppScreen
    productName: string
    onOpenMenu: () => void
    onMoveSelection: (direction: -1 | 1) => void
    onActivateSelection: () => void
    onSelectItem: (index: number) => void
  }

  let { screen, productName, onOpenMenu, onMoveSelection, onActivateSelection, onSelectItem }: Props =
    $props()

  const menuLabels: Record<(typeof TITLE_MENU_ITEMS)[number], string> = {
    start: 'Start Game',
    settings: 'Settings',
    back: 'Back',
  }

  function handleKeydown(event: KeyboardEvent) {
    if (screen.type === 'title-intro') {
      onOpenMenu()
      return
    }

    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
      event.preventDefault()
      onMoveSelection(1)
      return
    }

    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
      event.preventDefault()
      onMoveSelection(-1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivateSelection()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onSelectItem(2)
      onActivateSelection()
    }
  }

  function handleMenuClick(index: number) {
    onSelectItem(index)
    if (TITLE_MENU_ITEMS[index] === 'back') {
      onActivateSelection()
    }
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
    <button class="title-enter-catcher" type="button" aria-label="Open title menu" onclick={onOpenMenu}></button>
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
          onclick={(event) => {
            event.stopPropagation()
            handleMenuClick(index)
          }}
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
