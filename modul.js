/* Atelier modal — modulation par section : chaque section peut être jouée dans une autre tonalité.
   Les accords restent écrits en degrés ; une section décalée de n demi-tons est simplement épelée
   et jouée à partir d'une tonique décalée. Chargé après transpose.js. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const { shiftTon } = window.__tr;
let depth = 0;
const shiftOf = si => { const s = S.song.sections[si]; return s ? (s.shift | 0) : 0; };
function withSec(si, fn) {
  const sh = shiftOf(si);
  if (!sh || depth > 0) return fn();
  const bt = S.tonic, bd = S.dict;
  depth++; S.tonic = S.dict = shiftTon(bt, sh);
  try { return fn(); } finally { S.tonic = bt; S.dict = bd; depth--; }
}
const keyWord = () => S.song.mode === "min" ? "mineur" : "majeur";
const keyName = n => nmN(shiftTon(S.tonic, n)) + " " + keyWord();

/* --- affichage et lecture : on décale la tonique le temps de l'appel --- */
const _barCell = barCell, _renderPicker = renderPicker, _renderInst = renderInstruments, _curView = curView, _audition = auditionChord, _songTick = songTick;
barCell = (e, t, n) => withSec(t, () => _barCell(e, t, n));
renderPicker = () => withSec(S.sel.si, () => _renderPicker());
renderInstruments = () => S.tab === "song" ? withSec(S.sel.si, () => _renderInst()) : _renderInst();
curView = () => S.tab === "song" ? withSec(S.sel.si, () => _curView()) : _curView();
auditionChord = e => withSec(S.sel.si, () => _audition(e));
songTick = function () {
  let si;
  if (P.pulse === 0) { let t = P.i + 1; if (t >= P.seq.length) t = 0; si = P.seq[t] && P.seq[t].si; }
  else si = P.seq[P.i] && P.seq[P.i].si;
  return withSec(si, () => _songTick());
};

/* --- interface : une ligne « Tonalité » sous chaque section --- */
function setShift(si, n) {
  const s = S.song.sections[si]; if (!s) return;
  n = mod(n, 12); if (n > 6) n -= 12;
  if (n) s.shift = n; else delete s.shift;
  persist(); render();
}
const _renderSong = renderSong;
renderSong = function () {
  _renderSong();
  document.querySelectorAll('#panel input[data-act="secname"]').forEach(inp => {
    if (inp.closest(".card").querySelector(".secmod")) return;
    const si = +inp.dataset.si, sh = shiftOf(si), card = inp.closest(".card");
    const row = document.createElement("div");
    row.className = "tr secmod"; row.style.marginTop = "8px";
    row.innerHTML = `<span class="muted">Tonalité</span><button class="btn sm sec" data-act="sm-dn" data-si="${si}" title="Un demi-ton plus bas">− ½</button>
     <select data-act="sm-key" data-si="${si}" style="flex:1">${Array.from({ length: 12 }, (_, k) => `<option value="${k}" ${mod(sh, 12) === k ? "selected" : ""}>${k === 0 ? "Celle du morceau (" + esc(keyName(0)) + ")" : esc(keyName(k))}</option>`).join("")}</select>
     <button class="btn sm sec" data-act="sm-up" data-si="${si}" title="Un demi-ton plus haut">+ ½</button>`;
    card.appendChild(row);
    if (sh) { const h = document.createElement("div"); h.className = "muted"; h.textContent = "Cette section est jouée en " + keyName(sh) + (sh > 0 ? " (+" : " (−") + Math.abs(sh) + " demi-ton" + (Math.abs(sh) > 1 ? "s" : "") + ")."; card.appendChild(h); }
  });
};
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t) return;
  const si = +t.dataset.si;
  if (t.dataset.act === "sm-dn") setShift(si, shiftOf(si) - 1);
  else if (t.dataset.act === "sm-up") setShift(si, shiftOf(si) + 1);
});
document.addEventListener("change", ev => {
  const t = ev.target; if (t.dataset && t.dataset.act === "sm-key") setShift(+t.dataset.si, +t.value);
});
if (S.tab === "song") render();
})();
