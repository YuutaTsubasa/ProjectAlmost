import type { GuardEnemyPoint, StageData } from '../../game/stages/stageTypes'

type GroundedObject = {
  label: string
  x: number
  surfaceY: number
}

function isSupportedByPlatform(stage: StageData, object: GroundedObject): boolean {
  return stage.platforms.some((platform) => {
    const left = platform.col * stage.world.tileSize
    const right = left + platform.width * stage.world.tileSize
    const surfaceY = platform.row * stage.world.tileSize
    return object.x >= left && object.x < right && object.surfaceY === surfaceY
  })
}

export function validateStage(stage: StageData): void {
  const groundedObjects: GroundedObject[] = [
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
    if (!isSupportedByPlatform(stage, object)) {
      throw new Error(
        `Stage ${stage.id}: grounded ${object.label} at (${object.x}, ${object.surfaceY}) does not align with a platform surface.`,
      )
    }
  }
}
