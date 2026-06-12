import firstGateJson from './1-1.json'
import azureCourtyardJson from './1-2.json'
import type { GuardEnemyPoint, StageData } from './stageTypes'

const firstGate = firstGateJson as StageData
const azureCourtyard = azureCourtyardJson as StageData

export const stages = {
  '1-1': firstGate,
  '1-2': azureCourtyard,
} as const satisfies Record<string, StageData>

export type StageId = keyof typeof stages

export const activeStage: StageData = structuredClone(firstGate)

export function getNextStageId(id: StageId): StageId | undefined {
  const ids = Object.keys(stages) as StageId[]
  return ids[ids.indexOf(id) + 1]
}

export function selectStage(id: StageId): StageData {
  const stage = structuredClone(stages[id])
  validateStage(stage)
  Object.assign(activeStage, stage)
  return activeStage
}

export function validateStage(stage: StageData): void {
  const groundedObjects = [
    { label: 'player spawn', x: stage.playerSpawn.x, surfaceY: stage.playerSpawn.surfaceY },
    ...stage.enemies
      .filter((enemy): enemy is GuardEnemyPoint => enemy.type !== 'azure-core')
      .map((enemy) => ({ label: `enemy "${enemy.id}"`, x: enemy.x, surfaceY: enemy.surfaceY })),
    ...stage.checkpoints.map((checkpoint) => ({
      label: `checkpoint "${checkpoint.id}"`,
      x: checkpoint.x,
      surfaceY: checkpoint.surfaceY,
    })),
    ...stage.checkpoints.map((checkpoint) => ({
      label: `checkpoint "${checkpoint.id}" respawn`,
      x: checkpoint.spawnX,
      surfaceY: checkpoint.spawnSurfaceY,
    })),
    { label: 'goal', x: stage.goal.x, surfaceY: stage.goal.surfaceY },
  ]

  for (const object of groundedObjects) {
    const supported = stage.platforms.some((platform) => {
      const left = platform.col * stage.world.tileSize
      const right = left + platform.width * stage.world.tileSize
      const surfaceY = platform.row * stage.world.tileSize
      return object.x >= left && object.x < right && object.surfaceY === surfaceY
    })

    if (!supported) {
      throw new Error(
        `Stage ${stage.id}: grounded ${object.label} at (${object.x}, ${object.surfaceY}) does not align with a platform surface.`,
      )
    }
  }
}

for (const stage of Object.values(stages)) validateStage(stage)
