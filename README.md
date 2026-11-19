# Atelier modal — solfège & improvisation (piano / guitare)

**Atelier modal** est une application web (installable, utilisable hors ligne) pour apprendre la
théorie modale et travailler l'improvisation sur piano et guitare. Elle fonctionne sans serveur ni
dépendance : du HTML, du CSS et du JavaScript pur. Interface en français.

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
  donc **transposables** d'un clic (par demi-ton) et **modulables par section**.
- **Voix « Thème »** : écris une mélodie (portées, clés, saisie par clavier ou en texte), puis
  **harmonise-la** ; exporte le thème ou un morceau entier.
- **Playlists** de morceaux et lecture enchaînée.

### Analyser une partition ou une grille
- **Analyse par photo** : prends en photo une grille d'accords ; un modèle de vision (via
  [OpenRouter](https://openrouter.ai), avec ta propre clé, stockée seulement sur ton appareil) lit les
  accords et en fait un morceau analysé accord par accord.
- Saisie manuelle possible, sans aucune clé.

### Partitions (photos et PDF)
- Onglet **Partitions** : garde tes photos et PDF tels quels, avec visionneuse, pages et découpe d'une
  zone à extraire. Les fichiers restent **sur l'appareil** (IndexedDB), jamais envoyés ailleurs.

### Partager et sauvegarder
- **Partage** d'un morceau par **QR code ou lien**, et réception d'un morceau reçu.
- **Sauvegarde** en fichier **ZIP** (morceaux, playlists, partitions) ou sur **Google Drive** (accès
  limité aux fichiers créés par l'application).

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
| `app.js` | cœur : théorie (gammes, modes, accords), instruments, lecture audio, grilles |
| `analyse.js` | analyse par photo / saisie manuelle, playlists |
| `transpose.js`, `modul.js` | transposition et modulation par section |
| `melody.js` | voix « Thème » : saisie de mélodie, harmonisation, export |
| `partitions.js` | onglet Partitions (photos / PDF) |
| `share.js`, `qrcode.js` | partage par lien et QR code |
| `sauvegarde.js` | sauvegarde ZIP et Google Drive |
| `manifest.webmanifest`, `sw.js`, `icons/` | installation et mode hors ligne |
| `vercel.json` | en-têtes pour l'hébergement Vercel |
