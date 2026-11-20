/* Atelier modal — orchestre d'accompagnement (basse, piano, batterie) et import iReal Pro.
   Le moteur vient d'OpenStand (https://github.com/canbmaj7/openstand, AGPL-3.0-or-later) : il est empaqueté dans
   vendor/openstand.js (voir openstand/) et chargé seulement quand on en a besoin. Ce fichier fait le lien entre
   les grilles / morceaux d'Atelier modal et ce moteur, et ajoute les modes de travail : boucle, tour des 12 tonalités,
   tempo qui monte à chaque chorus, raccourcis clavier. Chargé après agencement.js. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const E = s => esc(String(s));
const K_BAND = "atelier-modal-band";
const { shiftTon, setTon } = window.__tr;

/* ---------- Réglages ---------- */
const B = Object.assign({ style: "pop-rock", choruses: 4, keyStep: 0, ramp: 0, mute: {}, vol: {} }, lsGet(K_BAND) || {});
const VOL0 = { bass: 110, comp: 85, drums: 95 };
const run = { loop: "off", playing: false, loading: false, prog: 0, msg: "", player: null, os: null, tl: null, ref: [], bars: 0, raf: 0, pos: null, lastBar: -2, lastTon: -1, src: null };
const saveB = () => lsSet(K_BAND, { style: B.style, choruses: B.choruses, keyStep: B.keyStep, ramp: B.ramp, mute: B.mute, vol: B.vol });

const SIGS = { "4/4": [4, 4], "3/4": [3, 4], "6/8": [6, 8] };
const LET = ["C", "D", "E", "F", "G", "A", "B"], PCN = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const SUF = { maj: "", m: "m", 7: "7", maj7: "maj7", m7: "m7", m7b5: "m7b5", dim: "dim", 6: "6", m6: "m6", sus4: "sus4" };
const clampBpm = v => Math.max(40, Math.min(300, v));

/* ---------- Chargement du moteur (une seule fois) ---------- */
let libP = null;
function loadLib() {
  if (window.OpenStand) return Promise.resolve(window.OpenStand);
  if (libP) return libP;
  libP = new Promise((ok, ko) => {
    const s = document.createElement("script"); s.src = "vendor/openstand.js";
    s.onload = () => window.OpenStand ? ok(window.OpenStand) : ko(new Error("Moteur introuvable.")); s.onerror = () => { libP = null; ko(new Error("Impossible de charger l’orchestre (connexion internet nécessaire la première fois).")); };
    document.head.appendChild(s);
  });
  return libP;
}
async function ensurePlayer() {
  const os = await loadLib(); run.os = os;
  if (run.player) return run.player;
  const p = new os.Player();
  if (!p.supported) throw new Error("Ce navigateur ne peut pas jouer de son.");
  run.loading = true; run.prog = 0; paint();
  try { await p.init(r => { run.prog = r; paintProg(); }); }
  catch (e) { run.loading = false; throw e; }
  p.onEnded = () => { onEnd(); };
  run.player = p; run.loading = false; return p;
}

/* ---------- De la grille / du morceau d'Atelier modal à une grille OpenStand ---------- */
function sym(ton, c) {
  const n = spell(ton, c.d, c.s);
  const root = Math.abs(n.a) > 1 ? PCN[n.pc] : LET[n.l] + (n.a > 0 ? "#" : n.a < 0 ? "b" : "");
  return root + (SUF[c.q] ?? "");
}
function source() {
  if (S.tab === "song") {
    const sg = S.song, ref = [], m = [];
    sg.sections.forEach((sec, si) => {
      const ton = sec.shift ? shiftTon(S.tonic, sec.shift | 0) : S.tonic;
      for (let r = 0; r < (sec.rep || 1); r++) sec.bars.forEach((c, bi) => { m.push(c ? [sym(ton, c)] : []); ref.push({ si, bi }); });
    });
    return { title: sg.name, minor: sg.mode === "min", sig: sg.sig, bpm: sg.bpm, m, ref, sec: sg.sections.map((s, si) => ({ name: s.name, from: ref.findIndex(x => x.si === si), to: ref.map(x => x.si).lastIndexOf(si) })) };
  }
  const g = curGrid(); if (!g) return null;
  return { title: g.name, minor: g.mode === "min", sig: S.sig, bpm: S.bpm, m: g.chords.map(c => [sym(S.tonic, c)]), ref: g.chords.map((_, i) => ({ bar: i })), sec: [] };
}
const curBpm = () => S.tab === "song" ? S.song.bpm : S.bpm;
const setBpm = v => { v = clampBpm(v); if (S.tab === "song") { S.song.bpm = v; persist(); } else S.bpm = v; };
const liveBpm = chorus => clampBpm(curBpm() + B.ramp * (run.playing ? chorus : 0));

