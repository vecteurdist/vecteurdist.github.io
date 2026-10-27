/* VECTEURDIST — application mobile (PWA) */
(function(){
"use strict";
const CFG = Object.assign({
  checkoutApi: "",                 // URL du service de paiement SumUp (Cloudflare Worker). Vide = paiement au retrait.
  whatsapp: "262693040085",
  phone: "06 93 04 00 85",
  email: "vecteurdist@zohomail.com",
  store: "https://vecteurdist.sumupstore.com",
  address: "115 avenue du Président Jacques Chirac, 97640 Sada, Mayotte"
}, window.VD_CONFIG || {});

const CAT_ICON = {"Outillage":"🔨","Téléphonie":"📱","High-Tech":"🔊","Peinture":"🪣","Quincaillerie":"🔩","Matériaux":"🧱","Plomberie & sanitaire":"🚽"};
const KIT_IDS = ["clips-pour-croisillons-autonivelants-carrelage-joint-1-5-mm-sachet","clips-pour-croisillons-autonivelants-carrelage-joint-2-mm-sachet-de-100","pince-de-serrage-pour-croisillons-autonivelants","cales-de-carrelage-biseautees-rouges-sachet"];
const HOURS = [["Lundi","8h–12h · 14h–17h"],["Mardi","8h–12h · 14h–17h"],["Mercredi","8h–12h · 14h–17h"],["Jeudi","8h–12h · 14h–17h"],["Vendredi","14h–17h"],["Samedi","8h–12h · 14h–17h"],["Dimanche","8h–12h"]];

const $ = (s, el=document) => el.querySelector(s);
const eur = n => n.toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let CATALOG = [], byId = {}, state = {cat:"Tous", q:""};

/* ---------- panier (stocké sur le téléphone) ---------- */
const store = {
  get(){ try { return JSON.parse(localStorage.getItem("vd_cart")||"{}"); } catch(e){ return {}; } },
  set(c){ try { localStorage.setItem("vd_cart", JSON.stringify(c)); } catch(e){} memCart = c; }
};
let memCart = store.get();
const cart = () => memCart;
function addToCart(id, n=1){ const c={...cart()}; c[id]=(c[id]||0)+n; if(c[id]<=0) delete c[id]; store.set(c); badge(); }
function cartLines(){ return Object.entries(cart()).filter(([id])=>byId[id]).map(([id,q])=>({p:byId[id],q})); }
function cartTotal(){ return cartLines().reduce((s,l)=>s+l.p.price*l.q,0); }
function cartCount(){ return cartLines().reduce((s,l)=>s+l.q,0); }
function badge(){ const n=cartCount(); $("#cartN").textContent=n; $("#cartN").hidden = n===0; }

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("on"); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("on"),1800); }

function thumb(p, cls=""){
  return p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" class="${cls}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ico',textContent:'${CAT_ICON[p.cat]||"📦"}'}))">`
               : `<span class="ico">${CAT_ICON[p.cat]||"📦"}</span>`;
}
function card(p){
  return `<article class="p">
    <button class="ph" data-open="${esc(p.id)}" aria-label="Voir ${esc(p.name)}" style="border:0;padding:0">${thumb(p)}</button>
    <div class="bd"><div class="nm">${esc(p.name)}</div>
      <div class="ft"><span class="price">${eur(p.price)}</span>
      ${p.stock ? `<button class="add" data-add="${esc(p.id)}" aria-label="Ajouter au panier">+</button>` : `<span class="oos">Épuisé</span>`}</div></div></article>`;
}

