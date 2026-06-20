<script lang="ts">
  export type ControlHint = {
    keys: readonly string[]
    label: string
  }

  type Props = {
    hints: readonly ControlHint[]
    className?: string
    ariaLabel?: string
  }

  let { hints, className = '', ariaLabel }: Props = $props()
</script>

<div class={`control-hints ${className}`} aria-label={ariaLabel}>
  {#each hints as hint}
    <span>
      {#each hint.keys as key}
        <kbd>{key}</kbd>
      {/each}
      {hint.label}
    </span>
  {/each}
</div>
