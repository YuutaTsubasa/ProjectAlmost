import type { WorldData } from './worldTypes'

export const world06: WorldData = {
  id: 'world06',
  number: 6,
  titleRef: 'worlds.world06.title',
  subtitleRef: 'worlds.world06.subtitle',
  theme: 'abyss',
  symbol: '✦',
  stageCount: 6,
  stageIds: ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6'],
  assetRefs: {
    stageSelectBackground: '/assets/maps/abyssal_hollow_stage_select.webp',
  },
  musicRefs: {
    map: '/assets/audio/world06_map.mp3',
    bgm: '/assets/audio/world06_bgm.mp3',
    boss: '/assets/audio/world06_boss.mp3',
  },
}
