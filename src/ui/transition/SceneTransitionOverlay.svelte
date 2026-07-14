<script lang="ts">
  import type { SceneTransitionPhase, SceneTransitionStyle } from '../../application/sceneTransition/sceneTransitionPolicy'

  type Props = {
    phase: SceneTransitionPhase
    style: SceneTransitionStyle
  }

  let { phase, style }: Props = $props()
</script>

{#if phase !== 'idle'}
  <div
    class:reveal={phase === 'reveal'}
    class:world-shift={style === 'world-stage-forward' || style === 'world-stage-back'}
    class:reverse={style === 'world-stage-back'}
    class:gameplay={style === 'gameplay'}
    class="scene-transition"
    aria-hidden="true"
  >
    <div class="transition-emblem">✦</div>
  </div>
{/if}
