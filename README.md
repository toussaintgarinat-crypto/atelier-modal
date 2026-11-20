# Atelier modal — solfège & improvisation (piano / guitare)

**Atelier modal** est une application web (installable, utilisable hors ligne) pour apprendre la
théorie modale et travailler l'improvisation sur piano et guitare. Elle fonctionne sans serveur ni
dépendance : du HTML, du CSS et du JavaScript pur. Interface en français.

La page [Pourquoi Atelier modal ?](pourquoi.html) résume la proposition de valeur en un coup d'œil.

## Ce que fait l'application

### Explorer les gammes et les modes
- Choisis une tonalité (majeure ou mineure) et visualise la gamme sur un **clavier de piano** et un
  **manche de guitare** (vue piano, guitare ou duo), avec diagrammes d'accords pour la guitare.
- Onglet **Modes** : lydien, ionien, mixolydien, dorien, éolien, etc., ainsi que les gammes mineure
  mélodique, mineure harmonique et blues. Chaque mode indique sa **note caractéristique** et un
  conseil d'improvisation pour le faire sonner.
- Notation au choix : **Do Ré Mi**, **C D E** ou **degrés** (1, ♭3, 5…).

### Comprendre l'harmonie
- Onglet **Harmonie** : accords de la tonalité (triades, septièmes), accords par tonalité,
  cycle des quartes, substitutions et explications du « pourquoi » d'un enchaînement.
- Écoute des accords en **plaqué, arpège** ou accords tenus, avec exploration libre.

### Jouer sur des grilles d'accords
- Onglet **Grilles** : progressions prêtes à l'emploi (Pop/Rock I-V-vi-IV, Soul I-vi-ii-V, vamps
  dorien et lydien…) lues en **boucle** avec synthèse sonore intégrée (aucun fichier audio).
- Change la couleur d'un accord sur place, vois quelle gamme jouer dessus, et improvise par-dessus.

### Créer et gérer ses morceaux
- Onglet **Morceaux** : crée tes propres morceaux, section par section, avec accords écrits en degrés,
  donc **transposables** d'un clic (par demi-ton, carte « Transposer ») et **modulables par section**
  (chaque section peut avoir sa propre tonalité, par demi-tons ou en choisissant la tonalité).
- **Zoom des sections** (grille et portée) et saisie ligne par ligne, « système par système ».
- **Voix « Thème »** : une mélodie par section, jouée par-dessus les accords.
  - Saisie **en touchant la portée**, avec un **clavier à l'écran flottant** et déplaçable (durées,
    silences, curseur, effacement, touches noires, notes empilées pour écrire des accords).
  - **Clic droit ou appui long** pour retirer une note ; saisie texte possible (`G4:3 Bb4:1 | …`).
  - Une mesure est ajoutée automatiquement en fin de section ; accords proposés pour la mesure.
- **Plusieurs voix par section** : contrechant, basse, instruments, chacune sur sa **portée** avec la
  clé de ton choix (Sol, Fa, Ut 3, Ut 4) et son instrument. Les accords s'écrivent au-dessus de la
  portée du thème (ou sur une portée d'accords à part, façon recueil de jazz).
- **Outil Arranger** : répartir les accords sur des mesures, **harmoniser le thème**, échanger les lignes
  entre portées.
- **Playlists** de morceaux et de partitions : lecture enchaînée, tonalité de lecture au choix,
  **renommage** d'un élément directement depuis la liste.
- **Extraits** : envoie vers une playlist des mesures d'un morceau ou une zone découpée d'une photo.

### Partition imprimable et export par instrument
- **Export PDF / impression** d'un morceau : accords, thème, tonalité de chaque section.
- **Export d'une partie par instrument** (avec les accords) : choisis la portée, la première et la
  dernière mesure, ou le morceau en entier.

### Analyser une partition ou une grille
- **Analyse par photo** : prends en photo une grille d'accords ; un modèle de vision (via
  [OpenRouter](https://openrouter.ai), avec ta propre clé, stockée seulement sur ton appareil) lit les
  accords. Lecture automatique si la clé est réglée, résultat analysé **accord par accord**.
- Saisie manuelle possible, sans aucune clé. Un bouton photo dans Morceaux mène directement à l'analyse,
  et le résultat peut être enregistré, joué dans une autre tonalité ou partagé.

### Partitions (photos et PDF)
- Onglet **Partitions** : garde tes photos et PDF tels quels, séparés des morceaux.
- **Visionneuse PDF** page par page, accès direct à une page, défilement pendant le découpage.
- **Découpage** d'une zone (photo ou PDF) pour en extraire une partie, ajoutable à une playlist.
- Ouvrir, renommer, partager (menu de partage du téléphone), télécharger, supprimer.
- Les fichiers restent **sur l'appareil** (IndexedDB), jamais envoyés ailleurs.

### Partager et sauvegarder
- **Partage** d'un morceau par **QR code ou lien**, et réception (scan, collage d'un lien, import).
- **Sauvegarde ZIP ou dossier** (clé USB, mail…) avec **import** : morceaux, playlists, partitions.
- **Google Drive** (accès limité aux fichiers créés par l'application, portée `drive.file`) :
  - sauvegarde **sélective** (tu choisis ce qui part) ;
  - partitions écrites en **PDF**, **un PDF par instrument, avec les accords** ;
  - partitions récupérées **à la demande**.

## Confidentialité
Tout est stocké localement dans le navigateur. Les seules communications externes sont optionnelles :
l'analyse par photo (OpenRouter) et la sauvegarde Google Drive, toutes deux à ton initiative.

## Installation et utilisation

1. **Tout de suite, sans internet** : double-clique sur `index.html`. L'application s'ouvre dans le
   navigateur (ordinateur, tablette, téléphone) et fonctionne hors ligne, son compris.
2. **En application web installable** : héberge le dossier sur un service statique gratuit (Vercel,
   Netlify Drop, Cloudflare Pages, GitHub Pages), puis ouvre le lien :
   - iPhone / iPad (Safari) : Partager > « Sur l'écran d'accueil » ;
   - Android (Chrome) : menu > « Installer l'application » ;
   - Windows / Mac / Linux (Chrome ou Edge) : icône d'installation dans la barre d'adresse.

   (L'installation nécessite une adresse https ; un fichier ouvert en local n'est pas « installable ».)
3. **Applications natives (optionnel)** : le dossier peut être emballé avec Capacitor (iOS / Android)
   ou Tauri / Electron (Windows / Mac / Linux).

## Structure du projet

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css` | page et styles |
| `pourquoi.html` | page « Pourquoi Atelier modal ? » |
| `app.js` | cœur : théorie (gammes, modes, accords), instruments, lecture audio, grilles |
| `analyse.js` | analyse par photo / saisie manuelle, playlists |
| `transpose.js`, `modul.js` | transposition et modulation par section |
| `melody.js` | voix « Thème » : saisie de mélodie, harmonisation, export |
| `partitions.js` | onglet Partitions (photos / PDF) |
| `share.js`, `qrcode.js` | partage par lien et QR code |
| `sauvegarde.js` | sauvegarde ZIP et Google Drive |
| `manifest.webmanifest`, `sw.js`, `icons/` | installation et mode hors ligne |
| `vercel.json` | en-têtes pour l'hébergement Vercel |
