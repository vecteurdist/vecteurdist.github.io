const V="vd-v4"; const CORE=["./","index.html","app.css?v=3","app.js?v=3","config.js?v=3","catalog.json","manifest.webmanifest","icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url); if(e.request.method!=="GET") return;
  if(u.origin===location.origin){ e.respondWith(fetch(e.request).then(r=>{ if(r.ok && !u.search){ const cp=r.clone(); caches.open(V).then(c=>c.put(e.request,cp)); } return r;}).catch(()=>caches.match(e.request))); }
});
