/* Atelier modal — sauvegarde : fichier ZIP (clé USB, mail…) et Google Drive.
   Contenu : les morceaux enregistrés, les playlists et les partitions (photos / PDF) de l'onglet Partitions.
   Google Drive : connexion « Google Identity Services » dans le navigateur, accès limité aux fichiers créés par l'application
   (portée drive.file) : l'application ne voit rien d'autre dans ton Drive. Chargé après partitions.js. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const E = s => esc(String(s));
const K_SONGS = "atelier-modal-songs", K_PL = "atelier-modal-playlists", K_GID = "atelier-modal-gcid";
const DEFAULT_CLIENT_ID = "909003621424-mpttgr57brn71su2mt4c35cac903a660.apps.googleusercontent.com";                       // identifiant client Google (public) à renseigner une fois créé dans Google Cloud ; sinon chacun peut saisir le sien
const SCOPE = "https://www.googleapis.com/auth/drive.file", FOLDER = "Atelier modal";
const BK = { msg: "", busy: false, gmsg: "", gopen: false };
const SCR = () => window.__scores;
const clientId = () => { try { return (localStorage.getItem(K_GID) || "").trim() || DEFAULT_CLIENT_ID; } catch (x) { return DEFAULT_CLIENT_ID; } };

/* ---------- ZIP (sans compression : lisible partout) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
async function makeZip(files) {
  const enc = new TextEncoder(), parts = [], central = [], now = new Date(); let off = 0;
  const dt = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(), tm = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer()), name = enc.encode(f.name), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, tm, true); h.setUint16(12, dt, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(h.buffer, name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(c.buffer, name);
    off += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, e.buffer], { type: "application/zip" });
}
async function readZip(file) {                       // renvoie {nom: Uint8Array}
  const buf = await file.arrayBuffer(), v = new DataView(buf), u8 = new Uint8Array(buf);
  let e = -1; for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65600); i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error("Ce fichier n’est pas une sauvegarde ZIP valide.");
  const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true); const out = {}, dec = new TextDecoder();
  if (n > 5000) throw new Error("Sauvegarde trop volumineuse.");
  for (let i = 0; i < n; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error("Sauvegarde ZIP abîmée.");
    const method = v.getUint16(p + 10, true), cs = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + el + cl;
    if (name.endsWith("/")) continue;
    const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true), raw = u8.subarray(ds, ds + cs);
    if (method === 0) out[name] = raw;
    else if (method === 8 && window.DecompressionStream) out[name] = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else throw new Error("Ce ZIP utilise une compression non prise en charge : exporte-le depuis l’application.");
  }
  return out;
}

/* ---------- contenu de la sauvegarde ---------- */
const extOf = m => m.type === "application/pdf" ? "pdf" : "jpg";
const safe = s => String(s || "Partition").replace(/[\\/:*?"<>|\x00-\x1f]+/g, " ").trim().slice(0, 60) || "Partition";
async function collect() {
  const S0 = SCR(); if (!S0) throw new Error("Stockage des partitions indisponible.");
  const meta = await S0.listMeta(), files = [], index = [];
  for (const m of meta) {
    const b = await S0.getBlob(m.id); if (!b) continue;
    const file = `partitions/${safe(m.name)} [${m.id}].${extOf(m)}`;
    files.push({ name: file, blob: b }); index.push(Object.assign({}, m, { file }));
  }
  const data = { v: 1, saved: new Date().toISOString(), songs: lsGet(K_SONGS) || {}, playlists: lsGet(K_PL) || null };
  files.unshift({ name: "partitions/index.json", blob: new Blob([JSON.stringify(index)], { type: "application/json" }) });
  files.unshift({ name: "morceaux.json", blob: new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }) });
  return { files, nSongs: Object.keys(data.songs).length, nScores: index.length };
}
const stamp = () => new Date().toISOString().slice(0, 10);
const summary = c => `${c.nSongs} morceau${c.nSongs > 1 ? "x" : ""} et ${c.nScores} partition${c.nScores > 1 ? "s" : ""}`;

/* ---------- export : fichier ZIP / dossier ---------- */
function downloadBlob(blob, name) {
  const u = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}
