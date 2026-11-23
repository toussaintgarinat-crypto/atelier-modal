/* Atelier modal — Exercices (chargé en dernier).
   1) Doigtés (1 index · 2 majeur · 3 annulaire · 4 auriculaire) sur tous les diagrammes d'accords de guitare,
      et carte « Formes CAGED » avec les doigtés des cinq formes pour la tonalité choisie.
   2) Onglet « Exercices » (groupe Apprendre) :
        - Gammes : tableau des bonnes positions (gamme de 2 octaves / d'1 octave) + exercices,
        - Double-stops : tierces le long du manche, en travers du manche, barré sur deux cordes (blues).
      Chaque exercice donne des consignes, la portée, la tablature avec doigtés, le diagramme du manche et la grille.
   Les textes sont écrits ici en trois langues (T(fr, en, es)) : ils ne passent pas par les dictionnaires i18n. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const LG = window.__lang || "fr";
const T = (fr, en, es) => LG === "en" ? en : LG === "es" ? es : fr;
const ord = n => LG === "en" ? n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th") : LG === "es" ? n + ".ª" : (n === 1 ? "1ʳᵉ" : n + "ᵉ");
const MAJ = [0, 2, 4, 5, 7, 9, 11];
const EX = { sec: "gam", pair: 4, blues: "tierce" };
const AMBER = "#f5b13d", INK = "#e8eef4", MUTED = "#93a1b0", BG = "#18202a";

/* ====================================================================================
   1. DOIGTÉS SUR LES DIAGRAMMES D'ACCORDS
   ==================================================================================== */
/* frets : 6 valeurs (corde 6 → 1), null = étouffée, 0 = à vide. Renvoie les doigts par corde et le barré éventuel. */
function fingering(fr) {
  const fin = fr.map(() => null), idx = [];
  fr.forEach((f, i) => { if (f != null && f > 0) idx.push(i); });
  if (!idx.length) return { fin, barre: null };
  const low = Math.min(...idx.map(i => fr[i])), lowIdx = idx.filter(i => fr[i] === low);
  let barre = null, next = 1;
  if (lowIdx.length >= 2) {
    const a = lowIdx[0], b = lowIdx[lowIdx.length - 1];
    let ok = b === 5;
    for (let i = a; i <= b && ok; i++) if (fr[i] === 0) ok = false;
    if (ok) { barre = { f: low, a, b }; lowIdx.forEach(i => fin[i] = 1); next = 2; }
  }
  const rest = idx.filter(i => fin[i] == null).sort((x, y) => fr[x] - fr[y] || x - y);
  const groups = [];
  rest.forEach(i => { const g = groups[groups.length - 1]; g && g.f === fr[i] ? g.s.push(i) : groups.push({ f: fr[i], s: [i] }); });
  groups.forEach(g => {
    if (barre && g.s.length >= 3) { const v = Math.min(4, next + 1); g.s.forEach(i => fin[i] = v); next = v + 1; }
    else g.s.forEach(i => { fin[i] = Math.min(4, next); next++; });
  });
  return { fin, barre };
}
const _diagramFrets = diagramFrets;
diagramFrets = function (fr) {
  const r = _diagramFrets(fr), { fin, barre } = fingering(fr);
  const pos = fr.filter(f => f != null && f > 0), mx = pos.length ? Math.max(...pos) : 0, mn = pos.length ? Math.min(...pos) : 1, s0 = mx > 4 ? mn : 1;
  let add = "";
  const cy = f => 26 + 16 * (f - s0) + 8;
  if (barre) add += `<rect x="${24 + 15 * barre.a - 5.5}" y="${cy(barre.f) - 5.5}" width="${15 * (barre.b - barre.a) + 11}" height="11" rx="5.5" fill="${INK}"/>`;
  fr.forEach((f, i) => { if (f != null && f > 0 && fin[i]) add += `<text x="${24 + 15 * i}" y="${cy(f) + 3.2}" font-size="9" font-weight="700" text-anchor="middle" fill="#0f1419">${fin[i]}</text>`; });
  return { svg: r.svg.replace(/<\/svg>$/, add + "</svg>"), midis: r.midis };
};
const LEG = () => `<div class="muted" style="margin-top:6px">${T("Doigts : 1 index · 2 majeur · 3 annulaire · 4 auriculaire. Trait plein = barré (l’index couvre plusieurs cordes).",
  "Fingers: 1 index · 2 middle · 3 ring · 4 pinky. Solid bar = barre (the index covers several strings).",
  "Dedos: 1 índice · 2 medio · 3 anular · 4 meñique. Trazo continuo = cejilla (el índice cubre varias cuerdas).")}</div>`;
const addLeg = h => { const i = h.lastIndexOf("</div>"); return i < 0 ? h : h.slice(0, i) + LEG() + h.slice(i); };
const _dictHtml = dictHtml, _positionsHtml = positionsHtml;
dictHtml = function () { return addLeg(_dictHtml.apply(this, arguments)); };
positionsHtml = function () { const h = _positionsHtml.apply(this, arguments); return h ? addLeg(h) : h; };

