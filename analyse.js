/* Atelier modal — onglets Analyse (photo / saisie manuelle, OpenRouter) et Playlist.
   Chargé après app.js : réutilise ses fonctions globales (S, mkChord, spell, cName, loadSongObj, startSong…). */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const E = s => esc(s);
const K_OR = "atelier-modal-or", K_PL = "atelier-modal-playlists", K_AN = "atelier-modal-analyse", K_SONGS = "atelier-modal-songs";
const songsMap = () => lsGet(K_SONGS) || {};
const isMine = () => S.tab === "analyse" || S.tab === "playlist";

/* ================= Lecture des accords ================= */
function parseQ(r) {
  const s = r.trim().replace(/[()]/g, "");
  if (s === "") return "maj";
  const l = s.replace(/♭/g, "b").replace(/♯/g, "#");
  if (/^(m|min|mi|-)(7b5|b5|7\(b5\)|7-5)$/.test(l) || /^(ø|ø7|Ø|Ø7)$/.test(l)) return "m7b5";
  if (/^(dim|dim7|°|°7|o|o7)$/.test(l)) return "dim";
  if (/^(m|min|mi|-)(maj7|Maj7|M7|maj9|M9|Δ)/.test(l)) return "m7";
  if (/^(m|min|mi|-)6(\/9|9)?$/.test(l)) return "m6";
  if (/^(m|min|mi|-)(7|9|11|13)/.test(l)) return "m7";
  if (/^(m|min|mi|-)(add9|add11|add2|2|4|5)?$/.test(l)) return "m";
  if (/^(maj7|maj9|maj11|maj13|Maj7|Maj9|M7|M9|M13|Δ)/.test(l)) return "maj7";
  if (/^(aug7|\+7)/.test(l)) return "7";
  if (/^(6|6\/9|69)$/.test(l)) return "6";
  if (/^(7|9|11|13)/.test(l)) return "7";
  if (/^(sus4|sus|sus2)$/.test(l)) return "sus4";
  if (/^(maj|M|add9|add2|add11|2|4|5|aug|\+)$/.test(l)) return "maj";
  return null;
}
const BASIC = ["", "m", "7", "maj7", "m7", "m7b5", "dim", "6", "m6", "sus4"];
const FR_ROOTS = [["Sol", 4], ["Do", 0], ["Ré", 1], ["Re", 1], ["Mi", 2], ["Fa", 3], ["La", 5], ["Si", 6]];
const EN_ROOTS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
function parseChord(tok) {
  let s = tok.trim().replace(/^\(|\)$/g, "").replace(/^:+|:+$/g, "");
  if (!s) return null;
  s = s.replace(/\/[A-G][#b♯♭]?$/, "").replace(/\/(Do|Ré|Re|Mi|Fa|Sol|La|Si)[#b♯♭]?$/, "");
  const tries = [];
  for (const [n, l] of FR_ROOTS) if (s.startsWith(n)) tries.push([n.length, l]);
  if (EN_ROOTS[s[0]] !== undefined) tries.push([1, EN_ROOTS[s[0]]]);
  for (const [len, l] of tries) {
    let rest = s.slice(len), a = 0;
    const c = rest[0];
    if (c === "#" || c === "♯") { a = 1; rest = rest.slice(1); }
    else if (c === "b" || c === "♭") { a = -1; rest = rest.slice(1); }
    let q = parseQ(rest);
    if (q !== null) return { src: tok, root: { l, a, pc: mod(NAT[l] + a, 12) }, q, approx: !BASIC.includes(rest.trim().replace(/♭/g, "b")) && rest.trim() !== "" && !/^(maj|M|min|mi|-)$/.test(rest.trim()) };
    if (a === -1) {
      q = parseQ(s.slice(len));
      if (q !== null) return { src: tok, root: { l, a: 0, pc: NAT[l] }, q, approx: true };
    }
  }
  return null;
}

/* Texte -> sections -> mesures -> accords */
function parseGrid(text) {
  const sections = [], errors = [];
  let cur = { name: "Grille", bars: [] };
  const flush = () => { if (cur.bars.length) sections.push(cur); };
  const HDR = /^(Intro|Couplet|Refrain|Pont|Verse|Chorus|Bridge|Outro|Fin|Coda|Solo|Interlude|Break)\s*\d*\s*:\s*(.*)$/i;
  text.split(/\r?\n/).forEach(raw => {
    let line = raw.replace(/[‖𝄆𝄇]/g, "|").trim();
    if (!line) return;
    let m = line.match(/^\[(.+?)\]\s*(.*)$/);
    if (m) { flush(); cur = { name: m[1].trim(), bars: [] }; line = m[2].trim(); }
    else if ((m = line.match(HDR))) { flush(); cur = { name: line.split(":")[0].trim(), bars: [] }; line = m[2].trim(); }
    if (!line) return;
    let parts;
    if (line.includes("|")) parts = line.split("|").map(p => p.trim()).filter(p => p !== "");
    else parts = line.split(/[\s,;]+/).filter(Boolean);
    parts.forEach(p => {
      const toks = p.split(/[\s,]+/).filter(t => t && !/^[:|‖]+$/.test(t) && !/^x\d+$/i.test(t));
      if (!toks.length) return;
      const bar = [];
      toks.forEach(t => {
        if (t === "%" || t === "//") { const prev = cur.bars[cur.bars.length - 1]; if (prev) prev.forEach(c => bar.push(c)); return; }
        if (/^(N\.?C\.?|NC|\.|-|—|x)$/i.test(t)) return;
        const c = parseChord(t);
        if (c) bar.push(c); else { errors.push(t); bar.push({ src: t, err: true }); }
      });
      cur.bars.push(bar);
    });
  });
  flush();
  return { sections, errors };
}

/* ================= Tonalité ================= */
const fam = q => (q === "maj" || q === "maj7" || q === "6" || q === "sus4") ? "M" : (q === "m" || q === "m7" || q === "m6") ? "m" : q === "7" ? "D" : "d";
const MAJ_DEG = { 0: "M", 2: "m", 4: "m", 5: "M", 7: "M", 9: "m", 11: "d" };
const MIN_DEG = { 0: "m", 2: "d", 3: "M", 5: "m", 7: "m", 8: "M", 10: "M" };
function scoreKey(ev, tpc, minor) {
  const tbl = minor ? MIN_DEG : MAJ_DEG;
  let sc = 0;
  ev.forEach((e, i) => {
    const r = mod(e.c.root.pc - tpc, 12), f = fam(e.c.q), want = tbl[r];
    if (want !== undefined) {
      if (f === want) sc += 2;
      else if (f === "D" && r === 7) sc += 2;
      else if (f === "D" && want === "M") sc += 1;
      else if (f === "D" && tbl[mod(r + 5, 12)] !== undefined) sc += 1;
      else if (minor && r === 7 && f === "M") sc += 2;
      else if ((f === "M" && want === "m") || (f === "m" && want === "M")) sc += 0.3;
    } else {
      if (!minor && ((r === 10 && (f === "M" || f === "D")) || (r === 8 && f === "M") || (r === 3 && f === "M") || (r === 5 && f === "m"))) sc += 0.7;
      else if (f === "D" && tbl[mod(r + 5, 12)] !== undefined) sc += 1;
      else if (minor && r === 1 && f === "M") sc += 0.5;
      else sc -= 0.4;
    }
    const isTon = r === 0 && (minor ? (f === "m") : (f === "M"));
    if (isTon) sc += 0.5;
    if (i === 0 && isTon) sc += 2;
    if (i === ev.length - 1 && (isTon || (minor && r === 0 && f === "M"))) sc += 2.5;
    const nx = ev[i + 1];
    if (nx && f === "D" && r === 7 && mod(nx.c.root.pc - tpc, 12) === 0) sc += 2;
    const nx2 = ev[i + 2];
    if (nx && nx2 && r === 2 && (f === "m" || f === "d") && mod(nx.c.root.pc - tpc, 12) === 7 && mod(nx2.c.root.pc - tpc, 12) === 0) sc += 1;
  });
  return sc;
}
function rank(ev) {
  const out = [];
  for (let p = 0; p < 12; p++) { out.push({ pc: p, minor: false, sc: scoreKey(ev, p, false) }); out.push({ pc: p, minor: true, sc: scoreKey(ev, p, true) }); }
  return out.sort((a, b) => b.sc - a.sc);
}
function chooseTon(pc, minor) {
  const c = TON.map((t, i) => ({ t, i })).filter(x => x.t.pc === pc);
  if (!c.length) return { t: bestTon(pc), i: TON.indexOf(bestTon(pc)) };
  c.sort((a, b) => {
    const fa = Math.abs(fifths(minor ? spell(a.t, 2, 3) : a.t)), fb = Math.abs(fifths(minor ? spell(b.t, 2, 3) : b.t));
    return fa - fb;
  });
  return c[0];
}

/* ================= Analyse ================= */
function withTonic(t, fn) { const old = S.tonic; S.tonic = t; try { return fn(); } finally { S.tonic = old; } }
function analyse(parsed, override) {
  const ev = []; let barNo = 0;
  parsed.sections.forEach((sec, si) => sec.bars.forEach((bar, bi) => {
    barNo++;
    bar.forEach(c => { if (!c.err) ev.push({ c, si, bi, no: barNo }); });
  }));
  if (!ev.length) return { error: "Aucun accord reconnu. Vérifie la saisie (ex. Am7, D7, Gmaj7)." };
  const ranked = rank(ev);
  let pick = override || { pc: ranked[0].pc, minor: ranked[0].minor };
  if (!override && ev.length >= 6 && ev.every(e => fam(e.c.q) === "D") && ev.every(e => [0, 5, 7].includes(mod(e.c.root.pc - ev[0].c.root.pc, 12)))) pick = { pc: ev[0].c.root.pc, minor: false };
  const ct = override && override.forceIdx !== undefined ? { t: TON[override.forceIdx], i: override.forceIdx } : chooseTon(pick.pc, pick.minor);
  const tonic = ct.t, minor = pick.minor, mode = minor ? "min" : "maj";
  const rel = minor ? chooseTon(mod(pick.pc + 3, 12), false) : chooseTon(mod(pick.pc + 9, 12), true);
  const nm = t => nmN(t);
  const keyName = nm(tonic) + (minor ? " mineur" : " majeur");
  const relName = nm(rel.t) + (minor ? " majeur" : " mineur");
  const topScore = ranked[0].sc, thisScore = ranked.find(r => r.pc === pick.pc && r.minor === minor).sc;
  const relScore = ranked.find(r => r.pc === rel.t.pc && r.minor === !minor).sc;
  const ambiguous = Math.abs(thisScore - relScore) < 2.5;

  const info = e => {
    const s = mod(e.c.root.pc - tonic.pc, 12), ch = mkChord(s, e.c.q);
    return { s, ch, name: cName(spell(tonic, ch.d, ch.s), ch.q), rn: ch.r };
  };
  ev.forEach(e => { e.i = info(e); });

  /* Observations : progressions reconnues, emprunts, résolutions */
  const obs = [];
  const range = (a, b) => a === b ? `mesure ${a}` : `mesures ${a}–${b}`;
  const matches = (e, p) => {
    const [s, q7, qt] = p;
    if (e.i.s !== s) return false;
    const q = e.c.q;
    if (q === q7 || q === qt || fam(q) === fam(q7)) return true;
    return q7 === "7" && fam(q) === "M";
  };
  (PROGS[mode] || []).forEach(p => {
    const hits = [];
    for (let i = 0; i + p.ch.length <= ev.length; i++) {
      let ok = true;
      for (let j = 0; j < p.ch.length && ok; j++) ok = matches(ev[i + j], p.ch[j]);
      if (ok) { hits.push([ev[i].no, ev[i + p.ch.length - 1].no]); i += p.ch.length - 1; }
    }
    if (hits.length) obs.push({ title: p.n, tag: p.tag, where: hits.slice(0, 4).map(h => range(h[0], h[1])).join(", ") + (hits.length > 4 ? "…" : ""), text: p.w });
  });
  const dom = [];
  ev.forEach((e, i) => {
    const nx = ev[i + 1];
    if (!nx || fam(e.c.q) !== "D") return;
    const d = mod(nx.c.root.pc - e.c.root.pc, 12);
    if (d === 5) {
      const main = e.i.s === 7 && nx.i.s === 0;
      dom.push(`${e.i.name} → ${nx.i.name} (${main ? "V→I : résolution classique" : `dominante secondaire de ${nx.i.rn}`}, ${range(e.no, nx.no)})`);
    } else if (d === 11 && e.i.s !== 7) {
      dom.push(`${e.i.name} → ${nx.i.name} (substitution tritonique : descente chromatique, ${range(e.no, nx.no)})`);
    }
  });
  if (dom.length) obs.push({ title: "Résolutions de dominante", tag: "Tension → détente", where: "", text: "Un accord de dominante (septième de dominante) tire vers l’accord situé une quarte au-dessus : c’est ce qui donne l’effet d’arrivée.", list: dom.slice(0, 8) });

  const has = (s, f) => ev.filter(e => e.i.s === s && (!f || fam(e.c.q) === f));
  const loc = arr => arr.slice(0, 3).map(e => e.no).join(", ");
  if (!minor) {
    const iv = ev.filter(e => e.i.s === 5 && fam(e.c.q) === "m");
    if (iv.length) obs.push({ title: IDEAS.maj[0].n, tag: "Emprunt", where: "mesure " + loc(iv), text: IDEAS.maj[0].why });
    const b6 = has(8, "M"), b7 = ev.filter(e => e.i.s === 10 && (fam(e.c.q) === "M" || fam(e.c.q) === "D"));
    if (b6.length && b7.length) obs.push({ title: IDEAS.maj[1].n, tag: "Emprunt", where: "mesure " + loc(b6), text: IDEAS.maj[1].why });
    else if (b7.length) obs.push({ title: IDEAS.maj[3].n, tag: "Mixolydien", where: "mesure " + loc(b7), text: IDEAS.maj[3].why });
    else if (b6.length) obs.push({ title: "♭VI emprunté", tag: "Emprunt", where: "mesure " + loc(b6), text: "Le ♭VI vient du mode mineur parallèle : couleur large et lumineuse, très « cinéma »." });
    const b3 = has(3, "M");
    if (b3.length) obs.push({ title: "♭III emprunté", tag: "Emprunt", where: "mesure " + loc(b3), text: "Le ♭III vient du mineur parallèle : un éclat inattendu, très rock." });
    const ii = ev.filter(e => e.i.s === 2 && e.c.q === "maj7");
    if (ii.length) obs.push({ title: IDEAS.maj[4].n, tag: "Lydien", where: "mesure " + loc(ii), text: IDEAS.maj[4].why });
    const i7 = ev.filter(e => e.i.s === 0 && e.c.q === "7");
    if (i7.length) obs.push({ title: "I7 : couleur blues / mixolydienne", tag: "Mixolydien", where: "mesure " + loc(i7), text: "Un accord de tonique avec septième mineure : le son est plus rugueux et groove qu’un I majeur." });
  } else {
    const last = ev[ev.length - 1];
    if (last.i.s === 0 && fam(last.c.q) === "M") obs.push({ title: IDEAS.min[0].n, tag: "Final", where: "mesure " + last.no, text: IDEAS.min[0].why });
    const iv = ev.filter(e => e.i.s === 5 && (fam(e.c.q) === "M" || fam(e.c.q) === "D"));
    if (iv.length) obs.push({ title: IDEAS.min[1].n, tag: "Dorien", where: "mesure " + loc(iv), text: IDEAS.min[1].why });
    const b2 = has(1, "M");
    if (b2.length) obs.push({ title: IDEAS.min[2].n, tag: "Phrygien", where: "mesure " + loc(b2), text: IDEAS.min[2].why });
    const v = ev.filter(e => e.i.s === 7 && fam(e.c.q) === "D");
    if (v.length) obs.push({ title: IDEAS.min[4].n, tag: "Harmonique", where: "mesure " + loc(v), text: IDEAS.min[4].why });
  }
  const fams = ev.every(e => fam(e.c.q) === "D" && [0, 5, 7].includes(e.i.s));
  if (fams && ev.length >= 8) obs.unshift({ title: "Structure blues", tag: "Blues", where: "", text: "Des accords de septième de dominante sur I, IV et V : la grille du blues, qu’on improvise avec la gamme blues ou la pentatonique." });
  const distinct = new Set(ev.map(e => e.c.root.pc + e.c.q));
  if (distinct.size <= 2 && ev.length >= 2) obs.unshift({ title: "Vamp (2 accords)", tag: "Modal", where: "", text: "Deux accords qui alternent : la musique ne « résout » pas, elle tourne. C’est le terrain idéal pour improviser en mode." });

  /* Tonalités locales (modulations / emprunts longs) */
  const mods = [];
  if (ev.length >= 8 && !fams) {
    const eqG = minor ? mod(pick.pc + 3, 12) : pick.pc;
    for (let i = 0; i + 4 <= ev.length; i += 2) {
      const w = ev.slice(i, i + 4), rk = rank(w), b = rk[0];
      const eqL = b.minor ? mod(b.pc + 3, 12) : b.pc;
      if (eqL === eqG) continue;
      const gs = rk.find(r => r.pc === pick.pc && r.minor === minor).sc;
      if (b.sc - gs >= 3) {
        const t = chooseTon(b.pc, b.minor).t;
        const label = nm(t) + (b.minor ? " mineur" : " majeur");
        const last = mods[mods.length - 1];
        if (last && last.label === label) last.to = w[w.length - 1].no; else mods.push({ label, from: w[0].no, to: w[w.length - 1].no });
      }
    }
  }
  mods.forEach(m => obs.push({ title: "Changement de couleur : " + m.label, tag: "Modulation ?", where: range(m.from, m.to), text: "Sur ce passage, les accords s’expliquent mieux dans cette autre tonalité : modulation ou emprunt prolongé. Pour improviser, suis cette tonalité-là le temps du passage." }));

  /* Accord par accord (distincts) */
  const seen = new Map();
  ev.forEach(e => { const k = e.i.s + "|" + e.c.q; if (!seen.has(k)) seen.set(k, { e, n: 0, bars: [] }); const o = seen.get(k); o.n++; if (o.bars.length < 4) o.bars.push(e.no); });
  const chords = [...seen.values()].map(({ e, n, bars }) => {
    const i = e.i;
    let fn = (FN[mode] && FN[mode][i.s]) || "Accord hors de la gamme : il apporte une couleur d’emprunt.";
    if (e.c.q === "7" && i.s !== 7 && i.s !== 10) fn = "Accord de dominante : il tire vers l’accord situé une quarte plus haut (" + nm(spell(tonic, D_OF_S[(i.s + 5) % 12], (i.s + 5) % 12)) + ").";
    let scale = "";
    try {
      const a = withTonic(tonic, () => advise(i.ch, { id: "song", mode }));
      scale = a.levels[1].name + " — " + a.levels[1].tip;
    } catch (x) { scale = ""; }
    const notes = withTonic(tonic, () => chordNotes(spell(tonic, i.ch.d, i.ch.s), i.ch.q)).map(nm).join(" ");
    return { name: i.name, rn: i.rn, fn, notes, scale, n, bars, approx: e.c.approx ? e.c.src : "" };
  });

  const sevenths = ev.filter(e => ["maj7", "m7", "7", "m7b5"].includes(e.c.q)).length / ev.length;
  const style = fams && ev.length >= 8 ? "blues" : sevenths > 0.6 ? "jazz / soul (accords de septième majoritaires)" : sevenths < 0.2 ? "pop / folk / rock (surtout des accords simples)" : "mixte";
  const approx = ev.filter(e => e.c.approx).length;

  return { ev, parsed, tonic, tonicIdx: ct.i, minor, mode, keyName, relName, ambiguous, obs, chords, style, approx, errors: parsed.errors, ranked: ranked.slice(0, 4) };
}

/* ================= Morceau à partir de l'analyse ================= */
function toSong(res, name, sig) {
  const sections = res.parsed.sections.map(sec => {
    const bars = [];
    sec.bars.forEach(bar => {
      const cs = bar.filter(c => !c.err);
      if (!cs.length) { bars.push(null); return; }
      cs.forEach(c => bars.push(mkChord(mod(c.root.pc - res.tonic.pc, 12), c.q)));
    });
    return { name: sec.name, rep: 1, bars };
  });
  return Object.assign(newSong(), { name: name || "Grille analysée", mode: res.mode, bpm: 90, sig: sig || "4/4", sections });
}
const multiBars = res => res.parsed.sections.some(s => s.bars.some(b => b.filter(c => !c.err).length > 1));

/* ================= OpenRouter ================= */
const OR = Object.assign({ key: "", model: "" }, lsGet(K_OR) || {});
const AN = { flow: false, text: "", name: "Grille analysée", sig: "4/4", img: null, status: "", busy: false, res: null, parsed: null, models: [], setOpen: false };
{ const sv = lsGet(K_AN); if (sv && typeof sv.text === "string") { AN.text = sv.text; if (sv.name) AN.name = sv.name; } }
const persistAN = () => lsSet(K_AN, { text: AN.text, name: AN.name });
const PROMPT = "Tu lis la photo d’une grille d’accords (partition, lead sheet, feuille manuscrite). Transcris UNIQUEMENT les accords, mesure par mesure, dans ce format texte strict : une ligne par ligne de la grille, mesures séparées par « | », accords en notation standard (C, Am7, F#m7b5, Bb, Gmaj7, D7/F#). Si la grille a des sections (Couplet, Refrain…), écris leur nom seul sur une ligne entre crochets, par exemple [Couplet]. Écris % pour une mesure qui répète la précédente. Deux accords dans la même mesure sont séparés par un espace. Si un accord est illisible, écris ?. N’ajoute aucun commentaire, aucune explication, aucun markdown.";

function shrink(file) {
  return new Promise((ok, ko) => {
    const fr = new FileReader();
    fr.onerror = () => ko(new Error("Lecture du fichier impossible."));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => ko(new Error("Image illisible."));
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", 0.85));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
async function orFetch(path, opt) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 90000);
  try {
    const r = await fetch("https://openrouter.ai/api/v1" + path, Object.assign({ signal: ctl.signal }, opt));
    let j = null; try { j = await r.json(); } catch (x) { }
    if (!r.ok) {
      const m = j && j.error && j.error.message ? j.error.message : "";
      if (r.status === 401) throw new Error("Clé OpenRouter refusée (401). Vérifie-la dans les réglages.");
      if (r.status === 402) throw new Error("Crédits OpenRouter insuffisants (402).");
      if (r.status === 429) throw new Error("Trop de requêtes (429) : réessaie dans un instant.");
      throw new Error("OpenRouter : " + (m || ("erreur " + r.status)));
    }
    return j;
  } catch (x) {
    if (x.name === "AbortError") throw new Error("Le modèle met trop de temps à répondre. Réessaie ou choisis un autre modèle.");
    if (x instanceof TypeError) throw new Error("Connexion à OpenRouter impossible (réseau).");
    throw x;
  } finally { clearTimeout(to); }
}
async function readPhoto() {
  if (!AN.img) return setStatus("Choisis d’abord une photo.");
  if (!OR.key || !OR.model) { AN.setOpen = true; return setStatus("Renseigne ta clé OpenRouter et un modèle dans les réglages ci-dessous (ou tape les accords à la main)."); }
  AN.busy = true; setStatus("Lecture de la photo par le modèle… (quelques secondes)");
  try {
    const j = await orFetch("/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + OR.key, "Content-Type": "application/json", "HTTP-Referer": location.origin, "X-Title": "Atelier modal" },
      body: JSON.stringify({ model: OR.model, temperature: 0, messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: AN.img } }] }] })
    });
    let t = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (Array.isArray(t)) t = t.map(x => x.text || "").join("\n");
    if (!t) throw new Error("Réponse vide du modèle. Essaie un autre modèle de vision.");
    t = String(t).replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
    AN.text = t; persistAN(); AN.res = null;
    const q = (t.match(/\?/g) || []).length;
    AN.status = "Lecture terminée. Vérifie et corrige les accords" + (q ? ` (${q} point(s) d’interrogation = accord illisible)` : "") + ", puis appuie sur Analyser.";
  } catch (x) { AN.status = x.message; }
  AN.busy = false; if (S.tab === "analyse") renderAnalyse();
}
async function loadModels() {
  setStatus("Chargement de la liste des modèles de vision…");
  try {
    const j = await orFetch("/models", { method: "GET" });
    const arr = (j && j.data || []).filter(m => {
      const a = m.architecture || {};
      return (a.input_modalities || []).includes("image") || /image/.test((a.modality || "").split("->")[0]);
    }).map(m => ({ id: m.id, name: m.name || m.id })).sort((a, b) => a.name.localeCompare(b.name));
    AN.models = arr; AN.status = arr.length + " modèles de vision disponibles : choisis-en un dans le champ Modèle."; AN.setOpen = true;
  } catch (x) { AN.status = x.message; }
  if (S.tab === "analyse") renderAnalyse();
}
function setStatus(t) { AN.status = t; const el = $("an-status"); if (el) el.textContent = t; }