function loopRange(src) {
  const l = run.loop; if (!l || l === "off") return null;
  if (l === "bar") { const i = S.tab === "song" ? src.ref.findIndex(x => x.si === S.sel.si && x.bi === S.sel.bi) : S.bar; return i >= 0 ? [i, i] : null; }
  if (l.startsWith("sec")) { const s = src.sec[+l.slice(3)]; return s ? [s.from, s.to] : null; }
  if (l.startsWith("grp")) { const g = +l.slice(3); return [g * 4, Math.min(src.m.length - 1, g * 4 + 3)]; }
  return null;
}

/* ---------- Mélangeur : retirer ou régler un instrument ---------- */
const PARTS = ["bass", "comp", "drums"];
const volOf = k => B.mute[k] ? 0 : (B.vol[k] ?? VOL0[k]);
function applyMix() { if (!run.player || !run.os) return; for (const k of PARTS) run.player.setVolume(run.os.CHANNELS[k], volOf(k)); }
function compName() { const os = run.os; const pr = os ? os.getStyle(B.style).comp.program : (B.style === "bossa-nova" ? 24 : 0); return pr >= 24 && pr <= 31 ? "Guitare" : "Piano"; }
function mixHtml() {
  const rows = [["bass", "🎸", "Basse"], ["comp", compName() === "Guitare" ? "🎸" : "🎹", compName()], ["drums", "🥁", "Batterie"]];
  return `<div class="muted" style="margin:6px 0 2px">Instruments (touche-en un pour le retirer : tu le joues toi-même)</div>` + rows.map(([k, ic, n]) =>
    `<div class="row" style="margin-bottom:4px"><button class="chip sm ${B.mute[k] ? "" : "on2"}" data-band-act="mute" data-k="${k}" style="min-width:104px">${ic} ${n}${B.mute[k] ? " · retiré" : ""}</button>
     <input type="range" min="0" max="127" value="${B.vol[k] ?? VOL0[k]}" data-bandvol="${k}" style="flex:1" ${B.mute[k] ? "disabled" : ""} aria-label="Volume : ${n}"></div>`).join("");
}

/* ---------- Lecture ---------- */
async function start(fromSeconds) {
  if (run.busy) return; run.busy = true;
  try {
    run.msg = ""; paint();
    const player = await ensurePlayer(), os = run.os, src = source(); if (!src) return;
    if (typeof stopPlay === "function") stopPlay();
    if (typeof stopSong === "function") stopSong();
    const ton = S.tonic;
    const chart = os.chartFromMeasures({ title: src.title, style: B.style, key: ton.pc, minor: src.minor, bpm: src.bpm, time: SIGS[src.sig] || [4, 4] }, src.m);
    const loop = loopRange(src);
    const { midi, timeline } = os.arrange(chart, os.getStyle(B.style), 0, B.choruses, { loop, keyStep: B.keyStep });
    run.tl = timeline; run.ref = src.ref; run.src = src; run.tab = S.tab; run.lastBar = -2; run.lastTon = -1;
    applyMix();
    await player.play(midi, fromSeconds || 0);
    player.setRate(liveBpm(0) / os.BASE_BPM);
    run.playing = true;
    cancelAnimationFrame(run.raf); frame();
  } catch (e) { run.playing = false; run.msg = e && e.message ? e.message : "Impossible de lancer l’orchestre."; }
  finally { run.busy = false; paint(); }
}
function stop(silent) {
  cancelAnimationFrame(run.raf);
  if (run.player) { try { run.player.stop(); } catch (e) { } }
  const was = run.playing; run.playing = false; run.pos = null;
  if (was) { clearHi(); }
  if (!silent) paint();
}
function onEnd() { if (!run.playing) return; run.playing = false; run.pos = null; cancelAnimationFrame(run.raf); clearHi(); paint(); }
function restartHere() { if (!run.playing || !run.player) return; const t = run.player.position; start(t); }

