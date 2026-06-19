import type { WorldData } from './worldTypes'

export const world01: WorldData = {
  id: 'world01',
  number: 1,
  titleRef: 'worlds.world01.title',
  subtitleRef: 'worlds.world01.subtitle',
  theme: 'palace',
  symbol: '♜',
  stageCount: 6,
  stageIds: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/white_palace_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world01_map.mp3',
    bgm: '/assets/audio/world01_bgm.mp3',
    boss: '/assets/audio/world01_boss.mp3',
  },
}
