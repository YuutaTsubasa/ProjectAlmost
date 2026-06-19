import type { AppScreen } from '../../domain/app/appFlow'
import type { MusicTrackId, SfxId } from '../../domain/audio/audioAssets'
import {
  computeSfxVolume,
  getMusicForScreen,
  getSfxForAction,
  type UiSfxAction,
} from '../../domain/audio/audioPolicy'
import type { GameSettings } from '../../domain/settings/settings'

export type AudioCommand =
  | { type: 'set-music'; track: MusicTrackId; volume: number }
  | { type: 'prepare-music'; track: MusicTrackId }
  | { type: 'play-sfx'; sound: SfxId; volume: number }

export function createMusicCommand(screen: AppScreen, settings: GameSettings): AudioCommand {
  return { type: 'set-music', ...getMusicForScreen(screen, settings) }
}

export function createPrepareMusicCommand(track: MusicTrackId): AudioCommand {
  return { type: 'prepare-music', track }
}

export function createSfxCommand(action: UiSfxAction, settings: GameSettings): AudioCommand | null {
  const volume = computeSfxVolume(settings)
  if (volume <= 0) return null

  return { type: 'play-sfx', sound: getSfxForAction(action), volume }
}
