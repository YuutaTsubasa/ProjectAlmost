import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayStageMap } from './gameplayMapTypes'

export type GameplayStageMapCatalog = {
  order: readonly StageId[]
  items: Partial<Record<StageId, GameplayStageMap>>
}

const stageOneOne: GameplayStageMap = {
  id: '1-1',
  theme: 'white-palace',
  world: {
    width: 9600,
    height: 1080,
    tileSize: 64,
  },
  backgroundLayers: [
    {
      id: 'sky',
      assetRef: '/assets/maps/white_palace_sky.webp',
      width: 1920,
      height: 1080,
      depth: -30,
      scrollFactor: 0,
      parallaxFactor: 0,
    },
    {
      id: 'far',
      assetRef: '/assets/maps/white_palace_far_bg.webp',
      width: 1920,
      height: 1080,
      depth: -20,
      scrollFactor: 0,
      parallaxFactor: 0.08,
    },
    {
      id: 'mid',
      assetRef: '/assets/maps/white_palace_mid_bg_loop.webp',
      width: 1920,
      height: 1080,
      depth: -10,
      scrollFactor: 0,
      parallaxFactor: 0.18,
    },
  ],
  player: {
    actorId: 'player',
    spawn: {
      x: 256,
      surfaceY: 512,
    },
  },
  terrain: {
    tilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    solidTileIndexes: [0, 1, 2],
    platforms: [
      { col: 2, row: 8, width: 12, height: 1 },
      { col: 16, row: 8, width: 5, height: 1 },
      { col: 23, row: 7, width: 4, height: 1 },
      { col: 30, row: 8, width: 5, height: 1 },
      { col: 38, row: 8, width: 13, height: 1 },
      { col: 54, row: 7, width: 3, height: 1 },
      { col: 59, row: 6, width: 3, height: 1 },
      { col: 65, row: 8, width: 12, height: 1 },
      { col: 80, row: 7, width: 4, height: 1 },
      { col: 86, row: 6, width: 4, height: 1 },
      { col: 92, row: 5, width: 7, height: 1 },
      { col: 103, row: 6, width: 5, height: 1 },
      { col: 111, row: 8, width: 10, height: 1 },
      { col: 124, row: 7, width: 4, height: 1 },
      { col: 130, row: 6, width: 4, height: 1 },
      { col: 136, row: 8, width: 12, height: 1 },
    ],
  },
}

export const gameplayStageMaps: GameplayStageMapCatalog = {
  order: [stageOneOne.id],
  items: {
    [stageOneOne.id]: stageOneOne,
  },
}

export function getGameplayStageMap(stageId: StageId): GameplayStageMap | undefined {
  return gameplayStageMaps.items[stageId]
}
