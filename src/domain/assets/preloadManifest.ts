import { MUSIC_ASSETS, SFX_ASSETS } from '../audio/audioAssets'
import { getCharacterProfile, selectedCharacterId } from '../character/characterProfile'
import { projectData } from '../data/projectData'
import { bossPriestessSpriteAssets } from '../gameplay/bossBattle'
import { checkpointActorDefinition } from '../gameplay/checkpointActor'
import type { GameplayStageMap } from '../gameplay/gameplayMapTypes'
import { enemyActorDefinitions } from '../gameplay/enemyActor'
import { goalActorDefinition } from '../gameplay/goalActor'
import { hazardActorDefinitions } from '../gameplay/hazardActor'
import { playerActorDefinition } from '../gameplay/playerActor'
import { gameplayStageMaps } from '../gameplay/gameplayStageMaps'

export type PreloadAssetKind = 'image' | 'spritesheet' | 'audio' | 'font'
export type PreloadAssetGroup = 'boot' | 'shared-gameplay' | 'stage'

export type PreloadAsset = {
  id: string
  source: string
  kind: PreloadAssetKind
  group: PreloadAssetGroup
}

type ProjectDataLike = typeof projectData

const BOOT_SOURCES = [
  '/assets/title/project-almost-title-background.webp',
  MUSIC_ASSETS.title,
  SFX_ASSETS['ui-move'],
  SFX_ASSETS['ui-confirm'],
  SFX_ASSETS['ui-back'],
  '/assets/fonts/rajdhani-latin-400.woff2',
  '/assets/fonts/rajdhani-latin-500.woff2',
  '/assets/fonts/rajdhani-latin-600.woff2',
  '/assets/fonts/rajdhani-latin-700.woff2',
  '/assets/fonts/share-tech-mono-latin-400.woff2',
] as const

const SHARED_GAMEPLAY_SOURCES = [
  ...Object.values(playerActorDefinition.sprites).map((sprite) => sprite.assetRef),
  enemyActorDefinitions['armor-guard'].sprites.walk.assetRef,
  enemyActorDefinitions['armor-guard'].sprites.death.assetRef,
  checkpointActorDefinition.sprite.assetRef,
  goalActorDefinition.sprite.assetRef,
  hazardActorDefinitions.spikes.sprite.assetRef,
  getCharacterProfile(selectedCharacterId).hudPortraitAssetRef,
  getCharacterProfile(selectedCharacterId).resultStandeeAssetRef,
  '/assets/tiles/white_palace_platform_tiles.webp',
  '/assets/tiles/emerald_sanctuary_platform_tiles_surface_aligned.webp',
  ...Object.values(SFX_ASSETS),
  MUSIC_ASSETS.result,
] as const

function getAssetKind(source: string): PreloadAssetKind {
  if (source.endsWith('.mp3') || source.endsWith('.wav')) return 'audio'
  if (source.endsWith('.woff2')) return 'font'
  if (source.includes('/sprites/')) return 'spritesheet'
  return 'image'
}

function getAssetId(source: string): string {
  return source
    .replace(/^\/assets\//, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
}

function toAssets(sources: readonly string[], group: PreloadAssetGroup): PreloadAsset[] {
  const uniqueSources = [...new Set(sources)]
    .filter((source) => source.startsWith('/assets/') && !source.includes('__prototype__'))
    .sort()

  return uniqueSources.map((source) => ({
    id: `${group}-${getAssetId(source)}`,
    source,
    kind: getAssetKind(source),
    group,
  }))
}

function stageSources(project: ProjectDataLike, stage: GameplayStageMap): string[] {
  const stageData = project.stages.items[stage.id]
  const world = project.worlds.items[stageData.worldId]
  const music = stageData.isBoss ? world.musicRefs.boss : world.musicRefs.bgm

  return [
    ...stage.backgroundLayers.map((layer) => layer.assetRef),
    stage.terrain.tilesetAssetRef,
    music,
    ...(stageData.isBoss
      ? Object.values(bossPriestessSpriteAssets).map((sprite) => sprite.assetRef)
      : []),
  ]
}

export function buildBootPreloadPlan(project: ProjectDataLike): PreloadAsset[] {
  return toAssets([
    ...BOOT_SOURCES,
    ...project.worlds.order.map((worldId) => project.worlds.items[worldId].assetRefs.stageSelectBackground),
    ...project.worlds.order.map((worldId) => project.worlds.items[worldId].musicRefs.map),
  ], 'boot')
}

export function buildSharedGameplayPreloadPlan(): PreloadAsset[] {
  return toAssets(SHARED_GAMEPLAY_SOURCES, 'shared-gameplay')
}

export function buildStagePreloadPlan(project: ProjectDataLike, stage: GameplayStageMap): PreloadAsset[] {
  return toAssets(stageSources(project, stage), 'stage')
}

export function collectRuntimeAssetSources(project: ProjectDataLike): string[] {
  const stagePlans = gameplayStageMaps.order.flatMap((stageId) => {
    const stage = gameplayStageMaps.items[stageId]
    return stage ? buildStagePreloadPlan(project, stage).map((asset) => asset.source) : []
  })

  return [...new Set([
    ...buildBootPreloadPlan(project).map((asset) => asset.source),
    ...buildSharedGameplayPreloadPlan().map((asset) => asset.source),
    ...stagePlans,
  ])].sort()
}
