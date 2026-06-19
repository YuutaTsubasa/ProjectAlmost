import { world01 } from './world01'
import { world02 } from './world02'
import { world03 } from './world03'
import { world04 } from './world04'
import { world05 } from './world05'
import { world06 } from './world06'
import type { WorldCatalog } from './worldTypes'

export const worlds: WorldCatalog = {
  order: ['world01', 'world02', 'world03', 'world04', 'world05', 'world06'],
  items: {
    world01,
    world02,
    world03,
    world04,
    world05,
    world06,
  },
}
