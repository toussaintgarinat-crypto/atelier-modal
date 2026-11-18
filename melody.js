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
const secTon = sec => shiftOf(sec) ? shiftTon(S.tonic, shiftOf(sec)) : S.tonic;   // tonique réellement jouée dans la section

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
      out.push(noteName(secTon(sec), n) + ":" + n[2]); at = n[1] + n[2];
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
function fromText(text, nbars, tonic) {
  const ppb = perBar(), bars = text.split("|").map(x => x.trim()), notes = [], errs = [];
  bars.forEach((txt, b) => {
    let at = 0;
    txt.split(/\s+/).filter(Boolean).forEach(tok => {
      const [p, ln] = tok.split(":"), len = ln === undefined ? 2 : parseInt(ln, 10);
      if (!(len >= 1 && len <= 32)) { errs.push(`mesure ${b + 1} : durée illisible « ${tok} »`); return; }
      if (/^[rRzZ-]$/.test(p) || /^(silence|s)$/i.test(p)) { at += len; return; }
      const nt = parseNote(p, tonic);
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
  const nb = sec.bars.length, ppb = perBar(), W = 320, H = 70, bw = W / nb, t = secTon(sec);
  const ms = mel.map(n => midiOf(t, n)), lo = Math.min(...ms) - 1, hi = Math.max(...ms) + 1, st = (H - 6) / Math.max(6, hi - lo);
  let g = "";
  for (let b = 0; b <= nb; b++) g += `<line x1="${(b * bw).toFixed(1)}" x2="${(b * bw).toFixed(1)}" y1="0" y2="${H}" stroke="currentColor" opacity=".25"/>`;
  mel.forEach((n, i) => {
    const x = n[0] * bw + n[1] / ppb * bw, w = Math.max(2, n[2] / ppb * bw - 1), y = H - 3 - (ms[i] - lo) * st - st;
    g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(3, st).toFixed(1)}" rx="1.5" fill="currentColor" opacity=".85"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;color:var(--accent,#4cc9f0)" role="img" aria-label="Thème de la section">${g}</svg>`;
}

/* ---------- éditeur : portée + clavier à l'écran ---------- */
/* Position = pulsation absolue dans la section (mesure × pulsations par mesure + pulsation). Saisie en « écrasement » :
   une note posée remplace ce qui occupait sa durée, puis le curseur avance. */
const ED = { si: -1, pos: 0, dur: 2, acc: "auto", base: 60 };
const DURS = [[1, "Croche"], [2, "Noire"], [3, "Noire ·"], [4, "Blanche"], [6, "Blanche ·"], [8, "Ronde"]], GLY = [8, 6, 4, 3, 2, 1];
const SHARP_POS = [8, 5, 9, 6, 3, 7, 4], FLAT_POS = [4, 7, 3, 6, 2, 5, 1];       // position des altérations à la clé (0 = ligne du bas)
const SHARP_L = [3, 0, 4, 1, 5, 2, 6], FLAT_L = [6, 2, 5, 1, 4, 0, 3];
const BW = 132, ROWH = 108, PER = 2, LINE = "#8b98a5", INK = "#e8eef4", GOLD = "#f5b13d";
const keyFifths = t => fifths(t) - (S.song.mode === "min" ? 3 : 0);
const yOf = (y0, pos) => y0 + 72 - 4 * pos;

const toAbs = sec => { const ppb = perBar(); return (sec.mel || []).map(n => ({ a: n[0] * ppb + n[1], n: n[2], d: n[3], s: n[4], o: n[5] })); };
function fromAbs(sec, list) {
  const ppb = perBar(), total = sec.bars.length * ppb;
  list = list.filter(x => x.a < total && x.n >= 1).sort((x, y) => x.a - y.a);
  sec.mel = list.map(x => [Math.floor(x.a / ppb), x.a % ppb, Math.min(x.n, 32), x.d, x.s, x.o]);
  if (!sec.mel.length) delete sec.mel;
}
function clearRange(list, pos, end) {
  const out = [];
  list.forEach(x => {
    const e = x.a + x.n;
    if (e <= pos || x.a >= end) { out.push(x); return; }
    if (x.a < pos) out.push(Object.assign({}, x, { n: pos - x.a }));
    if (e > end) out.push(Object.assign({}, x, { a: end, n: e - end }));
  });
  return out;
}
function putNote(sec, rel, len) {
  const total = sec.bars.length * perBar(), pos = ED.pos;
  if (pos >= total) return;
  len = Math.min(len, total - pos);
  const list = clearRange(toAbs(sec), pos, pos + len);
  if (rel) list.push({ a: pos, n: len, d: rel.d, s: rel.s, o: rel.o });
  fromAbs(sec, list); ED.pos = pos + len;
}
function backspace(sec) {
  const list = toAbs(sec), pos = ED.pos; let prev = null;
  list.forEach(x => { if (x.a < pos && (!prev || x.a > prev.a)) prev = x; });
  if (!prev) { ED.pos = 0; return; }
  const e = prev.a + prev.n;
  if (e >= pos) { fromAbs(sec, list.filter(x => x !== prev)); ED.pos = prev.a; } else ED.pos = e;
}
function relOf(t, m) {
  const pc = m % 12, WH = { 0: [0, 0], 2: [1, 0], 4: [2, 0], 5: [3, 0], 7: [4, 0], 9: [5, 0], 11: [6, 0] };
  let l, a;
  if (pc in WH) [l, a] = WH[pc];
  else {
    const sharp = ED.acc === "#" || (ED.acc === "auto" && keyFifths(t) > 0);
    [l, a] = (sharp ? { 1: [0, 1], 3: [1, 1], 6: [3, 1], 8: [4, 1], 10: [5, 1] } : { 1: [1, -1], 3: [2, -1], 6: [4, -1], 8: [5, -1], 10: [6, -1] })[pc];
  }
  const s = mod(pc - t.pc, 12);
  return { d: mod(l - t.l, 7), s, o: (m - refOf(t) - s) / 12 };
}
const split = (a, n, ppb) => {          // coupe une durée aux barres de mesure puis en valeurs écrites
  const out = [];
  while (n > 0) {
    let seg = Math.min(n, ppb - a % ppb);
    while (seg > 0) { const g = GLY.find(x => x <= seg); out.push({ a, g }); a += g; n -= g; seg -= g; }
  }
  return out;
};
function drawRest(x, y0, g) {
  const o = `stroke="${INK}" opacity=".55" fill="${INK}"`;
  let r = "";
  if (g === 8) r = `<rect x="${x - 6}" y="${y0 + 48}" width="12" height="4" ${o}/>`;
  else if (g === 4 || g === 6) r = `<rect x="${x - 6}" y="${y0 + 52}" width="12" height="4" ${o}/>`;
  else if (g === 2 || g === 3) r = `<path d="M${x - 2} ${y0 + 46}L${x + 3} ${y0 + 52}L${x - 3} ${y0 + 58}L${x + 2} ${y0 + 64}" fill="none" stroke="${INK}" opacity=".55" stroke-width="2"/>`;
  else r = `<circle cx="${x - 2}" cy="${y0 + 52}" r="2.2" ${o}/><path d="M${x + 2} ${y0 + 50}L${x - 2} ${y0 + 64}" stroke="${INK}" opacity=".55" stroke-width="1.8" fill="none"/>`;
  if (g === 3 || g === 6) r += `<circle cx="${x + 9}" cy="${y0 + 54}" r="1.6" fill="${INK}" opacity=".55"/>`;
  return r;
}
function drawNote(x, y0, pos, g, acc) {
  const y = yOf(y0, pos);
  let r = "";
  if (pos <= -2) for (let lp = -2; lp >= pos; lp -= 2) r += `<line x1="${x - 9}" x2="${x + 9}" y1="${yOf(y0, lp)}" y2="${yOf(y0, lp)}" stroke="${LINE}"/>`;
  if (pos >= 10) for (let lp = 10; lp <= pos; lp += 2) r += `<line x1="${x - 9}" x2="${x + 9}" y1="${yOf(y0, lp)}" y2="${yOf(y0, lp)}" stroke="${LINE}"/>`;
  const fill = g <= 3 ? INK : "none";
  r += `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="4" transform="rotate(-20 ${x} ${y})" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>`;
  if (g !== 8) {
    const up = pos < 4, sx = up ? x + 5 : x - 5, ey = up ? y - 26 : y + 26;
    r += `<line x1="${sx}" x2="${sx}" y1="${y}" y2="${ey}" stroke="${INK}" stroke-width="1.5"/>`;
    if (g === 1) r += `<path d="M${sx} ${ey}c0 ${up ? 8 : -8} 8 ${up ? 10 : -10} 6 ${up ? 18 : -18}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  }
  if (g === 3 || g === 6) r += `<circle cx="${x + 10}" cy="${y - (pos % 2 === 0 ? 4 : 0)}" r="1.7" fill="${INK}"/>`;
  if (acc) r += `<text x="${x - 14}" y="${y + 5}" font-size="15" fill="${GOLD}" text-anchor="middle">${acc}</text>`;
  return r;
}
function staffSvg(si) {
  const sec = S.song.sections[si], t = secTon(sec), nb = sec.bars.length, ppb = perBar(), total = nb * ppb;
  const f = keyFifths(t), nk = Math.abs(f) <= 7 ? Math.abs(f) : 0, X0 = 40 + nk * 7, W = X0 + PER * BW + 6, rows = Math.ceil(nb / PER);
  const kacc = new Array(7).fill(0);
  for (let i = 0; i < nk; i++) kacc[(f > 0 ? SHARP_L : FLAT_L)[i]] = f > 0 ? 1 : -1;
  const xAt = (a, y0only) => { const b = Math.floor(a / ppb); return X0 + (b % PER) * BW + (a % ppb) * BW / ppb; };
  const rowOf = a => Math.floor(Math.floor(a / ppb) / PER);
  const notes = toAbs(sec).filter(x => x.a < total).sort((x, y) => x.a - y.a);
  const cov = new Array(total).fill(false);
  notes.forEach(x => { for (let i = x.a; i < Math.min(total, x.a + x.n); i++) cov[i] = true; });
  let g = "";
  for (let r = 0; r < rows; r++) {
    const y0 = r * ROWH;
    for (let i = 0; i < 5; i++) g += `<line x1="4" x2="${X0 + PER * BW}" y1="${y0 + 40 + 8 * i}" y2="${y0 + 40 + 8 * i}" stroke="${LINE}"/>`;
    g += `<line x1="4" x2="4" y1="${y0 + 40}" y2="${y0 + 72}" stroke="${LINE}" stroke-width="1.5"/>`;
    g += `<text x="9" y="${y0 + 67}" font-size="36" fill="${INK}" font-family="'Noto Music','Segoe UI Symbol',serif">𝄞</text>`;
    for (let i = 0; i < nk; i++) g += `<text x="${34 + i * 7}" y="${yOf(y0, (f > 0 ? SHARP_POS : FLAT_POS)[i]) + 5}" font-size="15" fill="${INK}" text-anchor="middle">${f > 0 ? "♯" : "♭"}</text>`;
    for (let k = 0; k < PER; k++) {
      const b = r * PER + k; if (b >= nb) break;
      const x0 = X0 + k * BW, c = sec.bars[b];
      g += `<line x1="${x0 + BW}" x2="${x0 + BW}" y1="${y0 + 40}" y2="${y0 + 72}" stroke="${LINE}" stroke-width="${b === nb - 1 ? 2.5 : 1.2}"/>`;
      if (c) g += `<text x="${x0 + 4}" y="${y0 + 15}" font-size="12" font-weight="700" fill="#cdd8ff">${esc(cName(spell(t, c.d, c.s), c.q))}</text>`;
      g += `<text x="${x0 + 3}" y="${y0 + 30}" font-size="8" fill="${LINE}">${b + 1}</text>`;
    }
  }
  /* silences : les trous entre les notes */
  for (let a = 0; a < total;) {
    if (cov[a]) { a++; continue; }
    let e = a; while (e < total && !cov[e]) e++;
    split(a, e - a, ppb).forEach(p => { g += drawRest(xAt(p.a) + 8, rowOf(p.a) * ROWH, p.g); });
    a = e;
  }
  /* notes (coupées aux barres de mesure, reliées par une liaison) */
  notes.forEach(x => {
    const sp = spell(t, x.d, x.s), m = midiOf(t, [0, 0, 0, x.d, x.s, x.o]);
    const oct = Math.round((m - sp.a - NAT[sp.l]) / 12) - 1, pos = 7 * oct + sp.l - 30 + 7 * 0;
    const acc = sp.a !== kacc[sp.l] ? (sp.a > 0 ? "♯".repeat(sp.a) : sp.a < 0 ? "♭".repeat(-sp.a) : "♮") : "";
    let prev = null;
    split(x.a, Math.min(x.n, total - x.a), ppb).forEach((p, i) => {
      const px = xAt(p.a) + 8, row = rowOf(p.a);
      g += drawNote(px, row * ROWH, pos, p.g, i === 0 ? acc : "");
      if (prev && prev.row === row) { const y = yOf(row * ROWH, pos) + (pos < 4 ? 9 : -9); g += `<path d="M${prev.x + 4} ${y}Q${(prev.x + px) / 2} ${y + (pos < 4 ? 7 : -7)} ${px - 4} ${y}" fill="none" stroke="${INK}" stroke-width="1.3"/>`; }
      prev = { x: px, row };
    });
  });
  /* curseur */
  if (ED.si === si) {
    const cp = Math.min(ED.pos, total), cb = Math.min(Math.floor(cp / ppb), nb - 1), cx = cp >= total ? X0 + (cb % PER + 1) * BW : xAt(cp), y0 = Math.floor(cb / PER) * ROWH;
    g += `<line x1="${cx}" x2="${cx}" y1="${y0 + 28}" y2="${y0 + 84}" stroke="${GOLD}" stroke-width="2"/><path d="M${cx - 4} ${y0 + 24}h8l-4 6z" fill="${GOLD}"/>`;
  }
  /* zones cliquables : une par pulsation */
  for (let a = 0; a < total; a++) {
    const row = rowOf(a);
    g += `<rect x="${xAt(a)}" y="${row * ROWH}" width="${BW / ppb}" height="${ROWH}" fill="transparent" data-act="mel-pos" data-pos="${a}" style="cursor:pointer"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${rows * ROWH}" style="width:100%;height:auto;display:block" role="img" aria-label="Portée du thème">${g}</svg>`;
}
function keyboardSvg(si) {
  const t = secTon(S.song.sections[si]);
  let w = "", b = "", wi = 0;
  for (let i = 0; i < 24; i++) {
    const m = ED.base + i, pc = m % 12, black = [1, 3, 6, 8, 10].includes(pc);
    if (!black) {
      w += `<rect x="${wi * 22}" y="0" width="22" height="92" rx="2" fill="${pc === t.pc ? "#3a3320" : "#f2f5f8"}" stroke="#222" data-act="mel-key" data-m="${m}" style="cursor:pointer"/>`;
      if (pc === 0) w += `<text x="${wi * 22 + 11}" y="86" font-size="9" fill="${pc === t.pc ? "#e8eef4" : "#333"}" text-anchor="middle" pointer-events="none">${"fr" === S.nota ? "Do" : "C"}${Math.floor(m / 12) - 1}</text>`;
      if (pc === t.pc) w += `<circle cx="${wi * 22 + 11}" cy="72" r="3" fill="${GOLD}" pointer-events="none"/>`;
      wi++;
    } else b += `<rect x="${wi * 22 - 7}" y="0" width="14" height="56" rx="2" fill="${pc === t.pc ? "#8a6a1f" : "#10161d"}" stroke="#000" data-act="mel-key" data-m="${m}" style="cursor:pointer"/>`;
  }
  return `<svg viewBox="0 0 ${wi * 22} 92" style="width:100%;height:auto;display:block;touch-action:manipulation" role="group" aria-label="Clavier">${w}${b}</svg>`;
}
function editorHtml(si) {
  return `${staffSvg(si)}
   <div class="tr" style="flex-wrap:wrap;margin-top:8px">${DURS.map(([v, n]) => `<button class="chip sm ${ED.dur === v ? "on2" : ""}" data-act="mel-dur" data-v="${v}">${n}</button>`).join("")}</div>
   <div class="tr" style="flex-wrap:wrap;margin-top:6px">
    <button class="btn sm sec" data-act="mel-mv" data-v="home" title="Début de la section">⏮</button>
    <button class="btn sm sec" data-act="mel-mv" data-v="-1" title="Reculer d’une croche">◀</button>
    <button class="btn sm sec" data-act="mel-mv" data-v="1" title="Avancer d’une croche">▶</button>
    <button class="btn sm sec" data-act="mel-rest">Silence</button>
    <button class="btn sm sec" data-act="mel-back" title="Effacer la note avant le curseur">⌫</button>
    <button class="chip sm" data-act="mel-acc" title="Écriture des touches noires">${ED.acc === "auto" ? "♯/♭ auto" : ED.acc === "#" ? "♯" : "♭"}</button>
    <button class="btn sm sec" data-act="mel-oct" data-v="-1">Octave −</button><button class="btn sm sec" data-act="mel-oct" data-v="1">Octave +</button></div>
   <div style="margin-top:8px">${keyboardSvg(si)}</div>
   <div class="muted" style="margin-top:6px">Touche une note du clavier : elle est posée au curseur (trait doré) avec la durée choisie. Touche la portée pour déplacer le curseur.</div>`;
}

function themeInner(si, was) {
  const sec = S.song.sections[si], has = sec.mel && sec.mel.length, ed = ED.si === si;
  const open = was === null || was === undefined ? (!has && !ed) : was;
  return `<div class="tr"><b>Thème</b>
      <span class="muted" style="flex:1">${has ? sec.mel.length + " notes" : "mélodie à ajouter"}</span>
      <button class="btn sm ${ed ? "" : "sec"}" data-act="mel-edit" data-si="${si}">${ed ? "Fermer la saisie" : "✎ Portée &amp; clavier"}</button>
      ${has ? `<button class="btn sm sec" data-act="mel-clear" data-si="${si}">Effacer</button>` : ""}</div>
     ${ed ? editorHtml(si) : roll(sec)}
     <details ${open ? "open" : ""}><summary>Écrire le thème en texte</summary>
      <div class="muted" style="margin:6px 0">Une mesure entre « | ». Chaque note : nom + octave + « : » + durée en croches (<code>Eb5:2</code>, noire = 2, blanche = 4). Silence : <code>r:2</code>. Écris Do/Ré/Mi ou C/D/E, avec # ou b.</div>
      <textarea id="mel-t${si}" rows="4" style="width:100%" spellcheck="false" placeholder="r:1 G4:3 G4:2 Bb4:1 C5:1 | …">${esc(toText(sec))}</textarea>
      <div class="tr" style="margin-top:6px"><button class="btn sm" data-act="mel-apply" data-si="${si}">Appliquer</button>
       <span class="muted" id="mel-m${si}"></span></div></details>`;
}
function refresh() {
  document.querySelectorAll("#panel .themecard").forEach(d => {
    const si = +d.dataset.si, dt = d.querySelector("details");
    d.innerHTML = themeInner(si, dt ? dt.open : null);
  });
}

const _renderSong = renderSong;
renderSong = function () {
  _renderSong();
  document.querySelectorAll('#panel input[data-act="secname"]').forEach(inp => {
    const card = inp.closest(".card"); if (card.querySelector(".themecard")) return;
    const si = +inp.dataset.si; if (!S.song.sections[si]) return;
    const d = document.createElement("div"); d.className = "themecard"; d.dataset.si = si; d.style.marginTop = "10px";
    d.innerHTML = themeInner(si, null);
    card.appendChild(d);
  });
  const hdr = document.querySelector('#panel [data-act="splay"]');
  if (hdr && !$("mel-voice") && S.song.sections.some(s => s.mel && s.mel.length)) {
    const b = document.createElement("button");
    b.id = "mel-voice"; b.className = "chip sm " + (S.song.melOff ? "" : "on2"); b.dataset.act = "mel-voice"; b.textContent = "Thème";
    hdr.parentNode.appendChild(b);
  }
};

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t || !/^mel-/.test(t.dataset.act)) return;
  const act = t.dataset.act, sec = S.song.sections[ED.si >= 0 ? ED.si : +t.dataset.si], si = +t.dataset.si;
  if (act === "mel-voice") { S.song.melOff = !S.song.melOff; if (!S.song.melOff) delete S.song.melOff; persist(); render(); return; }
  if (act === "mel-edit") { ED.si = ED.si === si ? -1 : si; ED.pos = 0; refresh(); return; }
  if (act === "mel-clear") { const s = S.song.sections[si]; if (s) { delete s.mel; persist(); refresh(); } return; }
  if (act === "mel-apply") {
    const s = S.song.sections[si]; if (!s) return;
    const r = fromText($("mel-t" + si).value, s.bars.length, secTon(s)), msg = $("mel-m" + si);
    if (r.errs.length && !r.notes.length) { msg.textContent = r.errs[0]; return; }
    if (r.notes.length) s.mel = r.notes; else delete s.mel;
    persist(); refresh();
    const m2 = $("mel-m" + si); if (m2 && r.errs.length) { m2.textContent = r.errs.slice(0, 3).join(" · "); const dt = m2.closest("details"); if (dt) dt.open = true; }
    return;
  }
  if (!sec || ED.si < 0) return;
  const total = sec.bars.length * perBar();
  if (act === "mel-pos") ED.pos = +t.dataset.pos;
  else if (act === "mel-dur") ED.dur = +t.dataset.v;
  else if (act === "mel-mv") ED.pos = t.dataset.v === "home" ? 0 : Math.max(0, Math.min(total, ED.pos + +t.dataset.v));
  else if (act === "mel-acc") ED.acc = { auto: "#", "#": "b", b: "auto" }[ED.acc];
  else if (act === "mel-oct") ED.base = Math.max(36, Math.min(72, ED.base + 12 * +t.dataset.v));
  else if (act === "mel-rest") { putNote(sec, null, ED.dur); persist(); }
  else if (act === "mel-back") { backspace(sec); persist(); }
  else if (act === "mel-key") {
    const m = +t.dataset.m;
    tone(m, undefined, .5, .12, "sawtooth");
    putNote(sec, relOf(secTon(sec), m), ED.dur); persist();
  }
  refresh();
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