/* Carte « Formes CAGED » : les cinq formes de l'accord majeur de la tonalité, dans l'ordre du manche, avec doigtés. */
function cagedCard() {
  const t = S.tonic, seen = {}, list = [];
  positions(t, "maj").forEach(x => { if (!seen[x.form]) { seen[x.form] = 1; list.push(x); } });
  const sel = S.caged ? ["E", "D", "C", "A", "G"][S.caged - 1] : null;
  const cells = list.map(x => {
    const d = diagramFrets(x.fr), pos = x.fr.filter(f => f != null && f > 0), mn = pos.length ? Math.min(...pos) : 0;
    return `<button data-act="diagram" data-v="${d.midis.map(m => m + 12).join(",")}" style="${sel === x.form ? "border-color:var(--ac);box-shadow:0 0 0 1px var(--ac)" : ""}"><b>${T("Forme", "Shape", "Forma")} ${x.form}</b>${d.svg}<small>${mn > 1 ? T("case ", "fret ", "traste ") + mn : T("position basse", "low position", "posición baja")}</small></button>`;
  }).join("");
  return `<div class="card" data-i18n-skip><h2>${T("Formes CAGED", "CAGED shapes", "Formas CAGED")} · ${nmN(t)} <span class="muted">· ${T("avec doigtés", "with fingerings", "con digitaciones")}</span></h2>
  <div class="dg2">${cells}</div>${LEG()}
  <div class="muted" style="margin-top:6px">${T(
    "Les cinq formes (C, A, G, E, D) sont les accords ouverts que l’on déplace sur le manche : elles s’enchaînent toujours dans cet ordre et dessinent le même accord à cinq endroits. Ordre pour " + nmN(t) + " : <b>" + list.map(x => x.form).join(" → ") + "</b>. Touche une forme pour l’entendre ; choisis une forme dans « Boîte (CAGED) » pour voir la zone de gamme correspondante.",
    "The five shapes (C, A, G, E, D) are the open chords moved along the neck: they always follow each other in this order and draw the same chord in five places. Order for " + nmN(t) + ": <b>" + list.map(x => x.form).join(" → ") + "</b>. Tap a shape to hear it; pick a shape in “Box (CAGED)” to see the matching scale area.",
    "Las cinco formas (C, A, G, E, D) son los acordes abiertos que se desplazan por el mástil: siempre se encadenan en este orden y dibujan el mismo acorde en cinco sitios. Orden para " + nmN(t) + ": <b>" + list.map(x => x.form).join(" → ") + "</b>. Toca una forma para oírla; elige una forma en « Caja (CAGED) » para ver la zona de escala correspondiente.")}</div></div>`;
}
const _renderInstruments = renderInstruments;
renderInstruments = function () {
  _renderInstruments.apply(this, arguments);
  const i = $("inst");
  if (S.tab === "exo") { if (i) i.innerHTML = ""; return; }
  if (S.inst !== "piano" && i) { const c = i.querySelector(".card"); if (c) c.insertAdjacentHTML("afterend", cagedCard()); }
};

/* ====================================================================================
   2. GRAVURE : portée + tablature + doigtés
   ==================================================================================== */
