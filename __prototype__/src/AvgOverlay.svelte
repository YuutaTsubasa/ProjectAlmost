<script lang="ts">
  import type { AvgSequence } from './game/avg/avgTypes'
  import { translator } from './i18n'

  export let sequence: AvgSequence
  export let lineIndex: number
  export let onAdvance: () => void
  export let onSkip: () => void

  $: line = sequence.lines[lineIndex]
  $: activeCharacter = sequence.characters.find((character) => character.id === line.speaker)
</script>

<section class="avg-overlay" aria-label="Story dialogue">
  <div class="avg-veil"></div>
  <button class="avg-advance" type="button" aria-label="Advance dialogue" onclick={onAdvance}></button>

  {#each sequence.characters as character}
    <img
      class:active={character.id === line.speaker}
      class:left={character.side === 'left'}
      class:right={character.side === 'right'}
      class="avg-character"
      src={character.portrait}
      alt={$translator(character.name)}
    />
  {/each}

  <button
    class="avg-skip"
    type="button"
    aria-label={$translator('avg.skip')}
    onclick={(event) => {
      event.stopPropagation()
      onSkip()
    }}
  >{$translator('avg.skip')}</button>

  <div class="avg-name">{$translator(activeCharacter?.name ?? 'avg.speaker.yuuta')}</div>
  <div class="avg-dialogue">
    <p>{$translator(line.text)}</p>
    <div class="avg-progress">
      {#each sequence.lines as _, index}
        <i class:active={index <= lineIndex}></i>
      {/each}
    </div>
    <span class="avg-next">▼</span>
  </div>
</section>