/* ---------- écrans ---------- */
const VIEWS = {
  accueil(){
    const kit = KIT_IDS.map(id=>byId[id]).filter(Boolean);
    const brouette = CATALOG.find(p=>p.id.startsWith("brouette"));
    const PRIO=["clips-pour-croisillons-autonivelants-carrelage-joint-2-mm-sachet-de-100","pince-de-serrage-pour-croisillons-autonivelants","jeu-de-9-cles-torx-longues-t10-a-t50-jin-shi","marteau-de-coffreur-1","cales-de-carrelage-biseautees-rouges-sachet","enceinte-bluetooth-jbl-go-4-etanche"]; const photo = PRIO.map(id=>byId[id]).filter(p=>p&&p.stock);
    return `<section class="hero"><h1>Tout pour vos chantiers à Mayotte</h1>
      <p>Commandez dans l'appli, payez, et retirez gratuitement au magasin de Sada.</p>
      <a class="btn" href="#catalogue">Voir le catalogue</a></section>
      <h2>Offres du moment</h2>
      <div class="promos">
        ${kit.length?`<a class="promo" href="#kit" style="text-decoration:none;color:inherit">${thumb(kit[0])}<div><span class="badge">KIT CARRELAGE</span><h3>Carrelage parfaitement plat</h3><p>Clips 1,5 et 2 mm, pince, cales : tout le système autonivelant.</p></div></a>`:""}
        ${brouette?`<button class="promo" data-open="${esc(brouette.id)}" style="text-align:left;font:inherit;color:inherit">${thumb(brouette)}<div><span class="badge">SPÉCIAL CHANTIER</span><h3>Brouette 90 L — ${eur(brouette.price)}</h3><p>79,90 € l'unité dès 3 achetées, au magasin.</p></div></button>`:""}
      </div>
      <h2>À découvrir</h2><div class="grid">${photo.map(card).join("")}</div>`;
  },
  kit(){
    const kit = KIT_IDS.map(id=>byId[id]).filter(Boolean);
    return `<h2>Kit carrelage autonivelant</h2><p class="muted">Pour un carrelage sans décalage entre les carreaux. Calculez vos quantités dans l'onglet <a href="#calcul">Calcul</a>.</p>
      <div class="grid">${kit.map(card).join("")}</div>
      <p><button class="btn block" data-addall="1">Ajouter tout le kit au panier</button></p>`;
  },
  catalogue(){
    const cats = ["Tous", ...Object.entries(CATALOG.reduce((m,p)=>(m[p.cat]=(m[p.cat]||0)+1,m),{})).sort((a,b)=>b[1]-a[1]).map(x=>x[0])];
    const q = state.q.trim().toLowerCase();
    const list = CATALOG.filter(p=>(state.cat==="Tous"||p.cat===state.cat) && (!q || p.name.toLowerCase().includes(q)))
      .sort((a,b)=>(b.stock-a.stock)||(!!b.img-!!a.img));
    return `<h2>Catalogue</h2>
      <input class="search" id="q" type="search" placeholder="Rechercher un produit…" value="${esc(state.q)}" aria-label="Rechercher">
      <div class="chips" role="toolbar">${cats.map(c=>`<button class="chip" data-cat="${esc(c)}" aria-pressed="${c===state.cat}">${CAT_ICON[c]?CAT_ICON[c]+" ":""}${esc(c)}</button>`).join("")}</div>
      <div class="grid" id="results">${list.length?list.map(card).join(""):`<div class="empty">Aucun produit trouvé.</div>`}</div>`;
  },
  panier(){
    const lines = cartLines();
    if(!lines.length) return `<h2>Mon panier</h2><div class="empty">Votre panier est vide.<br><br><a class="btn" href="#catalogue">Voir le catalogue</a></div>`;
    const online = !!CFG.checkoutApi;
    return `<h2>Mon panier</h2><div class="list">${lines.map(({p,q})=>`
      <div class="line">${thumb(p)}<div class="t">${esc(p.name)}<div class="muted">${eur(p.price)}</div></div>
        <div class="qty"><button data-dec="${esc(p.id)}" aria-label="Moins">−</button><span>${q}</span><button data-inc="${esc(p.id)}" aria-label="Plus">+</button></div></div>`).join("")}</div>
      <div class="total"><span>Total</span><b>${eur(cartTotal())}</b></div>
      <form class="form" id="checkout" novalidate>
        <label>Nom et prénom<input id="cName" name="name" autocomplete="name" required></label>
        <label>Téléphone<input id="cPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="06 39 …"></label>
        <label>Paiement
          <select id="cPay" name="pay">
            ${online?`<option value="card">Carte bancaire maintenant (paiement sécurisé SumUp)</option>`:""}
            <option value="pickup">Au retrait en magasin (espèces ou carte)</option>
          </select></label>
        <div class="note">📍 Retrait gratuit au magasin de Sada. Nous vous appelons dès que la commande est prête.</div>
        <button class="btn block" type="submit">${online?"Valider et payer":"Envoyer ma commande"}</button>
      </form>`;
  },
  calcul(){
    return `<h2>Calculateur carrelage</h2><p class="muted">Estimez le nombre de carreaux et de croisillons autonivelants pour votre pièce.</p>
      <form class="form card" id="calc">
        <label>Surface à carreler (m²)<input id="kS" type="number" min="1" step="0.5" value="20" inputmode="decimal"></label>
        <label>Format des carreaux
          <select id="kF"><option value="30x30">30 × 30 cm</option><option value="45x45">45 × 45 cm</option><option value="60x60" selected>60 × 60 cm</option><option value="60x120">60 × 120 cm</option><option value="80x80">80 × 80 cm</option></select></label>
        <label>Joint<select id="kJ"><option value="1.5">1,5 mm</option><option value="2" selected>2 mm</option></select></label>
      </form>
      <div class="res" id="kRes"></div>
      <p class="note">Estimation : environ un clip tous les 30 cm sur les bords des carreaux, avec 10 % de carreaux en plus pour les coupes. Les cales sont réutilisables : un sachet suffit pour avancer pièce par pièce.</p>
      <button class="btn block" id="kAdd">Ajouter les clips et la pince au panier</button>`;
  },
  magasin(){
    const d = new Date().getDay(); const idx = (d+6)%7;
    return `<h2>Le magasin</h2>
      <div class="card"><dl class="kv">
        <dt>Adresse</dt><dd>${esc(CFG.address)}</dd>
        <dt>Téléphone</dt><dd><a href="tel:+262${CFG.phone.replace(/\D/g,'').slice(1)}">${esc(CFG.phone)}</a></dd>
        <dt>E-mail</dt><dd style="word-break:break-all">${esc(CFG.email)}</dd></dl>
        <div class="actions">
          <a class="btn" href="https://wa.me/${CFG.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn dark" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CFG.address)}" target="_blank" rel="noopener">Itinéraire</a>
        </div></div>
      <h2>Horaires</h2><div class="card"><dl class="kv">${HOURS.map((h,i)=>`<dt${i===idx?' style="color:var(--orange);font-weight:800"':''}>${h[0]}</dt><dd>${h[1]}</dd>`).join("")}</dl></div>
      <p class="muted" style="font-size:12.5px;margin-top:16px">VECTEURDIST SAS · RCS Mamoudzou 944 040 351</p>`;
  }
};

function render(){
  const v = (location.hash.replace("#","")||"accueil");
  const view = VIEWS[v] ? v : "accueil";
  $("#view").innerHTML = VIEWS[view]();
  document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-current", b.dataset.go===(view==="kit"?"accueil":view)?"page":"false"));
  if(view==="calcul") calc();
  if(view==="panier") afterPay();
  window.scrollTo(0,0);
}

/* ---------- calculateur ---------- */
function calc(){
  const S = Math.max(0, parseFloat($("#kS").value)||0);
  const [w,h] = $("#kF").value.split("x").map(Number);
  const tiles = Math.ceil(S / (w*h/10000) * 1.10);
  const clipsPerTile = Math.ceil(w/30) + Math.ceil(h/30);
  const clips = Math.ceil(S / (w*h/10000)) * clipsPerTile;
  const joint = $("#kJ").value;
  const sachets = joint==="2" ? Math.ceil(clips/100) : null;
  $("#kRes").innerHTML = `<div><b>${tiles}</b><span>carreaux (+10 %)</span></div><div><b>${clips}</b><span>clips à prévoir</span></div>
    <div><b>${sachets ?? "—"}</b><span>${sachets!==null?"sachets de 100 clips (2 mm)":"sachets : voir en magasin (1,5 mm)"}</span></div><div><b>1</b><span>pince de serrage</span></div>`;
  $("#kAdd").dataset.clips = joint; $("#kAdd").dataset.n = sachets||1;
}

/* ---------- commande ---------- */
async function checkout(e){
  e.preventDefault();
  const name=$("#cName").value.trim(), phone=$("#cPhone").value.trim(), pay=$("#cPay").value;
  if(name.length<2 || phone.replace(/\D/g,"").length<9){ toast("Indiquez votre nom et votre téléphone"); return; }
  const lines = cartLines();
  if(pay==="card" && CFG.checkoutApi){
    const btn = e.submitter; if(btn){ btn.disabled = true; btn.textContent = "Connexion au paiement…"; }
    try{
      const r = await fetch(CFG.checkoutApi, {method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({customer:{name,phone}, items: lines.map(l=>({id:l.p.id,qty:l.q})), returnUrl: location.origin+location.pathname+"#panier"})});
      const j = await r.json();
      if(!r.ok || !j.url) throw new Error(j.error||"Paiement indisponible");
      try{ localStorage.setItem("vd_pending", JSON.stringify({ref:j.reference, total:cartTotal()})); }catch(_){}
      location.href = j.url;
    }catch(err){ toast("Paiement indisponible, réessayez ou payez au retrait"); if(btn){btn.disabled=false; btn.textContent="Valider et payer";} }
    return;
  }
  const msg = `Bonjour VECTEURDIST, je souhaite commander (retrait à Sada) :\n` +
    lines.map(l=>`• ${l.q} × ${l.p.name} — ${eur(l.p.price*l.q)}`).join("\n") +
    `\nTotal : ${eur(cartTotal())}\nNom : ${name}\nTél : ${phone}\nPaiement au retrait.`;
  window.open(`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  toast("Commande préparée dans WhatsApp : envoyez le message");
}
function afterPay(){
  const p = new URLSearchParams(location.search);
  if(p.get("paid")){ store.set({}); badge(); $("#view").insertAdjacentHTML("afterbegin", `<div class="card" style="border-left:5px solid var(--ok);margin-top:12px"><b>Paiement reçu, merci !</b><br><span class="muted">Commande ${esc(p.get("paid"))}. Nous vous appelons dès qu'elle est prête au magasin de Sada.</span></div>`); history.replaceState(null,"",location.pathname+"#panier"); }
  else if(p.get("unpaid")){ $("#view").insertAdjacentHTML("afterbegin", `<div class="card" style="border-left:5px solid var(--warn);margin-top:12px"><b>Paiement non finalisé</b><br><span class="muted">Votre panier est conservé. Vous pouvez réessayer ou choisir le paiement au retrait.</span></div>`); history.replaceState(null,"",location.pathname+"#panier"); }
}

