import { describe, expect, it } from 'vitest'
import virtualControlsSource from './VirtualControls.svelte?raw'

describe('VirtualControls UI contract', () => {
  it('renders localized move, jump, and attack controls without owning pause placement', () => {
    expect(virtualControlsSource).toContain('class="virtual-controls"')
    expect(virtualControlsSource).toContain("text('touch.move')")
    expect(virtualControlsSource).toContain("text('touch.jump')")
    expect(virtualControlsSource).toContain("text('touch.attack')")
    expect(virtualControlsSource).not.toContain("text('touch.pause')")
    expect(virtualControlsSource).not.toContain('class="virtual-pause"')
  })

  it('uses pointer capture for the stick and emits move, jump, and attack callbacks', () => {
    expect(virtualControlsSource).toContain('setPointerCapture')
    expect(virtualControlsSource).toContain('onMove(stick.moveX, stick.crouchHeld)')
    expect(virtualControlsSource).toContain('onJump()')
    expect(virtualControlsSource).toContain('onAttack()')
    expect(virtualControlsSource).not.toContain('onPause()')
  })

  it('keeps overlay root passive and only controls interactive', () => {
    expect(virtualControlsSource).toContain('pointer-events: none')
    expect(virtualControlsSource).toContain('pointer-events: auto')
    expect(virtualControlsSource).toContain('touch-action: none')
  })

  it('keeps pause out of the lower-right virtual action cluster', () => {
    expect(virtualControlsSource).not.toContain('--touch-pause-safe-gap:')
    expect(virtualControlsSource).not.toContain('--touch-pause-size:')
    expect(virtualControlsSource).not.toContain('.virtual-pause')
  })
})
