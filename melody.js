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
const ED = { si: -1, v: 0, stack: false, pos: 0, dur: 2, acc: "auto", base: 60, click: "note", stAcc: "", collapsed: false, fp: null };
const K_KB = "atelier-modal-kbpos";
try { const v = JSON.parse(localStorage.getItem(K_KB)); if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) ED.fp = v; } catch (x) { }
const DURS = [[1, "Croche"], [2, "Noire"], [3, "Noire ·"], [4, "Blanche"], [6, "Blanche ·"], [8, "Ronde"]], GLY = [8, 6, 4, 3, 2, 1];
const SHARP_POS = [8, 5, 9, 6, 3, 7, 4], FLAT_POS = [4, 7, 3, 6, 2, 5, 1];       // position des altérations à la clé (0 = ligne du bas)
const SHARP_L = [3, 0, 4, 1, 5, 2, 6], FLAT_L = [6, 2, 5, 1, 4, 0, 3];
const BW = 132, ROWH = 108, LINE = "#8b98a5", INK = "#e8eef4", GOLD = "#f5b13d";
/* clés : bot = rang diatonique (octave×7 + lettre) de la ligne du bas ; base = première touche proposée au clavier ;
   sw / fw = position la plus basse des dièses / bémols à la clé */
const CLEFS = { sol: { n: "Sol", bot: 30, base: 60, sw: 3, fw: 1 }, fa: { n: "Fa", bot: 18, base: 36, sw: 1, fw: 0 },
  ut3: { n: "Ut 3 (alto)", bot: 24, base: 48, sw: 2, fw: 0 }, ut4: { n: "Ut 4 (ténor)", bot: 22, base: 48, sw: 0, fw: 0 } };
const MAXST = 4;
const vOf = (sec, k) => k > 0 && sec.st && sec.st[k - 1] ? sec.st[k - 1] : sec;          // portée k : 0 = principale (la section), puis sec.st[k-1]
const clefOf = v => (v && CLEFS[v.clef] ? v.clef : "sol");
const nStaves = sec => 1 + (sec.st ? sec.st.length : 0);
const allMel = sec => [sec.mel || []].concat((sec.st || []).map(x => x.mel || []));
const hasMel = sec => allMel(sec).some(m => m.length);
const cv = sec => vOf(sec, ED.si >= 0 && sec === S.song.sections[ED.si] ? Math.min(ED.v, nStaves(sec) - 1) : 0);
const keyFifths = t => fifths(t) - (S.song.mode === "min" ? 3 : 0);
const keyAcc = t => {                      // altération de chaque lettre (0 = do … 6 = si) selon l'armure
  const f = keyFifths(t), nk = Math.abs(f) <= 7 ? Math.abs(f) : 0, k = new Array(7).fill(0);
  for (let i = 0; i < nk; i++) k[(f > 0 ? SHARP_L : FLAT_L)[i]] = f > 0 ? 1 : -1;
  return k;
};
const yOf = (y0, pos) => y0 + 72 - 4 * pos;
const sigPos = (clef, i, sharp) => {         // position de la i-ème altération à la clé, ramenée dans la fenêtre de la clé
  const w0 = sharp ? CLEFS[clef].sw : CLEFS[clef].fw, p = (sharp ? SHARP_POS : FLAT_POS)[i] + 30 - CLEFS[clef].bot;
  return mod(p - w0, 7) + w0;
};
const posOf = (t, x, bot) => {                // position sur la portée (0 = ligne du bas) d'une note {d,s,o}
  const sp = spell(t, x.d, x.s), m = midiOf(t, [0, 0, 0, x.d, x.s, x.o]);
  return 7 * (Math.round((m - sp.a - NAT[sp.l]) / 12) - 1) + sp.l - bot;
};
const posFromY = (ev, el) => {
  const svg = el.ownerSVGElement, r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const yy = (ev.clientY - r.top) * vb.height / r.height, row = Math.floor(yy / ROWH);
  return Math.max(-6, Math.min(14, Math.round((72 - (yy - row * ROWH)) / 4)));
};

