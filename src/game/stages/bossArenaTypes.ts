import type { PlatformRect } from './stageTypes'

export type ArenaRect = {
  x: number
  y: number
  width: number
  height: number
}

export type ArenaPoint = {
  x: number
  y: number
}

export type BossArenaPhase = {
  id: string
  title: string
  bossPosition: ArenaPoint
  pattern: string
  playerLesson: string
  attackWindow: string
  activeCoreIds: string[]
  safeZones: ArenaRect[]
}

export type BossArenaPlan = {
  id: string
  subtitle: string
  status: 'blockout'
  designIntent: string
  world: {
    width: number
    height: number
    tileSize: number
  }
  arenaBounds: ArenaRect
  playerSpawn: {
    x: number
    surfaceY: number
  }
  bossSpawn: ArenaPoint
  exitGoal: {
    x: number
    surfaceY: number
    unlockCondition: string
  }
  platforms: PlatformRect[]
  homingCores: Array<{
    id: string
    x: number
    y: number
    role: string
  }>
  phases: BossArenaPhase[]
  implementationNotes: string[]
}
