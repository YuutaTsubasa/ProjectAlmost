export const IMAGE_ASSETS = {
  aiNavigator: '/assets/hud/ai-navigator.png',
  playerPortrait: '/assets/hud/player-portrait.png',
  palaceFarBackground: '/assets/maps/white_palace_far_bg.png',
  palaceMidBackground: '/assets/maps/white_palace_mid_bg_loop.png',
  palaceSky: '/assets/maps/white_palace_sky.png',
  stageSelectBackground: '/assets/maps/white_palace_stage_select.png',
  checkpoint: '/assets/props/white_palace_checkpoint.png',
  goalIdle: '/assets/props/white_palace_goal_idle.png',
  resultStandee: '/assets/results/yuuta-stage-result-standee.png',
  titleBackground: '/assets/title/project-almost-title-background.png',
  enemyGuardDeath: '/assets/sprites/enemy_guard_death/sheet-transparent.png',
  enemyGuardWalk: '/assets/sprites/enemy_guard_walk/sheet-transparent.png',
  playerAttack: '/assets/sprites/player_attack/sheet-transparent.png',
  playerDeath: '/assets/sprites/player_death/sheet-transparent.png',
  playerHurt: '/assets/sprites/player_hurt/sheet-transparent.png',
  playerIdle: '/assets/sprites/player_idle/sheet-transparent.png',
  playerJump: '/assets/sprites/player_jump/sheet-transparent.png',
  playerRun: '/assets/sprites/player_run/sheet-transparent.png',
  palaceTiles: '/assets/tiles/white_palace_platform_tiles.png',
} as const

export const MUSIC_ASSETS = {
  title: '/assets/audio/titlescreen.mp3',
  map: '/assets/audio/world01_map.mp3',
  stage: '/assets/audio/world01_stage.mp3',
  result: '/assets/audio/game_result.mp3',
} as const

export const SFX_ASSETS = {
  'ui-move': '/assets/audio/sfx/ui-move.wav',
  'ui-confirm': '/assets/audio/sfx/ui-confirm.wav',
  'ui-back': '/assets/audio/sfx/ui-back.wav',
  'armor-step': '/assets/audio/sfx/armor-step.wav',
  hit: '/assets/audio/sfx/hit.wav',
  coin: '/assets/audio/sfx/coin.wav',
  death: '/assets/audio/sfx/death.wav',
  checkpoint: '/assets/audio/sfx/checkpoint.wav',
  goal: '/assets/audio/sfx/goal.wav',
} as const

export const FONT_ASSETS = [
  '/assets/fonts/rajdhani-latin-400.woff2',
  '/assets/fonts/rajdhani-latin-500.woff2',
  '/assets/fonts/rajdhani-latin-600.woff2',
  '/assets/fonts/rajdhani-latin-700.woff2',
  '/assets/fonts/share-tech-mono-latin-400.woff2',
] as const

export const PRELOAD_ASSETS = [
  ...Object.values(IMAGE_ASSETS),
  ...Object.values(MUSIC_ASSETS),
  ...Object.values(SFX_ASSETS),
  ...FONT_ASSETS,
] as const

export type MusicTrack = keyof typeof MUSIC_ASSETS
