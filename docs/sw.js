const CACHE="doodle-outpost-v6";
const FILES=["./","index.html","css/style.css","js/data.js","js/audio.js","js/net.js","js/tasks.js","js/game.js","js/ui.js","js/mission-ui.js","manifest.json","assets/logo.png","assets/icons/icon-192.png","assets/icons/icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
