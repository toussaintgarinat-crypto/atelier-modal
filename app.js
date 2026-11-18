"use strict";const L=["C","D","E","F","G","A","B"],NAT=[0,2,4,5,7,9,11],FR={C:"Do",D:"Ré",E:"Mi",F:"Fa",G:"Sol",A:"La",B:"Si"
},mod=(e,t)=>(e%t+t)%t,ACC={"-2":"♭♭","-1":"♭",0:"",1:"♯",2:"♯♯"
},TON=[[0,0],[0,1],[1,-1],[1,0],[2,-1],[2,0],[3,0],[3,1],[4,-1],[4,0],[5,-1],[5,0],[6,-1],[6,0]].map(([e,t])=>({l:e,a:t,pc:mod(NAT[e]+t,12)
})),MAJ=[0,2,4,5,7,9,11],FAM={maj:[0,2,4,5,7,9,11],mel:[0,2,3,5,7,9,11],har:[0,2,3,5,7,8,11]},FAMN={maj:"Majeur",mel:"mineur mélodique",
har:"mineur harmonique"},ROMAN=["I","II","III","IV","V","VI","VII"],FIF={C:0,G:1,D:2,A:3,E:4,B:5,F:-1};function spell(e,t,n){
const a=mod(e.l+t,7),s=mod(e.pc+n,12);return{l:a,pc:s,a:mod(s-NAT[a]+6,12)-6}}function nmN(e){
return("fr"===S.nota?FR[L[e.l]]:L[e.l])+(ACC[e.a]??"")}function ivLabel(e,t){let n=t-MAJ[e];return n>6&&(n-=12),n<-6&&(n+=12),
(n<0?"♭".repeat(-n):n>0?"♯".repeat(n):"")+(e+1)}const CHROM_IV=["1","♭2","2","♭3","3","4","♭5","5","♭6","6","♭7","7"],MODES={lydien:{
fr:"Lydien",fam:"maj",n:4,iv:[0,2,4,6,7,9,11],ch:[6],tag:"♯4",
tip:"Pose le ♯4 sur un temps fort, puis résous sur la quinte : c’est la couleur « lumineuse »."},ionien:{fr:"Ionien",fam:"maj",n:1,
iv:[0,2,4,5,7,9,11],ch:[],tag:"référence majeure",tip:"Appuie-toi sur la tierce et la septième majeures ; évite de t’attarder sur la 4te."},
mixolydien:{fr:"Mixolydien",fam:"maj",n:5,iv:[0,2,4,5,7,9,10],ch:[10],tag:"♭7",
tip:"Fais sonner la ♭7 puis retombe sur la tierce : le son dominant par excellence."},dorien:{fr:"Dorien",fam:"maj",n:2,iv:[0,2,3,5,7,9,10],
ch:[9],tag:"6 naturelle (vs éolien)",tip:"Vise la 6te naturelle sur un temps fort : elle distingue le dorien de l’éolien."},eolien:{
fr:"Éolien",fam:"maj",n:6,iv:[0,2,3,5,7,8,10],ch:[8],tag:"♭6",
tip:"Mineur naturel : insiste sur ♭3 et ♭6, résous sur la quinte ou la tonique."},phrygien:{fr:"Phrygien",fam:"maj",n:3,iv:[0,1,3,5,7,8,10],
ch:[1],tag:"♭2",tip:"Joue le ♭2 contre la tonique, puis résous vers la tonique : couleur flamenco."},locrien:{fr:"Locrien",fam:"maj",n:7,
iv:[0,1,3,5,6,8,10],ch:[1,6],tag:"♭2 · ♭5",tip:"Cible la ♭5 puis la tierce mineure ; sur m7♭5, évite de rester sur la tonique."},melmin:{
fr:"Mineur mélodique",fam:"mel",n:1,iv:[0,2,3,5,7,9,11],ch:[3,11],tag:"♭3 · 7 majeure",
tip:"Tierce mineure et septième majeure : tension élégante sur un accord mineur."},dorienb2:{fr:"Dorien ♭2",fam:"mel",n:2,
iv:[0,1,3,5,7,9,10],ch:[1,9],tag:"♭2 · 6 nat.",tip:"Un dorien avec une 2de mineure : joue le ♭2 en broderie vers la tonique."},lydaug:{
fr:"Lydien augmenté",fam:"mel",n:3,iv:[0,2,4,6,8,9,11],ch:[6,8],tag:"♯4 · ♯5",tip:"Sur un maj7 : vise ♯4 et ♯5 pour un son suspendu."},
lyddom:{fr:"Lydien dominant",fam:"mel",n:4,iv:[0,2,4,6,7,9,10],ch:[6,10],tag:"♯4 · ♭7",
tip:"Un dominant « sans résolution » : le ♯4 donne de la lumière, la ♭7 la tension."},mixob6:{fr:"Mixolydien ♭6",fam:"mel",n:5,
iv:[0,2,4,5,7,8,10],ch:[8,10],tag:"♭6 · ♭7",tip:"Dominant vers un accord mineur : la ♭6 annonce la tonique mineure."},locnat2:{
fr:"Locrien ♮2",fam:"mel",n:6,iv:[0,2,3,5,6,8,10],ch:[2,6],tag:"2 nat. · ♭5",
tip:"Sur m7♭5 : le 2 naturel adoucit le locrien, vise ♭5 et ♭3."},altere:{fr:"Altéré (Super-locrien)",fam:"mel",n:7,iv:[0,1,3,4,6,8,10],
ch:[1,3,6,8],tag:"♭9 · ♯9 · ♭5 · ♭13",tip:"Sur V7, juste avant la résolution : enchaîne ♭9 → ♯9 → tierce, puis résous."},harmin:{
fr:"Mineur harmonique",fam:"har",n:1,iv:[0,2,3,5,7,8,11],ch:[8,11],tag:"♭6 · 7 majeure",
tip:"La sensible (7te majeure) tire vers la tonique ; la ♭6 crée l’intervalle exotique ♭6→7."},phrydom:{fr:"Phrygien dominant",fam:"har",
n:5,iv:[0,1,4,5,7,8,10],ch:[1,4,8],tag:"♭2 · 3 majeure · ♭6",tip:"Couleur andalouse : ♭2 → tierce majeure, puis résolution sur la tonique."
},blues:{fr:"Blues",fam:"x",iv:[0,3,5,6,7,10],dg:[0,2,3,4,4,6],ch:[6],tag:"note bleue ♭5",
tip:"Glisse vers la note bleue (♭5) et tourne autour de la tierce."}
},BRIGHT=["lydien","ionien","mixolydien","dorien","eolien","phrygien","locrien"],ADV=["melmin","harmin","phrydom","lyddom","altere","locnat2","lydaug","dorienb2"],FAMMODES={
maj:["ionien","dorien","phrygien","lydien","mixolydien","eolien","locrien"],
mel:["melmin","dorienb2","lydaug","lyddom","mixob6","locnat2","altere"]};function notesOf(e,t){const n=MODES[t],a=n.dg||[0,1,2,3,4,5,6]
;return n.iv.map((t,s)=>{const i=spell(e,a[s],t);return i.d=a[s],i.s=t,i.role=0===t?"root":n.ch.includes(t)?"char":"sc",i})}
function parentOf(e,t){const n=MODES[t];if(!n.n)return null;const a=FAM[n.fam][n.n-1],s=mod(e.pc-a,12),i=mod(e.l-(n.n-1),7);return{l:i,pc:s,
a:mod(s-NAT[i]+6,12)-6}}function fifths(e){return FIF[L[e.l]]+7*e.a}function keySig(e){const t={}
;return e>0?["F","C","G","D","A","E","B"].slice(0,Math.min(e,7)).forEach(e=>t[e]=1):e<0&&["B","E","A","D","G","C","F"].slice(0,Math.min(-e,7)).forEach(e=>t[e]=-1),
t}const CH={maj:[0,4,7],m:[0,3,7],7:[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],m7b5:[0,3,6,10],dim:[0,3,6],6:[0,4,7,9],m6:[0,3,7,9],
sus4:[0,5,7]},DEGS={6:[0,2,4,5],m6:[0,2,4,5],sus4:[0,3,4]},SUF={maj:"",m:"m",7:"7",maj7:"maj7",m7:"m7",m7b5:"m7♭5",dim:"°",6:"6",m6:"m6",
sus4:"sus4"},cName=(e,t)=>nmN(e)+SUF[t];function triadQ(e,t,n){const a=mod(t-e,12),s=mod(n-e,12)
;return 4===a&&7===s?"maj":3===a&&7===s?"m":3===a&&6===s?"dim":4===a&&8===s?"aug":"?"}function seventhQ(e,t,n,a){return{"4,7,11":"maj7",
"3,7,10":"m7","4,7,10":"7","3,6,10":"m7♭5","3,7,11":"mMaj7","3,6,9":"dim7","4,8,11":"maj7♯5"
}[[mod(t-e,12),mod(n-e,12),mod(a-e,12)].join()]||"?"}
const bestTon=e=>TON.filter(t=>t.pc===e).sort((e,t)=>Math.abs(fifths(e))-Math.abs(fifths(t)))[0],S={tonic:TON[0],mode:"mixolydien",
inst:"piano",nota:"fr",modeFam:"maj",tab:"modes",grid:"blues-maj",bar:0,level:2,bpm:90,sig:"4/4",playing:!1,oct:2,staff:!1,clef:"sol",
caged:0,strum:"plaque",inv:0,keyMode:"maj",dict:TON[0],pulse:0,first:!0},c_=(e,t,n,a)=>({r:e,d:t,s:n,q:a
}),I7=c_("I7",0,0,"7"),IV7=c_("IV7",3,5,"7"),V7=c_("V7",4,7,"7"),i7=c_("i7",0,0,"m7"),iv7=c_("iv7",3,5,"m7"),GRIDS=[{id:"blues-maj",
name:"Blues 12 mesures (majeur)",mode:"maj",chords:[I7,I7,I7,I7,IV7,IV7,I7,I7,V7,IV7,I7,V7]},{id:"blues-min",
name:"Blues 12 mesures (mineur)",mode:"min",chords:[i7,i7,i7,i7,iv7,iv7,i7,i7,c_("♭VI7",5,8,"7"),V7,i7,V7]},{id:"251",name:"Jazz : II-V-I",
mode:"maj",chords:[c_("ii7",1,2,"m7"),V7,c_("Imaj7",0,0,"maj7"),c_("Imaj7",0,0,"maj7")]},{id:"251m",name:"Jazz : II-V-i (mineur)",
mode:"min",chords:[c_("iiø7",1,2,"m7b5"),V7,c_("i7",0,0,"m7"),c_("i7",0,0,"m7")]},{id:"anatole",name:"Soul / Anatole : I-vi-ii-V",
mode:"maj",chords:[c_("Imaj7",0,0,"maj7"),c_("vi7",5,9,"m7"),c_("ii7",1,2,"m7"),V7]},{id:"pop",name:"Pop/Rock : I-V-vi-IV",mode:"maj",
chords:[c_("I",0,0,"maj"),c_("V",4,7,"maj"),c_("vi",5,9,"m"),c_("IV",3,5,"maj")]},{id:"dor",name:"Vamp dorien : i-IV",mode:"min",
chords:[i7,c_("IV7",3,5,"7")]},{id:"lyd",name:"Vamp lydien : I-II",mode:"maj",chords:[c_("Imaj7",0,0,"maj7"),c_("II7",1,2,"7")]},{id:"and",
name:"Cadence andalouse : i-♭VII-♭VI-V",mode:"min",chords:[c_("i",0,0,"m"),c_("♭VII",6,10,"maj"),c_("♭VI",5,8,"maj"),c_("V",4,7,"maj")]
}],curGrid=()=>GRIDS.find(e=>e.id===S.grid);function pick(e,t){const n="min"===t.mode,a=e.s,s={6:"maj",m6:"m",sus4:"maj"
}[e.q]||e.q,i=t.id,o=i.startsWith("blues");let r,l;return"7"===s||"maj"===s&&7===a?7===a?(r=n?"phrydom":"mixolydien",
l="altere"):"lyd"===i?(r="lyddom",l="altere"):8===a?(r="lyddom",l="mixolydien"):(r="mixolydien",
l="lyddom"):"maj7"===s||"maj"===s?(0===a?(r="ionien",l="lydaug"):5===a||8===a?(r="lydien",l="lydaug"):10===a?(r="mixolydien",
l="lyddom"):(r="ionien",
l="lydien"),"lyd"===i&&0===a&&(r="lydien",l="lydaug")):"m"===s||"m7"===s?0===a&&n?(r="dor"===i||o?"dorien":"and"===i?"phrygien":"eolien",
l="and"===i?"harmin":"melmin"):2===a?(r="dorien",l="dorienb2"):9===a?(r="eolien",l="dorien"):4===a?(r="phrygien",
l="dorienb2"):5===a?(r="dorien",l="dorienb2"):(r="dorien",l="melmin"):(r="locrien",l="locnat2"),[r,l]}function chordNotes(e,t){
const n=CH[t],a=DEGS[t]||[0,2,4,6];return n.map((t,n)=>spell(e,a[n],t))}function advise(e,t){
const n=spell(S.tonic,e.d,e.s),a=t.id.startsWith("blues"),[s,i]=pick(e,t),o=chordNotes(n,e.q),r=cName(n,e.q),l=[];a?l.push({key:"blues",
root:S.tonic}):l.push({key:"maj"===t.mode?"ionien":"eolien",root:S.tonic}),l.push({key:s,root:n}),l.push({key:i,root:n})
;const c=["L’approche sûre","La couleur modale","L’approche avancée"],m=["Diatonique / pentatonique","Emprunt parallèle ciblé","Tension & substitution"]
;return l.forEach((e,n)=>{const s=MODES[e.key],i=notesOf(e.root,e.key),l=parentOf(e.root,e.key);e.i=n+1,e.title=c[n],e.sub=m[n],
e.name=nmN(e.root)+" "+s.fr,
e.parent=l?`${nmN(l)} ${FAMN[s.fam]}${s.n>1?` — ${ROMAN[s.n-1]}e degré`:""}`:`gamme de ${nmN(e.root)} (6 notes)`,e.charTxt=s.tag,
e.charNotes=i.filter(e=>s.ch.includes(e.s)).map(nmN).join(" · "),
e.tip=0===n?a?`Reste sur la gamme blues de ${nmN(S.tonic)} (pentatonique mineure + note bleue) sur toute la grille ; cible la tierce de chaque accord (${nmN(o[1])}) sur les temps forts.`:`Reste dans ${e.name} (${"maj"===t.mode?"ou la pentatonique majeure":"ou la pentatonique mineure"} de ${nmN(S.tonic)}) sur toute la grille ; sur ${r}, vise ${nmN(o[1])} (tierce) et ${nmN(o[0])} (fondamentale) sur les temps 1 et 3.`:`${s.tip} Sur ${r}, pose ${e.charNotes||nmN(o[1])} sur le temps 1 ou 3, puis résous sur ${nmN(o[1])} (tierce) ou ${nmN(o[o.length-1])}.`
}),{root:n,cname:r,chordNotes:o,levels:l}}function viewFrom(e,t,n){const a=MODES[e],s=notesOf(t,e);let i=null,o=t,r="",l=null,c=[0,2,4,6]
;if(n)i=CH[n.q],o=n.root,r=n.name,l=n.q,c=DEGS[n.q]||c;else if(7===a.iv.length){i=[a.iv[0],a.iv[2],a.iv[4],a.iv[6]]
;const e=seventhQ(...i.map(e=>mod(t.pc+e,12)));r=nmN(t)+({maj7:"maj7",m7:"m7",7:"7","m7♭5":"m7♭5"}[e]||e),l={maj7:"maj7",m7:"m7",7:"7",
"m7♭5":"m7b5"}[e]||null}return{title:nmN(t)+" "+a.fr,key:e,root:t,notes:s,ints:i,croot:o,cname:r,tag:a.tag,q:l,dg:c}}
const SHARP=[[0,0],[0,1],[1,0],[1,1],[2,0],[3,0],[3,1],[4,0],[4,1],[5,0],[5,1],[6,0]],FLAT=[[0,0],[1,-1],[1,0],[2,-1],[2,0],[3,0],[4,-1],[4,0],[5,-1],[5,0],[6,-1],[6,0]]
;function chromView(){const e=[];for(let t=0;t<12;t++){const n=SHARP[t],a=FLAT[t],s={l:n[0],a:n[1],pc:t,s:mod(t-S.tonic.pc,12),
role:t===S.tonic.pc?"root":"sc",d:0};n[0]===a[0]&&n[1]===a[1]||(s.alt={l:a[0],a:a[1],pc:t}),e.push(s)}return{
title:"Chromatique — exploration libre",key:"chrom",root:S.tonic,notes:e,ints:null,croot:S.tonic,cname:"",chrom:!0}}function curView(){
if("song"===S.tab){const e=selChord();if(!e)return viewFrom("maj"===S.song.mode?"ionien":"eolien",S.tonic,null)
;const t=spell(S.tonic,e.d,e.s),n=advise(e,{id:"song",mode:S.song.mode}),a=n.levels[S.level-1];return viewFrom(a.key,a.root,{q:e.q,root:t,
name:n.cname})}if("grid"===S.tab){const e=curGrid(),t=e.chords[S.bar],n=advise(t,e),a=n.levels[S.level-1];return viewFrom(a.key,a.root,{
q:t.q,root:n.root,name:n.cname})}
return"harm"===S.tab?viewFrom("maj"===S.keyMode?"ionien":"eolien",S.tonic,null):"chrom"===S.mode?chromView():viewFrom(S.mode,MODES[S.mode].dg||"blues"===S.mode?S.tonic:modeRoot(),null)
}function lab(e){return"int"===S.nota?void 0!==e.alt||void 0===e.d?CHROM_IV[e.s]:ivLabel(e.d,e.s):e.alt?nmN(e)+"/"+nmN(e.alt):nmN(e)}
function viewPcMap(e){const t={};return e.notes.forEach(e=>{t[e.pc]=e}),t}function voicing(e,t,n){if(!e.ints)return[]
;let a=48+e.croot.pc,s=e.ints.map(e=>a+e);const i=(void 0===n?S.inv:n)%s.length;for(let e=0;e<i;e++)s.push(s.shift()+12)
;for(s.sort((e,t)=>e-t);s[s.length-1]>=t;)s=s.map(e=>e-12);return s}let AC=null;function ac(){if(!AC)try{
AC=new(window.AudioContext||window.webkitAudioContext)}catch(e){}if(AC&&"suspended"===AC.state)try{AC.resume()}catch(e){}return AC}
function tone(e,t,n,a,s){const i=ac();if(i)try{const o=i.createOscillator(),r=i.createGain();o.type=s||"triangle",
o.frequency.value=440*Math.pow(2,(e-69)/12),o.connect(r),r.connect(i.destination);const l=t??i.currentTime;r.gain.setValueAtTime(1e-4,l),
r.gain.linearRampToValueAtTime(a??.16,l+.015),r.gain.exponentialRampToValueAtTime(1e-4,l+n),o.start(l),o.stop(l+n+.05)}catch(e){}}
function playChordMidis(e,t){const n=ac();if(!n)return;const a=n.currentTime
;e.forEach((e,n)=>tone(e,a+("arpege"===S.strum?.11*n:.005*n),t||1.2,.13))}function playScale(e){const t=ac();if(!t)return
;let n=t.currentTime+.02;const a=e.root.pc;let s=60+(a>6?a-12:a);const i=[s];let o=e.notes[0].pc;e.notes.slice(1).forEach(e=>{
let t=mod(e.pc-o,12);0===t&&(t=12),s+=t,o=e.pc,i.push(s)}),i.push(i[0]+12),i.forEach((e,t)=>tone(e,n+.28*t,.5,.15))}const SIGS={"4/4":{n:4,
pm:1},"3/4":{n:3,pm:1},"6/8":{n:6,pm:.5}},pulseMs=()=>6e4/S.bpm*SIGS[S.sig].pm;function chordMidisFor(e,t){
const n=48+t.pc-(t.pc>6?12:0),a=CH[e.q].map(e=>n+12+e);return a.unshift(n-12+(t.pc>6?12:0)),a}function onBar(){highlightBars(),
renderAdvisor(),renderInstruments();const e=curGrid().chords[S.bar]
;playChordMidis(chordMidisFor(e,spell(S.tonic,e.d,e.s)),pulseMs()*SIGS[S.sig].n/1e3*.95)}function tick(){const e=curGrid(),t=SIGS[S.sig]
;0===S.pulse&&(S.first?S.first=!1:S.bar=(S.bar+1)%e.chords.length,onBar());const n=0===S.pulse,a="6/8"===S.sig&&3===S.pulse
;tone(n?96:a?92:88,void 0,.05,n?.05:.03,"square"),S.pulse=(S.pulse+1)%t.n}function startPlay(){"function"==typeof stopSong&&stopSong(),ac(),
S.playing=!0,S.pulse=0,S.first=!0,tick(),S.timer=setInterval(tick,pulseMs()),updateTransport()}function stopPlay(){S.playing=!1,
clearInterval(S.timer),updateTransport()}function restartTimer(){S.playing&&(clearInterval(S.timer),S.timer=setInterval(tick,pulseMs()))}
function updateTransport(){const e=document.getElementById("playbtn");e&&(e.textContent=S.playing?"■ Stop":"▶ Lire la grille")}
function highlightBars(){document.querySelectorAll(".bar").forEach((e,t)=>{e.classList.toggle("sel",t===S.bar),
e.classList.toggle("now",S.playing&&t===S.bar)})}function renderTop(){
const e=(e,t,n)=>`<div class="seg">${n.map(([n,a])=>`<button class="${t===n?"on":""}" data-act="${e}" data-v="${n}">${a}</button>`).join("")}</div>`
;document.getElementById("top").innerHTML=`<div class="row">${e("inst",S.inst,[["piano","Piano"],["guitar","Guitare"],["duo","Duo"]])}${e("nota",S.nota,[["fr","Do Ré Mi"],["en","C D E"],["int","Degrés"]])}</div>\n  <div class="chips">${TON.map((e,t)=>`<button class="chip ${e.l===S.tonic.l&&e.a===S.tonic.a?"on":""}" data-act="tonic" data-v="${t}">${nmN(e)}</button>`).join("")}</div>`,
document.getElementById("tabs").innerHTML=[["modes","Modes"],["harm","Harmonie"],["grid","Grilles"],["song","Morceaux"]].map(([e,t])=>`<button class="${S.tab===e?"on":""}" data-act="tab" data-v="${e}">${t}</button>`).join("")
}function stepsStrip(e){if(e.chrom||e.notes.length<5)return"";const t=e.notes;let n="";for(let e=0;e<t.length;e++){
const a=t[(e+1)%t.length],s=mod(a.pc-t[e].pc,12)||12,i=1===s?"½":2===s?"1":3===s?"1½":s/2+""
;n+=`<div><div class="n">${lab(t[e])}</div><div class="g ${1===s?"h":""}">${i}t</div></div>`}
return`<div class="steps">${n}<div><div class="n">${lab(t[0])}</div></div></div>`}function relativeCard(){const e=MODES[S.mode]
;if(!e||!e.n)return"";const t=modeRoot(),n=parentOf(t,S.mode),a=notesOf(n,"maj"===e.fam?"ionien":"mel"===e.fam?"melmin":"harmin")
;let s=`<div class="card"><h2>Tons voisins — gamme parente</h2>\n  <p style="margin:0 0 8px"><b>${nmN(t)} ${e.fr}</b> = ${e.n}${1===e.n?"er":"e"} degré de <b>${nmN(n)} ${FAMN[e.fam]}</b> <span class="muted">(même armure)</span></p>\n  <div class="nts">${a.map(e=>`<i>${lab(e)}</i>`).join("")}</div>`
;const i=FAMMODES[e.fam];return i&&(s+=`<h3>Où jouer chaque mode dans ${nmN(n)} ${FAMN[e.fam]}</h3><div class="deg">${i.map((t,n)=>{
const s=a[n],i=7===a.length?seventhQ(...[0,2,4,6].map(e=>a[(n+e)%7].pc)):""
;return`<div class="${n===e.n-1?"cur":""}"><b>${ROMAN[n]}</b>${nmN(s)}<br><span class="muted">${i}</span><br>${MODES[t].fr.replace(" augmenté"," aug.").replace("Mineur mélodique","Mél.").replace("Mixolydien ♭6","Mixo ♭6").replace("Lydien dominant","Lyd. dom.").replace("Locrien ♮2","Loc. ♮2").replace("Altéré (Super-locrien)","Altéré").replace("Dorien ♭2","Dor. ♭2")}</div>`
}).join("")}</div>`),
s+=`<details><summary>Comprendre pourquoi</summary><p>Deux gammes qui partagent les mêmes notes (donc la même armure) sont « parentes ». On peut jouer ${nmN(t)} ${e.fr} avec les doigtés de ${nmN(n)} ${FAMN[e.fam]} : seul le point de repos change, la tonique devient ${nmN(t)}.</p></details></div>`,
s}const MINMODES=["dorien","eolien","phrygien","locrien"],modeRoot=()=>MINMODES.includes(S.mode)&&!S.par?spell(S.tonic,5,9):S.tonic
;function renderModes(){const e=spell(S.tonic,5,9),t=(t,n)=>{
const a=MODES[t],s=BRIGHT.indexOf(t),i=MINMODES.includes(t)&&!n?e:S.tonic,o=notesOf(i,t),r=parentOf(i,t)
;return`<button class="mrow cmp ${S.mode!==t||MINMODES.includes(t)&&!!S.par!=!!n?"":"on"}" data-act="mode" data-v="${t}" data-par="${n?1:0}"><div class="top"><span class="lum" style="${s>=0?`background:hsl(${52-7*s},${90-9*s}%,${70-8*s}%)`:"background:#7aa2ff"}"></span><b>${nmN(i)} ${a.fr}</b></div>\n    <div class="tag2">${a.tag}</div>\n    <div class="nts">${o.map(e=>`<span class="nt"><i class="${"root"===e.role?"r":"char"===e.role?"hl":""}">${lab(e)}</i><small class="${"char"===e.role?"hs":""}">${ivLabel(e.d,e.s)}</small></span>`).join("")}</div>\n    <div class="muted" style="margin-top:5px;font-size:11.5px">Issu de <b>${nmN(r)} Majeur</b> · ${ROMAN[a.n-1]}${1===a.n?"er":"e"} degré</div></button>`
},n=curView()
;document.getElementById("panel").innerHTML=`\n  <div class="card"><h2>Changer la couleur sur place <span class="muted">· du plus clair au plus sombre</span></h2>\n   <div class="two">\n    <div><h3 style="margin-top:0">Majeurs · ${nmN(S.tonic)}</h3>${["lydien","ionien","mixolydien"].map(e=>t(e,!1)).join("")}</div>\n    <div><h3 style="margin-top:0">Mineurs · ${nmN(e)} <span style="font-weight:400">(relative)</span></h3>${MINMODES.map(e=>t(e,!1)).join("")}</div>\n   </div>\n   <details style="margin-top:6px"><summary>Modes mineurs de ${nmN(S.tonic)} (parallèles, même tonique)</summary>\n    <div class="two" style="margin-top:8px">${MINMODES.map(e=>t(e,!0)).join("")}</div></details>\n   <h3>Gammes avancées (mineur mélodique / harmonique)</h3>\n   <div class="chips">${ADV.map(e=>`<button class="chip sm ${S.mode===e?"on2":""}" data-act="mode" data-v="${e}">${MODES[e].fr.replace(" (Super-locrien)","")}</button>`).join("")}</div>\n   <h3>Exploration libre</h3>\n   <div class="chips"><button class="chip sm ${"chrom"===S.mode?"on2":""}" data-act="mode" data-v="chrom">Chromatique (12 demi-tons)</button><button class="chip sm ${"blues"===S.mode?"on2":""}" data-act="mode" data-v="blues">Gamme blues</button></div>\n   <details><summary>Comprendre pourquoi</summary><p>Chaque mode est une gamme avec une seule altération caractéristique par rapport à son voisin : en descendant l’échelle, on baisse une note à chaque fois (♯4 → ♭7 → ♭3 → ♭6 → ♭2 → ♭5). Plus on baisse de notes, plus la couleur est sombre.</p></details></div>\n  ${"chrom"===S.mode?"":relativeCard()}\n  <div class="card"><h2>Intervalles de ${n.title}</h2><div class="muted">Distance entre degrés (t = ton, ½t = demi-ton)</div>${stepsStrip(n)}\n   <details><summary>Comprendre pourquoi</summary><p>Mi→Fa et Si→Do sont les deux demi-tons « naturels » du clavier. Toutes les gammes sont des cycles de tons et de demi-tons : c’est leur ordre qui change la couleur.</p></details></div>`
}function sector(e,t,n,a,s,i){const o=(n,a)=>[(e+n*Math.sin(a)).toFixed(1),(t-n*Math.cos(a)).toFixed(1)]
;return`M${o(a,s)} A${a} ${a} 0 0 1 ${o(a,i)} L${o(n,i)} A${n} ${n} 0 0 0 ${o(n,s)} Z`}function fifthsToNote(e){
const t=L.indexOf(["F","C","G","D","A","E","B"][mod(e+1,7)]),n=Math.floor((e+1)/7);return{l:t,a:n,pc:mod(NAT[t]+n,12)}}
const CIRCLE=[...Array(12)].map((e,t)=>{const n=t<=6?-t:12-t;return{f:n,...fifthsToNote(n)}});function staffSvg(e){
let t='<svg viewBox="0 0 150 70" width="150">'
;for(let e=0;e<5;e++)t+=`<line x1="4" x2="146" y1="${16+9*e}" y2="${16+9*e}" stroke="#8b98a5" stroke-width="1"/>`
;t+='<text x="6" y="46" font-size="40" fill="#e8eef4" font-family="\'Noto Music\',\'Segoe UI Symbol\',serif">𝄞</text>'
;const n=e>0?[38,35,39,36,33,37,34].slice(0,Math.min(e,7)):[34,37,33,36,32,35,31].slice(0,Math.min(-e,7)),a=e>0?"♯":"♭"
;return n.forEach((e,n)=>{t+=`<text x="${38+13*n}" y="${52-4.5*(e-30)+5}" font-size="17" fill="#f5b13d" text-anchor="middle">${a}</text>`}),
t+"</svg>"}function circleSvg(){const e=CIRCLE.findIndex(e=>e.pc===S.tonic.pc)
;let t='<svg viewBox="0 0 320 320" width="100%" style="max-width:380px;margin:auto">';return CIRCLE.forEach((n,a)=>{
const s=(a-.5)*Math.PI/6,i=(a+.5)*Math.PI/6,o=a*Math.PI/6,r=a===e?"I":a===mod(e-1,12)?"IV":a===mod(e+1,12)?"V":"",l="I"===r?"#f5b13d":"IV"===r||"V"===r?"#2f7d5c":"#202b37",c=a===e?"vi":a===mod(e-1,12)?"ii":a===mod(e+1,12)?"iii":"",m=c?"#33478f":"#18202a",d=spell(n,5,9),u=e=>160+e*Math.sin(o),p=e=>160-e*Math.cos(o),v=6===a?nmN(n)+"/"+nmN(fifthsToNote(6)):nmN(n)
;t+=`<path d="${sector(160,160,100,150,s,i)}" fill="${l}" stroke="#0f1419" stroke-width="1.5" data-act="circle" data-v="${a}" style="cursor:pointer"/>\n    <path d="${sector(160,160,62,100,s,i)}" fill="${m}" stroke="#0f1419" stroke-width="1.5" data-act="circle" data-v="${a}" style="cursor:pointer"/>\n    <text x="${u(127)}" y="${p(127)+4}" font-size="${6===a?10:13}" font-weight="700" text-anchor="middle" fill="${"I"===r?"#1b1305":"#e8eef4"}" pointer-events="none">${v}</text>\n    <text x="${u(81)}" y="${p(81)+4}" font-size="11" text-anchor="middle" fill="#cdd8ff" pointer-events="none">${nmN(d)}m</text>`,
r&&(t+=`<text x="${u(143)}" y="${p(143)+3}" font-size="8" text-anchor="middle" fill="#fff" pointer-events="none">${r}</text>`),
c&&(t+=`<text x="${u(68)}" y="${p(68)+3}" font-size="8" text-anchor="middle" fill="#fff" pointer-events="none">${c}</text>`)}),
t+'<circle cx="160" cy="160" r="60" fill="#0f1419"/></svg>'}function qSym(e){return"maj"===e?"":"m"===e?"m":"dim"===e?"°":"aug"===e?"+":"?"}
function diatonic(e,t){const n=notesOf(e,t?"eolien":"ionien");return n.map((e,t)=>({n:e,q:triadQ(e.pc,n[(t+2)%7].pc,n[(t+4)%7].pc)}))}
function renderHarm(){
const e=S.tonic,t="min"===S.keyMode,n=fifths(e),a=t?["i","ii°","III","iv","v","VI","VII"]:["I","ii","iii","IV","V","vi","vii°"],s=CIRCLE.map(n=>{
const a=t?spell(n,5,9):n,s=diatonic(a,t)
;return`<tr class="${a.pc===e.pc?"cur":""}"><th data-act="keyrow" data-v="${a.l},${a.a}" style="cursor:pointer">${nmN(a)}${t?"m":""}</th>${s.map((e,t)=>`<td class="${((e,t)=>0===e?"q-t":"m"===t?"q-min":"dim"===t?"q-dim":"q-maj")(t,e.q)}">${nmN(e.n)}${qSym(e.q)}</td>`).join("")}</tr>`
}).join(""),i=keySig(n),o=Math.abs(n)>7?"armure théorique (&gt; 7 altérations)":0===n?"aucune altération":`${Math.abs(n)} ${n>0?"dièse":"bémol"}${Math.abs(n)>1?"s":""} : ${Object.keys(i).map(e=>("fr"===S.nota?FR[e]:e)+(n>0?"♯":"♭")).join(" ")}`,r=CIRCLE.findIndex(t=>t.pc===e.pc),l=diatonic(e,!1),c=e=>nmN(CIRCLE[mod(e,12)])
;document.getElementById("panel").innerHTML=`\n  <div class="card"><h2>Cycle des quartes</h2>${circleSvg()}\n   <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:6px">${Math.abs(n)<=7?staffSvg(n):""}\n   <div style="font-size:13.5px"><b>${nmN(e)} majeur</b> — ${o}<br>Relative mineure : <b>${nmN(spell(e,5,9))}m</b><br>\n   IV : ${c(r-1)} · I : <b>${nmN(e)}</b> · V : ${c(r+1)}<br><span class="muted">ii : ${nmN(l[1].n)}m · iii : ${nmN(l[2].n)}m · vi : ${nmN(l[5].n)}m</span></div></div>\n   <details><summary>Comprendre pourquoi</summary><p>Chaque case à droite du cycle ajoute un dièse, chaque case à gauche un bémol. Les trois tonalités voisines (IV, I, V) partagent six notes sur sept : on y module facilement, et leurs relatifs mineurs donnent les accords ii, iii et vi.</p></details></div>\n  <div class="card"><h2>Accords par tonalité</h2>\n   <div class="tr" style="margin-bottom:8px"><div class="seg"><button class="${t?"":"on"}" data-act="keymode" data-v="maj">Majeures</button><button class="${t?"on":""}" data-act="keymode" data-v="min">Mineures (naturel)</button></div></div>\n   <div class="scroll"><table><tr><th>Ton</th>${a.map(e=>`<th>${e}</th>`).join("")}</tr>${s}</table></div>\n   <div class="legend" style="margin-top:8px"><span><i style="background:#f5b13d"></i>Tonique</span><span><i style="background:#6a8cff"></i>Mineur</span><span><i style="background:#3fb37f"></i>Majeur / dominante</span><span><i style="background:#e5675f"></i>Diminué</span></div>\n   <details><summary>Comprendre pourquoi</summary><p>On empile des tierces sur chaque degré en restant dans la gamme : le résultat (majeur, mineur ou diminué) dépend des demi-tons entre les notes empilées, pas du hasard.</p></details></div>`
}function renderGrid(){const e=curGrid()
;document.getElementById("panel").innerHTML=`\n  <div class="card"><h2>Grille</h2>\n   <select data-act="gridsel" style="width:100%;margin-bottom:8px">${GRIDS.map(e=>`<option value="${e.id}" ${e.id===S.grid?"selected":""}>${e.name}</option>`).join("")}</select>\n   <div class="tr"><button class="btn" id="playbtn" data-act="play">${S.playing?"■ Stop":"▶ Lire la grille"}</button>\n    <div class="seg"><button class="" data-act="transpose" data-v="-1">− ½t</button><button data-act="transpose" data-v="1">+ ½t</button></div>\n    <div class="seg">${Object.keys(SIGS).map(e=>`<button class="${S.sig===e?"on":""}" data-act="sig" data-v="${e}">${e}</button>`).join("")}</div></div>\n   <div class="tr" style="margin-top:8px"><span class="muted">Tempo</span><input type="range" min="50" max="180" value="${S.bpm}" data-act="bpm"><b id="bpmv">${S.bpm}</b><span class="muted">BPM</span></div>\n   <div class="bars">${e.chords.map((e,t)=>{
const n=spell(S.tonic,e.d,e.s)
;return`<button class="bar" data-act="bar" data-v="${t}"><small>${t+1} · ${e.r}</small><b>${cName(n,e.q)}</b></button>`
}).join("")}</div>\n   <details><summary>Comprendre pourquoi</summary><p>Chaque case est une mesure. Touche un accord (ou lance la lecture) : les conseils ci-dessous suivent l’accord en cours, et les instruments montrent la gamme à jouer dessus.</p></details></div>\n  <div id="adv"></div>`,
renderAdvisor(),highlightBars()}function renderAdvisor(){const e=document.getElementById("adv");if(!e)return
;const t=curGrid(),n=t.chords[S.bar],a=advise(n,t)
;e.innerHTML=`<div class="card"><h2>Sur <span style="color:var(--root)">${a.cname}</span> <span class="muted">· mesure ${S.bar+1} · ${n.r} · notes : ${a.chordNotes.map(nmN).join(" ")}</span></h2>\n  ${a.levels.map(e=>`<div class="lvl l${e.i} ${S.level===e.i?"on":""}"><div class="hd"><span class="bd">Niveau ${e.i} · ${e.sub}</span></div>\n   <b class="t">${e.name}</b><p><span class="k">Gamme parente :</span> ${e.parent}</p><p><span class="k">Intervalle caractéristique :</span> ${e.charTxt}${e.charNotes?` → <b>${e.charNotes}</b>`:""}</p><p>${e.tip}</p>\n   <div class="tr"><button class="btn sm ${S.level===e.i?"":"sec"}" data-act="level" data-v="${e.i}">${S.level===e.i?"Affiché sur l’instrument":"Voir sur l’instrument"}</button><button class="btn sm sec" data-act="listen" data-v="${e.i}">♪ Écouter</button></div></div>`).join("")}</div>`
}const RC={root:"#f5b13d",char:"#f0629b",sc:"#46586b"};function pill(e,t,n,a,s,i,o){const r=RC[a.role],l="root"===a.role?"#1b1305":"#fff"
;let c
;return c=a.alt&&"int"!==S.nota?`<text x="${e}" y="${t-1}" font-size="${o-1.5}" text-anchor="middle" fill="${l}">${nmN(a)}</text><text x="${e}" y="${t+o-1}" font-size="${o-1.5}" text-anchor="middle" fill="#cfe0ff">${nmN(a.alt)}</text>`:`<text x="${e}" y="${t+o/3}" font-size="${o}" font-weight="700" text-anchor="middle" fill="${l}">${lab({
...a,alt:void 0
})}</text>`,`<g data-act="note" data-v="${i}" style="cursor:pointer"><circle cx="${e}" cy="${t}" r="${n}" fill="${r}" ${s?'stroke="#2dd4bf" stroke-width="3"':'stroke="#0f1419" stroke-width="1"'}/>${c}</g>`
}function pianoSvg(e){
const t=S.oct,n=560*t/2,a=n/(7*t),s=48+12*t,i=viewPcMap(e),o=new Set(e.ints?e.ints.map(t=>mod(e.croot.pc+t,12)):[]),r=new Set(voicing(e,s))
;let l=`<svg viewBox="0 0 ${n} 150" width="100%">`;const c=[],m=[];for(let e=0;e<t;e++)[0,2,4,5,7,9,11].forEach((t,n)=>c.push({m:48+12*e+t,
x:(7*e+n)*a})),[[1,1],[3,2],[6,4],[8,5],[10,6]].forEach(([t,n])=>m.push({m:48+12*e+t,x:(7*e+n)*a}));c.forEach(e=>{
l+=`<rect x="${e.x+.5}" y="0" width="${a-1}" height="150" rx="3" fill="${r.has(e.m)?"#8fe5da":"#e9eef3"}" stroke="#1c2530" data-act="note" data-v="${e.m}" style="cursor:pointer"/>`
}),m.forEach(e=>{
l+=`<rect x="${e.x-.3*a}" y="0" width="${.6*a}" height="93" rx="3" fill="${r.has(e.m)?"#0d8a7d":"#141b23"}" stroke="#000" data-act="note" data-v="${e.m}" style="cursor:pointer"/>`
});const d=Math.min(12,.4*a),u=3===t?8:10;return c.forEach(e=>{const t=i[mod(e.m,12)];t&&(l+=pill(e.x+a/2,133,d,t,o.has(t.pc),e.m,u))}),
m.forEach(e=>{const t=i[mod(e.m,12)];t&&(l+=pill(e.x,76,Math.min(d,.28*a+2),t,o.has(t.pc),e.m,u-1))}),l+"</svg>"}function staffNotes(e){
const t=S.clef,n="sol"===t?30:18,a="sol"===t?4:3,s=e.key&&MODES[e.key]&&"maj"===MODES[e.key].fam?parentOf(e.root,e.key):null,i=s?fifths(s):null,o=null!==i&&Math.abs(i)<=7?keySig(i):{},r=e.notes.filter(e=>!0)
;let l=a,c=-1;const m=[];if(r.forEach((e,t)=>{t>0&&e.l<c&&l++,c=e.l,m.push({n:e,step:7*l+e.l})}),!e.chrom){const t=e.notes[0];m.push({n:t,
step:7*(l+(t.l<=c?1:0))+t.l})}return{out:m,bottom:n,ks:o,f:i,hasKs:null!==i&&Math.abs(i)<=7&&Object.keys(o).length>0}}function staffSvg2(e){
if(e.chrom)return'<div class="muted">Portée indisponible en mode chromatique.</div>'
;const{out:t,bottom:n,ks:a,f:s,hasKs:i}=staffNotes(e),o=Math.max(340,70+42*t.length+(i?11*Math.abs(s):0)),r=110
;let l=`<svg viewBox="0 0 ${o} 150" width="100%" style="min-width:${Math.min(o,380)}px">`
;for(let e=0;e<5;e++)l+=`<line x1="6" x2="${o-6}" y1="${r-10*e}" y2="${r-10*e}" stroke="#8b98a5"/>`
;l+=`<text x="10" y="${"sol"===S.clef?108:92}" font-size="${"sol"===S.clef?58:44}" fill="#e8eef4" font-family="'Noto Music','Segoe UI Symbol',serif">${"sol"===S.clef?"𝄞":"𝄢"}</text>`
;let c=60;if(i){const e=s>0?[38,35,39,36,33,37,34]:[34,37,33,36,32,35,31],t="sol"===S.clef?0:14;e.slice(0,Math.abs(s)).forEach(e=>{S.clef,
S.clef,l+=`<text x="${c}" y="${r-5*(e-t-n)+6}" font-size="20" fill="#f5b13d" text-anchor="middle">${s>0?"♯":"♭"}</text>`,c+=11}),c+=10}
return t.forEach(({n:e,step:t},s)=>{const o=c+40*s,m=r-5*(t-n)
;if(t<=n-2)for(let e=n-2;e>=t-(mod(n-t,2)?1:0);e-=2)l+=`<line x1="${o-11}" x2="${o+11}" y1="${r-5*(e-n)}" y2="${r-5*(e-n)}" stroke="#8b98a5"/>`
;if(t>=n+10)for(let e=n+10;e<=t;e+=2)l+=`<line x1="${o-11}" x2="${o+11}" y1="${r-5*(e-n)}" y2="${r-5*(e-n)}" stroke="#8b98a5"/>`
;const d=i?e.a!==(a[L[e.l]]||0):0!==e.a,u=0===e.a?"♮":ACC[e.a]
;d&&(l+=`<text x="${o-15}" y="${m+6}" font-size="17" fill="#e8eef4" text-anchor="middle">${u}</text>`),
l+=`<ellipse cx="${o}" cy="${m}" rx="7" ry="5" fill="${"root"===e.role?"#f5b13d":"char"===e.role?"#f0629b":"#e8eef4"}" transform="rotate(-18 ${o} ${m})"/>`,
l+=`<text x="${o}" y="145" font-size="10" text-anchor="middle" fill="#93a1b0">${lab(e)}</text>`}),l+"</svg>"}const OPEN=[40,45,50,55,59,64]
;function guitarSvg(e){const t=viewPcMap(e),n=new Set(e.ints?e.ints.map(t=>mod(e.croot.pc+t,12)):[]),a=78,s=55
;let i='<svg viewBox="0 0 748 194" width="100%">';[3,5,7,9,12].forEach(e=>{
i+=`<rect x="${a+(e-1)*s}" y="22" width="55" height="154" fill="#ffffff" opacity=".06"/>`,
i+=`<text x="${a+(e-1)*s+27.5}" y="12" font-size="11" fill="#93a1b0" text-anchor="middle">${e}</text>`}),
i+='<text x="51" y="12" font-size="10" fill="#93a1b0" text-anchor="middle">VIDE</text>'
;for(let e=0;e<=12;e++)i+=`<line x1="${a+e*s}" x2="${a+e*s}" y1="34" y2="164" stroke="${0===e?"#e8eef4":"#4a5a6b"}" stroke-width="${0===e?4:1.5}"/>`
;for(let e=0;e<6;e++){const t=34+26*(5-e);i+=`<line x1="26" x2="738" y1="${t}" y2="${t}" stroke="#9aa7b4" stroke-width="${1+.25*(5-e)}"/>`}
let o=null;if(S.caged){const t=mod(e.root.pc-4,12),n=[-1,2,4,7,9][S.caged-1];o=mod(t+n,12);for(let e=0;e<2;e++){
const t=o+12*e-0,n=t,r=t+5,l=a+Math.max(n-1,0)*s,c=a+Math.min(r,12)*s
;n<=12&&(i+=`<rect x="${n<=0?26:l}" y="20" width="${Math.max(0,c-(n<=0?26:l))}" height="158" fill="#7aa2ff" opacity=".13" stroke="#7aa2ff" stroke-dasharray="4 3"/>`)
}}const r=e=>!S.caged||[0,1].some(t=>{const n=o+12*t;return e>=n&&e<n+5})||0===e&&o+12>=12&&0===o;for(let e=0;e<6;e++){const o=34+26*(5-e)
;for(let l=0;l<=12;l++){const c=OPEN[e]+l,m=t[mod(c,12)];m&&r(l)&&(i+=pill(0===l?51:a+(l-1)*s+27.5,o,11,m,n.has(m.pc),c+12,9))}}
return i+"</svg>"}
const DQ=[["maj",""],["m","m"],["7","7"],["m7","m7"],["maj7","maj7"],["m7b5","m7♭5"],["6","6"],["m6","m6"],["sus4","sus4"],["dim","dim"]],FORMS=[{
n:"E",pc:4,sh:{maj:[0,2,2,1,0,0],m:[0,2,2,0,0,0],7:[0,2,0,1,0,0],m7:[0,2,0,0,0,0],maj7:[0,2,1,1,0,0],m7b5:[0,null,0,0,-1,null],
6:[0,2,2,1,2,0],m6:[0,2,2,0,2,0],sus4:[0,2,2,2,0,0]}},{n:"A",pc:9,sh:{maj:[null,0,2,2,2,0],m:[null,0,2,2,1,0],7:[null,0,2,0,2,0],
m7:[null,0,2,0,1,0],maj7:[null,0,2,1,2,0],m7b5:[null,0,1,0,1,null],dim:[null,0,1,2,1,null],6:[null,0,2,2,2,2],m6:[null,0,2,2,1,2],
sus4:[null,0,2,2,3,0]}},{n:"D",pc:2,sh:{maj:[null,null,0,2,3,2],m:[null,null,0,2,3,1],7:[null,null,0,2,1,2],m7:[null,null,0,2,1,1],
maj7:[null,null,0,2,2,2],m7b5:[null,null,0,1,1,1],dim:[null,null,0,1,3,1],6:[null,null,0,2,0,2],m6:[null,null,0,2,0,1],
sus4:[null,null,0,2,3,3]}},{n:"C",pc:9,sh:{maj:[null,0,-1,-3,-2,-3],7:[null,0,-1,0,-2,-3],maj7:[null,0,-1,-3,-3,-3]}},{n:"G",pc:4,sh:{
maj:[0,-1,-3,-3,-3,0],7:[0,-1,-3,-3,-3,-2]}}];function positions(e,t){const n=[],a=new Set;FORMS.forEach(s=>{const i=s.sh[t];if(!i)return
;const o=mod(e.pc-s.pc,12);[o,o+12].forEach(e=>{const t=i.map(t=>null===t?null:e+t);if(t.some(e=>null!==e&&(e<0||e>15)))return
;const o=t.join();a.has(o)||(a.add(o),n.push({form:s.n,fr:t}))})});const s=e=>{
const t=e.fr.filter(e=>null!==e&&e>0),n=e.fr.filter(e=>null!==e);return 100*(t.length?Math.min(...t):0)+Math.max(...n)}
;return n.sort((e,t)=>s(e)-s(t))}const guitarPick=(e,t)=>positions(e,t)[0]||null;function diagramFrets(e){
const t=e.filter(e=>null!==e&&e>0),n=t.length?Math.max(...t):0,a=t.length?Math.min(...t):1,s=n>4?a:1;let i='<svg viewBox="0 0 120 112">'
;s>1&&(i+=`<text x="4" y="37.2" font-size="11" fill="#f5b13d">${s}</text>`)
;for(let e=0;e<6;e++)i+=`<line x1="${24+15*e}" x2="${24+15*e}" y1="26" y2="106" stroke="#9aa7b4"/>`
;for(let e=0;e<=5;e++)i+=`<line x1="24" x2="99" y1="${26+16*e}" y2="${26+16*e}" stroke="${0===e&&1===s?"#e8eef4":"#4a5a6b"}" stroke-width="${0===e&&1===s?3:1}"/>`
;const o=[];return e.forEach((e,t)=>{const n=24+15*t;null!==e?(o.push(OPEN[t]+e),
i+=0!==e?`<circle cx="${n}" cy="${26+16*(e-s)+8}" r="5.5" fill="#e8eef4"/>`:`<circle cx="${n}" cy="17" r="4" fill="none" stroke="#e8eef4"/>`):i+=`<text x="${n}" y="18" font-size="11" text-anchor="middle" fill="#e5675f">x</text>`
}),{svg:i+"</svg>",midis:o}}function diagram(e,t){const n=guitarPick(e,t);return n?diagramFrets(n.fr):{
svg:'<svg viewBox="0 0 120 112"></svg>',midis:[]}}function positionsHtml(e){if(!e.q||!e.croot||!CH[e.q])return""
;const t=positions(e.croot,e.q)
;return t.length?`<div class="card"><h2>Positions de ${e.cname} <span class="muted">· ${t.length} façons de le jouer</span></h2>\n  <div class="dg2">${t.map(e=>{
const t=diagramFrets(e.fr),n=e.fr.filter(e=>null!==e&&e>0),a=n.length?Math.min(...n):0
;return`<button data-act="diagram" data-v="${t.midis.map(e=>e+12).join(",")}"><b>Forme ${e.form}</b>${t.svg}<small>${a>1?"case "+a:"position basse"}</small></button>`
}).join("")}</div>\n  <div class="muted" style="margin-top:6px">Même accord, mêmes notes, joué à différents endroits du manche. Forme = accord ouvert dont on réutilise le doigté (E, A, D, C, G).</div></div>`:""
}function miniPiano(e){const t=new Set(e),n=e[0];let a='<svg viewBox="0 0 210 56" width="210">'
;for(let e=0;e<2;e++)[0,2,4,5,7,9,11].forEach((s,i)=>{const o=48+12*e+s
;a+=`<rect x="${15*(7*e+i)+.5}" y="0" width="14" height="56" rx="2" fill="${o===n?"#f5b13d":t.has(o)?"#8fe5da":"#e9eef3"}" stroke="#1c2530"/>`
});for(let e=0;e<2;e++)[[1,1],[3,2],[6,4],[8,5],[10,6]].forEach(([s,i])=>{const o=48+12*e+s
;a+=`<rect x="${15*(7*e+i)-5}" y="0" width="10" height="33.6" rx="2" fill="${o===n?"#f5b13d":t.has(o)?"#0d8a7d":"#141b23"}"/>`})
;return a+"</svg>"}function invHtml(e){if(!e.ints)return"";const t=e.dg||[0,2,4,6],n={};e.ints.forEach((a,s)=>{const i=spell(e.croot,t[s],a)
;n[i.pc]=nmN(i)});const a=["Fondamental","1er renversement","2e renversement","3e renversement"]
;return`<div class="card"><h2>Renversements de ${e.cname} <span class="muted">· même accord, basse différente</span></h2>\n  <div class="dg2">${e.ints.map((t,s)=>{
const i=voicing(e,72,s)
;return`<button data-act="invplay" data-v="${i.join(",")}"><b>${a[s]}</b>${miniPiano(i)}<small>${i.map(e=>n[mod(e,12)]||"").join(" – ")}</small></button>`
}).join("")}</div>\n  <div class="muted" style="margin-top:6px">En ambre : la note de basse (la plus grave). Touche un renversement pour l’entendre.</div></div>`
}function dictHtml(){const e=S.dict
;return`<div class="card"><h2>Dictionnaire d’accords <span class="muted">· formes mobiles</span></h2>\n  <div class="chips" style="margin-bottom:8px">${TON.map((t,n)=>`<button class="chip sm ${t.l===e.l&&t.a===e.a?"on":""}" data-act="dictroot" data-v="${n}">${nmN(t)}</button>`).join("")}</div>\n  <div class="dg">${DQ.map(([t,n])=>{
const a=diagram(e,t);return`<button data-act="diagram" data-v="${a.midis.map(e=>e+12).join(",")}"><b>${nmN(e)}${n}</b>${a.svg}</button>`
}).join("")}</div>\n  <div class="muted" style="margin-top:6px">x = corde étouffée · ○ = corde à vide · numéro = case de départ. Touche un accord pour l’entendre.</div></div>`
}function renderInstruments(){
const e=curView(),t=S.inst,n=!!e.ints,a=`<div class="legend"><span><i style="background:var(--root)"></i>Tonique</span><span><i style="background:var(--chr)"></i>Note caractéristique</span><span><i style="background:var(--sc)"></i>Gamme</span>${n?'<span><i style="border:3px solid var(--ct);width:12px;height:12px;background:none"></i>Note d’accord</span>':""}</div>`
;let s=`<div class="card"><h2>${e.title}${e.cname?` <span class="muted">· accord ${e.cname}</span>`:""}</h2>${a}\n   <div class="tr" style="margin-bottom:8px"><button class="btn sm" data-act="listenv">♪ Gamme</button>${n?`<button class="btn sm sec" data-act="listenchord">♪ Accord</button><div class="seg"><button class="${"plaque"===S.strum?"on":""}" data-act="strum" data-v="plaque">Plaqué</button><button class="${"arpege"===S.strum?"on":""}" data-act="strum" data-v="arpege">Arpège</button></div>`:""}</div>`
;"guitar"!==t&&(s+=`<div class="tr" style="margin-bottom:6px"><div class="seg"><button class="${2===S.oct?"on":""}" data-act="oct" data-v="2">2 oct.</button><button class="${3===S.oct?"on":""}" data-act="oct" data-v="3">3 oct.</button></div>\n     ${n?`<select data-act="inv"><option value="0" ${0===S.inv?"selected":""}>Fondamental</option><option value="1" ${1===S.inv?"selected":""}>1er renversement</option><option value="2" ${2===S.inv?"selected":""}>2e renversement</option></select>`:""}\n     <button class="chip sm ${S.staff?"on2":""}" data-act="staff">Portée</button>${S.staff?`<div class="seg"><button class="${"sol"===S.clef?"on":""}" data-act="clef" data-v="sol">Sol</button><button class="${"fa"===S.clef?"on":""}" data-act="clef" data-v="fa">Fa</button></div>`:""}</div>\n     ${pianoSvg(e)}${S.staff?`<div class="scroll" style="margin-top:8px">${staffSvg2(e)}</div>`:""}`),
"piano"!==t&&(s+=`<div class="tr" style="margin:${"duo"===t?"12px":"0"} 0 6px"><span class="muted">Boîte (CAGED, approx.)</span><div class="chips">${["Tout","E","D","C","A","G"].map((e,t)=>`<button class="chip sm ${S.caged===t?"on2":""}" data-act="caged" data-v="${t}">${e}</button>`).join("")}</div></div>\n     <div class="fb">${guitarSvg(e)}</div>`),
s+="</div>","guitar"!==t&&(s+=invHtml(e)),"piano"!==t&&(s+=positionsHtml(e)+dictHtml()),
s+='<div class="card"><details open style="margin:0"><summary>Comprendre pourquoi</summary><p>La même gamme se joue partout sur le manche et le clavier : seules les positions changent. Les pastilles cerclées de vert sont les notes de l’accord en cours ; vise-les sur les temps forts, les autres servent de passage.</p></details></div>',
document.getElementById("inst").innerHTML=s}
const ROM12=["I","♭II","II","♭III","III","IV","♭V","V","♭VI","VI","♭VII","VII"],D_OF_S=[0,1,1,2,2,3,4,4,5,5,6,6],MINQ=["m","m7","m6","m7b5","dim"],RSUF={
maj:"",m:"",7:"7",maj7:"maj7",m7:"7",m7b5:"ø7",dim:"°",6:"6",m6:"6",sus4:"sus4"};function mkChord(e,t){let n=ROM12[e]
;return MINQ.includes(t)&&(n=n.toLowerCase()),{d:D_OF_S[e],s:e,q:t,r:n+RSUF[t]}}const newSong=()=>({name:"Mon morceau",mode:"maj",bpm:90,
sig:"4/4",pstyle:"ballade",gstyle:"pop",loop:!0,sections:[{name:"Couplet",rep:1,
bars:[mkChord(0,"maj"),mkChord(9,"m"),mkChord(5,"maj"),mkChord(7,"maj")]}]
}),esc=e=>String(e).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"),lsGet=e=>{try{
return JSON.parse(localStorage.getItem(e))}catch(e){return null}},lsSet=(e,t)=>{try{return localStorage.setItem(e,JSON.stringify(t)),!0
}catch(e){return!1}},validSong=e=>e&&Array.isArray(e.sections)&&e.sections.length&&e.sections.every(e=>e&&Array.isArray(e.bars))
;S.song=newSong(),S.sel={si:0,bi:0},S.tri=!1,S.diag=!0,S.pick={s:0,q:"maj"},S.msg="";{const e=lsGet("atelier-modal-current")
;if(e&&validSong(e.song)&&(S.song=Object.assign(newSong(),e.song),e.tonic)){const t=TON.find(t=>t.l===e.tonic[0]&&t.a===e.tonic[1])
;t&&(S.tonic=t,S.dict=t)}}function persist(){lsSet("atelier-modal-current",{song:S.song,tonic:[S.tonic.l,S.tonic.a]})}const chordAt=(e,t)=>{
const n=S.song.sections[e];return n&&n.bars[t]||null},selChord=()=>chordAt(S.sel.si,S.sel.bi);function diaChords(){
const e="maj"===S.song.mode,t=e?["maj7","m7","m7","maj7","7","m7","m7b5"]:["m7","m7b5","maj7","m7","m7","maj7","7"],n=e?["maj","m","m","maj","maj","m","dim"]:["m","dim","maj","m","m","maj","maj"]
;return(e?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10]).map((e,a)=>mkChord(e,(S.tri?n:t)[a]))}const cnOf=e=>cName(spell(S.tonic,e.d,e.s),e.q)
;function barCell(e,t,n){const a=S.sel.si===t&&S.sel.bi===n;let s;if(e){const t=spell(S.tonic,e.d,e.s)
;if(s=`<small>${n+1} · ${e.r}</small><b>${cName(t,e.q)}</b>`,S.diag){const n=guitarPick(t,e.q);n&&(s+=diagramFrets(n.fr).svg)}
}else s=`<small>${n+1}</small><b>+</b>`
;return`<button class="bar ${a?"sel":""} ${P.on&&a?"now":""}" data-act="sbar" data-si="${t}" data-bi="${n}">${s}</button>`}
function renderSong(){
const e=S.song,t=lsGet("atelier-modal-songs")||{},n=(e,t)=>e.map(([e,n])=>`<option value="${e}" ${e===t?"selected":""}>${n}</option>`).join(""),a=e.sections.map((e,t)=>`<div class="card"><div class="tr"><input class="nm" value="${esc(e.name)}" data-act="secname" data-si="${t}">\n   <select data-act="secrep" data-si="${t}">${[1,2,3,4].map(t=>`<option value="${t}" ${t===(e.rep||1)?"selected":""}>×${t}</option>`).join("")}</select></div>\n   <div class="bars">${e.bars.map((e,n)=>barCell(e,t,n)).join("")}</div>\n   <div class="tr" style="margin-top:8px"><button class="btn sm sec" data-act="addbar" data-si="${t}">+ mesure</button><button class="btn sm sec" data-act="delbar" data-si="${t}">− mesure</button><button class="btn sm sec" data-act="dupsec" data-si="${t}">Dupliquer</button><button class="btn sm sec" data-act="delsec" data-si="${t}">Supprimer</button>\n   <select data-act="impgrid" data-si="${t}"><option value="">Importer une grille…</option>${GRIDS.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}</select></div></div>`).join("")
;document.getElementById("panel").innerHTML=`\n  <div class="card"><h2>Morceau</h2>\n   <input class="nm" style="width:100%" value="${esc(e.name)}" data-act="sname">\n   <div class="muted" style="margin:6px 0">Tonalité : <b>${nmN(S.tonic)} ${"maj"===e.mode?"majeur":"mineur"}</b> (change-la avec les pastilles en haut : tout le morceau est transposé)</div>\n   <div class="tr"><div class="seg"><button class="${"maj"===e.mode?"on":""}" data-act="smode" data-v="maj">Majeur</button><button class="${"min"===e.mode?"on":""}" data-act="smode" data-v="min">Mineur</button></div>\n    <div class="seg">${Object.keys(SIGS).map(t=>`<button class="${e.sig===t?"on":""}" data-act="ssig" data-v="${t}">${t}</button>`).join("")}</div></div>\n   <div class="tr" style="margin-top:8px"><span class="muted">Tempo</span><input type="range" min="50" max="160" value="${e.bpm}" data-act="sbpm"><b id="sbpmv">${e.bpm}</b></div>\n   <div class="tr" style="margin-top:8px"><span class="muted">Piano</span><select data-act="pstyle">${n([["none","Muet"],["bloc","Accords tenus"],["ballade","Ballade (basse + accords)"],["arpege","Arpèges"]],e.pstyle)}</select>\n    <span class="muted">Guitare</span><select data-act="gstyle">${n([["none","Muette"],["noires","Grattage noires"],["pop","Grattage pop"],["arpege","Arpège"]],e.gstyle)}</select></div>\n   <div class="tr" style="margin-top:8px"><button class="btn" id="splay" data-act="splay">${P.on?"■ Stop":"▶ Lire le morceau"}</button>\n    <button class="chip sm ${S.diag?"on2":""}" data-act="diag">Diagrammes guitare</button><button class="chip sm ${e.loop?"on2":""}" data-act="loop">Boucle</button></div>\n   <details><summary>Sauvegarde &amp; export</summary>\n    <div class="tr" style="margin-top:8px"><select id="savesel"><option value="">Morceaux enregistrés…</option>${Object.keys(t).map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join("")}</select>\n     <button class="btn sm" data-act="ssave">Enregistrer</button><button class="btn sm sec" data-act="sload">Charger</button><button class="btn sm sec" data-act="sdel">Suppr.</button><button class="btn sm sec" data-act="snew">Nouveau</button></div>\n    <div class="muted" style="margin:6px 0">Enregistré dans ce navigateur, sur cet appareil. Pour le garder ailleurs, copie le texte ci-dessous.</div>\n    <textarea id="exp">${esc(JSON.stringify({
song:e,tonic:[S.tonic.l,S.tonic.a]
}))}</textarea>\n    <div class="tr" style="margin-top:6px"><button class="btn sm sec" data-act="scopy">Copier</button><button class="btn sm sec" data-act="simport">Importer ce texte</button></div>\n    <div class="muted" id="smsg">${esc(S.msg)}</div></details></div>\n  ${a}\n  <div class="card"><button class="btn sec" data-act="addsec">+ Ajouter une section (couplet, refrain, pont…)</button></div>\n  <div id="picker"></div>`
}const FN={maj:{0:"Tonique (I) : le point de repos, la « maison » du morceau.",
2:"Sus‑tonique (ii) : prépare la dominante, c’est le début du son jazz.",4:"Médiante (iii) : douce et ambiguë, entre repos et mouvement.",
5:"Sous‑dominante (IV) : ouvre et donne de l’élan, loin de la tonique.",7:"Dominante (V) : tension maximale, elle appelle le retour sur I.",
9:"Sus‑dominante (vi) : la relative mineure, couleur tendre et mélancolique.",10:"♭VII : emprunté au mixolydien, couleur rock / folk‑rock.",
11:"Sensible (vii°) : instable, tire fortement vers I."},min:{0:"Tonique (i) : le repos, mais dans une couleur sombre.",
2:"iiø : prépare la dominante V7, typique du jazz mineur.",3:"♭III : la relative majeure, une éclaircie.",
5:"Sous‑dominante (iv) : assombrit et ouvre, très « ballade ».",7:"Dominante (V) : avec la sensible, elle tire fort vers i.",
8:"♭VI : lumineux et large, son épique / cinéma.",10:"♭VII : descente modale, rock et andalouse."}},NEXT={maj:{
0:[[5,"maj7","maj","Ouvre vers « l’ailleurs » : sensation d’élan et de lumière. Très pop / folk."],[7,"7","maj","Crée une tension qui demande à revenir sur I : son franc, rock / pop."],[9,"m7","m","Bascule vers la relative mineure : couleur plus tendre, mélancolique (I–vi : années 50, soul)."],[2,"m7","m","Prépare un V : c’est le début du II–V–I, la signature du jazz."],[4,"m7","m","Colore tout en douceur, sans vraie tension : sonorité rêveuse."],[10,"7","maj","Emprunt au mixolydien : son rock, ouvre sans passer par la dominante."],[9,"7","7","Dominante secondaire (VI7) : tire vers ii, son swing / jazz « rhythm changes »."]],
2:[[7,"7","maj","ii → V : le mouvement jazz par excellence, l’oreille attend déjà I."],[1,"7","maj","Substitution tritonique (♭II7) : descente chromatique vers I, jazz sophistiqué."],[5,"maj7","maj","ii → IV : reste doux et pop, retarde la tension."]],
4:[[9,"m7","m","iii → vi : descente par quintes, mouvement fluide et naturel."],[5,"maj7","maj","iii → IV : petite montée très mélodique."],[2,"m7","m","iii → ii : on glisse vers la préparation du V."]],
5:[[7,"7","maj","IV → V : on monte vers la tension (rock, pop)."],[0,"maj7","maj","Cadence plagale « amen » : retour doux et apaisé sur I."],[2,"m7","m","IV → ii : variante douce avant le V."],[5,"m7","m","IV mineur emprunté (iv) : touche nostalgique, effet « cinéma »."]],
7:[[0,"maj7","maj","Résolution : la tension se relâche, effet d’arrivée."],[9,"m7","m","Cadence rompue : on évite I, surprise émotionnelle."],[5,"maj7","maj","V → IV : retour en arrière, mouvement rock."]],
9:[[2,"m7","m","vi → ii : le début de l’Anatole (vi–ii–V–I), boucle jazz / soul."],[5,"maj7","maj","vi → IV : descente douce, pop émotionnelle."],[7,"7","maj","vi → V : tension directe, esprit doo‑wop."],[4,"m7","m","vi → iii : suspension tendre, sans résoudre."]],
10:[[5,"maj7","maj","♭VII → IV : mouvement rock classique."],[0,"maj7","maj","Retour à I après un emprunt mixolydien."]],
11:[[0,"maj7","maj","Résolution sur I : la sensible tire vers la tonique."],[4,"m7","m","vii° → iii : couleur sombre avant de repartir."]]},
min:{
0:[[5,"m7","m","Assombrit en restant calme : couleur ballade, tango."],[7,"7","maj","V7 : la sensible tire fort vers i, cadence classique, flamenco, jazz mineur."],[8,"maj7","maj","Élargit et éclaire : son épique, cinéma."],[10,"7","maj","Descente modale éolienne : rock et andalouse (i–♭VII–♭VI–V)."],[3,"maj7","maj","Passe à la relative majeure : une éclaircie."],[2,"m7b5","dim","Prépare V7 : jazz mineur (iiø–V7–i)."]],
2:[[7,"7","maj","iiø → V7 → i : la cadence du jazz mineur."]],
3:[[10,"7","maj","♭III → ♭VII : montée épique."],[5,"m7","m","♭III → iv : retombe vers l’ombre."],[8,"maj7","maj","♭III → ♭VI : élargit la couleur."]],
5:[[7,"7","maj","iv → V7 : on prépare la résolution, très dramatique."],[0,"m7","m","iv → i : cadence plagale mineure, retour apaisé."],[10,"7","maj","iv → ♭VII : détour modal."]],
7:[[0,"m7","m","Résolution sur i : la tension retombe."],[8,"maj7","maj","Cadence rompue mineure : on s’attendait à i, surprise."]],
8:[[10,"7","maj","♭VI → ♭VII : montée épique."],[7,"7","maj","♭VI → V : la cadence andalouse, son flamenco."],[3,"maj7","maj","♭VI → ♭III : boucle lumineuse."]],
10:[[3,"maj7","maj","♭VII → ♭III : boucle épique (i–♭VII–♭III)."],[0,"m7","m","Retour sur i."],[8,"maj7","maj","♭VII → ♭VI : descente modale."]]
}},START={
maj:[[0,"maj7","maj","Départ stable : on pose la tonalité, on sait où on est."],[9,"m7","m","Départ mélancolique : on commence sur la relative mineure."],[2,"m7","m","Départ jazz : on entre directement dans un II–V."],[5,"maj7","maj","Départ ouvert : sensation de suspension, on retombera sur I plus tard."]],
min:[[0,"m7","m","Départ stable : on pose la tonalité mineure."],[8,"maj7","maj","Départ lumineux et épique."],[5,"m7","m","Départ sombre et lent : ballade, tango."]]
},PROGS={maj:[{n:"II – V – I",tag:"Jazz",ch:[[2,"m7","m"],[7,"7","maj"],[0,"maj7","maj"]],
w:"La cadence du jazz : le ii prépare, le V crée la tension, le I la résout. Chaque accord tire vers le suivant."},{
n:"I – vi – ii – V (Anatole)",tag:"Jazz / Soul",ch:[[0,"maj7","maj"],[9,"m7","m"],[2,"m7","m"],[7,"7","maj"]],
w:"Une boucle qui tourne en rond sans jamais s’arrêter : idéale pour improviser."},{n:"I – V – vi – IV",tag:"Pop",
ch:[[0,"maj7","maj"],[7,"7","maj"],[9,"m7","m"],[5,"maj7","maj"]],
w:"Le plus utilisé en pop : lumineux, énergique, un refrain qui s’accroche dès la première écoute."},{n:"vi – IV – I – V",
tag:"Pop émotionnelle",ch:[[9,"m7","m"],[5,"maj7","maj"],[0,"maj7","maj"],[7,"7","maj"]],
w:"Mêmes accords que I–V–vi–IV, mais on commence par le mineur : plus de mélancolie au départ, éclaircie ensuite."},{n:"I – vi – IV – V",
tag:"Années 50 / doo‑wop",ch:[[0,"maj7","maj"],[9,"m7","m"],[5,"maj7","maj"],[7,"7","maj"]],
w:"Le classique des slows : nostalgique et très chantant."},{n:"I – IV – V",tag:"Rock / Folk",
ch:[[0,"maj7","maj"],[5,"maj7","maj"],[7,"7","maj"]],w:"Les trois piliers : tonique, sous‑dominante, dominante. Simple, direct, efficace."
},{n:"I – ♭VII – IV",tag:"Rock",ch:[[0,"maj7","maj"],[10,"7","maj"],[5,"maj7","maj"]],
w:"Emprunt mixolydien : le ♭VII donne un son rock ouvert, sans tension de dominante."},{n:"Canon : I – V – vi – iii – IV – I – IV – V",
tag:"Classique / romantique",
ch:[[0,"maj7","maj"],[7,"7","maj"],[9,"m7","m"],[4,"m7","m"],[5,"maj7","maj"],[0,"maj7","maj"],[5,"maj7","maj"],[7,"7","maj"]],
w:"Une descente régulière sur 8 mesures : sensation de grandeur, parfait pour un crescendo."}],min:[{n:"i – ♭VII – ♭VI – V",
tag:"Andalouse / flamenco",ch:[[0,"m","m"],[10,"maj","maj"],[8,"maj","maj"],[7,"7","maj"]],
w:"Descente modale qui finit sur la dominante : le son flamenco par excellence."},{n:"iiø – V7 – i",tag:"Jazz mineur",
ch:[[2,"m7b5","dim"],[7,"7","maj"],[0,"m7","m"]],w:"Le II–V–I du mineur : plus dramatique que celui du majeur."},{n:"i – iv – V7",
tag:"Mineur classique / tango",ch:[[0,"m7","m"],[5,"m7","m"],[7,"7","maj"]],
w:"Les trois piliers en mineur : sombre, dramatique, très théâtral."},{n:"i – ♭VI – ♭III – ♭VII",tag:"Épique / cinéma",
ch:[[0,"m7","m"],[8,"maj7","maj"],[3,"maj7","maj"],[10,"7","maj"]],
w:"Une boucle large et lumineuse malgré le mineur : bande‑son, pop épique."},{n:"i – ♭VII – ♭VI – ♭VII",tag:"Rock / modal",
ch:[[0,"m7","m"],[10,"7","maj"],[8,"maj7","maj"],[10,"7","maj"]],w:"Va‑et‑vient modal : tendu mais sans résolution, idéal pour un riff."}]
},IDEAS={maj:[{n:"Emprunt au mineur parallèle (iv)",where:["pont","refrain"],when:"Sur le pont, ou à la fin d’une phrase de refrain.",
why:"Le iv est emprunté au mode mineur : on passe d’une couleur lumineuse à une couleur nostalgique le temps d’une mesure. Le retour sur I paraît alors plus doux, presque consolant.",
ch:[[5,"maj7","maj"],[5,"m7","m"],[0,"maj7","maj"]],sc:e=>nmN(spell(e,3,5))+" Dorien sur le iv"},{n:"♭VI – ♭VII – I (cadence héroïque)",
where:["fin","refrain"],when:"À la fin du refrain, surtout le dernier.",
why:"Deux accords empruntés au mineur (♭VI, ♭VII) qui montent vers I : effet de puissance, d’hymne, très utilisé en rock et en pop épique.",
ch:[[8,"maj7","maj"],[10,"7","maj"],[0,"maj7","maj"]],sc:e=>nmN(spell(e,6,10))+" Mixolydien sur le ♭VII"},{
n:"Vers la relative mineure (vi)",where:["pont","couplet"],when:"Sur le couplet ou le pont, pour créer du contraste.",
why:"Mêmes notes (même armure) mais le centre devient le vi : l’ambiance passe au mélancolique sans sortir de la tonalité, donc sans rupture.",
ch:[[9,"m7","m"],[5,"maj7","maj"],[7,"7","maj"],[9,"m7","m"]],sc:e=>nmN(spell(e,5,9))+" Éolien (mêmes notes que "+nmN(e)+" majeur)"},{
n:"Couleur mixolydienne (♭VII)",where:["refrain","couplet"],when:"Sur un refrain énergique, rock ou blues.",
why:"Le ♭VII et le I7 viennent du mixolydien : son franc, ouvert, sans la tension d’une vraie dominante. Idéal pour groover.",
ch:[[0,"7","maj"],[10,"7","maj"],[5,"maj7","maj"],[0,"7","maj"]],sc:e=>nmN(e)+" Mixolydien"},{n:"Couleur lydienne (II)",
where:["intro","pont"],when:"En intro, ou sur un pont planant.",
why:"Le II majeur apporte le ♯4 du lydien : sonorité flottante, rêveuse, « bande originale ». L’oreille n’attend aucune résolution forte.",
ch:[[0,"maj7","maj"],[2,"7","maj"],[0,"maj7","maj"],[2,"7","maj"]],sc:e=>nmN(e)+" Lydien"},{n:"Moduler vers la dominante (V)",
where:["pont","couplet"],when:"Au passage du premier au second couplet, ou sur le pont.",
why:"On installe un II–V–I dans la tonalité située une quinte plus haut : sensation d’élévation et de relance. L’accord V7 du nouveau ton fait la « porte d’entrée ».",
ch:[[9,"m7","m"],[2,"7","maj"],[7,"maj7","maj"]],sc:e=>nmN(spell(e,4,7))+" Ionien (nouvelle tonalité)"},{
n:"Montée d’un ton (dernier refrain)",where:["fin"],when:"Juste avant le dernier refrain.",
why:"Un coup de fouet d’énergie : tout repart un ton plus haut. Le V7 du nouveau ton prépare l’arrivée, puis le refrain rejoue ses accords dans la nouvelle tonalité.",
ch:[[9,"7","maj"],[2,"maj7","maj"],[9,"maj","maj"],[11,"m7","m"],[7,"maj7","maj"]],sc:e=>nmN(spell(e,1,2))+" Ionien (nouvelle tonalité)"}],
min:[{n:"Tierce picarde (finir en majeur)",where:["fin"],when:"Sur le dernier accord du morceau.",
why:"On remplace le dernier accord mineur par un majeur : une lumière inattendue après le sombre, effet de délivrance (musique baroque, ballades).",
ch:[[7,"7","maj"],[0,"maj7","maj"]],sc:e=>nmN(e)+" Ionien sur le dernier accord"},{n:"Couleur dorienne (IV majeur)",
where:["couplet","refrain"],when:"Sur un couplet groove : funk, soul, jazz‑rock.",
why:"Le IV majeur apporte la 6te naturelle du dorien : le mineur reste sombre mais gagne en lumière et en mouvement, sans devenir triste.",
ch:[[0,"m7","m"],[5,"7","maj"],[0,"m7","m"],[5,"7","maj"]],sc:e=>nmN(e)+" Dorien"},{n:"Couleur phrygienne (♭II)",where:["pont","intro"],
when:"En intro, ou sur un pont dramatique.",
why:"Le ♭II apporte la seconde mineure du phrygien : tension dramatique, flamenco, métal. L’oreille sent le danger sans qu’on quitte le mineur.",
ch:[[0,"m","m"],[1,"maj7","maj"],[0,"m","m"],[7,"7","maj"]],sc:e=>nmN(e)+" Phrygien"},{n:"Éclaircie vers la relative majeure (♭III)",
where:["refrain","pont"],when:"Sur le refrain, pour qu’il s’ouvre.",
why:"On s’installe sur le majeur relatif (mêmes notes) : le refrain devient lumineux et large, tout en gardant la nostalgie du mineur.",
ch:[[3,"maj7","maj"],[10,"7","maj"],[8,"maj7","maj"],[7,"7","maj"]],sc:e=>nmN(spell(e,2,3))+" Ionien (mêmes notes que "+nmN(e)+" mineur)"},{
n:"Dominante harmonique (V7)",where:["fin","couplet"],when:"À la fin d’une phrase, pour conclure.",
why:"La sensible (7te majeure) donne le vrai appel vers i : la phrase se referme de façon nette et conclusive.",
ch:[[5,"m7","m"],[7,"7","maj"],[0,"m7","m"]],sc:e=>nmN(spell(e,4,7))+" Phrygien dominant sur V7"}]};function ideasHtml(){
const e=S.song,t=e.sections[S.sel.si],n=(t&&t.name||"").toLowerCase(),a=0===S.sel.si&&0===S.sel.bi,s=S.sel.si===e.sections.length-1&&t&&S.sel.bi>=t.bars.length-1,i=new Set
;return/pont|bridge|break/.test(n)&&i.add("pont"),/refrain|chorus/.test(n)&&i.add("refrain"),/couplet|verse/.test(n)&&i.add("couplet"),
(/intro/.test(n)||a)&&i.add("intro"),(/fin|outro|coda/.test(n)||s)&&i.add("fin"),
`<details open><summary>Changer de couleur : emprunts &amp; modulations</summary><div class="muted" style="margin:6px 0">Idées pour sortir de la gamme de départ au bon moment. Les mieux adaptées à la section choisie sont en premier.</div>${IDEAS[e.mode].map((e,t)=>({
x:e,i:t,reco:e.where.some(e=>i.has(e))
})).sort((e,t)=>t.reco-e.reco||e.i-t.i).map(({x:e,i:n,reco:a})=>`<div class="sug" style="cursor:default"><b>${e.n}</b>${a?` <span class="tg">★ Idéal ici (${esc(t.name)})</span>`:""}\n    <div class="muted" style="margin:3px 0">${e.ch.map(([e,t,n])=>cnOf(mkChord(e,S.tri?n:t))).join(" · ")}</div>\n    <span class="w"><b style="font-size:12.5px">Quand :</b> ${e.when}</span><span class="w"><b style="font-size:12.5px">Ce que ça apporte :</b> ${e.why}</span>\n    <span class="w"><b style="font-size:12.5px">Gamme à jouer :</b> ${e.sc(S.tonic)}</span>\n    <div class="tr" style="margin-top:6px"><button class="btn sm" data-act="idea" data-v="${n}">Placer ici</button><button class="btn sm sec" data-act="ideaplay" data-v="${n}">♪ Écouter</button></div></div>`).join("")}</details>`
}function suggHtml(e){const t="maj"===S.song.mode,n=t?NEXT.maj:NEXT.min,a=t?FN.maj:FN.min;let s,i,o;if(e){
if(o="Pour la suite après "+cnOf(e),i=a[e.s]||"Accord hors gamme : il apporte une couleur d’emprunt.",
s=n[e.s]||[[0,t?"maj7":"m7",t?"maj":"m","Retour à la tonique : on referme la phrase."],[7,"7","maj","Va vers la dominante pour relancer."]],
"7"===e.q&&7!==e.s&&10!==e.s){const t=(e.s+5)%12,n=diaChords().find(e=>e.s===t)||mkChord(t,"maj")
;i="Accord de dominante (secondaire) : il tire vers l’accord une quarte plus haut.",
s=[[t,n.q,n.q,"Résolution : "+cnOf(e)+" mène à "+cnOf(n)+", comme un V vers un I de passage."]]}}else o="Pour commencer",
s=t?START.maj:START.min,i="Choisis un premier accord : voici trois ou quatre départs possibles."
;return`<h3>${o}</h3><div class="muted" style="margin-bottom:4px">${i}</div>${s.map(([e,t,n,a])=>{const s=S.tri?n:t,i=mkChord(e,s)
;return`<button class="sug" data-act="sugg" data-s="${e}" data-q="${s}"><b>${cnOf(i)}</b><span class="muted">${i.r}</span><span class="w">${a}</span></button>`
}).join("")}\n   <details open><summary>Enchaînements classiques</summary><div class="muted" style="margin:6px 0">« Placer ici » écrit l’enchaînement à partir de la mesure choisie (ajoute des mesures si besoin).</div>${PROGS[S.song.mode].map((e,t)=>`<div class="sug" style="cursor:default"><b>${e.n}</b> <span class="tg">${e.tag}</span>\n    <div class="muted" style="margin:3px 0">${e.ch.map(([e,t,n])=>cnOf(mkChord(e,S.tri?n:t))).join(" · ")}</div><span class="w">${e.w}</span>\n    <div class="tr" style="margin-top:6px"><button class="btn sm" data-act="prog" data-v="${t}">Placer ici</button><button class="btn sm sec" data-act="progplay" data-v="${t}">♪ Écouter</button></div></div>`).join("")}</details>${ideasHtml()}`
}function applyProg(e){const t=S.song.sections[S.sel.si],n=S.sel.bi;for(;t.bars.length<n+e.ch.length;)t.bars.push(null)
;e.ch.forEach(([e,a,s],i)=>{t.bars[n+i]=mkChord(e,S.tri?s:a)}),S.sel.bi=n+e.ch.length-1,songChanged(!0)}function playProg(e){
(S.ptimers||[]).forEach(clearTimeout),
S.ptimers=[],e.ch.forEach(([e,t,n],a)=>S.ptimers.push(setTimeout(()=>auditionChord(mkChord(e,S.tri?n:t)),950*a)))}function placeNext(e){
const t=S.song.sections[S.sel.si],n=S.sel.bi+1;for(;t.bars.length<=n;)t.bars.push(null);t.bars[n]=e,S.sel.bi=n,persist(),renderSong(),
renderPicker(),renderInstruments()}function renderPicker(){const e=document.getElementById("picker");if(!e)return
;const t=selChord(),n=S.song.sections[S.sel.si];if(!n)return;const a=diaChords(),s=S.pick
;e.innerHTML=`<div class="card"><h2>Mesure ${S.sel.bi+1} · ${esc(n.name)} <span class="muted">${t?"· "+cnOf(t):"· vide"}</span></h2>\n   ${suggHtml(t)}\n   <div class="tr" style="margin-top:10px"><div class="seg"><button class="${S.tri?"":"on"}" data-act="tri" data-v="0">Accords de 7e</button><button class="${S.tri?"on":""}" data-act="tri" data-v="1">Triades</button></div></div>\n   <h3>Accords de la tonalité</h3><div class="chips wrap">${a.map(e=>`<button class="chip" data-act="setchord" data-s="${e.s}" data-q="${e.q}">${cnOf(e)}<small>${e.r}</small></button>`).join("")}</div>\n   <h3>Autre accord</h3><div class="chips wrap">${ROM12.map((e,t)=>`<button class="chip sm ${s.s===t?"on2":""}" data-act="pickroot" data-v="${t}">${nmN(spell(S.tonic,D_OF_S[t],t))}</button>`).join("")}</div>\n   <div class="chips wrap" style="margin-top:6px">${DQ.map(([e,t])=>`<button class="chip sm ${s.q===e?"on2":""}" data-act="pickq" data-v="${e}">${t||"maj"}</button>`).join("")}</div>\n   <div class="tr" style="margin-top:8px"><button class="btn sm" data-act="place">Placer ${nmN(spell(S.tonic,D_OF_S[s.s],s.s))}${SUF[s.q]}</button><button class="btn sm sec" data-act="clearbar">Vider la mesure</button><button class="btn sm sec" data-act="copynext">Copier sur la suivante</button></div>\n   <h3>Gamme affichée sur les instruments</h3><div class="chips">${[["1","Sûre"],["2","Modale"],["3","Avancée"]].map(([e,t])=>`<button class="chip sm ${S.level===+e?"on2":""}" data-act="level" data-v="${e}">${t}</button>`).join("")}</div></div>`
}function songChanged(e){e&&stopSong();const t=S.song.sections[S.sel.si];t?S.sel.bi>=t.bars.length&&(S.sel.bi=t.bars.length-1):S.sel={si:0,
bi:0},persist(),renderSong(),renderPicker(),renderInstruments()}function setChordAt(e){const t=S.song.sections[S.sel.si];t.bars[S.sel.bi]=e,
persist(),S.sel.bi<t.bars.length-1&&S.sel.bi++,renderSong(),renderPicker(),renderInstruments()}function auditionChord(e){if(!e)return
;const t=spell(S.tonic,e.d,e.s),n=voicingNear(t.pc,CH[e.q],62);playChordMidis([36+t.pc,...n.ms],1.2);const a=guitarPick(t,e.q)
;a&&strum(a.fr,!1,.9,.07)}const SE={"4/4":8,"3/4":6,"6/8":6},P={on:!1,i:-1,pulse:0,cur:null,avg:62,vo:null,timer:null,seq:[]}
;function voicingNear(e,t,n){let a=null;for(let s=0;s<t.length;s++){let i=t.map(t=>48+e+t);for(let e=0;e<s;e++)i.push(i.shift()+12)
;const o=i.reduce((e,t)=>e+t,0)/i.length,r=12*Math.round((n-o)/12);i=i.map(e=>e+r).sort((e,t)=>e-t);const l=o+r,c=Math.abs(l-n)
;(!a||c<a.dist)&&(a={ms:i,dist:c,avg:l})}return a}function strum(e,t,n,a){const s=ac();if(!s)return
;let i=e.map((e,t)=>null===e?null:t).filter(e=>null!==e);t&&(i=i.reverse().slice(0,4)),
i.forEach((t,i)=>tone(OPEN[t]+e[t]+12,s.currentTime+.012*i,n,a||.07))}function pianoPulse(e,t,n){const a=S.song.pstyle
;if("none"===a||!P.vo)return;const s=spell(S.tonic,e.d,e.s),i=30/S.song.bpm,o=n*i,r=36+s.pc,l=n/2,c=P.vo.ms
;if("bloc"===a)0===t&&(tone(r,void 0,.95*o,.15),c.forEach(e=>tone(e,void 0,.95*o,.1)));else if("ballade"===a)0===t&&tone(r,void 0,.5*o,.16),
t===l&&tone(r+7,void 0,.45*o,.12),t%2==0&&c.forEach(e=>tone(e,void 0,3.5*i,0===t?.1:.07));else{0!==t&&t!==l||tone(r,void 0,.5*o,.15)
;const e=c.length>3?[0,1,2,3,2,1]:[0,1,2,1];tone(c[e[t%e.length]],void 0,3*i,.1)}}function guitarPulse(e,t,n){const a=S.song.gstyle
;if("none"===a)return;const s=spell(S.tonic,e.d,e.s),i=guitarPick(s,e.q);if(!i)return;const o=S.song.sig,r=30/S.song.bpm,l=i.fr
;if("arpege"===a){const e=l.map((e,t)=>null===e?null:t).filter(e=>null!==e),n=e[[0,2,3,2][t%4]%e.length]
;return void tone(OPEN[n]+l[n]+12,void 0,4*r,.09)}
if(!("noires"===a?8===n?[0,2,4,6]:"3/4"===o?[0,2,4]:[0,3]:8===n?[0,2,3,5,6,7]:"3/4"===o?[0,2,4]:[0,3,4]).includes(t))return
;const c="6/8"===o?4===t:t%2==1;strum(l,c,3*r,c?.05:.08)}function songSeq(){const e=[];return S.song.sections.forEach((t,n)=>{
for(let a=0;a<(t.rep||1);a++)t.bars.forEach((t,a)=>e.push({si:n,bi:a,c:t}))}),e}function updSongHighlight(){
document.querySelectorAll("#panel .bar[data-si]").forEach(e=>{const t=+e.dataset.si===S.sel.si&&+e.dataset.bi===S.sel.bi
;e.classList.toggle("sel",t),e.classList.toggle("now",t&&P.on)})}function songTick(){const e=S.song,t=SE[e.sig];if(0===P.pulse){
const t=P.i+1;if(t>=P.seq.length){if(!e.loop)return void stopSong();P.i=0}else P.i=t;const n=P.seq[P.i];if(S.sel={si:n.si,bi:n.bi},n.c){
P.cur=n.c;const e=spell(S.tonic,n.c.d,n.c.s);P.vo=voicingNear(e.pc,CH[n.c.q],P.avg),P.avg=P.vo.avg}else P.cur=null;updSongHighlight(),
renderPicker(),renderInstruments()}P.cur&&(pianoPulse(P.cur,P.pulse,t),guitarPulse(P.cur,P.pulse,t)),P.pulse=(P.pulse+1)%t}
function updSongBtn(){const e=document.getElementById("splay");e&&(e.textContent=P.on?"■ Stop":"▶ Lire le morceau")}function startSong(){
stopPlay(),P.seq=songSeq(),P.seq.length&&(P.i=-1,P.pulse=0,P.cur=null,P.avg=62,P.on=!0,ac(),songTick(),
P.timer=setInterval(songTick,3e4/S.song.bpm),updSongBtn())}function stopSong(){P.on&&(P.on=!1,clearInterval(P.timer),updSongBtn(),
updSongHighlight())}function render(){renderTop(),"modes"===S.tab?renderModes():"harm"===S.tab?renderHarm():"song"===S.tab?(renderSong(),
renderPicker()):renderGrid(),renderInstruments()}function loadSongObj(e){if(stopSong(),S.song=Object.assign(newSong(),e.song),e.tonic){
const t=TON.find(t=>t.l===e.tonic[0]&&t.a===e.tonic[1]);t&&(S.tonic=t,S.dict=t)}S.sel={si:0,bi:0},persist(),render()}
document.addEventListener("click",e=>{const t=e.target.closest("[data-act]");if(!t)return;const n=t.dataset.act,a=t.dataset.v,s=t.dataset
;switch(n){case"inst":S.inst=a,render();break;case"nota":S.nota=a,render();break;case"tonic":S.tonic=TON[+a],S.dict=S.tonic,render();break
;case"tab":stopPlay(),stopSong(),S.tab=a,render();break;case"mode":S.mode=a,S.par="1"===t.dataset.par,render();break;case"fam":S.modeFam=a,
("min"===a?["dorien","eolien","phrygien","locrien"]:["lydien","ionien","mixolydien"]).includes(S.mode)||ADV.includes(S.mode)||"chrom"===S.mode||"blues"===S.mode||(S.mode="min"===a?"eolien":"ionien"),
render();break;case"circle":{const e=CIRCLE[+a];S.tonic=TON.find(t=>t.l===e.l&&t.a===e.a)||e,S.dict=S.tonic,render();break}case"keymode":
S.keyMode=a,render();break;case"keyrow":{const[e,t]=a.split(",").map(Number),n={l:e,a:t,pc:mod(NAT[e]+t,12)}
;S.tonic="min"===S.keyMode?bestTon(mod(n.pc+3,12)):TON.find(n=>n.l===e&&n.a===t)||bestTon(n.pc),render();break}case"bar":S.bar=+a,
S.playing&&(S.pulse=0,S.first=!0),highlightBars(),renderAdvisor(),renderInstruments();{const e=curGrid().chords[S.bar]
;playChordMidis(chordMidisFor(e,spell(S.tonic,e.d,e.s)),1.2)}break;case"level":S.level=+a,renderAdvisor(),renderPicker(),renderInstruments()
;break;case"listen":{const e=curGrid(),t=advise(e.chords[S.bar],e).levels[+a-1];S.level=+a,renderAdvisor(),renderInstruments(),
playScale(viewFrom(t.key,t.root,null));break}case"play":S.playing?stopPlay():startPlay();break;case"sig":S.sig=a,S.pulse=0,restartTimer(),
renderGrid();break;case"transpose":{const e=mod(S.tonic.pc+ +a,12);S.tonic=bestTon(e),S.dict=S.tonic,render();break}case"oct":S.oct=+a,
renderInstruments();break;case"staff":S.staff=!S.staff,renderInstruments();break;case"clef":S.clef=a,renderInstruments();break;case"caged":
S.caged=+a,renderInstruments();break;case"strum":S.strum=a,renderInstruments();break;case"dictroot":S.dict=TON[+a],renderInstruments();break
;case"note":tone(+a,void 0,.9,.2);break;case"diagram":{const e=a.split(",").map(Number),t=ac()
;t&&e.forEach((e,n)=>tone(e,t.currentTime+.05*n,1.4,.12));break}case"sugg":{const e=mkChord(+s.s,s.q);placeNext(e),auditionChord(e);break}
case"idea":applyProg(IDEAS[S.song.mode][+a]);break;case"ideaplay":playProg(IDEAS[S.song.mode][+a]);break;case"prog":
applyProg(PROGS[S.song.mode][+a]);break;case"progplay":playProg(PROGS[S.song.mode][+a]);break;case"invplay":
playChordMidis(a.split(",").map(Number),1.4);break;case"sbar":S.sel={si:+s.si,bi:+s.bi},updSongHighlight(),renderPicker(),
renderInstruments(),auditionChord(selChord());break;case"addbar":S.song.sections[+s.si].bars.push(null),songChanged(!0);break;case"delbar":{
const e=S.song.sections[+s.si].bars;e.length>1&&e.pop(),songChanged(!0);break}case"dupsec":{const e=S.song,t=+s.si
;e.sections.splice(t+1,0,JSON.parse(JSON.stringify(e.sections[t]))),e.sections[t+1].name+=" (copie)",songChanged(!0);break}case"delsec":{
const e=S.song;e.sections.length>1&&e.sections.splice(+s.si,1),S.sel={si:0,bi:0},songChanged(!0);break}case"addsec":S.song.sections.push({
name:"Refrain",rep:1,bars:[null,null,null,null]}),S.sel={si:S.song.sections.length-1,bi:0},songChanged(!0);break;case"smode":S.song.mode=a,
songChanged(!1);break;case"ssig":S.song.sig=a,songChanged(!0);break;case"diag":S.diag=!S.diag,renderSong(),renderPicker();break;case"loop":
S.song.loop=!S.song.loop,persist(),renderSong(),renderPicker();break;case"splay":P.on?stopSong():startSong();break;case"tri":S.tri="1"===a,
renderPicker();break;case"setchord":{const e=mkChord(+s.s,s.q);setChordAt(e),auditionChord(e);break}case"pickroot":S.pick.s=+a,
renderPicker();break;case"pickq":S.pick.q=a,renderPicker();break;case"place":{const e=mkChord(S.pick.s,S.pick.q);setChordAt(e),
auditionChord(e);break}case"clearbar":S.song.sections[S.sel.si].bars[S.sel.bi]=null,songChanged(!1);break;case"copynext":{
const e=S.song.sections[S.sel.si],t=selChord();t&&S.sel.bi<e.bars.length-1&&(e.bars[S.sel.bi+1]=JSON.parse(JSON.stringify(t)),S.sel.bi++),
songChanged(!1);break}case"ssave":{const e=lsGet("atelier-modal-songs")||{};e[S.song.name]=JSON.parse(JSON.stringify({song:S.song,
tonic:[S.tonic.l,S.tonic.a]
})),S.msg=lsSet("atelier-modal-songs",e)?"Enregistré.":"Enregistrement impossible ici : utilise la copie du texte.",renderSong(),
renderPicker();break}case"sload":{const e=document.getElementById("savesel").value,t=lsGet("atelier-modal-songs")||{}
;e&&t[e]&&validSong(t[e].song)&&loadSongObj(t[e]);break}case"sdel":{
const e=document.getElementById("savesel").value,t=lsGet("atelier-modal-songs")||{};e&&(delete t[e],lsSet("atelier-modal-songs",t),
S.msg="Supprimé.",renderSong(),renderPicker());break}case"snew":stopSong(),S.song=newSong(),S.sel={si:0,bi:0},S.msg="",songChanged(!1);break
;case"scopy":{const e=document.getElementById("exp");e.select();try{navigator.clipboard.writeText(e.value).then(()=>{
document.getElementById("smsg").textContent="Copié."}).catch(()=>{
document.getElementById("smsg").textContent="Sélectionné : copie-le avec ton clavier."})}catch(e){
document.getElementById("smsg").textContent="Sélectionné : copie-le avec ton clavier."}break}case"simport":try{
const e=JSON.parse(document.getElementById("exp").value);if(!validSong(e.song))throw 0;S.msg="Importé.",loadSongObj(e)}catch(e){
document.getElementById("smsg").textContent="Texte invalide."}break;case"listenv":playScale(curView());break;case"listenchord":{
const e=voicing(curView(),48+12*S.oct);playChordMidis(e.length?e:[],1.4);break}}}),document.addEventListener("input",e=>{const t=e.target
;return t.dataset&&"sname"===t.dataset.act?(S.song.name=t.value,
void persist()):t.dataset&&"secname"===t.dataset.act?(S.song.sections[+t.dataset.si].name=t.value,
void persist()):t.dataset&&"sbpm"===t.dataset.act?(S.song.bpm=+t.value,document.getElementById("sbpmv").textContent=t.value,persist(),
void(P.on&&(clearInterval(P.timer),P.timer=setInterval(songTick,3e4/S.song.bpm)))):void(t.dataset&&"bpm"===t.dataset.act&&(S.bpm=+t.value,
document.getElementById("bpmv").textContent=S.bpm,restartTimer()))}),document.addEventListener("change",e=>{const t=e.target
;if(t.dataset&&("gridsel"===t.dataset.act&&(S.grid=t.value,S.bar=0,S.first=!0,S.pulse=0,render()),"inv"===t.dataset.act&&(S.inv=+t.value,
renderInstruments()),"secrep"===t.dataset.act&&(S.song.sections[+t.dataset.si].rep=+t.value,songChanged(!0)),
"pstyle"===t.dataset.act&&(S.song.pstyle=t.value,persist()),"gstyle"===t.dataset.act&&(S.song.gstyle=t.value,persist()),
"impgrid"===t.dataset.act&&t.value)){const e=GRIDS.find(e=>e.id===t.value);S.song.sections[+t.dataset.si].bars=e.chords.map(e=>({d:e.d,
s:e.s,q:e.q,r:e.r})),S.song.mode=e.mode,S.sel={si:+t.dataset.si,bi:0},songChanged(!0)}}),render(),
"serviceWorker"in navigator&&/^https?:/.test(location.protocol)&&window.addEventListener("load",()=>{try{
navigator.serviceWorker.register("sw.js").catch(()=>{})}catch(e){}});