const SHARPS = [38, 35, 39, 36, 33, 37, 34], FLATS = [34, 37, 33, 36, 32, 35, 31];
const SH_L = [3, 0, 4, 1, 5, 2, 6], FL_L = [6, 2, 5, 1, 4, 0, 3];           // lettres (0 = do) dans l'ordre de l'armure
const fif = t => FIF[L[t.l]] + 7 * t.a;
function keyAcc(f) { const m = {}; (f > 0 ? SH_L : FL_L).slice(0, Math.abs(f)).forEach(l => m[l] = f > 0 ? 1 : -1); return m; }
/* note = { midi (son réel), d (degré 0-6), s (demi-tons depuis la tonique) } ; la portée s'écrit une octave plus haut (convention guitare). */
function pitchInfo(tonic, n) {
  const sp = spell(tonic, n.d, n.s), wm = n.midi + 12, oct = Math.round((wm - NAT[sp.l] - sp.a) / 12) - 1;
  return { l: sp.l, a: sp.a, dn: 7 * oct + sp.l };
}
/* items : [{ n:[notes], tabs:[[{str,f,fin}]], chord?:"Do7" }]. Une ligne de portée par groupe de `per` éléments. */
function engrave(items, o) {
  o = o || {};
  const tonic = o.tonic || S.tonic, per = o.per || 8, dx = o.dx || 40, f = fif(tonic), ka = keyAcc(f), nTab = items[0].tabs.length;
  let out = "";
  for (let r0 = 0; r0 < items.length; r0 += per) {
    const row = items.slice(r0, r0 + per), infos = row.map(it => it.n.map(n => pitchInfo(tonic, n)));
    const ks = Math.abs(f) * 11, x0 = 52 + ks + (ks ? 10 : 0) + 18, W = x0 + row.length * dx + 10;
    const dns = infos.flat().map(p => p.dn), maxdn = Math.max(...dns), mindn = Math.min(...dns);
    const Y = dn => -5 * (dn - 30);                          // y relatif : ligne du bas de la portée = 0
    const hasCh = row.some(it => it.chord);
    const yMin = Math.min(-40, Y(maxdn) - 6) - 14 - (hasCh ? 20 : 0), yMax = Math.max(0, Y(mindn)) + 12;
    const tab0 = yMax + 30, vh = 112;
    const H = tab0 - yMin + nTab * vh;
    let g = `<svg viewBox="0 ${yMin} ${W} ${H}" width="100%" style="min-width:${Math.min(W, 560)}px;max-width:${W * 1.5}px">`;
    for (let i = 0; i < 5; i++) g += `<line x1="4" x2="${W - 4}" y1="${-10 * i}" y2="${-10 * i}" stroke="#8b98a5"/>`;
    g += `<text x="8" y="-2" font-size="58" fill="${INK}" font-family="'Noto Music','Segoe UI Symbol',serif">𝄞</text>`;
    (f > 0 ? SHARPS : FLATS).slice(0, Math.abs(f)).forEach((st, i) => { g += `<text x="${50 + 11 * i}" y="${Y(st) + 6}" font-size="20" fill="${AMBER}" text-anchor="middle">${f > 0 ? "♯" : "♭"}</text>`; });
    row.forEach((it, i) => {
      const x = x0 + i * dx + dx / 2 - 6, ps = infos[i];
      ps.forEach((p, j) => {
        const y = Y(p.dn);
        if (p.dn <= 28) for (let k = 28; k >= p.dn + (p.dn % 2 ? 1 : 0); k -= 2) g += `<line x1="${x - 11}" x2="${x + 11}" y1="${Y(k)}" y2="${Y(k)}" stroke="#8b98a5"/>`;
        if (p.dn >= 40) for (let k = 40; k <= p.dn; k += 2) g += `<line x1="${x - 11}" x2="${x + 11}" y1="${Y(k)}" y2="${Y(k)}" stroke="#8b98a5"/>`;
        if ((ka[p.l] || 0) !== p.a) g += `<text x="${x - 15}" y="${y + 6}" font-size="17" fill="${AMBER}" text-anchor="middle">${p.a > 0 ? "♯" : p.a < 0 ? "♭" : "♮"}</text>`;
        g += `<ellipse cx="${x}" cy="${y}" rx="6.6" ry="4.8" fill="${it.n[j].d === 0 && it.n[j].s % 12 === 0 && o.root !== false ? AMBER : INK}" transform="rotate(-18 ${x} ${y})"/>`;
      });
      const ys = ps.map(p => Y(p.dn)), down = ps.reduce((s, p) => s + p.dn, 0) / ps.length >= 34;
      g += down ? `<line x1="${x - 6}" x2="${x - 6}" y1="${Math.min(...ys)}" y2="${Math.max(...ys) + 28}" stroke="${INK}" stroke-width="1.4"/>`
                : `<line x1="${x + 6}" x2="${x + 6}" y1="${Math.max(...ys)}" y2="${Math.min(...ys) - 28}" stroke="${INK}" stroke-width="1.4"/>`;
      if (it.chord) g += `<text x="${x}" y="${yMin + 14}" font-size="13" font-weight="700" fill="${INK}" text-anchor="middle">${it.chord}</text>`;
      if (o.bars) g += `<line x1="${x0 + (i + 1) * dx}" x2="${x0 + (i + 1) * dx}" y1="-40" y2="0" stroke="#8b98a5"/>`;
    });
    for (let v = 0; v < nTab; v++) {
      const ty = tab0 + v * vh, line = s => ty + 12 * (5 - s);        // s = corde (0 = 6ᵉ, 5 = 1ʳᵉ) ; 1ʳᵉ corde en haut
      if (o.labels && o.labels[v]) g += `<text x="6" y="${ty - 8}" font-size="11" fill="${AMBER}" font-weight="650">${o.labels[v]}</text>`;
      for (let s = 0; s < 6; s++) g += `<line x1="30" x2="${W - 4}" y1="${line(s)}" y2="${line(s)}" stroke="#4a5a6b"/>`;
      g += ["T", "A", "B"].map((c, i) => `<text x="12" y="${ty + 14 + 14 * i}" font-size="12" font-weight="700" fill="${INK}" text-anchor="middle">${c}</text>`).join("");
      row.forEach((it, i) => {
        const x = x0 + i * dx + dx / 2 - 6, tb = (it.tabs[v] || []).slice().sort((a, b) => b.str - a.str);
        tb.forEach(t => { g += `<rect x="${x - 8}" y="${line(t.str) - 7}" width="16" height="14" fill="${BG}"/><text x="${x}" y="${line(t.str) + 4.5}" font-size="12.5" fill="${INK}" text-anchor="middle">${t.f}</text>`; });
        tb.forEach((t, k) => { g += `<text x="${x}" y="${ty + 72 + 14 * k}" font-size="12" font-weight="700" fill="${AMBER}" text-anchor="middle">${t.f === 0 ? "○" : t.fin}</text>`; });
        if (o.bars) g += `<line x1="${x0 + (i + 1) * dx}" x2="${x0 + (i + 1) * dx}" y1="${ty}" y2="${ty + 60}" stroke="#4a5a6b"/>`;
      });
      g += `<text x="4" y="${ty + 72}" font-size="9.5" fill="${MUTED}">${T("Doigts", "Fingers", "Dedos")}</text>`;
    }
    out += `<div class="scroll">${g}</svg></div>`;
  }
  return out;
}

/* Diagramme du manche : 4 cases, 6 cordes, doigts dans les pastilles (tonique en ambre). */
function neck(notes, p) {
  const cw = 56, ch = 20, x0 = 40, y0 = 26, W = x0 + 4 * cw + 12, H = y0 + 5 * ch + 14;
  let g = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W * 1.4}px;min-width:300px">`;
  for (let i = 0; i < 4; i++) g += `<text x="${x0 + i * cw + cw / 2}" y="15" font-size="12" fill="${MUTED}" text-anchor="middle">${p + i}</text>`;
  for (let i = 0; i <= 4; i++) g += `<line x1="${x0 + i * cw}" x2="${x0 + i * cw}" y1="${y0}" y2="${y0 + 5 * ch}" stroke="#4a5a6b" stroke-width="${i === 0 && p === 1 ? 4 : 1.5}"/>`;
  for (let r = 0; r < 6; r++) g += `<line x1="${x0}" x2="${x0 + 4 * cw}" y1="${y0 + r * ch}" y2="${y0 + r * ch}" stroke="#9aa7b4" stroke-width="${1 + .25 * r}"/><text x="${x0 - 14}" y="${y0 + r * ch + 4}" font-size="11" fill="${MUTED}" text-anchor="middle">${r + 1}</text>`;
  notes.forEach(n => {
    const cx = x0 + (n.f - p) * cw + cw / 2, cy = y0 + (5 - n.str) * ch;
    g += `<circle cx="${cx}" cy="${cy}" r="8.5" fill="${n.d === 0 ? AMBER : "#8fe5da"}"/><text x="${cx}" y="${cy + 4}" font-size="11.5" font-weight="700" text-anchor="middle" fill="#0f1419">${n.fin}</text>`;
  });
  return `<div class="scroll">${g}</svg></div><div class="muted">${T("Cordes 1 (aiguë) à 6 (grave) · numéro = doigt · ambre = tonique", "Strings 1 (high) to 6 (low) · number = finger · amber = tonic", "Cuerdas 1 (aguda) a 6 (grave) · número = dedo · ámbar = tónica")}</div>`;
}

