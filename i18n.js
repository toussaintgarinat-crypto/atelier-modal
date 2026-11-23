/* Atelier modal — langue de l'interface (français / anglais / espagnol). Chargé avant app.js.
   Le code de l'application écrit ses textes en français ; en mode anglais ou espagnol, ce module les traduit à l'affichage
   (dictionnaires i18n-en.js et i18n-es.js ; une chaîne absente du dictionnaire reste en français)
   et surveille le DOM pour traduire aussi les rendus suivants. */
(function () {
"use strict";
const LS = "atelier-modal-lang";
let lang = null;
try { lang = localStorage.getItem(LS); } catch (e) { }
if (lang !== "fr" && lang !== "en" && lang !== "es") lang = /^en/i.test(navigator.language || "") ? "en" : /^es/i.test(navigator.language || "") ? "es" : "fr";
window.__lang = lang;
document.documentElement.lang = lang;

function setLang(l) { try { localStorage.setItem(LS, l); localStorage.setItem(LS + "-set", "1"); } catch (e) { } location.reload(); }
window.__setLang = setLang;

/* Bouton de bascule (placé dans l'en-tête dès que celui-ci existe). */
function addToggle() {
  const h1 = document.querySelector("header h1") || document.body; if (!h1 || document.getElementById("langbtn")) return;
  const b = document.createElement("button");
  b.id = "langbtn"; b.type = "button"; b.setAttribute("data-i18n-skip", "");
  const NEXT = { fr: "EN", en: "ES", es: "FR" };
  b.textContent = NEXT[lang];
  b.title = { fr: "Switch to English", en: "Cambiar a español", es: "Passer en français" }[lang];
  b.style.cssText = "margin-left:8px;font:inherit;font-size:11px;font-weight:650;color:var(--ac);background:transparent;border:1px solid var(--bd);border-radius:6px;padding:1px 6px;cursor:pointer";
  b.addEventListener("click", () => setLang({ fr: "en", en: "es", es: "fr" }[lang]));
  if (h1 === document.body) b.style.cssText += ";position:fixed;top:10px;right:12px;z-index:20;background:var(--bg);padding:4px 9px";
  h1.appendChild(b);
}
addToggle();

const D = lang === "en" ? window.__EN : lang === "es" ? window.__ES : null;
if (!D) return;
const RES = (lang === "en" ? window.__EN_RE : window.__ES_RE) || [];
const keys = Object.keys(D).filter(k => k !== D[k]);
const exact = new Map(keys.map(k => [k, D[k]]));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const longKeys = keys.filter(k => k.length >= 5 || /\s/.test(k)).sort((a, b) => b.length - a.length);   // les mots très courts ne sont traduits que seuls
const isW = c => /[\p{L}\p{N}]/u.test(c);
const RE = new RegExp(longKeys.map(k => (isW(k[0]) ? "(?<![\\p{L}\\p{N}])" : "") + esc(k) + (isW(k[k.length - 1]) ? "(?![\\p{L}\\p{N}])" : "")).join("|"), "gu");
const cache = new Map();

function tr(s) {
  if (!s || !/[A-Za-zÀ-ÿ]/.test(s)) return s;
  let r = cache.get(s); if (r !== undefined) return r;
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2], e = exact.get(core);
  if (e !== undefined) r = m[1] + e + m[3];
  else { let x = s; for (const [re, rep] of RES) x = x.replace(re, rep); r = x.replace(RE, y => D[y]); }
  if (cache.size > 5000) cache.clear();
  cache.set(s, r); return r;
}
window.__tr = tr;

const ATTRS = ["title", "placeholder", "aria-label", "alt"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE"]);
function doText(n) { const v = n.data, t = tr(v); if (t !== v) n.data = t; }
function doEl(e) {
  for (const a of ATTRS) { const v = e.getAttribute && e.getAttribute(a); if (v) { const t = tr(v); if (t !== v) e.setAttribute(a, t); } }
}
function walk(n) {
  if (n.nodeType === 3) return doText(n);
  if (n.nodeType !== 1 || SKIP.has(n.tagName) || n.hasAttribute("data-i18n-skip")) return;
  doEl(n);
  for (let c = n.firstChild; c; c = c.nextSibling) walk(c);
}

const obs = new MutationObserver(ms => {
  for (const m of ms) {
    if (m.type === "childList") m.addedNodes.forEach(walk);
    else if (m.type === "characterData") { const p = m.target.parentNode; if (!p || !(p.hasAttribute && p.hasAttribute("data-i18n-skip")) && !SKIP.has(p.tagName)) doText(m.target); }
    else doEl(m.target);
  }
});
obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

/* Boîtes de dialogue natives. */
for (const f of ["alert", "confirm", "prompt"]) {
  const o = window[f].bind(window);
  window[f] = (msg, ...r) => o(tr(String(msg)), ...r);
}

function start() { walk(document.body); document.title = tr(document.title); }
if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
document.addEventListener("DOMContentLoaded", start);
})();
