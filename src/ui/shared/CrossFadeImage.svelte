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
  let previousOpacity = $state(1)
  let fadeFrame: ReturnType<typeof requestAnimationFrame> | null = null
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

  function cancelPreviousFade(): void {
    if (!fadeFrame) return

    cancelAnimationFrame(fadeFrame)
    fadeFrame = null
  }

  function effectiveDurationMs(): number {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return 0
    }

    return durationMs
  }

  function startPreviousFade(): void {
    cancelPreviousFade()

    previousOpacity = 1
    const fadeDurationMs = effectiveDurationMs()

    fadeFrame = requestAnimationFrame((startedAt) => {
      const step = (now: number) => {
        const progress = fadeDurationMs <= 0 ? 1 : Math.min((now - startedAt) / fadeDurationMs, 1)
        previousOpacity = 1 - progress

        if (progress < 1 && previousSrc) {
          fadeFrame = requestAnimationFrame(step)
          return
        }

        previousSrc = null
        previousOpacity = 1
        fadeFrame = null
      }

      step(startedAt)
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

        cancelPreviousFade()
        previousSrc = currentSrc
        previousOpacity = 1
        currentSrc = nextSrc
        startPreviousFade()
      })

    return () => {
      cancelled = true
    }
  })

  onDestroy(() => {
    cancelPreviousFade()
  })
</script>

<div class={`crossfade-image ${className}`} aria-hidden="true">
  {#if previousSrc}
    <div
      class="crossfade-image-layer previous"
      style={`--crossfade-image: url("${previousSrc}"); --crossfade-duration: ${durationMs}ms; opacity: ${previousOpacity}`}
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
