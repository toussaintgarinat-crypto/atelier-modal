// Entry point of the OpenStand engine bundle used by Atelier modal.
// Exposes the accompaniment engine on window.OpenStand; the interface lives in ../bande.js.
import { Player } from './audio/player'
import { arrange, BASE_BPM } from './engine/arrange'
import { chorusTranspose, type Timeline } from './engine/timeline'
import { parseIrealLinks, unknownChords } from './formats/ireal'
import { irealLink } from './formats/irealWrite'
import { beatsPerBar, chartFromMeasures, playbackOrder, type Chart } from './music/chart'
import { parseChord, transposeChord } from './music/chords'
import { KEY_STEPS } from './music/practice'
import { getStyle, STYLES } from './styles'

export interface Position {
  measure: number // written bar index, -1 during the count-in and the ending bar
  chorus: number
  beatInBar: number
  countIn: number // 1, 2, 3… during the count-in, otherwise 0
  ending: boolean
  barBeats: number
  barNumber: number
}

// Where the band is at a given beat of the arrangement
export function positionAt(timeline: Timeline, beat: number): Position | null {
  if (beat < timeline.countIn) {
    return {
      measure: -1,
      chorus: 0,
      beatInBar: beat,
      countIn: timeline.clicks.findLast((c) => c.at <= beat + 1e-6)?.count ?? 1,
      ending: false,
      barBeats: timeline.countIn,
      barNumber: -1,
    }
  }
  const barNumber = timeline.bars.findLastIndex((b) => b.start <= beat)
  const bar = timeline.bars[barNumber]
  if (!bar) return null
  const chorus = timeline.slots.findLast((s) => s.start <= beat)?.chorus ?? 0
  return { measure: bar.measure, chorus, beatInBar: beat - bar.start, countIn: 0, ending: bar.measure === -1, barBeats: bar.beats, barNumber }
}

const OpenStand = {
  Player,
  arrange,
  BASE_BPM,
  positionAt,
  chorusTranspose,
  parseIrealLinks,
  irealLink,
  unknownChords,
  chartFromMeasures,
  playbackOrder,
  beatsPerBar,
  parseChord,
  transposeChord,
  KEY_STEPS,
  STYLES: STYLES.map((s) => ({ id: s.id, name: s.name })),
  getStyle,
}

export type { Chart }
;(globalThis as unknown as { OpenStand: typeof OpenStand }).OpenStand = OpenStand