/* Grille d'accords (12 mesures du blues, par lignes de 4). */
const gridHtml = ch => `<div class="bars" style="--cols:4">${ch.map(c => `<div class="bar">${c}</div>`).join("")}</div>`;

/* ====================================================================================
   3. GAMMES : bonnes positions
   ==================================================================================== */
function posOf(t) { const r6 = mod(t.pc - 4, 12) || 12, p1 = (r6 - 1) || 12, p2 = ((p1 + 5) % 12) || 12; return { p1, p2 }; }
/* Gamme majeure dans la fenêtre de 4 cases [p, p+3] ; départ sur la tonique de la corde s0 ; oct = nombre d'octaves. */
function pattern(t, p, s0, oct) {
  let rf = mod(t.pc - OPEN[s0], 12); while (rf < p) rf += 12;
  if (rf > p + 3) return null;
  const base = OPEN[s0] + rf, out = [];
  for (let i = 0; i <= 7 * oct; i++) {
    const d = i % 7, midi = base + 12 * Math.floor(i / 7) + MAJ[d];
    let hit = null;
    for (let s = 0; s < 6 && !hit; s++) { const f = midi - OPEN[s]; if (f >= p && f <= p + 3) hit = { str: s, f }; }
    if (!hit) return null;
    out.push({ midi, d, s: MAJ[d], str: hit.str, f: hit.f, fin: hit.f - p + 1 });
  }
  return out;
}
const tabOf = n => ({ str: n.str, f: n.f, fin: n.fin });
const single = (arr, extra) => arr.map(n => Object.assign({ n: [n], tabs: [[tabOf(n)]] }, extra || {}));
const keyName = () => nmN(S.tonic) + " " + T("majeur", "major", "mayor");
const noteNm = d => nmN(spell(S.tonic, d, MAJ[d]));

function exCard(title, sub, steps, body) {
  return `<div class="card exo"><h2>${title}${sub ? ` <span class="muted">· ${sub}</span>` : ""}</h2>${steps && steps.length ? `<ol class="exs">${steps.map(x => `<li>${x}</li>`).join("")}</ol>` : ""}${body}</div>`;
}
const gridBtn = () => `<div style="margin-top:8px"><button class="btn sm sec" data-act="tab" data-v="grid">${T("Ouvrir une grille pour s’accompagner", "Open a chord grid to play along", "Abrir una cuadrícula para acompañarse")}</button></div>`;
const tempo = () => T("Commencez à ♩ = 60 (une note par clic), puis montez à 80 puis 100 sans erreur.", "Start at ♩ = 60 (one note per click), then go up to 80, then 100 without mistakes.", "Empieza a ♩ = 60 (una nota por clic), luego sube a 80 y a 100 sin errores.");
const written = () => `<div class="muted" style="margin:4px 0 6px">${T("La portée est écrite une octave au-dessus du son réel (convention guitare).", "The staff is written one octave above the real sound (guitar convention).", "El pentagrama se escribe una octava por encima del sonido real (convención de guitarra).")}</div>`;