function clearHi() {
  document.querySelectorAll("#panel .bar.now").forEach(e => e.classList.remove("now"));
}
function frame() {
  if (!run.playing) return;
  const p = run.player, os = run.os;
  if (p && run.tl) {
    const pos = os.positionAt(run.tl, p.heardPosition * os.BASE_BPM / 60);
    run.pos = pos;
    p.setRate(liveBpm(pos ? pos.chorus : 0) / os.BASE_BPM);
    if (pos && pos.measure >= 0 && S.tab === run.tab && pos.measure !== run.lastBar) {
      run.lastBar = pos.measure; follow(pos.measure);
    }
    const ton = pos ? os.chorusTranspose(0, B.keyStep, pos.chorus) : 0;
    if (ton !== run.lastTon) run.lastTon = ton;
    paintStatus();
  }
  run.raf = requestAnimationFrame(frame);
}
function follow(m) {
  const r = run.ref[m]; if (!r) return;
  if (run.tab === "song") {
    if (S.sel.si !== r.si || S.sel.bi !== r.bi) { S.sel = { si: r.si, bi: r.bi }; if (typeof renderPicker === "function") renderPicker(); }
    document.querySelectorAll("#panel .bar[data-si]").forEach(e => { const on = +e.dataset.si === r.si && +e.dataset.bi === r.bi; e.classList.toggle("sel", on); e.classList.toggle("now", on); });
  } else {
    S.bar = r.bar; if (typeof highlightBars === "function") highlightBars();
    document.querySelectorAll("#panel .bar").forEach((e, i) => e.classList.toggle("now", i === r.bar));
    if (typeof renderAdvisor === "function") renderAdvisor();
    if (typeof renderInstruments === "function") renderInstruments();
  }
}

