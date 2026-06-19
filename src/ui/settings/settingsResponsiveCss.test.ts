import { describe, expect, it } from 'vitest'
import appCss from '../../app.css?raw'

describe('settings responsive CSS', () => {
  it('does not pin settings controls to fixed pixel minimums', () => {
    expect(appCss).not.toContain('min-height: clamp(27px, 3.75cqh, 42px);')
    expect(appCss).not.toContain('min-height: clamp(34px, 4.25cqh, 48px);')
    expect(appCss).not.toContain('grid-template-rows: minmax(24px, 2.65cqh) 0.35cqh;')
    expect(appCss).not.toContain('min-width: 26px;')
    expect(appCss).not.toContain('min-height: 24px;')
    expect(appCss).not.toContain('font-size: clamp(9px, 0.62cqw, 14px);')
  })
})