function gammesHtml() {
  const t = S.tonic, { p1, p2 } = posOf(t), A = pattern(t, p1, 0, 2), B = pattern(t, p2, 1, 1), up = A && A.slice(0, 8);
  const rows = [...Array(12)].map((_, pc) => {
    const names = TON.filter(x => x.pc === pc).map(nmN).join(" / "), q = posOf({ pc });
    return `<tr${pc === t.pc ? ' style="background:var(--sf2);font-weight:700;color:var(--root)"' : ""}><td style="text-align:left">${names}</td><td>${ord(q.p1)}</td><td>${ord(q.p2)}</td></tr>`;
  }).join("");
  let h = exCard(T("Les bonnes positions", "The good positions", "Las buenas posiciones"), keyName(), [
    T("Une <b>position</b> = la case sous l’index. La main reste immobile : elle couvre 4 cases, de la case <i>p</i> à la case <i>p</i>+3 (index = <i>p</i>, majeur = <i>p</i>+1, annulaire = <i>p</i>+2, auriculaire = <i>p</i>+3).",
      "A <b>position</b> = the fret under the index finger. The hand stays still: it covers 4 frets, from fret <i>p</i> to fret <i>p</i>+3 (index = <i>p</i>, middle = <i>p</i>+1, ring = <i>p</i>+2, pinky = <i>p</i>+3).",
      "Una <b>posición</b> = el traste bajo el índice. La mano se queda quieta: cubre 4 trastes, del traste <i>p</i> al <i>p</i>+3 (índice = <i>p</i>, medio = <i>p</i>+1, anular = <i>p</i>+2, meñique = <i>p</i>+3)."),
    T("<b>1ʳᵉ bonne position</b> : gamme de deux octaves, de la tonique de la 6ᵉ corde à la tonique de la 1ʳᵉ corde.", "<b>1st good position</b>: two-octave scale, from the tonic on the 6th string to the tonic on the 1st string.", "<b>1.ª buena posición</b>: escala de dos octavas, de la tónica de la 6.ª cuerda a la tónica de la 1.ª cuerda."),
    T("<b>2ᵉ bonne position</b> : gamme d’une octave, de la tonique de la 5ᵉ corde à la tonique de la 2ᵉ corde.", "<b>2nd good position</b>: one-octave scale, from the tonic on the 5th string to the tonic on the 2nd string.", "<b>2.ª buena posición</b>: escala de una octava, de la tónica de la 5.ª cuerda a la tónica de la 2.ª cuerda.")
  ].map(x => x), `<table style="width:100%;margin-top:6px"><tr><th style="text-align:left">${T("Tonalité", "Key", "Tonalidad")}</th><th>${T("1ʳᵉ position<br><small>(2 octaves)</small>", "1st position<br><small>(2 octaves)</small>", "1.ª posición<br><small>(2 octavas)</small>")}</th><th>${T("2ᵉ position<br><small>(1 octave)</small>", "2nd position<br><small>(1 octave)</small>", "2.ª posición<br><small>(1 octava)</small>")}</th></tr>${rows}</table>
    <div class="muted" style="margin-top:6px">${T("Choisissez la tonalité dans la barre du haut : les exercices ci-dessous s’adaptent.", "Pick the key in the top bar: the exercises below adapt to it.", "Elige la tonalidad en la barra superior: los ejercicios de abajo se adaptan.")}</div>`);
  if (!A || !B) return h + `<div class="card muted">${T("Exercice indisponible pour cette tonalité.", "Exercise not available for this key.", "Ejercicio no disponible para esta tonalidad.")}</div>`;
  const root = nmN(t);
  // 1. gamme 2 octaves
  h += exCard("1 · " + T("Gamme de " + keyName() + " sur 2 octaves", keyName() + " scale over 2 octaves", "Escala de " + keyName() + " en 2 octavas"), ord(p1) + " " + T("position", "position", "posición"), [
    T(`Placez l’index sur la case <b>${p1}</b> : la main reste entre les cases ${p1} et ${p1 + 3}.`, `Put the index on fret <b>${p1}</b>: the hand stays between frets ${p1} and ${p1 + 3}.`, `Pon el índice en el traste <b>${p1}</b>: la mano se queda entre los trastes ${p1} y ${p1 + 3}.`),
    T(`Départ sur ${root} (6ᵉ corde, case ${A[0].f}, doigt ${A[0].fin}) ; montez jusqu’à ${root} (1ʳᵉ corde, case ${A[14].f}, doigt ${A[14].fin}).`, `Start on ${root} (6th string, fret ${A[0].f}, finger ${A[0].fin}); climb to ${root} (1st string, fret ${A[14].f}, finger ${A[14].fin}).`, `Sal de ${root} (6.ª cuerda, traste ${A[0].f}, dedo ${A[0].fin}); sube hasta ${root} (1.ª cuerda, traste ${A[14].f}, dedo ${A[14].fin}).`),
    T("Redescendez par le même chemin (la descente est écrite à la suite), sans changer la position de la main. Alternez médiator bas / haut.", "Come back down the same way (the descent is written right after), without moving the hand. Alternate down / up picking.", "Baja por el mismo camino (el descenso está escrito a continuación), sin mover la mano. Alterna púa abajo / arriba."), tempo()
  ], written() + engrave(single(A.concat(A.slice(0, 14).reverse())), { per: 8 }) + neck(A, p1) + gridBtn());
  // 2. gamme 1 octave
  const upDown = B.concat(B.slice(0, 7).reverse());
  h += exCard("2 · " + T("Gamme de " + keyName() + " sur 1 octave", keyName() + " scale over 1 octave", "Escala de " + keyName() + " en 1 octava"), ord(p2) + " " + T("position", "position", "posición"), [
    T(`Index sur la case <b>${p2}</b> (cases ${p2} à ${p2 + 3}). Départ sur ${root} à la 5ᵉ corde, case ${B[0].f} (doigt ${B[0].fin}).`, `Index on fret <b>${p2}</b> (frets ${p2} to ${p2 + 3}). Start on ${root} on the 5th string, fret ${B[0].f} (finger ${B[0].fin}).`, `Índice en el traste <b>${p2}</b> (trastes ${p2} a ${p2 + 3}). Sal de ${root} en la 5.ª cuerda, traste ${B[0].f} (dedo ${B[0].fin}).`),
    T("Montez d’une octave puis redescendez sans à-coup : c’est la même forme qu’en 1ʳᵉ position, plus compacte et plus aiguë.", "Go up one octave and come back down smoothly: it is the same shape as in 1st position, more compact and higher.", "Sube una octava y baja sin sacudidas: es la misma forma que en 1.ª posición, más compacta y más aguda."), tempo()
  ], written() + engrave(single(upDown), { per: 8 }) + neck(B, p2));
  // 3. même mélodie, deux endroits du manche
  const k = A.findIndex(n => n.midi === B[0].midi);
  if (k >= 0 && k + 7 < A.length) {
    const sub = A.slice(k, k + 8), its = sub.map((n, i) => ({ n: [n], tabs: [[tabOf(n)], [tabOf(B[i])]] }));
    h += exCard("3 · " + T("Même gamme, deux endroits du manche", "Same scale, two places on the neck", "Misma escala, dos lugares del mástil"), T("relier les deux positions", "linking the two positions", "unir las dos posiciones"), [
      T("Jouez cette octave dans la 1ʳᵉ position (tablature du haut), puis exactement les mêmes notes dans la 2ᵉ position (tablature du bas) : la portée ne change pas.", "Play this octave in 1st position (upper tab), then exactly the same notes in 2nd position (lower tab): the staff does not change.", "Toca esta octava en 1.ª posición (tablatura de arriba), luego exactamente las mismas notas en 2.ª posición (tablatura de abajo): el pentagrama no cambia."),
      T("Variante : montez en 1ʳᵉ position et redescendez en 2ᵉ, en glissant l’index de la case " + p1 + " à la case " + p2 + " sur la note de passage.", "Variation: go up in 1st position and come down in 2nd, sliding the index from fret " + p1 + " to fret " + p2 + " on the linking note.", "Variante: sube en 1.ª posición y baja en 2.ª, deslizando el índice del traste " + p1 + " al traste " + p2 + " en la nota de enlace.")
    ], written() + engrave(its, { per: 8, labels: [ord(p1) + " " + T("position", "position", "posición"), ord(p2) + " " + T("position", "position", "posición")] }));
  }
  // 4. séquences par trois
  const seq = []; for (let i = 0; i < 6; i++) seq.push(B[i], B[i + 1], B[i + 2]);
  h += exCard("4 · " + T("Séquence en groupes de trois notes", "Sequence in groups of three notes", "Secuencia en grupos de tres notas"), ord(p2) + " " + T("position", "position", "posición"), [
    T("Jouez 1-2-3, 2-3-4, 3-4-5… jusqu’à 6-7-8 (numéros = degrés de la gamme).", "Play 1-2-3, 2-3-4, 3-4-5… up to 6-7-8 (numbers = scale degrees).", "Toca 1-2-3, 2-3-4, 3-4-5… hasta 6-7-8 (números = grados de la escala)."),
    T("Gardez les doigts proches des cordes : chaque doigt garde « sa » case.", "Keep your fingers close to the strings: each finger keeps “its” fret.", "Mantén los dedos cerca de las cuerdas: cada dedo conserva « su » traste."), tempo()
  ], written() + engrave(single(seq), { per: 9, dx: 36 }));
  // 5. arpège
  const ids = [0, 2, 4, 7, 9, 11, 14], arp = ids.concat(ids.slice(0, -1).reverse()).map(i => A[i]);
  h += exCard("5 · " + T("Arpège de " + root + " majeur", root + " major arpeggio", "Arpegio de " + root + " mayor"), ord(p1) + " " + T("position", "position", "posición"), [
    T(`Sur la gamme du 1 : ne jouez que les degrés 1 · 3 · 5 · 8 (${noteNm(0)} · ${noteNm(2)} · ${noteNm(4)}), sur deux octaves, puis redescendez.`, `On the scale of exercise 1: play only degrees 1 · 3 · 5 · 8 (${noteNm(0)} · ${noteNm(2)} · ${noteNm(4)}), over two octaves, then come back down.`, `Sobre la escala del 1: toca solo los grados 1 · 3 · 5 · 8 (${noteNm(0)} · ${noteNm(2)} · ${noteNm(4)}), en dos octavas, y vuelve a bajar.`),
    T("Jouez-le ensuite sur la grille : visez ces notes sur les temps forts de l’accord de " + root + ".", "Then play it over the grid: aim for these notes on the strong beats of the " + root + " chord.", "Después tócalo sobre la cuadrícula: apunta a estas notas en los tiempos fuertes del acorde de " + root + ".")
  ], written() + engrave(single(arp), { per: 7, dx: 44 }) + gridBtn());
  return h;
}

