<script lang="ts">
  import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from '../../domain/display/resolution'

  let { children } = $props()
</script>

<div
  class="resolution-frame"
  style:--virtual-width={String(VIRTUAL_WIDTH)}
  style:--virtual-height={String(VIRTUAL_HEIGHT)}
>
  {@render children?.()}
</div>
