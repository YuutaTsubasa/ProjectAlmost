import { describe, expect, it } from 'vitest'
import { getGoalBottomY, goalActorDefinition, shouldLockGoalUntilBossDefeated } from './goalActor'

describe('goal actor definition', () => {
  it('defines prototype goal presentation as rebuild-owned asset metadata', () => {
    expect(goalActorDefinition).toEqual({
      behavior: 'goal',
      sprite: {
        key: 'stage-goal',
        assetRef: '/assets/props/white_palace_goal_idle.webp',
        frameWidth: 256,
        frameHeight: 256,
      },
      animation: {
        idleKey: 'stage-goal-idle',
        frameStart: 0,
        frameEnd: 3,
        frameRate: 5,
        repeat: -1,
        yoyo: true,
      },
      origin: { x: 0.5, y: 1 },
      displaySize: { width: 96, height: 128 },
      body: { width: 52, height: 112, offsetX: 22, offsetY: 16 },
      visualBottomInset: 6,
      depth: 8,
      activatedTint: 0x4be8ff,
    })
  })

  it('keeps goal assets under root public assets', () => {
    expect(goalActorDefinition.sprite.assetRef).toBe('/assets/props/white_palace_goal_idle.webp')
    expect(goalActorDefinition.sprite.assetRef).not.toContain('__prototype__')
  })

  it('places the visual bottom using the prototype bottom inset', () => {
    expect(getGoalBottomY({ surfaceY: 512 })).toBe(518)
  })

  it('locks the goal while a boss stage still has an undefeated boss', () => {
    expect(shouldLockGoalUntilBossDefeated({
      isBossStage: true,
      bossDefeated: false,
    })).toBe(true)
  })

  it('does not lock the goal for non-boss stages or after boss defeat', () => {
    expect(shouldLockGoalUntilBossDefeated({
      isBossStage: false,
      bossDefeated: false,
    })).toBe(false)
    expect(shouldLockGoalUntilBossDefeated({
      isBossStage: true,
      bossDefeated: true,
    })).toBe(false)
  })
})