/* ---------- Interface ---------- */
function opts(list, cur) { return list.map(([v, t]) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${E(t)}</option>`).join(""); }
function loopOptions() {
  const src = source(), o = [["off", "Pas de boucle"], ["bar", "La mesure choisie"]];
  if (!src) return o;
  if (src.sec.length > 1) src.sec.forEach((s, i) => o.push(["sec" + i, "Section : " + s.name]));
  else for (let g = 0; g * 4 < src.m.length; g++) o.push(["grp" + g, `Mesures ${g * 4 + 1}–${Math.min(src.m.length, g * 4 + 4)}`]);
  return o;
}
function statusText() {
  const p = run.pos;
  if (!run.playing || !p) return "";
  if (p.countIn) return "Décompte : " + p.countIn;
  const ton = shiftTon(S.tonic, run.os.chorusTranspose(0, B.keyStep, p.chorus));
  return `Chorus ${Math.min(p.chorus + 1, B.choruses)} / ${B.choruses}` + (p.ending ? " · fin" : "") + (B.keyStep ? " · " + nmN(ton) : "") + (B.ramp ? " · " + liveBpm(p.chorus) + " BPM" : "");
}
function paintStatus() { const e = $("band-status"); if (e) e.textContent = statusText(); }
function paintProg() { const e = $("band-prog"); if (e) e.textContent = `Chargement des sons… ${Math.round(run.prog * 100)} %`; }

const STYLE_NAMES = { "medium-swing": "Swing moyen", ballad: "Ballade", "jazz-waltz": "Valse jazz", "bossa-nova": "Bossa nova", samba: "Samba", "pop-rock": "Pop rock", funk: "Funk", shuffle: "Shuffle" };
const KEY_STEPS = [[0, "Rester dans la tonalité"], [5, "Quarte au-dessus à chaque chorus (les 12 tonalités)"], [1, "Demi-ton au-dessus à chaque chorus"], [2, "Ton au-dessus à chaque chorus"], [11, "Demi-ton en dessous à chaque chorus"]];
function cardHtml() {
  const st = Object.entries(STYLE_NAMES).map(([id, n]) => [id, n]);
  return `<h2>🥁 Orchestre</h2>
   <div class="muted" style="margin-bottom:6px">Basse, piano et batterie jouent la grille en direct (moteur <a href="https://github.com/canbmaj7/openstand" target="_blank" rel="noopener">OpenStand</a>).</div>
   <div class="row" style="margin:0 0 8px"><button class="btn" id="band-play" data-band-act="toggle">${run.playing ? "■ Stop" : "▶ Jouer avec l’orchestre"}</button>
    <span class="muted" id="band-status">${E(statusText())}</span></div>
   <div class="muted" id="band-prog">${run.loading ? `Chargement des sons… ${Math.round(run.prog * 100)} %` : ""}</div>
   ${run.msg ? `<div class="muted" style="color:var(--dim)">${E(run.msg)}</div>` : ""}
   <div class="row"><span class="muted">Style</span><select data-band="style">${opts(st, B.style)}</select>
    <span class="muted">Chorus</span><select data-band="choruses">${opts([1, 2, 3, 4, 6, 8, 12, 16, 24].map(n => [n, n]), B.choruses)}</select></div>
   <div class="row"><span class="muted">Tonalité</span><select data-band="keyStep" style="flex:1">${opts(KEY_STEPS, B.keyStep)}</select></div>
   <div class="row"><span class="muted">Tempo</span><select data-band="ramp">${opts([[0, "constant"], [2, "+2 BPM par chorus"], [5, "+5 BPM par chorus"], [10, "+10 BPM par chorus"]], B.ramp)}</select>
    <span class="muted">Boucle</span><select data-band="loop" style="flex:1">${opts(loopOptions(), run.loop)}</select></div>
   ${mixHtml()}
   <details><summary>Raccourcis clavier</summary><p><kbd>Espace</kbd> lancer / arrêter · <kbd>↑</kbd> <kbd>↓</kbd> tempo ±5 · <kbd>←</kbd> <kbd>→</kbd> tonalité ± demi-ton · <kbd>L</kbd> supprimer la boucle</p></details>`;
}
function paint() { const c = $("band"); if (c) c.innerHTML = cardHtml(); }

function mount() {
  if (S.tab !== "song" && S.tab !== "grid") return;
  const p = $("panel"); if (!p) return;
  let c = $("band");
  if (!c) { c = document.createElement("div"); c.id = "band"; c.className = "card"; c.innerHTML = cardHtml(); }
  const first = p.querySelector(":scope > .card");
  if (first && first.nextSibling !== c) first.after(c); else if (!first && c.parentNode !== p) p.appendChild(c);
  if (S.tab === "song") mountImport();
}

/* Réaffichage : on remet la carte après chaque rendu de l'application. */
const _render = render; render = function () { _render.apply(this, arguments); mount(); };
if (typeof renderSong === "function") { const _rs = renderSong; renderSong = function () { _rs.apply(this, arguments); mount(); }; }
if (typeof renderGrid === "function") { const _rg = renderGrid; renderGrid = function () { _rg.apply(this, arguments); mount(); }; }
{ const _sp = startPlay; startPlay = function () { stop(); return _sp.apply(this, arguments); }; const _ss = startSong; startSong = function () { stop(); return _ss.apply(this, arguments); }; }

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-band-act],[data-act=tab]"); if (!t) return;
  if (t.dataset.act === "tab") { if (run.playing && t.dataset.v !== run.tab) stop(true); return; }
  if (t.dataset.bandAct === "toggle") { t.blur(); run.playing ? stop() : start(0); }
  if (t.dataset.bandAct === "mute") { const k = t.dataset.k; B.mute[k] = !B.mute[k]; saveB(); applyMix(); paint(); }
}, true);
document.addEventListener("input", ev => {
  const t = ev.target.closest("[data-bandvol]"); if (!t) return;
  B.vol[t.dataset.bandvol] = +t.value; saveB(); applyMix();
});
document.addEventListener("change", ev => {
  const t = ev.target.closest("[data-band]"); if (!t) return;
  const k = t.dataset.band, v = t.value;
  if (k === "loop") run.loop = v; else { B[k] = k === "style" ? v : +v; saveB(); }
  if (k === "style") { if (run.playing) restartHere(); else paint(); return; }
  if (run.playing) restartHere(); else paint();
});

/* ---------- Raccourcis clavier ---------- */
document.addEventListener("keydown", ev => {
  if ((S.tab !== "grid" && S.tab !== "song") || ev.defaultPrevented || ev.isComposing || ev.altKey || ev.ctrlKey || ev.metaKey) return;
  const tg = ev.target; if (tg && tg.closest && tg.closest("input, select, textarea, button, [role=button], [contenteditable]:not([contenteditable=false]), summary")) return;
  switch (ev.code) {
    case "Space": ev.preventDefault(); run.playing ? stop() : start(0); break;
    case "ArrowUp": case "ArrowDown": {
      ev.preventDefault(); setBpm(curBpm() + (ev.code === "ArrowUp" ? 5 : -5));
      if (!run.playing) { render(); } else { const e = $("bpmv"); if (e) e.textContent = curBpm(); paintStatus(); }
      break;
    }
    case "ArrowRight": case "ArrowLeft": {
      ev.preventDefault(); setTon(shiftTon(S.tonic, ev.code === "ArrowRight" ? 1 : -1)); if (typeof persist === "function") persist(); render();
      if (run.playing) restartHere();
      break;
    }
    case "KeyL": if (run.loop !== "off") { run.loop = "off"; if (run.playing) restartHere(); else paint(); } break;
  }
});

/* ---------- Import iReal Pro ---------- */
const QMAP = { maj: "maj", maj7: "maj7", maj6: "6", dom7: "7", sus7: "sus4", min: "m", min7: "m7", min6: "m6", minMaj7: "m", half: "m7b5", dim7: "dim", aug: "maj", power: "maj", sus2: "sus4", dimMaj7: "dim", maj7sus: "maj7", augMaj7: "maj7" };
const IR = { text: "", msg: "", list: [] };

/* Une grille OpenStand → un morceau d'Atelier modal (un accord par mesure, dans l'ordre de lecture, une section par repère). */
function chartToSong(chart) {
  const os = run.os, ton = bestTon(chart.key), order = os.playbackOrder(chart);
  const sections = []; let cur = null, held = null, skipped = 0;
  order.forEach(i => {
    const bar = chart.bars[i];
    if (bar.section || !cur) { const nm = bar.section ? ({ i: "Intro", v: "Couplet" }[bar.section] || "Section " + bar.section) : "Morceau"; cur = { name: nm, rep: 1, bars: [] }; sections.push(cur); }
    const list = bar.chords.length ? bar.chords : [{ symbol: held }];
    list.forEach(c => {
      if (!c.symbol) { cur.bars.push(null); return; }
      held = c.symbol;
      const ch = os.parseChord(c.symbol); if (!ch) { skipped++; cur.bars.push(null); return; }
      const s = mod(ch.root - ton.pc, 12); cur.bars.push(mkChord(s, QMAP[ch.quality] || "maj"));
    });
  });
  const sg = Object.assign(newSong(), { name: chart.title.slice(0, 60), mode: chart.minor ? "min" : "maj", bpm: Math.max(50, Math.min(180, Math.round(chart.bpm || 100))), sig: chart.time[0] === 3 && chart.time[1] === 4 ? "3/4" : chart.time[1] === 8 ? "6/8" : "4/4", sections });
  return { song: sg, tonic: [ton.l, ton.a], skipped };
}
function mountImport() {
  const p = $("panel"); if (!p || $("irimp")) return;
  const d = document.createElement("details"); d.id = "irimp"; d.className = "card fold"; d.dataset.fold = "iReal"; d.open = !!IR.open;
  d.innerHTML = `<summary>Importer depuis iReal Pro</summary>
   <div class="muted">Colle un lien <b>irealb://</b> (ou une playlist entière) : les morceaux sont convertis en grilles d’accords jouables, transposables et accompagnables par l’orchestre. Les reprises et les fins sont déroulées dans l’ordre de lecture.</div>
   <textarea id="ir-text" rows="3" style="width:100%;margin-top:6px" placeholder="irealb://…"></textarea>
   <div class="row" style="margin-top:6px"><button class="btn sm" data-ir="go">Importer</button><span class="muted" id="ir-msg"></span></div><div id="ir-list"></div>`;
  d.addEventListener("toggle", () => { IR.open = d.open; });
  p.appendChild(d);
  $("ir-text").value = IR.text; irPaint();
}
function irPaint() {
  const m = $("ir-msg"), l = $("ir-list"); if (!m || !l) return;
  m.textContent = IR.msg;
  l.innerHTML = IR.list.map((t, i) => `<div class="row" style="margin-top:6px"><span style="flex:1">${E(t.chart.title)}${t.chart.composer ? ` <span class="muted">· ${E(t.chart.composer)}</span>` : ""}</span>
    <button class="btn sm" data-ir="open" data-i="${i}">Ouvrir</button><button class="btn sm sec" data-ir="save" data-i="${i}">Enregistrer</button></div>`).join("");
}
document.addEventListener("click", async ev => {
  const t = ev.target.closest("[data-ir]"); if (!t) return;
  const a = t.dataset.ir;
  if (a === "go") {
    IR.text = ($("ir-text") || {}).value || ""; IR.msg = "Lecture…"; IR.list = []; irPaint();
    try {
      const os = await loadLib(); run.os = os;
      const pls = os.parseIrealLinks(IR.text), charts = pls.flatMap(p => p.charts);
      IR.list = charts.map(chart => ({ chart }));
      IR.msg = charts.length ? `${charts.length} morceau${charts.length > 1 ? "x" : ""} trouvé${charts.length > 1 ? "s" : ""}.` : "Aucun morceau reconnu : colle un lien irealb:// complet.";
    } catch (e) { IR.msg = e.message || "Import impossible."; }
    irPaint();
  } else {
    const it = IR.list[+t.dataset.i]; if (!it) return;
    const r = chartToSong(it.chart);
    if (a === "save") {
      const m = lsGet("atelier-modal-songs") || {}; m[r.song.name] = JSON.parse(JSON.stringify({ song: r.song, tonic: r.tonic }));
      IR.msg = lsSet("atelier-modal-songs", m) ? `Enregistré sous « ${r.song.name} » : tu peux l’ajouter à une playlist.` : "Enregistrement impossible ici.";
    } else {
      stop(true); loadSongObj({ song: r.song, tonic: r.tonic }); IR.msg = r.skipped ? `${r.skipped} accord${r.skipped > 1 ? "s" : ""} non reconnu${r.skipped > 1 ? "s" : ""} (mesure laissée vide).` : "";
    }
    irPaint();
  }
});

window.__band = { stop, start, run };
mount();
})();
