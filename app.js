/* VECTEURDIST — application mobile (PWA) */
(function(){
"use strict";
const CFG = Object.assign({
  checkoutApi: "",                 // URL du service de paiement SumUp (Cloudflare Worker). Vide = paiement au retrait.
  whatsapp: "262693040085",
  phone: "06 93 04 00 85",
  email: "vecteurdist@zohomail.com",
  store: "https://vecteurdist.sumupstore.com",
  address: "115 avenue du Président Jacques Chirac, 97640 Sada, Mayotte",
  director: "Youssouf SAID",            // À VÉRIFIER : nom du Président
  mediator: "à compléter (nom et site du médiateur choisi)"   // À COMPLÉTER après adhésion à un médiateur
}, window.VD_CONFIG || {});

const CAT_ICON = {"Outillage":"🔨","Téléphonie":"📱","High-Tech":"🔊","Peinture":"🪣","Quincaillerie":"🔩","Matériaux":"🧱","Plomberie & sanitaire":"🚽"};
const KIT_IDS = ["clips-pour-croisillons-autonivelants-carrelage-joint-1-5-mm-sachet","clips-pour-croisillons-autonivelants-carrelage-joint-2-mm-sachet-de-100","pince-de-serrage-pour-croisillons-autonivelants","cales-de-carrelage-biseautees-rouges-sachet"];
const HOURS = [["Lundi","8h–12h · 14h–17h"],["Mardi","8h–12h · 14h–17h"],["Mercredi","8h–12h · 14h–17h"],["Jeudi","8h–12h · 14h–17h"],["Vendredi","14h–17h"],["Samedi","8h–12h · 14h–17h"],["Dimanche","8h–12h"]];

const $ = (s, el=document) => el.querySelector(s);
const eur = n => (Number(n)||0).toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
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
  return p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" class="${cls}" data-ico="${CAT_ICON[p.cat]||"📦"}">`
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
        ${brouette?`<button class="promo" data-open="${esc(brouette.id)}" style="text-align:left;font:inherit;color:inherit">${thumb(brouette)}<div><span class="badge">SPÉCIAL CHANTIER</span><h3>Brouette 90 L — ${eur(brouette.price)}</h3><p>79,90 € l'unité dès 3 achetées : offre valable uniquement au magasin, non appliquée au paiement en ligne.</p></div></button>`:""}
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
    if(!lines.length) return `<h2>Mon panier</h2><div class="empty">Votre panier est vide.<br><br><a class="btn" href="#catalogue">Voir le catalogue</a></div>` + ordersHtml();
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
        <label style="display:flex;gap:10px;align-items:flex-start;font-weight:500"><input type="checkbox" id="cCgv" required style="width:auto;margin-top:3px"> <span>J'accepte les <a href="#infos">conditions générales de vente</a> et la <a href="#infos">politique de confidentialité</a>.</span></label>
        <button class="btn block" type="submit">Commander avec obligation de paiement</button>
      </form>` + ordersHtml();
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
      <p class="muted" style="font-size:12.5px;margin-top:16px">VECTEURDIST SAS · RCS Mamoudzou 944 040 351 · <a href="#infos">Mentions légales, CGV et confidentialité</a></p>`;
  },
  vendeur(){
    return `<h2>Espace vendeur · retrait</h2>
      <p class="muted">Scannez le QR code du client. Le paiement est vérifié en direct auprès de SumUp.</p>
      <div class="card scan">
        <video id="vVideo" playsinline muted hidden></video>
        <button class="btn block" id="vStart">📷 Activer la caméra</button>
        <form class="form" id="vManual" style="margin-top:12px"><label>Ou saisir la référence<input id="vRef" placeholder="VD-XXXXXXXX-XXXX" autocapitalize="characters" autocomplete="off"></label>
        <button class="btn dark block" type="submit">Vérifier</button></form>
      </div>
      <div id="vResult"></div>
      <p class="muted" style="font-size:12.5px;margin-top:14px">Les retraits marqués sont enregistrés sur ce téléphone uniquement.</p>`;
  },
  infos(){
    return `<h2>Informations légales</h2>
      <div class="card legal">
      <h3>Mentions légales</h3>
      <p><b>Éditeur :</b> VECTEURDIST SAS, société par actions simplifiée à associé unique au capital de 100 €, immatriculée au RCS de Mamoudzou sous le n° 944 040 351. Siège : ${esc(CFG.address)}. Téléphone : ${esc(CFG.phone)}. E-mail : ${esc(CFG.email)}.</p>
      <p><b>Directeur de la publication :</b> ${esc(CFG.director)}, Président de VECTEURDIST SAS.</p>
      <p><b>Hébergement :</b> application hébergée par GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (github.com) ; service de paiement hébergé par Cloudflare Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis (cloudflare.com).</p>
      <p><b>Paiement :</b> les paiements par carte sont traités par SumUp. VECTEURDIST n'a jamais accès à vos numéros de carte.</p>

      <h3>Conditions générales de vente</h3>
      <p><b>1. Champ d'application.</b> Les présentes conditions s'appliquent aux commandes passées à distance via l'application VECTEURDIST (paiement par carte en ligne, ou commande transmise par WhatsApp et payée au retrait), avec retrait au magasin de Sada.</p>
      <p><b>2. Prix.</b> Les prix sont indiqués en euros, toutes taxes locales comprises (dont l'octroi de mer le cas échéant). TVA non applicable, article 294 du Code général des impôts (Mayotte). Le prix appliqué est celui affiché au moment de la commande. Les offres signalées « au magasin » ne s'appliquent pas aux commandes en ligne.</p>
      <p><b>3. Commande et paiement.</b> En cliquant sur « Commander avec obligation de paiement », vous passez une commande ferme. Le paiement par carte est réalisé sur la page sécurisée de SumUp ; la commande est confirmée dès que SumUp confirme le paiement. Pour le paiement au retrait, la commande est confirmée par notre appel. Si un article se révèle indisponible, nous vous proposons un remplacement ou le remboursement intégral sous 14 jours.</p>
      <p><b>4. Retrait.</b> Les articles sont à retirer gratuitement au magasin aux horaires d'ouverture, après notre appel de confirmation, sur présentation de la référence de commande. Aucune livraison n'est assurée pour le moment.</p>
      <p><b>5. Droit de rétractation.</b> Vous disposez de 14 jours à compter du retrait des articles pour exercer votre droit de rétractation, sans avoir à motiver votre décision (articles L.221-18 et suivants du Code de la consommation). Il suffit de nous adresser une déclaration claire (par e-mail à ${esc(CFG.email)}, par courrier ou au magasin), par exemple avec le modèle ci-dessous. Vous rapportez les articles au magasin dans les 14 jours suivant votre décision ; les frais de retour sont à votre charge. Nous vous remboursons la totalité des sommes versées dans les 14 jours suivant votre décision, par le même moyen de paiement ; nous pouvons différer le remboursement jusqu'à la récupération des articles. Votre responsabilité n'est engagée qu'en cas de dépréciation des articles résultant de manipulations autres que celles nécessaires pour en établir la nature, les caractéristiques et le bon fonctionnement.</p>
      <p><b>Exceptions (article L.221-28) :</b> le droit de rétractation ne s'applique pas notamment aux biens confectionnés selon vos spécifications ou nettement personnalisés (ex. peinture teintée à la demande, découpe sur mesure), aux biens descellés après la livraison qui ne peuvent être renvoyés pour des raisons d'hygiène ou de protection de la santé, et aux enregistrements ou logiciels descellés.</p>
      <p><b>Modèle de formulaire de rétractation :</b> « À l'attention de VECTEURDIST SAS, ${esc(CFG.address)}, ${esc(CFG.email)} : je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous : [article], commandé le [date] / retiré le [date], référence [VD-…]. Nom du consommateur : … Adresse : … Date et signature (si envoi papier). »</p>
      <p><b>6. Garantie légale de conformité.</b> Le consommateur dispose d'un délai de deux ans à compter de la délivrance du bien pour obtenir la mise en œuvre de la garantie légale de conformité en cas d'apparition d'un défaut de conformité. Durant ce délai, il n'est tenu d'établir que l'existence du défaut et non la date de son apparition. La garantie légale de conformité donne au consommateur droit à la réparation ou au remplacement du bien dans un délai de trente jours suivant sa demande, sans frais et sans inconvénient majeur pour lui. Il peut obtenir une réduction du prix en conservant le bien ou mettre fin au contrat en se faisant rembourser intégralement contre restitution du bien si le vendeur refuse la réparation ou le remplacement, si la réparation ou le remplacement intervient après trente jours, ou si un nouveau défaut apparaît. La garantie légale de conformité s'applique sans préjudice de la garantie des vices cachés (articles 1641 à 1649 du Code civil). Le vendeur qui fait obstacle de mauvaise foi à la garantie légale de conformité encourt une amende civile d'un montant maximal de 300 000 € (articles L.217-1 à L.217-32 et L.241-5 du Code de la consommation).</p>
      <p><b>7. Réclamations et médiation.</b> Contactez-nous d'abord au ${esc(CFG.phone)} ou à ${esc(CFG.email)}. En cas de litige non résolu, vous pouvez recourir gratuitement au médiateur de la consommation : ${esc(CFG.mediator)}. Droit applicable : droit français.</p>

      <h3>Politique de confidentialité</h3>
      <p><b>Responsable :</b> VECTEURDIST SAS (coordonnées ci-dessus).</p>
      <p><b>Données et finalité :</b> nom, numéro de téléphone et contenu de la commande, uniquement pour traiter votre commande et vous prévenir quand elle est prête. Base légale : l'exécution du contrat de vente.</p>
      <p><b>Destinataires :</b> VECTEURDIST ; SumUp pour les paiements par carte ; WhatsApp (Meta) si vous choisissez d'envoyer votre commande par WhatsApp ; nos hébergeurs techniques (GitHub, Cloudflare). Certains de ces prestataires peuvent traiter des données hors de l'Union européenne, avec les garanties prévues par le RGPD (Data Privacy Framework ou clauses contractuelles types). Le panier est conservé seulement sur votre téléphone. Aucune donnée n'est vendue ni utilisée à des fins publicitaires.</p>
      <p><b>Durée de conservation :</b> 3 ans après votre dernière commande pour la relation client ; 10 ans pour les pièces comptables (obligation légale).</p>
      <p><b>Vos droits :</b> accès, rectification, effacement, limitation et opposition, en écrivant à ${esc(CFG.email)}. Vous pouvez introduire une réclamation auprès de la CNIL (cnil.fr).</p>
      <p class="muted" style="font-size:12.5px">Dernière mise à jour : 27 octobre 2026.</p>
      </div>`;
  }
};

