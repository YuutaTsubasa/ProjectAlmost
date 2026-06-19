import type { WorldData } from './worldTypes'

export const world05: WorldData = {
  id: 'world05',
  number: 5,
  titleRef: 'worlds.world05.title',
  subtitleRef: 'worlds.world05.subtitle',
  theme: 'volcano',
  symbol: '◇',
  stageCount: 6,
  stageIds: ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/emberfall_caldera_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world05_map.mp3',
    bgm: '/assets/audio/world05_bgm.mp3',
    boss: '/assets/audio/world05_boss.mp3',
  },
}