async function saveSmart(blob, name) {
  if (window.showSaveFilePicker) {                                   // ordinateur (Chrome, Edge) : on choisit l'emplacement, y compris une clé USB
    try {
      const h = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: "Sauvegarde Atelier modal", accept: { "application/zip": [".zip"] } }] });
      const w = await h.createWritable(); await w.write(blob); await w.close(); return "pick";
    } catch (x) { if (x && x.name === "AbortError") return "cancel"; }
  }
  const f = new File([blob], name, { type: "application/zip" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {      // téléphone : menu de partage (Fichiers, clé USB, mail, Drive…)
    try { await navigator.share({ files: [f], title: name }); return "share"; } catch (x) { if (x && x.name === "AbortError") return "cancel"; }
  }
  downloadBlob(blob, name); return "download";
}
async function exportZip() {
  const c = await collect(), name = `atelier-modal-sauvegarde-${stamp()}.zip`, how = await saveSmart(await makeZip(c.files), name);
  if (how === "cancel") return "Export annulé.";
  return `Sauvegarde créée (${summary(c)}). ` + (how === "pick" ? "Fichier enregistré à l’endroit choisi." : how === "share" ? "Choisis où l’envoyer ou l’enregistrer." : "Le fichier a été téléchargé : copie-le ensuite sur ta clé USB.");
}
async function exportDir() {
  let dir; try { dir = await window.showDirectoryPicker({ mode: "readwrite" }); } catch (x) { return "Export annulé."; }
  const c = await collect(), top = await dir.getDirectoryHandle(`Atelier modal ${stamp()}`, { create: true });
  for (const f of c.files) {
    const segs = f.name.split("/"); let d = top;
    for (const s of segs.slice(0, -1)) d = await d.getDirectoryHandle(s, { create: true });
    const w = await (await d.getFileHandle(segs[segs.length - 1], { create: true })).createWritable(); await w.write(f.blob); await w.close();
  }
  return `Dossier « Atelier modal ${stamp()} » créé (${summary(c)}). Les photos et PDF y sont lisibles directement.`;
}

/* ---------- import ---------- */
function mergeSongs(songs) {
  const cur = lsGet(K_SONGS) || {}; let add = 0, skip = 0;
  Object.keys(songs || {}).slice(0, 500).forEach(k => {
    const e = songs[k];
    if (!e || typeof k !== "string" || !validSong(e.song)) { skip++; return; }
    if (cur[k]) { skip++; return; }
    cur[k] = e; add++;
  });
  if (add) lsSet(K_SONGS, cur);
  return { add, skip };
}
function mergePlaylists(pl) {
  if (!pl || !Array.isArray(pl.lists)) return 0;
  const cur = lsGet(K_PL) || { lists: [], cur: 0 }; if (!Array.isArray(cur.lists)) cur.lists = [];
  let add = 0;
  pl.lists.slice(0, 50).forEach(l => {
    if (!l || typeof l.name !== "string" || !Array.isArray(l.items) || cur.lists.some(x => x.name === l.name)) return;
    cur.lists.push({ name: l.name.slice(0, 80), items: l.items.filter(i => typeof i === "string").slice(0, 500), shift: l.shift | 0 }); add++;
  });
  if (add) { if (!(cur.cur >= 0 && cur.cur < cur.lists.length)) cur.cur = 0; lsSet(K_PL, cur); }
  return add;
}
async function addScore(meta, blob) {                 // ajoute une partition absente (identifiée par son id)
  const S0 = SCR(), have = await S0.listMeta();
  if (have.some(x => x.id === meta.id)) return false;
  const m = { id: String(meta.id).slice(0, 40), name: String(meta.name || "Partition").slice(0, 80), type: meta.type === "application/pdf" ? "application/pdf" : "image/jpeg", size: blob.size, added: +meta.added || Date.now(), thumb: typeof meta.thumb === "string" && meta.thumb.startsWith("data:image/") ? meta.thumb : "" };
  if (m.type !== "application/pdf" && !m.thumb) { try { m.thumb = (await S0.prepImage(new File([blob], "x.jpg", { type: blob.type || "image/jpeg" }))).thumb; } catch (x) { } }
  await S0.putItem(m, blob); return true;
}
async function importZip(file) {
  const z = await readZip(file), dec = new TextDecoder();
  if (!z["morceaux.json"] && !z["partitions/index.json"]) throw new Error("Ce ZIP n’est pas une sauvegarde Atelier modal.");
  let songs = { add: 0, skip: 0 }, pls = 0, sc = 0;
  if (z["morceaux.json"]) { const d = JSON.parse(dec.decode(z["morceaux.json"])); songs = mergeSongs(d.songs); pls = mergePlaylists(d.playlists); }
  if (z["partitions/index.json"]) {
    const idx = JSON.parse(dec.decode(z["partitions/index.json"]));
    for (const m of (Array.isArray(idx) ? idx : []).slice(0, 2000)) {
      const raw = z[m.file]; if (!raw || raw.length > 60 * 1048576) continue;
      if (await addScore(m, new Blob([raw], { type: m.type === "application/pdf" ? "application/pdf" : "image/jpeg" }))) sc++;
    }
  }
  return { songs, pls, sc };
}
const importMsg = r => `Importé : ${r.songs.add} morceau${r.songs.add > 1 ? "x" : ""}, ${r.sc} partition${r.sc > 1 ? "s" : ""}${r.pls ? `, ${r.pls} playlist${r.pls > 1 ? "s" : ""}` : ""}.` + (r.songs.skip ? ` ${r.songs.skip} morceau${r.songs.skip > 1 ? "x" : ""} déjà présent${r.songs.skip > 1 ? "s" : ""} ou illisible${r.songs.skip > 1 ? "s" : ""} (le tien est conservé).` : "");

/* ---------- Google Drive ---------- */
const DR = { token: null, exp: 0, folder: null };
function gisLoad() {
  return new Promise((res, rej) => {
    if (window.google && google.accounts && google.accounts.oauth2) return res();
    const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = res; s.onerror = () => rej(new Error("Impossible de joindre Google (es-tu connecté à internet ?)."));
    document.head.appendChild(s);
  });
}
async function token() {
  if (DR.token && Date.now() < DR.exp - 60000) return DR.token;
  const cid = clientId();
  if (!cid) throw new Error("Renseigne d’abord l’identifiant client Google (réglages ci-dessous).");
  await gisLoad();
  return new Promise((res, rej) => {
    const c = google.accounts.oauth2.initTokenClient({
      client_id: cid, scope: SCOPE,
      callback: r => { if (r.error) return rej(new Error("Connexion refusée : " + (r.error_description || r.error))); DR.token = r.access_token; DR.exp = Date.now() + (r.expires_in || 3600) * 1000; res(DR.token); },
      error_callback: e => rej(new Error(e && e.type === "popup_closed" ? "Connexion annulée." : "Connexion impossible : " + ((e && (e.message || e.type)) || "erreur inconnue")))
    });
    c.requestAccessToken({ prompt: DR.token ? "" : "consent" });
  });
}
async function api(path, opt, up) {
  const t = await token(), url = (up ? "https://www.googleapis.com/upload/drive/v3/" : "https://www.googleapis.com/drive/v3/") + path;
  const r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: "Bearer " + t }, (opt && opt.headers) || {}) }));
  if (r.status === 401) { DR.token = null; throw new Error("Connexion Google expirée : réessaie."); }
  if (!r.ok) { let m = ""; try { m = (await r.json()).error.message; } catch (x) { } throw new Error(`Google Drive a refusé la demande (${r.status}${m ? " : " + m : ""}).`); }
  return r;
}
async function folderId() {
  if (DR.folder) return DR.folder;
  const q = encodeURIComponent(`name='${FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const l = await (await api(`files?q=${q}&fields=files(id)&pageSize=1`)).json();
  if (l.files && l.files[0]) return (DR.folder = l.files[0].id);
  const c = await (await api("files?fields=id", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: FOLDER, mimeType: "application/vnd.google-apps.folder" }) })).json();
  return (DR.folder = c.id);
}
async function listRemote(fid) {
  const out = []; let pt = "";
  do {
    const q = encodeURIComponent(`'${fid}' in parents and trashed=false`);
    const l = await (await api(`files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size,appProperties)&pageSize=200${pt ? "&pageToken=" + pt : ""}`)).json();
    out.push(...(l.files || [])); pt = l.nextPageToken || "";
  } while (pt);
  return out;
}
function multipart(meta, blob, type) {
  const b = "am" + Math.random().toString(36).slice(2);
  return { headers: { "Content-Type": `multipart/related; boundary=${b}` }, body: new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${type}\r\n\r\n`, blob, `\r\n--${b}--`]) };
}
async function driveBackup(say) {
  say("Connexion à Google…"); const fid = await folderId(); say("Lecture du dossier Drive…");
  const remote = await listRemote(fid), have = new Set(remote.map(f => f.appProperties && f.appProperties.amId).filter(Boolean));
  const S0 = SCR(), meta = await S0.listMeta(); let up = 0, i = 0;
  for (const m of meta) {
    i++; if (have.has(m.id)) continue;
    say(`Envoi des partitions… ${i}/${meta.length}`);
    const b = await S0.getBlob(m.id); if (!b) continue;
    const mp = multipart({ name: `${safe(m.name)}.${extOf(m)}`, parents: [fid], appProperties: { amId: m.id, amName: String(m.name).slice(0, 100), amAdded: String(m.added) } }, b, m.type);
    await api("files?uploadType=multipart&fields=id", { method: "POST", headers: mp.headers, body: mp.body }, true); up++;
  }
  say("Envoi des morceaux…");
  const songsBlob = new Blob([JSON.stringify({ v: 1, saved: new Date().toISOString(), songs: lsGet(K_SONGS) || {}, playlists: lsGet(K_PL) || null }, null, 1)], { type: "application/json" });
  const old = remote.find(f => f.appProperties && f.appProperties.amKind === "songs");
  const mp = multipart(old ? {} : { name: "morceaux.json", parents: [fid], appProperties: { amKind: "songs" } }, songsBlob, "application/json");
  await api(old ? `files/${old.id}?uploadType=multipart&fields=id` : "files?uploadType=multipart&fields=id", { method: old ? "PATCH" : "POST", headers: mp.headers, body: mp.body }, true);
  return `Sauvegarde Google Drive terminée : ${up} nouvelle${up > 1 ? "s" : ""} partition${up > 1 ? "s" : ""} envoyée${up > 1 ? "s" : ""}, ${Object.keys(lsGet(K_SONGS) || {}).length} morceau${Object.keys(lsGet(K_SONGS) || {}).length > 1 ? "x" : ""} à jour. Dossier « ${FOLDER} » dans ton Drive.`;
}
async function driveRestore(say) {
  say("Connexion à Google…"); const fid = await folderId(); say("Lecture du dossier Drive…");
  const remote = await listRemote(fid), S0 = SCR(), local = new Set((await S0.listMeta()).map(m => m.id));
  let songs = { add: 0, skip: 0 }, pls = 0, sc = 0, n = 0;
  const sf = remote.find(f => f.appProperties && f.appProperties.amKind === "songs");
  if (sf) { say("Récupération des morceaux…"); const d = await (await api(`files/${sf.id}?alt=media`)).json(); songs = mergeSongs(d.songs); pls = mergePlaylists(d.playlists); }
  const todo = remote.filter(f => f.appProperties && f.appProperties.amId && !local.has(f.appProperties.amId));
  for (const f of todo) {
    n++; say(`Récupération des partitions… ${n}/${todo.length}`);
    const b = await (await api(`files/${f.id}?alt=media`)).blob();
    if (await addScore({ id: f.appProperties.amId, name: f.appProperties.amName || f.name, type: f.mimeType, added: f.appProperties.amAdded }, b)) sc++;
  }
  return importMsg({ songs, pls, sc });
}

