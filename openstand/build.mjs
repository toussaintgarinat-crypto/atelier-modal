// Bundles the OpenStand engine into ../vendor/openstand.js (a classic script exposing window.OpenStand)
// and copies the synthesizer's audio processor next to it. The sound bank (vendor/openstand.sf3)
// comes from OpenStand and is committed as is.
import { build } from 'esbuild'
import { copyFileSync, mkdirSync } from 'node:fs'

mkdirSync('../vendor', { recursive: true })
const result = await build({
  entryPoints: ['src/entry.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  minify: true,
  legalComments: 'none',
  banner: { js: '/* OpenStand engine — AGPL-3.0-or-later — https://github.com/canbmaj7/openstand — bundled for Atelier modal */' },
  outfile: '../vendor/openstand.js',
  metafile: true,
  logLevel: 'info',
})
copyFileSync('node_modules/spessasynth_lib/dist/spessasynth_processor.min.js', '../vendor/spessasynth_processor.min.js')
const used = Object.keys(result.metafile.inputs).filter((f) => f.startsWith('src/'))
console.log('sources used:', used.length)
console.log(used.join('\n'))
