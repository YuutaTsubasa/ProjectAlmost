import type { WorldData } from './worldTypes'

export const world03: WorldData = {
  id: 'world03',
  number: 3,
  titleRef: 'worlds.world03.title',
  subtitleRef: 'worlds.world03.subtitle',
  theme: 'ocean',
  symbol: '≈',
  stageCount: 6,
  stageIds: ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/cerulean_depths_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world03_map.mp3',
    bgm: '/assets/audio/world03_bgm.mp3',
    boss: '/assets/audio/world03_boss.mp3',
  },
}
