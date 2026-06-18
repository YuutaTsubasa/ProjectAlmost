import firstGateJson from './1-1.json'
import azureCourtyardJson from './1-2.json'
import skyTerraceJson from './1-3.json'
import archBridgeJson from './1-4.json'
import hangingGardenJson from './1-5.json'
import highSpireJson from './1-6.json'
import thornwakeStepsJson from './2-1.json'
import vineFerryJson from './2-2.json'
import brambleRunJson from './2-3.json'
import canopyLiftJson from './2-4.json'
import sanctuaryGauntletJson from './2-5.json'
import heartrootDuelJson from './2-6.json'
import tideInversionJson from './3-1.json'
import undertideStepsJson from './3-2.json'
import mirrorCurrentJson from './3-3.json'
import pearlVortexJson from './3-4.json'
import abyssCurrentJson from './3-5.json'
import leviathanMirrorJson from './3-6.json'
import iceboundRunJson from './4-1.json'
import crystalSlopeJson from './4-2.json'
import frostChainJson from './4-3.json'
import blizzardLiftsJson from './4-4.json'
import frozenGauntletJson from './4-5.json'
import snowcrownDuelJson from './4-6.json'
import cinderRunJson from './5-1.json'
import magmaLiftJson from './5-2.json'
import eruptionChainJson from './5-3.json'
import calderaCrossingJson from './5-4.json'
import infernoGauntletJson from './5-5.json'
import emberheartDuelJson from './5-6.json'
import hollowThresholdJson from './6-1.json'
import invertedThornsJson from './6-2.json'
import abyssalConveyorJson from './6-3.json'
import demonCurrentJson from './6-4.json'
import finalSynthesisJson from './6-5.json'
import abyssQueenDuelJson from './6-6.json'
import { validateStage } from '../../domain/stage/stageValidation'
import type { StageData } from './stageTypes'

const firstGate = firstGateJson as StageData
const azureCourtyard = azureCourtyardJson as StageData
const skyTerrace = skyTerraceJson as StageData
const archBridge = archBridgeJson as StageData
const hangingGarden = hangingGardenJson as StageData
const highSpire = highSpireJson as StageData
const thornwakeSteps = thornwakeStepsJson as StageData
const vineFerry = vineFerryJson as StageData
const brambleRun = brambleRunJson as StageData
const canopyLift = canopyLiftJson as StageData
const sanctuaryGauntlet = sanctuaryGauntletJson as StageData
const heartrootDuel = heartrootDuelJson as StageData
const tideInversion = tideInversionJson as StageData
const undertideSteps = undertideStepsJson as StageData
const mirrorCurrent = mirrorCurrentJson as StageData
const pearlVortex = pearlVortexJson as StageData
const abyssCurrent = abyssCurrentJson as StageData
const leviathanMirror = leviathanMirrorJson as StageData
const iceboundRun = iceboundRunJson as StageData
const crystalSlope = crystalSlopeJson as StageData
const frostChain = frostChainJson as StageData
const blizzardLifts = blizzardLiftsJson as StageData
const frozenGauntlet = frozenGauntletJson as StageData
const snowcrownDuel = snowcrownDuelJson as StageData
const cinderRun = cinderRunJson as StageData
const magmaLift = magmaLiftJson as StageData
const eruptionChain = eruptionChainJson as StageData
const calderaCrossing = calderaCrossingJson as StageData
const infernoGauntlet = infernoGauntletJson as StageData
const emberheartDuel = emberheartDuelJson as StageData
const hollowThreshold = hollowThresholdJson as StageData
const invertedThorns = invertedThornsJson as StageData
const abyssalConveyor = abyssalConveyorJson as StageData
const demonCurrent = demonCurrentJson as StageData
const finalSynthesis = finalSynthesisJson as StageData
const abyssQueenDuel = abyssQueenDuelJson as StageData

export const stages = {
  '1-1': firstGate,
  '1-2': azureCourtyard,
  '1-3': skyTerrace,
  '1-4': archBridge,
  '1-5': hangingGarden,
  '1-6': highSpire,
  '2-1': thornwakeSteps,
  '2-2': vineFerry,
  '2-3': brambleRun,
  '2-4': canopyLift,
  '2-5': sanctuaryGauntlet,
  '2-6': heartrootDuel,
  '3-1': tideInversion,
  '3-2': undertideSteps,
  '3-3': mirrorCurrent,
  '3-4': pearlVortex,
  '3-5': abyssCurrent,
  '3-6': leviathanMirror,
  '4-1': iceboundRun,
  '4-2': crystalSlope,
  '4-3': frostChain,
  '4-4': blizzardLifts,
  '4-5': frozenGauntlet,
  '4-6': snowcrownDuel,
  '5-1': cinderRun,
  '5-2': magmaLift,
  '5-3': eruptionChain,
  '5-4': calderaCrossing,
  '5-5': infernoGauntlet,
  '5-6': emberheartDuel,
  '6-1': hollowThreshold,
  '6-2': invertedThorns,
  '6-3': abyssalConveyor,
  '6-4': demonCurrent,
  '6-5': finalSynthesis,
  '6-6': abyssQueenDuel,
} as const satisfies Record<string, StageData>

export type StageId = keyof typeof stages

export function getNextStageId(id: StageId): StageId | undefined {
  const ids = Object.keys(stages) as StageId[]
  return ids[ids.indexOf(id) + 1]
}

export function selectStage(id: StageId): StageData {
  const stage = structuredClone(stages[id])
  validateStage(stage)
  return stage
}

export { validateStage }

for (const stage of Object.values(stages)) validateStage(stage)
