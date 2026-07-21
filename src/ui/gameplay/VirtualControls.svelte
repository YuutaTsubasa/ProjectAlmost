<script lang="ts">
  import {
    getVirtualStickInput,
    type VirtualStickInput,
  } from '../../domain/input/gameplayInput'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizationKey,
    type LocalizeData,
  } from '../../domain/data/localize/localize'

  type Props = {
    localizeData: LocalizeData
    locale: LocaleCode
    onMove: (moveX: -1 | 0 | 1, crouchHeld: boolean) => void
    onJump: () => void
    onAttack: () => void
    onInteraction: () => void
  }

  let {
    localizeData,
    locale,
    onMove,
    onJump,
    onAttack,
    onInteraction,
  }: Props = $props()

  let stickPointerId = $state<number | null>(null)
  let stick = $state<VirtualStickInput>({
    moveX: 0,
    crouchHeld: false,
    knob: { x: 0, y: 0 },
  })

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function updateStick(event: PointerEvent): void {
    const element = event.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    const radius = rect.width * 0.34
    stick = getVirtualStickInput({
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
      radius,
    })
    onMove(stick.moveX, stick.crouchHeld)
  }

  function startStick(event: PointerEvent): void {
    event.preventDefault()
    onInteraction()
    stickPointerId = event.pointerId
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    updateStick(event)
  }

  function moveStick(event: PointerEvent): void {
    event.preventDefault()
    if (event.pointerId === stickPointerId) updateStick(event)
  }

  function releaseStick(event: PointerEvent): void {
    event.preventDefault()
    if (event.pointerId !== stickPointerId) return
    stickPointerId = null
    stick = { moveX: 0, crouchHeld: false, knob: { x: 0, y: 0 } }
    onMove(0, false)
  }

  function pressAction(action: 'jump' | 'attack'): void {
    onInteraction()
    if (action === 'jump') onJump()
    if (action === 'attack') onAttack()
  }
</script>

<div class="virtual-controls" aria-label={text('touch.move')}>
  <div
    class="virtual-stick"
    role="slider"
    aria-label={text('touch.move')}
    aria-valuemin="-1"
    aria-valuemax="1"
    aria-valuenow={stick.moveX}
    tabindex="0"
    onpointerdown={startStick}
    onpointermove={moveStick}
    onpointerup={releaseStick}
    onpointercancel={releaseStick}
  >
    <i style={`transform:translate(${stick.knob.x}px, ${stick.knob.y}px)`}></i>
  </div>

  <div class="virtual-actions">
    <button
      class="virtual-action jump"
      type="button"
      aria-label={text('touch.jump')}
      onpointerdown={(event) => {
        event.preventDefault()
        pressAction('jump')
      }}
    ><b>↑</b><span>{text('touch.jump')}</span></button>
    <button
      class="virtual-action attack"
      type="button"
      aria-label={text('touch.attack')}
      onpointerdown={(event) => {
        event.preventDefault()
        pressAction('attack')
      }}
    ><b>✦</b><span>{text('touch.attack')}</span></button>
  </div>
</div>

<style>
  .virtual-controls {
    --touch-edge-inset: clamp(18px, 3cqh, 42px);
    --touch-bottom-inset: max(19.5cqh, calc(env(safe-area-inset-bottom) + 17.5cqh));
    --touch-action-size: clamp(76px, 7cqw, 116px);
    --touch-action-gap: clamp(12px, 1.2cqw, 22px);
    position: absolute;
    inset: 0;
    z-index: 52;
    pointer-events: none;
    animation: virtual-controls-in 180ms ease-out both;
  }

  .virtual-controls button,
  .virtual-stick {
    pointer-events: auto;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .virtual-stick {
    position: absolute;
    bottom: var(--touch-bottom-inset);
    left: calc(env(safe-area-inset-left) + var(--touch-edge-inset));
    width: clamp(104px, 11cqw, 176px);
    aspect-ratio: 1;
    border: 2px solid rgba(255, 255, 255, 0.72);
    border-radius: 50%;
    background: rgba(25, 87, 148, 0.24);
    box-shadow:
      0 0 0 5px rgba(47, 111, 180, 0.2),
      0 10px 30px rgba(7, 36, 73, 0.28),
      inset 0 0 24px rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(4px);
  }

  .virtual-stick::before,
  .virtual-stick::after {
    content: "";
    position: absolute;
    background: rgba(255, 255, 255, 0.32);
  }

  .virtual-stick::before {
    top: 50%;
    right: 12%;
    left: 12%;
    height: 1px;
  }

  .virtual-stick::after {
    top: 12%;
    bottom: 12%;
    left: 50%;
    width: 1px;
  }

  .virtual-stick i {
    position: absolute;
    top: 29%;
    left: 29%;
    width: 42%;
    aspect-ratio: 1;
    border: 2px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    background: linear-gradient(145deg, rgba(248, 253, 255, 0.94), rgba(78, 156, 222, 0.86));
    box-shadow: 0 6px 18px rgba(7, 36, 73, 0.35);
    pointer-events: none;
  }

  .virtual-actions {
    position: absolute;
    right: calc(env(safe-area-inset-right) + var(--touch-edge-inset));
    bottom: var(--touch-bottom-inset);
    display: flex;
    gap: var(--touch-action-gap);
    align-items: end;
    pointer-events: none;
  }

  .virtual-action {
    display: grid;
    place-items: center;
    border: 2px solid rgba(255, 255, 255, 0.76);
    border-radius: 50%;
    background: rgba(38, 112, 181, 0.62);
    box-shadow: 0 8px 24px rgba(7, 36, 73, 0.3);
    color: white;
    backdrop-filter: blur(5px);
    width: var(--touch-action-size);
    aspect-ratio: 1;
  }

  .virtual-action.attack {
    translate: 0 -3cqh;
    background: rgba(38, 112, 181, 0.76);
  }

  .virtual-action b {
    font-size: min(1.7cqw, 34px);
    line-height: 1;
  }

  .virtual-action span {
    font-size: min(0.55cqw, 11px);
    font-weight: 800;
    text-transform: uppercase;
  }

  .virtual-controls button:active,
  .virtual-stick:active {
    filter: brightness(1.18);
    scale: 0.96;
  }

  @keyframes virtual-controls-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
