import { describe, expect, it } from 'vitest'
import {
  getGroundedHazardCenterY,
  getHazardBodyPresentation,
  getHazardFrameIndex,
  hazardActorDefinitions,
} from './hazardActor'

describe('hazard actor definitions', () => {
  it('defines prototype spike presentation as rebuild-owned asset metadata', () => {
    expect(hazardActorDefinitions.spikes).toEqual({
      behavior: 'fixed-damage',
      sprite: {
        key: 'emerald-sanctuary-spikes',
        assetRef: '/assets/props/emerald_sanctuary_spikes.webp',
        frameWidth: 512,
        frameHeight: 512,
      },
      origin: { x: 0.5, y: 0.5 },
      visualBottomInset: 14,
    })
  })
})

describe('hazard frame selection', () => {
  it('uses prototype frames for spike orientation', () => {
    expect(getHazardFrameIndex({})).toBe(0)
    expect(getHazardFrameIndex({ orientation: 'floor' })).toBe(0)
    expect(getHazardFrameIndex({ orientation: 'right-wall' })).toBe(2)
    expect(getHazardFrameIndex({ orientation: 'left-wall' })).toBe(3)
    expect(getHazardFrameIndex({ orientation: 'ceiling' })).toBe(4)
  })
})

describe('hazard placement', () => {
  it('places floor spikes on a platform surface with prototype visual inset', () => {
    expect(getGroundedHazardCenterY({
      surfaceY: 640,
      height: 62,
      type: 'spikes',
    })).toBe(640 - 31 + 14)
  })

  it('uses prototype spike body ratios', () => {
    const body = getHazardBodyPresentation({
      width: 180,
      height: 62,
      type: 'spikes',
    })
    expect(body).toMatchObject({
      width: 154.8,
      offsetY: 22.32,
      offsetX: 12.600000000000001,
    })
    expect(body.height).toBeCloseTo(34.72)
  })
})
