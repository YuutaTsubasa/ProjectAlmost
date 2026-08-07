<script lang="ts">
  import {
    getActiveAvgLineView,
  } from '../../domain/avg/avgPlayback'
  import type { AvgPlaybackState } from '../../domain/avg/avgTypes'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizeData,
  } from '../../domain/data/localize/localize'

  type Props = {
    playback: AvgPlaybackState
    localizeData: LocalizeData
    locale: LocaleCode
    onAdvance: () => void
    onSkip: () => void
  }

  let { playback, localizeData, locale, onAdvance, onSkip }: Props = $props()

  const activeLine = $derived(getActiveAvgLineView(playback))
  const sequence = $derived(playback.sequence)

  function text(key: Parameters<typeof resolveLocalizedText>[2]): string {
    return resolveLocalizedText(localizeData, locale, key)
  }
</script>

{#if activeLine}
  <section class="avg-overlay" aria-label={text(activeLine.speaker.nameKey)}>
    <div class="avg-veil" aria-hidden="true"></div>
    <button class="avg-advance" type="button" aria-label={text('common.confirm')} onclick={onAdvance}></button>

    {#each sequence.characters as character}
      <img
        class:active={character.id === activeLine.speaker.id}
        class:left={character.side === 'left'}
        class:right={character.side === 'right'}
        class="avg-character"
        src={character.portraitAssetRef}
        alt={text(character.nameKey)}
      />
    {/each}

    <button
      class="avg-skip"
      type="button"
      aria-label={text('avg.skip')}
      onclick={(event) => {
        event.stopPropagation()
        onSkip()
      }}
    >
      {text('avg.skip')}
    </button>

    <div class="avg-name">{text(activeLine.speaker.nameKey)}</div>
    <div class="avg-dialogue">
      <p>{text(activeLine.line.textKey)}</p>
      <div class="avg-progress" aria-hidden="true">
        {#each sequence.lines as _, index}
          <i class:active={index <= activeLine.lineIndex}></i>
        {/each}
      </div>
      <span class="avg-next" aria-hidden="true">▼</span>
    </div>
  </section>
{/if}

<style>
  .avg-overlay {
    position: absolute;
    inset: 0;
    z-index: 70;
    overflow: hidden;
    color: #17324f;
    cursor: pointer;
    pointer-events: auto;
    animation: avg-overlay-in 360ms ease-out both;
  }

  .avg-veil {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(7, 22, 46, 0.16), transparent 48%),
      linear-gradient(0deg, rgba(4, 13, 29, 0.72), transparent 52%);
    backdrop-filter: saturate(0.72) brightness(0.82);
  }

  .avg-advance {
    position: absolute;
    inset: 0;
    z-index: 1;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .avg-character {
    position: absolute;
    bottom: 12cqh;
    z-index: 2;
    width: 35cqw;
    height: 82cqh;
    object-fit: contain;
    object-position: bottom;
    opacity: 0.44;
    filter: brightness(0.68) saturate(0.62);
    transform: translateY(1.8cqh) scale(0.96);
    transition: opacity 240ms ease, filter 240ms ease, transform 240ms ease;
    pointer-events: none;
  }

  .avg-character.left {
    left: 3cqw;
  }

  .avg-character.right {
    right: 1.5cqw;
  }

  .avg-character.active {
    opacity: 1;
    filter: brightness(1) saturate(1);
    transform: translateY(0) scale(1);
  }

  .avg-dialogue {
    position: absolute;
    right: 4cqw;
    bottom: 4.5cqh;
    left: 4cqw;
    z-index: 2;
    min-height: 18cqh;
    padding: 5.2cqh 5cqw 3.3cqh;
    border: 1px solid rgba(141, 205, 245, 0.9);
    background:
      linear-gradient(105deg, rgba(247, 253, 255, 0.97), rgba(218, 241, 255, 0.94) 68%, rgba(244, 251, 255, 0.96));
    box-shadow:
      inset 0 0 0 0.35cqw rgba(255, 255, 255, 0.48),
      0 1.2cqh 4cqh rgba(3, 18, 42, 0.48);
    clip-path: polygon(1.6% 0, 98.4% 0, 100% 14%, 100% 86%, 98.4% 100%, 1.6% 100%, 0 86%, 0 14%);
    animation: avg-dialogue-in 320ms 100ms ease-out both;
    pointer-events: none;
  }

  .avg-dialogue::before,
  .avg-dialogue::after {
    position: absolute;
    right: 1cqw;
    left: 1cqw;
    height: 1px;
    content: "";
    background: linear-gradient(90deg, transparent, #5caee3 12%, #d6a94e 50%, #5caee3 88%, transparent);
  }

  .avg-dialogue::before {
    top: 1.25cqh;
  }

  .avg-dialogue::after {
    bottom: 1.25cqh;
  }

  .avg-name {
    position: absolute;
    bottom: 23.3cqh;
    left: 7.2cqw;
    z-index: 3;
    min-width: 18cqw;
    padding: 0.7cqh 2cqw;
    color: white;
    background: linear-gradient(180deg, #4a9ce0, #235b9d);
    box-shadow: 0 0.5cqh 1.6cqh rgba(18, 66, 116, 0.35);
    clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%);
    font-size: min(1.15cqw, 22px);
    font-weight: 700;
    text-align: center;
  }

  .avg-dialogue p {
    max-width: 75cqw;
    margin: 0;
    color: #193a5e;
    font-size: min(1.25cqw, 24px);
    font-weight: 600;
    line-height: 1.5;
  }

  .avg-progress {
    position: absolute;
    bottom: 2cqh;
    left: 5cqw;
    display: flex;
    gap: 0.35cqw;
  }

  .avg-progress i {
    width: 1.4cqw;
    height: 0.25cqh;
    background: rgba(55, 111, 166, 0.22);
  }

  .avg-progress i.active {
    background: #d6a94e;
  }

  .avg-next {
    position: absolute;
    right: 3cqw;
    bottom: 2.1cqh;
    color: #2c73b3;
    font-size: min(1cqw, 20px);
    animation: avg-next-pulse 700ms ease-in-out infinite alternate;
  }

  .avg-skip {
    position: absolute;
    top: 3cqh;
    right: 2cqw;
    z-index: 3;
    padding: 0.45cqh 1.1cqw;
    border: 1px solid rgba(199, 227, 247, 0.72);
    background: rgba(15, 49, 86, 0.62);
    color: rgba(255, 255, 255, 0.82);
    font-size: min(0.7cqw, 14px);
    font-weight: 700;
    cursor: pointer;
  }

  .avg-skip:hover,
  .avg-skip:focus-visible {
    background: rgba(247, 253, 255, 0.95);
    color: #17324f;
  }

  @keyframes avg-overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes avg-dialogue-in {
    from { opacity: 0; transform: translateY(3cqh); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes avg-next-pulse {
    from { opacity: 0.42; transform: translateY(-0.25cqh); }
    to { opacity: 1; transform: translateY(0.25cqh); }
  }
</style>
