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
