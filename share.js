/* Atelier modal — partage d'un morceau par QR code / lien, et réception.
   Chargé après app.js, qrcode.js et analyse.js. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const PUBLIC_URL = "https://atelier-modal.vercel.app/";
const base = () => /^https?:$/.test(location.protocol) ? location.origin + location.pathname : PUBLIC_URL;
const K_SONGS = "atelier-modal-songs";

/* ---------- Codage compact du morceau ---------- */
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
function encodeSong(song, tonic) {
  const ti = TON.findIndex(t => t.l === tonic.l && t.a === tonic.a);
  const arr = [1, song.name, song.mode, song.bpm, song.sig, song.pstyle, song.gstyle, song.loop ? 1 : 0, ti < 0 ? 0 : ti,
    song.sections.map(s => [s.name, s.rep || 1, s.bars.map(b => b ? b.s + ":" + b.q : ""), s.shift | 0, s.mel && s.mel.length ? s.mel : 0,
      s.st && s.st.length ? s.st.map(v => [v.clef || "sol", v.mel || []]) : 0, s.clef || 0]), song.cs === false ? 0 : 1];
  return b64e(JSON.stringify(arr));
}
function decodeSong(code) {
  let a;
  try { a = JSON.parse(b64d(code)); } catch (x) { return null; }
  try {
    if (!Array.isArray(a) || a[0] !== 1 || a.length < 10) return null;
    const [, name, mode, bpm, sig, ps, gs, loop, ti, secs] = a;
    if (typeof name !== "string" || !["maj", "min"].includes(mode) || !SIGS[sig]) return null;
    if (!["none", "bloc", "ballade", "arpege"].includes(ps) || !["none", "noires", "pop", "arpege"].includes(gs)) return null;
    if (!Number.isInteger(ti) || !TON[ti] || !Number.isFinite(bpm) || !Array.isArray(secs) || !secs.length || secs.length > 24) return null;
    const sections = secs.map(s => {
      if (!Array.isArray(s) || typeof s[0] !== "string" || !Array.isArray(s[2]) || s[2].length > 96) throw 0;
      const bars = s[2].map(b => {
        if (b === "") return null;
        const m = /^(\d+):([A-Za-z0-9]+)$/.exec(b);
        if (!m || +m[1] > 11 || !CH[m[2]]) throw 0;
        return mkChord(+m[1], m[2]);
      });
      const sh = Math.max(-11, Math.min(11, s[3] | 0)), o = { name: s[0].slice(0, 60), rep: Math.min(4, Math.max(1, s[1] | 0)), bars };
      if (sh) o.shift = sh;
      const CL = ["sol", "fa", "ut3", "ut4"];
      const okMel = a => Array.isArray(a) && a.length <= 400 ? a.filter(n => Array.isArray(n) && n.length === 6 && n.every(Number.isInteger) && n[0] >= 0 && n[0] < bars.length && n[1] >= 0 && n[1] < 12 && n[2] >= 1 && n[2] <= 32 && n[3] >= 0 && n[3] < 7 && n[4] >= 0 && n[4] < 12 && Math.abs(n[5]) <= 3) : [];
      const mel = okMel(s[4]); if (mel.length) o.mel = mel;
      if (CL.includes(s[6]) && s[6] !== "sol") o.clef = s[6];
      if (Array.isArray(s[5])) {
        const st = s[5].slice(0, 3).filter(v => Array.isArray(v) && CL.includes(v[0])).map(v => { const x = {}; if (v[0] !== "sol") x.clef = v[0]; const m2 = okMel(v[1]); if (m2.length) x.mel = m2; return x; });
        if (st.length) o.st = st;
      }
      return o;
    });
    const song = Object.assign(newSong(), a[10] === 0 ? { cs: false } : {}, { name: name.slice(0, 80) || "Morceau reçu", mode, bpm: Math.min(220, Math.max(40, Math.round(bpm))), sig, pstyle: ps, gstyle: gs, loop: !!loop, sections });
    return { song, tonic: [TON[ti].l, TON[ti].a] };
  } catch (x) { return null; }
}
const linkFor = (song, tonic) => base() + "#m=" + encodeSong(song, tonic);
function qrSvg(text) {
  for (const lvl of ["M", "L"]) {
    try { const q = qrcode(0, lvl); q.addData(text, "Byte"); q.make(); return q.createSvgTag({ cellSize: 4, margin: 4, scalable: true }); } catch (x) { }
  }
  return null;
}
window.__share = { encodeSong, decodeSong, linkFor, qrSvg };

