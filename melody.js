/* Atelier modal — voix « Thème » : une mélodie par section, jouée par-dessus les accords.
   Une note = [mesure, pulsation de départ, durée en pulsations, d, s, o] (1 pulsation = 1 croche).
   Comme les accords, la hauteur est stockée RELATIVE à la tonique (d = degré, s = demi-tons, o = octave) :
   la transposition et la modulation par section s'appliquent donc toutes seules. Chargé après modul.js. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const { shiftTon } = window.__tr;
const FR_N = { do: 0, re: 1, "ré": 1, mi: 2, fa: 3, sol: 4, la: 5, si: 6 }, EN_N = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
const shiftOf = sec => (sec && sec.shift | 0);
const refOf = t => 60 + (t.pc > 6 ? t.pc - 12 : t.pc);          // do central de la tonalité courante
const midiOf = (t, n) => refOf(t) + n[4] + 12 * n[5];
const perBar = () => SE[S.song.sig] || 8;

/* ---------- texte <-> notes ---------- */
function noteName(t, n) {
  const sp = spell(t, n[3], n[4]), m = midiOf(t, n);
  const L0 = "fr" === S.nota ? FR[L[sp.l]] : L[sp.l];
  return L0 + (sp.a > 0 ? "#".repeat(sp.a) : sp.a < 0 ? "b".repeat(-sp.a) : "") + (Math.floor(m / 12) - 1);
}
function toText(sec) {
  const nb = sec.bars.length, ppb = perBar(), mel = sec.mel || [];
  const lines = [];
  for (let b = 0; b < nb; b++) {
    const ns = mel.filter(n => n[0] === b).sort((x, y) => x[1] - y[1]);
    const out = []; let at = 0;
    ns.forEach(n => {
      if (n[1] > at) out.push("r:" + (n[1] - at));
      out.push(noteName(S.tonic, n) + ":" + n[2]); at = n[1] + n[2];
    });
    if (at < ppb) out.push("r:" + (ppb - at));
    lines.push(out.join(" "));
  }
  return lines.join(" | ");
}
function parseNote(tok, tonic) {
  const m = /^([A-Ga-g]|Do|do|Ré|ré|Re|re|Mi|mi|Fa|fa|Sol|sol|La|la|Si|si)([#♯b♭]*)(-?\d)?$/.exec(tok);
  if (!m) return null;
  const key = m[1].toLowerCase(), l = key in FR_N ? FR_N[key] : EN_N[key];
  let a = 0; for (const c of m[2]) a += (c === "#" || c === "♯") ? 1 : -1;
  const oct = m[3] === undefined ? 4 : +m[3], pc = mod(NAT[l] + a, 12);
  const abs = 12 * (oct + 1) + NAT[l] + a, s = mod(pc - tonic.pc, 12);
  const o = Math.round((abs - refOf(tonic) - s) / 12);
  if (Math.abs(o) > 3) return null;
  return { d: mod(l - tonic.l, 7), s, o };
}
function fromText(text, nbars) {
  const ppb = perBar(), bars = text.split("|").map(x => x.trim()), notes = [], errs = [];
  bars.forEach((txt, b) => {
    let at = 0;
    txt.split(/\s+/).filter(Boolean).forEach(tok => {
      const [p, ln] = tok.split(":"), len = ln === undefined ? 2 : parseInt(ln, 10);
      if (!(len >= 1 && len <= 32)) { errs.push(`mesure ${b + 1} : durée illisible « ${tok} »`); return; }
      if (/^[rRzZ-]$/.test(p) || /^(silence|s)$/i.test(p)) { at += len; return; }
      const nt = parseNote(p, S.tonic);
      if (!nt) { errs.push(`mesure ${b + 1} : note illisible « ${tok} »`); at += len; return; }
      if (b >= nbars) { errs.push(`mesure ${b + 1} : la section n’a que ${nbars} mesure(s)`); return; }
      notes.push([b, at, len, nt.d, nt.s, nt.o]); at += len;
    });
    if (at > ppb && b < nbars) errs.push(`mesure ${b + 1} : ${at} croches au lieu de ${ppb}`);
  });
  return { notes, errs };
}

/* ---------- affichage : mini « piano roll » ---------- */
function roll(sec) {
  const mel = (sec.mel || []).filter(n => n[0] < sec.bars.length);
  if (!mel.length) return `<div class="muted">Pas encore de thème pour cette section.</div>`;
  const nb = sec.bars.length, ppb = perBar(), W = 320, H = 70, bw = W / nb;
  const ms = mel.map(n => midiOf(S.tonic, n)), lo = Math.min(...ms) - 1, hi = Math.max(...ms) + 1, st = (H - 6) / Math.max(6, hi - lo);
  let g = "";
  for (let b = 0; b <= nb; b++) g += `<line x1="${(b * bw).toFixed(1)}" x2="${(b * bw).toFixed(1)}" y1="0" y2="${H}" stroke="currentColor" opacity=".25"/>`;
  mel.forEach((n, i) => {
    const x = n[0] * bw + n[1] / ppb * bw, w = Math.max(2, n[2] / ppb * bw - 1), y = H - 3 - (ms[i] - lo) * st - st;
    g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(3, st).toFixed(1)}" rx="1.5" fill="currentColor" opacity=".85"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;color:var(--accent,#4cc9f0)" role="img" aria-label="Thème de la section">${g}</svg>`;
}

const _renderSong = renderSong;
renderSong = function () {
  _renderSong();
  document.querySelectorAll('#panel input[data-act="secname"]').forEach(inp => {
    const card = inp.closest(".card"); if (card.querySelector(".themecard")) return;
    const si = +inp.dataset.si, sec = S.song.sections[si]; if (!sec) return;
    const d = document.createElement("div"); d.className = "themecard"; d.style.marginTop = "10px";
    const has = sec.mel && sec.mel.length;
    d.innerHTML = `<div class="tr"><b>Thème</b>
      <span class="muted" style="flex:1">${has ? sec.mel.length + " notes" : "mélodie à ajouter"}</span>
      ${has ? `<button class="btn sm sec" data-act="mel-clear" data-si="${si}">Effacer</button>` : ""}</div>
     ${roll(sec)}
     <details ${has ? "" : "open"}><summary>Écrire / corriger le thème</summary>
      <div class="muted" style="margin:6px 0">Une mesure entre « | ». Chaque note : nom + octave + « : » + durée en croches (<code>Eb5:2</code>, noire = 2, blanche = 4). Silence : <code>r:2</code>. Écris Do/Ré/Mi ou C/D/E, avec # ou b.</div>
      <textarea id="mel-t${si}" rows="4" style="width:100%" spellcheck="false" placeholder="r:1 G4:3 G4:2 Bb4:1 C5:1 | …">${esc(toText(sec))}</textarea>
      <div class="tr" style="margin-top:6px"><button class="btn sm" data-act="mel-apply" data-si="${si}">Appliquer</button>
       <span class="muted" id="mel-m${si}"></span></div></details>`;
    card.appendChild(d);
  });
  const e = S.song;
  const hdr = document.querySelector('#panel [data-act="splay"]');
  if (hdr && !$("mel-voice") && e.sections.some(s => s.mel && s.mel.length)) {
    const b = document.createElement("button");
    b.id = "mel-voice"; b.className = "chip sm " + (e.melOff ? "" : "on2"); b.dataset.act = "mel-voice"; b.textContent = "Thème";
    hdr.parentNode.appendChild(b);
  }
};

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t || !/^mel-/.test(t.dataset.act)) return;
  const si = +t.dataset.si, sec = S.song.sections[si];
  if (t.dataset.act === "mel-voice") { S.song.melOff = !S.song.melOff; if (!S.song.melOff) delete S.song.melOff; persist(); render(); return; }
  if (!sec) return;
  if (t.dataset.act === "mel-clear") { delete sec.mel; persist(); render(); return; }
  if (t.dataset.act === "mel-apply") {
    const r = fromText($("mel-t" + si).value, sec.bars.length), msg = $("mel-m" + si);
    if (r.errs.length && !r.notes.length) { msg.textContent = r.errs[0]; return; }
    if (r.notes.length) sec.mel = r.notes; else delete sec.mel;
    persist(); render();
    const m2 = $("mel-m" + si); if (m2 && r.errs.length) { m2.textContent = r.errs.slice(0, 3).join(" · "); const dt = m2.closest("details"); if (dt) dt.open = true; }
  }
});

/* ---------- lecture : on joue le thème à chaque pulsation, par-dessus l'accompagnement ---------- */
const _songTick = songTick;
songTick = function () {
  const p0 = P.pulse;
  const r = _songTick.apply(this, arguments);
  try {
    if (!P.on || S.song.melOff) return r;
    const en = P.seq[P.i]; if (!en) return r;
    const sec = S.song.sections[en.si]; if (!sec || !sec.mel) return r;
    const hits = sec.mel.filter(n => n[0] === en.bi && n[1] === p0);
    if (!hits.length) return r;
    const t = shiftOf(sec) ? shiftTon(S.tonic, shiftOf(sec)) : S.tonic;
    hits.forEach(n => tone(midiOf(t, n), undefined, Math.max(.15, n[2] * 30 / S.song.bpm * .95), .09, "sawtooth"));
  } catch (x) { }
  return r;
};

window.__mel = { toText, fromText, midiOf };
if (S.tab === "song") render();
})();
