<script lang="ts">
  import { PAUSE_MENU_ITEMS, type PauseAction, type PauseMenuItem } from '../../domain/gameplay/gameplayPause'
  import type { LocalizationKey, LocaleCode, LocalizeData } from '../../domain/data/localize/localize'
  import { resolveLocalizedText } from '../../domain/data/localize/localize'
  import ControlHints from '../controls/ControlHints.svelte'

  type Props = {
    selectedItemIndex: number
    localizeData: LocalizeData
    locale: LocaleCode
    onSelectItem: (index: number) => void
    onAction: (action: PauseAction) => void
  }

  let { selectedItemIndex, localizeData, locale, onSelectItem, onAction }: Props = $props()

  const pauseLabelRefs: Record<PauseMenuItem, LocalizationKey> = {
    'resume': 'pause.resume',
    'restart-stage': 'pause.restart',
    'settings': 'settings.title',
    'stage-select': 'pause.stageSelect',
  }

  const pauseActionByItem: Record<PauseMenuItem, PauseAction> = {
    'resume': 'resume',
    'restart-stage': 'restart-stage',
    'settings': 'open-settings',
    'stage-select': 'stage-select',
  }

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function handleClick(item: PauseMenuItem, index: number): void {
    onSelectItem(index)
    onAction(pauseActionByItem[item])
  }
</script>

<div class="pause-overlay" role="presentation">
  <div class="pause-menu">
    <span class="pause-kicker">{text('settings.systemMenu')}</span>
    <strong>{text('pause.paused')}</strong>
    <div class="pause-rule"></div>

    <nav aria-label={text('pause.aria.menu')}>
      {#each PAUSE_MENU_ITEMS as item, index}
        <button
          class:active={selectedItemIndex === index}
          type="button"
          onclick={() => handleClick(item, index)}
          onmouseenter={() => onSelectItem(index)}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{text(pauseLabelRefs[item])}</b>
        </button>
      {/each}
    </nav>

    <ControlHints
      className="pause-controls"
      hints={[
        { keys: ['↑', '↓'], label: text('common.select') },
        { keys: ['Enter'], label: text('common.confirm') },
        { keys: ['Esc'], label: text('pause.resume') },
      ]}
    />
  </div>
</div>

<style>
  .pause-overlay {
    position: absolute;
    inset: 0;
    z-index: 22;
    display: grid;
    place-items: center;
    container-type: size;
    background:
      linear-gradient(90deg, rgba(7, 22, 48, 0.2), rgba(7, 22, 48, 0.62), rgba(7, 22, 48, 0.2)),
      rgba(12, 42, 82, 0.2);
    pointer-events: auto;
    backdrop-filter: blur(4px) saturate(78%);
    animation: pause-backdrop-in 220ms ease-out both;
  }

  .pause-menu {
    --accent: #2f6fd0;
    --accent-pale: color-mix(in oklab, var(--accent) 16%, #ffffff);
    --glow: color-mix(in oklab, var(--accent) 40%, #ffffff);
    --hud-ink: color-mix(in oklab, var(--accent) 64%, #08152e);
    --hud-soft: color-mix(in oklab, var(--accent) 50%, #38507a);
    --hud-line: color-mix(in srgb, var(--accent) 55%, transparent);
    --hud-line-soft: color-mix(in srgb, var(--accent) 30%, transparent);
    --hud-panel: color-mix(in srgb, color-mix(in srgb, var(--accent) 13%, #ffffff) 72%, transparent);
    position: relative;
    width: min(31cqw, 520px);
    padding: 2.4cqh 1.5cqw 1.6cqh;
    border: 1.5px solid var(--hud-line);
    border-radius: 8px;
    background: color-mix(in srgb, var(--hud-panel) 92%, white);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 0 0 4px rgba(255, 255, 255, 0.22),
      0 28px 70px rgba(6, 27, 62, 0.48);
    color: var(--hud-ink);
    text-align: center;
    animation: pause-menu-in 260ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
  }

  .pause-menu::after {
    content: "";
    position: absolute;
    inset: 6px;
    border: 1px solid var(--hud-line-soft);
    border-radius: 4px;
    pointer-events: none;
  }

  .pause-kicker {
    display: block;
    color: var(--hud-soft);
    font-size: min(0.68cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .pause-menu > strong {
    display: block;
    margin-top: 0.4cqh;
    color: var(--hud-ink);
    font-size: min(3cqw, 58px);
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  .pause-rule {
    height: 1px;
    margin: 1.8cqh 0 1.25cqh;
    background: linear-gradient(90deg, transparent, var(--hud-line), transparent);
  }

  .pause-menu nav {
    display: grid;
    gap: 0.7cqh;
  }

  .pause-menu nav button {
    position: relative;
    display: grid;
    min-height: 5.1cqh;
    grid-template-columns: 2.4cqw 1fr auto;
    gap: 0.65cqw;
    align-items: center;
    padding: 0.55cqh 0.8cqw;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.38);
    color: var(--hud-ink);
    cursor: pointer;
    text-align: left;
    animation: pause-item-in 220ms ease-out both;
  }

  .pause-menu nav button:nth-child(1) { animation-delay: 80ms; }
  .pause-menu nav button:nth-child(2) { animation-delay: 115ms; }
  .pause-menu nav button:nth-child(3) { animation-delay: 150ms; }
  .pause-menu nav button:nth-child(4) { animation-delay: 185ms; }

  .pause-menu nav button::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: transparent;
  }

  .pause-menu nav button.active {
    border-color: var(--hud-line);
    background: linear-gradient(90deg, rgba(110, 195, 255, 0.34), rgba(255, 255, 255, 0.7));
    box-shadow: 0 0 14px rgba(47, 111, 208, 0.14);
  }

  .pause-menu nav button.active::before {
    background: var(--accent);
    box-shadow: 0 0 8px var(--glow);
  }

  .pause-menu nav button span {
    color: var(--hud-soft);
    font-family: Rajdhani, sans-serif;
    font-size: min(0.73cqw, 14px);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .pause-menu nav button b {
    font-size: min(1.15cqw, 22px);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  :global(.pause-controls) {
    margin-top: 1.6cqh;
  }

  @keyframes pause-backdrop-in {
    from { opacity: 0; backdrop-filter: blur(0) saturate(100%); }
    to { opacity: 1; backdrop-filter: blur(4px) saturate(78%); }
  }

  @keyframes pause-menu-in {
    from { opacity: 0; scale: 0.92; translate: 0 10px; }
    to { opacity: 1; scale: 1; translate: 0 0; }
  }

  @keyframes pause-item-in {
    from { opacity: 0; translate: 0 8px; }
    to { opacity: 1; translate: 0 0; }
  }
</style>
