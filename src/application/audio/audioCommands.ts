import type { AppScreen } from '../../domain/app/appFlow'
import type { MusicTrackId, SfxId } from '../../domain/audio/audioAssets'
import {
  computeSfxVolume,
  getMusicForScreen,
  getSfxForAction,
  type UiSfxAction,
} from '../../domain/audio/audioPolicy'
import type { GameSettings } from '../../domain/settings/settings'

export type SetMusicCommand = { type: 'set-music'; track: MusicTrackId; volume: number }
export type PrepareMusicCommand = { type: 'prepare-music'; track: MusicTrackId }
export type PlaySfxCommand = { type: 'play-sfx'; sound: SfxId; volume: number }

export type AudioCommand = SetMusicCommand | PrepareMusicCommand | PlaySfxCommand

export function createMusicCommand(screen: AppScreen, settings: GameSettings): SetMusicCommand {
  return { type: 'set-music', ...getMusicForScreen(screen, settings) }
}

export function createPrepareMusicCommand(track: MusicTrackId): PrepareMusicCommand {
  return { type: 'prepare-music', track }
}

export function createSfxCommand(action: UiSfxAction, settings: GameSettings): PlaySfxCommand | null {
  const volume = computeSfxVolume(settings)
  if (volume <= 0) return null

  return { type: 'play-sfx', sound: getSfxForAction(action), volume }
}
