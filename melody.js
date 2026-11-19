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

/* ---------- zoom de l'onglet Morceaux (grille d'accords + portée) ---------- */
const ZOOMS = [{ z: .5, c: 8, r: 4 }, { z: .75, c: 6, r: 3 }, { z: 1, c: 4, r: 2 }, { z: 1.5, c: 3, r: 2 }, { z: 2, c: 2, r: 2 }];
const K_ZOOM = "atelier-modal-zoom";
let zi = 2;
try { const raw = localStorage.getItem(K_ZOOM), v = raw === null ? NaN : +raw; if (Number.isInteger(v) && v >= 0 && v < ZOOMS.length) zi = v; } catch (x) { }
const zoomObj = () => ZOOMS[zi], perRow = () => ZOOMS[zi].r;
function setZoom(n) { zi = Math.max(0, Math.min(ZOOMS.length - 1, n)); try { localStorage.setItem(K_ZOOM, String(zi)); } catch (x) { } render(); }

/* ---------- éditeur : portée + clavier à l'écran ---------- */
/* Position = pulsation absolue dans la section (mesure × pulsations par mesure + pulsation). Saisie en « écrasement » :
   une note posée remplace ce qui occupait sa durée, puis le curseur avance. */
const ED = { si: -1, pos: 0, dur: 2, acc: "auto", base: 60, click: "note", stAcc: "", collapsed: false, fp: null, grew: false };
const K_KB = "atelier-modal-kbpos";
try { const v = JSON.parse(localStorage.getItem(K_KB)); if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) ED.fp = v; } catch (x) { }
const DURS = [[1, "Croche"], [2, "Noire"], [3, "Noire ·"], [4, "Blanche"], [6, "Blanche ·"], [8, "Ronde"]], GLY = [8, 6, 4, 3, 2, 1];
const SHARP_POS = [8, 5, 9, 6, 3, 7, 4], FLAT_POS = [4, 7, 3, 6, 2, 5, 1];       // position des altérations à la clé (0 = ligne du bas)
const SHARP_L = [3, 0, 4, 1, 5, 2, 6], FLAT_L = [6, 2, 5, 1, 4, 0, 3];
const BW = 132, ROWH = 108;
let LINE = "#8b98a5", INK = "#e8eef4", GOLD = "#f5b13d", CHORD = "#cdd8ff";          // couleurs de la portée (clair sur fond sombre ; inversées à l'impression)
const keyFifths = t => fifths(t) - (S.song.mode === "min" ? 3 : 0);
const keyAcc = t => {                      // altération de chaque lettre (0 = do … 6 = si) selon l'armure
  const f = keyFifths(t), nk = Math.abs(f) <= 7 ? Math.abs(f) : 0, k = new Array(7).fill(0);
  for (let i = 0; i < nk; i++) k[(f > 0 ? SHARP_L : FLAT_L)[i]] = f > 0 ? 1 : -1;
  return k;
};
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
  let total = sec.bars.length * perBar(); const pos = ED.pos;
  if (pos >= total) {                      // curseur au bout de la section : on ajoute une mesure pour continuer à écrire
    if (sec.bars.length >= 96) return;
    sec.bars.push(null); total += perBar(); ED.grew = true;
  }
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
const relSpelled = (t, l, m) => { const s = mod(m - t.pc, 12); return { d: mod(l - t.l, 7), s, o: (m - refOf(t) - s) / 12 }; };
function relOf(t, m) {
  const pc = m % 12, WH = { 0: [0, 0], 2: [1, 0], 4: [2, 0], 5: [3, 0], 7: [4, 0], 9: [5, 0], 11: [6, 0] };
  let l;
  if (pc in WH) l = WH[pc][0];
  else {
    const sharp = ED.acc === "#" || (ED.acc === "auto" && keyFifths(t) > 0);
    l = (sharp ? { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 } : { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 })[pc];
  }
  return relSpelled(t, l, m);
}
/* clic sur la portée : la hauteur vient de la hauteur du clic, l'altération de l'armure (ou du choix « ♯ ♭ ♮ ») */
function noteFromClick(ev, el, sec) {
  const svg = el.ownerSVGElement, r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const yy = (ev.clientY - r.top) * vb.height / r.height, row = Math.floor(yy / ROWH);
  const pos = Math.max(-6, Math.min(14, Math.round((72 - (yy - row * ROWH)) / 4)));
  const t = secTon(sec), step = pos + 30, l = mod(step, 7), oct = Math.floor(step / 7);
  const a = ED.stAcc === "#" ? 1 : ED.stAcc === "b" ? -1 : ED.stAcc === "n" ? 0 : keyAcc(t)[l];
  const m = 12 * (oct + 1) + NAT[l] + a;
  return { m, rel: relSpelled(t, l, m) };
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
function staffSvg(si, print) {
  const PER = print ? 4 : perRow();
  const sec = S.song.sections[si], t = secTon(sec), nb = sec.bars.length, ppb = perBar(), total = nb * ppb;
  const f = keyFifths(t), nk = Math.abs(f) <= 7 ? Math.abs(f) : 0, X0 = 40 + nk * 7, W = X0 + PER * BW + 6, rows = Math.ceil(nb / PER);
  const kacc = keyAcc(t);
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
      if (c) g += `<text x="${x0 + 4}" y="${y0 + 15}" font-size="12" font-weight="700" fill="${CHORD}">${esc(cName(spell(t, c.d, c.s), c.q))}</text>`;
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
  if (ED.si === si && !print) {
    const cp = Math.min(ED.pos, total), cb = Math.min(Math.floor(cp / ppb), nb - 1), cx = cp >= total ? X0 + (cb % PER + 1) * BW : xAt(cp), y0 = Math.floor(cb / PER) * ROWH;
    g += `<line x1="${cx}" x2="${cx}" y1="${y0 + 28}" y2="${y0 + 84}" stroke="${GOLD}" stroke-width="2"/><path d="M${cx - 4} ${y0 + 24}h8l-4 6z" fill="${GOLD}"/>`;
  }
  /* zones cliquables : une par pulsation */
  for (let a = 0; a < (print ? 0 : total); a++) {
    const row = rowOf(a);
    g += `<rect x="${xAt(a)}" y="${row * ROWH}" width="${BW / ppb}" height="${ROWH}" fill="transparent" data-act="mel-pos" data-si="${si}" data-pos="${a}" style="cursor:pointer"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${rows * ROWH}" style="width:${!print && zoomObj().z > 1 ? zoomObj().z * 100 : 100}%;height:auto;display:block" role="img" aria-label="Portée du thème">${g}</svg>`;
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
function floatBody(si) {
  const chips = (act, cur, arr) => arr.map(([v, n, tip]) => `<button class="chip sm ${cur === v ? "on2" : ""}" data-act="${act}" data-v="${v}" ${tip ? `title="${tip}"` : ""}>${n}</button>`).join("");
  return `<div class="tr" style="flex-wrap:wrap;gap:4px">${DURS.map(([v, n]) => `<button class="chip sm ${ED.dur === v ? "on2" : ""}" data-act="mel-dur" data-v="${v}">${n}</button>`).join("")}</div>
   <div class="tr" style="flex-wrap:wrap;gap:4px;margin-top:6px">
    <button class="btn sm sec" data-act="mel-mv" data-v="home" title="Début de la section">⏮</button>
    <button class="btn sm sec" data-act="mel-mv" data-v="-1" title="Reculer d’une croche">◀</button>
    <button class="btn sm sec" data-act="mel-mv" data-v="1" title="Avancer d’une croche">▶</button>
    <button class="btn sm sec" data-act="mel-rest">Silence</button>
    <button class="btn sm sec" data-act="mel-back" title="Effacer la note avant le curseur">⌫</button>
    <span class="muted">Toucher la portée :</span>${chips("mel-click", ED.click, [["note", "pose une note"], ["cursor", "déplace le curseur"]])}</div>
   <div class="tr" style="flex-wrap:wrap;gap:4px;margin-top:6px"><span class="muted">Prochaine note :</span>${chips("mel-sa", ED.stAcc, [["", "selon l’armure"], ["#", "♯"], ["b", "♭"], ["n", "♮"]])}
    <button class="chip sm" data-act="mel-acc" title="Écriture des touches noires du clavier">touches noires : ${ED.acc === "auto" ? "auto" : ED.acc === "#" ? "♯" : "♭"}</button></div>
   <div style="margin-top:8px">${keyboardSvg(si)}</div>
   <div class="tr" style="margin-top:6px"><button class="btn sm sec" data-act="mel-oct" data-v="-1">Octave −</button><button class="btn sm sec" data-act="mel-oct" data-v="1">Octave +</button>
    <span style="flex:1"></span><button class="btn sm sec" data-act="mel-dock" title="Remettre le clavier en bas de l’écran">⤓ En bas</button></div>`;
}


/* ---------- partition imprimable / PDF ---------- */
/* On prépare une page blanche (#mel-print) que le CSS d'impression affiche seule ; le navigateur propose « Enregistrer en PDF ». */
function chordRow(sec) {
  const t = secTon(sec);
  return `<div class="pgrid">${sec.bars.map((c, b) => `<div class="pcell"><small>${b + 1}</small><b>${c ? esc(cName(spell(t, c.d, c.s), c.q)) : "&nbsp;"}</b></div>`).join("")}</div>`;
}
function printHtml() {
  const so = S.song, mode = so.mode === "min" ? "mineur" : "majeur";
  const old = [LINE, INK, GOLD, CHORD]; LINE = "#555"; INK = "#000"; GOLD = "#000"; CHORD = "#000";
  try {
    const secs = so.sections.map((sec, si) => {
      const has = sec.mel && sec.mel.length, sh = shiftOf(sec);
      return `<section class="psec"><h2>${esc(sec.name)}${(sec.rep || 1) > 1 ? ` <span>×${sec.rep}</span>` : ""}${sh ? ` <span>— en ${esc(nmN(secTon(sec)))} ${mode}</span>` : ""}</h2>${has ? staffSvg(si, true) : chordRow(sec)}</section>`;
    }).join("");
    return `<h1>${esc(so.name || "Morceau")}</h1><p class="psub">Tonalité : ${esc(nmN(S.tonic))} ${mode} · ${esc(so.sig)} · ♩ = ${so.bpm}</p>${secs}<p class="pfoot">Atelier modal</p>`;
  } finally { [LINE, INK, GOLD, CHORD] = old; }
}
function printScore() {
  let el = $("mel-print"); if (el) el.remove();
  el = document.createElement("div"); el.id = "mel-print"; el.innerHTML = printHtml(); document.body.appendChild(el);
  document.body.classList.add("printing");
  const done = () => { document.body.classList.remove("printing"); const e = $("mel-print"); if (e) e.remove(); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  try { window.print(); } catch (x) { done(); alert("L’impression n’est pas disponible ici : ouvre l’application dans ton navigateur."); }
}

/* ---------- clavier flottant : se déplace en le glissant par sa barre ---------- */
function floatEl() {
  let el = $("mel-float"); if (el) return el;
  el = document.createElement("div"); el.id = "mel-float"; el.className = "melfloat";
  el.innerHTML = `<div class="hd" id="mel-hd"><span class="grip">⠿</span><b style="flex:1">Saisie du thème</b>
    <button class="btn sm sec" data-act="mel-fold" id="mel-fold"></button><button class="btn sm sec" data-act="mel-close" title="Fermer la saisie">✕</button></div><div id="mel-fb"></div>`;
  document.body.appendChild(el);
  const hd = el.querySelector("#mel-hd"); let off = null;
  hd.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    const r = el.getBoundingClientRect(); off = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    try { hd.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault();
  });
  hd.addEventListener("pointermove", e => {
    if (!off) return;
    ED.fp = clampFp(e.clientX - off.dx, e.clientY - off.dy, el); placeFloat(el);
  });
  const end = () => { if (!off) return; off = null; try { localStorage.setItem(K_KB, JSON.stringify(ED.fp)); } catch (x) { } };
  hd.addEventListener("pointerup", end); hd.addEventListener("pointercancel", end);
  window.addEventListener("resize", () => { const f = $("mel-float"); if (f && ED.fp) { ED.fp = clampFp(ED.fp.x, ED.fp.y, f); placeFloat(f); } });
  return el;
}
function clampFp(x, y, el) {
  const w = el.offsetWidth || 340;
  return { x: Math.max(0, Math.min(innerWidth - w, x)), y: Math.max(0, Math.min(innerHeight - 44, y)) };
}
function placeFloat(el) {
  if (ED.fp) { const p = clampFp(ED.fp.x, ED.fp.y, el); el.style.left = p.x + "px"; el.style.top = p.y + "px"; el.style.bottom = "auto"; }
  else { el.style.left = Math.max(0, (innerWidth - el.offsetWidth) / 2) + "px"; el.style.top = "auto"; el.style.bottom = "8px"; }
}
function syncFloat() {
  const show = ED.si >= 0 && S.tab === "song" && S.song.sections[ED.si];
  const el = $("mel-float");
  document.body.classList.toggle("mel-ed-open", !!show && !ED.collapsed && !ED.fp);
  if (!show) { if (el) el.remove(); return; }
  const f = floatEl();
  f.querySelector("#mel-fold").textContent = ED.collapsed ? "▴ Ouvrir" : "▾ Réduire";
  f.querySelector("#mel-fb").innerHTML = ED.collapsed ? "" : floatBody(ED.si);
  placeFloat(f);
}

function themeInner(si, was) {
  const sec = S.song.sections[si], has = sec.mel && sec.mel.length, ed = ED.si === si;
  const open = was === null || was === undefined ? (!has && !ed) : was;
  return `<div class="tr"><b>Thème</b>
      <span class="muted" style="flex:1">${has ? sec.mel.length + " notes" : "mélodie à ajouter"}</span>
      <button class="btn sm" data-act="mel-edit" data-si="${si}">${ed ? "Fermer la saisie" : "✎ Écrire le thème sur la portée"}</button>
      ${has ? `<button class="btn sm sec" data-act="mel-clear" data-si="${si}">Effacer</button>` : ""}</div>
     <div style="overflow-x:auto">${staffSvg(si)}</div>
     <div class="tr" style="margin-top:6px"><button class="btn sm sec" data-act="mel-addrow" data-si="${si}">+ Ajouter une portée</button>
      <button class="btn sm sec" data-act="delbar" data-si="${si}" title="Retire la dernière mesure">− mesure</button>
      <span class="muted">${sec.bars.length} mesures</span></div>
     <details ${open ? "open" : ""}><summary>Écrire le thème en texte</summary>
      <div class="muted" style="margin:6px 0">Une mesure entre « | ». Chaque note : nom + octave + « : » + durée en croches (<code>Eb5:2</code>, noire = 2, blanche = 4). Silence : <code>r:2</code>. Écris Do/Ré/Mi ou C/D/E, avec # ou b.</div>
      <textarea id="mel-t${si}" rows="4" style="width:100%" spellcheck="false" placeholder="r:1 G4:3 G4:2 Bb4:1 C5:1 | …">${esc(toText(sec))}</textarea>
      <div class="tr" style="margin-top:6px"><button class="btn sm" data-act="mel-apply" data-si="${si}">Appliquer</button>
       <span class="muted" id="mel-m${si}"></span></div></details>`;
}
function refresh() {
  syncFloat();
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
    const bars = card.querySelector(".bars");
    if (bars) bars.after(d); else card.appendChild(d);
  });
  const first = document.querySelector('#panel input[data-act="secname"]');
  if (first && !$("zoomcard")) {
    const z = document.createElement("div"); z.className = "card"; z.id = "zoomcard";
    z.innerHTML = `<div class="tr"><span class="muted">Zoom des sections</span><button class="btn sm sec" data-act="mel-zoom" data-v="-1" ${zi === 0 ? "disabled" : ""}>− Dézoomer</button><b>${Math.round(zoomObj().z * 100)} %</b><button class="btn sm sec" data-act="mel-zoom" data-v="1" ${zi === ZOOMS.length - 1 ? "disabled" : ""}>Zoomer +</button></div>
     <div class="tr" style="margin-top:8px"><button class="btn sm" data-act="mel-pdf">📄 Enregistrer en PDF / Imprimer</button><span class="muted">partition : accords + thème</span></div>`;
    first.closest(".card").before(z);
  }
  const pn = $("panel"); if (pn) { pn.style.setProperty("--cols", zoomObj().c); pn.style.setProperty("--z", zoomObj().z); }
  const hdr = document.querySelector('#panel [data-act="splay"]');
  if (hdr && !$("mel-voice") && S.song.sections.some(s => s.mel && s.mel.length)) {
    const b = document.createElement("button");
    b.id = "mel-voice"; b.className = "chip sm " + (S.song.melOff ? "" : "on2"); b.dataset.act = "mel-voice"; b.textContent = "Thème";
    hdr.parentNode.appendChild(b);
  }
  syncFloat();
};

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t || !/^mel-/.test(t.dataset.act)) return;
  const act = t.dataset.act, sec = S.song.sections[ED.si >= 0 ? ED.si : +t.dataset.si], si = +t.dataset.si;
  if (act === "mel-addrow") {
    const s2 = S.song.sections[si]; if (!s2) return;
    for (let i = 0; i < perRow() && s2.bars.length < 96; i++) s2.bars.push(null);
    persist(); render(); return;
  }
  if (act === "mel-pdf") { printScore(); return; }
  if (act === "mel-zoom") { setZoom(zi + +t.dataset.v); return; }
  if (act === "mel-voice") { S.song.melOff = !S.song.melOff; if (!S.song.melOff) delete S.song.melOff; persist(); render(); return; }
  if (act === "mel-edit") {
    ED.si = ED.si === si ? -1 : si; ED.pos = 0; ED.collapsed = false; refresh();
    if (ED.si >= 0) { const c = document.querySelector(`.themecard[data-si="${si}"]`); if (c) c.scrollIntoView({ block: "start", behavior: "smooth" }); }
    return;
  }
  if (act === "mel-pos" && ED.si !== si) {            // toucher la portée d'une autre section : on y ouvre la saisie
    if (S.song.sections[si]) { ED.si = si; ED.pos = +t.dataset.pos; ED.collapsed = false; refresh(); }
    return;
  }
  if (act === "mel-close") { ED.si = -1; refresh(); return; }
  if (act === "mel-fold") { ED.collapsed = !ED.collapsed; refresh(); return; }
  if (act === "mel-dock") { ED.fp = null; try { localStorage.removeItem(K_KB); } catch (x) { } refresh(); return; }
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
  if (act === "mel-pos") {
    ED.pos = +t.dataset.pos;
    if (ED.click === "note") {
      const r = noteFromClick(ev, t, sec);
      tone(r.m, undefined, .5, .12, "sawtooth");
      putNote(sec, r.rel, ED.dur); ED.stAcc = ""; persist();
    }
  }
  else if (act === "mel-click") ED.click = t.dataset.v;
  else if (act === "mel-sa") ED.stAcc = ED.stAcc === t.dataset.v ? "" : t.dataset.v;
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
  if (ED.grew) { ED.grew = false; render(); } else refresh();
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

const _render = render;
render = function () { _render.apply(this, arguments); if (S.tab !== "song" && ED.si >= 0) { ED.si = -1; syncFloat(); } };

window.__mel = { toText, fromText, midiOf, printHtml };
if (S.tab === "song") render();
})();
