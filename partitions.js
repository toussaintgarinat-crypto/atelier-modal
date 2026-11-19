/* Atelier modal — onglet « Partitions » : photos et PDF gardés TELS QUELS, séparés des morceaux de l'application
   (les morceaux créés ou analysés restent dans « Morceaux »). Les fichiers sont stockés sur l'appareil (IndexedDB),
   jamais envoyés ailleurs ; on les transmet par le menu de partage du téléphone (ou en les téléchargeant). Chargé après melody.js. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const E = s => esc(String(s));
const SC = { items: [], loaded: false, busy: false, msg: "", view: null };
const MAX_PDF = 40 * 1024 * 1024;

/* ---------- stockage (IndexedDB) ---------- */
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error("Stockage de fichiers indisponible sur ce navigateur."));
    const r = indexedDB.open("atelier-modal-partitions", 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("meta", { keyPath: "id" }); d.createObjectStore("blobs"); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error || new Error("Stockage de fichiers bloqué (navigation privée ?)."));
  });
  dbp.catch(() => { dbp = null; });
  return dbp;
}
const tx = (stores, mode, fn) => db().then(d => new Promise((res, rej) => {
  const t = d.transaction(stores, mode); let rq;
  t.oncomplete = () => res(rq && rq.result); t.onerror = t.onabort = () => rej(t.error || new Error("Erreur de stockage."));
  rq = fn(t);
}));
const listMeta = () => tx("meta", "readonly", t => t.objectStore("meta").getAll()).then(a => (a || []).sort((x, y) => y.added - x.added));
const getBlob = id => tx("blobs", "readonly", t => t.objectStore("blobs").get(id));
function putItem(meta, blob) {
  return tx(["meta", "blobs"], "readwrite", t => { t.objectStore("blobs").put(blob, meta.id); return t.objectStore("meta").put(meta); });
}
const delItem = id => tx(["meta", "blobs"], "readwrite", t => { t.objectStore("blobs").delete(id); return t.objectStore("meta").delete(id); });
const setMeta = meta => tx("meta", "readwrite", t => t.objectStore("meta").put(meta));