/* ---------- Fenêtre de partage ---------- */
let cam = null;
function stopCam() { if (cam) { cam.stop = true; try { cam.stream.getTracks().forEach(t => t.stop()); } catch (x) { } cam = null; } }
function closeModal() { stopCam(); const m = $("shmodal"); if (m) m.remove(); }
function modal(html) {
  closeModal();
  const d = document.createElement("div");
  d.id = "shmodal"; d.className = "shmodal";
  d.innerHTML = `<div class="shbox"><button class="shx" data-act="sh-close" aria-label="Fermer">✕</button>${html}</div>`;
  document.body.appendChild(d);
}
function openShare() {
  const song = S.song, link = linkFor(song, S.tonic), svg = qrSvg(link);
  modal(`<h2>Partager « ${esc(song.name)} »</h2>
   ${svg ? `<div class="qrbox">${svg}</div><div class="muted" style="margin:8px 0">Demande à l’autre personne de scanner ce QR code avec l’appareil photo de son téléphone : le morceau s’ouvre dans l’application et elle choisit de l’importer.</div>`
     : `<div class="muted" style="margin:8px 0">Morceau trop long pour un QR code : envoie le lien ci-dessous.</div>`}
   <div class="tr"><button class="btn sm" data-act="sh-copy">Copier le lien</button>${navigator.share ? `<button class="btn sm sec" data-act="sh-native">Partager…</button>` : ""}</div>
   <div class="muted" id="shmsg" style="margin-top:6px"></div>`);
  $("shmodal").dataset.link = link;
}
function openScan() {
  const can = "BarcodeDetector" in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  modal(`<h2>Recevoir un morceau</h2>
   ${can ? `<video id="shvid" playsinline muted style="width:100%;border-radius:12px;background:#000"></video><div class="muted" id="shmsg" style="margin:6px 0">Vise le QR code…</div>`
     : `<div class="muted" style="margin:6px 0">Scanne le QR code avec l’appareil photo de ton téléphone : le lien ouvre l’application. Tu peux aussi coller le lien reçu ci-dessous.</div><div class="muted" id="shmsg"></div>`}
   <div class="tr" style="margin-top:8px"><input class="nm" id="shpaste" placeholder="Coller un lien reçu"><button class="btn sm" data-act="sh-paste">Importer</button></div>`);
  if (can) startCam();
}
async function startCam() {
  const msg = t => { const m = $("shmsg"); if (m) m.textContent = t; };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const v = $("shvid"); if (!v) { stream.getTracks().forEach(t => t.stop()); return; }
    cam = { stream, stop: false }; v.srcObject = stream; await v.play();
    const det = new BarcodeDetector({ formats: ["qr_code"] }), me = cam;
    const loop = async () => {
      if (me.stop) return;
      try { const r = await det.detect(v); if (r.length && handleText(r[0].rawValue)) return; } catch (x) { }
      setTimeout(loop, 250);
    };
    loop();
  } catch (x) { msg("Caméra indisponible : autorise-la, ou scanne avec l’appareil photo du téléphone."); }
}