/* ---------- fiche produit ---------- */
function openProduct(id){
  const p = byId[id]; if(!p) return;
  const s = document.createElement("div"); s.className="sheet"; s.setAttribute("role","dialog"); s.setAttribute("aria-label",p.name);
  s.innerHTML = `<div class="in">${p.img?`<img src="${esc(p.img)}" alt="">`:`<div style="font-size:72px;text-align:center">${CAT_ICON[p.cat]||"📦"}</div>`}
    <p class="muted" style="margin:12px 0 4px">${esc(p.cat)}</p><h2 style="margin:0 0 8px">${esc(p.name)}</h2>
    <div class="price" style="font-size:26px">${eur(p.price)}</div>
    <p class="muted">${p.stock?"En stock · retrait gratuit à Sada":"Épuisé pour le moment"}</p>
    <div class="actions">${p.stock?`<button class="btn" data-add="${esc(p.id)}" data-close="1">Ajouter au panier</button>`:`<a class="btn" href="https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent("Bonjour, quand aurez-vous à nouveau : "+p.name+" ?")}" target="_blank" rel="noopener">Me prévenir</a>`}
    <button class="btn ghost" data-close="1">Fermer</button></div></div>`;
  s.addEventListener("click", ev=>{ if(ev.target===s || ev.target.closest("[data-close]")) setTimeout(()=>s.remove(),0); });
  document.body.appendChild(s);
}

