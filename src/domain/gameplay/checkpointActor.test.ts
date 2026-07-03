import { describe, expect, it } from 'vitest'
import { checkpointActorDefinition, getCheckpointBottomY } from './checkpointActor'

describe('checkpoint actor definition', () => {
  it('defines prototype checkpoint presentation as rebuild-owned asset metadata', () => {
    expect(checkpointActorDefinition).toEqual({
      behavior: 'checkpoint',
      sprite: {
        key: 'checkpoint-beacon',
        assetRef: '/assets/props/white_palace_checkpoint.webp',
      },
      origin: { x: 0.5, y: 1 },
      displaySize: { width: 76, height: 114 },
      visualBottomInset: 0,
      depth: 7,
      inactiveAlpha: 0.82,
      activatedAlpha: 1,
      activatedTint: 0xfff0a8,
      glow: {
        width: 92,
        height: 20,
        yOffset: -3,
        depth: 6,
        alpha: 0.24,
      },
      ring: {
        width: 74,
        height: 74,
        yOffset: -52,
        depth: 8,
        strokeWidth: 3,
        alpha: 0.7,
      },
      idleTween: {
        durationMs: 920,
        indexDelayMs: 130,
        alphaFrom: 0.24,
        alphaTo: 0.68,
        scaleFrom: 0.92,
        scaleTo: 1.14,
        ease: 'Sine.easeInOut',
      },
      activationTween: {
        durationMs: 180,
        spriteScaleMultiplier: 1.12,
      },
    })
  })

  it('keeps checkpoint assets under root public assets', () => {
    expect(checkpointActorDefinition.sprite.assetRef).toBe('/assets/props/white_palace_checkpoint.webp')
    expect(checkpointActorDefinition.sprite.assetRef).not.toContain('__prototype__')
  })

  it('places the visual bottom on the authored surface', () => {
    expect(getCheckpointBottomY({ surfaceY: 512 })).toBe(512)
  })
})
