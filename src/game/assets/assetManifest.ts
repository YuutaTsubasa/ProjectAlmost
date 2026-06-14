export const IMAGE_ASSETS = {
  aiNavigator: '/assets/hud/ai-navigator.png',
  playerPortrait: '/assets/hud/player-portrait.png',
  palaceFarBackground: '/assets/maps/white_palace_far_bg.png',
  palaceMidBackground: '/assets/maps/white_palace_mid_bg_loop.png',
  palaceSky: '/assets/maps/white_palace_sky.png',
  stageSelectBackground: '/assets/maps/white_palace_stage_select.png',
  emeraldSanctuaryStageSelect: '/assets/maps/emerald_sanctuary_stage_select.png',
  ceruleanDepthsStageSelect: '/assets/maps/cerulean_depths_stage_select.png',
  frostveilPeaksStageSelect: '/assets/maps/frostveil_peaks_stage_select.png',
  emberfallCalderaStageSelect: '/assets/maps/emberfall_caldera_stage_select.png',
  abyssalHollowStageSelect: '/assets/maps/abyssal_hollow_stage_select.png',
  checkpoint: '/assets/props/white_palace_checkpoint.png',
  goalIdle: '/assets/props/white_palace_goal_idle.png',
  resultStandee: '/assets/results/yuuta-stage-result-standee.png',
  titleBackground: '/assets/title/project-almost-title-background.png',
  enemyGuardDeath: '/assets/sprites/enemy_guard_death/sheet-transparent.png',
  enemyGuardWalk: '/assets/sprites/enemy_guard_walk/sheet-transparent.png',
  bossPriestessCast: '/assets/sprites/boss_priestess_cast/sheet-transparent.png',
  bossPriestessDeath: '/assets/sprites/boss_priestess_death/sheet-transparent.png',
  bossPriestessHurt: '/assets/sprites/boss_priestess_hurt/sheet-transparent.png',
  playerAttack: '/assets/sprites/player_attack/sheet-transparent.png',
  playerCrouch: '/assets/sprites/player_crouch/sheet-transparent.png',
  playerDeath: '/assets/sprites/player_death/sheet-transparent.png',
  playerHurt: '/assets/sprites/player_hurt/sheet-transparent.png',
  playerIdle: '/assets/sprites/player_idle/sheet-transparent.png',
  playerJump: '/assets/sprites/player_jump/sheet-transparent.png',
  playerRun: '/assets/sprites/player_run/sheet-transparent.png',
  palaceTiles: '/assets/tiles/white_palace_platform_tiles.png',
} as const

export const MUSIC_ASSETS = {
  title: '/assets/audio/titlescreen.mp3',
  result: '/assets/audio/game_result.mp3',
  world01Bgm: '/assets/audio/world01_bgm.mp3',
  world01Boss: '/assets/audio/world01_boss.mp3',
  world01Map: '/assets/audio/world01_map.mp3',
  world02Bgm: '/assets/audio/world02_bgm.mp3',
  world02Boss: '/assets/audio/world02_boss.mp3',
  world02Map: '/assets/audio/world02_map.mp3',
  world03Bgm: '/assets/audio/world03_bgm.mp3',
  world03Boss: '/assets/audio/world03_boss.mp3',
  world03Map: '/assets/audio/world03_map.mp3',
  world04Bgm: '/assets/audio/world04_bgm.mp3',
  world04Boss: '/assets/audio/world04_boss.mp3',
  world04Map: '/assets/audio/world04_map.mp3',
  world05Bgm: '/assets/audio/world05_bgm.mp3',
  world05Boss: '/assets/audio/world05_boss.mp3',
  world05Map: '/assets/audio/world05_map.mp3',
  world06Bgm: '/assets/audio/world06_bgm.mp3',
  world06Boss: '/assets/audio/world06_boss.mp3',
  world06Map: '/assets/audio/world06_map.mp3',
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