function render(){
  const v = (location.hash.replace("#","").split("?")[0]||"accueil");
  const view = Object.prototype.hasOwnProperty.call(VIEWS, v) ? v : "accueil";
  stopScanner();
  $("#view").innerHTML = VIEWS[view]();
  document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-current", b.dataset.go===(view==="kit"?"accueil":view)?"page":"false"));
  if(view==="calcul") calc();
  if(view==="panier") afterPay();
  if(view==="vendeur") initVendeur();
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
  if(!$("#cCgv").checked){ toast("Merci d'accepter les conditions de vente"); return; }
  const lines = cartLines();
  if(pay==="card" && CFG.checkoutApi){
    const btn = e.submitter; if(btn){ btn.disabled = true; btn.textContent = "Connexion au paiement…"; }
    try{
      const r = await fetch(CFG.checkoutApi, {method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({customer:{name,phone}, items: lines.map(l=>({id:l.p.id,qty:l.q})), returnUrl: location.origin+location.pathname+"#panier"})});
      const j = await r.json();
      if(!r.ok || !j.url) throw new Error(j.error||"Paiement indisponible");
      try{ localStorage.setItem("vd_pending", JSON.stringify({ref:j.reference, total:j.total||cartTotal(), date:Date.now(), lines:lines.map(l=>`${l.q} × ${l.p.name}`)})); }catch(_){}
      location.href = j.url;
    }catch(err){ toast("Paiement indisponible, réessayez ou payez au retrait"); if(btn){btn.disabled=false; btn.textContent="Commander avec obligation de paiement";} }
    return;
  }
  const msg = `Bonjour VECTEURDIST, je souhaite commander (retrait à Sada) :\n` +
    lines.map(l=>`• ${l.q} × ${l.p.name} — ${eur(l.p.price*l.q)}`).join("\n") +
    `\nTotal : ${eur(cartTotal())}\nNom : ${name}\nTél : ${phone}\nPaiement au retrait.`;
  window.open(`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  toast("Commande préparée dans WhatsApp : envoyez le message");
}
function payNote(kind, title, text){
  const color = kind==="ok"?"var(--ok)":"var(--warn)";
  const old = $("#payNote"); if(old) old.remove();
  $("#view").insertAdjacentHTML("afterbegin", `<div class="card" id="payNote" style="border-left:5px solid ${color};margin-top:12px"><b>${esc(title)}</b><br><span class="muted">${esc(text)}</span></div>`);
}
function getPending(){ try{ return JSON.parse(localStorage.getItem("vd_pending")||"null"); }catch(_){ return null; } }
function clearPending(){ try{ localStorage.removeItem("vd_pending"); }catch(_){} }
async function payStatus(ref){
  if(!CFG.checkoutApi || !/^VD-[A-Z0-9]{6,12}-[A-Z0-9]{4}$/.test(ref)) return "UNKNOWN";
  try{ const r = await fetch(CFG.checkoutApi.replace(/\/?$/,"/")+"status?ref="+encodeURIComponent(ref)); const j = await r.json(); return j.status||"UNKNOWN"; }catch(_){ return "UNKNOWN"; }
}
// La confirmation n'est jamais crue sur parole : on redemande toujours le statut à SumUp via le service
// Paramètres de retour SumUp, qu'ils soient avant (?paid=…#panier) ou après le hash (#panier?paid=…)
function returnParams(){
  const p = new URLSearchParams(location.search);
  const h = location.hash.indexOf("?");
  if(h>=0) new URLSearchParams(location.hash.slice(h+1)).forEach((v,k)=>p.set(k,v));
  return p;
}
async function afterPay(){
  const p = returnParams();
  const pend = getPending();
  const ref = p.get("paid") || p.get("pending") || p.get("unpaid") || (pend && pend.ref) || "";
  if(p.toString()) history.replaceState(null,"",location.pathname+"#panier");
  if(!ref) return;
  payNote("wait", "Vérification du paiement…", "Un instant, nous interrogeons SumUp.");
  // Juste après le paiement SumUp répond souvent PENDING quelques secondes : on redemande (≈30 s max)
  let st = await payStatus(ref);
  for(let i=0; i<10 && (st==="PENDING" || st==="UNKNOWN"); i++){
    await new Promise(r=>setTimeout(r,3000));
    if(location.hash!=="#panier") return;
    st = await payStatus(ref);
  }
  if(st==="PAID"){
    saveOrder(pend && pend.ref===ref ? pend : {ref});
    clearPending(); store.set({}); badge();
    if(location.hash==="#panier") render();
    payNote("ok", "Paiement confirmé, merci !", `Commande ${ref}. Nous vous appelons dès qu'elle est prête. Présentez le QR code ci-dessous au magasin de Sada.`);
  } else if(st==="PENDING"){
    payNote("wait", "Paiement en cours de vérification", `Commande ${ref}. Si vous avez payé, nous vous appelons pour confirmer. Ne repayez pas cette commande.`);
  } else if(st==="FAILED" || st==="EXPIRED"){
    clearPending();
    payNote("wait", "Paiement non finalisé", "Votre panier est conservé. Vous pouvez réessayer ou choisir le paiement au retrait.");
  } else if(p.toString()){
    payNote("wait", "Paiement en cours de vérification", "Nous n'avons pas encore la confirmation de SumUp. Si vous avez payé, nous vous appelons.");
  } else { const n=$("#payNote"); if(n) n.remove(); }
}

