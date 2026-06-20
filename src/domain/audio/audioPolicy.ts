import type { AppScreen } from '../app/appFlow'
import type { GameSettings } from '../settings/settings'
import { MUSIC_ASSETS, SFX_ASSETS, type MusicTrackId, type SfxId } from './audioAssets'

export { MUSIC_ASSETS, SFX_ASSETS }

export type UiSfxAction = 'move' | 'confirm' | 'back'

export type MusicDecision = {
  track: MusicTrackId
  volume: number
}

const BASE_MUSIC_VOLUME = 0.42
const TITLE_INTRO_VOLUME_MULTIPLIER = 0.35
const WORLD_BGM_TRACKS: readonly MusicTrackId[] = [
  'world01Bgm',
  'world02Bgm',
  'world03Bgm',
  'world04Bgm',
  'world05Bgm',
  'world06Bgm',
]

export function computeMusicVolume(settings: GameSettings, multiplier = 1): number {
  return BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100) * multiplier
}

export function computeSfxVolume(settings: GameSettings): number {
  return (settings.masterVolume / 100) * (settings.sfxVolume / 100)
}

export function getMusicForScreen(screen: AppScreen, settings: GameSettings): MusicDecision {
  if (screen.type === 'title-intro') {
    return { track: 'title', volume: computeMusicVolume(settings, TITLE_INTRO_VOLUME_MULTIPLIER) }
  }

  if (screen.type === 'world-select' || screen.type === 'stage-select') {
    return {
      track: WORLD_BGM_TRACKS[screen.selectedWorldIndex] ?? 'world01Bgm',
      volume: computeMusicVolume(settings),
    }
  }

  return { track: 'title', volume: computeMusicVolume(settings) }
}

export function getSfxForAction(action: UiSfxAction): SfxId {
  if (action === 'move') return 'ui-move'
  if (action === 'back') return 'ui-back'
  return 'ui-confirm'
}
