<script lang="ts">
  type LoadingProgressView = {
    completed: number
    total: number
    percent: number
    warningCount: number
    status: 'idle' | 'loading' | 'ready' | 'ready-with-errors'
  }

  type Props = {
    progress: LoadingProgressView
    phaseLabel: string
    productName: string
    titleLabel: string
    warningLabel: string
  }

  let { progress, phaseLabel, productName, titleLabel, warningLabel }: Props = $props()
</script>

<section class="loading-screen" data-status={progress.status} aria-label={titleLabel}>
  <div class="loading-screen-mark" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
  </div>

  <header class="loading-screen-header">
    <span class="loading-screen-kicker">{productName}</span>
    <h1>{titleLabel}</h1>
  </header>

  <div class="loading-screen-status" aria-live="polite">
    <span>{phaseLabel}</span>
    <strong>{progress.percent}%</strong>
  </div>

  <div
    class="loading-screen-progress"
    role="progressbar"
    aria-label={phaseLabel}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={progress.percent}
  >
    <span style={`width: ${progress.percent}%`}></span>
  </div>

  <div class="loading-screen-count">
    <span>{String(progress.completed).padStart(2, '0')}</span>
    <span>/ {String(progress.total).padStart(2, '0')}</span>
  </div>

  {#if progress.warningCount > 0}
    <p class="loading-screen-warning" role="status">
      <span aria-hidden="true">!</span>
      {warningLabel}
    </p>
  {/if}
</section>
