export type PlayerCheckpointGravity = 'down' | 'up'

export type CheckpointReachPoint = {
  x: number
}

export type CheckpointRespawnPoint = {
  spawnX: number
  spawnSurfaceY: number
  spawnGravity?: PlayerCheckpointGravity
}

export type PlayerCheckpointRespawnState = {
  x: number
  surfaceY: number
  gravity: PlayerCheckpointGravity
}

export function getReachedCheckpointCount(input: {
  activeCheckpointIndex: number
}): number {
  return input.activeCheckpointIndex + 1
}

export function getCheckpointTargetCount(input: {
  checkpoints: readonly unknown[]
}): number {
  return input.checkpoints.length
}

export function findNextCheckpointIndex(input: {
  checkpoints: readonly CheckpointReachPoint[]
  activeCheckpointIndex: number
  playerX: number
}): number {
  return input.checkpoints.findIndex(
    (checkpoint, index) =>
      index > input.activeCheckpointIndex && input.playerX >= checkpoint.x,
  )
}

export function getCheckpointRespawnState(input: {
  checkpoint: CheckpointRespawnPoint
  currentGravity: PlayerCheckpointGravity
}): PlayerCheckpointRespawnState {
  return {
    x: input.checkpoint.spawnX,
    surfaceY: input.checkpoint.spawnSurfaceY,
    gravity: input.checkpoint.spawnGravity ?? input.currentGravity,
  }
}
