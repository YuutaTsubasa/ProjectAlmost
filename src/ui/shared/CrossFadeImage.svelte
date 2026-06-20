<script lang="ts">
  import { onDestroy } from 'svelte'

  type Props = {
    src: string
    durationMs?: number
    class?: string
  }

  let { src, durationMs = 420, class: className = '' }: Props = $props()

  let currentSrc = $state('')
  let previousSrc = $state<string | null>(null)
  let previousTimer: ReturnType<typeof setTimeout> | null = null

  $effect(() => {
    if (!src) return

    if (!currentSrc) {
      currentSrc = src
      return
    }

    if (src === currentSrc) return

    previousSrc = currentSrc
    currentSrc = src

    if (previousTimer) clearTimeout(previousTimer)
    previousTimer = setTimeout(() => {
      previousSrc = null
      previousTimer = null
    }, durationMs)
  })

  onDestroy(() => {
    if (previousTimer) clearTimeout(previousTimer)
  })
</script>

<div class={`crossfade-image ${className}`} aria-hidden="true">
  {#if previousSrc}
    <div
      class="crossfade-image-layer previous"
      style={`--crossfade-image: url("${previousSrc}"); --crossfade-duration: ${durationMs}ms`}
    ></div>
  {/if}

  {#if currentSrc}
    {#key currentSrc}
      <div
        class="crossfade-image-layer current"
        style={`--crossfade-image: url("${currentSrc}"); --crossfade-duration: ${durationMs}ms`}
      ></div>
    {/key}
  {/if}
</div>
