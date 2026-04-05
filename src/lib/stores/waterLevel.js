import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: waterLevelRaw, cleanup: cleanupWaterLevel } = createSocket(WS_BASE, '/machine/waterLevels')

export { waterLevelRaw, cleanupWaterLevel }

// DE1 water tank mm-to-ml lookup table (from CAD measurements by Mark Kelly)
// Index = mm, Value = ml
const MM_TO_ML = [
  0, 16, 43, 70, 97, 124, 151, 179, 206, 233, 261, 288, 316, 343, 371, 398, 426, 453, 481,
  509, 537, 564, 592, 620, 648, 676, 704, 732, 760, 788, 816, 844, 872, 900, 929, 957,
  985, 1013, 1042, 1070, 1104, 1138, 1172, 1207, 1242, 1277, 1312, 1347, 1382, 1417,
  1453, 1488, 1523, 1559, 1594, 1630, 1665, 1701, 1736, 1772, 1808, 1843, 1879, 1915,
  1951, 1986, 2022, 2058,
]

// Full tank reference point: 40mm (from de1app machine.tcl)
const FULL_POINT_MM = 40
const FULL_POINT_ML = MM_TO_ML[FULL_POINT_MM] ?? 1104

function mmToMl(mm) {
  const idx = Math.max(0, Math.min(MM_TO_ML.length - 1, Math.floor(mm)))
  return MM_TO_ML[idx]
}

function mmToPercent(mm) {
  const ml = mmToMl(mm)
  return Math.min(100, Math.round((ml / FULL_POINT_ML) * 100))
}

export const waterLevel = derived(waterLevelRaw, ($raw) => {
  if (!$raw) {
    return { connected: false, mm: 0, ml: 0, percent: 0, refillMm: 0, needsRefill: false }
  }
  const mm = $raw.currentLevel ?? 0
  const refillMm = $raw.refillLevel ?? 0
  return {
    connected: true,
    mm,
    ml: mmToMl(mm),
    percent: mmToPercent(mm),
    refillMm,
    needsRefill: mm <= refillMm && refillMm > 0,
  }
})