/* ====================================================================================
   4. DOUBLE-STOPS
   ==================================================================================== */
const stepOf = i => 12 * Math.floor(i / 7) + MAJ[i % 7];
const dyadFin = (fl, fh) => {
  const fr = [fl, fh].filter(f => f > 0); if (!fr.length) return [0, 0];
  const m = Math.min(...fr), g = f => f === 0 ? 0 : fr.length === 1 ? (f <= 4 ? f : 1) : f === m ? 1 : Math.min(4, f - m + 1);
  return [g(fl), g(fh)];
};
function dyadItem(t, low, high, s, fl, fh, extra) {                // low/high = {midi, d}
  const [a, b] = dyadFin(fl, fh);
  return Object.assign({ n: [{ midi: low.midi, d: low.d, s: low.s }, { midi: high.midi, d: high.d, s: high.s }], tabs: [[{ str: s, f: fl, fin: a }, { str: s + 1, f: fh, fin: b }]] }, extra || {});
}
/* Tierces diatoniques le long du manche, sur la paire de cordes (s, s+1). */
function thirdsAlong(t, s) {
  let f0 = mod(t.pc - OPEN[s], 12), res;
  for (let tries = 0; tries < 2; tries++, f0 += 12) {
    res = [];
    for (let k = 0; k < 8; k++) {
      const pl = OPEN[s] + f0 + stepOf(k), ph = pl + stepOf(k + 2) - stepOf(k), fl = pl - OPEN[s], fh = ph - OPEN[s + 1];
      if (fh < 0) { res = null; break; }
      if (Math.max(fl, fh) > 19) break;
      res.push(dyadItem(t, { midi: pl, d: k % 7, s: MAJ[k % 7] }, { midi: ph, d: (k + 2) % 7, s: MAJ[(k + 2) % 7] }, s, fl, fh));
    }
    if (res) return res;
  }
  return [];
}
/* Tierces en travers du manche : même gamme, mais on change de paire de cordes en montant (cordes à vide bienvenues). */
function thirdsAcross(t) {
  const base = c => .3 * (c.fl + c.fh) / 2 - (c.fl && c.fh ? 0 : .3);
  for (const maxF of [5, 9, 14]) {
    let best = null;
    for (let P0 = 40; P0 <= 70; P0++) {
      if (mod(P0 - t.pc, 12)) continue;
      const layers = [];
      for (let k = 0; k < 8; k++) {
        const pl = P0 + stepOf(k), th = stepOf(k + 2) - stepOf(k), c = [];
        for (let s = 0; s < 5; s++) { const fl = pl - OPEN[s], fh = pl + th - OPEN[s + 1]; if (fl >= 0 && fl <= maxF && fh >= 0 && fh <= maxF) c.push({ s, fl, fh, pl }); }
        layers.push(c);
      }
      if (layers.some(c => !c.length)) continue;
      let prev = layers[0].map(c => ({ c, cost: base(c), from: null }));
      for (let k = 1; k < 8 && prev.length; k++) {
        prev = layers[k].map(c => {
          let b = null;
          prev.forEach(p => {
            if (c.s < p.c.s) return;
            const cost = p.cost + base(c) - (c.s > p.c.s ? 1 : 0) + .4 * Math.abs((c.fl + c.fh) / 2 - (p.c.fl + p.c.fh) / 2);
            if (!b || cost < b.cost) b = { c, cost, from: p };
          });
          return b;
        }).filter(Boolean);
      }
      if (!prev.length) continue;
      const end = prev.reduce((x, y) => y.cost < x.cost ? y : x);
      if (!best || end.cost < best.cost) { const path = []; for (let n = end; n; n = n.from) path.unshift(n.c); best = { cost: end.cost, path }; }
    }
    if (best) return best.path.map((c, k) => dyadItem(t, { midi: c.pl, d: k % 7, s: MAJ[k % 7] }, { midi: c.pl + stepOf(k + 2) - stepOf(k), d: (k + 2) % 7, s: MAJ[(k + 2) % 7] }, c.s, c.fl, c.fh));
  }
  return [];
}