/* ---------- QR code de retrait (client) ---------- */
const REF_OK = r => /^VD-[A-Z0-9]{6,12}-[A-Z0-9]{4}$/.test(r);
function getOrders(){ try{ const o=JSON.parse(localStorage.getItem("vd_orders")||"[]"); return Array.isArray(o)?o.filter(x=>x&&REF_OK(x.ref)):[]; }catch(_){ return []; } }
function saveOrder(o){
  if(!o || !REF_OK(o.ref)) return;
  const list = getOrders().filter(x=>x.ref!==o.ref);
  list.unshift({ref:o.ref, total:Number(o.total)||null, date:o.date||Date.now(), lines:Array.isArray(o.lines)?o.lines.slice(0,30).map(String):[]});
  try{ localStorage.setItem("vd_orders", JSON.stringify(list.slice(0,10))); }catch(_){}
}
function qrSvg(text){
  if(typeof qrcode!=="function") return "";
  const q = qrcode(0,"M"); q.addData(text); q.make();
  return q.createSvgTag({cellSize:6, margin:4, scalable:true});
}
function ordersHtml(){
  const orders = getOrders();
  if(!orders.length) return "";
  return `<h2>Mes commandes payées</h2><p class="muted">Présentez le QR code au magasin pour retirer votre commande.</p>
    <div class="list">${orders.map(o=>`<div class="card order">
      <div class="qr">${qrSvg("VDCMD:"+o.ref)}</div>
      <div><b>${esc(o.ref)}</b><div class="muted">${new Date(o.date).toLocaleDateString("fr-FR")}${o.total?` · ${eur(o.total)}`:""}</div>
      ${o.lines.length?`<ul>${o.lines.map(l=>`<li>${esc(l)}</li>`).join("")}</ul>`:""}</div></div>`).join("")}</div>`;
}