/* ---------- fichiers : réduction des photos, miniature ---------- */
function loadImg(blob) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(blob), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); res(im); };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Image illisible.")); };
    im.src = u;
  });
}
const toBlob = (cv, q) => new Promise(r => cv.toBlob(r, "image/jpeg", q));
async function prepImage(file) {                          // photo réduite (grand côté 2400 px) + miniature
  const im = await loadImg(file), k = Math.min(1, 2400 / Math.max(im.naturalWidth, im.naturalHeight));
  const cv = document.createElement("canvas"); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k);
  cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
  const blob = await toBlob(cv, .86), t = Math.min(1, 220 / Math.max(cv.width, cv.height)), tc = document.createElement("canvas");
  tc.width = Math.max(1, Math.round(cv.width * t)); tc.height = Math.max(1, Math.round(cv.height * t));
  tc.getContext("2d").drawImage(cv, 0, 0, tc.width, tc.height);
  return { blob, thumb: tc.toDataURL("image/jpeg", .7) };
}
const baseName = n => String(n || "Partition").replace(/\.[a-z0-9]{2,5}$/i, "").slice(0, 80) || "Partition";
async function addFile(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  if (!isPdf && !/^image\//.test(file.type)) throw new Error(`« ${file.name || "fichier"} » : seuls les photos et les PDF sont acceptés.`);
  if (isPdf && file.size > MAX_PDF) throw new Error(`« ${file.name} » est trop gros (maximum 40 Mo).`);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let blob = file, thumb = "";
  if (!isPdf) { const p = await prepImage(file); blob = p.blob; thumb = p.thumb; }
  const meta = { id, name: baseName(file.name) === "image" ? "Photo " + new Date().toLocaleDateString("fr-FR") : baseName(file.name), type: isPdf ? "application/pdf" : "image/jpeg", size: blob.size, added: Date.now(), thumb };
  await putItem(meta, blob);
  return meta;
}
const sizeTxt = n => n > 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko";
const fileNameOf = m => (m.name || "Partition").replace(/[\\/:*?"<>|]+/g, " ").trim() + (m.type === "application/pdf" ? ".pdf" : ".jpg");

/* ---------- actions ---------- */
async function reload() {
  try { SC.items = await listMeta(); SC.loaded = true; } catch (x) { SC.msg = x.message; SC.loaded = true; }
  if (S.tab === "scores") renderScores();
}
async function addFiles(files) {
  SC.busy = true; SC.msg = "Ajout en cours…"; renderScores();
  let ok = 0; const errs = [];
  for (const f of files) { try { await addFile(f); ok++; } catch (x) { errs.push(x.message); } }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (x) { }   // demande de ne pas effacer ces fichiers automatiquement
  SC.busy = false;
  SC.msg = (ok ? `${ok} partition${ok > 1 ? "s" : ""} ajoutée${ok > 1 ? "s" : ""}. ` : "") + errs.join(" ");
  await reload();
}
function download(blob, name) {
  const u = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}
async function shareItem(id) {
  const m = SC.items.find(x => x.id === id); if (!m) return;
  const b = await getBlob(id); if (!b) return;
  const f = new File([b], fileNameOf(m), { type: b.type || m.type });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f], title: m.name }); return; } catch (x) { if (x && x.name === "AbortError") return; }
  }
  download(b, fileNameOf(m)); SC.msg = "Le partage direct n’est pas disponible ici : le fichier a été téléchargé, tu peux l’envoyer depuis tes téléchargements."; renderScores();
}
/* PDF : pdf.js (chargé à la demande depuis cdnjs, puis gardé hors ligne par le service worker) dessine chaque page ; on peut alors la découper comme une photo */
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", PDFW = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
function pdfLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((res, rej) => {
    const sc = document.createElement("script"); sc.src = PDFJS;
    sc.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFW; res(window.pdfjsLib); } catch (x) { rej(x); } };
    sc.onerror = () => rej(new Error("Lecteur PDF indisponible (connexion internet nécessaire la première fois)."));
    document.head.appendChild(sc);
  });
}
async function renderPdfPage(v, n) {
  const pg = await v.doc.getPage(n), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(3, 2400 / Math.max(v0.width, v0.height)) });
  const cv = document.createElement("canvas"); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
  const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
  await pg.render({ canvasContext: cx, viewport: vp }).promise;
  const blob = await toBlob(cv, .9); if (v.url) URL.revokeObjectURL(v.url);
  v.blob = blob; v.url = URL.createObjectURL(blob); v.page = n;
}
function showView() { const d = document.createElement("div"); d.id = "scview"; d.className = "scview"; document.body.appendChild(d); drawView(); }
async function openItem(id) {
  const m = SC.items.find(x => x.id === id); if (!m) return;
  const b = await getBlob(id); if (!b) return;
  if (m.type === "application/pdf") {
    try {
      const lib = await pdfLib(), doc = await lib.getDocument({ data: await b.arrayBuffer() }).promise;
      closeView(); SC.view = { id, z: 1, url: "", name: m.name, doc, pages: doc.numPages, page: 1 };
      await renderPdfPage(SC.view, 1); showView();
    } catch (x) {                                          // pas de lecteur intégré : on ouvre le PDF dans le navigateur, comme avant
      const u = URL.createObjectURL(new Blob([b], { type: "application/pdf" })), w = window.open(u, "_blank");
      if (!w) { download(b, fileNameOf(m)); SC.msg = "Ton navigateur a bloqué l’ouverture : le PDF a été téléchargé."; renderScores(); }
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    }
    return;
  }
  closeView();
  SC.view = { id, z: 1, url: URL.createObjectURL(b), name: m.name };
  showView();
}
function drawView() {
  const d = $("scview"); if (!d || !SC.view) return;
  const v = SC.view, pl = window.__pl, names = pl ? pl.names() : [];
  d.innerHTML = `<div class="scbar"><b style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${E(v.name)}</b>
    <button class="btn sm sec" data-act="sc-zoom" data-v="-1">−</button><span>${Math.round(v.z * 100)} %</span><button class="btn sm sec" data-act="sc-zoom" data-v="1">+</button>
    ${v.pages > 1 ? `<button class="btn sm sec" data-act="sc-page" data-v="-1" ${v.page <= 1 ? "disabled" : ""}>‹</button><span>p. ${v.page}/${v.pages}</span><button class="btn sm sec" data-act="sc-page" data-v="1" ${v.page >= v.pages ? "disabled" : ""}>›</button>` : ""}
    <button class="btn sm ${v.cut ? "" : "sec"}" data-act="sc-cut" title="Découper une partie de la partition">✂ Découper</button>
    <button class="btn sm" data-act="sc-close">Fermer</button></div>
   ${v.cut ? `<div class="scbar" style="flex-wrap:wrap"><span class="muted" style="flex:1;min-width:160px">${v.cut.r ? "Zone choisie : tu peux la refaire." : "Trace un rectangle sur la partition avec le doigt ou la souris."}</span>
     ${names.length ? `<select data-act="sc-plsel">${names.map((n, i) => `<option value="${i}" ${i === (v.cut.pl >= 0 ? v.cut.pl : pl.cur()) ? "selected" : ""}>${E(n)}</option>`).join("")}</select>` : ""}
     <button class="btn sm" data-act="sc-cutpl" ${v.cut.r && names.length ? "" : "disabled"}>→ Playlist</button>
     <button class="btn sm sec" data-act="sc-cutok" ${v.cut.r ? "" : "disabled"}>Garder dans Partitions</button>
     ${v.msg ? `<div class="muted" style="width:100%">${E(v.msg)}</div>` : ""}</div>` : ""}
   <div class="scbody"><div id="scwrap" style="position:relative;margin:0 auto;width:${v.z * 100}%"><img src="${v.url}" alt="${E(v.name)}" style="width:100%;max-width:none;display:block;user-select:none;-webkit-user-drag:none">
    ${v.cut ? `<div id="scov" style="position:absolute;inset:0;touch-action:none;cursor:crosshair;background:rgba(0,0,0,.18)"><div id="screct" style="position:absolute;border:2px solid #f5b13d;background:rgba(245,177,61,.18);display:none"></div></div>` : ""}</div></div>`;
  if (v.cut) wireCrop();
}
function drawRect() {
  const r = SC.view && SC.view.cut && SC.view.cut.r, el = $("screct"); if (!el) return;
  if (!r) { el.style.display = "none"; return; }
  const x = Math.min(r.x0, r.x1), y = Math.min(r.y0, r.y1), w = Math.abs(r.x1 - r.x0), h = Math.abs(r.y1 - r.y0);
  el.style.cssText += `;display:block;left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%`;
}
function wireCrop() {
  const ov = $("scov"); if (!ov) return;
  const pt = ev => { const b = ov.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (ev.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (ev.clientY - b.top) / b.height)) }; };
  let drag = false;
  ov.addEventListener("pointerdown", ev => { ev.preventDefault(); try { ov.setPointerCapture(ev.pointerId); } catch (x) { } const p = pt(ev); drag = true; SC.view.cut.r = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; drawRect(); });
  ov.addEventListener("pointermove", ev => { if (!drag) return; const p = pt(ev), r = SC.view.cut.r; r.x1 = p.x; r.y1 = p.y; drawRect(); });
  const end = () => {
    if (!drag) return; drag = false; const r = SC.view.cut.r;
    if (r && (Math.abs(r.x1 - r.x0) < .03 || Math.abs(r.y1 - r.y0) < .02)) SC.view.cut.r = null;      // trop petit : on ignore
    const z = $("scview"), keep = z && z.querySelector(".scbody") ? z.querySelector(".scbody").scrollTop : 0;
    SC.view.msg = ""; drawView(); const b = $("scview") && $("scview").querySelector(".scbody"); if (b) b.scrollTop = keep;
  };
  ov.addEventListener("pointerup", end); ov.addEventListener("pointercancel", end);
  drawRect();
}
async function cropSelection() {                 // la zone choisie devient une nouvelle partition (photo), gardée dans Partitions
  const v = SC.view, r = v && v.cut && v.cut.r; if (!r) throw new Error("Trace d’abord un rectangle.");
  const src = v.blob || await getBlob(v.id), im = await loadImg(src);
  const x = Math.round(Math.min(r.x0, r.x1) * im.naturalWidth), y = Math.round(Math.min(r.y0, r.y1) * im.naturalHeight);
  const w = Math.max(8, Math.round(Math.abs(r.x1 - r.x0) * im.naturalWidth)), h = Math.max(8, Math.round(Math.abs(r.y1 - r.y0) * im.naturalHeight));
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  cv.getContext("2d").drawImage(im, x, y, w, h, 0, 0, w, h);
  const p = await prepImage(new File([await toBlob(cv, .92)], "x.jpg", { type: "image/jpeg" }));
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const meta = { id, name: (v.name + (v.pages ? " p." + v.page : "") + " (extrait)").slice(0, 80), type: "image/jpeg", size: p.blob.size, added: Date.now(), thumb: p.thumb };
  await putItem(meta, p.blob); await reload();
  return meta;
}
function closeView() { if (SC.view) { if (SC.view.url) URL.revokeObjectURL(SC.view.url); try { if (SC.view.doc) SC.view.doc.destroy(); } catch (x) { } SC.view = null; } const d = $("scview"); if (d) d.remove(); }

