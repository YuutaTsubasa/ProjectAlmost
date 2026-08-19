import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayStageSource } from './gameplayStageSource'

export const gameplayStageSources = {
  order: [
  "1-1",
  "1-2",
  "1-3",
  "1-4",
  "1-5",
  "1-6",
  "2-1",
  "2-2",
  "2-3",
  "2-4",
  "2-5",
  "2-6",
  "3-1",
  "3-2",
  "3-3",
  "3-4",
  "3-5",
  "3-6",
  "4-1",
  "4-2",
  "4-3",
  "4-4",
  "4-5",
  "4-6",
  "5-1",
  "5-2",
  "5-3",
  "5-4",
  "5-5",
  "5-6",
  "6-1",
  "6-2",
  "6-3",
  "6-4",
  "6-5",
  "6-6"
] as const satisfies readonly StageId[],
  items: {
  "1-1": {
    "id": "1-1",
    "rankTargets": {
      "sTime": 30,
      "aTime": 42,
      "bTime": 58,
      "cTime": 78
    },
    "world": {
      "width": 9600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 512
    },
    "platforms": [
      {
        "col": 2,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 16,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 23,
        "row": 7,
        "width": 4,
        "height": 1
      },
      {
        "col": 30,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 38,
        "row": 8,
        "width": 13,
        "height": 1
      },
      {
        "col": 54,
        "row": 7,
        "width": 3,
        "height": 1
      },
      {
        "col": 59,
        "row": 6,
        "width": 3,
        "height": 1
      },
      {
        "col": 65,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 80,
        "row": 7,
        "width": 4,
        "height": 1
      },
      {
        "col": 86,
        "row": 6,
        "width": 4,
        "height": 1
      },
      {
        "col": 92,
        "row": 5,
        "width": 7,
        "height": 1
      },
      {
        "col": 103,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 111,
        "row": 8,
        "width": 10,
        "height": 1
      },
      {
        "col": 124,
        "row": 7,
        "width": 4,
        "height": 1
      },
      {
        "col": 130,
        "row": 6,
        "width": 4,
        "height": 1
      },
      {
        "col": 136,
        "row": 8,
        "width": 12,
        "height": 1
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 456
      },
      {
        "x": 560,
        "y": 456
      },
      {
        "x": 700,
        "y": 456
      },
      {
        "x": 1100,
        "y": 456
      },
      {
        "x": 1540,
        "y": 392
      },
      {
        "x": 2000,
        "y": 456
      },
      {
        "x": 2540,
        "y": 456
      },
      {
        "x": 2740,
        "y": 456
      },
      {
        "x": 2940,
        "y": 456
      },
      {
        "x": 3520,
        "y": 392
      },
      {
        "x": 3840,
        "y": 328
      },
      {
        "x": 4280,
        "y": 456
      },
      {
        "x": 4700,
        "y": 456
      },
      {
        "x": 5200,
        "y": 392
      },
      {
        "x": 5580,
        "y": 328
      },
      {
        "x": 5960,
        "y": 264
      },
      {
        "x": 6160,
        "y": 264
      },
      {
        "x": 6720,
        "y": 328
      },
      {
        "x": 7240,
        "y": 456
      },
      {
        "x": 7500,
        "y": 456
      },
      {
        "x": 8064,
        "y": 392
      },
      {
        "x": 8384,
        "y": 328
      },
      {
        "x": 8820,
        "y": 456
      },
      {
        "x": 9100,
        "y": 456
      },
      {
        "x": 9240,
        "y": 456
      }
    ],
    "enemies": [
      {
        "id": "first-guard",
        "x": 2700,
        "surfaceY": 512,
        "patrolMinX": 2520,
        "patrolMaxX": 3060
      },
      {
        "id": "homing-perch-a",
        "x": 3552,
        "surfaceY": 448,
        "patrolMinX": 3500,
        "patrolMaxX": 3604
      },
      {
        "id": "homing-perch-b",
        "x": 3840,
        "surfaceY": 384,
        "patrolMinX": 3800,
        "patrolMaxX": 3880
      },
      {
        "id": "final-guard",
        "x": 5600,
        "surfaceY": 384,
        "patrolMinX": 5520,
        "patrolMaxX": 5680
      },
      {
        "id": "descent-guard",
        "x": 7420,
        "surfaceY": 512,
        "patrolMinX": 7240,
        "patrolMaxX": 7620
      },
      {
        "id": "final-combo-a",
        "x": 8064,
        "surfaceY": 448,
        "patrolMinX": 8010,
        "patrolMaxX": 8118
      },
      {
        "id": "final-combo-b",
        "x": 8384,
        "surfaceY": 384,
        "patrolMinX": 8330,
        "patrolMaxX": 8438
      },
      {
        "id": "gate-guard",
        "x": 9000,
        "surfaceY": 512,
        "patrolMinX": 8840,
        "patrolMaxX": 9160
      }
    ],
    "checkpoints": [
      {
        "id": "combat-gate",
        "x": 2540,
        "surfaceY": 512,
        "spawnX": 2600,
        "spawnSurfaceY": 512
      },
      {
        "id": "final-ascent",
        "x": 4320,
        "surfaceY": 512,
        "spawnX": 4380,
        "spawnSurfaceY": 512
      },
      {
        "id": "final-trial",
        "x": 7300,
        "surfaceY": 512,
        "spawnX": 7360,
        "spawnSurfaceY": 512
      }
    ],
    "goal": {
      "x": 9340,
      "surfaceY": 512
    }
  },
  "1-2": {
    "id": "1-2",
    "rankTargets": {
      "sTime": 18,
      "aTime": 24,
      "bTime": 34,
      "cTime": 48
    },
    "world": {
      "width": 6400,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 512
    },
    "platforms": [
      {
        "col": 2,
        "row": 8,
        "width": 13,
        "height": 1
      },
      {
        "col": 27,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 47,
        "row": 8,
        "width": 9,
        "height": 1
      },
      {
        "col": 67,
        "row": 8,
        "width": 10,
        "height": 1
      },
      {
        "col": 88,
        "row": 8,
        "width": 11,
        "height": 1
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 456
      },
      {
        "x": 650,
        "y": 456
      },
      {
        "x": 1220,
        "y": 370
      },
      {
        "x": 1500,
        "y": 270
      },
      {
        "x": 1780,
        "y": 370
      },
      {
        "x": 1980,
        "y": 456
      },
      {
        "x": 2180,
        "y": 456
      },
      {
        "x": 2500,
        "y": 360
      },
      {
        "x": 2780,
        "y": 250
      },
      {
        "x": 3060,
        "y": 360
      },
      {
        "x": 3340,
        "y": 456
      },
      {
        "x": 3820,
        "y": 350
      },
      {
        "x": 4100,
        "y": 245
      },
      {
        "x": 4320,
        "y": 350
      },
      {
        "x": 4660,
        "y": 456
      },
      {
        "x": 5180,
        "y": 350
      },
      {
        "x": 5460,
        "y": 260
      }
    ],
    "enemies": [
      {
        "id": "core-tutorial-a",
        "type": "azure-core",
        "x": 1220,
        "y": 390,
        "patrolMinX": 1220,
        "patrolMaxX": 1220
      },
      {
        "id": "core-tutorial-b",
        "type": "azure-core",
        "x": 1500,
        "y": 290,
        "patrolMinX": 1500,
        "patrolMaxX": 1500
      },
      {
        "id": "core-tutorial-c",
        "type": "azure-core",
        "x": 1780,
        "y": 390,
        "patrolMinX": 1780,
        "patrolMaxX": 1780
      },
      {
        "id": "courtyard-guard-a",
        "x": 2050,
        "surfaceY": 512,
        "patrolMinX": 1840,
        "patrolMaxX": 2180
      },
      {
        "id": "core-rise-a",
        "type": "azure-core",
        "x": 2500,
        "y": 380,
        "patrolMinX": 2500,
        "patrolMaxX": 2500
      },
      {
        "id": "core-rise-b",
        "type": "azure-core",
        "x": 2780,
        "y": 270,
        "patrolMinX": 2780,
        "patrolMaxX": 2780
      },
      {
        "id": "core-rise-c",
        "type": "azure-core",
        "x": 3060,
        "y": 380,
        "patrolMinX": 3060,
        "patrolMaxX": 3060
      },
      {
        "id": "courtyard-guard-b",
        "x": 3400,
        "surfaceY": 512,
        "patrolMinX": 3120,
        "patrolMaxX": 3520
      },
      {
        "id": "core-arc-a",
        "type": "azure-core",
        "x": 3820,
        "y": 370,
        "patrolMinX": 3820,
        "patrolMaxX": 3820
      },
      {
        "id": "core-arc-b",
        "type": "azure-core",
        "x": 4100,
        "y": 265,
        "patrolMinX": 4100,
        "patrolMaxX": 4100
      },
      {
        "id": "core-arc-c",
        "type": "azure-core",
        "x": 4320,
        "y": 370,
        "patrolMinX": 4320,
        "patrolMaxX": 4320
      },
      {
        "id": "courtyard-guard-c",
        "x": 4660,
        "surfaceY": 512,
        "patrolMinX": 4400,
        "patrolMaxX": 4860
      },
      {
        "id": "core-finale-a",
        "type": "azure-core",
        "x": 5180,
        "y": 370,
        "patrolMinX": 5180,
        "patrolMaxX": 5180
      },
      {
        "id": "core-finale-b",
        "type": "azure-core",
        "x": 5460,
        "y": 280,
        "patrolMinX": 5460,
        "patrolMaxX": 5460
      },
      {
        "id": "core-finale-c",
        "type": "azure-core",
        "x": 5680,
        "y": 370,
        "patrolMinX": 5680,
        "patrolMaxX": 5680
      }
    ],
    "checkpoints": [
      {
        "id": "chain-complete",
        "x": 1880,
        "surfaceY": 512,
        "spawnX": 1940,
        "spawnSurfaceY": 512
      },
      {
        "id": "final-chain",
        "x": 4480,
        "surfaceY": 512,
        "spawnX": 4540,
        "spawnSurfaceY": 512
      }
    ],
    "goal": {
      "x": 6200,
      "surfaceY": 512
    }
  },
  "1-3": {
    "id": "1-3",
    "rankTargets": {
      "sTime": 25,
      "aTime": 32,
      "bTime": 44,
      "cTime": 60
    },
    "world": {
      "width": 12032,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 512
    },
    "platforms": [
      {
        "col": 2,
        "row": 8,
        "width": 16,
        "height": 1
      },
      {
        "col": 30,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 45,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 54,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 64,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 80,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 89,
        "row": 5,
        "width": 5,
        "height": 1
      },
      {
        "col": 99,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 110,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 130,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 142,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 156,
        "row": 6,
        "width": 6,
        "height": 1
      },
      {
        "col": 171,
        "row": 8,
        "width": 14,
        "height": 1
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 456
      },
      {
        "x": 650,
        "y": 456
      },
      {
        "x": 880,
        "y": 456
      },
      {
        "x": 1370,
        "y": 360
      },
      {
        "x": 1600,
        "y": 260
      },
      {
        "x": 1940,
        "y": 360
      },
      {
        "x": 2200,
        "y": 456
      },
      {
        "x": 2500,
        "y": 456
      },
      {
        "x": 2960,
        "y": 456
      },
      {
        "x": 3290,
        "y": 392
      },
      {
        "x": 2920,
        "y": 280
      },
      {
        "x": 3240,
        "y": 180
      },
      {
        "x": 3560,
        "y": 180
      },
      {
        "x": 3880,
        "y": 280
      },
      {
        "x": 4300,
        "y": 456
      },
      {
        "x": 4660,
        "y": 456
      },
      {
        "x": 5220,
        "y": 328
      },
      {
        "x": 5800,
        "y": 264
      },
      {
        "x": 6440,
        "y": 328
      },
      {
        "x": 6900,
        "y": 390
      },
      {
        "x": 7300,
        "y": 456
      },
      {
        "x": 7660,
        "y": 456
      },
      {
        "x": 8060,
        "y": 360
      },
      {
        "x": 8360,
        "y": 456
      },
      {
        "x": 8820,
        "y": 300
      },
      {
        "x": 9180,
        "y": 392
      },
      {
        "x": 9600,
        "y": 250
      },
      {
        "x": 10080,
        "y": 328
      },
      {
        "x": 10520,
        "y": 270
      },
      {
        "x": 11100,
        "y": 456
      },
      {
        "x": 11400,
        "y": 456
      }
    ],
    "enemies": [
      {
        "id": "launch-core-a",
        "type": "azure-core",
        "x": 1370,
        "y": 380,
        "patrolMinX": 1370,
        "patrolMaxX": 1370
      },
      {
        "id": "launch-core-b",
        "type": "azure-core",
        "x": 1600,
        "y": 280,
        "patrolMinX": 1600,
        "patrolMaxX": 1600
      },
      {
        "id": "launch-core-c",
        "type": "azure-core",
        "x": 1820,
        "y": 380,
        "patrolMinX": 1820,
        "patrolMaxX": 1820
      },
      {
        "id": "launch-core-d",
        "type": "azure-core",
        "x": 1960,
        "y": 380,
        "patrolMinX": 1960,
        "patrolMaxX": 1960
      },
      {
        "id": "terrace-guard-a",
        "x": 2300,
        "surfaceY": 512,
        "patrolMinX": 2100,
        "patrolMaxX": 2540
      },
      {
        "id": "upper-route-core-a",
        "type": "azure-core",
        "x": 2920,
        "y": 300,
        "patrolMinX": 2920,
        "patrolMaxX": 2920
      },
      {
        "id": "upper-route-core-b",
        "type": "azure-core",
        "x": 3240,
        "y": 200,
        "patrolMinX": 3240,
        "patrolMaxX": 3240
      },
      {
        "id": "upper-route-core-c",
        "type": "azure-core",
        "x": 3560,
        "y": 200,
        "patrolMinX": 3560,
        "patrolMaxX": 3560
      },
      {
        "id": "upper-route-core-d",
        "type": "azure-core",
        "x": 3880,
        "y": 300,
        "patrolMinX": 3880,
        "patrolMaxX": 3880
      },
      {
        "id": "upper-route-core-e",
        "type": "azure-core",
        "x": 4160,
        "y": 380,
        "patrolMinX": 4160,
        "patrolMaxX": 4160
      },
      {
        "id": "terrace-guard-b",
        "x": 4500,
        "surfaceY": 512,
        "patrolMinX": 4260,
        "patrolMaxX": 4740
      },
      {
        "id": "stair-core-a",
        "type": "azure-core",
        "x": 5000,
        "y": 390,
        "patrolMinX": 5000,
        "patrolMaxX": 5000
      },
      {
        "id": "stair-core-b",
        "type": "azure-core",
        "x": 5320,
        "y": 300,
        "patrolMinX": 5320,
        "patrolMaxX": 5320
      },
      {
        "id": "stair-core-c",
        "type": "azure-core",
        "x": 5640,
        "y": 240,
        "patrolMinX": 5640,
        "patrolMaxX": 5640
      },
      {
        "id": "stair-core-d",
        "type": "azure-core",
        "x": 5960,
        "y": 200,
        "patrolMinX": 5960,
        "patrolMaxX": 5960
      },
      {
        "id": "stair-core-e",
        "type": "azure-core",
        "x": 6280,
        "y": 240,
        "patrolMinX": 6280,
        "patrolMaxX": 6280
      },
      {
        "id": "stair-core-f",
        "type": "azure-core",
        "x": 6600,
        "y": 300,
        "patrolMinX": 6600,
        "patrolMaxX": 6600
      },
      {
        "id": "stair-core-g",
        "type": "azure-core",
        "x": 6920,
        "y": 360,
        "patrolMinX": 6920,
        "patrolMaxX": 6920
      },
      {
        "id": "stair-core-h",
        "type": "azure-core",
        "x": 7160,
        "y": 400,
        "patrolMinX": 7160,
        "patrolMaxX": 7160
      },
      {
        "id": "convergence-guard",
        "x": 7420,
        "surfaceY": 512,
        "patrolMinX": 7160,
        "patrolMaxX": 7700
      },
      {
        "id": "final-core-a",
        "type": "azure-core",
        "x": 8060,
        "y": 380,
        "patrolMinX": 8060,
        "patrolMaxX": 8060
      },
      {
        "id": "final-core-b",
        "type": "azure-core",
        "x": 8380,
        "y": 300,
        "patrolMinX": 8380,
        "patrolMaxX": 8380
      },
      {
        "id": "final-core-c",
        "type": "azure-core",
        "x": 8700,
        "y": 250,
        "patrolMinX": 8700,
        "patrolMaxX": 8700
      },
      {
        "id": "final-core-d",
        "type": "azure-core",
        "x": 9020,
        "y": 320,
        "patrolMinX": 9020,
        "patrolMaxX": 9020
      },
      {
        "id": "final-core-e",
        "type": "azure-core",
        "x": 9340,
        "y": 220,
        "patrolMinX": 9340,
        "patrolMaxX": 9340
      },
      {
        "id": "final-core-f",
        "type": "azure-core",
        "x": 9660,
        "y": 300,
        "patrolMinX": 9660,
        "patrolMaxX": 9660
      },
      {
        "id": "final-core-g",
        "type": "azure-core",
        "x": 9980,
        "y": 240,
        "patrolMinX": 9980,
        "patrolMaxX": 9980
      },
      {
        "id": "final-core-h",
        "type": "azure-core",
        "x": 10300,
        "y": 300,
        "patrolMinX": 10300,
        "patrolMaxX": 10300
      },
      {
        "id": "final-core-i",
        "type": "azure-core",
        "x": 10630,
        "y": 350,
        "patrolMinX": 10630,
        "patrolMaxX": 10630
      },
      {
        "id": "final-core-j",
        "type": "azure-core",
        "x": 10980,
        "y": 400,
        "patrolMinX": 10980,
        "patrolMaxX": 10980
      },
      {
        "id": "finish-guard",
        "x": 11220,
        "surfaceY": 512,
        "patrolMinX": 11020,
        "patrolMaxX": 11500
      }
    ],
    "checkpoints": [
      {
        "id": "route-choice-complete",
        "x": 4300,
        "surfaceY": 512,
        "spawnX": 4380,
        "spawnSurfaceY": 512
      },
      {
        "id": "sky-stair-complete",
        "x": 7280,
        "surfaceY": 512,
        "spawnX": 7360,
        "spawnSurfaceY": 512
      }
    ],
    "goal": {
      "x": 11620,
      "surfaceY": 512
    }
  },
  "1-4": {
    "id": "1-4",
    "rankTargets": {
      "sTime": 27,
      "aTime": 35,
      "bTime": 48,
      "cTime": 65
    },
    "world": {
      "width": 12800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 512
    },
    "platforms": [
      {
        "col": 2,
        "row": 8,
        "width": 16,
        "height": 1
      },
      {
        "col": 21,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 30,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 38,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 48,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 56,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 64,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 73,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 88,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 96,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 104,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 112,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 120,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 135,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 144,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 153,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 162,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 171,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 180,
        "row": 8,
        "width": 17,
        "height": 1
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 456
      },
      {
        "x": 680,
        "y": 456
      },
      {
        "x": 940,
        "y": 456
      },
      {
        "x": 1460,
        "y": 456
      },
      {
        "x": 1990,
        "y": 392
      },
      {
        "x": 2510,
        "y": 456
      },
      {
        "x": 3150,
        "y": 392
      },
      {
        "x": 3660,
        "y": 328
      },
      {
        "x": 4200,
        "y": 392
      },
      {
        "x": 4750,
        "y": 456
      },
      {
        "x": 5100,
        "y": 456
      },
      {
        "x": 5600,
        "y": 300
      },
      {
        "x": 5900,
        "y": 210
      },
      {
        "x": 6200,
        "y": 210
      },
      {
        "x": 6500,
        "y": 300
      },
      {
        "x": 6800,
        "y": 380
      },
      {
        "x": 7360,
        "y": 392
      },
      {
        "x": 7800,
        "y": 456
      },
      {
        "x": 8220,
        "y": 456
      },
      {
        "x": 8700,
        "y": 340
      },
      {
        "x": 9000,
        "y": 240
      },
      {
        "x": 9300,
        "y": 190
      },
      {
        "x": 9600,
        "y": 240
      },
      {
        "x": 9900,
        "y": 340
      },
      {
        "x": 10480,
        "y": 392
      },
      {
        "x": 11000,
        "y": 456
      },
      {
        "x": 11680,
        "y": 456
      },
      {
        "x": 12000,
        "y": 456
      },
      {
        "x": 12320,
        "y": 456
      }
    ],
    "enemies": [
      {
        "id": "opening-guard-a",
        "x": 760,
        "surfaceY": 512,
        "patrolMinX": 560,
        "patrolMaxX": 980
      },
      {
        "id": "rhythm-guard-a",
        "x": 2520,
        "surfaceY": 512,
        "patrolMinX": 2460,
        "patrolMaxX": 2780
      },
      {
        "id": "rhythm-guard-b",
        "x": 3240,
        "surfaceY": 448,
        "patrolMinX": 3140,
        "patrolMaxX": 3340
      },
      {
        "id": "rhythm-guard-c",
        "x": 4210,
        "surfaceY": 448,
        "patrolMinX": 4140,
        "patrolMaxX": 4380
      },
      {
        "id": "first-checkpoint-guard",
        "x": 5050,
        "surfaceY": 512,
        "patrolMinX": 4860,
        "patrolMaxX": 5320
      },
      {
        "id": "high-arch-core-a",
        "type": "azure-core",
        "x": 5600,
        "y": 320,
        "patrolMinX": 5600,
        "patrolMaxX": 5600
      },
      {
        "id": "high-arch-core-b",
        "type": "azure-core",
        "x": 5900,
        "y": 230,
        "patrolMinX": 5900,
        "patrolMaxX": 5900
      },
      {
        "id": "high-arch-core-c",
        "type": "azure-core",
        "x": 6200,
        "y": 230,
        "patrolMinX": 6200,
        "patrolMaxX": 6200
      },
      {
        "id": "high-arch-core-d",
        "type": "azure-core",
        "x": 6500,
        "y": 320,
        "patrolMinX": 6500,
        "patrolMaxX": 6500
      },
      {
        "id": "high-arch-core-e",
        "type": "azure-core",
        "x": 6800,
        "y": 400,
        "patrolMinX": 6800,
        "patrolMaxX": 6800
      },
      {
        "id": "bridge-guard-a",
        "x": 7420,
        "surfaceY": 448,
        "patrolMinX": 7300,
        "patrolMaxX": 7500
      },
      {
        "id": "bridge-guard-b",
        "x": 7880,
        "surfaceY": 512,
        "patrolMinX": 7740,
        "patrolMaxX": 8100
      },
      {
        "id": "second-checkpoint-guard",
        "x": 8230,
        "surfaceY": 512,
        "patrolMinX": 8120,
        "patrolMaxX": 8400
      },
      {
        "id": "crest-core-a",
        "type": "azure-core",
        "x": 8700,
        "y": 360,
        "patrolMinX": 8700,
        "patrolMaxX": 8700
      },
      {
        "id": "crest-core-b",
        "type": "azure-core",
        "x": 9000,
        "y": 260,
        "patrolMinX": 9000,
        "patrolMaxX": 9000
      },
      {
        "id": "crest-core-c",
        "type": "azure-core",
        "x": 9300,
        "y": 210,
        "patrolMinX": 9300,
        "patrolMaxX": 9300
      },
      {
        "id": "crest-core-d",
        "type": "azure-core",
        "x": 9600,
        "y": 260,
        "patrolMinX": 9600,
        "patrolMaxX": 9600
      },
      {
        "id": "crest-core-e",
        "type": "azure-core",
        "x": 9900,
        "y": 360,
        "patrolMinX": 9900,
        "patrolMaxX": 9900
      },
      {
        "id": "final-bridge-guard",
        "x": 11040,
        "surfaceY": 512,
        "patrolMinX": 10980,
        "patrolMaxX": 11220
      },
      {
        "id": "finish-guard",
        "x": 11920,
        "surfaceY": 512,
        "patrolMinX": 11720,
        "patrolMaxX": 12120
      }
    ],
    "checkpoints": [
      {
        "id": "broken-bridge-complete",
        "x": 4840,
        "surfaceY": 512,
        "spawnX": 4920,
        "spawnSurfaceY": 512
      },
      {
        "id": "high-arch-complete",
        "x": 7860,
        "surfaceY": 512,
        "spawnX": 7980,
        "spawnSurfaceY": 512
      }
    ],
    "goal": {
      "x": 12500,
      "surfaceY": 512
    }
  },
  "1-5": {
    "id": "1-5",
    "rankTargets": {
      "sTime": 66,
      "aTime": 84,
      "bTime": 110,
      "cTime": 145
    },
    "world": {
      "width": 29184,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 512
    },
    "platforms": [
      {
        "col": 2,
        "row": 8,
        "width": 16,
        "height": 1
      },
      {
        "col": 21,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 30,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 38,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 48,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 56,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 64,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 73,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 100,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 115,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 123,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 131,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 139,
        "row": 8,
        "width": 10,
        "height": 1
      },
      {
        "col": 153,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 162,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 171,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 182,
        "row": 8,
        "width": 14,
        "height": 1
      },
      {
        "col": 199,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 207,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 215,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 223,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 239,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 248,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 256,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 264,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 272,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 294,
        "row": 8,
        "width": 12,
        "height": 1
      },
      {
        "col": 309,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 317,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 326,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 335,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 344,
        "row": 8,
        "width": 14,
        "height": 1
      },
      {
        "col": 361,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 371,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 379,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 387,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 395,
        "row": 8,
        "width": 10,
        "height": 1
      },
      {
        "col": 420,
        "row": 8,
        "width": 10,
        "height": 1
      },
      {
        "col": 433,
        "row": 7,
        "width": 5,
        "height": 1
      },
      {
        "col": 441,
        "row": 8,
        "width": 14,
        "height": 1
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 456
      },
      {
        "x": 680,
        "y": 456
      },
      {
        "x": 940,
        "y": 456
      },
      {
        "x": 1460,
        "y": 456
      },
      {
        "x": 1990,
        "y": 392
      },
      {
        "x": 2510,
        "y": 456
      },
      {
        "x": 3150,
        "y": 392
      },
      {
        "x": 3660,
        "y": 328
      },
      {
        "x": 4200,
        "y": 392
      },
      {
        "x": 4750,
        "y": 456
      },
      {
        "x": 5550,
        "y": 360
      },
      {
        "x": 5850,
        "y": 250
      },
      {
        "x": 6150,
        "y": 250
      },
      {
        "x": 6450,
        "y": 360
      },
      {
        "x": 6800,
        "y": 456
      },
      {
        "x": 7420,
        "y": 392
      },
      {
        "x": 7900,
        "y": 328
      },
      {
        "x": 8380,
        "y": 392
      },
      {
        "x": 9000,
        "y": 456
      },
      {
        "x": 9800,
        "y": 456
      },
      {
        "x": 10100,
        "y": 340
      },
      {
        "x": 10400,
        "y": 240
      },
      {
        "x": 10700,
        "y": 240
      },
      {
        "x": 11000,
        "y": 340
      },
      {
        "x": 11700,
        "y": 456
      },
      {
        "x": 12300,
        "y": 456
      },
      {
        "x": 12850,
        "y": 392
      },
      {
        "x": 13350,
        "y": 328
      },
      {
        "x": 13850,
        "y": 392
      },
      {
        "x": 14500,
        "y": 456
      },
      {
        "x": 15450,
        "y": 456
      },
      {
        "x": 16000,
        "y": 392
      },
      {
        "x": 16450,
        "y": 328
      },
      {
        "x": 16950,
        "y": 392
      },
      {
        "x": 17500,
        "y": 456
      },
      {
        "x": 18100,
        "y": 360
      },
      {
        "x": 18420,
        "y": 250
      },
      {
        "x": 18740,
        "y": 250
      },
      {
        "x": 19000,
        "y": 360
      },
      {
        "x": 19750,
        "y": 392
      },
      {
        "x": 20350,
        "y": 456
      },
      {
        "x": 20950,
        "y": 328
      },
      {
        "x": 21500,
        "y": 392
      },
      {
        "x": 22100,
        "y": 456
      },
      {
        "x": 22500,
        "y": 456
      },
      {
        "x": 23200,
        "y": 456
      },
      {
        "x": 23850,
        "y": 392
      },
      {
        "x": 24350,
        "y": 328
      },
      {
        "x": 24900,
        "y": 392
      },
      {
        "x": 25500,
        "y": 456
      },
      {
        "x": 26050,
        "y": 360
      },
      {
        "x": 26360,
        "y": 250
      },
      {
        "x": 26670,
        "y": 250
      },
      {
        "x": 26980,
        "y": 360
      },
      {
        "x": 27350,
        "y": 456
      },
      {
        "x": 27850,
        "y": 392
      },
      {
        "x": 28450,
        "y": 456
      }
    ],
    "enemies": [
      {
        "id": "act1-guard-a",
        "x": 760,
        "surfaceY": 512,
        "patrolMinX": 560,
        "patrolMaxX": 980
      },
      {
        "id": "act1-guard-b",
        "x": 2520,
        "surfaceY": 512,
        "patrolMinX": 2480,
        "patrolMaxX": 2780
      },
      {
        "id": "act1-guard-c",
        "x": 3240,
        "surfaceY": 448,
        "patrolMinX": 3140,
        "patrolMaxX": 3340
      },
      {
        "id": "act1-guard-d",
        "x": 4210,
        "surfaceY": 448,
        "patrolMinX": 4140,
        "patrolMaxX": 4380
      },
      {
        "id": "act1-core-a",
        "type": "azure-core",
        "x": 5550,
        "y": 380,
        "patrolMinX": 5550,
        "patrolMaxX": 5550
      },
      {
        "id": "act1-core-b",
        "type": "azure-core",
        "x": 5850,
        "y": 270,
        "patrolMinX": 5850,
        "patrolMaxX": 5850
      },
      {
        "id": "act1-core-c",
        "type": "azure-core",
        "x": 6150,
        "y": 270,
        "patrolMinX": 6150,
        "patrolMaxX": 6150
      },
      {
        "id": "act1-core-d",
        "type": "azure-core",
        "x": 6450,
        "y": 380,
        "patrolMinX": 6450,
        "patrolMaxX": 6450
      },
      {
        "id": "act2-guard-a",
        "x": 6800,
        "surfaceY": 512,
        "patrolMinX": 6600,
        "patrolMaxX": 7040
      },
      {
        "id": "act2-guard-b",
        "x": 7480,
        "surfaceY": 448,
        "patrolMinX": 7400,
        "patrolMaxX": 7580
      },
      {
        "id": "act2-route-core-a",
        "type": "azure-core",
        "x": 9700,
        "y": 380,
        "patrolMinX": 9700,
        "patrolMaxX": 9700
      },
      {
        "id": "act2-route-core-b",
        "type": "azure-core",
        "x": 10020,
        "y": 280,
        "patrolMinX": 10020,
        "patrolMaxX": 10020
      },
      {
        "id": "act2-route-core-c",
        "type": "azure-core",
        "x": 10340,
        "y": 200,
        "patrolMinX": 10340,
        "patrolMaxX": 10340
      },
      {
        "id": "act2-route-core-d",
        "type": "azure-core",
        "x": 10660,
        "y": 200,
        "patrolMinX": 10660,
        "patrolMaxX": 10660
      },
      {
        "id": "act2-route-core-e",
        "type": "azure-core",
        "x": 10980,
        "y": 280,
        "patrolMinX": 10980,
        "patrolMaxX": 10980
      },
      {
        "id": "act2-route-core-f",
        "type": "azure-core",
        "x": 11300,
        "y": 380,
        "patrolMinX": 11300,
        "patrolMaxX": 11300
      },
      {
        "id": "act2-route-core-g",
        "type": "azure-core",
        "x": 11600,
        "y": 400,
        "patrolMinX": 11600,
        "patrolMaxX": 11600
      },
      {
        "id": "act2-route-core-h",
        "type": "azure-core",
        "x": 11720,
        "y": 400,
        "patrolMinX": 11720,
        "patrolMaxX": 11720
      },
      {
        "id": "act2-guard-c",
        "x": 11850,
        "surfaceY": 512,
        "patrolMinX": 11720,
        "patrolMaxX": 12100
      },
      {
        "id": "act2-guard-d",
        "x": 12900,
        "surfaceY": 448,
        "patrolMinX": 12800,
        "patrolMaxX": 13000
      },
      {
        "id": "act2-guard-e",
        "x": 13900,
        "surfaceY": 448,
        "patrolMinX": 13800,
        "patrolMaxX": 14040
      },
      {
        "id": "act3-guard-a",
        "x": 15550,
        "surfaceY": 512,
        "patrolMinX": 15400,
        "patrolMaxX": 15640
      },
      {
        "id": "act3-guard-b",
        "x": 16450,
        "surfaceY": 384,
        "patrolMinX": 16432,
        "patrolMaxX": 16650
      },
      {
        "id": "act3-guard-c",
        "x": 17500,
        "surfaceY": 512,
        "patrolMinX": 17440,
        "patrolMaxX": 17760
      },
      {
        "id": "act3-core-a",
        "type": "azure-core",
        "x": 18100,
        "y": 380,
        "patrolMinX": 18100,
        "patrolMaxX": 18100
      },
      {
        "id": "act3-core-b",
        "type": "azure-core",
        "x": 18420,
        "y": 270,
        "patrolMinX": 18420,
        "patrolMaxX": 18420
      },
      {
        "id": "act3-core-c",
        "type": "azure-core",
        "x": 18740,
        "y": 270,
        "patrolMinX": 18740,
        "patrolMaxX": 18740
      },
      {
        "id": "act3-core-d",
        "type": "azure-core",
        "x": 19000,
        "y": 380,
        "patrolMinX": 19000,
        "patrolMaxX": 19000
      },
      {
        "id": "act3-guard-d",
        "x": 19500,
        "surfaceY": 512,
        "patrolMinX": 19300,
        "patrolMaxX": 19536
      },
      {
        "id": "act3-guard-e",
        "x": 20450,
        "surfaceY": 512,
        "patrolMinX": 20320,
        "patrolMaxX": 20600
      },
      {
        "id": "act3-guard-f",
        "x": 21500,
        "surfaceY": 448,
        "patrolMinX": 21488,
        "patrolMaxX": 21760
      },
      {
        "id": "act3-finish-guard",
        "x": 22200,
        "surfaceY": 512,
        "patrolMinX": 22080,
        "patrolMaxX": 22400
      },
      {
        "id": "encore-guard-a",
        "x": 23300,
        "surfaceY": 512,
        "patrolMinX": 23180,
        "patrolMaxX": 23500
      },
      {
        "id": "encore-guard-b",
        "x": 24380,
        "surfaceY": 384,
        "patrolMinX": 24300,
        "patrolMaxX": 24500
      },
      {
        "id": "encore-guard-c",
        "x": 25450,
        "surfaceY": 512,
        "patrolMinX": 25320,
        "patrolMaxX": 25700
      },
      {
        "id": "encore-core-a",
        "type": "azure-core",
        "x": 26050,
        "y": 380,
        "patrolMinX": 26050,
        "patrolMaxX": 26050
      },
      {
        "id": "encore-core-b",
        "type": "azure-core",
        "x": 26360,
        "y": 270,
        "patrolMinX": 26360,
        "patrolMaxX": 26360
      },
      {
        "id": "encore-core-c",
        "type": "azure-core",
        "x": 26670,
        "y": 270,
        "patrolMinX": 26670,
        "patrolMaxX": 26670
      },
      {
        "id": "encore-core-d",
        "type": "azure-core",
        "x": 26980,
        "y": 380,
        "patrolMinX": 26980,
        "patrolMaxX": 26980
      },
      {
        "id": "encore-guard-d",
        "x": 27850,
        "surfaceY": 448,
        "patrolMinX": 27780,
        "patrolMaxX": 27960
      },
      {
        "id": "encore-finish-guard",
        "x": 28450,
        "surfaceY": 512,
        "patrolMinX": 28320,
        "patrolMaxX": 28600
      }
    ],
    "checkpoints": [
      {
        "id": "remix-one-complete",
        "x": 6680,
        "surfaceY": 512,
        "spawnX": 6760,
        "spawnSurfaceY": 512
      },
      {
        "id": "remix-two-complete",
        "x": 14400,
        "surfaceY": 512,
        "spawnX": 14520,
        "spawnSurfaceY": 512
      },
      {
        "id": "final-remix",
        "x": 19320,
        "surfaceY": 512,
        "spawnX": 19420,
        "spawnSurfaceY": 512
      },
      {
        "id": "encore-start",
        "x": 22480,
        "surfaceY": 512,
        "spawnX": 22580,
        "spawnSurfaceY": 512
      }
    ],
    "goal": {
      "x": 28800,
      "surfaceY": 512
    }
  },
  "1-6": {
    "id": "1-6",
    "rankTargets": {
      "sTime": 75,
      "aTime": 100,
      "bTime": 130,
      "cTime": 180
    },
    "world": {
      "width": 6400,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 512
    },
    "platforms": [
      {
        "col": 2,
        "row": 8,
        "width": 16,
        "height": 1
      },
      {
        "col": 21,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 32,
        "row": 7,
        "width": 7,
        "height": 1
      },
      {
        "col": 42,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 53,
        "row": 6,
        "width": 7,
        "height": 1
      },
      {
        "col": 63,
        "row": 8,
        "width": 9,
        "height": 1
      },
      {
        "col": 75,
        "row": 7,
        "width": 8,
        "height": 1
      },
      {
        "col": 86,
        "row": 8,
        "width": 13,
        "height": 1
      },
      {
        "col": 89,
        "row": 7,
        "width": 6,
        "height": 1
      }
    ],
    "coins": [],
    "enemies": [
      {
        "id": "boss-prototype",
        "type": "azure-core",
        "respawnPolicy": "persistent",
        "countsForScore": true,
        "x": 5880,
        "y": 384,
        "patrolMinX": 5880,
        "patrolMaxX": 5880
      },
      {
        "id": "approach-core-1",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 1248,
        "y": 350,
        "patrolMinX": 1248,
        "patrolMaxX": 1248
      },
      {
        "id": "approach-core-2",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 1984,
        "y": 330,
        "patrolMinX": 1984,
        "patrolMaxX": 1984
      },
      {
        "id": "approach-core-3",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 2624,
        "y": 320,
        "patrolMinX": 2624,
        "patrolMaxX": 2624
      },
      {
        "id": "approach-core-4",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 3328,
        "y": 290,
        "patrolMinX": 3328,
        "patrolMaxX": 3328
      },
      {
        "id": "approach-core-5",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 3968,
        "y": 340,
        "patrolMinX": 3968,
        "patrolMaxX": 3968
      },
      {
        "id": "approach-core-6",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 4736,
        "y": 310,
        "patrolMinX": 4736,
        "patrolMaxX": 4736
      },
      {
        "id": "approach-core-7",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 5440,
        "y": 330,
        "patrolMinX": 5440,
        "patrolMaxX": 5440
      }
    ],
    "checkpoints": [],
    "goal": {
      "x": 6200,
      "surfaceY": 512
    }
  },
  "2-1": {
    "id": "2-1",
    "theme": "emerald-sanctuary",
    "rankTargets": {
      "sTime": 32,
      "aTime": 44,
      "bTime": 62,
      "cTime": 86
    },
    "world": {
      "width": 8600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 18,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 31,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 43,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 58,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 72,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 88,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 101,
        "row": 10,
        "width": 11,
        "height": 1
      },
      {
        "col": 120,
        "row": 10,
        "width": 12,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "first-vine-lift",
        "col": 26,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 72,
        "durationMs": 2100
      },
      {
        "id": "thorn-gap-ferry",
        "col": 52,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 112,
        "durationMs": 2600,
        "phase": 0.35
      },
      {
        "id": "canopy-ferry",
        "col": 65,
        "row": 7,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 112,
        "durationMs": 2800,
        "phase": 0.6
      }
    ],
    "hazards": [
      {
        "id": "first-thorn-bed",
        "type": "spikes",
        "x": 760,
        "surfaceY": 640,
        "width": 180,
        "height": 62,
        "orientation": "floor"
      },
      {
        "id": "lift-thorns",
        "type": "spikes",
        "x": 1420,
        "surfaceY": 640,
        "width": 160,
        "height": 58,
        "orientation": "floor"
      },
      {
        "id": "ferry-thorn-bed",
        "type": "spikes",
        "x": 3040,
        "surfaceY": 640,
        "width": 170,
        "height": 58,
        "orientation": "floor"
      },
      {
        "id": "canopy-thorn-bed",
        "type": "spikes",
        "x": 4920,
        "surfaceY": 640,
        "width": 220,
        "height": 62,
        "orientation": "floor"
      },
      {
        "id": "final-thorn-bed",
        "type": "spikes",
        "x": 6900,
        "surfaceY": 640,
        "width": 220,
        "height": 62,
        "orientation": "floor"
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 560,
        "y": 584
      },
      {
        "x": 720,
        "y": 584
      },
      {
        "x": 1260,
        "y": 540
      },
      {
        "x": 1780,
        "y": 488
      },
      {
        "x": 2220,
        "y": 520
      },
      {
        "x": 2520,
        "y": 456
      },
      {
        "x": 3100,
        "y": 456
      },
      {
        "x": 3560,
        "y": 520
      },
      {
        "x": 4040,
        "y": 456
      },
      {
        "x": 4600,
        "y": 392
      },
      {
        "x": 4880,
        "y": 392
      },
      {
        "x": 5340,
        "y": 584
      },
      {
        "x": 5720,
        "y": 584
      },
      {
        "x": 6120,
        "y": 520
      },
      {
        "x": 6580,
        "y": 584
      },
      {
        "x": 7220,
        "y": 520
      },
      {
        "x": 7800,
        "y": 584
      },
      {
        "x": 8080,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "sanctuary-guard-a",
        "type": "thorn-beetle",
        "x": 620,
        "surfaceY": 640,
        "patrolMinX": 360,
        "patrolMaxX": 790
      },
      {
        "id": "thorn-core-a",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 1780,
        "y": 500,
        "patrolMinX": 1780,
        "patrolMaxX": 1780
      },
      {
        "id": "sanctuary-guard-b",
        "type": "thorn-beetle",
        "x": 1420,
        "surfaceY": 640,
        "patrolMinX": 1210,
        "patrolMaxX": 1540
      },
      {
        "id": "thorn-core-b",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3650,
        "y": 500,
        "patrolMinX": 3540,
        "patrolMaxX": 3840
      },
      {
        "id": "thorn-core-c",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 4920,
        "y": 390,
        "patrolMinX": 4800,
        "patrolMaxX": 5120
      },
      {
        "id": "sanctuary-guard-c",
        "type": "thorn-beetle",
        "x": 6800,
        "surfaceY": 640,
        "patrolMinX": 6500,
        "patrolMaxX": 7060
      }
    ],
    "checkpoints": [
      {
        "id": "moving-platform-check",
        "x": 2850,
        "surfaceY": 640,
        "spawnX": 2860,
        "spawnSurfaceY": 640
      },
      {
        "id": "canopy-check",
        "x": 5870,
        "surfaceY": 576,
        "spawnX": 5900,
        "spawnSurfaceY": 576
      }
    ],
    "goal": {
      "x": 8200,
      "surfaceY": 640
    }
  },
  "2-2": {
    "id": "2-2",
    "theme": "emerald-sanctuary",
    "rankTargets": {
      "sTime": 36,
      "aTime": 50,
      "bTime": 70,
      "cTime": 96
    },
    "world": {
      "width": 9600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 11,
        "height": 1
      },
      {
        "col": 20,
        "row": 9,
        "width": 5,
        "height": 1
      },
      {
        "col": 34,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 49,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 64,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 82,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 101,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 118,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 136,
        "row": 10,
        "width": 12,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "ferry-a",
        "col": 14,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 60,
        "durationMs": 2400
      },
      {
        "id": "ferry-b",
        "col": 27,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2500,
        "phase": 0.45
      },
      {
        "id": "ferry-c",
        "col": 44,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 80,
        "durationMs": 2200,
        "phase": 0.2
      },
      {
        "id": "ferry-d",
        "col": 75,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2800,
        "phase": 0.25
      },
      {
        "id": "ferry-e",
        "col": 111,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 80,
        "durationMs": 2500,
        "phase": 0.6
      },
      {
        "id": "ferry-f",
        "col": 128,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2600,
        "phase": 0.1
      }
    ],
    "hazards": [
      {
        "id": "start-ferry-thorns",
        "type": "spikes",
        "x": 600,
        "surfaceY": 640,
        "width": 180,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "mid-ferry-thorns",
        "type": "spikes",
        "x": 2400,
        "surfaceY": 640,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "timing-thorns",
        "type": "spikes",
        "x": 4400,
        "surfaceY": 640,
        "width": 220,
        "height": 62,
        "orientation": "floor"
      },
      {
        "id": "late-ferry-thorns",
        "type": "spikes",
        "x": 6760,
        "surfaceY": 640,
        "width": 180,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "exit-thorns",
        "type": "spikes",
        "x": 9140,
        "surfaceY": 640,
        "width": 240,
        "height": 62,
        "orientation": "floor"
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 584
      },
      {
        "x": 620,
        "y": 584
      },
      {
        "x": 1090,
        "y": 520
      },
      {
        "x": 1460,
        "y": 500
      },
      {
        "x": 1900,
        "y": 500
      },
      {
        "x": 2380,
        "y": 456
      },
      {
        "x": 2920,
        "y": 520
      },
      {
        "x": 3500,
        "y": 584
      },
      {
        "x": 4240,
        "y": 392
      },
      {
        "x": 4810,
        "y": 456
      },
      {
        "x": 5420,
        "y": 584
      },
      {
        "x": 5860,
        "y": 584
      },
      {
        "x": 6540,
        "y": 520
      },
      {
        "x": 7060,
        "y": 520
      },
      {
        "x": 7580,
        "y": 520
      },
      {
        "x": 8160,
        "y": 392
      },
      {
        "x": 8750,
        "y": 584
      },
      {
        "x": 9140,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "ferry-guard-a",
        "type": "thorn-beetle",
        "x": 520,
        "surfaceY": 640,
        "patrolMinX": 320,
        "patrolMaxX": 760
      },
      {
        "id": "ferry-core-a",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2050,
        "y": 420,
        "patrolMinX": 2050,
        "patrolMaxX": 2050
      },
      {
        "id": "ferry-core-b",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 4830,
        "y": 430,
        "patrolMinX": 4720,
        "patrolMaxX": 5040
      },
      {
        "id": "ferry-guard-b",
        "type": "thorn-beetle",
        "x": 5600,
        "surfaceY": 576,
        "patrolMinX": 5300,
        "patrolMaxX": 5680
      },
      {
        "id": "ferry-core-c",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8170,
        "y": 395,
        "patrolMinX": 8060,
        "patrolMaxX": 8320
      }
    ],
    "checkpoints": [
      {
        "id": "first-ferry-check",
        "x": 2220,
        "surfaceY": 640,
        "spawnX": 2230,
        "spawnSurfaceY": 640
      },
      {
        "id": "late-ferry-check",
        "x": 6720,
        "surfaceY": 640,
        "spawnX": 6740,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9250,
      "surfaceY": 640
    }
  },
  "2-3": {
    "id": "2-3",
    "theme": "emerald-sanctuary",
    "rankTargets": {
      "sTime": 38,
      "aTime": 52,
      "bTime": 74,
      "cTime": 102
    },
    "world": {
      "width": 9800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 24,
        "row": 10,
        "width": 5,
        "height": 1
      },
      {
        "col": 36,
        "row": 9,
        "width": 4,
        "height": 1
      },
      {
        "col": 47,
        "row": 8,
        "width": 4,
        "height": 1
      },
      {
        "col": 58,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 76,
        "row": 9,
        "width": 5,
        "height": 1
      },
      {
        "col": 92,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 110,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 131,
        "row": 10,
        "width": 18,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "bramble-lift-a",
        "col": 18,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2300
      },
      {
        "id": "bramble-lift-b",
        "col": 67,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 112,
        "durationMs": 2700,
        "phase": 0.3
      },
      {
        "id": "bramble-lift-c",
        "col": 102,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2400,
        "phase": 0.5
      }
    ],
    "hazards": [
      {
        "id": "readable-floor-thorns",
        "type": "spikes",
        "x": 820,
        "surfaceY": 640,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "homing-platform-thorns-a",
        "type": "spikes",
        "x": 1690,
        "surfaceY": 640,
        "width": 160,
        "height": 58,
        "orientation": "floor"
      },
      {
        "id": "homing-platform-thorns-b",
        "type": "spikes",
        "x": 3920,
        "surfaceY": 640,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "homing-platform-thorns-c",
        "type": "spikes",
        "x": 5020,
        "surfaceY": 576,
        "width": 170,
        "height": 58,
        "orientation": "floor"
      },
      {
        "id": "late-bramble-floor",
        "type": "spikes",
        "x": 9000,
        "surfaceY": 640,
        "width": 240,
        "height": 62,
        "orientation": "floor"
      }
    ],
    "coins": [
      {
        "x": 410,
        "y": 584
      },
      {
        "x": 620,
        "y": 584
      },
      {
        "x": 1000,
        "y": 520
      },
      {
        "x": 1490,
        "y": 504
      },
      {
        "x": 1980,
        "y": 430
      },
      {
        "x": 2400,
        "y": 430
      },
      {
        "x": 2850,
        "y": 430
      },
      {
        "x": 3340,
        "y": 404
      },
      {
        "x": 3830,
        "y": 340
      },
      {
        "x": 4420,
        "y": 584
      },
      {
        "x": 4920,
        "y": 520
      },
      {
        "x": 5430,
        "y": 448
      },
      {
        "x": 5940,
        "y": 448
      },
      {
        "x": 6460,
        "y": 520
      },
      {
        "x": 7150,
        "y": 392
      },
      {
        "x": 7740,
        "y": 584
      },
      {
        "x": 8340,
        "y": 520
      },
      {
        "x": 8960,
        "y": 584
      },
      {
        "x": 9320,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "bramble-guard-a",
        "type": "thorn-beetle",
        "x": 560,
        "surfaceY": 640,
        "patrolMinX": 340,
        "patrolMaxX": 840
      },
      {
        "id": "bramble-core-a",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 1980,
        "y": 430,
        "patrolMinX": 1980,
        "patrolMaxX": 1980
      },
      {
        "id": "bramble-core-b",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2400,
        "y": 430,
        "patrolMinX": 2400,
        "patrolMaxX": 2400
      },
      {
        "id": "bramble-core-c",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2850,
        "y": 430,
        "patrolMinX": 2850,
        "patrolMaxX": 2850
      },
      {
        "id": "bramble-guard-b",
        "type": "thorn-beetle",
        "x": 2440,
        "surfaceY": 576,
        "patrolMinX": 2320,
        "patrolMaxX": 2540
      },
      {
        "id": "bramble-core-d",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5430,
        "y": 448,
        "patrolMinX": 5430,
        "patrolMaxX": 5430
      },
      {
        "id": "bramble-core-e",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5940,
        "y": 448,
        "patrolMinX": 5940,
        "patrolMaxX": 5940
      },
      {
        "id": "bramble-guard-c",
        "type": "thorn-beetle",
        "x": 9020,
        "surfaceY": 640,
        "patrolMinX": 8480,
        "patrolMaxX": 9300
      }
    ],
    "checkpoints": [
      {
        "id": "chain-check",
        "x": 3100,
        "surfaceY": 512,
        "spawnX": 3120,
        "spawnSurfaceY": 512
      },
      {
        "id": "bramble-exit-check",
        "x": 7520,
        "surfaceY": 640,
        "spawnX": 7540,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9340,
      "surfaceY": 640
    }
  },
  "2-4": {
    "id": "2-4",
    "theme": "emerald-sanctuary",
    "rankTargets": {
      "sTime": 42,
      "aTime": 58,
      "bTime": 82,
      "cTime": 112
    },
    "world": {
      "width": 10400,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 13,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 5,
        "height": 1
      },
      {
        "col": 34,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 46,
        "row": 6,
        "width": 5,
        "height": 1
      },
      {
        "col": 59,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 76,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 94,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 112,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 134,
        "row": 10,
        "width": 16,
        "height": 1
      },
      {
        "col": 154,
        "row": 9,
        "width": 7,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "lift-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2200
      },
      {
        "id": "lift-b",
        "col": 29,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2400,
        "phase": 0.28
      },
      {
        "id": "lift-c",
        "col": 53,
        "row": 7,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2300,
        "phase": 0.5
      },
      {
        "id": "lift-d",
        "col": 86,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2700,
        "phase": 0.18
      },
      {
        "id": "lift-e",
        "col": 104,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2450,
        "phase": 0.68
      },
      {
        "id": "lift-f",
        "col": 124,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2900,
        "phase": 0.38
      }
    ],
    "hazards": [
      {
        "id": "root-pit-a",
        "type": "spikes",
        "x": 760,
        "surfaceY": 704,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "root-pit-b",
        "type": "spikes",
        "x": 3120,
        "surfaceY": 384,
        "width": 160,
        "height": 58,
        "orientation": "floor"
      },
      {
        "id": "root-pit-c",
        "type": "spikes",
        "x": 5080,
        "surfaceY": 640,
        "width": 200,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "root-pit-d",
        "type": "spikes",
        "x": 7420,
        "surfaceY": 576,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "exit-root-pit",
        "type": "spikes",
        "x": 9300,
        "surfaceY": 640,
        "width": 220,
        "height": 62,
        "orientation": "floor"
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 648
      },
      {
        "x": 650,
        "y": 648
      },
      {
        "x": 1140,
        "y": 596
      },
      {
        "x": 1660,
        "y": 520
      },
      {
        "x": 2260,
        "y": 520
      },
      {
        "x": 2780,
        "y": 420
      },
      {
        "x": 3480,
        "y": 392
      },
      {
        "x": 4240,
        "y": 264
      },
      {
        "x": 4920,
        "y": 300
      },
      {
        "x": 5580,
        "y": 392
      },
      {
        "x": 6260,
        "y": 520
      },
      {
        "x": 6880,
        "y": 584
      },
      {
        "x": 7520,
        "y": 520
      },
      {
        "x": 8280,
        "y": 330
      },
      {
        "x": 9080,
        "y": 456
      },
      {
        "x": 9800,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "canopy-guard-a",
        "type": "thorn-beetle",
        "x": 570,
        "surfaceY": 704,
        "patrolMinX": 330,
        "patrolMaxX": 820
      },
      {
        "id": "canopy-core-a",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 1660,
        "y": 520,
        "patrolMinX": 1660,
        "patrolMaxX": 1660
      },
      {
        "id": "canopy-core-b",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2780,
        "y": 420,
        "patrolMinX": 2780,
        "patrolMaxX": 2780
      },
      {
        "id": "canopy-guard-b",
        "type": "thorn-beetle",
        "x": 3180,
        "surfaceY": 384,
        "patrolMinX": 2960,
        "patrolMaxX": 3240
      },
      {
        "id": "canopy-core-c",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5580,
        "y": 392,
        "patrolMinX": 5480,
        "patrolMaxX": 5780
      },
      {
        "id": "canopy-core-d",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8280,
        "y": 330,
        "patrolMinX": 8180,
        "patrolMaxX": 8460
      },
      {
        "id": "canopy-guard-c",
        "type": "thorn-beetle",
        "x": 9040,
        "surfaceY": 640,
        "patrolMinX": 8640,
        "patrolMaxX": 9450
      }
    ],
    "checkpoints": [
      {
        "id": "high-canopy-check",
        "x": 3100,
        "surfaceY": 384,
        "spawnX": 3110,
        "spawnSurfaceY": 384
      },
      {
        "id": "descent-check",
        "x": 7200,
        "surfaceY": 576,
        "spawnX": 7220,
        "spawnSurfaceY": 576
      }
    ],
    "goal": {
      "x": 10040,
      "surfaceY": 576
    }
  },
  "2-5": {
    "id": "2-5",
    "theme": "emerald-sanctuary",
    "rankTargets": {
      "sTime": 86,
      "aTime": 116,
      "bTime": 156,
      "cTime": 210
    },
    "world": {
      "width": 16800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 13,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 36,
        "row": 9,
        "width": 5,
        "height": 1
      },
      {
        "col": 51,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 68,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 82,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 103,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 120,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 139,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 161,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 181,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 202,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 225,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 244,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 255,
        "row": 10,
        "width": 7,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "gauntlet-ferry-a",
        "col": 16,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 60,
        "durationMs": 2450
      },
      {
        "id": "gauntlet-lift-a",
        "col": 30,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2250,
        "phase": 0.2
      },
      {
        "id": "gauntlet-ferry-b",
        "col": 61,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2700,
        "phase": 0.42
      },
      {
        "id": "gauntlet-lift-b",
        "col": 94,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2350,
        "phase": 0.58
      },
      {
        "id": "gauntlet-ferry-c",
        "col": 129,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 3000,
        "phase": 0.18
      },
      {
        "id": "gauntlet-lift-c",
        "col": 152,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2500,
        "phase": 0.35
      },
      {
        "id": "gauntlet-ferry-d",
        "col": 192,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2950,
        "phase": 0.66
      },
      {
        "id": "gauntlet-lift-d",
        "col": 214,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2400,
        "phase": 0.1
      }
    ],
    "hazards": [
      {
        "id": "gauntlet-thorns-a",
        "type": "spikes",
        "x": 760,
        "surfaceY": 640,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "gauntlet-thorns-b",
        "type": "spikes",
        "x": 2440,
        "surfaceY": 576,
        "width": 170,
        "height": 58,
        "orientation": "floor"
      },
      {
        "id": "gauntlet-thorns-c",
        "type": "spikes",
        "x": 3540,
        "surfaceY": 640,
        "width": 210,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "gauntlet-thorns-d",
        "type": "spikes",
        "x": 5580,
        "surfaceY": 640,
        "width": 240,
        "height": 62,
        "orientation": "floor"
      },
      {
        "id": "gauntlet-thorns-e",
        "type": "spikes",
        "x": 9300,
        "surfaceY": 640,
        "width": 240,
        "height": 62,
        "orientation": "floor"
      },
      {
        "id": "gauntlet-thorns-f",
        "type": "spikes",
        "x": 10540,
        "surfaceY": 576,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "gauntlet-thorns-g",
        "type": "spikes",
        "x": 14800,
        "surfaceY": 640,
        "width": 260,
        "height": 64,
        "orientation": "floor"
      },
      {
        "id": "gauntlet-thorns-h",
        "type": "spikes",
        "x": 16540,
        "surfaceY": 640,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 584
      },
      {
        "x": 650,
        "y": 584
      },
      {
        "x": 1140,
        "y": 520
      },
      {
        "x": 1780,
        "y": 520
      },
      {
        "x": 2350,
        "y": 456
      },
      {
        "x": 2940,
        "y": 520
      },
      {
        "x": 3740,
        "y": 520
      },
      {
        "x": 4380,
        "y": 392
      },
      {
        "x": 5060,
        "y": 584
      },
      {
        "x": 5800,
        "y": 520
      },
      {
        "x": 6560,
        "y": 392
      },
      {
        "x": 7240,
        "y": 584
      },
      {
        "x": 8060,
        "y": 520
      },
      {
        "x": 8840,
        "y": 456
      },
      {
        "x": 9640,
        "y": 392
      },
      {
        "x": 10460,
        "y": 584
      },
      {
        "x": 11280,
        "y": 392
      },
      {
        "x": 12120,
        "y": 456
      },
      {
        "x": 13020,
        "y": 584
      },
      {
        "x": 13860,
        "y": 392
      },
      {
        "x": 14740,
        "y": 520
      },
      {
        "x": 15640,
        "y": 520
      },
      {
        "x": 16220,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "gauntlet-guard-a",
        "type": "thorn-beetle",
        "x": 590,
        "surfaceY": 640,
        "patrolMinX": 320,
        "patrolMaxX": 850
      },
      {
        "id": "gauntlet-core-a",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 1780,
        "y": 520,
        "patrolMinX": 1780,
        "patrolMaxX": 1780
      },
      {
        "id": "gauntlet-core-b",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 4380,
        "y": 392,
        "patrolMinX": 4280,
        "patrolMaxX": 4560
      },
      {
        "id": "gauntlet-guard-b",
        "type": "thorn-beetle",
        "x": 5380,
        "surfaceY": 640,
        "patrolMinX": 5100,
        "patrolMaxX": 5800
      },
      {
        "id": "gauntlet-core-c",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6560,
        "y": 392,
        "patrolMinX": 6460,
        "patrolMaxX": 6760
      },
      {
        "id": "gauntlet-core-d",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8840,
        "y": 456,
        "patrolMinX": 8740,
        "patrolMaxX": 9040
      },
      {
        "id": "gauntlet-guard-c",
        "type": "thorn-beetle",
        "x": 10480,
        "surfaceY": 576,
        "patrolMinX": 10320,
        "patrolMaxX": 10740
      },
      {
        "id": "gauntlet-core-e",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 12120,
        "y": 456,
        "patrolMinX": 12120,
        "patrolMaxX": 12120
      },
      {
        "id": "gauntlet-core-f",
        "type": "seed-lantern",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 14740,
        "y": 520,
        "patrolMinX": 14620,
        "patrolMaxX": 14960
      },
      {
        "id": "gauntlet-guard-d",
        "type": "thorn-beetle",
        "x": 16400,
        "surfaceY": 640,
        "patrolMinX": 16340,
        "patrolMaxX": 16740
      }
    ],
    "checkpoints": [
      {
        "id": "gauntlet-check-a",
        "x": 3420,
        "surfaceY": 640,
        "spawnX": 3440,
        "spawnSurfaceY": 640
      },
      {
        "id": "gauntlet-check-b",
        "x": 6720,
        "surfaceY": 576,
        "spawnX": 6740,
        "spawnSurfaceY": 576
      },
      {
        "id": "gauntlet-check-c",
        "x": 13200,
        "surfaceY": 512,
        "spawnX": 13220,
        "spawnSurfaceY": 512
      }
    ],
    "goal": {
      "x": 16440,
      "surfaceY": 640
    }
  },
  "2-6": {
    "id": "2-6",
    "theme": "emerald-sanctuary",
    "rankTargets": {
      "sTime": 82,
      "aTime": 110,
      "bTime": 146,
      "cTime": 198
    },
    "world": {
      "width": 7200,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 22,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 36,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 50,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 66,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 82,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 96,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 102,
        "row": 9,
        "width": 6,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "boss-approach-ferry-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 60,
        "durationMs": 2500
      },
      {
        "id": "boss-approach-lift-a",
        "col": 31,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2300,
        "phase": 0.25
      },
      {
        "id": "boss-approach-ferry-b",
        "col": 59,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 110,
        "durationMs": 2700,
        "phase": 0.5
      },
      {
        "id": "boss-approach-lift-b",
        "col": 76,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 82,
        "durationMs": 2400,
        "phase": 0.7
      }
    ],
    "hazards": [
      {
        "id": "boss-thorn-a",
        "type": "spikes",
        "x": 760,
        "surfaceY": 640,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "boss-thorn-b",
        "type": "spikes",
        "x": 2500,
        "surfaceY": 512,
        "width": 170,
        "height": 58,
        "orientation": "floor"
      },
      {
        "id": "boss-thorn-c",
        "type": "spikes",
        "x": 4500,
        "surfaceY": 640,
        "width": 210,
        "height": 60,
        "orientation": "floor"
      },
      {
        "id": "boss-thorn-d",
        "type": "spikes",
        "x": 6760,
        "surfaceY": 640,
        "width": 190,
        "height": 60,
        "orientation": "floor"
      }
    ],
    "coins": [],
    "enemies": [
      {
        "id": "boss-prototype",
        "type": "azure-core",
        "respawnPolicy": "persistent",
        "countsForScore": true,
        "x": 6540,
        "y": 384,
        "patrolMinX": 6540,
        "patrolMaxX": 6540
      },
      {
        "id": "heartroot-core-a",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 1240,
        "y": 440,
        "patrolMinX": 1240,
        "patrolMaxX": 1240
      },
      {
        "id": "heartroot-core-b",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 2100,
        "y": 360,
        "patrolMinX": 2100,
        "patrolMaxX": 2100
      },
      {
        "id": "heartroot-core-c",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 2860,
        "y": 410,
        "patrolMinX": 2860,
        "patrolMaxX": 2860
      },
      {
        "id": "heartroot-core-d",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 3700,
        "y": 320,
        "patrolMinX": 3700,
        "patrolMaxX": 3700
      },
      {
        "id": "heartroot-core-e",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 4680,
        "y": 420,
        "patrolMinX": 4680,
        "patrolMaxX": 4680
      },
      {
        "id": "heartroot-core-f",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 5600,
        "y": 370,
        "patrolMinX": 5600,
        "patrolMaxX": 5600
      }
    ],
    "checkpoints": [],
    "goal": {
      "x": 6800,
      "surfaceY": 640
    }
  },
  "3-1": {
    "id": "3-1",
    "theme": "cerulean-depths",
    "rankTargets": {
      "sTime": 34,
      "aTime": 48,
      "bTime": 68,
      "cTime": 94
    },
    "world": {
      "width": 9000,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 15,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 36,
        "row": 5,
        "width": 9,
        "height": 1
      },
      {
        "col": 51,
        "row": 5,
        "width": 8,
        "height": 1
      },
      {
        "col": 65,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 80,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 96,
        "row": 5,
        "width": 8,
        "height": 1
      },
      {
        "col": 113,
        "row": 10,
        "width": 16,
        "height": 1
      },
      {
        "col": 134,
        "row": 10,
        "width": 6,
        "height": 1
      }
    ],
    "gravityZones": [
      {
        "id": "first-invert",
        "x": 2200,
        "y": 0,
        "width": 1850,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "return-down",
        "x": 4100,
        "y": 0,
        "width": 2100,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "final-invert",
        "x": 6200,
        "y": 0,
        "width": 1400,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "exit-down",
        "x": 7600,
        "y": 0,
        "width": 1400,
        "height": 1080,
        "direction": "down"
      }
    ],
    "coins": [
      {
        "x": 440,
        "y": 584
      },
      {
        "x": 650,
        "y": 584
      },
      {
        "x": 1080,
        "y": 584
      },
      {
        "x": 1680,
        "y": 584
      },
      {
        "x": 2440,
        "y": 450
      },
      {
        "x": 2920,
        "y": 410
      },
      {
        "x": 3500,
        "y": 430
      },
      {
        "x": 4300,
        "y": 584
      },
      {
        "x": 4980,
        "y": 584
      },
      {
        "x": 5740,
        "y": 584
      },
      {
        "x": 6440,
        "y": 430
      },
      {
        "x": 7000,
        "y": 420
      },
      {
        "x": 7860,
        "y": 584
      },
      {
        "x": 8360,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "tide-guard-a",
        "x": 620,
        "surfaceY": 640,
        "patrolMinX": 350,
        "patrolMaxX": 920
      },
      {
        "id": "tide-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2920,
        "y": 420,
        "patrolMinX": 2920,
        "patrolMaxX": 2920
      },
      {
        "id": "tide-guard-b",
        "x": 4560,
        "surfaceY": 640,
        "patrolMinX": 4200,
        "patrolMaxX": 4960
      },
      {
        "id": "tide-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6900,
        "y": 420,
        "patrolMinX": 6900,
        "patrolMaxX": 6900
      },
      {
        "id": "tide-guard-c",
        "x": 8200,
        "surfaceY": 640,
        "patrolMinX": 7800,
        "patrolMaxX": 8500
      }
    ],
    "checkpoints": [
      {
        "id": "first-inversion-check",
        "x": 4300,
        "surfaceY": 640,
        "spawnX": 4320,
        "spawnSurfaceY": 640
      },
      {
        "id": "exit-inversion-check",
        "x": 7900,
        "surfaceY": 640,
        "spawnX": 7920,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 8650,
      "surfaceY": 640
    }
  },
  "3-2": {
    "id": "3-2",
    "theme": "cerulean-depths",
    "rankTargets": {
      "sTime": 38,
      "aTime": 54,
      "bTime": 76,
      "cTime": 104
    },
    "world": {
      "width": 9800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 25,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 38,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 52,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 67,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 84,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 99,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 116,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 135,
        "row": 10,
        "width": 14,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "undertide-ferry-a",
        "col": 18,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 300,
        "durationMs": 2500
      },
      {
        "id": "undertide-ferry-b",
        "col": 76,
        "row": 7,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 340,
        "durationMs": 2650,
        "phase": 0.5
      }
    ],
    "gravityZones": [
      {
        "id": "ceiling-chain-a",
        "x": 1500,
        "y": 0,
        "width": 2100,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "floor-chain-a",
        "x": 3600,
        "y": 0,
        "width": 1850,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "ceiling-chain-b",
        "x": 5450,
        "y": 0,
        "width": 2300,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "floor-chain-b",
        "x": 7750,
        "y": 0,
        "width": 2050,
        "height": 1080,
        "direction": "down"
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 584
      },
      {
        "x": 800,
        "y": 584
      },
      {
        "x": 1700,
        "y": 450
      },
      {
        "x": 2140,
        "y": 400
      },
      {
        "x": 2700,
        "y": 420
      },
      {
        "x": 3380,
        "y": 420
      },
      {
        "x": 4200,
        "y": 584
      },
      {
        "x": 4880,
        "y": 584
      },
      {
        "x": 5600,
        "y": 430
      },
      {
        "x": 6220,
        "y": 410
      },
      {
        "x": 6900,
        "y": 430
      },
      {
        "x": 7700,
        "y": 460
      },
      {
        "x": 8420,
        "y": 584
      },
      {
        "x": 9060,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "undertide-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2140,
        "y": 410,
        "patrolMinX": 2140,
        "patrolMaxX": 2140
      },
      {
        "id": "undertide-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6220,
        "y": 410,
        "patrolMinX": 6220,
        "patrolMaxX": 6220
      },
      {
        "id": "undertide-guard-a",
        "x": 4450,
        "surfaceY": 640,
        "patrolMinX": 3420,
        "patrolMaxX": 3740
      },
      {
        "id": "undertide-guard-b",
        "x": 9020,
        "surfaceY": 640,
        "patrolMinX": 8700,
        "patrolMaxX": 9340
      }
    ],
    "checkpoints": [
      {
        "id": "undertide-mid-check",
        "x": 4400,
        "surfaceY": 640,
        "spawnX": 4420,
        "spawnSurfaceY": 640
      },
      {
        "id": "undertide-exit-check",
        "x": 8700,
        "surfaceY": 640,
        "spawnX": 8720,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9180,
      "surfaceY": 640
    }
  },
  "3-3": {
    "id": "3-3",
    "theme": "cerulean-depths",
    "rankTargets": {
      "sTime": 42,
      "aTime": 58,
      "bTime": 82,
      "cTime": 112
    },
    "world": {
      "width": 10400,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 20,
        "row": 5,
        "width": 5,
        "height": 1
      },
      {
        "col": 31,
        "row": 10,
        "width": 5,
        "height": 1
      },
      {
        "col": 43,
        "row": 5,
        "width": 5,
        "height": 1
      },
      {
        "col": 56,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 70,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 86,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 102,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 119,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 140,
        "row": 10,
        "width": 18,
        "height": 1
      }
    ],
    "gravityZones": [
      {
        "id": "mirror-up-a",
        "x": 1300,
        "y": 0,
        "width": 1050,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "mirror-down-a",
        "x": 2350,
        "y": 0,
        "width": 1050,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "mirror-up-b",
        "x": 3400,
        "y": 0,
        "width": 1300,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "mirror-down-b",
        "x": 4700,
        "y": 0,
        "width": 1450,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "mirror-up-c",
        "x": 6150,
        "y": 0,
        "width": 1650,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "mirror-down-c",
        "x": 7800,
        "y": 0,
        "width": 2600,
        "height": 1080,
        "direction": "down"
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 1160,
        "y": 520
      },
      {
        "x": 1480,
        "y": 430
      },
      {
        "x": 2050,
        "y": 420
      },
      {
        "x": 2580,
        "y": 584
      },
      {
        "x": 3260,
        "y": 584
      },
      {
        "x": 3880,
        "y": 430
      },
      {
        "x": 4560,
        "y": 420
      },
      {
        "x": 5400,
        "y": 584
      },
      {
        "x": 6100,
        "y": 584
      },
      {
        "x": 7000,
        "y": 430
      },
      {
        "x": 7800,
        "y": 420
      },
      {
        "x": 8700,
        "y": 584
      },
      {
        "x": 9500,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "mirror-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2050,
        "y": 420,
        "patrolMinX": 2050,
        "patrolMaxX": 2050
      },
      {
        "id": "mirror-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 4560,
        "y": 420,
        "patrolMinX": 4560,
        "patrolMaxX": 4560
      },
      {
        "id": "mirror-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 7000,
        "y": 430,
        "patrolMinX": 7000,
        "patrolMaxX": 7000
      },
      {
        "id": "mirror-guard-a",
        "x": 9100,
        "surfaceY": 640,
        "patrolMinX": 8960,
        "patrolMaxX": 9900
      }
    ],
    "checkpoints": [
      {
        "id": "mirror-mid-check",
        "x": 5600,
        "surfaceY": 640,
        "spawnX": 5620,
        "spawnSurfaceY": 640
      },
      {
        "id": "mirror-exit-check",
        "x": 9300,
        "surfaceY": 640,
        "spawnX": 9320,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9720,
      "surfaceY": 640
    }
  },
  "3-4": {
    "id": "3-4",
    "theme": "cerulean-depths",
    "rankTargets": {
      "sTime": 46,
      "aTime": 64,
      "bTime": 90,
      "cTime": 122
    },
    "world": {
      "width": 11000,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 12,
        "height": 1
      },
      {
        "col": 21,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 34,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 50,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 66,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 84,
        "row": 11,
        "width": 8,
        "height": 1
      },
      {
        "col": 103,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 121,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 141,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 158,
        "row": 10,
        "width": 12,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "vortex-lift-a",
        "col": 16,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 160,
        "durationMs": 2300
      },
      {
        "id": "vortex-ferry-a",
        "col": 42,
        "row": 7,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 340,
        "durationMs": 2700,
        "phase": 0.4
      },
      {
        "id": "vortex-lift-b",
        "col": 76,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 160,
        "durationMs": 2450,
        "phase": 0.55
      },
      {
        "id": "vortex-ferry-b",
        "col": 113,
        "row": 7,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 360,
        "durationMs": 2850,
        "phase": 0.2
      },
      {
        "id": "vortex-lift-c",
        "col": 132,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 140,
        "durationMs": 2400,
        "phase": 0.7
      }
    ],
    "gravityZones": [
      {
        "id": "vortex-up-a",
        "x": 1700,
        "y": 0,
        "width": 2300,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "vortex-down-a",
        "x": 4000,
        "y": 0,
        "width": 2100,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "vortex-up-b",
        "x": 6100,
        "y": 0,
        "width": 2450,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "vortex-down-b",
        "x": 8550,
        "y": 0,
        "width": 2450,
        "height": 1080,
        "direction": "down"
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 648
      },
      {
        "x": 1120,
        "y": 596
      },
      {
        "x": 1780,
        "y": 520
      },
      {
        "x": 2320,
        "y": 392
      },
      {
        "x": 3100,
        "y": 430
      },
      {
        "x": 3880,
        "y": 420
      },
      {
        "x": 4800,
        "y": 430
      },
      {
        "x": 5600,
        "y": 584
      },
      {
        "x": 6600,
        "y": 520
      },
      {
        "x": 7420,
        "y": 520
      },
      {
        "x": 8240,
        "y": 648
      },
      {
        "x": 9240,
        "y": 584
      },
      {
        "x": 10100,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "vortex-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2320,
        "y": 392,
        "patrolMinX": 2320,
        "patrolMaxX": 2320
      },
      {
        "id": "vortex-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 7420,
        "y": 520,
        "patrolMinX": 7420,
        "patrolMaxX": 7420
      },
      {
        "id": "vortex-guard-a",
        "x": 9300,
        "surfaceY": 640,
        "patrolMinX": 9080,
        "patrolMaxX": 9600
      }
    ],
    "checkpoints": [
      {
        "id": "vortex-high-check",
        "x": 3320,
        "surfaceY": 320,
        "spawnX": 3340,
        "spawnSurfaceY": 320,
        "spawnGravity": "up"
      },
      {
        "id": "vortex-exit-check",
        "x": 9300,
        "surfaceY": 640,
        "spawnX": 9320,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 10340,
      "surfaceY": 640
    }
  },
  "3-5": {
    "id": "3-5",
    "theme": "cerulean-depths",
    "rankTargets": {
      "sTime": 92,
      "aTime": 124,
      "bTime": 166,
      "cTime": 224
    },
    "world": {
      "width": 17200,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 13,
        "height": 1
      },
      {
        "col": 22,
        "row": 5,
        "width": 6,
        "height": 1
      },
      {
        "col": 36,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 54,
        "row": 5,
        "width": 7,
        "height": 1
      },
      {
        "col": 72,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 94,
        "row": 5,
        "width": 7,
        "height": 1
      },
      {
        "col": 112,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 134,
        "row": 5,
        "width": 8,
        "height": 1
      },
      {
        "col": 154,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 177,
        "row": 5,
        "width": 8,
        "height": 1
      },
      {
        "col": 199,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 223,
        "row": 5,
        "width": 7,
        "height": 1
      },
      {
        "col": 242,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 260,
        "row": 10,
        "width": 8,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "abyss-ferry-a",
        "col": 16,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 300,
        "durationMs": 2500
      },
      {
        "id": "abyss-lift-a",
        "col": 45,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 150,
        "durationMs": 2350,
        "phase": 0.25
      },
      {
        "id": "abyss-ferry-b",
        "col": 84,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 380,
        "durationMs": 2800,
        "phase": 0.5
      },
      {
        "id": "abyss-lift-b",
        "col": 124,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 150,
        "durationMs": 2500,
        "phase": 0.7
      },
      {
        "id": "abyss-ferry-c",
        "col": 166,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 420,
        "durationMs": 3000,
        "phase": 0.35
      },
      {
        "id": "abyss-lift-c",
        "col": 212,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 150,
        "durationMs": 2450,
        "phase": 0.1
      }
    ],
    "gravityZones": [
      {
        "id": "remix-up-a",
        "x": 1400,
        "y": 0,
        "width": 2300,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "remix-down-a",
        "x": 3700,
        "y": 0,
        "width": 2500,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "remix-up-b",
        "x": 6200,
        "y": 0,
        "width": 3100,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "remix-down-b",
        "x": 9300,
        "y": 0,
        "width": 2500,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "remix-up-c",
        "x": 11800,
        "y": 0,
        "width": 3000,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "remix-down-c",
        "x": 14800,
        "y": 0,
        "width": 2400,
        "height": 1080,
        "direction": "down"
      }
    ],
    "coins": [
      {
        "x": 440,
        "y": 584
      },
      {
        "x": 1120,
        "y": 584
      },
      {
        "x": 1860,
        "y": 430
      },
      {
        "x": 2540,
        "y": 420
      },
      {
        "x": 3300,
        "y": 584
      },
      {
        "x": 4200,
        "y": 584
      },
      {
        "x": 5200,
        "y": 430
      },
      {
        "x": 6280,
        "y": 584
      },
      {
        "x": 7200,
        "y": 430
      },
      {
        "x": 8300,
        "y": 420
      },
      {
        "x": 9400,
        "y": 584
      },
      {
        "x": 10600,
        "y": 584
      },
      {
        "x": 11800,
        "y": 430
      },
      {
        "x": 13000,
        "y": 430
      },
      {
        "x": 14200,
        "y": 420
      },
      {
        "x": 15300,
        "y": 584
      },
      {
        "x": 16400,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "abyss-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2540,
        "y": 420,
        "patrolMinX": 2540,
        "patrolMaxX": 2540
      },
      {
        "id": "abyss-guard-a",
        "x": 4620,
        "surfaceY": 640,
        "patrolMinX": 4200,
        "patrolMaxX": 5020
      },
      {
        "id": "abyss-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8300,
        "y": 420,
        "patrolMinX": 8300,
        "patrolMaxX": 8300
      },
      {
        "id": "abyss-guard-b",
        "x": 10100,
        "surfaceY": 640,
        "patrolMinX": 9760,
        "patrolMaxX": 10800
      },
      {
        "id": "abyss-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 13000,
        "y": 430,
        "patrolMinX": 13000,
        "patrolMaxX": 13000
      },
      {
        "id": "abyss-guard-c",
        "x": 16100,
        "surfaceY": 640,
        "patrolMinX": 15500,
        "patrolMaxX": 16600
      }
    ],
    "checkpoints": [
      {
        "id": "abyss-check-a",
        "x": 4700,
        "surfaceY": 640,
        "spawnX": 4720,
        "spawnSurfaceY": 640
      },
      {
        "id": "abyss-check-b",
        "x": 10000,
        "surfaceY": 640,
        "spawnX": 10020,
        "spawnSurfaceY": 640
      },
      {
        "id": "abyss-check-c",
        "x": 15620,
        "surfaceY": 640,
        "spawnX": 15640,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 16680,
      "surfaceY": 640
    }
  },
  "3-6": {
    "id": "3-6",
    "theme": "cerulean-depths",
    "rankTargets": {
      "sTime": 86,
      "aTime": 116,
      "bTime": 154,
      "cTime": 210
    },
    "world": {
      "width": 7600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 24,
        "row": 5,
        "width": 8,
        "height": 1
      },
      {
        "col": 42,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 62,
        "row": 5,
        "width": 8,
        "height": 1
      },
      {
        "col": 82,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 99,
        "row": 10,
        "width": 17,
        "height": 1
      },
      {
        "col": 106,
        "row": 9,
        "width": 6,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "leviathan-ferry-a",
        "col": 17,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 300,
        "durationMs": 2550
      },
      {
        "id": "leviathan-ferry-b",
        "col": 53,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 360,
        "durationMs": 2800,
        "phase": 0.45
      }
    ],
    "gravityZones": [
      {
        "id": "boss-up-a",
        "x": 1300,
        "y": 0,
        "width": 1800,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "boss-down-a",
        "x": 3100,
        "y": 0,
        "width": 1700,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "boss-up-b",
        "x": 4800,
        "y": 0,
        "width": 1400,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "boss-down-b",
        "x": 6200,
        "y": 0,
        "width": 1400,
        "height": 1080,
        "direction": "down"
      }
    ],
    "coins": [],
    "enemies": [
      {
        "id": "boss-prototype",
        "type": "azure-core",
        "respawnPolicy": "persistent",
        "countsForScore": true,
        "x": 7000,
        "y": 384,
        "patrolMinX": 7000,
        "patrolMaxX": 7000
      },
      {
        "id": "leviathan-core-a",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 1480,
        "y": 420,
        "patrolMinX": 1480,
        "patrolMaxX": 1480
      },
      {
        "id": "leviathan-core-b",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 2650,
        "y": 420,
        "patrolMinX": 2650,
        "patrolMaxX": 2650
      },
      {
        "id": "leviathan-core-c",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 3950,
        "y": 430,
        "patrolMinX": 3950,
        "patrolMaxX": 3950
      },
      {
        "id": "leviathan-core-d",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 5350,
        "y": 420,
        "patrolMinX": 5350,
        "patrolMaxX": 5350
      },
      {
        "id": "leviathan-core-e",
        "type": "azure-core",
        "respawnDelayMs": 650,
        "x": 6260,
        "y": 410,
        "patrolMinX": 6260,
        "patrolMaxX": 6260
      }
    ],
    "checkpoints": [],
    "goal": {
      "x": 7240,
      "surfaceY": 640
    }
  },
  "4-1": {
    "id": "4-1",
    "theme": "frostveil-peaks",
    "rankTargets": {
      "sTime": 34,
      "aTime": 48,
      "bTime": 68,
      "cTime": 94
    },
    "world": {
      "width": 9000,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 17,
        "height": 1
      },
      {
        "col": 23,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 39,
        "row": 10,
        "width": 10,
        "height": 1
      },
      {
        "col": 54,
        "row": 9,
        "width": 8,
        "height": 1
      },
      {
        "col": 68,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 86,
        "row": 10,
        "width": 10,
        "height": 1
      },
      {
        "col": 101,
        "row": 9,
        "width": 8,
        "height": 1
      },
      {
        "col": 116,
        "row": 10,
        "width": 20,
        "height": 1
      }
    ],
    "surfaceZones": [
      {
        "id": "first-ice",
        "type": "ice",
        "x": 900,
        "y": 0,
        "width": 1400,
        "height": 1080
      },
      {
        "id": "long-ice",
        "type": "ice",
        "x": 2500,
        "y": 0,
        "width": 2100,
        "height": 1080
      },
      {
        "id": "step-ice",
        "type": "ice",
        "x": 4750,
        "y": 0,
        "width": 1400,
        "height": 1080
      },
      {
        "id": "exit-ice",
        "type": "ice",
        "x": 6900,
        "y": 0,
        "width": 1600,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 584
      },
      {
        "x": 700,
        "y": 584
      },
      {
        "x": 1180,
        "y": 584
      },
      {
        "x": 1680,
        "y": 584
      },
      {
        "x": 2280,
        "y": 584
      },
      {
        "x": 2920,
        "y": 584
      },
      {
        "x": 3560,
        "y": 584
      },
      {
        "x": 4300,
        "y": 584
      },
      {
        "x": 5200,
        "y": 520
      },
      {
        "x": 5900,
        "y": 520
      },
      {
        "x": 6900,
        "y": 584
      },
      {
        "x": 7600,
        "y": 584
      },
      {
        "x": 8300,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "ice-guard-a",
        "x": 650,
        "surfaceY": 640,
        "patrolMinX": 340,
        "patrolMaxX": 1000
      },
      {
        "id": "ice-guard-b",
        "x": 2920,
        "surfaceY": 640,
        "patrolMinX": 2580,
        "patrolMaxX": 3340
      },
      {
        "id": "ice-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5580,
        "y": 480,
        "patrolMinX": 5580,
        "patrolMaxX": 5580
      },
      {
        "id": "ice-guard-c",
        "x": 7520,
        "surfaceY": 640,
        "patrolMinX": 7040,
        "patrolMaxX": 8100
      }
    ],
    "checkpoints": [
      {
        "id": "ice-mid-check",
        "x": 3600,
        "surfaceY": 576,
        "spawnX": 3620,
        "spawnSurfaceY": 576
      },
      {
        "id": "ice-exit-check",
        "x": 7480,
        "surfaceY": 640,
        "spawnX": 7500,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 8580,
      "surfaceY": 640
    }
  },
  "4-2": {
    "id": "4-2",
    "theme": "frostveil-peaks",
    "rankTargets": {
      "sTime": 38,
      "aTime": 54,
      "bTime": 76,
      "cTime": 104
    },
    "world": {
      "width": 9800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 13,
        "height": 1
      },
      {
        "col": 20,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 31,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 42,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 54,
        "row": 7,
        "width": 7,
        "height": 1
      },
      {
        "col": 68,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 82,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 96,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 114,
        "row": 9,
        "width": 8,
        "height": 1
      },
      {
        "col": 132,
        "row": 10,
        "width": 18,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "slope-ferry-a",
        "col": 108,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 320,
        "durationMs": 2600,
        "phase": 0.35
      }
    ],
    "surfaceZones": [
      {
        "id": "slope-up-ice",
        "type": "ice",
        "x": 900,
        "y": 0,
        "width": 3000,
        "height": 1080
      },
      {
        "id": "crest-ice",
        "type": "ice",
        "x": 3600,
        "y": 0,
        "width": 1700,
        "height": 1080
      },
      {
        "id": "slope-down-ice",
        "type": "ice",
        "x": 5200,
        "y": 0,
        "width": 3000,
        "height": 1080
      },
      {
        "id": "exit-ice",
        "type": "ice",
        "x": 8200,
        "y": 0,
        "width": 1400,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 648
      },
      {
        "x": 1050,
        "y": 600
      },
      {
        "x": 1480,
        "y": 560
      },
      {
        "x": 2020,
        "y": 500
      },
      {
        "x": 2620,
        "y": 450
      },
      {
        "x": 3240,
        "y": 400
      },
      {
        "x": 3900,
        "y": 340
      },
      {
        "x": 4600,
        "y": 330
      },
      {
        "x": 5400,
        "y": 390
      },
      {
        "x": 6160,
        "y": 450
      },
      {
        "x": 6900,
        "y": 520
      },
      {
        "x": 7700,
        "y": 584
      },
      {
        "x": 8500,
        "y": 520
      },
      {
        "x": 9200,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "slope-guard-a",
        "x": 520,
        "surfaceY": 704,
        "patrolMinX": 320,
        "patrolMaxX": 780
      },
      {
        "id": "slope-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3300,
        "y": 390,
        "patrolMinX": 3300,
        "patrolMaxX": 3300
      },
      {
        "id": "slope-guard-b",
        "x": 6300,
        "surfaceY": 640,
        "patrolMinX": 6160,
        "patrolMaxX": 6620
      },
      {
        "id": "slope-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8500,
        "y": 500,
        "patrolMinX": 8500,
        "patrolMaxX": 8500
      }
    ],
    "checkpoints": [
      {
        "id": "slope-crest-check",
        "x": 3720,
        "surfaceY": 448,
        "spawnX": 3740,
        "spawnSurfaceY": 448
      },
      {
        "id": "slope-exit-check",
        "x": 8760,
        "surfaceY": 640,
        "spawnX": 8780,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9200,
      "surfaceY": 640
    }
  },
  "4-3": {
    "id": "4-3",
    "theme": "frostveil-peaks",
    "rankTargets": {
      "sTime": 40,
      "aTime": 56,
      "bTime": 80,
      "cTime": 110
    },
    "world": {
      "width": 10000,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 20,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 35,
        "row": 9,
        "width": 5,
        "height": 1
      },
      {
        "col": 49,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 65,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 80,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 98,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 116,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 137,
        "row": 10,
        "width": 16,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "frost-chain-ferry-a",
        "col": 28,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 320,
        "durationMs": 2600,
        "phase": 0.2
      },
      {
        "id": "frost-chain-ferry-b",
        "col": 88,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 360,
        "durationMs": 2800,
        "phase": 0.55
      }
    ],
    "surfaceZones": [
      {
        "id": "chain-ice-a",
        "type": "ice",
        "x": 900,
        "y": 0,
        "width": 1800,
        "height": 1080
      },
      {
        "id": "chain-ice-b",
        "type": "ice",
        "x": 3300,
        "y": 0,
        "width": 1900,
        "height": 1080
      },
      {
        "id": "chain-ice-c",
        "type": "ice",
        "x": 5900,
        "y": 0,
        "width": 2200,
        "height": 1080
      },
      {
        "id": "chain-ice-d",
        "type": "ice",
        "x": 8000,
        "y": 0,
        "width": 1700,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 1100,
        "y": 584
      },
      {
        "x": 1700,
        "y": 520
      },
      {
        "x": 2320,
        "y": 520
      },
      {
        "x": 3060,
        "y": 500
      },
      {
        "x": 3780,
        "y": 440
      },
      {
        "x": 4560,
        "y": 584
      },
      {
        "x": 5400,
        "y": 440
      },
      {
        "x": 6200,
        "y": 390
      },
      {
        "x": 7040,
        "y": 584
      },
      {
        "x": 7920,
        "y": 520
      },
      {
        "x": 8800,
        "y": 584
      },
      {
        "x": 9400,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "chain-guard-a",
        "x": 600,
        "surfaceY": 640,
        "patrolMinX": 320,
        "patrolMaxX": 820
      },
      {
        "id": "chain-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2320,
        "y": 500,
        "patrolMinX": 2320,
        "patrolMaxX": 2320
      },
      {
        "id": "chain-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3820,
        "y": 430,
        "patrolMinX": 3820,
        "patrolMaxX": 3820
      },
      {
        "id": "chain-guard-b",
        "x": 5380,
        "surfaceY": 640,
        "patrolMinX": 5080,
        "patrolMaxX": 5600
      },
      {
        "id": "chain-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6200,
        "y": 390,
        "patrolMinX": 6200,
        "patrolMaxX": 6200
      },
      {
        "id": "chain-guard-c",
        "x": 9000,
        "surfaceY": 640,
        "patrolMinX": 8800,
        "patrolMaxX": 9600
      }
    ],
    "checkpoints": [
      {
        "id": "chain-mid-check",
        "x": 3300,
        "surfaceY": 640,
        "spawnX": 3320,
        "spawnSurfaceY": 640
      },
      {
        "id": "chain-exit-check",
        "x": 8920,
        "surfaceY": 640,
        "spawnX": 8940,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9480,
      "surfaceY": 640
    }
  },
  "4-4": {
    "id": "4-4",
    "theme": "frostveil-peaks",
    "rankTargets": {
      "sTime": 44,
      "aTime": 62,
      "bTime": 88,
      "cTime": 120
    },
    "world": {
      "width": 10800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 12,
        "height": 1
      },
      {
        "col": 21,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 34,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 49,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 64,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 82,
        "row": 11,
        "width": 8,
        "height": 1
      },
      {
        "col": 101,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 119,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 139,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 156,
        "row": 10,
        "width": 10,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "blizzard-lift-a",
        "col": 16,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 150,
        "durationMs": 2300
      },
      {
        "id": "blizzard-ferry-a",
        "col": 42,
        "row": 8,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 330,
        "durationMs": 2700,
        "phase": 0.4
      },
      {
        "id": "blizzard-lift-b",
        "col": 74,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 160,
        "durationMs": 2500,
        "phase": 0.65
      },
      {
        "id": "blizzard-ferry-b",
        "col": 130,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 380,
        "durationMs": 2900,
        "phase": 0.25
      }
    ],
    "surfaceZones": [
      {
        "id": "lift-ice-a",
        "type": "ice",
        "x": 900,
        "y": 0,
        "width": 2300,
        "height": 1080
      },
      {
        "id": "lift-ice-b",
        "type": "ice",
        "x": 3500,
        "y": 0,
        "width": 2200,
        "height": 1080
      },
      {
        "id": "lift-ice-c",
        "type": "ice",
        "x": 6200,
        "y": 0,
        "width": 2600,
        "height": 1080
      },
      {
        "id": "exit-ice",
        "type": "ice",
        "x": 9000,
        "y": 0,
        "width": 1500,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 648
      },
      {
        "x": 1150,
        "y": 620
      },
      {
        "x": 1700,
        "y": 560
      },
      {
        "x": 2360,
        "y": 500
      },
      {
        "x": 3100,
        "y": 430
      },
      {
        "x": 3900,
        "y": 330
      },
      {
        "x": 4750,
        "y": 330
      },
      {
        "x": 5600,
        "y": 460
      },
      {
        "x": 6500,
        "y": 610
      },
      {
        "x": 7250,
        "y": 610
      },
      {
        "x": 8100,
        "y": 500
      },
      {
        "x": 9000,
        "y": 520
      },
      {
        "x": 9950,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "blizzard-guard-a",
        "x": 560,
        "surfaceY": 704,
        "patrolMinX": 320,
        "patrolMaxX": 780
      },
      {
        "id": "blizzard-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3100,
        "y": 430,
        "patrolMinX": 3100,
        "patrolMaxX": 3100
      },
      {
        "id": "blizzard-guard-b",
        "x": 3320,
        "surfaceY": 448,
        "patrolMinX": 3180,
        "patrolMaxX": 3580
      },
      {
        "id": "blizzard-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8100,
        "y": 500,
        "patrolMinX": 8100,
        "patrolMaxX": 8100
      },
      {
        "id": "blizzard-guard-c",
        "x": 9300,
        "surfaceY": 640,
        "patrolMinX": 8980,
        "patrolMaxX": 9600
      }
    ],
    "checkpoints": [
      {
        "id": "blizzard-high-check",
        "x": 3340,
        "surfaceY": 448,
        "spawnX": 3360,
        "spawnSurfaceY": 448
      },
      {
        "id": "blizzard-exit-check",
        "x": 9240,
        "surfaceY": 640,
        "spawnX": 9260,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 10140,
      "surfaceY": 640
    }
  },
  "4-5": {
    "id": "4-5",
    "theme": "frostveil-peaks",
    "rankTargets": {
      "sTime": 92,
      "aTime": 124,
      "bTime": 166,
      "cTime": 224
    },
    "world": {
      "width": 17400,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 24,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 39,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 54,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 70,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 91,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 112,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 132,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 154,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 177,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 199,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 221,
        "row": 10,
        "width": 9,
        "height": 1
      },
      {
        "col": 244,
        "row": 9,
        "width": 8,
        "height": 1
      },
      {
        "col": 260,
        "row": 10,
        "width": 10,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "frozen-ferry-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 320,
        "durationMs": 2600,
        "phase": 0.2
      },
      {
        "id": "frozen-lift-a",
        "col": 63,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 150,
        "durationMs": 2400,
        "phase": 0.5
      },
      {
        "id": "frozen-ferry-b",
        "col": 103,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 380,
        "durationMs": 2850,
        "phase": 0.3
      },
      {
        "id": "frozen-lift-b",
        "col": 143,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 160,
        "durationMs": 2500,
        "phase": 0.65
      },
      {
        "id": "frozen-ferry-c",
        "col": 233,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 420,
        "durationMs": 3000,
        "phase": 0.45
      }
    ],
    "surfaceZones": [
      {
        "id": "gauntlet-ice-a",
        "type": "ice",
        "x": 850,
        "y": 0,
        "width": 3000,
        "height": 1080
      },
      {
        "id": "gauntlet-ice-b",
        "type": "ice",
        "x": 3800,
        "y": 0,
        "width": 3200,
        "height": 1080
      },
      {
        "id": "gauntlet-ice-c",
        "type": "ice",
        "x": 7000,
        "y": 0,
        "width": 3200,
        "height": 1080
      },
      {
        "id": "gauntlet-ice-d",
        "type": "ice",
        "x": 10200,
        "y": 0,
        "width": 3300,
        "height": 1080
      },
      {
        "id": "gauntlet-ice-e",
        "type": "ice",
        "x": 13500,
        "y": 0,
        "width": 3600,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 1100,
        "y": 584
      },
      {
        "x": 1900,
        "y": 520
      },
      {
        "x": 2700,
        "y": 520
      },
      {
        "x": 3500,
        "y": 500
      },
      {
        "x": 4400,
        "y": 440
      },
      {
        "x": 5400,
        "y": 392
      },
      {
        "x": 6400,
        "y": 584
      },
      {
        "x": 7600,
        "y": 584
      },
      {
        "x": 8800,
        "y": 520
      },
      {
        "x": 10000,
        "y": 500
      },
      {
        "x": 11200,
        "y": 440
      },
      {
        "x": 12400,
        "y": 392
      },
      {
        "x": 13700,
        "y": 584
      },
      {
        "x": 14900,
        "y": 520
      },
      {
        "x": 16100,
        "y": 584
      },
      {
        "x": 16800,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "frozen-guard-a",
        "x": 620,
        "surfaceY": 640,
        "patrolMinX": 340,
        "patrolMaxX": 900
      },
      {
        "id": "frozen-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2700,
        "y": 500,
        "patrolMinX": 2700,
        "patrolMaxX": 2700
      },
      {
        "id": "frozen-guard-b",
        "x": 4700,
        "surfaceY": 640,
        "patrolMinX": 4500,
        "patrolMaxX": 4980
      },
      {
        "id": "frozen-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8800,
        "y": 500,
        "patrolMinX": 8800,
        "patrolMaxX": 8800
      },
      {
        "id": "frozen-guard-c",
        "x": 10100,
        "surfaceY": 640,
        "patrolMinX": 9850,
        "patrolMaxX": 10350
      },
      {
        "id": "frozen-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 12400,
        "y": 392,
        "patrolMinX": 12400,
        "patrolMaxX": 12400
      },
      {
        "id": "frozen-guard-d",
        "x": 16000,
        "surfaceY": 576,
        "patrolMinX": 15650,
        "patrolMaxX": 16100
      }
    ],
    "checkpoints": [
      {
        "id": "frozen-check-a",
        "x": 4600,
        "surfaceY": 640,
        "spawnX": 4620,
        "spawnSurfaceY": 640
      },
      {
        "id": "frozen-check-b",
        "x": 10100,
        "surfaceY": 640,
        "spawnX": 10120,
        "spawnSurfaceY": 640
      },
      {
        "id": "frozen-check-c",
        "x": 15700,
        "surfaceY": 576,
        "spawnX": 15720,
        "spawnSurfaceY": 576
      }
    ],
    "goal": {
      "x": 16880,
      "surfaceY": 640
    }
  },
  "4-6": {
    "id": "4-6",
    "theme": "frostveil-peaks",
    "rankTargets": {
      "sTime": 86,
      "aTime": 116,
      "bTime": 154,
      "cTime": 210
    },
    "world": {
      "width": 7800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 24,
        "row": 9,
        "width": 8,
        "height": 1
      },
      {
        "col": 43,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 62,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 82,
        "row": 10,
        "width": 10,
        "height": 1
      },
      {
        "col": 100,
        "row": 10,
        "width": 18,
        "height": 1
      },
      {
        "col": 108,
        "row": 9,
        "width": 6,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "snowcrown-ferry-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 300,
        "durationMs": 2600,
        "phase": 0.2
      },
      {
        "id": "snowcrown-lift-a",
        "col": 53,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 150,
        "durationMs": 2450,
        "phase": 0.5
      },
      {
        "id": "snowcrown-ferry-b",
        "col": 74,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 360,
        "durationMs": 2800,
        "phase": 0.35
      }
    ],
    "surfaceZones": [
      {
        "id": "boss-ice-a",
        "type": "ice",
        "x": 850,
        "y": 0,
        "width": 2300,
        "height": 1080
      },
      {
        "id": "boss-ice-b",
        "type": "ice",
        "x": 3100,
        "y": 0,
        "width": 2400,
        "height": 1080
      },
      {
        "id": "boss-ice-c",
        "type": "ice",
        "x": 5500,
        "y": 0,
        "width": 2000,
        "height": 1080
      }
    ],
    "coins": [],
    "enemies": [
      {
        "id": "boss-prototype",
        "type": "azure-core",
        "respawnPolicy": "persistent",
        "countsForScore": true,
        "x": 7200,
        "y": 384,
        "patrolMinX": 7200,
        "patrolMaxX": 7200
      },
      {
        "id": "snowcrown-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 1500,
        "y": 430,
        "patrolMinX": 1500,
        "patrolMaxX": 1500
      },
      {
        "id": "snowcrown-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2800,
        "y": 390,
        "patrolMinX": 2800,
        "patrolMaxX": 2800
      },
      {
        "id": "snowcrown-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3980,
        "y": 430,
        "patrolMinX": 3980,
        "patrolMaxX": 3980
      },
      {
        "id": "snowcrown-core-d",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5320,
        "y": 360,
        "patrolMinX": 5320,
        "patrolMaxX": 5320
      },
      {
        "id": "snowcrown-core-e",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6380,
        "y": 410,
        "patrolMinX": 6380,
        "patrolMaxX": 6380
      }
    ],
    "checkpoints": [],
    "goal": {
      "x": 7420,
      "surfaceY": 640
    }
  },
  "5-1": {
    "id": "5-1",
    "theme": "emberfall-caldera",
    "rankTargets": {
      "sTime": 36,
      "aTime": 50,
      "bTime": 72,
      "cTime": 100
    },
    "world": {
      "width": 9200,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 16,
        "height": 1
      },
      {
        "col": 24,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 39,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 54,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 70,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 86,
        "row": 10,
        "width": 10,
        "height": 1
      },
      {
        "col": 106,
        "row": 10,
        "width": 24,
        "height": 1
      }
    ],
    "movingPlatforms": [],
    "hazards": [
      {
        "id": "cinder-vent-a",
        "type": "lava",
        "x": 1400,
        "surfaceY": 640,
        "width": 240,
        "height": 78
      },
      {
        "id": "cinder-vent-b",
        "type": "lava",
        "x": 2050,
        "surfaceY": 640,
        "width": 240,
        "height": 78
      },
      {
        "id": "cinder-vent-c",
        "type": "lava",
        "x": 3600,
        "surfaceY": 576,
        "width": 240,
        "height": 78
      },
      {
        "id": "cinder-vent-d",
        "type": "lava",
        "x": 5000,
        "surfaceY": 640,
        "width": 240,
        "height": 78
      },
      {
        "id": "cinder-vent-e",
        "type": "lava",
        "x": 7350,
        "surfaceY": 640,
        "width": 240,
        "height": 78
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 584
      },
      {
        "x": 760,
        "y": 584
      },
      {
        "x": 1260,
        "y": 540
      },
      {
        "x": 1780,
        "y": 530
      },
      {
        "x": 2520,
        "y": 520
      },
      {
        "x": 3320,
        "y": 500
      },
      {
        "x": 4380,
        "y": 520
      },
      {
        "x": 5480,
        "y": 500
      },
      {
        "x": 6500,
        "y": 584
      },
      {
        "x": 7350,
        "y": 520
      },
      {
        "x": 8100,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "cinder-guard-a",
        "x": 620,
        "surfaceY": 640,
        "patrolMinX": 340,
        "patrolMaxX": 920
      },
      {
        "id": "cinder-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3400,
        "y": 470,
        "patrolMinX": 3400,
        "patrolMaxX": 3400
      },
      {
        "id": "cinder-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5020,
        "y": 480,
        "patrolMinX": 5020,
        "patrolMaxX": 5020
      },
      {
        "id": "cinder-guard-b",
        "x": 7400,
        "surfaceY": 640,
        "patrolMinX": 7040,
        "patrolMaxX": 8100
      }
    ],
    "checkpoints": [
      {
        "id": "cinder-mid-check",
        "x": 3500,
        "surfaceY": 640,
        "spawnX": 3520,
        "spawnSurfaceY": 640
      },
      {
        "id": "cinder-exit-check",
        "x": 7420,
        "surfaceY": 640,
        "spawnX": 7440,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 8200,
      "surfaceY": 640
    }
  },
  "5-2": {
    "id": "5-2",
    "theme": "emberfall-caldera",
    "rankTargets": {
      "sTime": 42,
      "aTime": 58,
      "bTime": 82,
      "cTime": 112
    },
    "world": {
      "width": 10200,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 13,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 37,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 54,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 72,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 92,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 112,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 134,
        "row": 10,
        "width": 20,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "magma-lift-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 170,
        "durationMs": 2300,
        "phase": 0.15
      },
      {
        "id": "magma-ferry-a",
        "col": 63,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 360,
        "durationMs": 2800,
        "phase": 0.45
      },
      {
        "id": "magma-lift-b",
        "col": 103,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 180,
        "durationMs": 2500,
        "phase": 0.65
      }
    ],
    "hazards": [
      {
        "id": "magma-vent-a",
        "type": "lava",
        "x": 1540,
        "surfaceY": 704,
        "width": 240,
        "height": 78
      },
      {
        "id": "magma-vent-b",
        "type": "lava",
        "x": 2860,
        "surfaceY": 640,
        "width": 240,
        "height": 78
      },
      {
        "id": "magma-vent-c",
        "type": "lava",
        "x": 4550,
        "surfaceY": 512,
        "width": 240,
        "height": 78
      },
      {
        "id": "magma-vent-d",
        "type": "lava",
        "x": 7080,
        "surfaceY": 640,
        "width": 240,
        "height": 78
      },
      {
        "id": "magma-vent-e",
        "type": "lava",
        "x": 8950,
        "surfaceY": 640,
        "width": 240,
        "height": 78
      }
    ],
    "coins": [
      {
        "x": 440,
        "y": 648
      },
      {
        "x": 1200,
        "y": 620
      },
      {
        "x": 1900,
        "y": 560
      },
      {
        "x": 2700,
        "y": 520
      },
      {
        "x": 3600,
        "y": 410
      },
      {
        "x": 4700,
        "y": 450
      },
      {
        "x": 5850,
        "y": 530
      },
      {
        "x": 7200,
        "y": 584
      },
      {
        "x": 8250,
        "y": 450
      },
      {
        "x": 9300,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "magma-guard-a",
        "x": 620,
        "surfaceY": 704,
        "patrolMinX": 340,
        "patrolMaxX": 780
      },
      {
        "id": "magma-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3050,
        "y": 430,
        "patrolMinX": 3050,
        "patrolMaxX": 3050
      },
      {
        "id": "magma-guard-b",
        "x": 4700,
        "surfaceY": 640,
        "patrolMinX": 4450,
        "patrolMaxX": 5050
      },
      {
        "id": "magma-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 8500,
        "y": 430,
        "patrolMinX": 8500,
        "patrolMaxX": 8500
      }
    ],
    "checkpoints": [
      {
        "id": "magma-high-check",
        "x": 3800,
        "surfaceY": 576,
        "spawnX": 3820,
        "spawnSurfaceY": 576
      },
      {
        "id": "magma-exit-check",
        "x": 9000,
        "surfaceY": 640,
        "spawnX": 9020,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9300,
      "surfaceY": 640
    }
  },
  "5-3": {
    "id": "5-3",
    "theme": "emberfall-caldera",
    "rankTargets": {
      "sTime": 44,
      "aTime": 62,
      "bTime": 88,
      "cTime": 120
    },
    "world": {
      "width": 10800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 5,
        "height": 1
      },
      {
        "col": 36,
        "row": 9,
        "width": 5,
        "height": 1
      },
      {
        "col": 50,
        "row": 10,
        "width": 5,
        "height": 1
      },
      {
        "col": 65,
        "row": 8,
        "width": 5,
        "height": 1
      },
      {
        "col": 80,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 98,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 116,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 138,
        "row": 10,
        "width": 22,
        "height": 1
      }
    ],
    "movingPlatforms": [],
    "hazards": [
      {
        "id": "eruption-a",
        "type": "lava",
        "x": 1650,
        "surfaceY": 640,
        "width": 300,
        "height": 78
      },
      {
        "id": "eruption-b",
        "type": "lava",
        "x": 2600,
        "surfaceY": 640,
        "width": 320,
        "height": 78
      },
      {
        "id": "eruption-c",
        "type": "lava",
        "x": 3700,
        "surfaceY": 576,
        "width": 300,
        "height": 78
      },
      {
        "id": "eruption-d",
        "type": "lava",
        "x": 5200,
        "surfaceY": 640,
        "width": 320,
        "height": 78
      },
      {
        "id": "eruption-e",
        "type": "lava",
        "x": 6400,
        "surfaceY": 512,
        "width": 280,
        "height": 78
      },
      {
        "id": "eruption-f",
        "type": "lava",
        "x": 7600,
        "surfaceY": 640,
        "width": 340,
        "height": 78
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 1120,
        "y": 584
      },
      {
        "x": 1880,
        "y": 520
      },
      {
        "x": 2480,
        "y": 500
      },
      {
        "x": 3160,
        "y": 480
      },
      {
        "x": 3860,
        "y": 500
      },
      {
        "x": 4580,
        "y": 540
      },
      {
        "x": 5400,
        "y": 430
      },
      {
        "x": 6280,
        "y": 390
      },
      {
        "x": 7200,
        "y": 560
      },
      {
        "x": 8350,
        "y": 500
      },
      {
        "x": 9300,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "eruption-guard-a",
        "x": 580,
        "surfaceY": 640,
        "patrolMinX": 320,
        "patrolMaxX": 780
      },
      {
        "id": "eruption-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2280,
        "y": 500,
        "patrolMinX": 2280,
        "patrolMaxX": 2280
      },
      {
        "id": "eruption-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3820,
        "y": 440,
        "patrolMinX": 3820,
        "patrolMaxX": 3820
      },
      {
        "id": "eruption-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5400,
        "y": 430,
        "patrolMinX": 5400,
        "patrolMaxX": 5400
      },
      {
        "id": "eruption-guard-b",
        "x": 9000,
        "surfaceY": 640,
        "patrolMinX": 8820,
        "patrolMaxX": 9600
      }
    ],
    "checkpoints": [
      {
        "id": "eruption-mid-check",
        "x": 3320,
        "surfaceY": 640,
        "spawnX": 3340,
        "spawnSurfaceY": 640
      },
      {
        "id": "eruption-exit-check",
        "x": 9020,
        "surfaceY": 640,
        "spawnX": 9040,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9400,
      "surfaceY": 640
    }
  },
  "5-4": {
    "id": "5-4",
    "theme": "emberfall-caldera",
    "rankTargets": {
      "sTime": 48,
      "aTime": 68,
      "bTime": 96,
      "cTime": 132
    },
    "world": {
      "width": 11600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 12,
        "height": 1
      },
      {
        "col": 24,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 42,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 60,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 80,
        "row": 11,
        "width": 8,
        "height": 1
      },
      {
        "col": 100,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 120,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 142,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 162,
        "row": 10,
        "width": 15,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "caldera-ferry-a",
        "col": 16,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 340,
        "durationMs": 2700,
        "phase": 0.2
      },
      {
        "id": "caldera-lift-a",
        "col": 52,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 180,
        "durationMs": 2550,
        "phase": 0.5
      },
      {
        "id": "caldera-ferry-b",
        "col": 110,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 420,
        "durationMs": 3100,
        "phase": 0.35
      }
    ],
    "hazards": [
      {
        "id": "caldera-a",
        "type": "lava",
        "x": 1700,
        "surfaceY": 704,
        "width": 320,
        "height": 78
      },
      {
        "id": "caldera-b",
        "type": "lava",
        "x": 2920,
        "surfaceY": 640,
        "width": 360,
        "height": 78
      },
      {
        "id": "caldera-c",
        "type": "lava",
        "x": 5200,
        "surfaceY": 576,
        "width": 320,
        "height": 78
      },
      {
        "id": "caldera-d",
        "type": "lava",
        "x": 7040,
        "surfaceY": 704,
        "width": 440,
        "height": 78
      },
      {
        "id": "caldera-e",
        "type": "lava",
        "x": 9280,
        "surfaceY": 576,
        "width": 360,
        "height": 78
      },
      {
        "id": "caldera-f",
        "type": "lava",
        "x": 10600,
        "surfaceY": 640,
        "width": 320,
        "height": 78
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 648
      },
      {
        "x": 1220,
        "y": 610
      },
      {
        "x": 2100,
        "y": 550
      },
      {
        "x": 3100,
        "y": 500
      },
      {
        "x": 4300,
        "y": 390
      },
      {
        "x": 5500,
        "y": 480
      },
      {
        "x": 6650,
        "y": 610
      },
      {
        "x": 7850,
        "y": 610
      },
      {
        "x": 9000,
        "y": 460
      },
      {
        "x": 10200,
        "y": 390
      },
      {
        "x": 11000,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "caldera-guard-a",
        "x": 560,
        "surfaceY": 704,
        "patrolMinX": 320,
        "patrolMaxX": 760
      },
      {
        "id": "caldera-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3080,
        "y": 500,
        "patrolMinX": 3080,
        "patrolMaxX": 3080
      },
      {
        "id": "caldera-guard-b",
        "x": 5350,
        "surfaceY": 704,
        "patrolMinX": 5120,
        "patrolMaxX": 5620
      },
      {
        "id": "caldera-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 9000,
        "y": 430,
        "patrolMinX": 9000,
        "patrolMaxX": 9000
      },
      {
        "id": "caldera-guard-c",
        "x": 10900,
        "surfaceY": 640,
        "patrolMinX": 10420,
        "patrolMaxX": 11240
      }
    ],
    "checkpoints": [
      {
        "id": "caldera-high-check",
        "x": 4000,
        "surfaceY": 576,
        "spawnX": 4020,
        "spawnSurfaceY": 576
      },
      {
        "id": "caldera-exit-check",
        "x": 10500,
        "surfaceY": 640,
        "spawnX": 10520,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 10920,
      "surfaceY": 640
    }
  },
  "5-5": {
    "id": "5-5",
    "theme": "emberfall-caldera",
    "rankTargets": {
      "sTime": 104,
      "aTime": 138,
      "bTime": 184,
      "cTime": 244
    },
    "world": {
      "width": 18200,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 25,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 40,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 56,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 74,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 92,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 114,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 135,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 158,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 181,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 204,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 226,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 250,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 268,
        "row": 10,
        "width": 12,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "inferno-ferry-a",
        "col": 18,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 340,
        "durationMs": 2700,
        "phase": 0.15
      },
      {
        "id": "inferno-lift-a",
        "col": 66,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 170,
        "durationMs": 2450,
        "phase": 0.5
      },
      {
        "id": "inferno-ferry-b",
        "col": 104,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 390,
        "durationMs": 2900,
        "phase": 0.35
      },
      {
        "id": "inferno-lift-b",
        "col": 145,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 180,
        "durationMs": 2600,
        "phase": 0.7
      },
      {
        "id": "inferno-ferry-c",
        "col": 238,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 450,
        "durationMs": 3200,
        "phase": 0.45
      }
    ],
    "hazards": [
      {
        "id": "inferno-a",
        "type": "lava",
        "x": 1400,
        "surfaceY": 640,
        "width": 300,
        "height": 78
      },
      {
        "id": "inferno-b",
        "type": "lava",
        "x": 2100,
        "surfaceY": 640,
        "width": 320,
        "height": 78
      },
      {
        "id": "inferno-c",
        "type": "lava",
        "x": 3500,
        "surfaceY": 576,
        "width": 320,
        "height": 78
      },
      {
        "id": "inferno-d",
        "type": "lava",
        "x": 5200,
        "surfaceY": 640,
        "width": 340,
        "height": 78
      },
      {
        "id": "inferno-e",
        "type": "lava",
        "x": 6650,
        "surfaceY": 512,
        "width": 300,
        "height": 78
      },
      {
        "id": "inferno-f",
        "type": "lava",
        "x": 8000,
        "surfaceY": 640,
        "width": 360,
        "height": 78
      },
      {
        "id": "inferno-g",
        "type": "lava",
        "x": 9850,
        "surfaceY": 640,
        "width": 360,
        "height": 78
      },
      {
        "id": "inferno-h",
        "type": "lava",
        "x": 11600,
        "surfaceY": 512,
        "width": 320,
        "height": 78
      },
      {
        "id": "inferno-i",
        "type": "lava",
        "x": 13750,
        "surfaceY": 640,
        "width": 420,
        "height": 78
      },
      {
        "id": "inferno-j",
        "type": "lava",
        "x": 15200,
        "surfaceY": 640,
        "width": 360,
        "height": 78
      },
      {
        "id": "inferno-k",
        "type": "lava",
        "x": 16600,
        "surfaceY": 512,
        "width": 320,
        "height": 78
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 1120,
        "y": 584
      },
      {
        "x": 1900,
        "y": 520
      },
      {
        "x": 2700,
        "y": 520
      },
      {
        "x": 3500,
        "y": 500
      },
      {
        "x": 4520,
        "y": 520
      },
      {
        "x": 5600,
        "y": 500
      },
      {
        "x": 6800,
        "y": 390
      },
      {
        "x": 7900,
        "y": 560
      },
      {
        "x": 9100,
        "y": 584
      },
      {
        "x": 10300,
        "y": 520
      },
      {
        "x": 11600,
        "y": 390
      },
      {
        "x": 13000,
        "y": 584
      },
      {
        "x": 14400,
        "y": 584
      },
      {
        "x": 15600,
        "y": 500
      },
      {
        "x": 17000,
        "y": 390
      },
      {
        "x": 17600,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "inferno-guard-a",
        "x": 620,
        "surfaceY": 640,
        "patrolMinX": 340,
        "patrolMaxX": 900
      },
      {
        "id": "inferno-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2700,
        "y": 500,
        "patrolMinX": 2700,
        "patrolMaxX": 2700
      },
      {
        "id": "inferno-guard-b",
        "x": 3700,
        "surfaceY": 640,
        "patrolMinX": 3600,
        "patrolMaxX": 4000
      },
      {
        "id": "inferno-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6800,
        "y": 390,
        "patrolMinX": 6800,
        "patrolMaxX": 6800
      },
      {
        "id": "inferno-guard-c",
        "x": 10200,
        "surfaceY": 640,
        "patrolMinX": 10130,
        "patrolMaxX": 10500
      },
      {
        "id": "inferno-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 11600,
        "y": 392,
        "patrolMinX": 11600,
        "patrolMaxX": 11600
      },
      {
        "id": "inferno-guard-d",
        "x": 17400,
        "surfaceY": 640,
        "patrolMinX": 17180,
        "patrolMaxX": 17820
      }
    ],
    "checkpoints": [
      {
        "id": "inferno-check-a",
        "x": 3700,
        "surfaceY": 640,
        "spawnX": 3720,
        "spawnSurfaceY": 640
      },
      {
        "id": "inferno-check-b",
        "x": 10200,
        "surfaceY": 640,
        "spawnX": 10220,
        "spawnSurfaceY": 640
      },
      {
        "id": "inferno-check-c",
        "x": 17400,
        "surfaceY": 640,
        "spawnX": 17420,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 17600,
      "surfaceY": 640
    }
  },
  "5-6": {
    "id": "5-6",
    "theme": "emberfall-caldera",
    "rankTargets": {
      "sTime": 90,
      "aTime": 122,
      "bTime": 164,
      "cTime": 220
    },
    "world": {
      "width": 8200,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 24,
        "row": 9,
        "width": 8,
        "height": 1
      },
      {
        "col": 43,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 62,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 82,
        "row": 10,
        "width": 10,
        "height": 1
      },
      {
        "col": 100,
        "row": 10,
        "width": 20,
        "height": 1
      },
      {
        "col": 108,
        "row": 9,
        "width": 7,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "emberheart-ferry-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 320,
        "durationMs": 2600,
        "phase": 0.2
      },
      {
        "id": "emberheart-lift-a",
        "col": 53,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 170,
        "durationMs": 2500,
        "phase": 0.55
      },
      {
        "id": "emberheart-ferry-b",
        "col": 74,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 380,
        "durationMs": 2850,
        "phase": 0.4
      }
    ],
    "hazards": [
      {
        "id": "emberheart-a",
        "type": "lava",
        "x": 1500,
        "surfaceY": 640,
        "width": 320,
        "height": 78
      },
      {
        "id": "emberheart-b",
        "type": "lava",
        "x": 2900,
        "surfaceY": 576,
        "width": 300,
        "height": 78
      },
      {
        "id": "emberheart-c",
        "type": "lava",
        "x": 4200,
        "surfaceY": 640,
        "width": 340,
        "height": 78
      },
      {
        "id": "emberheart-d",
        "type": "lava",
        "x": 5450,
        "surfaceY": 512,
        "width": 320,
        "height": 78
      },
      {
        "id": "emberheart-e",
        "type": "lava",
        "x": 6500,
        "surfaceY": 640,
        "width": 380,
        "height": 78
      }
    ],
    "coins": [],
    "enemies": [
      {
        "id": "boss-prototype",
        "type": "azure-core",
        "respawnPolicy": "persistent",
        "countsForScore": true,
        "x": 7500,
        "y": 384,
        "patrolMinX": 7500,
        "patrolMaxX": 7500
      },
      {
        "id": "emberheart-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 1500,
        "y": 430,
        "patrolMinX": 1500,
        "patrolMaxX": 1500
      },
      {
        "id": "emberheart-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2820,
        "y": 390,
        "patrolMinX": 2820,
        "patrolMaxX": 2820
      },
      {
        "id": "emberheart-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3980,
        "y": 430,
        "patrolMinX": 3980,
        "patrolMaxX": 3980
      },
      {
        "id": "emberheart-core-d",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5320,
        "y": 360,
        "patrolMinX": 5320,
        "patrolMaxX": 5320
      },
      {
        "id": "emberheart-core-e",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6500,
        "y": 410,
        "patrolMinX": 6500,
        "patrolMaxX": 6500
      }
    ],
    "checkpoints": [],
    "goal": {
      "x": 7600,
      "surfaceY": 640
    }
  },
  "6-1": {
    "id": "6-1",
    "theme": "abyssal-hollow",
    "rankTargets": {
      "sTime": 42,
      "aTime": 58,
      "bTime": 82,
      "cTime": 112
    },
    "world": {
      "width": 9800,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 38,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 55,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 72,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 90,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 112,
        "row": 10,
        "width": 26,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "hollow-ferry-a",
        "col": 64,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 360,
        "durationMs": 2800,
        "phase": 0.35
      }
    ],
    "hazards": [
      {
        "id": "threshold-spike-a",
        "type": "spikes",
        "x": 1280,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "threshold-lava-a",
        "type": "lava",
        "x": 2500,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "threshold-spike-b",
        "type": "spikes",
        "x": 3600,
        "surfaceY": 576,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "threshold-lava-b",
        "type": "lava",
        "x": 5850,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "threshold-spike-c",
        "type": "spikes",
        "x": 7900,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      }
    ],
    "gravityZones": [],
    "surfaceZones": [
      {
        "id": "threshold-ice",
        "type": "ice",
        "x": 4000,
        "y": 0,
        "width": 2600,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 430,
        "y": 584
      },
      {
        "x": 1080,
        "y": 584
      },
      {
        "x": 1850,
        "y": 530
      },
      {
        "x": 2680,
        "y": 520
      },
      {
        "x": 3540,
        "y": 500
      },
      {
        "x": 4500,
        "y": 520
      },
      {
        "x": 5450,
        "y": 500
      },
      {
        "x": 6500,
        "y": 390
      },
      {
        "x": 7600,
        "y": 584
      },
      {
        "x": 8800,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "threshold-guard-a",
        "x": 620,
        "surfaceY": 640,
        "patrolMinX": 340,
        "patrolMaxX": 850
      },
      {
        "id": "threshold-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3300,
        "y": 470,
        "patrolMinX": 3300,
        "patrolMaxX": 3300
      },
      {
        "id": "threshold-guard-b",
        "x": 6000,
        "surfaceY": 640,
        "patrolMinX": 5600,
        "patrolMaxX": 6200
      },
      {
        "id": "threshold-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 7600,
        "y": 500,
        "patrolMinX": 7600,
        "patrolMaxX": 7600
      }
    ],
    "checkpoints": [
      {
        "id": "threshold-mid-check",
        "x": 3740,
        "surfaceY": 640,
        "spawnX": 3760,
        "spawnSurfaceY": 640
      },
      {
        "id": "threshold-exit-check",
        "x": 7800,
        "surfaceY": 640,
        "spawnX": 7820,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 8500,
      "surfaceY": 640
    }
  },
  "6-2": {
    "id": "6-2",
    "theme": "abyssal-hollow",
    "rankTargets": {
      "sTime": 48,
      "aTime": 66,
      "bTime": 94,
      "cTime": 128
    },
    "world": {
      "width": 10600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 13,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 38,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 56,
        "row": 7,
        "width": 7,
        "height": 1
      },
      {
        "col": 74,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 92,
        "row": 11,
        "width": 8,
        "height": 1
      },
      {
        "col": 112,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 132,
        "row": 10,
        "width": 24,
        "height": 1
      }
    ],
    "movingPlatforms": [],
    "hazards": [
      {
        "id": "inverted-spike-a",
        "type": "spikes",
        "x": 1500,
        "surfaceY": 704,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "inverted-spike-b",
        "type": "spikes",
        "x": 2700,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "inverted-lava-a",
        "type": "lava",
        "x": 4000,
        "surfaceY": 512,
        "width": 260,
        "height": 78
      },
      {
        "id": "inverted-spike-c",
        "type": "spikes",
        "x": 6100,
        "surfaceY": 448,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "inverted-lava-b",
        "type": "lava",
        "x": 7700,
        "surfaceY": 704,
        "width": 260,
        "height": 78
      },
      {
        "id": "inverted-spike-d",
        "type": "spikes",
        "x": 9300,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      }
    ],
    "gravityZones": [
      {
        "id": "invert-a",
        "x": 2350,
        "y": 0,
        "width": 2300,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "restore-a",
        "x": 4650,
        "y": 0,
        "width": 1800,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "invert-b",
        "x": 6450,
        "y": 0,
        "width": 2100,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "restore-b",
        "x": 8550,
        "y": 0,
        "width": 2100,
        "height": 1080,
        "direction": "down"
      }
    ],
    "surfaceZones": [],
    "coins": [
      {
        "x": 430,
        "y": 648
      },
      {
        "x": 1150,
        "y": 620
      },
      {
        "x": 1900,
        "y": 550
      },
      {
        "x": 2850,
        "y": 500
      },
      {
        "x": 3900,
        "y": 390
      },
      {
        "x": 5150,
        "y": 330
      },
      {
        "x": 6400,
        "y": 500
      },
      {
        "x": 7600,
        "y": 620
      },
      {
        "x": 9000,
        "y": 500
      },
      {
        "x": 9900,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "inverted-guard-a",
        "x": 600,
        "surfaceY": 704,
        "patrolMinX": 340,
        "patrolMaxX": 780
      },
      {
        "id": "inverted-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3000,
        "y": 430,
        "patrolMinX": 3000,
        "patrolMaxX": 3000
      },
      {
        "id": "inverted-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5600,
        "y": 330,
        "patrolMinX": 5600,
        "patrolMaxX": 5600
      },
      {
        "id": "inverted-guard-b",
        "x": 6100,
        "surfaceY": 704,
        "patrolMinX": 5880,
        "patrolMaxX": 6350
      },
      {
        "id": "inverted-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 9150,
        "y": 500,
        "patrolMinX": 9150,
        "patrolMaxX": 9150
      }
    ],
    "checkpoints": [
      {
        "id": "inverted-high-check",
        "x": 3900,
        "surfaceY": 448,
        "spawnX": 3920,
        "spawnSurfaceY": 448,
        "spawnGravity": "up"
      },
      {
        "id": "inverted-exit-check",
        "x": 9100,
        "surfaceY": 640,
        "spawnX": 9120,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 9800,
      "surfaceY": 640
    }
  },
  "6-3": {
    "id": "6-3",
    "theme": "abyssal-hollow",
    "rankTargets": {
      "sTime": 50,
      "aTime": 70,
      "bTime": 98,
      "cTime": 136
    },
    "world": {
      "width": 11200,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 12,
        "height": 1
      },
      {
        "col": 22,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 38,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 55,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 72,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 90,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 110,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 132,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 154,
        "row": 10,
        "width": 15,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "abyssal-ferry-a",
        "col": 16,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 340,
        "durationMs": 2600,
        "phase": 0.15
      },
      {
        "id": "abyssal-lift-a",
        "col": 47,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 170,
        "durationMs": 2450,
        "phase": 0.5
      },
      {
        "id": "abyssal-ferry-b",
        "col": 122,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 420,
        "durationMs": 3100,
        "phase": 0.35
      }
    ],
    "hazards": [
      {
        "id": "conveyor-lava-a",
        "type": "lava",
        "x": 1650,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "conveyor-spike-a",
        "type": "spikes",
        "x": 2800,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "conveyor-lava-b",
        "type": "lava",
        "x": 4800,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "conveyor-spike-b",
        "type": "spikes",
        "x": 6700,
        "surfaceY": 512,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "conveyor-lava-c",
        "type": "lava",
        "x": 8500,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "conveyor-spike-c",
        "type": "spikes",
        "x": 10000,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      }
    ],
    "gravityZones": [],
    "surfaceZones": [
      {
        "id": "conveyor-ice-a",
        "type": "ice",
        "x": 3000,
        "y": 0,
        "width": 2600,
        "height": 1080
      },
      {
        "id": "conveyor-ice-b",
        "type": "ice",
        "x": 7600,
        "y": 0,
        "width": 2200,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 1100,
        "y": 584
      },
      {
        "x": 1900,
        "y": 520
      },
      {
        "x": 2900,
        "y": 520
      },
      {
        "x": 3950,
        "y": 500
      },
      {
        "x": 5100,
        "y": 520
      },
      {
        "x": 6400,
        "y": 390
      },
      {
        "x": 7800,
        "y": 560
      },
      {
        "x": 9000,
        "y": 500
      },
      {
        "x": 10300,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "conveyor-guard-a",
        "x": 580,
        "surfaceY": 640,
        "patrolMinX": 320,
        "patrolMaxX": 780
      },
      {
        "id": "conveyor-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2800,
        "y": 500,
        "patrolMinX": 2800,
        "patrolMaxX": 2800
      },
      {
        "id": "conveyor-guard-b",
        "x": 3600,
        "surfaceY": 640,
        "patrolMinX": 3540,
        "patrolMaxX": 3880
      },
      {
        "id": "conveyor-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6400,
        "y": 390,
        "patrolMinX": 6400,
        "patrolMaxX": 6400
      },
      {
        "id": "conveyor-guard-c",
        "x": 10100,
        "surfaceY": 640,
        "patrolMinX": 9900,
        "patrolMaxX": 10700
      }
    ],
    "checkpoints": [
      {
        "id": "conveyor-mid-check",
        "x": 3650,
        "surfaceY": 640,
        "spawnX": 3670,
        "spawnSurfaceY": 640
      },
      {
        "id": "conveyor-exit-check",
        "x": 10100,
        "surfaceY": 640,
        "spawnX": 10120,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 10300,
      "surfaceY": 640
    }
  },
  "6-4": {
    "id": "6-4",
    "theme": "abyssal-hollow",
    "rankTargets": {
      "sTime": 56,
      "aTime": 78,
      "bTime": 110,
      "cTime": 150
    },
    "world": {
      "width": 12000,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 704
    },
    "platforms": [
      {
        "col": 2,
        "row": 11,
        "width": 12,
        "height": 1
      },
      {
        "col": 23,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 40,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 58,
        "row": 7,
        "width": 6,
        "height": 1
      },
      {
        "col": 78,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 99,
        "row": 11,
        "width": 8,
        "height": 1
      },
      {
        "col": 120,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 142,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 164,
        "row": 10,
        "width": 14,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "demon-lift-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 180,
        "durationMs": 2500,
        "phase": 0.2
      },
      {
        "id": "demon-ferry-a",
        "col": 90,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 420,
        "durationMs": 3100,
        "phase": 0.5
      },
      {
        "id": "demon-lift-b",
        "col": 153,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 180,
        "durationMs": 2600,
        "phase": 0.65
      }
    ],
    "hazards": [
      {
        "id": "current-spike-a",
        "type": "spikes",
        "x": 1500,
        "surfaceY": 704,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "current-lava-a",
        "type": "lava",
        "x": 2920,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "current-spike-b",
        "type": "spikes",
        "x": 4500,
        "surfaceY": 512,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "current-lava-b",
        "type": "lava",
        "x": 6400,
        "surfaceY": 704,
        "width": 260,
        "height": 78
      },
      {
        "id": "current-spike-c",
        "type": "spikes",
        "x": 8000,
        "surfaceY": 576,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "current-lava-c",
        "type": "lava",
        "x": 10300,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      }
    ],
    "gravityZones": [
      {
        "id": "current-up-a",
        "x": 2450,
        "y": 0,
        "width": 2600,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "current-down-a",
        "x": 5050,
        "y": 0,
        "width": 2300,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "current-up-b",
        "x": 7350,
        "y": 0,
        "width": 2500,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "current-down-b",
        "x": 9850,
        "y": 0,
        "width": 2200,
        "height": 1080,
        "direction": "down"
      }
    ],
    "surfaceZones": [
      {
        "id": "current-ice",
        "type": "ice",
        "x": 5200,
        "y": 0,
        "width": 3400,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 648
      },
      {
        "x": 1200,
        "y": 620
      },
      {
        "x": 2050,
        "y": 540
      },
      {
        "x": 3200,
        "y": 390
      },
      {
        "x": 4500,
        "y": 330
      },
      {
        "x": 5900,
        "y": 520
      },
      {
        "x": 7200,
        "y": 620
      },
      {
        "x": 8500,
        "y": 500
      },
      {
        "x": 9800,
        "y": 390
      },
      {
        "x": 11100,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "current-guard-a",
        "x": 560,
        "surfaceY": 704,
        "patrolMinX": 320,
        "patrolMaxX": 760
      },
      {
        "id": "current-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3200,
        "y": 390,
        "patrolMinX": 3200,
        "patrolMaxX": 3200
      },
      {
        "id": "current-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5900,
        "y": 500,
        "patrolMinX": 5900,
        "patrolMaxX": 5900
      },
      {
        "id": "current-guard-b",
        "x": 6500,
        "surfaceY": 704,
        "patrolMinX": 6350,
        "patrolMaxX": 6900
      },
      {
        "id": "current-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 9800,
        "y": 390,
        "patrolMinX": 9800,
        "patrolMaxX": 9800
      },
      {
        "id": "current-guard-c",
        "x": 10800,
        "surfaceY": 640,
        "patrolMinX": 10550,
        "patrolMaxX": 11250
      }
    ],
    "checkpoints": [
      {
        "id": "current-high-check",
        "x": 3850,
        "surfaceY": 448,
        "spawnX": 3870,
        "spawnSurfaceY": 448,
        "spawnGravity": "up"
      },
      {
        "id": "current-exit-check",
        "x": 10800,
        "surfaceY": 640,
        "spawnX": 10820,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 11000,
      "surfaceY": 640
    }
  },
  "6-5": {
    "id": "6-5",
    "theme": "abyssal-hollow",
    "rankTargets": {
      "sTime": 118,
      "aTime": 156,
      "bTime": 208,
      "cTime": 276
    },
    "world": {
      "width": 19600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 25,
        "row": 10,
        "width": 6,
        "height": 1
      },
      {
        "col": 40,
        "row": 9,
        "width": 6,
        "height": 1
      },
      {
        "col": 56,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 74,
        "row": 8,
        "width": 6,
        "height": 1
      },
      {
        "col": 92,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 114,
        "row": 10,
        "width": 7,
        "height": 1
      },
      {
        "col": 135,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 158,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 181,
        "row": 11,
        "width": 8,
        "height": 1
      },
      {
        "col": 204,
        "row": 9,
        "width": 7,
        "height": 1
      },
      {
        "col": 226,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 250,
        "row": 8,
        "width": 7,
        "height": 1
      },
      {
        "col": 272,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 292,
        "row": 10,
        "width": 12,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "synthesis-ferry-a",
        "col": 18,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 340,
        "durationMs": 2700,
        "phase": 0.15
      },
      {
        "id": "synthesis-lift-a",
        "col": 66,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 170,
        "durationMs": 2450,
        "phase": 0.5
      },
      {
        "id": "synthesis-ferry-b",
        "col": 104,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 390,
        "durationMs": 2900,
        "phase": 0.35
      },
      {
        "id": "synthesis-lift-b",
        "col": 145,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 180,
        "durationMs": 2600,
        "phase": 0.7
      },
      {
        "id": "synthesis-ferry-c",
        "col": 238,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 450,
        "durationMs": 3200,
        "phase": 0.45
      }
    ],
    "hazards": [
      {
        "id": "synthesis-spike-a",
        "type": "spikes",
        "x": 1400,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "synthesis-lava-a",
        "type": "lava",
        "x": 2200,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "synthesis-spike-b",
        "type": "spikes",
        "x": 3500,
        "surfaceY": 576,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "synthesis-lava-b",
        "type": "lava",
        "x": 5200,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "synthesis-spike-c",
        "type": "spikes",
        "x": 6650,
        "surfaceY": 512,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "synthesis-lava-c",
        "type": "lava",
        "x": 8000,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      },
      {
        "id": "synthesis-spike-d",
        "type": "spikes",
        "x": 9850,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "synthesis-lava-d",
        "type": "lava",
        "x": 11600,
        "surfaceY": 512,
        "width": 260,
        "height": 78
      },
      {
        "id": "synthesis-spike-e",
        "type": "spikes",
        "x": 13750,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "synthesis-lava-e",
        "type": "lava",
        "x": 15200,
        "surfaceY": 704,
        "width": 260,
        "height": 78
      },
      {
        "id": "synthesis-spike-f",
        "type": "spikes",
        "x": 17000,
        "surfaceY": 512,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "synthesis-lava-f",
        "type": "lava",
        "x": 18400,
        "surfaceY": 640,
        "width": 260,
        "height": 78
      }
    ],
    "gravityZones": [
      {
        "id": "synthesis-up-a",
        "x": 4200,
        "y": 0,
        "width": 2800,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "synthesis-down-a",
        "x": 7000,
        "y": 0,
        "width": 3200,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "synthesis-up-b",
        "x": 12800,
        "y": 0,
        "width": 2800,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "synthesis-down-b",
        "x": 15600,
        "y": 0,
        "width": 4000,
        "height": 1080,
        "direction": "down"
      }
    ],
    "surfaceZones": [
      {
        "id": "synthesis-ice-a",
        "type": "ice",
        "x": 2400,
        "y": 0,
        "width": 2800,
        "height": 1080
      },
      {
        "id": "synthesis-ice-b",
        "type": "ice",
        "x": 9600,
        "y": 0,
        "width": 3400,
        "height": 1080
      },
      {
        "id": "synthesis-ice-c",
        "type": "ice",
        "x": 15600,
        "y": 0,
        "width": 3000,
        "height": 1080
      }
    ],
    "coins": [
      {
        "x": 420,
        "y": 584
      },
      {
        "x": 1120,
        "y": 584
      },
      {
        "x": 1900,
        "y": 520
      },
      {
        "x": 2700,
        "y": 520
      },
      {
        "x": 3500,
        "y": 500
      },
      {
        "x": 4520,
        "y": 520
      },
      {
        "x": 5600,
        "y": 500
      },
      {
        "x": 6800,
        "y": 390
      },
      {
        "x": 7900,
        "y": 560
      },
      {
        "x": 9100,
        "y": 584
      },
      {
        "x": 10300,
        "y": 520
      },
      {
        "x": 11600,
        "y": 390
      },
      {
        "x": 13000,
        "y": 584
      },
      {
        "x": 14400,
        "y": 620
      },
      {
        "x": 15600,
        "y": 500
      },
      {
        "x": 17000,
        "y": 390
      },
      {
        "x": 18400,
        "y": 584
      }
    ],
    "enemies": [
      {
        "id": "synthesis-guard-a",
        "x": 620,
        "surfaceY": 640,
        "patrolMinX": 340,
        "patrolMaxX": 900
      },
      {
        "id": "synthesis-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2700,
        "y": 500,
        "patrolMinX": 2700,
        "patrolMaxX": 2700
      },
      {
        "id": "synthesis-guard-b",
        "x": 3700,
        "surfaceY": 640,
        "patrolMinX": 3600,
        "patrolMaxX": 4000
      },
      {
        "id": "synthesis-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6800,
        "y": 390,
        "patrolMinX": 6800,
        "patrolMaxX": 6800
      },
      {
        "id": "synthesis-guard-c",
        "x": 10200,
        "surfaceY": 640,
        "patrolMinX": 10130,
        "patrolMaxX": 10500
      },
      {
        "id": "synthesis-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 11600,
        "y": 392,
        "patrolMinX": 11600,
        "patrolMaxX": 11600
      },
      {
        "id": "synthesis-guard-d",
        "x": 17500,
        "surfaceY": 640,
        "patrolMinX": 17440,
        "patrolMaxX": 17820
      }
    ],
    "checkpoints": [
      {
        "id": "synthesis-check-a",
        "x": 3700,
        "surfaceY": 640,
        "spawnX": 3720,
        "spawnSurfaceY": 640
      },
      {
        "id": "synthesis-check-b",
        "x": 10200,
        "surfaceY": 640,
        "spawnX": 10220,
        "spawnSurfaceY": 640
      },
      {
        "id": "synthesis-check-c",
        "x": 17500,
        "surfaceY": 640,
        "spawnX": 17520,
        "spawnSurfaceY": 640
      }
    ],
    "goal": {
      "x": 18800,
      "surfaceY": 640
    }
  },
  "6-6": {
    "id": "6-6",
    "theme": "abyssal-hollow",
    "rankTargets": {
      "sTime": 96,
      "aTime": 130,
      "bTime": 174,
      "cTime": 232
    },
    "world": {
      "width": 8600,
      "height": 1080,
      "tileSize": 64
    },
    "playerSpawn": {
      "x": 256,
      "surfaceY": 640
    },
    "platforms": [
      {
        "col": 2,
        "row": 10,
        "width": 14,
        "height": 1
      },
      {
        "col": 24,
        "row": 9,
        "width": 8,
        "height": 1
      },
      {
        "col": 43,
        "row": 10,
        "width": 8,
        "height": 1
      },
      {
        "col": 62,
        "row": 8,
        "width": 8,
        "height": 1
      },
      {
        "col": 82,
        "row": 10,
        "width": 10,
        "height": 1
      },
      {
        "col": 100,
        "row": 10,
        "width": 22,
        "height": 1
      },
      {
        "col": 109,
        "row": 9,
        "width": 7,
        "height": 1
      }
    ],
    "movingPlatforms": [
      {
        "id": "queen-ferry-a",
        "col": 17,
        "row": 10,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 320,
        "durationMs": 2600,
        "phase": 0.2
      },
      {
        "id": "queen-lift-a",
        "col": 53,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "y",
        "distance": 170,
        "durationMs": 2500,
        "phase": 0.55
      },
      {
        "id": "queen-ferry-b",
        "col": 74,
        "row": 9,
        "width": 4,
        "height": 1,
        "axis": "x",
        "distance": 380,
        "durationMs": 2850,
        "phase": 0.4
      }
    ],
    "hazards": [
      {
        "id": "queen-spike-a",
        "type": "spikes",
        "x": 1500,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "queen-lava-a",
        "type": "lava",
        "x": 2900,
        "surfaceY": 576,
        "width": 260,
        "height": 78
      },
      {
        "id": "queen-spike-b",
        "type": "spikes",
        "x": 4200,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      },
      {
        "id": "queen-lava-b",
        "type": "lava",
        "x": 5450,
        "surfaceY": 512,
        "width": 260,
        "height": 78
      },
      {
        "id": "queen-spike-c",
        "type": "spikes",
        "x": 6500,
        "surfaceY": 640,
        "width": 220,
        "height": 72,
        "orientation": "floor"
      }
    ],
    "gravityZones": [
      {
        "id": "queen-up-a",
        "x": 2400,
        "y": 0,
        "width": 2100,
        "height": 1080,
        "direction": "up"
      },
      {
        "id": "queen-down-a",
        "x": 4500,
        "y": 0,
        "width": 2000,
        "height": 1080,
        "direction": "down"
      },
      {
        "id": "queen-up-b",
        "x": 6500,
        "y": 0,
        "width": 1000,
        "height": 1080,
        "direction": "up"
      }
    ],
    "surfaceZones": [
      {
        "id": "queen-ice",
        "type": "ice",
        "x": 4700,
        "y": 0,
        "width": 2200,
        "height": 1080
      }
    ],
    "coins": [],
    "enemies": [
      {
        "id": "boss-prototype",
        "type": "azure-core",
        "respawnPolicy": "persistent",
        "countsForScore": true,
        "x": 7900,
        "y": 384,
        "patrolMinX": 7900,
        "patrolMaxX": 7900
      },
      {
        "id": "queen-core-a",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 1500,
        "y": 430,
        "patrolMinX": 1500,
        "patrolMaxX": 1500
      },
      {
        "id": "queen-core-b",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 2820,
        "y": 390,
        "patrolMinX": 2820,
        "patrolMaxX": 2820
      },
      {
        "id": "queen-core-c",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 3980,
        "y": 430,
        "patrolMinX": 3980,
        "patrolMaxX": 3980
      },
      {
        "id": "queen-core-d",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 5320,
        "y": 360,
        "patrolMinX": 5320,
        "patrolMaxX": 5320
      },
      {
        "id": "queen-core-e",
        "type": "azure-core",
        "respawnPolicy": "regenerate",
        "countsForScore": false,
        "x": 6500,
        "y": 410,
        "patrolMinX": 6500,
        "patrolMaxX": 6500
      }
    ],
    "checkpoints": [],
    "goal": {
      "x": 7600,
      "surfaceY": 640
    }
  }
} satisfies Record<StageId, GameplayStageSource>,
}