/* ---------- événements ---------- */
document.addEventListener("click", e=>{
  const t = e.target.closest("[data-add],[data-open],[data-cat],[data-inc],[data-dec],[data-go],[data-addall],#kAdd");
  if(!t) return;
  if(t.dataset.add){ addToCart(t.dataset.add); toast("Ajouté au panier"); }
  else if(t.dataset.open){ openProduct(t.dataset.open); }
  else if(t.dataset.cat){ state.cat=t.dataset.cat; render(); }
  else if(t.dataset.inc){ addToCart(t.dataset.inc,1); render(); }
  else if(t.dataset.dec){ addToCart(t.dataset.dec,-1); render(); }
  else if(t.dataset.go){ location.hash = t.dataset.go; }
  else if(t.dataset.addall){ KIT_IDS.forEach(id=>byId[id]&&byId[id].stock&&addToCart(id)); toast("Kit ajouté au panier"); }
  else if(t.id==="kAdd"){ const id = t.dataset.clips==="2"?KIT_IDS[1]:KIT_IDS[0]; addToCart(id, +t.dataset.n||1); addToCart(KIT_IDS[2],1); toast("Ajouté au panier"); }
});
document.addEventListener("input", e=>{
  if(e.target.id==="q"){ state.q=e.target.value; const pos=e.target.selectionStart; render(); const q=$("#q"); q.focus(); q.setSelectionRange(pos,pos); }
  if(["kS","kF","kJ"].includes(e.target.id)) calc();
});
document.addEventListener("change", e=>{ if(["kF","kJ"].includes(e.target.id)) calc(); });
document.addEventListener("submit", e=>{ if(e.target.id==="checkout") checkout(e); if(e.target.id==="calc") e.preventDefault(); });
window.addEventListener("hashchange", render);

fetch("catalog.json").then(r=>r.json()).then(list=>{
  CATALOG = list; byId = Object.fromEntries(list.map(p=>[p.id,p])); badge(); render();
}).catch(()=>{ $("#view").innerHTML = `<div class="empty">Impossible de charger le catalogue. Vérifiez votre connexion.</div>`; });

if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
