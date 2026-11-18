ATELIER MODAL — solfège & improvisation (piano / guitare)

1) UTILISER TOUT DE SUITE (sans internet)
   Double-clique sur index.html : l'application s'ouvre dans ton navigateur
   (ordinateur, tablette, téléphone). Tout fonctionne hors ligne, le son aussi.
   Les morceaux sont enregistrés dans le navigateur de l'appareil.

2) EN APPLICATION WEB INSTALLABLE (tous supports)
   Mets le dossier entier sur un hébergement statique gratuit, par exemple :
   - Netlify Drop (app.netlify.com/drop) : glisse le dossier, tu obtiens un lien ;
   - Cloudflare Pages ou GitHub Pages.
   Ouvre ensuite le lien :
   - iPhone / iPad (Safari) : Partager > « Sur l'écran d'accueil » ;
   - Android (Chrome) : menu > « Installer l'application » ;
   - Windows / Mac / Linux (Chrome ou Edge) : icône d'installation dans la barre d'adresse.
   L'application s'ouvre alors en plein écran, avec son icône, et marche hors ligne.
   (Le mode installable nécessite une adresse https ; un fichier ouvert en local n'est pas « installable ».)

3) APPLICATIONS NATIVES (étape suivante, optionnelle)
   Ce dossier peut être emballé tel quel avec Capacitor (iOS / Android) ou Tauri / Electron
   (Windows / Mac / Linux) pour publier sur les stores.

CONTENU
   index.html            l'application (un seul fichier, aucune dépendance)
   manifest.webmanifest  description de l'application installable
   sw.js                 mode hors ligne
   icons/                icônes
