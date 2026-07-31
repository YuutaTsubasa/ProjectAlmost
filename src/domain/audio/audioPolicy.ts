import type { AppScreen } from '../app/appFlow'
import type { StageId } from '../data/worlds/worldTypes'
import type { GameSettings } from '../settings/settings'
import { MUSIC_ASSETS, SFX_ASSETS, type MusicTrackId, type SfxId } from './audioAssets'

export { MUSIC_ASSETS, SFX_ASSETS }

export type UiSfxAction = 'move' | 'confirm' | 'back'
export type GameplaySfxAction =
  | 'player-hit'
  | 'coin-collected'
  | 'player-death'
  | 'checkpoint-activated'
  | 'player-footstep'
  | 'goal-opened'
export type SfxAction = UiSfxAction | GameplaySfxAction

export type MusicDecision = {
  track: MusicTrackId
  volume: number
}

const BASE_MUSIC_VOLUME = 0.42
const TITLE_INTRO_VOLUME_MULTIPLIER = 0.35
const GAMEPLAY_PAUSED_VOLUME_MULTIPLIER = 0.45
const WORLD_BGM_TRACKS: readonly MusicTrackId[] = [
  'world01Bgm',
  'world02Bgm',
  'world03Bgm',
  'world04Bgm',
  'world05Bgm',
  'world06Bgm',
]
const WORLD_MAP_TRACKS: readonly MusicTrackId[] = [
  'world01Map',
  'world02Map',
  'world03Map',
  'world04Map',
  'world05Map',
  'world06Map',
]
const WORLD_BOSS_TRACKS: readonly MusicTrackId[] = [
  'world01Boss',
  'world02Boss',
  'world03Boss',
  'world04Boss',
  'world05Boss',
  'world06Boss',
]

export type GameplayMusicContext = {
  stageId: StageId
  isBoss: boolean
  resultVisible: boolean
  paused: boolean
}

function getWorldIndexFromStageId(stageId: StageId): number {
  return Math.max(0, Number(stageId.split('-')[0]) - 1)
}

export function computeMusicVolume(settings: GameSettings, multiplier = 1): number {
  return BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100) * multiplier
}

export function computeSfxVolume(settings: GameSettings): number {
  return (settings.masterVolume / 100) * (settings.sfxVolume / 100)
}

export function getGameplayMusic(context: GameplayMusicContext, settings: GameSettings): MusicDecision {
  if (context.resultVisible) {
    return { track: 'result', volume: computeMusicVolume(settings) }
  }

  const worldIndex = getWorldIndexFromStageId(context.stageId)
  const track = context.isBoss
    ? WORLD_BOSS_TRACKS[worldIndex] ?? 'world01Boss'
    : WORLD_BGM_TRACKS[worldIndex] ?? 'world01Bgm'
  const multiplier = context.paused ? GAMEPLAY_PAUSED_VOLUME_MULTIPLIER : 1

  return { track, volume: computeMusicVolume(settings, multiplier) }
}

export function getMusicForScreen(screen: AppScreen, settings: GameSettings): MusicDecision | null {
  if (screen.type === 'title-intro') {
    return { track: 'title', volume: computeMusicVolume(settings, TITLE_INTRO_VOLUME_MULTIPLIER) }
  }

  if (screen.type === 'world-select') {
    return {
      track: WORLD_BGM_TRACKS[screen.selectedWorldIndex] ?? 'world01Bgm',
      volume: computeMusicVolume(settings),
    }
  }

  if (screen.type === 'stage-select') {
    return {
      track: WORLD_MAP_TRACKS[screen.selectedWorldIndex] ?? 'world01Map',
      volume: computeMusicVolume(settings),
    }
  }

  if (screen.type === 'gameplay') {
    return null
  }

  return { track: 'title', volume: computeMusicVolume(settings) }
}

const SFX_BY_ACTION = {
  move: 'ui-move',
  confirm: 'ui-confirm',
  back: 'ui-back',
  'player-hit': 'hit',
  'coin-collected': 'coin',
  'player-death': 'death',
  'checkpoint-activated': 'checkpoint',
  'player-footstep': 'armor-step',
  'goal-opened': 'goal',
} as const satisfies Record<SfxAction, SfxId>

export function getSfxForAction(action: SfxAction): SfxId {
  return SFX_BY_ACTION[action]
}
