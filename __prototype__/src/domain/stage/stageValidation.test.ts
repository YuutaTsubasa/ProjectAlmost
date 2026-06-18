import { describe, expect, test } from 'vitest'
import type { StageData } from '../../game/stages/stageTypes'
import { validateStage } from './stageValidation'

const baseStage: StageData = {
  id: 'test-1',
  subtitle: 'Test',
  objective: 'Reach the Goal',
  rankTargets: { sTime: 20_000, aTime: 30_000, bTime: 40_000, cTime: 50_000 },
  world: { width: 1024, height: 768, tileSize: 64 },
  playerSpawn: { x: 96, surfaceY: 640 },
  platforms: [{ col: 1, row: 10, width: 5, height: 1 }],
  coins: [],
  enemies: [],
  checkpoints: [],
  sections: [],
  goal: { x: 256, surfaceY: 640 },
}

describe('validateStage', () => {
  test('accepts grounded objects that align with a platform surface', () => {
    expect(() => validateStage(baseStage)).not.toThrow()
  })

  test('rejects a goal that is not on a platform surface', () => {
    expect(() => validateStage({ ...baseStage, goal: { x: 900, surfaceY: 640 } })).toThrow('grounded goal')
  })

  test('rejects a grounded enemy that does not match the platform surfaceY', () => {
    expect(() =>
      validateStage({
        ...baseStage,
        enemies: [{ id: 'guard-1', x: 128, surfaceY: 650, patrolMinX: 80, patrolMaxX: 260 }],
      }),
    ).toThrow('enemy "guard-1"')
  })
})
