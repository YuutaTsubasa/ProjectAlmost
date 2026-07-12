export const MUSIC_ASSETS = {
  title: '/assets/audio/titlescreen.mp3',
  world01Bgm: '/assets/audio/world01_bgm.mp3',
  world02Bgm: '/assets/audio/world02_bgm.mp3',
  world03Bgm: '/assets/audio/world03_bgm.mp3',
  world04Bgm: '/assets/audio/world04_bgm.mp3',
  world05Bgm: '/assets/audio/world05_bgm.mp3',
  world06Bgm: '/assets/audio/world06_bgm.mp3',
  world01Map: '/assets/audio/world01_map.mp3',
  world02Map: '/assets/audio/world02_map.mp3',
  world03Map: '/assets/audio/world03_map.mp3',
  world04Map: '/assets/audio/world04_map.mp3',
  world05Map: '/assets/audio/world05_map.mp3',
  world06Map: '/assets/audio/world06_map.mp3',
} as const

export const SFX_ASSETS = {
  'ui-move': '/assets/audio/sfx/ui-move.wav',
  'ui-confirm': '/assets/audio/sfx/ui-confirm.wav',
  'ui-back': '/assets/audio/sfx/ui-back.wav',
  hit: '/assets/audio/sfx/hit.wav',
  coin: '/assets/audio/sfx/coin.wav',
  death: '/assets/audio/sfx/death.wav',
  checkpoint: '/assets/audio/sfx/checkpoint.wav',
  'armor-step': '/assets/audio/sfx/armor-step.wav',
  goal: '/assets/audio/sfx/goal.wav',
} as const

export type MusicTrackId = keyof typeof MUSIC_ASSETS
export type SfxId = keyof typeof SFX_ASSETS
