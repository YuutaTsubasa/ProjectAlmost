import { mkdir, writeFile } from 'node:fs/promises'

const rate = 44100
const out = new URL('../public/assets/audio/sfx/', import.meta.url)

const presets = {
  'ui-move': { duration: 0.08, notes: [620, 820], type: 'sine', gain: 0.22 },
  'ui-confirm': { duration: 0.18, notes: [520, 780, 1040], type: 'triangle', gain: 0.28 },
  'ui-back': { duration: 0.14, notes: [720, 480], type: 'sine', gain: 0.24 },
  coin: { duration: 0.24, notes: [880, 1320], type: 'sine', gain: 0.28 },
  death: { duration: 0.65, notes: [360, 180, 90], type: 'triangle', gain: 0.25, noise: 0.12 },
  checkpoint: { duration: 0.5, notes: [440, 660, 880, 1100], type: 'sine', gain: 0.3 },
  goal: { duration: 1.15, notes: [440, 660, 880, 1320], type: 'triangle', gain: 0.28 },
}

function wave(type, phase) {
  if (type === 'square') return Math.sign(Math.sin(phase))
  if (type === 'saw') return 2 * ((phase / (Math.PI * 2)) % 1) - 1
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase))
  return Math.sin(phase)
}

function render(preset) {
  const length = Math.floor(rate * preset.duration)
  const pcm = new Int16Array(length)
  let noiseState = 90210
  for (let i = 0; i < length; i += 1) {
    const t = i / rate
    const progress = i / length
    const noteIndex = Math.min(preset.notes.length - 1, Math.floor(progress * preset.notes.length))
    const frequency = preset.notes[noteIndex]
    const attack = Math.min(1, t / 0.012)
    const release = Math.pow(1 - progress, 2.2)
    noiseState = (noiseState * 1664525 + 1013904223) >>> 0
    const noise = (noiseState / 0xffffffff) * 2 - 1
    const tone = wave(preset.type, Math.PI * 2 * frequency * t)
    const shimmer = Math.sin(Math.PI * 2 * frequency * 2.01 * t) * 0.18
    const sample = (tone + shimmer + noise * (preset.noise ?? 0)) * preset.gain * attack * release
    pcm[i] = Math.max(-32767, Math.min(32767, Math.round(sample * 32767)))
  }
  return pcm
}

function wav(pcm) {
  const bytes = Buffer.alloc(44 + pcm.byteLength)
  bytes.write('RIFF', 0)
  bytes.writeUInt32LE(36 + pcm.byteLength, 4)
  bytes.write('WAVEfmt ', 8)
  bytes.writeUInt32LE(16, 16)
  bytes.writeUInt16LE(1, 20)
  bytes.writeUInt16LE(1, 22)
  bytes.writeUInt32LE(rate, 24)
  bytes.writeUInt32LE(rate * 2, 28)
  bytes.writeUInt16LE(2, 32)
  bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36)
  bytes.writeUInt32LE(pcm.byteLength, 40)
  Buffer.from(pcm.buffer).copy(bytes, 44)
  return bytes
}

await mkdir(out, { recursive: true })
await Promise.all(Object.entries(presets).map(([name, preset]) => writeFile(new URL(`${name}.wav`, out), wav(render(preset)))))