/* ================= Écran Analyse ================= */
function keyOptions(res) {
  let o = "";
  TON.forEach((t, i) => ["maj", "min"].forEach(m => {
    o += `<option value="${i}|${m}" ${res && res.tonicIdx === i && res.mode === m ? "selected" : ""}>${E(nmN(t))} ${m === "maj" ? "majeur" : "mineur"}</option>`;
  }));
  return o;
}
function resultHtml(res) {
  if (res.error) return `<div class="card"><div class="muted">${E(res.error)}</div></div>`;
  let n = 0;
  const grid = res.parsed.sections.map(sec => `<div class="card"><h2>${E(sec.name)}</h2><div class="bars">${sec.bars.map(bar => {
    n++;
    const cs = bar.map(c => {
      if (c.err) return `<div class="aerr">${E(c.src)} ?</div>`;
      const s = mod(c.root.pc - res.tonic.pc, 12), ch = mkChord(s, c.q);
      return `<div><b>${E(cName(spell(res.tonic, ch.d, ch.s), ch.q))}</b><small>${E(ch.r)}</small></div>`;
    }).join("");
    return `<div class="abar"><small class="no">${n}</small>${cs || "<small>—</small>"}</div>`;
  }).join("")}</div></div>`).join("");
  const obs = res.obs.length ? res.obs.map(o => `<div class="sug" style="cursor:default"><b>${E(o.title)}</b> <span class="tg">${E(o.tag)}</span>${o.where ? ` <span class="muted">· ${E(o.where)}</span>` : ""}<span class="w">${E(o.text)}</span>${o.list ? `<ul class="ul">${o.list.map(x => `<li>${E(x)}</li>`).join("")}</ul>` : ""}</div>`).join("")
    : `<div class="muted">Pas d’enchaînement classique repéré : la grille est surtout diatonique (accords de la gamme). Regarde le détail accord par accord.</div>`;
  const per = res.chords.map(c => `<div class="sug" style="cursor:default"><b>${E(c.name)}</b> <span class="muted">${E(c.rn)} · ${c.n} fois (mesure ${c.bars.join(", ")}${c.n > c.bars.length ? "…" : ""})</span>
    <span class="w">${E(c.fn)}</span><span class="w"><b style="font-size:12.5px">Notes :</b> ${E(c.notes)}</span>${c.scale ? `<span class="w"><b style="font-size:12.5px">Pour improviser :</b> ${E(c.scale)}</span>` : ""}${c.approx ? `<span class="muted">Écrit « ${E(c.approx)} » : simplifié en accord de base.</span>` : ""}</div>`).join("");
  const warn = [];
  if (res.errors.length) warn.push(`${res.errors.length} symbole(s) non reconnu(s) (${E([...new Set(res.errors)].slice(0, 6).join(", "))}) : corrige-les dans le texte puis relance.`);
  if (res.approx) warn.push(`${res.approx} accord(s) enrichi(s) (9, 13, add9…) ramené(s) à l’accord de base pour la lecture et l’écoute.`);
  if (multiBars(res)) warn.push("Les mesures à deux accords sont envoyées dans deux cases du morceau.");
  return `<div id="an-res" class="card"><h2>Tonalité probable : ${E(res.keyName)}</h2>
   <div class="muted">${res.ambiguous ? `Ambiguïté : c’est aussi compatible avec <b>${E(res.relName)}</b> (même armure). ` : ""}Style : ${E(res.style)}.</div>
   <div class="tr" style="margin-top:8px"><span class="muted">Ce n’est pas la bonne ?</span><select data-act="an-key">${keyOptions(res)}</select></div>
   ${warn.map(w => `<div class="muted" style="margin-top:6px">⚠ ${w}</div>`).join("")}</div>
  ${grid}
  <div class="card"><h2>Pourquoi ces accords ?</h2>${obs}</div>
  <div class="card"><h2>Accord par accord</h2>${per}</div>
  <div class="card"><h2>Jouer cette grille</h2>
   <div class="tr"><input class="nm" data-act="an-name" value="${E(AN.name)}"><select data-act="an-sig">${["4/4", "3/4", "6/8"].map(s => `<option ${s === AN.sig ? "selected" : ""}>${s}</option>`).join("")}</select></div>
   <div class="tr" style="margin-top:8px"><button class="btn" data-act="an-send">▶ Envoyer vers Morceaux</button><button class="btn sm sec" data-act="an-save">Enregistrer dans mes morceaux</button><button class="btn sm sec" data-act="an-share">📤 Partager</button></div>
   <div class="muted" style="margin-top:6px">Relis les accords avant d’enregistrer ou de partager : la lecture d’une photo peut se tromper, surtout sur de l’écriture à la main.</div>
   <div class="muted" id="an-msg" style="margin-top:6px"></div></div>`;
}
function renderAnalyse() {
  const keep = $("an-text"); if (keep) AN.text = keep.value;
  $("panel").innerHTML = `
  <div class="card"><h2>Analyse d’une grille</h2>
   <div class="muted">Envoie une photo de ta grille, ou tape les accords toi-même. Mesures séparées par <b>|</b>, sections entre [crochets], <b>%</b> pour répéter une mesure.</div>
   <div class="tr" style="margin-top:8px"><input type="file" accept="image/*" id="an-file" data-act="an-file" style="display:none">
    <button class="btn sm" data-act="an-pick">📷 Photo</button><button class="btn sm sec" data-act="an-read" ${AN.img && !AN.busy ? "" : "disabled"}>Lire la photo</button></div>
   ${AN.img ? `<img src="${AN.img}" alt="Photo de la grille" style="max-width:100%;max-height:170px;border-radius:10px;margin-top:8px">` : ""}
   ${AN.img && window.__an ? `<div class="tr" style="margin-top:6px"><button class="btn sm sec" data-act="sc-keep">Garder aussi la photo dans Partitions</button></div>` : ""}
   <div class="muted" id="an-status" style="margin:6px 0">${E(AN.status)}</div>
   <textarea id="an-text" data-act="an-text" rows="7" placeholder="[Couplet]&#10;| Am7 | D7 | Gmaj7 | Cmaj7 |&#10;| F#m7b5 | B7 | Em | % |">${E(AN.text)}</textarea>
   <div class="tr" style="margin-top:8px"><button class="btn" data-act="an-go">Analyser</button><button class="btn sm sec" data-act="an-clear">Vider</button></div>
   <details id="an-set" ${AN.setOpen ? "open" : ""}><summary>Réglages OpenRouter (lecture de photo)</summary>
    <div class="muted" style="margin:6px 0">Optionnel : sans clé, tape simplement les accords. Ta clé reste dans ce navigateur et n’est envoyée qu’à openrouter.ai. Évite de l’enregistrer sur un appareil partagé.</div>
    <div class="tr"><input class="nm" id="or-key" type="password" autocomplete="off" placeholder="Clé OpenRouter (sk-or-…)" value="${E(OR.key)}"></div>
    <div class="tr" style="margin-top:6px"><input class="nm" id="or-model" list="or-models" autocomplete="off" placeholder="Modèle de vision, ex. google/gemini-2.5-flash" value="${E(OR.model)}">
     <datalist id="or-models">${AN.models.map(m => `<option value="${E(m.id)}">${E(m.name)}</option>`).join("")}</datalist></div>
    <div class="tr" style="margin-top:8px"><button class="btn sm" data-act="or-save">Enregistrer</button><button class="btn sm sec" data-act="or-models">Charger les modèles de vision</button><button class="btn sm sec" data-act="or-erase">Effacer ma clé</button></div>
   </details></div>
  ${AN.res ? resultHtml(AN.res) : ""}`;
}
function runAnalyse(override) {
  const t = $("an-text"); if (t) AN.text = t.value;
  persistAN();
  AN.parsed = parseGrid(AN.text);
  AN.res = analyse(AN.parsed, override);
  renderAnalyse();
  const el = $("an-res"); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function saveSongMap(song, tonic) {
  const m = songsMap(); m[song.name] = JSON.parse(JSON.stringify({ song, tonic: [tonic.l, tonic.a] }));
  return lsSet(K_SONGS, m);
}

/* ================= Transposition ================= */
function shiftTon(t, n) {
  const pc = mod(t.pc + n, 12), c = TON.filter(x => x.pc === pc);
  return c.find(x => x.a === 0) || c.find(x => x.a === (n >= 0 ? 1 : -1)) || c[0];
}
const setTon = t => { S.tonic = t; S.dict = t; };
window.__tr = { shiftTon, setTon };

/* ================= Playlists ================= */
let PL = lsGet(K_PL);
if (!PL || !Array.isArray(PL.lists) || !PL.lists.length) PL = { lists: [{ name: "Ma playlist", items: [] }], cur: 0 };
if (!(PL.cur >= 0 && PL.cur < PL.lists.length)) PL.cur = 0;
const savePL = () => lsSet(K_PL, PL);
const curL = () => PL.lists[PL.cur];
const PLAY = { active: false, i: -1, internal: false };
const PLmsg = { t: "" };

const isScoreItem = n => typeof n === "string" && n.startsWith("@score:");       // élément de playlist = une partition (photo / PDF / extrait) de l'onglet Partitions
function scoreLabel(n) {
  const sc = window.__scores, m = sc && sc.peek ? sc.peek(n.slice(7)) : null;
  if (!m) return `<span class="t">${sc && sc.loaded && sc.loaded() ? "Partition introuvable <small>(supprimée ?)</small>" : "Partition…"}</span>`;
  return `<span class="t">${m.thumb ? `<img class="plth" src="${m.thumb}" alt="" data-act="sc-open" data-id="${E(m.id)}"> ` : ""}${E(m.name)} <small>${m.type === "application/pdf" ? "PDF" : "partition"} · à lire à l’écran</small></span>`;
}
function songLabel(name) {
  if (isScoreItem(name)) return scoreLabel(name);
  const e = songsMap()[name];
  if (!e || !validSong(e.song)) return `<span class="t">${E(name)} <small>(introuvable : supprimé ?)</small></span>`;
  const t = e.tonic && TON.find(x => x.l === e.tonic[0] && x.a === e.tonic[1]);
  const bars = e.song.sections.reduce((n, s) => n + s.bars.length * (s.rep || 1), 0);
  return `<span class="t">${E(name)} <small>${t ? E(nmN(t)) + (e.song.mode === "min" ? "m" : "") + " · " : ""}${E(e.song.sig || "4/4")} · ${e.song.bpm || 90} BPM · ${bars} mesures</small></span>`;
}
function renderPlaylist() {
  const L = curL(), sm = songsMap(), names = Object.keys(sm);
  const sc = window.__scores; if (sc && sc.ensure && sc.loaded && !sc.loaded() && L.items.some(isScoreItem)) sc.ensure().then(() => { if (S.tab === "playlist") renderPlaylist(); });
  $("panel").innerHTML = `
  <div class="card"><h2>Playlists</h2>
   <div class="tr"><select data-act="pl-sel" style="flex:1">${PL.lists.map((l, i) => `<option value="${i}" ${i === PL.cur ? "selected" : ""}>${E(l.name)} (${l.items.length})</option>`).join("")}</select></div>
   <div class="tr" style="margin-top:8px"><input class="nm" id="pl-name" placeholder="Nom de la playlist" value="${E(L.name)}">
    <button class="btn sm sec" data-act="pl-ren">Renommer</button><button class="btn sm sec" data-act="pl-new">+ Nouvelle</button><button class="btn sm sec" data-act="pl-del">Supprimer</button></div></div>
  <div class="card"><h2>${E(L.name)} <span class="muted">· ${L.items.length} morceau${L.items.length > 1 ? "x" : ""}</span></h2>
   <div class="tr"><button class="btn" id="plplay" data-act="pl-play">${PLAY.active ? "■ Stop" : "▶ Lire la playlist"}</button><button class="btn sm sec" data-act="pl-next">⏭ Suivant</button></div>
   <div class="tr" style="margin-top:8px"><span class="muted">Jouer dans une autre tonalité</span><select data-act="pl-shift">${[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map(n => `<option value="${n}" ${n === (L.shift || 0) ? "selected" : ""}>${n === 0 ? "Tonalités d’origine" : (n > 0 ? "+" : "−") + Math.abs(n) + " demi-ton" + (Math.abs(n) > 1 ? "s" : "")}</option>`).join("")}</select></div>
   <div class="muted" id="plnow" style="margin:6px 0">${E(PLmsg.t)}</div>
   ${L.items.length ? L.items.map((n, i) => `<div class="plrow ${PLAY.active && PLAY.i === i ? "now" : ""}"><span class="no">${i + 1}</span>${songLabel(n)}
     ${isScoreItem(n) ? `<button data-act="sc-open" data-id="${E(n.slice(7))}" title="Afficher la partition">👁</button>` : `<button data-act="pl-one" data-i="${i}" title="Lire">▶</button>`}<button data-act="pl-up" data-i="${i}" title="Monter">▲</button><button data-act="pl-dn" data-i="${i}" title="Descendre">▼</button><button data-act="pl-rm" data-i="${i}" title="Retirer">✕</button></div>`).join("")
     : `<div class="muted">Playlist vide. Ajoute des morceaux ci-dessous.</div>`}</div>
  <div class="card"><h2>Ajouter un morceau</h2>
   ${names.length ? `<div class="tr"><select id="pl-add" style="flex:1">${names.map(n => `<option value="${E(n)}">${E(n)}</option>`).join("")}</select><button class="btn sm" data-act="pl-addsel">Ajouter</button></div>` : `<div class="muted">Aucun morceau enregistré pour l’instant : crée-en dans l’onglet Morceaux ou Analyse, puis enregistre-les.</div>`}
   <div class="tr" style="margin-top:8px"><button class="btn sm sec" data-act="pl-addcur">+ Ajouter le morceau en cours (« ${E(S.song.name)} »)</button></div>
   <div class="muted" style="margin-top:6px">Les morceaux sont gardés dans ce navigateur, sur cet appareil.</div></div>`;
}
window.__pl = {                                     // utilisé par Morceaux (extraits) et Partitions (photos découpées)
  names: () => PL.lists.map(l => l.name), cur: () => PL.cur,
  add(item, idx) {
    const L = PL.lists[idx >= 0 && idx < PL.lists.length ? idx : PL.cur]; L.items.push(item); savePL();
    if (S.tab === "playlist") renderPlaylist();
    return L.name;
  }
};
function updNow() {
  const el = $("plnow"); if (!el) return;
  const L = curL();
  if (PLAY.active) { const n = L.items[PLAY.i]; el.textContent = `En cours : ${PLAY.i + 1}/${L.items.length} · ${n}`; }
  else el.textContent = PLmsg.t;
  const b = $("plplay"); if (b) b.textContent = PLAY.active ? "■ Stop" : "▶ Lire la playlist";
  document.querySelectorAll(".plrow").forEach((r, i) => r.classList.toggle("now", PLAY.active && i === PLAY.i));
}
function playIndex(i) {
  const L = curL();
  while (i < L.items.length) {
    const e = songsMap()[L.items[i]];
    if (e && validSong(e.song)) break;
    i++;
  }
  if (i >= L.items.length) { PLAY.active = false; PLmsg.t = "Playlist terminée."; if (S.tab === "playlist") renderPlaylist(); return; }
  PLAY.internal = true;
  try { loadSongObj(JSON.parse(JSON.stringify(songsMap()[L.items[i]]))); if (L.shift) setTon(shiftTon(S.tonic, L.shift)); PLAY.active = true; PLAY.i = i; startSong(); }
  finally { PLAY.internal = false; }
  PLmsg.t = "";
  if (S.tab === "playlist") renderPlaylist();
  updNow();
}
function stopPL(msg) {
  PLAY.internal = true; try { stopSong(); } finally { PLAY.internal = false; }
  PLAY.active = false; PLmsg.t = msg || ""; updNow();
}

/* ================= Branchement sur app.js ================= */
const _render = render, _renderTop = renderTop, _renderInst = renderInstruments, _songTick = songTick, _stopSong = stopSong;
render = function () {
  if (isMine()) { renderTop(); (S.tab === "analyse" ? renderAnalyse : renderPlaylist)(); const i = $("inst"); if (i) i.innerHTML = ""; }
  else _render();
};
renderTop = function () {
  _renderTop();
  $("tabs").innerHTML = [["modes", "Modes"], ["harm", "Harmonie"], ["grid", "Grilles"], ["song", "Morceaux"], ["analyse", "Analyse"], ["playlist", "Playlist"]]
    .map(([k, t]) => `<button class="${S.tab === k ? "on" : ""}" data-act="tab" data-v="${k}">${t}</button>`).join("");
};
renderInstruments = function () { if (isMine()) { const i = $("inst"); if (i) i.innerHTML = ""; } else _renderInst(); };
songTick = function () {
  if (PLAY.active && P.pulse === 0 && P.seq.length && P.i + 1 >= P.seq.length) {
    const next = PLAY.i + 1;
    PLAY.internal = true; try { _stopSong(); } finally { PLAY.internal = false; }
    if (next < curL().items.length) setTimeout(() => { if (PLAY.active) playIndex(next); }, 500);
    else { PLAY.active = false; PLmsg.t = "Playlist terminée."; updNow(); }
    return;
  }
  _songTick();
};
stopSong = function () { if (!PLAY.internal) PLAY.active = false; _stopSong.apply(this, arguments); updNow(); };

/* ================= Événements ================= */
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t) return;
  const a = t.dataset.act, v = t.dataset.v, i = +t.dataset.i;
  switch (a) {
    case "an-pick": $("an-file").click(); break;
    case "sng-photo": {                                   // depuis Morceaux : on ouvre l'analyse et le choix de la photo d'un seul geste
      stopSong(); AN.flow = true; AN.res = null; AN.img = null;
      AN.status = OR.key && OR.model ? "Choisis ou prends la photo de la partition : elle sera lue puis analysée." : "Choisis la photo. Sans clé OpenRouter (réglages ci-dessous), elle ne peut pas être lue toute seule : tape les accords en la regardant.";
      if (!OR.key || !OR.model) AN.setOpen = true;
      S.tab = "analyse"; render();
      const f = $("an-file"); if (f) f.click();
      break;
    }
    case "an-share": {
      if (!AN.res || AN.res.error) break;
      const song = toSong(AN.res, AN.name, AN.sig);
      saveSongMap(song, AN.res.tonic);
      S.tab = "song"; loadSongObj({ song, tonic: [AN.res.tonic.l, AN.res.tonic.a] });
      const b = document.querySelector('[data-act="sh-open-share"]'); if (b) b.click();
      break;
    }
    case "an-read": readPhoto(); break;
    case "an-go": runAnalyse(); break;
    case "an-clear": AN.text = ""; AN.res = null; AN.img = null; AN.status = ""; persistAN(); renderAnalyse(); break;
    case "or-save": {
      OR.key = $("or-key").value.trim(); OR.model = $("or-model").value.trim();
      AN.status = lsSet(K_OR, OR) ? "Réglages enregistrés sur cet appareil." : "Enregistrement impossible ici (stockage bloqué) : les réglages ne seront pas gardés.";
      AN.setOpen = true; renderAnalyse(); break;
    }
    case "or-erase": OR.key = ""; lsSet(K_OR, OR); AN.status = "Clé effacée de cet appareil."; renderAnalyse(); break;
    case "or-models": { const k = $("or-key"), m = $("or-model"); if (k) OR.key = k.value.trim(); if (m) OR.model = m.value.trim(); loadModels(); break; }
    case "an-send": {
      if (!AN.res || AN.res.error) break;
      const song = toSong(AN.res, AN.name, AN.sig);
      S.tab = "song"; loadSongObj({ song, tonic: [AN.res.tonic.l, AN.res.tonic.a] });
      break;
    }
    case "an-save": {
      if (!AN.res || AN.res.error) break;
      const song = toSong(AN.res, AN.name, AN.sig), ok = saveSongMap(song, AN.res.tonic), m = $("an-msg");
      if (m) m.textContent = ok ? `Enregistré sous « ${song.name} » : tu peux l’ajouter à une playlist, ou le partager (bouton Partager).` : "Enregistrement impossible ici.";
      break;
    }
    case "pl-new": {
      const n = ($("pl-name").value || "").trim() || "Nouvelle playlist";
      PL.lists.push({ name: n, items: [] }); PL.cur = PL.lists.length - 1; savePL(); renderPlaylist(); break;
    }
    case "pl-ren": { const n = ($("pl-name").value || "").trim(); if (n) { curL().name = n; savePL(); renderPlaylist(); } break; }
    case "pl-del":
      if (PL.lists.length > 1) { if (PLAY.active) stopPL(); PL.lists.splice(PL.cur, 1); PL.cur = 0; } else { PL.lists[0] = { name: "Ma playlist", items: [] }; }
      savePL(); renderPlaylist(); break;
    case "pl-addsel": { const s = $("pl-add"); if (s && s.value) { curL().items.push(s.value); savePL(); renderPlaylist(); } break; }
    case "pl-addcur": {
      const song = JSON.parse(JSON.stringify(S.song)); saveSongMap(song, S.tonic);
      curL().items.push(song.name); savePL(); renderPlaylist(); break;
    }
    case "pl-rm": if (PLAY.active) stopPL(); curL().items.splice(i, 1); savePL(); renderPlaylist(); break;
    case "pl-up": if (i > 0) { const L = curL().items; [L[i - 1], L[i]] = [L[i], L[i - 1]]; if (PLAY.active) stopPL(); savePL(); renderPlaylist(); } break;
    case "pl-dn": { const L = curL().items; if (i < L.length - 1) { [L[i + 1], L[i]] = [L[i], L[i + 1]]; if (PLAY.active) stopPL(); savePL(); renderPlaylist(); } break; }
    case "pl-one": playIndex(i); break;
    case "pl-play": if (PLAY.active) stopPL(); else if (curL().items.length) playIndex(0); break;
    case "pl-next": if (curL().items.length) playIndex(PLAY.active ? PLAY.i + 1 : 0); break;
  }
});
document.addEventListener("input", ev => {
  const t = ev.target; if (!t.dataset) return;
  if (t.dataset.act === "an-text") { AN.text = t.value; persistAN(); }
  else if (t.dataset.act === "an-name") { AN.name = t.value; persistAN(); }
});
document.addEventListener("change", ev => {
  const t = ev.target; if (!t.dataset) return;
  switch (t.dataset.act) {
    case "an-file": {
      const f = t.files && t.files[0]; if (!f) break;
      setStatus("Préparation de la photo…");
      shrink(f).then(d => {
        AN.img = d; AN.status = AN.flow && !(OR.key && OR.model) ? "Photo prête. Sans clé OpenRouter elle ne peut pas être lue toute seule : tape les accords en la regardant, ou ajoute ta clé dans les réglages ci-dessous." : "Photo prête. Appuie sur « Lire la photo » (ou tape les accords à la main)."; renderAnalyse();
        const auto = AN.flow && OR.key && OR.model; AN.flow = false;
        if (auto) readPhoto().then(() => { if (AN.text.trim() && !AN.busy) { runAnalyse(); AN.status += " Vérifie les accords avant d’enregistrer ou de partager."; } });
      }).catch(x => setStatus(x.message));
      break;
    }
    case "an-key": { const [i, m] = t.value.split("|"); const ton = TON[+i]; runAnalyse({ pc: m === "min" ? ton.pc : ton.pc, minor: m === "min", forceIdx: +i }); break; }
    case "an-sig": AN.sig = t.value; break;
    case "pl-shift": curL().shift = +t.value || 0; savePL(); if (PLAY.active) playIndex(PLAY.i); break;
    case "pl-sel": PL.cur = +t.value; PLmsg.t = ""; savePL(); renderPlaylist(); break;
  }
});
document.addEventListener("toggle", ev => { if (ev.target && ev.target.id === "an-set") AN.setOpen = ev.target.open; }, true);

render();
window.__analyse = { parseChord, parseGrid, analyse, toSong };
/* appelé par l'onglet Partitions : envoyer une photo vers l'analyse / récupérer la photo en cours */
window.__an = {
  setPhoto(dataUrl) {
    AN.img = dataUrl; AN.res = null; AN.flow = false;
    AN.status = OR.key && OR.model ? "Photo prête. Appuie sur « Lire la photo »." : "Photo prête. Sans clé OpenRouter elle ne peut pas être lue toute seule : tape les accords en la regardant, ou ajoute ta clé dans les réglages ci-dessous.";
    if (!(OR.key && OR.model)) AN.setOpen = true;
    S.tab = "analyse"; render();
  },
  getPhoto() { return AN.img; }
};
})();