/* ---------- Réception ---------- */
function handleText(text) {
  const m = /[#&]m=([A-Za-z0-9_-]+)/.exec(String(text || ""));
  if (!m) return false;
  const got = decodeSong(m[1]);
  if (!got) { const e = $("shmsg"); if (e) e.textContent = "Ce lien n’est pas un morceau valide."; return false; }
  showReceived(got);
  return true;
}
let RECV = null;
function showReceived(got) {
  RECV = got; closeModal();
  const bars = got.song.sections.reduce((n, s) => n + s.bars.length, 0), t = TON.find(x => x.l === got.tonic[0] && x.a === got.tonic[1]);
  modal(`<h2>Morceau reçu</h2>
   <div style="font-size:16px;margin-bottom:4px"><b>${esc(got.song.name)}</b></div>
   <div class="muted">${esc(nmN(t))} ${got.song.mode === "min" ? "mineur" : "majeur"} · ${esc(got.song.sig)} · ${got.song.bpm} BPM · ${got.song.sections.length} section(s) · ${bars} mesures</div>
   <div class="muted" style="margin:8px 0">Ce morceau a été envoyé par quelqu’un d’autre. Tu peux l’ouvrir pour l’écouter, ou l’ajouter à tes morceaux.</div>
   <div class="tr"><button class="btn" data-act="sh-open">Ouvrir</button><button class="btn sm sec" data-act="sh-keep">Ajouter à mes morceaux</button><button class="btn sm sec" data-act="sh-close">Ignorer</button></div>`);
}
function clearHash() { try { history.replaceState(null, "", location.pathname + location.search); } catch (x) { } }
function fromHash() { if (/#m=/.test(location.hash)) { const ok = handleText(location.hash); if (!ok) clearHash(); } }

/* ---------- Brancher l'interface dans l'onglet Morceaux ---------- */
const _renderSong = renderSong;
renderSong = function () {
  _renderSong();
  const p = $("panel");
  if (!p || $("shcard")) return;
  const c = document.createElement("div");
  c.className = "card"; c.id = "shcard";
  c.innerHTML = `<h2>Envoyer / recevoir</h2><div class="tr"><button class="btn sm" data-act="sh-open-share">📱 Partager par QR code</button><button class="btn sm sec" data-act="sh-open-scan">📷 Recevoir</button></div>`;
  p.insertBefore(c, p.children[1] || null);
};

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t) return;
  switch (t.dataset.act) {
    case "sh-open-share": openShare(); break;
    case "sh-open-scan": openScan(); break;
    case "sh-close": closeModal(); RECV = null; clearHash(); break;
    case "sh-copy": {
      const link = $("shmodal") && $("shmodal").dataset.link, m = $("shmsg");
      const ok = () => { if (m) m.textContent = "Lien copié."; }, ko = () => { if (m) m.textContent = "Copie impossible ici : appuie longuement sur le lien pour le copier."; };
      try { navigator.clipboard.writeText(link).then(ok).catch(ko); } catch (x) { ko(); }
      break;
    }
    case "sh-native": { const link = $("shmodal").dataset.link; try { navigator.share({ title: S.song.name, text: "Un morceau de l’Atelier modal", url: link }).catch(() => { }); } catch (x) { } break; }
    case "sh-paste": { const v = $("shpaste"); if (v && !handleText(v.value)) { const m = $("shmsg"); if (m) m.textContent = "Lien non reconnu."; } break; }
    case "sh-open": if (RECV) { const got = RECV; RECV = null; closeModal(); clearHash(); S.tab = "song"; loadSongObj(got); } break;
    case "sh-keep": if (RECV) {
      const m = lsGet(K_SONGS) || {}; let name = RECV.song.name; if (m[name]) name += " (reçu)";
      RECV.song.name = name; m[name] = JSON.parse(JSON.stringify(RECV)); lsSet(K_SONGS, m);
      const msg = document.createElement("div"); msg.className = "muted"; msg.style.marginTop = "8px"; msg.textContent = "Ajouté à tes morceaux : « " + name + " ».";
      const b = document.querySelector("#shmodal .shbox"); if (b) b.appendChild(msg);
    } break;
  }
});
window.addEventListener("hashchange", fromHash);
if (S.tab === "song") render();
fromHash();
})();
