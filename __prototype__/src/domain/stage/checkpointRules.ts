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
  checkpoints: readonly { x: number }[]
  activeCheckpointIndex: number
  playerX: number
}): number {
  return input.checkpoints.findIndex((checkpoint, index) => (
    index > input.activeCheckpointIndex && input.playerX >= checkpoint.x
  ))
}
