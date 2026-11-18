/* Atelier modal — transposition d'un morceau (changer de tonalité). Chargé après analyse.js. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const { shiftTon, setTon } = window.__tr;
const KEYS = [0, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13];           // une pastille par demi-ton
const pcOf = a => TON[a].pc;
const label = t => nmN(t) + " " + (S.song.mode === "min" ? "mineur" : "majeur");

function origin() { const o = S.song.orig && TON.find(t => t.l === S.song.orig[0] && t.a === S.song.orig[1]); return o || null; }
function diff() { const o = origin(); if (!o) return 0; let d = mod(S.tonic.pc - o.pc, 12); return d > 6 ? d - 12 : d; }
function apply(t) {
  if (!S.song.orig) S.song.orig = [S.tonic.l, S.tonic.a];
  setTon(t); persist(); render();
}
window.__transpose = { apply, diff };

const _renderSong = renderSong;
renderSong = function () {
  _renderSong();
  const p = $("panel"); if (!p || $("trcard")) return;
  const d = diff(), o = origin();
  const c = document.createElement("div"); c.className = "card"; c.id = "trcard";
  c.innerHTML = `<h2>Transposer</h2>
   <div class="tr"><button class="btn sm sec" data-act="tr-dn" title="Un demi-ton plus bas">− ½ ton</button>
    <select data-act="tr-key" style="flex:1">${KEYS.map(i => `<option value="${i}" ${pcOf(i) === S.tonic.pc ? "selected" : ""}>${esc(nmN(TON[i]))} ${S.song.mode === "min" ? "mineur" : "majeur"}</option>`).join("")}</select>
    <button class="btn sm sec" data-act="tr-up" title="Un demi-ton plus haut">+ ½ ton</button></div>
   <div class="tr" style="margin-top:8px"><button class="btn sm sec" data-act="tr-by" data-v="-5">Quarte ↓</button><button class="btn sm sec" data-act="tr-by" data-v="5">Quarte ↑</button><button class="btn sm sec" data-act="tr-by" data-v="7">Quinte ↑</button>
    ${o && d ? `<button class="btn sm" data-act="tr-orig">↺ Origine (${esc(nmN(o))})</button>` : ""}</div>
   <div class="muted" style="margin-top:6px">${d ? (d > 0 ? "+" : "−") + Math.abs(d) + " demi-ton" + (Math.abs(d) > 1 ? "s" : "") + " par rapport à la tonalité d’origine." : "Tout le morceau est transposé : accords, grille, piano, guitare et lecture."}</div>`;
  p.insertBefore(c, p.children[1] || null);
};

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t) return;
  switch (t.dataset.act) {
    case "tr-dn": apply(shiftTon(S.tonic, -1)); break;
    case "tr-up": apply(shiftTon(S.tonic, 1)); break;
    case "tr-by": apply(shiftTon(S.tonic, +t.dataset.v)); break;
    case "tr-orig": { const o = origin(); if (o) { setTon(o); persist(); render(); } break; }
  }
});
document.addEventListener("change", ev => {
  const t = ev.target; if (!t.dataset || t.dataset.act !== "tr-key") return;
  const k = TON[+t.value]; if (k && k.pc !== S.tonic.pc) apply(k);
});
if (S.tab === "song") render();
})();
