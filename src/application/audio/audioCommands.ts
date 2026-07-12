import type { AppScreen } from '../../domain/app/appFlow'
import type { MusicTrackId, SfxId } from '../../domain/audio/audioAssets'
import {
  computeSfxVolume,
  getMusicForScreen,
  getSfxForAction,
  type SfxAction,
} from '../../domain/audio/audioPolicy'
import type { GameSettings } from '../../domain/settings/settings'

export type SetMusicCommand = { type: 'set-music'; track: MusicTrackId; volume: number }
export type PrepareMusicCommand = { type: 'prepare-music'; track: MusicTrackId }
export type PlaySfxCommand = { type: 'play-sfx'; sound: SfxId; volume: number }

export type AudioCommand = SetMusicCommand | PrepareMusicCommand | PlaySfxCommand

export function createMusicCommand(screen: AppScreen, settings: GameSettings): SetMusicCommand | null {
  const decision = getMusicForScreen(screen, settings)
  if (!decision) return null

  return { type: 'set-music', ...decision }
}

export function createPrepareMusicCommand(track: MusicTrackId): PrepareMusicCommand {
  return { type: 'prepare-music', track }
}

export function createSfxCommand(action: SfxAction, settings: GameSettings): PlaySfxCommand | null {
  const volume = computeSfxVolume(settings)
  if (volume <= 0) return null

  return { type: 'play-sfx', sound: getSfxForAction(action), volume }
}
