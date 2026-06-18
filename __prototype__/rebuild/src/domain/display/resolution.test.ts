import { describe, expect, it } from 'vitest'
import { calculateAspectFitFrame, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './resolution'

describe('calculateAspectFitFrame', () => {
  it('uses a 1920x1080 virtual frame', () => {
    expect(VIRTUAL_WIDTH).toBe(1920)
    expect(VIRTUAL_HEIGHT).toBe(1080)
  })

  it('fills an exact 16:9 container', () => {
    expect(calculateAspectFitFrame({ containerWidth: 1920, containerHeight: 1080 })).toEqual({
      width: 1920,
      height: 1080,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    })
  })

  it('pillarboxes a wider than 16:9 container without stretching', () => {
    expect(calculateAspectFitFrame({ containerWidth: 2400, containerHeight: 1080 })).toEqual({
      width: 1920,
      height: 1080,
      offsetX: 240,
      offsetY: 0,
      scale: 1,
    })
  })

  it('letterboxes a taller than 16:9 container without stretching', () => {
    expect(calculateAspectFitFrame({ containerWidth: 1920, containerHeight: 1400 })).toEqual({
      width: 1920,
      height: 1080,
      offsetX: 0,
      offsetY: 160,
      scale: 1,
    })
  })

  it('returns a uniform scale for smaller containers', () => {
    expect(calculateAspectFitFrame({ containerWidth: 1280, containerHeight: 720 })).toEqual({
      width: 1280,
      height: 720,
      offsetX: 0,
      offsetY: 0,
      scale: 2 / 3,
    })
  })
})
