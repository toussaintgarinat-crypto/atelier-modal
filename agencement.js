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

const _renderTop = renderTop;
renderTop = function () {
  _renderTop();
  $("tabs").innerHTML = GROUPS.map(([nom, tabs]) =>
    `<span class="tabgrp">${nom}</span>` +
    tabs.map(([k, t]) => `<button class="${S.tab === k ? "on" : ""}" data-act="tab" data-v="${k}">${t}</button>`).join("")
  ).join("");
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

const _render = render;
render = function () {
  _render.apply(this, arguments);
  if (S.tab !== "song") return;
  const p = $("panel"); if (!p) return;
  [...p.children].forEach(c => {
    if (!c.classList.contains("card")) return;
    const h = c.querySelector(":scope > h2"); if (!h) return;
    const key = FOLD.find(f => h.textContent.replace(/^[^A-Za-zÉé]+/, "").startsWith(f));
    if (key) fold(c, key);
  });
};

if (typeof renderTop === "function") { try { render(); } catch (e) { /* premier rendu déjà fait par app.js */ } }
})();