/* Blues à 12 mesures en double-stops barrés (deux cordes voisines, même case). */
function bluesItems(t, kind) {
  const roots = [[0, 0], [3, 5], [4, 7]], seqI = [0, 0, 0, 0, 1, 1, 0, 0, 2, 1, 0, 2];
  const s = kind === "tierce" ? 3 : 2, iv = kind === "tierce" ? 4 : 5, dd = kind === "tierce" ? 2 : 3;   // paire de cordes (G–B ou D–G), intervalle, distance de degrés
  const names = roots.map(([d, sm]) => nmN(spell(t, d, sm)) + "7"), items = seqI.map(i => {
    const [d, sm] = roots[i], r = mod(t.pc + sm - OPEN[s], 12), f = r === 0 ? 12 : r, pl = OPEN[s] + f;
    const it = dyadItem(t, { midi: pl, d, s: sm }, { midi: pl + iv, d: (d + dd) % 7, s: sm + iv }, s, f, f, { chord: names[i] });
    return it;
  });
  return { items, names: seqI.map(i => names[i]) };
}

function doublesHtml() {
  const t = S.tonic, root = nmN(t);
  let h = exCard(T("Les double-stops", "Double-stops", "Los double-stops"), T("deux notes à la fois", "two notes at once", "dos notas a la vez"), [
    T("Un <b>double-stop</b> = deux notes jouées en même temps. On le frette exactement comme un accord ou deux notes séparées.", "A <b>double-stop</b> = two notes played at the same time. Fret it exactly like a chord or two separate notes.", "Un <b>double-stop</b> = dos notas tocadas a la vez. Se pisa exactamente como un acorde o dos notas separadas."),
    T("<b>Doigtés</b> : index + majeur si les deux notes sont à une case l’une de l’autre ; index + annulaire si elles sont à deux cases l’une de l’autre ; <b>barré</b> (un seul doigt sur deux cordes) si elles sont sur la même case.", "<b>Fingering</b>: index + middle if the two notes are one fret apart; index + ring if they are two frets apart; <b>barre</b> (one finger across two strings) if they are on the same fret.", "<b>Digitación</b>: índice + medio si las dos notas están a un traste de distancia; índice + anular si están a dos trastes; <b>cejilla</b> (un solo dedo sobre dos cuerdas) si están en el mismo traste."),
    T("On joue ici des <b>tierces</b> (une note sur deux de la gamme) : c’est la harmonisation la plus naturelle en rock, country et mariachi.", "Here we play <b>thirds</b> (every other scale note): the most natural harmonisation in rock, country and mariachi.", "Aquí tocamos <b>terceras</b> (una nota de cada dos de la escala): la armonización más natural en rock, country y mariachi.")
  ], written());
  // 1. le long du manche
  const s = EX.pair, along = thirdsAlong(t, s);
  const chips = [4, 3, 2, 1, 0].map(i => `<button class="chip sm ${EX.pair === i ? "on2" : ""}" data-act="exo-pair" data-v="${i}">${T("cordes", "strings", "cuerdas")} ${6 - i}–${5 - i}</button>`).join("");
  h += exCard("1 · " + T("Tierces le long du manche", "Thirds along the neck", "Terceras a lo largo del mástil"), keyName(), [
    T("Choisissez une paire de cordes voisines ci-dessous, puis jouez la gamme de " + root + " en tierces en <b>remontant le long du manche</b>.", "Choose a pair of neighbouring strings below, then play the " + root + " scale in thirds <b>climbing up the neck</b>.", "Elige abajo un par de cuerdas contiguas y toca la escala de " + root + " en terceras <b>subiendo por el mástil</b>."),
    T("Gardez la forme de la main : les deux doigts d’un double-stop restent côte à côte ; seule la main avance. Les cases sont écrites dans la tablature.", "Keep the hand shape: the two fingers of a double-stop stay side by side; only the hand moves. Frets are written in the tab.", "Mantén la forma de la mano: los dos dedos de un double-stop quedan juntos; solo avanza la mano. Los trastes están escritos en la tablatura."),
    T("Aller-retour à ♩ = 60, puis chantez la note du haut en jouant.", "Up and down at ♩ = 60, then sing the top note while you play.", "Ida y vuelta a ♩ = 60 y luego canta la nota de arriba mientras tocas.")
  ], `<div class="chips" style="margin-bottom:8px">${chips}</div>` + (along.length ? engrave(along, { per: 8, dx: 44 }) : `<div class="muted">${T("Pas de place sur ces cordes pour cette tonalité : choisissez une autre paire.", "Not enough room on these strings for this key: pick another pair.", "No hay sitio en estas cuerdas para esta tonalidad: elige otro par.")}</div>`) + gridBtn());
  // 2. en travers du manche
  const across = thirdsAcross(t);
  if (across.length) h += exCard("2 · " + T("Tierces en travers du manche", "Thirds across the neck", "Terceras a través del mástil"), keyName(), [
    T("Même gamme en tierces, mais on <b>change de paire de cordes</b> en montant, avec les cordes à vide quand c’est possible : la main reste dans les premières cases.", "Same scale in thirds, but you <b>change string pair</b> as you climb, using open strings when possible: the hand stays in the first frets.", "La misma escala en terceras, pero <b>cambiando de par de cuerdas</b> al subir, con cuerdas al aire cuando se puede: la mano se queda en los primeros trastes."),
    T("Repérez le changement de paire de cordes : c’est là qu’on regarde la main. ○ = corde à vide.", "Spot where the string pair changes: that is where to watch your hand. ○ = open string.", "Fíjate en el cambio de par de cuerdas: ahí hay que mirar la mano. ○ = cuerda al aire."),
    T("Jouez-le lentement (♩ = 60) en laissant sonner les deux notes ensemble.", "Play it slowly (♩ = 60), letting both notes ring together.", "Tócalo despacio (♩ = 60) dejando sonar las dos notas juntas.")
  ], engrave(across, { per: 8, dx: 44 }) + gridBtn());
  // 3. barré sur deux cordes : blues
  const kind = EX.blues, bl = bluesItems(t, kind);
  const chips2 = [["tierce", T("tierces (cordes 3–2)", "thirds (strings 3–2)", "terceras (cuerdas 3–2)")], ["quarte", T("quartes (cordes 4–3)", "fourths (strings 4–3)", "cuartas (cuerdas 4–3)")]]
    .map(([k, l]) => `<button class="chip sm ${EX.blues === k ? "on2" : ""}" data-act="exo-blues" data-v="${k}">${l}</button>`).join("");
  h += exCard("3 · " + T("Barré sur deux cordes : blues en " + root, "Barre on two strings: blues in " + root, "Cejilla en dos cuerdas: blues en " + root), T("rock &amp; blues", "rock &amp; blues", "rock y blues"), [
    T("Les deux notes sont sur la <b>même case</b> : posez l’index à plat sur les deux cordes (barré) et déplacez-le d’un accord à l’autre.", "Both notes are on the <b>same fret</b>: lay the index flat across the two strings (barre) and slide it from chord to chord.", "Las dos notas están en el <b>mismo traste</b>: apoya el índice plano sobre las dos cuerdas (cejilla) y deslízalo de un acorde a otro."),
    T("Suivez la grille du blues de 12 mesures : un double-stop par mesure, répété en croches (ou en noires) pendant les 4 temps.", "Follow the 12-bar blues grid: one double-stop per bar, repeated in eighths (or quarters) for the 4 beats.", "Sigue la cuadrícula del blues de 12 compases: un double-stop por compás, repetido en corcheas (o negras) durante los 4 tiempos."),
    T("Rythme libre : essayez « bas–bas–haut–bas–haut » ou laissez sonner des noires, en étouffant avec la paume entre deux accords.", "Free rhythm: try “down–down–up–down–up” or let quarter notes ring, muting with the palm between chords.", "Ritmo libre: prueba «abajo–abajo–arriba–abajo–arriba» o deja sonar negras, apagando con la palma entre acordes.")
  ], `<div class="chips" style="margin-bottom:8px">${chips2}</div>` + gridHtml(bl.names) + `<div style="margin-top:8px"></div>` + engrave(bl.items, { per: 4, dx: 76, bars: true }) + gridBtn());
  return h;
}

