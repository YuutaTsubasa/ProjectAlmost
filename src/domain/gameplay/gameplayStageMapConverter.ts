import type {
  GameplayEnemySpawn,
  GameplayHazardSpawn,
  GameplayStageMap,
} from './gameplayMapTypes'
import {
  toGameplayTheme,
  type GameplayStageConversionDiagnostic,
  type GameplayStageSource,
  type GameplayStageSourceTheme,
  type GameplayThemeAssets,
} from './gameplayStageSource'

export type GameplayStageMapConversionResult = {
  map: GameplayStageMap
  diagnostics: readonly GameplayStageConversionDiagnostic[]
}

const BACKGROUND_LAYER_PRESENTATION = {
  sky: { width: 1920, height: 1080, depth: -30, scrollFactor: 0, parallaxFactor: 0 },
  far: { width: 1920, height: 1080, depth: -20, scrollFactor: 0, parallaxFactor: 0.08 },
  mid: { width: 1920, height: 1080, depth: -10, scrollFactor: 0, parallaxFactor: 0.18 },
} as const

export function convertGameplayStageSource(
  source: GameplayStageSource,
  themeAssets: Record<GameplayStageSourceTheme, GameplayThemeAssets>,
): GameplayStageMapConversionResult {
  const theme = source.theme ?? 'white-palace'
  const assets = themeAssets[theme]
  const diagnostics: GameplayStageConversionDiagnostic[] = []

  if (assets.fallback) {
    diagnostics.push({
      stageId: source.id,
      code: 'theme-asset-fallback',
      sourceId: theme,
      message: `Stage ${source.id} uses fallback gameplay assets for theme ${theme}.`,
    })
  }

  for (const movingPlatform of source.movingPlatforms ?? []) {
    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-moving-platform',
      sourceId: movingPlatform.id,
      message: `Stage ${source.id} has unsupported moving platform ${movingPlatform.id}.`,
    })
  }

  for (const gravityZone of source.gravityZones ?? []) {
    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-gravity-zone',
      sourceId: gravityZone.id,
      message: `Stage ${source.id} has unsupported gravity zone ${gravityZone.id}.`,
    })
  }

  for (const surfaceZone of source.surfaceZones ?? []) {
    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-surface-zone',
      sourceId: surfaceZone.id,
      message: `Stage ${source.id} has unsupported surface zone ${surfaceZone.id}.`,
    })
  }

  return {
    map: {
      id: source.id,
      theme: toGameplayTheme(theme),
      world: { ...source.world },
      rankTargets: { ...source.rankTargets },
      backgroundLayers: assets.backgroundLayers.map((layer) => ({
        id: layer.id,
        assetRef: layer.assetRef,
        ...BACKGROUND_LAYER_PRESENTATION[layer.id],
      })),
      player: {
        actorId: 'player',
        spawn: {
          x: source.playerSpawn.x,
          surfaceY: source.playerSpawn.surfaceY,
        },
      },
      enemies: source.enemies.map(convertEnemy),
      coins: source.coins.map((coin, index) => ({
        id: `${source.id}-coin-${String(index + 1).padStart(3, '0')}`,
        x: coin.x,
        y: coin.y,
      })),
      hazards: convertHazards(source, diagnostics),
      checkpoints: source.checkpoints.map((checkpoint) => ({ ...checkpoint })),
      goal: { ...source.goal },
      terrain: {
        tilesetAssetRef: assets.terrainTilesetAssetRef,
        solidTileIndexes: [0, 1, 2],
        platforms: source.platforms.map((platform) => ({ ...platform })),
      },
    },
    diagnostics,
  }
}

function convertEnemy(enemy: GameplayStageSource['enemies'][number]): GameplayEnemySpawn {
  if (enemy.type === 'azure-core') {
    return {
      id: enemy.id,
      type: 'azure-core',
      x: enemy.x,
      y: enemy.y,
      patrolMinX: enemy.patrolMinX,
      patrolMaxX: enemy.patrolMaxX,
    }
  }

  return {
    id: enemy.id,
    type: 'armor-guard',
    x: enemy.x,
    surfaceY: enemy.surfaceY,
    patrolMinX: enemy.patrolMinX,
    patrolMaxX: enemy.patrolMaxX,
  }
}

function convertHazards(
  source: GameplayStageSource,
  diagnostics: GameplayStageConversionDiagnostic[],
): GameplayHazardSpawn[] {
  return (source.hazards ?? []).flatMap((hazard) => {
    if (hazard.type === 'spikes') {
      return [
        {
          id: hazard.id,
          type: 'spikes',
          x: hazard.x,
          surfaceY: hazard.surfaceY,
          width: hazard.width,
          height: hazard.height,
          orientation: hazard.orientation,
        },
      ]
    }

    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-hazard',
      sourceId: hazard.id,
      message: `Stage ${source.id} has unsupported hazard ${hazard.id} (${hazard.type}).`,
    })

    return [] as GameplayHazardSpawn[]
  })
}