/* ---------- espace vendeur : lecture du QR ---------- */
let scan = null;
function stopScanner(){ if(scan){ scan.stop=true; if(scan.stream) scan.stream.getTracks().forEach(t=>t.stop()); scan=null; } }
function getRetires(){ try{ return JSON.parse(localStorage.getItem("vd_retires")||"{}")||{}; }catch(_){ return {}; } }
function loadJsQR(){ return window.jsQR ? Promise.resolve() : new Promise((ok,ko)=>{ const s=document.createElement("script"); s.src="jsqr.js?v=1"; s.onload=ok; s.onerror=ko; document.head.appendChild(s); }); }
function initVendeur(){
  $("#vStart").addEventListener("click", startScanner);
  $("#vManual").addEventListener("submit", e=>{ e.preventDefault(); checkRef($("#vRef").value.trim().toUpperCase()); });
}
async function startScanner(){
  const v = $("#vVideo"), btn = $("#vStart");
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}, audio:false});
    stopScanner(); scan = {stream, stop:false};
    v.srcObject = stream; v.hidden = false; await v.play(); btn.hidden = true;
    const useNative = "BarcodeDetector" in window && (await BarcodeDetector.getSupportedFormats().catch(()=>[])).includes("qr_code");
    const det = useNative ? new BarcodeDetector({formats:["qr_code"]}) : null;
    if(!det) await loadJsQR();
    const c = document.createElement("canvas"), ctx = c.getContext("2d", {willReadFrequently:true});
    const me = scan;
    const tick = async ()=>{
      if(me.stop) return;
      if(v.readyState >= 2){
        let txt = null;
        if(det){ const r = await det.detect(v).catch(()=>[]); txt = r[0] && r[0].rawValue; }
        else { c.width = v.videoWidth; c.height = v.videoHeight; ctx.drawImage(v,0,0); const img = ctx.getImageData(0,0,c.width,c.height); const r = window.jsQR(img.data, c.width, c.height, {inversionAttempts:"dontInvert"}); txt = r && r.data; }
        if(txt){ const ref = String(txt).replace(/^VDCMD:/,"").trim().toUpperCase(); if(REF_OK(ref)){ stopScanner(); v.hidden = true; btn.hidden = false; btn.textContent = "📷 Scanner un autre client"; checkRef(ref); return; } }
      }
      setTimeout(tick, 250);
    };
    tick();
  }catch(err){ toast("Caméra indisponible : autorisez l'accès ou saisissez la référence"); }
}
async function checkRef(ref){
  const out = $("#vResult");
  if(!REF_OK(ref)){ out.innerHTML = `<div class="card verdict bad"><b>Référence invalide</b><br><span class="muted">Format attendu : VD-XXXXXXXX-XXXX</span></div>`; return; }
  out.innerHTML = `<div class="card verdict"><b>Vérification de ${esc(ref)}…</b></div>`;
  const st = await payStatus(ref);
  const ret = getRetires()[ref];
  if(st==="PAID"){
    out.innerHTML = `<div class="card verdict ok"><div class="big">✅ PAYÉE</div><b>${esc(ref)}</b>
      ${ret?`<p class="warn">⚠️ Déjà marquée comme retirée le ${esc(new Date(ret).toLocaleString("fr-FR"))}. Vérifiez avant de remettre quoi que ce soit.</p>`:`<p class="muted">Paiement confirmé par SumUp. Remettez la commande portant cette référence.</p>`}
      <button class="btn block" id="vDone" ${ret?"disabled":""}>Marquer comme retirée</button></div>`;
    const b = $("#vDone"); if(b) b.addEventListener("click", ()=>{ const r=getRetires(); r[ref]=Date.now(); try{ localStorage.setItem("vd_retires", JSON.stringify(r)); }catch(_){} b.disabled=true; b.textContent="Retrait enregistré ✔"; });
  } else {
    const label = st==="PENDING" ? "⏳ PAIEMENT EN ATTENTE" : st==="FAILED"||st==="EXPIRED" ? "❌ NON PAYÉE" : "❌ INCONNUE";
    out.innerHTML = `<div class="card verdict bad"><div class="big">${label}</div><b>${esc(ref)}</b><p class="muted">Ne remettez pas la marchandise. Vérifiez dans votre appli SumUp ou demandez au client de payer au comptoir.</p></div>`;
  }
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

document.addEventListener("error", e=>{ const t=e.target; if(t && t.tagName==="IMG" && t.dataset.ico){ t.replaceWith(Object.assign(document.createElement("span"),{className:"ico",textContent:t.dataset.ico})); } }, true);
(async()=>{ const pend=getPending(); if(pend && !location.search && location.hash!=="#panier"){ const st=await payStatus(pend.ref); if(st==="PAID"){ saveOrder(pend); clearPending(); store.set({}); badge(); toast("Paiement confirmé : votre QR code de retrait est dans le panier"); } else if(st==="FAILED"||st==="EXPIRED"){ clearPending(); } } })();
if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
