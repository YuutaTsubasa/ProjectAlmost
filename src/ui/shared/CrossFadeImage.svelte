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
  let transitionRequestId = 0

  async function preloadImage(nextSrc: string): Promise<void> {
    const image = new Image()
    image.src = nextSrc

    if (image.decode) {
      await image.decode()
      return
    }

    await new Promise<void>((resolve) => {
      image.onload = () => resolve()
      image.onerror = () => resolve()
    })
  }

  $effect(() => {
    if (!src) return

    if (!currentSrc) {
      currentSrc = src
      return
    }

    if (src === currentSrc) return

    const nextSrc = src
    const requestId = ++transitionRequestId
    let cancelled = false

    preloadImage(nextSrc)
      .catch(() => undefined)
      .then(() => {
        if (cancelled || requestId !== transitionRequestId || nextSrc === currentSrc) return

        previousSrc = currentSrc
        currentSrc = nextSrc

        if (previousTimer) clearTimeout(previousTimer)
        previousTimer = setTimeout(() => {
          previousSrc = null
          previousTimer = null
        }, durationMs)
      })

    return () => {
      cancelled = true
    }
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
