import type { WorldData } from './worldTypes'

export const world02: WorldData = {
  id: 'world02',
  number: 2,
  titleRef: 'worlds.world02.title',
  subtitleRef: 'worlds.world02.subtitle',
  theme: 'forest',
  symbol: '♧',
  stageCount: 6,
  stageIds: ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/emerald_sanctuary_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world02_map.mp3',
    bgm: '/assets/audio/world02_bgm.mp3',
    boss: '/assets/audio/world02_boss.mp3',
  },
}
