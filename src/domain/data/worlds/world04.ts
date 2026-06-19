import type { WorldData } from './worldTypes'

export const world04: WorldData = {
  id: 'world04',
  number: 4,
  titleRef: 'worlds.world04.title',
  subtitleRef: 'worlds.world04.subtitle',
  theme: 'snow',
  symbol: '△',
  stageCount: 6,
  stageIds: ['4-1', '4-2', '4-3', '4-4', '4-5', '4-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/frostveil_peaks_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world04_map.mp3',
    bgm: '/assets/audio/world04_bgm.mp3',
    boss: '/assets/audio/world04_boss.mp3',
  },
}
