import type { GameplayStageMap } from './gameplayMapTypes'
import { PLAYER_MAX_HEALTH } from './playerLife'
import { getTileColumnCount } from './terrain'

export type GameplayHudMarker = {
  x: number
  y: number
}

export type GameplayHudPlatformMarker = GameplayHudMarker & {
  width: number
}

export type GameplayHudEnemyMarker = GameplayHudMarker

export type GameplayHudState = {
  hp: number
  hpMax: number
  coins: number
  coinTarget: number
  damageTaken: number
  falls: number
  enemiesDefeated: number
  enemyTarget: number
  checkpointsReached: number
  checkpointTarget: number
  activeCheckpointIndex: number
  time: string
  playerProgress: number
  playerProgressY: number
  goalProgress: number
  mapPlatforms: readonly GameplayHudPlatformMarker[]
  checkpointMarkers: readonly GameplayHudMarker[]
  enemyMarkers: readonly GameplayHudEnemyMarker[]
  cleared: boolean
}

export type GameplayHudPatch = Partial<GameplayHudState>

export function clampHudProgress(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export function getHudPositionProgress(input: {
  position: number
  worldSize: number
}): number {
  if (input.worldSize <= 0) return 0
  return clampHudProgress(input.position / input.worldSize)
}

export function formatGameplayHudHealthLabel(input: {
  current: number
  max: number
}): string {
  return `HP ${input.current}/${input.max}`
}

export function formatGameplayHudCoinLabel(input: {
  collected: number
  target: number
}): string {
  return `COIN ${String(input.collected).padStart(3, '0')} / ${input.target}`
}

export function formatGameplayHudTime(elapsedMs: number): string {
  const safeElapsed = Math.max(0, Math.floor(elapsedMs))
  const minutes = Math.floor(safeElapsed / 60_000)
  const seconds = Math.floor((safeElapsed % 60_000) / 1000)
  const centiseconds = Math.floor((safeElapsed % 1000) / 10)

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

export function getHudPlatformMarkers(input: {
  platforms: readonly { col: number; row: number; width: number }[]
  tileColumns: number
  tileSize: number
  worldHeight: number
}): GameplayHudPlatformMarker[] {
  return input.platforms.map((platform) => ({
    x: getHudPositionProgress({ position: platform.col, worldSize: input.tileColumns }),
    y: getHudPositionProgress({
      position: platform.row * input.tileSize,
      worldSize: input.worldHeight,
    }),
    width: getHudPositionProgress({ position: platform.width, worldSize: input.tileColumns }),
  }))
}

export function getHudCheckpointMarkers(input: {
  checkpoints: readonly { x: number; surfaceY: number }[]
  worldWidth: number
  worldHeight: number
}): GameplayHudMarker[] {
  return input.checkpoints.map((checkpoint) => ({
    x: getHudPositionProgress({ position: checkpoint.x, worldSize: input.worldWidth }),
    y: getHudPositionProgress({ position: checkpoint.surfaceY, worldSize: input.worldHeight }),
  }))
}

export function getHudEnemyMarkers(input: {
  enemies: readonly { x: number; y: number; defeated: boolean }[]
  worldWidth: number
  worldHeight: number
}): GameplayHudEnemyMarker[] {
  return input.enemies
    .filter((enemy) => !enemy.defeated)
    .map((enemy) => ({
      x: getHudPositionProgress({ position: enemy.x, worldSize: input.worldWidth }),
      y: getHudPositionProgress({ position: enemy.y, worldSize: input.worldHeight }),
    }))
}

export function getHudGoalProgress(input: {
  goalX: number
  worldWidth: number
}): number {
  return getHudPositionProgress({ position: input.goalX, worldSize: input.worldWidth })
}

export function createInitialGameplayHudState(stage: GameplayStageMap): GameplayHudState {
  return {
    hp: PLAYER_MAX_HEALTH,
    hpMax: PLAYER_MAX_HEALTH,
    coins: 0,
    coinTarget: stage.coins.length,
    damageTaken: 0,
    falls: 0,
    enemiesDefeated: 0,
    enemyTarget: stage.enemies.length,
    checkpointsReached: 0,
    checkpointTarget: stage.checkpoints.length,
    activeCheckpointIndex: -1,
    time: '00:00.00',
    playerProgress: getHudPositionProgress({
      position: stage.player.spawn.x,
      worldSize: stage.world.width,
    }),
    playerProgressY: getHudPositionProgress({
      position: stage.player.spawn.surfaceY,
      worldSize: stage.world.height,
    }),
    goalProgress: getHudGoalProgress({
      goalX: stage.goal.x,
      worldWidth: stage.world.width,
    }),
    mapPlatforms: getHudPlatformMarkers({
      platforms: stage.terrain.platforms,
      tileColumns: getTileColumnCount({
        worldWidth: stage.world.width,
        tileSize: stage.world.tileSize,
      }),
      tileSize: stage.world.tileSize,
      worldHeight: stage.world.height,
    }),
    checkpointMarkers: getHudCheckpointMarkers({
      checkpoints: stage.checkpoints,
      worldWidth: stage.world.width,
      worldHeight: stage.world.height,
    }),
    enemyMarkers: getHudEnemyMarkers({
      enemies: stage.enemies.map((enemy) => ({
        x: enemy.x,
        y: enemy.surfaceY,
        defeated: false,
      })),
      worldWidth: stage.world.width,
      worldHeight: stage.world.height,
    }),
    cleared: false,
  }
}

export function applyGameplayHudPatch(
  state: GameplayHudState,
  patch: GameplayHudPatch,
): GameplayHudState {
  return {
    ...state,
    ...patch,
  }
}
