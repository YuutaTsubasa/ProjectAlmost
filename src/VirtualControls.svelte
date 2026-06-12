<script lang="ts">
  export let onPause: () => void

  let stickPointerId: number | undefined
  let stickX = 0
  let stickY = 0

  function emit(detail: Record<string, unknown>) {
    window.dispatchEvent(new CustomEvent('projectrun:virtual-input', { detail }))
  }

  function updateStick(event: PointerEvent) {
    const element = event.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    const radius = rect.width * 0.34
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy)
    const scale = length > radius ? radius / length : 1
    stickX = dx * scale
    stickY = dy * scale
    emit({ type: 'move', x: Math.abs(dx / radius) > 0.28 ? Math.sign(dx) : 0 })
  }

  function startStick(event: PointerEvent) {
    stickPointerId = event.pointerId
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    updateStick(event)
  }

  function moveStick(event: PointerEvent) {
    if (event.pointerId === stickPointerId) updateStick(event)
  }

  function releaseStick(event: PointerEvent) {
    if (event.pointerId !== stickPointerId) return
    stickPointerId = undefined
    stickX = 0
    stickY = 0
    emit({ type: 'move', x: 0 })
  }

  function pressAction(action: 'jump' | 'attack') {
    emit({ type: action })
  }
</script>

<div class="virtual-controls" aria-label="Touch controls">
  <button
    class="virtual-pause"
    aria-label="Pause"
    onpointerdown={(event) => {
      event.preventDefault()
      onPause()
    }}
  >Ⅱ</button>

  <div
    class="virtual-stick"
    role="slider"
    aria-label="Move"
    aria-valuemin="-1"
    aria-valuemax="1"
    aria-valuenow={stickX === 0 ? 0 : Math.sign(stickX)}
    tabindex="0"
    onpointerdown={startStick}
    onpointermove={moveStick}
    onpointerup={releaseStick}
    onpointercancel={releaseStick}
  >
    <i style={`transform:translate(${stickX}px, ${stickY}px)`}></i>
  </div>

  <div class="virtual-actions">
    <button
      class="virtual-action jump"
      aria-label="Jump"
      onpointerdown={(event) => {
        event.preventDefault()
        pressAction('jump')
      }}
    ><b>↑</b><span>Jump</span></button>
    <button
      class="virtual-action attack"
      aria-label="Attack"
      onpointerdown={(event) => {
        event.preventDefault()
        pressAction('attack')
      }}
    ><b>✦</b><span>Attack</span></button>
  </div>
</div>