/* ---------- affichage (dans l'onglet Partitions) ---------- */
function fill() {
  const slot = $("bk-slot"); if (!slot) return;
  const dirOk = !!window.showDirectoryPicker, cid = clientId(), origin = /^https?:/.test(location.protocol) ? location.origin : "https://atelier-modal.vercel.app";
  slot.innerHTML = `<div class="card" id="bkcard"><h2>Sauvegarde</h2>
    <div class="muted">Tes <b>morceaux enregistrés</b>, tes <b>playlists</b> et tes <b>partitions</b> (photos et PDF) : exporte-les pour ne rien perdre en changeant d’appareil ou si le navigateur est vidé.</div>
    <div class="tr" style="margin-top:10px;flex-wrap:wrap;gap:6px"><button class="btn" data-act="bk-zip" ${BK.busy ? "disabled" : ""}>💾 Exporter tout (clé USB, mail…)</button>
     ${dirOk ? `<button class="btn sm sec" data-act="bk-dir" ${BK.busy ? "disabled" : ""}>📁 Vers un dossier / une clé USB</button>` : ""}
     <button class="btn sm sec" data-act="bk-imp" ${BK.busy ? "disabled" : ""}>📂 Importer une sauvegarde</button>
     <input type="file" id="bk-file" data-act="bk-file" accept=".zip,application/zip" style="display:none"></div>
    <div class="muted" style="margin-top:6px">${dirOk ? "<b>Clé USB</b> : branche-la, puis « Vers un dossier / une clé USB » (les photos et PDF y sont lisibles) ou « Exporter tout » (un seul fichier ZIP) et choisis la clé." : "<b>Clé USB</b> : « Exporter tout » crée un seul fichier ZIP. Sur ordinateur, enregistre-le directement sur la clé ; sur téléphone, choisis « Enregistrer dans Fichiers » puis ta clé, ou copie-le plus tard."}</div>
    <div class="muted" id="bk-msg" style="margin-top:6px">${E(BK.msg)}</div>
    <details id="bk-g" ${BK.gopen ? "open" : ""} style="margin-top:10px"><summary>☁ Google Drive</summary>
     <div class="muted" style="margin:6px 0">Sauvegarde et restauration dans un dossier « ${FOLDER} » de <b>ton</b> Drive. L’application n’a accès qu’aux fichiers qu’elle y crée, jamais au reste de ton Drive.</div>
     <div class="tr" style="flex-wrap:wrap;gap:6px"><button class="btn sm" data-act="bk-gsave" ${BK.busy ? "disabled" : ""}>☁ Sauvegarder sur Drive</button><button class="btn sm sec" data-act="bk-grest" ${BK.busy ? "disabled" : ""}>⬇ Restaurer depuis Drive</button></div>
     <div class="muted" id="bk-gmsg" style="margin-top:6px">${E(BK.gmsg)}</div>
     <details style="margin-top:8px"><summary>Réglage de la connexion Google${cid ? " ✓" : " (à faire une fois)"}</summary>
      <div class="muted" style="margin:6px 0">Il faut un « identifiant client OAuth » Google (gratuit, public). Dans <b>console.cloud.google.com</b> : crée un projet, active l’<b>API Google Drive</b>, configure l’écran de consentement (externe, publié « en production »), puis <i>Identifiants → Créer → ID client OAuth → Application Web</i> avec comme « origine JavaScript autorisée » : <code>${E(origin)}</code>. Colle l’identifiant ici :</div>
      <div class="tr"><input class="nm" id="bk-cid" placeholder="123456789-abc….apps.googleusercontent.com" value="${E(cid)}" autocomplete="off"><button class="btn sm" data-act="bk-cidsave">Enregistrer</button></div></details>
    </details></div>`;
}
window.__bkFill = fill;
const say = (k, busy) => t => { BK[k] = t; BK.busy = busy !== false; fill(); };
async function run(kind, fn) {
  if (BK.busy) return;
  const key = kind === "g" ? "gmsg" : "msg", other = kind === "g" ? "msg" : "gmsg"; BK[other] = "";
  const s = say(key, true);
  try { const m = await fn(s); BK.busy = false; BK[key] = m; }
  catch (x) { BK.busy = false; BK[key] = x && x.message ? x.message : "Erreur inattendue."; }
  fill();
  const sc = SCR(); if (sc) { await sc.reload(); fill(); }
}
function reloadSoon(r) { if (r && (r.songs.add || r.pls)) setTimeout(() => location.reload(), 2200); }      // morceaux et playlists sont lus au démarrage

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t || !/^bk-/.test(t.dataset.act)) return;
  const a = t.dataset.act;
  if (a === "bk-zip") run("l", exportZip);
  else if (a === "bk-dir") run("l", exportDir);
  else if (a === "bk-imp") { const f = $("bk-file"); if (f) f.click(); }
  else if (a === "bk-cidsave") { try { localStorage.setItem(K_GID, ($("bk-cid").value || "").trim()); BK.gmsg = "Identifiant enregistré."; } catch (x) { BK.gmsg = "Enregistrement impossible ici."; } BK.gopen = true; fill(); const d = $("bk-g"); if (d) d.open = true; }
  else if (a === "bk-gsave") { BK.gopen = true; run("g", driveBackup); }
  else if (a === "bk-grest") { BK.gopen = true; run("g", async s => { const m = await driveRestore(s); return m + (/Importé : [1-9]\d* morceau|, \d+ playlist/.test(m) ? " L’application va se recharger." : ""); }).then(() => { const r = /Importé : (\d+) morceau/.exec(BK.gmsg); if (r && +r[1] > 0 || /playlist/.test(BK.gmsg)) setTimeout(() => location.reload(), 2200); }); }
});
document.addEventListener("change", ev => {
  const t = ev.target; if (!t.dataset || t.dataset.act !== "bk-file") return;
  const f = t.files && t.files[0]; t.value = ""; if (!f) return;
  run("l", async s => { s("Lecture de la sauvegarde…"); const r = await importZip(f); reloadSoon(r); return importMsg(r) + (r.songs.add || r.pls ? " L’application va se recharger." : ""); });
});
document.addEventListener("toggle", ev => { if (ev.target && ev.target.id === "bk-g") BK.gopen = ev.target.open; }, true);

window.__backup = { makeZip, readZip, collect, importZip, crc32 };
if (S.tab === "scores") render();
})();
