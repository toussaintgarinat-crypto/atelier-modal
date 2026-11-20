# Moteur d'accompagnement (OpenStand)

Ce dossier contient le moteur d'accompagnement d'[OpenStand](https://github.com/canbmaj7/openstand)
(commit `e44e389`, 11 novembre 2026), copié ici pour être utilisé par Atelier modal.

- **Licence : GNU AGPL v3 ou ultérieure**, comme OpenStand. Le texte est dans [`../LICENSE`](../LICENSE).
  Atelier modal est donc lui aussi distribué sous AGPL-3.0-or-later : toute personne qui utilise l'application en ligne
  peut en obtenir le code source (ce dépôt).
- Ce qui est repris : `src/engine` (basse, piano, batterie, grille de lecture, écriture MIDI), `src/music/chart.ts`,
  `src/music/chords.ts`, `src/music/practice.ts`, `src/styles` (8 styles), `src/formats/ireal*.ts` (import / export iReal Pro)
  et `src/audio/player.ts` (lecteur SoundFont). Seul `player.ts` a été modifié : les adresses de la banque de sons et du
  processeur audio sont lues depuis `vendor/` au lieu d'être fixes.
- `src/entry.ts` est le seul fichier ajouté : il expose le moteur sur `window.OpenStand`.
- Le moteur est empaqueté dans `../vendor/openstand.js` (le résultat est versionné, aucune étape de build n'est nécessaire
  pour héberger l'application). La banque de sons `../vendor/openstand.sf3` (GeneralUser GS, voir
  `GeneralUser-GS-LICENSE.txt`) et le processeur audio de SpessaSynth (Apache-2.0, voir `SpessaSynth-*-LICENSE.txt`) sont
  servis à côté.

## Reconstruire `vendor/openstand.js`

```bash
cd openstand
npm install
npm run build
```
