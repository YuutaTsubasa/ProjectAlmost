import { describe, expect, it } from 'vitest'
import pauseMenuSource from './PauseMenu.svelte?raw'

describe('PauseMenu UI contract', () => {
  it('renders the prototype-equivalent pause menu structure', () => {
    expect(pauseMenuSource).toContain('class="pause-overlay"')
    expect(pauseMenuSource).toContain('class="pause-menu"')
    expect(pauseMenuSource).toContain('class="pause-kicker"')
    expect(pauseMenuSource).toContain('class="pause-rule"')
    expect(pauseMenuSource).toContain("aria-label={text('pause.aria.menu')}")
    expect(pauseMenuSource).toContain('PAUSE_MENU_ITEMS')
  })

  it('uses localized pause labels instead of inline menu copy', () => {
    expect(pauseMenuSource).toContain("'resume': 'pause.resume'")
    expect(pauseMenuSource).toContain("'restart-stage': 'pause.restart'")
    expect(pauseMenuSource).toContain("'settings': 'settings.title'")
    expect(pauseMenuSource).toContain("'stage-select': 'pause.stageSelect'")
    expect(pauseMenuSource).not.toContain('Restart Stage</b>')
    expect(pauseMenuSource).not.toContain('Return to Stage Select</b>')
  })

  it('renders indexed active rows and shared control hints', () => {
    expect(pauseMenuSource).toContain('class:active={selectedItemIndex === index}')
    expect(pauseMenuSource).toContain("String(index + 1).padStart(2, '0')")
    expect(pauseMenuSource).toContain('<ControlHints')
    expect(pauseMenuSource).not.toContain('<kbd>')
  })

  it('uses prototype-equivalent frame-relative overlay styling and animation', () => {
    expect(pauseMenuSource).toContain('container-type: size')
    expect(pauseMenuSource).toContain('width: min(31cqw, 520px)')
    expect(pauseMenuSource).toContain('backdrop-filter: blur(4px) saturate(78%)')
    expect(pauseMenuSource).toContain('animation: pause-menu-in 260ms')
    expect(pauseMenuSource).toContain('animation: pause-item-in 220ms')
    expect(pauseMenuSource).toContain('@keyframes pause-backdrop-in')
    expect(pauseMenuSource).toContain('@keyframes pause-menu-in')
    expect(pauseMenuSource).toContain('@keyframes pause-item-in')
  })
})
