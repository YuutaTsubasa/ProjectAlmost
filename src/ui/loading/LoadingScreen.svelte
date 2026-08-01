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
  <div class="loading-screen-backdrop" aria-hidden="true"></div>

  <div class="loading-screen-panel">
    <div class="loading-screen-emblem" aria-hidden="true">✦</div>

    <div class="loading-screen-label" aria-live="polite">
      <span aria-hidden="true"></span>
      <b>{titleLabel}</b>
    </div>

    <div class="loading-screen-status">
      <span>{phaseLabel}</span>
      <strong>{progress.percent}%</strong>
    </div>

    <div
      class="loading-screen-meter"
      role="progressbar"
      aria-label={phaseLabel}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={progress.percent}
    >
      <span class="loading-screen-fill" style={`width: ${progress.percent}%`}></span>
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
  </div>
</section>