/* ---------- écran ---------- */
function renderScores() {
  const p = $("panel"); if (!p) return;
  const keep = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.act === "sc-name" ? document.activeElement : null;
  if (keep) return;                                         // on ne redessine pas pendant qu'on renomme
  const items = SC.items.map(m => `<div class="card scitem"><div class="tr" style="align-items:flex-start;gap:10px">
     ${m.thumb ? `<img class="scth" src="${m.thumb}" alt="" data-act="sc-open" data-id="${m.id}">` : `<div class="scth pdf" data-act="sc-open" data-id="${m.id}">PDF</div>`}
     <div style="flex:1;min-width:0"><input class="nm" style="width:100%" value="${E(m.name)}" data-act="sc-name" data-id="${m.id}" maxlength="80" aria-label="Nom de la partition">
      <div class="muted" style="margin-top:4px">${m.type === "application/pdf" ? "PDF" : "Photo"} · ${sizeTxt(m.size)} · ${new Date(m.added).toLocaleDateString("fr-FR")}</div></div></div>
     <div class="tr" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button class="btn sm" data-act="sc-open" data-id="${m.id}">Ouvrir</button>
      <button class="btn sm sec" data-act="sc-share" data-id="${m.id}">📤 Partager</button>
      <button class="btn sm sec" data-act="sc-pl" data-id="${m.id}" title="Ajouter cette partition à la playlist en cours">＋ Playlist</button>
      ${m.type === "application/pdf" ? "" : `<button class="btn sm sec" data-act="sc-song" data-id="${m.id}" title="Lire les accords de cette photo pour en faire un morceau">♪ En faire un morceau</button>`}
      <button class="btn sm sec" data-act="sc-dl" data-id="${m.id}">Télécharger</button><button class="btn sm sec" data-act="sc-del" data-id="${m.id}">Supprimer</button></div></div>`).join("");
  p.innerHTML = `<div class="card"><h2>Partitions (photos &amp; PDF)</h2>
    <div class="muted">Tes partitions en fichier, gardées <b>telles quelles</b>. Elles sont séparées des <b>Morceaux</b>, qui sont les grilles créées ou analysées dans l’application (jouables, transposables). Ici, tu ranges, ouvres, imprimes et envoies des images et des PDF.</div>
    <div class="tr" style="margin-top:10px"><input type="file" id="sc-file" data-act="sc-file" accept="image/*,application/pdf,.pdf" multiple style="display:none">
     <button class="btn" data-act="sc-add" ${SC.busy ? "disabled" : ""}>+ Ajouter photo ou PDF</button></div>
    <div class="muted" id="sc-msg" style="margin-top:6px">${E(SC.msg)}</div></div>
   ${SC.loaded ? (items || `<div class="card"><div class="muted">Aucune partition pour l’instant. Ajoute une photo (appareil photo ou galerie) ou un PDF.</div></div>`) : `<div class="card"><div class="muted">Chargement…</div></div>`}
   <div class="card"><div class="muted">Les fichiers restent <b>sur cet appareil</b> (rien n’est envoyé en ligne). Pour les garder en sécurité ou les passer à quelqu’un, utilise <b>Partager</b> (messagerie, mail, AirDrop…) ou <b>Télécharger</b>.</div></div>
   <div id="bk-slot"></div>`;
  if (window.__bkFill) window.__bkFill();
}

