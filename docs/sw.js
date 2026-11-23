const CACHE="doodle-outpost-v4";
const FILES=["./","index.html","css/style.css","js/data.js","js/audio.js","js/net.js","js/tasks.js","js/game.js","js/ui.js","js/mission-ui.js","manifest.json","assets/logo.png","assets/icons/icon-192.png","assets/icons/icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith((async()=>{try{const r=await fetch(e.request);if(e.request.mode==="navigate"&&r.ok){const h=await r.text();return new Response(h.replace(/<\/body>/i,'<script src="js/mission-ui.js"></script></body>'),{status:r.status,statusText:r.statusText,headers:r.headers});}return r;}catch(_){return caches.match(e.request);}})());});