const toAbs = v => { const ppb = perBar(); return (v.mel || []).map(n => ({ a: n[0] * ppb + n[1], n: n[2], d: n[3], s: n[4], o: n[5] })); };
function fromAbs(sec, v, list) {
  const ppb = perBar(), total = sec.bars.length * ppb;
  list = list.filter(x => x.a < total && x.n >= 1).sort((x, y) => x.a - y.a);
  v.mel = list.map(x => [Math.floor(x.a / ppb), x.a % ppb, Math.min(x.n, 32), x.d, x.s, x.o]);
  if (!v.mel.length) delete v.mel;
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
function putNote(sec, v, rel, len) {
  const total = sec.bars.length * perBar(), pos = ED.pos;
  if (pos >= total) return;
  len = Math.min(len, total - pos);
  if (ED.stack) {                       // « Empiler » : on ajoute une note sur la même position (accord), sans rien effacer ni avancer
    if (!rel) return;
    const list = toAbs(v);
    if (!list.some(x => x.a === pos && x.d === rel.d && x.s === rel.s && x.o === rel.o)) list.push({ a: pos, n: len, d: rel.d, s: rel.s, o: rel.o });
    fromAbs(sec, v, list); return;
  }
  const list = clearRange(toAbs(v), pos, pos + len);
  if (rel) list.push({ a: pos, n: len, d: rel.d, s: rel.s, o: rel.o });
  fromAbs(sec, v, list); ED.pos = pos + len;
}
function backspace(sec, v) {
  const list = toAbs(v), pos = ED.pos; let prev = null;
  list.forEach(x => { if (x.a < pos && (!prev || x.a > prev.a)) prev = x; });
  if (!prev) { ED.pos = 0; return; }
  const e = prev.a + prev.n;
  if (e >= pos) { fromAbs(sec, v, list.filter(x => x !== prev)); ED.pos = prev.a; } else ED.pos = e;
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
function noteFromClick(ev, el, sec, clef) {
  const pos = posFromY(ev, el);
  const t = secTon(sec), step = pos + CLEFS[clef || "sol"].bot, l = mod(step, 7), oct = Math.floor(step / 7);
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
function clefSvg(clef, y0) {
  if (clef === "sol") return `<text x="9" y="${y0 + 67}" font-size="36" fill="${INK}" font-family="'Noto Music','Segoe UI Symbol',serif">𝄞</text>`;
  const st = `stroke="${INK}" fill="none" stroke-linecap="round"`;
  if (clef === "fa") return `<path d="M8 ${y0 + 48}C8 ${y0 + 40} 25 ${y0 + 40} 25 ${y0 + 51}C25 ${y0 + 61} 15 ${y0 + 68} 7 ${y0 + 75}" ${st} stroke-width="3.2"/>
    <circle cx="9" cy="${y0 + 48}" r="3.6" fill="${INK}"/><circle cx="31" cy="${y0 + 45}" r="1.9" fill="${INK}"/><circle cx="31" cy="${y0 + 51}" r="1.9" fill="${INK}"/>`;
  const yc = y0 + (clef === "ut3" ? 56 : 48);                                      // la clé d'ut est centrée sur sa ligne
  return `<rect x="6" y="${yc - 16}" width="4" height="32" fill="${INK}"/><rect x="12" y="${yc - 16}" width="1.4" height="32" fill="${INK}"/>
    <path d="M15 ${yc - 16}C28 ${yc - 16} 28 ${yc - 3} 16 ${yc - 1.5}M15 ${yc + 16}C28 ${yc + 16} 28 ${yc + 3} 16 ${yc + 1.5}" ${st} stroke-width="2.4"/>`;
}
function staffSvg(si, k) {
  const PER = perRow();
  const sec = S.song.sections[si], v = vOf(sec, k || 0), clef = clefOf(v), bot = CLEFS[clef].bot, t = secTon(sec), nb = sec.bars.length, ppb = perBar(), total = nb * ppb;
  const f = keyFifths(t), nk = Math.abs(f) <= 7 ? Math.abs(f) : 0, X0 = 40 + nk * 7, W = X0 + PER * BW + 6, rows = Math.ceil(nb / PER);
  const kacc = keyAcc(t);
  const xAt = (a, y0only) => { const b = Math.floor(a / ppb); return X0 + (b % PER) * BW + (a % ppb) * BW / ppb; };
  const rowOf = a => Math.floor(Math.floor(a / ppb) / PER);
  const notes = toAbs(v).filter(x => x.a < total).sort((x, y) => x.a - y.a);
  const cov = new Array(total).fill(false);
  notes.forEach(x => { for (let i = x.a; i < Math.min(total, x.a + x.n); i++) cov[i] = true; });
  let g = "";
  for (let r = 0; r < rows; r++) {
    const y0 = r * ROWH;
    for (let i = 0; i < 5; i++) g += `<line x1="4" x2="${X0 + PER * BW}" y1="${y0 + 40 + 8 * i}" y2="${y0 + 40 + 8 * i}" stroke="${LINE}"/>`;
    g += `<line x1="4" x2="4" y1="${y0 + 40}" y2="${y0 + 72}" stroke="${LINE}" stroke-width="1.5"/>`;
    g += clefSvg(clef, y0);
    for (let i = 0; i < nk; i++) g += `<text x="${34 + i * 7}" y="${yOf(y0, sigPos(clef, i, f > 0)) + 5}" font-size="15" fill="${INK}" text-anchor="middle">${f > 0 ? "♯" : "♭"}</text>`;
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
    const sp = spell(t, x.d, x.s), pos = posOf(t, x, bot);
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
  if (ED.si === si && ED.v === (k || 0)) {
    const cp = Math.min(ED.pos, total), cb = Math.min(Math.floor(cp / ppb), nb - 1), cx = cp >= total ? X0 + (cb % PER + 1) * BW : xAt(cp), y0 = Math.floor(cb / PER) * ROWH;
    g += `<line x1="${cx}" x2="${cx}" y1="${y0 + 28}" y2="${y0 + 84}" stroke="${GOLD}" stroke-width="2"/><path d="M${cx - 4} ${y0 + 24}h8l-4 6z" fill="${GOLD}"/>`;
  }
  /* zones cliquables : une par pulsation */
  for (let a = 0; a < total; a++) {
    const row = rowOf(a);
    g += `<rect x="${xAt(a)}" y="${row * ROWH}" width="${BW / ppb}" height="${ROWH}" fill="transparent" data-act="mel-pos" data-si="${si}" data-v="${k || 0}" data-pos="${a}" style="cursor:pointer"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${rows * ROWH}" style="width:${zoomObj().z > 1 ? zoomObj().z * 100 : 100}%;height:auto;display:block" role="img" aria-label="Portée ${(k || 0) + 1} du thème, clé de ${CLEFS[clef].n}">${g}</svg>`;
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
  const sec0 = S.song.sections[si], kact = Math.min(ED.v, nStaves(sec0) - 1);
  const chips = (act, cur, arr) => arr.map(([v, n, tip]) => `<button class="chip sm ${cur === v ? "on2" : ""}" data-act="${act}" data-v="${v}" ${tip ? `title="${tip}"` : ""}>${n}</button>`).join("");
  return `<div class="muted" style="margin-bottom:4px">Portée ${kact + 1} · clé de ${CLEFS[clefOf(vOf(sec0, kact))].n}</div>
   <div class="tr" style="flex-wrap:wrap;gap:4px">${DURS.map(([v, n]) => `<button class="chip sm ${ED.dur === v ? "on2" : ""}" data-act="mel-dur" data-v="${v}">${n}</button>`).join("")}</div>
   <div class="tr" style="flex-wrap:wrap;gap:4px;margin-top:6px">
    <button class="btn sm sec" data-act="mel-mv" data-v="home" title="Début de la section">⏮</button>
    <button class="btn sm sec" data-act="mel-mv" data-v="-1" title="Reculer d’une croche">◀</button>
    <button class="btn sm sec" data-act="mel-mv" data-v="1" title="Avancer d’une croche">▶</button>
    <button class="btn sm sec" data-act="mel-rest">Silence</button>
    <button class="btn sm sec" data-act="mel-back" title="Effacer la note avant le curseur">⌫</button>
    <span class="muted">Toucher la portée :</span>${chips("mel-click", ED.click, [["note", "pose une note"], ["cursor", "déplace le curseur"]])}
    <button class="chip sm ${ED.stack ? "on2" : ""}" data-act="mel-stack" title="Poser plusieurs notes sur la même position pour écrire un accord">Empiler (accord)</button></div>
   <div class="tr" style="flex-wrap:wrap;gap:4px;margin-top:6px"><span class="muted">Prochaine note :</span>${chips("mel-sa", ED.stAcc, [["", "selon l’armure"], ["#", "♯"], ["b", "♭"], ["n", "♮"]])}
    <button class="chip sm" data-act="mel-acc" title="Écriture des touches noires du clavier">touches noires : ${ED.acc === "auto" ? "auto" : ED.acc === "#" ? "♯" : "♭"}</button></div>
   <div style="margin-top:8px">${keyboardSvg(si)}</div>
   <div class="tr" style="margin-top:6px"><button class="btn sm sec" data-act="mel-oct" data-v="-1">Octave −</button><button class="btn sm sec" data-act="mel-oct" data-v="1">Octave +</button>
    <span style="flex:1"></span><button class="btn sm sec" data-act="mel-dock" title="Remettre le clavier en bas de l’écran">⤓ En bas</button></div>`;
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

/* accords qui contiennent les notes de la mesure b (toutes portées confondues), pondérées par leur durée et leur place dans la mesure */
function chordProps(sec, b) {
  const ppb = perBar(), t = secTon(sec), w = new Array(12).fill(0), names = [], bs = b * ppb, be = bs + ppb;
  let tot = 0, low = 999;
  allMel(sec).forEach(mel => mel.forEach(n => {
    const a = n[0] * ppb + n[1], len = Math.min(a + n[2], be) - Math.max(a, bs);
    if (len <= 0) return;
    const m = midiOf(t, n), pc = mod(m, 12), wt = len + (a >= bs && (a - bs) % (ppb / 2) === 0 ? 2 : 0);
    w[pc] += wt; tot += wt; low = Math.min(low, m);
    const nm = noteName(t, n).replace(/-?\d+$/, ""); if (!names.includes(nm)) names.push(nm);
  }));
  if (!tot) return null;
  const keep = S.tri; S.tri = false; const d7 = diaChords().map(c => c.s + ":" + c.q); S.tri = true; const d3 = diaChords().map(c => c.s + ":" + c.q); S.tri = keep;
  const dia = new Set(d7.concat(d3)), out = [];
  for (let r = 0; r < 12; r++) Object.keys(CH).forEach(q => {
    const C = CH[q].map(iv => mod(r + iv, 12)), cov = C.reduce((x, pc) => x + w[pc], 0) / tot;
    if (cov < .6) return;
    const s = mod(r - t.pc, 12), di = dia.has(s + ":" + q), used = C.filter(pc => w[pc] > 0).length;
    out.push({ s, q, cov, di, sc: cov * 100 + (di ? 12 : 0) + (w[r] > 0 ? 4 : 0) + (mod(low, 12) === r ? 4 : 0) - (C.length - used) * 2 + (q === "maj" || q === "m" || q === "7" ? 1 : 0) });
  });
  out.sort((x, y) => y.sc - x.sc);
  return { names, list: out.slice(0, 8) };
}
function propsHtml(si) {
  const sec = S.song.sections[si], nb = sec.bars.length, total = nb * perBar();
  const b = Math.min(Math.floor(Math.min(ED.pos, total - 1) / perBar()), nb - 1), pr = chordProps(sec, b), t = secTon(sec), cur = sec.bars[b];
  if (!pr) return `<div class="muted" style="margin-top:8px">Pose des notes dans la mesure ${b + 1} (le curseur doré) pour voir les accords qui les contiennent.</div>`;
  if (!pr.list.length) return `<div class="muted" style="margin-top:8px">Mesure ${b + 1} : <b>${esc(pr.names.join(" "))}</b> — aucun accord simple ne les contient toutes ensemble.</div>`;
  return `<div style="margin-top:8px"><div class="muted">Accords pour la mesure ${b + 1} — notes : <b>${esc(pr.names.join(" "))}</b>. Touche un accord pour le placer.</div>
    <div class="chips wrap" style="margin-top:6px">${pr.list.map(c => {
      const root = spell(t, D_OF_S[c.s], c.s), on = cur && cur.s === c.s && cur.q === c.q;
      return `<button class="chip ${on ? "on2" : ""}" data-act="mel-chord" data-si="${si}" data-b="${b}" data-s="${c.s}" data-q="${c.q}">${esc(cName(root, c.q))}<small>${esc(mkChord(c.s, c.q).r)} · ${c.di ? "dans la tonalité" : "emprunt"}${c.cov < .999 ? " · " + Math.round(c.cov * 100) + " %" : ""}</small></button>`;
    }).join("")}</div></div>`;
}

function themeInner(si, was) {
  const sec = S.song.sections[si], has = hasMel(sec), ed = ED.si === si, nn = allMel(sec).reduce((x, m) => x + m.length, 0), nst = nStaves(sec);
  const staves = Array.from({ length: nst }, (_, k) => {
    const v = vOf(sec, k), act = ed && Math.min(ED.v, nst - 1) === k;
    return `<div class="tr" style="margin-top:6px"><button class="chip sm ${act ? "on2" : ""}" data-act="mel-st" data-si="${si}" data-v="${k}" title="Écrire sur cette portée">Portée ${k + 1}${act ? " ✎" : ""}</button>
      <select data-act="mel-clef" data-si="${si}" data-v="${k}" title="Changer la clé de cette portée">${Object.keys(CLEFS).map(c => `<option value="${c}" ${clefOf(v) === c ? "selected" : ""}>Clé de ${CLEFS[c].n}</option>`).join("")}</select>
      ${k > 0 ? `<button class="chip sm" data-act="mel-delst" data-si="${si}" data-v="${k}">Supprimer</button>` : ""}</div>
     <div style="overflow-x:auto">${staffSvg(si, k)}</div>`;
  }).join("");
  const open = was === null || was === undefined ? (!has && !ed) : was;
  return `<div class="tr"><b>Thème</b>
      <span class="muted" style="flex:1">${has ? nn + " note" + (nn > 1 ? "s" : "") : "mélodie à ajouter"}</span>
      <button class="btn sm" data-act="mel-edit" data-si="${si}">${ed ? "Fermer la saisie" : "✎ Écrire le thème sur la portée"}</button>
      ${has ? `<button class="btn sm sec" data-act="mel-clear" data-si="${si}">Effacer</button>` : ""}</div>
     ${staves}
     <div class="tr" style="margin-top:6px">${nst < MAXST ? `<button class="btn sm sec" data-act="mel-addst" data-si="${si}">+ Ajouter une portée</button>` : ""}
      <span class="muted">Clic droit (ou appui long) sur une note : la retirer.</span></div>
     ${ed ? propsHtml(si) : ""}
     <details ${open ? "open" : ""}><summary>Écrire le thème en texte (portée 1)</summary>
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
    z.innerHTML = `<div class="tr"><span class="muted">Zoom des sections</span><button class="btn sm sec" data-act="mel-zoom" data-v="-1" ${zi === 0 ? "disabled" : ""}>− Dézoomer</button><b>${Math.round(zoomObj().z * 100)} %</b><button class="btn sm sec" data-act="mel-zoom" data-v="1" ${zi === ZOOMS.length - 1 ? "disabled" : ""}>Zoomer +</button></div>`;
    first.closest(".card").before(z);
  }
  const pn = $("panel"); if (pn) { pn.style.setProperty("--cols", zoomObj().c); pn.style.setProperty("--z", zoomObj().z); }
  const hdr = document.querySelector('#panel [data-act="splay"]');
  if (hdr && !$("mel-voice") && S.song.sections.some(hasMel)) {
    const b = document.createElement("button");
    b.id = "mel-voice"; b.className = "chip sm " + (S.song.melOff ? "" : "on2"); b.dataset.act = "mel-voice"; b.textContent = "Thème";
    hdr.parentNode.appendChild(b);
  }
  syncFloat();
};

let lastTouchRm = 0, lpTimer = null, lpStart = null;       // dernier retrait par appui long : évite le doublon avec « contextmenu » et le clic qui suit
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t || !/^mel-/.test(t.dataset.act)) return;
  if (Date.now() - lastTouchRm < 800) return;
  const act = t.dataset.act, sec = S.song.sections[ED.si >= 0 ? ED.si : +t.dataset.si], si = +t.dataset.si;
  if (act === "mel-zoom") { setZoom(zi + +t.dataset.v); return; }
  if (act === "mel-voice") { S.song.melOff = !S.song.melOff; if (!S.song.melOff) delete S.song.melOff; persist(); render(); return; }
  if (act === "mel-edit") {
    ED.si = ED.si === si ? -1 : si; ED.pos = 0; ED.collapsed = false; refresh();
    if (ED.si >= 0) { const c = document.querySelector(`.themecard[data-si="${si}"]`); if (c) c.scrollIntoView({ block: "start", behavior: "smooth" }); }
    return;
  }
  if (act === "mel-pos" && (ED.si !== si || ED.v !== (+t.dataset.v || 0))) {    // toucher une autre section / une autre portée : on y ouvre la saisie
    const s0 = S.song.sections[si];
    if (s0) { ED.si = si; ED.v = +t.dataset.v || 0; ED.pos = +t.dataset.pos; ED.collapsed = false; ED.base = CLEFS[clefOf(vOf(s0, ED.v))].base; refresh(); }
    return;
  }
  if (act === "mel-st") { if (S.song.sections[si]) { ED.si = si; ED.v = +t.dataset.v; ED.collapsed = false; ED.base = CLEFS[clefOf(vOf(S.song.sections[si], ED.v))].base; refresh(); } return; }
  if (act === "mel-addst") {
    const s0 = S.song.sections[si]; if (!s0 || nStaves(s0) >= MAXST) return;
    const last = clefOf(vOf(s0, nStaves(s0) - 1)), c = last === "sol" ? "fa" : "sol";
    (s0.st = s0.st || []).push({ clef: c }); ED.si = si; ED.v = nStaves(s0) - 1; ED.pos = 0; ED.collapsed = false; ED.base = CLEFS[c].base; persist(); refresh(); return;
  }
  if (act === "mel-delst") {
    const s0 = S.song.sections[si], k = +t.dataset.v; if (!s0 || !s0.st || k < 1) return;
    s0.st.splice(k - 1, 1); if (!s0.st.length) delete s0.st;
    if (ED.si === si && ED.v >= nStaves(s0)) ED.v = 0; persist(); refresh(); return;
  }
  if (act === "mel-stack") { ED.stack = !ED.stack; refresh(); return; }
  if (act === "mel-chord") {
    const s0 = S.song.sections[si], b = +t.dataset.b; if (!s0 || !(b >= 0 && b < s0.bars.length)) return;
    s0.bars[b] = mkChord(+t.dataset.s, t.dataset.q); persist(); render(); return;
  }
  if (act === "mel-close") { ED.si = -1; refresh(); return; }
  if (act === "mel-fold") { ED.collapsed = !ED.collapsed; refresh(); return; }
  if (act === "mel-dock") { ED.fp = null; try { localStorage.removeItem(K_KB); } catch (x) { } refresh(); return; }
  if (act === "mel-clear") { const s = S.song.sections[si]; if (s) { delete s.mel; (s.st || []).forEach(x => delete x.mel); persist(); refresh(); } return; }
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
      const r = noteFromClick(ev, t, sec, clefOf(cv(sec)));
      tone(r.m, undefined, .5, .12, "sawtooth");
      putNote(sec, cv(sec), r.rel, ED.dur); ED.stAcc = ""; persist();
    }
  }
  else if (act === "mel-click") ED.click = t.dataset.v;
  else if (act === "mel-sa") ED.stAcc = ED.stAcc === t.dataset.v ? "" : t.dataset.v;
  else if (act === "mel-dur") ED.dur = +t.dataset.v;
  else if (act === "mel-mv") ED.pos = t.dataset.v === "home" ? 0 : Math.max(0, Math.min(total, ED.pos + +t.dataset.v));
  else if (act === "mel-acc") ED.acc = { auto: "#", "#": "b", b: "auto" }[ED.acc];
  else if (act === "mel-oct") ED.base = Math.max(36, Math.min(72, ED.base + 12 * +t.dataset.v));
  else if (act === "mel-rest") { putNote(sec, cv(sec), null, ED.dur); persist(); }
  else if (act === "mel-back") { backspace(sec, cv(sec)); persist(); }
  else if (act === "mel-key") {
    const m = +t.dataset.m;
    tone(m, undefined, .5, .12, "sawtooth");
    putNote(sec, cv(sec), relOf(secTon(sec), m), ED.dur); persist();
  }
  refresh();
});

document.addEventListener("change", ev => {
  const t = ev.target; if (!t.dataset || t.dataset.act !== "mel-clef") return;
  const sec = S.song.sections[+t.dataset.si], k = +t.dataset.v; if (!sec || !CLEFS[t.value]) return;
  const v = vOf(sec, k); if (t.value === "sol") delete v.clef; else v.clef = t.value;
  ED.si = +t.dataset.si; ED.v = k; ED.base = CLEFS[t.value].base; persist(); refresh();
});

/* retirer une note : clic droit (souris) ou appui long (tactile) sur la note dans la portée, ou sur sa touche du clavier */
function delNoteAt(zone, ev) {
  const si = +zone.dataset.si, k = +zone.dataset.v || 0, a = +zone.dataset.pos, sec = S.song.sections[si]; if (!sec) return false;
  const v = vOf(sec, k), bot = CLEFS[clefOf(v)].bot, t = secTon(sec), pc = posFromY(ev, zone), list = toAbs(v);
  let best = null;
  list.forEach(x => { if (x.a <= a && a < x.a + x.n) { const dd = Math.abs(posOf(t, x, bot) - pc); if (dd <= 4 && (!best || dd < best.dd)) best = { x, dd }; } });
  if (!best) return false;
  fromAbs(sec, v, list.filter(x => x !== best.x));
  if (ED.si === si && ED.v === k) ED.pos = best.x.a;
  persist(); refresh(); return true;
}
function delKeyNote(key) {
  if (ED.si < 0) return false;
  const sec = S.song.sections[ED.si]; if (!sec) return false;
  const v = cv(sec), t = secTon(sec), m = +key.dataset.m, list = toAbs(v);
  let best = null;
  list.forEach(x => {
    if (midiOf(t, [0, 0, 0, x.d, x.s, x.o]) !== m) return;
    const before = x.a < ED.pos;                                // on préfère la dernière note posée avant le curseur
    if (!best || (before && !best.before) || (before === best.before && x.a > best.x.a)) best = { x, before };
  });
  if (!best) return false;
  fromAbs(sec, v, list.filter(x => x !== best.x)); ED.pos = best.x.a; persist(); refresh(); return true;
}
const RMSEL = '[data-act="mel-pos"],[data-act="mel-key"]';
const removeFrom = (z, ev) => z.dataset.act === "mel-key" ? delKeyNote(z) : delNoteAt(z, ev);
document.addEventListener("contextmenu", ev => {
  const z = ev.target.closest(RMSEL); if (!z) return;
  ev.preventDefault();
  if (Date.now() - lastTouchRm < 800) return;
  if (ev.pointerType && ev.pointerType !== "mouse") lastTouchRm = Date.now();
  removeFrom(z, ev);
});
document.addEventListener("pointerdown", ev => {
  if (ev.pointerType === "mouse") return;
  const z = ev.target.closest(RMSEL); if (!z) return;
  clearTimeout(lpTimer);
  const pt = { clientX: ev.clientX, clientY: ev.clientY }; lpStart = pt;
  lpTimer = setTimeout(() => { if (Date.now() - lastTouchRm < 800) return; lastTouchRm = Date.now(); removeFrom(z, pt); }, 520);
});
document.addEventListener("pointermove", ev => {            // le doigt bouge de plus de 10 px : c'est un défilement, pas un appui long
  if (lpTimer && lpStart && Math.hypot(ev.clientX - lpStart.clientX, ev.clientY - lpStart.clientY) > 10) { clearTimeout(lpTimer); lpTimer = null; }
});
["pointerup", "pointercancel"].forEach(n => document.addEventListener(n, () => { clearTimeout(lpTimer); lpTimer = null; }));

/* ---------- lecture : on joue le thème à chaque pulsation, par-dessus l'accompagnement ---------- */
const _songTick = songTick;
songTick = function () {
  const p0 = P.pulse;
  const r = _songTick.apply(this, arguments);
  try {
    if (!P.on || S.song.melOff) return r;
    const en = P.seq[P.i]; if (!en) return r;
    const sec = S.song.sections[en.si]; if (!sec || !hasMel(sec)) return r;
    const hits = [].concat(...allMel(sec)).filter(n => n[0] === en.bi && n[1] === p0);
    if (!hits.length) return r;
    const t = shiftOf(sec) ? shiftTon(S.tonic, shiftOf(sec)) : S.tonic;
    hits.forEach(n => tone(midiOf(t, n), undefined, Math.max(.15, n[2] * 30 / S.song.bpm * .95), .09, "sawtooth"));
  } catch (x) { }
  return r;
};

const _render = render;
render = function () { _render.apply(this, arguments); if (S.tab !== "song" && ED.si >= 0) { ED.si = -1; syncFloat(); } };

window.__mel = { toText, fromText, midiOf, vOf, chordProps, posOf, ED };
if (S.tab === "song") render();
})();