/* ---------- onglet ---------- */
const _render = render, _renderTop = renderTop;
render = function () {
  _render.apply(this, arguments);
  if (S.tab === "scores") { renderScores(); const i = $("inst"); if (i) i.innerHTML = ""; if (!SC.loaded) reload(); }
};
renderTop = function () {
  _renderTop();
  $("tabs").innerHTML = [["modes", "Modes"], ["harm", "Harmonie"], ["grid", "Grilles"], ["song", "Morceaux"], ["scores", "Partitions"], ["analyse", "Analyse"], ["playlist", "Playlist"]]
    .map(([k, t]) => `<button class="${S.tab === k ? "on" : ""}" data-act="tab" data-v="${k}">${t}</button>`).join("");
};

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-act]"); if (!t || !/^sc-/.test(t.dataset.act)) return;
  const a = t.dataset.act, id = t.dataset.id;
  if (a === "sc-add") { const f = $("sc-file"); if (f) f.click(); }
  else if (a === "sc-open") openItem(id);
  else if (a === "sc-share") shareItem(id);
  else if (a === "sc-dl") { const m = SC.items.find(x => x.id === id); getBlob(id).then(b => { if (b && m) download(b, fileNameOf(m)); }); }
  else if (a === "sc-del") {
    const m = SC.items.find(x => x.id === id); if (!m) return;
    if (!confirm(`Supprimer « ${m.name} » de cet appareil ? Cette action est définitive.`)) return;
    delItem(id).then(() => { SC.msg = "Partition supprimée."; return reload(); });
  }
  else if (a === "sc-pl") { const pl = window.__pl; if (pl) { const n = pl.add("@score:" + id); const m = SC.items.find(x => x.id === id); SC.msg = `« ${m ? m.name : "Partition"} » ajoutée à la playlist « ${n} ».`; renderScores(); } }
  else if (a === "sc-page") {
    const v = SC.view; if (!v || !v.doc) return; const n = Math.max(1, Math.min(v.pages, v.page + +t.dataset.v)); if (n === v.page) return;
    renderPdfPage(v, n).then(() => { if (SC.view === v) { if (v.cut) v.cut.r = null; v.msg = ""; drawView(); } });
  }
  else if (a === "sc-cut") { if (SC.view) { SC.view.cut = SC.view.cut ? null : { r: null, pl: -1 }; SC.view.msg = ""; drawView(); } }
  else if (a === "sc-cutok" || a === "sc-cutpl") {
    if (!SC.view || !SC.view.cut) return;
    const toPl = a === "sc-cutpl", idx = SC.view.cut.pl;
    cropSelection().then(meta => {
      let msg = `✓ Extrait « ${meta.name} » gardé dans Partitions.`;
      if (toPl && window.__pl) msg = `✓ Extrait « ${meta.name} » gardé et ajouté à la playlist « ${window.__pl.add("@score:" + meta.id, idx >= 0 ? idx : undefined)} ».`;
      if (SC.view) { SC.view.cut.r = null; SC.view.msg = msg; drawView(); }
    }).catch(x => { if (SC.view) { SC.view.msg = x.message || "Découpe impossible."; drawView(); } });
  }
  else if (a === "sc-zoom") { if (SC.view) { SC.view.z = Math.max(.5, Math.min(5, SC.view.z + .5 * +t.dataset.v)); drawView(); } }
  else if (a === "sc-close") closeView();
  else if (a === "sc-song") {                               // une photo → l'analyse d'accords (nécessite la clé OpenRouter, sinon saisie à la main)
    getBlob(id).then(b => { if (!b || !window.__an) return; const r = new FileReader(); r.onload = () => { closeView(); window.__an.setPhoto(r.result); }; r.readAsDataURL(b); });
  }
  else if (a === "sc-keep") {                               // depuis Analyse : garder la photo en cours dans Partitions
    const src = window.__an && window.__an.getPhoto(); if (!src) return;
    fetch(src).then(r => r.blob()).then(b => addFile(new File([b], "Photo " + new Date().toLocaleDateString("fr-FR") + ".jpg", { type: b.type || "image/jpeg" })))
      .then(() => { t.textContent = "✓ Gardée dans Partitions"; t.disabled = true; SC.loaded = false; })
      .catch(x => { t.textContent = "Impossible : " + x.message; });
  }
});
document.addEventListener("change", ev => {
  const t = ev.target; if (!t.dataset) return;
  if (t.dataset.act === "sc-plsel") { if (SC.view && SC.view.cut) SC.view.cut.pl = +t.value; return; }
  if (t.dataset.act === "sc-file") { const fs = Array.from(t.files || []); t.value = ""; if (fs.length) addFiles(fs); }
  else if (t.dataset.act === "sc-name") {
    const m = SC.items.find(x => x.id === t.dataset.id); if (!m) return;
    m.name = String(t.value).trim().slice(0, 80) || "Partition"; setMeta(m).catch(() => { });
  }
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && SC.view) closeView(); });

window.__scores = { listMeta, getBlob, putItem, prepImage, reload, peek: id => SC.items.find(x => x.id === id), loaded: () => SC.loaded, ensure: () => SC.loaded ? Promise.resolve() : listMeta().then(a => { SC.items = a; SC.loaded = true; }).catch(() => { SC.loaded = true; }) };
renderTop();                                   // l'onglet apparaît dès le chargement
if (S.tab === "scores") render();
})();