/* ====================================================================================
   5. ONGLET « EXERCICES »
   ==================================================================================== */
function renderExo() {
  const p = $("panel"); if (!p) return;
  const seg = `<div class="seg" style="margin-bottom:10px">${[["gam", T("Gammes en position", "Scales in position", "Escalas en posición")], ["dbl", "Double-stops"]]
    .map(([k, l]) => `<button class="${EX.sec === k ? "on" : ""}" data-act="exo-sec" data-v="${k}">${l}</button>`).join("")}</div>`;
  let body = "";
  try { body = EX.sec === "dbl" ? doublesHtml() : gammesHtml(); } catch (e) { body = `<div class="card muted">${T("Exercice indisponible.", "Exercise not available.", "Ejercicio no disponible.")} ${e && e.message || ""}</div>`; }
  p.innerHTML = `<div data-i18n-skip>${seg}${body}</div>`;
}

const _render = render;
render = function () {
  _render.apply(this, arguments);
  if (S.tab === "exo") { renderExo(); const i = $("inst"); if (i) i.innerHTML = ""; }
};
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t || !/^exo-/.test(t.dataset.act)) return;
  const a = t.dataset.act, v = t.dataset.v;
  if (a === "exo-sec") EX.sec = v; else if (a === "exo-pair") EX.pair = +v; else if (a === "exo-blues") EX.blues = v;
  renderExo();
});
if (S.tab === "exo") render();
})();
