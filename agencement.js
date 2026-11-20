/* Atelier modal — agencement de l'interface (chargé en dernier).
   1) Navigation en deux groupes : « Apprendre » (Modes, Harmonie, Grilles) et « Ma musique »
      (Morceaux, Partitions, Analyse, Playlist).
   2) Barre du haut (instrument, notation, tonalités) masquée là où elle ne sert pas.
   3) Écran Morceaux : les cartes secondaires (transposer, partager, Drive…) sont repliées. */
(function () {
"use strict";
const $ = id => document.getElementById(id);

const GROUPS = [
  ["Apprendre", [["modes", "Modes"], ["harm", "Harmonie"], ["grid", "Grilles"]]],
  ["Ma musique", [["song", "Morceaux"], ["scores", "Partitions"], ["analyse", "Analyse"], ["playlist", "Playlist"]]]
];
const NO_TOP = ["scores", "analyse", "playlist"];                 // onglets où instrument / tonalité ne servent pas
const FOLD = ["Transposer", "Envoyer / recevoir", "Google Drive", "Écrire le thème en texte"]; // cartes repliables de Morceaux
const opened = new Set();                                          // cartes que l'utilisateur a ouvertes

/* Bandeau réduit : deux boutons de groupe ; un appui déroule les onglets du groupe. */
let openGrp = -1;
function drawNav() {
  const nav = $("tabs"); if (!nav) return;
  const gi = GROUPS.findIndex(([, tabs]) => tabs.some(([k]) => k === S.tab));
  const head = GROUPS.map(([nom, tabs], i) => {
    const cur = (tabs.find(([k]) => k === S.tab) || [])[1];
    return `<button class="grp ${i === gi ? "on" : ""} ${i === openGrp ? "open" : ""}" data-grp="${i}">${nom}${cur ? ` · <b>${cur}</b>` : ""} <span>${i === openGrp ? "▴" : "▾"}</span></button>`;
  }).join("");
  const sub = openGrp >= 0
    ? `<div class="subtabs">${GROUPS[openGrp][1].map(([k, t]) => `<button class="${S.tab === k ? "on" : ""}" data-act="tab" data-v="${k}">${t}</button>`).join("")}</div>`
    : "";
  nav.innerHTML = `<div class="grps">${head}</div>${sub}`;
}
document.addEventListener("click", ev => {
  const g = ev.target.closest("[data-grp]");
  if (g) { const i = +g.dataset.grp; openGrp = openGrp === i ? -1 : i; drawNav(); return; }
  if (ev.target.closest("#tabs [data-act=tab]")) openGrp = -1;   // l'onglet choisi re-dessine le bandeau, refermé
}, true);

const _renderTop = renderTop;
renderTop = function () {
  _renderTop();
  drawNav();
  const top = $("top"); if (top) top.style.display = NO_TOP.includes(S.tab) ? "none" : "";
};

/* Replie une carte : son titre devient le résumé d'un <details>. */
function fold(card, key) {
  const h = card.querySelector(":scope > h2"); if (!h) return;
  const d = document.createElement("details");
  d.className = "card fold"; d.dataset.fold = key; d.open = opened.has(key);
  const s = document.createElement("summary"); s.textContent = h.textContent;
  d.appendChild(s); h.remove();
  while (card.firstChild) d.appendChild(card.firstChild);
  card.replaceWith(d);
  d.addEventListener("toggle", () => { d.open ? opened.add(key) : opened.delete(key); });
}

function arrange() {
  if (S.tab !== "song") return;
  const p = $("panel"); if (!p) return;
  [...p.children].forEach(c => {
    if (!c.classList.contains("card")) return;
    const h = c.querySelector(":scope > h2"); if (!h) return;
    const key = FOLD.find(f => h.textContent.replace(/^[^A-Za-zÉé]+/, "").startsWith(f));
    if (key) fold(c, key);
  });
  /* Carte « Mesure » : les deux longues listes d'idées d'accords sont repliées (ouvertes seulement à la demande). */
  p.querySelectorAll("details:not(.fold):not([data-arr])").forEach(d => {
    const t = (d.querySelector("summary") || {}).textContent || "";
    const key = /Enchaînements classiques/.test(t) ? "Enchaînements" : /Changer de couleur/.test(t) ? "Couleur" : null;
    if (!key) return;
    d.dataset.arr = key; d.open = opened.has(key);
    d.addEventListener("toggle", () => { d.open ? opened.add(key) : opened.delete(key); });
  });
}

const _render = render, _renderSong = renderSong, _renderPicker = renderPicker;
render = function () { _render.apply(this, arguments); arrange(); };
renderSong = function () { _renderSong.apply(this, arguments); arrange(); };
renderPicker = function () { _renderPicker.apply(this, arguments); arrange(); };

if (typeof renderTop === "function") { try { render(); } catch (e) { /* premier rendu déjà fait par app.js */ } }
})();
